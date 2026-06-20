import { AppShell } from "@/components/app-shell";
import { getNewEnquiryCount } from "@/lib/data/enquiries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enquiryCount = await getNewEnquiryCount();
  return <AppShell enquiryCount={enquiryCount}>{children}</AppShell>;
}
