import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
  type DescribeTargetGroupsCommandOutput,
  type DescribeTargetHealthCommandOutput,
  type TargetHealthDescription,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeRuleCommand,
  DisableRuleCommand,
  EnableRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand
} from "@aws-sdk/client-eventbridge";
import {
  GetFunctionCommand,
  LambdaClient
} from "@aws-sdk/client-lambda";
import {
  CreateDBInstanceReadReplicaCommand,
  DeleteDBInstanceCommand,
  DescribeDBInstancesCommand,
  RDSClient,
  type CreateDBInstanceReadReplicaCommandInput,
  type DBInstance,
} from "@aws-sdk/client-rds";
import {
  GetHealthCheckCommand,
  GetHealthCheckStatusCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
  RRType,
  type GetHealthCheckStatusCommandOutput,
  type HealthCheckObservation,
} from "@aws-sdk/client-route-53";
import axios from "axios";
import fs from "fs";
import path from "path";

jest.setTimeout(900000);

type RawOutputs = Record<string, unknown>;

interface StackOutputs {
  alb_primary_arn: string;
  alb_primary_dns: string;
  alb_secondary_arn: string;
  alb_secondary_dns: string;
  deployment_id?: string;
  dynamodb_table_name: string;
  dynamodb_table_arn: string;
  dynamodb_stream_arn?: string;
  instances_primary_ids: string[];
  instances_secondary_ids: string[];
  lambda_failover_name: string;
  primary_region: string;
  rds_primary_arn: string;
  rds_primary_endpoint?: string;
  rds_secondary_arn?: string;
  route53_app_endpoint: string;
  route53_health_check_id: string;
  route53_zone_id: string;
  secondary_region: string;
  subnets_primary_private: string[];
  subnets_primary_public: string[];
  subnets_secondary_private: string[];
  subnets_secondary_public: string[];
  vpc_primary_id: string;
  vpc_secondary_id: string;
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (
  evaluator: () => Promise<boolean>,
  {
    timeoutMs = 600000,
    intervalMs = 10000,
    initialDelayMs = 0,
  }: {
    timeoutMs?: number;
    intervalMs?: number;
    initialDelayMs?: number;
  } = {},
) => {
  if (initialDelayMs > 0) {
    await sleep(initialDelayMs);
  }

  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const success = await evaluator().catch(() => false);
    if (success) {
      return;
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await sleep(intervalMs);
  }
};

const describeDbInstanceSilently = async (
  client: RDSClient,
  identifier: string,
): Promise<DBInstance | undefined> => {
  try {
    const response = await client.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: identifier,
      }),
    );
    return response.DBInstances?.[0];
  } catch (error) {
    const errorName =
      (error as { name?: string })?.name ?? (error as { Code?: string })?.Code;
    if (errorName === "DBInstanceNotFoundFault" || errorName === "DBInstanceNotFound") {
      return undefined;
    }
    throw error;
  }
};

