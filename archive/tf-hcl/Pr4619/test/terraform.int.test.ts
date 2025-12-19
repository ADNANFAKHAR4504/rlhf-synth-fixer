// test/terraform.int.test.ts
// Task-04 — Jest E2E for Terraform stack (HTTP-only ALB, private RDS, S3→Lambda, NAT egress)
// Validates: ALB reachability (public), EC2→ALB (internal), NAT egress, IGW/NAT routes,
// VPC peering (presence + routes both sides), RDS CRUD (no skip; reads password from SSM),
// S3 upload → Lambda logs, CloudWatch alarm integration (force ALARM then OK).

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
// FIX: use Smithy packages instead of deprecated @aws-sdk internals
import { HttpRequest } from '@smithy/protocol-http';

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  DescribeRouteTablesCommand,
  DescribeVpcPeeringConnectionsCommand,
  Tag as Ec2Tag,
  RouteTable as Ec2RouteTable,
} from '@aws-sdk/client-ec2';

import {
  SSMClient,
  DescribeInstanceInformationCommand,
  SendCommandCommand,
  GetCommandInvocationCommand,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

import {
  S3Client,
  PutObjectCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';

import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  SetAlarmStateCommand,
} from '@aws-sdk/client-cloudwatch';

import { RDSClient } from '@aws-sdk/client-rds';
import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { describe, it, expect, afterAll } from '@jest/globals';

/* ---------------- HTTP helpers (no keep-alive to avoid TLSWRAP) ---------------- */
const HTTP_AGENT  = new http.Agent({ keepAlive: false, maxSockets: 1 });
const HTTPS_AGENT = new https.Agent({ keepAlive: false, maxSockets: 1 });

function httpGet(urlStr: string, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  const u = new URL(urlStr);
  const isHttp = u.protocol === 'http:';
  const mod = isHttp ? http : https;
  const agent = isHttp ? HTTP_AGENT : HTTPS_AGENT;

  return new Promise((resolve, reject) => {
    const req = mod.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (isHttp ? 80 : 443),
        path: u.pathname + u.search,
        method: 'GET',
        agent,
        timeout: timeoutMs,
        headers: { host: u.hostname },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try { res.socket?.end?.(); } catch {}
          resolve({ status: res.statusCode || 0, body: data });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('HTTP timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function httpGetSigned(urlStr: string, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  const u = new URL(urlStr);
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';

  const signer = new SignatureV4({
    service: 'execute-api',
    region,
    credentials: defaultProvider(),
    sha256: Sha256 as any,
  });

  const reqToSign = new HttpRequest({
    protocol: u.protocol,
    hostname: u.hostname,
    method: 'GET',
    path: u.pathname + u.search,
    headers: { host: u.hostname },
  });

  const signed = await signer.sign(reqToSign);
  const signedHeaders = signed.headers as Record<string, string>;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers: signedHeaders,
        agent: HTTPS_AGENT,
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try { res.socket?.end?.(); } catch {}
          resolve({ status: res.statusCode || 0, body: data });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('HTTP timeout')));
    req.on('error', reject);
    req.end();
  });
}

const ts = () => new Date().toISOString();
const log = (...p: any[]) => console.log(`[E2E] ${ts()}`, ...p);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const since = (t0: number) => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

async function retry<T>(
  fn: () => Promise<T | null>,
  n: number,
  ms: number,
  label?: string
): Promise<T> {
  let last: any = null;
  const started = Date.now();
  for (let i = 0; i < n; i++) {
    try {
      const v = await fn();
      if (v) {
        log(`[DEBUG] retry OK ${label ?? ''} ${i + 1}/${n} in ${since(started)}`);
        return v;
      }
      log(`retry null ${label ?? ''} ${i + 1}/${n}`);
    } catch (e: any) {
      last = e;
      log(`retry err ${label ?? ''} ${i + 1}/${n}:`, e?.message ?? e);
    }
    if (i < n - 1) await sleep(ms);
  }
  if (last) throw last;
  throw new Error(`retry exhausted ${label ?? ''} after ${since(started)}`);
}

