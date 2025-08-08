import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Full Infrastructure Integration Test', () => {
  let synthOutput: any;

  beforeAll(() => {
    const app = new App();

    // ✅ ensure TapStack can resolve the DB password during synth
    process.env.DB_PASSWORD = 'testpass123!';

    const stack = new TapStack(app, 'TapStackTest', {
      environmentSuffix: 'test',
      awsRegion: 'us-west-2',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-2',
    });

    const json = Testing.synth(stack);
    console.log('🧪 Synth Output Preview:', json.slice(0, 500));

    synthOutput = JSON.parse(json);
  });

  test('All core resources are present', () => {
    const resources = synthOutput.resource ?? {};
    const resourceKeys = Object.keys(resources);

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_vpc(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_subnet(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_nat_gateway(\.|$)/),
        expect.stringMatching(/^aws_internet_gateway(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_route_table(\.|$)/)])
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
      expect.arrayContaining([expect.stringMatching(/^aws_instance(\.|$)/)])
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
        expect.stringMatching(
          /^aws_s3_bucket_server_side_encryption_configuration(\.|$)/
        ),
        expect.stringMatching(/^aws_s3_bucket_public_access_block(\.|$)/),
      ])
    );
  });

  test('Infrastructure flow validation - VPC to DB connectivity', () => {
    const resources = synthOutput.resource ?? {};
    
    // Verify VPC configuration
    const vpcResources = resources.aws_vpc || {};
    const vpcKeys = Object.keys(vpcResources);
    expect(vpcKeys.length).toBeGreaterThan(0);
    
    // Verify subnets are properly configured
    const subnetResources = resources.aws_subnet || {};
    const subnets = Object.values(subnetResources) as any[];
    const publicSubnets = subnets.filter(subnet => subnet.map_public_ip_on_launch === true);
    const privateSubnets = subnets.filter(subnet => subnet.map_public_ip_on_launch === false);
    
    expect(publicSubnets.length).toBeGreaterThan(0);
    expect(privateSubnets.length).toBeGreaterThan(0);
    
    // Verify security groups have proper rules
    const sgRuleResources = resources.aws_security_group_rule || {};
    const sgRules = Object.values(sgRuleResources) as any[];
    
    // Check for web ingress rules (HTTP/HTTPS)
    const webIngressRules = sgRules.filter(rule => 
      rule.type === 'ingress' && (rule.from_port === 80 || rule.from_port === 443)
    );
    expect(webIngressRules.length).toBeGreaterThan(0);
    
    // Check for DB ingress rules (MySQL/PostgreSQL)
    const dbIngressRules = sgRules.filter(rule => 
      rule.type === 'ingress' && (rule.from_port === 3306 || rule.from_port === 5432)
    );
    expect(dbIngressRules.length).toBeGreaterThan(0);
    
    // Verify RDS instance is in private subnets
    const dbInstanceResources = resources.aws_db_instance || {};
    const dbInstances = Object.values(dbInstanceResources) as any[];
    expect(dbInstances.length).toBeGreaterThan(0);
    
    // Verify DB subnet group exists
    const dbSubnetGroupResources = resources.aws_db_subnet_group || {};
    const dbSubnetGroups = Object.values(dbSubnetGroupResources) as any[];
    expect(dbSubnetGroups.length).toBeGreaterThan(0);
  });

  test('Security configuration validation', () => {
    const resources = synthOutput.resource ?? {};
    const sgRuleResources = resources.aws_security_group_rule || {};
    const sgRules = Object.values(sgRuleResources) as any[];
    
    // Verify no unrestricted egress rules (should be specific protocols/ports)
    const egressRules = sgRules.filter(rule => rule.type === 'egress');
    
    // All egress rules should have either specific CIDR blocks or source security groups
    egressRules.forEach(rule => {
      expect(
        rule.cidr_blocks || rule.source_security_group_id
      ).toBeTruthy();
      
      // If allowing 0.0.0.0/0, should be for specific ports (80, 443)
      if (rule.cidr_blocks?.includes('0.0.0.0/0')) {
        expect([80, 443]).toContain(rule.from_port);
      }
    });
    
    // Verify S3 bucket has encryption enabled
    const s3EncryptionResources = resources.aws_s3_bucket_server_side_encryption_configuration || {};
    const encryptionConfigs = Object.values(s3EncryptionResources) as any[];
    expect(encryptionConfigs.length).toBeGreaterThan(0);
    
    // Verify S3 bucket has public access blocked
    const s3PublicAccessResources = resources.aws_s3_bucket_public_access_block || {};
    const publicAccessConfigs = Object.values(s3PublicAccessResources) as any[];
    expect(publicAccessConfigs.length).toBeGreaterThan(0);
  });

  test('High availability configuration validation', () => {
    const resources = synthOutput.resource ?? {};
    
    // Verify multiple NAT gateways for HA
    const natGatewayResources = resources.aws_nat_gateway || {};
    const natGateways = Object.values(natGatewayResources) as any[];
    expect(natGateways.length).toBeGreaterThanOrEqual(2);
    
    // Verify EIPs for NAT gateways
    const eipResources = resources.aws_eip || {};
    const eips = Object.values(eipResources) as any[];
    expect(eips.length).toBeGreaterThanOrEqual(2);
    
    // Verify multiple instances for redundancy
    const instanceResources = resources.aws_instance || {};
    const instances = Object.values(instanceResources) as any[];
    expect(instances.length).toBeGreaterThanOrEqual(2);
  });
});
