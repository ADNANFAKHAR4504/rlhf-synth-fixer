import { Testing } from 'cdktf';
import { MultiRegionSecurityStack, StackConfig } from '../lib/tap-stack';

const MOCK_STACK_CONFIG: StackConfig = {
  commonTags: {
    Project: 'TestProject',
    Owner: 'Test-Team',
    Environment: 'Test',
  },
  regions: [
    {
      region: 'us-east-1',
      vpcCidr: '10.1.0.0/16',
      publicSubnetCidr: '10.1.1.0/24',
      privateSubnetCidr: '10.1.2.0/24',
      dbSubnetACidr: '10.1.3.0/24',
      dbSubnetBCidr: '10.1.4.0/24',
      azA: 'us-east-1a',
      azB: 'us-east-1b',
    },
  ],
};

describe('MultiRegionSecurityStack Unit Tests', () => {
  let synthesized: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    // FIX: Corrected the typo in the class name.
    const stack = new MultiRegionSecurityStack(
      app,
      'unit-test-stack',
      MOCK_STACK_CONFIG
    );
    synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should encrypt the central S3 bucket with a customer-managed KMS key', () => {
    const kmsKeyLogicalId = Object.keys(resources.aws_kms_key)[0];
    const encryption = Object.values(
      resources.aws_s3_bucket_server_side_encryption_configuration
    )[0] as any;
    const encryptionRule =
      encryption.rule[0].apply_server_side_encryption_by_default;

    expect(encryptionRule.sse_algorithm).toBe('aws:kms');
    expect(encryptionRule.kms_master_key_id).toBe(
      `\${aws_kms_key.${kmsKeyLogicalId}.id}`
    );
  });

  it('should have an S3 policy that enforces encryption in transit', () => {
    const policy = JSON.parse(
      (Object.values(resources.aws_s3_bucket_policy)[0] as any).policy
    );
    const denyStatement = policy.Statement.find(
      (s: any) => s.Sid === 'DenyInsecureTransport'
    );

    expect(denyStatement).toBeDefined();
    expect(denyStatement.Effect).toBe('Deny');
    expect(denyStatement.Principal).toBe('*');
    expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
  });

  it('should create an encrypted RDS instance using a customer-managed KMS key', () => {
    const rdsInstances = Object.values(resources.aws_db_instance) as any[];
    const kmsKeys = Object.values(resources.aws_kms_key) as any[];
    const kmsKeyLogicalId = Object.keys(resources.aws_kms_key)[0];

    expect(rdsInstances.length).toBe(1);
    expect(kmsKeys.length).toBe(1);

    expect(rdsInstances[0].storage_encrypted).toBe(true);
    expect(rdsInstances[0].username).toBe('dbadmin');
    expect(rdsInstances[0].kms_key_id).toBe(
      `\${aws_kms_key.${kmsKeyLogicalId}.arn}`
    );
  });

  it('should create a least-privilege IAM role for app services', () => {
    const roles = Object.values(resources.aws_iam_role) as any[];
    const appServiceRole = roles.find(r =>
      r.name.includes('secure-core-app-service-role')
    );

    expect(appServiceRole).toBeDefined();
    const assumeRolePolicy = JSON.parse(appServiceRole.assume_role_policy);
    expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
      'ec2.amazonaws.com'
    );
  });

  it('should configure the DB security group to only allow traffic from the App SG', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const dbSg = securityGroups.find(sg => sg.name.includes('db-sg'));

    expect(dbSg.ingress.length).toBe(1);
    const ingressRule = dbSg.ingress[0];
    expect(ingressRule.from_port).toBe(5432);
    expect(ingressRule.protocol).toBe('tcp');
    expect(ingressRule.security_groups[0]).toContain(
      Object.keys(resources.aws_security_group).find(id => id.includes('AppSG'))
    );
  });

  it('should throw an error if us-east-1 provider is missing', () => {
    const invalidConfig: StackConfig = {
      ...MOCK_STACK_CONFIG,
      regions: [
        {
          region: 'us-west-2',
          vpcCidr: '10.2.0.0/16',
          publicSubnetCidr: '10.2.1.0/24',
          privateSubnetCidr: '10.2.2.0/24',
          dbSubnetACidr: '10.2.3.0/24',
          dbSubnetBCidr: '10.2.4.0/24',
          azA: 'us-west-2a',
          azB: 'us-west-2b',
        },
      ],
    };

    const app = Testing.app();
    expect(() => {
      new MultiRegionSecurityStack(app, 'error-stack', invalidConfig);
    }).toThrow(
      'A provider for the us-east-1 region is required for central resources.'
    );
  });
});
