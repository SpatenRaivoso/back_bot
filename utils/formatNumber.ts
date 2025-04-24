export const formatNumber = (number: string): string => {
    const onlyDigits = number.replace(/\D/g, '');
    return `${onlyDigits}@c.us`;
  };
  