import Dashboard from '@/components/Dashboard';

export default function UserPage({ params }: { params: { username: string } }) {
  // Remove @ symbol if present (handles /@username format)
  const username = params.username.startsWith('@')
    ? params.username.slice(1).toLowerCase()
    : params.username.toLowerCase();

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto overflow-x-hidden">
        <Dashboard initialUsername={username} />
      </div>
    </main>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { username: string } }) {
  const username = params.username.startsWith('@')
    ? params.username.slice(1)
    : params.username;

  return {
    title: `@${username} - ManteCurated Live | Mantequilla Soft`,
    description: `View curation stats, voting power, and activity for @${username} on Hive blockchain. Real-time analytics by Mantequilla Soft.`,
  };
}
