import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import type { ServicesGridContent } from './ServicesGrid.types';
import './ServicesGrid.styles.css';

interface ServicesGridProps {
  content: ServicesGridContent;
  /** Identity of this placement, unique per page. The editor keys a section's style overrides,
   *  reorder and delete by it, so two pages sharing one id read as a single section (OHH-772). */
  sectionId: string;
}

export function ServicesGrid({ content, sectionId }: ServicesGridProps) {
  return (
    <section
      className="services-grid"
      data-ohw-section={sectionId}
      data-ohw-section-label="Services"
    >
      <Container>
        <div className="services-grid__header">
          <div>
            {content.eyebrow && (
              <p
                className="services-grid__eyebrow"
                data-ohw-editable="plain"
                data-ohw-key="services-eyebrow"
              >
                {content.eyebrow}
              </p>
            )}
            {content.heading && (
              <h2
                className="services-grid__heading"
                data-ohw-editable="text"
                data-ohw-key="services-heading"
                data-ohw-max-length="80"
              >
                {content.heading}
              </h2>
            )}
          </div>
          {content.subheading && (
            <p
              className="services-grid__sub"
              data-ohw-editable="text"
              data-ohw-key="services-subheading"
              data-ohw-max-length="160"
            >
              {content.subheading}
            </p>
          )}
        </div>

        <div className="services-grid__grid" data-ohw-cards>
          {content.items.map((item, i) => (
            <div key={i} className="services-grid__card">
              {item.iconUrl && (
                <Image
                  src={item.iconUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="services-grid__icon"
                  data-ohw-editable="image"
                  data-ohw-key={`services-item-${i}-icon`}
                />
              )}
              <h3
                className="services-grid__title"
                data-ohw-editable="plain"
                data-ohw-key={`services-item-${i}-title`}
              >
                {item.title}
              </h3>
              <p
                className="services-grid__desc"
                data-ohw-editable="text"
                data-ohw-key={`services-item-${i}-desc`}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
