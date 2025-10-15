/**
 * Media Downloader
 *
 * This script processes a JSON file containing media data and downloads all attachments
 * found in the messages. It handles multiple attachments per message, implements rate limiting,
 * and provides graceful shutdown handling.
 *
 * File Structure:
 * - data/messages.json: Input file containing Discord messages
 * - downloads/: Output directory for downloaded attachments
 *
 * Expected JSON format:
 * [
 *   {
 *     "ID": "123456789",
 *     "Attachments": "url1 url2 url3"
 *   }
 * ]
 *
 * @author Your Name
 * @version 1.0.0
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

let isShuttingDown = false;
process.on("SIGINT", () => {
  console.log("\n\nDownload stopped by user.");
  isShuttingDown = true;
  process.exit(0);
});

/**
 * Creates a directory if it doesn't already exist
 * Utilizes recursive creation to ensure all parent directories are created
 *
 * @param {string} dir - The path to the directory to create
 * @throws {Error} If directory creation fails due to permissions or other filesystem errors
 */
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Reads and parses a JSON file with special handling for Discord message IDs
 *
 * Performs the following operations:
 * 1. Reads the file content as UTF-8 text
 * 2. Converts numeric ID values to strings to prevent precision loss
 * 3. Parses the modified JSON data
 *
 * @param {string} filename - Path to the JSON file to read
 * @returns {Array<Object>} Parsed array of message objects with string IDs
 * @throws {Error} If file reading fails or JSON is invalid
 *
 * @example
 * const messages = readFile("messages.json");
 * // Returns: [{ "ID": "123456789", "Attachments": "url1 url2" }, ...]
 */
function readFile(filename) {
  const rawData = fs.readFileSync(filename, "utf8");
  const fixedData = rawData.replace(/"ID":\s*(\d+)/g, '"ID": "$1"');
  const data = JSON.parse(fixedData);
  return data;
}

/**
 * Downloads a single file from a given URL and saves it to the specified filepath.
 * Uses streams for memory-efficient downloading and includes error handling.
 *
 * @param {string} url - The URL of the file to download
 * @param {string} filepath - The local path where the file should be saved
 * @returns {Promise<void>} Resolves when download is complete, rejects on error
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`Downloaded: ${filepath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

/**
 * Main processing function that handles the downloading of all attachments from the messages.
 * Features:
 * - Processes all messages from the JSON data
 * - Handles multiple attachments per message
 * - Implements rate limiting (500ms delay between downloads)
 * - Skips existing files
 * - Tracks download and skip counts
 * - Supports graceful shutdown
 *
 * @returns {Promise<void>} Resolves when all downloads are complete
 */
async function downloadAllAttachments() {
  // Ensure data directory exists
  const dataDir = "./data";
  createDirIfNotExists(dataDir);

  // Check if messages.json exists in data directory
  const messagesPath = path.join(dataDir, "messages.json");
  if (!fs.existsSync(messagesPath)) {
    throw new Error(`Input file not found: ${messagesPath}. Please place your messages.json file in the data directory.`);
  }

  const data = readFile(messagesPath);
  const downloadDir = "./downloads";
  createDirIfNotExists(downloadDir);

  let downloadCount = 0;
  let skippedCount = 0;

  for (const message of data) {
    if (isShuttingDown) {
      console.log(`\nStopped. Downloaded ${downloadCount} files, skipped ${skippedCount} existing files.`);
      return;
    }

    if (!message.Attachments || message.Attachments.trim() === "") {
      continue;
    }

    const urls = message.Attachments.split(" ").filter((url) => url.trim() !== "");

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        const urlObj = new URL(url);
        const filename = path.basename(urlObj.pathname);
        const ext = path.extname(filename);

        // create unique filename: ID_1.ext, ID_2.ext, etc.
        const filepath = path.join(downloadDir, `${message.ID}_${i + 1}${ext}`);

        // skip download if file already exists
        const fullPath = path.resolve(filepath);
        if (fs.existsSync(fullPath)) {
          console.log(`Skipped existing image: ${filepath}`);
          skippedCount++;
          continue;
        }

        await downloadFile(url, filepath);
        downloadCount++;

        // delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 700));
      } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
      }
    }
  }

  console.log(`\nDownload complete! Total files downloaded: ${downloadCount}, skipped: ${skippedCount}`);
}

downloadAllAttachments().catch(console.error);
