export const isToday = (timestamp) => {
  const { seconds, nanoseconds } = timestamp;

  const millis = seconds * 1000 + nanoseconds / 1000000;

  const dateFromTimestamp = new Date(millis);

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  return dateFromTimestamp >= startOfToday && dateFromTimestamp < endOfToday;
};
