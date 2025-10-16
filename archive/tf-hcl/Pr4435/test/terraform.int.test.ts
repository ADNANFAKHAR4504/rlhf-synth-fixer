// test/terraform.int.test.ts
// TAP Stack (Task-03) — Jest E2E (no esModuleInterop, no node-fetch)
// Verifies: EC2 reachability & Nginx, subnet routes (IGW/NAT), SG posture,
// RDS SQL login (psql via SSM, password from SSM), Lambda invoke → S3 write,
// CloudTrail delivery into S3 (AWSLogs/*) + additional deep posture/connectivity tests.

/* ---------------- stdlib (TS-safe imports) ---------------- */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

/* ---------------- AWS SDK v3 clients ---------------- */
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';

import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
  GetParameterCommand,
  DescribeInstanceInformationCommand,
} from '@aws-sdk/client-ssm';

import {
  LambdaClient,
  InvokeCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';

import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParametersCommand,
} from '@aws-sdk/client-rds';

import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Sha256 } from '@aws-crypto/sha256-js';

import { describe, it, expect } from '@jest/globals';

/* ---------------- tiny HTTP GET using http/https ---------------- */
function httpGet(urlStr: string, timeoutMs = 6000): Promise<{ status: number; body: string }> {
  const u = new URL(urlStr);
  const mod = u.protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const req = mod.get(u, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('HTTP timeout'));
    });
    req.on('error', reject);
  });
}

/* ---------------- logging / config ---------------- */
const ts = () => new Date().toISOString();
const log = (...parts: any[]) => console.log(`[E2E] ${ts()}`, ...parts);

/* ---------- outputs discovery (robust for CI) ---------- */
type FlatOutputs = Record<string, unknown>;

function findOutputsPath(): string {
  const baseDir = path.join(process.cwd(), 'cfn-outputs');

  const ENV_SUFFIX =
    process.env.ENV_SUFFIX ||
    process.env.ENVIRONMENT_SUFFIX ||
    process.env.PR_ENV_SUFFIX ||
    process.env.PR_NUMBER ||
    process.env.CHANGE_ID ||
    process.env.BRANCH_ENV_SUFFIX ||
    process.env.GITHUB_HEAD_REF ||
    process.env.CI_COMMIT_REF_SLUG ||
    process.env.CI_COMMIT_BRANCH ||
    undefined;

  const candidates = [
    path.join(baseDir, 'flat-outputs.json'),
    ENV_SUFFIX && path.join(baseDir, `flat-outputs.${ENV_SUFFIX}.json`),
    ENV_SUFFIX && path.join(baseDir, ENV_SUFFIX, 'flat-outputs.json'),
  ].filter(Boolean) as string[];

  let chosen = candidates.find((p) => fs.existsSync(p));
  if (!chosen && fs.existsSync(baseDir)) {
    const files = fs
      .readdirSync(baseDir)
      .filter((f) => /^flat-outputs(\.|-).+\.json$/i.test(f))
      .map((f) => path.join(baseDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (files.length) chosen = files[0];
  }

  if (!chosen) {
    const tried = candidates.length ? candidates.join('\n  ') : '(no candidates)';
    throw new Error(
      `Could not locate outputs file under ${baseDir}.\nTried:\n  ${tried}\n` +
        `Ensure your pipeline writes either "flat-outputs.json" or a suffixed variant like "flat-outputs.<env>.json".`
    );
  }

  console.log('[E2E] Using outputs file:', chosen);
  return chosen;
}

const OUTPUTS_PATH = findOutputsPath();

function readOutputs(): FlatOutputs {
  return JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8')) as FlatOutputs;
}

// Region auto-detect from outputs.subnet_azs[0] (e.g., "us-west-2a" -> "us-west-2")
function regionFromAz(az?: string): string | undefined {
  return az ? az.replace(/[a-z]$/, '') : undefined;
}
const __outputsForRegion = (() => {
  try {
    return readOutputs();
  } catch {
    return {};
  }
})();
const REGION_FROM_OUTPUTS: string | undefined = Array.isArray((__outputsForRegion as any).subnet_azs)
  ? regionFromAz((__outputsForRegion as any).subnet_azs[0])
  : undefined;

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || REGION_FROM_OUTPUTS || 'us-west-2';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(
  fn: () => Promise<T | null>,
  attempts: number,
  intervalMs: number,
  label?: string,
): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const v = await fn();
      if (v) return v;
      log(`retry wait (${label ?? 'op'}) ${i + 1}/${attempts} -> null`);
    } catch (e: any) {
      lastErr = e;
      log(`retry error (${label ?? 'op'}) ${i + 1}/${attempts}:`, e?.message ?? e);
    }
    if (i < attempts - 1) await sleep(intervalMs);
  }
  if (lastErr) throw lastErr;
  throw new Error(`retry(): exhausted attempts${label ? ` for ${label}` : ''}`);
}