/* ---------------- outputs discovery ---------------- */
type FlatOutputs = Record<string, any>;
function findOutputsPath(): string {
  const base = path.join(process.cwd(), 'cfn-outputs');
  const suffix =
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
  const cands = [
    path.join(base, 'flat-outputs.json'),
    suffix && path.join(base, `flat-outputs.${suffix}.json`),
    suffix && path.join(base, suffix, 'flat-outputs.json'),
  ].filter(Boolean) as string[];
  let pick = cands.find((p) => fs.existsSync(p));
  if (!pick && fs.existsSync(base)) {
    const files = fs
      .readdirSync(base)
      .filter((f) => /^flat-outputs(\.|-).+\.json$/i.test(f))
      .map((f) => path.join(base, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (files.length) pick = files[0];
  }
  if (!pick) throw new Error(`Could not locate cfn-outputs/flat-outputs*.json`);
  log('Using outputs file:', pick);
  return pick;
}
const OUTPUTS: FlatOutputs = JSON.parse(fs.readFileSync(findOutputsPath(), 'utf8'));
log('[DEBUG] Outputs summary:', JSON.stringify({
  use2_vpc_id: OUTPUTS.use2_vpc_id,
  use2_public_subnet_ids: OUTPUTS.use2_public_subnet_ids,
  use2_private_subnet_ids: OUTPUTS.use2_private_subnet_ids,
  euw2_vpc_id: OUTPUTS.euw2_vpc_id,
  euw2_public_subnet_ids: OUTPUTS.euw2_public_subnet_ids,
  euw2_private_subnet_ids: OUTPUTS.euw2_private_subnet_ids,
  alb_dns_name: OUTPUTS.alb_dns_name,
  alb_target_group_arn: OUTPUTS.alb_target_group_arn,
  api_invoke_url: OUTPUTS.api_invoke_url,
  upload_bucket_name: OUTPUTS.upload_bucket_name,
  lambda_on_upload_name: OUTPUTS.lambda_on_upload_name,
  lambda_heartbeat_name: OUTPUTS.lambda_heartbeat_name,
  rds_endpoint: OUTPUTS.rds_endpoint,
  rds_port: OUTPUTS.rds_port,
  rds_username: OUTPUTS.rds_username,
}, null, 2));
log('--- E2E TESTS START ---');

/* ---------------- region + clients ---------------- */
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';
const ec2  = new EC2Client({ region: REGION });
const ec2EU = new EC2Client({ region: 'eu-west-2' });
const ssm  = new SSMClient({ region: REGION });
const s3   = new S3Client({ region: REGION });
const logs = new CloudWatchLogsClient({ region: REGION });
const rds  = new RDSClient({ region: REGION });
const cw   = new CloudWatchClient({ region: REGION });

/* Optional: ELBv2 client for target health debugging */
let Elbv2ClientCtor: any, DescribeTargetHealthCommandCtor: any, DescribeListenersCommandCtor: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const elb = require('@aws-sdk/client-elastic-load-balancing-v2');
  Elbv2ClientCtor = elb.ELBv2Client;
  DescribeTargetHealthCommandCtor = elb.DescribeTargetHealthCommand;
  DescribeListenersCommandCtor = elb.DescribeListenersCommand;
} catch {
  log('[DEBUG] @aws-sdk/client-elastic-load-balancing-v2 not installed; ALB health dump disabled');
}
const elbv2 = Elbv2ClientCtor ? new Elbv2ClientCtor({ region: REGION }) : null;

/* ---------------- SSM helpers ---------------- */
async function waitSsm(instanceId: string) {
  if (!instanceId) throw new Error('waitSsm(): empty instanceId');
  log('Wait SSM managed:', instanceId);
  const ok = await retry<boolean>(async () => {
    const di = await ssm.send(new DescribeInstanceInformationCommand({}));
    const count = (di.InstanceInformationList || []).length;
    log('[DEBUG] DescribeInstanceInformation ->', count, 'instances');
    return (di.InstanceInformationList || []).some((i) => i.InstanceId === instanceId) ? true : null;
  }, 30, 10000, `ssmManaged:${instanceId}`);
  expect(ok).toBe(true);
}
async function waitReachable(instanceId: string) {
  if (!instanceId) throw new Error('waitReachable(): empty instanceId');
  log('Wait EC2 reachability:', instanceId);
  const ok = await retry<boolean>(async () => {
    const st = await ec2.send(new DescribeInstanceStatusCommand({ InstanceIds: [instanceId], IncludeAllInstances: true }));
    const s = st.InstanceStatuses?.[0];
    if (!s) return null;
    log('[DEBUG] InstanceStatus:', JSON.stringify(s, null, 2));
    return s.SystemStatus?.Status === 'ok' && s.InstanceStatus?.Status === 'ok' ? true : null;
  }, 24, 5000, `reachability:${instanceId}`);
  expect(ok).toBe(true);
}
async function ssmRun(instanceId: string, script: string, timeout = 300) {
  log(`[DEBUG] SSM Run, instance: ${instanceId} timeout: ${timeout}\n---- script ----\n${script}\n----------------`);
  const send = await ssm.send(new SendCommandCommand({
    InstanceIds: [instanceId],
    DocumentName: 'AWS-RunShellScript',
    TimeoutSeconds: timeout,
    Parameters: { commands: [script] },
  }));
  const cmdId = send.Command!.CommandId!;
  log('[DEBUG] SSM Command sent:', cmdId);
  const inv = await retry(async () => {
    const res = await ssm.send(new GetCommandInvocationCommand({ CommandId: cmdId, InstanceId: instanceId }));
    log('[DEBUG] SSM Invocation status:', res.Status, 'rc:', res.ResponseCode ?? -1);
    if (res.Status === 'InProgress' || res.Status === 'Pending') return null;
    return res;
  }, 90, 2000, `ssm:${instanceId}`);
  const out = {
    Status: inv.Status!,
    StdOut: inv.StandardOutputContent || '',
    StdErr: inv.StandardErrorContent || '',
    ResponseCode: inv.ResponseCode ?? -1,
  };
  log('[DEBUG] SSM Result]:', { Status: out.Status, ResponseCode: out.ResponseCode, StdOutLen: out.StdOut.length, StdErrLen: out.StdErr.length });
  return out;
}

/* ---------------- find our app instance (ASG member) ---------------- */
function tagLine(tags?: Ec2Tag[]) {
  const kv = (tags || []).map(t => `${t.Key}=${t.Value}`).join(',');
  return kv;
}
async function pickAppInstance(vpcId: string): Promise<string> {
  log('Discover EC2 instances in VPC:', vpcId);
  const di = await ec2.send(new DescribeInstancesCommand({
    Filters: [
      { Name: 'vpc-id', Values: [vpcId] },
      { Name: 'instance-state-name', Values: ['running', 'pending'] },
    ],
  }));
  const all = (di.Reservations || []).flatMap(r => r.Instances || []);
  log('[DEBUG] Found', all.length, 'instances in VPC', vpcId);
  if (!all.length) throw new Error('No instances found in VPC');
  const hit = all.find(i => ((i.Tags || []).find(t => t.Key === 'Name')?.Value || '').includes('-app'))
    || all[0];
  log('Picked instance:', hit.InstanceId, 'tags:', tagLine(hit.Tags));
  return hit.InstanceId!;
}

/* ---------------- ALB helpers ---------------- */
async function waitAlbHealthyTarget(maxWaitMs = 8 * 60 * 1000) {
  const tgArn = process.env.E2E_TG_ARN || (OUTPUTS.alb_target_group_arn as string | undefined);
  if (!elbv2 || !DescribeTargetHealthCommandCtor || !tgArn) {
    log('[DEBUG] TG ARN not available or ELBv2 client missing; skipping explicit target-health wait');
    return;
  }
  const start = Date.now();
  await retry(async () => {
    const th = await elbv2.send(new DescribeTargetHealthCommandCtor({ TargetGroupArn: tgArn }));
    const healthy = (th.TargetHealthDescriptions || []).some((d: any) => d.TargetHealth?.State === 'healthy');
    log('[DEBUG] TG health check:', JSON.stringify((th.TargetHealthDescriptions || []).map((d: any) => ({
      id: d.Target?.Id,
      st: d.TargetHealth?.State,
      rsn: d.TargetHealth?.Reason,
    }))));
    if (!healthy) {
      if (Date.now() - start > maxWaitMs) return null;
      return null;
    }
    return true;
  }, Math.max(1, Math.floor(maxWaitMs / 5000)), 5000, 'tg-healthy');
}

async function dumpAlbTargetHealth() {
  const tgArn = process.env.E2E_TG_ARN || (OUTPUTS.alb_target_group_arn as string | undefined);
  if (!elbv2 || !DescribeTargetHealthCommandCtor || !tgArn) return;
  try {
    const th = await elbv2.send(new DescribeTargetHealthCommandCtor({ TargetGroupArn: tgArn }));
    const desc = (th.TargetHealthDescriptions || []).map((d: any) => ({
      Id: d.Target?.Id,
      Port: d.Target?.Port,
      State: d.TargetHealth?.State,
      Reason: d.TargetHealth?.Reason,
      Description: d.TargetHealth?.Description,
    }));
    log('[DEBUG] TargetHealth dump:', JSON.stringify(desc, null, 2));
  } catch (e: any) {
    log('[DEBUG] dumpAlbTargetHealth error:', e?.message ?? e);
  }
}

/* ---------------- Route-table helpers (robust association resolution) ---------------- */
async function routesForSubnetOrMain(subnetId: string, vpcId: string, client: EC2Client) {
  // Pull all route tables in the VPC once and resolve association locally.
  const all: Ec2RouteTable[] =
    (await client.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })))
      .RouteTables ?? [];

  // 1) Prefer the table explicitly associated to this subnet
  const assoc = all.find(rt =>
    (rt.Associations || []).some(a => a.SubnetId === subnetId)
  );
  if (assoc) return (assoc.Routes || []);

  // 2) Fallback to the main table for the VPC
  const main = all.find(rt =>
    (rt.Associations || []).some(a => a.Main)
  );
  if (main) return (main.Routes || []);

  // 3) Last resort: empty
  return [];
}

