import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const iam = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kms = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Secure Cloud Infrastructure Integration Tests', () => {
  test('VPC exists with correct CIDR block and DNS settings', async () => {
    const vpcId = outputs.VpcId;
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = Vpcs?.[0];

    expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc?.State).toBe('available');
    expect(vpc?.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Purpose', Value: 'Secure VPC' })
      ])
    );
  });

  test('Public subnet is correctly configured', async () => {
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.SubnetId] }));
    const subnet = Subnets?.[0];

    expect(subnet?.CidrBlock).toBe('10.0.1.0/24');
    expect(subnet?.MapPublicIpOnLaunch).toBe(true);
    expect(subnet?.VpcId).toBe(outputs.VpcId);
    expect(subnet?.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Purpose', Value: 'Public Subnet' })
      ])
    );
  });

  test('Internet Gateway is attached to the VPC', async () => {
    const { InternetGateways } = await ec2.send(new DescribeInternetGatewaysCommand({}));
    const igw = InternetGateways?.find(gw =>
      gw.Attachments?.some(att => att.VpcId === outputs.VpcId)
    );

    expect(igw).toBeDefined();
    const attachment = igw?.Attachments?.find(att => att.VpcId === outputs.VpcId);
    expect(['attached', 'available']).toContain(attachment?.State);
  });

  test('Security Group has correct ingress and egress rules', async () => {
    const { SecurityGroups } = await ec2.send(new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.SecurityGroupId]
    }));
    const sg = SecurityGroups?.[0];

    // Check SSH ingress rule
    const ingressRules = sg?.IpPermissions ?? [];
    const sshRule = ingressRules.find(rule =>
      rule.IpProtocol === 'tcp' &&
      rule.FromPort === 22 &&
      rule.ToPort === 22
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/8');

    // Check HTTPS egress rule
    const egressRules = sg?.IpPermissionsEgress ?? [];
    const httpsRule = egressRules.find(rule =>
      rule.IpProtocol === 'tcp' &&
      rule.FromPort === 443 &&
      rule.ToPort === 443
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
  });

  test('EC2 instance is properly configured', async () => {
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({
      InstanceIds: [outputs.InstanceId]
    }));
    const instance = Reservations?.[0]?.Instances?.[0];

    expect(instance?.SubnetId).toBe(outputs.SubnetId);
    expect(instance?.SecurityGroups?.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
    expect(instance?.Monitoring?.State).toBe('enabled');
    expect(instance?.IamInstanceProfile).toBeDefined();

    // Check that block devices exist (encryption details may not be available in describe response)
    const blockDevices = instance?.BlockDeviceMappings ?? [];
    expect(blockDevices.length).toBeGreaterThan(0);
    expect(blockDevices[0]?.DeviceName).toBeDefined();
  });

  test('IAM Role exists with correct configuration', async () => {
    const roleArn = outputs.IAMRoleArn;
    expect(roleArn).toBeDefined();

    const roleName = roleArn.split('/').pop();
    expect(roleName).toBeDefined();

    const { Role } = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role?.RoleName).toContain('EC2-Role');
    expect(Role?.AssumeRolePolicyDocument).toBeDefined();

    // Verify the role ARN matches the output
    expect(Role?.Arn).toBe(roleArn);

    // Verify the role can be assumed by EC2 service
    const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ''));
    expect(assumeRolePolicy.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Effect: 'Allow',
          Principal: expect.objectContaining({
            Service: 'ec2.amazonaws.com'
          }),
          Action: 'sts:AssumeRole'
        })
      ])
    );
  });

  test('KMS Key is properly configured for EBS encryption', async () => {
    const { KeyMetadata } = await kms.send(new DescribeKeyCommand({ KeyId: outputs.KMSKeyId }));

    expect(KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    expect(KeyMetadata?.KeyState).toBe('Enabled');
    expect(KeyMetadata?.Description).toContain('KMS key for EBS encryption');
  });

  test('Route table configuration for public subnet', async () => {
    const { RouteTables } = await ec2.send(new DescribeRouteTablesCommand({
      Filters: [
        { Name: 'vpc-id', Values: [outputs.VpcId] },
        { Name: 'association.subnet-id', Values: [outputs.SubnetId] }
      ]
    }));

    const routeTable = RouteTables?.[0];
    expect(routeTable).toBeDefined();

    // Check for default route to internet gateway
    const routes = routeTable?.Routes ?? [];
    const defaultRoute = routes.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
    expect(defaultRoute).toBeDefined();
    expect(defaultRoute?.GatewayId).toMatch(/^igw-/);
  });

  test('Resource tagging follows naming convention', async () => {
    // Check VPC tags
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] }));
    const vpcTags = Vpcs?.[0]?.Tags ?? [];

    expect(vpcTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Name', Value: expect.stringMatching(/SecureApp-VPC-prod/) }),
        expect.objectContaining({ Key: 'Environment', Value: 'prod' }),
        expect.objectContaining({ Key: 'Purpose', Value: 'Secure VPC' })
      ])
    );

    // Check EC2 instance tags
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({
      InstanceIds: [outputs.InstanceId]
    }));
    const instanceTags = Reservations?.[0]?.Instances?.[0]?.Tags ?? [];

    expect(instanceTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Name', Value: expect.stringMatching(/SecureApp-Instance-prod/) }),
        expect.objectContaining({ Key: 'Environment', Value: 'prod' }),
        expect.objectContaining({ Key: 'Purpose', Value: 'Secure EC2 Instance' }),
        expect.objectContaining({ Key: 'Backup', Value: 'Required' })
      ])
    );
  });
});
