import sharp from "sharp";
import fspromises from "fs/promises";
import fs from "fs";
const fetch = require("node-fetch");
const JSZip = require("jszip");

const combineImageAndZip = async () => {
  const imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/checklist-inspector-pro-dev.appspot.com/o/workspaces%2FhEoScaDVGCxD3V9rQFXq%2Finspections%2FlOkQi7u5pEYAlzo6bX6U%2Fphotos%2Ffor-eugene.jpg?alt=media&token=9e1d5c81-eb09-4f97-a711-53205e57a9f5";

  const annotationUrl =
    "https://firebasestorage.googleapis.com/v0/b/checklist-inspector-pro-dev.appspot.com/o/workspaces%2FhEoScaDVGCxD3V9rQFXq%2Finspections%2FlOkQi7u5pEYAlzo6bX6U%2Fphotos%2Ffor-eugene-annotation.png?alt=media&token=59e77878-d799-462b-a445-01852c34f1de";

  try {
    const imageRes = await fetch(imageUrl);
    const annotationRes = await fetch(annotationUrl);

    const imageBuffer = await imageRes.buffer();
    const annotationBuffer = await annotationRes.buffer();

    // Testing with multiple images
    const imageAnnBufArr = [
      { imageBuffer, annotationBuffer },
      { imageBuffer, annotationBuffer },
    ];
    const zip = new JSZip();
    const filesPromise = imageAnnBufArr.map(async (image, idx) => {
      const output = await sharp(image.imageBuffer, { animated: true })
        .composite([
          {
            input: image.annotationBuffer,
            tile: true,
          },
        ])
        .toBuffer();

      await fspromises.writeFile(`images/output/output${idx}.jpg`, output);
    });

    // Resolve both promises so files are written
    await Promise.all(filesPromise);


    // Grab outputted files and zip into it's own folder
    const images = await fspromises.readdir("images/output");
    const img = zip.folder("images");

    for (const image of images) {
      if (image.endsWith(".jpg")) {
        const imageData = await fspromises.readFile(`images/output/${image}`);
        img.file(image, imageData);
      }
    }

    zip
      .generateNodeStream({ type: "nodebuffer", streamfiles: true })
      .pipe(fs.createWriteStream("images/output/output.zip"))
      .on("finish", () => {
        console.log("output.zip written");
      });
  } catch (err) {
    console.error(err)
  }
}


const main = async () => {
  await combineImageAndZip();
};

main();
