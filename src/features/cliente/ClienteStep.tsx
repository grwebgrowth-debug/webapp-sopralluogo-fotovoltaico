"use client";

import { useWizard } from "@/features/wizard/WizardProvider";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";
const helpClassName = "mt-1 text-xs text-[var(--muted)]";

export function ClienteStep() {
  const { actions, state } = useWizard();
  const { customer, inspection } = state;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dati cliente e sopralluogo</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Inserisci i dati minimi del lavoro. I campi obbligatori sono nome,
          cognome, indirizzo e data sopralluogo.
        </p>
        {state.active_client_profile && (
          <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--muted)]">
            Profilo attivo:{" "}
            <strong className="text-[var(--foreground)]">
              {state.active_client_profile.company_name ||
                state.active_client_profile.profile_name}
            </strong>
            . Il tecnico predefinito viene compilato quando il campo è vuoto.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClassName}>
          Nome cliente *
          <input
            className={inputClassName}
            value={customer.first_name}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ first_name: event.target.value })
            }
          />
          {!customer.first_name.trim() && (
            <span className={helpClassName}>Campo obbligatorio.</span>
          )}
        </label>

        <label className={labelClassName}>
          Cognome cliente *
          <input
            className={inputClassName}
            value={customer.last_name}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ last_name: event.target.value })
            }
          />
          {!customer.last_name.trim() && (
            <span className={helpClassName}>Campo obbligatorio.</span>
          )}
        </label>

        <label className={labelClassName}>
          Telefono
          <input
            className={inputClassName}
            inputMode="tel"
            value={customer.phone}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ phone: event.target.value })
            }
          />
        </label>

        <label className={labelClassName}>
          Email
          <input
            className={inputClassName}
            type="email"
            value={customer.email}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ email: event.target.value })
            }
          />
          {customer.email && !customer.email.includes("@") && (
            <span className={helpClassName}>Inserisci una email valida.</span>
          )}
        </label>

        <label className={`${labelClassName} md:col-span-2`}>
          Indirizzo del sopralluogo *
          <input
            className={inputClassName}
            value={customer.address}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ address: event.target.value })
            }
          />
          {!customer.address.trim() && (
            <span className={helpClassName}>Campo obbligatorio.</span>
          )}
        </label>

        <label className={labelClassName}>
          Comune
          <input
            className={inputClassName}
            value={customer.city}
            onChange={(event) =>
              actions.aggiornaDatiCliente({ city: event.target.value })
            }
          />
        </label>

        <label className={labelClassName}>
          Provincia
          <input
            className={inputClassName}
            maxLength={2}
            value={customer.province}
            onChange={(event) =>
              actions.aggiornaDatiCliente({
                province: event.target.value.toUpperCase(),
              })
            }
          />
        </label>

        <label className={labelClassName}>
          Data sopralluogo *
          <input
            className={inputClassName}
            type="date"
            value={inspection.date}
            onChange={(event) =>
              actions.aggiornaDatiSopralluogo({ date: event.target.value })
            }
          />
          {!inspection.date.trim() && (
            <span className={helpClassName}>Campo obbligatorio.</span>
          )}
        </label>

        <label className={labelClassName}>
          Tecnico incaricato
          <input
            className={inputClassName}
            value={inspection.technician}
            onChange={(event) =>
              actions.aggiornaDatiSopralluogo({
                technician: event.target.value,
              })
            }
          />
        </label>

        <label className={`${labelClassName} md:col-span-2`}>
          Note generali
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            value={inspection.notes}
            onChange={(event) =>
              actions.aggiornaDatiSopralluogo({ notes: event.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}
