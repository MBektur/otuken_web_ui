import { redirect } from "next/navigation";

export async function GET() {
  redirect("/uy/admin/settings");
}
