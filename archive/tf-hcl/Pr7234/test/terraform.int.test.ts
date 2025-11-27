import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { DescribeLaunchTemplatesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { DescribeDBClustersCommand, DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetBucketEncryptionCommand, GetBucketLocationCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, S3Client } from "@aws-sdk/client-s3";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:.+$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSecurityGroupId = (v: string) => v.startsWith("sg-");
const isValidLaunchTemplateId = (v: string) => v.startsWith("lt-");
const isValidUrl = (v: string) => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
const isValidCidr = (v: string) => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
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

describe("Multi-Region Trading Platform Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;

  beforeAll(() => {
    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};
    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }

    if (!skipIfMissing("region", outputs)) {
      region = outputs.region;
    } else {
      const arnOutput = Object.values(outputs).find((v: any) =>
        typeof v === "string" && v.startsWith("arn:aws:")
      ) as string;

      if (arnOutput) {
        region = arnOutput.split(":")[3];
      } else {
        throw new Error("Could not determine AWS region from outputs");
      }
    }
  });

  describe("Output Structure Validation", () => {
    it("should have essential infrastructure outputs", () => {
      const requiredOutputs = [
        "vpc_id", "vpc_cidr", "public_subnet_ids", "private_subnet_ids",
        "alb_dns_name", "alb_arn", "alb_endpoint", "region"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should have database outputs", () => {
      const databaseOutputs = [
        "rds_cluster_endpoint", "rds_cluster_reader_endpoint",
        "rds_cluster_id", "rds_cluster_database_name"
      ];

      databaseOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should have S3 bucket outputs", () => {
      const s3Outputs = ["s3_bucket_name", "s3_bucket_arn", "s3_bucket_region"];

      s3Outputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it("should have deployment summary", () => {
      expect(outputs).toHaveProperty("deployment_summary");
      const summary = parseObject(outputs.deployment_summary);
      expect(summary).toHaveProperty("region");
      expect(summary).toHaveProperty("vpc_id");
      expect(summary).toHaveProperty("load_balancer");
      expect(summary).toHaveProperty("database");
      expect(summary).toHaveProperty("compute");
      expect(summary).toHaveProperty("storage");
    });

    it("should not expose sensitive database credentials", () => {
      const sensitiveKeys = Object.keys(outputs).filter(key =>
        /password|private_key|access_key|session_token/i.test(key)
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe("Region Validation", () => {
    it("validates region output", () => {
      if (skipIfMissing("region", outputs)) return;

      expect(isNonEmptyString(outputs.region)).toBe(true);
      expect(outputs.region).toMatch(/^(us|eu|ap|ca|sa|af|me)-(east|west|south|north|central|northeast|southeast|northwest|southwest)-\d+$/);
    });

    it("validates region consistency in deployment summary", () => {
      if (skipIfMissing("deployment_summary", outputs)) return;

      const summary = parseObject(outputs.deployment_summary);
      expect(summary.region).toBe(region);
    });

    it("validates availability zones match region", () => {
      if (skipIfMissing("availability_zones", outputs)) return;

      const azs = parseArray(outputs.availability_zones);
      expect(Array.isArray(azs)).toBe(true);
      expect(azs.length).toBe(3);

      azs.forEach((az: string) => {
        expect(az).toMatch(new RegExp(`^${region}[a-z]$`));
      });
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
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");

      if (!skipIfMissing("vpc_cidr", outputs)) {
        expect(isValidCidr(outputs.vpc_cidr)).toBe(true);
        expect(vpc.CidrBlock).toBe(outputs.vpc_cidr);
      }
    });

    it("validates VPC CIDR block is non-overlapping", () => {
      if (skipIfMissing("vpc_cidr", outputs)) return;

      const cidr = outputs.vpc_cidr;
      expect(cidr).toMatch(/^10\.[0-2]\.0\.0\/16$/);

      if (region === "us-east-1") {
        expect(cidr).toBe("10.0.0.0/16");
      } else if (region === "eu-west-1") {
        expect(cidr).toBe("10.1.0.0/16");
      } else if (region === "ap-southeast-1") {
        expect(cidr).toBe("10.2.0.0/16");
      }
    });

    it("validates public subnets configuration", async () => {
      if (skipIfMissing("public_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(3);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it("validates private subnets configuration", async () => {
      if (skipIfMissing("private_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(3);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it("validates database subnets configuration", async () => {
      if (skipIfMissing("database_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.database_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(3);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe("Security Groups", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates ALB security group allows HTTPS from internet", async () => {
      if (skipIfMissing("alb_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.alb_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.alb_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const httpsRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();

      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
    });

    it("validates EC2 security group only allows traffic from ALB", async () => {
      if (skipIfMissing("ec2_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.ec2_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ec2_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const hasSourceGroupRestriction = sg.IpPermissions?.some(rule =>
        rule.UserIdGroupPairs && rule.UserIdGroupPairs.length > 0 &&
        rule.UserIdGroupPairs.some(pair => pair.GroupId === outputs.alb_security_group_id)
      );

      expect(hasSourceGroupRestriction).toBe(true);
    });

    it("validates RDS security group only allows traffic from EC2", async () => {
      if (skipIfMissing("rds_security_group_id", outputs)) return;

      expect(isValidSecurityGroupId(outputs.rds_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rds_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const postgresRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(postgresRule).toBeDefined();

      const hasEc2SourceGroup = postgresRule?.UserIdGroupPairs?.some(
        pair => pair.GroupId === outputs.ec2_security_group_id
      );

      expect(hasEc2SourceGroup).toBe(true);

      const hasPublicAccess = postgresRule?.IpRanges?.some(
        range => range.CidrIp === "0.0.0.0/0"
      );
      expect(hasPublicAccess).toBe(false);
    });
  });

  describe("Application Load Balancer", () => {
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
      expect(response.LoadBalancers).toBeDefined();
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

      expect(alb.AvailabilityZones?.length).toBe(3);
    });

    it("validates ALB is in public subnets", async () => {
      if (skipIfMissing("alb_arn", outputs) || skipIfMissing("public_subnet_ids", outputs)) return;

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn]
      });

      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers).toBeDefined();
      const alb = response.LoadBalancers![0];

      const publicSubnets = parseArray(outputs.public_subnet_ids);
      const albSubnets = alb.AvailabilityZones?.map(az => az.SubnetId);

      expect(albSubnets).toBeDefined();
      albSubnets!.forEach(subnetId => {
        expect(publicSubnets).toContain(subnetId);
      });
    });

    it("validates ALB endpoint URL format", () => {
      if (skipIfMissing("alb_endpoint", outputs)) return;

      expect(isValidUrl(outputs.alb_endpoint)).toBe(true);
      expect(outputs.alb_endpoint).toMatch(/^http:\/\//);

      if (!skipIfMissing("alb_dns_name", outputs)) {
        expect(outputs.alb_endpoint).toContain(outputs.alb_dns_name);
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

    it("validates Auto Scaling Group configuration", async () => {
      if (skipIfMissing("autoscaling_group_name", outputs)) return;

      expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.DesiredCapacity!).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity!).toBeLessThanOrEqual(asg.MaxSize!);

      expect(asg.HealthCheckType).toBe("ELB");
    });

    it("validates ASG uses private subnets", async () => {
      if (skipIfMissing("autoscaling_group_name", outputs) || skipIfMissing("private_subnet_ids", outputs)) return;

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      const asg = response.AutoScalingGroups![0];

      expect(asg.VPCZoneIdentifier).toBeDefined();
      const subnetIds = asg.VPCZoneIdentifier!.split(",").map(s => s.trim());

      const privateSubnets = parseArray(outputs.private_subnet_ids);
      subnetIds.forEach(subnetId => {
        expect(privateSubnets).toContain(subnetId);
      });
    });

    it("validates Launch Template", async () => {
      if (skipIfMissing("launch_template_id", outputs)) return;

      expect(isValidLaunchTemplateId(outputs.launch_template_id)).toBe(true);

      const command = new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [outputs.launch_template_id]
      });

      const response = await ec2Client.send(command);
      expect(response.LaunchTemplates).toBeDefined();
      expect(response.LaunchTemplates).toHaveLength(1);

      const lt = response.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toBeDefined();
      expect(lt.DefaultVersionNumber).toBeGreaterThan(0);
    });

    it("validates ASG has proper tagging", async () => {
      if (skipIfMissing("autoscaling_group_name", outputs)) return;

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      const asg = response.AutoScalingGroups![0];

      expect(asg.Tags).toBeDefined();
      expect(asg.Tags!.length).toBeGreaterThan(0);

      const requiredTags = ["Environment", "Region", "ManagedBy"];
      requiredTags.forEach(tagKey => {
        const tag = asg.Tags!.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
      });
    });
  });

  describe("RDS Aurora Database", () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it("validates Aurora cluster configuration", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      expect(isNonEmptyString(outputs.rds_cluster_id)).toBe(true);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe("available");
      expect(cluster.Engine).toBe("aurora-postgresql");
      expect(cluster.EngineVersion).toMatch(/^15\./);
      expect(cluster.DatabaseName).toBe("trading");

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);

      if (!skipIfMissing("rds_cluster_endpoint", outputs)) {
        expect(cluster.Endpoint).toBe(outputs.rds_cluster_endpoint);
      }

      if (!skipIfMissing("rds_cluster_reader_endpoint", outputs)) {
        expect(cluster.ReaderEndpoint).toBe(outputs.rds_cluster_reader_endpoint);
      }
    });

    it("validates Aurora cluster instances", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: "db-cluster-id",
            Values: [outputs.rds_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(3);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe("available");
        expect(instance.Engine).toBe("aurora-postgresql");
        expect(instance.DBInstanceClass).toBe("db.t3.medium");
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.MonitoringInterval).toBe(60);
      });

      const azs = new Set(response.DBInstances!.map(i => i.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it("validates database name and port", () => {
      if (skipIfMissing("rds_cluster_database_name", outputs)) return;

      expect(outputs.rds_cluster_database_name).toBe("trading");

      if (!skipIfMissing("rds_cluster_port", outputs)) {
        expect(parseInt(outputs.rds_cluster_port)).toBe(5432);
      }
    });

    it("validates RDS instance endpoints", () => {
      if (skipIfMissing("rds_instance_endpoints", outputs)) return;

      const endpoints = parseArray(outputs.rds_instance_endpoints);
      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints.length).toBe(3);

      endpoints.forEach((endpoint: string) => {
        expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
        expect(endpoint).toContain(region);
      });
    });
  });

  describe("Secrets Manager", () => {
    let secretsClient: SecretsManagerClient;

    beforeAll(() => {
      secretsClient = new SecretsManagerClient({ region });
    });

    it("validates database credentials secret", async () => {
      if (skipIfMissing("db_credentials_secret_arn", outputs)) return;

      // Check if the ARN is a valid string before validating format
      expect(typeof outputs.db_credentials_secret_arn).toBe("string");
      expect(outputs.db_credentials_secret_arn.trim()).toBeTruthy();
      expect(isValidArn(outputs.db_credentials_secret_arn)).toBe(true);
      expect(outputs.db_credentials_secret_arn).toContain("secretsmanager");

      const command = new DescribeSecretCommand({
        SecretId: outputs.db_credentials_secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.db_credentials_secret_arn);

      if (!skipIfMissing("db_credentials_secret_name", outputs)) {
        expect(response.Name).toBe(outputs.db_credentials_secret_name);
      }
    });

    it("validates secret name format", () => {
      if (skipIfMissing("db_credentials_secret_name", outputs)) return;

      expect(outputs.db_credentials_secret_name).toMatch(/trading.*db.*credentials/i);
      expect(outputs.db_credentials_secret_name).toContain(region);
    });
  });

  describe("KMS Encryption", () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    it("validates KMS key for RDS encryption", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters![0];

      expect(cluster.KmsKeyId).toBeDefined();
      expect(cluster.KmsKeyId).toMatch(/^arn:aws:kms:/);

      const kmsCommand = new DescribeKeyCommand({
        KeyId: cluster.KmsKeyId
      });

      const kmsResponse = await kmsClient.send(kmsCommand);

      expect(kmsResponse.KeyMetadata).toBeDefined();
      expect(kmsResponse.KeyMetadata!.KeyState).toBe("Enabled");
      expect(kmsResponse.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(kmsResponse.KeyMetadata!.KeySpec).toBe("SYMMETRIC_DEFAULT");
    });
  });

  describe("S3 Storage", () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    it("validates S3 bucket configuration", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      expect(isNonEmptyString(outputs.s3_bucket_name)).toBe(true);
      expect(outputs.s3_bucket_name).toContain("trading-data");
      expect(outputs.s3_bucket_name).toContain(region);

      const locationCommand = new GetBucketLocationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const locationResponse = await s3Client.send(locationCommand);
      const bucketRegion = locationResponse.LocationConstraint || "us-east-1";
      expect(bucketRegion).toBe(region === "us-east-1" ? "us-east-1" : region);
    });

    it("validates S3 bucket versioning is enabled", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    it("validates S3 bucket encryption", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("AES256");
    });

    it("validates S3 bucket public access is blocked", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    it("validates S3 bucket ARN format", () => {
      if (skipIfMissing("s3_bucket_arn", outputs)) return;

      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.s3_bucket_arn).toContain(outputs.s3_bucket_name);
    });
  });

  describe("CloudWatch Logging", () => {
    let cloudWatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    });

    it("validates application log group exists", async () => {
      const logGroupName = `/aws/${region}-trading/application`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });

    it("validates ALB log group exists", async () => {
      const logGroupName = `/aws/${region}-trading/alb`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });
  });

  describe("Cross-Service Integration", () => {
    it("validates subnet distribution across availability zones", () => {
      if (skipIfMissing("availability_zones", outputs) ||
        skipIfMissing("public_subnet_ids", outputs) ||
        skipIfMissing("private_subnet_ids", outputs) ||
        skipIfMissing("database_subnet_ids", outputs)) return;

      const azs = parseArray(outputs.availability_zones);
      const publicSubnets = parseArray(outputs.public_subnet_ids);
      const privateSubnets = parseArray(outputs.private_subnet_ids);
      const dbSubnets = parseArray(outputs.database_subnet_ids);

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
      expect(dbSubnets.length).toBe(3);

      expect(publicSubnets.length).toBe(azs.length);
      expect(privateSubnets.length).toBe(azs.length);
      expect(dbSubnets.length).toBe(azs.length);
    });

    it("validates resource naming consistency with region", () => {
      const namePattern = new RegExp(`${region}.*trading`);

      if (!skipIfMissing("autoscaling_group_name", outputs)) {
        expect(outputs.autoscaling_group_name).toMatch(namePattern);
      }

      if (!skipIfMissing("s3_bucket_name", outputs)) {
        expect(outputs.s3_bucket_name).toMatch(namePattern);
      }

      if (!skipIfMissing("rds_cluster_id", outputs)) {
        expect(outputs.rds_cluster_id).toMatch(namePattern);
      }
    });

    it("validates region consistency across all ARN outputs", () => {
      const arnOutputs = Object.entries(outputs)
        .filter(([_, value]) => typeof value === "string" && value.startsWith("arn:aws:"))
        .map(([_, value]) => value as string);

      expect(arnOutputs.length).toBeGreaterThan(0);

      const regionalArns = arnOutputs.filter(arn => {
        const parts = arn.split(":");
        const service = parts[2];
        const arnRegion = parts[3];

        const globalServices = ["iam", "s3", "route53", "cloudfront"];
        if (globalServices.includes(service)) return false;

        return arnRegion && arnRegion.length > 0;
      });

      expect(regionalArns.length).toBeGreaterThan(0);

      regionalArns.forEach(arn => {
        const arnRegion = arn.split(":")[3];
        expect(arnRegion).toBe(region);
      });
    });

    it("validates deployment summary structure", () => {
      if (skipIfMissing("deployment_summary", outputs)) return;

      const summary = parseObject(outputs.deployment_summary);

      expect(summary.region).toBe(region);
      expect(summary.vpc_id).toBe(outputs.vpc_id);
      expect(summary.vpc_cidr).toBe(outputs.vpc_cidr);

      expect(summary.load_balancer).toBeDefined();
      expect(summary.load_balancer.dns_name).toBe(outputs.alb_dns_name);
      expect(summary.load_balancer.endpoint).toBe(outputs.alb_endpoint);

      expect(summary.database).toBeDefined();
      expect(summary.database.cluster_endpoint).toBe(outputs.rds_cluster_endpoint);
      expect(summary.database.reader_endpoint).toBe(outputs.rds_cluster_reader_endpoint);
      expect(summary.database.database_name).toBe("trading");
      expect(summary.database.port).toBe(5432);

      expect(summary.storage).toBeDefined();
      expect(summary.storage.bucket_name).toBe(outputs.s3_bucket_name);

      expect(summary.compute).toBeDefined();
      expect(summary.compute.autoscaling_group).toBe(outputs.autoscaling_group_name);
      expect(summary.compute.min_size).toBe(2);
      expect(summary.compute.max_size).toBe(6);
      expect(summary.compute.desired_capacity).toBe(3);
    });
  });

  describe("High Availability and Resilience", () => {
    it("validates multi-AZ deployment for compute tier", async () => {
      if (skipIfMissing("autoscaling_group_name", outputs)) return;

      const autoScalingClient = new AutoScalingClient({ region });
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      const asg = response.AutoScalingGroups![0];

      const subnetIds = asg.VPCZoneIdentifier!.split(",").map(s => s.trim());
      expect(subnetIds.length).toBe(3);
    });

    it("validates multi-AZ deployment for database tier", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: "db-cluster-id",
            Values: [outputs.rds_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      const azs = new Set(response.DBInstances!.map(i => i.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    it("validates NAT Gateway high availability", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      const ec2Client = new EC2Client({ region });
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          },
          {
            Name: "tag:Type",
            Values: ["Public"]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });
  });

  describe("Security and Compliance", () => {
    it("validates encryption at rest for RDS", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters![0];

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    it("validates S3 bucket encryption", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const s3Client = new S3Client({ region });
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it("validates database is not publicly accessible", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: "db-cluster-id",
            Values: [outputs.rds_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      response.DBInstances!.forEach(instance => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    it("validates S3 bucket is not publicly accessible", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const s3Client = new S3Client({ region });
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    });
  });
});
