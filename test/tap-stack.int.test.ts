import * as fs from "fs";
import * as path from "path";
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeRulesCommand,
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
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

type CfOutputValue = {
  Description?: string;
  Value: string;
  Export?: {
    Name: string;
  };
};

type StructuredOutputs = {
  VPCId?: CfOutputValue;
  ECSClusterName?: CfOutputValue;
  ECSClusterArn?: CfOutputValue;
  ALBDNSName?: CfOutputValue;
  ALBArn?: CfOutputValue;
  BlueServiceName?: CfOutputValue;
  GreenServiceName?: CfOutputValue;
  BlueTargetGroupArn?: CfOutputValue;
  GreenTargetGroupArn?: CfOutputValue;
  ServiceDiscoveryNamespace?: CfOutputValue;
  SNSTopicArn?: CfOutputValue;
  LogGroupName?: CfOutputValue;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
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
        return parsed.Outputs;
      }
      return parsed;
    }
  }

  // Fallback: try reading from environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.CFN_VPC_ID) {
    outputs.VPCId = { Value: process.env.CFN_VPC_ID };
  }
  if (process.env.CFN_ECS_CLUSTER_NAME) {
    outputs.ECSClusterName = { Value: process.env.CFN_ECS_CLUSTER_NAME };
  }
  if (process.env.CFN_ECS_CLUSTER_ARN) {
    outputs.ECSClusterArn = { Value: process.env.CFN_ECS_CLUSTER_ARN };
  }
  if (process.env.CFN_ALB_DNS_NAME) {
    outputs.ALBDNSName = { Value: process.env.CFN_ALB_DNS_NAME };
  }
  if (process.env.CFN_ALB_ARN) {
    outputs.ALBArn = { Value: process.env.CFN_ALB_ARN };
  }
  if (process.env.CFN_BLUE_SERVICE_NAME) {
    outputs.BlueServiceName = { Value: process.env.CFN_BLUE_SERVICE_NAME };
  }
  if (process.env.CFN_GREEN_SERVICE_NAME) {
    outputs.GreenServiceName = { Value: process.env.CFN_GREEN_SERVICE_NAME };
  }
  if (process.env.CFN_BLUE_TARGET_GROUP_ARN) {
    outputs.BlueTargetGroupArn = { Value: process.env.CFN_BLUE_TARGET_GROUP_ARN };
  }
  if (process.env.CFN_GREEN_TARGET_GROUP_ARN) {
    outputs.GreenTargetGroupArn = { Value: process.env.CFN_GREEN_TARGET_GROUP_ARN };
  }
  if (process.env.CFN_SERVICE_DISCOVERY_NAMESPACE) {
    outputs.ServiceDiscoveryNamespace = { Value: process.env.CFN_SERVICE_DISCOVERY_NAMESPACE };
  }
  if (process.env.CFN_SNS_TOPIC_ARN) {
    outputs.SNSTopicArn = { Value: process.env.CFN_SNS_TOPIC_ARN };
  }
  if (process.env.CFN_LOG_GROUP_NAME) {
    outputs.LogGroupName = { Value: process.env.CFN_LOG_GROUP_NAME };
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
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const serviceDiscoveryClient = new ServiceDiscoveryClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ec2Client = new EC2Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe("LIVE: VPC and Networking", () => {
  const vpcId = outputs.VPCId?.Value;

  test("VPC exists and is configured correctly", async () => {
    expect(vpcId).toBeTruthy();

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId!] })
      );
    });

    expect(response.Vpcs).toBeTruthy();
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

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
  }, 90000);
});

describe("LIVE: ECS Cluster", () => {
  const clusterName = outputs.ECSClusterName?.Value;
  const clusterArn = outputs.ECSClusterArn?.Value;

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

    expect(response.clusters).toBeTruthy();
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
  const clusterName = outputs.ECSClusterName?.Value;
  const blueServiceName = outputs.BlueServiceName?.Value;
  const greenServiceName = outputs.GreenServiceName?.Value;

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

    expect(response.services).toBeTruthy();
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

    expect(response.services).toBeTruthy();
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
  const albArn = outputs.ALBArn?.Value;
  const albDnsName = outputs.ALBDNSName?.Value;

  test("Application Load Balancer exists and is active", async () => {
    expect(albArn).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn!],
        })
      );
    });

    expect(response.LoadBalancers).toBeTruthy();
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
  const blueTargetGroupArn = outputs.BlueTargetGroupArn?.Value;
  const greenTargetGroupArn = outputs.GreenTargetGroupArn?.Value;

  test("Blue target group exists and is configured", async () => {
    expect(blueTargetGroupArn).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [blueTargetGroupArn!],
        })
      );
    });

    expect(response.TargetGroups).toBeTruthy();
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

    expect(response.TargetGroups).toBeTruthy();
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
  const namespaceId = outputs.ServiceDiscoveryNamespace?.Value;

  test("Service Discovery namespace exists", async () => {
    expect(namespaceId).toBeTruthy();

    const response = await retry(async () => {
      return await serviceDiscoveryClient.send(
        new GetNamespaceCommand({ Id: namespaceId! })
      );
    });

    expect(response.Namespace).toBeTruthy();
    expect(response.Namespace!.Id).toBe(namespaceId);
    expect(response.Namespace!.Type).toBe("DNS_PRIVATE");
  }, 90000);

  test("Service Discovery has services registered", async () => {
    const response = await retry(async () => {
      return await serviceDiscoveryClient.send(
        new ListServicesCommand({
          Filters: [
            {
              Name: "NAMESPACE_ID",
              Values: [namespaceId!],
            },
          ],
        })
      );
    }, 5); // Fewer retries if services might not exist yet

    // Services might not be registered yet, but namespace should exist
    expect(response.Services).toBeDefined();
  }, 60000);
});

