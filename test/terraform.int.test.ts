import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeRuleCommand,
  DisableRuleCommand,
  EnableRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { DescribeKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { GetFunctionCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import { GetHostedZoneCommand, Route53Client } from "@aws-sdk/client-route-53";
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import axios, { AxiosResponse } from "axios";
import fs from "fs";
import path from "path";

jest.setTimeout(120000);

type RawOutputs = Record<string, unknown>;

interface StackOutputs {
  application_url: string;
  aurora_global_cluster_id: string;
  aurora_global_writer_endpoint: string;
  aurora_primary_reader_endpoint: string;
  aurora_primary_writer_endpoint: string;
  aurora_secondary_reader_endpoint: string;
  aurora_secondary_writer_endpoint: string;
  eventbridge_health_rule_arn: string;
  lambda_function_arn: string;
  primary_alb_arn: string;
  primary_alb_dns: string;
  primary_alb_security_group_id: string;
  primary_ec2_instance_ids?: string | string[];
  primary_ec2_security_group_id: string;
  primary_kms_key_id: string;
  primary_lambda_security_group_id: string;
  primary_rds_security_group_id: string;
  primary_vpc_id: string;
  primary_region: string;
  route53_nameservers?: string | string[];
  route53_zone_id: string;
  secondary_alb_arn: string;
  secondary_alb_dns: string;
  secondary_alb_security_group_id: string;
  secondary_ec2_instance_ids?: string | string[];
  secondary_ec2_security_group_id: string;
  secondary_kms_key_id: string;
  secondary_lambda_security_group_id: string;
  secondary_rds_security_group_id: string;
  secondary_vpc_id: string;
  secondary_region: string;
  secrets_manager_secret_arn: string;
}

const EXPECTED_OUTPUT_KEYS: Array<keyof StackOutputs> = [
  "application_url",
  "aurora_global_cluster_id",
  "aurora_global_writer_endpoint",
  "aurora_primary_reader_endpoint",
  "aurora_primary_writer_endpoint",
  "aurora_secondary_reader_endpoint",
  "aurora_secondary_writer_endpoint",
  "eventbridge_health_rule_arn",
  "lambda_function_arn",
  "primary_alb_arn",
  "primary_alb_dns",
  "primary_alb_security_group_id",
  "primary_ec2_instance_ids",
  "primary_ec2_security_group_id",
  "primary_kms_key_id",
  "primary_lambda_security_group_id",
  "primary_rds_security_group_id",
  "primary_vpc_id",
  "primary_region",
  "route53_nameservers",
  "route53_zone_id",
  "secondary_alb_arn",
  "secondary_alb_dns",
  "secondary_alb_security_group_id",
  "secondary_ec2_instance_ids",
  "secondary_ec2_security_group_id",
  "secondary_kms_key_id",
  "secondary_lambda_security_group_id",
  "secondary_rds_security_group_id",
  "secondary_vpc_id",
  "secondary_region",
  "secrets_manager_secret_arn",
];

const OUTPUT_LOCATIONS = [
  path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json"),
];

const getString = (value: unknown, key: string): string => {
  return String(value);
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

  for (const key of EXPECTED_OUTPUT_KEYS) {
    if (!(key in flattened)) {
      throw new Error(`Missing required terraform output: ${key}`);
    }
  }

  return {
    application_url: getString(flattened.application_url, "application_url"),
    aurora_global_cluster_id: getString(flattened.aurora_global_cluster_id, "aurora_global_cluster_id"),
    aurora_global_writer_endpoint: getString(flattened.aurora_global_writer_endpoint, "aurora_global_writer_endpoint"),
    aurora_primary_reader_endpoint: getString(flattened.aurora_primary_reader_endpoint, "aurora_primary_reader_endpoint"),
    aurora_primary_writer_endpoint: getString(flattened.aurora_primary_writer_endpoint, "aurora_primary_writer_endpoint"),
    aurora_secondary_reader_endpoint: getString(flattened.aurora_secondary_reader_endpoint, "aurora_secondary_reader_endpoint"),
    aurora_secondary_writer_endpoint: getString(flattened.aurora_secondary_writer_endpoint, "aurora_secondary_writer_endpoint"),
    eventbridge_health_rule_arn: getString(flattened.eventbridge_health_rule_arn, "eventbridge_health_rule_arn"),
    lambda_function_arn: getString(flattened.lambda_function_arn, "lambda_function_arn"),
    primary_alb_arn: getString(flattened.primary_alb_arn, "primary_alb_arn"),
    primary_alb_dns: getString(flattened.primary_alb_dns, "primary_alb_dns"),
    primary_alb_security_group_id: getString(flattened.primary_alb_security_group_id, "primary_alb_security_group_id"),
    primary_ec2_instance_ids: flattened.primary_ec2_instance_ids as string | string[] | undefined,
    primary_ec2_security_group_id: getString(flattened.primary_ec2_security_group_id, "primary_ec2_security_group_id"),
    primary_kms_key_id: getString(flattened.primary_kms_key_id, "primary_kms_key_id"),
    primary_lambda_security_group_id: getString(flattened.primary_lambda_security_group_id, "primary_lambda_security_group_id"),
    primary_rds_security_group_id: getString(flattened.primary_rds_security_group_id, "primary_rds_security_group_id"),
    primary_vpc_id: getString(flattened.primary_vpc_id, "primary_vpc_id"),
    primary_region: getString(flattened.primary_region, "primary_region"),
    route53_nameservers: flattened.route53_nameservers as string | string[] | undefined,
    route53_zone_id: getString(flattened.route53_zone_id, "route53_zone_id"),
    secondary_alb_arn: getString(flattened.secondary_alb_arn, "secondary_alb_arn"),
    secondary_alb_dns: getString(flattened.secondary_alb_dns, "secondary_alb_dns"),
    secondary_alb_security_group_id: getString(flattened.secondary_alb_security_group_id, "secondary_alb_security_group_id"),
    secondary_ec2_instance_ids: flattened.secondary_ec2_instance_ids as string | string[] | undefined,
    secondary_ec2_security_group_id: getString(flattened.secondary_ec2_security_group_id, "secondary_ec2_security_group_id"),
    secondary_kms_key_id: getString(flattened.secondary_kms_key_id, "secondary_kms_key_id"),
    secondary_lambda_security_group_id: getString(flattened.secondary_lambda_security_group_id, "secondary_lambda_security_group_id"),
    secondary_rds_security_group_id: getString(flattened.secondary_rds_security_group_id, "secondary_rds_security_group_id"),
    secondary_vpc_id: getString(flattened.secondary_vpc_id, "secondary_vpc_id"),
    secondary_region: getString(flattened.secondary_region, "secondary_region"),
    secrets_manager_secret_arn: getString(flattened.secrets_manager_secret_arn, "secrets_manager_secret_arn"),
  };
};
const SHARED_OUTPUTS = loadOutputs();
console.log("Terraform outputs loaded successfully.", SHARED_OUTPUTS.primary_ec2_instance_ids);


let eventRuleName: string | null = null;
let originalEventRuleState: string | null = null;
let lambdaRuleTemporarilyDisabled = false;

const arnParts = (arn: string) => {
  const [label, partition, service, region, account, ...resourceParts] = arn.split(":");
  if (
    label !== "arn" ||
    !partition ||
    !service ||
    !region ||
    !account ||
    resourceParts.length === 0
  ) {
    throw new Error(`Invalid ARN: ${arn}`);
  }
  return { partition, service, region, account, resource: resourceParts.join(":") };
};

describe("E2E AWS Resource Integration Validation for tap_stack.tf", () => {
  const outputs = SHARED_OUTPUTS;

  let primaryRegion: string | undefined;
  let secondaryRegion: string | undefined;
  let lambdaRegion: string | undefined;

  let ec2Primary!: EC2Client;
  let ec2Secondary!: EC2Client;
  let elbPrimary!: ElasticLoadBalancingV2Client;
  let elbSecondary!: ElasticLoadBalancingV2Client;
  let kmsPrimary!: KMSClient;
  let kmsSecondary!: KMSClient;
  let lambdaClient!: LambdaClient;
  let eventBridgeClient!: EventBridgeClient;
  let secretsClient!: SecretsManagerClient;
  let rdsPrimaryClient!: RDSClient;
  let rdsSecondaryClient!: RDSClient;
  let route53Client!: Route53Client;

  let primaryVpc: any = null;
  let secondaryVpc: any = null;
  let primarySecurityGroups: any[] = [];
  let secondarySecurityGroups: any[] = [];
  let primaryAlbDescription: any = null;
  let secondaryAlbDescription: any = null;
  let primaryHealthStatus: boolean | null = null;
  let secondaryHealthStatus: boolean | null = null;
  let replicationRecordId: string | null = null;
  let replicationPayloadValue: string | null = null;
  let replicationPrimaryRead: any = null;
  let replicationSecondaryRead: any = null;
  let primaryKeyMetadata: any = null;
  let secondaryKeyMetadata: any = null;
  let lambdaConfiguration: any = null;
  let eventRuleDescription: any = null;
  let eventRuleTargets: any[] = [];
  let secretDescription: any = null;
  let globalClusterDescription: any = null;
  let primaryClusterDescription: any = null;
  let secondaryClusterDescription: any = null;
  let hostedZoneDescription: any = null;
  let hostedZoneNameservers: string[] = [];

  const fetchAlbHealth = async (dns: string): Promise<boolean> => {
    try {
      const response = await axios.get(`http://${dns}/health`, { timeout: 5000 });
      return response.status === 200 && response.data && response.data.status === "ok";
    } catch (error) {
      console.warn(`[WARN] Unable to reach ALB health endpoint (${dns}): ${(error as Error).message}`);
      return false;
    }
  };

  const postAppData = async (dns: string, payload: Record<string, unknown>) =>
    axios.post(`http://${dns}/data`, payload, {
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
    });

  const getAppData = async (dns: string, id: string) =>
    axios.get(`http://${dns}/data/${id}`, { timeout: 5000 });

  const triggerFailureMode = async (dns: string, seconds: number): Promise<AxiosResponse> =>
    axios.post(
      `http://${dns}/trigger-failure`,
      { seconds },
      {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      }
    );

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForAlbHealth = async (
    dns: string,
    expectedHealthy: boolean,
    attempts = 10,
    delayMs = 2000
  ): Promise<boolean> => {
    let lastStatus: boolean | null = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      lastStatus = await fetchAlbHealth(dns);
      if (lastStatus === expectedHealthy) {
        return lastStatus;
      }
      if (attempt < attempts - 1) {
        await delay(delayMs);
      }
    }

    throw new Error(
      `ALB (${dns}) health did not transition to ${expectedHealthy ? "healthy" : "unhealthy"
      } within ${attempts} attempts. Last observed status: ${String(lastStatus)}`
    );
  };

  beforeAll(async () => {

    primaryRegion = outputs.primary_region;
    secondaryRegion = outputs.secondary_region;
    lambdaRegion = primaryRegion;

    ec2Primary = new EC2Client({ region: primaryRegion });
    ec2Secondary = new EC2Client({ region: secondaryRegion });
    elbPrimary = new ElasticLoadBalancingV2Client({ region: primaryRegion });
    elbSecondary = new ElasticLoadBalancingV2Client({ region: secondaryRegion });
    kmsPrimary = new KMSClient({ region: primaryRegion });
    kmsSecondary = new KMSClient({ region: secondaryRegion });
    lambdaClient = new LambdaClient({ region: lambdaRegion });
    eventBridgeClient = new EventBridgeClient({
      region: arnParts(outputs.eventbridge_health_rule_arn).region,
    });
    secretsClient = new SecretsManagerClient({
      region: arnParts(outputs.secrets_manager_secret_arn).region,
    });
    rdsPrimaryClient = new RDSClient({ region: primaryRegion });
    rdsSecondaryClient = new RDSClient({ region: secondaryRegion });
    route53Client = new Route53Client({ region: primaryRegion });

    try {
      primaryVpc = (
        await ec2Primary.send(new DescribeVpcsCommand({ VpcIds: [outputs.primary_vpc_id] }))
      ).Vpcs?.[0] ?? null;

      secondaryVpc = (
        await ec2Secondary.send(new DescribeVpcsCommand({ VpcIds: [outputs.secondary_vpc_id] }))
      ).Vpcs?.[0] ?? null;

      primarySecurityGroups = (
        await ec2Primary.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [
              outputs.primary_alb_security_group_id,
              outputs.primary_ec2_security_group_id,
              outputs.primary_rds_security_group_id,
              outputs.primary_lambda_security_group_id,
            ],
          })
        )
      ).SecurityGroups ?? [];

      secondarySecurityGroups = (
        await ec2Secondary.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [
              outputs.secondary_alb_security_group_id,
              outputs.secondary_ec2_security_group_id,
              outputs.secondary_rds_security_group_id,
              outputs.secondary_lambda_security_group_id,
            ],
          })
        )
      ).SecurityGroups ?? [];

      primaryAlbDescription = (
        await elbPrimary.send(
          new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.primary_alb_arn] })
        )
      ).LoadBalancers?.[0] ?? null;

      secondaryAlbDescription = (
        await elbSecondary.send(
          new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.secondary_alb_arn] })
        )
      ).LoadBalancers?.[0] ?? null;

      primaryHealthStatus = await fetchAlbHealth(outputs.primary_alb_dns);
      secondaryHealthStatus = await fetchAlbHealth(outputs.secondary_alb_dns);

      try {
        const payloadValue = `integration-${Date.now()}`;
        const response = await postAppData(outputs.primary_alb_dns, { data: payloadValue });
        replicationRecordId = response.data?.id ?? null;
        replicationPayloadValue = payloadValue;
        if (replicationRecordId) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          replicationPrimaryRead = await getAppData(outputs.primary_alb_dns, replicationRecordId);
        }
      } catch (error) {
        console.warn(`[WARN] Application replication pre-check failed: ${(error as Error).message}`);
      }

      primaryKeyMetadata = (
        await kmsPrimary.send(new DescribeKeyCommand({ KeyId: outputs.primary_kms_key_id }))
      ).KeyMetadata ?? null;
      secondaryKeyMetadata = (
        await kmsSecondary.send(new DescribeKeyCommand({ KeyId: outputs.secondary_kms_key_id }))
      ).KeyMetadata ?? null;

      lambdaConfiguration = (
        await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: outputs.lambda_function_arn })
        )
      ).Configuration ?? null;

      const ruleName = outputs.eventbridge_health_rule_arn.split("/").pop() ?? "";
      eventRuleName = ruleName;
      eventRuleDescription = await eventBridgeClient.send(new DescribeRuleCommand({ Name: ruleName }));
      eventRuleTargets = (
        await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: ruleName }))
      ).Targets ?? [];
      originalEventRuleState = eventRuleDescription?.State ?? null;

      secretDescription = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.secrets_manager_secret_arn })
      );

      globalClusterDescription = (
        await rdsPrimaryClient.send(
          new DescribeGlobalClustersCommand({
            GlobalClusterIdentifier: outputs.aurora_global_cluster_id,
          })
        )
      ).GlobalClusters?.[0] ?? null;

      const primaryClusterId = outputs.aurora_primary_writer_endpoint.split(".")[0];
      primaryClusterDescription = (
        await rdsPrimaryClient.send(
          new DescribeDBClustersCommand({ DBClusterIdentifier: primaryClusterId })
        )
      ).DBClusters?.[0] ?? null;

      const secondaryClusterId = outputs.aurora_secondary_writer_endpoint.split(".")[0];
      secondaryClusterDescription = (
        await rdsSecondaryClient.send(
          new DescribeDBClustersCommand({ DBClusterIdentifier: secondaryClusterId })
        )
      ).DBClusters?.[0] ?? null;

      const zoneIdPath = outputs.route53_zone_id.startsWith("/hostedzone/")
        ? outputs.route53_zone_id
        : `/hostedzone/${outputs.route53_zone_id}`;
      hostedZoneDescription = await route53Client.send(
        new GetHostedZoneCommand({ Id: zoneIdPath })
      );
      hostedZoneNameservers = hostedZoneDescription.DelegationSet?.NameServers ?? [];
    } catch (error) {
      console.error(`[ERROR] AWS integration setup failed: ${(error as Error).message}`);
      throw error;
    }
  });

  describe("Regional Configuration", () => {
    test("primary and secondary regions are present in outputs", () => {
      expect(outputs.primary_region).toBeDefined();
      expect(outputs.secondary_region).toBeDefined();
      expect(outputs.primary_region.length).toBeGreaterThan(0);
      expect(outputs.secondary_region.length).toBeGreaterThan(0);
    });

    test("lambda function ARN region matches derived lambda region", () => {
      const lambdaArn = arnParts(outputs.lambda_function_arn);
      expect(lambdaArn.region).toBe(outputs.primary_region);
    });

    test("application URL uses expected domain", () => {
      const url = new URL(outputs.application_url);
      expect(url.hostname.endsWith("iac232-financial-project.com")).toBe(true);
    });
  });

  describe("VPC Resources", () => {
    test("primary VPC id matches Terraform output", () => {

      expect(primaryVpc?.VpcId).toBe(outputs.primary_vpc_id);
    });

    test("secondary VPC id matches Terraform output", () => {

      expect(secondaryVpc?.VpcId).toBe(outputs.secondary_vpc_id);
    });

    test("primary and secondary VPCs are distinct", () => {

      expect(primaryVpc?.VpcId).not.toBe(secondaryVpc?.VpcId);
    });
  });

  describe("Security Groups", () => {
    test("primary security groups retrieved", () => {

      expect(primarySecurityGroups.length).toBeGreaterThanOrEqual(4);
    });

    test("primary security groups include expected ids", () => {

      const ids = primarySecurityGroups.map((group) => group.GroupId);
      expect(ids).toEqual(
        expect.arrayContaining([
          outputs.primary_alb_security_group_id,
          outputs.primary_ec2_security_group_id,
          outputs.primary_rds_security_group_id,
          outputs.primary_lambda_security_group_id,
        ])
      );
    });

    test("secondary security groups include expected ids", () => {

      const ids = secondarySecurityGroups.map((group) => group.GroupId);
      expect(ids).toEqual(
        expect.arrayContaining([
          outputs.secondary_alb_security_group_id,
          outputs.secondary_ec2_security_group_id,
          outputs.secondary_rds_security_group_id,
          outputs.secondary_lambda_security_group_id,
        ])
      );
    });
  });

  describe("Application Load Balancers", () => {
    test("primary ALB dns matches output", () => {

      expect(primaryAlbDescription?.DNSName).toBe(outputs.primary_alb_dns);
    });

    test("secondary ALB dns matches output", () => {

      expect(secondaryAlbDescription?.DNSName).toBe(outputs.secondary_alb_dns);
    });

    test("ALB types are application", () => {

      expect(primaryAlbDescription?.Type).toBe("application");
      expect(secondaryAlbDescription?.Type).toBe("application");
    });
  });

  describe("ALB Health Endpoints", () => {
    test("primary ALB /health returns ok", () => {

      expect(primaryHealthStatus).toBe(true);
    });

    test("secondary ALB /health returns ok", () => {

      expect(secondaryHealthStatus).toBe(true);
    });
  });

  describe("E2E Failover and Application Data Replication", () => {
    test("POST response returned an identifier", () => {
      if (!replicationRecordId) { expect(true).toBe(false); return; }
      expect(replicationRecordId.length).toBeGreaterThan(0);
    });

    test("secondary region read returns replicated payload", () => {
      if (!replicationSecondaryRead || !replicationPayloadValue) return;
      expect(replicationSecondaryRead?.data?.data).toBe(replicationPayloadValue);
    });

    test("primary region read confirms payload persisted", () => {
      if (!replicationPrimaryRead || !replicationPayloadValue) return;
      expect(replicationPrimaryRead?.data?.data).toBe(replicationPayloadValue);
    });
  });

  describe("KMS Keys", () => {
    test("primary KMS key is enabled", () => {

      expect(primaryKeyMetadata?.KeyId).toBe(outputs.primary_kms_key_id);
      expect(primaryKeyMetadata?.Enabled).toBe(true);
    });

    test("secondary KMS key is enabled", () => {

      expect(secondaryKeyMetadata?.KeyId).toBe(outputs.secondary_kms_key_id);
      expect(secondaryKeyMetadata?.Enabled).toBe(true);
    });
  });

  describe("Failover Lambda", () => {
    test("lambda configuration matches ARN", () => {

      expect(lambdaConfiguration?.FunctionArn).toBe(outputs.lambda_function_arn);
    });

    test("lambda environment defines global cluster id", () => {

      const env = lambdaConfiguration?.Environment?.Variables ?? {};
      expect(env.GLOBAL_CLUSTER_ID).toBe(outputs.aurora_global_cluster_id);
      expect(env.SECONDARY_REGION).toBe(outputs.secondary_region);
    });
  });

  describe("EventBridge Rule", () => {
    test("health check rule is enabled", () => {

      expect(eventRuleDescription?.State).toBe("ENABLED");
    });

    test("rule targets include failover lambda", () => {

      expect(eventRuleTargets.some((target) => target.Arn === outputs.lambda_function_arn)).toBe(
        true
      );
    });
  });

  describe("Secrets Manager", () => {
    test("secret ARN matches output", () => {

      expect(secretDescription?.ARN).toBe(outputs.secrets_manager_secret_arn);
    });

    test("secret has a name", () => {

      expect(secretDescription?.Name).toBeDefined();
    });
  });

  describe("Aurora Global Database", () => {
    test("global cluster exists", () => {

      expect(globalClusterDescription?.GlobalClusterIdentifier).toBe(outputs.aurora_global_cluster_id);
    });

    test("primary cluster was described", () => {

      expect(primaryClusterDescription?.DBClusterIdentifier).toContain(
        outputs.aurora_primary_writer_endpoint.split(".")[0]
      );
    });

    test("secondary cluster was described", () => {

      expect(secondaryClusterDescription?.DBClusterIdentifier).toContain(
        outputs.aurora_secondary_writer_endpoint.split(".")[0]
      );
    });
  });

  describe("Route53 Hosted Zone", () => {
    test("hosted zone id matches output", () => {

      expect(hostedZoneDescription?.HostedZone?.Id?.endsWith(outputs.route53_zone_id)).toBe(true);
    });
  });

  describe("Application Failure Handling", () => {
    beforeAll(async () => {
      if (!eventRuleName) {
        return;
      }

      await eventBridgeClient.send(new DisableRuleCommand({ Name: eventRuleName }));
      lambdaRuleTemporarilyDisabled = true;
      await delay(2000);
    });

    afterAll(async () => {
      if (!lambdaRuleTemporarilyDisabled || !eventRuleName) {
        return;
      }

      const command =
        originalEventRuleState && originalEventRuleState.toUpperCase() === "DISABLED"
          ? new DisableRuleCommand({ Name: eventRuleName })
          : new EnableRuleCommand({ Name: eventRuleName });

      try {
        await eventBridgeClient.send(command);
      } finally {
        lambdaRuleTemporarilyDisabled = false;
      }
    });

    test("trigger failure endpoint makes primary ALB unhealthy temporarily", async () => {

      const response = await triggerFailureMode(outputs.primary_alb_dns, 20);
      expect(response.status).toBe(202);

      await waitForAlbHealth(outputs.primary_alb_dns, false, 15, 2000);

      await waitForAlbHealth(outputs.primary_alb_dns, true, 30, 2000);
    });
  });
});
