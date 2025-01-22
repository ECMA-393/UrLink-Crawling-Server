const puppeteer = require("puppeteer");

const getCrawlingKeyword = async (req, res) => {
  const decodedLink = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.goto(decodedLink);

    let innerText = await page.evaluate(() => document.body.innerText);
    const hasKeyword = innerText.includes(req.query.keyword);

    return res.status(200).json({
      urlLink: req.params.url,
      keyword: req.query.keyword,
      hasKeyword: hasKeyword,
      urlText: innerText,
    });
  } catch (error) {
    return res.status(500).send({ message: `[ServerError occured] ${error}` });
  } finally {
    await browser.close();
  }
};

module.exports = { getCrawlingKeyword };
