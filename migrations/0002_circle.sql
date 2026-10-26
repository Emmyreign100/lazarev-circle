-- Lazarev Circle: tour board, membership, meets, ballot, wall, chapters, desk mail.

create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  city text,
  role text not null default 'fan' check (role in ('fan', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id serial primary key,
  slug text unique,
  kind text not null check (kind in ('concert', 'meet')),
  title text not null,
  city text not null,
  venue text not null,
  starts_at timestamptz not null,
  time_known boolean not null default false,
  status text not null check (status in ('on_sale', 'last', 'sold_out', 'open', 'closed')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_idx on events (starts_at);

create table if not exists memberships (
  id serial primary key,
  user_id text not null unique,
  full_name text not null,
  city text not null,
  tier text not null check (tier in ('aisle', 'pit', 'stage')),
  story text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  card_number text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists meet_requests (
  id serial primary key,
  user_id text not null,
  event_id int not null references events (id) on delete cascade,
  full_name text not null,
  guests int not null default 1 check (guests between 1 and 2),
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists songs (
  id serial primary key,
  title text not null,
  subtitle text,
  year int,
  album text
);

create table if not exists votes (
  user_id text not null,
  song_id int not null references songs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

create table if not exists wall_posts (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  body text not null,
  city text,
  pinned boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists chapters (
  id serial primary key,
  city text not null unique,
  country text not null,
  blurb text not null,
  member_count int not null default 0
);

create table if not exists chapter_members (
  user_id text primary key,
  chapter_id int not null references chapters (id) on delete cascade,
  joined_at timestamptz not null default now()
);

create table if not exists news (
  id serial primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  published_at timestamptz not null default now()
);

create table if not exists messages (
  id serial primary key,
  name text not null,
  email text not null,
  topic text not null,
  body text not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

insert into events (slug, kind, title, city, venue, starts_at, time_known, status, note) values
  ('msk-2026-10-22', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-22 20:00+03', true, 'sold_out', 'Sold out. First of the five Live Arena nights, 22–26 October.'),
  ('msk-2026-10-23', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-23 20:00+03', true, 'sold_out', 'Sold out. 20:00.'),
  ('msk-2026-10-24', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-24 19:00+03', true, 'sold_out', 'Sold out. 19:00.'),
  ('msk-2026-10-25', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-25 19:00+03', true, 'sold_out', 'Sold out. 19:00.'),
  ('msk-2026-10-26', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-26 20:00+03', true, 'sold_out', 'The fifth Live Arena night. The official house is full.'),
  ('vlg-2026-11-07', 'concert', 'SHOWMAN', 'Volgograd', 'Expocentre', '2026-11-07 19:00+03', false, 'sold_out', 'Moved from 6 March 2026.'),
  ('vlg-2026-11-08', 'concert', 'SHOWMAN', 'Volgograd', 'Expocentre', '2026-11-08 19:00+03', false, 'sold_out', 'Moved from 7 March 2026.'),
  ('uud-2026-11-17', 'concert', 'SHOWMAN', 'Ulan-Ude', 'FSK', '2026-11-17 19:00+03', false, 'last', 'Moved from 18 November 2026.'),
  ('irk-2026-11-19', 'concert', 'SHOWMAN', 'Irkutsk', 'Iceberg Ice Palace', '2026-11-19 19:00+03', false, 'on_sale', null),
  ('irk-2026-11-20', 'concert', 'SHOWMAN', 'Irkutsk', 'Iceberg Ice Palace', '2026-11-20 19:00+03', false, 'sold_out', 'Moved from 18 November 2025.'),
  ('kry-2026-11-23', 'concert', 'SHOWMAN', 'Krasnoyarsk', 'Yarygin Palace of Sports', '2026-11-23 19:00+03', false, 'on_sale', null),
  ('nsk-2026-11-25', 'concert', 'SHOWMAN', 'Novosibirsk', 'Siberia Arena', '2026-11-25 19:00+03', false, 'on_sale', null),
  ('nsk-2026-11-26', 'concert', 'SHOWMAN', 'Novosibirsk', 'Siberia Arena', '2026-11-26 19:00+03', false, 'on_sale', null),
  ('tom-2026-11-27', 'concert', 'SHOWMAN', 'Tomsk', 'Palace of Spectacles and Sports', '2026-11-27 19:00+03', false, 'last', null),
  ('kem-2026-11-29', 'concert', 'SHOWMAN', 'Kemerovo', 'Kuzbass Ice Palace', '2026-11-29 19:00+03', false, 'on_sale', null),
  ('nvk-2026-11-30', 'concert', 'SHOWMAN', 'Novokuznetsk', 'Kuznetsk Metallurgists Sports Palace', '2026-11-30 19:00+03', false, 'on_sale', null),
  ('brn-2026-12-01', 'concert', 'SHOWMAN', 'Barnaul', 'Titov Arena', '2026-12-01 20:00+03', true, 'last', 'Confirmed start, 20:00.'),
  ('oms-2026-12-07', 'concert', 'SHOWMAN', 'Omsk', 'G-Drive Arena', '2026-12-07 19:00+03', false, 'on_sale', null),
  ('krg-2026-12-09', 'concert', 'SHOWMAN', 'Kurgan', 'Paryshev Ice Palace', '2026-12-09 19:00+03', false, 'on_sale', null),
  ('chl-2026-12-10', 'concert', 'SHOWMAN', 'Chelyabinsk', 'Taganay Concert Hall', '2026-12-10 19:00+03', false, 'last', null),
  ('chl-2026-12-11', 'concert', 'SHOWMAN', 'Chelyabinsk', 'Taganay Concert Hall', '2026-12-11 19:00+03', false, 'on_sale', null),
  ('sur-2026-12-14', 'concert', 'SHOWMAN', 'Surgut', 'Ice Sports Palace', '2026-12-14 19:00+03', false, 'on_sale', null),
  ('khm-2026-12-15', 'concert', 'SHOWMAN', 'Khanty-Mansiysk', 'Tennis Development Centre', '2026-12-15 19:00+03', false, 'on_sale', null),
  ('prm-2026-12-21', 'concert', 'SHOWMAN', 'Perm', 'UDS Molot', '2026-12-21 19:00+03', false, 'on_sale', null),
  ('ekb-2026-12-23', 'concert', 'SHOWMAN', 'Yekaterinburg', 'UGMK Arena', '2026-12-23 19:00+03', false, 'on_sale', null),
  ('vld-2027-02-14', 'concert', 'SHOWMAN', 'Vladimir', 'Hall to be named', '2027-02-14 19:00+03', false, 'on_sale', null),
  ('orn-2027-02-19', 'concert', 'SHOWMAN', 'Orenburg', 'Hall to be named', '2027-02-19 19:00+03', false, 'on_sale', null),
  ('ufa-2027-02-21', 'concert', 'SHOWMAN', 'Ufa', 'Hall to be named', '2027-02-21 19:00+03', false, 'on_sale', null),
  ('kzn-2027-02-23', 'concert', 'SHOWMAN', 'Kazan', 'Hall to be named', '2027-02-23 19:00+03', false, 'on_sale', null),
  ('lyu-2027-03-12', 'concert', 'SHOWMAN', 'Lyubertsy', 'Hall to be named', '2027-03-12 19:00+03', false, 'on_sale', null),
  ('pdl-2027-03-14', 'concert', 'SHOWMAN', 'Podolsk', 'Hall to be named', '2027-03-14 19:00+03', false, 'on_sale', null),
  ('sam-2027-03-20', 'concert', 'SHOWMAN', 'Samara', 'Hall to be named', '2027-03-20 19:00+03', false, 'on_sale', null),
  ('uly-2027-03-23', 'concert', 'SHOWMAN', 'Ulyanovsk', 'Hall to be named', '2027-03-23 19:00+03', false, 'on_sale', null),
  ('srn-2027-03-24', 'concert', 'SHOWMAN', 'Saransk', 'Hall to be named', '2027-03-24 19:00+03', false, 'on_sale', null),
  ('pnz-2027-03-26', 'concert', 'SHOWMAN', 'Penza', 'Hall to be named', '2027-03-26 19:00+03', false, 'on_sale', null),
  ('srt-2027-03-27', 'concert', 'SHOWMAN', 'Saratov', 'Hall to be named', '2027-03-27 19:00+03', false, 'on_sale', null),
  ('klg-2027-05-16', 'concert', 'SHOWMAN', 'Kaluga', 'Hall to be named', '2027-05-16 19:00+03', false, 'on_sale', null),
  ('bry-2027-05-19', 'concert', 'SHOWMAN', 'Bryansk', 'Hall to be named', '2027-05-19 19:00+03', false, 'on_sale', null),
  ('krs-2027-05-22', 'concert', 'SHOWMAN', 'Kursk', 'Hall to be named', '2027-05-22 19:00+03', false, 'on_sale', null),
  ('spb-2027-10-08', 'concert', 'SHOWMAN', 'Saint Petersburg', 'Hall to be named', '2027-10-08 19:00+03', false, 'on_sale', null),
  ('spb-2027-10-09', 'concert', 'SHOWMAN', 'Saint Petersburg', 'Hall to be named', '2027-10-09 19:00+03', false, 'on_sale', null),
  ('msk-2027-10-23', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2027-10-23 19:00+03', false, 'on_sale', 'Added after the 2026 run sold out. Same hall. Clock not on the poster yet.'),
  ('msk-2027-10-24', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2027-10-24 19:00+03', false, 'on_sale', 'Added after the 2026 run sold out. Same hall. Clock not on the poster yet.'),
  ('msk-2027-10-25', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2027-10-25 19:00+03', false, 'on_sale', 'Added after the 2026 run sold out. Same hall. Clock not on the poster yet.'),
  ('meet-irk-2026-11-19', 'meet', 'Meet window', 'Irkutsk', 'Iceberg Ice Palace', '2026-11-19 22:30+03', true, 'open', 'Circle names after the show. A confirmed window is not a private audience and not a ticket.'),
  ('meet-nsk-2026-11-25', 'meet', 'Meet window', 'Novosibirsk', 'Siberia Arena', '2026-11-25 22:30+03', true, 'open', 'Circle names after the show. The desk confirms who is on the list.'),
  ('meet-ekb-2026-12-23', 'meet', 'Meet window', 'Yekaterinburg', 'UGMK Arena', '2026-12-23 22:30+03', true, 'open', 'Circle names after the show.'),
  ('meet-kzn-2027-02-23', 'meet', 'Meet window', 'Kazan', 'Hall to be named', '2027-02-23 22:30+03', true, 'open', 'Circle names after the show.'),
  ('meet-spb-2027-10-08', 'meet', 'Meet window', 'Saint Petersburg', 'Hall to be named', '2027-10-08 22:30+03', true, 'open', 'Circle names after the first Petersburg night of 2027.')
on conflict (slug) do nothing;

insert into songs (title, subtitle, year, album)
select v.title, v.subtitle, v.year, v.album
from (
  values
    ('You Are the Only One', 'Eurovision 2016 · 3rd', 2016, null::text),
    ('Scream', 'Eurovision 2019 · 3rd', 2019, null),
    ('Так красиво', 'Tak krasivo', 2017, 'V epitsentre'),
    ('Алый закат', 'Alyy zakat', 2023, 'Ya videl svet'),
    ('Вкус малины', 'Vkus maliny', 2023, 'Ya videl svet'),
    ('Я не боюсь', 'Ya ne boyus', 2019, 'Eto ya'),
    ('Шёпотом', 'Shyopotom', 2017, 'V epitsentre'),
    ('Снег в океане', 'Sneg v okeane', 2019, 'Eto ya'),
    ('Я видел свет', 'Ya videl svet', 2023, 'Ya videl svet'),
    ('Шоумен', 'Single', 2025, null),
    ('Самообман', 'Samoobman', 2024, 'Ya videl svet'),
    ('Не пытайся повторить', 'Ne pytaysya povtorit', 2023, 'Ya videl svet'),
    ('Цвета одного', 'Tsveta odnogo', 2024, 'Ya videl svet'),
    ('Тону в твоих глазах', 'Tonu v tvoikh glazakh', 2025, 'Schastlivye tozhe plachut')
) as v(title, subtitle, year, album)
where not exists (select 1 from songs);

insert into chapters (city, country, blurb) values
  ('Moscow', 'Russia', 'The home chapter. Live Arena nights, card pickups, and the loudest ballot.'),
  ('Saint Petersburg', 'Russia', 'For the SKA nights already played and the 2027 return.'),
  ('Kazan', 'Russia', 'Volga fans keeping a chair for 23 February 2027.'),
  ('Novosibirsk', 'Russia', 'Two Siberia Arena dates and a meet window on the 25th.'),
  ('Yekaterinburg', 'Russia', 'UGMK Arena on 23 December, plus a meet window the same night.'),
  ('Irkutsk', 'Russia', 'Iceberg, two nights, one of them still with tickets.'),
  ('Abuja', 'Nigeria', 'For fans following the tour from West Africa. Watch notes, not a pretend arena.')
on conflict (city) do nothing;

insert into news (slug, title, excerpt, body) values
  (
    'moscow-house-full',
    'Five Moscow nights, and the house is full',
    'Live Arena through 26 October is sold out. The Circle keeps the next open cities in one list.',
    $n$The Showman run opened its Moscow chapter at Live Arena and the official poster now reads sold out across the stand.

This page does not sell those seats. Ticket questions and returns stay with the promoter. What the Circle does is keep the road after Moscow honest: which halls still have paper, which were moved, and which nights have a meet window attached.

If you already hold a ticket for tonight, the fan wall is the place to leave a city and a line. The desk reads it.$n$
  ),
  (
    'siberia-run',
    'November turns east',
    'Ulan-Ude, Irkutsk, Krasnoyarsk, then the two Novosibirsk nights. A few halls are down to last tickets.',
    $n$After Volgograd, the tour crosses to Ulan-Ude on 17 November — that date was pulled forward one day — then Irkutsk, Krasnoyarsk, Novosibirsk, Tomsk, Kemerovo and Novokuznetsk.

Irkutsk on the 19th is still on sale. The 20th is not. Tomsk is in the last-ticket column. Times that the official poster has not pinned to a clock are listed here as Evening, not as a guessed start.

Meet windows, where the Circle is taking names, sit after the show. They are a fan-club list the desk confirms. They are not a backstage promise.$n$
  ),
  (
    'how-the-card-works',
    'What the card is for',
    'Aisle, Pit, and Stage. A phone card, a ballot, and a clearer line when you ask for a meet window.',
    $n$The membership card is issued by this desk, not by the box office. Apply with the name you want printed, your city, and a tier.

Aisle is the card, the wall, and the setlist ballot. Pit adds a city chapter. Stage is read first when meet windows are tight.

You will see a real card number only after the desk approves the application. Until then the pass says in review. Rejected applications can be sent again.$n$
  )
on conflict (slug) do nothing;

insert into wall_posts (user_id, author_name, body, city, pinned, hidden)
select 'circle-desk', 'Circle desk', 'The Moscow house is full. If you are in the room tonight, leave the city and one line — the desk pins the best of them.', 'Moscow', true, false
where not exists (select 1 from wall_posts where user_id = 'circle-desk' and city = 'Moscow');

insert into wall_posts (user_id, author_name, body, city, pinned, hidden)
select 'circle-desk', 'Circle desk', 'Ballot is open. Three songs, no more. Eurovision nights and the Russian setlist both count.', 'Everywhere', false, false
where not exists (select 1 from wall_posts where user_id = 'circle-desk' and city = 'Everywhere');
