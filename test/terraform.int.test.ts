/**
 * terraform.int.test.ts — 30 discrete integration test cases
 *
 * Source of truth for outputs:
 *  1) ./cfn-outputs/flat-outputs.json   (real pipeline)
 *  2) ./default output                        (local fallback for dev/demo)
 *
 * Each test:
 *  - Invokes lambda1 to write an item (unique id)
 *  - Invokes lambda2 to read the same item
 *  - Verifies the item exists directly in DynamoDB
 *
 * Notes:
 *  - We generate EXACTLY 30 test cases via Jest `test.each`.
 *  - Tests share AWS clients created in beforeAll.
 *  - Timeout increased for network I/O.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import path from 'path';

// Allow ample time for 30 real AWS round-trips
jest.setTimeout(300_000);

type FlatOutputs = Record<string, unknown>;

let outputs: FlatOutputs | undefined;
let SKIP = false;

// Read helper for flat or { value, sensitive } shapes
const getOut = (key: string): any => {
  if (!outputs) return undefined;
  const v: any = (outputs as any)[key];
  if (v && typeof v === 'object' && 'value' in v) return (v as any).value;
  return v;
};

let region: string = process.env.AWS_REGION || 'us-east-1';
let lambdaClient: LambdaClient | undefined;
let ddb: DynamoDBClient | undefined;
let doc: DynamoDBDocumentClient | undefined;

/**
 * Provided snippet (real pipeline), with a local fallback
 */
beforeAll(() => {
  // Read deployment outputs
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  } else {
    // Fallback to local default output for dev
    const alt = path.join(__dirname, '../lib/flat-outputs.json');
    if (fs.existsSync(alt)) {
      outputs = JSON.parse(fs.readFileSync(alt, 'utf-8'));
      console.warn('Using local default output as outputs fallback');
    } else {
      // Skip tests if no outputs found
      console.warn('No deployment outputs found, skipping integration tests');
      SKIP = true;
      return;
    }
  }

  // Configure region and clients
  region = (getOut('region') as string) || region;
  lambdaClient = new LambdaClient({ region });
  ddb = new DynamoDBClient({ region });
  doc = DynamoDBDocumentClient.from(ddb);
});

const describeIf = (cond: boolean) => (cond ? describe : describe.skip);

// Build 30 unique test ids
const CASES: string[] = Array.from({ length: 30 }, (_, i) => `case-${Date.now()}-${i}`);

describeIf(!SKIP)('serverless baseline — 30 test cases', () => {
  test('sanity: outputs present', () => {
    const required = [
      'lambda1_name',
      'lambda2_name',
      'dynamodb_table_name',
      'region',
    ];
    const missing = required.filter((k) => !getOut(k));
    if (missing.length) throw new Error(`Missing required outputs: ${missing.join(', ')}`);
  });

  test.each(CASES)('e2e #%# — write/read/get id=%s', async (id) => {
    if (!lambdaClient || !doc) throw new Error('AWS clients not initialised');

    const lambda1 = String(getOut('lambda1_name'));
    const lambda2 = String(getOut('lambda2_name'));
    const tableName = String(getOut('dynamodb_table_name'));

    // 1) write via lambda1
    const invoke1 = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambda1,
        Payload: Buffer.from(JSON.stringify({ id }), 'utf-8'),
      })
    );
    expect(invoke1.StatusCode && invoke1.StatusCode >= 200 && invoke1.StatusCode < 300).toBe(true);
    const payload1 = invoke1.Payload ? Buffer.from(invoke1.Payload).toString('utf-8') : '{}';
    const resp1 = safeJson(payload1);
    const body1 = typeof resp1?.body === 'string' ? safeJson(resp1.body) : resp1?.body;
    expect(body1).toBeTruthy();
    expect(body1?.written?.id ?? body1?.id).toBe(id);

    // 2) read via lambda2
    const invoke2 = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambda2,
        Payload: Buffer.from(JSON.stringify({ id }), 'utf-8'),
      })
    );
    expect(invoke2.StatusCode && invoke2.StatusCode >= 200 && invoke2.StatusCode < 300).toBe(true);
    const payload2 = invoke2.Payload ? Buffer.from(invoke2.Payload).toString('utf-8') : '{}';
    const resp2 = safeJson(payload2);
    const body2 = typeof resp2?.body === 'string' ? safeJson(resp2.body) : resp2?.body;
    expect(body2).toBeTruthy();
    expect(body2?.id ?? body2?.written?.id).toBe(id);

    // 3) read directly from DynamoDB
    const getResp = await doc.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    expect(getResp.Item).toBeTruthy();
    expect(getResp.Item?.id).toBe(id);
  });
});

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
