import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Mock environment variables for testing
const mockEnv = {
  API_GATEWAY_ENDPOINT:
    process.env.API_GATEWAY_ENDPOINT ||
    'https://mock-api.execute-api.us-east-1.amazonaws.com/prod',
  READ_ONLY_API_KEY: process.env.READ_ONLY_API_KEY || 'mock-read-only-api-key',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'mock-admin-api-key',
};

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeAll(() => {
    // Set longer timeout for integration tests
    jest.setTimeout(30000);
  });

  beforeEach(() => {
    app = new App();
    jest.clearAllMocks();
  });

  describe('Infrastructure Synthesis Integration', () => {
    test('Stack synthesizes without errors with default configuration', () => {
      stack = new TapStack(app, 'IntegrationTestStack');

      expect(() => {
        synthesized = JSON.parse(Testing.synth(stack));
      }).not.toThrow();

      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('object');
    });

    test('Stack synthesizes without errors with custom configuration', () => {
      stack = new TapStack(app, 'IntegrationTestStackCustom', {
        environmentSuffix: 'integration-test',
        stateBucket: 'custom-integration-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: {
          IntegrationTest: 'true',
          TestSuite: 'CDKTFIntegration',
        },
      });

      expect(() => {
        synthesized = JSON.parse(Testing.synth(stack));
      }).not.toThrow();

      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-east-1'); // Should still use default region from stack
    });

    test('Multiple stack instances can be synthesized simultaneously', () => {
      const stack1 = new TapStack(app, 'IntegrationTestStack1');
      const stack2 = new TapStack(app, 'IntegrationTestStack2');

      let synthesized1: any;
      let synthesized2: any;

      expect(() => {
        synthesized1 = JSON.parse(Testing.synth(stack1));
        synthesized2 = JSON.parse(Testing.synth(stack2));
      }).not.toThrow();

      expect(synthesized1).toBeDefined();
      expect(synthesized2).toBeDefined();

      // Verify that resources have different unique suffixes
      const alias1 =
        synthesized1.resource.aws_kms_alias['prod-sec-main-kms-alias'];
      const alias2 =
        synthesized2.resource.aws_kms_alias['prod-sec-main-kms-alias'];
      expect(alias1.name).not.toBe(alias2.name);
    });
  });

  describe('AWS Resource Dependencies Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'DependencyTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('KMS key dependencies are correctly established', () => {
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];
      const kmsAlias =
        synthesized.resource.aws_kms_alias['prod-sec-main-kms-alias'];
      const s3Encryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'prod-sec-logs-bucket-encryption'
        ];

      expect(kmsKey).toBeDefined();
      expect(kmsAlias.target_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.key_id}'
      );
      expect(
        s3Encryption.rule[0].apply_server_side_encryption_by_default
          .kms_master_key_id
      ).toBe('${aws_kms_key.prod-sec-main-kms-key.arn}');
    });

    test('VPC and subnet dependencies are correctly established', () => {
      const vpc = synthesized.resource.aws_vpc['prod-sec-vpc'];
      const publicSubnet1 =
        synthesized.resource.aws_subnet['prod-sec-public-subnet-1'];
      const privateSubnet1 =
        synthesized.resource.aws_subnet['prod-sec-private-subnet-1'];
      const igw = synthesized.resource.aws_internet_gateway['prod-sec-igw'];

      expect(vpc).toBeDefined();
      expect(publicSubnet1.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
      expect(privateSubnet1.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
      expect(igw.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
      
      // NAT Gateways were removed due to AWS service limits
      expect(synthesized.resource.aws_nat_gateway).toBeUndefined();
    });

    test('Security group dependencies are correctly established', () => {
      const webSG = synthesized.resource.aws_security_group['prod-sec-web-sg'];
      const appSG = synthesized.resource.aws_security_group['prod-sec-app-sg'];
      const dbSG = synthesized.resource.aws_security_group['prod-sec-db-sg'];

      expect(webSG.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
      expect(appSG.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');
      expect(dbSG.vpc_id).toBe('${aws_vpc.prod-sec-vpc.id}');

      // Check security group references
      expect(appSG.ingress[0].security_groups).toContain(
        '${aws_security_group.prod-sec-web-sg.id}'
      );
      expect(dbSG.ingress[0].security_groups).toContain(
        '${aws_security_group.prod-sec-app-sg.id}'
      );
    });

    test('S3 bucket and policy dependencies are correctly established', () => {
      const logsBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-logs-bucket'];
      const bucketEncryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'prod-sec-logs-bucket-encryption'
        ];
      const bucketVersioning =
        synthesized.resource.aws_s3_bucket_versioning[
          'prod-sec-logs-bucket-versioning'
        ];
      const bucketPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'prod-sec-logs-bucket-pab'
        ];

      expect(logsBucket).toBeDefined();
      expect(bucketEncryption.bucket).toBe(
        '${aws_s3_bucket.prod-sec-logs-bucket.id}'
      );
      expect(bucketVersioning.bucket).toBe(
        '${aws_s3_bucket.prod-sec-logs-bucket.id}'
      );
      expect(bucketPAB.bucket).toBe('${aws_s3_bucket.prod-sec-logs-bucket.id}');
      
      // S3 bucket policy was removed with CloudTrail
      expect(synthesized.resource.aws_s3_bucket_policy).toBeUndefined();
    });

    test('CloudTrail dependencies were removed due to AWS service limits', () => {
      // CloudTrail was removed due to AWS service limits (5 trails per region)
      expect(synthesized.resource.aws_cloudtrail).toBeUndefined();
      
      // Verify related resources still exist
      const logsBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-logs-bucket'];
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];

      expect(logsBucket).toBeDefined();
      expect(kmsKey).toBeDefined();
    });

    test('IAM role and policy dependencies are correctly established', () => {
      const appRole = synthesized.resource.aws_iam_role['prod-sec-app-role'];
      const s3Policy =
        synthesized.resource.aws_iam_policy['prod-sec-s3-app-data-policy'];
      const rolePolicyAttachment =
        synthesized.resource.aws_iam_role_policy_attachment[
          'prod-sec-app-role-s3-policy'
        ];

      expect(appRole).toBeDefined();
      expect(s3Policy).toBeDefined();
      expect(rolePolicyAttachment.role).toBe(
        '${aws_iam_role.prod-sec-app-role.name}'
      );
      expect(rolePolicyAttachment.policy_arn).toBe(
        '${aws_iam_policy.prod-sec-s3-app-data-policy.arn}'
      );
    });

    test('CloudWatch alarm and SNS topic dependencies are correctly established', () => {
      const rootAccessAlarm =
        synthesized.resource.aws_cloudwatch_metric_alarm[
          'prod-sec-root-access-alarm'
        ];
      const unauthorizedCallsAlarm =
        synthesized.resource.aws_cloudwatch_metric_alarm[
          'prod-sec-unauthorized-api-calls'
        ];
      const alertsTopic =
        synthesized.resource.aws_sns_topic['prod-sec-security-alerts'];

      expect(rootAccessAlarm.alarm_actions).toContain(
        '${aws_sns_topic.prod-sec-security-alerts.arn}'
      );
      expect(unauthorizedCallsAlarm.alarm_actions).toContain(
        '${aws_sns_topic.prod-sec-security-alerts.arn}'
      );
    });
  });

  describe('AWS Resource Configuration Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'ConfigValidationTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('KMS key policy contains all required permissions', () => {
      const kmsKey = synthesized.resource.aws_kms_key['prod-sec-main-kms-key'];
      const policy = JSON.parse(kmsKey.policy);

      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2); // CloudTrail statement removed

      const rootStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Enable IAM User Permissions'
      );
      const cloudwatchStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow CloudWatch Logs'
      );

      expect(rootStatement).toBeDefined();
      expect(cloudwatchStatement).toBeDefined();
      
      // CloudTrail statement removed with CloudTrail resource
      const cloudtrailStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow CloudTrail to encrypt logs'
      );
      expect(cloudtrailStatement).toBeUndefined();
    });

    test('S3 bucket policy was removed with CloudTrail', () => {
      // S3 bucket policy was removed along with CloudTrail due to service limits
      expect(synthesized.resource.aws_s3_bucket_policy).toBeUndefined();
      
      // Verify bucket still exists with proper security configurations
      const logsBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-logs-bucket'];
      const bucketPAB =
        synthesized.resource.aws_s3_bucket_public_access_block[
          'prod-sec-logs-bucket-pab'
        ];
      
      expect(logsBucket).toBeDefined();
      expect(bucketPAB).toBeDefined();
      expect(bucketPAB.block_public_acls).toBe(true);
    });

    test('IAM policies contain appropriate permissions', () => {
      const ec2Policy =
        synthesized.resource.aws_iam_policy['prod-sec-ec2-readonly-policy'];
      const s3Policy =
        synthesized.resource.aws_iam_policy['prod-sec-s3-app-data-policy'];

      const ec2PolicyDoc = JSON.parse(ec2Policy.policy);
      expect(ec2PolicyDoc.Statement[0].Effect).toBe('Allow');
      expect(ec2PolicyDoc.Statement[0].Action).toEqual([
        'ec2:Describe*',
        'ec2:Get*',
        'ec2:List*',
      ]);

      const s3PolicyDoc = JSON.parse(s3Policy.policy);
      expect(s3PolicyDoc.Statement).toHaveLength(3);
      expect(s3PolicyDoc.Statement[0].Action).toEqual([
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
      ]);
      expect(s3PolicyDoc.Statement[1].Action).toEqual(['s3:ListBucket']);
      expect(s3PolicyDoc.Statement[2].Action).toEqual([
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ]);
    });

    test('Security groups have appropriate ingress and egress rules', () => {
      const webSG = synthesized.resource.aws_security_group['prod-sec-web-sg'];
      const appSG = synthesized.resource.aws_security_group['prod-sec-app-sg'];
      const dbSG = synthesized.resource.aws_security_group['prod-sec-db-sg'];

      // Web SG should allow HTTPS and HTTP from internet
      expect(webSG.ingress).toHaveLength(2);
      expect(
        webSG.ingress.some(
          (rule: any) =>
            rule.from_port === 443 && rule.cidr_blocks.includes('0.0.0.0/0')
        )
      ).toBe(true);
      expect(
        webSG.ingress.some(
          (rule: any) =>
            rule.from_port === 80 && rule.cidr_blocks.includes('0.0.0.0/0')
        )
      ).toBe(true);

      // App SG should only allow from web SG
      expect(appSG.ingress).toHaveLength(1);
      expect(appSG.ingress[0].from_port).toBe(8080);
      expect(appSG.ingress[0].security_groups).toContain(
        '${aws_security_group.prod-sec-web-sg.id}'
      );

      // DB SG should only allow from app SG
      expect(dbSG.ingress).toHaveLength(1);
      expect(dbSG.ingress[0].from_port).toBe(5432);
      expect(dbSG.ingress[0].security_groups).toContain(
        '${aws_security_group.prod-sec-app-sg.id}'
      );
    });
  });

  describe('Resource Naming and Uniqueness Integration', () => {
    test('All resources with unique suffixes maintain consistency within stack', () => {
      stack = new TapStack(app, 'UniquenessTestStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Extract suffix from one resource to verify consistency
      const kmsAlias =
        synthesized.resource.aws_kms_alias['prod-sec-main-kms-alias'];
      const suffixMatch = kmsAlias.name.match(
        /alias\/prod-sec-main-key-([a-z0-9]{6})$/
      );
      expect(suffixMatch).not.toBeNull();

      const suffix = suffixMatch![1];

      // Verify other resources use the same suffix (CloudTrail removed)
      const appRole = synthesized.resource.aws_iam_role['prod-sec-app-role'];
      const dbSecret =
        synthesized.resource.aws_secretsmanager_secret[
          'prod-sec-db-credentials'
        ];

      expect(appRole.name).toBe(`prod-sec-app-role-${suffix}`);
      expect(dbSecret.name).toBe(`prod-sec/database/credentials-${suffix}`);
      
      // CloudTrail was removed due to AWS service limits
      expect(synthesized.resource.aws_cloudtrail).toBeUndefined();
    });

    test('S3 bucket names include account ID and unique suffix', () => {
      stack = new TapStack(app, 'S3NamingTestStack');
      synthesized = JSON.parse(Testing.synth(stack));

      const logsBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-logs-bucket'];
      const appDataBucket =
        synthesized.resource.aws_s3_bucket['prod-sec-app-data-bucket'];

      // Should reference account ID from data source
      expect(logsBucket.bucket).toContain(
        '${data.aws_caller_identity.current.account_id}'
      );
      expect(appDataBucket.bucket).toContain(
        '${data.aws_caller_identity.current.account_id}'
      );

      // Should have unique suffix pattern
      expect(logsBucket.bucket).toMatch(
        /prod-sec-logs-\$\{data\.aws_caller_identity\.current\.account_id\}-[a-z0-9]{6}/
      );
      expect(appDataBucket.bucket).toMatch(
        /prod-sec-app-data-\$\{data\.aws_caller_identity\.current\.account_id\}-[a-z0-9]{6}/
      );
    });
  });

  describe('Security and Compliance Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'SecurityTestStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('All S3 buckets have security configurations enabled', () => {
      const bucketsWithEncryption = [
        'prod-sec-logs-bucket-encryption',
        'prod-sec-app-data-bucket-encryption',
      ];

      const bucketsWithPAB = [
        'prod-sec-logs-bucket-pab',
        'prod-sec-app-data-bucket-pab',
      ];

      const bucketsWithVersioning = [
        'prod-sec-logs-bucket-versioning',
        'prod-sec-app-data-bucket-versioning',
      ];

      bucketsWithEncryption.forEach(bucketEncryption => {
        const encryption =
          synthesized.resource
            .aws_s3_bucket_server_side_encryption_configuration[
            bucketEncryption
          ];
        expect(encryption).toBeDefined();
        expect(
          encryption.rule[0].apply_server_side_encryption_by_default
            .sse_algorithm
        ).toBe('aws:kms');
      });

      bucketsWithPAB.forEach(bucketPAB => {
        const pab =
          synthesized.resource.aws_s3_bucket_public_access_block[bucketPAB];
        expect(pab).toBeDefined();
        expect(pab.block_public_acls).toBe(true);
        expect(pab.block_public_policy).toBe(true);
        expect(pab.ignore_public_acls).toBe(true);
        expect(pab.restrict_public_buckets).toBe(true);
      });

      bucketsWithVersioning.forEach(bucketVersioning => {
        const versioning =
          synthesized.resource.aws_s3_bucket_versioning[bucketVersioning];
        expect(versioning).toBeDefined();
        expect(versioning.versioning_configuration.status).toBe('Enabled');
      });
    });

    test('CloudWatch logs have appropriate retention and encryption', () => {
      const appLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['prod-sec-app-logs'];
      const cloudtrailLogGroup =
        synthesized.resource.aws_cloudwatch_log_group[
          'prod-sec-cloudtrail-logs'
        ];
      const vpcLogGroup =
        synthesized.resource.aws_cloudwatch_log_group['prod-sec-vpc-flow-logs'];

      expect(appLogGroup.retention_in_days).toBe(90);
      expect(appLogGroup.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );

      expect(cloudtrailLogGroup.retention_in_days).toBe(365);
      expect(cloudtrailLogGroup.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );

      expect(vpcLogGroup.retention_in_days).toBe(30);
      expect(vpcLogGroup.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );
    });

    test('IAM password policy meets security requirements', () => {
      const passwordPolicy =
        synthesized.resource.aws_iam_account_password_policy[
          'prod-sec-password-policy'
        ];

      expect(passwordPolicy.minimum_password_length).toBeGreaterThanOrEqual(14);
      expect(passwordPolicy.require_lowercase_characters).toBe(true);
      expect(passwordPolicy.require_numbers).toBe(true);
      expect(passwordPolicy.require_symbols).toBe(true);
      expect(passwordPolicy.require_uppercase_characters).toBe(true);
      expect(passwordPolicy.max_password_age).toBeLessThanOrEqual(90);
      expect(passwordPolicy.password_reuse_prevention).toBeGreaterThanOrEqual(
        12
      );
    });

    test('CloudTrail logging was removed due to AWS service limits', () => {
      // CloudTrail was removed due to AWS service limits (5 trails per region)
      expect(synthesized.resource.aws_cloudtrail).toBeUndefined();
      
      // Verify other security monitoring features remain
      const securityAlerts = synthesized.resource.aws_sns_topic['prod-sec-security-alerts'];
      const rootAccessAlarm = synthesized.resource.aws_cloudwatch_metric_alarm['prod-sec-root-access-alarm'];
      
      expect(securityAlerts).toBeDefined();
      expect(rootAccessAlarm).toBeDefined();
    });
  });

  describe('Terraform Configuration Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TerraformValidationStack');
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('Terraform configuration structure is valid', () => {
      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.provider).toBeDefined();
      expect(synthesized.resource).toBeDefined();
      expect(synthesized.data).toBeDefined();
      expect(synthesized.output).toBeDefined();
    });

    test('Data sources are properly configured', () => {
      const callerIdentity = synthesized.data.aws_caller_identity.current;
      const availabilityZones =
        synthesized.data.aws_availability_zones.available;

      expect(callerIdentity).toBeDefined();
      expect(availabilityZones).toBeDefined();
      expect(availabilityZones.state).toBe('available');
    });

    test('All outputs reference valid resources', () => {
      const outputs = synthesized.output;

      // Check that all output values reference actual resources
      expect(outputs.vpc_id.value).toBe('${aws_vpc.prod-sec-vpc.id}');
      expect(outputs.public_subnet_ids.value).toEqual([
        '${aws_subnet.prod-sec-public-subnet-1.id}',
        '${aws_subnet.prod-sec-public-subnet-2.id}',
      ]);
      expect(outputs.private_subnet_ids.value).toEqual([
        '${aws_subnet.prod-sec-private-subnet-1.id}',
        '${aws_subnet.prod-sec-private-subnet-2.id}',
      ]);
      expect(outputs.kms_key_id.value).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.key_id}'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Stack handles invalid props gracefully', () => {
      // Test with undefined props - should not throw
      expect(() => {
        stack = new TapStack(app, 'InvalidPropsStack', undefined);
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('Stack handles empty string props', () => {
      expect(() => {
        stack = new TapStack(app, 'EmptyPropsStack', {
          environmentSuffix: '',
          stateBucket: '',
          stateBucketRegion: '',
          awsRegion: '',
          defaultTags: {},
        });
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('Stack maintains resource count consistency', () => {
      stack = new TapStack(app, 'ResourceCountStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Count expected resource types
      const expectedResourceTypes = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_route_table',
        'aws_route',
        'aws_route_table_association',
        'aws_security_group',
        'aws_s3_bucket',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_logging',
        'aws_kms_key',
        'aws_kms_alias',
        'aws_iam_account_password_policy',
        'aws_iam_policy',
        'aws_iam_role',
        'aws_iam_role_policy_attachment',
        'aws_iam_user',
        'aws_iam_user_policy_attachment',
        'aws_secretsmanager_secret',
        'aws_ssm_parameter',
        'aws_cloudwatch_log_group',
        'aws_cloudwatch_metric_alarm',
        'aws_sns_topic',
        // Removed due to AWS service limits:
        // 'aws_cloudtrail',
        // 'aws_nat_gateway', 
        // 'aws_eip',
        // 'aws_s3_bucket_policy',
      ];

      expectedResourceTypes.forEach(resourceType => {
        expect(synthesized.resource[resourceType]).toBeDefined();
        expect(
          Object.keys(synthesized.resource[resourceType]).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Scale Integration', () => {
    test('Large scale synthesis completes within reasonable time', async () => {
      const startTime = Date.now();

      const stacks = [];
      for (let i = 0; i < 5; i++) {
        const testStack = new TapStack(app, `ScaleTestStack${i}`);
        stacks.push(testStack);
        Testing.synth(testStack);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for 5 stacks
      expect(duration).toBeLessThan(10000);
      expect(stacks).toHaveLength(5);
    });

    test('Memory usage remains reasonable during synthesis', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and synthesize multiple stacks
      for (let i = 0; i < 10; i++) {
        const testStack = new TapStack(app, `MemoryTestStack${i}`);
        Testing.synth(testStack);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Mock API Integration Tests', () => {
    // These tests would normally interact with real AWS APIs
    // For now, they test the structure that would be deployed

    test('Infrastructure supports API Gateway integration pattern', () => {
      stack = new TapStack(app, 'APIIntegrationStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Verify that security groups allow appropriate API access
      const appSG = synthesized.resource.aws_security_group['prod-sec-app-sg'];
      expect(
        appSG.egress.some(
          (rule: any) => rule.from_port === 443 && rule.protocol === 'tcp'
        )
      ).toBe(true);
    });

    test('Infrastructure supports monitoring and alerting patterns', () => {
      stack = new TapStack(app, 'MonitoringIntegrationStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Verify CloudWatch alarms are configured for API monitoring
      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
      expect(Object.keys(alarms)).toHaveLength(2);

      // Verify SNS topic for notifications
      const snsTopic =
        synthesized.resource.aws_sns_topic['prod-sec-security-alerts'];
      expect(snsTopic).toBeDefined();
    });

    test('Infrastructure supports secure data storage patterns', () => {
      stack = new TapStack(app, 'DataStorageIntegrationStack');
      synthesized = JSON.parse(Testing.synth(stack));

      // Verify encrypted storage is configured
      const dbSecret =
        synthesized.resource.aws_secretsmanager_secret[
          'prod-sec-db-credentials'
        ];
      const ssmParameter =
        synthesized.resource.aws_ssm_parameter['prod-sec-app-config'];

      expect(dbSecret.kms_key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );
      expect(ssmParameter.type).toBe('SecureString');
      expect(ssmParameter.key_id).toBe(
        '${aws_kms_key.prod-sec-main-kms-key.arn}'
      );
    });
  });
});