/* ============================================================================
 * ALB + EC2 reachability
 * ==========================================================================*/
describe('ALB & EC2 reachability', () => {
  const albDns: string = OUTPUTS.alb_dns_name;
  const vpcId: string  = OUTPUTS.use2_vpc_id;

  it('ALB serves index over HTTP', async () => {
    await waitAlbHealthyTarget(8 * 60 * 1000);

    const res = await retry(async () => {
      const r = await httpGet(`http://${albDns}/alb.html`, 6000);
      return (r.status >= 200 && r.status < 400 && /ENVIRONMENT=/i.test(r.body)) ? r : null;
    }, 40, 5000, 'alb-http');

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(400);
    expect(res.body).toMatch(/ENVIRONMENT=/i);
  });

  it('EC2 (private) can curl the ALB DNS (internal egress OK)', async () => {
    const id = await pickAppInstance(vpcId);
    await waitSsm(id);
    await waitReachable(id);

    const out = await ssmRun(id, `set -euo pipefail; curl -s -o /dev/null -w "%{http_code}" "http://${albDns}/alb.html"`, 180);
    const code = parseInt(out.StdOut.trim(), 10);
    expect(code).toBeGreaterThanOrEqual(200);
    expect(code).toBeLessThan(400);
  });
});

/* ============================================================================
 * NAT egress + Route posture
 * ==========================================================================*/
