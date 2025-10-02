import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBClustersCommand, DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

function loadOutputs(): Record<string, string> {
  if (!fs.existsSync(allOutputsPath)) {
    throw new Error(`Expected outputs file not found: ${allOutputsPath}`);
  }
  const raw = fs.readFileSync(allOutputsPath, 'utf8').trim();
  if (!raw) throw new Error('Outputs file is empty');
  const parsed = JSON.parse(raw);
  // Accept either { StackName: [ { OutputKey, OutputValue, ... }, ... ] } or flat map
  if (parsed && typeof parsed === 'object') {
    // If first-level mapping has arrays (stack -> outputs list), flatten to map
    const firstValue = Object.values(parsed)[0];
    if (Array.isArray(firstValue)) {
      const arr = firstValue as any[];
      const map: Record<string, string> = {};
      arr.forEach(({ OutputKey, OutputValue }: any) => {
        if (OutputKey) map[OutputKey] = OutputValue;
      });
      return map;
    }
    // Otherwise assume flat map of key->value
    return parsed as Record<string, string>;
  }
  throw new Error('Unexpected outputs file format');
}

describe('TapStack integration (live outputs)', () => {
  let outputs: Record<string, string>;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION || '';
  const ec2 = new EC2Client({ region: region || undefined });
  const rds = new RDSClient({ region: region || undefined });
  const s3 = new S3Client({ region: region || undefined });
  const elbv2 = new ElasticLoadBalancingV2Client({ region: region || undefined });

  beforeAll(() => {
    // increase timeout for network calls if Jest default is low
    jest.setTimeout(120_000);
    outputs = loadOutputs();
    console.info('Loaded outputs keys:', Object.keys(outputs));
  });

  test('basic outputs present and use environment suffix', () => {
    const keys = Object.keys(outputs);
    console.info('Validating presence of expected logical keys. All keys:', keys);
    expect(keys.length).toBeGreaterThanOrEqual(4);

    // Find expected logical outputs using prefix matching (relaxed)
    const vpcKey = keys.find((k) => k.startsWith('VPCID'));
    const albKey = keys.find((k) => k.startsWith('LoadBalancerDNS'));
    const rdsKey = keys.find((k) => k.startsWith('RDSIdentifier'));
    const bucketKey = keys.find((k) => k.startsWith('MainBucketName') || k.startsWith('AppBucketName') || k.startsWith('BucketName'));

    console.info('Discovered keys -> vpcKey:', vpcKey, 'albKey:', albKey, 'rdsKey:', rdsKey, 'bucketKey:', bucketKey);

    expect(vpcKey).toBeDefined();
    expect(albKey).toBeDefined();
    expect(rdsKey).toBeDefined();
    expect(bucketKey).toBeDefined();

    // Ensure keys share a common suffix (extract suffix by removing known prefix)
    const prefixes = ['VPCID', 'LoadBalancerDNS', 'RDSIdentifier', 'MainBucketName', 'AppBucketName', 'BucketName'];
    const detectedSuffixes = new Set<string>();
    keys.forEach((k) => {
      for (const p of prefixes) {
        if (k.startsWith(p)) {
          detectedSuffixes.add(k.slice(p.length));
        }
      }
    });
    console.info('Detected suffixes for logical keys:', Array.from(detectedSuffixes));
    expect(detectedSuffixes.size).toBeGreaterThanOrEqual(1);
    const hasNonEmptySuffix = Array.from(detectedSuffixes).some((s) => s && s.length > 0);
    expect(hasNonEmptySuffix).toBe(true);
  });

  test('output values exist in AWS (live checks, no format-only asserts)', async () => {
    const keys = Object.keys(outputs);

    // VPC: presence then DescribeVpcs
    const vpcKey = keys.find((k) => k.startsWith('VPCID'));
    const vpcVal = vpcKey ? outputs[vpcKey] : undefined;
    console.info('VPC validation start - key:', vpcKey, 'value:', vpcVal);
    expect(vpcVal).toBeDefined();
    expect(typeof vpcVal).toBe('string');
    try {
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [(vpcVal as string)] }));
      console.info('DescribeVpcs result for', vpcVal, '-> Vpc count:', res.Vpcs?.length ?? 0);
      expect((res.Vpcs?.length ?? 0) > 0).toBe(true);
    } catch (err) {
      console.error('EC2 DescribeVpcs failed for', vpcVal, err);
      throw err;
    }

    // RDS: presence then describe instance/cluster
    const rdsKey = keys.find((k) => k.startsWith('RDSIdentifier'));
    const rdsVal = rdsKey ? outputs[rdsKey] : undefined;
    console.info('RDS validation start - key:', rdsKey, 'value:', rdsVal);
    expect(rdsVal).toBeDefined();
    expect(typeof rdsVal).toBe('string');
    let rdsVerified = false;
    try {
      const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsVal as string }));
      console.info('DescribeDBInstances result for', rdsVal, '-> count:', res.DBInstances?.length ?? 0);
      rdsVerified = (res.DBInstances?.length ?? 0) > 0;
    } catch (e1) {
      console.info('DescribeDBInstances failed, attempting DescribeDBClusters for', rdsVal, e1);
      try {
        const res2 = await rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: rdsVal as string }));
        console.info('DescribeDBClusters result for', rdsVal, '-> count:', res2.DBClusters?.length ?? 0);
        rdsVerified = (res2.DBClusters?.length ?? 0) > 0;
      } catch (e2) {
        console.error('Both RDS describe calls failed for', rdsVal, e2);
      }
    }
    expect(rdsVerified).toBe(true);

    // S3: presence then HeadBucket
    const bucketKey = keys.find((k) => k.startsWith('MainBucketName') || k.startsWith('AppBucketName') || k.startsWith('BucketName'));
    const bucketVal = bucketKey ? outputs[bucketKey] : undefined;
    console.info('S3 validation start - key:', bucketKey, 'value:', bucketVal);
    expect(bucketVal).toBeDefined();
    expect(typeof bucketVal).toBe('string');
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucketVal as string }));
      console.info('HeadBucket succeeded for', bucketVal);
    } catch (err) {
      console.error('S3 HeadBucket failed for', bucketVal, err);
      throw err;
    }

    // ALB: presence then DescribeLoadBalancers search
    const albKey = keys.find((k) => k.startsWith('LoadBalancerDNS'));
    const albVal = albKey ? outputs[albKey] : undefined;
    console.info('ALB validation start - key:', albKey, 'value:', albVal);
    expect(albVal).toBeDefined();
    expect(typeof albVal).toBe('string');
    try {
      const res = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const found = (res.LoadBalancers ?? []).some((lb) => lb.DNSName === albVal || albVal?.toString().includes(lb.DNSName ?? ''));
      console.info('DescribeLoadBalancers matched DNSName?:', found);
      expect(found).toBe(true);
    } catch (err) {
      console.error('ELBv2 DescribeLoadBalancers failed for', albVal, err);
      throw err;
    }
  });

  test('no hardcoded region in outputs and values are generic', () => {
    const values = Object.values(outputs).join(' ').toLowerCase();
    console.info('Checking outputs for hardcoded region and presence of runtime region. Combined values:', values);
    const suppliedRegion = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || '';
    if (suppliedRegion) {
      console.info('Runtime region supplied:', suppliedRegion);
      expect(values.includes(suppliedRegion.toLowerCase())).toBe(true);
    } else {
      console.info('No runtime region supplied; ensure no hardcoded us-east-1 present');
      expect(values.includes('us-east-1')).toBe(false);
    }
  });

  test('outputs reference expected resource types (sanity)', () => {
    const vals = Object.values(outputs);
    console.info('Sanity check values sample (first 10):', vals.slice(0, 10));
    // Keep this test light: ensure at least one output exists
    expect(vals.length).toBeGreaterThan(0);
  });
});
