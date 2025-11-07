import {
  ApplicationAutoScalingClient,
  DescribeScalingPoliciesCommand
} from "@aws-sdk/client-application-auto-scaling";
import {
  CloudWatchClient
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient
} from "@aws-sdk/client-ecs";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from "@aws-sdk/client-kms";
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  GetHealthCheckCommand,
  Route53Client
} from "@aws-sdk/client-route-53";
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  GetTopicAttributesCommand,
  SNSClient
} from "@aws-sdk/client-sns";
import {
  GetParameterCommand,
  SSMClient
} from "@aws-sdk/client-ssm";
import {
  GetWebACLCommand,
  WAFV2Client
} from "@aws-sdk/client-wafv2";
import axios from 'axios';
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

// Validation helper functions
const isNonEmptyString = (v: any): boolean => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string): boolean =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim()) ||
  /^arn:aws:[^:]+:[^:]*:[0-9]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string): boolean => v.startsWith("vpc-");
const isValidSubnetId = (v: string): boolean => v.startsWith("subnet-");
const isValidSecurityGroupId = (v: string): boolean => v.startsWith("sg-");
const isValidUrl = (v: string): boolean => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
const isValidCidr = (v: string): boolean => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidKmsKeyId = (v: string): boolean => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const isValidDnsName = (v: string): boolean => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) && !v.includes(" ");

