import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { dbSource, getSql } from "@/lib/db";
import { ADMIN_EMAIL, CALL_FEE_EUR } from "@/lib/circle/content";

type Row = Record<string, unknown>;

export type Show = {
  id: number;
  slug: string;
  kind: "meet" | "concert";
  title: string;
  city: string;
  venue: string;
  startsAt: string;
  timeKnown: boolean;
  status: string;
  note: string | null;
};

export type Profile = {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "fan";
  city: string | null;
};

export type Membership = {
  id: number;
  fullName: string;
  city: string;
  tier: string;
  story: string | null;
  status: string;
  cardNumber: string | null;
  createdAt: string;
  email?: string | null;
};

export type MeetRequest = {
  id: number;
  fullName: string;
  guests: number;
  note: string | null;
  status: string;
  createdAt: string;
  email: string | null;
  eventId: number;
  city: string;
  eventTitle: string;
  startsAt: string;
};

export type CallRequest = {
  id: number;
  reason: string;
  amountEur: number;
  status: string;
  paidAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  email: string | null;
  name: string | null;
};

export type Serenata = {
  id: number;
  songTitle: string;
  dedicatee: string;
  note: string | null;
  city: string | null;
  status: string;
  createdAt: string;
  email: string | null;
  name: string | null;
  eventId: number | null;
  showCity: string | null;
  startsAt: string | null;
};

export type HatRequest = {
  id: number;
  hatColor: string;
  inscription: string;
  note: string | null;
  status: string;
  createdAt: string;
  email: string | null;
  name: string | null;
  eventId: number;
  city: string;
  venue: string;
  startsAt: string;
};

export type GoingMark = {
  id: number;
  eventId: number;
  city: string;
  venue: string;
  startsAt: string;
};

export type Mine = {
  membership: Membership | null;
  meets: MeetRequest[];
  votes: { id: number; title: string }[];
  chapter: { id: number; city: string; country: string } | null;
  posts: { id: number; body: string; hidden: boolean; createdAt: string }[];
  calls: CallRequest[];
  serenatas: Serenata[];
  hats: HatRequest[];
  going: GoingMark[];
};

function num(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function flag(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "t" || v === "true" || v === "1";
  return false;
}

function stamp(v: unknown) {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

function text(v: unknown) {
  return v == null ? "" : String(v);
}

function textOrNull(v: unknown) {
  if (v == null || v === "") return null;
  return String(v);
}

function mapShow(row: Row): Show {
  return {
    id: num(row.id),
    slug: text(row.slug),
    kind: row.kind === "meet" ? "meet" : "concert",
    title: text(row.title),
    city: text(row.city),
    venue: text(row.venue),
    startsAt: stamp(row.starts_at),
    timeKnown: flag(row.time_known),
    status: text(row.status),
    note: textOrNull(row.note),
  };
}

function mapSerenata(row: Row): Serenata {
  return {
    id: num(row.id),
    songTitle: text(row.song_title),
    dedicatee: text(row.dedicatee),
    note: textOrNull(row.note),
    city: textOrNull(row.city),
    status: text(row.status) || "pending",
    createdAt: stamp(row.created_at),
    email: textOrNull(row.email),
    name: textOrNull(row.name),
    eventId: row.event_id == null ? null : num(row.event_id),
    showCity: textOrNull(row.show_city),
    startsAt: row.starts_at ? stamp(row.starts_at) : null,
  };
}

function mapHat(row: Row): HatRequest {
  return {
    id: num(row.id),
    hatColor: text(row.hat_color),
    inscription: text(row.inscription),
    note: textOrNull(row.note),
    status: text(row.status) || "pending",
    createdAt: stamp(row.created_at),
    email: textOrNull(row.email),
    name: textOrNull(row.name),
    eventId: num(row.event_id),
    city: text(row.city),
    venue: text(row.venue),
    startsAt: stamp(row.starts_at),
  };
}

function mapCall(row: Row): CallRequest {
  return {
    id: num(row.id),
    reason: text(row.reason),
    amountEur: num(row.amount_eur) || CALL_FEE_EUR,
    status: text(row.status) || "unpaid",
    paidAt: row.paid_at ? stamp(row.paid_at) : null,
    reviewedAt: row.reviewed_at ? stamp(row.reviewed_at) : null,
    createdAt: stamp(row.created_at),
    email: textOrNull(row.email),
    name: textOrNull(row.name),
  };
}

function parse<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } }, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) throw new Error("Check the form and try again.");
  return res.data;
}

