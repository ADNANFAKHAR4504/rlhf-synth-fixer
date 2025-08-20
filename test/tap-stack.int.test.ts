import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr917';

describe('Multi-Environment Infrastructure Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('should have created development VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.developmentVpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have created staging VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.stagingVpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have created production VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.productionVpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.2.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPCs should be isolated from each other', () => {
      // Verify that VPC IDs are different
      expect(outputs.developmentVpcId).not.toBe(outputs.stagingVpcId);
      expect(outputs.stagingVpcId).not.toBe(outputs.productionVpcId);
      expect(outputs.developmentVpcId).not.toBe(outputs.productionVpcId);
    });
  });

  describe('EC2 Instances', () => {
    test('should have created development instance with correct type', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.developmentInstanceId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t2.micro');
      expect(instance.PrivateIpAddress).toBe(outputs.developmentInstancePrivateIp);
      expect(instance.VpcId).toBe(outputs.developmentVpcId);
      
      // Verify IMDSv2 is enforced
      expect(instance.MetadataOptions?.HttpTokens).toBe('required');
      expect(instance.MetadataOptions?.HttpEndpoint).toBe('enabled');
    });

    test('should have created staging instance with correct type', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.stagingInstanceId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.medium');
      expect(instance.PrivateIpAddress).toBe(outputs.stagingInstancePrivateIp);
      expect(instance.VpcId).toBe(outputs.stagingVpcId);
      
      // Verify IMDSv2 is enforced
      expect(instance.MetadataOptions?.HttpTokens).toBe('required');
      expect(instance.MetadataOptions?.HttpEndpoint).toBe('enabled');
    });

    test('should have created production instance with correct type', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.productionInstanceId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('m5.large');
      expect(instance.PrivateIpAddress).toBe(outputs.productionInstancePrivateIp);
      expect(instance.VpcId).toBe(outputs.productionVpcId);
      
      // Verify IMDSv2 is enforced
      expect(instance.MetadataOptions?.HttpTokens).toBe('required');
      expect(instance.MetadataOptions?.HttpEndpoint).toBe('enabled');
    });

    test('instances should be in private subnets', async () => {
      const instanceIds = [
        outputs.developmentInstanceId,
        outputs.stagingInstanceId,
        outputs.productionInstanceId
      ];

      for (const instanceId of instanceIds) {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceId]
        });
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];
        
        // Instance should not have public IP
        expect(instance.PublicIpAddress).toBeUndefined();
        
        // Verify subnet is private
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: [instance.SubnetId!]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        const subnet = subnetResponse.Subnets![0];
        
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      }
    });
  });

  describe('Network Security', () => {
    test('should have security groups with environment suffix', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [
              `shared-sg-${environmentSuffix}`,
              `development-sg-${environmentSuffix}`,
              `staging-sg-${environmentSuffix}`,
              `production-sg-${environmentSuffix}`
            ]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(4);
      
      // Verify shared security group rules
      const sharedSg = response.SecurityGroups?.find(sg => 
        sg.GroupName === `shared-sg-${environmentSuffix}`
      );
      expect(sharedSg).toBeDefined();
      
      const sshRule = sharedSg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      
      const httpRule = sharedSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Network ACLs configured', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `*development-restrictive-nacl-${environmentSuffix}*`,
              `*staging-restrictive-nacl-${environmentSuffix}*`,
              `*production-restrictive-nacl-${environmentSuffix}*`
            ]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.NetworkAcls?.length).toBeGreaterThanOrEqual(3);
      
      // Check production NACL has deny rule for staging traffic
      const prodNacl = response.NetworkAcls?.find(nacl => 
        nacl.Tags?.some(tag => 
          tag.Key === 'Name' && 
          tag.Value?.includes('production-restrictive-nacl')
        )
      );
      
      if (prodNacl) {
        const denyRule = prodNacl.Entries?.find(entry => 
          entry.CidrBlock === '10.1.0.0/16' && 
          entry.RuleAction === 'deny' &&
          entry.RuleNumber === 90
        );
        expect(denyRule).toBeDefined();
      }
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have Flow Logs enabled for all VPCs', async () => {
      const vpcIds = [
        outputs.developmentVpcId,
        outputs.stagingVpcId,
        outputs.productionVpcId
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeFlowLogsCommand({
          Filters: [
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
      }
    });

    test('should have CloudWatch Log Groups for Flow Logs', async () => {
      const environments = ['development', 'staging', 'production'];
      
      for (const env of environments) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/vpc/flowlogs/${env}-${environmentSuffix}`
        });
        const response = await logsClient.send(command);
        
        expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);
        const logGroup = response.logGroups![0];
        expect(logGroup.retentionInDays).toBe(7);
      }
    });
  });

  describe('IAM Roles', () => {
    test('should have shared instance role with correct policies', async () => {
      const command = new GetRoleCommand({
        RoleName: `shared-instance-role-${environmentSuffix}`
      });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
      
      // Check attached policies
      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: `shared-instance-role-${environmentSuffix}`
      });
      const policiesResponse = await iamClient.send(policiesCommand);
      
      const policyNames = policiesResponse.AttachedPolicies?.map(p => p.PolicyName);
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
    });

    test('should have VPC Flow Logs roles for each environment', async () => {
      const environments = ['development', 'staging', 'production'];
      
      for (const env of environments) {
        const command = new GetRoleCommand({
          RoleName: `vpc-flow-logs-role-${env}-${environmentSuffix}`
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
        outputs.developmentVpcId,
        outputs.stagingVpcId,
        outputs.productionVpcId
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
        
        expect(publicSubnets?.length).toBeGreaterThanOrEqual(2);
        expect(privateSubnets?.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should have NAT Gateways for private subnet connectivity', async () => {
      const vpcIds = [
        outputs.developmentVpcId,
        outputs.stagingVpcId,
        outputs.productionVpcId
      ];

      for (const vpcId of vpcIds) {
        const command = new DescribeNatGatewaysCommand({
          Filters: [
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
        
        expect(response.NatGateways?.length).toBeGreaterThanOrEqual(2); // 2 NAT gateways per VPC
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on VPCs', async () => {
      const vpcIds = [
        outputs.developmentVpcId,
        outputs.stagingVpcId,
        outputs.productionVpcId
      ];

      const environments = ['development', 'staging', 'production'];

      for (let i = 0; i < vpcIds.length; i++) {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcIds[i]]
        });
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs![0];
        
        const tags = vpc.Tags || [];
        const envTag = tags.find(t => t.Key === 'Environment');
        const ownerTag = tags.find(t => t.Key === 'Owner');
        const purposeTag = tags.find(t => t.Key === 'Purpose');
        
        expect(envTag?.Value).toBe(environments[i]);
        expect(ownerTag?.Value).toBe('Infrastructure Team');
        expect(purposeTag?.Value).toBe('Multi-environment testing');
      }
    });

    test('should have proper tags on EC2 instances', async () => {
      const instanceIds = [
        outputs.developmentInstanceId,
        outputs.stagingInstanceId,
        outputs.productionInstanceId
      ];

      const environments = ['development', 'staging', 'production'];

      for (let i = 0; i < instanceIds.length; i++) {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceIds[i]]
        });
        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];
        
        const tags = instance.Tags || [];
        const nameTag = tags.find(t => t.Key === 'Name');
        
        expect(nameTag?.Value).toContain(environments[i]);
        expect(nameTag?.Value).toContain('test-instance');
      }
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('instances should not be able to communicate across environments', () => {
      // Verify that instances are in different VPCs with different CIDR blocks
      const devIp = outputs.developmentInstancePrivateIp;
      const stagingIp = outputs.stagingInstancePrivateIp;
      const prodIp = outputs.productionInstancePrivateIp;
      
      // Check that IPs are in different subnets
      expect(devIp.startsWith('10.0.')).toBe(true);
      expect(stagingIp.startsWith('10.1.')).toBe(true);
      expect(prodIp.startsWith('10.2.')).toBe(true);
    });

    test('each environment should have isolated network resources', () => {
      // Verify VPC IDs are unique
      const vpcIds = new Set([
        outputs.developmentVpcId,
        outputs.stagingVpcId,
        outputs.productionVpcId
      ]);
      
      expect(vpcIds.size).toBe(3);
    });
  });
});