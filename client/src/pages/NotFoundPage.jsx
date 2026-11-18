import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-content-center gap-4 bg-page p-6 text-center">
      <h1 className="text-3xl font-bold text-ink">Page not found</h1>
      <Link to="/" className="font-semibold text-sage hover:underline">
        Back to overview
      </Link>
    </div>
  );
}
