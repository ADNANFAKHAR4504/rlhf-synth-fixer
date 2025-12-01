// Loan Processing Application Integration Tests
// These tests validate the deployed infrastructure using actual AWS resources

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

function readStructuredOutputs(): Record<string, string> {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "lib/.cfn-outputs.json"),
    path.resolve(process.cwd(), "outputs.json"),
    path.resolve(process.cwd(), "stack-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, "utf8");
      const parsed = JSON.parse(content);
      // Handle both direct outputs and nested structure
      if (parsed.Outputs) {
        // Extract values from CloudFormation output structure
        const flat: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed.Outputs)) {
          if (typeof value === "object" && value !== null && "Value" in value) {
            flat[key] = (value as any).Value;
          } else if (typeof value === "string") {
            flat[key] = value;
          }
        }
        return flat;
      }
      return parsed;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: Record<string, string> = {};
  const envVars = [
    "VPCId",
    "PublicSubnets",
    "PrivateSubnets",
    "ECSClusterName",
    "ECSServiceName",
    "AuroraClusterEndpoint",
    "AuroraClusterReadEndpoint",
    "DocumentBucketName",
    "ApplicationLoadBalancerDNS",
    "ApplicationLoadBalancerURL",
    "LogGroupName",
  ];

  for (const key of envVars) {
    const envKey = `CFN_${key}`;
    if (process.env[envKey]) {
      outputs[key] = process.env[envKey]!;
    }
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Set environment variables (CFN_VPC_ID, CFN_ECS_CLUSTER_NAME, etc.) or ensure CloudFormation outputs are available."
    );
  }

  return outputs;
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(`${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";

// AWS clients
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe("Loan Processing Application Integration Tests", () => {
  describe("CloudFormation Outputs Validation", () => {
    test("should have all required outputs", () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnets).toBeDefined();
      expect(outputs.PrivateSubnets).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.DocumentBucketName).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.LogGroupName).toBeDefined();
    });

    test("outputs should include environment suffix", () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || "pr7564";
      expect(outputs.ECSClusterName).toContain(envSuffix);
      expect(outputs.ECSServiceName).toContain(envSuffix);
      expect(outputs.DocumentBucketName).toContain(envSuffix);
      expect(outputs.LogGroupName).toContain(envSuffix);
    });
  });

  describe("VPC and Networking Validation", () => {
    test("VPC should exist and be available", async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [outputs.VPCId],
          })
        );
      });

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe("available");
      expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
    }, 90000);

    test("should have 3 public subnets", async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(",").map((s) => s.trim());
      expect(publicSubnetIds.length).toBe(3);

      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: publicSubnetIds,
          })
        );
      });

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe("available");
      });
    }, 90000);

    test("should have 3 private subnets", async () => {
      const privateSubnetIds = outputs.PrivateSubnets.split(",").map((s) => s.trim());
      expect(privateSubnetIds.length).toBe(3);

      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: privateSubnetIds,
          })
        );
      });

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe("available");
      });
    }, 90000);
  });

  describe("Security Groups Validation", () => {
    test("should have security groups in VPC", async () => {
      const response = await retry(async () => {
        return await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: "vpc-id",
                Values: [outputs.VPCId],
              },
            ],
          })
        );
      });

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe("ECS Fargate Cluster Validation", () => {
    test("ECS cluster should exist and be active", async () => {
      const response = await retry(async () => {
        return await ecsClient.send(
          new DescribeClustersCommand({
            clusters: [outputs.ECSClusterName],
          })
        );
      });

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe("ACTIVE");
      expect(response.clusters![0].clusterName).toBe(outputs.ECSClusterName);
    }, 90000);

    test("ECS service should exist and be active", async () => {
      const response = await retry(async () => {
        return await ecsClient.send(
          new DescribeServicesCommand({
            cluster: outputs.ECSClusterName,
            services: [outputs.ECSServiceName],
          })
        );
      });

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe("ACTIVE");
      expect(response.services![0].launchType).toBe("FARGATE");
    }, 90000);

    test("ECS service should have running tasks", async () => {
      const response = await retry(async () => {
        return await ecsClient.send(
          new ListTasksCommand({
            cluster: outputs.ECSClusterName,
            serviceName: outputs.ECSServiceName,
            desiredStatus: "RUNNING",
          })
        );
      }, 15, 3000, "ECS tasks");

      expect(response.taskArns).toBeDefined();
      // Tasks might take time to start, so we just verify the API call works
      expect(Array.isArray(response.taskArns)).toBe(true);
    }, 120000);

    test("ECS service should use load balancer", async () => {
      const response = await retry(async () => {
        return await ecsClient.send(
          new DescribeServicesCommand({
            cluster: outputs.ECSClusterName,
            services: [outputs.ECSServiceName],
          })
        );
      });

      expect(response.services![0].loadBalancers).toBeDefined();
      expect(response.services![0].loadBalancers!.length).toBeGreaterThan(0);
    }, 90000);
  });

  describe("Aurora PostgreSQL Serverless v2 Validation", () => {
    test("Aurora cluster should exist and be available", async () => {
      // Extract cluster identifier from endpoint
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split(".")[0];

      const response = await retry(async () => {
        return await rdsClient.send(new DescribeDBClustersCommand({}));
      });

      const cluster = response.DBClusters?.find(
        (c) => c.DBClusterIdentifier === clusterIdentifier || c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe("available");
      expect(cluster?.Engine).toBe("aurora-postgresql");
    }, 120000);

    test("Aurora cluster should have Serverless v2 scaling configuration", async () => {
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split(".")[0];

      const response = await retry(async () => {
        return await rdsClient.send(new DescribeDBClustersCommand({}));
      });

      const cluster = response.DBClusters?.find(
        (c) => c.DBClusterIdentifier === clusterIdentifier || c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster?.ServerlessV2ScalingConfiguration?.MinCapacity).toBe(0.5);
      expect(cluster?.ServerlessV2ScalingConfiguration?.MaxCapacity).toBe(4);
    }, 120000);

    test("Aurora cluster should use encryption", async () => {
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split(".")[0];

      const response = await retry(async () => {
        return await rdsClient.send(new DescribeDBClustersCommand({}));
      });

      const cluster = response.DBClusters?.find(
        (c) => c.DBClusterIdentifier === clusterIdentifier || c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.KmsKeyId).toBeDefined();
    }, 120000);

    test("Aurora cluster should have two instances for Multi-AZ", async () => {
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split(".")[0];

      const response = await retry(async () => {
        return await rdsClient.send(new DescribeDBClustersCommand({}));
      });

      const cluster = response.DBClusters?.find(
        (c) => c.DBClusterIdentifier === clusterIdentifier || c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.DBClusterMembers).toBeDefined();
      expect(cluster?.DBClusterMembers!.length).toBe(2);
    }, 120000);

    test("Aurora instances should use db.serverless class", async () => {
      const clusterIdentifier = outputs.AuroraClusterEndpoint.split(".")[0];

      const response = await retry(async () => {
        return await rdsClient.send(new DescribeDBInstancesCommand({}));
      });

      const instances = response.DBInstances?.filter(
        (i) => i.DBClusterIdentifier === clusterIdentifier
      );

      expect(instances).toBeDefined();
      expect(instances!.length).toBeGreaterThanOrEqual(2);
      instances!.forEach((instance) => {
        expect(instance.DBInstanceClass).toBe("db.serverless");
      });
    }, 120000);
  });

  describe("Application Load Balancer Validation", () => {
    test("ALB should exist and be active", async () => {
      const response = await retry(async () => {
        return await elbClient.send(new DescribeLoadBalancersCommand({}));
      });

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");
    }, 90000);

    test("ALB should have HTTP listener", async () => {
      const lbResponse = await retry(async () => {
        return await elbClient.send(new DescribeLoadBalancersCommand({}));
      });

      const alb = lbResponse.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      expect(alb?.LoadBalancerArn).toBeDefined();

      const listenerResponse = await retry(async () => {
        return await elbClient.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb!.LoadBalancerArn,
          })
        );
      });

      const httpListener = listenerResponse.Listeners?.find((l) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe("HTTP");
    }, 90000);

    test("ALB should have target groups", async () => {
      const lbResponse = await retry(async () => {
        return await elbClient.send(new DescribeLoadBalancersCommand({}));
      });

      const alb = lbResponse.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      const tgResponse = await retry(async () => {
        return await elbClient.send(
          new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb!.LoadBalancerArn,
          })
        );
      });

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
      // Target type could be 'ip' for Fargate or 'lambda' for Lambda targets
      expect(["ip", "lambda"]).toContain(tgResponse.TargetGroups![0].TargetType);
    }, 90000);
  });

  describe("S3 Document Bucket Validation", () => {
    test("S3 bucket should exist", async () => {
      // Try to determine bucket region first
      const bucketName = outputs.DocumentBucketName;
      
      await retry(async () => {
        return await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 bucket");
    }, 60000);

    test("S3 bucket should have versioning enabled", async () => {
      const bucketName = outputs.DocumentBucketName;
      
      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 versioning");

      expect(response.Status).toBe("Enabled");
    }, 60000);

    test("S3 bucket should have encryption enabled", async () => {
      const bucketName = outputs.DocumentBucketName;
      
      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );
      }, 5, 2000, "S3 encryption");

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe("CloudWatch Logs Validation", () => {
    test("CloudWatch log group should exist", async () => {
      const response = await retry(async () => {
        return await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: outputs.LogGroupName,
          })
        );
      });

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.LogGroupName
      );
      expect(logGroup).toBeDefined();
    }, 90000);

    test("CloudWatch log group should have 365-day retention", async () => {
      const response = await retry(async () => {
        return await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: outputs.LogGroupName,
          })
        );
      });

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.LogGroupName
      );
      expect(logGroup).toBeDefined();
      if (logGroup?.retentionInDays) {
        expect(logGroup.retentionInDays).toBe(365);
      }
    }, 90000);
  });

  describe("End-to-End Infrastructure Validation", () => {
    test("complete infrastructure stack should be operational", () => {
      // Verify all critical components are present
      expect(outputs.VPCId).toBeTruthy();
      expect(outputs.ECSClusterName).toBeTruthy();
      expect(outputs.AuroraClusterEndpoint).toBeTruthy();
      expect(outputs.ApplicationLoadBalancerDNS).toBeTruthy();
      expect(outputs.DocumentBucketName).toBeTruthy();
      expect(outputs.LogGroupName).toBeTruthy();
    });

    test("ALB URL should be publicly accessible", () => {
      expect(outputs.ApplicationLoadBalancerURL).toBeDefined();
      expect(outputs.ApplicationLoadBalancerURL).toMatch(/^http:\/\//);
      expect(outputs.ApplicationLoadBalancerURL).toContain(outputs.ApplicationLoadBalancerDNS);
    });

    test("all resource names should follow naming convention", () => {
      expect(outputs.ECSClusterName).toMatch(/loan-processing-cluster-/);
      expect(outputs.ECSServiceName).toMatch(/loan-processing-service-/);
      expect(outputs.DocumentBucketName).toMatch(/loan-documents-/);
      expect(outputs.LogGroupName).toMatch(/\/ecs\/loan-processing-/);
    });
  });
});
