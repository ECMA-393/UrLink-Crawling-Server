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

    const hasTitleKeyword = title.includes(keyword);
    let hasKeyword = innerText.includes(keyword);

    if (!innerText) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      innerText = await page.evaluate(() => document.body.innerText);
      hasKeyword = innerText.includes(keyword);

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
    }

    const keywordSentence = getAllSentence(innerText).find((sentence) =>
      sentence.includes(keyword)
    );

    let urlText = "";
    if (keywordSentence) {
      urlText = getKeywordSentence(keywordSentence, keyword);
    }

    if (hasKeyword) {
      return res.status(200).json({
        url: req.params.url,
        hasTitleKeyword: hasTitleKeyword,
        hasKeyword: hasKeyword,
        urlTitle: title,
        urlText: urlText,
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

const getKeywordSentence = (sentence, keyword) => {
  const theNumberOfWordBefore = 3;
  const theNumberOfWordAfter = 3;
  const words = sentence.split(/\s+/);
  const keywordIndex = words.findIndex((word) => word.includes(keyword));
  const startWordIndex = Math.max(0, keywordIndex - theNumberOfWordBefore);
  const endWordIndex = Math.min(
    words.length,
    keywordIndex + theNumberOfWordAfter + 1
  );
  const slicedWords = words.slice(startWordIndex, endWordIndex);
  let keywordSentence = slicedWords.join(" ");

  if (startWordIndex >= 0) {
    keywordSentence = "... " + keywordSentence;
  }
  if (endWordIndex <= words.length) {
    keywordSentence += " ...";
  }

  return keywordSentence;
};

module.exports = { getCrawlingContentKeyword };
