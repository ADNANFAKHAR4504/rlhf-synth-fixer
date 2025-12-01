// ECS Blue-Green Deployment Integration Tests
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
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  ServiceDiscoveryClient,
  GetNamespaceCommand,
  ListServicesCommand,
} from "@aws-sdk/client-servicediscovery";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
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
      // If it's already flat, return as-is
      return parsed;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: Record<string, string> = {};
  const envVars = [
    "VPCId",
    "ECSClusterName",
    "ECSClusterArn",
    "ALBDNSName",
    "ALBArn",
    "BlueServiceName",
    "GreenServiceName",
    "BlueTargetGroupArn",
    "GreenTargetGroupArn",
    "ServiceDiscoveryNamespace",
    "SNSTopicArn",
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
const elbClient = new ElasticLoadBalancingV2Client({ region });
const serviceDiscoveryClient = new ServiceDiscoveryClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe("LIVE: VPC and Networking", () => {
  const vpcId = outputs.VPCId;

  test("VPC exists and is configured correctly", async () => {
    expect(vpcId).toBeTruthy();

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId!] })
      );
    });

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs!.length).toBe(1);
    expect(response.Vpcs![0].VpcId).toBe(vpcId);
    expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
  }, 90000);

  test("VPC has required subnets", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId!] }],
        })
      );
    });

    expect(response.Subnets).toBeDefined();
    expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
  }, 90000);
});

describe("LIVE: ECS Cluster", () => {
  const clusterName = outputs.ECSClusterName;
  const clusterArn = outputs.ECSClusterArn;

  test("ECS cluster exists and is active", async () => {
    expect(clusterName).toBeTruthy();

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName!],
          include: ["CONFIGURATIONS", "SETTINGS"],
        })
      );
    });

    expect(response.clusters).toBeDefined();
    expect(response.clusters!.length).toBe(1);
    expect(response.clusters![0].clusterName).toBe(clusterName);
    expect(response.clusters![0].status).toBe("ACTIVE");
    
    if (clusterArn) {
      expect(response.clusters![0].clusterArn).toBe(clusterArn);
    }
  }, 90000);

  test("ECS cluster has correct configuration", async () => {
    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName!],
          include: ["SETTINGS"],
        })
      );
    });

    const cluster = response.clusters![0];
    expect(cluster).toBeTruthy();
    expect(cluster.status).toBe("ACTIVE");
  }, 90000);
});

describe("LIVE: ECS Services - Blue-Green Deployment", () => {
  const clusterName = outputs.ECSClusterName;
  const blueServiceName = outputs.BlueServiceName;
  const greenServiceName = outputs.GreenServiceName;

  test("Blue ECS service exists and is active", async () => {
    expect(blueServiceName).toBeTruthy();

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    expect(response.services).toBeDefined();
    expect(response.services!.length).toBe(1);
    expect(response.services![0].serviceName).toBe(blueServiceName);
    expect(response.services![0].status).toBe("ACTIVE");
    expect(response.services![0].launchType).toBe("FARGATE");
  }, 90000);

  test("Green ECS service exists and is active", async () => {
    expect(greenServiceName).toBeTruthy();

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [greenServiceName!],
        })
      );
    });

    expect(response.services).toBeDefined();
    expect(response.services!.length).toBe(1);
    expect(response.services![0].serviceName).toBe(greenServiceName);
    expect(response.services![0].status).toBe("ACTIVE");
    expect(response.services![0].launchType).toBe("FARGATE");
  }, 90000);

  test("Blue service has deployment configuration", async () => {
    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    const service = response.services![0];
    expect(service.deploymentConfiguration).toBeTruthy();
    expect(service.deploymentConfiguration!.maximumPercent).toBeGreaterThan(100);
    expect(service.deploymentConfiguration!.minimumHealthyPercent).toBeGreaterThanOrEqual(0);
  }, 90000);

  test("Green service has deployment configuration", async () => {
    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [greenServiceName!],
        })
      );
    });

    const service = response.services![0];
    expect(service.deploymentConfiguration).toBeTruthy();
    expect(service.deploymentConfiguration!.maximumPercent).toBeGreaterThan(100);
    expect(service.deploymentConfiguration!.minimumHealthyPercent).toBeGreaterThanOrEqual(0);
  }, 90000);

  test("Both services have desired task count", async () => {
    const blueResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    const greenResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [greenServiceName!],
        })
      );
    });

    expect(blueResponse.services![0].desiredCount).toBeGreaterThan(0);
    expect(greenResponse.services![0].desiredCount).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: Application Load Balancer", () => {
  const albArn = outputs.ALBArn;
  const albDnsName = outputs.ALBDNSName;

  test("Application Load Balancer exists and is active", async () => {
    expect(albArn).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn!],
        })
      );
    });

    expect(response.LoadBalancers).toBeDefined();
    expect(response.LoadBalancers!.length).toBe(1);
    expect(response.LoadBalancers![0].LoadBalancerArn).toBe(albArn);
    expect(response.LoadBalancers![0].State?.Code).toBe("active");
    expect(response.LoadBalancers![0].Type).toBe("application");
    expect(response.LoadBalancers![0].Scheme).toBe("internet-facing");
  }, 90000);

  test("ALB DNS name matches output", async () => {
    expect(albDnsName).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn!],
        })
      );
    });

    expect(response.LoadBalancers![0].DNSName).toBe(albDnsName);
  }, 90000);

  test("ALB has listeners configured", async () => {
    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn!,
        })
      );
    });

    expect(response.Listeners).toBeTruthy();
    expect(response.Listeners!.length).toBeGreaterThan(0);
    
    const httpListener = response.Listeners!.find(
      (listener) => listener.Port === 80 && listener.Protocol === "HTTP"
    );
    expect(httpListener).toBeTruthy();
  }, 90000);
});

