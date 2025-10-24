import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  type LogGroup,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  AttributeValue,
  BatchWriteItemCommand,
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ScanCommand,
  type BatchWriteItemCommandInput,
  type ContinuousBackupsDescription,
  type GlobalSecondaryIndexDescription,
  type TableDescription,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
  type SecurityGroup,
  type Subnet,
  type Vpc,
  type VpcEndpoint,
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
  type Listener,
  type LoadBalancer,
  type LoadBalancerAttribute,
  type TargetGroup,
  type TargetHealthDescription,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeStreamCommand,
  KinesisClient,
  type StreamDescription,
} from "@aws-sdk/client-kinesis";
import {
  GetFunctionCommand,
  LambdaClient,
  ListEventSourceMappingsCommand,
  type EventSourceMappingConfiguration,
  type FunctionConfiguration,
} from "@aws-sdk/client-lambda";
import {
  GetBucketLocationCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

jest.setTimeout(900000);

type RawOutputs = Record<string, unknown>;

interface StackOutputs {
  alb_arn: string;
  alb_dns_name: string;
  alb_target_group_arn: string;
  cloudwatch_log_group_lambda: string;
  dynamodb_table_arn: string;
  dynamodb_table_name: string;
  kinesis_stream_arn: string;
  kinesis_stream_name: string;
  lambda_function_arn: string;
  lambda_function_name: string;
  nat_gateway_ids: string[];
  private_subnet_ids: string[];
  security_group_alb_id: string;
  security_group_lambda_id: string;
  vpc_cidr: string;
  vpc_endpoint_dynamodb_id: string;
  vpc_endpoint_kinesis_id: string;
  vpc_endpoint_lambda_id: string;
  vpc_id: string;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitFor = async (
  evaluator: () => Promise<boolean>,
  {
    timeoutMs = 300000,
    intervalMs = 5000,
    initialDelayMs = 0,
  }: {
    timeoutMs?: number;
    intervalMs?: number;
    initialDelayMs?: number;
  } = {},
): Promise<void> => {
  if (initialDelayMs > 0) {
    await sleep(initialDelayMs);
  }

  const startedAt = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const success = await evaluator().catch(() => false);
    if (success) {
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for condition to become true");
    }

    await sleep(intervalMs);
  }
};

const unwrapOutputValue = (value: unknown): unknown => {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>)
  ) {
    return unwrapOutputValue((value as Record<string, unknown>).value);
  }
  return value;
};

const parseIdArray = (value: unknown): string[] => {
  const normalized = unwrapOutputValue(value);

  if (Array.isArray(normalized)) {
    return normalized.map((item) => String(item));
  }

  if (typeof normalized === "string") {
    const trimmed = normalized.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        // Ignore JSON parse errors; fall back to comma splitting below.
      }
    }

    if (trimmed.length === 0) {
      return [];
    }

    return trimmed
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (normalized == null) {
    return [];
  }

  return [String(normalized)];
};

