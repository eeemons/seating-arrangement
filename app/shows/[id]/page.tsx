import { shows } from '@/data/shows';
import ShowDetailsClient from './ShowDetailsClient';

export async function generateStaticParams() {
  return shows.map((show) => ({
    id: show.id.toString(),
  }));
}

export default function ShowDetailsPage({ params }: { params: { id: string } }) {
  const show = shows.find(s => s.id === parseInt(params.id, 10));

  if (!show) {
    return <div>Show not found</div>;
  }

  return <ShowDetailsClient show={show} />;
}