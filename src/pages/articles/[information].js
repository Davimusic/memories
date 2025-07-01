import React, { Fragment, useState, useEffect, useRef } from 'react';
import '../../estilos/general/information.css';
import Layout from '@/components/complex/articles/layout';
import ArticleRenderer from '@/components/complex/articles/articleRenderer';



const test = {
  "slug": "creative-ways-to-preserve-your-memories",
  "title": "Creative Ways to Preserve Your Memories with Good Memories",
  "seo": {
    "description": "Explore creative methods to preserve your digital memories with Good Memories, a secure platform for protecting and sharing special moments.",
    "keywords": "preserve memories, digital memories, Good Memories, cloud storage, personal memory, digital albums",
    "tags": "memories, digital preservation, technology, Good Memories, family memories",
    "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/18%20jun%202025%2C%2003_33_03%20p.m..png"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Guides", "path": "/guides"},
    {"label": "Preserve Memories", "path": "/guides/preserve-memories"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [Importance of Preserving Memories](#intro)\n2. [Traditional Methods](#traditional)\n3. [Modern Digital Solutions](#digital)\n4. [Good Memories: Your Ideal Solution](#good-memories)\n5. [How to Get Started](#get-started)\n6. [Conclusion](#conclusion)"
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "intro",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Importance of Preserving Memories",
              "content": [
                {"text": "Memories form the fabric of our identity. From a child’s first birthday to an unforgettable trip, these moments deserve to be protected. However, the fragility of digital technology, such as hardware failures or platform changes, puts these treasures at risk."},
                {"text": "According to ", "highlight": "MIT Technology Review", "continueText": " ([MIT Technology Review](https://www.technologyreview.com/2023/05/22/1073442/how-to-preserve-your-digital-memories/)), there is no guarantee of digital permanence, highlighting the need for reliable solutions like Good Memories."}
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/18%20jun%202025%2C%2003_33_03%20p.m..png",
              "imageAlt": "Child celebrating birthday",
              "text": "Moments like birthdays capture the joy of growing up. Preserve them digitally with Good Memories to relive them forever.",
              "layout": "right",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "traditional",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Traditional Preservation Methods",
              "content": [
                {"text": "Traditional methods, like photo albums and journals, have a nostalgic charm but are vulnerable to physical deterioration and take up space. According to ", "highlight": "Remento", "continueText": " ([Remento](https://www.remento.co/journal/creative-ways-to-preserve-family-memories-and-pass-them-down)), these methods are less practical in the digital age."}
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250701_140440.png",
              "imageAlt": "Traditional photo album",
              "text": "Physical albums are beautiful but require care to avoid damage. Digital solutions are more durable.",
              "layout": "left",
              "imageSize": "medium"
            }
          },
          {
            "type": "contentSlider",
            "props": {
              "contents": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {"text": "Photo albums: Visually organize your memories, but they fade over time."}
                    ]
                  }
                },
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {"text": "Journals: Capture personal stories, but are limited by physical space."}
                    ]
                  }
                },
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {"text": "Memory boxes: Store physical objects, but are hard to share."}
                    ]
                  }
                }
              ],
              "autoSlide": true,
              "slideInterval": 3000,
              "size": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "digital",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Modern Digital Solutions",
              "content": [
                {"text": "Digital solutions offer accessibility, security, and unlimited storage. The ", "highlight": "Library of Congress", "continueText": " ([Library of Congress](https://digitalpreservation.gov/personalarchiving/)) highlights methods like:"},
                {"text": "- Downloading files to hard drives for backups."},
                {"text": "- Using Google’s Inactive Account Manager to manage data."},
                {"text": "- Archiving content on the Internet Archive."},
                {"text": "- Digitizing old photos and videos with apps or services."},
                {"text": "Other platforms, like ", "highlight": "Confinity", "continueText": " ([Confinity](https://www.confinity.com/culture/best-online-platforms-for-family-history-preservation)), offer tools to create family digital libraries."}
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Tips for Digital Preservation",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {"text": "- Use metadata to organize files.\n- Back up to multiple platforms.\n- Choose durable formats like JPEG or MP4.\n- Regularly check file integrity."}
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "content": "| Platform | Key Features |\n|----------|--------------|\n| Good Memories | Secure storage, flexible privacy, easy organization |\n| Ancestry | Family trees, historical records |\n| Remento | AI-powered storybooks |\n| FamilySearch Memories | Oral history capture |"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "good-memories",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Good Memories: Your Ideal Solution",
              "content": [
                {"text": "Good Memories stands out for its focus on security, privacy, and ease of use. Unlike Ancestry, which focuses on genealogy, or Remento, which creates storybooks, Good Memories offers a comprehensive solution for storing and sharing photos, videos, and more, respecting the emotional value of your memories."},
                {"text": "With public, private, or invitation-based visibility options, you control who accesses your memories, ensuring your most cherished moments are protected. Join our mission to transform how people preserve and leverage their digital memories."}
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Preserve Your Memories Today!",
              "description": "Join Good Memories to securely store and share your most cherished moments. Sign up now to start protecting your digital legacy.",
              "buttonText": "Create an Account",
              "href": "https://goodmemories.live",
              "variant": "primary",
              "icon": "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12h14M12 5l7 7-7 7'/></svg>"
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Your memories are a treasure. Protect them with Good Memories to relive them forever.",
              "author": "Good Memories Team"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "get-started",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "How to Get Started with Good Memories",
              "content": [
                {"text": "Getting started with Good Memories is simple. Follow these steps to preserve your digital memories and reconnect with your most inspiring moments:"}
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "content": "| Step | Description |\n|------|-------------|\n| 1 | Create an account at https://goodmemories.live |\n| 2 | Upload photos, videos, and other digital memories |\n| 3 | Organize your memories into collections |\n| 4 | Set privacy options to control access |"
            }
          },
          {
            "type": "contentSlider",
            "props": {
              "contents": [
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/18%20jun%202025%2C%2003_33_03%20p.m..png",
                    "imageAlt": "Child at birthday",
                    "text": "Upload special moments like birthdays.",
                    "layout": "top",
                    "imageSize": "small"
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250701_140440.png",
                    "imageAlt": "Digital album",
                    "text": "Organize your memories in digital albums.",
                    "layout": "top",
                    "imageSize": "small"
                  }
                }
              ],
              "autoSlide": true,
              "slideInterval": 4000,
              "size": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "conclusion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Conclusion",
              "content": [
                {"text": "Preserving your digital memories is crucial for keeping your personal story alive. With Good Memories, you can protect and share your most cherished moments securely and easily, fostering greater appreciation for those often-overlooked moments. Don’t wait to get started!"}
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Start Now!",
              "description": "Sign up for Good Memories and secure your memories for the future. Contact davipianof@gmail.com for any questions.",
              "buttonText": "Join Good Memories",
              "href": "https://goodmemories.live",
              "variant": "primary",
              "icon": "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12h14M12 5l7 7-7 7'/></svg>"
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "Creative Ways to Preserve Your Memories with Good Memories",
      "description": "Explore creative methods to preserve your digital memories with Good Memories, a secure platform for protecting and sharing special moments.",
      "url": "https://goodmemories.live/guides/preserve-memories",
      "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/18%20jun%202025%2C%2003_33_03%20p.m..png",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-01T14:46:00Z",
  "createdAt": "2025-07-01T12:00:00Z"
}


export default function ArticlePage({ article }) {
  return (
    <Layout>
      <ArticleRenderer article={article} /> {/* Use the article prop instead of articlesData */}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { information } = context.params;

  console.log('information:', information);

  const isLocal = process.env.NODE_ENV === 'development';
  const baseUrl = isLocal 
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${baseUrl}/api/mongoDb/dinamicArticles/articles/${information}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorResult = await response.json();
      console.error('Error fetching article:', errorResult.message);
      return {
        notFound: true,
      };
    }

    const result = await response.json();

    console.log('Fetched article:', result);

    return {
      props: {
        article: result.data, // Ensure this matches the structure expected by ArticleRenderer
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', {
      message: error.message,
      stack: error.stack,
      slug: information,
    });
    return {
      notFound: true,
    };
  }
}