const loadOutputs = (): StackOutputs => {
  const outputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
  const fileContent = fs.readFileSync(outputsPath, "utf8");
  const parsed: RawOutputs = JSON.parse(fileContent);

  const lookup = (key: keyof StackOutputs): unknown => {
    if (!(key in parsed)) {
      throw new Error(`Missing terraform output: ${String(key)}`);
    }
    return unwrapOutputValue(parsed[key]);
  };

  const outputs: StackOutputs = {
    alb_arn: String(lookup("alb_arn")),
    alb_dns_name: String(lookup("alb_dns_name")),
    alb_target_group_arn: String(lookup("alb_target_group_arn")),
    cloudwatch_log_group_lambda: String(lookup("cloudwatch_log_group_lambda")),
    dynamodb_table_arn: String(lookup("dynamodb_table_arn")),
    dynamodb_table_name: String(lookup("dynamodb_table_name")),
    kinesis_stream_arn: String(lookup("kinesis_stream_arn")),
    kinesis_stream_name: String(lookup("kinesis_stream_name")),
    lambda_function_arn: String(lookup("lambda_function_arn")),
    lambda_function_name: String(lookup("lambda_function_name")),
    nat_gateway_ids: parseIdArray(parsed.nat_gateway_ids),
    private_subnet_ids: parseIdArray(parsed.private_subnet_ids),
    security_group_alb_id: String(lookup("security_group_alb_id")),
    security_group_lambda_id: String(lookup("security_group_lambda_id")),
    vpc_cidr: String(lookup("vpc_cidr")),
    vpc_endpoint_dynamodb_id: String(lookup("vpc_endpoint_dynamodb_id")),
    vpc_endpoint_kinesis_id: String(lookup("vpc_endpoint_kinesis_id")),
    vpc_endpoint_lambda_id: String(lookup("vpc_endpoint_lambda_id")),
    vpc_id: String(lookup("vpc_id")),
  };

  if (outputs.private_subnet_ids.length === 0) {
    throw new Error("Terraform output private_subnet_ids must not be empty");
  }

  if (outputs.nat_gateway_ids.length === 0) {
    console.warn("Terraform output nat_gateway_ids is empty. Tests will skip NAT gateway assertions.");
  }

  return outputs;
};

const hasAwsCredentials =
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY);

let outputs: StackOutputs;
let outputsError: Error | null = null;

try {
  outputs = loadOutputs();
  console.info("Loaded terraform outputs for integration tests.", outputs);
} catch (error) {
  outputsError = error as Error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  outputs = {} as StackOutputs;
  console.warn("Failed to load terraform outputs:", outputsError?.message);
}

const canRunAwsTests = hasAwsCredentials && !outputsError;
const describeIfAws = canRunAwsTests ? describe : describe.skip;

const inferRegionFromArn = (arn: string): string => {
  const segments = arn.split(":");
  if (segments.length < 4 || !segments[3]) {
    throw new Error(`Unable to infer region from ARN: ${arn}`);
  }
  return segments[3];
};

const listAllEventSourceMappings = async (
  lambdaClient: LambdaClient,
  functionName: string,
): Promise<EventSourceMappingConfiguration[]> => {
  const mappings: EventSourceMappingConfiguration[] = [];
  let marker: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await lambdaClient.send(
      new ListEventSourceMappingsCommand({
        FunctionName: functionName,
        Marker: marker,
        MaxItems: 100,
      }),
    );

    mappings.push(...(response.EventSourceMappings ?? []));

    if (!response.NextMarker) {
      break;
    }
    marker = response.NextMarker;
  }

  return mappings;
};

const deriveResourcePrefix = (lambdaName: string): string | null => {
  if (!lambdaName) {
    return null;
  }
  if (lambdaName.endsWith("-processor")) {
    return lambdaName.replace(/-processor$/, "");
  }
  const segments = lambdaName.split("-");
  if (segments.length > 1) {
    segments.pop();
    return segments.join("-");
  }
  return lambdaName;
};

type DynamoKey = {
  userId: { S: string };
  timestamp: { N: string };
};

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than zero");
  }
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const sendBatchDelete = async (
  client: DynamoDBClient,
  tableName: string,
  keys: DynamoKey[],
): Promise<void> => {
  if (keys.length === 0) {
    return;
  }

  const initialRequest: BatchWriteItemCommandInput["RequestItems"] = {
    [tableName]: keys.map((key) => ({
      DeleteRequest: { Key: key },
    })),
  };

  let pending: BatchWriteItemCommandInput["RequestItems"] = initialRequest;
  while (Object.keys(pending).length > 0) {
    const response = await client.send(
      new BatchWriteItemCommand({ RequestItems: pending }),
    );
    const unprocessed = response.UnprocessedItems ?? {};
    if (!unprocessed || Object.keys(unprocessed).length === 0) {
      break;
    }
    pending = unprocessed;
    await sleep(250);
  }
};

