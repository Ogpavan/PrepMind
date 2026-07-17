export function calculateCorrectness(selectedOptionIds: string[], correctOptionIds: string[]) {
  const selected = [...new Set(selectedOptionIds)].sort(); const correct = [...new Set(correctOptionIds)].sort();
  return selected.length === correct.length && selected.every((id, index) => id === correct[index]);
}
