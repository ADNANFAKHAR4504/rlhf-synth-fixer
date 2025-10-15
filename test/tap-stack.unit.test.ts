import { Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

describe("TapStack Unit Tests", () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    const stack = new TapStack(app, "TapStack"); // Corrected stack name
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => Object.values(synthesized.resource[type] || {});

  it("should configure the AWS provider for us-east-2", () => {
    expect(synthesized.provider.aws).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alias: "us-east-2", region: "us-east-2" }),
      ])
    );
  });

  it("should create a single VPC with 4 subnets", () => {
    expect(findResources("aws_vpc")).toHaveLength(1);
    expect(findResources("aws_subnet")).toHaveLength(4);
  });

  it("should create 3 distinct security groups", () => {
    expect(findResources("aws_security_group")).toHaveLength(3);
  });

  it("should create an Application Load Balancer with a listener", () => {
    expect(findResources("aws_lb")).toHaveLength(1);
    expect(findResources("aws_lb_listener")).toHaveLength(1);
  });

  it("should create an ECS Cluster, Service, and Task Definition", () => {
    expect(findResources("aws_ecs_cluster")).toHaveLength(1);
    expect(findResources("aws_ecs_service")).toHaveLength(1);
    expect(findResources("aws_ecs_task_definition")).toHaveLength(1);
  });

  it("should create a DynamoDB Table", () => {
    expect(findResources("aws_dynamodb_table")).toHaveLength(1);
  });

  it("should create a Multi-AZ RDS Aurora cluster", () => {
    expect(findResources("aws_rds_cluster")).toHaveLength(1);
    expect(findResources("aws_rds_cluster_instance")).toHaveLength(2); // Check for 2 instances
  });

  it("should create a secret for the database password", () => {
    expect(findResources("aws_secretsmanager_secret")).toHaveLength(1);
    expect(findResources("aws_secretsmanager_secret_version")).toHaveLength(1);
  });

  it("should create a CloudWatch Alarm for the DB CPU", () => {
    const alarms = findResources("aws_cloudwatch_metric_alarm");
    expect(alarms.length).toBe(1);
    const alarm = alarms[0] as any;
    expect(alarm.metric_name).toBe("CPUUtilization");
    expect(alarm.namespace).toBe("AWS/RDS");
  });

  it("should have all required outputs for integration testing", () => {
    expect(synthesized.output).toHaveProperty("ApplicationEndpoint");
    expect(synthesized.output).toHaveProperty("DbClusterIdentifier");
    expect(synthesized.output).toHaveProperty("DynamoDbTableName");
    expect(synthesized.output).toHaveProperty("EcsClusterName");
    expect(synthesized.output).toHaveProperty("EcsServiceName");
  });
});
