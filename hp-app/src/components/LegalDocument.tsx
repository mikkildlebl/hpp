import Link from 'next/link';

export type LegalBlock = string | { list: string[] };
export type LegalSection = { title: string; blocks: LegalBlock[] };

// Shared shell for /villkor and /integritetspolicy - same always-dark
// treatment as the landing/login pages, since these are public legal pages
// outside the themeable app.
export function LegalDocument({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#05070c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />

      <header className="relative z-10 flex items-center px-6 py-6 sm:px-12">
        <Link href="/" className="text-base font-semibold tracking-tight">
          HP Pro
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12 sm:px-12">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-white/40">Senast uppdaterad: {updated}</p>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-white/70">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              <div className="mt-2 flex flex-col gap-2">
                {section.blocks.map((block, i) =>
                  typeof block === 'string' ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-1 pl-5">
                      {block.list.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40 sm:px-12">
        <Link href="/" className="hover:text-white">
          Tillbaka till startsidan
        </Link>
      </footer>
    </div>
  );
}
