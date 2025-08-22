import Head from 'next/head';

export default function MemoryPage() {
  return (
    <div>
      <Head>
        <title>Memory</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Memory Page</h1>
        <p>This page corresponds to the old <code>memory.html</code>.</p>
        <p>Functionality will be migrated here.</p>
        <a href="/">Go back to main page</a>
      </main>
    </div>
  );
}
