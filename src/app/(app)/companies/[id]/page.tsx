import { notFound } from "next/navigation";
import { getCompany } from "@/lib/data/companies";
import { CompanyDetail } from "@/components/companies/company-detail";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCompany(id);
  if (!data) notFound();

  return (
    <CompanyDetail
      org={data.org}
      contacts={data.contacts}
      activities={data.activities}
      notes={data.notes}
      jobs={data.jobs}
      jobTasks={data.jobTasks}
      reports={data.reports}
      deadlines={data.deadlines}
      amlChecks={data.amlChecks}
      messages={data.messages}
      portalUsers={data.portalUsers}
    />
  );
}