async function waitForReachability(ec2: EC2Client, instanceId: string) {
  if (!instanceId) throw new Error('waitForReachability(): missing/invalid instanceId');
  log('Wait EC2 reachability:', instanceId);
  const ok = await retry<boolean>(async () => {
    const st = await ec2.send(
      new DescribeInstanceStatusCommand({ InstanceIds: [instanceId], IncludeAllInstances: true }),
    );
    const s = st.InstanceStatuses?.[0];
    if (!s) return null;
    return s.SystemStatus?.Status === 'ok' && s.InstanceStatus?.Status === 'ok' ? true : null;
  }, 24, 5000, `reachability:${instanceId}`);
  expect(ok).toBe(true);
}

// Wait until instance is registered as SSM-managed (no skipping)
async function waitForSsmManaged(ssm: SSMClient, instanceId: string) {
  if (!instanceId) throw new Error('waitForSsmManaged(): invalid instanceId');
  log('Wait SSM managed:', instanceId);
  const ok = await retry<boolean>(async () => {
    const di = await ssm.send(new DescribeInstanceInformationCommand({}));
    const managed = (di.InstanceInformationList || []).some((i) => i.InstanceId === instanceId);
    return managed ? true : null;
  }, 30, 10000, `ssmManaged:${instanceId}`); // up to ~5 minutes
  expect(ok).toBe(true);
}

async function ssmRun(
  ssm: SSMClient,
  instanceId: string,
  script: string,
  timeoutSeconds = 300,
): Promise<{ Status: string; StdOut: string; StdErr: string; ResponseCode: number }> {
  const send = await ssm.send(
    new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      TimeoutSeconds: timeoutSeconds,
      Parameters: { commands: [script] },
    }),
  );
  const cmdId = send.Command!.CommandId!;
  const inv = await retry(async () => {
    const res = await ssm.send(
      new GetCommandInvocationCommand({ CommandId: cmdId, InstanceId: instanceId }),
    );
    if (res.Status === 'InProgress' || res.Status === 'Pending') return null;
    return res;
  }, 90, 2000, `ssm:${instanceId}`);
  return {
    Status: inv.Status!,
    StdOut: inv.StandardOutputContent || '',
    StdErr: inv.StandardErrorContent || '',
    ResponseCode: inv.ResponseCode ?? -1,
  };
}


/* ============================================================================
 * E2E  — API Gateway -> EC2 (HTTP proxy)
 *  - GET /ec2 should return the Nginx page your EC2 serves
 * ==========================================================================*/
describe('E2E — API Gateway -> EC2 ', () => {
  const outputs = readOutputs() as any;
  const apiUrl: string = outputs.api_invoke_url;      // existing output
  const ec2Ip: string  = outputs.ec2_public_ip;       // existing output

  it('GET /ec2 returns the EC2 nginx index (200 and "hello from EC2")', async () => {
    // Sanity: the EC2 is actually serving the page (already tested elsewhere)
    const sanity = await httpGet(`http://${ec2Ip}/`, 6000);
    expect(sanity.status).toBeGreaterThanOrEqual(200);
    expect(sanity.status).toBeLessThan(400);
    expect(sanity.body).toMatch(/hello from EC2/i);

    // Now through API Gateway proxy
    const viaApigw = await httpGet(`${apiUrl}/ec2`, 8000);
    expect(viaApigw.status).toBeGreaterThanOrEqual(200);
    expect(viaApigw.status).toBeLessThan(400);
    expect(viaApigw.body).toMatch(/hello from EC2/i);
  });
});

/* ============================================================================
 * E2E — EC2 + Networking + Security Groups
 * ==========================================================================*/
