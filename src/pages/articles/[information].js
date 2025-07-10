import React, { Fragment, useState, useEffect, useRef } from 'react';
import '../../estilos/general/information.css';
import Layout from '@/components/complex/articles/layout';
import ArticleRenderer from '@/components/complex/articles/articleRenderer';



const test = {
  "slug": "joyful-graduation-odyssey",
  "title": "A Joyful Graduation Odyssey: Embracing the End and Welcoming the Future",
  "seo": {
    "description": "A vibrant fictional tale of a high school graduation, filled with laughter, tears, and unforgettable moments, celebrating the end of one journey and the start of another, with tips on preserving these memories using Good Memories.",
    "keywords": "graduation story, high school graduation, life milestones, digital memory preservation, Good Memories, emotional storytelling, new beginnings",
    "tags": "graduation, life transitions, memories, storytelling, digital preservation, emotional milestones",
    "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250709_085930.png"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Stories", "path": "/stories"},
    {"label": "Graduation Odyssey", "path": "/stories/graduation-odyssey"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [The Dawn of the Big Day](#introduction)\n2. [The Ceremony: A Tapestry of Emotions](#ceremony)\n3. [Laughter and Tears](#emotions)\n4. [Reflections by the Lake](#reflections)\n5. [A Night of Celebration](#celebration)\n6. [Dreams of Tomorrow](#future)\n7. [Preserving Your Graduation with Good Memories](#good-memories)\n8. [Tips for Capturing Milestones](#tips)"
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
              "title": "The Dawn of the Big Day",
              "content": [
                {
                  "text": "The sun rose over Willow Creek High on July 9, 2025, casting a golden glow over the campus. For Elena, the day felt surreal. Her graduation cap sat proudly on her dresser, a symbol of four years of triumphs, struggles, and friendships. As she slipped into her gown, the weight of the moment settled in—this was the end of an era. The hallways, once filled with the chaos of locker slams and hurried footsteps, were now quiet, save for the excited chatter of her classmates preparing for the ceremony."
                },
                {
                  "text": "Elena paused by her locker, running her fingers over the faded stickers she’d plastered there as a freshman. Each one told a story: a concert ticket stub, a doodle from her best friend Lucas, a quote from her favorite book. Today, these small relics felt like treasures, anchoring her to a chapter that was closing."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250709_085930.png",
              "imageAlt": "Newly graduated students celebrating together",
              "text": "Graduation day pulses with a unique energy—pride, nostalgia, and anticipation blend as students stand on the cusp of new adventures.",
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
        "referenceId": "ceremony",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Ceremony: A Tapestry of Emotions",
              "content": [
                {
                  "text": "The school’s football field was transformed into a stage for dreams. Rows of chairs stretched across the grass, filled with families clutching cameras and tissues. Elena marched in the procession, her heart pounding as the band played a triumphant tune. The principal’s speech was a blur of inspiration—words about courage, growth, and the future—but when Elena’s name echoed through the speakers, the world sharpened into focus. She stepped onto the stage, gripping her diploma as her family erupted in cheers."
                },
                {
                  "text": "Across the field, Lucas, ever the jokester, struck a dramatic pose as he received his diploma, earning laughs from the crowd. Meanwhile, Elena’s friend Aisha, usually stoic, wiped away tears, overwhelmed by the moment. The ceremony was a kaleidoscope of emotions—pride, joy, and a touch of sorrow for the end of their shared journey."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/r4.png",
              "imageAlt": "Student receiving diploma on stage",
              "text": "The moment of receiving a diploma is a milestone, a tangible symbol of hard work and new beginnings.",
              "layout": "left",
              "imageSize": "medium"
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "This diploma isn’t just paper—it’s a key to the next chapter, built on every lesson and laugh we shared here.",
              "author": "Elena Martinez",
              "source": "Willow Creek High Graduation Speech, 2025"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "emotions",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Laughter and Tears",
              "content": [
                {
                  "text": "As the ceremony ended, the graduates tossed their caps into the sky, a cascade of black and gold against the sunset. Elena laughed as Lucas attempted a cartwheel, only to trip and land in a heap, his cap comically askew. The moment was pure chaos and joy, captured in a flurry of photos. But not all moments were lighthearted—Aisha stood apart, tears streaming as she hugged her younger sister, who’d be starting at Willow Creek next year."
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
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/r2.png",
                    "imageAlt": "Funny graduation photo with playful pose",
                    "text": "Lucas’s goofy antics brought laughter to the serious moment of graduation."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/r3.png",
                    "imageAlt": "Graduate crying during ceremony",
                    "text": "Aisha’s tears reflected the bittersweet farewell to high school life."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/r5.png",
                    "imageAlt": "Graduates tossing caps in celebration",
                    "text": "The cap toss—a universal symbol of freedom and achievement."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250709_085952.png",
                    "imageAlt": "Collage of four graduation moments",
                    "text": "From joy to reflection, graduation captures a spectrum of emotions."
                  }
                }
              ],
              "autoSlide": true,
              "slideInterval": 3000,
              "size": "large"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "reflections",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Reflections by the Lake",
              "content": [
                {
                  "text": "After the ceremony, Elena wandered to the lake behind the school, a quiet spot where she’d often come to think. Sitting on the shore, she reflected on her journey. High school hadn’t been easy—there were failed tests, heartbreak, and late-night group chats that kept her going. She remembered the time she and Lucas built a robot for the tech fair, only for it to malfunction spectacularly, sparking laughter instead of sparks. Those moments, she realized, were what made her who she was."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/r1.png",
              "imageAlt": "Graduate meditating by lake after ceremony",
              "text": "In quiet moments, Elena found clarity, reflecting on how far she’d come and the memories that shaped her.",
              "layout": "right",
              "imageSize": "medium"
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Defining High School Memories",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "- **The Robot Fiasco**: Elena and Lucas’s robot sparked chaos but bonded them through laughter.\n- **The Midnight Study Group**: Virtual study sessions with Aisha and others turned stress into camaraderie.\n- **The Art Project**: Elena’s mural for the school courtyard became a lasting legacy, painted with her classmates’ handprints."
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
        "referenceId": "celebration",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "A Night of Celebration",
              "content": [
                {
                  "text": "The evening unfolded at The Rusty Anchor, the town’s beloved diner. Elena, Lucas, Aisha, and their friends crowded into a booth, sharing stories over burgers and milkshakes. They laughed about the time they got lost on a field trip, cried over farewells, and made promises to stay in touch. A polaroid camera passed around, capturing goofy grins and heartfelt hugs, each snap a keepsake of their bond."
                },
                {
                  "text": "As the jukebox played an old song, Elena felt a surge of gratitude. These were the people who’d seen her at her best and worst, who’d made high school a story worth telling. She slipped a polaroid into her pocket, vowing to keep these moments close."
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Friends are the family we choose, and their laughter is the soundtrack of our memories.",
              "author": "Lucas Chen",
              "source": "Willow Creek High Yearbook, 2025"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "future",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Dreams of Tomorrow",
              "content": [
                {
                  "text": "As the night ended, Elena stood outside the diner, looking at the stars. Her friends were scattering—Lucas to art school, Aisha to a coding bootcamp, others to jobs or travels. Elena was headed to college to study marine biology, inspired by a childhood trip to the ocean. The future was daunting, but these memories—her friends, her triumphs, her failures—gave her courage. She imagined herself diving into coral reefs, carrying the spirit of Willow Creek with her."
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Friend", "Next Step", "Dream"],
              "rows": [
                ["Elena", "College (Marine Biology)", "Protecting ocean ecosystems"],
                ["Lucas", "Art School", "Creating immersive digital art"],
                ["Aisha", "Coding Bootcamp", "Building apps for social good"]
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
              "title": "Preserve Your Graduation with Good Memories",
              "content": [
                {
                  "text": "Graduation is more than a ceremony—it’s a mosaic of moments that define who you are and who you’ll become. Good Memories helps you capture and cherish these milestones, from photos of cap tosses to videos of heartfelt speeches. With secure storage and emotional tagging, you can relive the laughter, tears, and triumphs of days like Elena’s graduation, ensuring they’re never lost to time."
                },
                {
                  "text": "Whether it’s a polaroid from a diner celebration or a digital collage of your ceremony, Good Memories offers tools to organize, protect, and share your story with those who matter most."
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Feature", "Benefit", "Why It Matters"],
              "rows": [
                ["Secure Storage", "Encrypted, geographically replicated backups", "Protects memories from loss or data corruption"],
                ["Emotional Tagging", "Organize by emotions like joy or nostalgia", "Mimics how the brain recalls meaningful moments"],
                ["Controlled Sharing", "Private or invitation-based sharing options", "Connect with loved ones securely"],
                ["Review Reminders", "Prompts to revisit memories", "Strengthens emotional connections over time"]
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Save Your Graduation Story",
              "description": "Join Good Memories to preserve every laugh, tear, and cap toss from your milestone moments. Start building your digital legacy today!",
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
              "title": "Tips for Capturing Milestones",
              "content": [
                {
                  "text": "To make the most of your graduation memories, consider these tips:"
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "How to Preserve Your Graduation Moments",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "- **Capture Candid Moments**: Beyond posed photos, snap candid shots of friends laughing or family members hugging.\n- **Record Audio Clips**: Save snippets of speeches or cheers to relive the atmosphere.\n- **Use Metadata**: Tag photos with dates, locations, and emotions for easy retrieval.\n- **Backup Regularly**: Use platforms like Good Memories to ensure your files are safe.\n- **Share Selectively**: Create private albums for close friends and family to share the joy."
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "A Joyful Graduation Odyssey: Embracing the End and Welcoming the Future",
      "description": "A vibrant fictional tale of a high school graduation, filled with laughter, tears, and unforgettable moments, with tips on preserving these memories using Good Memories.",
      "url": "https://goodmemories.live/stories/graduation-odyssey",
      "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250709_085930.png",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-09T09:30:00Z",
  "createdAt": "2025-07-09T08:00:00Z"
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
  "slug": "neuroscience-family-memories",
  "title": "The Neuroscience of Family Memories: How Our Brain Archives Cherished Moments",
  "seo": {
    "description": "Comprehensive analysis based on Harvard, MIT, and UCL studies about the brain mechanisms preserving family memories, with expert interviews on emotional memory and digital preservation.",
    "keywords": "memory neuroscience, family memories, memory psychology, emotional memory, digital preservation, Project Memories",
    "tags": "neuroscience, psychology, memory, family, cognitive science",
    "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250618_143012.png"
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Science", "path": "/science"},
    {"label": "Neuroscience", "path": "/science/neuroscience"}
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "content": "1. [The Mystery of Family Memory](#introduction)\n2. [The Neurobiological Journey](#neurobiology)\n3. [Emotional vs. Episodic Memory](#emotional-memory)\n4. [Photographs as Neural Triggers](#photographs)\n5. [Interview with Dr. Elena Martínez](#interview)\n6. [Memory Preservation Technology](#technology)\n7. [Project Memories: Evidence-Based Approach](#project-memories)\n8. [Scientific References](#references)"
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
              "title": "The Mystery of Family Memory",
              "content": [
                {
                  "text": "Family memories represent one of the most complex phenomena in modern neuroscience. According to Dr. Daniel Schacter from Harvard, author of the seminal 'The Seven Sins of Memory' (Harvard University Press, 2021), 'these memories are dynamic reconstructions involving neural networks distributed across multiple brain regions.' A longitudinal study by the Max Planck Institute (2023) with 1,200 families demonstrated that events like weddings or communions activate synchronized neural patterns among participants, creating what researchers call 'collective engrams'."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/openart-image__dh2Pvtz_1750275031063_raw.jpg",
              "imageAlt": "Family reviewing intergenerational photo album",
              "text": "Neuroscientist Rodrigo Quian Quiroga (University of Leicester) explains: 'When multiple generations share a family memory, mirror neuron connections are established that reinforce collective memory. Photographs act as catalysts for this process' (Nature Reviews Neuroscience, 2022).",
              "layout": "right",
              "imageSize": "large"
            }
          },
          {
            "type": "text",
            "props": {
              "content": [
                {
                  "text": "This research aligns with findings from Princeton's Memory Lab (2023), which using fMRI demonstrated that reviewing family albums simultaneously activates:"
                },
                {
                  "text": "- Primary visual cortex (image processing)\n- Hippocampus (episodic memory)\n- Amygdala (emotional processing)\n- Medial prefrontal cortex (autobiography)",
                  "highlight": "neural networks"
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
        "referenceId": "neurobiology",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Neurobiological Journey of a Memory",
              "content": [
                {
                  "text": "The formation of lasting family memories involves three critical phases validated by Dr. Eric Kandel's research (Nobel Prize in Medicine 2000):"
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "1. Encoding: The Emotional Label",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Dr. Lisa Feldman Barrett (Northeastern University) describes in 'How Emotions Are Made' (2017) how 'the amygdala and orbitofrontal cortex collaborate to tag events as emotionally relevant'. EEG studies show this encoding occurs within the first 300ms after the event, explaining why we vividly remember moments like the first dance at a wedding."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "2. Consolidation: The Role of Sleep",
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Dr. Matthew Walker (UC Berkeley) demonstrated in 'Why We Sleep' (2017) that 'slow waves in deep sleep reproduce neural patterns identical to the original event'. His study with 120 participants showed those who slept after significant family events retained 63% more details than the control group."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "3. Reconsolidation: Dynamic Memories",
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Dr. Julia Shaw (UCL) warns in 'The Memory Illusion' (2016) that 'every retrieval modifies the original memory'. Her research shows 76% of family memories contain altered details, a neurochemical phenomenon mediated by proteins like PKMzeta."
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
        "referenceId": "emotional-memory",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Emotional Imprint on Memory",
              "content": [
                {
                  "text": "Dr. Rebecca Saxe (MIT) identified in 2023 what she calls 'emotional neural signatures'. Using machine learning and fMRI, her team can predict with 89% accuracy which family memories will persist based on activation patterns in:"
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Brain Structure", "Function", "Memory Impact"],
              "rows": [
                ["Amygdala", "Emotional processing", "Memory intensity"],
                ["Insula", "Body awareness", "Sensory memories"],
                ["Cingulate cortex", "Affective regulation", "Emotional valuation"],
                ["Hippocampus", "Spatial context", "Episodic details"]
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/ChatGPT%20Image%203%20jul%202025%2C%2005_27_20%20p.m..png",
              "imageAlt": "3D brain model showing activation during emotional memories",
              "text": "Van der Kolk's studies (University of Amsterdam, 2023) reveal that positive family memories activate more extensive neural networks than neutral ones, creating natural 'backups' across multiple brain regions.",
              "layout": "left"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "photographs",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "The Mnemonic Power of Family Images",
              "content": [
                {
                  "text": "Research by Dr. Emilio García García (Complutense University, 2023) with 150 families demonstrated that:"
                },
                {
                  "text": "- 92% could recall forgotten details when viewing old photos\n- Memory accuracy increased by 40%\n- Mirror neurons activated when sharing images across generations",
                  "highlight": "key statistics"
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Family photographs aren't mere records, but neurocognitive tools. Each viewed image triggers a memory reconsolidation cascade that reinforces our personal narratives.",
              "author": "Dr. Susan Whitfield-Gabrieli",
              "source": "Northeastern University",
              "sourceUrl": "https://web.northeastern.edu/whitfieldgabrielilab/"
            }
          },
          {
            "type": "text",
            "props": {
              "content": [
                {
                  "text": "Platforms like Google Photos and Forever have revolutionized access, but as digital archivist James Cartwright (DPC, 2023) warns: 'Digital format doesn't guarantee preservation. Without periodic migration and proper metadata, 40% of digital photos become inaccessible within 10 years'."
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
        "referenceId": "interview",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Conversation with Dr. Elena Martínez: Applied Neuroscience",
              "content": [
                {
                  "text": "The director of the Affective Neuroscience Lab in Barcelona shares key findings:"
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "On Optimal Digital Preservation",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "'Our fMRI studies show thematic organization (by emotions, not just dates) improves retrieval by 58%. Platforms like Project Memories implement this through emotional tagging, replicating how the brain naturally archives memories' (Martínez et al., Journal of Cognitive Neuroscience, 2023)."
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
        "referenceId": "technology",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Technology Serving Memory",
              "content": [
                {
                  "text": "The Digital Preservation Coalition establishes critical standards:"
                },
                {
                  "text": "1. **Open formats**: TIFF over JPEG for long-term preservation\n2. **Embedded metadata**: Dublin Core for context\n3. **Geographic replication**: 3 copies in separate locations\n4. **Checksums**: Periodic integrity verification",
                  "highlight": "ISO 14721 Protocols"
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
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250618_143012.png",
                    "imageAlt": "Example of metadata in professional digital preservation",
                    "text": "Stanford's LOCKSS system (Lots of Copies Keep Stuff Safe) is the gold standard for institutional preservation."
                  }
                },
                {
                  "type": "imageText",
                  "props": {
                    "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/openart-image_dPP1bHhp_1750274969336_raw.jpg",
                    "imageAlt": "Family interacting with digital album",
                    "text": "Multigenerational interfaces must balance accessibility with information depth."
                  }
                }
              ],
              "autoSlide": true
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
              "title": "Project Memories: Applied Neuroscience",
              "content": [
                {
                  "text": "Building on the neuroscientific principles discussed, Project Memories offers:"
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Feature", "Scientific Basis", "Implementation"],
              "rows": [
                ["Emotional timelines", "Consolidation studies (Walker, 2017)", "Organization by affective value"],
                ["Review reminders", "Reconsolidation cycles (Nader, 2000)", "Optimal point alerts"],
                ["Controlled sharing", "Neural synchronization (García García, 2023)", "Private event circles"]
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "Preserve with Scientific Foundations",
              "description": "Join a platform designed in collaboration with neuroscientists to protect your most valuable memories.",
              "buttonText": "Get Started",
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
        "referenceId": "references",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Complete Scientific References",
              "content": [
                {
                  "text": "All claims are supported by published research:"
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "headers": ["Source", "Institution", "Link/DOI"],
              "rows": [
                ["Schacter, D. (2021)", "Harvard University", "doi:10.1017/S0140525X01003922"],
                ["Walker, M. (2017)", "UC Berkeley", "https://sleepscience.berkeley.edu/"],
                ["Shaw, J. (2016)", "University College London", "doi:10.1016/j.cognition.2016.10.006"],
                ["Saxe, R. (2023)", "MIT", "https://mcgovern.mit.edu/"],
                ["García García, E. (2023)", "Complutense University", "doi:10.1038/s41593-023-01283-x"],
                ["Digital Preservation Standards", "DPC/ISO", "https://www.dpconline.org/"],
                ["Memory Lab Studies", "Princeton University", "https://pni.princeton.edu/"],
                ["Van der Kolk (2023)", "University of Amsterdam", "doi:10.1016/j.biopsych.2023.01.020"],
                ["Quian Quiroga (2022)", "University of Leicester", "doi:10.1038/s41583-022-00609-1"],
                ["Martínez et al. (2023)", "Journal of Cognitive Neuroscience", "doi:10.1162/jocn_a_01976"]
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "The science of memory evolves rapidly. We recommend consulting these sources for current information.",
              "author": "Editorial Team",
              "source": "Nature Neuroscience",
              "sourceUrl": "https://www.nature.com/neuro/"
            }
          }
        ]
      }
    }
  ],
  "structuredData": {
    "openGraph": {
      "title": "The Neuroscience of Family Memories",
      "description": "Comprehensive analysis with Harvard, MIT and UCL experts about how the brain preserves our most valuable moments and how to protect them.",
      "url": "https://goodmemories.live/science/neuroscience-memories",
      "image": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/openart-image__dh2Pvtz_1750275031063_raw.jpg",
      "type": "article"
    }
  },
  "updatedAt": "2025-07-05T18:00:00Z",
  "createdAt": "2025-07-05T09:00:00Z"
}
Instructions
Generate articles using the above components, ensuring each block’s props match the required data.
Always start with title and TableOfContents for SEO and navigation.
Include a createSectionWrapper with a CTABlock promoting goodmemories in every article, linking to https://goodmemories.live.
Use relevant keywords in seo fields and content to align with good Memories’ mission.
Ensure all content complies with the platform’s Terms and Conditions (e.g., no illegal content, respect for intellectual property).

 */


























