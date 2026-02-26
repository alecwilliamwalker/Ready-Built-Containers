/* eslint-disable @typescript-eslint/no-explicit-any */

type JsonLdProps = {
  data: Record<string, any>;
};

/**
 * Renders a `<script type="application/ld+json">` tag for structured data.
 * Pass any JSON-LD object (with `@context` and `@type`) as `data`.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
