import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-action text-action-fg hover:bg-action-hover',
  secondary: 'border border-line bg-surface text-ink hover:border-ink',
  ghost: 'text-muted hover:text-ink',
  danger: 'border border-line bg-surface text-danger hover:border-danger',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /**
   * Die Handlung läuft: Der Knopf meldet sich als nicht verfügbar und nimmt
   * keinen Klick an, behält aber den Fokus. Mit `disabled` schieben die
   * Browser den Fokus auf `body`, und wer mit Tastatur oder Screenreader
   * arbeitet, steht danach nirgends (DIAGNOSTICS Nummer 34).
   */
  pending?: boolean;
  children: ReactNode;
}

/** Mindesthöhe 44 Pixel, damit die Bedienung auch auf dem Telefon trägt. */
export function Button({
  variant = 'secondary',
  pending = false,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  // Auch Enter in einem Feld des Formulars kommt als Klick auf den Absendeknopf
  // an; ohne Klick sendet das Formular nicht.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...props}
      aria-disabled={pending || props['aria-disabled']}
      onClick={handleClick}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4',
        'text-body font-medium disabled:opacity-60 aria-disabled:opacity-60',
        'transition-colors ease-state duration-[var(--dur-snap)]',
        VARIANTS[variant],
        className,
      ].join(' ')}
    />
  );
}
