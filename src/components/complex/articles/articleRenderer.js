import React, { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Breadcrumb from './breadcrumb';
import ContentBlockRenderer from './contentBlockRenderer';


const ArticleRenderer = ({ article }) => {
  const router = useRouter();
  const canonicalUrl = `https://www.goodmemories.live${router.asPath}`;

  if (!article) return <div>Loading article...</div>;

  return (
    <Fragment>
      <Head>
        <title>{article.title}</title>
        <meta name="description" content={article.seo.description} />
        <meta name="keywords" content={article.seo.keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.seo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={article.seo.image} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.seo.description} />
        <meta name="twitter:image" content={article.seo.image} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": article.title,
              "description": article.seo.description,
              "author": {
                "@type": "Person",
                "name": article.author || "Good Memories",
              },
              "datePublished": article.datePublished || "2025-06-18T12:00:00Z",
              "image": article.seo.image
            }),
          }}
        />
      </Head>
      <div className="article-container">
        <article>
          <Breadcrumb items={article.breadcrumbs} />
          <div className="article-header">
            <h1>{article.title}</h1>
            <p>{article.seo.description}</p>
          </div>
          {article.content.map((block, index) => (
            <ContentBlockRenderer key={index} block={block} />
          ))}
          <div className="article-footer">
            <div className="tags-container">
              {article?.seo?.tags ? (
                article.seo.tags.split(',').map((tag, index) => (
                  <span key={index} className="tag">{tag.trim()}</span>
                ))
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </Fragment>
  );
};

export default ArticleRenderer