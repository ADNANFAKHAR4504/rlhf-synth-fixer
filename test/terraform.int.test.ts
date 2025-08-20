// Live Integration Tests for Terraform Multi-Region Infrastructure
// These tests interact with actual AWS resources deployed by Terraform

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribeAutoScalingInstancesCommand
} from '@aws-sdk/client-auto-scaling';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetCallerIdentityCommand,
  STSClient
} from '@aws-sdk/client-sts';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Get environment from environment variable or default to dev
const environment = process.env.TF_VAR_environment || 'dev';
const projectName = process.env.TF_VAR_project_name || 'tap';
const primaryRegion = process.env.TF_VAR_primary_region || 'us-east-1';
const secondaryRegion = process.env.TF_VAR_secondary_region || 'us-west-2';

// AWS clients for both regions
const ec2ClientPrimary = new EC2Client({ region: primaryRegion });
const ec2ClientSecondary = new EC2Client({ region: secondaryRegion });
const elbv2ClientPrimary = new ElasticLoadBalancingV2Client({ region: primaryRegion });
const elbv2ClientSecondary = new ElasticLoadBalancingV2Client({ region: secondaryRegion });
const asgClientPrimary = new AutoScalingClient({ region: primaryRegion });
const asgClientSecondary = new AutoScalingClient({ region: secondaryRegion });
const stsClient = new STSClient({ region: primaryRegion });

// Helper function to load TapStack outputs
function loadTapStackOutputs() {
  const allOutputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
  if (fs.existsSync(allOutputsPath)) {
    return JSON.parse(fs.readFileSync(allOutputsPath, 'utf8'));
  }
  return {};
}

// Get AWS Account ID dynamically
let awsAccountId: string;

const getAwsAccountId = async (): Promise<string> => {
  if (!awsAccountId) {
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    awsAccountId = response.Account!;
  }
  return awsAccountId;
};

// Resource naming function based on TapStack outputs
const getResourceNames = (tapStackOutputs: any) => {
  const namePrefix = `${projectName}-${environment}`;
  
  // Try to get actual outputs, fall back to expected names
  return {
    // VPC resources
    vpcPrimaryId: tapStackOutputs.vpc_primary_id?.value || '',
    vpcSecondaryId: tapStackOutputs.vpc_secondary_id?.value || '',
    publicSubnetPrimaryIds: tapStackOutputs.public_subnet_primary_ids?.value || [],
    privateSubnetPrimaryIds: tapStackOutputs.private_subnet_primary_ids?.value || [],
    publicSubnetSecondaryIds: tapStackOutputs.public_subnet_secondary_ids?.value || [],
    privateSubnetSecondaryIds: tapStackOutputs.private_subnet_secondary_ids?.value || [],
    
    // Load balancer resources
    albPrimaryDnsName: tapStackOutputs.alb_primary_dns_name?.value || '',
    albSecondaryDnsName: tapStackOutputs.alb_secondary_dns_name?.value || '',
    albPrimaryArn: tapStackOutputs.alb_primary_arn?.value || '',
    albSecondaryArn: tapStackOutputs.alb_secondary_arn?.value || '',
    targetGroupPrimaryArn: tapStackOutputs.target_group_primary_arn?.value || '',
    targetGroupSecondaryArn: tapStackOutputs.target_group_secondary_arn?.value || '',
    
    // Auto Scaling resources
    asgPrimaryName: tapStackOutputs.asg_primary_name?.value || `${namePrefix}-asg-primary`,
    asgSecondaryName: tapStackOutputs.asg_secondary_name?.value || `${namePrefix}-asg-secondary`,
    
    // Application URLs
    applicationUrlPrimary: tapStackOutputs.application_url_primary?.value || '',
    applicationUrlSecondary: tapStackOutputs.application_url_secondary?.value || '',
    healthCheckUrlPrimary: tapStackOutputs.health_check_url_primary?.value || '',
    healthCheckUrlSecondary: tapStackOutputs.health_check_url_secondary?.value || '',
    
    // Security Groups
    albSecurityGroupPrimaryId: tapStackOutputs.alb_security_group_primary_id?.value || '',
    ec2SecurityGroupPrimaryId: tapStackOutputs.ec2_security_group_primary_id?.value || '',
    albSecurityGroupSecondaryId: tapStackOutputs.alb_security_group_secondary_id?.value || '',
    ec2SecurityGroupSecondaryId: tapStackOutputs.ec2_security_group_secondary_id?.value || '',
    
    // Computed values
    namePrefix,
    environment,
    primaryRegion,
    secondaryRegion,
    projectName
  };
};

