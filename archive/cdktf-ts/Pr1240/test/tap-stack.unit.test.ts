import { Testing } from 'cdktf';
import { DualRegionHardenedStack, StackConfig } from '../lib/tap-stack';

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
      privateSubnetACidr: '10.1.1.0/24',
      privateSubnetBCidr: '10.1.2.0/24',
      azA: 'us-east-1a',
      azB: 'us-east-1b',
    },
  ],
};

describe('DualRegionHardenedStack Unit Tests', () => {
  let synthesized: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new DualRegionHardenedStack(
      app,
      'unit-test-stack',
      MOCK_STACK_CONFIG
    );
    synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should create VPC Endpoints for necessary services', () => {
    const endpoints = Object.values(resources.aws_vpc_endpoint) as any[];
    const s3Endpoint = endpoints.find(e => e.service_name.includes('s3'));
    const kmsEndpoint = endpoints.find(e => e.service_name.includes('kms'));

    expect(endpoints.length).toBeGreaterThan(4);
    // FIX: Verify Private DNS is handled correctly for Gateway vs Interface endpoints.
    expect(s3Endpoint.private_dns_enabled).not.toBe(true);
    expect(kmsEndpoint.private_dns_enabled).toBe(true);
  });

  it('should create a least-privilege IAM policy with no wildcard resources', () => {
    const policies = Object.values(resources.aws_iam_policy) as any[];
    const appPolicy = policies.find(p =>
      p.name.includes('hardened-app-service-policy')
    );
    const policyDocument = JSON.parse(appPolicy.policy);

    expect(appPolicy).toBeDefined();
    policyDocument.Statement.forEach((stmt: any) => {
      stmt.Resource.forEach((res: string) => {
        expect(res).not.toBe('*');
      });
    });
  });

  it('should create a KMS key with a restrictive key policy', () => {
    const kmsKey = Object.values(resources.aws_kms_key)[0] as any;
    const keyPolicy = JSON.parse(kmsKey.policy);

    const servicePrincipals = keyPolicy.Statement.map(
      (s: any) => s.Principal.Service
    ).filter(Boolean);
    const awsPrincipals = keyPolicy.Statement.map(
      (s: any) => s.Principal.AWS
    ).filter(Boolean);

    // FIX: Update test to expect 3 principals: root, app role, and the logs service.
    expect(awsPrincipals.length).toBe(2);
    expect(servicePrincipals.length).toBe(1);
    expect(servicePrincipals[0]).toBe('logs.us-east-1.amazonaws.com');
  });

  it('should create a CloudWatch Log Group with encryption and retention', () => {
    const logGroup = Object.values(
      resources.aws_cloudwatch_log_group
    )[0] as any;
    const kmsKeyLogicalId = Object.keys(resources.aws_kms_key)[0];

    expect(logGroup).toBeDefined();
    expect(logGroup.retention_in_days).toBe(30);
    expect(logGroup.kms_key_id).toBe(`\${aws_kms_key.${kmsKeyLogicalId}.arn}`);
  });

  it('should configure the DB security group to only allow traffic from the VPC', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const dbSg = securityGroups.find(sg => sg.name.includes('db-sg-'));
    const vpcLogicalId = Object.keys(resources.aws_vpc)[0];

    expect(dbSg.ingress.length).toBe(1);
    const ingressRule = dbSg.ingress[0];
    expect(ingressRule.from_port).toBe(5432);
    expect(ingressRule.protocol).toBe('tcp');
    expect(ingressRule.cidr_blocks[0]).toBe(
      `\${aws_vpc.${vpcLogicalId}.cidr_block}`
    );
  });

  it('should encrypt the database secret with the regional KMS key', () => {
    const secret = Object.values(resources.aws_secretsmanager_secret)[0] as any;
    const kmsKeyLogicalId = Object.keys(resources.aws_kms_key)[0];

    expect(secret.kms_key_id).toBe(`\${aws_kms_key.${kmsKeyLogicalId}.id}`);
  });

  it('should throw an error if us-east-1 provider is missing', () => {
    const invalidConfig: StackConfig = {
      ...MOCK_STACK_CONFIG,
      regions: [
        {
          region: 'us-west-2',
          vpcCidr: '10.2.0.0/16',
          privateSubnetACidr: '10.2.1.0/24',
          privateSubnetBCidr: '10.2.2.0/24',
          azA: 'us-west-2a',
          azB: 'us-west-2b',
        },
      ],
    };

    const app = Testing.app();
    expect(() => {
      new DualRegionHardenedStack(app, 'error-stack', invalidConfig);
    }).toThrow('A provider for the us-east-1 region is required.');
  });
});
