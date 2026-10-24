import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("settings.metaTitle"), robots: { index: false } };
}

export default async function SettingsPage() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-3xl pt-10 sm:pt-14">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("settings.title")}</h1>
      <SettingsForm />
    </div>
  );
}
