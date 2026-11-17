import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/site";
import "./globals.css";

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title: {
    default: "Ian Menachery",
    template: "%s | Ian Menachery",
  },
  description:
    "Ian Menachery, Data Science + Economics at Northeastern (Dec 2026). I make data and AI dependable: I automate the tedious part, test the claims, and explain what the numbers mean.",
  openGraph: {
    type: "website",
    siteName: "Ian Menachery",
    images: [{ url: "/headshot.jpg", width: 800, height: 800, alt: "Ian Menachery" }],
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <nav aria-label="Main">
          <ul>
            <li>
              <Link href="/">Ian Menachery</Link>
            </li>
            <li>
              <Link href="/work">Work</Link>
            </li>
            <li>
              <Link href="/lab">Lab</Link>
            </li>
            <li>
              <a href={contact.resume}>Resume</a>
            </li>
            <li>
              <Link href="/#contact">Contact</Link>
            </li>
          </ul>
        </nav>
        <main>{children}</main>
        <footer>
          <ul>
            <li>
              <a href={contact.linkedin}>LinkedIn</a>
            </li>
            <li>
              <a href={contact.github}>GitHub</a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          </ul>
        </footer>
      </body>
    </html>
  );
}
