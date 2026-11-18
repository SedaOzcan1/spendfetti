import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/layout/Logo.jsx';

const CONTENT = {
  terms: {
    title: 'Terms of use',
    sections: [
      [
        'A portfolio project',
        'Spendfetti is a demo application built as a portfolio project. It is provided as is, without warranties, and may change or be reset at any time.',
      ],
      [
        'Your account',
        'You are responsible for keeping your password safe and for the information you enter. Please don’t store sensitive financial data such as card numbers.',
      ],
      [
        'Not financial advice',
        'Budgets, suggestions and activity recommendations are for personal planning only and are not financial advice.',
      ],
      [
        'Events',
        'Events shown on the Activities page are sample data. Ticket links open third-party websites that have their own terms.',
      ],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      [
        'What we store',
        'Your name, email, optional city, preferences, and the transactions, categories and budgets you create. Passwords are stored only as secure hashes.',
      ],
      [
        'How it’s used',
        'Only to run the app for you: summaries, budgets, notifications and activity suggestions. Nothing is sold or shared with advertisers.',
      ],
      [
        'Cookies',
        'A single httpOnly cookie keeps you signed in. There are no tracking or advertising cookies.',
      ],
      [
        'Your choices',
        'You can update your profile and turn celebrations or suggestions off in Settings at any time.',
      ],
    ],
  },
};

export default function LegalPage({ kind }) {
  const { title, sections } = CONTENT[kind];
  return (
    <div className="min-h-screen bg-page px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <Link
          to={-1}
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-sage hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: November 2026</p>
        <div className="mt-10 space-y-8">
          {sections.map(([heading, text]) => (
            <section key={heading}>
              <h2 className="text-lg font-semibold text-ink">{heading}</h2>
              <p className="mt-2 leading-relaxed text-ink/80">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
