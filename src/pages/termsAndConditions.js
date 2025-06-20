import React from 'react';
import Head from 'next/head';
import Layout from '@/components/complex/articles/layout';
import '../estilos/general/articles/termsAndCondition.css';
import termsAndConditions from '@/functions/memories/login/termsAndConditions';

export default function TermsAndConditions() {
  return (
    <Layout>
      <Head>
        <title>Terms and Conditions - Project Memories</title>
        <meta name="description" content="Review the Terms and Conditions for using Project Memories, outlining user responsibilities, content policies, and platform guidelines." />
        <meta name="keywords" content="terms and conditions, Project Memories, digital memories, user responsibilities, content policies" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
      </Head>
      
      <div className="article-container terms-content">
        <section className="article-header">
          <h1>Terms and Conditions of Use</h1>
          <p>By using Project Memories, you agree to the following terms and conditions. If you do not agree, please do not use the service.</p>
        </section>

        <section className="terms-details" dangerouslySetInnerHTML={{ __html: termsAndConditions() }}>
        </section>
      </div>
    </Layout>
  );
}