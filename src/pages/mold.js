'use client'; 
import GeneralMold from '@/components/complex/generalMold';


export default function Home() {
  return (
    <GeneralMold
      pageTitle="Home Page"
      pageDescription="Welcome to the home page"
      metaKeywords="home, welcome, demo"
      visibility="public"
      leftContent={
        <div>
          <h1 className="title-md">Left Content</h1>
          <p className="content-default">This is the left container content.</p>
        </div>
      }
      rightContent={
        <div>
          <h2 className="title-sm">Right Content</h2>
          <p className="content-default">This is the right container content.</p>
        </div>
      }
    />
  );
}