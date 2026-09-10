import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { parseLang } from "@/lib/i18n";

export default async function MyProfilePage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const me = await getSessionProfile();

  if (!me) redirect("/login");

  const qs = lang !== "en" ? `?lang=${lang}` : "";
  redirect(`/profiles/${me.id}${qs}`);
}
