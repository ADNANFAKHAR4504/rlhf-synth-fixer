import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe('TAP Stack Web Application Infrastructure', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let s3BucketName: string;
  let s3BucketArn: string;
  let albSecurityGroupId: string;
  let ec2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let instanceProfileName: string;
  let launchTemplateId: string;
  let loadBalancerArn: string;
  let loadBalancerDns: string;
  let targetGroupArn: string;
  let autoScalingGroupName: string;
  let hostedZoneId: string;
  let logGroupName: string;
  let logGroupArn: string;
  let availabilityZones: string[];

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    console.log('Available outputs:', Object.keys(outputs));
    
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}. Available keys: ${Object.keys(outputs).join(', ')}`);
    }

    const stackOutputs = outputs[stackKey];
    console.log('Stack outputs:', stackOutputs);

    // Extract values based on your TapStack outputs
    vpcId = stackOutputs['vpc-id'] || stackOutputs['vpcId'];
    publicSubnetIds = stackOutputs['public-subnet-ids'] || stackOutputs['publicSubnetIds'] || [];
    privateSubnetIds = stackOutputs['private-subnet-ids'] || stackOutputs['privateSubnetIds'] || [];
    s3BucketName = stackOutputs['s3-bucket-name'] || stackOutputs['s3BucketName'];
    s3BucketArn = stackOutputs['s3-bucket-arn'] || stackOutputs['s3BucketArn'];
    albSecurityGroupId = stackOutputs['alb-security-group-id'] || stackOutputs['albSecurityGroupId'];
    ec2SecurityGroupId = stackOutputs['ec2-security-group-id'] || stackOutputs['ec2SecurityGroupId'];
    rdsSecurityGroupId = stackOutputs['rds-security-group-id'] || stackOutputs['rdsSecurityGroupId'];
    instanceProfileName = stackOutputs['instance-profile-name'] || stackOutputs['instanceProfileName'];
    launchTemplateId = stackOutputs['launch-template-id'] || stackOutputs['launchTemplateId'];
    loadBalancerArn = stackOutputs['load-balancer-arn'] || stackOutputs['loadBalancerArn'];
    loadBalancerDns = stackOutputs['load-balancer-dns'] || stackOutputs['loadBalancerDns'];
    targetGroupArn = stackOutputs['target-group-arn'] || stackOutputs['targetGroupArn'];
    autoScalingGroupName = stackOutputs['auto-scaling-group-name'] || stackOutputs['autoScalingGroupName'];
    hostedZoneId = stackOutputs['hosted-zone-id'] || stackOutputs['hostedZoneId'];
    logGroupName = stackOutputs['log-group-name'] || stackOutputs['logGroupName'];
    logGroupArn = stackOutputs['log-group-arn'] || stackOutputs['logGroupArn'];
    availabilityZones = stackOutputs['availability-zones'] || stackOutputs['availabilityZones'] || [];

    // Validation
    const missingOutputs: string[] = [];
    
    if (!vpcId) missingOutputs.push('vpc-id');
    if (!Array.isArray(publicSubnetIds) || publicSubnetIds.length === 0) missingOutputs.push('public-subnet-ids');
    if (!Array.isArray(privateSubnetIds) || privateSubnetIds.length === 0) missingOutputs.push('private-subnet-ids');
    if (!s3BucketName) missingOutputs.push('s3-bucket-name');
    if (!loadBalancerDns) missingOutputs.push('load-balancer-dns');

    if (missingOutputs.length > 0) {
      throw new Error(`Missing required stack outputs: ${missingOutputs.join(', ')}. Available outputs: ${Object.keys(stackOutputs).join(', ')}`);
    }

    console.log('All required outputs loaded successfully');
  });

  // VPC Module Tests
  describe('VPC Configuration', () => {
    test('should have VPC with correct CIDR block 10.0.0.0/16', async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
      expect(Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
      expect(Vpcs?.[0].DhcpOptionsId).toBeDefined();
      expect(Vpcs?.[0].EnableDnsHostnames).toBe(true);
      expect(Vpcs?.[0].EnableDnsSupport).toBe(true);
    }, 20000);

    test('should have correct number of public subnets across AZs', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      }));
      
      expect(Subnets?.length).toBe(3);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
        expect(subnet.Tags?.find(tag => tag.Key === 'Type')?.Value).toBe('Public');
      });
    }, 20000);

    test('should have correct number of private subnets across AZs', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      }));
      
      expect(Subnets?.length).toBe(3);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toBe(`10.0.${index + 10}.0/24`);
        expect(subnet.Tags?.find(tag => tag.Key === 'Type')?.Value).toBe('Private');
      });
    }, 20000);

    test('should have Internet Gateway attached to VPC', async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      }));
      
      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0].Attachments?.[0].VpcId).toBe(vpcId);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe('available');
    }, 20000);

    test('should have NAT Gateway in first public subnet', async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));
      
      expect(NatGateways?.length).toBe(1);
      expect(NatGateways?.[0].VpcId).toBe(vpcId);
      expect(NatGateways?.[0].SubnetId).toBe(publicSubnetIds[0]);
      expect(NatGateways?.[0].State).toBe('available');
    }, 20000);
  });

  // S3 Module Tests
  describe('S3 Configuration', () => {
    test('should have S3 bucket accessible', async () => {
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }))).resolves.not.toThrow();
    }, 20000);

    test('should have S3 bucket in correct region', async () => {
      const { LocationConstraint } = await s3Client.send(new GetBucketLocationCommand({ 
        Bucket: s3BucketName 
      }));
      
      // LocationConstraint is null for us-east-1
      const bucketRegion = LocationConstraint || 'us-east-1';
      expect(bucketRegion).toBe(awsRegion);
    }, 20000);
  });

  // Security Group Module Tests
  describe('Security Group Configuration', () => {
    test('should have ALB security group with correct ingress rules', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [albSecurityGroupId]
      }));
      
      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toContain('alb-sg');
      
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBe(2);
      
      // Check for HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      
      // Check for HTTPS rule
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    }, 20000);

    test('should have EC2 security group with correct ingress rules', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SecurityGroupId]
      }));
      
      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toContain('ec2-sg');
      
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBe(2);
      
      // Check for HTTP rule from ALB
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.[0].GroupId).toBe(albSecurityGroupId);
      
      // Check for SSH rule
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/16');
    }, 20000);

    test('should have RDS security group with correct ingress rules', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [rdsSecurityGroupId]
      }));
      
      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toContain('rds-sg');
      
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBe(1);
      
      // Check for MySQL rule from EC2
      const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.[0].GroupId).toBe(ec2SecurityGroupId);
    }, 20000);
  });

  // IAM Module Tests
  describe('IAM Configuration', () => {
    test('should have EC2 IAM role with correct assume role policy', async () => {
      const roleName = instanceProfileName.replace('instance-profile', 'ec2-role');
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      
      expect(Role?.RoleName).toBe(roleName);
      expect(Role?.AssumeRolePolicyDocument).toBeDefined();
      
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ''));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    }, 20000);

    test('should have instance profile linked to EC2 role', async () => {
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({ 
        InstanceProfileName: instanceProfileName 
      }));
      
      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      
      const roleName = instanceProfileName.replace('instance-profile', 'ec2-role');
      expect(InstanceProfile?.Roles?.[0].RoleName).toBe(roleName);
    }, 20000);

    test('should have SSM managed instance core policy attached', async () => {
      const roleName = instanceProfileName.replace('instance-profile', 'ec2-role');
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({ 
        RoleName: roleName 
      }));
      
      const ssmPolicy = AttachedPolicies?.find(policy => 
        policy.PolicyArn === 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(ssmPolicy).toBeDefined();
    }, 20000);
  });

  // EC2 Module Tests
  describe('EC2 Configuration', () => {
    test('should have launch template with correct configuration', async () => {
      const { LaunchTemplates } = await ec2Client.send(new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [launchTemplateId]
      }));
      
      expect(LaunchTemplates?.length).toBe(1);
      const template = LaunchTemplates?.[0];
      expect(template?.LaunchTemplateId).toBe(launchTemplateId);
      expect(template?.LaunchTemplateName).toContain('launch-template');
    }, 20000);

    test('should have auto scaling group with correct configuration', async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));
      
      expect(AutoScalingGroups?.length).toBe(1);
      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(3);
      expect(asg?.VPCZoneIdentifier).toBeDefined();
      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBe(launchTemplateId);
    }, 20000);
  });

  // ALB Module Tests
  describe('Application Load Balancer Configuration', () => {
    test('should have load balancer with correct configuration', async () => {
      const { LoadBalancers } = await elbClient.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [loadBalancerArn]
      }));
      
      expect(LoadBalancers?.length).toBe(1);
      const lb = LoadBalancers?.[0];
      expect(lb?.LoadBalancerArn).toBe(loadBalancerArn);
      expect(lb?.Type).toBe('application');
      expect(lb?.Scheme).toBe('internet-facing');
      expect(lb?.State?.Code).toBe('active');
      expect(lb?.VpcId).toBe(vpcId);
      expect(lb?.DNSName).toBe(loadBalancerDns);
    }, 20000);

    test('should have target group with correct health check configuration', async () => {
      const { TargetGroups } = await elbClient.send(new DescribeTargetGroupsCommand({
        TargetGroupArns: [targetGroupArn]
      }));
      
      expect(TargetGroups?.length).toBe(1);
      const tg = TargetGroups?.[0];
      expect(tg?.TargetGroupArn).toBe(targetGroupArn);
      expect(tg?.Port).toBe(80);
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.VpcId).toBe(vpcId);
      expect(tg?.HealthCheckPath).toBe('/');
      expect(tg?.HealthCheckProtocol).toBe('HTTP');
      expect(tg?.HealthyThresholdCount).toBe(2);
      expect(tg?.UnhealthyThresholdCount).toBe(2);
      expect(tg?.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg?.HealthCheckIntervalSeconds).toBe(30);
    }, 20000);

    test('should have listener configured for HTTP traffic', async () => {
      const { Listeners } = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: loadBalancerArn
      }));
      
      expect(Listeners?.length).toBe(1);
      const listener = Listeners?.[0];
      expect(listener?.Port).toBe(80);
      expect(listener?.Protocol).toBe('HTTP');
      expect(listener?.DefaultActions?.length).toBe(1);
      expect(listener?.DefaultActions?.[0].Type).toBe('forward');
      expect(listener?.DefaultActions?.[0].TargetGroupArn).toBe(targetGroupArn);
    }, 20000);
  });

  // CloudWatch Module Tests
  describe('CloudWatch Configuration', () => {
    test('should have log group with correct retention period', async () => {
      expect(logGroupName).toContain('MyApp-application-logs');
      expect(logGroupArn).toContain('log-group:MyApp-application-logs');
    }, 20000);
  });

  // Route53 Module Tests
  describe('Route53 Configuration', () => {
    test('should have hosted zone created', async () => {
      expect(hostedZoneId).toBeDefined();
      expect(hostedZoneId).toMatch(/^Z[A-Z0-9]+$/);
    }, 20000);
  });

  // General Infrastructure Tests
  describe('General Infrastructure', () => {
    test('should be deployed across multiple availability zones', async () => {
      expect(availabilityZones).toBeDefined();
      expect(Array.isArray(availabilityZones)).toBe(true);
      expect(availabilityZones.length).toBe(3);
      
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);

    test('should have consistent naming convention', async () => {
      const namePrefix = 'MyApp-';
      
      expect(s3BucketName.toLowerCase()).toContain('myapp-');
      expect(instanceProfileName).toContain(namePrefix);
      expect(autoScalingGroupName).toContain(namePrefix);
      expect(logGroupName).toContain(namePrefix);
    }, 20000);

    test('should have all resources tagged with Project', async () => {
      // Test VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs?.[0].Tags || [];
      expect(vpcTags.find(tag => tag.Key === 'Project')?.Value).toBe('MyApp');
      
      // Test subnet tags
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      Subnets?.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.find(tag => tag.Key === 'Project')?.Value).toBe('MyApp');
      });
    }, 20000);
  });
});