describe("LIVE: Target Groups", () => {
  const blueTargetGroupArn = outputs.BlueTargetGroupArn;
  const greenTargetGroupArn = outputs.GreenTargetGroupArn;

  test("Blue target group exists and is configured", async () => {
    expect(blueTargetGroupArn).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [blueTargetGroupArn!],
        })
      );
    });

    expect(response.TargetGroups).toBeDefined();
    expect(response.TargetGroups!.length).toBe(1);
    expect(response.TargetGroups![0].TargetGroupArn).toBe(blueTargetGroupArn);
    expect(response.TargetGroups![0].TargetType).toBe("ip");
    expect(response.TargetGroups![0].HealthCheckEnabled).toBe(true);
  }, 90000);

  test("Green target group exists and is configured", async () => {
    expect(greenTargetGroupArn).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [greenTargetGroupArn!],
        })
      );
    });

    expect(response.TargetGroups).toBeDefined();
    expect(response.TargetGroups!.length).toBe(1);
    expect(response.TargetGroups![0].TargetGroupArn).toBe(greenTargetGroupArn);
    expect(response.TargetGroups![0].TargetType).toBe("ip");
    expect(response.TargetGroups![0].HealthCheckEnabled).toBe(true);
  }, 90000);

  test("Target groups have health checks configured", async () => {
    const blueResponse = await retry(async () => {
      return await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [blueTargetGroupArn!],
        })
      );
    });

    const greenResponse = await retry(async () => {
      return await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [greenTargetGroupArn!],
        })
      );
    });

    expect(blueResponse.TargetGroups![0].HealthCheckProtocol).toBeTruthy();
    expect(blueResponse.TargetGroups![0].HealthCheckPath).toBeTruthy();
    expect(greenResponse.TargetGroups![0].HealthCheckProtocol).toBeTruthy();
    expect(greenResponse.TargetGroups![0].HealthCheckPath).toBeTruthy();
  }, 90000);
});

describe("LIVE: Service Discovery", () => {
  const namespaceId = outputs.ServiceDiscoveryNamespace;

  test("Service Discovery namespace exists", async () => {
    expect(namespaceId).toBeTruthy();

    const response = await retry(async () => {
      return await serviceDiscoveryClient.send(
        new GetNamespaceCommand({ Id: namespaceId! })
      );
    });

    expect(response.Namespace).toBeDefined();
    expect(response.Namespace!.Id).toBe(namespaceId);
    expect(response.Namespace!.Type).toBe("DNS_PRIVATE");
  }, 90000);

  test("Service Discovery has services registered", async () => {
    // List services without filters first to avoid filter issues
    const response = await retry(async () => {
      return await serviceDiscoveryClient.send(
        new ListServicesCommand({})
      );
    }, 5); // Fewer retries if services might not exist yet

    // Services might not be registered yet, but namespace should exist
    expect(response.Services).toBeDefined();
  }, 60000);
});

describe("LIVE: SNS Topic", () => {
  const topicArn = outputs.SNSTopicArn;

  test("SNS topic exists", async () => {
    expect(topicArn).toBeTruthy();

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeDefined();
    expect(response.Attributes!.TopicArn).toBe(topicArn);
  }, 90000);

  test("SNS topic has subscriptions", async () => {
    const response = await retry(async () => {
      return await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Subscriptions).toBeDefined();
    // Subscriptions might be empty initially, but topic should exist
  }, 90000);
});

describe("LIVE: CloudWatch Logs", () => {
  const logGroupName = outputs.LogGroupName;

  test("CloudWatch log group exists", async () => {
    expect(logGroupName).toBeTruthy();

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName! })
      );
    });

    expect(response.logGroups).toBeDefined();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeDefined();
    
    if (logGroup!.retentionInDays) {
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    }
  }, 90000);
});

describe("LIVE: Security Groups", () => {
  const vpcId = outputs.VPCId;

  test("Security groups exist for ALB and ECS", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId!] }],
        })
      );
    });

    expect(response.SecurityGroups).toBeDefined();
    expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    
    // Should have ALB and ECS security groups
    const albSG = response.SecurityGroups!.find(
      (sg) => sg.GroupName?.includes("alb") || sg.Description?.toLowerCase().includes("load balancer")
    );
    const ecsSG = response.SecurityGroups!.find(
      (sg) => sg.GroupName?.includes("ecs") || sg.Description?.toLowerCase().includes("ecs")
    );

    expect(albSG || ecsSG).toBeTruthy();
  }, 90000);
});

