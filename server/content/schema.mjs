// Each line names a real dish, describes it, and identifies its local context.
export function profile(dishes, traditions, socialNorms, etiquetteTips, religionOverview) {
  const foods = dishes.trim().split('\n').map(line => {
    const [name, description, famousFor] = line.trim().split('|');
    if (!name || !description || !famousFor) throw new Error(`Incomplete dish: ${line}`);
    return { name, description, famousFor };
  });
  return { foods, culture: { traditions, socialNorms, etiquetteTips, religionOverview } };
}
