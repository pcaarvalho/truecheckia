/**
 * Utilitários para formatação de valores monetários e números
 */

/**
 * Formata um valor monetário para o formato brasileiro (R$ XX,XX)
 * @param value - Valor numérico a ser formatado
 * @param currency - Símbolo da moeda (padrão: 'R$')
 * @returns Objeto com partes formatadas do preço
 */
export const formatPrice = (value: number, currency: string = 'R$') => {
  // Usar toFixed(2) para garantir exatamente 2 casas decimais
  const fixedValue = value.toFixed(2);
  const [integerPart, decimalPart] = fixedValue.split('.');

  return {
    currency,
    integer: integerPart,
    decimal: decimalPart,
    full: `${currency} ${integerPart},${decimalPart}`,
  };
};

/**
 * Formata um valor monetário completo como string
 * @param value - Valor numérico a ser formatado
 * @param currency - Símbolo da moeda (padrão: 'R$')
 * @returns String formatada (ex: "R$ 29,99")
 */
export const formatCurrency = (value: number, currency: string = 'R$'): string => {
  return formatPrice(value, currency).full;
};

/**
 * Formata um valor usando Intl.NumberFormat para máxima precisão
 * @param value - Valor numérico a ser formatado
 * @param locale - Locale para formatação (padrão: 'pt-BR')
 * @param currency - Código da moeda (padrão: 'BRL')
 * @returns String formatada usando Intl
 */
export const formatCurrencyIntl = (
  value: number,
  locale: string = 'pt-BR',
  currency: string = 'BRL'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

/**
 * Extrai apenas os centavos de um valor monetário
 * @param value - Valor numérico
 * @returns String com os centavos (sempre 2 dígitos)
 */
export const getCents = (value: number): string => {
  return value.toFixed(2).split('.')[1];
};

/**
 * Extrai apenas a parte inteira de um valor monetário
 * @param value - Valor numérico
 * @returns Número inteiro
 */
export const getIntegerPart = (value: number): number => {
  return Math.floor(value);
};

/**
 * Formata um número com separadores de milhares
 * @param value - Valor numérico
 * @returns String formatada com pontos como separadores
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

/**
 * Formata uma porcentagem
 * @param value - Valor entre 0 e 100
 * @param decimals - Número de casas decimais (padrão: 1)
 * @returns String formatada (ex: "85.5%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
