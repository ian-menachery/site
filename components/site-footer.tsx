import { contact } from "@/lib/site";

// On the work and lab pages only: home ends with its own Contact section.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <ul>
        <li>
          <a href={`mailto:${contact.email}`} className="ui-link">
            {contact.email}
          </a>
        </li>
        <li>
          <a href={contact.linkedin} className="ui-link">
            LinkedIn
          </a>
        </li>
        <li>
          <a href={contact.github} className="ui-link">
            GitHub
          </a>
        </li>
        <li>
          <a href={contact.resume} className="ui-link">
            Resume (PDF)
          </a>
        </li>
      </ul>
    </footer>
  );
}
