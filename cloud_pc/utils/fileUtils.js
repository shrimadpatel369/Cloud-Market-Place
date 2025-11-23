const fs = require("fs");
const path = require("path");
const logger = require("./logger");

exports.saveJSON = (filename, data) => {
  try {
    const dir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));

    logger.success("Saved file:", fullPath);
  } catch (err) {
    logger.error("Error saving file:", err);
  }
};
