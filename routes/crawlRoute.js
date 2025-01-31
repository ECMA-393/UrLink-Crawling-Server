const express = require("express");

const { getCrawlingTitle } = require("../service/crawlingTitleService");
const { getCrawlingKeyword } = require("../service/crawlingKeywordService");
const {
  getCrawlingContentKeyword,
} = require("../service/crawlingContentService");

const router = express.Router();

router.get("/:url", getCrawlingTitle);
router.get("/:url/search", getCrawlingKeyword);
router.get("/all/:url/search", getCrawlingContentKeyword);

module.exports = router;