function localIso(input: string) {
  const trimmed = input.trim();
  const withZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed) ? trimmed : `${trimmed}-06:00`;
  const ms = Date.parse(withZone);
  if (!Number.isFinite(ms)) throw new Error("That date does not parse.");
  return new Date(ms).toISOString();
}

async function actor(userId: string) {
  const row = (
    await (
      await getSql()
    )<Row>`
    select u.email, u.name, p.city
    from "user" u
    left join profiles p on p.user_id = u.id
    where u.id = ${userId}
  `
  )[0];
  if (!row) return null;
  const role = text(row.email).toLowerCase() === ADMIN_EMAIL ? "admin" : "fan";
  return {
    email: text(row.email),
    name: text(row.name),
    city: textOrNull(row.city),
    role,
  } as const;
}

async function requireAdmin(userId: string) {
  const who = await actor(userId);
  if (!who || who.role !== "admin") throw new Error("Only the Lazarev desk can open this.");
  return who;
}

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile> => {
    const who = await actor(context.userId);
    if (!who) throw new Error("Sign in again.");
    await (
      await getSql()
    )`
      insert into profiles (user_id, display_name, role)
      values (${context.userId}, ${who.name}, ${who.role})
      on conflict (user_id) do update set role = excluded.role
    `;
    return {
      userId: context.userId,
      email: who.email,
      name: who.name,
      role: who.role,
      city: who.city,
    };
  });

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const upcoming = await sql<Row>`
    select id, slug, kind, title, city, venue, starts_at, time_known, status, note
    from events
    where kind = 'concert' and starts_at >= now()
    order by starts_at asc
    limit 4
  `;
  const counts = await sql<Row>`
    select
      (select count(*)::int from events where kind = 'concert' and starts_at >= now()) as shows,
      (select count(*)::int from events where kind = 'meet' and status = 'open' and starts_at >= now()) as meets
  `;
  const news = await sql<Row>`
    select slug, title, excerpt, published_at from news order by published_at desc limit 3
  `;
  const leaders = await sql<Row>`
    select s.id, s.title, (select count(*)::int from votes v where v.song_id = s.id) as votes
    from songs s
    order by votes desc, s.title asc
    limit 3
  `;
  const dedications = await sql<Row>`
    select id, song_title, dedicatee, city, status, created_at
    from serenata_requests
    where status = 'approved'
    order by created_at desc
    limit 3
  `;
  return {
    next: upcoming[0] ? mapShow(upcoming[0]) : null,
    upcoming: upcoming.map(mapShow),
    shows: num(counts[0]?.shows),
    meets: num(counts[0]?.meets),
    news: news.map((row) => ({
      slug: text(row.slug),
      title: text(row.title),
      excerpt: text(row.excerpt),
      publishedAt: stamp(row.published_at),
    })),
    leaders: leaders.map((row) => ({
      id: num(row.id),
      title: text(row.title),
      votes: num(row.votes),
    })),
    serenatas: dedications.map(mapSerenata),
  };
});

export const listEvents = createServerFn({ method: "GET" })
  .validator((kind: unknown) => (kind === "meet" ? "meet" : "concert"))
  .handler(async ({ data: kind }) => {
    return (
      await (
        await getSql()
      )<Row>`
      select id, slug, kind, title, city, venue, starts_at, time_known, status, note
      from events
      where kind = ${kind}
      order by starts_at asc
    `
    ).map(mapShow);
  });

export const listSongs = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select s.id, s.title, s.subtitle, s.year, s.album,
      (select count(*)::int from votes v where v.song_id = s.id) as votes
    from songs s
    order by votes desc, s.title asc
  `
  ).map((row) => ({
    id: num(row.id),
    title: text(row.title),
    subtitle: textOrNull(row.subtitle),
    year: row.year == null ? null : num(row.year),
    album: textOrNull(row.album),
    votes: num(row.votes),
  }));
});

export const myVoteIds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return (
      await (
        await getSql()
      )<Row>`
      select song_id from votes where user_id = ${context.userId}
    `
    ).map((row) => num(row.song_id));
  });

export const toggleVote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error("Unknown song.");
    return id as number;
  })
  .handler(async ({ context, data: songId }) => {
    const sql = await getSql();
    if (
      (
        await sql<Row>`
      select song_id from votes where user_id = ${context.userId} and song_id = ${songId}
    `
      ).length
    ) {
      await sql`delete from votes where user_id = ${context.userId} and song_id = ${songId}`;
      return { ok: true };
    }
    if (
      num(
        (
          await sql<Row>`
      select count(*)::int as n from votes where user_id = ${context.userId}
    `
        )[0]?.n,
      ) >= 3
    ) {
      throw new Error("Three songs is the ballot. Remove one to add another.");
    }
    if (!(await sql<Row>`select id from songs where id = ${songId}`).length) throw new Error("Unknown song.");
    await sql`insert into votes (user_id, song_id) values (${context.userId}, ${songId})`;
    return { ok: true };
  });

export const listWall = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select id, author_name, body, city, pinned, created_at
    from wall_posts
    where hidden = false
    order by pinned desc, created_at desc
    limit 80
  `
  ).map((row) => ({
    id: num(row.id),
    authorName: text(row.author_name),
    body: text(row.body),
    city: textOrNull(row.city),
    pinned: flag(row.pinned),
    hidden: false,
    createdAt: stamp(row.created_at),
  }));
});

