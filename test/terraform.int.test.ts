import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types for outputs
interface StructuredOutputs {
  [key: string]: { value: any } | any;
}

interface WebAppInfrastructureOutputs {
  [key: string]: any;
}

// Helper function to load outputs
function loadOutputs(): WebAppInfrastructureOutputs {
  const allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (fs.existsSync(allOutputsPath)) {
    const data = JSON.parse(fs.readFileSync(allOutputsPath, 'utf8')) as StructuredOutputs;
    console.log('✓ Loaded outputs from all-outputs.json');

    const extractedOutputs: WebAppInfrastructureOutputs = {};
    for (const [key, valueObj] of Object.entries(data)) {
      if (valueObj && typeof valueObj === 'object' && 'value' in valueObj) {
        (extractedOutputs as any)[key] = valueObj.value;
      }
    }
    return extractedOutputs;
  }

  console.warn('No outputs file found. Expected: cfn-outputs/all-outputs.json');
  return {};
}

// Helper function to run Terraform commands
const runTerraformCommand = (command: string, cwd?: string): string => {
  try {
    return execSync(command, { 
      cwd: cwd || path.join(__dirname, '../lib'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${command}\n${error.message}`);
  }
};

// LocalStack configuration
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = endpoint.includes('localhost') || endpoint.includes('4566');

// AWS Clients with LocalStack support
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocalStack && {
    endpoint: endpoint,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  })
};

const ec2Client = new EC2Client(clientConfig);
const iamClient = new IAMClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);

// Get environment suffix from Terraform variables or environment
const getEnvironmentSuffix = (): string => {
  try {
    const varsFile = path.join(__dirname, '../lib/terraform.tfvars');
    if (fs.existsSync(varsFile)) {
      const content = fs.readFileSync(varsFile, 'utf8');
      const match = content.match(/environment_suffix\s*=\s*"([^"]+)"/);
      if (match) return match[1];
    }
  } catch (error) {
    // Fallback to environment variable or default
  }
  return process.env.ENVIRONMENT_SUFFIX || 'dev';
};

const environmentSuffix = getEnvironmentSuffix();

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: WebAppInfrastructureOutputs;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  describe('Terraform Operations', () => {
    test('should format check Terraform files', () => {
      expect(() => {
        runTerraformCommand('terraform fmt -check=true');
      }).not.toThrow();
    });

    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'dev_vpc_id',
        'staging_vpc_id', 
        'prod_vpc_id',
        'dev_instance_ids',
        'staging_instance_ids',
        'prod_instance_ids',
        'dev_security_group_id',
        'staging_security_group_id',
        'prod_security_group_id'
      ];

      expectedOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have created development VPC with correct configuration', async () => {
      const vpcId = outputs.dev_vpc_id;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are configured in Terraform but not returned by DescribeVpcs API

      // Check VPC tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(`dev-vpc-${environmentSuffix}`);
    });

    test('should have created staging VPC with correct configuration', async () => {
      const vpcId = outputs.staging_vpc_id;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      // DNS settings are configured in Terraform but not returned by DescribeVpcs API

      // Check VPC tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(`staging-vpc-${environmentSuffix}`);
    });

    test('should have created production VPC with correct configuration', async () => {
      const vpcId = outputs.prod_vpc_id;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.2.0.0/16');
      // DNS settings are configured in Terraform but not returned by DescribeVpcs API

      // Check VPC tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(`prod-vpc-${environmentSuffix}`);
    });

    test('VPCs should be isolated from each other', () => {
      const devVpcId = outputs.dev_vpc_id;
      const stagingVpcId = outputs.staging_vpc_id;
      const prodVpcId = outputs.prod_vpc_id;

      // Verify that VPC IDs are different
      expect(devVpcId).not.toBe(stagingVpcId);
      expect(stagingVpcId).not.toBe(prodVpcId);
      expect(devVpcId).not.toBe(prodVpcId);

      // Verify all VPC IDs are defined
      expect(devVpcId).toBeDefined();
      expect(stagingVpcId).toBeDefined();
      expect(prodVpcId).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should have created development instances with correct configuration', async () => {
      const instanceIds = outputs.dev_instance_ids;
      expect(instanceIds).toBeDefined();
      expect(Array.isArray(instanceIds)).toBe(true);
      expect(instanceIds.length).toBeGreaterThan(0);

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations?.length).toBeGreaterThan(0);
      
      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          expect(instance.State?.Name).toBe('running');
          expect(instance.InstanceType).toBe('t2.micro');
          expect(instance.VpcId).toBe(outputs.dev_vpc_id);
          
          // Check instance is in private subnet (no public IP)
          expect(instance.PublicIpAddress).toBeUndefined();
          
          // Check tags
          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toContain(`dev-webserver`);
          expect(nameTag?.Value).toContain(environmentSuffix);
        });
      });
    });

    test('should have created staging instances with correct configuration', async () => {
      const instanceIds = outputs.staging_instance_ids;
      expect(instanceIds).toBeDefined();
      expect(Array.isArray(instanceIds)).toBe(true);

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });
      const response = await ec2Client.send(command);

      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          expect(instance.State?.Name).toBe('running');
          expect(instance.InstanceType).toBe('t2.micro'); // Updated for LocalStack
          expect(instance.VpcId).toBe(outputs.staging_vpc_id);
          expect(instance.PublicIpAddress).toBeUndefined();

          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toContain(`staging-webserver`);
        });
      });
    });

    test('should have created production instances with correct configuration', async () => {
      const instanceIds = outputs.prod_instance_ids;
      expect(instanceIds).toBeDefined();
      expect(Array.isArray(instanceIds)).toBe(true);

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });
      const response = await ec2Client.send(command);

      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          expect(instance.State?.Name).toBe('running');
          expect(instance.InstanceType).toBe('t2.micro'); // Updated for LocalStack
          expect(instance.VpcId).toBe(outputs.prod_vpc_id);
          expect(instance.PublicIpAddress).toBeUndefined();

          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toContain(`prod-webserver`);
        });
      });
    });

    test('instances should be in private subnets with correct security groups', async () => {
      const allInstanceIds = [
        ...(outputs.dev_instance_ids || []),
        ...(outputs.staging_instance_ids || []),
        ...(outputs.prod_instance_ids || [])
      ];

      for (const instanceId of allInstanceIds) {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceId]
        });
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];
        
        // Instance should not have public IP
        expect(instance.PublicIpAddress).toBeUndefined();
        
        // Should have IAM instance profile
        expect(instance.IamInstanceProfile).toBeDefined();
        
        // Should have security groups
        expect(instance.SecurityGroups?.length).toBeGreaterThan(0);
        
        // Verify subnet is private
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: [instance.SubnetId!]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        const subnet = subnetResponse.Subnets![0];
        
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        
        // Check subnet name tag indicates it's private
        const subnetNameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(subnetNameTag?.Value).toContain('private-subnet');
      }
    });
  });

  describe('Network Security', () => {
    test('should have security groups with correct configuration', async () => {
      const securityGroupIds = [
        outputs.dev_security_group_id,
        outputs.staging_security_group_id,
        outputs.prod_security_group_id
      ];
      const environments = ['dev', 'staging', 'prod'];
      
      for (let i = 0; i < securityGroupIds.length; i++) {
        const env = environments[i];
        const sgId = securityGroupIds[i];
        expect(sgId).toBeDefined();

        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [sgId]
        });
        const response = await ec2Client.send(command);
        
        expect(response.SecurityGroups?.length).toBe(1);
        const sg = response.SecurityGroups![0];
        
        // Check security group has correct ingress rules
        const httpRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
        
        const httpsRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
        
        const sshRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        
        // SSH should be limited to VPC CIDR
        const expectedCidr = env === 'dev' ? '10.0.0.0/16' : 
                            env === 'staging' ? '10.1.0.0/16' : '10.2.0.0/16';
        expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe(expectedCidr);
      }
    });

    test('should have Network ACLs configured for cross-environment isolation', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id, 
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        // Each VPC should have at least one NACL (default + custom)
        expect(response.NetworkAcls?.length).toBeGreaterThanOrEqual(1);
        
        // Verify there are custom NACLs (not just default)
        const customNacls = response.NetworkAcls?.filter(nacl => 
          !nacl.IsDefault
        );
        expect(customNacls?.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have Flow Logs enabled for all VPCs', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [vpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        expect(response.FlowLogs?.length).toBeGreaterThanOrEqual(1);
        const flowLog = response.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
        expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      }
    });

    test('should have CloudWatch Log Groups for Flow Logs', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/vpc/flowlogs/${env}-${environmentSuffix}`
        });
        const response = await logsClient.send(command);
        
        expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);
        const logGroup = response.logGroups![0];
        expect(logGroup.retentionInDays).toBe(30); // Updated to match Terraform configuration
        expect(logGroup.logGroupName).toContain(`/aws/vpc/flowlogs/${env}-`);
      }
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 instance roles for each environment', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const command = new GetRoleCommand({
          RoleName: `${env}-ec2-role-${environmentSuffix}`
        });
        const response = await iamClient.send(command);
        
        expect(response.Role).toBeDefined();
        expect(response.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
        
        // Check instance profile exists
        const profileCommand = new GetInstanceProfileCommand({
          InstanceProfileName: `${env}-ec2-profile-${environmentSuffix}`
        });
        const profileResponse = await iamClient.send(profileCommand);
        expect(profileResponse.InstanceProfile).toBeDefined();
        expect(profileResponse.InstanceProfile?.Roles).toHaveLength(1);
        expect(profileResponse.InstanceProfile?.Roles![0].RoleName).toBe(`${env}-ec2-role-${environmentSuffix}`);
      }
    });

    test('should have VPC Flow Logs roles for each environment', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const command = new GetRoleCommand({
          RoleName: `${env}-flow-logs-role-${environmentSuffix}`
        });
        const response = await iamClient.send(command);
        
        expect(response.Role).toBeDefined();
        expect(response.Role?.AssumeRolePolicyDocument).toContain('vpc-flow-logs.amazonaws.com');
      }
    });
  });

  describe('Subnet Configuration', () => {
    test('should have public and private subnets in each VPC', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        expect(response.Subnets?.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
        
        const publicSubnets = response.Subnets?.filter(s => s.MapPublicIpOnLaunch === true);
        const privateSubnets = response.Subnets?.filter(s => s.MapPublicIpOnLaunch === false);
        
        expect(publicSubnets?.length).toBe(2); // Exactly 2 public subnets
        expect(privateSubnets?.length).toBe(2); // Exactly 2 private subnets
        
        // Check CIDR blocks are correctly distributed
        publicSubnets?.forEach(subnet => {
          const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toContain('public-subnet');
        });
        
        privateSubnets?.forEach(subnet => {
          const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
          expect(nameTag?.Value).toContain('private-subnet');
        });
      }
    });

    test('should have NAT Gateways for private subnet connectivity', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            },
            {
              Name: 'state',
              Values: ['available']
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        expect(response.NatGateways?.length).toBe(2); // Exactly 2 NAT gateways per VPC
        
        // Each NAT gateway should be in a public subnet
        response.NatGateways?.forEach(natGw => {
          expect(natGw.State).toBe('available');
          expect(natGw.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
        });
      }
    });

    test('should have Internet Gateways attached to each VPC', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        expect(response.InternetGateways?.length).toBe(1);
        const igw = response.InternetGateways![0];
        expect(igw.Attachments?.[0]?.State).toBe('available');
        expect(igw.Attachments?.[0]?.VpcId).toBe(vpcId);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on VPCs', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      const environments = ['dev', 'staging', 'prod'];

      for (let i = 0; i < vpcIds.length; i++) {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcIds[i]]
        });
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs![0];
        
        const tags = vpc.Tags || [];
        const nameTag = tags.find(t => t.Key === 'Name');
        const envTag = tags.find(t => t.Key === 'Environment');
        const ownerTag = tags.find(t => t.Key === 'Owner');
        const purposeTag = tags.find(t => t.Key === 'Purpose');
        
        expect(nameTag?.Value).toContain(`${environments[i]}-vpc-${environmentSuffix}`);
        expect(envTag?.Value).toBe(environments[i]);
        expect(ownerTag?.Value).toBe('DevOps Team');
        expect(purposeTag?.Value).toBe('Multi-Environment Infrastructure');
      }
    });

    test('should have proper tags on EC2 instances', async () => {
      const allInstanceIds = [
        ...(outputs.dev_instance_ids || []),
        ...(outputs.staging_instance_ids || []),
        ...(outputs.prod_instance_ids || [])
      ];

      const environmentMap = new Map([
        ['dev', outputs.dev_instance_ids || []],
        ['staging', outputs.staging_instance_ids || []],
        ['prod', outputs.prod_instance_ids || []]
      ]);

      for (const [env, instanceIds] of environmentMap) {
        for (const instanceId of instanceIds) {
          const command = new DescribeInstancesCommand({
            InstanceIds: [instanceId]
          });
          const response = await ec2Client.send(command);
          const instance = response.Reservations![0].Instances![0];
          
          const tags = instance.Tags || [];
          const nameTag = tags.find(t => t.Key === 'Name');
          const envTag = tags.find(t => t.Key === 'Environment');
          
          expect(nameTag?.Value).toContain(`${env}-webserver`);
          expect(nameTag?.Value).toContain(environmentSuffix);
          expect(envTag?.Value).toBe(env);
        }
      }
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('instances should be in different VPCs with different CIDR blocks', () => {
      const devVpcId = outputs.dev_vpc_id;
      const stagingVpcId = outputs.staging_vpc_id;
      const prodVpcId = outputs.prod_vpc_id;
      
      // Verify VPC IDs are unique
      const vpcIds = new Set([devVpcId, stagingVpcId, prodVpcId]);
      expect(vpcIds.size).toBe(3);
      
      // Each VPC should be defined
      expect(devVpcId).toBeDefined();
      expect(stagingVpcId).toBeDefined();
      expect(prodVpcId).toBeDefined();
    });

    test('each environment should have isolated network resources', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];
      const expectedCidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];

      for (let i = 0; i < vpcIds.length; i++) {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcIds[i]]
        });
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs![0];
        
        expect(vpc.CidrBlock).toBe(expectedCidrs[i]);
      }
    });

    test('should have proper route table configuration', async () => {
      const vpcIds = [
        outputs.dev_vpc_id,
        outputs.staging_vpc_id,
        outputs.prod_vpc_id
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        
        // Should have at least 3 route tables: 1 public + 2 private (one per AZ)
        expect(response.RouteTables?.length).toBeGreaterThanOrEqual(3);
        
        // Verify all route tables belong to the correct VPC
        response.RouteTables?.forEach(rt => {
          expect(rt.VpcId).toBe(vpcId);
        });
      }
    });
  });
});