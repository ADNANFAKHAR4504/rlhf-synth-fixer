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

describe('DualRegionHardenedStack Integration Tests', () => {
  let synthesized: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new DualRegionHardenedStack(
      app,
      'integration-test-stack',
      MOCK_STACK_CONFIG
    );
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized);
    resources = parsed.resource;
  });

  it('should not create any public-facing network resources', () => {
    expect(resources.aws_internet_gateway).toBeUndefined();
    expect(resources.aws_nat_gateway).toBeUndefined();
    expect(resources.aws_eip).toBeUndefined();
  });

  it('should create the correct number of resources across both regions', () => {
    const regionCount = MOCK_STACK_CONFIG.regions.length;

    expect(Object.keys(resources.aws_vpc || {}).length).toBe(regionCount);
    expect(Object.keys(resources.aws_subnet || {}).length).toBe(
      regionCount * 2
    );
    expect(Object.keys(resources.aws_kms_key || {}).length).toBe(regionCount);
    expect(Object.keys(resources.aws_db_instance || {}).length).toBe(
      regionCount
    );
    expect(Object.keys(resources.aws_vpc_endpoint || {}).length).toBe(
      regionCount * 6
    );
  });

  // ENHANCED: This test is now more comprehensive.
  it('should apply correct tags to all key resources', () => {
    const vpcs = Object.values(resources.aws_vpc) as any[];
    const subnets = Object.values(resources.aws_subnet) as any[];
    const dbs = Object.values(resources.aws_db_instance) as any[];
    const kmsKeys = Object.values(resources.aws_kms_key) as any[];
    const secrets = Object.values(resources.aws_secretsmanager_secret) as any[];

    const allTaggedResources = [
      ...vpcs,
      ...subnets,
      ...dbs,
      ...kmsKeys,
      ...secrets,
    ];

    allTaggedResources.forEach(resource => {
      expect(resource.tags.Project).toBe(MOCK_STACK_CONFIG.commonTags.Project);
      expect(resource.tags.Owner).toBe(MOCK_STACK_CONFIG.commonTags.Owner);
      expect(resource.tags.Environment).toBe(
        MOCK_STACK_CONFIG.commonTags.Environment
      );
      // Ensure a region-specific tag is present.
      expect(resource.tags.Region).toBeDefined();
    });

    // Spot check a specific region
    const vpcEast = vpcs.find(v => v.tags.Region === 'us-east-1');
    expect(vpcEast).toBeDefined();
  });
});
