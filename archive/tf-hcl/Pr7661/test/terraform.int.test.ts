// Integration tests for deployed Terraform infrastructure
// Tests validate actual AWS resources created by Terraform

import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// AWS SDK clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const asgClient = new AutoScalingClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
    outputs = JSON.parse(outputsContent);
  });

  describe("Deployment Outputs", () => {
    test("outputs file contains all required keys", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs).toHaveProperty("public_subnet_ids");
      expect(outputs).toHaveProperty("private_subnet_ids");
      expect(outputs).toHaveProperty("alb_dns_name");
      expect(outputs).toHaveProperty("alb_arn");
      expect(outputs).toHaveProperty("autoscaling_group_name");
      expect(outputs).toHaveProperty("autoscaling_group_arn");
      expect(outputs).toHaveProperty("db_endpoint");
      expect(outputs).toHaveProperty("db_arn");
      expect(outputs).toHaveProperty("db_secret_arn");
      expect(outputs).toHaveProperty("s3_bucket_name");
      expect(outputs).toHaveProperty("s3_bucket_arn");
      expect(outputs).toHaveProperty("environment");
      expect(outputs).toHaveProperty("vpc_cidr");
    });

    test("VPC CIDR matches expected value", () => {
      expect(outputs.vpc_cidr).toBe("10.0.0.0/16");
    });
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and is available", async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe("available");
      expect(response.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
    });

    test("NAT Gateway exists and is available", async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: "vpc-id",
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);
      expect(response.NatGateways![0].State).toBe("available");
    });

    test("Internet Gateway exists and is attached", async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: "attachment.vpc-id",
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
      expect(response.InternetGateways![0].Attachments![0].State).toBe("available");
    });

    test("security groups exist for VPC", async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: "vpc-id",
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe("Compute Infrastructure", () => {
    test("Application Load Balancer exists and is active", async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.alb_arn],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State?.Code).toBe("active");
      expect(response.LoadBalancers![0].DNSName).toBe(outputs.alb_dns_name);
      expect(response.LoadBalancers![0].VpcId).toBe(outputs.vpc_id);
      expect(response.LoadBalancers![0].Type).toBe("application");
    });

    test("ALB has target group configured", async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: outputs.alb_arn,
        })
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      expect(response.TargetGroups![0].VpcId).toBe(outputs.vpc_id);
    });

    test("ALB has listener configured", async () => {
      const response = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: outputs.alb_arn,
        })
      );

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThan(0);
      expect(response.Listeners![0].Port).toBe(80);
    });

    test("Auto Scaling Group exists and is configured correctly", async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.autoscaling_group_name],
        })
      );

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeDefined();
      expect(asg.MaxSize).toBeDefined();
      expect(asg.DesiredCapacity).toBeDefined();
      expect(asg.MinSize!).toBeLessThanOrEqual(asg.DesiredCapacity!);
      expect(asg.DesiredCapacity!).toBeLessThanOrEqual(asg.MaxSize!);
    });
  });

  describe("Database Infrastructure", () => {
    test("RDS instance exists and is available", async () => {
      // Extract DB identifier from endpoint
      const dbIdentifier = outputs.db_endpoint.split(".")[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: "db-instance-id",
              Values: [dbIdentifier],
            },
          ],
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe("available");
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test("RDS instance endpoint matches output", async () => {
      const dbIdentifier = outputs.db_endpoint.split(".")[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: "db-instance-id",
              Values: [dbIdentifier],
            },
          ],
        })
      );

      const dbInstance = response.DBInstances![0];
      const actualEndpoint = `${dbInstance.Endpoint!.Address}:${dbInstance.Endpoint!.Port}`;
      expect(actualEndpoint).toBe(outputs.db_endpoint);
    });

    test("database parameter group exists", async () => {
      const dbIdentifier = outputs.db_endpoint.split(".")[0];

      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: "db-instance-id",
              Values: [dbIdentifier],
            },
          ],
        })
      );

      const paramGroupName = dbResponse.DBInstances![0].DBParameterGroups![0].DBParameterGroupName;

      const paramResponse = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({
          DBParameterGroupName: paramGroupName,
        })
      );

      expect(paramResponse.DBParameterGroups).toBeDefined();
      expect(paramResponse.DBParameterGroups!.length).toBe(1);
      expect(paramResponse.DBParameterGroups![0].DBParameterGroupFamily).toContain("postgres");
    });

    test("database credentials stored in Secrets Manager", async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.db_secret_arn,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty("username");
      expect(secret).toHaveProperty("password");
      expect(secret).toHaveProperty("engine");
      expect(secret).toHaveProperty("host");
      expect(secret).toHaveProperty("port");
      expect(secret).toHaveProperty("dbname");
      expect(secret.engine).toBe("postgres");
      expect(secret.port).toBe(5432);
    });
  });

  describe("Storage Infrastructure", () => {
    test("S3 bucket exists and is accessible", async () => {
      await expect(
        s3Client.send(
          new HeadBucketCommand({
            Bucket: outputs.s3_bucket_name,
          })
        )
      ).resolves.not.toThrow();
    });

    test("S3 bucket has encryption enabled", async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.s3_bucket_name,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });

    test("S3 bucket has lifecycle configuration", async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.s3_bucket_name,
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Tagging", () => {
    test("VPC has proper tags", async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(tags.map((t) => [t.Key, t.Value]));

      expect(tagMap).toHaveProperty("Environment");
      expect(tagMap).toHaveProperty("ManagedBy");
      expect(tagMap).toHaveProperty("Project");
      expect(tagMap.Environment).toBe(outputs.environment);
      expect(tagMap.ManagedBy).toBe("Terraform");
    });

    test("RDS instance has proper tags", async () => {
      const dbIdentifier = outputs.db_endpoint.split(".")[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: "db-instance-id",
              Values: [dbIdentifier],
            },
          ],
        })
      );

      const tags = response.DBInstances![0].TagList || [];
      const tagMap = Object.fromEntries(tags.map((t: any) => [t.Key, t.Value]));

      expect(tagMap).toHaveProperty("Environment");
      expect(tagMap).toHaveProperty("ManagedBy");
      expect(tagMap.Environment).toBe(outputs.environment);
      expect(tagMap.ManagedBy).toBe("Terraform");
    });
  });

  describe("Multi-Environment Consistency", () => {
    test("resource names include environment identifier", () => {
      expect(outputs.autoscaling_group_name).toContain(outputs.environment);
      expect(outputs.s3_bucket_name).toContain(outputs.environment);
    });

    test("workspace-based naming is consistent", () => {
      const dbIdentifier = outputs.db_endpoint.split(".")[0];
      expect(dbIdentifier).toContain(outputs.environment);
    });
  });
});
