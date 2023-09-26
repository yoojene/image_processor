import sharp from "sharp";
import fs from "fs";
const fetch = require("node-fetch");
const JSZip = require("jszip");

const combineImage = async () => {
  const imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/checklist-inspector-pro-dev.appspot.com/o/workspaces%2FhEoScaDVGCxD3V9rQFXq%2Finspections%2FlOkQi7u5pEYAlzo6bX6U%2Fphotos%2Ffor-eugene.jpg?alt=media&token=9e1d5c81-eb09-4f97-a711-53205e57a9f5";

  const annotationUrl =
    "https://firebasestorage.googleapis.com/v0/b/checklist-inspector-pro-dev.appspot.com/o/workspaces%2FhEoScaDVGCxD3V9rQFXq%2Finspections%2FlOkQi7u5pEYAlzo6bX6U%2Fphotos%2Ffor-eugene-annotation.png?alt=media&token=59e77878-d799-462b-a445-01852c34f1de";

  try {
    const imageRes = await fetch(imageUrl);
    const annotationRes = await fetch(annotationUrl);

    const imageBuffer = await imageRes.buffer();
    const annotationBuffer = await annotationRes.buffer();

    const output = await sharp(imageBuffer, { animated: true })
      .composite([
        {
          input: annotationBuffer,
          tile: true,
        },
      ])
      .toBuffer();

    fs.writeFileSync("images/output/output.jpg", output);
  } catch (err) {
    console.error(err);
  }
};

const zipImages = async () => {
  const zip = new JSZip();

  zip.file("output.jpg", fs.readFileSync("images/output/output.jpg"));

  zip
    .generateNodeStream({ type: "nodebuffer", streamfiles: true })
    .pipe(fs.createWriteStream("images/output/output.zip"))
    .on("finish", () => {
      console.log("output.zip written");
    });
};

const main = async () => {
  await combineImage();
  await zipImages();
};

main();