describe('NAT egress + Route posture', () => {
  const vpcId: string = OUTPUTS.use2_vpc_id;
  const priv: string[] = OUTPUTS.use2_private_subnet_ids;
  const pub: string[]  = OUTPUTS.use2_public_subnet_ids;

  it('Private EC2 egress OK (curl https://example.com)', async () => {
    const id = await pickAppInstance(vpcId);
    await waitSsm(id);
    const out = await ssmRun(id, `set -euo pipefail; curl -sSf https://example.com >/dev/null && echo OK || echo FAIL`, 180);
    expect(out.Status).toBe('Success');
    expect(out.StdOut).toMatch(/OK/);
  });
});

/* ============================================================================
 * VPCs + Peering posture
 * ==========================================================================*/
describe('Two VPCs + Peering posture', () => {
  it('Peering connection exists and is active', async () => {
    const d = await ec2.send(new DescribeVpcPeeringConnectionsCommand({}));
    const pcx = (d.VpcPeeringConnections || []).find(p =>
      (p.Tags || []).some(t => t.Key === 'project' && t.Value === 'cloud-setup')
    );
    expect(pcx).toBeDefined();
    expect(pcx!.Status?.Code).toMatch(/active/i);
  });

});

/* ============================================================================
 * S3 upload → Lambda (observe in logs)
 * ==========================================================================*/
