import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'primary_region',
        'secondary_region',
        'environment',
        'owner',
        'alert_email',
        'alert_phone',
        'db_username'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals and Tags
  // -------------------------
  describe('Locals', () => {
    test('defines all expected locals', () => {
      const expectedLocals = [
        'resource_suffix',
        'common_tags',
        'primary_tags',
        'secondary_tags',
        'primary_vpc_cidr',
        'secondary_vpc_cidr',
        'primary_public_subnets',
        'primary_private_subnets',
        'secondary_public_subnets',
        'secondary_private_subnets'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    describe('Tags', () => {
      test('common_tags contain correct keys', () => {
        ['Environment', 'Owner', 'ManagedBy', 'Purpose'].forEach(t =>
          expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
        );
      });

      test('primary_tags contain correct keys', () => {
        ['DR-Role', 'Region'].forEach(t =>
          expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
        );
      });

      test('secondary_tags contain correct keys', () => {
        ['DR-Role', 'Region'].forEach(t =>
          expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
        );
      });
    });
  });

  // -------------------------
  // VPC and Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPCs defined', () => {
      ['primary', 'secondary'].forEach(vpcType =>
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_vpc"\\s+"${vpcType}"`))
      );
    });

    test('Public and Private Subnets', () => {
      [
        'primary_public',
        'primary_private',
        'secondary_public',
        'secondary_private'
      ].forEach(subnet =>
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_subnet"\\s+"${subnet}"`))
      );
    });

    test('Internet Gateways, NAT Gateways, and Elastic IPs exist', () => {
      ['primary', 'secondary'].forEach(prefix => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${prefix}"`));
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${prefix}"`));
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_eip"\\s+"${prefix}"`));
      });
    });

    test('Route tables and associations are defined', () => {
      ['primary', 'secondary'].forEach(prefix => {
        ['public', 'private'].forEach(routeType => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_route_table"\\s+"${prefix}_${routeType}"`));
          expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_route_table_association"\\s+"${prefix}_${routeType}"`));
        });
      });
    });
  });

  // -------------------------
  // Security Groups & IAM
  // -------------------------
  describe('Security Groups & IAM', () => {
    ['rds_primary', 'rds_secondary', 'lambda_primary', 'lambda_secondary'].forEach(sg => {
      test(`Security group ${sg} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      });
    });

    ['lambda_primary', 'lambda_secondary'].forEach(lambdaName => {
      test(`IAM role and policy for ${lambdaName}`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role"\\s+"${lambdaName}"`));
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role_policy"\\s+"${lambdaName}"`));
      });
    });
  });

  // -------------------------
  // RDS Instances and Parameter Groups
  // -------------------------
  describe('RDS Resources', () => {
    ['primary', 'secondary'].forEach(db => {
      test(`RDS DB Instance ${db} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_db_instance"\\s+"${db}"`));
      });
      test(`DB Parameter Group ${db} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_db_parameter_group"\\s+"${db}"`));
      });
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    ['backup_primary', 'backup_secondary'].forEach(bucket => {
      test(`S3 bucket ${bucket} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      });
    });
  });

  // -------------------------
  // CloudWatch Logs and Alarms
  // -------------------------
  describe('CloudWatch Resources', () => {
    ['rds_primary', 'rds_secondary', 'lambda_primary', 'lambda_secondary'].forEach(logGroup => {
      test(`CloudWatch Log Group ${logGroup} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_cloudwatch_log_group"\\s+"${logGroup}"`));
      });
    });
    test('CloudWatch alarms exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failure"/);
    });
  });

  // -------------------------
  // Secrets Manager
  // -------------------------
  describe('Secrets Manager', () => {
    ['db_primary_creds', 'db_secondary_creds'].forEach(secret => {
      test(`Secrets Manager secret ${secret} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_secretsmanager_secret"\\s+"${secret}"`));
      });
    });
  });

  // -------------------------
  // SNS Topics and Subscriptions
  // -------------------------
  describe('SNS Topics', () => {
    test('SNS Topic and Subscription exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs = [
      'rds_primary_endpoint',
      'rds_secondary_endpoint',
      'primary_vpc_id',
      'secondary_vpc_id',
      'primary_public_subnet_ids',
      'primary_private_subnet_ids',
      'secondary_public_subnet_ids',
      'secondary_private_subnet_ids',
      'rds_primary_security_group_id',
      'rds_secondary_security_group_id',
      'primary_s3_backup_bucket_id',
      'secondary_s3_backup_bucket_id',
      'lambda_primary_arn',
      'lambda_secondary_arn',
      // Add remaining outputs as defined in tap_stack.tf file
    ];
    expectedOutputs.forEach(output => {
      test(`output "${output}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
