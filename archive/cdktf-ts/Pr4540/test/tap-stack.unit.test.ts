import { Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

describe("TapStack Unit Tests", () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    const stack = new TapStack(app, "TapStack");
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => Object.values(synthesized.resource[type] || {});

  it("should configure the AWS provider for us-east-1", () => {
    expect(synthesized.provider.aws).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alias: "us-east-1", region: "us-east-1" }),
      ])
    );
  });

  it("should create a single VPC with 4 subnets", () => {
    expect(findResources("aws_vpc")).toHaveLength(1);
    expect(findResources("aws_subnet")).toHaveLength(4);
  });

  it("should create security groups for ALB, ECS, and DB", () => {
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

  it("should create a DynamoDB Table with encryption", () => {
    const tables = findResources("aws_dynamodb_table");
    expect(tables).toHaveLength(1);
    expect((tables[0] as any).server_side_encryption).toEqual({ enabled: true, kms_key_arn: expect.any(String) });
  });

  it("should create a Multi-AZ RDS Aurora cluster with encryption", () => {
    const clusters = findResources("aws_rds_cluster");
    expect(clusters).toHaveLength(1);
    const cluster = clusters[0] as any;
    expect(cluster.storage_encrypted).toBe(true);
    expect(cluster.kms_key_id).toBeDefined();
    expect(findResources("aws_rds_cluster_instance")).toHaveLength(2);
  });

  it("should create a secret for the database password with encryption", () => {
    const secrets = findResources("aws_secretsmanager_secret");
    expect(secrets).toHaveLength(1);
    expect((secrets[0] as any).kms_key_id).toBeDefined();
    expect(findResources("aws_secretsmanager_secret_version")).toHaveLength(1);
  });

  it("should create a CloudWatch Alarm for the DB CPU", () => {
    expect(findResources("aws_cloudwatch_metric_alarm")).toHaveLength(1);
  });

  it("should create a KMS Key", () => {
    expect(findResources("aws_kms_key")).toHaveLength(1);
  });

  it("should create an SNS Topic for alarms", () => {
    expect(findResources("aws_sns_topic")).toHaveLength(1);
  });

  it("should create a Lambda function for failover", () => {
    expect(findResources("aws_lambda_function")).toHaveLength(1);
  });

  it("should create an SSM Document for DR testing", () => {
    expect(findResources("aws_ssm_document")).toHaveLength(1);
  });

  it("should create AWS Backup resources", () => {
    expect(findResources("aws_backup_vault")).toHaveLength(1);
    expect(findResources("aws_backup_plan")).toHaveLength(1);
    expect(findResources("aws_backup_selection")).toHaveLength(1);
  });

  it("should have all required outputs for integration testing", () => {
    expect(synthesized.output).toHaveProperty("ApplicationEndpoint");
    expect(synthesized.output).toHaveProperty("DbClusterIdentifier");
    expect(synthesized.output).toHaveProperty("DynamoDbTableName");
    expect(synthesized.output).toHaveProperty("EcsClusterName");
    expect(synthesized.output).toHaveProperty("EcsServiceName");
    expect(synthesized.output).toHaveProperty("KmsKeyArn");
    expect(synthesized.output).toHaveProperty("SnsTopicArn");
    expect(synthesized.output).toHaveProperty("LambdaFunctionName");
    expect(synthesized.output).toHaveProperty("BackupVaultName");
  });
});
