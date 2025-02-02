const puppeteer = require("puppeteer");

const getCrawlingTitle = async (req, res) => {
  const decodedLink = decodeURIComponent(req.params.url);
  const keyword = req.query.keyword;
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(decodedLink);

    const title = await page.$eval("title", (element) => element.textContent);
    const hasTitleKeyword = title.toUpperCase().includes(keyword.toUpperCase());

    if (!title) {
      return res.status(200).send({ message: `[This Title does not exist]` });
    }

    return res.status(200).json({
      hasKeyword: hasTitleKeyword,
      urlTitle: title,
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

module.exports = { getCrawlingTitle };
