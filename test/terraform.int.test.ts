import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

const awsRegion = 'us-east-1'; // region fixed as per variables default and outputs
AWS.config.update({ region: awsRegion });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const iam = new AWS.IAM();
const cloudwatch = new AWS.CloudWatch();
const logs = new AWS.CloudWatchLogs();
const rds = new AWS.RDS();
const elbv2 = new AWS.ELBv2();
const autoscaling = new AWS.AutoScaling();
const secretsmanager = new AWS.SecretsManager();

describe("TAP Stack Integration Tests (Full Stack)", () => {

  // -------------------------
  // VPC TESTS
  // -------------------------
  it("VPC exists with correct CIDR", async () => {
    const vpcResp = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcResp.Vpcs?.length).toBe(1);
    expect(vpcResp.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it("Internet Gateway attached to VPC", async () => {
    const igwResp = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    const attachment = igwResp.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe("available");
  });

  it("Public and Private subnets exist and belong to the VPC", async () => {
    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);
    const dbSubnetIds: string[] = JSON.parse(outputs.database_subnet_ids);

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    const dbSubnets = await ec2.describeSubnets({ SubnetIds: dbSubnetIds }).promise();

    publicSubnets.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
    privateSubnets.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
    dbSubnets.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
  });

  it("NAT Gateways exist and are available", async () => {
    const natGatewayIds: string[] = JSON.parse(outputs.nat_gateway_ids);
    const natResponse = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natResponse.NatGateways?.length).toBe(natGatewayIds.length);
    const allAvailable = natResponse.NatGateways?.every(n => n.State === "available");
    expect(allAvailable).toBe(true);
  });

  // -------------------------
  // SECURITY GROUPS
  // -------------------------
  it("ALB Security Group exists", async () => {
    const sgResp = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_alb_id] }).promise();
    expect(sgResp.SecurityGroups?.length).toBe(1);
    // Check inbound rules allow 80 and 443 TCP from 0.0.0.0/0
    const sg = sgResp.SecurityGroups![0];
    const hasHttpIngress = sg.IpPermissions?.some(p => p.FromPort === 80 && p.ToPort === 80 && p.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0"));
    const hasHttpsIngress = sg.IpPermissions?.some(p => p.FromPort === 443 && p.ToPort === 443 && p.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0"));
    expect(hasHttpIngress).toBe(true);
    expect(hasHttpsIngress).toBe(true);
  });

  it("EC2 Security Group exists and allows inbound from ALB SG", async () => {
    const sgResp = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_ec2_id] }).promise();
    expect(sgResp.SecurityGroups?.length).toBe(1);
    const sg = sgResp.SecurityGroups![0];
    // Expect ingress on port 80 from ALB SG ID
    const ingressFromAlb = sg.IpPermissions?.some(p =>
      p.FromPort === 80 && p.ToPort === 80 &&
      p.UserIdGroupPairs?.some(gp => gp.GroupId === outputs.security_group_alb_id)
    );
    expect(ingressFromAlb).toBe(true);
  });

  it("RDS Security Group exists and allows port 3306 from EC2 SG", async () => {
    const sgResp = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_rds_id] }).promise();
    expect(sgResp.SecurityGroups?.length).toBe(1);
    const sg = sgResp.SecurityGroups![0];
    const ingressFromEc2 = sg.IpPermissions?.some(p =>
      p.FromPort === 3306 && p.ToPort === 3306 &&
      p.UserIdGroupPairs?.some(gp => gp.GroupId === outputs.security_group_ec2_id)
    );
    expect(ingressFromEc2).toBe(true);
  });

  // -------------------------
  // IAM ROLE AND POLICIES
  // -------------------------
  it("EC2 IAM Role exists with correct ARN", async () => {
    const roleName = outputs.ec2_iam_role_arn.split('/').pop()!;
    const roleResp = await iam.getRole({ RoleName: roleName }).promise();
    expect(roleResp.Role.Arn).toBe(outputs.ec2_iam_role_arn);
  });

  it("EC2 Instance Profile exists", async () => {
    const instanceProfileName = outputs.ec2_instance_profile_arn.split('/').pop()!;
    const profileResp = await iam.getInstanceProfile({ InstanceProfileName: instanceProfileName }).promise();
    expect(profileResp.InstanceProfile.Arn).toBe(outputs.ec2_instance_profile_arn);
  });

  it("RDS Monitoring IAM Role exists", async () => {
    const rdsRoleName = outputs.rds_monitoring_role_arn.split('/').pop()!;
    const roleResp = await iam.getRole({ RoleName: rdsRoleName }).promise();
    expect(roleResp.Role.Arn).toBe(outputs.rds_monitoring_role_arn);
  });

  // -------------------------
  // KMS KEY
  // -------------------------
  it("KMS Key exists and is enabled", async () => {
    const keyResp = await new AWS.KMS().describeKey({ KeyId: outputs.kms_key_id }).promise();
    expect(keyResp.KeyMetadata?.KeyId).toBe(outputs.kms_key_id);
    expect(keyResp.KeyMetadata?.KeyState).toBe("Enabled");
  });

  // -------------------------
  // RDS CLUSTER AND INSTANCES
  // -------------------------
  it("RDS Cluster exists with correct identifier and endpoint", async () => {
    const clusters = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_identifier }).promise();
    expect(clusters.DBClusters?.length).toBe(1);
    const cluster = clusters.DBClusters![0];
    expect(cluster.DBClusterIdentifier).toBe(outputs.rds_cluster_identifier);
    expect(cluster.Endpoint).toBe(outputs.rds_cluster_endpoint);
  });

  it("RDS Instances exist", async () => {
    const instances = await rds.describeDBInstances({ Filters: [{ Name: "db-cluster-id", Values: [outputs.rds_cluster_identifier] }] }).promise();
    expect(instances.DBInstances?.length).toBeGreaterThanOrEqual(1);
    instances.DBInstances?.forEach(instance => {
      expect(instance.DBInstanceStatus).toMatch(/available|creating|modifying|backing-up/);
      expect(instance.DBInstanceIdentifier).toContain(outputs.resource_suffix);
    });
  });

  // -------------------------
  // AUTO SCALING GROUP AND POLICIES
  // -------------------------
  it("Auto Scaling Group exists with correct name and desired capacity", async () => {
    const asgs = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.auto_scaling_group_name] }).promise();
    expect(asgs.AutoScalingGroups?.length).toBe(1);
    const asg = asgs.AutoScalingGroups![0];
    expect(asg.AutoScalingGroupName).toBe(outputs.auto_scaling_group_name);
    expect(asg.DesiredCapacity).toBeGreaterThan(0);
  });

  it("Auto Scaling scaling policies exist", async () => {
    const policies = await autoscaling.describePolicies({ AutoScalingGroupName: outputs.auto_scaling_group_name }).promise();
    expect(policies.ScalingPolicies?.some(p => p.AdjustmentType === "ChangeInCapacity" && p.ScalingAdjustment === 1)).toBe(true);
    expect(policies.ScalingPolicies?.some(p => p.AdjustmentType === "ChangeInCapacity" && p.ScalingAdjustment === -1)).toBe(true);
  });

  // -------------------------
  // LOAD BALANCER AND TARGET GROUP
  // -------------------------
  it("ALB exists with correct DNS name and ARN", async () => {
    const lbs = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.alb_arn] }).promise();
    expect(lbs.LoadBalancers?.length).toBe(1);
    const alb = lbs.LoadBalancers![0];
    expect(alb.DNSName).toBe(outputs.alb_dns_name);
    expect(alb.LoadBalancerArn).toBe(outputs.alb_arn);
  });

  it("Target Group associated with ALB exists", async () => {
    const tg = await elbv2.describeTargetGroups({ TargetGroupArns: [outputs.target_group_arn] }).promise();
    expect(tg.TargetGroups?.length).toBe(1);
    expect(tg.TargetGroups![0].VpcId).toBe(outputs.vpc_id);
  });

  // -------------------------
  // S3 BUCKETS
  // -------------------------
  it("Static S3 bucket exists and accessible", async () => {
    const bucketName = outputs.s3_static_bucket_name;
    const headResp = await s3.headBucket({ Bucket: bucketName }).promise();
    expect(headResp).toBeDefined();
  });

  it("Logs S3 bucket exists and accessible", async () => {
    const bucketName = outputs.s3_logs_bucket_name;
    const headResp = await s3.headBucket({ Bucket: bucketName }).promise();
    expect(headResp).toBeDefined();
  });

  // -------------------------
  // SECRETS MANAGER
  // -------------------------
  it("Secrets Manager secret exists", async () => {
    const secretId = outputs.secrets_manager_secret_id;
    const secretResp = await secretsmanager.describeSecret({ SecretId: secretId }).promise();
    expect(secretResp.ARN).toBe(secretId);
  });

  // -------------------------
  // CLOUDWATCH LOG GROUPS
  // -------------------------
  it("CloudWatch Application log group exists", async () => {
    const logsResp = await logs.describeLogGroups({ logGroupNamePrefix: outputs.cloudwatch_log_group_application }).promise();
    expect(logsResp.logGroups?.some(g => g.logGroupName === outputs.cloudwatch_log_group_application)).toBe(true);
  });

  it("CloudWatch RDS error log group exists", async () => {
    const logsResp = await logs.describeLogGroups({ logGroupNamePrefix: outputs.cloudwatch_log_group_rds_error }).promise();
    expect(logsResp.logGroups?.some(g => g.logGroupName === outputs.cloudwatch_log_group_rds_error)).toBe(true);
  });
});
