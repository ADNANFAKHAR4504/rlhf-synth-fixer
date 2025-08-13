import { Testing } from 'cdktf';
import { MultiRegionSecurityStack } from '../lib/tap-stack';

describe('MultiRegionSecurityStack Integration Tests', () => {
  let synthesized: any;
  let resources: any;
  let dataSources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new MultiRegionSecurityStack(app, 'integration-test-stack');
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized);
    resources = parsed.resource;
    dataSources = parsed.data;
  });

  it('should create resources across 3 distinct regions', () => {
    const providers = JSON.parse(synthesized).provider.aws;
    // FIX: The expectation is now 3, as the duplicate provider has been removed.
    expect(providers.length).toBe(3);
    expect(providers.some((p: any) => p.alias === 'us-east-1')).toBe(true);
    expect(providers.some((p: any) => p.alias === 'us-west-2')).toBe(true);
    expect(providers.some((p: any) => p.alias === 'eu-central-1')).toBe(true);
  });

  it('should create the correct number of networking resources', () => {
    expect(Object.keys(resources.aws_vpc || {}).length).toBe(3);
    // 3 subnets per VPC = 9 total
    expect(Object.keys(resources.aws_subnet || {}).length).toBe(9);
    expect(Object.keys(resources.aws_nat_gateway || {}).length).toBe(3);
    expect(Object.keys(resources.aws_internet_gateway || {}).length).toBe(3);
  });

  it('should use a generated random password for the database', () => {
    const rdsInstances = Object.values(resources.aws_db_instance) as any[];
    const randomPasswords = resources.random_password;

    expect(dataSources).toBeUndefined();
    expect(Object.keys(randomPasswords || {}).length).toBe(3);

    const rdsEast = rdsInstances.find(db =>
      db.identifier.includes('us-east-1')
    );
    const randomPasswordEastLogicalId = Object.keys(randomPasswords).find(k =>
      k.includes('us-east-1')
    );

    expect(rdsEast.password).toBe(
      `\${random_password.${randomPasswordEastLogicalId}.result}`
    );
  });

  it('should ensure private and db subnets do not map public IPs', () => {
    const subnets = Object.values(resources.aws_subnet) as any[];
    const privateSubnets = subnets.filter(
      s =>
        s.tags.Name.startsWith('private-subnet-') ||
        s.tags.Name.startsWith('db-subnet-')
    );
    const publicSubnets = subnets.filter(s =>
      s.tags.Name.startsWith('public-subnet-')
    );

    expect(privateSubnets.length).toBe(6);
    expect(publicSubnets.length).toBe(3);

    privateSubnets.forEach(s => {
      expect(s.map_public_ip_on_launch).toBe(false);
    });

    publicSubnets.forEach(s => {
      expect(s.map_public_ip_on_launch).toBe(true);
    });
  });
});
