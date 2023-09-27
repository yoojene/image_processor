import sharp from "sharp";
import fspromises from "fs/promises";
import fs from "fs";
import fse from "fs-extra";
import os from "node:os";
import path from "path";

const fetch = require("node-fetch");
const JSZip = require("jszip");
import { csvData } from "./csvdata";
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
    // Temp dir on Mac is /private/var/folders/jf/14xqzj7s6z12x5ydj0mzs71m0000gp/T
    const workingDir = path.join(os.tmpdir(), "csvimageexport/");

    await fse.ensureDir(workingDir);

    const filesPromise = imageAnnBufArr.map(async (image, idx) => {
      const output = await sharp(image.imageBuffer, { animated: true })
        .composite([
          {
            input: image.annotationBuffer,
            tile: true,
          },
        ])
        .toBuffer();
      const fileLocation = path.join(workingDir, `output${idx}.jpg`);
      console.log(fileLocation);
      await fspromises.writeFile(fileLocation, output);
    });

    // Resolve both promises so files are written
    await Promise.all(filesPromise);

    // Grab outputted files and zip into it's own folder
    const images = await fspromises.readdir(workingDir);
    const img = zip.folder("processed_images");

    const csv = zip.folder("csv").file("inspection_title.csv", csvData)

    for (const image of images) {
      if (image.endsWith(".jpg")) {
        const imageData = await fse.readFile(path.join(workingDir, `${image}`));
        img.file(image, imageData);
      }
    }

    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream(path.join(workingDir, "output.zip")))
      .on("finish", async () => {
        console.log("output.zip written");
        const finalZip = await fse.readFile(`${workingDir}output.zip`);
        const finalZipB64 = finalZip.toString("base64");
        return finalZipB64;
      });
  } catch (err) {
    console.error(err)
  }
}


const main = async () => {
  await combineImageAndZip();
};

main();
