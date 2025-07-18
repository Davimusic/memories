import React, { Fragment, useState, useEffect, useRef } from 'react';
import '../../estilos/general/information.css';
import Layout from '@/components/complex/articles/layout';
import ArticleRenderer from '@/components/complex/articles/articleRenderer';



const test = {
  "slug": "nelson-mandela-international-day",
  "title": "International Nelson Mandela Day: Celebrating His Life, Legacy, and the Power of Memories",
  "seo": {
    "description": "Explore the life and enduring legacy of Nelson Mandela on International Nelson Mandela Day. Discover how his journey inspires us to preserve our own stories with Good Memories.",
    "keywords": "Nelson Mandela, International Nelson Mandela Day, legacy, memory preservation, Good Memories, social justice, inspiration, apartheid, reconciliation",
    "tags": "Nelson Mandela, legacy, memories, preservation, Good Memories, history, social justice, inspiration",
    "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/nelson-mandela-539834_640.jpg"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Culture", "path": "/culture"},
    {"label": "International Days", "path": "/culture/international-days"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [Who Was Nelson Mandela?](#who-was-nelson-mandela)\n2. [International Nelson Mandela Day](#mandela-day)\n3. [His Enduring Legacy](#legacy)\n4. [Mandela's Quotes: Words That Inspire](#quotes)\n5. [The Power of Memories](#memories)\n6. [Mandela’s Leadership Lessons](#leadership)\n7. [Preserve Your Legacy with Good Memories](#good-memories)\n8. [Inspiring Stories of Mandela’s Impact](#stories)\n9. [Mandela’s Global Influence: A Timeline](#timeline)"
    }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "who-was-nelson-mandela",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Who Was Nelson Mandela? A Life of Courage and Compassion",
              "content": [
                {
                  "text": "Nelson Rolihlahla Mandela, born on July 18, 1918, in Mvezo, South Africa, was a global icon of resilience and justice. Raised in the Thembu royal family, he pursued law and joined the African National Congress (ANC) in 1944, co-founding its Youth League. His fight against apartheid led to 27 years in prison, mostly on Robben Island. Released in 1990, Mandela negotiated the end of apartheid and became South Africa’s first Black president in 1994, fostering reconciliation. His life inspires millions to pursue equality and unity. [Learn more about his life on the Nelson Mandela Foundation website](https://www.nelsonmandela.org/biography)."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/nelson-mandela-539834_640.jpg",
              "imageAlt": "Portrait of Nelson Mandela smiling",
              "text": "Mandela’s journey from prisoner to president embodies the power of perseverance and compassion.",
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
        "referenceId": "mandela-day",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "International Nelson Mandela Day: A Global Call to Action",
              "content": [
                {
                  "text": "Declared by the United Nations in November 2009, International Nelson Mandela Day is celebrated annually on July 18, Mandela’s birthday. It encourages people to dedicate 67 minutes to community service, symbolizing the 67 years he fought for social justice. From cleanups in South Africa to human rights workshops in Mexico, this day promotes his values of equality and service. [Find out more on the UN website](https://www.un.org/en/events/mandeladay/)."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/south-africa-997558_640.jpg",
              "imageAlt": "South African flag with Nelson Mandela imagery",
              "text": "Mandela Day inspires global acts of service, reflecting his legacy of unity and compassion.",
              "layout": "left",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "legacy",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "His Enduring Legacy: Awards, Honors, and Cultural Impact",
              "content": [
                {
                  "text": "Mandela received over 250 awards, including the Nobel Peace Prize in 1993, shared with F.W. de Klerk for dismantling apartheid. His life inspired films like *Mandela: Long Walk to Freedom* (2013) and songs like 'Free Nelson Mandela' by The Specials. The Nelson Mandela Foundation and Children’s Fund continue his work in education and human rights. [Explore his legacy on Britannica](https://www.britannica.com/biography/Nelson-Mandela)."
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Education is the most powerful weapon which you can use to change the world.",
              "author": "Nelson Mandela",
              "source": "Speech at the launch of Mindset Network, 2003",
              "sourceUrl": "https://www.nelsonmandela.org/biography"
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/politician-150383_640.webp",
              "imageAlt": "Nelson Mandela addressing a crowd",
              "text": "Mandela’s leadership continues to shape a more just world.",
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
        "referenceId": "quotes",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Mandela's Quotes: Words That Inspire",
              "content": [
                {
                  "text": "Mandela’s words carry timeless wisdom, inspiring action and reflection. Here are some of his most impactful quotes, drawn from his speeches and writings."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Inspirational Quotes by Nelson Mandela",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "- 'It always seems impossible until it’s done.' (*Long Walk to Freedom*, 1994)\n- 'The greatest glory in living lies not in never falling, but in rising every time we fall.' (Speech, 1990)\n- 'For to be free is not merely to cast off one’s chains, but to live in a way that respects and enhances the freedom of others.' (*Long Walk to Freedom*, 1994) [Read more quotes on Biography.com](https://www.biography.com/political-figures/nelson-mandela)."
                      }
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
        "referenceId": "memories",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Power of Memories in Honoring History",
              "content": [
                {
                  "text": "Memories bridge the past and future, preserving lessons of courage and compassion. Mandela’s letters from prison and recorded speeches, preserved by organizations like the Nelson Mandela Foundation, inspire generations. Similarly, documenting personal stories ensures their impact endures. [Discover more about his preserved works](https://www.nelsonmandela.org/)."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/man-156732_1280.webp",
              "imageAlt": "Symbolic image of unity and reflection",
              "text": "Preserving memories honors those who shape our lives and histories.",
              "layout": "left",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "leadership",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Mandela’s Leadership Lessons: A Guide for Today",
              "content": [
                {
                  "text": "Mandela’s leadership was defined by humility, patience, and reconciliation. He listened to adversaries, endured decades of hardship, and forgave to unite a nation. These principles guide modern leaders and inspire us to document our own journeys of impact. [Learn more about his leadership](http://www.mandela.gov.za/biography/)."
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
        "referenceId": "good-memories",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Preserve Your Legacy with Good Memories",
              "content": [
                {
                  "text": "Inspired by Mandela’s legacy, Good Memories empowers you to preserve your stories. Our platform securely stores photos, videos, and narratives, organized by emotional significance, so you can relive and share moments that matter. Create a digital legacy that inspires, just as Mandela’s story does."
                }
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Start Preserving Your Memories",
              "description": "Join Good Memories to keep your most meaningful moments alive. Create your digital memory vault today!",
              "buttonText": "Get Started Now",
              "href": "https://goodmemories.live",
              "variant": "primary"
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ai-generated-8194044_640.png",
              "imageAlt": "Digital memory vault illustration",
              "text": "Good Memories helps you build a lasting tribute to your life’s moments.",
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
        "referenceId": "stories",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Inspiring Stories of Mandela’s Impact",
              "content": [
                {
                  "text": "These videos capture Nelson Mandela’s global influence and the celebration of his legacy, showcasing how his life continues to inspire action and change."
                }
              ]
            }
          },
          {
            "type": "embed",
            "props": {
              "type": "iframe",
              "src": "https://www.youtube.com/embed/FV-c2FnPnDE?si=VLy_qjWOGkTWelsr",
              "title": "Nelson Mandela’s Life and Legacy",
              "description": "This video explores the key moments of Nelson Mandela’s life and his global impact.",
              "width": "560",
              "height": "315",
              "allowFullScreen": true
            }
          },
          {
            "type": "embed",
            "props": {
              "type": "iframe",
              "src": "https://www.youtube.com/embed/zEuoLPUSDEw?si=K50BfegDu7oRGRfj",
              "title": "Mandela Day: Inspiring Change",
              "description": "A tribute to Mandela Day, showcasing how his legacy inspires action worldwide.",
              "width": "560",
              "height": "315",
              "allowFullScreen": true
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "timeline",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Mandela’s Global Influence: A Timeline",
              "content": [
                {
                  "text": "Key moments in Nelson Mandela’s life highlight his profound impact on the world. [See a detailed timeline on Google Arts & Culture](https://artsandculture.google.com/story/a-brief-history-of-nelson-mandela-s-life-nelson-mandela-centre-of-memory/8gXhEWID5fOgLA?hl=en)."
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Year", "Event"],
              "rows": [
                ["1918", "Born in Mvezo, South Africa"],
                ["1944", "Co-founds the ANC Youth League"],
                ["1964", "Sentenced to life imprisonment in the Rivonia Trial"],
                ["1990", "Released from prison after 27 years"],
                ["1993", "Awarded the Nobel Peace Prize"],
                ["1994", "Elected South Africa’s first Black president"],
                ["2013", "Passes away at age 95"]
              ]
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "International Nelson Mandela Day: Celebrating His Life, Legacy, and the Power of Memories",
      "description": "Discover the life and legacy of Nelson Mandela on International Nelson Mandela Day, and learn how Good Memories helps you preserve your own stories.",
      "url": "https://goodmemories.live/culture/international-days/nelson-mandela-international-day",
      "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/nelson-mandela-539834_640.jpg",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-18T12:00:00-05:00",
  "createdAt": "2025-07-18T09:00:00-05:00"
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
  "slug": "celebrating-new-pet",
  "title": "Celebrating the Arrival of a New Pet: Crafting Unforgettable Family Memories",
  "seo": {
    "description": "Welcoming a new pet is a joyful milestone. Explore creative ways to bond, capture, and preserve these moments with Project Memories, backed by science and expert insights.",
    "keywords": "new pet, pet adoption, family memories, pet bonding, digital memory preservation, Project Memories, pet care",
    "tags": "pets, family, memory preservation, pet adoption, digital memories, animal bonding",
    "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%2011%20jul%202025%2C%2008_59_55%20a.m..png"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Lifestyle", "path": "/lifestyle"},
    {"label": "Pets", "path": "/lifestyle/pets"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [A New Family Member](#introduction)\n2. [Creative Bonding Ideas](#bonding)\n3. [Capturing the Magic](#capturing-moments)\n4. [The Science of Pet Bonds](#neuroscience)\n5. [Preserve with Good Memories](#project-memories)\n6. [Expert Tips for New Pet Owners](#tips)\n7. [Inspiring Pet Videos](#videos)"
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "introduction",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "A New Family Member: The Joy of a New Pet",
              "content": [
                {
                  "text": "The moment a new pet bounds into your home, tail wagging or whiskers twitching, is nothing short of magical. Whether it’s a fluffy kitten tumbling over its own paws, a curious rabbit nibbling on a carrot, or a rescue dog gazing at you with grateful eyes, these first encounters weave a tapestry of memories that bind families together. According to the American Pet Products Association’s 2023–2024 National Pet Owners Survey, 66% of U.S. households share their lives with pets, and the emotional bonds formed in the early days are pivotal for lifelong companionship.",
                  "continueText": "This article explores creative ways to celebrate your new pet, from building bonds to preserving those fleeting moments with Project Memories."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%2011%20jul%202025%2C%2008_59_55%20a.m..png",
              "imageAlt": "Cartoon family joyfully welcoming a new dog",
              "text": "The spark of joy from a new pet is universal, whether it’s a dog, cat, or rabbit. These moments are the foundation of a lifelong bond.",
              "layout": "right",
              "imageSize": "large"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "bonding",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Creative Ways to Bond with Your New Pet",
              "content": [
                {
                  "text": "Welcoming a pet isn’t just about providing food and shelter—it’s about crafting shared experiences that deepen your connection. Dr. Stanley Coren, in his book *The Intelligence of Dogs* (2021), highlights that interactive play and positive reinforcement trigger oxytocin release in both pets and owners, fostering trust and affection. Try hosting a 'pet welcome party' with family members, complete with pet-safe treats and games, or create a 'pet adventure journal' to document your first outings together, whether with a playful pup or a curious bunny."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Unique Bonding Activities",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "- **Pet Scavenger Hunt**: Hide treats around the house for your pet to find, encouraging exploration and trust.\n- **Storytime Snuggles**: Read aloud to your pet in a calm voice to soothe them and build familiarity, perfect for cats or rabbits.\n- **DIY Pet Toy Craft**: Create a toy together, like a braided rope for dogs or a cardboard tunnel for rabbits, to spark joy and teamwork."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "text",
            "props": {
              "content": [
                {
                  "text": "These activities not only strengthen bonds but also create vivid memories. The ASPCA notes that consistent, positive interactions in the first month increase pet retention rates by 25%.",
                  "continueText": "Learn more about pet bonding at [ASPCA’s Pet Care Guide](https://www.aspca.org/pet-care)."
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
        "referenceId": "capturing-moments",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Capturing the Magic of Your Pet’s First Days",
              "content": [
                {
                  "text": "From the first curious sniff of a kitten to the triumphant moment your rabbit hops into its new burrow, these early days are brimming with moments worth preserving. A 2024 PetMD survey revealed that 78% of pet owners capture photos or videos within the first week, with 62% sharing them on social platforms. Why not go beyond the selfie? Create a themed photo shoot with props like tiny bow ties for your cat or a cozy blanket for your dog to make those memories pop."
                }
              ]
            }
          },
          {
            "type": "contentSlider",
            "props": {
              "contents": [
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%2011%20jul%202025%2C%2008_59_52%20a.m..png",
                    "imageAlt": "Cartoon family with a new cat exploring",
                    "text": "Stage a fun photo shoot to capture your cat’s curious personality."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%2011%20jul%202025%2C%2008_59_48%20a.m..png",
                    "imageAlt": "Cartoon family with a new rabbit",
                    "text": "Record your rabbit’s first hop for a lasting memory."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250711_090002.png",
                    "imageAlt": "Cartoon family playing with a new dog",
                    "text": "Document your dog’s first outdoor adventure to cherish forever."
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
        "referenceId": "neuroscience",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Science Behind Pet-Human Bonds",
              "content": [
                {
                  "text": "The joy of a new pet isn’t just heartwarming—it’s rooted in neuroscience. Research by Dr. Lisa Feldman Barrett (Northeastern University, 2023) shows that pet interactions activate the amygdala and prefrontal cortex, enhancing emotional memory encoding. A 2022 study from the University of British Columbia found that petting a dog for just 10 minutes reduces cortisol levels by 15%, reinforcing positive memories. These neural ‘snapshots’ make pet moments unforgettable, whether with a dog, cat, or rabbit.",
                  "continueText": "Read more at [UBC’s Human-Animal Interaction Study](https://www.ubc.ca/news/2022/petting-dogs-reduces-stress)."
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Interacting with a pet creates neural patterns that anchor emotional memories, making them vivid and lasting.",
              "author": "Dr. Lisa Feldman Barrett",
              "source": "Northeastern University",
              "sourceUrl": "https://www.northeastern.edu/research"
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
              "title": "Preserve Your Pet Memories with Good Memories",
              "content": [
                {
                  "text": "Every wag, purr, or hop deserves to be cherished forever. Project Memories uses neuroscience-backed features to organize your pet photos, videos, and stories by emotional significance, ensuring you can relive the magic of your pet’s arrival anytime. With secure storage and sharing options, it’s the perfect way to keep your family’s newest member’s memories alive, whether they’re a playful dog, a curious cat, or a cuddly rabbit."
                }
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Save Your Pet Memories Today",
              "description": "Join Good Memories to securely store and relive the joy of your new pet. Start building your digital memory vault now!",
              "buttonText": "Start Preserving Now",
              "href": "https://goodmemories.live",
              "variant": "primary"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "tips",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Expert Tips for New Pet Owners",
              "content": [
                {
                  "text": "To ensure a smooth transition for your new pet, experts from the Humane Society recommend the following:"
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Tip", "Description", "Source"],
              "rows": [
                ["Regular Vet Visits", "Schedule a checkup within 72 hours to monitor health.", "Humane Society, https://www.humanesociety.org/resources/pet-care"],
                ["Photo Journaling", "Document daily moments to track growth and behavior.", "PetMD, https://www.petmd.com/pet-care"],
                ["Socialization", "Expose your pet to new people and environments gradually.", "ASPCA, https://www.aspca.org/pet-care/animal-behavior"]
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "videos",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Inspiring Videos on Pet-Human Connections",
              "content": [
                {
                  "text": "Explore the profound bond between humans and pets through these insightful videos, highlighting the emotional and psychological benefits of pet companionship."
                }
              ]
            }
          },
          {
            "type": "embed",
            "props": {
              "type": "iframe",
              "src": "https://www.youtube.com/embed/gp_ChjQQPnU?si=suxjoG42-KYEyJfN",
              "title": "Connection Between Animals and Humans | TEDx",
              "description": "This TEDx talk explores the deep emotional connections between humans and animals, emphasizing the mutual benefits of companionship.",
              "width": "560",
              "height": "315",
              "allowFullScreen": true
            }
          },
          {
            "type": "embed",
            "props": {
              "type": "iframe",
              "src": "https://www.youtube.com/embed/q1adV0O7JmA?si=y98I04pQqxoom3ya",
              "title": "Dogs & Us - The Secrets of an Unbreakable Friendship | DW Documentary",
              "description": "This DW Documentary delves into the science and history behind the unbreakable bond between dogs and humans, showcasing their unique friendship.",
              "width": "560",
              "height": "315",
              "allowFullScreen": true
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "Celebrating the Arrival of a New Pet: Crafting Unforgettable Family Memories",
      "description": "Discover creative ways to bond with your new pet and preserve those moments with Project Memories. Backed by science and expert insights.",
      "url": "https://goodmemories.live/lifestyle/pets/celebrating-new-pet",
      "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%2011%20jul%202025%2C%2008_59_55%20a.m..png",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-11T09:13:00Z",
  "createdAt": "2025-07-11T07:00:00Z"
}
Instructions
Generate articles using the above components, ensuring each block’s props match the required data.
Always start with title and TableOfContents for SEO and navigation.
Include a createSectionWrapper with a CTABlock promoting goodmemories in every article, linking to https://goodmemories.live.
Use relevant keywords in seo fields and content to align with good Memories’ mission.
Ensure all content complies with the platform’s Terms and Conditions (e.g., no illegal content, respect for intellectual property).

 */


























