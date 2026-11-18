import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';

// Placeholder until the fun budget and events APIs land (T10–T12)
export default function ActivitiesPage() {
  return (
    <>
      <PageHeader title="Activities" subtitle="Turn what you saved into good memories." />
      <Card tone="forest" className="mt-8 p-8 lg:mt-10">
        <p className="text-xs font-semibold tracking-[0.12em] text-white/80">COMING SOON</p>
        <p className="mt-4 max-w-xl text-lg text-white/90">
          Close a month with money left over and we’ll suggest concerts, workshops and exhibitions
          that fit your fun budget.
        </p>
      </Card>
    </>
  );
}