const wallInput = z.object({
  body: z.string().trim().min(8).max(400),
  city: z.string().trim().max(80).optional(),
});

export const postWall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(wallInput, input))
  .handler(async ({ context, data }) => {
    const who = await actor(context.userId);
    if (!who) throw new Error("Sign in again.");
    const sql = await getSql();
    if (
      num(
        (
          await sql<Row>`
      select count(*)::int as n from wall_posts where user_id = ${context.userId}
    `
        )[0]?.n,
      ) >= 5
    ) {
      throw new Error("Five notes is the limit.");
    }
    const city = data.city?.trim() ? data.city.trim() : who.city;
    await sql`
      insert into wall_posts (user_id, author_name, body, city)
      values (${context.userId}, ${who.name}, ${data.body}, ${city})
    `;
    return { ok: true };
  });

export const listChapters = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select id, city, country, blurb, member_count from chapters order by city asc
  `
  ).map((row) => ({
    id: num(row.id),
    city: text(row.city),
    country: text(row.country),
    blurb: text(row.blurb),
    memberCount: num(row.member_count),
  }));
});

async function recountChapters() {
  await (
    await getSql()
  )`
    update chapters c
    set member_count = (
      select count(*)::int from chapter_members m where m.chapter_id = c.id
    )
  `;
}

export const joinChapter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error("Unknown chapter.");
    return id as number;
  })
  .handler(async ({ context, data: chapterId }) => {
    const sql = await getSql();
    const found = await sql<Row>`select id, city from chapters where id = ${chapterId}`;
    if (!found.length) throw new Error("Unknown chapter.");
    const card = (
      await sql<Row>`
      select tier, status from memberships where user_id = ${context.userId}
    `
    )[0];
    if (!card || card.status !== "approved" || (card.tier !== "pit" && card.tier !== "stage")) {
      throw new Error("City chapters come with an approved Gold or VIP card.");
    }
    await sql`
      insert into chapter_members (user_id, chapter_id)
      values (${context.userId}, ${chapterId})
      on conflict (user_id) do update set chapter_id = excluded.chapter_id, joined_at = now()
    `;
    await sql`update profiles set city = ${found[0].city} where user_id = ${context.userId}`;
    await recountChapters();
    return { ok: true };
  });

export const leaveChapter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await (await getSql())`delete from chapter_members where user_id = ${context.userId}`;
    await recountChapters();
    return { ok: true };
  });

export const listNews = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select slug, title, excerpt, published_at from news order by published_at desc
  `
  ).map((row) => ({
    slug: text(row.slug),
    title: text(row.title),
    excerpt: text(row.excerpt),
    publishedAt: stamp(row.published_at),
  }));
});

export const getNews = createServerFn({ method: "GET" })
  .validator((slug: unknown) => text(slug).trim())
  .handler(async ({ data: slug }) => {
    const row = (
      await (
        await getSql()
      )<Row>`
      select slug, title, excerpt, body, published_at from news where slug = ${slug}
    `
    )[0];
    if (!row) throw new Error("That note is not on the board.");
    return {
      slug: text(row.slug),
      title: text(row.title),
      excerpt: text(row.excerpt),
      body: text(row.body),
      publishedAt: stamp(row.published_at),
    };
  });

const messageInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Use a real email."),
  topic: z.enum(["Membership", "Meet window", "Tour date", "Press", "Other"]),
  body: z.string().trim().min(8).max(2000),
});

export const sendMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) => parse(messageInput, input))
  .handler(async ({ data }) => {
    await (
      await getSql()
    )`
      insert into messages (name, email, topic, body)
      values (${data.name}, ${data.email}, ${data.topic}, ${data.body})
    `;
    return { ok: true };
  });

