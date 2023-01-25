function invariant(condition: any, message?: string): asserts condition {
  if (condition) {
    return;
  }

  throw new Error(message);
}

export default invariant;
