import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/data/portal";
import { MyDetailsForm } from "@/components/portal/my-details-form";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyDetailsPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let contact: Contact | null = null;
  if (portalUser.contact_id) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", portalUser.contact_id)
      .single();
    contact = (data as Contact) ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My details</h1>
        <p className="page-sub">
          Keep your contact details up to date so we can always reach you.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Sign-in
        </p>
        <p className="mt-2 text-sm">
          {user?.email && <>Email: <b>{user.email}</b><br /></>}
          {user?.phone && <>Mobile for sign-in codes: <b>+{user.phone}</b></>}
        </p>
        <p className="mt-2 text-xs text-muted">
          Need to change how you sign in? Message us and we&apos;ll update it securely.
        </p>
      </section>

      {contact ? (
        <MyDetailsForm
          initialName={contact.full_name}
          initialPhone={contact.phone ?? ""}
        />
      ) : (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">
            We don&apos;t have an editable contact card linked to your login yet —
            send us a message and we&apos;ll sort it.
          </p>
        </section>
      )}
    </div>
  );
}
