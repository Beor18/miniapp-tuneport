export const TruncatedAddress = (address?: string) => {
  if (typeof address === 'string') {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return '';
};
