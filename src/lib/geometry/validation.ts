export type ValidationResult = {
  valido: boolean;
  errore?: string;
};

export function validaOstacoloPlaceholder(): ValidationResult {
  return {
    valido: false,
    errore: "Validazione geometrica non ancora implementata.",
  };
}
