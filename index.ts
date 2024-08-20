import { Hono } from "hono";
import bun from "bun";
import puppeteer from "puppeteer";
import cloudinary from 'cloudinary';

const app = new Hono();

cloudinary.v2.config({
    secure: true
});

app.get("/screenshot", async (c) => {

    const url = c.req.query("url");
    const filename = c.req.query("filename");

    if(!url || !filename) {
        return c.text("Please provide both url and filename", 400);
    }

    await takeScreenshot(url, filename);
    return c.text("Screenshot taken successfully");
})

app.get("/upload", async (c) => {
    
    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
    };

    try
    {
        // Upload the image
        const result = await cloudinary.v2.uploader.upload("./screenshots/" + c.req.query("filename"), options);
        console.log(result);
        return c.text(`Image Uploaded Successfully ${result}`);
    }
    catch (error) {
        console.error(error);
        return c.text(`Error During Image Upload ${error}`);
    }
})

app.get("/get", async (c) => {

    const publicId = c.req.query("publicId");

    const options = {
        colors: true,
    };

    if(!publicId) {
        return c.text("Please provide publicId", 400);
    }

    const result = await cloudinary.v2.api.resource(publicId, options);
    return c.json(result);
})

const server = bun.serve({ port: 3000, fetch: app.fetch });


console.log(`Listening on http://localhost:${server.port} ...`);



async function takeScreenshot(url : string, outputPath : string) {
    try
    {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(url, { waitUntil: 'networkidle2' });

        await page.screenshot({ path: `./screenshots/${outputPath}`, type: 'webp', optimizeForSpeed: true });
        await browser.close();

        console.log('Screenshot taken successfully');
    }
    catch (error)
    {
        console.error('Error taking screenshot:', error);
    }
}

//