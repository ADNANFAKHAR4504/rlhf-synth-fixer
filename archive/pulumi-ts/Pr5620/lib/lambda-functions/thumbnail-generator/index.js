const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const s3 = new S3Client({});

const streamToBuffer = async (body) => {
    if (!body) {
        throw new Error('Response payload did not include a readable body.');
    }

    if (Buffer.isBuffer(body)) {
        return body;
    }

    const chunks = [];
    for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};

const parseEventPayload = (event = {}) => {
    if (event.body) {
        const rawBody = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
        try {
            return JSON.parse(rawBody);
        } catch (error) {
            throw new Error(`Unable to parse request body as JSON: ${error.message}`);
        }
    }

    const s3Record = Array.isArray(event.Records) ? event.Records[0] : undefined;
    if (s3Record?.s3?.bucket?.name && s3Record?.s3?.object?.key) {
        return {
            sourceBucket: s3Record.s3.bucket.name,
            sourceKey: decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' ')),
        };
    }

    return event;
};

exports.handler = async (event) => {
    console.log('Thumbnail generation invoked', JSON.stringify(event));

    const payload = parseEventPayload(event);
    const inputBucket = payload.sourceBucket || process.env.INPUT_BUCKET;
    const inputKey = payload.sourceKey || payload.key;
    const outputBucket = payload.targetBucket || process.env.OUTPUT_BUCKET;

    if (!inputBucket || !outputBucket || !inputKey) {
        console.error('Missing required parameters', { inputBucket, outputBucket, inputKey });
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'SOURCE_BUCKET, OUTPUT_BUCKET, and object key are required.',
            }),
        };
    }

    const width = Number(payload.width) || 320;
    const height = Number(payload.height) || 240;
    const format = payload.format || 'jpeg';
    const outputKey =
        payload.targetKey ||
        payload.outputKey ||
        `thumbnails/${width}x${height}-${inputKey.replace(/\//g, '_')}.${format}`;

    try {
        const sourceObject = await s3.send(
            new GetObjectCommand({
                Bucket: inputBucket,
                Key: inputKey,
            })
        );

        const sourceBuffer = await streamToBuffer(sourceObject.Body);

        const transformed = await sharp(sourceBuffer)
            .resize(width, height, { fit: 'cover' })
            .toFormat(format)
            .toBuffer();

        await s3.send(
            new PutObjectCommand({
                Bucket: outputBucket,
                Key: outputKey,
                Body: transformed,
                ContentType: `image/${format}`,
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Thumbnail generated successfully',
                inputBucket,
                outputBucket,
                inputKey,
                outputKey,
                width,
                height,
                format,
            }),
        };
    } catch (error) {
        console.error('Thumbnail generation failed', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Thumbnail generation failed',
                details: error.message,
            }),
        };
    }
};