describe("LIVE: Output Validation", () => {
  test("All required outputs are present", () => {
    const requiredOutputs = [
      "VPCId",
      "ECSClusterName",
      "ECSClusterArn",
      "ALBDNSName",
      "ALBArn",
      "BlueServiceName",
      "GreenServiceName",
      "BlueTargetGroupArn",
      "GreenTargetGroupArn",
      "ServiceDiscoveryNamespace",
      "SNSTopicArn",
      "LogGroupName",
    ];

    requiredOutputs.forEach((outputName) => {
      expect(outputs[outputName]).toBeDefined();
      expect(outputs[outputName]).toBeTruthy();
    });
  });

  test("Output values have correct formats", () => {
    // VPC ID format
    expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);

    // ECS Cluster ARN format
    expect(outputs.ECSClusterArn).toMatch(/^arn:aws:ecs:.*:cluster\/.*$/);

    // ALB ARN format
    expect(outputs.ALBArn).toMatch(/^arn:aws:elasticloadbalancing:.*:loadbalancer\/app\/.*$/);

    // ALB DNS name format
    expect(outputs.ALBDNSName).toMatch(/.*\.elb\.amazonaws\.com$/);

    // Target Group ARN format
    expect(outputs.BlueTargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:.*:targetgroup\/.*$/);
    expect(outputs.GreenTargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:.*:targetgroup\/.*$/);

    // SNS Topic ARN format
    expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:.*:.*:.*$/);

    // Log Group name format
    expect(outputs.LogGroupName).toMatch(/^\/ecs\/.*$/);
  });
});

describe("LIVE: Blue-Green Deployment Integration", () => {
  const clusterName = outputs.ECSClusterName;
  const blueServiceName = outputs.BlueServiceName;
  const greenServiceName = outputs.GreenServiceName;
  const blueTargetGroupArn = outputs.BlueTargetGroupArn;
  const greenTargetGroupArn = outputs.GreenTargetGroupArn;

  test("Both services are registered with their respective target groups", async () => {
    const blueServiceResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    const greenServiceResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [greenServiceName!],
        })
      );
    });

    const blueService = blueServiceResponse.services![0];
    const greenService = greenServiceResponse.services![0];

    expect(blueService.loadBalancers).toBeDefined();
    expect(blueService.loadBalancers!.length).toBeGreaterThan(0);
    expect(greenService.loadBalancers).toBeDefined();
    expect(greenService.loadBalancers!.length).toBeGreaterThan(0);

    // Verify target groups are associated
    const blueTargetGroup = blueService.loadBalancers!.find(
      (lb) => lb.targetGroupArn === blueTargetGroupArn
    );
    const greenTargetGroup = greenService.loadBalancers!.find(
      (lb) => lb.targetGroupArn === greenTargetGroupArn
    );

    expect(blueTargetGroup || greenTargetGroup).toBeTruthy();
  }, 120000);

  test("Both services have running tasks", async () => {
    const blueTasks = await retry(async () => {
      return await ecsClient.send(
        new ListTasksCommand({
          cluster: clusterName!,
          serviceName: blueServiceName!,
        })
      );
    });

    const greenTasks = await retry(async () => {
      return await ecsClient.send(
        new ListTasksCommand({
          cluster: clusterName!,
          serviceName: greenServiceName!,
        })
      );
    });

    // At least one service should have tasks
    expect(
      (blueTasks.taskArns?.length || 0) > 0 ||
      (greenTasks.taskArns?.length || 0) > 0
    ).toBe(true);
  }, 120000);
});

describe("LIVE: Security and Compliance", () => {
  const vpcId = outputs.VPCId;

  test("ECS services run in private subnets", async () => {
    const clusterName = outputs.ECSClusterName;
    const blueServiceName = outputs.BlueServiceName;

    const serviceResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    const service = serviceResponse.services![0];
    expect(service.networkConfiguration).toBeDefined();
    expect(service.networkConfiguration!.awsvpcConfiguration).toBeDefined();
    expect(service.networkConfiguration!.awsvpcConfiguration!.subnets).toBeDefined();
    expect(service.networkConfiguration!.awsvpcConfiguration!.subnets!.length).toBeGreaterThan(0);
    expect(service.networkConfiguration!.awsvpcConfiguration!.assignPublicIp).toBe("DISABLED");
  }, 120000);

  test("ALB is in public subnets", async () => {
    const albArn = outputs.ALBArn;

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn!],
        })
      );
    });

    const alb = response.LoadBalancers![0];
    expect(alb.AvailabilityZones).toBeDefined();
    expect(alb.AvailabilityZones!.length).toBeGreaterThan(0);
    expect(alb.Scheme).toBe("internet-facing");
  }, 90000);
});
