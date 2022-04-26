const express = require("express");
const fs = require("fs");
const core = require("puppeteer-core");
var getPixels = require("get-pixels");
var GifEncoder = require("gif-encoder");

const exePath =
  // eslint-disable-next-line no-nested-ternary
  process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/chromium"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function getOptions(isDev) {
  let options;
  if (isDev) {
    options = {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: exePath,
      headless: true,
    };
  } else {
    options = {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    };
  }
  return options;
}

let page;

async function getPage(isDev) {
  if (page) {
    return page;
  }
  const options = await getOptions(isDev);
  const browser = await core.launch(options);
  page = await browser.newPage();
  return page;
}

async function getScreenshot(html, type, isDev, width = 1200, height = 627) {
  const page = await getPage(isDev);
  await page.setViewport({ width, height });
  await page.setContent(html);
  const file = await page.screenshot({ type });
  return file;
}

const html1 = `
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>

</body>
</html>
`;

const html2 = `
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>My First Heading-2</h1>
<p>My first paragraph-2</p>

</body>
</html>
`;

const html3 = `
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>My First Heading-3</h1>
<p>My first paragraph-3</p>

</body>
</html>
`;

const generate = async (pics) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var gif = new GifEncoder(1280, 720);
      var file = fs.createWriteStream("img.gif");

      gif.pipe(file);
      gif.setQuality(100);
      gif.setDelay(1000);
      gif.setRepeat(0);
      gif.writeHeader();

      const addToGif = (images, counter = 0) => {
        getPixels(images[counter], "image/jpeg", function (err, pixels) {
          gif.addFrame(pixels.data);
          gif.read();
          if (counter === images.length - 1) {
            gif.finish();
          } else {
            addToGif(images, ++counter);
          }
        });
      };
      addToGif(pics);
      resolve();
    }, 1000);
  });
};

var app = express();

app.get("/", async (req, res) => {
  //1, 2, 3
  const fileType = "jpeg";
  const file = await getScreenshot(html1, fileType, true, 1280, 720);
  const file2 = await getScreenshot(html2, fileType, true, 1280, 720);
  const file3 = await getScreenshot(html3, fileType, true, 1280, 720);

  await generate([file, file2, file3]);

  res.statusCode = 200;
  res.setHeader("Content-Type", `image/gif`);
  res.setHeader(
    "Cache-Control",
    `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
  );

  fs.readFile("./img.gif", (err, data) => {
    fs.unlinkSync("./img.gif");
    res.send(data);
  });
  // res.end(pedro);
});

app.listen(3010, () => {
  console.log("Example app listening on port 3010!");
});
