import Link from "next/link";
import { contact, demos, projects } from "@/lib/site";

export default function Home() {
  return (
    <>
      <header>
        <h1>Ian Menachery</h1>
        <p>Data Science + Economics, Northeastern University, December 2026</p>
        <p>
          I make data and AI dependable: I automate the tedious part, test the
          claims, and explain what the numbers mean.
        </p>
      </header>

      <section aria-labelledby="ch1">
        <h2 id="ch1">Numbers people rely on</h2>
        <p>
          As a reporting analyst co-op at Sun Life, I fixed figures senior
          stakeholders relied on: duplicate Hinge Health enrollments,
          overcounted sales rep prospects, and quarter-to-date goals calculated
          on month-end instead of quarter-end dates. I automated cross-sell
          reporting with a 1,000-line SQL query, saving the product team an
          estimated 5–10 hours a quarter, and replaced a manual VBA QA task
          with an unattended monthly SQL job.
        </p>
      </section>

      <section aria-labelledby="ch2">
        <h2 id="ch2">AI that behaves</h2>
        <p>
          As a technology consulting intern at EY, I built two Copilot Studio
          agents that gave an SAP S/4HANA implementation team self-serve
          staffing and task lookups, routed through deterministic Power
          Automate flows instead of free-form LLM output. I replaced manual
          onboarding, offboarding and access requests with flows, and an audit
          of role-to-course mappings for a 17,300-employee client caught 20
          unassigned courses that would have left roles untrained at go-live.
          I presented the agent framework to an 80-person engagement and wrote
          its handoff documentation.
        </p>
      </section>

      <section aria-labelledby="ch3">
        <h2 id="ch3">Claims, tested</h2>
        <p>
          On my own time I take a claim and try to break it. Can an LLM with
          web search beat prediction-market prices? Not after costs. Are those
          prices calibrated? A week out, politics yes and sports barely. What
          is a company worth from its filings? A DCF answers only where free
          cash flow fits. Can I solve a poker game exactly? Bit for bit against
          DeepMind&apos;s OpenSpiel, and 40 of 40 pre-registered checks against
          a published equilibrium.
        </p>
      </section>

      <section aria-labelledby="work">
        <h2 id="work">Selected work</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`}>{p.title}</Link>: {p.kind}.{" "}
              {p.summary}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lab">
        <h2 id="lab">Lab</h2>
        <p>Live demos that run in your browser, built from each project&apos;s own data.</p>
        <ul>
          {demos.map((d) => (
            <li key={d.href}>
              <Link href={d.href}>{d.title}</Link> (from {d.from})
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="experience">
        <h2 id="experience">Experience</h2>
        <ul>
          <li>EY, Technology Consulting Intern, New York, Jun–Aug 2026</li>
          <li>Sun Life, Reporting Analyst Co-op, Wellesley Hills, Jul 2025 – Jan 2026</li>
          <li>Knack, Economics &amp; Data Science Tutor, Boston, Mar 2024 – Apr 2026 (80+ hours, 4.97/5)</li>
          <li>Northeastern University, B.S. Data Science and B.S. Economics, December 2026</li>
        </ul>
      </section>

      <section aria-labelledby="about">
        <h2 id="about">About</h2>
        <p>
          I study data science and economics at Northeastern and graduate in
          December 2026. Outside work: chess, poker, basketball and personal
          finance.
        </p>
      </section>

      <section aria-labelledby="contact">
        <h2 id="contact">Contact</h2>
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
      </section>
    </>
  );
}
