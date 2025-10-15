# Media Downloader

A Node.js utility to bulk download attachments from Discord chat exports. This tool processes a JSON file containing Discord messages and downloads all attachments, maintaining a clear naming structure based on message IDs.

Although this script was created to download media from Discord exported data, it can be used for any JSON file with a similar structure with some tweaks.

## Features

- 📥 Bulk download attachments from Discord chat export JSON files
- 🔍 Processes comma/space-separated attachment URLs in messages
- 📁 Automatically creates download directory
- 🏷️ Organized file naming with message ID and sequence number
- ⏱️ Built-in rate limiting to prevent Discord API throttling
- ❌ Error handling for failed downloads
- 🔄 Resumable downloads (skips existing files)

## Prerequisites

- Node.js (v14.0.0 or higher recommended)
- A Discord chat export in JSON format with the following structure:
  ```json
  [
    {
      "ID": "123456789",
      "Attachments": "url1 url2 url3"
    }
  ]
  ```

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/maryamaljanabi/media-downloader.git
   ```

2. Navigate to the project directory:
   ```bash
   cd media-downloader
   ```

## Project Structure

```
media-downloader/
├── data/               # Input directory
│   └── messages.json   # Your Discord chat export file
├── downloads/          # Output directory (created automatically)
├── index.js            # Main script
└── package.json
```

## Usage

1. Create a `data` directory in the project root if it doesn't exist
2. Place your Discord chat export JSON file in the `data` directory as `messages.json`
3. Run the script:
   ```bash
   npm start
   ```
   or
   ```bash
   node index.js
   ```

The script will:

1. Create a `downloads` directory if it doesn't exist
2. Process each message in the JSON file
3. Download attachments with names formatted as `messageID_sequence.extension`

Note: It might take sometime to download due to the rate limiting to avoid getting blocked by discord.

The script includes error handling as follows:

- Skips empty or invalid attachment URLs
- Logs download errors without stopping the process
- Deletes partially downloaded files on failure
- Continues to next file on individual download failures

To prevent overwhelming Discord's servers and avoid rate limits:

- 700ms delay between downloads
- Configurable by modifying the timeout value in the code

## File Naming Convention

Downloaded files follow this naming pattern:

- `messageID_number.extension`
  - `messageID`: The Discord message ID
  - `number`: Sequential number for multiple attachments in the same message
  - `extension`: Original file extension from the attachment URL

Example: `123456789_1.jpg`

## Disclaimer

This tool is not affiliated with Discord. Make sure you have permission to download and store the attachments before using this tool.

## License

[![License](https://img.shields.io/:License-MIT-blue.svg?style=flat-square)](http://badges.mit-license.org)

- MIT License
- Copyright 2025 © [Maryam Aljanabi](https://github.com/maryamaljanabi)
