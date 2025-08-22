import Head from 'next/head';

export default function ModalPage() {
  return (
    <div>
      <Head>
        <title>Asset Management</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Asset Management Page</h1>
        <p>This page corresponds to the old <code>modal.html</code>.</p>
        <p>Functionality will be migrated here.</p>
        <a href="/">Go back to main page</a>
      </main>
    </div>
  );
}
