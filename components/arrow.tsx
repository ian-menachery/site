// The small arrow after a list title; it nudges right on hover (.arrow in globals.css).
export default function Arrow() {
  return (
    <svg className="arrow" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M1.5 6h8.5M6.75 2.75 10 6 6.75 9.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