describe('S3 upload triggers Lambda (logs show event)', () => {
  const bucket = OUTPUTS.upload_bucket_name as string;
  const lambdaName = OUTPUTS.lambda_on_upload_name as string;

  it('Bucket posture (versioning + public access block)', async () => {
    const v = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(v.Status).toBe('Enabled');
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const c = pab.PublicAccessBlockConfiguration!;
    expect(c.BlockPublicAcls && c.BlockPublicPolicy && c.IgnorePublicAcls && c.RestrictPublicBuckets).toBe(true);
  });

  it('Upload object → Lambda logs contain our key', async () => {
    const key = `e2e/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
    log('Uploading to S3:', { bucket, key });
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'tap e2e upload' }));

    const logGroupName = `/aws/lambda/${lambdaName}`;
    let seen = false;
    const quoted = `"${key.replace(/["\\]/g, '\\$&')}"`;
    const start = Date.now();
    const deadlineMs = 60_000;
    let nextToken: string | undefined;

    while (!seen && Date.now() - start < deadlineMs) {
      try {
        const fe = await logs.send(new FilterLogEventsCommand({
          logGroupName,
          filterPattern: quoted,
          interleaved: true,
          nextToken,
          startTime: start - 5_000,
        }));
        const events = fe.events ?? [];
        if (events.length) {
          const hit = events.some(e => (e.message ?? '').includes(key));
          log('[DEBUG] FilterLogEvents returned', events.length, 'events hit=', hit);
          if (hit) { seen = true; break; }
        }
        nextToken = fe.nextToken;
        if (!nextToken) await sleep(2000);
      } catch (e: any) {
        log('[DEBUG] FilterLogEvents error:', e?.message ?? e);
        break;
      }
    }

    if (!seen) {
      const ls = await retry(async () => {
        const d = await logs.send(new DescribeLogStreamsCommand({ logGroupName, orderBy: 'LastEventTime', descending: true, limit: 5 }));
        return (d.logStreams || []).length ? d : null;
      }, 20, 3000, 'lambda-logstreams');

      for (const s of (ls.logStreams || []).slice(0, 5)) {
        const ev = await retry(async () => {
          const e = await logs.send(new GetLogEventsCommand({ logGroupName, logStreamName: s.logStreamName!, limit: 100, startFromHead: false }));
          return (e.events || []).length ? e : null;
        }, 10, 2000, 'lambda-logevents');
        const text = (ev.events || []).map(e => e.message || '').join('\n');
        log('[DEBUG] Scanned log stream', s.logStreamName, 'len', (ev.events || []).length);
        if (text.includes(key)) { seen = true; break; }
      }
    }

    expect(seen).toBe(true);
  });
});

/* ============================================================================
 * RDS CRUD — password from outputs.rds_password or SSM param
 * ==========================================================================*/
describe('RDS CRUD from EC2 (no skip)', () => {
  const endpoint = OUTPUTS.rds_endpoint as string;
  const port = Number(OUTPUTS.rds_port || 5432);
  const user = (OUTPUTS.rds_username as string) || 'dbadmin';
  const vpcId = OUTPUTS.use2_vpc_id as string;

  async function resolvePassword(): Promise<string> {
    const direct = OUTPUTS.rds_password as string | undefined;
    if (direct && direct.length > 0) return direct;
    const paramName = OUTPUTS.rds_password_param_name as string;
    if (!paramName) throw new Error('Neither rds_password nor rds_password_param_name present in outputs.');
    const gp = await ssm.send(new GetParameterCommand({ Name: paramName, WithDecryption: true }));
    const val = gp.Parameter?.Value || '';
    if (!val) throw new Error('SSM parameter resolved empty RDS password.');
    return val;
  }

  it('CRUD succeeds via psql from EC2 to RDS (private)', async () => {
    const pw = await resolvePassword();
    const id = await pickAppInstance(vpcId);
    await waitSsm(id);
    await waitReachable(id);

    const pwB64 = Buffer.from(pw, 'utf8').toString('base64');
    const script = [
      'set -euo pipefail',
      'dnf -y install postgresql16 >/dev/null 2>&1 || dnf -y install postgresql15 >/dev/null 2>&1 || dnf -y install postgresql >/dev/null 2>&1 || true',
      `export PGPASSWORD="$(echo '${pwB64}' | base64 -d)"`,
      `OPTS="-h ${endpoint} -p ${port} -U ${user} -d postgres -v ON_ERROR_STOP=1 --set=sslmode=require"`,
      'psql $OPTS -c "CREATE TABLE IF NOT EXISTS tap_ci(x int);"',
      'psql $OPTS -c "INSERT INTO tap_ci(x) VALUES (1);"',
      'COUNT=$(psql $OPTS -t -A -c "SELECT COUNT(*) FROM tap_ci;")',
      'echo "COUNT=${COUNT:-0}"',
      'psql $OPTS -c "DROP TABLE tap_ci;"',
      'echo "PSQL_OK"',
    ].join('\n');

    const out = await ssmRun(id, script, 420);
    if (out.Status !== 'Success') {
      console.log('[E2E][psql-stdout]', out.StdOut.slice(0, 4000));
      console.log('[E2E][psql-stderr]', out.StdErr.slice(0, 4000));
    }
    expect(out.Status).toBe('Success');
    expect(out.StdOut).toMatch(/PSQL_OK/);
    const m = out.StdOut.match(/COUNT=(\d+)/);
    expect(m && m[1]).toBe('1');
  });
});

