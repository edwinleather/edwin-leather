import Image from "next/image";
import { ArrowUpRight, Hand, Leaf, Scissors } from "lucide-react";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { SmoothLink } from "@/components/SmoothLink";
import { SmartImage } from "@/components/SmartImage";
import type { PageContentData, PageBlock, PageKey } from "@/lib/pages";

const VALUES_ICONS = [Hand, Leaf, Scissors];

function splitLines(text: string): { before: string; em?: string } {
  const idx = text.indexOf("\n");
  if (idx === -1) return { before: text };
  return { before: text.slice(0, idx), em: text.slice(idx + 1) };
}

function PolicySection({ block }: { block: PageBlock }) {
  return (
    <section>
      <span>{block.number}</span>
      <div>
        <h2>{block.heading}</h2>
        {block.body && <p>{block.body}</p>}
      </div>
    </section>
  );
}

function StoryHero({ content }: { content: PageContentData }) {
  const { eyebrow, heading } = content.hero;
  const { before, em } = splitLines(heading ?? "");
  return (
    <section className="story-hero">
      <Parallax className="story-hero__media" speed={85}>
        <SmartImage src={content.hero.image || ""} alt={content.title} priority sizes="100vw" />
      </Parallax>
      <div className="story-hero__veil" />
      <div className="container story-hero__copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{before}{em ? <><br /><em>{em}</em></> : null}</h1>
      </div>
    </section>
  );
}

function AboutHero({ content }: { content: PageContentData }) {
  const { eyebrow, heading, subheading, buttonLabel, buttonHref, image } = content.hero;
  const { before, em } = splitLines(heading ?? "");
  return (
    <section className="about-hero container-wide">
      <div className="about-hero__copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{before}{em ? <><br /><em>{em}</em></> : null}</h1>
        {subheading && <p>{subheading}</p>}
        {buttonLabel && buttonHref && (
          <SmoothLink href={buttonHref} className="button button--dark">{buttonLabel} <ArrowUpRight size={16} /></SmoothLink>
        )}
      </div>
      <div className="about-hero__media">
        <Image src={image || ""} alt={content.title} fill priority sizes="(max-width: 860px) 100vw, 52vw" />
      </div>
    </section>
  );
}

function PolicyHero({ content }: { content: PageContentData }) {
  const { eyebrow, heading, subheading, effective } = content.hero;
  const { before, em } = splitLines(heading ?? "");
  return (
    <aside className="terms-aside">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{before}{em ? <><br /><em>{em}</em></> : null}</h1>
      {subheading && <p>{subheading}</p>}
      {effective && <small>{effective}</small>}
    </aside>
  );
}

function StoryBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "statement":
            return (
              <section key={i} className="story-manifesto container">
                <Reveal>
                  {block.number && <span className="story-number">{block.number}</span>}
                  <h2>{block.heading}</h2>
                </Reveal>
                {block.body && <Reveal delay={0.08}><p>{block.body}</p></Reveal>}
              </section>
            );
          case "image-text":
            return (
              <section key={i} className={`story-grid ${block.reverse ? "story-grid--reverse " : ""}container-wide`}>
                <div className="story-grid__image">
                  <Parallax className="parallax-fill" speed={55}>
                    <SmartImage src={block.image || ""} alt={block.eyebrow || block.heading || ""} sizes="(max-width: 800px) 100vw, 52vw" />
                  </Parallax>
                </div>
                <div className="story-grid__copy">
                  {block.number && <span className="story-number">{block.number}</span>}
                  {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
                  <h2>{block.heading}</h2>
                  {block.body && <p>{block.body}</p>}
                </div>
              </section>
            );
          case "cta":
            return (
              <section key={i} className="story-cta">
                <div className="container">
                  {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
                  <h2>{block.heading}</h2>
                  {block.buttonLabel && block.buttonHref && (
                    <SmoothLink href={block.buttonHref} className="button button--cream">{block.buttonLabel} <ArrowUpRight size={16} /></SmoothLink>
                  )}
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function AboutBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "statement":
            return (
              <section key={i} className="about-statement container">
                <Reveal>
                  {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
                  <h2>{block.heading}</h2>
                </Reveal>
              </section>
            );
          case "values":
            return (
              <section key={i} className="about-values container">
                {block.items?.map((item, j) => {
                  const Icon = VALUES_ICONS[j % VALUES_ICONS.length];
                  return (
                    <article key={j}>
                      <Icon size={22} />
                      <span>{String(j + 1).padStart(2, "0")}</span>
                      <h3>{item.title}</h3>
                      {item.body && <p>{item.body}</p>}
                    </article>
                  );
                })}
              </section>
            );
          case "image-band":
            return (
              <section key={i} className="about-image-band">
                <Image src={block.image || ""} alt={block.eyebrow || ""} fill sizes="100vw" />
                <div className="about-image-band__veil" />
                <div className="container">
                  {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
                  {block.heading && <p>{block.heading}</p>}
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export function PageRenderer({ content, page }: { content: PageContentData; page: PageKey }) {
  if (page === "story") {
    return (
      <div className="story-page">
        <StoryHero content={content} />
        <StoryBlocks blocks={content.blocks} />
      </div>
    );
  }

  if (page === "about") {
    return (
      <div className="about-page">
        <AboutHero content={content} />
        <AboutBlocks blocks={content.blocks} />
      </div>
    );
  }

  return (
    <div className="page-shell terms-page">
      <div className="container terms-layout">
        <PolicyHero content={content} />
        <main className="terms-content">
          {content.blocks.map((block, i) => (
            <PolicySection key={i} block={block} />
          ))}
        </main>
      </div>
    </div>
  );
}