const membershipInput = z.object({
  fullName: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  tier: z.enum(["aisle", "pit", "stage"]),
  story: z.string().trim().max(600).optional(),
});

export const applyMembership = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(membershipInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<Row>`
      select status from memberships where user_id = ${context.userId}
    `;
    if (existing[0]?.status === "approved") throw new Error("Your card is already issued.");
    const story = data.story?.trim() ? data.story.trim() : null;
    const rows = existing.length
      ? await sql<Row>`
          update memberships
          set full_name = ${data.fullName}, city = ${data.city}, tier = ${data.tier},
              story = ${story}, status = 'pending', card_number = null, reviewed_at = null
          where user_id = ${context.userId}
          returning id
        `
      : await sql<Row>`
          insert into memberships (user_id, full_name, city, tier, story)
          values (${context.userId}, ${data.fullName}, ${data.city}, ${data.tier}, ${story})
          returning id
        `;
    await sql`update profiles set city = ${data.city} where user_id = ${context.userId}`;
    return { ok: true, id: num(rows[0]?.id) };
  });

const meetInput = z.object({
  eventId: z.number().int().positive(),
  fullName: z.string().trim().min(2).max(80),
  guests: z.number().int().min(1).max(2),
  note: z.string().trim().max(400).optional(),
});

export const applyMeet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(meetInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const event = (
      await sql<Row>`
      select status, starts_at from events where id = ${data.eventId} and kind = 'meet'
    `
    )[0];
    if (!event) throw new Error("That window is not on the board.");
    if (event.status !== "open") throw new Error("That window is closed.");
    if (new Date(stamp(event.starts_at)).getTime() < Date.now()) throw new Error("That window has already passed.");
    const card = (
      await sql<Row>`
      select tier, status from memberships where user_id = ${context.userId}
    `
    )[0];
    if (!card || card.status !== "approved" || (card.tier !== "pit" && card.tier !== "stage")) {
      throw new Error("Meet windows come with an approved Gold or VIP card.");
    }
    const note = data.note?.trim() ? data.note.trim() : null;
    const existing = await sql<Row>`
      select status from meet_requests where user_id = ${context.userId} and event_id = ${data.eventId}
    `;
    if (existing[0]?.status === "approved") throw new Error("You are already confirmed for this window.");
    if (existing.length) {
      return {
        ok: true,
        id: num(
          (
            await sql<Row>`
        update meet_requests
        set full_name = ${data.fullName}, guests = ${data.guests}, note = ${note}, status = 'pending'
        where user_id = ${context.userId} and event_id = ${data.eventId}
        returning id
      `
          )[0]?.id,
        ),
      };
    }
    return {
      ok: true,
      id: num(
        (
          await sql<Row>`
      insert into meet_requests (user_id, event_id, full_name, guests, note)
      values (${context.userId}, ${data.eventId}, ${data.fullName}, ${data.guests}, ${note})
      returning id
    `
        )[0]?.id,
      ),
    };
  });

const callInput = z.object({
  reason: z.string().trim().min(8).max(600),
});

export const requestCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(callInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const open = await sql<Row>`
      select id, status from call_requests
      where user_id = ${context.userId} and status in ('unpaid', 'paid', 'approved')
      order by created_at desc
      limit 1
    `;
    const current = open[0];
    if (current?.status === "unpaid") {
      await sql`
        update call_requests set reason = ${data.reason}
        where id = ${current.id} and user_id = ${context.userId}
      `;
      return { id: num(current.id), status: "unpaid" as const };
    }
    if (current?.status === "paid") {
      throw new Error("A call request is already waiting. The €650 is recorded, and the desk has not answered yet.");
    }
    if (current?.status === "approved") {
      throw new Error("A call is already approved.");
    }
    const rows = await sql<Row>`
      insert into call_requests (user_id, reason, amount_eur, status)
      values (${context.userId}, ${data.reason}, ${CALL_FEE_EUR}, 'unpaid')
      returning id
    `;
    return { id: num(rows[0]?.id), status: "unpaid" as const };
  });

const payInput = z.object({ id: z.number().int().positive() });

export const payCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(payInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const row = (
      await sql<Row>`
      select id, status from call_requests where id = ${data.id} and user_id = ${context.userId}
    `
    )[0];
    if (!row) throw new Error("That call request is not yours.");
    if (row.status === "paid" || row.status === "approved") return { ok: true, status: text(row.status) };
    if (row.status !== "unpaid") throw new Error("This request is closed.");
    await sql`
      update call_requests
      set status = 'paid', paid_at = now(), amount_eur = ${CALL_FEE_EUR}
      where id = ${data.id} and user_id = ${context.userId} and status = 'unpaid'
    `;
    return { ok: true, status: "paid" as const };
  });

