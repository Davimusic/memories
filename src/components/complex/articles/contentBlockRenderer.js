import React, { useState } from 'react';
import TableOfContents from './tableOfContents';
import CreateSectionWrapper from './createSectionWrapper';
import Paragraphs from './paragraphs';
import ImageTextBlock from './imageTextBlock';
import Accordion from './accordion';
import TableRenderer from './tableRenderer';
import CTABlock from './CTABlock';
import CustomQuote from './customQuote';
import ContentSlider from './contentSlider';
import FeedbackForm from './feedbackForm';

const ContentBlockRenderer = ({ block }) => {
  console.log('ContentBlockRenderer block:', block);
  if (!block || !block.type) {
    console.warn('ContentBlockRenderer: Invalid block provided');
    return null;
  }
  const { type, props = {} } = block;
  switch (type) {
    case 'text':
      return <Paragraphs data={props} />;
    case 'tableOfContents':
      return <TableOfContents content={props.content} />;
    case 'imageText':
      return <ImageTextBlock {...props} />;
    case 'embed':
      return <EmbedBlock {...props} />;
    case 'table':
      return <TableRenderer {...props} />;
    case 'accordion':
      return (
        <Accordion {...props}>
          {props.children &&
            props.children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </Accordion>
      );
    case 'cta':
      return <CTABlock {...props} />;
    case 'links':
      return <LinksRenderer {...props} />;
    case 'videos':
      return <VideosRenderer {...props} />;
    case 'images':
      return <ImagesRenderer {...props} />;
    case 'image':
      return <Image src={props.url} alt={props.alt} className="w-full-image h-auto" width={600} height={400} loading="lazy" />;
    case 'audios':
      return <AudiosRenderer {...props} />;
    case 'contentSlider':
      return <ContentSlider {...props} />;
    case 'socialShare':
      return <SocialShare {...props} />;
    case 'modal':
      return (
        <Modal {...props}>
          {props.children &&
            props.children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </Modal>
      );
    case 'customQuote':
      return <CustomQuote {...props} />;
    case 'codeBlock':
      return <CodeBlock {...props} />;
    case 'createSectionWrapper':
      const { referenceId, children } = props;
      return (
        <CreateSectionWrapper referenceId={referenceId}>
          {children &&
            children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </CreateSectionWrapper>
      );
    case 'feedbackForm':
      return <FeedbackForm {...props} onSubmit={props.onSubmit || ((data) => console.log('Feedback:', data))} />;
    default:
      console.warn(`Unsupported block type: ${type}`);
      return null;
  }
};

export default ContentBlockRenderer