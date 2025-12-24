import { Duration, aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiLambdaProps {
  role: import('aws-cdk-lib').aws_iam.Role;
  bucketName: string;
  code?: lambda.Code;
}

export class ApiLambda extends Construct {
  public readonly func: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    if (!props || !props.role) {
      throw new Error('ApiLambda: "role" prop is required');
    }
    if (
      props.bucketName === undefined ||
      props.bucketName === null ||
      props.bucketName === ''
    ) {
      throw new Error('ApiLambda: "bucketName" prop is required');
    }

    this.func = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: props.role,
      timeout: Duration.seconds(10),
      environment: { BUCKET_NAME: props.bucketName },
      code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
        const s3 = new S3Client({});
        const { BUCKET_NAME } = process.env;
        exports.handler = async (event) => {
          const method = (event.httpMethod || '').toUpperCase();
          const key = (event.queryStringParameters && event.queryStringParameters.key) || 'example.txt';
          if (method === 'PUT') {
            const body = event.body || 'hello';
            await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ServerSideEncryption: 'aws:kms' }));
            return { statusCode: 200, body: JSON.stringify({ ok: true, wrote: key }) };
          }
          if (method === 'GET') {
            const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
            const streamToString = (stream) => new Promise((resolve, reject) => {
              const chunks = [];
              stream.on('data', (c) => chunks.push(c));
              stream.on('error', reject);
              stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            });
            const body = await streamToString(res.Body);
            return { statusCode: 200, body };
          }
          return { statusCode: 405, body: 'Method Not Allowed' };
        };
      `),
    });
  }
}
