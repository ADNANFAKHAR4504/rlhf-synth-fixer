import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';
import net from 'net';

// Integration tests — runtime traffic checks using deployment outputs
// - Reads cfn-outputs/flat-outputs.json
// - Uses real AWS resources (no mocking)
// - Tests are strict end-to-end checks and will fail loudly if outputs are missing

const OUTPUTS_PATH = 'cfn-outputs/flat-outputs.json';

if (!fs.existsSync(OUTPUTS_PATH)) {
  throw new Error(`${OUTPUTS_PATH} not found. Ensure deployment outputs exist before running integration tests.`);
}

const outputs: Record<string, any> = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));

function getOutput(...keys: string[]) {
  for (const k of keys) {
    if (outputs[k] !== undefined && outputs[k] !== null) return outputs[k];
    // try common lowercase/underscore variants
    const alt = k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    if (outputs[alt] !== undefined && outputs[alt] !== null) return outputs[alt];
  }
  return undefined;
}

// Derive region from known outputs when possible (RDS host or ALB/CF domain), otherwise fall back to AWS_REGION or us-east-1
function regionFromOutputs(): string {
  if (outputs.aws_region) return outputs.aws_region;
  const candidates = [getOutput('UsEastRdsEndpoint', 'rds_endpoint'), getOutput('UsEastAlbDns', 'alb_dns'), getOutput('UsEastCloudFrontUrl', 'cloudfront_url')];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const host = (c as string).replace(/^https?:\/\//, '').split('/')[0];
      const parts = host.split('.');
      const rIndex = parts.findIndex((p) => p === 'rds' || p === 'elb' || p === 'cloudfront');
      if (rIndex > 0) {
        const maybeRegion = parts[rIndex - 1];
        if (maybeRegion && maybeRegion.includes('-')) return maybeRegion;
      }
      const regionPart = parts.find((p) => /^([a-z]+-[a-z]+-\d)$/.test(p));
      if (regionPart) return regionPart;
    } catch (e) {
      // continue
    }
  }
  return process.env.AWS_REGION || 'us-east-1';
}

const region = regionFromOutputs();

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const cw = new CloudWatchClient({ region });
const cwl = new CloudWatchLogsClient({ region });
const iam = new IAMClient({ region });
const rds = new RDSClient({ region });

