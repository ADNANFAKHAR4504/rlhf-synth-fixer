// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { Route53Client, GetHostedZoneCommand } from '@aws-sdk/client-route-53';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-west-2' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
const route53Client = new Route53Client({ region: 'us-west-2' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-west-2' });

describe('TapStack VPC Infrastructure Integration Tests', () => {
  
  describe('VPC Infrastructure Validation', () => {
    test('should have deployed VPC with correct configuration', async () => {
      if (!outputs.VPCId) {
        throw new Error('VPCId not found in outputs - stack may not be deployed');
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      
      // Check DNS settings
      const enableDnsHostnames = vpc?.DnsHostnamesEnabled || false;
      const enableDnsSupport = vpc?.DnsSupportEnabled || false;
      expect(enableDnsHostnames).toBe(true);
      expect(enableDnsSupport).toBe(true);

      // Verify VPC tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      const applicationTag = vpc?.Tags?.find(tag => tag.Key === 'Application');
      
      expect(nameTag?.Value).toBe(`TapStackVPC-${environmentSuffix}`);
      expect(environmentTag?.Value).toBe(environmentSuffix);
      expect(applicationTag?.Value).toBe('TapStack');
    });

    test('should have deployed all three subnets with correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.PublicSubnetId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId
      ];

      expect(subnetIds.every(id => id)).toBe(true);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(3);

      const publicSubnet = subnets.find(subnet => subnet.SubnetId === outputs.PublicSubnetId);
      const privateSubnetA = subnets.find(subnet => subnet.SubnetId === outputs.PrivateSubnetAId);
      const privateSubnetB = subnets.find(subnet => subnet.SubnetId === outputs.PrivateSubnetBId);

      expect(publicSubnet?.CidrBlock).toBe('10.0.1.0/24');
      expect(privateSubnetA?.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnetB?.CidrBlock).toBe('10.0.3.0/24');

      // Check public subnet has MapPublicIpOnLaunch enabled
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
      
      // Verify all subnets are in available state
      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });

      // Verify private subnets B is in different AZ than A
      expect(privateSubnetB?.AvailabilityZone).not.toBe(privateSubnetA?.AvailabilityZone);
    });

    test('should have deployed security groups with correct rules', async () => {
      const securityGroupIds = [
        outputs.WebSecurityGroupId,
        outputs.ALBSecurityGroupId
      ];

      expect(securityGroupIds.every(id => id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      
      expect(securityGroups).toHaveLength(2);

      const webSecurityGroup = securityGroups.find(sg => sg.GroupId === outputs.WebSecurityGroupId);
      const albSecurityGroup = securityGroups.find(sg => sg.GroupId === outputs.ALBSecurityGroupId);

      // Validate Web Security Group
      expect(webSecurityGroup?.GroupName).toBe(`TapStackWebSecurityGroup-${environmentSuffix}`);
      expect(webSecurityGroup?.Description).toContain('web tier allowing HTTP and HTTPS');
      
      const webIngressRules = webSecurityGroup?.IpPermissions || [];
      expect(webIngressRules).toHaveLength(2);
      
      const httpRule = webIngressRules.find(rule => rule.FromPort === 80);
      const httpsRule = webIngressRules.find(rule => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

      // Validate ALB Security Group
      expect(albSecurityGroup?.GroupName).toBe(`TapStackALBSecurityGroup-${environmentSuffix}`);
      expect(albSecurityGroup?.Description).toContain('Application Load Balancer');
    });
  });

  describe('Application Load Balancer Validation', () => {
    test('should have deployed ALB with correct configuration', async () => {
      if (!outputs.ApplicationLoadBalancerArn) {
        throw new Error('ApplicationLoadBalancerArn not found in outputs');
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn]
      });

      const response = await elbv2Client.send(command);
      const loadBalancer = response.LoadBalancers?.[0];

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.LoadBalancerName).toBe(`TapStackALB-${environmentSuffix}`);
      expect(loadBalancer?.Scheme).toBe('internal');
      expect(loadBalancer?.Type).toBe('application');
      expect(loadBalancer?.State?.Code).toBe('active');

      // Verify ALB is in correct subnets
      const albSubnets = loadBalancer?.AvailabilityZones?.map(az => az.SubnetId) || [];
      expect(albSubnets).toContain(outputs.PrivateSubnetAId);
      expect(albSubnets).toContain(outputs.PrivateSubnetBId);
      expect(albSubnets).toHaveLength(2);

      // Verify ALB DNS name output matches actual DNS name
      expect(outputs.ApplicationLoadBalancerDNS).toBe(loadBalancer?.DNSName);
    });
  });

  describe('Route 53 DNS Validation', () => {
    test('should have deployed hosted zone with correct configuration', async () => {
      if (!outputs.HostedZoneId) {
        throw new Error('HostedZoneId not found in outputs');
      }

      const command = new GetHostedZoneCommand({
        Id: outputs.HostedZoneId
      });

      const response = await route53Client.send(command);
      const hostedZone = response.HostedZone;

      expect(hostedZone).toBeDefined();
      expect(hostedZone?.Name).toBe(`tapstack-${environmentSuffix}.internal.`);
      expect(hostedZone?.Config?.PrivateZone).toBe(true);

      // Verify VPC association
      const vpcAssociation = response.VPCs?.[0];
      expect(vpcAssociation?.VPCId).toBe(outputs.VPCId);
      expect(vpcAssociation?.VPCRegion).toBe('us-west-2');
    });
  });

  describe('VPC Flow Logs and Monitoring Validation', () => {
    test('should have deployed VPC Flow Logs CloudWatch log group', async () => {
      if (!outputs.VPCFlowLogsGroupName) {
        throw new Error('VPCFlowLogsGroupName not found in outputs');
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogsGroupName
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.[0];

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(`/aws/vpc/flowlogs-${environmentSuffix}`);
      expect(logGroup?.retentionInDays).toBe(14);

      // Verify encryption is enabled for production
      if (environmentSuffix === 'prod') {
        expect(logGroup?.kmsKeyId).toBeDefined();
      }
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs with correct format', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetAId', 
        'PrivateSubnetBId',
        'WebSecurityGroupId',
        'ALBSecurityGroupId',
        'ApplicationLoadBalancerArn',
        'ApplicationLoadBalancerDNS',
        'HostedZoneId',
        'VPCFlowLogsGroupName',
        'EnvironmentSuffix',
        'StackName'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
        expect(typeof outputs[outputName]).toBe('string');
      });

      // Verify environment suffix matches
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toContain('TapStack');
    });

    test('should have valid AWS resource ARNs and IDs', () => {
      // VPC ID format: vpc-xxxxxxxxxxxxxxxxx
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
      
      // Subnet ID format: subnet-xxxxxxxxxxxxxxxxx  
      expect(outputs.PublicSubnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnetAId).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnetBId).toMatch(/^subnet-[a-f0-9]{17}$/);

      // Security Group ID format: sg-xxxxxxxxxxxxxxxxx
      expect(outputs.WebSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.ALBSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);

      // ALB ARN format
      expect(outputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-west-2:\d{12}:loadbalancer\/app\/.*$/);
      
      // Hosted Zone ID format: /hostedzone/ZXXXXXXXXXXXXX
      expect(outputs.HostedZoneId).toMatch(/^\/hostedzone\/Z[A-Z0-9]{13}$/);
      
      // ALB DNS name format
      expect(outputs.ApplicationLoadBalancerDNS).toMatch(/^TapStackALB-.*\.us-west-2\.elb\.amazonaws\.com$/);
    });
  });

  describe('Environment-specific Configuration', () => {
    test('should have environment-specific resource naming', () => {
      // All resource names should include environment suffix
      const resourceNamingTests = [
        { output: 'VPCFlowLogsGroupName', expected: `/aws/vpc/flowlogs-${environmentSuffix}` },
        { output: 'ApplicationLoadBalancerDNS', pattern: new RegExp(`TapStackALB-${environmentSuffix}-.*`) }
      ];

      resourceNamingTests.forEach(test => {
        if (test.expected) {
          expect(outputs[test.output]).toBe(test.expected);
        } else if (test.pattern) {
          expect(outputs[test.output]).toMatch(test.pattern);
        }
      });
    });

    test('should validate production-specific configurations', () => {
      if (environmentSuffix === 'prod') {
        // In production, additional security measures should be in place
        expect(outputs.VPCFlowLogsGroupName).toBe('/aws/vpc/flowlogs-prod');
        
        // Could add more production-specific validations here
        // such as checking for KMS encryption, enhanced monitoring, etc.
      }
    });
  });
});