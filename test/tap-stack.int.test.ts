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

describe('MultiRegionSecurityStack Integration Tests', () => {
  let synthesized: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new MultiRegionSecurityStack(
      app,
      'integration-test-stack',
      MOCK_STACK_CONFIG
    );
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized);
    resources = parsed.resource;
  });

  it('should create a KMS key for each region', () => {
    const kmsKeys = Object.values(resources.aws_kms_key) as any[];
    expect(kmsKeys.length).toBe(MOCK_STACK_CONFIG.regions.length);

    const keyInEast = kmsKeys.find(k => k.tags.Region === 'us-east-1');
    const keyInWest = kmsKeys.find(k => k.tags.Region === 'us-west-2');

    expect(keyInEast).toBeDefined();
    expect(keyInWest).toBeDefined();
  });

  it('should configure RDS instances with a regional KMS key', () => {
    const rdsInstances = Object.values(resources.aws_db_instance) as any[];
    const kmsKeyLogicalIds = Object.keys(resources.aws_kms_key);

    expect(rdsInstances.length).toBe(MOCK_STACK_CONFIG.regions.length);

    const rdsEast = rdsInstances.find(db =>
      db.identifier.includes('us-east-1')
    );
    const kmsEastLogicalId = kmsKeyLogicalIds.find(id =>
      id.includes('us-east-1')
    );
    expect(rdsEast.kms_key_id).toBe(`\${aws_kms_key.${kmsEastLogicalId}.arn}`);
  });

  it('should create the correct number of networking resources', () => {
    const regionCount = MOCK_STACK_CONFIG.regions.length;
    expect(Object.keys(resources.aws_vpc || {}).length).toBe(regionCount);
    expect(Object.keys(resources.aws_subnet || {}).length).toBe(
      regionCount * 4
    );
    expect(Object.keys(resources.aws_nat_gateway || {}).length).toBe(
      regionCount
    );
  });

  // FIX: New test to verify tagging consistency across multiple resource types.
  it('should apply common tags to all key regional resources', () => {
    const regionCount = MOCK_STACK_CONFIG.regions.length;
    const vpcs = Object.values(resources.aws_vpc) as any[];
    const subnets = Object.values(resources.aws_subnet) as any[];
    const dbs = Object.values(resources.aws_db_instance) as any[];

    const allResources = [...vpcs, ...subnets, ...dbs];

    expect(vpcs.length).toBe(regionCount);
    expect(dbs.length).toBe(regionCount);

    allResources.forEach(resource => {
      expect(resource.tags.Project).toBe(MOCK_STACK_CONFIG.commonTags.Project);
      expect(resource.tags.Owner).toBe(MOCK_STACK_CONFIG.commonTags.Owner);
      expect(resource.tags.Environment).toBe(
        MOCK_STACK_CONFIG.commonTags.Environment
      );
      expect(resource.tags.Region).toBeDefined();
    });
  });
});
