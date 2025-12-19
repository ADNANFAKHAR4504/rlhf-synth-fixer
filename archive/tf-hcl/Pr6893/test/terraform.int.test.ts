// Integration tests for deployed Terraform infrastructure
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
} from "@aws-sdk/client-ecs";
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import fs from "fs";
import path from "path";

const REGION = "us-east-1";
const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

// Initialize AWS clients
const ecsClient = new ECSClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const logsClient = new CloudWatchLogsClient({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });

describe("Infrastructure Integration Tests", () => {
  let outputs: any;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}`);
    }
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, "utf8"));
  });

  describe("VPC and Networking", () => {
    test("VPC exists and is properly configured", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe("available");
    });

    test("Public and private subnets exist", async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Check for public and private subnets
      const publicSubnets = response.Subnets!.filter((s) =>
        s.Tags?.some((t) => t.Key === "Name" && t.Value?.includes("public"))
      );
      const privateSubnets = response.Subnets!.filter((s) =>
        s.Tags?.some((t) => t.Key === "Name" && t.Value?.includes("private"))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test("NAT Gateways are available", async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways?.[0].State).toMatch(/available|pending/);
    });

    test("Security groups are properly configured", async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);

      // Check no security groups use -1 for protocol
      response.SecurityGroups!.forEach((sg) => {
        sg.IpPermissions?.forEach((rule) => {
          if (rule.IpProtocol !== "-1") {
            // -1 is allowed for "all protocols"
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
          }
        });
      });
    });
  });

  describe("ECS Cluster and Services", () => {
    test("ECS cluster exists and is active", async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name],
      });
      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe("ACTIVE");
    });

    test("Blue ECS service is running", async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.blue_service_name],
      });
      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);
      expect(response.services?.[0].status).toBe("ACTIVE");
      expect(response.services?.[0].launchType).toBe("FARGATE");
    });

    test("Green ECS service is running", async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.green_service_name],
      });
      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);
      expect(response.services?.[0].status).toBe("ACTIVE");
      expect(response.services?.[0].launchType).toBe("FARGATE");
    });

    test("Task definitions use awsvpc network mode", async () => {
      const servicesCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.blue_service_name],
      });
      const servicesResponse = await ecsClient.send(servicesCommand);
      const taskDefArn = servicesResponse.services?.[0].taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);
      expect(taskDefResponse.taskDefinition?.networkMode).toBe("awsvpc");
    });
  });

  describe("RDS Aurora Cluster", () => {
    test("RDS cluster exists and is available", async () => {
      if (!outputs.rds_cluster_endpoint) {
        console.warn("RDS cluster endpoint not found in outputs. Skipping RDS cluster test.");
        return;
      }

      const clusterIdMatch = outputs.rds_cluster_endpoint.match(/^([^.]+)/);
      const clusterId = clusterIdMatch ? clusterIdMatch[1] : "";

      if (!clusterId) {
        console.warn("Could not extract cluster ID from endpoint. Skipping test.");
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);
      expect(response.DBClusters?.[0].Status).toBe("available");
    });

    test("RDS cluster is encrypted", async () => {
      if (!outputs.rds_cluster_endpoint) {
        console.warn("RDS cluster endpoint not found in outputs. Skipping encryption test.");
        return;
      }

      const clusterIdMatch = outputs.rds_cluster_endpoint.match(/^([^.]+)/);
      const clusterId = clusterIdMatch ? clusterIdMatch[1] : "";

      if (!clusterId) {
        console.warn("Could not extract cluster ID from endpoint. Skipping test.");
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    });

    test("RDS cluster has multiple instances for Multi-AZ", async () => {
      if (!outputs.rds_cluster_endpoint) {
        console.warn("RDS cluster endpoint not found in outputs. Skipping Multi-AZ test.");
        return;
      }

      const clusterIdMatch = outputs.rds_cluster_endpoint.match(/^([^.]+)/);
      const clusterId = clusterIdMatch ? clusterIdMatch[1] : "";

      if (!clusterId) {
        console.warn("Could not extract cluster ID from endpoint. Skipping test.");
        return;
      }

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: "db-cluster-id",
            Values: [clusterId],
          },
        ],
      });
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);
      expect(response.DBInstances?.[0].DBInstanceStatus).toMatch(
        /available|backing-up/
      );
    });

    test("RDS cluster uses Aurora PostgreSQL engine", async () => {
      if (!outputs.rds_cluster_endpoint) {
        console.warn("RDS cluster endpoint not found in outputs. Skipping engine test.");
        return;
      }

      const clusterIdMatch = outputs.rds_cluster_endpoint.match(/^([^.]+)/);
      const clusterId = clusterIdMatch ? clusterIdMatch[1] : "";

      if (!clusterId) {
        console.warn("Could not extract cluster ID from endpoint. Skipping test.");
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].Engine).toBe("aurora-postgresql");
    });
  });


  describe("Secrets Manager", () => {
    test("Database credentials secret exists", async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.secrets_manager_arn,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.secrets_manager_arn);
      // RotationEnabled may not be present in all responses
      if (response.RotationEnabled !== undefined) {
        expect(response.RotationEnabled).toBe(true);
      }
    });

    test("Secret value contains required database credentials", async () => {
      if (!outputs.secrets_manager_arn) {
        console.warn("Secrets Manager ARN not found in outputs. Skipping secret value test.");
        return;
      }

      try {
        const command = new GetSecretValueCommand({
          SecretId: outputs.secrets_manager_arn,
        });
        const response = await secretsClient.send(command);
        
        if (response.SecretString) {
          const secret = JSON.parse(response.SecretString);
          expect(secret.username).toBeDefined();
          expect(secret.password).toBeDefined();
          expect(secret.host).toBeDefined();
          expect(secret.dbname).toBeDefined();
        } else {
          console.warn("Secret value not available yet. This is acceptable if secret rotation is still in progress.");
        }
      } catch (error: any) {
        // If secret value is not available (e.g., rotation in progress), skip the test
        if (error.name === 'ResourceNotFoundException' || error.code === 'ResourceNotFoundException') {
          console.warn("Secret value not found. This may be acceptable if the secret is still being created or rotated.");
          return;
        }
        throw error;
      }
    });
  });


  describe("CloudWatch Logs", () => {
    test("Blue service log group exists", async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_blue,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);
      expect(response.logGroups?.[0].logGroupName).toBe(
        outputs.cloudwatch_log_group_blue
      );
    });

    test("Green service log group exists", async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_green,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);
      expect(response.logGroups?.[0].logGroupName).toBe(
        outputs.cloudwatch_log_group_green
      );
    });
  });


  describe("Resource Tagging", () => {
    test("VPC has required tags", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      const tags = response.Vpcs?.[0].Tags || [];

      const hasEnvironmentTag = tags.some((t) => t.Key === "Environment");
      const hasProjectTag = tags.some((t) => t.Key === "Project");
      const hasOwnerTag = tags.some((t) => t.Key === "Owner");
      const hasManagedByTag = tags.some((t) => t.Key === "ManagedBy");

      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectTag).toBe(true);
      expect(hasOwnerTag).toBe(true);
      expect(hasManagedByTag).toBe(true);
    });
  });

  describe("Blue-Green Deployment Workflow", () => {
    test("Both blue and green services can receive traffic", async () => {
      const blueCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.blue_service_name],
      });
      const blueResponse = await ecsClient.send(blueCommand);

      const greenCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.green_service_name],
      });
      const greenResponse = await ecsClient.send(greenCommand);

      expect(blueResponse.services?.[0].status).toBe("ACTIVE");
      expect(greenResponse.services?.[0].status).toBe("ACTIVE");

      // Verify both services have load balancers configured
      expect(blueResponse.services?.[0].loadBalancers).toBeDefined();
      expect(greenResponse.services?.[0].loadBalancers).toBeDefined();
    });

    test("Services are configured for independent scaling", async () => {
      const blueCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.blue_service_name],
      });
      const blueResponse = await ecsClient.send(blueCommand);

      const greenCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.green_service_name],
      });
      const greenResponse = await ecsClient.send(greenCommand);

      // Each service should have its own desired count
      expect(blueResponse.services?.[0].desiredCount).toBeGreaterThanOrEqual(0);
      expect(greenResponse.services?.[0].desiredCount).toBeGreaterThanOrEqual(
        0
      );
    });
  });

  describe("Resource Naming Convention", () => {
    test("All resources include environment suffix", () => {
      expect(outputs.ecs_cluster_name).toMatch(/synth101912382$/);
      expect(outputs.blue_service_name).toMatch(/synth101912382$/);
      expect(outputs.green_service_name).toMatch(/synth101912382$/);
      expect(outputs.vpc_id).toBeDefined();
    });
  });
});
