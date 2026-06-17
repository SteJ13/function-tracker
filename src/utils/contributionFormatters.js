export const CONTRIBUTION_TYPES = {
  CASH: 'CASH',
  GOLD: 'GOLD',
};

export function normalizeContributionType(type) {
  return String(type || '').trim().toUpperCase();
}

export function formatContributionAmount(type, amount) {
  const contributionType = normalizeContributionType(type);
  const numericAmount = parseFloat(amount);

  if (contributionType === CONTRIBUTION_TYPES.GOLD) {
    return `${amount || 0} grams`;
  }

  if (Number.isNaN(numericAmount)) {
    return '₹0';
  }

  return `₹${numericAmount.toLocaleString('en-IN')}`;
}
