import { TIERS } from "@/lib/circle/content";

const TZ = "America/Mexico_City";

function parts(iso: string) {
  const date = new Date(iso);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...options }).format(date);
  return {
    weekday: fmt({ weekday: "short" }),
    date: fmt({ day: "numeric", month: "short", year: "numeric" }),
    time: fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    month: fmt({ month: "long", year: "numeric" }),
    dayKey: fmt({ year: "numeric", month: "2-digit", day: "2-digit" }),
  };
}

export function whenParts(iso: string, timeKnown: boolean) {
  const value = parts(iso);
  return {
    weekday: value.weekday,
    date: value.date,
    time: timeKnown ? value.time : "Evening",
  };
}

export function monthLabel(iso: string) {
  return parts(iso).month;
}

export function hasPlayed(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

export function isTonight(iso: string) {
  return parts(iso).dayKey === parts(new Date().toISOString()).dayKey;
}

export function statusLabel(status: string, iso?: string) {
  if (iso && hasPlayed(iso) && !["pending", "approved", "rejected", "unpaid", "paid"].includes(status)) {
    return "Played";
  }
  if (status === "on_sale") return "On sale";
  if (status === "last") return "Last tickets";
  if (status === "sold_out") return "Sold out";
  if (status === "open") return "Open";
  if (status === "closed") return "Closed";
  if (status === "pending") return "In review";
  if (status === "unpaid") return "Fee due";
  if (status === "paid") return "Paid";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Declined";
  return status;
}

export function statusTone(status: string, iso?: string): "bone" | "stage" | "mute" {
  if (iso && hasPlayed(iso) && status !== "pending") return "mute";
  if (status === "last" || status === "rejected") return "stage";
  if (status === "sold_out" || status === "closed" || status === "pending" || status === "unpaid") return "mute";
  return "bone";
}

export function tierName(tier: string) {
  return TIERS.find((item) => item.id === tier)?.name ?? tier;
}

export function euros(amount: number) {
  return `€${amount.toLocaleString("en-IE")}`;
}

export function ticketCode(kind: "M" | "W" | "C" | "S" | "H", id: number) {
  return `CL-${kind}-${String(id).padStart(4, "0")}`;
}

export function errText(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong.";
}
