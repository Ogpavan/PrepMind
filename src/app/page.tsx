import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/application/authorization";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "STUDENT" ? "/dashboard" : "/admin/dashboard");
}
