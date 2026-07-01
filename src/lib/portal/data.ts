// Adapter over the canonical data layer in @/lib/data/portal.
import "server-only";
import {
  getPortalUser,
  getPortalOrganization,
  getPortalJobs,
  getPortalDocuments,
  getPortalJobTasks,
  getPortalVatPeriods,
  getPortalSubcontractors,
  getPortalCisRecords,
  getPortalMessages,
  getPortalOnboarding,
  getPortalReports,
  getPortalDeadlines,
} from "@/lib/data/portal";
import type {
  Job,
  Document,
  JobTask,
  VatPeriod,
  Subcontractor,
  CisRecord,
  Message,
  Onboarding,
  Report,
  Deadline,
} from "@/lib/types";

export type PortalJob = Job;
export type PortalDoc = Document;

export type {
  JobTask,
  VatPeriod,
  Subcontractor,
  CisRecord,
  Message,
  Onboarding,
  Report,
  Deadline,
};

export interface PortalContext {
  org: { id: string; name: string } | null;
  job: Job | null;
  jobs: Job[];
  tasks: JobTask[];
  documents: Document[];
  deadlines: Deadline[];
}

export async function getPortalContext(): Promise<PortalContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, jobs, tasks, documents, deadlines] = await Promise.all([
    getPortalOrganization(),
    getPortalJobs(),
    getPortalJobTasks(),
    getPortalDocuments(10),
    getPortalDeadlines(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    job: jobs[0] ?? null,
    jobs,
    tasks,
    documents,
    deadlines,
  };
}

export interface VatContext {
  org: { id: string; name: string } | null;
  periods: VatPeriod[];
}

export async function getVatContext(): Promise<VatContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, periods] = await Promise.all([
    getPortalOrganization(),
    getPortalVatPeriods(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    periods,
  };
}

export interface CisContext {
  org: { id: string; name: string } | null;
  subcontractors: Subcontractor[];
  records: CisRecord[];
}

export async function getCisContext(): Promise<CisContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, subcontractors, records] = await Promise.all([
    getPortalOrganization(),
    getPortalSubcontractors(),
    getPortalCisRecords(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    subcontractors,
    records,
  };
}

export interface MessagesContext {
  org: { id: string; name: string } | null;
  messages: Message[];
}

export async function getMessagesContext(): Promise<MessagesContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, messages] = await Promise.all([
    getPortalOrganization(),
    getPortalMessages(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    messages,
  };
}

export interface OnboardingContext {
  org: { id: string; name: string } | null;
  onboarding: Onboarding | null;
}

export async function getOnboardingContext(): Promise<OnboardingContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, onboarding] = await Promise.all([
    getPortalOrganization(),
    getPortalOnboarding(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    onboarding,
  };
}

export interface ReportsContext {
  org: { id: string; name: string } | null;
  reports: Report[];
}

export async function getReportsContext(): Promise<ReportsContext | null> {
  const pu = await getPortalUser();
  if (!pu) return null;
  const [org, reports] = await Promise.all([
    getPortalOrganization(),
    getPortalReports(),
  ]);
  return {
    org: org ? { id: org.id, name: org.name } : null,
    reports,
  };
}
