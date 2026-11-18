import type { Metadata, Viewport } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { contact } from "@/lib/site";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-serif",
});

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

export const viewport: Viewport = {
  themeColor: "#161411",
};

// Runs before paint so a saved light theme never flashes dark first.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="masthead rebate rebate-top">
          <nav aria-label="Main">
            <Link href="/" className="masthead-name">
              Ian Menachery
            </Link>
            <ul>
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
          <ThemeToggle />
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer rebate rebate-bottom">
          <ul>
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              <a href={contact.linkedin}>LinkedIn</a>
            </li>
            <li>
              <a href={contact.github}>GitHub</a>
            </li>
            <li>
              <a href={contact.resume}>Resume (PDF)</a>
            </li>
          </ul>
        </footer>
      </body>
    </html>
  );
}
