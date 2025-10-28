// test/terraform.int.test.ts
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import * as https from "https";
import { URL } from "url";

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetBucketLocationCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  PutObjectAclCommand,
} from "@aws-sdk/client-s3";

import {
  DynamoDBClient,
  DescribeTableCommand,
  GetItemCommand,
  ScanCommand,
  DescribeContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";

import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

import {
  EC2Client,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";

import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  SSMClient,
  SendCommandCommand,
  ListCommandInvocationsCommand, // kept for parity if you use it later
} from "@aws-sdk/client-ssm";

// ---------------- Helpers ----------------
const REGION = process.env.AWS_REGION || "us-east-1";

// non-keepalive agent avoids TLSWRAP lingering handles
const HTTPS_AGENT = new https.Agent({ keepAlive: false, maxSockets: 1 });

function loadOutputs(): Record<string, any> {
  const p = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
  const raw = fs.readFileSync(p, "utf8");
  const obj = JSON.parse(raw);
  console.log(`Found outputs (${Object.keys(obj).length} keys) at ${p}`);
  return obj;
}

async function ensureS3ClientForBucket(base: S3Client, bucket: string): Promise<S3Client> {
  try {
    const gl = await base.send(new GetBucketLocationCommand({ Bucket: bucket }));
    const loc = gl.LocationConstraint || "us-east-1"; // undefined/"" => us-east-1
    if ((base as any).config.region === loc) return base;
    return new S3Client({ region: loc });
  } catch {
    return base;
  }
}

// HTTPS JSON POST without fetch (prevents open handles)
function httpsPostJson(urlStr: string, body: any, timeoutMs = 8000): Promise<{ status: number; text: string; json?: any }> {
  const u = new URL(urlStr);
  const payload = Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: "POST",
        headers: { "content-type": "application/json", "content-length": String(payload.length) },
        agent: HTTPS_AGENT,
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try { (res.socket as any)?.end?.(); } catch {}
          let parsed: any;
          try { parsed = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode || 0, text: data, json: parsed });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("HTTP timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function countApiRequestItems(ddb: DynamoDBClient, table: string): Promise<number> {
  const resp = await ddb.send(new ScanCommand({
    TableName: table,
    FilterExpression: "#et = :api",
    ExpressionAttributeNames: { "#et": "event_type" },
    ExpressionAttributeValues: { ":api": { S: "api_request" } },
    Limit: 100,
  }));
  return resp.Count ?? 0;
}

async function waitForDdbS3EventWithKey(ddb: DynamoDBClient, table: string, key: string, attempts = 24, delayMs = 5000): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const scan = await ddb.send(new ScanCommand({
      TableName: table,
      FilterExpression: "#et = :s3 AND #k = :key",
      ExpressionAttributeNames: { "#et": "event_type", "#k": "key" },
      ExpressionAttributeValues: { ":s3": { S: "s3_event" }, ":key": { S: key } },
      Limit: 50,
    }));
    if ((scan.Items || []).length > 0) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

// ---- AWS clients ----
const s3 = new S3Client({ region: REGION });
const ddb = new DynamoDBClient({ region: REGION });
const lambda = new LambdaClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });
const logs = new CloudWatchLogsClient({ region: REGION });
const ssm = new SSMClient({ region: REGION });

// ---- Shared outputs (module scope) ----
const OUT = loadOutputs();

const S3_BUCKET   = OUT["S3BucketName"] as string;
const DDB_TABLE   = OUT["DynamoDBTableName"] as string;
const LAMBDA_NAME = (OUT["LambdaFunctionName"] || "") as string;
const API_URL     = OUT["ApiGatewayUrl"] as string;
const KMS_ARN     = OUT["KMSKeyArn"] as string;
const EC2_ID      = (OUT["EC2InstanceId"] || "") as string;
const STACK_NAME  = OUT["StackName"] as string;
const API_ID      = OUT["ApiGatewayId"] as string;

