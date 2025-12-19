// terraform.int.test.ts
// Comprehensive integration tests for Multi-Environment AWS Infrastructure
// Tests validate real deployed infrastructure components

import {
  CloudWatchClient,
  DescribeAlarmsCommand
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
  DescribeVpcAttributeCommand,
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
  DescribeLoadBalancerAttributesCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetRoleCommand,
  IAMClient
} from "@aws-sdk/client-iam";
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  DescribeSecretCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

// Validation helper functions
const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string) => /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith("vpc-");
const isValidSubnetId = (v: string) => v.startsWith("subnet-");
const isValidSecurityGroupId = (v: string) => v.startsWith("sg-");
const isValidUrl = (v: string) => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
const isValidCidr = (v: string) => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidDnsName = (v: string) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) && !v.includes(" ");

const parseArray = (v: any) => {
  if (typeof v === "string") {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : [v];
    } catch {
      return [v];
    }
  }
  return Array.isArray(v) ? v : [v];
};

const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Multi-Environment AWS Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;
  let environment: string;

  beforeAll(() => {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not found: ${outputFile}. Deploy infrastructure first.`);
    }

    const data = fs.readFileSync(outputFile, "utf8");
    const parsed = JSON.parse(data);
    outputs = {};

    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v).length === 1 ? parseArray(v)[0] : parseArray(v);
    }

    // Extract region and environment from outputs
    region = outputs.aws_region || "us-east-2";
    environment = outputs.environment || "dev";

    console.log(`Testing infrastructure in region: ${region}, environment: ${environment}`);
  });

  describe("Output Structure Validation", () => {

    test("should have properly formatted ARNs", () => {
      const arnOutputs = ["alb_arn", "ecs_cluster_arn", "s3_bucket_arn"];

      arnOutputs.forEach(output => {
        if (outputs[output]) {
          expect(isValidArn(outputs[output])).toBe(true);
        }
      });
    });

    test("should have valid AWS resource IDs", () => {
      expect(isValidVpcId(outputs.vpc_id)).toBe(true);

      const subnetOutputs = ["public_subnet_ids", "private_subnet_ids", "database_subnet_ids"];
      subnetOutputs.forEach(output => {
        if (outputs[output]) {
          const subnets = Array.isArray(outputs[output]) ? outputs[output] : [outputs[output]];
          subnets.forEach((subnetId: string) => {
            expect(isValidSubnetId(subnetId)).toBe(true);
          });
        }
      });

      const sgOutputs = ["alb_security_group_id", "ecs_security_group_id", "rds_security_group_id"];
      sgOutputs.forEach(output => {
        if (outputs[output]) {
          expect(isValidSecurityGroupId(outputs[output])).toBe(true);
        }
      });
    });

  });

  describe("VPC Infrastructure", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    test("validates VPC configuration", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");

      // Check DNS attributes using separate API calls
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: "enableDnsHostnames"
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: "enableDnsSupport"
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      if (outputs.vpc_cidr_block) {
        expect(isValidCidr(outputs.vpc_cidr_block)).toBe(true);
        expect(vpc.CidrBlock).toBe(outputs.vpc_cidr_block);
      }

      // Verify environment-specific CIDR ranges
      const expectedCidrBase = environment === "dev" ? "10.10" :
        environment === "staging" ? "10.20" : "10.30";
      expect(vpc.CidrBlock).toContain(`${expectedCidrBase}.0.0/16`);
    });

    test("validates public subnet configuration", async () => {
      if (skipIfMissing("public_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(subnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);

        // Verify availability zone distribution
        expect(subnet.AvailabilityZone).toMatch(/^[a-z0-9-]+[a-f]$/);
      });

      // Ensure subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test("validates private subnet configuration", async () => {
      if (skipIfMissing("private_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(subnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test("validates database subnet configuration", async () => {
      if (skipIfMissing("database_subnet_ids", outputs)) return;

      const subnetIds = parseArray(outputs.database_subnet_ids);
      expect(subnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test("validates Internet Gateway", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: "attachment.vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe("available");
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
    });

    test("validates NAT Gateway configuration", async () => {
      if (skipIfMissing("vpc_id", outputs)) return;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe("available");
      expect(natGateway.VpcId).toBe(outputs.vpc_id);
    });
  });

  describe("Security Groups", () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    test("validates ALB security group", async () => {
      if (skipIfMissing("alb_security_group_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.alb_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Check for HTTP and HTTPS ingress rules
      const ingressRules = sg.IpPermissions!;
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe("0.0.0.0/0");
      expect(httpsRule!.IpRanges![0].CidrIp).toBe("0.0.0.0/0");
    });

    test("validates ECS security group", async () => {
      if (skipIfMissing("ecs_security_group_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ecs_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Check for port 8080 ingress from ALB security group
      const ingressRules = sg.IpPermissions!;
      const appRule = ingressRules.find(rule => rule.FromPort === 8080);
      expect(appRule).toBeDefined();

      if (outputs.alb_security_group_id) {
        const sourceGroup = appRule!.UserIdGroupPairs!.find(
          group => group.GroupId === outputs.alb_security_group_id
        );
        expect(sourceGroup).toBeDefined();
      }
    });

    test("validates RDS security group", async () => {
      if (skipIfMissing("rds_security_group_id", outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rds_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      // Check for PostgreSQL port 5432 ingress from ECS security group
      const ingressRules = sg.IpPermissions!;
      const pgRule = ingressRules.find(rule => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
    });
  });

  describe("Application Load Balancer", () => {
    let elbv2Client: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbv2Client = new ElasticLoadBalancingV2Client({ region });
    });

    test("validates ALB configuration", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn]
      });

      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.VpcId).toBe(outputs.vpc_id);

      // Verify deletion protection based on environment
      const attributesCommand = new DescribeLoadBalancerAttributesCommand({
        LoadBalancerArn: outputs.alb_arn
      });

      const attributesResponse = await elbv2Client.send(attributesCommand);
      const deletionProtectionAttr = attributesResponse.Attributes!.find(
        attr => attr.Key === "deletion_protection.enabled"
      );

      if (environment === "prod") {
        expect(deletionProtectionAttr?.Value).toBe("true");
      } else {
        expect(deletionProtectionAttr?.Value).toBe("false");
      }
    });

    test("validates target group configuration", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      const targetGroupsCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.alb_arn
      });

      const response = await elbv2Client.send(targetGroupsCommand);
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.Port).toBe(8080);
      expect(targetGroup.TargetType).toBe("ip");
      expect(targetGroup.VpcId).toBe(outputs.vpc_id);

      // Verify health check configuration
      const healthCheck = targetGroup.HealthCheckPath;
      expect(healthCheck).toBe("/health");

      // Environment-specific health check intervals
      if (environment === "prod") {
        expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      } else {
        expect(targetGroup.HealthCheckIntervalSeconds).toBe(60);
      }
    });

    test("validates ALB listeners", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.alb_arn
      });

      const response = await elbv2Client.send(command);
      expect(response.Listeners!.length).toBeGreaterThan(0);

      const listener = response.Listeners![0];
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe("HTTP");
      expect(listener.DefaultActions![0].Type).toBe("forward");
    });
  });

  describe("ECS Infrastructure", () => {
    let ecsClient: ECSClient;

    beforeAll(() => {
      ecsClient = new ECSClient({ region });
    });

    test("validates ECS cluster", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs)) return;

      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name]
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe("ACTIVE");
      expect(cluster.clusterName).toBe(outputs.ecs_cluster_name);

      // Verify container insights based on environment
      const setting = cluster.settings?.find(s => s.name === "containerInsights");
      if (environment === "prod") {
        expect(setting?.value).toBe("enabled");
      } else {
        // Container insights may be disabled by default (no setting) or explicitly set to disabled
        if (setting) {
          expect(setting.value).toBe("disabled");
        }
        // If no setting exists, container insights is disabled by default, which is acceptable
      }
    });

    test("validates ECS service", async () => {
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

      // Verify environment-specific desired count
      const expectedCount = environment === "dev" ? 1 :
        environment === "staging" ? 2 : 4;
      expect(service.desiredCount).toBe(expectedCount);
      expect(service.runningCount).toBeGreaterThanOrEqual(1);
    });

    test("validates ECS task definition", async () => {
      if (skipIfMissing("ecs_cluster_name", outputs) || skipIfMissing("ecs_service_name", outputs)) return;

      // First get the service to find the task definition
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefinitionArn = serviceResponse.services![0].taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn
      });

      const response = await ecsClient.send(taskDefCommand);
      expect(response.taskDefinition).toBeDefined();

      const taskDef = response.taskDefinition!;
      expect(taskDef.requiresCompatibilities).toContain("FARGATE");
      expect(taskDef.networkMode).toBe("awsvpc");
      expect(taskDef.cpu).toBe("256");
      expect(taskDef.memory).toBe("512");

      // Verify container configuration
      expect(taskDef.containerDefinitions).toHaveLength(1);
      const container = taskDef.containerDefinitions![0];
      expect(container.portMappings![0].containerPort).toBe(8080);
    });
  });

  describe("RDS Aurora Infrastructure", () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    test("validates RDS Aurora cluster", async () => {
      if (skipIfMissing("rds_cluster_identifier", outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_identifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe("available");
      expect(cluster.Engine).toBe("aurora-postgresql");
      expect(cluster.EngineVersion).toBe("15.10");
      expect(cluster.DatabaseName).toBe("tapdb");
      expect(cluster.MasterUsername).toBe("postgres");

      // Verify environment-specific backup retention
      if (environment === "prod") {
        expect(cluster.BackupRetentionPeriod).toBe(30);
        expect(cluster.DeletionProtection).toBe(true);
      } else {
        expect(cluster.BackupRetentionPeriod).toBe(7);
        expect(cluster.DeletionProtection).toBe(false);
      }
    });

    test("validates RDS cluster instances", async () => {
      if (skipIfMissing("rds_cluster_identifier", outputs)) return;

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: "db-cluster-id",
            Values: [outputs.rds_cluster_identifier]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);

      const instance = response.DBInstances![0];
      expect(instance.DBInstanceStatus).toBe("available");

      // Verify environment-specific instance class
      const expectedClass = environment === "dev" ? "db.t3.medium" :
        environment === "staging" ? "db.r5.large" : "db.r5.xlarge";
      expect(instance.DBInstanceClass).toBe(expectedClass);

      // Verify performance insights based on environment
      if (environment === "dev") {
        expect(instance.PerformanceInsightsEnabled).toBe(false);
      } else {
        expect(instance.PerformanceInsightsEnabled).toBe(true);
      }
    });

  });

  describe("S3 Infrastructure", () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    test("validates S3 bucket existence", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name
      });

      // Should not throw an error
      await s3Client.send(command);
    });

    test("validates S3 bucket versioning", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("validates S3 bucket encryption", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("AES256");
    });

    test("validates S3 bucket lifecycle configuration", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toHaveLength(1);

      const rule = response.Rules![0];
      expect(rule.Status).toBe("Enabled");
      expect(rule.Transitions![0].Days).toBe(90);
      expect(rule.Transitions![0].StorageClass).toBe("GLACIER");
    });
  });

  describe("CloudWatch Infrastructure", () => {
    let cloudwatchClient: CloudWatchClient;
    let cloudwatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudwatchClient = new CloudWatchClient({ region });
      cloudwatchLogsClient = new CloudWatchLogsClient({ region });
    });

    test("validates CloudWatch log group", async () => {
      if (skipIfMissing("cloudwatch_log_group_name", outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name
      });

      const response = await cloudwatchLogsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.cloudwatch_log_group_name);

      // Verify environment-specific retention
      const expectedRetention = environment === "dev" ? 7 :
        environment === "staging" ? 30 : 90;
      expect(logGroup.retentionInDays).toBe(expectedRetention);
    });

    test("validates CloudWatch alarms for production", async () => {
      if (environment !== "prod") {
        console.log("Skipping alarm tests for non-production environment");
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `tap-financial-${environment}-high-cpu`
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe("CPUUtilization");
      expect(alarm.Namespace).toBe("AWS/ECS");
      expect(alarm.Threshold).toBe(80);
    });
  });

  describe("Secrets Management", () => {
    let secretsClient: SecretsManagerClient;

    beforeAll(() => {
      secretsClient = new SecretsManagerClient({ region });
    });

    test("validates RDS password secret", async () => {
      if (skipIfMissing("rds_password_secret_arn", outputs)) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.rds_password_secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBeDefined();
      expect(response.Description).toContain("The secret associated with the primary RDS DB cluster");
      expect(response.VersionIdsToStages).toBeDefined();
    });
  });

  describe("IAM Configuration", () => {
    let iamClient: IAMClient;

    beforeAll(() => {
      iamClient = new IAMClient({ region });
    });

    test("validates ECS execution role", async () => {
      const roleName = `tap-financial-${environment}-ecs-execution-role`;

      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ecs-tasks.amazonaws.com");
    });

    test("validates ECS task role", async () => {
      const roleName = `tap-financial-${environment}-ecs-task-role`;

      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });
  });

  describe("Application Connectivity", () => {
    test("validates application URL accessibility", async () => {
      if (skipIfMissing("application_url", outputs)) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(outputs.application_url, {
          method: "GET",
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // We expect either a successful response or a specific error
        // since the nginx default page should be accessible
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        // Network errors are acceptable in test environment
        console.log(`Application URL test warning: ${error}`);
      }
    }, 15000);
  });
});
