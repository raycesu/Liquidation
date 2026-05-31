const GENERAL_LOCATION = "Toronto, Ontario, Canada"

const TERMS_CONTACT_ADDRESS_BLOCK =
  /<div class="MsoNormal" data-custom-class="body_text" style="line-height: 1\.5; text-align: left;"><span style="font-size: 15px;"><span style="line-height: 115%; font-family: Arial; color: rgb\(89, 89, 89\);"><bdt class="question"><strong><bdt class="question noTranslate">8 Wellesley St W, 3310<\/bdt><\/strong><\/bdt>[\s\S]*?<div class="MsoNormal" data-custom-class="body_text" style="line-height: 1\.5; text-align: left;"><strong><span style="font-size:11\.0pt;line-height:115%;font-family:Arial;\s*Calibri;color:#595959;mso-themecolor:text1;mso-themetint:166;"><strong><bdt class="block-component"><\/bdt>Phone: <bdt class="question">\(\+1\)6478338309<\/bdt><bdt class="statement-end-if-in-editor"><\/bdt><\/strong><\/span><\/strong><\/div>/

const TERMS_CONTACT_ADDRESS_REPLACEMENT = `<div class="MsoNormal" data-custom-class="body_text" style="line-height: 1.5; text-align: left;"><span style="font-size: 15px;"><span style="line-height: 115%; font-family: Arial; color: rgb(89, 89, 89);"><bdt class="question"><strong><bdt class="question noTranslate">${GENERAL_LOCATION}</bdt></strong></bdt></span></span></div>`

export const redactLegalContactInfo = (html: string) => {
  let result = html

  result = result.replace(TERMS_CONTACT_ADDRESS_BLOCK, TERMS_CONTACT_ADDRESS_REPLACEMENT)

  result = result.replace(
    /<bdt class="block-component"><\/bdt>phone at <bdt class="question">\(\+1\)6478338309<\/bdt>, /gi,
    "",
  )

  result = result.replace(
    /or by mail to <bdt class="question noTranslate">8 Wellesley St W, 3310<\/bdt><bdt class="block-component"><\/bdt>, <bdt class="question noTranslate">Toronto<\/bdt><bdt class="block-component"><\/bdt>, <bdt class="question noTranslate">Ontario<\/bdt><bdt class="block-component"><\/bdt><bdt class="block-component"><\/bdt> <bdt class="question noTranslate">M4Y 0J5<\/bdt><bdt class="statement-end-if-in-editor"><\/bdt><bdt class="block-component"><bdt class="block-component">,\s*<\/bdt><bdt class="question noTranslate">Canada<\/bdt><bdt class="statement-end-if-in-editor"><\/bdt><\/bdt>/gi,
    `or by mail to <bdt class="question noTranslate">${GENERAL_LOCATION}</bdt>`,
  )

  result = result.replace(
    /at <bdt class="question noTranslate">8 Wellesley St W, 3310<\/bdt><bdt class="block-component"><\/bdt><\/span><\/span>, <bdt class="question noTranslate">Toronto<\/bdt><\/span><\/span><span style="font-size: 15px;"><span data-custom-class="body_text"><span style="font-size: 15px;"><span data-custom-class="body_text"><span style="color: rgb\(89, 89, 89\);"><bdt class="block-component"><\/bdt>, <bdt class="question noTranslate">Ontario<\/bdt><bdt class="block-component"><\/bdt><bdt class="block-component"><\/bdt> <bdt class="question noTranslate">M4Y 0J5<\/bdt><bdt class="statement-end-if-in-editor"><\/bdt>/gi,
    `at <bdt class="question noTranslate">${GENERAL_LOCATION}</bdt>`,
  )

  result = result.replace(
    /<div style="line-height: 1\.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><bdt class="question noTranslate">8 Wellesley St W, 3310<\/bdt>[\s\S]*?<\/div>/,
    "",
  )

  result = result.replace(
    /<div style="line-height: 1\.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><bdt class="question">Toronto<\/bdt>[\s\S]*?M4Y 0J5[\s\S]*?<\/div>/,
    `<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><bdt class="question noTranslate">${GENERAL_LOCATION}</bdt></span></span></div>`,
  )

  result = result.replace(
    /<div style="line-height: 1\.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><span style="font-size: 15px;"><span data-custom-class="body_text"><span style="color: rgb\(89, 89, 89\);"><bdt class="block-component"><\/bdt><\/span><\/span><\/span><bdt class="question noTranslate">Canada<\/bdt>[\s\S]*?<\/div>\s*(?=<div style="line-height: 1\.5;"><br><\/div><div id="request")/,
    "",
  )

  result = result.replace(/8 Wellesley St W, 3310/g, GENERAL_LOCATION)
  result = result.replace(/<bdt class="question noTranslate">M4Y 0J5<\/bdt>/g, "")
  result = result.replace(/\(\+1\)6478338309/g, "")
  result = result.replace(
    /<strong><bdt class="block-component"><\/bdt>Phone: <bdt class="question"><\/bdt><bdt class="statement-end-if-in-editor"><\/bdt><\/strong>/gi,
    "",
  )

  return result
}