// ---------------- Tests ----------------
describe("tap_stack — Integration (Terraform)", () => {
  // ---------- Outputs presence & format ----------
  describe("Outputs presence & format", () => {
    it("contains expected outputs (non-empty)", () => {
      const expected = [
        "Environment","StackName",
        "S3BucketName","S3BucketArn",
        "DynamoDBTableName","DynamoDBTableArn",
        "ApiGatewayUrl","ApiGatewayId",
        "KMSKeyId","KMSKeyArn",
        "EC2InstanceId","EC2PublicIp",
      ];
      for (const k of expected) {
        expect(OUT).toHaveProperty(k);
        const val = String(OUT[k] ?? "");
        expect(val.length).toBeGreaterThan(0);
      }
    });

    it("KMS ARN looks well-formed", () => {
      expect(String(KMS_ARN)).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[0-9a-f-]+$/);
    });

    it("API Gateway URL format is valid for /process", () => {
      expect(String(API_URL)).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[A-Za-z0-9_-]+\/process$/);
    });
  });

  // ---------- S3 posture + basic IO ----------
  describe("S3 (posture + IO)", () => {
    it("Put + Head roundtrip (bucket-region client)", async () => {
      const regional = await ensureS3ClientForBucket(s3, S3_BUCKET);
      const key = `int-test/${randomUUID()}.txt`;
      await regional.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: `hello-${Date.now()}` }));
      const head = await regional.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      expect(head.$metadata.httpStatusCode).toBe(200);
    }, 12_000);

    it("Versioning + PublicAccessBlock + SSE-KMS enabled", async () => {
      const regional = await ensureS3ClientForBucket(s3, S3_BUCKET);

      const ver = await regional.send(new GetBucketVersioningCommand({ Bucket: S3_BUCKET }));
      expect(ver.Status).toBe("Enabled");

      const pab = await regional.send(new GetPublicAccessBlockCommand({ Bucket: S3_BUCKET }));
      const c = pab.PublicAccessBlockConfiguration!;
      expect(Boolean(c.BlockPublicAcls && c.BlockPublicPolicy && c.IgnorePublicAcls && c.RestrictPublicBuckets)).toBe(true);

      const enc = await regional.send(new GetBucketEncryptionCommand({ Bucket: S3_BUCKET }));
      const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    }, 12_000);
  });

  // ---------- DynamoDB existence ----------
  describe("DynamoDB", () => {
    it("table exists", async () => {
      const desc = await ddb.send(new DescribeTableCommand({ TableName: DDB_TABLE }));
      expect(desc.Table?.TableName).toBe(DDB_TABLE);
    }, 10_000);
  });

  // ---------- Lambda existence ----------
  describe("Lambda", () => {
    it("function exists and runtime is python3.9", async () => {
      const cfg = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_NAME }));
      expect(cfg.FunctionName).toBe(LAMBDA_NAME);
      expect(cfg.Runtime).toBe("python3.9");
    }, 10_000);
  });

  // ---------- API Gateway reachability ----------
  describe("API Gateway (client)", () => {
    it("POST /process responds 2xx", async () => {
      const res = await httpsPostJson(API_URL, { e2e: "client->api->lambda->ddb", uuid: randomUUID() }, 8000);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    }, 12_000);
  });

  // ---------- E2E: Client -> API -> Lambda -> DDB (count increase) ----------
  describe("E2E (client): API → Lambda → DynamoDB (count +3)", () => {
    it("3 POSTs increase 'api_request' items by ≥ 3", async () => {
      const before = await countApiRequestItems(ddb, DDB_TABLE);

      for (let i = 0; i < 3; i++) {
        await httpsPostJson(API_URL, { e2e_batch: i, uuid: randomUUID() }, 8000);
      }

      // wait for Lambda/DDB eventual consistency
      let after = before;
      for (let i = 0; i < 12; i++) {
        after = await countApiRequestItems(ddb, DDB_TABLE);
        if (after - before >= 3) break;
        await new Promise((r) => setTimeout(r, 5000));
      }
      expect(after - before).toBeGreaterThanOrEqual(3);
    }, 60_000);
  });

  // ---------- E2E: Client -> S3 (unique key) -> Lambda -> DDB (exact key) ----------
  describe("E2E (client): S3 → Lambda → DynamoDB (exact key)", () => {
    it("upload unique key → exact DDB item (event_type=s3_event, key match)", async () => {
      const regional = await ensureS3ClientForBucket(s3, S3_BUCKET);
      const key = `e2e-client/${Date.now()}-${randomUUID()}.txt`;

      await regional.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: "e2e-client-upload" }));
      const ok = await waitForDdbS3EventWithKey(ddb, DDB_TABLE, key, 24, 5000);
      expect(ok).toBe(true);
    }, 90_000);
  });


  // ---------- E2E (EC2/SSM): EC2 -> S3 (unique) -> Lambda -> DDB (exact key) ----------
  describe("E2E (EC2/SSM): EC2 → S3 → Lambda → DDB", () => {
    it("EC2 uploads unique key → DDB has s3_event with that key", async () => {
      const key = `e2e-ec2/${Date.now()}-${randomUUID()}.txt`;
      const cmd = [
        "set -euo pipefail",
        `aws s3api put-object --bucket "${S3_BUCKET}" --key "${key}" --body /etc/hostname --output json || true`,
        `echo "DONE"`,
      ].join("\n");

      const send = await ssm.send(new SendCommandCommand({
        InstanceIds: [EC2_ID],
        DocumentName: "AWS-RunShellScript",
        Parameters: { commands: [cmd] },
        TimeoutSeconds: 120,
      }));
      const commandId = send.Command?.CommandId;
      expect(commandId).toBeDefined();

      // quick settle before scanning DDB
      await new Promise((r) => setTimeout(r, 5000));
      const ok = await waitForDdbS3EventWithKey(ddb, DDB_TABLE, key, 24, 5000);
      expect(ok).toBe(true);
    }, 120_000);
  });

  // ---------- E2E (EC2/SSM): EC2 -> API GW -> Lambda -> DDB (count increase) ----------
  describe("E2E (EC2/SSM): EC2 → API Gateway → Lambda → DDB (count +2)", () => {
    it("2 POSTs from EC2 increase 'api_request' items by ≥ 2", async () => {
      const before = await countApiRequestItems(ddb, DDB_TABLE);
      const payloadA = JSON.stringify({ ec2_ssm: "okA", uuid: randomUUID() });
      const payloadB = JSON.stringify({ ec2_ssm: "okB", uuid: randomUUID() });
      const cmd = [
        "set -euo pipefail",
        `curl -s -X POST -H 'content-type: application/json' -d '${payloadA.replace(/'/g, "'\\''")}' '${API_URL}' >/dev/null || true`,
        `curl -s -X POST -H 'content-type: application/json' -d '${payloadB.replace(/'/g, "'\\''")}' '${API_URL}' >/dev/null || true`,
        "echo DONE",
      ].join("\n");

      const send = await ssm.send(new SendCommandCommand({
        InstanceIds: [EC2_ID],
        DocumentName: "AWS-RunShellScript",
        Parameters: { commands: [cmd] },
        TimeoutSeconds: 120,
      }));
      const commandId = send.Command?.CommandId;
      expect(commandId).toBeDefined();

      // allow eventual consistency; then compare count
      let after = before;
      for (let i = 0; i < 12; i++) {
        after = await countApiRequestItems(ddb, DDB_TABLE);
        if (after - before >= 2) break;
        await new Promise((r) => setTimeout(r, 5000));
      }
      expect(after - before).toBeGreaterThanOrEqual(2);
    }, 180_000);
  });

  // ---------- Posture: DynamoDB SSE-KMS + PITR ----------
  describe("DynamoDB posture (SSE-KMS + PITR)", () => {
    it("table is encrypted with our KMS key", async () => {
      const d = await ddb.send(new DescribeTableCommand({ TableName: DDB_TABLE }));
      const km = d.Table?.SSEDescription?.KMSMasterKeyArn || "";
      const st = d.Table?.SSEDescription?.Status || "";
      expect(st).toMatch(/ENABLED|ENABLING/);
      expect(km).toBe(KMS_ARN);
    }, 12_000);

    it("point-in-time recovery (PITR) is enabled", async () => {
      const cb = await ddb.send(new DescribeContinuousBackupsCommand({ TableName: DDB_TABLE }));
      const pitr = cb.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
      expect(pitr).toBe("ENABLED");
    }, 12_000);
  });

  // ---------- Posture: Lambda env + log group KMS ----------
  describe("Lambda integration posture", () => {
    it("env vars wired (DYNAMODB_TABLE, S3_BUCKET, KMS_KEY_ID)", async () => {
      const cfg = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_NAME }));
      const env = cfg.Environment?.Variables || {};
      expect(env["DYNAMODB_TABLE"]).toBe(DDB_TABLE);
      expect(env["S3_BUCKET"]).toBe(S3_BUCKET);
      expect((env["KMS_KEY_ID"] || "").length).toBeGreaterThan(10);
    }, 10_000);

    it("lambda log group is KMS-encrypted with our key", async () => {
      const lgName = `/aws/lambda/${LAMBDA_NAME}`;
      const d = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lgName, limit: 1 }));
      const lg = (d.logGroups || []).find(g => g.logGroupName === lgName);
      expect(lg).toBeDefined();
      expect(lg?.kmsKeyId).toBe(KMS_ARN);
    }, 10_000);
  });

  // ---------- Posture: API Gateway access logs ----------
  describe("API Gateway access logs", () => {
    it("POST creates a fresh log event in /aws/apigateway/<StackName>-api", async () => {
      const lgName = `/aws/apigateway/${STACK_NAME}-api`;

      // 1) Fire a request to generate an access log line
      const res = await httpsPostJson(API_URL, { log_probe: true, uuid: randomUUID() }, 8000);
      expect(res.status).toBeGreaterThanOrEqual(200);

      const started = Date.now();
      const startTime = started - 10_000;
      let seen = false;
      let attempts = 0;

      while (!seen && attempts < 24) { // ~2 minutes max (24 * 5s)
        attempts += 1;
        const fe = await logs.send(new FilterLogEventsCommand({
          logGroupName: lgName,
          startTime,
          interleaved: true,
        }));

        if ((fe.events || []).length > 0) {
          seen = true;
          break;
        }
        await new Promise(r => setTimeout(r, 5000));
      }

      expect(seen).toBe(true);
    }, 120_000); // allow up to 2 minutes
  });

  // ---------- Posture: S3 PAB enforcement ----------
  describe("S3 public ACLs are blocked by PAB", () => {
    it("put-object-acl public-read is denied", async () => {
      const regional = await ensureS3ClientForBucket(s3, S3_BUCKET);
      const key = `pab-test/${randomUUID()}.txt`;
      // ensure object exists
      await regional.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: "pab-test" }));
      let denied = false;
      try {
        await regional.send(new PutObjectAclCommand({ Bucket: S3_BUCKET, Key: key, ACL: "public-read" }));
      } catch {
        // Either AccessDenied or a 400 with error code
        denied = true;
      }
      expect(denied).toBe(true);
    }, 20_000);
  });

  // ---------- Posture: S3 SSE-KMS actually applied on objects ----------
  describe("S3 default SSE-KMS is applied", () => {
    it("head-object shows aws:kms and our KMS key", async () => {
      const regional = await ensureS3ClientForBucket(s3, S3_BUCKET);
      const key = `sse-kms/${randomUUID()}.txt`;
      await regional.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: "kms-check" }));
      const head = await regional.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      expect(head.ServerSideEncryption).toBe("aws:kms");
      expect(head.SSEKMSKeyId).toBe(KMS_ARN);
    }, 20_000);
  });
});

// Clean teardown — destroy SDK clients and agent to avoid open handles
afterAll(async () => {
  try { s3.destroy?.(); } catch {}
  try { ddb.destroy?.(); } catch {}
  try { lambda.destroy?.(); } catch {}
  try { ec2.destroy?.(); } catch {}
  try { logs.destroy?.(); } catch {}
  try { ssm.destroy?.(); } catch {}
  try { (HTTPS_AGENT as any).destroy?.(); } catch {}
});
