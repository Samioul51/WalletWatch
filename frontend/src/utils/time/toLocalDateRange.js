export const toLocalDateRange = (dateValue, isEndOfDay = false) => {
	const time = isEndOfDay ? "T23:59:59.999" : "T00:00:00.000";
	return new Date(`${dateValue}${time}`).toISOString();
};