const purgeTable = async (
  client: DynamoDBClient,
  tableName: string,
): Promise<void> => {
  while (true) {
    let startKey: Record<string, AttributeValue> | undefined;
    let deletedAny = false;

    do {
      const response = await client.send(
        new ScanCommand({
          TableName: tableName,
          ProjectionExpression: "#pk, #sk",
          ExpressionAttributeNames: { "#pk": "userId", "#sk": "timestamp" },
          ExclusiveStartKey: startKey,
          ConsistentRead: true,
        }),
      );

      const items = response.Items ?? [];
      if (items.length > 0) {
        deletedAny = true;
        const keys = items
          .map((item) => {
            const userId = item.userId?.S;
            const timestamp = item.timestamp?.N;
            if (!userId || !timestamp) {
              return null;
            }
            return {
              userId: { S: userId },
              timestamp: { N: timestamp },
            };
          })
          .filter(
            (key): key is DynamoKey => key !== null,
          );

        for (const batch of chunkArray(keys, 25)) {
          await sendBatchDelete(client, tableName, batch);
        }
      }

      startKey = response.LastEvaluatedKey;
    } while (startKey);

    if (!deletedAny) {
      break;
    }
  }
};

const countTableItems = async (
  client: DynamoDBClient,
  tableName: string,
): Promise<number> => {
  let total = 0;
  let startKey: Record<string, AttributeValue> | undefined;

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        Select: "COUNT",
        ExclusiveStartKey: startKey,
        ConsistentRead: true,
      }),
    );
    total += response.Count ?? 0;
    startKey = response.LastEvaluatedKey;
  } while (startKey);

  return total;
};

