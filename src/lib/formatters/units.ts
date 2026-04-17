const italianNumberFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 2,
});

export function formattaCentimetri(valore: number): string {
  return `${italianNumberFormatter.format(valore)} cm`;
}

export function formattaWatt(valore: number): string {
  return `${italianNumberFormatter.format(valore)} W`;
}