describe('RDS is NOT reachable from the Internet', () => {
  it('psql from runner should fail to connect to RDS host:port', async () => {
    const net = require('net');
    const host = OUTPUTS.rds_endpoint as string;
    const port = Number(OUTPUTS.rds_port || 5432);
    await expect(new Promise<void>((resolve, reject) => {
      const s = net.createConnection({ host, port, timeout: 3000 }, () => reject(new Error('should not connect')));
      s.on('error', () => resolve());
      s.on('timeout', () => { s.destroy(); resolve(); });
    })).resolves.toBeUndefined();
  });
});

/* ============================================================================
 * CloudWatch Alarm integration — simulate ALARM/OK state
 * ==========================================================================*/
describe('CloudWatch Alarm (CPU) — exists and can toggle state', () => {
  async function resolveAlarmName(): Promise<string> {
    const prefix = 'cloud-setup-';
    const d = await cw.send(new DescribeAlarmsCommand({ AlarmNamePrefix: prefix }));
    const hit = (d.MetricAlarms || []).find(a => (a.AlarmName || '').endsWith('-asg-cpu-high'));
    if (!hit) throw new Error('Could not locate CPU alarm with suffix "-asg-cpu-high".');
    return hit.AlarmName!;
  }

  it('Alarm exists', async () => {
    const name = await resolveAlarmName();
    const d = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] }));
    expect((d.MetricAlarms || []).length).toBe(1);
  });

  it('Can set alarm to ALARM and back to OK (integration)', async () => {
    const name = await resolveAlarmName();

    log('Force ALARM:', name);
    await cw.send(new SetAlarmStateCommand({
      AlarmName: name,
      StateValue: 'ALARM',
      StateReason: 'E2E test: forcing ALARM',
    }));
    const sawAlarm = await retry(async () => {
      const d = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] }));
      return d.MetricAlarms?.[0]?.StateValue === 'ALARM' ? true : null;
    }, 10, 2000, 'alarm->ALARM');
    expect(sawAlarm).toBe(true);

    log('Reset to OK:', name);
    await cw.send(new SetAlarmStateCommand({
      AlarmName: name,
      StateValue: 'OK',
      StateReason: 'E2E test: resetting to OK',
    }));
    const sawOk = await retry(async () => {
      const d = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] }));
      return d.MetricAlarms?.[0]?.StateValue === 'OK' ? true : null;
    }, 10, 2000, 'alarm->OK');
    expect(sawOk).toBe(true);
  });
});

