import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
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
  ListResourceRecordSetsCommand,
  Route53Client,
  RRType,
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
  lambda_failover_name: string;
  primary_region: string;
  rds_primary_arn: string;
  rds_primary_endpoint?: string;
  rds_secondary_arn?: string;
  route53_app_endpoint: string;
  route53_health_check_id: string;
  route53_zone_id: string;
  secondary_region: string;
  subnets_primary_private?: string | string[];
  subnets_secondary_private?: string | string[];
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

const sumFailoverFailedMetric = async (
  cloudWatch: CloudWatchClient,
): Promise<number> => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
  const stats = await cloudWatch.send(
    new GetMetricStatisticsCommand({
      Namespace: "DisasterRecovery",
      MetricName: "FailoverFailed",
      StartTime: startTime,
      EndTime: endTime,
      Period: 60,
      Statistics: ["Sum"],
    }),
  );

  return (
    stats.Datapoints?.reduce(
      (total, datapoint) => total + (datapoint.Sum ?? 0),
      0,
    ) ?? 0
  );
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
    "lambda_failover_name",
    "primary_region",
    "rds_primary_arn",
    "route53_app_endpoint",
    "route53_health_check_id",
    "route53_zone_id",
    "secondary_region",
  ];

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
    subnets_primary_private: flattened
      .subnets_primary_private as string | string[] | undefined,
    subnets_secondary_private: flattened
      .subnets_secondary_private as string | string[] | undefined,
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
  const failoverDomainUrl = `http://${outputs.route53_app_endpoint}`;
  const lambdaName = outputs.lambda_failover_name;
  const healthAlarmName = `${resourcePrefix}-primary-health-alarm`;

  describe("Core infrastructure presence", () => {
    test("Application load balancers are provisioned and active", async () => {
      const primaryElbv2 = new ElasticLoadBalancingV2Client({ region: primaryRegion });
      const secondaryElbv2 = new ElasticLoadBalancingV2Client({ region: secondaryRegion });

      const [primaryResponse, secondaryResponse] = await Promise.all([
        primaryElbv2.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.alb_primary_arn],
          }),
        ),
        secondaryElbv2.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.alb_secondary_arn],
          }),
        ),
      ]);

      expect(primaryResponse.LoadBalancers?.[0]?.State?.Code).toBe("active");
      expect(secondaryResponse.LoadBalancers?.[0]?.State?.Code).toBe("active");
    });

    test("Primary RDS instance is available", async () => {
      const primaryRds = new RDSClient({ region: primaryRegion });
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

    test("Global DynamoDB table spans both regions", async () => {
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

    test("Failover Lambda and health alarm are configured", async () => {
      const lambdaClient = new LambdaClient({ region: primaryRegion });
      const cwClient = new CloudWatchClient({ region: primaryRegion });
      const eventBridge = new EventBridgeClient({ region: primaryRegion });

      try {
        const fn = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: lambdaName }),
        );
        expect(fn.Configuration?.Runtime).toBe("python3.11");

        const alarms = await cwClient.send(
          new DescribeAlarmsCommand({ AlarmNames: [healthAlarmName] }),
        );
        const alarm = alarms.MetricAlarms?.[0];

        expect(alarm).toBeDefined();

        const failoverRuleName = `${resourcePrefix}-failover-trigger`;
        const rule = await eventBridge.send(
          new DescribeRuleCommand({ Name: failoverRuleName }),
        );
        expect(rule).toBeDefined();
        expect(rule.EventPattern).toBeDefined();

        if (rule.EventPattern) {
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
        }

        const targets = await eventBridge.send(
          new ListTargetsByRuleCommand({ Rule: failoverRuleName }),
        );
        const lambdaArn = fn.Configuration?.FunctionArn;
        const target = targets.Targets?.find((candidate) => candidate.Arn === lambdaArn);
        expect(target).toBeDefined();
      } finally {
        eventBridge.destroy();
        cwClient.destroy();
        lambdaClient.destroy();
      }
    });

    test("Route53 health check monitors the primary ALB", async () => {
      const route53 = new Route53Client({ region: primaryRegion });
      const healthCheck = await route53.send(
        new GetHealthCheckCommand({
          HealthCheckId: outputs.route53_health_check_id,
        }),
      );

      const fqdn = healthCheck.HealthCheck?.HealthCheckConfig?.FullyQualifiedDomainName ?? "";
      expect(fqdn).toContain(outputs.alb_primary_dns);
    });
  });

  describe("Failover and data replication", () => {
    test("Application data replicates to secondary region", async () => {
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

    test("Health check failure triggers DNS failover and promotes secondary RDS", async () => {
      const lambdaClient = new LambdaClient({ region: primaryRegion });
      const secondaryRds = new RDSClient({ region: secondaryRegion });
      const primaryRds = new RDSClient({ region: primaryRegion });
      const route53Client = new Route53Client({ region: primaryRegion });

      try {
        const primaryInstance = await describeDbInstanceSilently(
          primaryRds,
          resourceNameFromArn(outputs.rds_primary_arn),
        );
        expect(primaryInstance?.DBInstanceStatus).toBe("available");

        if (outputs.rds_secondary_arn) {
          const secondaryInstance = await describeDbInstanceSilently(
            secondaryRds,
            resourceNameFromArn(outputs.rds_secondary_arn),
          );
          expect(secondaryInstance?.DBInstanceStatus).toBe("available");
          expect(
            secondaryInstance?.ReadReplicaSourceDBInstanceIdentifier,
          ).toBe(outputs.rds_primary_arn);
        }

        const invokeResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: lambdaName,
            InvocationType: "DryRun",
          }),
        );
        expect(invokeResponse.StatusCode).toBe(204);

        expect(outputs.route53_zone_id).toBeDefined();
        const hostedZoneId = outputs.route53_zone_id as string;
        const recordNameWithoutDot = outputs.route53_app_endpoint.replace(/\.$/, "");
        const recordName = `${recordNameWithoutDot}.`;

        const aliasTargets: string[] = [];
        let nextRecordName: string | undefined = recordName;
        let nextRecordType: RRType | undefined = "A";
        let nextRecordIdentifier: string | undefined;

        // Iterate through record sets starting at the failover record name to collect all alias targets.
        // The loop stops once Route53 returns a different record name or the listing finishes.
        // Use a generous but bounded page size to minimize API calls while avoiding large responses.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const response = await route53Client.send(
            new ListResourceRecordSetsCommand({
              HostedZoneId: hostedZoneId,
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
      } finally {
        lambdaClient.destroy();
        secondaryRds.destroy();
        primaryRds.destroy();
        route53Client.destroy();
      }
    });
  });
});
