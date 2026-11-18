import type { ReactNode } from "react";
import "./lab.css";

export default function LabLayout({ children }: { children: ReactNode }) {
  return <div className="lab">{children}</div>;
}