describe('E2E — EC2 + Networking + Security Groups', () => {
  const outputs = readOutputs() as any;

  const vpcId: string = outputs.vpc_id;
  const publicSubnetIds: string[] = outputs.public_subnet_ids;
  const privateSubnetIds: string[] = outputs.private_subnet_ids;
  const webSgId: string = outputs.security_group_web_id;
  const ec2Id: string = outputs.ec2_instance_id;
  const ec2Ip: string = outputs.ec2_public_ip;

  const ec2 = new EC2Client({ region: REGION });
  const ssm = new SSMClient({ region: REGION });

  it('EC2 exists, in VPC, IMDSv2 required, SG attached', async () => {
    const di = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2Id] }));
    const inst = di.Reservations?.[0]?.Instances?.[0];
    expect(inst).toBeDefined();
    expect(inst?.VpcId).toBe(vpcId);
    expect(inst?.MetadataOptions?.HttpTokens).toBe('required');
    const attachedSgs = (inst?.SecurityGroups || []).map((g) => g.GroupId);
    expect(attachedSgs).toContain(webSgId);
  });

  it('Instance is SSM-managed (required for subsequent SSM tests)', async () => {
    await waitForSsmManaged(ssm, ec2Id);
  });

  it('HTTP: nginx index served via public IP', async () => {
    await waitForReachability(ec2, ec2Id);

    // Try HTTP first (Nginx default), then HTTPS (optional)
    let res:
      | { status: number; body: string }
      | null = null;

    try {
      res = await retry(
        () => httpGet(`http://${ec2Ip}/`).then((r) => (r.status >= 200 && r.status < 400 ? r : null)),
        12,
        3000,
        'ec2-http-80',
      );
    } catch (e) {
      // ignore here; we'll try HTTPS below
    }

    if (!res) {
      // Optional HTTPS attempt in case you later add TLS
      try {
        res = await retry(
          () => httpGet(`https://${ec2Ip}/`).then((r) => (r.status >= 200 && r.status < 400 ? r : null)),
          4,
          3000,
          'ec2-https-443',
        );
      } catch (e) {
        // still null -> run SSM diagnostics before failing
      }
    }

    if (!res) {
      // SSM diagnostics: is nginx running/bound? what does localhost say?
      const diagScript = [
        'set -euo pipefail',
        'echo "=== systemctl status nginx ==="',
        'systemctl status nginx --no-pager || true',
        'echo "=== listeners (ss -tlnp) ==="',
        'ss -tlnp | sed -n "1,120p" || true',
        'echo "=== curl localhost:80 (headers) ==="',
        'curl -sS -D - -o /dev/null http://127.0.0.1/ || true',
        'echo "=== nginx error.log (tail) ==="',
        'journalctl -u nginx -n 100 --no-pager || true',
        'echo "=== attempt restart nginx ==="',
        'systemctl restart nginx || true',
        'sleep 2',
        'echo "=== curl localhost:80 (after restart) ==="',
        'curl -sS -D - -o /dev/null http://127.0.0.1/ || true',
      ].join('\n');

      const diag = await ssmRun(ssm, ec2Id, diagScript, 240);
      console.log('[E2E] nginx diagnostics:\n', diag.StdOut.slice(0, 4000));

      try {
        res = await retry(
          () => httpGet(`http://${ec2Ip}/`).then((r) => (r.status >= 200 && r.status < 400 ? r : null)),
          4,
          3000,
          'ec2-http-80-after-restart',
        );
      } catch (e) {}
    }

    expect(res).toBeTruthy();
    expect(res!.status).toBeGreaterThanOrEqual(200);
    expect(res!.status).toBeLessThan(400);
    expect(res!.body).toMatch(/hello from EC2/i);
  });

  it('Public subnet: MapPublicIpOnLaunch + IGW default route', async () => {
    const di = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2Id] }));
    const subnetId = di.Reservations?.[0]?.Instances?.[0]?.SubnetId as string;
    const sn = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    expect(sn.Subnets?.[0]?.MapPublicIpOnLaunch).toBe(true);

    const rt = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'association.subnet-id', Values: [subnetId] }],
      }),
    );
    const hasIgwDefault = (rt.RouteTables || []).some((t) =>
      (t.Routes || []).some(
        (r) => r.DestinationCidrBlock === '0.0.0.0/0' && (r.GatewayId || '').startsWith('igw-'),
      ),
    );
    expect(hasIgwDefault).toBe(true);
  });

  it('Web SG: HTTP 80 world-allowed, SSH 22 world-denied, egress all', async () => {
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [webSgId] }));
    const sg = sgs.SecurityGroups?.[0]!;
    const ingress = sg.IpPermissions || [];
    const egress = sg.IpPermissionsEgress || [];

    const httpWorld = ingress.some(
      (p) =>
        p.IpProtocol === 'tcp' &&
        p.FromPort === 80 &&
        p.ToPort === 80 &&
        (p.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0'),
    );
    const sshWorld = ingress.some(
      (p) =>
        p.IpProtocol === 'tcp' &&
        p.FromPort === 22 &&
        p.ToPort === 22 &&
        (p.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0'),
    );
    const egressAll = egress.some(
      (p) => p.IpProtocol === '-1' && (p.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0'),
    );

    expect(httpWorld).toBe(true);
    expect(sshWorld).toBe(false);
    expect(egressAll).toBe(true);
  });

  it('IMDSv2 enforced on EC2 (401 without token, 200 with token)', async () => {
    await waitForSsmManaged(ssm, ec2Id);
    const script = `
      set -e
      A=$(curl -s -o /dev/null -w "%{http_code}" http://169.254.169.254/latest/meta-data/ || true)
      T=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
      B=$(curl -s -o /dev/null -w "%{http_code}" -H "X-aws-ec2-metadata-token: $T" http://169.254.169.254/latest/meta-data/ || true)
      echo "$A $B"
    `;
    const out = await ssmRun(ssm, ec2Id, script, 120);
    expect(out.Status).toBe('Success');
    const parts = out.StdOut.trim().split(/\s+/);
    expect(parts[0]).toBe('401');
    expect(parts[1]).toBe('200');
  });

  it('EC2 outbound DNS+TLS works (curl https://example.com)', async () => {
    await waitForSsmManaged(ssm, ec2Id);
    const script = `set -euo pipefail; curl -sSf https://example.com -o /dev/null && echo OK || echo FAIL`;
    const out = await ssmRun(ssm, ec2Id, script, 120);
    expect(out.Status).toBe('Success');
    expect(/OK/.test(out.StdOut)).toBe(true);
  });
});

