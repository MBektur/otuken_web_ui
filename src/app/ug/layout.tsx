import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Өтүкән — Сийасәт Тәтқиқат Мәркизи", template: "%s | Өтүкән" },
  description: "Сийасий анализ, хәлқара мунасивәтләр, тәтқиқат вә китап тонуштуруш.",
};

export default function UgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ug-cyrl-layout" dir="ltr" lang="ug-Cyrl">
      {children}
    </div>
  );
}