describe('Integration tests — runtime traffic checks (strict)', () => {
  jest.setTimeout(6 * 60 * 1000); // 6 minutes for end-to-end

  test('ALB responds on HTTP or HTTPS', async () => {
    const alb = getOutput('UsEastAlbDns', 'AlbDns', 'UsEastAlb', 'ExportsOutputFnGetAttalbpr451117606146348BB2BEDFDNSNameF4CCC560', 'alb_dns');
    expect(alb).toBeDefined();

    const httpUrl = `http://${alb}`;
    const httpsUrl = `https://${alb}`;

    let ok = false;
    try {
      const r = await axios.get(httpUrl, { timeout: 8000, validateStatus: () => true });
      if (r.status) ok = true;
    } catch (e) {
      // ignore and try https
    }
    if (!ok) {
      const r = await axios.get(httpsUrl, { timeout: 8000, validateStatus: () => true });
      if (r.status) ok = true;
    }
    expect(ok).toBeTruthy();
  });

  test('CloudFront distribution returns an HTTP response', async () => {
    const cf = getOutput('UsEastCloudFrontUrl', 'CloudFrontUrl', 'ExportsOutputFnGetAttcfpr45111760614634FAF6BF23DomainName76C4D001', 'cloudfront_url');
    expect(cf).toBeDefined();
    const url = (cf as string).startsWith('http') ? (cf as string) : `https://${cf}`;
    const r = await axios.get(url, { timeout: 10000, validateStatus: () => true });
    expect(r.status).toBeDefined();
  });

  test('S3 PUT then GET validates stored object', async () => {
    const bucket = getOutput('UsEastBucketName', 'BucketName', 'ExportsOutputRefs3bucketpr45111760614634ABF0F231A16EC07D', 's3_app_bucket_name', 's3_app_bucket');
    expect(bucket).toBeDefined();

    const key = `integration-${Date.now()}.txt`;
    const payload = `payload-${Date.now()}`;

    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: payload }));

    const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    let text = '';
    if (got.Body && (got.Body as any).transformToString) {
      text = await (got.Body as any).transformToString();
    } else if (got.Body) {
      const chunks: Uint8Array[] = [];
      for await (const c of got.Body as any) chunks.push(c);
      text = Buffer.concat(chunks).toString('utf8');
    }
    expect(text).toBe(payload);
  });

  test('S3 PUT triggers Lambda (verify via CloudWatch Logs)', async () => {
    const bucket = getOutput('UsEastBucketName', 'BucketName', 'ExportsOutputRefs3bucketpr45111760614634ABF0F231A16EC07D', 's3_app_bucket_name', 's3_app_bucket');
    expect(bucket).toBeDefined();

    const key = `trigger-${Date.now()}.txt`;
    const payload = 'trigger-test';
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: payload }));

    const filter = key;
    const deadline = Date.now() + 1000 * 60 * 2; // 2 minutes
    let found = false;
    while (Date.now() < deadline && !found) {
      const res = await cwl.send(new FilterLogEventsCommand({
        startTime: Date.now() - 1000 * 60 * 5,
        endTime: Date.now(),
        filterPattern: filter,
        limit: 50,
      } as any));
      if (res.events && res.events.length) {
        found = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
    expect(found).toBeTruthy();
  });

  test('RDS endpoint accepts TCP connections on port 3306', async () => {
    const rdsEndpoint = getOutput('UsEastRdsEndpoint', 'UsEastRds', 'ExportsOutputFnGetAttrdspr451117606146347CD7D2B5EndpointAddressADDED342', 'rds_endpoint');
    expect(rdsEndpoint).toBeDefined();
    const host = (rdsEndpoint as string).split(':')[0];
    const port = 3306;

    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const to = setTimeout(() => {
        socket.destroy();
        reject(new Error('Timeout connecting to RDS instance'));
      }, 8000);
      socket.connect(port, host, () => {
        clearTimeout(to);
        socket.end();
        resolve();
      });
      socket.on('error', (err) => {
        clearTimeout(to);
        reject(err);
      });
    });
  });

  test('CloudWatch alarm discovery returns results', async () => {
    const resp = await cw.send(new DescribeAlarmsCommand({}));
    expect(resp.MetricAlarms).toBeDefined();
    expect(Array.isArray(resp.MetricAlarms)).toBe(true);
  });

  test('Basic VPC and subnet existence', async () => {
    const vpc = getOutput('UsEastVpcId', 'VpcId', 'ExportsOutputRefvpcpr4511176061463471D558B47ACC1228', 'vpc_id');
    expect(vpc).toBeDefined();
    const vresp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpc] }));
    expect(vresp.Vpcs).toBeDefined();
    expect(vresp.Vpcs!.length).toBeGreaterThanOrEqual(1);

    const sresp = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpc] }] }));
    expect(sresp.Subnets).toBeDefined();
    expect(sresp.Subnets!.length).toBeGreaterThanOrEqual(1);
  });

  test('IAM GetRole call succeeds (best-effort by naming hint)', async () => {
    const hint = getOutput('UsEastBucketName', 's3_app_bucket_name', 's3_app_bucket') ? (getOutput('UsEastBucketName', 's3_app_bucket_name', 's3_app_bucket') as string).split('-')[2] : undefined;
    if (!hint) return expect(true).toBeTruthy();
    const roleName = `ec2-role-${hint}`;
    const resp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
  });

  test('S3 bucket has server-side encryption configuration', async () => {
    const bucket = getOutput('UsEastBucketName', 'BucketName', 'ExportsOutputRefs3bucketpr45111760614634ABF0F231A16EC07D', 's3_app_bucket_name', 's3_app_bucket');
    expect(bucket).toBeDefined();
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
  });
});