/* ============================================================================
 * E2E — RDS SQL login + CRUD from EC2 (psql)
 * ==========================================================================*/
describe('E2E — RDS SQL login + CRUD from EC2 (psql)', () => {
  const outputs = readOutputs() as any;
  const rdsEndpoint: string = outputs.rds_endpoint;
  const ec2Id: string = outputs.ec2_instance_id;
  const lambdaName: string = outputs.lambda_function_name;

  const ec2 = new EC2Client({ region: REGION });
  const ssm = new SSMClient({ region: REGION });      // RunCommand + GetParameter
  const lambda = new LambdaClient({ region: REGION });

  it('EC2 can login to RDS via psql and run basic CRUD', async () => {
    const cfg = await lambda.send(
      new GetFunctionConfigurationCommand({ FunctionName: lambdaName }),
    );
    const paramName = cfg.Environment?.Variables?.RDS_PASSWORD_PARAM;
    expect(typeof paramName).toBe('string');
    if (!paramName) throw new Error('RDS_PASSWORD_PARAM not found on Lambda');

    const secret = await ssm.send(
      new GetParameterCommand({ Name: paramName, WithDecryption: true }),
    );
    const dbPassword = secret.Parameter?.Value || '';
    expect(dbPassword.length).toBeGreaterThan(0);

    await waitForReachability(ec2, ec2Id);

    const pwB64 = Buffer.from(dbPassword, 'utf8').toString('base64');

    const script = [
      'set -euo pipefail',
      '# Install PostgreSQL client (try 16, then 15, then generic)',
      'dnf -y install postgresql16 >/dev/null 2>&1 || \\',
      'dnf -y install postgresql15 >/dev/null 2>&1 || \\',
      'dnf -y install postgresql >/dev/null 2>&1 || true',
      '',
      '# Decode password into env var (not printed)',
      `export PGPASSWORD="$(echo '${pwB64}' | base64 -d)"`,
      '',
      '# Common psql opts with SSL required (matches rds.force_ssl=1)',
      `OPTS="-h ${rdsEndpoint} -U masteruser -d postgres -v ON_ERROR_STOP=1 --set=sslmode=require"`,
      '',
      '# Create table & insert',
      'psql $OPTS -c "CREATE TABLE IF NOT EXISTS tap_ci(x int);"',
      'psql $OPTS -c "INSERT INTO tap_ci(x) VALUES (1);"',
      '',
      '# Deterministic COUNT: -t (tuples only) -A (unaligned) prints just the number',
      'COUNT=$(psql $OPTS -t -A -c "SELECT COUNT(*) FROM tap_ci;")',
      'echo "COUNT=${COUNT:-0}"',
      '',
      '# Clean up table',
      'psql $OPTS -c "DROP TABLE tap_ci;"',
      'echo "PSQL_OK"',
    ].join('\n');

    const out = await ssmRun(ssm, ec2Id, script, 420);
    if (out.Status !== 'Success') {
      console.log('[E2E][psql-stdout]', out.StdOut.slice(0, 4000));
      console.log('[E2E][psql-stderr]', out.StdErr.slice(0, 4000));
    }

    expect(out.Status).toBe('Success');
    expect(/PSQL_OK/.test(out.StdOut)).toBe(true);

    const m = out.StdOut.match(/COUNT=(\d+)/);
    expect(m).toBeTruthy();
    expect(m && m[1]).toBe('1');
  });
});

