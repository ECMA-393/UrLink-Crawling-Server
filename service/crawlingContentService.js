const puppeteer = require("puppeteer");

const getCrawlingContentKeyword = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const keyword = req.query.keyword;
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 20000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedUrl);

    const title = await page.$eval("title", (element) => element.textContent);
    let innerText = await page.$eval("body", (body) => body.innerText);

    const upperCasedKeyword = keyword.toUpperCase();
    const hasTitleKeyword = title.toUpperCase().includes(upperCasedKeyword);
    let hasKeyword = innerText.toUpperCase().includes(upperCasedKeyword);

    if (!innerText) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      innerText = await page.evaluate(() => document.body.innerText);
      hasKeyword = innerText.toUpperCase().includes(upperCasedKeyword);

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
    }

    const allSentence = getAllSentence(innerText);

    const urlText = allSentence.find((sentence) =>
      sentence.toUpperCase().includes(upperCasedKeyword)
    );

    if (hasKeyword) {
      return res.status(200).json({
        url: req.params.url,
        hasTitleKeyword: hasTitleKeyword,
        hasKeyword: hasKeyword,
        urlTitle: title,
        urlText: urlText,
        urlAllText: allSentence,
      });
    } else {
      return res.status(200).send({ message: `[This keyword does not exist]` });
    }
  } catch (error) {
    if (!isCheckTrueThisUrl(decodedUrl)) {
      return res
        .status(400)
        .send({ message: `[Invalid Characters in HTTP request]  ${error}` });
    } else {
      return res
        .status(500)
        .send({ message: `[ServerError occured] ${error}` });
    }
  } finally {
    await browser.close();
  }
};

const isCheckTrueThisUrl = (url) => {
  /* eslint-disable */
  const urlRegex = /^(http|https):\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
  if (urlRegex.test(url)) {
    return true;
  } else {
    return false;
  }
};

const getAllSentence = (innerText) => {
  return innerText
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.?!])(?=\s)/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
};

module.exports = { getCrawlingContentKeyword };
