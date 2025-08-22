import Head from 'next/head';

export default function SniperPage() {
  return (
    <div>
      <Head>
        <title>Sniper</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Sniper Page</h1>
        <p>This page corresponds to the old <code>sniper.html</code>.</p>
        <p>Functionality will be migrated here.</p>
        <a href="/">Go back to main page</a>
      </main>
    </div>
  );
}
