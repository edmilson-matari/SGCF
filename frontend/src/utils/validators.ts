/**
 * Validação do Bilhete de Identidade angolano (14 caracteres)
 * Formato: 9 dígitos + 2 letras (código de província) + 3 dígitos
 * Exemplo: 004567890LA011
 */
export const angolanBI = /^\d{9}[A-Za-z]{2}\d{3}$/;

/**
 * Validação de número de telefone angolano (formato local, 9 dígitos)
 * Prefixos válidos:
 *   92x / 99x — Unitel
 *   93x / 94x — Movicel
 *   95x        — Africell
 * Aceita opcionalmente +244 no início.
 */
export const angolanPhone = /^(?:\+244)?9[2-9]\d{7}$/;

export const BI_MESSAGE =
  "BI inválido — formato esperado: 9 dígitos + 2 letras + 3 dígitos (ex: 004567890LA011)";

export const PHONE_MESSAGE =
  "Telefone inválido — 9 dígitos a começar por 92, 93, 94, 95 ou 99 (ex: 923456789)";
