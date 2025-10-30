import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { DescribeLaunchTemplatesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { RDSClient } from "@aws-sdk/client-rds";
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim()) || /^arn:aws:[^:]+:[^:]*:[0-9]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSecurityGroupId = (v: string) => v.startsWith("sg-");
const isValidLaunchTemplateId = (v: string) => v.startsWith("lt-");
const isValidUrl = (v: string) => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
const isValidCidr = (v: string) => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidKmsKeyId = (v: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const isValidDnsName = (v: string) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) && !v.includes(" ");

const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};

const parseObject = (v: any) => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Healthcare Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }

    // Extract region from ARN or other region-specific outputs
    const arnOutput = Object.values(outputs).find((v: any) =>
      typeof v === "string" && v.startsWith("arn:aws:")
    ) as string;

    if (arnOutput) {
      region = arnOutput.split(":")[3];
    } else {
      throw new Error("Could not determine AWS region from outputs");
    }
  });

  describe("Output Structure Validation", () => {
    it("should have essential infrastructure outputs", () => {
      const requiredOutputs = [
        "vpc_id", "vpc_cidr_block", "public_subnet_ids", "private_subnet_ids",
        "alb_dns_name", "alb_arn", "application_url"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should not expose sensitive information", () => {
      const sensitivePatterns = [
        /password/i, /secret/i, /private_key/i, /access_key/i,
        /session_token/i, /credentials/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe("VPC Infrastructure", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates VPC configuration", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      expect(isValidVpcId(outputs.vpc_id)).toBe(true);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");

      if (!skipIfMissing("vpc_cidr_block", outputs)) {
        expect(isValidCidr(outputs.vpc_cidr_block)).toBe(true);
        expect(vpc.CidrBlock).toBe(outputs.vpc_cidr_block);
      }
    });

    it("validates public subnet configuration", async () => {
      if (skipIfMissing("public_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThan(0);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it("validates private subnet configuration", async () => {
      if (skipIfMissing("private_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThan(0);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it("validates database subnet configuration", async () => {
      if (skipIfMissing("database_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.database_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      const availabilityZones = new Set(
        response.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    it("validates availability zones", () => {
      if (skipIfMissing("availability_zones", outputs)) return;

      const azs = parseArray(outputs.availability_zones);
      expect(Array.isArray(azs)).toBe(true);
      expect(azs.length).toBeGreaterThanOrEqual(2);

      azs.forEach((az: string) => {
        expect(az).toMatch(new RegExp(`^${region}[a-z]$`));
      });
    });
  });

  describe("Security Groups", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates ALB security group", async () => {
      if (skipIfMissing("alb_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.alb_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.alb_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const httpRule = sg.IpPermissions!.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
    });

    it("validates EC2 security group", async () => {
      if (skipIfMissing("ec2_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ec2_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);
    });

    it("validates RDS security group", async () => {
      if (skipIfMissing("rds_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.rds_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rds_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Check for PostgreSQL port 5432 (default database engine)
      const postgresRule = sg.IpPermissions!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );

      // Should have PostgreSQL port rule
      expect(postgresRule).toBeDefined();

      // Verify the rule allows access from within VPC (not from 0.0.0.0/0)
      if (postgresRule) {
        const hasVpcAccess = postgresRule.IpRanges?.some((range: any) =>
          range.CidrIp && !range.CidrIp.includes("0.0.0.0/0")
        ) || postgresRule.UserIdGroupPairs?.length && postgresRule.UserIdGroupPairs.length > 0;
        expect(hasVpcAccess).toBe(true);
      }
    });
  });

  describe("Load Balancer", () => {
    let elbv2Client: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbv2Client = new ElasticLoadBalancingV2Client({ region });
    });

    it("validates ALB configuration", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      expect(isValidArn(outputs.alb_arn)).toBe(true);
      expect(outputs.alb_arn).toContain("loadbalancer/app/");

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn]
      });

      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.VpcId).toBe(outputs.vpc_id);

      if (!skipIfMissing("alb_dns_name", outputs)) {
        expect(isValidDnsName(outputs.alb_dns_name)).toBe(true);
        expect(alb.DNSName).toBe(outputs.alb_dns_name);
      }

      if (!skipIfMissing("alb_zone_id", outputs)) {
        expect(alb.CanonicalHostedZoneId).toBe(outputs.alb_zone_id);
      }
    });

    it("validates target group configuration", async () => {
      if (skipIfMissing("target_group_arn", outputs)) return;

      expect(isValidArn(outputs.target_group_arn)).toBe(true);
      expect(outputs.target_group_arn).toContain("targetgroup/");

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.target_group_arn]
      });

      const response = await elbv2Client.send(command);
      expect(response.TargetGroups).toHaveLength(1);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe("HTTP");
      expect(tg.Port).toBe(80);
      expect(tg.VpcId).toBe(outputs.vpc_id);
      expect(tg.HealthCheckPath).toBeDefined();
    });

    it("validates application URL accessibility", () => {
      if (skipIfMissing("application_url", outputs)) return;

      expect(isValidUrl(outputs.application_url)).toBe(true);
      expect(outputs.application_url).toMatch(/^http:\/\//);

      if (!skipIfMissing("alb_dns_name", outputs)) {
        expect(outputs.application_url).toContain(outputs.alb_dns_name);
      }
    });
  });

  describe("Auto Scaling", () => {
    let autoScalingClient: AutoScalingClient;
    let ec2Client: EC2Client;

    beforeAll(() => {
      autoScalingClient = new AutoScalingClient({ region });
      ec2Client = new EC2Client({ region });
    });

    it("validates Auto Scaling Group", async () => {
      if (skipIfMissing("autoscaling_group_name", outputs)) return;

      expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);

      expect(asg.VPCZoneIdentifier).toBeDefined();
      const subnetIds = asg.VPCZoneIdentifier!.split(",");

      if (!skipIfMissing("private_subnet_ids", outputs)) {
        const privateSubnets = parseArray(outputs.private_subnet_ids);
        subnetIds.forEach(subnetId => {
          expect(privateSubnets).toContain(subnetId.trim());
        });
      }
    });

    it("validates Launch Template", async () => {
      if (skipIfMissing("launch_template_id", outputs)) return;

      expect(isValidLaunchTemplateId(outputs.launch_template_id)).toBe(true);

      const command = new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [outputs.launch_template_id]
      });

      const response = await ec2Client.send(command);
      expect(response.LaunchTemplates).toHaveLength(1);

      const lt = response.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toBeDefined();
      expect(lt.DefaultVersionNumber).toBeGreaterThan(0);
    });
  });

  describe("Database", () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it("validates database configuration", () => {
      if (skipIfMissing("database_name", outputs)) return;

      expect(isNonEmptyString(outputs.database_name)).toBe(true);
      expect(outputs.database_name).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });

    it("validates database username", () => {
      if (skipIfMissing("database_username", outputs)) return;

      expect(isNonEmptyString(outputs.database_username)).toBe(true);
      expect(outputs.database_username).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });
  });

  describe("KMS Encryption", () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    it("validates KMS key configuration", async () => {
      if (skipIfMissing("kms_key_id", outputs)) return;

      expect(isValidKmsKeyId(outputs.kms_key_id)).toBe(true);

      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe("Enabled");
      expect(response.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");

      if (!skipIfMissing("kms_key_arn", outputs)) {
        expect(isValidArn(outputs.kms_key_arn)).toBe(true);
        expect(response.KeyMetadata!.Arn).toBe(outputs.kms_key_arn);
      }
    });
  });

  describe("CloudWatch Monitoring", () => {
    let cloudWatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    });

    it("validates CloudWatch log group", async () => {
      if (skipIfMissing("cloudwatch_log_group_name", outputs)) return;

      expect(isNonEmptyString(outputs.cloudwatch_log_group_name)).toBe(true);

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName === outputs.cloudwatch_log_group_name
      );

      expect(logGroup).toBeDefined();
      expect(logGroup!.logGroupName).toBe(outputs.cloudwatch_log_group_name);
    });
  });

  describe("Environment Configuration", () => {
    it("validates environment configuration object", () => {
      if (skipIfMissing("environment_config", outputs)) return;

      const config = parseObject(outputs.environment_config);
      expect(typeof config).toBe("object");
      expect(config).toHaveProperty("environment");
      expect(config).toHaveProperty("vpc_cidr");
      expect(config).toHaveProperty("instance_type");
      expect(config).toHaveProperty("workspace");

      expect(isNonEmptyString(config.environment)).toBe(true);
      expect(isValidCidr(config.vpc_cidr)).toBe(true);
      expect(isNonEmptyString(config.instance_type)).toBe(true);
      expect(isNonEmptyString(config.workspace)).toBe(true);

      if (!skipIfMissing("vpc_cidr_block", outputs)) {
        expect(config.vpc_cidr).toBe(outputs.vpc_cidr_block);
      }
    });
  });

  describe("Cross-Service Integration", () => {
    it("validates subnet distribution across availability zones", () => {
      if (skipIfMissing("availability_zones", outputs) ||
        skipIfMissing("public_subnet_ids", outputs) ||
        skipIfMissing("private_subnet_ids", outputs)) return;

      const azs = parseArray(outputs.availability_zones);
      const publicSubnets = parseArray(outputs.public_subnet_ids);
      const privateSubnets = parseArray(outputs.private_subnet_ids);

      // Validate that we have at least 2 subnets for high availability
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBeLessThanOrEqual(azs.length);
      expect(privateSubnets.length).toBeLessThanOrEqual(azs.length);

      // Public and private subnets should have the same count
      expect(publicSubnets.length).toBe(privateSubnets.length);

      if (!skipIfMissing("database_subnet_ids", outputs)) {
        const dbSubnets = parseArray(outputs.database_subnet_ids);
        expect(dbSubnets.length).toBeGreaterThanOrEqual(2);
        expect(dbSubnets.length).toBeLessThanOrEqual(azs.length);
      }
    });

    it("validates resource naming consistency", () => {
      const namePattern = /healthcare.*app.*dev/i;

      if (!skipIfMissing("autoscaling_group_name", outputs)) {
        expect(outputs.autoscaling_group_name).toMatch(namePattern);
      }

      if (!skipIfMissing("alb_dns_name", outputs)) {
        expect(outputs.alb_dns_name).toMatch(namePattern);
      }

      if (!skipIfMissing("cloudwatch_log_group_name", outputs)) {
        expect(outputs.cloudwatch_log_group_name).toMatch(/healthcare.*app.*dev/i);
      }
    });

    it("validates region consistency across resources", () => {
      const arnOutputs = Object.entries(outputs)
        .filter(([_, value]) => typeof value === "string" && value.startsWith("arn:aws:"))
        .map(([_, value]) => value as string);

      expect(arnOutputs.length).toBeGreaterThan(0);

      // Filter ARNs that should have a region (exclude global services like IAM)
      const regionalArns = arnOutputs.filter(arn => {
        const parts = arn.split(":");
        const service = parts[2];
        const arnRegion = parts[3];

        // Skip global services that don't have regions
        const globalServices = ["iam", "route53", "cloudfront", "waf", "wafv2"];
        if (globalServices.includes(service)) return false;

        // Only check ARNs that have a region specified
        return arnRegion && arnRegion.length > 0;
      });

      expect(regionalArns.length).toBeGreaterThan(0);

      regionalArns.forEach(arn => {
        const arnRegion = arn.split(":")[3];
        expect(arnRegion).toBe(region);
      });
    });
  });
});