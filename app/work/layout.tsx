import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import "./prose.css";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
