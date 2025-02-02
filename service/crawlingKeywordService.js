const puppeteer = require("puppeteer");

const getCrawlingKeyword = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const keyword = req.query.keyword;
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 20000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedUrl);

    let innerText = await page.evaluate(() => document.body.innerText);
    const upperCasedKeyword = keyword.toUpperCase();
    const hasKeyword = innerText.toUpperCase().includes(upperCasedKeyword);

    const urlText = getAllSentence(innerText).find((sentence) =>
      sentence.toUpperCase().includes(upperCasedKeyword)
    );

    if (hasKeyword) {
      return res.status(200).json({
        url: req.params.url,
        hasKeyword: hasKeyword,
        urlText: urlText,
      });
    } else if (!innerText) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });
      const iframeUrl = await page.evaluate(
        () => document.querySelector("iframe").src
      );

      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      let iframeInnerText = await page.evaluate(() => document.body.innerText);
      const upperCasedKeyword = keyword.toUpperCase();
      const hasKeywordOfIframe = iframeInnerText
        .toUpperCase()
        .includes(upperCasedKeyword);

      const urlText = getAllSentence(iframeInnerText).find((sentence) =>
        sentence.includes(upperCasedKeyword)
      );

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
      if (hasKeywordOfIframe) {
        return res.status(200).json({
          url: req.params.url,
          hasKeyword: hasKeywordOfIframe,
          urlText: urlText,
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
    .replace(/\n|\r|\t/g, " ")
    .split(/(?<=다\. |요\. |니다\. |\. |! |\? )/)
    .reduce((array, sentence) => {
      const trimedSentence = sentence.trim();

      if (trimedSentence) {
        array.push(trimedSentence);
      }
      return array;
    }, []);
};

module.exports = { getCrawlingKeyword };
