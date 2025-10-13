import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

if (!outputs.region && !outputs.aws_region) {
  throw new Error('AWS region not found in flat outputs.');
}

// Use region from outputs, fallback on region key
const awsRegion = outputs.region || outputs.aws_region;
AWS.config.update({ region: awsRegion });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const secretsManager = new AWS.SecretsManager();
const autoscaling = new AWS.AutoScaling();
const elbv2 = new AWS.ELBv2();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();
const s3 = new AWS.S3();

describe('TAP Stack Live Integration Tests', () => {

  it('VPC exists with correct CIDR', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) return;

    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) return;

    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist and belong to VPC', async () => {
    if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) return;

    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    expect(publicSubnets.Subnets?.length).toBe(publicSubnetIds.length);
    publicSubnets.Subnets?.forEach(subnet => {
      expect(publicSubnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    expect(privateSubnets.Subnets?.length).toBe(privateSubnetIds.length);
    privateSubnets.Subnets?.forEach(subnet => {
      expect(privateSubnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(outputs.vpc_id);
    });
  });

  it('NAT Gateways exist with allocated Elastic IPs', async () => {
    // NAT gateway EIP ids may not be in outputs, test just existence & state
    const natGatewayIds: string[] = outputs.nat_gateway_ids ? JSON.parse(outputs.nat_gateway_ids) : [];
    if (!natGatewayIds.length) return;

    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);
    natGateways.NatGateways?.forEach(nat => {
      expect(nat.State).toBe('available');
      expect(nat.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
    });
  });


  it('Security groups exist for RDS, EC2, ALB, Lambda', async () => {
    const sgIds = [
      outputs.security_group_rds_id,
      outputs.security_group_ec2_id,
      outputs.security_group_alb_id,
      outputs.security_group_lambda_id,
    ].filter(Boolean);

    for (const sgId of sgIds) {
      const sg = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      expect(sg.SecurityGroups?.length).toBe(1);
      expect(sg.SecurityGroups?.[0].GroupId).toBe(sgId);
    }
  });

  it('RDS secrets exist in Secrets Manager with correct ARN', async () => {
    if (!outputs.secrets_manager_secret_arn) return;

    const secret = await secretsManager.describeSecret({ SecretId: outputs.secrets_manager_secret_arn }).promise();
    expect(secret.ARN).toBe(outputs.secrets_manager_secret_arn);
  });


  it('Application Load Balancer is active with correct DNS', async () => {
    if (!outputs.alb_arn || !outputs.alb_dns_name) return;

    const loadBalancers = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.alb_arn] }).promise();
    const alb = loadBalancers.LoadBalancers?.[0];
    expect(alb).toBeDefined();
    expect(alb?.DNSName).toBe(outputs.alb_dns_name);
    expect(alb?.State?.Code).toBe('active');
  });

  it('Auto Scaling Group exists and has correct name and ARN', async () => {
    if (!outputs.autoscaling_group_name || !outputs.autoscaling_group_arn) return;

    const groups = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.autoscaling_group_name] }).promise();
    const group = groups.AutoScalingGroups?.find(g => g.AutoScalingGroupName === outputs.autoscaling_group_name);
    expect(group).toBeDefined();
    expect(group?.AutoScalingGroupARN).toBe(outputs.autoscaling_group_arn);
  });

  it('CloudFront distribution exists and matches output', async () => {
    if (!outputs.cloudfront_distribution_id) return;

    const distributions = await new AWS.CloudFront().listDistributions().promise();
    const dist = distributions.DistributionList?.Items?.find(d => d.Id === outputs.cloudfront_distribution_id);
    expect(dist).toBeDefined();
    expect(dist?.Status).toMatch(/Deployed|InProgress/);
  });

});
