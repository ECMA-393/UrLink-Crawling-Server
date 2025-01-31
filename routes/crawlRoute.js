const express = require("express");

const { getCrawlingTitle } = require("../service/crawlingTitleService");
const { getCrawlingKeyword } = require("../service/crawlingKeywordService");
const {
  getCrawlingContentKeyword,
} = require("../service/crawlingContentService");

const router = express.Router();

router.get("/:url/search", getCrawlingKeyword);
router.get("/all/:url/search", getCrawlingContentKeyword);
router.get("/title/:url/search", getCrawlingTitle);

module.exports = router;
