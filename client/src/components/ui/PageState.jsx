export function PageError({ error }) {
  return (
    <p role="alert" className="mt-8 rounded-xl bg-blush px-5 py-4 text-coral">
      {error?.message ?? 'Something went wrong.'}
    </p>
  );
}

export function PageLoading() {
  return (
    <p role="status" className="mt-8 text-muted">
      Loading…
    </p>
  );
}
