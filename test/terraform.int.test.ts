import { DescribeTargetHealthCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import {
  DescribeServicesCommand,
  ECSClient,
} from "@aws-sdk/client-ecs";
import {
  DescribeRepositoriesCommand,
  ECRClient,
} from "@aws-sdk/client-ecr";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

jest.setTimeout(60000);

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");

const readOutputs = (): Record<string, unknown> => {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Expected stack outputs at ${outputsPath}. Deploy the Terraform stack and export outputs before running integration tests.`
    );
  }
  const raw = fs.readFileSync(outputsPath, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed == null || typeof parsed !== "object") {
    throw new Error("Stack outputs JSON is malformed.");
  }
  return parsed as Record<string, unknown>;
};

const hitApplicationHealthEndpoint = async (
  host: string,
  pathSuffix = "/health"
): Promise<{ protocol: string; status: number }> => {
  const protocols = ["https", "http"];
  let lastError: unknown;

  for (const protocol of protocols) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${protocol}://${host}${pathSuffix}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.status < 400) {
        return { protocol, status: response.status };
      }
      lastError = new Error(
        `Received non-OK status ${response.status} from ${protocol}://${host}${pathSuffix}`
      );
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("Unable to reach application endpoint.");
};

describe("Terraform infrastructure integration", () => {
  const outputs = readOutputs();
  const region =
    (typeof outputs.aws_region === "string" && outputs.aws_region) ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    "us-east-1";

  describe("End-to-end testing", () => {
    it("validates the complete ECS Fargate deployment workflow", async () => {
      const requiredKeys = [
        "alb_dns_name",
        "alb_target_group_arn",
        "ecr_repository_url",
        "ecs_cluster_name",
        "ecs_service_name",
        "rds_endpoint",
        "rds_master_secret_arn",
        "cloudwatch_log_group",
      ];

      requiredKeys.forEach((key) => {
        const value = outputs[key];
        expect(outputs[key]).toBeDefined();
        expect(typeof value).toBe("string");
        expect((value as string).length).toBeGreaterThan(0);
      });

      expect(outputs.alb_dns_name as string).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs.ecr_repository_url as string).toMatch(/\.dkr\.ecr\./);
      expect(outputs.rds_endpoint as string).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.rds_master_secret_arn as string).toMatch(/^arn:aws:secretsmanager:/);

      const { protocol, status } = await hitApplicationHealthEndpoint(
        outputs.alb_dns_name as string
      );
      expect(["http", "https"]).toContain(protocol);
      expect(status).toBeLessThan(400);

      const elbv2 = new ElasticLoadBalancingV2Client({ region });
      const result = await elbv2.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.alb_target_group_arn as string,
        })
      );
      const descriptions = result.TargetHealthDescriptions ?? [];
      expect(descriptions.length).toBeGreaterThan(0);
      descriptions.forEach((description) => {
        expect(description.TargetHealth?.State).toBe("healthy");
      });

      const secrets = new SecretsManagerClient({ region });
      const secret = await secrets.send(
        new DescribeSecretCommand({
          SecretId: outputs.rds_master_secret_arn as string,
        })
      );
      expect(secret.ARN).toBe(outputs.rds_master_secret_arn);
      expect(secret.Name).toBeDefined();
      expect(secret.CreatedDate).toBeInstanceOf(Date);
    });

    it("verifies backing AWS services are healthy", async () => {
      const ecs = new ECSClient({ region });
      const ecr = new ECRClient({ region });
      const logs = new CloudWatchLogsClient({ region });
      const rds = new RDSClient({ region });

      const ecsResponse = await ecs.send(
        new DescribeServicesCommand({
          cluster: outputs.ecs_cluster_name as string,
          services: [outputs.ecs_service_name as string],
        })
      );
      const service = ecsResponse.services?.[0];
      expect(service).toBeDefined();
      expect(service?.status).toBe("ACTIVE");
      expect(service?.desiredCount ?? 0).toBeGreaterThanOrEqual(2);
      expect(service?.runningCount ?? 0).toBeGreaterThanOrEqual(2);

      const repositoryName = (outputs.ecr_repository_url as string)
        .split("/")
        .slice(-1)[0];
      const ecrResponse = await ecr.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
      expect(ecrResponse.repositories?.[0]?.repositoryUri).toBe(
        outputs.ecr_repository_url
      );

      const logResponse = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_group as string,
          limit: 1,
        })
      );
      const logGroup = logResponse.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(outputs.cloudwatch_log_group);
      expect(logGroup?.retentionInDays).toBe(7);

      const dbResponse = await rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.rds_identifier as string,
        })
      );
      const dbInstance = dbResponse.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.MultiAZ).toBe(true);
    });
  });
});
