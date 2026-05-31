import sanitizeHtml from "sanitize-html"

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "h1",
  "h2",
  "h3",
  "img",
  "span",
  "bdt",
] as const

export const sanitizeLegalHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [...allowedTags],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "id", "style", "data-custom-class"],
      a: ["href", "name", "target", "rel", "data-custom-class"],
      span: ["style", "class", "data-custom-class"],
      div: ["style", "class", "id", "data-custom-class"],
      li: ["style", "data-custom-class"],
      p: ["style", "data-custom-class"],
      strong: ["style", "data-custom-class"],
      em: ["style", "data-custom-class"],
      h1: ["style", "data-custom-class"],
      h2: ["style", "data-custom-class"],
      h3: ["style", "data-custom-class"],
      ul: ["style"],
      ol: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attributes) => {
        const href = attributes.href ?? ""

        if (href.startsWith("#")) {
          return {
            tagName,
            attribs: {
              ...attributes,
              href,
            },
          }
        }

        return {
          tagName,
          attribs: {
            ...attributes,
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }
      },
    },
  })
