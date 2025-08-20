/*
 * Terraform static unit tests for lib/main.tf
 * These tests do NOT contact AWS. They parse the HCL file textually to assert
 * presence of critical security / architecture controls and run `terraform validate`.
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';

const tfDir = path.resolve(__dirname, '..', 'lib');
const mainTfPath = path.join(tfDir, 'main.tf');
const providerTfPath = path.join(tfDir, 'provider.tf');

function getConfig(): string {
  return (
    readFileSync(mainTfPath, 'utf8') +
    '\n' +
    readFileSync(providerTfPath, 'utf8')
  );
}

// Helper: count occurrences of regex (global)
function count(re: RegExp, content: string): number {
  const m = content.match(
    new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  );
  return m ? m.length : 0;
}

// Extract variable names
function extractVariables(content: string): string[] {
  const vars: string[] = [];
  const re = /variable\s+"([A-Za-z0-9_]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    vars.push(m[1]);
  }
  return vars;
}

// Extract outputs
function extractOutputs(content: string): string[] {
  const outs: string[] = [];
  const re = /output\s+"([A-Za-z0-9_]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    outs.push(m[1]);
  }
  return outs;
}

describe('terraform main.tf static validation', () => {
  const content = getConfig();

  test('required providers block includes aws, random, archive', () => {
    expect(content).toMatch(
      /required_providers[\s\S]*aws[\s\S]*hashicorp\/aws/
    );
    expect(content).toMatch(
      /required_providers[\s\S]*random[\s\S]*hashicorp\/random/
    );
    expect(content).toMatch(
      /required_providers[\s\S]*archive[\s\S]*hashicorp\/archive/
    );
  });

  test('s3 backend block present (even if empty)', () => {
    expect(content).toMatch(/backend\s+"s3"\s*{}/);
  });

  test('aws provider region default is eu-west-1 variable default', () => {
    expect(content).toMatch(
      /variable\s+"region"[\s\S]*default\s*=\s*"eu-west-1"/
    );
    expect(content).toMatch(/provider\s+"aws"[\s\S]*region\s*=\s*var.region/);
  });

  test('core variables defined', () => {
    const vars = extractVariables(content);
    const expected = [
      'project_name',
      'environment',
      'owner',
      'cost_center',
      'region',
      'enable_waf',
      'attach_waf_to',
      'pii_bucket_name',
      'logs_bucket_name',
      'rds_instance_class',
      'rds_username',
      'rds_backup_retention_days',
      'kms_key_administrators',
      'kms_key_users',
      'alarm_notification_topic_email',
      'access_key_max_age_days',
      'vpc_cidr',
      'acm_certificate_arn',
    ];
    expected.forEach(v => expect(vars).toContain(v));
  });

  test('outputs exposed', () => {
    const outs = extractOutputs(content);
    const expected = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'pii_bucket',
      'logs_bucket',
      'rds_endpoint',
      'alb_dns_name',
      'db_secret_arn',
      'cloudtrail_trail_arn',
      'guardduty_detector_id',
      'waf_web_acl_arn',
      'alarm_topic_arn',
      'iam_roles',
    ];
    expected.forEach(o => expect(outs).toContain(o));
  });

  test('VPC configured with DNS hostnames and support', () => {
    expect(content).toMatch(
      /resource\s+"aws_vpc"\s+"main"[\s\S]*enable_dns_hostnames\s*=\s*true/
    );
    expect(content).toMatch(
      /resource\s+"aws_vpc"\s+"main"[\s\S]*enable_dns_support\s*=\s*true/
    );
  });

  test('3 public, private, and database subnets (count=3)', () => {
    ['public', 'private', 'database'].forEach(kind => {
      expect(content).toMatch(
        new RegExp(
          `resource\\s+"aws_subnet"\\s+"${kind}"[\\s\\S]*count\\s*=\\s*3`
        )
      );
    });
  });

  test('NAT gateways count = 3 and depend on IGW', () => {
    expect(content).toMatch(
      /resource\s+"aws_nat_gateway"\s+"main"[\s\S]*count\s*=\s*3/
    );
    expect(content).toMatch(
      /resource\s+"aws_eip"\s+"nat"[\s\S]*depends_on\s*=\s*\[aws_internet_gateway\.main]/
    );
  });

  test('VPC endpoints for s3, secretsmanager, kms, logs, sts, ec2 exist', () => {
    ['s3', 'secrets_manager', 'kms', 'logs', 'sts', 'ec2'].forEach(ep => {
      expect(content).toMatch(
        new RegExp(`resource\\s+"aws_vpc_endpoint"\\s+"${ep}"`)
      );
    });
  });

  test('Security groups include alb, app_tier, database, vpc_endpoints, rds', () => {
    ['alb', 'app_tier', 'database', 'vpc_endpoints', 'rds'].forEach(sg => {
      expect(content).toMatch(
        new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`)
      );
    });
  });

  test('KMS keys defined with rotation enabled', () => {
    ['s3', 'rds', 'secrets_manager', 'cloudwatch_logs'].forEach(k => {
      expect(content).toMatch(
        new RegExp(
          `resource\\s+"aws_kms_key"\\s+"${k}"[\\s\\S]*enable_key_rotation\\s*=\\s*true`
        )
      );
    });
  });

  test('PII bucket uses KMS encryption and TLS enforcement', () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"pii_data"/);
    expect(content).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"pii_data"[\s\S]*sse_algorithm\s*=\s*"aws:kms"/
    );
    expect(content).toMatch(
      /aws_s3_bucket_policy"\s+"pii_data"[\s\S]*DenyInsecureConnections/
    );
  });

  test('Logs bucket denies insecure connections & allows CloudTrail put', () => {
    expect(content).toMatch(
      /aws_s3_bucket_policy"\s+"logs"[\s\S]*DenyInsecureConnections/
    );
    expect(content).toMatch(
      /aws_s3_bucket_policy"\s+"logs"[\s\S]*AllowCloudTrailPuts/
    );
  });

  test('CloudTrail configured multi-region with log validation', () => {
    expect(content).toMatch(
      /resource\s+"aws_cloudtrail"\s+"main"[\s\S]*is_multi_region_trail\s*=\s*true/
    );
    expect(content).toMatch(
      /resource\s+"aws_cloudtrail"\s+"main"[\s\S]*enable_log_file_validation\s*=\s*true/
    );
  });

  test('GuardDuty detector enabled', () => {
    expect(content).toMatch(
      /resource\s+"aws_guardduty_detector"\s+"main"[\s\S]*enable\s*=\s*true/
    );
  });

  test('AWS Config recorder and rules present', () => {
    expect(content).toMatch(
      /resource\s+"aws_config_configuration_recorder"\s+"main"/
    );
    [
      'ACCESS_KEYS_ROTATED',
      'CMK_BACKING_KEY_ROTATION_ENABLED',
      'CLOUD_TRAIL_ENABLED',
    ].forEach(id => {
      expect(content).toMatch(new RegExp(`source_identifier\\s*=\\s*"${id}"`));
    });
  });

  test('RDS instance secure settings (multi-AZ, encrypted, private)', () => {
    expect(content).toMatch(
      /resource\s+"aws_db_instance"\s+"mysql"[\s\S]*multi_az\s*=\s*true/
    );
    expect(content).toMatch(
      /resource\s+"aws_db_instance"\s+"mysql"[\s\S]*storage_encrypted\s*=\s*true/
    );
    expect(content).toMatch(
      /resource\s+"aws_db_instance"\s+"mysql"[\s\S]*publicly_accessible\s*=\s*false/
    );
    expect(content).toMatch(
      /resource\s+"aws_db_parameter_group"\s+"mysql"[\s\S]*require_secure_transport/
    );
  });

  test('Secrets Manager rotation set to 90 days', () => {
    expect(content).toMatch(
      /aws_secretsmanager_secret_rotation"\s+"db_credentials"[\s\S]*automatically_after_days\s*=\s*90/
    );
  });

  test('ALB access logs configured to logs bucket', () => {
    expect(content).toMatch(
      /resource\s+"aws_lb"\s+"app"[\s\S]*access_logs[\s\S]*bucket\s*=\s*aws_s3_bucket\.logs\.bucket/
    );
  });

  test('WAF Web ACL defined with managed rule group', () => {
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"app"/);
    expect(content).toMatch(
      /managed_rule_group_statement[\s\S]*AWSManagedRulesCommonRuleSet/
    );
  });

  test('CloudWatch alarms defined for unauthorized, root usage, console no MFA', () => {
    ['unauthorized', 'root_usage', 'console_no_mfa'].forEach(n => {
      expect(content).toMatch(
        new RegExp(`aws_cloudwatch_metric_alarm"\\s+"${n}"`)
      );
    });
  });

  test('IAM roles exist for app_ec2, app_lambda, backup, ops_readonly, flow_logs, secret rotation', () => {
    [
      'app_ec2_role',
      'app_lambda_role',
      'backup_role',
      'ops_readonly_role',
      'flow_logs_role',
      'secret_rotation_lambda_role',
    ].forEach(r => {
      expect(content).toMatch(
        new RegExp(`resource\\s+"aws_iam_role"\\s+"${r}"`)
      );
    });
  });
});

describe('terraform validate (syntax & internal consistency)', () => {
  // This will download providers. We disable backend config by not specifying one.
  const skip = process.env.SKIP_TERRAFORM_VALIDATE === '1';

  (skip ? test.skip : test)(
    'terraform init -backend=false then validate succeeds',
    () => {
      const initCmd = 'terraform init -backend=false -input=false';
      const validateCmd = 'terraform validate';
      const opts = { cwd: tfDir, stdio: 'pipe' as const };
      try {
        execSync(initCmd, opts);
        const out = execSync(validateCmd, opts).toString();
        expect(out).toMatch(/Success!/);
      } catch (e: any) {
        // Provide debug output
        console.error(
          'Terraform validate failed:',
          e.stdout?.toString(),
          e.stderr?.toString()
        );
        throw e;
      }
    }
  );
});