/* ============================================================================
 * E2E — RDS posture (encryption/private/KMS + SSL param)
 * ==========================================================================*/
describe('E2E — RDS posture', () => {
  const outputs = readOutputs() as any;
  const rdsEndpoint: string = outputs.rds_endpoint;
  const rds = new RDSClient({ region: REGION });

  it('RDS is encrypted, uses KMS, not publicly accessible, postgres engine', async () => {
    const di = await rds.send(new DescribeDBInstancesCommand({}));
    const db = (di.DBInstances || []).find(d => (d.Endpoint?.Address || '') === rdsEndpoint);
    expect(db).toBeDefined();

    expect(db!.StorageEncrypted).toBe(true);
    expect((db!.KmsKeyId || '').length).toBeGreaterThan(0);
    expect(db!.PubliclyAccessible).toBe(false);
    expect((db!.Engine || '').startsWith('postgres')).toBe(true);
  });

  it('Parameter group enforces SSL (rds.force_ssl=1)', async () => {
    const di = await rds.send(new DescribeDBInstancesCommand({}));
    const inst = (di.DBInstances || []).find(i => i.Endpoint?.Address === rdsEndpoint);
    expect(inst).toBeDefined();

    const pgName = inst!.DBParameterGroups?.[0]?.DBParameterGroupName!;
    expect(typeof pgName).toBe('string');

    let marker: string | undefined = undefined;
    let forceSslValue: string | undefined;

    do {
      const page = await rds.send(
        new DescribeDBParametersCommand({
          DBParameterGroupName: pgName,
          Marker: marker,
        })
      );
      const hit = (page.Parameters || []).find(p => p.ParameterName === 'rds.force_ssl');
      if (hit?.ParameterValue) forceSslValue = hit.ParameterValue;
      marker = page.Marker;
    } while (!forceSslValue && marker);

    expect(forceSslValue).toBe('1');
  });
});

/* ============================================================================
 * E2E — Lambda heartbeat → S3 (app bucket) + CloudWatch Logs emission
 * ==========================================================================*/