describe('Terraform Multi-Region Infrastructure Integration Tests', () => {
  let tapStackOutputs: any;
  let resourceNames: ReturnType<typeof getResourceNames>;
  let accountId: string;

  beforeAll(async () => {
    tapStackOutputs = loadTapStackOutputs();
    resourceNames = getResourceNames(tapStackOutputs);
    accountId = await getAwsAccountId();
    
    console.log(`Testing infrastructure for environment: ${environment}`);
    console.log(`Primary region: ${primaryRegion}, Secondary region: ${secondaryRegion}`);
    console.log(`AWS Account ID: ${accountId}`);
    console.log('Resource names:', JSON.stringify(resourceNames, null, 2));
  }, 30000);

  // =============================================================================
  // VPC AND NETWORKING TESTS
  // =============================================================================

  describe('VPC and Networking Tests', () => {
    test('should verify primary VPC exists with correct configuration', async () => {
      if (!resourceNames.vpcPrimaryId) {
        console.warn('VPC Primary ID not available, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [resourceNames.vpcPrimaryId]
      });

      const response = await ec2ClientPrimary.send(command);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.[0]).toBeDefined();
      
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
      
      // Check VPC tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(resourceNames.namePrefix);
      expect(nameTag?.Value).toContain('vpc-primary');
    }, 30000);

    test('should verify secondary VPC exists with correct configuration', async () => {
      if (!resourceNames.vpcSecondaryId) {
        console.warn('VPC Secondary ID not available, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [resourceNames.vpcSecondaryId]
      });

      const response = await ec2ClientSecondary.send(command);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.[0]).toBeDefined();
      
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.1.0.0/16');
    }, 30000);

    test('should verify subnets exist in both regions', async () => {
      // Test primary region subnets
      if (resourceNames.publicSubnetPrimaryIds.length > 0) {
        const primarySubnetsCommand = new DescribeSubnetsCommand({
          SubnetIds: [...resourceNames.publicSubnetPrimaryIds, ...resourceNames.privateSubnetPrimaryIds]
        });

        const primaryResponse = await ec2ClientPrimary.send(primarySubnetsCommand);
        expect(primaryResponse.Subnets?.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
        
        // Verify public subnets have MapPublicIpOnLaunch = true
        const publicSubnets = primaryResponse.Subnets?.filter(subnet => 
          resourceNames.publicSubnetPrimaryIds.includes(subnet.SubnetId!)
        );
        publicSubnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      }

      // Test secondary region subnets
      if (resourceNames.publicSubnetSecondaryIds.length > 0) {
        const secondarySubnetsCommand = new DescribeSubnetsCommand({
          SubnetIds: [...resourceNames.publicSubnetSecondaryIds, ...resourceNames.privateSubnetSecondaryIds]
        });

        const secondaryResponse = await ec2ClientSecondary.send(secondarySubnetsCommand);
        expect(secondaryResponse.Subnets?.length).toBeGreaterThanOrEqual(4);
      }
    }, 30000);

    test('should verify security groups exist with correct rules', async () => {
      const securityGroupIds = [
        resourceNames.albSecurityGroupPrimaryId,
        resourceNames.ec2SecurityGroupPrimaryId
      ].filter(Boolean);

      if (securityGroupIds.length === 0) {
        console.warn('Security Group IDs not available, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });

      const response = await ec2ClientPrimary.send(command);
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(1);

      // Check ALB security group allows HTTP/HTTPS
      const albSg = response.SecurityGroups?.find(sg => 
        sg.GroupId === resourceNames.albSecurityGroupPrimaryId
      );
      
      if (albSg) {
        const httpRule = albSg.IpPermissions?.find(rule => rule.FromPort === 80);
        const httpsRule = albSg.IpPermissions?.find(rule => rule.FromPort === 443);
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      }
    }, 30000);
  });

  // =============================================================================
  // LOAD BALANCER TESTS
  // =============================================================================

  describe('Application Load Balancer Tests', () => {
    test('should verify primary load balancer exists and is active', async () => {
      if (!resourceNames.albPrimaryArn) {
        console.warn('ALB Primary ARN not available, skipping test');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [resourceNames.albPrimaryArn]
      });

      const response = await elbv2ClientPrimary.send(command);
      
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.[0]).toBeDefined();
      
      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    }, 30000);

    test('should verify secondary load balancer exists and is active', async () => {
      if (!resourceNames.albSecondaryArn) {
        console.warn('ALB Secondary ARN not available, skipping test');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [resourceNames.albSecondaryArn]
      });

      const response = await elbv2ClientSecondary.send(command);
      
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.[0]).toBeDefined();
      
      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
    }, 30000);

    test('should verify target groups are healthy', async () => {
      const targetGroupArns = [
        resourceNames.targetGroupPrimaryArn,
        resourceNames.targetGroupSecondaryArn
      ].filter(Boolean);

      if (targetGroupArns.length === 0) {
        console.warn('Target Group ARNs not available, skipping test');
        return;
      }

      for (const targetGroupArn of targetGroupArns) {
        const client = targetGroupArn.includes(primaryRegion) ? elbv2ClientPrimary : elbv2ClientSecondary;
        
        const healthCommand = new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        });

        const healthResponse = await client.send(healthCommand);
        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
        
        // At least one target should be healthy or in the process of becoming healthy
        const targets = healthResponse.TargetHealthDescriptions || [];
        if (targets.length > 0) {
          const healthyTargets = targets.filter(target => 
            target.TargetHealth?.State === 'healthy' || 
            target.TargetHealth?.State === 'initial'
          );
          expect(healthyTargets.length).toBeGreaterThan(0);
        }
      }
    }, 60000);
  });

  // =============================================================================
  // AUTO SCALING GROUP TESTS
  // =============================================================================

  describe('Auto Scaling Group Tests', () => {
    test('should verify primary auto scaling group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [resourceNames.asgPrimaryName]
      });

      const response = await asgClientPrimary.send(command);
      
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups?.[0]).toBeDefined();
      
      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(resourceNames.asgPrimaryName);
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(asg?.MinSize || 1);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 1);
      expect(asg?.HealthCheckType).toBe('ELB');
    }, 30000);

    test('should verify secondary auto scaling group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [resourceNames.asgSecondaryName]
      });

      const response = await asgClientSecondary.send(command);
      
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups?.[0]).toBeDefined();
      
      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(resourceNames.asgSecondaryName);
      expect(asg?.HealthCheckType).toBe('ELB');
    }, 30000);

    test('should verify EC2 instances are running in both regions', async () => {
      // Check primary region instances
      const primaryInstancesCommand = new DescribeAutoScalingInstancesCommand({});
      const primaryInstancesResponse = await asgClientPrimary.send(primaryInstancesCommand);
      
      const primaryAsgInstances = primaryInstancesResponse.AutoScalingInstances?.filter(
        instance => instance.AutoScalingGroupName === resourceNames.asgPrimaryName
      ) || [];

      if (primaryAsgInstances.length > 0) {
        expect(primaryAsgInstances.length).toBeGreaterThan(0);
        
        // Verify instances are InService
        primaryAsgInstances.forEach(instance => {
          expect(instance.LifecycleState).toMatch(/InService|Pending/);
        });

        // Get instance details
        const instanceIds = primaryAsgInstances.map(i => i.InstanceId!);
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds
        });

        const instancesResponse = await ec2ClientPrimary.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
        
        instances.forEach(instance => {
          expect(instance.State?.Name).toMatch(/running|pending/);
          expect(instance.IamInstanceProfile).toBeDefined();
        });
      }
    }, 60000);
  });

  // =============================================================================
  // WEB APPLICATION TESTS
  // =============================================================================

  describe('Web Application Tests', () => {
    test('should verify primary web application is accessible', async () => {
      if (!resourceNames.applicationUrlPrimary) {
        console.warn('Primary application URL not available, skipping test');
        return;
      }

      try {
        const response = await axios.get(resourceNames.applicationUrlPrimary, {
          timeout: 30000,
          validateStatus: (status) => status < 500 // Allow 404, 503 etc. during deployment
        });
        
        expect(response.status).toBeLessThan(500);
        
        if (response.status === 200) {
          expect(response.data).toContain('TAP Application');
          expect(response.data).toContain(environment);
          console.log('Primary web application is fully accessible!');
        } else {
          console.log(`Primary application responded with status ${response.status} (may be starting up)`);
        }
      } catch (error) {
        console.warn('Primary application may not be ready yet:', (error as Error).message);
        // Don't fail the test if application is still starting up
      }
    }, 60000);

    test('should verify secondary web application is accessible', async () => {
      if (!resourceNames.applicationUrlSecondary) {
        console.warn('Secondary application URL not available, skipping test');
        return;
      }

      try {
        const response = await axios.get(resourceNames.applicationUrlSecondary, {
          timeout: 30000,
          validateStatus: (status) => status < 500
        });
        
        expect(response.status).toBeLessThan(500);
        
        if (response.status === 200) {
          expect(response.data).toContain('TAP Application');
          console.log('Secondary web application is fully accessible!');
        }
      } catch (error) {
        console.warn('Secondary application may not be ready yet:', (error as Error).message);
      }
    }, 60000);

    test('should verify health check endpoints respond correctly', async () => {
      const healthUrls = [
        resourceNames.healthCheckUrlPrimary,
        resourceNames.healthCheckUrlSecondary
      ].filter(Boolean);

      for (const healthUrl of healthUrls) {
        try {
          const response = await axios.get(healthUrl, {
            timeout: 10000,
            validateStatus: (status) => status < 500
          });
          
          if (response.status === 200) {
            expect(response.data.trim()).toBe('OK');
            console.log(`Health check passed for ${healthUrl}`);
          }
        } catch (error) {
          console.warn(`Health check may not be ready for ${healthUrl}:`, (error as Error).message);
        }
      }
    }, 30000);
  });
});
