import { useEffect } from 'react';

const pri = () => {
  useEffect(() => {
    // Client-side logic can be added here if needed
  }, []);

  return (
    <Layout>
      <Head>
        <title>About Good Memories - Preserve Your Digital Memories</title>
        <meta name="description" content="Learn about Good Memories, a platform dedicated to preserving and valuing digital memories. Discover our mission, vision, values, and goals to empower users worldwide." />
        <meta name="keywords" content="digital memories, preserve memories, memory platform, Project Memories, personal memories, digital preservation" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
      </Head>
      
      <div className="article-container">
        <section className="article-header">
          <h1>About Good Memories</h1>
          <p>Empowering users to preserve, value, and reconnect with their digital memories.</p>
        </section>

        <section className="about-content">
          <h2>Our Mission</h2>
          <p>
            At Project Memories, our mission is to preserve and enhance the value of users' digital memories, enabling them to reconnect with experiences that inspire and foster appreciation for moments often overlooked.
          </p>

          <h2>Our Vision</h2>
          <p>
            We aim to become a leading global platform, embraced by millions, that transforms how people preserve and leverage their memories, building a community that recognizes their strategic importance.
          </p>

          <h2>Our Values</h2>
          <ul className="values-list">
            <li><strong>Respect for User Content:</strong> We honor users’ choices in managing their memories, provided content adheres to legal standards.</li>
            <li><strong>Individual Responsibility:</strong> Users are accountable for the content they upload, ensuring autonomy and responsibility.</li>
            <li><strong>Security:</strong> Robust measures protect user privacy and data integrity.</li>
            <li><strong>Transparency:</strong> We maintain clear and open practices in how user data is handled.</li>
          </ul>

          <h2>Our Goals</h2>
          <p>
            Over the next six to twenty-four months, Project Memories is focused on:
          </p>
          <ul className="goals-list">
            <li>Launching an optimized beta version to deliver a seamless user experience.</li>
            <li>Driving digital visibility through organic growth strategies, leveraging high-value informational content to establish the platform as a trusted resource in search engines.</li>
            <li>Building a user base of 10,000 to 20,000 active users, showcasing early adopters as success stories to attract and retain a broader audience.</li>
          </ul>

          <div className="cta-block">
            <h3 className="cta-title">Join Project Memories Today</h3>
            <p className="cta-description">
              Be part of a community that values and preserves your most meaningful moments. Start your journey with us now.
            </p>
            <Link href="/" className="cta-button">
              Get Started
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default pri;