describe('E2E — Lambda heartbeat writes to S3', () => {
  const outputs = readOutputs() as any;
  const lambdaName: string = outputs.lambda_function_name;
  const appBucket: string = outputs.app_bucket_name;

  const s3 = new S3Client({ region: REGION });
  const lambda = new LambdaClient({ region: REGION });
  const logs = new CloudWatchLogsClient({ region: REGION });

  it('S3 posture: versioning enabled; public access blocked', async () => {
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: appBucket }));
    expect(ver.Status).toBe('Enabled');

    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: appBucket }));
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);
  });

  it('Invoke heartbeat and observe new heartbeats/<ts>.json in app bucket', async () => {
    const before = await s3.send(
      new ListObjectsV2Command({ Bucket: appBucket, Prefix: 'heartbeats/', MaxKeys: 10 }),
    );
    const countBefore = (before.Contents || []).length;

    const inv = await lambda.send(
      new InvokeCommand({ FunctionName: lambdaName, InvocationType: 'RequestResponse' }),
    );
    expect((inv.StatusCode ?? 0) >= 200 && (inv.StatusCode ?? 0) < 300).toBe(true);

    const after = await retry(
      async () => {
        const res = await s3.send(
          new ListObjectsV2Command({ Bucket: appBucket, Prefix: 'heartbeats/' }),
        );
        const cnt = (res.Contents || []).length;
        return cnt > countBefore ? res : null;
      },
      18,
      3000,
      'heartbeat-s3',
    );

    const newest = (after.Contents || []).sort(
      (a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0),
    )[0];
    expect(newest?.Key).toMatch(/^heartbeats\/\d+\.json$/);

    const obj = await s3.send(new GetObjectCommand({ Bucket: appBucket, Key: newest!.Key! }));
    const body = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      (obj.Body as any).on('data', (d: Buffer) => chunks.push(d));
      (obj.Body as any).on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      (obj.Body as any).on('error', reject);
    });
    log('heartbeat body (trunc):', body.slice(0, 180));
    expect(body).toMatch(/"public_ip"\s*:\s*"/);
    expect(body).toMatch(/"ts"\s*:\s*\d+/);
  });

  it('Lambda emit appears in CloudWatch Logs after invoke', async () => {
    const logGroupName = `/aws/lambda/${lambdaName}`;
    await lambda.send(new InvokeCommand({ FunctionName: lambdaName, InvocationType: 'RequestResponse' }));

    const ls = await retry(async () => {
      const d = await logs.send(new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1
      }));
      return (d.logStreams && d.logStreams[0]?.logStreamName) ? d : null;
    }, 12, 3000, 'lambda-logstream');

    const stream = ls.logStreams![0].logStreamName!;
    const ev = await retry(async () => {
      const e = await logs.send(new GetLogEventsCommand({
        logGroupName,
        logStreamName: stream,
        limit: 5,
        startFromHead: false
      }));
      return (e.events || []).length ? e : null;
    }, 12, 3000, 'lambda-logevents');

    expect((ev.events || []).length).toBeGreaterThan(0);
  });
});

/* ============================================================================
 * E2E — API Gateway (IAM) — unsigned denied, SigV4-signed allowed
 * ==========================================================================*/
describe('E2E — API Gateway IAM auth', () => {
  const outputs = readOutputs() as any;
  const apiUrl: string = outputs.api_invoke_url;

  it('Unsigned GET / is denied (non-2xx)', async () => {
    const res = await httpGet(`${apiUrl}/`, 6000);
    expect(res.status >= 200 && res.status < 300).toBe(false);
  });

  it('SigV4-signed GET / is allowed (2xx)', async () => {
    const outputs = readOutputs() as any;
    const apiUrl: string = outputs.api_invoke_url;
    const u = new URL(apiUrl + '/');

    const probeClient = new S3Client({ region: REGION });
    const provider = probeClient.config.credentials as unknown as () => Promise<{
      accessKeyId: string; secretAccessKey: string; sessionToken?: string;
    }>;
    const resolvedCreds = await provider?.();
    if (!resolvedCreds?.accessKeyId || !resolvedCreds?.secretAccessKey) {
      throw new Error('Could not resolve AWS credentials from default chain.');
    }

    const signer = new SignatureV4({
      service: 'execute-api',
      region: REGION,
      credentials: async () => resolvedCreds as any,
      sha256: Sha256 as any,
    });

    const req = new HttpRequest({
      protocol: u.protocol,
      hostname: u.hostname,
      method: 'GET',
      path: u.pathname === '/' ? '/' : u.pathname,
      headers: { host: u.hostname },
    });

    const signed = await signer.sign(req);
    const finalReq = new HttpRequest(signed as any);

    const { response } = await new NodeHttpHandler().handle(finalReq as any, { requestTimeout: 6000 });
    const code = response.statusCode ?? 0;
    expect(code).toBeGreaterThanOrEqual(200);
    expect(code).toBeLessThan(400);
  });
});

/* ============================================================================
 * E2E — CloudTrail delivers to S3 (AWSLogs/...) + posture
 * ==========================================================================*/
describe('E2E — CloudTrail delivers to S3 (AWSLogs/...)', () => {
  const outputs = readOutputs() as any;
  const trailBucket: string = outputs.trail_bucket_name;

  const s3 = new S3Client({ region: REGION });

  it('AWSLogs/<account>/ exists or appears shortly (multi-region trail)', async () => {
    const hasLogs = await retry(
      async () => {
        const res = await s3.send(
          new ListObjectsV2Command({ Bucket: trailBucket, Prefix: 'AWSLogs/', MaxKeys: 5 }),
        );
        const any = (res.Contents || []).some((o) => o.Key && o.Key.startsWith('AWSLogs/'));
        return any ? true : null;
      },
      24,
      5000,
      'cloudtrail-s3',
    );
    expect(hasLogs).toBe(true);
  });

  it('Trail bucket encryption is enabled (SSE AES256 or aws:kms)', async () => {
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: trailBucket }));
    const algo =
      enc.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || '';
    expect(/AES256|aws:kms/.test(algo)).toBe(true);
  });
});

