import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import dns from 'dns/promises';
import fs from 'fs';
import path from 'path';

import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';

jest.setTimeout(120000);

const outputsPath = process.env.CFN_OUTPUTS_PATH || path.join(__dirname, '../cfn-outputs/flat-outputs.json');

function readFlatOutputs(): Record<string, any> {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`flat-outputs.json not found at ${outputsPath}. Deploy the stack and run ./scripts/get-outputs.sh to generate it.`);
  }
  const raw = fs.readFileSync(outputsPath, 'utf8');
  return JSON.parse(raw);
}

const flat = readFlatOutputs();

function awsConfigForRegion(region?: string) {
  const cfg: any = { region: region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1' };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    cfg.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };
  }
  return cfg;
}

describe('TapStack Integration Tests (E2E)', () => {
  test('required outputs are present and non-empty', () => {
    const required = [
      'ALBDNSName',
      'RDSEndpoint',
      'VPCId',
      'CloudTrailName',
      'LambdaFunctionArn',
      'S3ApplicationBucketName',
      'WebACLArn'
    ];

    required.forEach(k => {
      expect(flat[k]).toBeDefined();
      const val = String(flat[k] || '');
      expect(val.length).toBeGreaterThan(0);
    });

    if (Object.prototype.hasOwnProperty.call(flat, 'ConfigRecorderName')) {
      const val = String(flat['ConfigRecorderName'] || '');
      expect(val.length).toBeGreaterThan(0);
    }
  });

  test('ALB DNS resolves to an IP address', async () => {
    const alb = String(flat['ALBDNSName']);
    expect(alb).toBeTruthy();
    const res = await dns.lookup(alb);
    expect(res).toHaveProperty('address');
    expect(res.address).toMatch(/^[0-9.:a-fA-F]+$/);
  });

  test('ALB HTTP endpoint returns health page with successful RDS and DynamoDB checks', async () => {
    const alb = String(flat['ALBDNSName']);
    expect(alb).toBeTruthy();

    const url = `http://${alb}`;

    const resp = await axios.get(url, { timeout: 20000 });

    expect(resp.status).toBe(200);
    const html = String(resp.data || '');

    // Root page should include links to health and db-test endpoints
    expect(/href=['"]?\/health['"]?/i.test(html) || /href=['"]?\/db-test['"]?/i.test(html)).toBe(true);

    const h = await axios.get(`${url}/health`, { timeout: 10000 });
    expect(h.status).toBe(200);
    let healthJson: any = null;
    try {
      healthJson = typeof h.data === 'object' ? h.data : JSON.parse(String(h.data));
    } catch (e) {
      throw new Error(`/health did not return valid JSON. Raw body: ${String(h.data)}`);
    }
    expect(healthJson).toBeDefined();
    expect(healthJson.status).toBeDefined();
    expect(/healthy|ok|success/i.test(String(healthJson.status))).toBe(true);

    // Check /db-test returns JSON indicating DB success
    const d = await axios.get(`${url}/db-test`, { timeout: 10000 });
    expect(d.status).toBe(200);
    let dbJson: any = null;
    try {
      dbJson = typeof d.data === 'object' ? d.data : JSON.parse(String(d.data));
    } catch (e) {
      throw new Error(`/db-test did not return valid JSON. Raw body: ${String(d.data)}`);
    }
    expect(dbJson).toBeDefined();
    expect(dbJson.status).toBeDefined();
    expect(/success|ok|connected/i.test(String(dbJson.status) + ' ' + String(dbJson.message || ''))).toBe(true);
  });

  test('S3 application bucket exists', async () => {
    const bucket = String(flat['S3ApplicationBucketName']);
    expect(bucket).toBeTruthy();

    const s3 = new S3Client(awsConfigForRegion());
    const cmd = new HeadBucketCommand({ Bucket: bucket });
    await expect(s3.send(cmd)).resolves.not.toThrow();
  });

  test('Lambda function exists (by ARN)', async () => {
    const lambdaArn = String(flat['LambdaFunctionArn']);
    expect(lambdaArn).toBeTruthy();

    // Lambda GetFunction accepts function name or ARN
    const regionMatch = lambdaArn.match(/^arn:aws:lambda:([a-z0-9-]+):[0-9]+:function:(.+)$/);
    expect(regionMatch).not.toBeNull();
    const region = regionMatch ? regionMatch[1] : undefined;

    const lambda = new LambdaClient(awsConfigForRegion(region));
    const cmd = new GetFunctionCommand({ FunctionName: lambdaArn });
    const resp = await lambda.send(cmd);
    expect(resp.Configuration).toBeDefined();
    expect(resp.Configuration?.FunctionArn).toBe(lambdaArn);
  });

  test('CloudTrail exists with expected name', async () => {
    const trailName = String(flat['CloudTrailName']);
    expect(trailName).toBeTruthy();

    const ct = new CloudTrailClient(awsConfigForRegion());
    const cmd = new DescribeTrailsCommand({ trailNameList: [trailName] });
    const resp = await ct.send(cmd);
    const trails = resp.trailList || [];
    const found = trails.find(t => t.Name === trailName || t.TrailARN?.includes(trailName));
    expect(found).toBeDefined();
  });

  test('RDS connectivity is confirmed via ALB /db-test page', async () => {
    const alb = String(flat['ALBDNSName']);
    expect(alb).toBeTruthy();

    const url = `http://${alb}/db-test`;
    const resp = await axios.get(url, { timeout: 20000, validateStatus: () => true });

    expect(resp.status).toBe(200);
    let dbJson: any = null;
    try {
      dbJson = typeof resp.data === 'object' ? resp.data : JSON.parse(String(resp.data));
    } catch (e) {
      console.error('/db-test did not return JSON. Raw body:\n', String(resp.data));
    }

    expect(dbJson).toBeDefined();
    const statusOk = dbJson && dbJson.status && /success|ok|connected/i.test(String(dbJson.status));
    const msgOk = dbJson && dbJson.message && /database|connection|db/i.test(String(dbJson.message));
    if (!statusOk || !msgOk) {
      console.error('/db-test JSON did not indicate success. Full JSON:\n', JSON.stringify(dbJson, null, 2));
    }
    expect(statusOk).toBe(true);
    expect(msgOk).toBe(true);
  });

  test('WAF WebACL referenced by ARN exists', async () => {
    const webaclArn = String(flat['WebACLArn']);
    expect(webaclArn).toBeTruthy();

    const arnParts = webaclArn.split(':');
    expect(arnParts[2]).toBe('wafv2');
    const region = arnParts[3] || undefined;

    const afterResource = webaclArn.split(':').slice(5).join(':');
    const resourceParts = afterResource.split('/');
    expect(resourceParts.length).toBeGreaterThanOrEqual(4);
    const scope = resourceParts[0] === 'regional' ? 'REGIONAL' : 'CLOUDFRONT';
    const name = resourceParts[2];
    const id = resourceParts[3];

    expect(name).toBeTruthy();
    expect(id).toBeTruthy();

    const waf = new WAFV2Client(awsConfigForRegion(region));
    const cmd = new GetWebACLCommand({ Name: name, Scope: scope, Id: id });
    const resp = await waf.send(cmd);
    expect(resp.WebACL).toBeDefined();
    expect(resp.WebACL?.Name).toBe(name);
  });

  test('VPC exists and has a valid CIDR block', async () => {
    const vpcId = String(flat['VPCId']);
    expect(vpcId).toBeTruthy();

    const ec2 = new EC2Client(awsConfigForRegion());
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(resp.Vpcs).toBeDefined();
    expect((resp.Vpcs || []).length).toBeGreaterThan(0);
    const vpc = resp.Vpcs ? resp.Vpcs[0] : null;
    expect(vpc).toBeDefined();
    const cidr = String(vpc?.CidrBlock || '');
    expect(cidr.length).toBeGreaterThan(0);
    // Basic CIDR format check (IPv4)
    expect(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+$/.test(cidr)).toBe(true);
  });

  test('Subnets for the VPC exist and have CIDR ranges and AZs', async () => {
    const vpcId = String(flat['VPCId']);
    expect(vpcId).toBeTruthy();

    const ec2 = new EC2Client(awsConfigForRegion());
    const resp = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
    expect(resp.Subnets).toBeDefined();
    const subnets = resp.Subnets || [];
    expect(subnets.length).toBeGreaterThan(0);
    subnets.forEach(s => {
      expect(s.CidrBlock).toBeDefined();
      expect(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+$/.test(String(s.CidrBlock))).toBe(true);
      expect(s.AvailabilityZone).toBeDefined();
    });
  });

  test('AutoScaling Group(s) created by the stack have sensible min/max/desired sizes', async () => {
    const asg = new AutoScalingClient(awsConfigForRegion());
    const resp = await asg.send(new DescribeAutoScalingGroupsCommand({}));
    const groups = resp.AutoScalingGroups || [];

    // Try to find ASGs created by CloudFormation stack (tag key aws:cloudformation:stack-name)
    const matching = groups.filter(g => (g.Tags || []).some(t => t.Key === 'aws:cloudformation:stack-name' && /TapStack/i.test(String(t.Value))));
    expect(matching.length).toBeGreaterThan(0);

    matching.forEach(g => {
      expect(typeof g.MinSize).toBe('number');
      expect(typeof g.MaxSize).toBe('number');
      expect((g.MaxSize || 0)).toBeGreaterThanOrEqual((g.MinSize || 0));
      if (typeof g.DesiredCapacity === 'number') {
        expect(g.DesiredCapacity).toBeGreaterThanOrEqual(g.MinSize || 0);
        expect(g.DesiredCapacity).toBeLessThanOrEqual(g.MaxSize || g.DesiredCapacity);
      }
    });
  });
});

export { };

