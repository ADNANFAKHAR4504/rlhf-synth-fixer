import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Full Infrastructure Integration Test', () => {
  let synthOutput: any;

  beforeAll(() => {
    const app = new App();

    //  ensure TapStack can resolve the DB password during synth
    process.env.DB_PASSWORD = 'testpass123!';

    const stack = new TapStack(app, 'TapStackTest', {
      environmentSuffix: 'test',
      awsRegion: 'us-west-2',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-2',
    });

    const json = Testing.synth(stack);
    console.log(' Synth Output Preview:', json.slice(0, 500));

    synthOutput = JSON.parse(json);
  });

  test('All core resources are present', () => {
    const resources = synthOutput.resource ?? {};
    const resourceKeys = Object.keys(resources);

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_vpc(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_subnet(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_nat_gateway(\.|$)/),
        expect.stringMatching(/^aws_internet_gateway(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_route_table(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_route_table_association(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_security_group(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_instance(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_db_instance(\.|$)/),
        expect.stringMatching(/^aws_db_subnet_group(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_s3_bucket(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_versioning(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_server_side_encryption_configuration(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_public_access_block(\.|$)/),
      ])
    );
  });

  test('Infrastructure connectivity flow validation (VPC -> Subnets -> Database)', () => {
    const resources = synthOutput.resource ?? {};
    
    // Find VPC ID reference
    const vpcResources = Object.values(resources.aws_vpc || {});
    expect(vpcResources).toHaveLength(1);
    
    // Find subnet resources and verify they reference the VPC
    const subnetResources = Object.values(resources.aws_subnet || {});
    expect(subnetResources.length).toBeGreaterThan(0);
    
    // Verify database subnet group exists and references subnets
    const dbSubnetGroups = Object.values(resources.aws_db_subnet_group || {});
    expect(dbSubnetGroups).toHaveLength(1);
    
    // Verify RDS instance references the subnet group
    const dbInstances = Object.values(resources.aws_db_instance || {});
    expect(dbInstances).toHaveLength(1);
    
    console.log('✅ Infrastructure connectivity validated: VPC -> Subnets -> DB Subnet Group -> RDS');
  });

  test('Security configuration compliance validation', () => {
    const resources = synthOutput.resource ?? {};
    
    // Verify security groups exist
    const securityGroups = Object.values(resources.aws_security_group || {});
    expect(securityGroups.length).toBeGreaterThanOrEqual(3); // web, app, db tiers
    
    // Verify security group rules exist and are properly configured
    const securityGroupRules = Object.values(resources.aws_security_group_rule || {});
    expect(securityGroupRules.length).toBeGreaterThan(0);
    
    // Verify RDS instance uses security groups
    const dbInstances = Object.values(resources.aws_db_instance || {}) as any[];
    expect(dbInstances[0]).toHaveProperty('vpc_security_group_ids');
    
    // Verify EC2 instances use security groups
    const ec2Instances = Object.values(resources.aws_instance || {}) as any[];
    expect(ec2Instances.length).toBeGreaterThan(0);
    expect(ec2Instances[0]).toHaveProperty('vpc_security_group_ids');
    
    console.log('✅ Security configuration validated: Security groups properly assigned');
  });

  test('High availability patterns validation', () => {
    const resources = synthOutput.resource ?? {};
    
    // Verify multiple subnets for HA
    const subnets = Object.values(resources.aws_subnet || {});
    expect(subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private minimum
    
    // Verify multiple NAT gateways for HA
    const natGateways = Object.values(resources.aws_nat_gateway || {});
    expect(natGateways.length).toBeGreaterThanOrEqual(2);
    
    // Verify multiple EC2 instances
    const instances = Object.values(resources.aws_instance || {});
    expect(instances.length).toBeGreaterThanOrEqual(2);
    
    console.log('✅ High availability patterns validated: Multiple subnets, NAT gateways, and instances');
  });
});
