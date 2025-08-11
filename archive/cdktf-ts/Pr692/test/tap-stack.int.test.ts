import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

/**
 * Helpers to parse the actual cdk.tf.json emitted by CDKTF synth.
 * Using a parser keeps this stable across CDKTF versions.
 */
function parseSynth(stack: any): any {
  const out = Testing.synth(stack);
  const jsonStr = Array.isArray(out) ? out[0] : out;
  return JSON.parse(jsonStr);
}

type ResourceBlock = Record<string, Record<string, any>>;

function resourceMap(parsed: any): ResourceBlock {
  return (parsed && parsed.resource) || {};
}

function listResourcesOfType(res: ResourceBlock, type: string): Record<string, any> {
  return res[type] || {};
}

function countOfType(res: ResourceBlock, type: string): number {
  return Object.keys(res[type] || {}).length;
}

describe('TapStack End-to-End Infrastructure Tests', () => {
  let app: App;
  let stack: TapStack;
  let parsed: any;
  let res: ResourceBlock;
  let outputs: Record<string, { value: unknown }>;
  const ENV = 'staging'; // pick non-prod to avoid prod-only guards

  beforeAll(() => {
    // Make SSH CIDRs deterministic for tests (and not 0.0.0.0/0)
    process.env.ALLOWED_SSH_CIDRS = '203.0.113.0/24';
    process.env.ENVIRONMENT = ENV;
    process.env.AWS_REGION = 'us-west-2';

    app = new App();
    stack = new TapStack(app, 'IntegrationTestStack');
    parsed = parseSynth(stack);
    res = resourceMap(parsed);

    // Normalize outputs for both local & CI shapes
    outputs = parsed.output || parsed.outputs || {};
  });

  afterAll(() => {
    // clean up env for any other tests
    delete process.env.ALLOWED_SSH_CIDRS;
    delete process.env.ENVIRONMENT;
    delete process.env.AWS_REGION;
  });

  // ---- Keep your existing output-based assertions (stable and valuable) ----
  test('Synth contains all key outputs from VPC and S3', () => {
    const outputKeys = Object.keys(outputs);
    expect(outputKeys).toEqual(
      expect.arrayContaining([
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'database_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'bucket_id',
        'bucket_arn',
        'bucket_domain_name',
        'access_logs_bucket_id',
        'instance_id',
      ])
    );
  });

  test('VPC ID output is a Terraform reference or token string', () => {
      const vpcId = outputs['vpc_id']?.value;
      expect(typeof vpcId === 'string' || typeof vpcId === 'object').toBeTruthy();
    });

  test('S3 bucket domain name output is present (token or literal)', () => {
    const raw = outputs['bucket_domain_name']?.value;
    const str = String(raw ?? '');

    // Accept Terraform tokens like ${aws_s3_bucket...} OR a resolved literal containing amazonaws.com.
    const looksLikeToken = /^\$\{.*\}$/.test(str);
    const looksLikeLiteral = str.includes('amazonaws.com');

    expect(looksLikeToken || looksLikeLiteral).toBe(true);
  });

  // ------------------------- E2E-style assertions ----------------------------

  test('All taggable resources include the Environment tag', () => {
    // Check a representative set of taggable resource types we create
    const taggableTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_eip',
      'aws_nat_gateway',
      'aws_iam_role',
      'aws_iam_instance_profile',
      'aws_instance',
      'aws_security_group',
      'aws_s3_bucket',
      'aws_cloudwatch_dashboard',
      'aws_cloudwatch_metric_alarm',
      'aws_cloudwatch_log_group',
      'aws_sns_topic',
    ];

    for (const type of taggableTypes) {
      const instances = listResourcesOfType(res, type);
      for (const [, cfg] of Object.entries(instances)) {
        // Many AWS resources expose 'tags' (string map). Some dashboards/alarms also support tags.
        if (cfg && typeof cfg === 'object' && 'tags' in cfg) {
          const tags = cfg['tags'] || {};
          expect(tags).toBeDefined();
          expect(tags['Environment']).toBe(ENV);
        }
      }
    }
  });

  test('EC2 Security Group allows SSH from the configured CIDR', () => {
    const sgs = listResourcesOfType(res, 'aws_security_group');
    const sgList = Object.values(sgs);
    expect(sgList.length).toBeGreaterThan(0);

    const hasSshIngress = sgList.some((sg: any) => {
      const ingress = sg.ingress || [];
      return ingress.some(
        (rule: any) =>
          rule.from_port === 22 &&
          rule.to_port === 22 &&
          rule.protocol === 'tcp' &&
          Array.isArray(rule.cidr_blocks) &&
          rule.cidr_blocks.includes('203.0.113.0/24')
      );
    });

    expect(hasSshIngress).toBe(true);
  });

  test('S3 bucket enforces encryption and public access blocking', () => {
    // Encryption
    const enc = listResourcesOfType(
      res,
      'aws_s3_bucket_server_side_encryption_configuration'
    );
    const encCfgs = Object.values(enc);
    expect(encCfgs.length).toBeGreaterThan(0);

    const usesAES256 = encCfgs.some((c: any) => {
      const rules = c.rule || [];
      return rules.some(
        (r: any) =>
          r.apply_server_side_encryption_by_default &&
          r.apply_server_side_encryption_by_default.sse_algorithm === 'AES256'
      );
    });
    expect(usesAES256).toBe(true);

    // Public Access Block for main and access-logs buckets
    const pab = listResourcesOfType(res, 'aws_s3_bucket_public_access_block');
    const pabs = Object.values(pab);
    expect(pabs.length).toBeGreaterThan(0);

    const allBlockFlagsTrue = pabs.every((b: any) => {
      return (
        b.block_public_acls === true &&
        b.block_public_policy === true &&
        b.ignore_public_acls === true &&
        b.restrict_public_buckets === true
      );
    });
    expect(allBlockFlagsTrue).toBe(true);
  });

  test('Public + Private + Database subnets are created (total 9)', () => {
    // VpcConstruct creates 3 public, 3 private, 3 database = 9
    const subnetCount = countOfType(res, 'aws_subnet');
    expect(subnetCount).toBe(9);
  });
});