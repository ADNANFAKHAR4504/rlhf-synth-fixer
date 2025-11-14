import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeRepositoriesCommand,
  ECRClient,
} from "@aws-sdk/client-ecr";
import {
  DescribeServicesCommand,
  ECSClient,
} from "@aws-sdk/client-ecs";
import { DescribeTargetHealthCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

jest.setTimeout(60000);

const outputsPath = path.resolve(
  __dirname,
  "../cfn-outputs/all-outputs.json"
);

type FlatOutput = Record<string, unknown>;

const readOutputs = (): FlatOutput => {
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
  return parsed as FlatOutput;
};

const extractStringOutput = (
  outputs: FlatOutput,
  key: string,
  required = true
): string => {
  const raw = outputs[key];
  if (typeof raw === "string") {
    return raw;
  }

  if (raw && typeof raw === "object" && "value" in raw) {
    const inner = (raw as Record<string, unknown>).value;
    if (typeof inner === "string") {
      return inner;
    }
    if (Array.isArray(inner)) {
      return JSON.stringify(inner);
    }
  }

  if (Array.isArray(raw)) {
    return JSON.stringify(raw);
  }

  if (!required && raw == null) {
    return "";
  }

  throw new Error(
    `Output "${key}" is missing or not a string: ${JSON.stringify(raw)}`
  );
};

const extractListOutput = (
  outputs: FlatOutput,
  key: string,
  required = true
): string[] => {
  const raw = outputs[key];

  if (Array.isArray(raw)) {
    return raw as string[];
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // fall through
    }
    return raw.split(",").map((item) => item.trim());
  }

  if (raw && typeof raw === "object" && "value" in raw) {
    const inner = (raw as Record<string, unknown>).value;
    if (Array.isArray(inner)) {
      return inner as string[];
    }
    if (typeof inner === "string") {
      return extractListOutput({ [key]: inner }, key, required);
    }
  }

  if (!required && raw == null) {
    return [];
  }

  throw new Error(
    `Output "${key}" is missing or not a list: ${JSON.stringify(raw)}`
  );
};

const hitApplicationHealthEndpoint = async (
  host: string,
  pathSuffix = "/health"
): Promise<{ protocol: string; status: number }> => {
  const protocols = ["https", "http"];
  const paths = [pathSuffix, "/"];
  let lastError: unknown;

  for (const pathOption of paths) {
    for (const protocol of protocols) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${protocol}://${host}${pathOption}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.status < 400) {
          return { protocol, status: response.status };
        }
        lastError = new Error(
          `Received non-OK status ${response.status} from ${protocol}://${host}${pathOption}`
        );
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError ?? new Error("Unable to reach application endpoint.");
};

describe("Terraform infrastructure integration", () => {
  const outputs = readOutputs();
  const region =
    extractStringOutput(outputs, "aws_region", false) ||
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
        const value = extractStringOutput(outputs, key);
        expect(value.length).toBeGreaterThan(0);
      });

      expect(extractStringOutput(outputs, "alb_dns_name")).toMatch(
        /\.elb\.amazonaws\.com$/
      );
      expect(extractStringOutput(outputs, "ecr_repository_url")).toMatch(
        /\.dkr\.ecr\./
      );
      expect(extractStringOutput(outputs, "rds_endpoint")).toMatch(
        /\.rds\.amazonaws\.com$/
      );
      expect(extractStringOutput(outputs, "rds_master_secret_arn")).toMatch(
        /^arn:aws:secretsmanager:/
      );

      const { protocol, status } = await hitApplicationHealthEndpoint(
        extractStringOutput(outputs, "alb_dns_name")
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
          SecretId: extractStringOutput(outputs, "rds_master_secret_arn"),
        })
      );
      expect(secret.ARN).toBe(
        extractStringOutput(outputs, "rds_master_secret_arn")
      );
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
          cluster: extractStringOutput(outputs, "ecs_cluster_name"),
          services: [extractStringOutput(outputs, "ecs_service_name")],
        })
      );
      const service = ecsResponse.services?.[0];
      expect(service).toBeDefined();
      expect(service?.status).toBe("ACTIVE");
      expect(service?.desiredCount ?? 0).toBeGreaterThanOrEqual(2);
      expect(service?.runningCount ?? 0).toBeGreaterThanOrEqual(2);

      const repositoryName = extractStringOutput(outputs, "ecr_repository_url")
        .split("/")
        .slice(-1)[0];
      const ecrResponse = await ecr.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
      expect(ecrResponse.repositories?.[0]?.repositoryUri).toBe(
        extractStringOutput(outputs, "ecr_repository_url")
      );

      const logResponse = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: extractStringOutput(outputs, "cloudwatch_log_group"),
          limit: 1,
        })
      );
      const logGroup = logResponse.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(
        extractStringOutput(outputs, "cloudwatch_log_group")
      );
      expect(logGroup?.retentionInDays).toBe(7);

      const dbResponse = await rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: extractStringOutput(outputs, "rds_identifier"),
        })
      );
      const dbInstance = dbResponse.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.MultiAZ).toBe(true);
    });
    it("validates network and security outputs", () => {
      const vpcId = extractStringOutput(outputs, "vpc_id");
      expect(vpcId).toMatch(/^vpc-/);

      const privateSubnets = extractListOutput(outputs, "private_subnet_ids");
      const publicSubnets = extractListOutput(outputs, "public_subnet_ids");

      expect(privateSubnets.length).toBe(3);
      expect(publicSubnets.length).toBe(3);
      privateSubnets.forEach((subnet) => expect(subnet).toMatch(/^subnet-/));
      publicSubnets.forEach((subnet) => expect(subnet).toMatch(/^subnet-/));

      expect(extractStringOutput(outputs, "alb_target_group_arn")).toMatch(
        /^arn:aws:elasticloadbalancing:/
      );
      expect(extractStringOutput(outputs, "task_execution_role_arn")).toMatch(
        /^arn:aws:iam::/
      );
      expect(extractStringOutput(outputs, "task_role_arn")).toMatch(
        /^arn:aws:iam::/
      );
    });

    it("confirms observability and DNS outputs", () => {
      expect(extractStringOutput(outputs, "cloudwatch_log_group")).toMatch(
        /^\/ecs\//
      );

      const route53Fqdn = extractStringOutput(
        outputs,
        "route53_record_fqdn",
        false
      );
      expect(typeof route53Fqdn).toBe("string");
      if (route53Fqdn) {
        expect(route53Fqdn).toContain(
          extractStringOutput(outputs, "alb_dns_name")
        );
      }
    });
  });
});
