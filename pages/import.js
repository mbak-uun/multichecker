import Head from 'next/head';

export default function ImportPage() {
  return (
    <div>
      <Head>
        <title>Import</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Import Page</h1>
        <p>This page corresponds to the old <code>import.html</code>.</p>
        <p>Functionality will be migrated here.</p>
        <a href="/">Go back to main page</a>
      </main>
    </div>
  );
}
