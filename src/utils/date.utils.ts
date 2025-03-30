export const addHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

export const isExpired = (date: Date): boolean => {
  return new Date() > date;
};
