//int-tests.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand as ASGDescribeCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
} from "@aws-sdk/client-s3";

/** ===================== Types & Outputs Loader ===================== */

type TFVal<T> = { sensitive: boolean; type: unknown; value: T };

type OutputsFile = {
  vpc_id: TFVal<string>;
  load_balancer_dns: TFVal<string>;
  load_balancer_zone_id: TFVal<string>;
  load_balancer_name: TFVal<string>;
  load_balancer_arn: TFVal<string>;
  target_group_name: TFVal<string>;
  target_group_arn: TFVal<string>;
  s3_app_bucket_name: TFVal<string>;
  s3_log_bucket_name: TFVal<string>;
  autoscaling_group_name: TFVal<string>;
  security_group_alb_id: TFVal<string>;
  security_group_ec2_id: TFVal<string>;
  aws_region: TFVal<string>;
};

function loadOutputs() {
  const file =
    process.env.OUTPUTS_FILE ||
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(file)) throw new Error(`Outputs file not found at ${file}`);

  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as OutputsFile;

  const req = <K extends keyof OutputsFile>(k: K) => {
    const v = raw[k]?.value as any;
    if (v === undefined || v === null || v === "") {
      throw new Error(`Missing required output "${String(k)}" in ${file}`);
    }
    return v;
  };

  return {
    vpcId: req("vpc_id"),
    loadBalancerDns: req("load_balancer_dns"),
    loadBalancerZoneId: req("load_balancer_zone_id"),
    loadBalancerName: req("load_balancer_name"),
    loadBalancerArn: req("load_balancer_arn"),
    targetGroupName: req("target_group_name"),
    targetGroupArn: req("target_group_arn"),
    s3AppBucketName: req("s3_app_bucket_name"),
    s3LogBucketName: req("s3_log_bucket_name"),
    autoscalingGroupName: req("autoscaling_group_name"),
    securityGroupAlbId: req("security_group_alb_id"),
    securityGroupEc2Id: req("security_group_ec2_id"),
    awsRegion: req("aws_region"),
  };
}

/** ===================== AWS Clients ===================== */

let ec2Client: EC2Client;
let asgClient: AutoScalingClient;
let elbClient: ElasticLoadBalancingV2Client;
let s3Client: S3Client;
let outputs: ReturnType<typeof loadOutputs>;

beforeAll(() => {
  outputs = loadOutputs();
  
  ec2Client = new EC2Client({ region: outputs.awsRegion });
  asgClient = new AutoScalingClient({ region: outputs.awsRegion });
  elbClient = new ElasticLoadBalancingV2Client({ region: outputs.awsRegion });
  s3Client = new S3Client({ region: outputs.awsRegion });
});

/** ===================== Tests ===================== */

describe("Production AWS Infrastructure - Integration Tests", () => {
  
  describe("VPC and Networking", () => {
    test("VPC exists and has correct configuration", async () => {
      const cmd = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      
      const result = await ec2Client.send(cmd);
      expect(result.Vpcs).toHaveLength(1);
      
      const vpc = result.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test("public and private subnets exist across multiple AZs", async () => {
      const cmd = new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [outputs.vpcId] },
        ],
      });
      
      const result = await ec2Client.send(cmd);
      const subnets = result.Subnets || [];
      
      expect(subnets.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private
      
      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
      
      // Check AZ distribution
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP traffic", async () => {
      const cmd = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupAlbId],
      });
      
      const result = await ec2Client.send(cmd);
      expect(result.SecurityGroups).toHaveLength(1);
      
      const sg = result.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe("tcp");
    });

    test("EC2 security group allows traffic from ALB", async () => {
      const cmd = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupEc2Id],
      });
      
      const result = await ec2Client.send(cmd);
      expect(result.SecurityGroups).toHaveLength(1);
      
      const sg = result.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs).toBeDefined();
      expect(httpRule?.UserIdGroupPairs![0].GroupId).toBe(outputs.securityGroupAlbId);
    });
  });

  describe("Load Balancer", () => {
    test("ALB exists and is active", async () => {
      const cmd = new DescribeLoadBalancersCommand({
        Names: [outputs.loadBalancerName], // Use the actual ALB name from outputs
      });
      
      const result = await elbClient.send(cmd);
      expect(result.LoadBalancers).toHaveLength(1);
      
      const alb = result.LoadBalancers![0];
      expect(alb.State?.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
    });

    test("target group is configured correctly", async () => {
      const cmd = new DescribeTargetGroupsCommand({
        Names: [outputs.targetGroupName], // Use actual target group name from outputs
      });
      
      const result = await elbClient.send(cmd);
      expect(result.TargetGroups).toHaveLength(1);
      
      const tg = result.TargetGroups![0];
      expect(tg.Protocol).toBe("HTTP");
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckPath).toBe("/");
    });
  });

  describe("Auto Scaling Group", () => {
    test("ASG exists with correct configuration", async () => {
      const cmd = new ASGDescribeCommand({
        AutoScalingGroupNames: [outputs.autoscalingGroupName],
      });
      
      const result = await asgClient.send(cmd);
      expect(result.AutoScalingGroups).toHaveLength(1);
      
      const asg = result.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(10);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe("ELB");
    });
  });

  describe("S3 Buckets", () => {
    test("application bucket exists with versioning enabled", async () => {
      // Check bucket exists
      const headCmd = new HeadBucketCommand({
        Bucket: outputs.s3AppBucketName,
      });
      await s3Client.send(headCmd); // Will throw if bucket doesn't exist
      
      // Check versioning
      const versionCmd = new GetBucketVersioningCommand({
        Bucket: outputs.s3AppBucketName,
      });
      const versionResult = await s3Client.send(versionCmd);
      expect(versionResult.Status).toBe("Enabled");
    });

    test("log bucket exists and app bucket has logging configured", async () => {
      // Check log bucket exists
      const headCmd = new HeadBucketCommand({
        Bucket: outputs.s3LogBucketName,
      });
      await s3Client.send(headCmd);
      
      // Check app bucket has logging configured
      const loggingCmd = new GetBucketLoggingCommand({
        Bucket: outputs.s3AppBucketName,
      });
      const loggingResult = await s3Client.send(loggingCmd);
      expect(loggingResult.LoggingEnabled).toBeDefined();
      expect(loggingResult.LoggingEnabled?.TargetBucket).toBe(outputs.s3LogBucketName);
    });
  });

  describe("Resource Tagging", () => {
    test("VPC has Environment=Production tag", async () => {
      const cmd = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      
      const result = await ec2Client.send(cmd);
      const vpc = result.Vpcs![0];
      
      const envTag = vpc.Tags?.find(tag => tag.Key === "Environment");
      expect(envTag?.Value).toBe("Production");
    });
  });

});