const restoreSecondaryReplica = async (
  secondaryClient: RDSClient,
  secondaryIdentifier: string,
  initialDetails: DBInstance,
  initialReplicaSource: string,
  primaryArn: string,
  primaryRegion: string,
): Promise<void> => {
  const ensureReplica = async (): Promise<void> => {
    const current = await describeDbInstanceSilently(
      secondaryClient,
      secondaryIdentifier,
    );

    if (
      current &&
      current.ReadReplicaSourceDBInstanceIdentifier === initialReplicaSource
    ) {
      if (current.DBInstanceStatus !== "available") {
        await waitFor(async () => {
          const refreshed = await describeDbInstanceSilently(
            secondaryClient,
            secondaryIdentifier,
          );
          return (
            refreshed?.DBInstanceStatus === "available" &&
            refreshed?.ReadReplicaSourceDBInstanceIdentifier ===
            initialReplicaSource
          );
        }, { timeoutMs: 900000, intervalMs: 30000 });
      }
      return;
    }

    if (current) {
      await secondaryClient.send(
        new DeleteDBInstanceCommand({
          DBInstanceIdentifier: secondaryIdentifier,
          SkipFinalSnapshot: true,
          DeleteAutomatedBackups: true,
        }),
      );

      await waitFor(async () => {
        const refreshed = await describeDbInstanceSilently(
          secondaryClient,
          secondaryIdentifier,
        );
        return !refreshed;
      }, { timeoutMs: 900000, intervalMs: 30000 });
    }

    if (!initialDetails.DBInstanceClass) {
      throw new Error("Unable to determine DBInstanceClass for secondary replica restoration.");
    }

    const createInput: CreateDBInstanceReadReplicaCommandInput = {
      DBInstanceIdentifier: secondaryIdentifier,
      SourceDBInstanceIdentifier: primaryArn,
      DBInstanceClass: initialDetails.DBInstanceClass,
    };

    if (initialDetails.Endpoint?.Port) {
      createInput.Port = initialDetails.Endpoint.Port;
    }
    if (initialDetails.PubliclyAccessible !== undefined) {
      createInput.PubliclyAccessible = initialDetails.PubliclyAccessible;
    }
    if (initialDetails.AutoMinorVersionUpgrade !== undefined) {
      createInput.AutoMinorVersionUpgrade =
        initialDetails.AutoMinorVersionUpgrade;
    }
    if (initialDetails.AvailabilityZone) {
      createInput.AvailabilityZone = initialDetails.AvailabilityZone;
    }
    if (initialDetails.CopyTagsToSnapshot !== undefined) {
      createInput.CopyTagsToSnapshot = initialDetails.CopyTagsToSnapshot;
    }
    if (
      initialDetails.MonitoringInterval !== undefined &&
      initialDetails.MonitoringInterval > 0
    ) {
      createInput.MonitoringInterval = initialDetails.MonitoringInterval;
    }
    if (initialDetails.MonitoringRoleArn) {
      createInput.MonitoringRoleArn = initialDetails.MonitoringRoleArn;
    }
    if (initialDetails.PerformanceInsightsEnabled) {
      createInput.EnablePerformanceInsights = true;
      if (initialDetails.PerformanceInsightsRetentionPeriod) {
        createInput.PerformanceInsightsRetentionPeriod =
          initialDetails.PerformanceInsightsRetentionPeriod;
      }
      if (initialDetails.PerformanceInsightsKMSKeyId) {
        createInput.PerformanceInsightsKMSKeyId =
          initialDetails.PerformanceInsightsKMSKeyId;
      }
    }
    if (initialDetails.KmsKeyId) {
      createInput.KmsKeyId = initialDetails.KmsKeyId;
    }
    const logsExports = initialDetails.EnabledCloudwatchLogsExports ?? [];
    if (logsExports.length > 0) {
      createInput.EnableCloudwatchLogsExports = logsExports;
    }
    if (initialDetails.DBSubnetGroup?.DBSubnetGroupName) {
      createInput.DBSubnetGroupName =
        initialDetails.DBSubnetGroup.DBSubnetGroupName;
    }
    if (initialDetails.MultiAZ !== undefined) {
      createInput.MultiAZ = initialDetails.MultiAZ;
    }

    await secondaryClient.send(
      new CreateDBInstanceReadReplicaCommand(createInput),
    );

    await waitFor(async () => {
      const refreshed = await describeDbInstanceSilently(
        secondaryClient,
        secondaryIdentifier,
      );
      return (
        refreshed?.DBInstanceStatus === "available" &&
        refreshed?.ReadReplicaSourceDBInstanceIdentifier === initialReplicaSource
      );
    }, { timeoutMs: 900000, intervalMs: 30000 });
  };

  await ensureReplica();
};

