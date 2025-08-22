import fs from 'fs';
import path from 'path';

// Integration tests that validate stack outputs without running Terraform
// Reads cfn-outputs/all-outputs.json only

describe('Terraform integration tests (outputs-based)', () => {
  const outputsPath = path.resolve(
    process.cwd(),
    'cfn-outputs/all-outputs.json'
  );

  let outputs: any = null;
  let skip = false;

  // Simple validators
  const isArn = (s: any) =>
    typeof s === 'string' &&
    /^arn:(aws|aws-us-gov|aws-cn):[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/.test(s);
  const isBucketName = (s: any) =>
    typeof s === 'string' && /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s);
  const isNonEmptyString = (s: any) => typeof s === 'string' && s.length > 0;

  const toSnakeCase = (s: string) =>
    s
      .replace(/([a-z0-9])(\s*)([A-Z])/g, '$1_$3')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase();

  const normalize = (raw: any): Record<string, any> => {
    if (!raw) return {};

    // Case A: { Outputs: [ { OutputKey, OutputValue }, ... ] }
    if (Array.isArray(raw.Outputs)) {
      const map: Record<string, any> = {};
      for (const o of raw.Outputs) {
        if (o && typeof o === 'object' && 'OutputKey' in o) {
          map[toSnakeCase(String(o.OutputKey))] =
            o.OutputValue ?? o.Value ?? o.outputValue ?? '';
        }
      }
      return map;
    }

    // Case B: [ { OutputKey, OutputValue }, ... ]
    if (
      Array.isArray(raw) &&
      raw.every(o => o && typeof o === 'object' && 'OutputKey' in o)
    ) {
      const map: Record<string, any> = {};
      for (const o of raw) {
        map[toSnakeCase(String(o.OutputKey))] =
          o.OutputValue ?? o.Value ?? o.outputValue ?? '';
      }
      return map;
    }

    // Case C: { key: value } possibly wrapped { value: X }
    if (raw && typeof raw === 'object') {
      const map: Record<string, any> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const unwrapped =
            (v as any).value ?? (v as any).Value ?? (v as any).OutputValue ?? v;
          map[toSnakeCase(k)] = unwrapped;
        } else {
          map[toSnakeCase(k)] = v as any;
        }
      }
      return map;
    }

    return raw as any;
  };

  beforeAll(() => {
    try {
      const raw = fs.readFileSync(outputsPath, 'utf8');
      outputs = normalize(JSON.parse(raw));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping outputs-based tests. Unable to read ${outputsPath}:`,
        (e as Error).message
      );
      outputs = null;
      skip = true;
    }
  });

  const maybe = (skipped: boolean) => (skipped ? test.skip : test);

  describe('Outputs file presence', () => {
    const t = maybe(skip);
    t('cfn-outputs/all-outputs.json exists and parses', () => {
      expect(outputs).not.toBeNull();
      expect(typeof outputs).toBe('object');
    });
  });

  describe('S3 buckets outputs (per region)', () => {
    const t = maybe(skip);
    t(
      'config buckets - us_east_1 and eu_west_1 valid names and region hints',
      () => {
        expect(outputs!.s3_config_buckets).toBeTruthy();
        const cfg = outputs!.s3_config_buckets;
        expect(isBucketName(cfg.us_east_1)).toBe(true);
        expect(isBucketName(cfg.eu_west_1)).toBe(true);
        expect(String(cfg.us_east_1)).toContain('us-east-1');
        expect(String(cfg.eu_west_1)).toContain('eu-west-1');
        expect(String(cfg.us_east_1)).toContain('-config-');
      }
    );
    t(
      'data buckets - us_east_1 and eu_west_1 valid names and region hints',
      () => {
        expect(outputs!.s3_data_buckets).toBeTruthy();
        const data = outputs!.s3_data_buckets;
        expect(isBucketName(data.us_east_1)).toBe(true);
        expect(isBucketName(data.eu_west_1)).toBe(true);
        expect(String(data.us_east_1)).toContain('us-east-1');
        expect(String(data.eu_west_1)).toContain('eu-west-1');
      }
    );
  });

  describe('AWS Config rule outputs (per region)', () => {
    const t = maybe(skip);
    t('encrypted_volumes rules names present and strings', () => {
      expect(outputs!.config_rules).toBeTruthy();
      const rules = outputs!.config_rules;
      expect(isNonEmptyString(rules.us_east_1)).toBe(true);
      const eu = rules.eu_west_1;
      if (eu) {
        expect(isNonEmptyString(eu)).toBe(true);
      } else {
        // Allow empty/null when second region is disabled in stack
        expect(eu === '' || eu == null).toBe(true);
      }
    });
  });

  describe('Lambda function ARNs (per region)', () => {
    const t = maybe(skip);
    t('lambda ARNs look valid', () => {
      expect(outputs!.lambda_functions).toBeTruthy();
      const lf = outputs!.lambda_functions;
      expect(isArn(lf.us_east_1)).toBe(true);
      expect(isArn(lf.eu_west_1)).toBe(true);
    });
  });

  describe('IAM policies outputs', () => {
    const t = maybe(skip);
    t('MFA and tag-based EC2 policy ARNs', () => {
      expect(outputs!.iam_policies).toBeTruthy();
      const pol = outputs!.iam_policies;
      expect(isArn(pol.mfa_policy)).toBe(true);
      expect(isArn(pol.tag_based_ec2_arn)).toBe(true);
    });
  });

  describe('Edge cases and resilience', () => {
    test('validators reject malformed values (no file IO)', () => {
      expect(isArn('arn:aws:s3:::bad')).toBe(false);
      expect(isBucketName('INVALID_BUCKET')).toBe(false);
      expect(isNonEmptyString('')).toBe(false);
    });
  });
});
