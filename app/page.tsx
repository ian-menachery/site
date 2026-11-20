import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { contact, demos, projects } from "@/lib/site";
import HomeEv from "@/components/home-ev";
import Arrow from "@/components/arrow";

const experience = [
  {
    org: "EY",
    role: "Technology Consulting Intern, New York",
    when: "Jun–Aug 2026",
    what: "Built two Copilot Studio agents on Power Automate flows for an SAP S/4HANA implementation team.",
  },
  {
    org: "Sun Life",
    role: "Reporting Analyst Co-op, Wellesley Hills",
    when: "Jul 2025 – Jan 2026",
    what: "Fixed figures in recurring reports and automated cross-sell reporting in SQL.",
  },
  {
    org: "Knack",
    role: "Economics & Data Science Tutor, Boston",
    when: "Mar 2024 – Apr 2026",
    what: "80+ hours of tutoring, rated 4.97/5.",
  },
  {
    org: "Northeastern University",
    role: "B.S. Data Science and B.S. Economics",
    when: "Sep 2023 – Dec 2026",
    what: "",
  },
];

export default function Home() {
  return (
    <div className="page home">
      <header className="intro">
        <h1>Ian Menachery</h1>
        <p className="degree">Data Science + Economics, Northeastern University, December 2026</p>
        <p className="roles">Open to full-time 2027 roles in AI solutions, consulting, analytics and data science.</p>
        <p className="actions">
          <a className="btn btn-primary" href={contact.resume}>
            Resume (PDF)
          </a>
          <Link className="btn btn-quiet" href="#contact">
            Contact
          </Link>
        </p>
      </header>

      <section className="section" aria-labelledby="experience">
        <h2 id="experience" className="section-title">
          Experience
        </h2>
        <ul className="list">
          {experience.map((x) => (
            <li key={x.org}>
              <p className="item-title">
                {x.org} <span className="role">· {x.role}</span>
              </p>
              <p className="item-side">{x.when}</p>
              {x.what && <p className="item-desc">{x.what}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="projects">
        <h2 id="projects" className="section-title">
          Projects
        </h2>
        <ul className="list">
          {projects.map((p) => (
            <li key={p.slug}>
              <p className="item-title">
                <Link href={`/work/${p.slug}`}>
                  <ViewTransition name={`project-${p.slug}`} share="morph" default="none">
                    <span className="vt">{p.title}</span>
                  </ViewTransition>
                  <Arrow />
                </Link>
              </p>
              <p className="item-side">
                {p.demo && (
                  <Link href={p.demo} className="ui-link">
                    Demo
                  </Link>
                )}
                {p.repo ? (
                  <a href={p.repo} className="ui-link">
                    Code
                  </a>
                ) : (
                  <span>Private repo</span>
                )}
              </p>
              <p className="item-desc">{p.kind}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="lab">
        <h2 id="lab" className="section-title">
          Lab
        </h2>
        <p className="section-note">
          Demos that run in your browser on each project&apos;s own data. Below is showdown&apos;s push/fold
          solution: the EV of going all in with each hand, in big blinds. Shaded hands beat folding.
        </p>
        <HomeEv />
        <ul className="list" style={{ marginTop: 28 }}>
          {demos.map((d) => (
            <li key={d.href}>
              <p className="item-title">
                <Link href={d.href}>
                  {d.title}
                  <Arrow />
                </Link>
              </p>
              <p className="item-side">From {d.from}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="about">
        <h2 id="about" className="section-title">
          About
        </h2>
        <div className="about">
          <Image src="/headshot.jpg" alt="Ian Menachery" width={800} height={800} sizes="104px" />
          <p>
            I study data science and economics at Northeastern and graduate in December 2026. In my free time I
            play chess and poker, jump rope and read.
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
    </div>
  );
}
