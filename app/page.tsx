import Image from "next/image";
import Link from "next/link";
import { contact, demos, projects } from "@/lib/site";
import { chapters, frames } from "@/lib/frames";
import FilmStrip from "@/components/strip/film-strip";
import ProjectIndex from "@/components/project-index";
import { loop } from "@/components/strip/marks";

const headshotMark = loop(5, 50, 50, 40, 41);

export default function Home() {
  return (
    <>
      <header className="hero">
        <h1>Ian Menachery</h1>
        <p className="caps meta">
          <span>Data Science + Economics ·</span> <span>Northeastern University ·</span>{" "}
          <span>December 2026</span>
        </p>
        <p className="lede">
          I make data and AI dependable: I automate the tedious part, test the
          claims, and explain what the numbers mean.
        </p>
        <div>
          <p className="roles">
            Open to full-time 2027 roles in AI solutions, consulting, analytics
            and data science.
          </p>
          <p className="actions">
            <a className="btn btn-primary" href={contact.resume}>
              Resume (PDF)
            </a>
            <Link className="btn btn-quiet" href="#contact">
              Contact
            </Link>
          </p>
        </div>
      </header>

      <FilmStrip frames={frames} chapters={chapters} />

      <section className="section" aria-labelledby="work">
        <h2 id="work" className="section-title">
          Selected work
        </h2>
        <ProjectIndex projects={projects} />
      </section>

      <section className="section" aria-labelledby="lab">
        <h2 id="lab" className="section-title">
          Lab
        </h2>
        <p className="intro">
          Live demos that run in your browser, built from each project&apos;s own
          data. Tests check the numbers against the original Python.
        </p>
        <ul className="index">
          {demos.map((d) => (
            <li key={d.href} className="index-row compact">
              <p className="index-title">
                <Link href={d.href}>{d.title}</Link>
              </p>
              <p className="caps">From {d.from}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="experience">
        <h2 id="experience" className="section-title">
          Experience
        </h2>
        <dl className="cv">
          <div>
            <dt>EY</dt>
            <dd>Technology Consulting Intern, New York</dd>
            <dd>Jun–Aug 2026</dd>
          </div>
          <div>
            <dt>Sun Life</dt>
            <dd>Reporting Analyst Co-op, Wellesley Hills</dd>
            <dd>Jul 2025 – Jan 2026</dd>
          </div>
          <div>
            <dt>Knack</dt>
            <dd>Economics &amp; Data Science Tutor, Boston (80+ hours, 4.97/5)</dd>
            <dd>Mar 2024 – Apr 2026</dd>
          </div>
          <div>
            <dt>Northeastern University</dt>
            <dd>B.S. Data Science and B.S. Economics</dd>
            <dd>December 2026</dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="about">
        <h2 id="about" className="section-title">
          About
        </h2>
        <div className="about">
          <figure className="roll">
            <span className="edge-print" aria-hidden="true">
              Ian Menachery · Dec 2025
            </span>
            <Image src="/headshot.jpg" alt="Ian Menachery" width={800} height={800} sizes="(min-width: 900px) 340px, 90vw" />
            <svg className="mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={headshotMark.d} />
            </svg>
          </figure>
          <p>
            I study data science and economics at Northeastern and graduate in
            December 2026. Outside work: chess, poker, basketball and personal
            finance.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="contact">
        <h2 id="contact" className="section-title">
          Contact
        </h2>
        <ul className="contact-list">
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
      </section>
    </>
  );
}
