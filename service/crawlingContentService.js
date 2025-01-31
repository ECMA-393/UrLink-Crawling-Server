const puppeteer = require("puppeteer");

const isCheckTrueThisUrl = (url) => {
  /* eslint-disable */
  const urlRegex = /^(http|https):\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
  if (urlRegex.test(url)) {
    return true;
  } else {
    return false;
  }
};

const getCrawlingContentKeyword = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 20000;

  try {
    const page = await browser.newPage();

    await page.goto(decodedUrl);

    const element = await page.$("title");
    const title = await page.evaluate(
      (element) => element.textContent,
      element
    );

    const upperCaseKeyword = req.query.keyword.toUpperCase();

    const innerText = await page.evaluate(() => document.body.innerText);
    const hasKeywordContent = innerText
      .toUpperCase()
      .includes(upperCaseKeyword);
    const hasKeywordTitle = title.toUpperCase().includes(upperCaseKeyword);

    if (hasKeywordContent || hasKeywordTitle) {
      return res.status(200).json({
        url: req.params.url,
        urlLink: req.params.url,
        hasKeywordContent: hasKeywordContent,
        hasKeywordTitle: hasKeywordTitle,
        urlTitle: title,
        urlText: innerText,
      });
    } else if (innerText === "") {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });
      const iframeUrl = await page.evaluate(
        () => document.querySelector("iframe").src
      );

      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      const iframeInnerText = await page.evaluate(
        () => document.body.innerText
      );
      const hasKeywordOfIframe = iframeInnerText.includes(req.query.keyword);

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
      if (hasKeywordOfIframe) {
        return res.status(200).json({
          urlLink: req.params.url,
          keyword: req.query.keyword,
          hasKeyword: hasKeywordOfIframe,
          urlText: iframeInnerText,
        });
      } else if (!hasKeywordOfIframe) {
        return res
          .status(200)
          .send({ message: `[This keyword does not exist]` });
      } else {
        throw new Error(
          `[The requested page does not exist or a problem occurred]`
        );
      }
    } else if (!hasKeyword) {
      return res.status(200).send({ message: `[This keyword does not exist]` });
    }
  } catch (error) {
    if (isCheckTrueThisUrl(decodedUrl) === false) {
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

module.exports = { getCrawlingContentKeyword };
