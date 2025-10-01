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

  beforeAll(() => {
    outputs = loadOutputs();
  });

  test('basic outputs present and use environment suffix', () => {
    const keys = Object.keys(outputs);
    expect(keys.length).toBeGreaterThanOrEqual(4);

    // Find expected logical outputs using prefix matching (relaxed)
    const vpcKey = keys.find((k) => k.startsWith('VPCID'));
    const albKey = keys.find((k) => k.startsWith('LoadBalancerDNS'));
    const rdsKey = keys.find((k) => k.startsWith('RDSIdentifier'));
    const bucketKey = keys.find((k) => k.startsWith('MainBucketName') || k.startsWith('AppBucketName') || k.startsWith('BucketName'));

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
    expect(detectedSuffixes.size).toBeGreaterThanOrEqual(1);
    // At least one of the discovered suffixes should be non-empty (env suffix)
    const hasNonEmptySuffix = Array.from(detectedSuffixes).some((s) => s && s.length > 0);
    expect(hasNonEmptySuffix).toBe(true);
  });

  test('output values conform to expected AWS identifier patterns', () => {
    const keys = Object.keys(outputs);

    // VPC id like vpc-xxxxxxxx
    const vpcKey = keys.find((k) => k.startsWith('VPCID'));
    const vpcVal = vpcKey ? outputs[vpcKey] : undefined;
    expect(vpcVal).toBeDefined();
    expect(typeof vpcVal).toBe('string');
    expect(/^vpc-[0-9a-f]+$/.test(vpcVal as string)).toBe(true);

    // RDS identifier: non-empty, lowercase letters/numbers/hyphen
    const rdsKey = keys.find((k) => k.startsWith('RDSIdentifier'));
    const rdsVal = rdsKey ? outputs[rdsKey] : undefined;
    expect(rdsVal).toBeDefined();
    expect(typeof rdsVal).toBe('string');
    expect(/^[a-z0-9\-]+$/.test(rdsVal as string)).toBe(true);

    // S3 bucket: valid bucket name (relaxed check)
    const bucketKey = keys.find((k) => k.startsWith('MainBucketName') || k.startsWith('AppBucketName') || k.startsWith('BucketName'));
    const bucketVal = bucketKey ? outputs[bucketKey] : undefined;
    expect(bucketVal).toBeDefined();
    expect(typeof bucketVal).toBe('string');
    expect(/^[a-z0-9.\-]{3,63}$/.test(bucketVal as string)).toBe(true);

    // ALB DNS: should contain a hostname and implicitly region (no hardcoding)
    const albKey = keys.find((k) => k.startsWith('LoadBalancerDNS'));
    const albVal = albKey ? outputs[albKey] : undefined;
    expect(albVal).toBeDefined();
    expect(typeof albVal).toBe('string');
    // simple DNS format check
    expect(/^[a-z0-9\-\.]+\.[a-z0-9\-\.]+$/.test(albVal as string)).toBe(true);
  });

  test('no hardcoded region in outputs and values are generic', () => {
    const values = Object.values(outputs).join(' ').toLowerCase();
    // Ensure tests don't assert a fixed region; just confirm that AWS region env may be present
    const suppliedRegion = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || '';
    if (suppliedRegion) {
      // ensure at least one output value contains the region string (lowercase)
      expect(values.includes(suppliedRegion.toLowerCase())).toBe(true);
    } else {
      // ensure we did not accidentally embed a fixed region we disallow
      expect(values.includes('us-east-1')).toBe(false);
    }
  });

  test('outputs reference expected resource types (sanity)', () => {
    // sanity: at least one output value looks like a VPC, bucket, ALB DNS, or RDS id
    const vals = Object.values(outputs);
    const hasVpc = vals.some((v) => typeof v === 'string' && /^vpc-[0-9a-f]+$/.test(v));
    const hasBucket = vals.some((v) => typeof v === 'string' && /^[a-z0-9.\-]{3,63}$/.test(v));
    const hasAlb = vals.some((v) => typeof v === 'string' && v.includes('.elb.'));
    const hasRds = vals.some((v) => typeof v === 'string' && /^[a-z0-9\-]+$/.test(v));
    expect(hasVpc || hasBucket || hasAlb || hasRds).toBe(true);
  });
});