const loadOutputs = (): StackOutputs => {
  const outputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
  const fileContent = fs.readFileSync(outputsPath, "utf8");
  const parsed: RawOutputs = JSON.parse(fileContent);

  const getRawValue = (value: unknown): unknown => {
    if (value && typeof value === "object" && "value" in (value as Record<string, unknown>)) {
      return getRawValue((value as Record<string, unknown>).value);
    }
    return value;
  };

  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    flattened[key] = getRawValue(value);
  }

  const requiredKeys: Array<keyof StackOutputs> = [
    "alb_primary_arn",
    "alb_primary_dns",
    "alb_secondary_arn",
    "alb_secondary_dns",
    "dynamodb_table_name",
    "dynamodb_table_arn",
    "instances_primary_ids",
    "instances_secondary_ids",
    "lambda_failover_name",
    "primary_region",
    "rds_primary_arn",
    "route53_app_endpoint",
    "route53_health_check_id",
    "route53_zone_id",
    "secondary_region",
    "subnets_primary_private",
    "subnets_primary_public",
    "subnets_secondary_private",
    "subnets_secondary_public",
    "vpc_primary_id",
    "vpc_secondary_id",
  ];

  const normalizeToStringArray = (value: unknown): string[] => {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item));
          }
        } catch {
          // fall through to delimiter parsing
        }
      }
      return trimmed
        .split(",")
        .map((item) => item.trim().replace(/^"|"$/g, ""))
        .filter((item) => item.length > 0);
    }
    return [String(value)];
  };

  for (const key of requiredKeys) {
    if (!(key in flattened)) {
      throw new Error(`Missing required terraform output: ${key}`);
    }
  }

  return {
    alb_primary_arn: String(flattened.alb_primary_arn),
    alb_primary_dns: String(flattened.alb_primary_dns),
    alb_secondary_arn: String(flattened.alb_secondary_arn),
    alb_secondary_dns: String(flattened.alb_secondary_dns),
    deployment_id: flattened.deployment_id ? String(flattened.deployment_id) : undefined,
    dynamodb_table_name: String(flattened.dynamodb_table_name),
    dynamodb_table_arn: String(flattened.dynamodb_table_arn),
    dynamodb_stream_arn: flattened.dynamodb_stream_arn
      ? String(flattened.dynamodb_stream_arn)
      : undefined,
    instances_primary_ids: normalizeToStringArray(flattened.instances_primary_ids),
    instances_secondary_ids: normalizeToStringArray(flattened.instances_secondary_ids),
    lambda_failover_name: String(flattened.lambda_failover_name),
    primary_region: String(flattened.primary_region),
    rds_primary_arn: String(flattened.rds_primary_arn),
    rds_primary_endpoint: flattened.rds_primary_endpoint
      ? String(flattened.rds_primary_endpoint)
      : undefined,
    rds_secondary_arn: flattened.rds_secondary_arn
      ? String(flattened.rds_secondary_arn)
      : undefined,
    route53_app_endpoint: String(flattened.route53_app_endpoint),
    route53_health_check_id: String(flattened.route53_health_check_id),
    route53_zone_id: String(flattened.route53_zone_id),
    secondary_region: String(flattened.secondary_region),
    subnets_primary_private: normalizeToStringArray(flattened.subnets_primary_private),
    subnets_primary_public: normalizeToStringArray(flattened.subnets_primary_public),
    subnets_secondary_private: normalizeToStringArray(flattened.subnets_secondary_private),
    subnets_secondary_public: normalizeToStringArray(flattened.subnets_secondary_public),
    vpc_primary_id: String(flattened.vpc_primary_id),
    vpc_secondary_id: String(flattened.vpc_secondary_id),
  };
};

const hasAwsCredentials =
  Boolean(process.env.AWS_ACCESS_KEY_ID) && Boolean(process.env.AWS_SECRET_ACCESS_KEY);

let outputs: StackOutputs;
let outputsError: Error | null = null;

try {
  outputs = loadOutputs();
} catch (error) {
  outputsError = error as Error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  outputs = {} as StackOutputs;
}

const canRunAwsTests = hasAwsCredentials && !outputsError;
const resourceNameFromArn = (arn: string): string => {
  const parts = arn.split(":");
  return parts[parts.length - 1] ?? arn;
};

const createResourcePrefix = (lambdaName: string | undefined): string => {
  if (!lambdaName) {
    return "unknown";
  }
  if (lambdaName.endsWith("-failover")) {
    return lambdaName.replace(/-failover$/, "");
  }
  return lambdaName;
};

if (!canRunAwsTests) {
  // eslint-disable-next-line no-console
  console.warn(
    outputsError
      ? `Skipping AWS integration tests: ${outputsError.message}`
      : "Skipping AWS integration tests: AWS credentials not configured.",
  );
}

const suite = canRunAwsTests ? describe : describe.skip;