export const getMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Mine> => {
    const sql = await getSql();
    const cards = await sql<Row>`
      select id, full_name, city, tier, story, status, card_number, created_at
      from memberships where user_id = ${context.userId}
    `;
    const meets = await sql<Row>`
      select r.id, r.full_name, r.guests, r.note, r.status, r.created_at, r.event_id,
             e.city, e.title as event_title, e.starts_at
      from meet_requests r
      join events e on e.id = r.event_id
      where r.user_id = ${context.userId}
      order by e.starts_at asc
    `;
    const votes = await sql<Row>`
      select s.id, s.title
      from votes v
      join songs s on s.id = v.song_id
      where v.user_id = ${context.userId}
      order by s.title asc
    `;
    const chapters = await sql<Row>`
      select c.id, c.city, c.country
      from chapter_members m
      join chapters c on c.id = m.chapter_id
      where m.user_id = ${context.userId}
    `;
    const posts = await sql<Row>`
      select id, body, hidden, created_at
      from wall_posts
      where user_id = ${context.userId}
      order by created_at desc
    `;
    const calls = await sql<Row>`
      select id, reason, amount_eur, status, paid_at, reviewed_at, created_at
      from call_requests
      where user_id = ${context.userId}
      order by created_at desc
    `;
    const serenatas = await sql<Row>`
      select s.id, s.song_title, s.dedicatee, s.note, s.city, s.status, s.created_at, s.event_id,
             e.city as show_city, e.starts_at
      from serenata_requests s
      left join events e on e.id = s.event_id
      where s.user_id = ${context.userId}
      order by s.created_at desc
    `;
    const hats = await sql<Row>`
      select h.id, h.hat_color, h.inscription, h.note, h.status, h.created_at, h.event_id,
             e.city, e.venue, e.starts_at
      from hat_requests h
      join events e on e.id = h.event_id
      where h.user_id = ${context.userId}
      order by e.starts_at asc
    `;
    const going = await sql<Row>`
      select a.id, a.event_id, e.city, e.venue, e.starts_at
      from show_attendance a
      join events e on e.id = a.event_id
      where a.user_id = ${context.userId}
      order by e.starts_at asc
    `;
    const card = cards[0];
    const chapter = chapters[0];
    return {
      membership: card
        ? {
            id: num(card.id),
            fullName: text(card.full_name),
            city: text(card.city),
            tier: text(card.tier),
            story: textOrNull(card.story),
            status: text(card.status),
            cardNumber: textOrNull(card.card_number),
            createdAt: stamp(card.created_at),
          }
        : null,
      meets: meets.map((row) => ({
        id: num(row.id),
        fullName: text(row.full_name),
        guests: num(row.guests),
        note: textOrNull(row.note),
        status: text(row.status),
        createdAt: stamp(row.created_at),
        email: null,
        eventId: num(row.event_id),
        city: text(row.city),
        eventTitle: text(row.event_title),
        startsAt: stamp(row.starts_at),
      })),
      votes: votes.map((row) => ({ id: num(row.id), title: text(row.title) })),
      chapter: chapter
        ? { id: num(chapter.id), city: text(chapter.city), country: text(chapter.country) }
        : null,
      posts: posts.map((row) => ({
        id: num(row.id),
        body: text(row.body),
        hidden: flag(row.hidden),
        createdAt: stamp(row.created_at),
      })),
      calls: calls.map(mapCall),
      serenatas: serenatas.map(mapSerenata),
      hats: hats.map(mapHat),
      going: going.map((row) => ({
        id: num(row.id),
        eventId: num(row.event_id),
        city: text(row.city),
        venue: text(row.venue),
        startsAt: stamp(row.starts_at),
      })),
    };
  });

const reviewInput = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
});

