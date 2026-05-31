const TERMLY_TERMS_ATTRIBUTION =
  /<br><div><span data-custom-class=['"]body_text['"]>This Terms and Conditions was created using Termly's <\/span><a[\s\S]*?>Terms and Conditions Generator<\/a><\/div>/gi

const TERMLY_PRIVACY_ATTRIBUTION =
  /<br><div><span data-custom-class=['"]body_text['"]>This Privacy Policy was created using Termly's <\/span><a[\s\S]*?>Privacy Policy Generator<\/a><\/div>/gi

const TERMLY_HTML_FORMAT_NOTE = /\s*Here is my Terms & Conditions in HTML format\s*/gi

export const stripTermlyExportArtifacts = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<span style="display: block;margin: 0 auto[\s\S]*?<\/span>/i, "")
    .replace(TERMLY_TERMS_ATTRIBUTION, "")
    .replace(TERMLY_PRIVACY_ATTRIBUTION, "")
    .replace(TERMLY_HTML_FORMAT_NOTE, "")
    .trim()
