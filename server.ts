// server.ts
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';


// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
    const server = express();
    const serverDistFolder = dirname(fileURLToPath(import.meta.url));
    const browserDistFolder = resolve(serverDistFolder, '../browser');
    const indexHtml = join(serverDistFolder, 'index.server.html');
    const commonEngine = new CommonEngine();

    const auth = new GoogleAuth();

    server.set('view engine', 'html');
    server.set('views', browserDistFolder);

    // Example Express Rest API endpoints
    server.get('/api/facts', async (req, res) => {
        const project = await auth.getProjectId();

        const vertex = new VertexAI({ project: project });
        const generativeModel = vertex.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const animal = req.query['animal'] || 'dog';
        const prompt = `Give me 10 fun facts about ${animal}. 
                        Return as json as an array in the format ['fact 1', 'fact 2']
                        Remove backticks and other markdown formatting.`;

        const resp = await generativeModel.generateContent(prompt);
        let factArray = '';

        if (resp.response.candidates) {
            factArray = JSON.parse(resp.response.candidates[0].content.parts[0].text || '');
        }
        res.send(factArray);
    });

    // Serve static files from /browser
    server.get('**', express.static(browserDistFolder, {
        maxAge: '1y',
        index: 'index.html',
    }));

    // All regular routes use the Angular engine
    server.get('**', (req, res, next) => {
        const { protocol, originalUrl, baseUrl, headers } = req;

        commonEngine
            .render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: browserDistFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            })
            .then((html) => res.send(html))
            .catch((err) => next(err));
    });

    return server;
}

function run(): void {
    const port = process.env['PORT'] || 4000;

    // Start up the Node server
    const server = app();
    server.listen(port, () => {
        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}

run();