export const reviewMembership = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const card = `CL-${new Date().getFullYear()}-${String(data.id).padStart(4, "0")}`;
    await sql`
      update memberships
      set status = ${data.status},
          card_number = case when ${data.status} = 'approved' then coalesce(card_number, ${card}) else null end,
          reviewed_at = now()
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const reviewMeet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await (await getSql())`
      update meet_requests set status = ${data.status} where id = ${data.id}
    `;
    return { ok: true };
  });

export const reviewCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const row = (await sql<Row>`select status from call_requests where id = ${data.id}`)[0];
    if (!row) throw new Error("That call request is not on the desk.");
    if (data.status === "approved" && row.status !== "paid") {
      throw new Error("The €650 has not been paid. Approve only after payment.");
    }
    await sql`
      update call_requests
      set status = ${data.status}, reviewed_at = now()
      where id = ${data.id}
    `;
    return { ok: true };
  });

const eventInput = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  venue: z.string().trim().min(2).max(120),
  startsAt: z.string().trim().min(8).max(40),
  timeKnown: z.boolean(),
  status: z.enum(["on_sale", "last", "sold_out", "open", "closed"]),
  kind: z.enum(["concert", "meet"]),
  note: z.string().trim().max(400).optional(),
});

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(eventInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const starts = localIso(data.startsAt);
    const note = data.note?.trim() ? data.note.trim() : null;
    if (data.id) {
      await sql`
        update events
        set title = ${data.title}, city = ${data.city}, venue = ${data.venue},
            starts_at = ${starts}, time_known = ${data.timeKnown}, status = ${data.status},
            kind = ${data.kind}, note = ${note}
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into events (title, city, venue, starts_at, time_known, status, kind, note)
        values (${data.title}, ${data.city}, ${data.venue}, ${starts}, ${data.timeKnown}, ${data.status}, ${data.kind}, ${note})
      `;
    }
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error("Unknown date.");
    return id as number;
  })
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    await (await getSql())`delete from events where id = ${id}`;
    return { ok: true };
  });

const moderateInput = z.object({
  id: z.number().int().positive(),
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const moderateWall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(moderateInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    if (typeof data.pinned === "boolean") await sql`update wall_posts set pinned = ${data.pinned} where id = ${data.id}`;
    if (typeof data.hidden === "boolean") await sql`update wall_posts set hidden = ${data.hidden} where id = ${data.id}`;
    return { ok: true };
  });

export const markMail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error("Unknown message.");
    return id as number;
  })
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    await (await getSql())`update messages set seen = true where id = ${id}`;
    return { ok: true };
  });

const newsInput = z.object({
  title: z.string().trim().min(4).max(140),
  excerpt: z.string().trim().min(8).max(220),
  body: z.string().trim().min(20).max(5000),
});

export const createNews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(newsInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "note"}-${Math.floor(Math.random() * 900 + 100)}`;
    await (
      await getSql()
    )`
      insert into news (slug, title, excerpt, body)
      values (${slug}, ${data.title}, ${data.excerpt}, ${data.body})
    `;
    return { ok: true };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((slug: unknown) => text(slug).trim())
  .handler(async ({ context, data: slug }) => {
    await requireAdmin(context.userId);
    await (await getSql())`delete from news where slug = ${slug}`;
    return { ok: true };
  });

