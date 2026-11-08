export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDistance = (distanceKm) => {
  if (distanceKm === undefined || distanceKm === null) return null;
  return `${Number(distanceKm).toFixed(1)} km`;
};

export const getOccupancyColor = (rate) => {
  if (rate >= 90) return 'text-red-500';
  if (rate >= 75) return 'text-amber-500';
  return 'text-emerald-500';
};

