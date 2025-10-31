/*
 Integration tests (runtime-only)

 - Uses real deployment outputs from cfn-outputs/flat-outputs.json
 - No config assertions, no environment/suffix checks, no mocking
 - Simulates live traffic: invokes scanner Lambdas, writes/reads results S3 bucket, publishes to SNS topic

 Prerequisites to run locally:
 - AWS credentials with access to the deployed resources
 - `cfn-outputs/flat-outputs.json` produced by the deployment
 - (Optional) set AWS_REGION in environment; otherwise region is inferred from ARNs
*/

import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';
import { TextDecoder, TextEncoder } from 'util';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

jest.setTimeout(180_000);

describe('Integration tests — runtime traffic checks', () => {
  let outputs: Record<string, any>;
  let region = process.env.AWS_REGION || '';
  let lambdaClient: LambdaClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Run deployment to produce cfn-outputs/flat-outputs.json`);
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) || {};

    // Try to infer region from any ARN in outputs if AWS_REGION not set
    if (!region) {
      const anyArn = Object.values(outputs).find((v) => typeof v === 'string' && v.startsWith('arn:aws:')) as string | undefined;
      if (anyArn) {
        const parts = anyArn.split(':');
        if (parts.length >= 4) region = parts[3];
      }
    }

    if (!region) region = 'us-east-1';

    lambdaClient = new LambdaClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  // Helper: find an outputs value whose string contains all of the provided substrings (case-insensitive)
  function findOutputValueContaining(...substrings: string[]) {
    const lowerSubs = substrings.map((s) => s.toLowerCase());
    return Object.values(outputs).find((v) => {
      if (typeof v !== 'string') return false;
      const lv = v.toLowerCase();
      return lowerSubs.every((s) => lv.includes(s));
    }) as string | undefined;
  }

  test('invoke EC2/RDS/S3 scanner lambdas (request/response) — should respond without FunctionError and produce observable side-effects', async () => {
    // Find scanner ARNs or function names by name patterns present in outputs
    function findLambdaIdentifier(namePart: string) {
      // Prefer an ARN value
      const arnVal = Object.values(outputs).find((v) => typeof v === 'string' && v.startsWith('arn:aws:lambda') && v.toLowerCase().includes(namePart));
      if (arnVal) return arnVal as string;
      // Next, try to find a log group value like /aws/lambda/<functionName> and extract functionName
      const lg = Object.values(outputs).find((v) => typeof v === 'string' && v.includes(`/aws/lambda/${namePart}`));
      if (lg && typeof lg === 'string') {
        const parts = lg.split('/');
        return parts[parts.length - 1];
      }
      // Fallback: any value that includes the namePart
      const anyVal = Object.values(outputs).find((v) => typeof v === 'string' && (v as string).toLowerCase().includes(namePart));
      return anyVal as string | undefined;
    }

    const ec2Arn = findLambdaIdentifier('ec2-compliance-scanner');
    const rdsArn = findLambdaIdentifier('rds-compliance-scanner');
    const s3Arn = findLambdaIdentifier('s3-compliance-scanner');

    const arns = [ec2Arn, rdsArn, s3Arn].filter(Boolean) as string[];
    if (arns.length === 0) {
      throw new Error('No scanner Lambda ARNs found in cfn-outputs/flat-outputs.json');
    }

    // Pre-flight: only test functions that actually exist in the account/region we are testing against.
    const existingArns: string[] = [];
    for (const arn of arns) {
      try {
        await lambdaClient.send(new GetFunctionCommand({ FunctionName: arn }));
        existingArns.push(arn);
      } catch (err: any) {
        const msg = String(err && (err.message || err.Code || err.name || err));
        if (msg.includes('Function not found') || msg.includes('ResourceNotFoundException') || msg.includes('ResourceNotFound')) {
          throw new Error(`Lambda function not found in this account/region: ${arn}`);
        }
        throw err;
      }
    }

    if (existingArns.length === 0) {
      console.warn('No scanner Lambda functions exist in the current account/region — skipping invocation checks');
      return;
    }

    function findLogGroupForArn(fnArn: string) {
      const fnName = fnArn.split(':').pop() || fnArn;
      return Object.values(outputs).find((v) => typeof v === 'string' && v.includes(`/aws/lambda/${fnName}`)) as string | undefined;
    }

    const bucketName = findOutputValueContaining('compliance-scan-results') || findOutputValueContaining('compliance', 'results') || findOutputValueContaining('bucket');

    for (const arn of existingArns) {
      const payload = JSON.stringify({ invocationTest: true, ts: Date.now() });
      const startTime = Date.now();

      const cmd = new InvokeCommand({ FunctionName: arn, InvocationType: 'RequestResponse', Payload: new TextEncoder().encode(payload) });
      let resp;
      try {
        resp = await lambdaClient.send(cmd);
      } catch (err: any) {
        if (err.name === 'AccessDeniedException' || (err.Code && err.Code === 'AccessDeniedException') || (err.message && err.message.includes('not authorized to perform: lambda:InvokeFunction'))) {
          throw new Error(`Lambda invoke failed - caller is not authorized to invoke ${arn}. Ensure the executing AWS principal has lambda:InvokeFunction permissions on the function or its resource.`);
        }
        throw err;
      }

      expect(resp.StatusCode).toBe(200);

      if (resp.FunctionError) {
        let payloadStr = '<empty>';
        try { if (resp.Payload) payloadStr = new TextDecoder().decode(resp.Payload as Uint8Array); } catch (e) { payloadStr = `<<decode failed: ${String(e)}>>`; }
        let parsed: any = null; try { parsed = JSON.parse(payloadStr); } catch (_) { /* ignore */ }
        const errMsg = parsed && (parsed.errorMessage || parsed.message) ? (parsed.errorMessage || parsed.message) : payloadStr;
        const stack = parsed && (parsed.stack || parsed.stackTrace) ? (parsed.stack || parsed.stackTrace) : '';

        // Treat any FunctionError as a test failure. Surface the handler payload for diagnostics.
        throw new Error(`Lambda ${arn} returned FunctionError=${resp.FunctionError}: ${errMsg}\n${stack}`);
      }

      let observed = false;
      const logGroup = findLogGroupForArn(arn);
      const filter = 'invocationTest';
      // Poll logs and S3 for up to ~20 seconds to detect an observable side-effect
      for (let i = 0; i < 20 && !observed; i++) {
        // Check CloudWatch Logs (if we have a log group registered in outputs)
        if (logGroup) {
          try {
            const logResp = await logsClient.send(new FilterLogEventsCommand({ logGroupName: logGroup, startTime, filterPattern: filter, limit: 50 }));
            if (logResp.events && logResp.events.some((e) => e.message && e.message.includes('invocationTest'))) observed = true;
          } catch (e) { /* ignore transient errors while polling */ }
        }

        // Check S3 for a recently created object (if a bucket name is available)
        if (!observed && bucketName) {
          try {
            const listResp = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 50 }));
            if (listResp.Contents && listResp.Contents.some((c) => c.LastModified && c.LastModified.getTime() >= startTime - 5000)) observed = true;
          } catch (e) { /* ignore transient permissions/errors while polling */ }
        }

        if (!observed) await new Promise((r) => setTimeout(r, 1000));
      }

      if (!observed) {
        throw new Error(`No observable side-effect (logs or new S3 objects) detected for invocation of ${arn}`);
      }
    }
  });

  test('write and read object to the compliance results S3 bucket', async () => {
    const bucketName = findOutputValueContaining('compliance-scan-results') || findOutputValueContaining('compliance', 'results') || findOutputValueContaining('bucket');
    if (!bucketName) {
      throw new Error('No S3 bucket name found in outputs (expected compliance results bucket)');
    }

    const key = `integration-test-${Date.now()}.txt`;
    const body = 'integration-test-content';

    const put = new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body });
    await expect(s3Client.send(put)).resolves.toBeDefined();

    const get = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const resp = await s3Client.send(get);
    const content = resp.Body && typeof (resp.Body as any).transformToString === 'function'
      ? await (resp.Body as any).transformToString()
      : await (async () => {
        const chunks: Uint8Array[] = [];
        // @ts-ignore
        for await (const chunk of resp.Body) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        return Buffer.concat(chunks).toString('utf8');
      })();

    expect(content).toBe(body);
  });

  test('publish a message to the compliance SNS topic', async () => {
    const topicArn = findOutputValueContaining('compliance-violations') || findOutputValueContaining('violations') || Object.values(outputs).find((v) => typeof v === 'string' && v.startsWith('arn:aws:sns:')) as string | undefined;
    if (!topicArn) {
      throw new Error('No SNS topic ARN found in outputs (expected compliance violations SNS topic)');
    }

    try {
      const cmd = new PublishCommand({ TopicArn: topicArn, Message: 'integration-test-message' });
      const resp = await snsClient.send(cmd);
      expect(resp.MessageId).toBeDefined();
    } catch (err: any) {
      // Propagate a clearer error for common auth issues
      if (err.name === 'AuthorizationErrorException' || (err.Code && err.Code === 'AuthorizationErrorException')) {
        throw new Error(`SNS publish failed - caller is not authorized to publish to ${topicArn}. Ensure the executing AWS principal has sns:Publish permissions. Original error: ${err.message || String(err)}`);
      }
      throw err;
    }
  });
});