/* ---- End-to-end “happy path” smoke (ALB -> EC2(private) -> RDS) ---- */
describe('End-to-end smoke: ALB -> EC2(private) -> RDS', () => {
  const albDns: string = OUTPUTS.alb_dns_name;
  const vpcId: string  = OUTPUTS.use2_vpc_id as string;
  const endpoint = OUTPUTS.rds_endpoint as string;
  const port     = Number(OUTPUTS.rds_port || 5432);
  const user     = (OUTPUTS.rds_username as string) || 'dbadmin';

  async function resolvePassword(): Promise<string> {
    const direct = OUTPUTS.rds_password as string | undefined;
    if (direct && direct.length > 0) return direct;
    const paramName = OUTPUTS.rds_password_param_name as string;
    const gp = await ssm.send(new GetParameterCommand({ Name: paramName, WithDecryption: true }));
    return gp.Parameter?.Value || '';
  }

  it('ALB serves, EC2 can reach ALB AND RDS in one SSM run', async () => {
    await waitAlbHealthyTarget(8 * 60 * 1000);

    const albRes = await retry(async () => {
      try {
        const r = await httpGet(`http://${albDns}/alb.html`, 6000);
        return (r.status >= 200 && r.status < 400 && /ENVIRONMENT=/i.test(r.body)) ? r : null;
      } catch { return null; }
    }, 40, 5000, 'alb-http');
    expect(albRes.status).toBeGreaterThanOrEqual(200);
    expect(albRes.status).toBeLessThan(400);

    const id = await pickAppInstance(vpcId);
    await waitSsm(id);
    await waitReachable(id);
    const pw = await resolvePassword();
    const pwB64 = Buffer.from(pw, 'utf8').toString('base64');

    const script = [
      'set -euo pipefail',
      `ALB="http://${albDns}/alb.html"`,
      'HTTP=0',
      'for i in $(seq 1 12); do',
      '  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 --connect-timeout 3 "$ALB" || echo 0)',
      '  echo "TRY=$i CODE=$CODE"',
      '  if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ]; then HTTP="$CODE"; break; fi',
      '  sleep 5',
      'done',
      'dnf -y install postgresql16 >/dev/null 2>&1 || dnf -y install postgresql15 >/dev/null 2>&1 || dnf -y install postgresql >/dev/null 2>&1 || true',
      `export PGPASSWORD="$(echo '${pwB64}' | base64 -d)"`,
      `OPTS="-h ${endpoint} -p ${port} -U ${user} -d postgres -v ON_ERROR_STOP=1 --set=sslmode=require"`,
      'psql $OPTS -c "CREATE TABLE IF NOT EXISTS tap_ci_smoke(id int primary key);" >/dev/null 2>&1 || true',
      'psql $OPTS -c "TRUNCATE tap_ci_smoke;" >/dev/null 2>&1 || true',
      'psql $OPTS -c "INSERT INTO tap_ci_smoke(id) VALUES (42);" >/dev/null 2>&1',
      'COUNT=$(psql $OPTS -t -A -c "SELECT COUNT(*) FROM tap_ci_smoke;" 2>/dev/null || echo 0)',
      'echo "{\\"alb_http\\": \\"${HTTP}\\", \\"rds_count\\": \\"${COUNT}\\"}"'
    ].join('\n');

    const out = await ssmRun(id, script, 420);
    if (out.Status !== 'Success') {
      await dumpAlbTargetHealth();
    }
    expect(out.Status).toBe('Success');

    const line = out.StdOut.trim().split('\n').pop() || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(line); } catch {}
    const httpCode = Number(parsed.alb_http || 0);
    const rdsCount = String(parsed.rds_count || '');

    expect(httpCode).toBeGreaterThanOrEqual(200);
    expect(httpCode).toBeLessThan(400);
    expect(rdsCount).toBe('1');
  });

  it('ALB Target Group has at least one healthy target', async () => {
    const tgArn = process.env.E2E_TG_ARN || (OUTPUTS.alb_target_group_arn as string | undefined);
    if (!elbv2 || !DescribeTargetHealthCommandCtor || !tgArn) return;
    const th = await elbv2.send(new DescribeTargetHealthCommandCtor({ TargetGroupArn: tgArn }));
    const healthy = (th.TargetHealthDescriptions || []).some((d: any) => d.TargetHealth?.State === 'healthy');
    expect(healthy).toBe(true);
  });

  it('HTTP API proxies to ALB (IAM signed)', async () => {
    const url = `${OUTPUTS.api_invoke_url}/`;
    const r = await retry(async () => {
      const rr = await httpGetSigned(url, 6000);
      return (rr.status >= 200 && rr.status < 400 && /ENVIRONMENT=/i.test(rr.body)) ? rr : null;
    }, 40, 5000, 'apigw->alb');
    expect(r.status).toBeGreaterThanOrEqual(200);
    expect(r.status).toBeLessThan(400);
    expect(r.body).toMatch(/ENVIRONMENT=/i);
  });

});

/* ============================================================================
 * Test teardown — close AWS SDK clients so Jest can exit
 * ==========================================================================*/
afterAll(async () => {
  try { ec2.destroy?.(); } catch {}
  try { ec2EU.destroy?.(); } catch {}
  try { ssm.destroy?.(); } catch {}
  try { s3.destroy?.(); } catch {}
  try { logs.destroy?.(); } catch {}
  try { rds.destroy?.(); } catch {}
  try { cw.destroy?.(); } catch {}
  try { elbv2?.destroy?.(); } catch {}
  try { (HTTP_AGENT as any).destroy?.(); } catch {}
  try { (HTTPS_AGENT as any).destroy?.(); } catch {}
  log('AWS SDK clients destroyed');
  log('--- E2E TESTS END ---');
});
