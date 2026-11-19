import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import "./lab.css";

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lab">{children}</div>
      <SiteFooter />
    </>
  );
}
