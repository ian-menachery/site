import type { Metadata, Viewport } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
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
    "Ian Menachery, Data Science + Economics at Northeastern (December 2026). Experience at EY and Sun Life, project case studies and live demos.",
  openGraph: {
    type: "website",
    siteName: "Ian Menachery",
    images: [{ url: "/headshot.jpg", width: 800, height: 800, alt: "Ian Menachery" }],
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

// Runs before paint: a saved light theme never flashes dark first, and the intro
// entrance plays once per visit, only when the visit starts on home.
const headScript = `try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t;if(location.pathname==="/"&&!sessionStorage.getItem("seen")){d.dataset.first="";setTimeout(function(){delete d.dataset.first},1200)}sessionStorage.setItem("seen","1")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="masthead">
          <Link href="/" className="masthead-name ui-link">
            Ian Menachery
          </Link>
          <nav aria-label="Main">
            <ul>
              <li>
                <Link href="/work" className="ui-link">
                  Work
                </Link>
              </li>
              <li>
                <Link href="/lab" className="ui-link">
                  Lab
                </Link>
              </li>
              <li>
                <a href={contact.resume} className="ui-link">
                  Resume
                </a>
              </li>
              <li className="nav-contact">
                <Link href="/#contact" className="ui-link">
                  Contact
                </Link>
              </li>
            </ul>
            <ThemeToggle />
          </nav>
        </header>
        <main id="main">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
