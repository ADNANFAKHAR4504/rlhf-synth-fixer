import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: { CustomTag: 'CustomValue' },
      });
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors via props
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });

    test('TapStack uses default values when no props provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors when no props are provided
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });

    test('TapStack handles empty props object', () => {
      stack = new TapStack(app, 'TestTapStackEmpty', {});
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('AWS Provider Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('AWS provider is configured correctly', () => {
      expect(synthesized.provider.aws[0]).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
      expect(synthesized.provider.aws[0].default_tags).toBeDefined();
    });

    test('Default tags are applied to AWS provider', () => {
      const awsProvider = synthesized.provider.aws[0];
      const defaultTags = awsProvider.default_tags[0].tags;

      expect(defaultTags.Environment).toBe('Production');
      expect(defaultTags.Project).toBe('IaC-AWS-Nova-Model-Breaking');
      expect(defaultTags.ManagedBy).toBe('CDKTF');
      expect(defaultTags.SecurityLevel).toBe('High');
    });
  });

  describe('KMS Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('KMS key is created with correct configuration', () => {
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];

      expect(kmsKey).toBeDefined();
      expect(kmsKey.description).toBe(
        'Main KMS key for prod-sec environment encryption'
      );
      expect(kmsKey.enable_key_rotation).toBe(true);
      expect(kmsKey.policy).toBeDefined();
    });

    test('KMS key policy allows root account access', () => {
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];
      const policy = JSON.parse(kmsKey.policy);

      const rootStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Enable IAM User Permissions'
      );

      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS alias is created with unique suffix', () => {
      const kmsAlias =
        synthesized.resource.aws_kms_alias['prod-sec-main-kms-alias'];

      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.name).toMatch(/^alias\/prod-sec-main-key-[a-z0-9]{6}$/);
      expect(kmsAlias.target_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.key_id}'
      );
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('VPC is configured with correct CIDR and DNS settings', () => {
      const vpc = synthesized.resource.aws_vpc['prod-sec-vpc'];

      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('Public subnets are created in correct availability zones', () => {
      const publicSubnet1 =
        synthesized.resource.aws_subnet['prod-sec-public-subnet-1'];
      const publicSubnet2 =
        synthesized.resource.aws_subnet['prod-sec-public-subnet-2'];

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.cidr_block).toBe('10.0.1.0/24');
      expect(publicSubnet1.availability_zone).toBe('us-east-1a');
      expect(publicSubnet1.map_public_ip_on_launch).toBe(true);

      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet2.cidr_block).toBe('10.0.2.0/24');
      expect(publicSubnet2.availability_zone).toBe('us-east-1b');
      expect(publicSubnet2.map_public_ip_on_launch).toBe(true);
    });

    test('Private subnets are created without public IP mapping', () => {
      const privateSubnet1 =
        synthesized.resource.aws_subnet['prod-sec-private-subnet-1'];
      const privateSubnet2 =
        synthesized.resource.aws_subnet['prod-sec-private-subnet-2'];

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.cidr_block).toBe('10.0.10.0/24');
      expect(privateSubnet1.availability_zone).toBe('us-east-1a');
      expect(privateSubnet1.map_public_ip_on_launch).toBeUndefined();

      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet2.cidr_block).toBe('10.0.11.0/24');
      expect(privateSubnet2.availability_zone).toBe('us-east-1b');
      expect(privateSubnet2.map_public_ip_on_launch).toBeUndefined();
    });

    test('Internet Gateway is attached to VPC', () => {
      const igw = synthesized.resource.aws_internet_gateway['prod-sec-igw'];

      expect(igw).toBeDefined();
      expect(igw.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
    });

    test('NAT Gateways were removed to avoid AWS limits', () => {
      // NAT Gateways were removed due to AWS account limits (40 per account)
      expect(synthesized.resource.aws_nat_gateway).toBeUndefined();
    });

    test('Route tables are configured correctly', () => {
      const publicRT =
        synthesized.resource.aws_route_table['prod-sec-public-rt'];

      expect(publicRT).toBeDefined();

      // Private route tables were removed with NAT Gateways
      expect(synthesized.resource.aws_route_table['prod-sec-private-rt-1']).toBeUndefined();
      expect(synthesized.resource.aws_route_table['prod-sec-private-rt-2']).toBeUndefined();

      // Check route table associations exist for public subnets only
      expect(
        synthesized.resource.aws_route_table_association[
          'prod-sec-public-rta-1'
        ]
      ).toBeDefined();
      expect(
        synthesized.resource.aws_route_table_association[
          'prod-sec-public-rta-2'
        ]
      ).toBeDefined();
      
      // Private subnet associations removed with NAT Gateways
      expect(
        synthesized.resource.aws_route_table_association[
          'prod-sec-private-rta-1'
        ]
      ).toBeUndefined();
      expect(
        synthesized.resource.aws_route_table_association[
          'prod-sec-private-rta-2'
        ]
      ).toBeUndefined();
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Web security group allows HTTPS and HTTP traffic', () => {
      const webSG = synthesized.resource.aws_security_group['prod-sec-web-sg'];

      expect(webSG).toBeDefined();
      expect(webSG.ingress).toHaveLength(2);

      const httpsIngress = webSG.ingress.find(
        (rule: any) => rule.from_port === 443
      );
      const httpIngress = webSG.ingress.find(
        (rule: any) => rule.from_port === 80
      );

      expect(httpsIngress).toBeDefined();
      expect(httpsIngress.to_port).toBe(443);
      expect(httpsIngress.protocol).toBe('tcp');
      expect(httpsIngress.cidr_blocks).toEqual(['0.0.0.0/0']);

      expect(httpIngress).toBeDefined();
      expect(httpIngress.to_port).toBe(80);
      expect(httpIngress.protocol).toBe('tcp');
      expect(httpIngress.cidr_blocks).toEqual(['0.0.0.0/0']);
    });

    test('Application security group allows traffic only from web tier', () => {
      const appSG = synthesized.resource.aws_security_group['prod-sec-app-sg'];

      expect(appSG).toBeDefined();
      expect(appSG.ingress).toHaveLength(1);

      const appIngress = appSG.ingress[0];
      expect(appIngress.from_port).toBe(8080);
      expect(appIngress.to_port).toBe(8080);
      expect(appIngress.protocol).toBe('tcp');
      expect(appIngress.security_groups).toEqual([
        '${aws_security_group.prod-sec-web-sg.id}',
      ]);
    });

    test('Database security group allows traffic only from app tier', () => {
      const dbSG = synthesized.resource.aws_security_group['prod-sec-db-sg'];

      expect(dbSG).toBeDefined();
      expect(dbSG.ingress).toHaveLength(1);

      const dbIngress = dbSG.ingress[0];
      expect(dbIngress.from_port).toBe(5432);
      expect(dbIngress.to_port).toBe(5432);
      expect(dbIngress.protocol).toBe('tcp');
      expect(dbIngress.security_groups).toEqual([
        '${aws_security_group.prod-sec-app-sg.id}',
      ]);
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('S3 buckets are created with unique naming', () => {
      const logsBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-logs-bucket'];
      const appDataBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-app-data-bucket'];

      expect(logsBucket).toBeDefined();
      expect(logsBucket.bucket).toMatch(/^prod-sec-logs-\$\{data\.aws_caller_identity\.current\.account_id\}-[a-z0-9]{6}$/);

      expect(appDataBucket).toBeDefined();
      expect(appDataBucket.bucket).toMatch(
        /^prod-sec-app-data-\$\{data\.aws_caller_identity\.current\.account_id\}-[a-z0-9]{6}$/
      );
    });

    test('S3 buckets have encryption configuration', () => {
      const logsEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'prod-sec-logs-bucket-encryption'
        ];
      const appDataEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'prod-sec-app-data-bucket-encryption'
        ];

      expect(logsEncryption).toBeDefined();
      expect(
        logsEncryption.rule[0].apply_server_side_encryption_by_default
          .sse_algorithm
      ).toBe('aws:kms');

      expect(appDataEncryption).toBeDefined();
      expect(
        appDataEncryption.rule[0].apply_server_side_encryption_by_default
          .sse_algorithm
      ).toBe('aws:kms');
    });

    test('S3 buckets have public access blocked', () => {
      const logsPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'prod-sec-logs-bucket-pab'
        ];
      const appDataPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'prod-sec-app-data-bucket-pab'
        ];

      expect(logsPAB).toBeDefined();
      expect(logsPAB.block_public_acls).toBe(true);
      expect(logsPAB.block_public_policy).toBe(true);
      expect(logsPAB.ignore_public_acls).toBe(true);
      expect(logsPAB.restrict_public_buckets).toBe(true);

      expect(appDataPAB).toBeDefined();
      expect(appDataPAB.block_public_acls).toBe(true);
      expect(appDataPAB.block_public_policy).toBe(true);
      expect(appDataPAB.ignore_public_acls).toBe(true);
      expect(appDataPAB.restrict_public_buckets).toBe(true);
    });

    test('S3 buckets have versioning enabled', () => {
      const logsVersioning =
        synthesized.resource.aws_s3_bucket_versioning[
          'prod-sec-logs-bucket-versioning'
        ];
      const appDataVersioning =
        synthesized.resource.aws_s3_bucket_versioning[
          'prod-sec-app-data-bucket-versioning'
        ];

      expect(logsVersioning).toBeDefined();
      expect(logsVersioning.versioning_configuration.status).toBe('Enabled');

      expect(appDataVersioning).toBeDefined();
      expect(appDataVersioning.versioning_configuration.status).toBe(
        'Enabled'
      );
    });
  });

  describe('IAM Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Password policy is configured with security requirements', () => {
      const passwordPolicy =
        synthesized.resource.aws_iam_account_password_policy[
          'prod-sec-password-policy'
        ];

      expect(passwordPolicy).toBeDefined();
      expect(passwordPolicy.minimum_password_length).toBe(14);
      expect(passwordPolicy.require_lowercase_characters).toBe(true);
      expect(passwordPolicy.require_numbers).toBe(true);
      expect(passwordPolicy.require_symbols).toBe(true);
      expect(passwordPolicy.require_uppercase_characters).toBe(true);
      expect(passwordPolicy.max_password_age).toBe(90);
      expect(passwordPolicy.password_reuse_prevention).toBe(12);
    });

    test('IAM policies are created with unique names', () => {
      const mfaPolicy =
        synthesized.resource.aws_iam_policy['prod-sec-mfa-enforcement-policy'];
      const ec2Policy =
        synthesized.resource.aws_iam_policy['prod-sec-ec2-readonly-policy'];
      const s3Policy =
        synthesized.resource.aws_iam_policy['prod-sec-s3-app-data-policy'];

      expect(mfaPolicy).toBeDefined();
      expect(mfaPolicy.name).toMatch(
        /^prod-sec-mfa-enforcement-policy-[a-z0-9]{6}$/
      );

      expect(ec2Policy).toBeDefined();
      expect(ec2Policy.name).toMatch(
        /^prod-sec-ec2-readonly-policy-[a-z0-9]{6}$/
      );

      expect(s3Policy).toBeDefined();
      expect(s3Policy.name).toMatch(
        /^prod-sec-s3-app-data-policy-[a-z0-9]{6}$/
      );
    });

    test('IAM roles are created with proper assume role policies', () => {
      const appRole = synthesized.resource.aws_iam_role['prod-sec-app-role'];

      expect(appRole).toBeDefined();
      expect(appRole.name).toMatch(/^prod-sec-app-role-[a-z0-9]{6}$/);
      const appRolePolicy = JSON.parse(appRole.assume_role_policy);
      expect(appRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );

      // CloudTrail role was removed due to AWS service limits
      expect(synthesized.resource.aws_iam_role['prod-sec-cloudtrail-role']).toBeUndefined();
    });

    test('IAM users are created with proper paths', () => {
      const devUser = synthesized.resource.aws_iam_user['prod-sec-dev-user'];
      const opsUser = synthesized.resource.aws_iam_user['prod-sec-ops-user'];

      expect(devUser).toBeDefined();
      expect(devUser.name).toMatch(/^prod-sec-dev-user-[a-z0-9]{6}$/);
      expect(devUser.path).toBe('/developers/');

      expect(opsUser).toBeDefined();
      expect(opsUser.name).toMatch(/^prod-sec-ops-user-[a-z0-9]{6}$/);
      expect(opsUser.path).toBe('/operations/');
    });
  });

  describe('CloudWatch and Monitoring', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('CloudWatch log groups are created with retention and encryption', () => {
      const appLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['prod-sec-app-logs'];
      const cloudtrailLogGroup =
        synthesized.resource.aws_cloudwatch_log_group[
          'prod-sec-cloudtrail-logs'
        ];
      const vpcLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['prod-sec-vpc-flow-logs'];

      expect(appLogGroup).toBeDefined();
      expect(appLogGroup.name).toMatch(
        /^\/aws\/ec2\/prod-sec-app-[a-z0-9]{6}$/
      );
      expect(appLogGroup.retention_in_days).toBe(90);
      expect(appLogGroup.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );

      expect(cloudtrailLogGroup).toBeDefined();
      expect(cloudtrailLogGroup.retention_in_days).toBe(365);

      expect(vpcLogGroup).toBeDefined();
      expect(vpcLogGroup.retention_in_days).toBe(30);
    });

    test('CloudWatch alarms are configured for security monitoring', () => {
      const rootAccessAlarm =
        synthesized.resource.aws_cloudwatch_metric_alarm[
          'prod-sec-root-access-alarm'
        ];
      const unauthorizedCallsAlarm =
        synthesized.resource.aws_cloudwatch_metric_alarm[
          'prod-sec-unauthorized-api-calls'
        ];

      expect(rootAccessAlarm).toBeDefined();
      expect(rootAccessAlarm.alarm_name).toBe('prod-sec-root-access-alarm');
      expect(rootAccessAlarm.comparison_operator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
      expect(rootAccessAlarm.threshold).toBe(1);

      expect(unauthorizedCallsAlarm).toBeDefined();
      expect(unauthorizedCallsAlarm.threshold).toBe(5);
    });

    test('SNS topic is created for alerts', () => {
      const alertsTopic =
        synthesized.resource.aws_sns_topic['prod-sec-security-alerts'];

      expect(alertsTopic).toBeDefined();
      expect(alertsTopic.name).toMatch(
        /^prod-sec-security-alerts-[a-z0-9]{6}$/
      );
    });
  });

  describe('CloudTrail', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('CloudTrail was removed to avoid AWS service limits', () => {
      // CloudTrail was removed due to AWS service limits (5 trails per region)
      expect(synthesized.resource.aws_cloudtrail).toBeUndefined();
    });
  });

  describe('Secrets Manager and SSM', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Secrets Manager secret is created with KMS encryption', () => {
      const dbSecret =
        synthesized.resource.aws_secretsmanager_secret[
          'prod-sec-db-credentials'
        ];

      expect(dbSecret).toBeDefined();
      expect(dbSecret.name).toMatch(
        /^prod-sec\/database\/credentials-[a-z0-9]{6}$/
      );
      expect(dbSecret.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );
    });

    test('SSM parameter is created with encryption', () => {
      const appConfig =
        synthesized.resource.aws_ssm_parameter['prod-sec-app-config'];

      expect(appConfig).toBeDefined();
      expect(appConfig.name).toMatch(/^\/prod-sec\/app\/config-[a-z0-9]{6}$/);
      expect(appConfig.type).toBe('SecureString');
      expect(appConfig.key_id).toBe('${aws_kms_key.prod-sec-main-kms-key.arn}');

      const configValue = JSON.parse(appConfig.value);
      expect(configValue.environment).toBe('production');
      expect(configValue.debug).toBe(false);
      expect(configValue.logLevel).toBe('INFO');
    });
  });

  describe('Terraform Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All required outputs are defined', () => {
      const outputs = synthesized.output;

      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id.description).toBe('VPC ID');

      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids.description).toBe('Public subnet IDs');

      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids.description).toBe('Private subnet IDs');

      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_id.description).toBe('Main KMS key ID');

      expect(outputs.security_group_ids).toBeDefined();
      expect(outputs.security_group_ids.description).toBe(
        'Security group IDs by tier'
      );

      // CloudTrail output removed with CloudTrail resource
      expect(outputs.cloudtrail_name).toBeUndefined();

      expect(outputs.logs_bucket_name).toBeDefined();
      expect(outputs.logs_bucket_name.description).toBe('Logs S3 bucket name');
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All resources have required tags', () => {
      const vpc = synthesized.resource.aws_vpc['prod-sec-vpc'];
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];

      expect(vpc.tags.Environment).toBe('Production');
      expect(vpc.tags.Project).toBe('IaC-AWS-Nova-Model-Breaking');
      expect(vpc.tags.ManagedBy).toBe('CDKTF');
      expect(vpc.tags.SecurityLevel).toBe('High');

      expect(kmsKey.tags.Environment).toBe('Production');
      expect(kmsKey.tags.Project).toBe('IaC-AWS-Nova-Model-Breaking');
      expect(kmsKey.tags.ManagedBy).toBe('CDKTF');
      expect(kmsKey.tags.SecurityLevel).toBe('High');
    });
  });

  describe('Unique Suffix Generation', () => {
    test('Each stack instance generates different unique suffix', () => {
      const stack1 = new TapStack(app, 'TestStack1');
      const stack2 = new TapStack(app, 'TestStack2');

      const synthesized1 = JSON.parse(Testing.synth(stack1));
      const synthesized2 = JSON.parse(Testing.synth(stack2));

      const kmsAlias1 =
        synthesized1.resource.aws_kms_alias['prod-sec-main-kms-alias'];
      const kmsAlias2 =
        synthesized2.resource.aws_kms_alias['prod-sec-main-kms-alias'];

      expect(kmsAlias1.name).not.toBe(kmsAlias2.name);
      expect(kmsAlias1.name).toMatch(/^alias\/prod-sec-main-key-[a-z0-9]{6}$/);
      expect(kmsAlias2.name).toMatch(/^alias\/prod-sec-main-key-[a-z0-9]{6}$/);
    });
  });
});
