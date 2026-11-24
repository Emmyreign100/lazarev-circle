import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { payCall, requestCall } from "@/lib/circle/api";
import { CALL_FEE_EUR, SERVICES } from "@/lib/circle/content";
import { errText, euros, statusLabel, ticketCode } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Field, Notice, PageIntro, SuccessTicket } from "@/components/site/ui";

export const Route = createFileRoute("/calls")({
  component: CallsPage,
});

const CALL = SERVICES.find((item) => item.to === "/calls");

function CallsPage() {
  const { user, isPending } = useCurrentUserState();
  const { mine, loading, reload, error: mineError } = useMine(!isPending && Boolean(user));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justId, setJustId] = useState<number | null>(null);

  const calls = mine?.calls ?? [];
  const unpaid = calls.find((row) => row.status === "unpaid") ?? null;
  const waiting = calls.find((row) => row.status === "paid" || row.status === "approved") ?? null;
  const paying = unpaid;
  const fee = euros(paying?.amountEur ?? CALL_FEE_EUR);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await requestCall({ data: { reason } });
      setJustId(result.id);
      setReason("");
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  async function onPay() {
    if (!paying) return;
    setBusy(true);
    setError(null);
    try {
      await payCall({ data: { id: paying.id } });
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Call request"
        title="Ask for a call with Sergey Lazarev."
        lede="Write why you want the call. The next page is the €650 fee. The desk can approve the request only after that fee is recorded."
      />

      {isPending || (user && loading && !mine) ? <p className="mt-8 text-mute">Checking your requests…</p> : null}

      {!isPending && !user ? (
        <div className="panel mt-8 max-w-xl p-6">
          <h2 className="font-serif text-3xl">Sign in to request a call</h2>
          <p className="mt-2 text-bone-dim">The request is saved to your account, then the €650 fee is the next step.</p>
          <Link to="/login" className="btn btn-primary mt-6">
            Join or sign in
          </Link>
        </div>
      ) : null}

      {user && paying ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="text-xs tracking-widest text-mute uppercase">Fee due</p>
            <h2 className="mt-2 font-serif text-5xl tabular-nums">{fee}</h2>
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">
              This amount has to be recorded before the desk can approve the call. Confirming here tells the desk the €650 is paid. No card is charged on this page.
            </p>
            <p className="mt-6 text-xs tracking-widest text-mute uppercase">Reason</p>
            <p className="mt-2 text-sm leading-relaxed">{paying.reason}</p>
            {error ? <div className="mt-4"><Notice tone="stage">{error}</Notice></div> : null}
            <button type="button" className="btn btn-primary mt-6" disabled={busy} onClick={() => void onPay()}>
              {busy ? "Recording…" : `Record ${fee} as paid`}
            </button>
          </div>
          <SuccessTicket
            code={ticketCode("C", paying.id)}
            service="Call with Sergey Lazarev"
            holder={fee}
            lines={["Fee due", "Waiting for payment"]}
            features={CALL ? [...CALL.features] : [`${fee} before approval`]}
            state="received"
          />
        </div>
      ) : null}

      {user && !paying && waiting ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="text-xs tracking-widest text-mute uppercase">{statusLabel(waiting.status)}</p>
            <h2 className="mt-2 font-serif text-4xl">
              {waiting.status === "approved" ? "The call is approved." : `${euros(waiting.amountEur)} is recorded.`}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">
              {waiting.status === "approved"
                ? "The desk approved this call. They will use the reason you wrote."
                : "The desk can approve this now. You will see the answer on your dashboard."}
            </p>
            <p className="mt-6 text-xs tracking-widest text-mute uppercase">Reason</p>
            <p className="mt-2 text-sm leading-relaxed">{waiting.reason}</p>
            <Link to="/me" className="btn btn-ghost mt-6">
              Back to your dashboard
            </Link>
          </div>
          <SuccessTicket
            code={ticketCode("C", waiting.id)}
            service="Call with Sergey Lazarev"
            holder={euros(waiting.amountEur)}
            lines={[waiting.status === "approved" ? "Approved" : "Paid, waiting for the desk"]}
            features={CALL ? [...CALL.features] : []}
            state={waiting.status === "approved" ? "confirmed" : "received"}
          />
        </div>
      ) : null}

      {user && !paying && !waiting ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
          <form className="space-y-4" onSubmit={onSubmit}>
            <h2 className="font-serif text-3xl">Why do you want the call?</h2>
            <Field label="Reason for the call">
              <textarea
                className="field min-h-36"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={8}
                maxLength={600}
                placeholder="A few sentences the desk can read."
              />
            </Field>
            <p className="text-sm text-bone-dim">Next: the {euros(CALL_FEE_EUR)} fee. The desk cannot approve until that is recorded.</p>
            {calls.some((row) => row.status === "rejected") ? (
              <Notice>The last request was declined. Sending this starts a new one.</Notice>
            ) : null}
            {error ? <Notice tone="stage">{error}</Notice> : null}
            {mineError ? <Notice tone="stage">{mineError}</Notice> : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Continue to the fee"}
            </button>
            {justId ? <p className="text-sm text-mute">Request {ticketCode("C", justId)} is opening the fee page.</p> : null}
          </form>
          {CALL ? (
            <aside className="panel p-6">
              <p className="text-xs tracking-widest text-mute uppercase">What happens next</p>
              <h2 className="mt-2 font-serif text-3xl">{euros(CALL_FEE_EUR)}</h2>
              <p className="mt-2 text-sm text-bone-dim">{CALL.summary}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {CALL.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
