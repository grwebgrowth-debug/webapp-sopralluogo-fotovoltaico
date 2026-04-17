type StepCardProps = {
  numero: number;
  titolo: string;
  descrizione: string;
};

export function StepCard({ numero, titolo, descrizione }: StepCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-sm font-semibold">
        {numero}
      </div>
      <h3 className="mb-2 text-base font-semibold">{titolo}</h3>
      <p className="text-sm leading-6 text-[var(--muted)]">{descrizione}</p>
    </div>
  );
}
