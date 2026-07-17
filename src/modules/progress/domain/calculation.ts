export function calculateAccuracy(correct: number, attempted: number) { return attempted > 0 ? correct / attempted * 100 : 0; }
