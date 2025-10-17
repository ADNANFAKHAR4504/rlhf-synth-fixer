import { readFileSync } from 'fs';
import { join } from 'path';

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";

import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";

import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from "@aws-sdk/client-auto-scaling";

import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";

import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";


const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

const region = outputs.region || 'us-east-1';

const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const rdsClient = new RDSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const asClient = new AutoScalingClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });

describe("TAP Stack Integration Tests (Full Stack)", () => {

  it("VPC exists with correct CIDR", async () => {
    const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
    const data = await ec2Client.send(command);
    expect(data.Vpcs?.length).toBe(1);
    expect(data.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it("Internet Gateway attached to VPC", async () => {
    const command = new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.internet_gateway_id] });
    const data = await ec2Client.send(command);
    const attachment = data.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe("available");
  });

  it("Public and Private subnets exist and belong to the VPC", async () => {
    const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
    const dbSubnetIds = JSON.parse(outputs.database_subnet_ids);

    const pubSubsCmd = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
    const priSubsCmd = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });
    const dbSubsCmd = new DescribeSubnetsCommand({ SubnetIds: dbSubnetIds });

    const publicSubs = await ec2Client.send(pubSubsCmd);
    const privateSubs = await ec2Client.send(priSubsCmd);
    const dbSubs = await ec2Client.send(dbSubsCmd);

    publicSubs.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
    privateSubs.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
    dbSubs.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
  });

  it("NAT Gateways exist and are available", async () => {
    const natGatewayIds = JSON.parse(outputs.nat_gateway_ids);
    const command = new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds });
    const data = await ec2Client.send(command);
    expect(data.NatGateways?.length).toBe(natGatewayIds.length);
    const allAvailable = data.NatGateways?.every(n => n.State === "available");
    expect(allAvailable).toBe(true);
  });

  it("ALB Security Group exists", async () => {
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [outputs.security_group_alb_id] });
    const data = await ec2Client.send(command);
    expect(data.SecurityGroups?.length).toBe(1);
    const sg = data.SecurityGroups![0];
    const hasHttp = sg.IpPermissions?.some(p => p.FromPort === 80 && p.ToPort === 80 && p.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0"));
    const hasHttps = sg.IpPermissions?.some(p => p.FromPort === 443 && p.ToPort === 443 && p.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0"));
    expect(hasHttp).toBe(true);
    expect(hasHttps).toBe(true);
  });

  it("EC2 Security Group exists and allows inbound from ALB SG", async () => {
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [outputs.security_group_ec2_id] });
    const data = await ec2Client.send(command);
    expect(data.SecurityGroups?.length).toBe(1);
    const sg = data.SecurityGroups![0];
    const ingressFromAlb = sg.IpPermissions?.some(p =>
      p.FromPort === 80 && p.ToPort === 80 &&
      p.UserIdGroupPairs?.some(gp => gp.GroupId === outputs.security_group_alb_id)
    );
    expect(ingressFromAlb).toBe(true);
  });

  it("RDS Security Group exists and allows port 3306 from EC2 SG", async () => {
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [outputs.security_group_rds_id] });
    const data = await ec2Client.send(command);
    expect(data.SecurityGroups?.length).toBe(1);
    const sg = data.SecurityGroups![0];
    const ingressFromEc2 = sg.IpPermissions?.some(p =>
      p.FromPort === 3306 && p.ToPort === 3306 &&
      p.UserIdGroupPairs?.some(gp => gp.GroupId === outputs.security_group_ec2_id)
    );
    expect(ingressFromEc2).toBe(true);
  });

  it("EC2 IAM Role exists with correct ARN", async () => {
    const roleName = outputs.ec2_iam_role_arn.split('/').pop()!;
    const command = new GetRoleCommand({ RoleName: roleName });
    const data = await iamClient.send(command);
    expect(data.Role.Arn).toBe(outputs.ec2_iam_role_arn);
  });

  it("EC2 Instance Profile exists", async () => {
    const ipName = outputs.ec2_instance_profile_arn.split('/').pop()!;
    const command = new GetInstanceProfileCommand({ InstanceProfileName: ipName });
    const data = await iamClient.send(command);
    expect(data.InstanceProfile.Arn).toBe(outputs.ec2_instance_profile_arn);
  });

  it("RDS Monitoring IAM Role exists", async () => {
    const roleName = outputs.rds_monitoring_role_arn.split('/').pop()!;
    const command = new GetRoleCommand({ RoleName: roleName });
    const data = await iamClient.send(command);
    expect(data.Role.Arn).toBe(outputs.rds_monitoring_role_arn);
  });

  it("KMS Key exists and is enabled", async () => {
    const command = new DescribeKeyCommand({ KeyId: outputs.kms_key_id });
    const data = await kmsClient.send(command);
    expect(data.KeyMetadata?.KeyId).toBe(outputs.kms_key_id);
    expect(data.KeyMetadata?.KeyState).toBe("Enabled");
  });


  it("Auto Scaling scaling policies exist", async () => {
    const command = new DescribePoliciesCommand({ AutoScalingGroupName: outputs.auto_scaling_group_name });
    const data = await asClient.send(command);
    const scaleUpExists = data.ScalingPolicies?.some(p => p.AdjustmentType === "ChangeInCapacity" && p.ScalingAdjustment === 1);
    const scaleDownExists = data.ScalingPolicies?.some(p => p.AdjustmentType === "ChangeInCapacity" && p.ScalingAdjustment === -1);
    expect(scaleUpExists).toBe(true);
    expect(scaleDownExists).toBe(true);
  });


  it("Target Group associated with ALB exists", async () => {
    const command = new DescribeTargetGroupsCommand({ TargetGroupArns: [outputs.target_group_arn] });
    const data = await elbv2Client.send(command);
    expect(data.TargetGroups?.length).toBe(1);
    expect(data.TargetGroups![0].VpcId).toBe(outputs.vpc_id);
  });

  it("Static S3 bucket exists and accessible", async () => {
    const command = new HeadBucketCommand({ Bucket: outputs.s3_static_bucket_name });
    const data = await s3Client.send(command);
    expect(data).toBeDefined();
  });

  it("Logs S3 bucket exists and accessible", async () => {
    const command = new HeadBucketCommand({ Bucket: outputs.s3_logs_bucket_name });
    const data = await s3Client.send(command);
    expect(data).toBeDefined();
  });

  it("Secrets Manager secret exists", async () => {
    const command = new DescribeSecretCommand({ SecretId: outputs.secrets_manager_secret_id });
    const data = await secretsClient.send(command);
    expect(data.ARN).toBe(outputs.secrets_manager_secret_id);
  });

  it("CloudWatch Application log group exists", async () => {
    const command = new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.cloudwatch_log_group_application });
    const data = await logsClient.send(command);
    expect(data.logGroups?.some(g => g.logGroupName === outputs.cloudwatch_log_group_application)).toBe(true);
  });

  it("CloudWatch RDS error log group exists", async () => {
    const command = new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.cloudwatch_log_group_rds_error });
    const data = await logsClient.send(command);
    expect(data.logGroups?.some(g => g.logGroupName === outputs.cloudwatch_log_group_rds_error)).toBe(true);
  });

});
