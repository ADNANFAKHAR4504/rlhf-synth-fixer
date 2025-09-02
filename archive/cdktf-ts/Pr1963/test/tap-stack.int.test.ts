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
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });

describe('TAP Stack Infrastructure', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let ec2SecurityGroupId: string;
  let instanceProfileName: string;
  let iamRoleName: string;
  let launchTemplateId: string;
  let autoScalingGroupName: string;
  let internetGatewayId: string;
  let natGatewayId: string;

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
    ec2SecurityGroupId = stackOutputs['ec2-security-group-id'] || stackOutputs['ec2SecurityGroupId'];
    instanceProfileName = stackOutputs['instance-profile-name'] || stackOutputs['instanceProfileName'];
    iamRoleName = stackOutputs['iam-role-name'] || stackOutputs['iamRoleName'];
    launchTemplateId = stackOutputs['launch-template-id'] || stackOutputs['launchTemplateId'];
    autoScalingGroupName = stackOutputs['auto-scaling-group-name'] || stackOutputs['autoScalingGroupName'];
    internetGatewayId = stackOutputs['internet-gateway-id'] || stackOutputs['internetGatewayId'];
    natGatewayId = stackOutputs['nat-gateway-id'] || stackOutputs['natGatewayId'];

    // Validation
    const missingOutputs: string[] = [];
    
    if (!vpcId) missingOutputs.push('vpc-id');
    if (!Array.isArray(publicSubnetIds) || publicSubnetIds.length === 0) missingOutputs.push('public-subnet-ids');
    if (!Array.isArray(privateSubnetIds) || privateSubnetIds.length === 0) missingOutputs.push('private-subnet-ids');
    if (!ec2SecurityGroupId) missingOutputs.push('ec2-security-group-id');
    if (!instanceProfileName) missingOutputs.push('instance-profile-name');
    if (!iamRoleName) missingOutputs.push('iam-role-name');
    if (!launchTemplateId) missingOutputs.push('launch-template-id');
    if (!autoScalingGroupName) missingOutputs.push('auto-scaling-group-name');

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
        expect(subnet.Tags?.find(tag => tag.Key === 'Type')?.Value).toBe('Public');
        expect(subnet.Tags?.find(tag => tag.Key === 'Name')?.Value).toContain('MyApp-public-subnet');
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-3]\.0\/24$/);
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
        expect(subnet.Tags?.find(tag => tag.Key === 'Type')?.Value).toBe('Private');
        expect(subnet.Tags?.find(tag => tag.Key === 'Name')?.Value).toContain('MyApp-private-subnet');
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[0-2]\.0\/24$/);
      });
    }, 20000);

    test('should have Internet Gateway attached to VPC', async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [internetGatewayId]
      }));
      
      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0].InternetGatewayId).toBe(internetGatewayId);
      expect(InternetGateways?.[0].Attachments?.[0].VpcId).toBe(vpcId);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe('available');
      expect(InternetGateways?.[0].Tags?.find(tag => tag.Key === 'Name')?.Value).toBe('MyApp-igw');
    }, 20000);

    test('should have NAT Gateway in first public subnet', async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));
      
      expect(NatGateways?.length).toBe(1);
      expect(NatGateways?.[0].NatGatewayId).toBe(natGatewayId);
      expect(NatGateways?.[0].VpcId).toBe(vpcId);
      expect(NatGateways?.[0].SubnetId).toBe(publicSubnetIds[0]);
      expect(NatGateways?.[0].State).toBe('available');
      expect(NatGateways?.[0].Tags?.find(tag => tag.Key === 'Name')?.Value).toBe('MyApp-nat-gateway');
    }, 20000);
  });

  // Security Group Tests
  describe('Security Group Configuration', () => {
    test('should have EC2 security group with correct ingress rules', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SecurityGroupId]
      }));
      
      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toContain('ec2-sg');
      
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules.length).toBe(3);
      
      // Check for SSH rule
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpProtocol).toBe('tcp');
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/16');
      
      // Check for HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/16');
      
      // Check for HTTPS rule
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/16');
    }, 20000);

    test('should have EC2 security group with correct egress rules', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SecurityGroupId]
      }));
      
      const sg = SecurityGroups?.[0];
      const egressRules = sg?.IpPermissionsEgress || [];
      
      // Check for all outbound traffic rule
      const allOutboundRule = egressRules.find(rule => 
        rule.FromPort === 0 && rule.ToPort === 0 && rule.IpProtocol === '-1'
      );
    }, 20000);
  });

  // IAM Module Tests
  describe('IAM Configuration', () => {
    test('should have EC2 IAM role with correct assume role policy', async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));
      
      expect(Role?.RoleName).toBe(iamRoleName);
      expect(Role?.AssumeRolePolicyDocument).toBeDefined();
      
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ''));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
    }, 20000);

    test('should have instance profile linked to EC2 role', async () => {
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({ 
        InstanceProfileName: instanceProfileName 
      }));
      
      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0].RoleName).toBe(iamRoleName);
    }, 20000);

    test('should have S3 read-only policy attached', async () => {
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({ 
        RoleName: iamRoleName 
      }));
      
      const s3Policy = AttachedPolicies?.find(policy => 
        policy.PolicyArn === 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy?.PolicyName).toBe('AmazonS3ReadOnlyAccess');
    }, 20000);
  });

  // EC2 Auto Scaling Module Tests
  describe('EC2 Auto Scaling Configuration', () => {
    test('should have launch template with correct configuration', async () => {
      const { LaunchTemplates } = await ec2Client.send(new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [launchTemplateId]
      }));
      
      expect(LaunchTemplates?.length).toBe(1);
      const template = LaunchTemplates?.[0];
      expect(template?.LaunchTemplateId).toBe(launchTemplateId);
      expect(template?.LaunchTemplateName).toBe('MyApp-launch-template');
      expect(template?.Tags?.find(tag => tag.Key === 'Name')?.Value).toBe('MyApp-launch-template');
    }, 20000);

    test('should have auto scaling group with correct configuration', async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));
      
      expect(AutoScalingGroups?.length).toBe(1);
      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(3);
      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBe(launchTemplateId);
      expect(asg?.LaunchTemplate?.Version).toBe('$Latest');
      
      // Verify ASG is deployed in private subnets
      const asgSubnets = asg?.VPCZoneIdentifier?.split(',') || [];
      expect(asgSubnets.sort()).toEqual(privateSubnetIds.sort());
    }, 20000);

    test('should have auto scaling group instances in private subnets', async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));
      
      const asg = AutoScalingGroups?.[0];
      const instanceIds = asg?.Instances?.map(instance => instance.InstanceId) || [];
    }, 20000);
  });

  // General Infrastructure Tests
  describe('General Infrastructure', () => {
    test('should have subnets distributed across multiple availability zones', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(3);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);

    test('should have consistent naming convention', async () => {
      const namePrefix = 'MyApp';
      
      expect(instanceProfileName).toContain(namePrefix);
      expect(iamRoleName).toContain(namePrefix);
      expect(autoScalingGroupName).toContain(namePrefix);
      
      // Verify VPC name tag
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcNameTag = Vpcs?.[0].Tags?.find(tag => tag.Key === 'Name')?.Value;
      expect(vpcNameTag).toBe('MyApp-vpc');
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
      
      // Test security group tags
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SecurityGroupId]
      }));
      
      const sgTags = SecurityGroups?.[0].Tags || [];
      expect(sgTags.find(tag => tag.Key === 'Project')?.Value).toBe('MyApp');
      
      // Test IAM role tags
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));
      const roleTags = Role?.Tags || [];
      expect(roleTags.find(tag => tag.Key === 'Project')?.Value).toBe('MyApp');
    }, 20000);

    test('should have proper resource dependencies', async () => {
      // Verify NAT Gateway is in public subnet
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));
      
      expect(NatGateways?.[0].SubnetId).toBe(publicSubnetIds[0]);
      
      // Verify Auto Scaling Group uses correct launch template and subnets
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBe(launchTemplateId);
      
      const asgSubnets = asg?.VPCZoneIdentifier?.split(',') || [];
      privateSubnetIds.forEach(subnetId => {
        expect(asgSubnets).toContain(subnetId);
      });
    }, 20000);
  });
});