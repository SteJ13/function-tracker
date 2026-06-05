export const formatDisplayDate = dateString => {
	if (!dateString) return '';

	const parsed = new Date(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return dateString;
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
};

export const formatDisplayTime = (dateString, timeString) => {
	if (!timeString) return '';

	const candidate = `${dateString || '1970-01-01'}T${timeString}`;
	const parsed = new Date(candidate);

	if (!Number.isNaN(parsed.getTime())) {
		return new Intl.DateTimeFormat(undefined, {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		}).format(parsed);
	}

	return timeString;
};
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateStr;
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  return timeStr.substring(0, 5);
};
