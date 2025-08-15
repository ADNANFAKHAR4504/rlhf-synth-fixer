import fs from 'fs';
import path from 'path';

/**
 * Integration tests for Terraform stack without running Terraform.
 * - Validates presence/shape of expected outputs from cfn-outputs/all-outputs.json
 * - Performs format checks (ARNs, IDs, URLs) and basic relationships
 * - Reads HCL file to assert presence (smoke) but does not parse/execute
 */

describe('Terraform integration tests (outputs + standards)', () => {
  const outputsPath = path.resolve(
    process.cwd(),
    'cfn-outputs/all-outputs.json'
  );
  const tfPath = path.resolve(__dirname, '../lib/tap_stack.tf');

  // Loaded once for all tests
  let outputs: Record<string, any> | null = null;
  let tfSource = '';
  let skipOutputs = false;

  // Simple validators
  const isArn = (s: any) =>
    typeof s === 'string' &&
    /^arn:(aws|aws-us-gov|aws-cn):[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/.test(s);
  const isVpcId = (s: any) =>
    typeof s === 'string' && /^vpc-([0-9a-f]{8,17})$/.test(s);
  const isSubnetId = (s: any) =>
    typeof s === 'string' && /^subnet-([0-9a-f]{8,17})$/.test(s);
  const isSgId = (s: any) =>
    typeof s === 'string' && /^sg-([0-9a-f]{8,17})$/.test(s);
  const isBucketName = (s: any) =>
    typeof s === 'string' && /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s);
  const isUrl = (s: any) => typeof s === 'string' && /^https:\/\//.test(s);
  const isNonEmptyString = (s: any) => typeof s === 'string' && s.length > 0;
  const isNonEmptyArray = (a: any) => Array.isArray(a) && a.length > 0;

  const getRegionFromInvokeUrl = (url: string): string | null => {
    const m = url.match(
      /^https:\/\/[a-z0-9]+\.execute-api\.([a-z0-9-]+)\.amazonaws\.com\//
    );
    return m ? m[1] : null;
  };

  beforeAll(() => {
    // Load HCL for a smoke presence check
    if (fs.existsSync(tfPath)) {
      tfSource = fs.readFileSync(tfPath, 'utf8');
    }

    // Load outputs JSON if present
    try {
      const raw = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(raw);
    } catch (e) {
      // If not present or invalid, mark outputs tests to be skipped
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping outputs-based tests. Unable to read ${outputsPath}:`,
        (e as Error).message
      );
      skipOutputs = true;
      outputs = null;
    }
  });

  describe('Stack presence (HCL smoke test)', () => {
    test('tap_stack.tf exists and references key resources', () => {
      expect(fs.existsSync(tfPath)).toBe(true);
      expect(tfSource).toContain('resource "aws_vpc" "main"');
      expect(tfSource).toContain('resource "aws_cloudtrail" "main"');
      expect(tfSource).toContain(
        'resource "aws_config_configuration_recorder" "main"'
      );
      expect(tfSource).toContain('resource "aws_guardduty_detector" "main"');
    });
  });

  const maybe = (skip: boolean) => (skip ? test.skip : test);

  describe('Outputs JSON presence', () => {
    const t = maybe(skipOutputs);
    t('cfn-outputs/all-outputs.json exists and is valid JSON', () => {
      expect(outputs).not.toBeNull();
      expect(typeof outputs).toBe('object');
    });
  });

  describe('Required outputs are present with valid shapes', () => {
    const t = maybe(skipOutputs);
    t('core network outputs', () => {
      expect(isVpcId(outputs!.vpc_id)).toBe(true);
      expect(isNonEmptyArray(outputs!.public_subnet_ids)).toBe(true);
      expect(outputs!.public_subnet_ids.every(isSubnetId)).toBe(true);
      expect(isNonEmptyArray(outputs!.private_subnet_ids)).toBe(true);
      expect(outputs!.private_subnet_ids.every(isSubnetId)).toBe(true);
    });

    t('security groups outputs', () => {
      expect(isSgId(outputs!.web_sg_id)).toBe(true);
      expect(isSgId(outputs!.app_sg_id)).toBe(true);
      expect(isSgId(outputs!.rds_sg_id)).toBe(true);
    });

    t('S3 buckets and ARNs', () => {
      expect(isBucketName(outputs!.logs_bucket_name)).toBe(true);
      expect(isArn(outputs!.logs_bucket_arn)).toBe(true);
      expect(isBucketName(outputs!.data_bucket_name)).toBe(true);
      expect(isArn(outputs!.data_bucket_arn)).toBe(true);
      // Heuristic: logs bucket name contains "-logs-"
      expect(String(outputs!.logs_bucket_name)).toContain('-logs-');
    });

    t('CloudTrail + region coherence', () => {
      expect(isArn(outputs!.cloudtrail_arn)).toBe(true);
      expect(isNonEmptyString(outputs!.cloudtrail_home_region)).toBe(true);
    });

    t('AWS Config + GuardDuty outputs', () => {
      expect(isNonEmptyString(outputs!.config_recorder_name)).toBe(true);
      expect(isNonEmptyString(outputs!.config_delivery_name)).toBe(true);
      expect(isNonEmptyString(outputs!.guardduty_detector_id)).toBe(true);
    });

    t('API Gateway outputs and region match', () => {
      expect(isNonEmptyString(outputs!.api_gateway_id)).toBe(true);
      expect(isNonEmptyString(outputs!.api_gateway_stage)).toBe(true);
      expect(isUrl(outputs!.api_gateway_invoke_url)).toBe(true);
      const urlRegion = getRegionFromInvokeUrl(
        String(outputs!.api_gateway_invoke_url)
      );
      if (outputs!.cloudtrail_home_region && urlRegion) {
        expect(urlRegion).toBe(String(outputs!.cloudtrail_home_region));
      }
    });

    t('RDS endpoint output', () => {
      expect(isNonEmptyString(outputs!.rds_endpoint)).toBe(true);
      // Basic RDS endpoint heuristic
      expect(String(outputs!.rds_endpoint)).toMatch(
        /\.rds\.[a-z0-9-]+\.amazonaws\.com/
      );
    });
  });

  describe('Edge cases and standards', () => {
    const t = maybe(skipOutputs);

    t(
      'public subnets and private subnets have at least two entries each',
      () => {
        expect(Array.isArray(outputs!.public_subnet_ids)).toBe(true);
        expect(Array.isArray(outputs!.private_subnet_ids)).toBe(true);
        expect(outputs!.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
        expect(outputs!.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
      }
    );

    t('api invoke url structure is valid and stage is embedded', () => {
      const url = String(outputs!.api_gateway_invoke_url);
      expect(url).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9-]+\/?$/
      );
      expect(url).toContain(`/${String(outputs!.api_gateway_stage)}`);
    });

    t('bucket ARNs correspond to bucket names (suffix match)', () => {
      const logsName = String(outputs!.logs_bucket_name);
      const logsArn = String(outputs!.logs_bucket_arn);
      expect(logsArn).toContain(`:${logsName}`);
      const dataName = String(outputs!.data_bucket_name);
      const dataArn = String(outputs!.data_bucket_arn);
      expect(dataArn).toContain(`:${dataName}`);
    });
  });

  describe('Resilience when outputs file is missing or malformed', () => {
    test('helper validators reject malformed values (no file IO)', () => {
      expect(isArn('arn:aws:s3:::bad')).toBe(false);
      expect(isVpcId('vpc-xyz')).toBe(false);
      expect(isSubnetId('subnet-1234')).toBe(false);
      expect(isSgId('sg-foo')).toBe(false);
      expect(isBucketName('INVALID_BUCKET')).toBe(false);
      expect(
        getRegionFromInvokeUrl(
          'https://abc.execute-api.us-east-1.amazonaws.com/dev'
        )
      ).toBe('us-east-1');
      expect(getRegionFromInvokeUrl('https://bad/url')).toBeNull();
    });
  });
});