export const adminBundle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const stats = await sql<Row>`
      select
        (select count(*)::int from memberships where status = 'pending') as pending_cards,
        (select count(*)::int from meet_requests where status = 'pending') as pending_meets,
        (select count(*)::int from call_requests where status = 'paid') as pending_calls,
        (select count(*)::int from serenata_requests where status = 'pending') as pending_serenatas,
        (select count(*)::int from hat_requests where status = 'pending') as pending_hats,
        (select count(*)::int from messages where seen = false) as unread,
        (select count(*)::int from profiles) as accounts
    `;
    const cards = await sql<Row>`
      select m.id, m.full_name, m.city, m.tier, m.story, m.status, m.card_number, m.created_at, u.email
      from memberships m
      left join "user" u on u.id = m.user_id
      order by case m.tier when 'stage' then 0 when 'pit' then 1 else 2 end, m.created_at asc
    `;
    const meets = await sql<Row>`
      select r.id, r.full_name, r.guests, r.note, r.status, r.created_at, r.event_id, u.email,
             e.city, e.title as event_title, e.starts_at
      from meet_requests r
      left join "user" u on u.id = r.user_id
      join events e on e.id = r.event_id
      order by r.created_at asc
    `;
    const calls = await sql<Row>`
      select c.id, c.reason, c.amount_eur, c.status, c.paid_at, c.reviewed_at, c.created_at, u.email, u.name
      from call_requests c
      left join "user" u on u.id = c.user_id
      order by case c.status when 'paid' then 0 when 'unpaid' then 1 when 'approved' then 2 else 3 end, c.created_at asc
    `;
    const serenatas = await sql<Row>`
      select s.id, s.song_title, s.dedicatee, s.note, s.city, s.status, s.created_at, s.event_id,
             e.city as show_city, e.starts_at, u.email, u.name
      from serenata_requests s
      left join events e on e.id = s.event_id
      left join "user" u on u.id = s.user_id
      order by case s.status when 'pending' then 0 when 'approved' then 1 else 2 end, s.created_at asc
    `;
    const hats = await sql<Row>`
      select h.id, h.hat_color, h.inscription, h.note, h.status, h.created_at, h.event_id,
             e.city, e.venue, e.starts_at, u.email, u.name,
             m.tier
      from hat_requests h
      join events e on e.id = h.event_id
      left join "user" u on u.id = h.user_id
      left join memberships m on m.user_id = h.user_id
      order by case h.status when 'pending' then 0 when 'approved' then 1 else 2 end,
               case m.tier when 'stage' then 0 when 'pit' then 1 else 2 end,
               h.created_at asc
    `;
    const events = await sql<Row>`
      select id, slug, kind, title, city, venue, starts_at, time_known, status, note
      from events order by starts_at asc
    `;
    const wall = await sql<Row>`
      select id, author_name, body, city, pinned, hidden, created_at
      from wall_posts order by created_at desc limit 100
    `;
    const mail = await sql<Row>`
      select id, name, email, topic, body, seen, created_at
      from messages order by created_at desc limit 100
    `;
    const notes = await sql<Row>`
      select slug, title, excerpt, published_at from news order by published_at desc
    `;
    const leaders = await sql<Row>`
      select s.id, s.title, (select count(*)::int from votes v where v.song_id = s.id) as votes
      from songs s order by votes desc, s.title asc
    `;
    const stat = stats[0];
    return {
      stats: {
        pendingCards: num(stat?.pending_cards),
        pendingMeets: num(stat?.pending_meets),
        pendingCalls: num(stat?.pending_calls),
        pendingSerenatas: num(stat?.pending_serenatas),
        pendingHats: num(stat?.pending_hats),
        unread: num(stat?.unread),
        accounts: num(stat?.accounts),
        store: dbSource === "neon" ? "permanent" : "temporary",
      },
      memberships: cards.map((row) => ({
        id: num(row.id),
        fullName: text(row.full_name),
        city: text(row.city),
        tier: text(row.tier),
        story: textOrNull(row.story),
        status: text(row.status),
        cardNumber: textOrNull(row.card_number),
        createdAt: stamp(row.created_at),
        email: textOrNull(row.email),
      })),
      meets: meets.map((row) => ({
        id: num(row.id),
        fullName: text(row.full_name),
        guests: num(row.guests),
        note: textOrNull(row.note),
        status: text(row.status),
        createdAt: stamp(row.created_at),
        email: textOrNull(row.email),
        eventId: num(row.event_id),
        city: text(row.city),
        eventTitle: text(row.event_title),
        startsAt: stamp(row.starts_at),
      })),
      calls: calls.map(mapCall),
      serenatas: serenatas.map(mapSerenata),
      hats: hats.map(mapHat),
      events: events.map(mapShow),
      wall: wall.map((row) => ({
        id: num(row.id),
        authorName: text(row.author_name),
        body: text(row.body),
        city: textOrNull(row.city),
        pinned: flag(row.pinned),
        hidden: flag(row.hidden),
        createdAt: stamp(row.created_at),
      })),
      mail: mail.map((row) => ({
        id: num(row.id),
        name: text(row.name),
        email: text(row.email),
        topic: text(row.topic),
        body: text(row.body),
        seen: flag(row.seen),
        createdAt: stamp(row.created_at),
      })),
      news: notes.map((row) => ({
        slug: text(row.slug),
        title: text(row.title),
        excerpt: text(row.excerpt),
        publishedAt: stamp(row.published_at),
      })),
      songs: leaders.map((row) => ({
        id: num(row.id),
        title: text(row.title),
        votes: num(row.votes),
      })),
    };
  });

async function cardOf(userId: string) {
  const row = (
    await (
      await getSql()
    )<Row>`
    select tier, status, full_name, city from memberships where user_id = ${userId}
  `
  )[0];
  return row ?? null;
}

function approvedCard(row: Row | null, gold = false) {
  if (!row || text(row.status) !== "approved") {
    throw new Error("This opens after your membership card is approved.");
  }
  if (gold && row.tier !== "pit" && row.tier !== "stage") {
    throw new Error("This is included with an approved Gold or VIP card.");
  }
  return row;
}

