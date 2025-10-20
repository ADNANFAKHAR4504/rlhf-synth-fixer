import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const OUTPUTS_FILE = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');


describe('Integration tests (end-to-end)', () => {
  let outputs: Record<string, string> = {};
  let apiBase: string | undefined;
  let tableName: string | undefined;
  let bucketName: string | undefined;

  beforeAll(async () => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Deployment outputs file not found: ${OUTPUTS_FILE}. Run deployment and generate cfn-outputs/flat-outputs.json before running integration tests.`);
    }
    const raw = fs.readFileSync(OUTPUTS_FILE, 'utf8');
    outputs = JSON.parse(raw || '{}');

    // Discover API endpoint by looking for any output value containing execute-api
    const allValues = Object.values(outputs).map(String);
    apiBase = allValues.find((v) => v.includes('execute-api'));

    // For bucket and table, we will probe candidate values
    bucketName = undefined;
    tableName = undefined;

    // Normalize apiBase to ensure trailing slash if found
    if (apiBase && !apiBase.endsWith('/')) apiBase += '/';

    // Configure AWS SDK region from environment or infer from API URL host
    if (!process.env.AWS_REGION) {
      try {
        if (!apiBase) throw new Error('apiBase not available to infer AWS region');
        const url = new URL(apiBase);
        if (url.hostname.includes('execute-api')) {
          const parts = url.hostname.split('.');
          // e.g. xk3kh2sdsh.execute-api.us-east-2.amazonaws.com
          const region = parts[2] || 'us-east-1';
          process.env.AWS_REGION = region;
        } else {
          process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
        }
      } catch (e) {
        process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
      }
    }

    const s3 = new AWS.S3();
    const ddb = new AWS.DynamoDB();
  for (const val of allValues) {
      if (!bucketName) {
        try {
          // headBucket will succeed if it's a real bucket
          // Use a small timeout by relying on AWS SDK default
          // Note: this may throw if the name is not a bucket
          // so we catch and continue
          // eslint-disable-next-line no-await-in-loop
          // @ts-ignore - using promise() on SDK call
          await s3.headBucket({ Bucket: String(val) }).promise();
          bucketName = String(val);
        } catch (e) {
          // not a bucket, continue
        }
      }

      if (!tableName) {
        try {
          // If val is a string, try to describe table
          // eslint-disable-next-line no-await-in-loop
          // @ts-ignore
          await ddb.describeTable({ TableName: String(val) }).promise();
          tableName = String(val);
        } catch (e) {
          // not a table, continue
        }
      }

      if (bucketName && tableName) break;
    }

    if (!apiBase || !tableName || !bucketName) {
      throw new Error(`Required outputs not found in ${OUTPUTS_FILE}. Found keys: ${Object.keys(outputs).join(', ')}`);
    }
  });

  // Helper: find Lambda function(s) that reference the table name in their env and fetch recent error logs
  async function fetchLambdaLogsForTable(table: string) {
    const lambda = new AWS.Lambda();
    const logs = new AWS.CloudWatchLogs();
    // List functions and filter by environment variables containing the table name
    const funcs = await lambda.listFunctions({ MaxItems: 50 }).promise();
    const matches: string[] = [];
    for (const f of funcs.Functions || []) {
      try {
        const conf = await lambda.getFunctionConfiguration({ FunctionName: f.FunctionName! }).promise();
        if (conf.Environment && conf.Environment.Variables) {
          const vals = Object.values(conf.Environment.Variables).map(String);
          if (vals.includes(table) || vals.some((v) => v.includes(table))) {
            matches.push(String(f.FunctionName));
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const out: Record<string, string[]> = {};
    // only fetch for first few matches and limit time window to last 5 minutes
    const windowMs = 1000 * 60 * 5;
    const startTime = Date.now() - windowMs;
    for (const name of matches.slice(0, 3)) {
      const lg = `/aws/lambda/${name}`;
      try {
        const ev = await logs
          .filterLogEvents({ logGroupName: lg, limit: 50, startTime })
          .promise();
        out[name] = (ev.events || []).map((e) => `${e.timestamp}: ${e.message}`);
      } catch (e) {
        out[name] = [`failed to read logs: ${String(e)}`];
      }
    }
    return out;
  }

  test('POST /items stores an item and DynamoDB contains it', async () => {
    expect(apiBase).toBeDefined();
    expect(tableName).toBeDefined();
    const id = uuidv4();

    // POST item to API
    const url = new URL('items', apiBase!).toString();
    const payload = { id, payload: { hello: 'world' } };

    let postRes;
    try {
      postRes = await axios.post(url, payload, { timeout: 10000, validateStatus: () => true });
    } catch (err: any) {
      throw new Error(`API POST failed: ${err?.message || String(err)}`);
    }

    // If the API didn't return expected 200/201, fetch Lambda logs for debugging
    if (![200, 201].includes(postRes.status)) {
      const logs = await fetchLambdaLogsForTable(tableName!);
      throw new Error(`API returned ${postRes.status}. Recent Lambda logs: ${JSON.stringify(logs, null, 2)}`);
    }

    // Verify DynamoDB contains the item
    const doc = new AWS.DynamoDB.DocumentClient();
    const get = await doc.get({ TableName: tableName!, Key: { id } }).promise();
    const itemRaw = get.Item;
    expect(itemRaw).toBeDefined();
    if (!itemRaw) throw new Error('DynamoDB item not found');
    const item = itemRaw as { id: string; [key: string]: any };
    expect(item.id).toBe(id);

    // Send payload without id (should return 400)
    const res = await axios.post(url, { payload: { a: 1 } }, { validateStatus: () => true, timeout: 10000 });
    expect(res.status).toBe(400);
  }, 60000);

  test('S3 logs bucket exists', async () => {
    const s3 = new AWS.S3();
    const head = await s3.headBucket({ Bucket: bucketName! }).promise().catch((err) => {
      throw new Error(`S3 headBucket failed: ${err.message}`);
    });
    expect(head).toBeDefined();
  }, 20000);

});
// integration test file ends here
