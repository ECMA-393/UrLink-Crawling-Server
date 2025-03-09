const puppeteer = require("puppeteer");

const getCrawlingTitle = async (req, res) => {
  const decodedLink = decodeURIComponent(req.params.url);
  const keyword = req.query.keyword;
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 20000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedLink);

    const title = await page.$eval("title", (element) => element.textContent);
    const hasTitleKeyword = title.toUpperCase().includes(keyword.toUpperCase());
    let innerText = await page.$eval("body", (body) => body.innerText);

    if (!innerText) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      innerText = await page.evaluate(() => document.body.innerText);

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
    }

    if (!title) {
      return res.status(200).send({ message: `[This Title does not exist]` });
    }

    const allSentence = getAllSentence(innerText);

    return res.status(200).json({
      url: req.params.url,
      hasKeyword: hasTitleKeyword,
      urlTitle: title,
      urlAllText: allSentence,
    });
  } catch (error) {
    if (!isCheckTrueThisUrl(decodedLink)) {
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

module.exports = { getCrawlingTitle };