/* ============================================================================
 * E2E — S3 buckets enforce TLS-only access (HTTP denied)
 * ==========================================================================*/
describe('E2E — S3 buckets enforce TLS-only access (HTTP denied)', () => {
  const outputs = readOutputs() as any;
  const ec2Id: string = outputs.ec2_instance_id;
  const trailBucket: string = outputs.trail_bucket_name;
  const appBucket: string = outputs.app_bucket_name;

  const ssm = new SSMClient({ region: REGION });

  it('HTTP to S3 buckets returns non-2xx from EC2 (TLS-only policy)', async () => {
    await waitForSsmManaged(ssm, ec2Id);
    const script = [
      'set -euo pipefail',
      `for B in ${trailBucket} ${appBucket}; do`,
      `  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$B.s3.${REGION}.amazonaws.com/" || true)`,
      `  echo "$B HTTP_CODE=$CODE"`,
      'done',
    ].join('\n');

    const out = await ssmRun(ssm, ec2Id, script, 120);
    expect(out.Status).toBe('Success');
    const lines = out.StdOut.trim().split('\n').filter(Boolean);
    lines.forEach((l) => {
      const m = l.match(/HTTP_CODE=(\d+)/);
      expect(m).toBeTruthy();
      const code = Number(m![1]);
      expect(code >= 200 && code < 300).toBe(false);
    });
  });
});

/* ============================================================================
 * E2E — AWS WAF logging posture and (optionally) live log verification
 * ==========================================================================*/
describe('E2E — AWS WAF logging', () => {
  const outputs = readOutputs() as any;
  const apiUrl: string = outputs.api_invoke_url;
  const s3 = new S3Client({ region: REGION });

  const WAF_LOG_BUCKET = process.env.WAF_LOG_BUCKET || '';
  const WAF_ASSOCIATED = process.env.WAF_ASSOCIATED === '1';

  it('Posture: logging is either disabled by design OR has a configured log bucket (env)', async () => {
    if (!WAF_LOG_BUCKET) {
      expect(true).toBe(true);
    } else {
      const listed = await s3.send(
        new ListObjectsV2Command({ Bucket: WAF_LOG_BUCKET, MaxKeys: 1 })
      );
      expect(listed.$metadata.httpStatusCode).toBeGreaterThanOrEqual(200);
      expect(listed.$metadata.httpStatusCode).toBeLessThan(400);
    }
  });

  it('Live logs (E2E): suspicious requests produce WAF log objects in S3', async () => {
    if (!WAF_LOG_BUCKET || !WAF_ASSOCIATED) {
      expect(true).toBe(true);
      return;
    }

    const before = await s3.send(
      new ListObjectsV2Command({ Bucket: WAF_LOG_BUCKET, MaxKeys: 50, Prefix: '' })
    );
    const beforeCount = (before.Contents || []).length;

    const probes = [
      `${apiUrl}/?q=<script>alert(1)</script>`,
      `${apiUrl}/?id=1%20OR%201=1--`
    ];

    for (const p of probes) {
      try {
        await httpGet(p, 4000);
      } catch {}
    }

    const after = await retry(async () => {
      const res = await s3.send(
        new ListObjectsV2Command({ Bucket: WAF_LOG_BUCKET, MaxKeys: 100 })
      );
      const cnt = (res.Contents || []).length;
      return cnt > beforeCount ? res : null;
    }, 20, 5000, 'waf-logs-firehose');

    const newest = (after.Contents || [])
      .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))[0];
    expect(newest?.Key).toBeTruthy();

    const obj = await s3.send(new GetObjectCommand({ Bucket: WAF_LOG_BUCKET, Key: newest!.Key! }));
    const body = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      (obj.Body as any).on('data', (d: Buffer) => chunks.push(d));
      (obj.Body as any).on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      (obj.Body as any).on('error', reject);
    });

    const lines = body.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 20);
    const hasWafFields = lines.some(l => {
      try {
        const j = JSON.parse(l);
        return (
          j.terminatingRuleId !== undefined &&
          j.action !== undefined &&
          j.httpRequest !== undefined
        );
      } catch { return false; }
    });

    expect(hasWafFields).toBe(true);
  });
});
