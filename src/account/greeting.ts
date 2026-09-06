// Use the visitor's device time, including its timezone and daylight-saving rules.
export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'Good morning, {name}.';
  if (hour >= 12 && hour < 18) return 'Good afternoon, {name}.';
  return 'Goodnight, {name}.';
}

export function millisecondsUntilNextGreeting(date = new Date()) {
  const next = new Date(date);
  const hour = date.getHours();
  if (hour >= 18) next.setDate(next.getDate() + 1);
  next.setHours(hour < 6 || hour >= 18 ? 6 : hour < 12 ? 12 : 18, 0, 0, 0);
  return next.getTime() - date.getTime();
}
