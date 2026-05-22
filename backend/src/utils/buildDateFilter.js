export const buildDateFilter = (startDate, endDate) => {
	const createdAt = {};

	if (startDate)
		createdAt.$gte = new Date(startDate);

	if (endDate)
		createdAt.$lte = new Date(endDate);

	return Object.keys(createdAt).length ? createdAt : null;
};