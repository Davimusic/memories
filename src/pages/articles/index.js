import React, { Fragment, useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import MemoryLogo from '@/components/complex/memoryLogo';
import '../../estilos/general/articlesIndex.css';
import '../../estilos/general/information.css';
import Layout from '@/components/complex/articles/layout';
import Breadcrumb from '@/components/complex/articles/breadcrumb';

const ArticlesList = ({ articles }) => {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Articles', path: '/articles' },
  ];

  // Sort articles by updatedAt in descending order (newest first)
  const sortedArticles = [...articles].sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  if (!articles || articles.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Articles | Good Memories</title>
          <meta name="description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        </Head>
        <div className="articles-list-container">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="articles-title">Articles</h1>
          <p className="no-articles">No articles found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Articles | Good Memories</title>
        <meta name="description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        <meta name="keywords" content="memory, neuroscience, psychology, articles, learning" />
        <meta property="og:title" content="Articles | Good Memories" />
        <meta property="og:description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        <meta property="og:type" content="website" />
      </Head>
      <div className="articles-list-container">
        <Breadcrumb items={breadcrumbs} />
        <h1 className="articles-title">Articles</h1>
        <div className="articles-grid">
          {sortedArticles.map((article, index) => (
            <div key={index} className="article-card">
              {article.seo.image && (
                <div className="article-image">
                  <Image
                    src={article.seo.image}
                    alt={article.title}
                    width={300}
                    height={200}
                    className="article-thumbnail"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="article-content">
                <h2 className="article-card-title">{article.title}</h2>
                <p className="article-description">{article.seo.description}</p>
                <Link 
                  href={`/articles/${article.slug}`} 
                  className="article-link"
                >
                  Read More
                </Link>
                <div className="article-meta">
                  <span className="article-date">
                    {new Date(article.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {article.seo.tags && (
                    <div className="article-tags">
                      {article.seo.tags.split(',').map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ArticlesList;

export async function getServerSideProps(context) {
  const isLocal = process.env.NODE_ENV === 'development';
  const baseUrl = isLocal
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseUrl}/api/mongoDb/dinamicArticles/getAllArticles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error fetching articles:', result.message);
      return {
        props: {
          articles: [],
        },
      };
    }

    return {
      props: {
        articles: result.data || [],
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', {
      message: error.message,
      stack: error.stack,
    });
    return {
      props: {
        articles: [],
      },
    };
  }
}

































/*const ArticlesList = ({ articles }) => {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Articles', path: '/articles' },
  ];

  if (!articles || articles.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Articles | Good Memories</title>
          <meta name="description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        </Head>
        <div className="articles-list-container">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="articles-title">Articles</h1>
          <p className="no-articles">No articles found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Articles | Good Memories</title>
        <meta name="description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        <meta name="keywords" content="memory, neuroscience, psychology, articles, learning" />
        <meta property="og:title" content="Articles | Good Memories" />
        <meta property="og:description" content="Explore our collection of articles on memory formation, neuroscience, and more." />
        <meta property="og:type" content="website" />
      </Head>
      <div className="articles-list-container">
        <Breadcrumb items={breadcrumbs} />
        <h1 className="articles-title">Articles</h1>
        <div className="articles-grid">
          {articles.map((article, index) => (
            <div key={index} className="article-card">
              {article.seo.image && (
                <div className="article-image">
                  <Image
                    src={article.seo.image}
                    alt={article.title}
                    width={300}
                    height={200}
                    className="article-thumbnail"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="article-content">
                <h2 className="article-card-title">{article.title}</h2>
                <p className="article-description">{article.seo.description}</p>
                <Link 
                  href={`/articles/${article.slug}`} 
                  className="article-link"
                >
                  Read More
                </Link>
                <div className="article-meta">
                  <span className="article-date">
                    {new Date(article.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {article.seo.tags && (
                    <div className="article-tags">
                      {article.seo.tags.split(',').map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ArticlesList;

export async function getServerSideProps(context) {
  const isLocal = process.env.NODE_ENV === 'development';
  const baseUrl = isLocal
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseUrl}/api/mongoDb/dinamicArticles/getAllArticles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error fetching articles:', result.message);
      return {
        props: {
          articles: [],
        },
      };
    }

    return {
      props: {
        articles: result.data || [],
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', {
      message: error.message,
      stack: error.stack,
    });
    return {
      props: {
        articles: [],
      },
    };
  }
}*/