suite("Trading Platform DR Stack - AWS integration", () => {
  if (!canRunAwsTests) {
    return;
  }

  const primaryRegion = outputs.primary_region;
  const secondaryRegion = outputs.secondary_region;
  const resourcePrefix = createResourcePrefix(outputs.lambda_failover_name);

  const primaryAlbUrl = `http://${outputs.alb_primary_dns}`;
  const secondaryAlbUrl = `http://${outputs.alb_secondary_dns}`;
  const lambdaName = outputs.lambda_failover_name;
  const healthAlarmName = `${resourcePrefix}-primary-health-alarm`;

  describe("Virtual Private Cloud", () => {
    let ec2Primary: EC2Client;
    let ec2Secondary: EC2Client;

    beforeAll(() => {
      ec2Primary = new EC2Client({ region: primaryRegion });
      ec2Secondary = new EC2Client({ region: secondaryRegion });
    });

    afterAll(() => {
      ec2Primary.destroy();
      ec2Secondary.destroy();
    });

    it("creates the primary VPC in an available state", async () => {
      const response = await ec2Primary.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_primary_id] }),
      );
      const vpc = response.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(outputs.vpc_primary_id);
      expect(vpc?.State).toBe("available");
    });

    it("creates the secondary VPC in an available state", async () => {
      const response = await ec2Secondary.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_secondary_id] }),
      );
      const vpc = response.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(outputs.vpc_secondary_id);
      expect(vpc?.State).toBe("available");
    });
  });

  describe("Subnets", () => {
    let ec2Primary: EC2Client;
    let ec2Secondary: EC2Client;

    beforeAll(() => {
      ec2Primary = new EC2Client({ region: primaryRegion });
      ec2Secondary = new EC2Client({ region: secondaryRegion });
    });

    afterAll(() => {
      ec2Primary.destroy();
      ec2Secondary.destroy();
    });

    it("provisions private subnets in the primary region", async () => {
      const subnetIds = outputs.subnets_primary_private;
      expect(subnetIds.length).toBeGreaterThan(0);

      const response = await ec2Primary.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds }),
      );
      const subnets = response.Subnets ?? [];
      expect(subnets).toHaveLength(subnetIds.length);
      subnets.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id);
        expect(subnet.MapPublicIpOnLaunch ?? false).toBe(false);
      });
    });

    it("provisions private subnets in the secondary region", async () => {
      const subnetIds = outputs.subnets_secondary_private;
      expect(subnetIds.length).toBeGreaterThan(0);

      const response = await ec2Secondary.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds }),
      );
      const subnets = response.Subnets ?? [];
      expect(subnets).toHaveLength(subnetIds.length);
      subnets.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_secondary_id);
        expect(subnet.MapPublicIpOnLaunch ?? false).toBe(false);
      });
    });

    it("exposes public subnets for the primary ALB", async () => {
      const subnetIds = outputs.subnets_primary_public;
      const response = await ec2Primary.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds }),
      );
      const subnets = response.Subnets ?? [];
      expect(subnets.length).toBeGreaterThan(0);
      subnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch ?? false).toBe(true);
      });
    });

    it("exposes public subnets for the secondary ALB", async () => {
      const subnetIds = outputs.subnets_secondary_public;
      const response = await ec2Secondary.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds }),
      );
      const subnets = response.Subnets ?? [];
      expect(subnets.length).toBeGreaterThan(0);
      subnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch ?? false).toBe(true);
      });
    });
  });

  describe("NAT Gateways", () => {
    let ec2Primary: EC2Client;
    let ec2Secondary: EC2Client;

    beforeAll(() => {
      ec2Primary = new EC2Client({ region: primaryRegion });
      ec2Secondary = new EC2Client({ region: secondaryRegion });
    });

    afterAll(() => {
      ec2Primary.destroy();
      ec2Secondary.destroy();
    });

    it("deploys active NAT gateways in the primary VPC", async () => {
      const response = await ec2Primary.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [outputs.vpc_primary_id] }],
        }),
      );
      const gateways = response.NatGateways ?? [];
      expect(gateways.length).toBeGreaterThan(0);
      gateways.forEach((gateway) => {
        expect(gateway.State).toBe("available");
      });
    });

    it("deploys active NAT gateways in the secondary VPC", async () => {
      const response = await ec2Secondary.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [outputs.vpc_secondary_id] }],
        }),
      );
      const gateways = response.NatGateways ?? [];
      expect(gateways.length).toBeGreaterThan(0);
      gateways.forEach((gateway) => {
        expect(gateway.State).toBe("available");
      });
    });
  });

  describe("EC2 Application Instances", () => {
    let ec2Primary: EC2Client;
    let ec2Secondary: EC2Client;

    beforeAll(() => {
      ec2Primary = new EC2Client({ region: primaryRegion });
      ec2Secondary = new EC2Client({ region: secondaryRegion });
    });

    afterAll(() => {
      ec2Primary.destroy();
      ec2Secondary.destroy();
    });

    it("launches running instances in the primary region", async () => {
      const instanceIds = outputs.instances_primary_ids;
      expect(instanceIds.length).toBeGreaterThan(0);

      const response = await ec2Primary.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds }),
      );
      const instances =
        response.Reservations?.flatMap((reservation) => reservation.Instances ?? []) ?? [];

      expect(instances).toHaveLength(instanceIds.length);
      instances.forEach((instance) => {
        expect(instance.State?.Name).toBe("running");
        if (instance.SubnetId) {
          expect(outputs.subnets_primary_private).toContain(instance.SubnetId);
        }
      });
    });

    it("launches running instances in the secondary region", async () => {
      const instanceIds = outputs.instances_secondary_ids;
      expect(instanceIds.length).toBeGreaterThan(0);

      const response = await ec2Secondary.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds }),
      );
      const instances =
        response.Reservations?.flatMap((reservation) => reservation.Instances ?? []) ?? [];

      expect(instances).toHaveLength(instanceIds.length);
      instances.forEach((instance) => {
        expect(instance.State?.Name).toBe("running");
        if (instance.SubnetId) {
          expect(outputs.subnets_secondary_private).toContain(instance.SubnetId);
        }
      });
    });
  });

  describe("CloudWatch Logs", () => {
    const lambdaLogGroup = `/aws/lambda/${lambdaName}`;
    const primaryAppLogGroup = `/ec2/${resourcePrefix}/app-primary`;
    const secondaryAppLogGroup = `/ec2/${resourcePrefix}/app-secondary`;

    const logGroupExists = async (
      client: CloudWatchLogsClient,
      logGroupName: string,
    ): Promise<boolean> => {
      const response = await client.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }),
      );
      return (response.logGroups ?? []).some(
        (group) => group.logGroupName === logGroupName,
      );
    };

    it("captures failover lambda executions", async () => {
      const logsClient = new CloudWatchLogsClient({ region: primaryRegion });
      try {
        const exists = await logGroupExists(logsClient, lambdaLogGroup);
        expect(exists).toBe(true);
      } finally {
        logsClient.destroy();
      }
    });

    it("captures primary application logs", async () => {
      const logsClient = new CloudWatchLogsClient({ region: primaryRegion });
      try {
        const exists = await logGroupExists(logsClient, primaryAppLogGroup);
        expect(exists).toBe(true);
      } finally {
        logsClient.destroy();
      }
    });

    it("captures secondary application logs", async () => {
      const logsClient = new CloudWatchLogsClient({ region: secondaryRegion });
      try {
        const exists = await logGroupExists(logsClient, secondaryAppLogGroup);
        expect(exists).toBe(true);
      } finally {
        logsClient.destroy();
      }
    });
  });

  describe("Application Load Balancers", () => {
    let primaryElbv2: ElasticLoadBalancingV2Client;
    let secondaryElbv2: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      primaryElbv2 = new ElasticLoadBalancingV2Client({ region: primaryRegion });
      secondaryElbv2 = new ElasticLoadBalancingV2Client({ region: secondaryRegion });
    });

    afterAll(() => {
      primaryElbv2.destroy();
      secondaryElbv2.destroy();
    });

    it("keeps the primary load balancer active", async () => {
      const response = await primaryElbv2.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.alb_primary_arn],
        }),
      );

      expect(response.LoadBalancers?.[0]?.State?.Code).toBe("active");
    });

    it("keeps the secondary load balancer active", async () => {
      const response = await secondaryElbv2.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.alb_secondary_arn],
        }),
      );

      expect(response.LoadBalancers?.[0]?.State?.Code).toBe("active");
    });
  });

  describe("Relational Database Service", () => {
    let primaryRds: RDSClient;
    let secondaryRds: RDSClient;

    beforeAll(() => {
      primaryRds = new RDSClient({ region: primaryRegion });
      secondaryRds = new RDSClient({ region: secondaryRegion });
    });

    afterAll(() => {
      primaryRds.destroy();
      secondaryRds.destroy();
    });

    it("keeps the primary database instance available", async () => {
      const primaryIdentifier = resourceNameFromArn(outputs.rds_primary_arn);
      const dbResponse = await primaryRds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: primaryIdentifier,
        }),
      );

      const instance = dbResponse.DBInstances?.[0];
      expect(instance?.DBInstanceStatus).toBe("available");
      if (outputs.rds_primary_endpoint) {
        expect(instance?.Endpoint?.Address).toBe(outputs.rds_primary_endpoint.split(":")[0]);
      }
    });

    it("keeps the cross-region replica attached to the primary", async () => {
      if (!outputs.rds_secondary_arn) {
        expect(outputs.rds_secondary_arn).toBeDefined();
        return;
      }

      const replicaIdentifier = resourceNameFromArn(outputs.rds_secondary_arn);
      const replica = await describeDbInstanceSilently(secondaryRds, replicaIdentifier);
      expect(replica?.DBInstanceStatus).toBe("available");
      expect(replica?.ReadReplicaSourceDBInstanceIdentifier).toBe(outputs.rds_primary_arn);
    });
  });

  describe("DynamoDB Global Table", () => {
    it("replicates across primary and secondary regions", async () => {
      const dynamoPrimary = new DynamoDBClient({ region: primaryRegion });
      const table = await dynamoPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.dynamodb_table_name,
        }),
      );

      expect(table.Table?.TableStatus).toBe("ACTIVE");
      const replicaRegions =
        table.Table?.Replicas?.map((replica) => replica.RegionName ?? "") ?? [];

      expect(replicaRegions).toContain(secondaryRegion);
    });
  });

  describe("Failover Lambda Automation", () => {
    let lambdaClient: LambdaClient;
    let eventBridge: EventBridgeClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region: primaryRegion });
      eventBridge = new EventBridgeClient({ region: primaryRegion });
    });

    afterAll(() => {
      lambdaClient.destroy();
      eventBridge.destroy();
    });

    it("runs on the expected runtime", async () => {
      const fn = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaName }),
      );
      expect(fn.Configuration?.Runtime).toBe("python3.11");
    });

    // it("accepts dry-run invocations", async () => {
    //   const invokeResponse = await lambdaClient.send(
    //     new InvokeCommand({
    //       FunctionName: lambdaName,
    //       InvocationType: "DryRun",
    //     }),
    //   );
    //   expect(invokeResponse.StatusCode).toBe(204);
    // });

    it("subscribes to Route53 health check failures", async () => {
      const failoverRuleName = `${resourcePrefix}-failover-trigger`;
      const rule = await eventBridge.send(
        new DescribeRuleCommand({ Name: failoverRuleName }),
      );
      expect(rule).toBeDefined();
      expect(rule.EventPattern).toBeDefined();

      if (!rule.EventPattern) {
        return;
      }

      const toStringArray = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.filter((item): item is string => typeof item === "string")
          : [];

      const eventPattern = JSON.parse(rule.EventPattern) as {
        source?: string[];
        detail?: Record<string, unknown>;
        "detail-type"?: string[];
      };

      const sources = toStringArray(eventPattern.source);
      expect(sources).toContain("aws.route53");

      const detailTypes = toStringArray(eventPattern["detail-type"]);
      expect(detailTypes).toContain("Route 53 Health Check Status Change");

      const detail = eventPattern.detail ?? {};
      const newStates = toStringArray(detail["newState"]);
      expect(newStates).toContain("UNHEALTHY");

      const healthCheckIds = toStringArray(detail["healthCheckId"]);
      expect(healthCheckIds).toContain(outputs.route53_health_check_id);
    });

    it("targets the failover lambda function", async () => {
      const fn = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaName }),
      );
      const lambdaArn = fn.Configuration?.FunctionArn;
      expect(lambdaArn).toBeDefined();

      const targets = await eventBridge.send(
        new ListTargetsByRuleCommand({ Rule: `${resourcePrefix}-failover-trigger` }),
      );
      const target = targets.Targets?.find((candidate) => candidate.Arn === lambdaArn);
      expect(target).toBeDefined();
    });
  });

  describe("CloudWatch Alarm", () => {
    it("monitors the primary health check metric", async () => {
      const cwClient = new CloudWatchClient({ region: primaryRegion });
      try {
        const alarms = await cwClient.send(
          new DescribeAlarmsCommand({ AlarmNames: [healthAlarmName] }),
        );
        expect(alarms.MetricAlarms?.[0]).toBeDefined();
      } finally {
        cwClient.destroy();
      }
    });
  });

  describe("Route53 Health Checks", () => {
    let route53Client: Route53Client;

    beforeAll(() => {
      route53Client = new Route53Client({ region: primaryRegion });
    });

    afterAll(() => {
      route53Client.destroy();
    });

    it("monitors the primary ALB hostname", async () => {
      const healthCheck = await route53Client.send(
        new GetHealthCheckCommand({
          HealthCheckId: outputs.route53_health_check_id,
        }),
      );

      const fqdn = healthCheck.HealthCheck?.HealthCheckConfig?.FullyQualifiedDomainName ?? "";
      expect(fqdn).toContain(outputs.alb_primary_dns);
    });

    it("aliases the failover record to both ALBs", async () => {
      const recordNameWithoutDot = outputs.route53_app_endpoint.replace(/\.$/, "");
      const recordName = `${recordNameWithoutDot}.`;

      const aliasTargets: string[] = [];
      let nextRecordName: string | undefined = recordName;
      let nextRecordType: RRType | undefined = "A";
      let nextRecordIdentifier: string | undefined;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await route53Client.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: outputs.route53_zone_id,
            StartRecordName: nextRecordName,
            StartRecordType: nextRecordType,
            StartRecordIdentifier: nextRecordIdentifier,
            MaxItems: "100",
          }),
        );

        const recordSets = response.ResourceRecordSets ?? [];
        let encounteredDifferentName = false;

        for (const record of recordSets) {
          const normalizedName = (record.Name ?? "").replace(/\.$/, "");
          if (normalizedName !== recordNameWithoutDot) {
            encounteredDifferentName = true;
            break;
          }

          if (record.Type === "A" && record.AliasTarget?.DNSName) {
            aliasTargets.push(record.AliasTarget.DNSName.replace(/\.$/, ""));
          }
        }

        if (encounteredDifferentName || !response.IsTruncated) {
          break;
        }

        nextRecordName = response.NextRecordName;
        nextRecordType = response.NextRecordType;
        nextRecordIdentifier = response.NextRecordIdentifier;

        if (!nextRecordName || nextRecordName.replace(/\.$/, "") !== recordNameWithoutDot) {
          break;
        }
      }

      expect(aliasTargets.length).toBeGreaterThan(0);
      const expectedTargets = new Set(
        [outputs.alb_primary_dns, outputs.alb_secondary_dns]
          .filter(Boolean)
          .map((dnsName) => dnsName.replace(/\.$/, "").toLowerCase()),
      );
      expect(
        aliasTargets.every((dnsName) => expectedTargets.has(dnsName.toLowerCase())),
      ).toBe(true);
    });

    describe("when the primary application reports failure", () => {
      const failoverRuleName = `${resourcePrefix}-failover-trigger`;
      const targetGroupName = `${resourcePrefix}-tg-primary`;
      const failureSeconds = 180;
      const recoverySeconds = 5;

      let eventBridge: EventBridgeClient;
      let elbv2: ElasticLoadBalancingV2Client;
      let targetGroupArn: string | undefined;

      beforeAll(async () => {
        eventBridge = new EventBridgeClient({ region: primaryRegion });
        elbv2 = new ElasticLoadBalancingV2Client({ region: primaryRegion });

        await eventBridge.send(new DisableRuleCommand({ Name: failoverRuleName }));

        const failureResponse = await axios.post(
          `${primaryAlbUrl}/trigger-failure`,
          { seconds: failureSeconds },
          { timeout: 10000 },
        );

        if (failureResponse.status !== 202) {
          throw new Error(`expected trigger-failure to return 202, received ${failureResponse.status}`);
        }

        const targetGroupResponse = await elbv2.send(
          new DescribeTargetGroupsCommand({ Names: [targetGroupName] }),
        ) as DescribeTargetGroupsCommandOutput;
        targetGroupArn = targetGroupResponse.TargetGroups?.[0]?.TargetGroupArn ?? undefined;
        if (!targetGroupArn) {
          throw new Error("primary target group ARN not found");
        }
      });

      afterAll(async () => {
        try {
          await axios.post(
            `${primaryAlbUrl}/trigger-failure`,
            { seconds: recoverySeconds },
            { timeout: 10000 },
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to shorten failure window:", error);
        }

        try {
          await eventBridge.send(new EnableRuleCommand({ Name: failoverRuleName }));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to re-enable failover rule:", error);
        }

        await waitFor(async () => {
          if (!targetGroupArn) {
            return false;
          }
          const health = await elbv2.send(
            new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }),
          ) as DescribeTargetHealthCommandOutput;
          const descriptions: TargetHealthDescription[] = health.TargetHealthDescriptions ?? [];
          return (
            descriptions.length > 0 &&
            descriptions.every((description) => description.TargetHealth?.State === "healthy")
          );
        }, { timeoutMs: 600000, intervalMs: 15000, initialDelayMs: 30000 }).catch(() => undefined);

        await waitFor(async () => {
          const statusResponse = await route53Client.send(
            new GetHealthCheckStatusCommand({ HealthCheckId: outputs.route53_health_check_id }),
          ) as GetHealthCheckStatusCommandOutput;
          const observations: HealthCheckObservation[] =
            statusResponse.HealthCheckObservations ?? [];
          return observations.every((observation) =>
            (observation.StatusReport?.Status ?? "").toLowerCase().includes("success"),
          );
        }, { timeoutMs: 600000, intervalMs: 15000, initialDelayMs: 30000 }).catch(() => undefined);

        eventBridge.destroy();
        elbv2.destroy();
      });

      it("marks all primary targets as unhealthy", async () => {
        await waitFor(async () => {
          if (!targetGroupArn) {
            return false;
          }
          const health = await elbv2.send(
            new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }),
          ) as DescribeTargetHealthCommandOutput;
          const descriptions: TargetHealthDescription[] = health.TargetHealthDescriptions ?? [];
          return (
            descriptions.length > 0 &&
            descriptions.every((description) => description.TargetHealth?.State === "unhealthy")
          );
        }, { timeoutMs: 600000, intervalMs: 15000, initialDelayMs: 15000 });

        const health = await elbv2.send(
          new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }),
        ) as DescribeTargetHealthCommandOutput;
        const descriptions: TargetHealthDescription[] = health.TargetHealthDescriptions ?? [];
        expect(descriptions.length).toBeGreaterThan(0);
        descriptions.forEach((description) => {
          expect(description.TargetHealth?.State).toBe("unhealthy");
        });
      });

      it("marks the Route53 health check as failed", async () => {
        await waitFor(async () => {
          const statusResponse = await route53Client.send(
            new GetHealthCheckStatusCommand({ HealthCheckId: outputs.route53_health_check_id }),
          ) as GetHealthCheckStatusCommandOutput;
          const observations: HealthCheckObservation[] =
            statusResponse.HealthCheckObservations ?? [];
          return observations.some((observation) =>
            (observation.StatusReport?.Status ?? "").toLowerCase().includes("fail"),
          );
        }, { timeoutMs: 600000, intervalMs: 15000, initialDelayMs: 15000 });

        const statusResponse = await route53Client.send(
          new GetHealthCheckStatusCommand({ HealthCheckId: outputs.route53_health_check_id }),
        ) as GetHealthCheckStatusCommandOutput;
        const observations: HealthCheckObservation[] =
          statusResponse.HealthCheckObservations ?? [];
        expect(observations.length).toBeGreaterThan(0);
        expect(
          observations.some((observation) =>
            (observation.StatusReport?.Status ?? "").toLowerCase().includes("fail"),
          ),
        ).toBe(true);
      });
    });
  });

  describe("Application API", () => {
    it("replicates writes to the secondary region", async () => {
      const payload = `int-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const createResponse = await axios.post(
        `${primaryAlbUrl}/data`,
        { data: payload },
        { timeout: 15000 },
      );

      expect(createResponse.status).toBe(201);
      const recordId: string = createResponse.data?.id;
      expect(recordId).toBeDefined();

      await waitFor(async () => {
        try {
          const readResponse = await axios.get(
            `${secondaryAlbUrl}/data/${recordId}`,
            { timeout: 15000 },
          );
          return readResponse.status === 200 && readResponse.data?.data === payload;
        } catch (error) {
          return false;
        }
      }, { timeoutMs: 180000, intervalMs: 10000 });
    });
  });

});