export const listPublicSerenatas = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select s.id, s.song_title, s.dedicatee, s.note, s.city, s.status, s.created_at, s.event_id,
           e.city as show_city, e.starts_at
    from serenata_requests s
    left join events e on e.id = s.event_id
    where s.status = 'approved'
    order by s.created_at desc
    limit 40
  `
  ).map(mapSerenata);
});

const serenataInput = z.object({
  eventId: z.number().int().positive().nullable(),
  songTitle: z.string().trim().min(2).max(80),
  dedicatee: z.string().trim().min(2).max(80),
  note: z.string().trim().min(8).max(400),
});

export const requestSerenata = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(serenataInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const card = approvedCard(await cardOf(context.userId));
    if (data.eventId) {
      const show = (
        await sql<Row>`
        select id from events where id = ${data.eventId} and kind = 'concert' and starts_at >= now()
      `
      )[0];
      if (!show) throw new Error("Pick a show that is still ahead.");
    }
    const open = await sql<Row>`
      select count(*)::int as n from serenata_requests
      where user_id = ${context.userId} and status in ('pending', 'approved')
    `;
    if (num(open[0]?.n) >= 3) throw new Error("Three serenatas on file is the limit. Wait for a decision, or use one you already sent.");
    const rows = await sql<Row>`
      insert into serenata_requests (user_id, event_id, song_title, dedicatee, note, city)
      values (${context.userId}, ${data.eventId}, ${data.songTitle}, ${data.dedicatee}, ${data.note}, ${textOrNull(card.city)})
      returning id
    `;
    return { id: num(rows[0]?.id) };
  });

export const reviewSerenata = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await (await getSql())`
      update serenata_requests set status = ${data.status} where id = ${data.id}
    `;
    return { ok: true };
  });

const hatInput = z.object({
  eventId: z.number().int().positive(),
  hatColor: z.string().trim().min(2).max(40),
  inscription: z.string().trim().min(2).max(40),
  note: z.string().trim().max(300).optional(),
});

export const requestHat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(hatInput, input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    approvedCard(await cardOf(context.userId), true);
    const show = (
      await sql<Row>`
      select id from events where id = ${data.eventId} and kind = 'concert' and starts_at >= now()
    `
    )[0];
    if (!show) throw new Error("Pick a show that is still ahead.");
    const existing = (
      await sql<Row>`
      select id, status from hat_requests where user_id = ${context.userId} and event_id = ${data.eventId}
    `
    )[0];
    const note = data.note?.trim() ? data.note.trim() : null;
    if (existing && (existing.status === "pending" || existing.status === "approved")) {
      throw new Error("You already have a hat on this show.");
    }
    if (existing) {
      await sql`
        update hat_requests
        set hat_color = ${data.hatColor}, inscription = ${data.inscription}, note = ${note}, status = 'pending'
        where id = ${existing.id} and user_id = ${context.userId}
      `;
      return { id: num(existing.id) };
    }
    const rows = await sql<Row>`
      insert into hat_requests (user_id, event_id, hat_color, inscription, note)
      values (${context.userId}, ${data.eventId}, ${data.hatColor}, ${data.inscription}, ${note})
      returning id
    `;
    return { id: num(rows[0]?.id) };
  });

export const reviewHat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(reviewInput, input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await (await getSql())`
      update hat_requests set status = ${data.status} where id = ${data.id}
    `;
    return { ok: true };
  });

export const attendanceCounts = createServerFn({ method: "GET" }).handler(async () => {
  return (
    await (
      await getSql()
    )<Row>`
    select event_id, count(*)::int as fans from show_attendance group by event_id
  `
  ).map((row) => ({ eventId: num(row.event_id), fans: num(row.fans) }));
});

export const toggleGoing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error("Unknown show.");
    return id as number;
  })
  .handler(async ({ context, data: eventId }) => {
    const sql = await getSql();
    approvedCard(await cardOf(context.userId));
    const show = (
      await sql<Row>`
      select id from events where id = ${eventId} and kind = 'concert'
    `
    )[0];
    if (!show) throw new Error("Unknown show.");
    const existing = (
      await sql<Row>`
      select id from show_attendance where user_id = ${context.userId} and event_id = ${eventId}
    `
    )[0];
    if (existing) {
      await sql`delete from show_attendance where id = ${existing.id} and user_id = ${context.userId}`;
      return { going: false as const };
    }
    await sql`
      insert into show_attendance (user_id, event_id) values (${context.userId}, ${eventId})
    `;
    return { going: true as const };
  });