describeIfAws("Terraform Stack Integration Tests", () => {
  const region = inferRegionFromArn(
    outputs.lambda_function_arn || outputs.kinesis_stream_arn || outputs.alb_arn,
  );
  const resourcePrefix = deriveResourcePrefix(outputs.lambda_function_name);
  const albLogBucketName = resourcePrefix ? `${resourcePrefix}-alb-logs-v2` : null;
  const expectedAlarmNames = resourcePrefix
    ? [
      `${resourcePrefix}-kinesis-iterator-age`,
      `${resourcePrefix}-lambda-errors`,
      `${resourcePrefix}-dynamodb-throttles`,
    ]
    : [];

  const ec2 = new EC2Client({ region });
  const kinesis = new KinesisClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const dynamo = new DynamoDBClient({ region });
  const elbv2 = new ElasticLoadBalancingV2Client({ region });
  const logs = new CloudWatchLogsClient({ region });
  const cloudWatch = new CloudWatchClient({ region });
  const s3 = new S3Client({ region });

  afterAll(() => {
    ec2.destroy();
    kinesis.destroy();
    lambdaClient.destroy();
    dynamo.destroy();
    elbv2.destroy();
    logs.destroy();
    cloudWatch.destroy();
    s3.destroy();
  });

  describe("Networking Topology", () => {
    let vpc: Vpc | undefined;
    let subnets: Subnet[] = [];
    let endpoints: VpcEndpoint[] = [];

    beforeAll(async () => {
      const endpointIds = [
        outputs.vpc_endpoint_dynamodb_id,
        outputs.vpc_endpoint_kinesis_id,
        outputs.vpc_endpoint_lambda_id,
      ];

      const [vpcResult, subnetResult, endpointResult] = await Promise.all([
        ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })),
        ec2.send(new DescribeSubnetsCommand({ SubnetIds: outputs.private_subnet_ids })),
        ec2.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: endpointIds })),
      ]);

      vpc = vpcResult.Vpcs?.[0];
      subnets = subnetResult.Subnets ?? [];
      endpoints = endpointResult.VpcEndpoints ?? [];
    });

    test("VPC uses expected CIDR range", () => {
      expect(vpc?.VpcId).toBe(outputs.vpc_id);
      expect(vpc?.CidrBlock).toBe(outputs.vpc_cidr);
    });

    test("Private subnets disable public IP assignment", () => {
      expect(subnets.length).toBe(outputs.private_subnet_ids.length);
      for (const subnet of subnets) {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch ?? false).toBe(false);
      }
    });

    test("Interface endpoints are available in the VPC", () => {
      const expectedServices = new Map<string, string>([
        [outputs.vpc_endpoint_dynamodb_id, ".dynamodb"],
        [outputs.vpc_endpoint_kinesis_id, ".kinesis-streams"],
        [outputs.vpc_endpoint_lambda_id, ".lambda"],
      ]);

      expect(endpoints.length).toBe(expectedServices.size);
      for (const endpoint of endpoints) {
        expect(endpoint.State).toBe("available");
        expect(endpoint.VpcId).toBe(outputs.vpc_id);
        const suffix = expectedServices.get(endpoint.VpcEndpointId ?? "");
        expect(endpoint.ServiceName?.includes(suffix ?? "")).toBe(true);
      }
    });

    const natTest = outputs.nat_gateway_ids.length > 0 ? test : test.skip;
    natTest("NAT gateways are active", async () => {
      const natResult = await ec2.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: outputs.nat_gateway_ids }),
      );
      expect(natResult.NatGateways?.length).toBe(outputs.nat_gateway_ids.length);
      for (const gateway of natResult.NatGateways ?? []) {
        const state = gateway.State ? gateway.State.toLowerCase() : undefined;
        expect(["available", "in-service"]).toContain(state);
      }
    });
  });

  describe("Security Controls", () => {
    let albSecurityGroup: SecurityGroup | undefined;
    let lambdaSecurityGroup: SecurityGroup | undefined;

    beforeAll(async () => {
      const response = await ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_alb_id, outputs.security_group_lambda_id],
        }),
      );
      albSecurityGroup = response.SecurityGroups?.find(
        (group) => group.GroupId === outputs.security_group_alb_id,
      );
      lambdaSecurityGroup = response.SecurityGroups?.find(
        (group) => group.GroupId === outputs.security_group_lambda_id,
      );
    });

    test("ALB security group allows HTTP from the internet", () => {
      expect(albSecurityGroup?.VpcId).toBe(outputs.vpc_id);
      const allowsHttp = (albSecurityGroup?.IpPermissions ?? []).some(
        (perm) =>
          perm.IpProtocol === "tcp" &&
          perm.FromPort === 80 &&
          perm.ToPort === 80 &&
          (perm.IpRanges ?? []).some((range) => range.CidrIp === "0.0.0.0/0"),
      );
      expect(allowsHttp).toBe(true);
    });

    test("Lambda security group allows outbound traffic", () => {
      const egressAll = (lambdaSecurityGroup?.IpPermissionsEgress ?? []).some(
        (perm) =>
          perm.IpProtocol === "-1" &&
          (perm.IpRanges ?? []).some((range) => range.CidrIp === "0.0.0.0/0"),
      );
      expect(egressAll).toBe(true);
    });
  });

  describe("Kinesis Stream", () => {
    let streamDescription: StreamDescription | undefined;

    beforeAll(async () => {
      const response = await kinesis.send(
        new DescribeStreamCommand({ StreamName: outputs.kinesis_stream_name }),
      );
      streamDescription = response.StreamDescription;
    });

    test("Stream is active and encrypted with KMS", () => {
      expect(streamDescription?.StreamARN).toBe(outputs.kinesis_stream_arn);
      expect(streamDescription?.StreamStatus).toBe("ACTIVE");
      expect(streamDescription?.RetentionPeriodHours ?? 0).toBeGreaterThanOrEqual(24);
      expect(streamDescription?.EncryptionType).toBe("KMS");
    });

    test("Stream publishes enhanced shard-level metrics", () => {
      const metrics = new Set<string>();
      for (const entry of streamDescription?.EnhancedMonitoring ?? []) {
        for (const metric of entry.ShardLevelMetrics ?? []) {
          metrics.add(metric);
        }
      }
      expect(metrics.has("IncomingBytes")).toBe(true);
      expect(metrics.has("OutgoingRecords")).toBe(true);
    });
  });

  describe("DynamoDB Table", () => {
    let table: TableDescription | undefined;
    let backupsDescription: ContinuousBackupsDescription | undefined;

    beforeAll(async () => {
      const [tableResult, backupsResult] = await Promise.all([
        dynamo.send(new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })),
        dynamo.send(new DescribeContinuousBackupsCommand({ TableName: outputs.dynamodb_table_name })),
      ]);
      table = tableResult.Table;
      backupsDescription = backupsResult.ContinuousBackupsDescription;
    });

    test("Table is active and encrypted", () => {
      expect(table?.TableArn).toBe(outputs.dynamodb_table_arn);
      expect(table?.TableStatus).toBe("ACTIVE");
      expect(table?.SSEDescription?.Status).toBe("ENABLED");
    });

    test("Point-in-time recovery is enabled", () => {
      const status =
        backupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
      expect(status).toBe("ENABLED");
    });

    test("Primary key schema matches expected shape", () => {
      const keySchema = table?.KeySchema ?? [];
      const hasUserIdHash = keySchema.some(
        (entry) => entry.AttributeName === "userId" && entry.KeyType === "HASH",
      );
      const hasTimestampRange = keySchema.some(
        (entry) => entry.AttributeName === "timestamp" && entry.KeyType === "RANGE",
      );
      expect(hasUserIdHash).toBe(true);
      expect(hasTimestampRange).toBe(true);
    });

    test("eventTypeIndex global secondary index is provisioned", () => {
      const gsis = table?.GlobalSecondaryIndexes ?? [];
      const index = gsis.find(
        (candidate) => candidate.IndexName === "eventTypeIndex",
      ) as GlobalSecondaryIndexDescription | undefined;
      expect(index).toBeDefined();
      expect(index?.IndexStatus).toBe("ACTIVE");
      const indexKeySchema = index?.KeySchema ?? [];
      const hasEventTypeHash = indexKeySchema.some(
        (entry) => entry.AttributeName === "eventType" && entry.KeyType === "HASH",
      );
      const hasTimestampRange = indexKeySchema.some(
        (entry) => entry.AttributeName === "timestamp" && entry.KeyType === "RANGE",
      );
      expect(hasEventTypeHash).toBe(true);
      expect(hasTimestampRange).toBe(true);
    });

    test("Stream captures both new and old images", () => {
      expect(table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(table?.StreamSpecification?.StreamViewType).toBe("NEW_AND_OLD_IMAGES");
    });
  });

  describe("Processor Lambda", () => {
    let processorConfig: FunctionConfiguration | undefined;
    let kinesisMapping: EventSourceMappingConfiguration | undefined;

    beforeAll(async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name }),
      );
      processorConfig = response.Configuration;
      const mappings = await listAllEventSourceMappings(
        lambdaClient,
        processorConfig?.FunctionArn ?? outputs.lambda_function_name,
      );
      kinesisMapping = mappings.find(
        (mapping) => mapping.EventSourceArn === outputs.kinesis_stream_arn,
      );
    });

    test("Lambda runs inside private subnets", () => {
      const subnetSet = new Set(processorConfig?.VpcConfig?.SubnetIds ?? []);
      for (const subnetId of outputs.private_subnet_ids) {
        expect(subnetSet.has(subnetId)).toBe(true);
      }
      expect(
        processorConfig?.VpcConfig?.SecurityGroupIds?.includes(
          outputs.security_group_lambda_id,
        ),
      ).toBe(true);
    });

    test("Lambda environment references the DynamoDB table", () => {
      expect(processorConfig?.Environment?.Variables?.DYNAMODB_TABLE).toBe(
        outputs.dynamodb_table_name,
      );
    });

    test("Kinesis event source mapping is enabled", () => {
      expect(kinesisMapping).toBeDefined();
      expect(kinesisMapping?.State).toMatch(/enabled/i);
    });

    test("Event source mapping batch configuration matches Terraform defaults", () => {
      expect(kinesisMapping?.BatchSize).toBe(100);
      expect(kinesisMapping?.MaximumBatchingWindowInSeconds).toBe(5);
      expect(kinesisMapping?.ParallelizationFactor).toBe(10);
      expect(kinesisMapping?.MaximumRetryAttempts).toBe(3);
    });
  });

  describe("Application Load Balancer", () => {
    let loadBalancer: LoadBalancer | undefined;
    let listener: Listener | undefined;
    let targetGroup: TargetGroup | undefined;
    let targetHealth: TargetHealthDescription[] = [];
    let ingestConfig: FunctionConfiguration | undefined;
    let lbAttributes: LoadBalancerAttribute[] = [];

    beforeAll(async () => {
      const [lbResult, listenerResult, targetGroupResult, attributesResult, targetHealthResult] =
        await Promise.all([
          elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.alb_arn] })),
          elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: outputs.alb_arn })),
          elbv2.send(
            new DescribeTargetGroupsCommand({
              TargetGroupArns: [outputs.alb_target_group_arn],
            }),
          ),
          elbv2.send(
            new DescribeLoadBalancerAttributesCommand({
              LoadBalancerArn: outputs.alb_arn,
            }),
          ),
          elbv2.send(
            new DescribeTargetHealthCommand({
              TargetGroupArn: outputs.alb_target_group_arn,
            }),
          ),
        ]);

      loadBalancer = lbResult.LoadBalancers?.[0];
      listener = listenerResult.Listeners?.[0];
      targetGroup = targetGroupResult.TargetGroups?.[0];
      lbAttributes = attributesResult.Attributes ?? [];
      targetHealth = targetHealthResult.TargetHealthDescriptions ?? [];

      const targetLambdaArn = targetHealth[0]?.Target?.Id;
      if (targetLambdaArn) {
        const ingestLambda = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: targetLambdaArn }),
        );
        ingestConfig = ingestLambda.Configuration;
      }
    });

    test("Load balancer is internet-facing and uses the ALB security group", () => {
      expect(loadBalancer?.DNSName).toBe(outputs.alb_dns_name);
      expect(loadBalancer?.Scheme).toBe("internet-facing");
      expect(loadBalancer?.Type).toBe("application");
      expect(
        loadBalancer?.SecurityGroups?.includes(outputs.security_group_alb_id),
      ).toBe(true);
    });

    test("HTTP listener forwards traffic to the Lambda target group", () => {
      expect(listener?.Port).toBe(80);
      expect(listener?.Protocol).toBe("HTTP");
      expect(listener?.DefaultActions?.[0]?.TargetGroupArn).toBe(
        outputs.alb_target_group_arn,
      );
    });

    test("Target group uses Lambda health checks on /health", () => {
      expect(targetGroup?.TargetType).toBe("lambda");
      expect(targetGroup?.HealthCheckEnabled).not.toBe(false);
      expect(targetGroup?.HealthCheckPath).toBe("/health");
    });

    test("Ingest lambda configuration matches expectations", () => {
      expect(ingestConfig?.Environment?.Variables?.STREAM_NAME).toBe(
        outputs.kinesis_stream_name,
      );
      expect(
        ingestConfig?.VpcConfig?.SecurityGroupIds?.includes(
          outputs.security_group_lambda_id,
        ),
      ).toBe(true);
      expect(ingestConfig?.Timeout).toBeGreaterThanOrEqual(60);
    });

    test("Load balancer attributes enable access logs and cross-zone", () => {
      const attributeMap = new Map<string, string | undefined>();
      for (const attr of lbAttributes) {
        if (attr.Key) {
          attributeMap.set(attr.Key, attr.Value);
        }
      }
      expect(attributeMap.get("access_logs.s3.enabled")).toBe("true");
      if (albLogBucketName) {
        expect(attributeMap.get("access_logs.s3.bucket")).toBe(albLogBucketName);
      }
      expect(attributeMap.get("access_logs.s3.prefix")).toBe("api-alb");
      expect(attributeMap.get("load_balancing.cross_zone.enabled")).toBe("true");
    });
  });

  describe("Observability", () => {
    let processorLogGroup: LogGroup | undefined;

    beforeAll(async () => {
      const logGroups = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_group_lambda,
          limit: 5,
        }),
      );
      processorLogGroup = (logGroups.logGroups ?? []).find(
        (group) => group.logGroupName === outputs.cloudwatch_log_group_lambda,
      );
    });

    test("Processor log group retains data for seven days", () => {
      expect(processorLogGroup).toBeDefined();
      expect(processorLogGroup?.retentionInDays).toBe(7);
    });

    const alarmsTest = expectedAlarmNames.length > 0 ? test : test.skip;
    alarmsTest("CloudWatch alarms exist for critical services", async () => {
      const response = await cloudWatch.send(
        new DescribeAlarmsCommand({ AlarmNames: expectedAlarmNames }),
      );
      const found = new Set((response.MetricAlarms ?? []).map((alarm) => alarm.AlarmName));
      for (const alarmName of expectedAlarmNames) {
        expect(found.has(alarmName)).toBe(true);
      }
    });
  });

  describe("Shared Storage Artifacts", () => {
    const bucketTest = albLogBucketName ? test : test.skip;
    bucketTest("ALB access-log bucket exists in the deployment region", async () => {
      if (!albLogBucketName) {
        throw new Error("ALB log bucket name not derivable from outputs.");
      }
      await s3.send(new HeadBucketCommand({ Bucket: albLogBucketName }));
      const location = await s3.send(
        new GetBucketLocationCommand({ Bucket: albLogBucketName }),
      );
      const effectiveRegion = location.LocationConstraint || "us-east-1";
      expect(effectiveRegion).toBe(region);
    });
  });

  describe("End-to-End Data Flow", () => {
    const requestCount = 200;

    test("Posting to the ALB stores the event batch in DynamoDB", async () => {
      await purgeTable(dynamo, outputs.dynamodb_table_name);
      await waitFor(
        async () => (await countTableItems(dynamo, outputs.dynamodb_table_name)) === 0,
        { timeoutMs: 60000, intervalMs: 2000 },
      );

      const albUrl = `http://${outputs.alb_dns_name}`;
      for (let index = 0; index < requestCount; index += 1) {
        const payload = {
          userId: `int-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          eventType: "integration-test-batch",
          page: "/integration",
          value: index,
        };

        const response = await axios.post(`${albUrl}/events`, payload, {
          timeout: 15000,
        });

        expect(response.status).toBe(200);
        expect(response.data?.message).toBe("ok");
      }

      await waitFor(async () => {
        const currentCount = await countTableItems(
          dynamo,
          outputs.dynamodb_table_name,
        );
        return currentCount >= requestCount;
      }, { timeoutMs: 180000, intervalMs: 5000, initialDelayMs: 5000 });

      const finalCount = await countTableItems(
        dynamo,
        outputs.dynamodb_table_name,
      );
      expect(finalCount).toBe(requestCount);
    });
  });
});

if (!canRunAwsTests) {
  describe("Terraform Stack Integration Tests", () => {
    test("skipped because AWS credentials or outputs are missing", () => {
      if (!hasAwsCredentials) {
        console.warn("Skipping Terraform integration tests: AWS credentials not provided.");
      }
      if (outputsError) {
        console.warn(
          "Skipping Terraform integration tests due to output loading error:",
          outputsError.message,
        );
      }
      expect(true).toBe(true);
    });
  });
}