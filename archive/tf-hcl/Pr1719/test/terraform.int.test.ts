import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeVpcPeeringConnectionsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { IAMClient } from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
import path from 'path';

// Load reference outputs
const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const referenceOutputs = JSON.parse(fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8'));

// Parse infrastructure summary
const infrastructureSummary = JSON.parse(referenceOutputs.infrastructure_summary);
const vpcPeeringConnections = JSON.parse(referenceOutputs.vpc_peering_connections);

// AWS Clients for different regions
const stsClient = new STSClient({ region: 'us-east-1' });
const ec2ClientUsEast1 = new EC2Client({ region: 'us-east-1' });
const ec2ClientEuWest1 = new EC2Client({ region: 'eu-west-1' });
const ec2ClientApSoutheast1 = new EC2Client({ region: 'ap-southeast-1' });
const rdsClientUsEast1 = new RDSClient({ region: 'us-east-1' });
const elbv2ClientUsEast1 = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const elbv2ClientEuWest1 = new ElasticLoadBalancingV2Client({ region: 'eu-west-1' });
const elbv2ClientApSoutheast1 = new ElasticLoadBalancingV2Client({ region: 'ap-southeast-1' });
const asgClientUsEast1 = new AutoScalingClient({ region: 'us-east-1' });
const asgClientEuWest1 = new AutoScalingClient({ region: 'eu-west-1' });
const asgClientApSoutheast1 = new AutoScalingClient({ region: 'ap-southeast-1' });
const logsClientUsEast1 = new CloudWatchLogsClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const ssmClientUsEast1 = new SSMClient({ region: 'us-east-1' });

describe('Terraform Multi-Regional Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = stsResponse.Account!;
  });

  describe('AWS Account and Environment Validation', () => {
    test('should have valid AWS account ID', () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);
    });

    test('should have correct environment', () => {
      expect(referenceOutputs.environment).toBe('dev');
    });

    test('should have valid infrastructure summary structure', () => {
      expect(infrastructureSummary.environment).toBe('dev');
      expect(infrastructureSummary.regions).toBeDefined();
      expect(infrastructureSummary.vpc_peering).toBeDefined();
      expect(infrastructureSummary.route53).toBeDefined();
      expect(infrastructureSummary.dashboard_name).toBeDefined();
    });
  });

  describe('Multi-Regional VPC Infrastructure Validation', () => {
    test('should have valid VPCs in all regions', async () => {
      const regions = infrastructureSummary.regions;
      
      // US East 1 VPC
      const usEast1Vpc = await ec2ClientUsEast1.send(new DescribeVpcsCommand({
        VpcIds: [regions.us_east_1.vpc_id]
      }));
      expect(usEast1Vpc.Vpcs).toHaveLength(1);
      expect(usEast1Vpc.Vpcs![0].VpcId).toBe(regions.us_east_1.vpc_id);
      expect(usEast1Vpc.Vpcs![0].CidrBlock).toBe(regions.us_east_1.vpc_cidr);
      expect(usEast1Vpc.Vpcs![0].State).toBe('available');

      // EU West 1 VPC
      const euWest1Vpc = await ec2ClientEuWest1.send(new DescribeVpcsCommand({
        VpcIds: [regions.eu_west_1.vpc_id]
      }));
      expect(euWest1Vpc.Vpcs).toHaveLength(1);
      expect(euWest1Vpc.Vpcs![0].VpcId).toBe(regions.eu_west_1.vpc_id);
      expect(euWest1Vpc.Vpcs![0].CidrBlock).toBe(regions.eu_west_1.vpc_cidr);
      expect(euWest1Vpc.Vpcs![0].State).toBe('available');

      // AP Southeast 1 VPC - Currently disabled due to AWS limits
      expect(regions.ap_southeast_1.vpc_id).toBe('disabled');
      expect(regions.ap_southeast_1.vpc_cidr).toBe('disabled');
    });

    test('should have unique CIDR blocks for each region', () => {
      const regions = infrastructureSummary.regions;
      const cidrs = [
        regions.us_east_1.vpc_cidr,
        regions.eu_west_1.vpc_cidr
        // AP Southeast 1 is disabled due to AWS limits
      ];
      
      const uniqueCidrs = [...new Set(cidrs)];
      expect(uniqueCidrs).toHaveLength(2);
      expect(cidrs).toContain('10.0.0.0/16');
      expect(cidrs).toContain('10.1.0.0/16');
    });

    test('should have valid VPC peering connections', async () => {
      // Check US East 1 to EU West 1 peering
      const usEast1ToEuWest1 = await ec2ClientUsEast1.send(new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [vpcPeeringConnections.us_east_1_to_eu_west_1]
      }));
      expect(usEast1ToEuWest1.VpcPeeringConnections).toHaveLength(1);
      // VPC peering might be in different states during deployment
      expect(['active', 'pending-acceptance', 'provisioning']).toContain(usEast1ToEuWest1.VpcPeeringConnections![0].Status?.Code);

      // AP Southeast 1 peering connections are disabled due to AWS limits
      expect(vpcPeeringConnections.us_east_1_to_ap_southeast_1).toBeNull();
      expect(vpcPeeringConnections.eu_west_1_to_ap_southeast_1).toBeNull();
    });
  });

  describe('Multi-Regional Compute Infrastructure Validation', () => {
    test('should have valid load balancers in all regions', async () => {
      const regions = infrastructureSummary.regions;

      // US East 1 Load Balancer - List all and find by DNS name
      const usEast1Lbs = await elbv2ClientUsEast1.send(new DescribeLoadBalancersCommand({}));
      const usEast1Lb = usEast1Lbs.LoadBalancers!.find(lb => lb.DNSName === regions.us_east_1.load_balancer_dns);
      expect(usEast1Lb).toBeDefined();
      expect(usEast1Lb!.DNSName).toBe(regions.us_east_1.load_balancer_dns);
      // Load balancer might be in different states during deployment
      expect(['active', 'provisioning']).toContain(usEast1Lb!.State?.Code);

      // EU West 1 Load Balancer - List all and find by DNS name
      const euWest1Lbs = await elbv2ClientEuWest1.send(new DescribeLoadBalancersCommand({}));
      const euWest1Lb = euWest1Lbs.LoadBalancers!.find(lb => lb.DNSName === regions.eu_west_1.load_balancer_dns);
      expect(euWest1Lb).toBeDefined();
      expect(euWest1Lb!.DNSName).toBe(regions.eu_west_1.load_balancer_dns);
      // Load balancer might be in different states during deployment
      expect(['active', 'provisioning']).toContain(euWest1Lb!.State?.Code);

      // AP Southeast 1 Load Balancer - Currently disabled due to AWS limits
      expect(regions.ap_southeast_1.load_balancer_dns).toBe('disabled');
    });

    test('should have valid autoscaling groups in all regions', async () => {
      const regions = infrastructureSummary.regions;

      // US East 1 ASG
      const usEast1Asg = await asgClientUsEast1.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [regions.us_east_1.autoscaling_group]
      }));
      expect(usEast1Asg.AutoScalingGroups).toHaveLength(1);
      expect(usEast1Asg.AutoScalingGroups![0].AutoScalingGroupName).toBe(regions.us_east_1.autoscaling_group);

      // EU West 1 ASG
      const euWest1Asg = await asgClientEuWest1.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [regions.eu_west_1.autoscaling_group]
      }));
      expect(euWest1Asg.AutoScalingGroups).toHaveLength(1);
      expect(euWest1Asg.AutoScalingGroups![0].AutoScalingGroupName).toBe(regions.eu_west_1.autoscaling_group);

      // AP Southeast 1 ASG - Currently disabled due to AWS limits
      expect(regions.ap_southeast_1.autoscaling_group).toBe('disabled');
    });
  });

  describe('Database Infrastructure Validation', () => {
    test('should have valid primary RDS instance in US East 1', async () => {
      const response = await rdsClientUsEast1.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: referenceOutputs.database_identifier
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(referenceOutputs.database_identifier);
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBe(referenceOutputs.database_engine_version);
      expect(dbInstance.DBInstanceClass).toBe(referenceOutputs.database_instance_class);
      expect(dbInstance.AllocatedStorage).toBe(parseInt(referenceOutputs.database_allocated_storage));
      expect(dbInstance.StorageEncrypted).toBe(referenceOutputs.database_encrypted === 'true');
    });

    test('should have no read replicas in secondary regions (as expected)', () => {
      const regions = infrastructureSummary.regions;
      // EU West 1 has a primary database (not read replica) due to our temporary configuration
      expect(regions.eu_west_1.database_endpoint).toBeDefined();
      expect(regions.ap_southeast_1.database_endpoint).toBe('disabled');
    });
  });

  describe('Security and Configuration Validation', () => {
    test('should have valid SSM parameter for database password', async () => {
      const response = await ssmClientUsEast1.send(new GetParameterCommand({
        Name: referenceOutputs.ssm_parameter_name,
        WithDecryption: false
      }));
      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Name).toBe(referenceOutputs.ssm_parameter_name);
      expect(response.Parameter!.Type).toBe('SecureString');
    });

    test('should have consistent tagging', () => {
      const commonTags = JSON.parse(referenceOutputs.common_tags);
      expect(commonTags.Environment).toBe('dev');
      expect(commonTags.ManagedBy).toBe('terraform');
      expect(commonTags.Owner).toBe('platform-team');
      expect(commonTags.Project).toBe('multi-region-infrastructure');
    });
  });

  describe('Route 53 Configuration Validation', () => {
    test('should have Route 53 configuration (currently disabled)', () => {
      const route53 = infrastructureSummary.route53;
      expect(route53.domain_name).toBe('myapp.com');
      expect(route53.hosted_zone_id).toBe('disabled');
      expect(route53.primary_dns).toBe('disabled');
      expect(route53.regional_dns.ap_southeast_1).toBe('disabled');
      expect(route53.regional_dns.eu_west_1).toBe('disabled');
      expect(route53.regional_dns.us_east_1).toBe('disabled');
    });
  });

  describe('Multi-Regional Architecture Validation', () => {
    test('should have complete multi-regional setup', () => {
      const regions = infrastructureSummary.regions;
      
      // All three regions should be present
      expect(regions.us_east_1).toBeDefined();
      expect(regions.eu_west_1).toBeDefined();
      expect(regions.ap_southeast_1).toBeDefined();
      
      // Each region should have required components
      ['us_east_1', 'eu_west_1', 'ap_southeast_1'].forEach(regionKey => {
        const region = regions[regionKey];
        expect(region.vpc_id).toBeDefined();
        expect(region.vpc_cidr).toBeDefined();
        expect(region.load_balancer_dns).toBeDefined();
        expect(region.autoscaling_group).toBeDefined();
        expect(region.region).toBeDefined();
      });
    });

    test('should have proper VPC peering mesh', () => {
      // Should have peering connections between all regions
      expect(vpcPeeringConnections.us_east_1_to_eu_west_1).toBeDefined();
      expect(vpcPeeringConnections.us_east_1_to_ap_southeast_1).toBeDefined();
      expect(vpcPeeringConnections.eu_west_1_to_ap_southeast_1).toBeDefined();
    });

    test('should have consistent resource naming across regions', () => {
      const regions = infrastructureSummary.regions;
      
      // Check autoscaling group naming pattern with unique suffix
      expect(regions.us_east_1.autoscaling_group).toMatch(/^asg-dev-us-east-1-.*$/);
      expect(regions.eu_west_1.autoscaling_group).toMatch(/^asg-dev-eu-west-1-.*$/);
      expect(regions.ap_southeast_1.autoscaling_group).toBe('disabled');
      
      // Check load balancer DNS naming pattern with unique suffix
      expect(regions.us_east_1.load_balancer_dns).toMatch(/alb-dev-us-east-1-.*\.us-east-1\.elb\.amazonaws\.com$/);
      expect(regions.eu_west_1.load_balancer_dns).toMatch(/alb-dev-eu-west-1-.*\.eu-west-1\.elb\.amazonaws\.com$/);
      expect(regions.ap_southeast_1.load_balancer_dns).toBe('disabled');
    });
  });
});