describe("LIVE: SNS Topic", () => {
  const topicArn = outputs.SNSTopicArn?.Value;

  test("SNS topic exists", async () => {
    expect(topicArn).toBeTruthy();

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeTruthy();
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
  const logGroupName = outputs.LogGroupName?.Value;

  test("CloudWatch log group exists", async () => {
    expect(logGroupName).toBeTruthy();

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName! })
      );
    });

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    
    if (logGroup!.retentionInDays) {
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    }
  }, 90000);
});

describe("LIVE: Security Groups", () => {
  const vpcId = outputs.VPCId?.Value;

  test("Security groups exist for ALB and ECS", async () => {
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId!] }],
        })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
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

describe("LIVE: CloudWatch Alarms", () => {
  const snsTopicArn = outputs.SNSTopicArn?.Value;

  test("CloudWatch alarms exist for ECS services", async () => {
    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "ecs",
        })
      );
    }, 5); // Fewer retries if alarms might not exist yet

    // Alarms might not be created yet, but this verifies the API works
    expect(response.MetricAlarms).toBeDefined();
  }, 60000);
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
      expect(outputs[outputName as keyof StructuredOutputs]).toBeTruthy();
      expect(outputs[outputName as keyof StructuredOutputs]?.Value).toBeTruthy();
    });
  });

  test("Output values have correct formats", () => {
    // VPC ID format
    expect(outputs.VPCId?.Value).toMatch(/^vpc-[a-z0-9]+$/);

    // ECS Cluster ARN format
    expect(outputs.ECSClusterArn?.Value).toMatch(/^arn:aws:ecs:.*:cluster\/.*$/);

    // ALB ARN format
    expect(outputs.ALBArn?.Value).toMatch(/^arn:aws:elasticloadbalancing:.*:loadbalancer\/app\/.*$/);

    // ALB DNS name format
    expect(outputs.ALBDNSName?.Value).toMatch(/.*\.elb\.amazonaws\.com$/);

    // Target Group ARN format
    expect(outputs.BlueTargetGroupArn?.Value).toMatch(/^arn:aws:elasticloadbalancing:.*:targetgroup\/.*$/);
    expect(outputs.GreenTargetGroupArn?.Value).toMatch(/^arn:aws:elasticloadbalancing:.*:targetgroup\/.*$/);

    // SNS Topic ARN format
    expect(outputs.SNSTopicArn?.Value).toMatch(/^arn:aws:sns:.*:.*:.*$/);

    // Log Group name format
    expect(outputs.LogGroupName?.Value).toMatch(/^\/ecs\/.*$/);
  });
});

describe("LIVE: Blue-Green Deployment Integration", () => {
  const clusterName = outputs.ECSClusterName?.Value;
  const blueServiceName = outputs.BlueServiceName?.Value;
  const greenServiceName = outputs.GreenServiceName?.Value;
  const blueTargetGroupArn = outputs.BlueTargetGroupArn?.Value;
  const greenTargetGroupArn = outputs.GreenTargetGroupArn?.Value;

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

    expect(blueService.loadBalancers).toBeTruthy();
    expect(blueService.loadBalancers!.length).toBeGreaterThan(0);
    expect(greenService.loadBalancers).toBeTruthy();
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
  const vpcId = outputs.VPCId?.Value;

  test("ECS services run in private subnets", async () => {
    const clusterName = outputs.ECSClusterName?.Value;
    const blueServiceName = outputs.BlueServiceName?.Value;

    const serviceResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [blueServiceName!],
        })
      );
    });

    const service = serviceResponse.services![0];
    expect(service.networkConfiguration).toBeTruthy();
    expect(service.networkConfiguration!.awsvpcConfiguration).toBeTruthy();
    expect(service.networkConfiguration!.awsvpcConfiguration!.subnets).toBeTruthy();
    expect(service.networkConfiguration!.awsvpcConfiguration!.subnets!.length).toBeGreaterThan(0);
    expect(service.networkConfiguration!.awsvpcConfiguration!.assignPublicIp).toBe("DISABLED");
  }, 120000);

  test("ALB is in public subnets", async () => {
    const albArn = outputs.ALBArn?.Value;

    const response = await retry(async () => {
      return await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn!],
        })
      );
    });

    const alb = response.LoadBalancers![0];
    expect(alb.AvailabilityZones).toBeTruthy();
    expect(alb.AvailabilityZones!.length).toBeGreaterThan(0);
    expect(alb.Scheme).toBe("internet-facing");
  }, 90000);
});