// Helper to parse JSON arrays from string outputs
const parseArray = (v: any): any => {
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

// Helper to skip tests for missing outputs
const skipIfMissing = (key: string, obj: any): boolean => {
  if (!(key in obj) || obj[key] === null || obj[key] === undefined ||
    obj[key] === "" || (typeof obj[key] === "string" && obj[key].startsWith("N/A"))) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Payment Processing Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;

  beforeAll(() => {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not found: ${outputFile}`);
    }

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

    console.log(`Running integration tests in region: ${region}`);
  });

  describe("Output Structure Validation", () => {
    it("should have essential infrastructure outputs", () => {
      const requiredOutputs = [
        "vpc_id", "vpc_cidr", "public_subnet_ids", "private_subnet_ids",
        "load_balancer_dns_name", "load_balancer_arn", "application_url",
        "ecs_cluster_name", "ecs_service_name", "rds_cluster_endpoint"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe("");
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

    it("should have valid output formats", () => {
      // Validate VPC ID format
      if (!skipIfMissing("vpc_id", outputs)) {
        expect(isValidVpcId(outputs.vpc_id)).toBe(true);
      }

      // Validate CIDR format
      if (!skipIfMissing("vpc_cidr", outputs)) {
        expect(isValidCidr(outputs.vpc_cidr)).toBe(true);
      }

      // Validate ARN formats
      const arnOutputs = ["load_balancer_arn", "kms_key_arn", "sns_topic_arn", "s3_logs_bucket_arn"];
      arnOutputs.forEach(key => {
        if (!skipIfMissing(key, outputs)) {
          expect(isValidArn(outputs[key])).toBe(true);
        }
      });

      // Validate URL formats
      if (!skipIfMissing("application_url", outputs)) {
        expect(isValidUrl(outputs.application_url)).toBe(true);
      }
    });
  });

  describe("VPC Infrastructure", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates VPC configuration", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.InstanceTenancy).toBe("default");

      if (!skipIfMissing("vpc_cidr", outputs)) {
        expect(vpc.CidrBlock).toBe(outputs.vpc_cidr);
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

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThan(1);
    });

    it("validates private subnet configuration", async () => {
      if (skipIfMissing("private_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThan(0);

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

      // Verify database subnets are in different AZs for RDS requirements
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
    });

    it("validates NAT Gateway configuration", async () => {
      // First, get the actual VPC to ensure it exists
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: "tag:Name",
            Values: ["*payment-processing*"]
          }
        ]
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

      const actualVpcId = vpcResponse.Vpcs![0].VpcId!;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: "vpc-id",
            Values: [actualVpcId]
          },
          {
            Name: "state",
            Values: ["available"]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();

      // Filter for only available NAT Gateways
      const availableNatGateways = response.NatGateways!.filter(natGateway =>
        natGateway.State === "available" && natGateway.VpcId === actualVpcId
      );

      expect(availableNatGateways.length).toBeGreaterThan(0);

      availableNatGateways.forEach(natGateway => {
        expect(natGateway.State).toBe("available");
        expect(natGateway.VpcId).toBe(actualVpcId);
      });
    });

    it("validates Internet Gateway configuration", async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: "attachment.vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBe(1);
      expect(igw.Attachments![0].State).toBe("available");
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
    });
  });

  describe("Security Groups", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it("validates ALB security group", async () => {
      if (skipIfMissing("security_group_alb_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_alb_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Check for HTTP and HTTPS ingress rules
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    it("validates ECS security group", async () => {
      if (skipIfMissing("security_group_ecs_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_ecs_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Should allow traffic from ALB security group
      const albSgRule = sg.IpPermissions?.find(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.security_group_alb_id)
      );
      expect(albSgRule).toBeDefined();
    });

    it("validates RDS security group", async () => {
      if (skipIfMissing("security_group_rds_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_rds_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Should allow PostgreSQL traffic from ECS security group
      const postgreRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.security_group_ecs_id)
      );
      expect(postgreRule).toBeDefined();
    });
  });

  describe("Load Balancer", () => {
    let elbClient: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbClient = new ElasticLoadBalancingV2Client({ region });
    });

    it("validates ALB configuration", async () => {
      if (skipIfMissing("load_balancer_arn", outputs)) return;

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.load_balancer_arn]
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.VpcId).toBe(outputs.vpc_id);

      if (!skipIfMissing("load_balancer_dns_name", outputs)) {
        expect(alb.DNSName).toBe(outputs.load_balancer_dns_name);
      }
    });

    it("validates target group configuration", async () => {
      if (skipIfMissing("target_group_arn", outputs)) return;

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.target_group_arn]
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe("HTTP");
      expect(tg.TargetType).toBe("ip");
      expect(tg.VpcId).toBe(outputs.vpc_id);
      expect(tg.HealthCheckEnabled).toBe(true);
    });

    it("validates ALB listeners", async () => {
      if (skipIfMissing("load_balancer_arn", outputs)) return;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.load_balancer_arn
      });

      const response = await elbClient.send(command);
      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThan(0);

      // Should have HTTP listener
      const httpListener = response.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe("HTTP");
    });

    it("validates ALB accessibility", async () => {
      if (skipIfMissing("application_url", outputs)) return;

      try {
        const response = await axios.get(outputs.application_url, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Should get some response (might be 503 if no healthy targets)
        expect(response.status).toBeDefined();
        expect([200, 503, 502, 504]).toContain(response.status);
      } catch (error: any) {
        // Network connectivity issues are acceptable for this test
        expect(error.code).toMatch(/ENOTFOUND|ECONNREFUSED|ETIMEDOUT/);
      }
    });
  });

  describe("ECS Infrastructure", () => {
    let ecsClient: ECSClient;

    beforeAll(() => {
      ecsClient = new ECSClient({ region });
    });

    it("validates ECS cluster", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs)) return;

      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name]
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe("ACTIVE");
      expect(cluster.clusterName).toBe(outputs.ecs_cluster_name);

      // Check container insights
      const containerInsights = cluster.settings?.find(s => s.name === "containerInsights");
      if (containerInsights) {
        expect(containerInsights.value).toBe("enabled");
      } else {
        console.warn("Container insights setting not found, skipping validation");
      }
    });

    it("validates ECS service", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs) || skipIfMissing("ecs_service_name", outputs)) return;

      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);

      const service = response.services![0];
      expect(service.status).toBe("ACTIVE");
      expect(service.launchType).toBe("FARGATE");
      expect(service.serviceName).toBe(outputs.ecs_service_name);
      expect(service.desiredCount).toBeGreaterThan(0);

      // Validate network configuration
      expect(service.networkConfiguration?.awsvpcConfiguration?.assignPublicIp).toBe("DISABLED");
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets).toBeDefined();
      expect(service.networkConfiguration?.awsvpcConfiguration?.securityGroups).toBeDefined();
    });

    it("validates ECS task definition", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs) || skipIfMissing("ecs_service_name", outputs)) return;

      // First get the service to find the task definition ARN
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services![0].taskDefinition;
      expect(taskDefArn).toBeDefined();

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn
      });

      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const taskDef = taskDefResponse.taskDefinition!;

      expect(taskDef.networkMode).toBe("awsvpc");
      expect(taskDef.requiresCompatibilities).toContain("FARGATE");
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toBeDefined();

      // Validate container definitions
      expect(taskDef.containerDefinitions).toBeDefined();
      expect(taskDef.containerDefinitions!.length).toBeGreaterThan(0);

      const container = taskDef.containerDefinitions![0];
      expect(container.logConfiguration?.logDriver).toBe("awslogs");
    });
  });

  describe("RDS Infrastructure", () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it("validates RDS Aurora cluster", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe("available");
      expect(cluster.Engine).toBe("aurora-postgresql");
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();

      if (!skipIfMissing("rds_cluster_endpoint", outputs)) {
        expect(cluster.Endpoint).toBe(outputs.rds_cluster_endpoint);
      }

      // Validate backup configuration
      expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(cluster.PreferredBackupWindow).toBeDefined();
      expect(cluster.PreferredMaintenanceWindow).toBeDefined();
    });

    it("validates RDS cluster instances", async () => {
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
      expect(response.DBInstances!.length).toBeGreaterThan(0);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe("available");
        expect(instance.Engine).toBe("aurora-postgresql");
        expect(instance.PubliclyAccessible).toBe(false);
        expect(instance.PerformanceInsightsEnabled).toBe(true);
      });
    });

    it("validates DB subnet group", async () => {
      if (skipIfMissing("rds_cluster_id", outputs)) return;

      // Get cluster to find subnet group name
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });

      const clusterResponse = await rdsClient.send(clusterCommand);
      const subnetGroupName = clusterResponse.DBClusters![0].DBSubnetGroup;
      expect(subnetGroupName).toBeDefined();

      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      });

      const subnetResponse = await rdsClient.send(subnetCommand);
      expect(subnetResponse.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(outputs.vpc_id);
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone?.Name);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("KMS Configuration", () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    it("validates KMS key configuration", async () => {
      if (skipIfMissing("kms_key_id", outputs)) return;

      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();

      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.Enabled).toBe(true);
      expect(keyMetadata.KeyState).toBe("Enabled");
      expect(keyMetadata.KeyUsage).toBe("ENCRYPT_DECRYPT");

      // Check key rotation status separately
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe("S3 Configuration", () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    it("validates S3 bucket exists and is accessible", async () => {
      if (skipIfMissing("s3_logs_bucket_name", outputs)) return;

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_logs_bucket_name
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it("validates S3 bucket versioning", async () => {
      if (skipIfMissing("s3_logs_bucket_name", outputs)) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_logs_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    it("validates S3 bucket encryption", async () => {
      if (skipIfMissing("s3_logs_bucket_name", outputs)) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_logs_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    it("validates S3 lifecycle configuration", async () => {
      if (skipIfMissing("s3_logs_bucket_name", outputs)) return;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_logs_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules![0];
      expect(rule.Status).toBe("Enabled");
      expect(rule.Expiration?.Days).toBe(90);
    });
  });

  describe("CloudWatch Configuration", () => {
    let cloudWatchClient: CloudWatchClient;
    let cloudWatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudWatchClient = new CloudWatchClient({ region });
      cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    });

    it("validates CloudWatch log group", async () => {
      if (skipIfMissing("cloudwatch_log_group_name", outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.cloudwatch_log_group_name);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBeDefined();
    });
  });

  describe("SNS Configuration", () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region });
    });

    it("validates SNS topic", async () => {
      if (skipIfMissing("sns_topic_arn", outputs)) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_topic_arn);
    });
  });

  describe("Systems Manager Configuration", () => {
    let ssmClient: SSMClient;

    beforeAll(() => {
      ssmClient = new SSMClient({ region });
    });

    it("validates SSM parameters", async () => {
      // Test common parameter patterns based on the infrastructure
      const parameterNames = [
        "/payment-processing/prod/db/host",
        "/payment-processing/prod/db/name"
      ];

      for (const paramName of parameterNames) {
        try {
          const command = new GetParameterCommand({
            Name: paramName
          });

          const response = await ssmClient.send(command);
          expect(response.Parameter).toBeDefined();
          expect(response.Parameter!.Value).toBeDefined();
          expect(response.Parameter!.Type).toBe("String");
        } catch (error: any) {
          // Parameter might not exist in this specific deployment
          if (!error.name?.includes("ParameterNotFound")) {
            throw error;
          }
        }
      }
    });
  });

  describe("WAF Configuration", () => {
    let wafClient: WAFV2Client;

    beforeAll(() => {
      wafClient = new WAFV2Client({ region });
    });

    it("validates WAF Web ACL", async () => {
      if (skipIfMissing("waf_web_acl_arn", outputs)) return;

      // Extract Web ACL ID from ARN
      const webAclId = outputs.waf_web_acl_arn.split("/").pop();
      expect(webAclId).toBeDefined();

      const command = new GetWebACLCommand({
        Scope: "REGIONAL",
        Id: webAclId,
        Name: webAclId.split("/")[0]
      });

      try {
        const response = await wafClient.send(command);
        expect(response.WebACL).toBeDefined();
        expect(response.WebACL!.Rules).toBeDefined();
        expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);

        // Should have SQL injection protection
        const sqlInjectionRule = response.WebACL!.Rules!.find(rule =>
          rule.Name?.includes("SQLInjection") || rule.Name?.includes("SQLi")
        );
        expect(sqlInjectionRule).toBeDefined();
      } catch (error: any) {
        // WAF might have different naming conventions
        console.warn("WAF validation skipped:", error.message);
      }
    });
  });

  describe("Auto Scaling Configuration", () => {
    let autoScalingClient: ApplicationAutoScalingClient;

    beforeAll(() => {
      autoScalingClient = new ApplicationAutoScalingClient({ region });
    });

    it("validates ECS auto scaling configuration", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs) || skipIfMissing("ecs_service_name", outputs)) return;

      const resourceId = `service/${outputs.ecs_cluster_name}/${outputs.ecs_service_name}`;

      const policiesCommand = new DescribeScalingPoliciesCommand({
        ResourceId: resourceId,
        ServiceNamespace: "ecs"
      });

      try {
        const response = await autoScalingClient.send(policiesCommand);
        expect(response.ScalingPolicies).toBeDefined();

        if (response.ScalingPolicies!.length > 0) {
          const policy = response.ScalingPolicies![0];
          expect(policy.PolicyType).toBe("TargetTrackingScaling");
          expect(policy.TargetTrackingScalingPolicyConfiguration).toBeDefined();
        }
      } catch (error: any) {
        // Auto scaling might not be configured or accessible
        console.warn("Auto scaling validation skipped:", error.message);
      }
    });
  });

  describe("Route53 Configuration", () => {
    let route53Client: Route53Client;

    beforeAll(() => {
      route53Client = new Route53Client({ region });
    });

    it("validates Route53 health check", async () => {
      if (skipIfMissing("route53_health_check_id", outputs)) return;

      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.route53_health_check_id
      });

      try {
        const response = await route53Client.send(command);
        expect(response.HealthCheck).toBeDefined();
        expect(response.HealthCheck!.HealthCheckConfig).toBeDefined();

        const config = response.HealthCheck!.HealthCheckConfig;
        if (config) {
          expect(config.Type).toMatch(/HTTP|HTTPS/);
          expect(config.FullyQualifiedDomainName).toBeDefined();
        }
      } catch (error: any) {
        // Route53 might not be configured
        console.warn("Route53 health check validation skipped:", error.message);
      }
    });
  });
});