/** promtp
You are tasked with creating SEO-optimized articles for a website using a set of predefined React components. Each article must promote Project Memories, a platform dedicated to preserving and valuing digital memories, as described below. Follow the component specifications, ensure SEO maximization, and include a promotional section for Project Memories in every article.

About Project Memories
Project Memories is a platform that empowers users to preserve, value, and reconnect with their digital memories. Its mission is to enhance the value of users' digital memories, enabling them to reconnect with experiences that inspire and foster appreciation for often-overlooked moments. The vision is to become a leading global platform, embraced by millions, transforming how people preserve and leverage memories. Values include respect for user content, individual responsibility, security, and transparency. Goals include launching an optimized beta, driving digital visibility through organic growth, and building a user base of 10,000–20,000 active users. Users are responsible for uploaded content, which must comply with legal standards, and the platform offers public, private, or invitation-based visibility options. Contact: davipianof@gmail.com. For full terms, refer to the platform’s Terms and Conditions.

Component Specifications
Below are the components available for structuring articles, their purpose, and required data:

ArticleRenderer
Purpose: Renders the entire article, including title, SEO metadata, breadcrumbs, content, and footer with tags.
Required Data:
title (string): Article title.
seo (object): Contains description (string), keywords (string), tags (string), image (string).
breadcrumbs (array): Objects with label (string) and path (string).
content (array): List of content blocks.
structuredData (object): OpenGraph data for SEO (e.g., title, description, url, image, type).
updatedAt, createdAt (string): ISO format dates.
ContentBlockRenderer
Purpose: Renders individual content blocks based on their type.
Required Data:
type (string): Component type (e.g., "text", "imageText").
props (object): Component-specific properties.
Breadcrumb
Purpose: Displays navigation breadcrumbs.
Required Data:
items (array): Objects with label (string) and path (string).
separator (string, optional): Default "/".
color (string, optional): Default "primary".
TableOfContents
Purpose: Generates a table of contents with links that trigger smooth scrolling to sections.
Required Data:
content (string): Markdown list with links (e.g., "1. Section").
CreateSectionWrapper
Purpose: Wraps sections with an ID for internal navigation.
Required Data:
referenceId (string): Unique section ID.
children (array): Child components.
Paragraphs
Purpose: Renders text paragraphs with support for bold and links.
Required Data:
data (object):
title (string, optional): Paragraph title.
content (array): Objects with text (string), highlight (string, optional), continueText (string, optional).
ImageTextBlock
Purpose: Combines an image with text for SEO and user engagement.
Required Data:
imageUrl (string): Image URL.
imageAlt (string): Alt text for SEO.
text (string): Descriptive text.
layout (string, optional): "left", "right", "top" (default "left").
imageSize (string, optional): "small", "medium", "large" (default "medium").
Accordion
Purpose: Displays collapsible content for additional information.
Required Data:
title (string): Accordion title.
children (array): Child components.
defaultOpen (boolean, optional): Default false.
TableRenderer
Purpose: Renders tables from structured data.
Required Data:
content (string): Markdown table (e.g., "| A | B |\n|---|---|\n| 1 | 2 |").
Or: headers (array) and rows (array of arrays).
CTABlock
Purpose: Displays a call-to-action to guide users.
Required Data:
title (string): CTA title.
description (string): CTA description.
buttonText (string): Button text.
href (string): Destination URL.
variant (string, optional): "primary", "secondary".
icon (string, optional): HTML icon code.
CustomQuote
Purpose: Displays a quote with an author for credibility.
Required Data:
quote (string): Quote text.
author (string): Quote author.
ContentSlider
Purpose: Creates an interactive content carousel.
Required Data:
contents (array): Objects with type and props for each slide.
autoSlide (boolean, optional): Default false.
slideInterval (number, optional): Default 1000ms.
size (string, optional): "small", "medium", "large" (default "medium").
FeedbackForm
Purpose: Renders a user feedback form.
Required Data:
Form-specific properties (e.g., fields).
onSubmit (function, optional): Default logs to console.
SEO Guidelines
Structure: Start with the article title, followed by a TableOfContents with links to section referenceIds for smooth scrolling.
Content: Use ImageTextBlock for keyword-rich text and images, CTABlock for user actions, and Accordion for supplementary content.
Metadata: Include complete seo object with descriptive description, relevant keywords, and tags. Add structuredData for OpenGraph.
Project Memories Promotion
In every article, include a dedicated section promoting Project Memories using a createSectionWrapper with a CTABlock. Highlight the platform’s mission to preserve digital memories and encourage users to join via a link to https://goodmemories.live. Example:

Title: "Preserve Your Memories with Project Memories"
Description: "Join Project Memories to securely store and relive your most cherished moments. Our platform empowers you to preserve your digital memories with ease and security."
Button: "Start Preserving Now" (links to https://goodmemories.live).
JSON Example
Below is an example JSON structure for an article, including a Project Memories promotional section:

json



{
  "slug": "preserve-digital-memories-guide",
  "title": "How to Preserve Your Digital Memories Effectively",
  "seo": {
    "description": "Learn effective techniques to preserve your digital memories with Project Memories.",
    "keywords": "digital memories, preserve memories, memory preservation, Project Memories",
    "tags": "technology, memories, preservation, Project Memories",
    "image": "https://goodmemories.live/images/memory-preservation.jpg"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Guides", "path": "/guides"},
    {"label": "Digital Memories", "path": "/guides/digital-memories"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [Why Memories Matter](#intro)\n2. [Preservation Techniques](#techniques)\n3. [Join Project Memories](#project-memories)"
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "intro",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Why Memories Matter",
              "content": [
                {"text": "Memories shape our identity and emotional well-being."}
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemories.live/images/family.jpg",
              "imageAlt": "Family memories",
              "text": "Preserving memories strengthens emotional connections.",
              "layout": "right",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "techniques",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Preservation Techniques",
              "content": [
                {"text": "Use these methods to safeguard your memories:"}
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "content": "| Method | Benefit |\n|--------|--------|\n| Cloud Storage | Secure and accessible |\n| Digital Albums | Organized memories |"
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Advanced Tips",
              "defaultOpen": false,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {"text": "- Use metadata for better organization.\n- Regularly back up files."}
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "project-memories",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Preserve Your Memories with Project Memories",
              "content": [
                {"text": "Join Project Memories to securely store and relive your most cherished moments. Our platform empowers you to preserve your digital memories with ease and security, respecting your content and privacy."}
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Start Preserving Now",
              "description": "Sign up today to protect your memories with Project Memories.",
              "buttonText": "Join Now",
              "href": "https://goodmemories.live",
              "variant": "primary"
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "How to Preserve Your Digital Memories Effectively",
      "description": "Learn effective techniques to preserve your digital memories with Project Memories.",
      "url": "https://goodmemories.live/guides/digital-memories",
      "image": "https://goodmemories.live/images/memory-preservation.jpg",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-01T12:00:00Z",
  "createdAt": "2025-07-01T10:00:00Z"
}
Instructions
Generate articles using the above components, ensuring each block’s props match the required data.
Always start with title and TableOfContents for SEO and navigation.
Include a createSectionWrapper with a CTABlock promoting Project Memories in every article, linking to https://goodmemories.live.
Use relevant keywords in seo fields and content to align with Project Memories’ mission.
Ensure all content complies with the platform’s Terms and Conditions (e.g., no illegal content, respect for intellectual property).
For any questions or to report issues, include a reference to contact: davipianof@gmail.com.
 */


























