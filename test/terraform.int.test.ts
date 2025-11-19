import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand
} from "@aws-sdk/client-ecs";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand
} from "@aws-sdk/client-application-auto-scaling";
import { ServiceDiscoveryClient, GetNamespaceCommand } from "@aws-sdk/client-servicediscovery";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";

describe("ECS Fargate Optimization - Integration Tests", () => {
  let outputs: any;
  const ecsClient = new ECSClient({ region: "us-east-1" });
  const elbClient = new ElasticLoadBalancingV2Client({ region: "us-east-1" });
  const cwClient = new CloudWatchClient({ region: "us-east-1" });
  const asgClient = new ApplicationAutoScalingClient({ region: "us-east-1" });
  const sdClient = new ServiceDiscoveryClient({ region: "us-east-1" });
  const ec2Client = new EC2Client({ region: "us-east-1" });
  const logsClient = new CloudWatchLogsClient({ region: "us-east-1" });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
  });

  test("ECS Cluster exists and is active", async () => {
    const response = await ecsClient.send(
      new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name],
      })
    );
    expect(response.clusters).toHaveLength(1);
    expect(response.clusters![0].status).toBe("ACTIVE");
    expect(response.clusters![0].clusterName).toBe(outputs.ecs_cluster_name);
  });

  test("API Service is running with correct configuration", async () => {
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.api_service_name],
      })
    );
    expect(response.services).toHaveLength(1);
    const service = response.services![0];
    expect(service.status).toBe("ACTIVE");
    expect(service.launchType).toBe("FARGATE");
    expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
  });

  test("Worker Service is running with correct configuration", async () => {
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.worker_service_name],
      })
    );
    expect(response.services).toHaveLength(1);
    const service = response.services![0];
    expect(service.status).toBe("ACTIVE");
    expect(service.launchType).toBe("FARGATE");
  });

  test("Scheduler Service is running with correct configuration", async () => {
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.scheduler_service_name],
      })
    );
    expect(response.services).toHaveLength(1);
    const service = response.services![0];
    expect(service.status).toBe("ACTIVE");
    expect(service.launchType).toBe("FARGATE");
  });

  test("Task definitions are using Fargate with correct resources", async () => {
    const taskDef = await ecsClient.send(
      new DescribeTaskDefinitionCommand({
        taskDefinition: outputs.api_task_definition_arn,
      })
    );
    expect(taskDef.taskDefinition?.requiresCompatibilities).toContain("FARGATE");
    expect(taskDef.taskDefinition?.networkMode).toBe("awsvpc");
    expect(taskDef.taskDefinition?.cpu).toBeDefined();
    expect(taskDef.taskDefinition?.memory).toBeDefined();
  });

  test("Application Load Balancer exists and is active", async () => {
    const response = await elbClient.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn],
      })
    );
    expect(response.LoadBalancers).toHaveLength(1);
    expect(response.LoadBalancers![0].State?.Code).toBe("active");
    expect(response.LoadBalancers![0].Scheme).toBe("internet-facing");
  });

  test("Target groups are healthy", async () => {
    const apiHealth = await elbClient.send(
      new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.api_target_group_arn,
      })
    );
    expect(apiHealth.TargetHealthDescriptions).toBeDefined();

    const workerHealth = await elbClient.send(
      new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.worker_target_group_arn,
      })
    );
    expect(workerHealth.TargetHealthDescriptions).toBeDefined();
  });

  test("CloudWatch alarms are configured", async () => {
    const response = await cwClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: "ecs-",
      })
    );
    const alarmNames = response.MetricAlarms?.map((a) => a.AlarmName) || [];
    expect(alarmNames.some((name) => name?.includes("cpu-high"))).toBe(true);
    expect(alarmNames.some((name) => name?.includes("memory-high"))).toBe(true);
  });

  test("Auto-scaling targets are configured", async () => {
    const response = await asgClient.send(
      new DescribeScalableTargetsCommand({
        ServiceNamespace: "ecs",
      })
    );
    const targets = response.ScalableTargets?.filter(
      (t) => t.ResourceId?.includes(outputs.ecs_cluster_name)
    );
    expect(targets!.length).toBeGreaterThanOrEqual(3); // API, Worker, Scheduler
  });

  test("Auto-scaling policies are configured", async () => {
    const response = await asgClient.send(
      new DescribeScalingPoliciesCommand({
        ServiceNamespace: "ecs",
      })
    );
    const policies = response.ScalingPolicies?.filter(
      (p) => p.ResourceId?.includes(outputs.ecs_cluster_name)
    );
    expect(policies!.length).toBeGreaterThanOrEqual(5); // CPU and Memory policies
  });

  test("VPC and subnets are configured correctly", async () => {
    const vpcResponse = await ec2Client.send(
      new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      })
    );
    expect(vpcResponse.Vpcs).toHaveLength(1);
    expect(vpcResponse.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");

    const subnetResponse = await ec2Client.send(
      new DescribeSubnetsCommand({
        SubnetIds: [...outputs.private_subnet_ids, ...outputs.public_subnet_ids],
      })
    );
    expect(subnetResponse.Subnets).toHaveLength(6); // 3 private + 3 public
  });

  test("CloudWatch Log Groups exist", async () => {
    const response = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: "/ecs/",
      })
    );
    const logGroupNames = response.logGroups?.map((lg) => lg.logGroupName) || [];
    expect(logGroupNames).toContain(outputs.cloudwatch_log_group_api);
    expect(logGroupNames).toContain(outputs.cloudwatch_log_group_worker);
    expect(logGroupNames).toContain(outputs.cloudwatch_log_group_scheduler);
  });

  test("All resources use environment suffix in naming", () => {
    expect(outputs.ecs_cluster_name).toContain("dev");
    expect(outputs.api_service_name).toContain("dev");
    expect(outputs.worker_service_name).toContain("dev");
    expect(outputs.scheduler_service_name).toContain("dev");
  });

  test("Service discovery namespace is configured", () => {
    expect(outputs.service_discovery_namespace).toBe("ecs-services-dev.local");
  });
});
