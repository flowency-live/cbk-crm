import { redirect } from "next/navigation";

// Deals are not part of the product — redirect any direct hits.
export default function Page() {
  redirect("/companies");
}
