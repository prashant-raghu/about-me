import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { profile } from "@/content/profile";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 sm:mt-12">
      <h2 className="mb-3.5 text-[12px] font-medium tracking-[0.12em] text-faint uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const { headings, now, footer } = profile;

  return (
    <div className="mx-auto max-w-[648px] px-5 pt-12 pb-10 sm:px-6 sm:pt-[72px] sm:pb-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[28px]">
            {profile.name}
          </h1>
          <p className="max-w-[500px] text-[17px] text-muted">{profile.tagline}</p>
          <p className="mono mt-2.5 text-faint">{profile.location}</p>
        </div>
        <ThemeToggle />
      </header>

      <main>
        <Section title={headings.now}>
          <p>
            {now.before}
            <strong>{now.emphasis}</strong>
            {now.after}
          </p>
        </Section>

        <Section title={headings.work}>
          <ol>
            {profile.work.map((job) => (
              <li
                key={job.when}
                className="grid grid-cols-1 gap-0.5 border-t border-line py-3.5 last:border-b sm:grid-cols-[112px_1fr] sm:gap-4"
              >
                <div className="mono text-faint sm:pt-[3px]">{job.when}</div>
                <div>
                  <p className="font-medium">
                    {job.role} <span className="font-normal text-muted">· {job.org}</span>
                  </p>
                  <p className="mt-1 text-[15px] text-muted">{job.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={headings.skills}>
          <ul className="mono flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-md border border-line bg-chip px-[9px] py-[3px] text-muted"
              >
                {skill}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={headings.contact}>
          <div className="flex flex-wrap gap-x-[22px] gap-y-1.5">
            {profile.contact.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b border-line pb-px text-fg hover:border-fg"
              >
                {link.label}
              </a>
            ))}
          </div>
        </Section>
      </main>

      <footer className="mono mt-16 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-5 text-faint">
        <span>
          {footer.credit.prefix}{" "}
          <a href={footer.credit.href} className="border-b border-line text-muted">
            {footer.credit.label}
          </a>
        </span>
        <span>
          <a href={footer.source.href} className="border-b border-line text-muted">
            {footer.source.label}
          </a>
        </span>
      </footer>
    </div>
  );
}
