import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand
} from "@aws-sdk/client-application-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { EC2Client } from "@aws-sdk/client-ec2";
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient
} from "@aws-sdk/client-ecs";
import {
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
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

  test("CloudWatch Log Groups exist", async () => {
    const response = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: "/ecs/",
      })
    );
    const logGroupNames = response.logGroups?.map((lg) => lg.logGroupName) || [];
    expect(logGroupNames).toContain(outputs.cloudwatch_log_group_api);
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
