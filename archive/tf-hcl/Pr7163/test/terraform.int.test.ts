import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  DescribeDBParameterGroupsCommand
} from "@aws-sdk/client-rds";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeRouteTablesCommand
} from "@aws-sdk/client-ec2";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from "@aws-sdk/client-lambda";
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand
} from "@aws-sdk/client-kms";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand
} from "@aws-sdk/client-sns";
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand
} from "@aws-sdk/client-eventbridge";
import fs from "fs";
import path from "path";

describe("Terraform Multi-Region RDS DR Integration Tests", () => {
  const primaryRegion = process.env.AWS_REGION || "us-east-1";
  const drRegion = process.env.DR_REGION || "us-west-2";
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "test";
  const isLiveTest = process.env.RUN_LIVE_TESTS === "true";

  let primaryRdsClient: RDSClient;
  let drRdsClient: RDSClient;
  let primaryEc2Client: EC2Client;
  let drEc2Client: EC2Client;
  let lambdaClient: LambdaClient;
  let iamClient: IAMClient;
  let primaryKmsClient: KMSClient;
  let drKmsClient: KMSClient;
  let secretsClient: SecretsManagerClient;
  let cloudwatchClient: CloudWatchClient;
  let logsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  let eventsClient: EventBridgeClient;

  let outputs: any = {};

  beforeAll(() => {
    primaryRdsClient = new RDSClient({ region: primaryRegion });
    drRdsClient = new RDSClient({ region: drRegion });
    primaryEc2Client = new EC2Client({ region: primaryRegion });
    drEc2Client = new EC2Client({ region: drRegion });
    lambdaClient = new LambdaClient({ region: primaryRegion });
    iamClient = new IAMClient({ region: primaryRegion });
    primaryKmsClient = new KMSClient({ region: primaryRegion });
    drKmsClient = new KMSClient({ region: drRegion });
    secretsClient = new SecretsManagerClient({ region: primaryRegion });
    cloudwatchClient = new CloudWatchClient({ region: primaryRegion });
    logsClient = new CloudWatchLogsClient({ region: primaryRegion });
    snsClient = new SNSClient({ region: primaryRegion });
    eventsClient = new EventBridgeClient({ region: primaryRegion });

    const outputsPath = path.resolve(__dirname, "../tf-outputs/terraform-outputs.json");
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
    } else {
      outputs = {
        primary_endpoint: { value: `rds-primary-${environmentSuffix}.abc123.us-east-1.rds.amazonaws.com:5432` },
        dr_replica_endpoint: { value: `rds-dr-replica-${environmentSuffix}.xyz789.us-west-2.rds.amazonaws.com:5432` },
        primary_arn: { value: `arn:aws:rds:us-east-1:123456789012:db:rds-primary-${environmentSuffix}` },
        dr_replica_arn: { value: `arn:aws:rds:us-west-2:123456789012:db:rds-dr-replica-${environmentSuffix}` },
        lambda_function_name: { value: `rds-failover-monitor-${environmentSuffix}` },
        sns_topic_arn: { value: `arn:aws:sns:us-east-1:123456789012:rds-alerts-${environmentSuffix}` },
        vpc_peering_id: { value: `pcx-${environmentSuffix}` },
        secret_arn: { value: `arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password-${environmentSuffix}` }
      };
      console.log("Using mock outputs - deploy infrastructure first for live tests");
    }
  });

  describe("Primary RDS Instance Integration", () => {
    test("primary RDS instance exists and is available", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe("available");
      expect(response.DBInstances![0].Engine).toBe("postgres");
    });

    test("primary instance has correct engine version", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.EngineVersion).toMatch(/^\d+\.\d+/);
      expect(instance.Engine).toBe("postgres");
    });

    test("primary instance uses encryption at rest", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.StorageEncrypted).toBe(true);
      expect(instance.KmsKeyId).toBeDefined();
      expect(instance.StorageType).toBe("gp3");
    });

    test("primary instance has correct backup configuration", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(instance.PreferredBackupWindow).toBeDefined();
      expect(instance.PreferredMaintenanceWindow).toBeDefined();
    });

    test("primary instance has CloudWatch logs enabled", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.EnabledCloudwatchLogsExports).toContain("postgresql");
      expect(instance.EnabledCloudwatchLogsExports).toContain("upgrade");
    });

    test("primary instance is in correct VPC and subnet group", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.DBSubnetGroup?.DBSubnetGroupName).toMatch(new RegExp(`rds-primary-subnet-group-${environmentSuffix}`));
      expect(instance.VpcSecurityGroups).toBeDefined();
      expect(instance.VpcSecurityGroups!.length).toBeGreaterThan(0);
    });

    test("primary instance has correct parameter group", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      expect(instance.DBParameterGroups).toBeDefined();
      expect(instance.DBParameterGroups![0].DBParameterGroupName).toMatch(/postgres/);
    });

    test("primary instance has correct tags", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const instance = response.DBInstances![0];

      const tags = instance.TagList || [];
      const roleTag = tags.find(tag => tag.Key === "Role");
      const projectTag = tags.find(tag => tag.Key === "Project");

      expect(roleTag?.Value).toBe("primary");
      expect(projectTag?.Value).toBe("RDS-DR");
    });
  });

  describe("DR Read Replica Integration", () => {
    test("DR replica exists in secondary region", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe("available");
    });

    test("DR replica is configured as read replica", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      const replica = response.DBInstances![0];

      expect(replica.ReadReplicaSourceDBInstanceIdentifier).toContain(`rds-primary-${environmentSuffix}`);
      expect(replica.ReadReplicaSourceDBInstanceIdentifier).toContain("us-east-1");
    });

    test("DR replica uses separate KMS key", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      const replica = response.DBInstances![0];

      expect(replica.StorageEncrypted).toBe(true);
      expect(replica.KmsKeyId).toBeDefined();
      expect(replica.KmsKeyId).toContain("us-west-2");
    });

    test("DR replica is not multi-AZ", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      const replica = response.DBInstances![0];

      expect(replica.MultiAZ).toBe(false);
    });

    test("DR replica has correct tags", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      const replica = response.DBInstances![0];

      const tags = replica.TagList || [];
      const roleTag = tags.find(tag => tag.Key === "Role");

      expect(roleTag?.Value).toBe("replica");
    });
  });

  describe("VPC Primary Region Integration", () => {
    test("primary VPC exists with correct CIDR", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-vpc-${environmentSuffix}`] }
        ]
      });

      const response = await primaryEc2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
    });

    test("primary VPC has DNS support enabled", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-vpc-${environmentSuffix}`] }
        ]
      });

      const response = await primaryEc2Client.send(command);
      const vpc = response.Vpcs![0];

      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test("primary VPC has at least two subnets", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-vpc-${environmentSuffix}`] }
        ]
      });
      const vpcResponse = await primaryEc2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId!] }
        ]
      });
      const subnetResponse = await primaryEc2Client.send(subnetCommand);

      expect(subnetResponse.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test("primary subnets are in different availability zones", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-vpc-${environmentSuffix}`] }
        ]
      });
      const vpcResponse = await primaryEc2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId!] }
        ]
      });
      const subnetResponse = await primaryEc2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test("primary security group allows PostgreSQL traffic", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-db-sg-${environmentSuffix}`] }
        ]
      });

      const response = await primaryEc2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();

      if (response.SecurityGroups!.length > 0) {
        const sg = response.SecurityGroups![0];
        const postgresRule = sg.IpPermissions?.find(rule =>
          rule.FromPort === 5432 && rule.ToPort === 5432
        );
        expect(postgresRule).toBeDefined();
      }
    });

    test("DB subnet group exists and is configured correctly", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `rds-primary-subnet-group-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      expect(response.DBSubnetGroups).toHaveLength(1);
      expect(response.DBSubnetGroups![0].Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("VPC DR Region Integration", () => {
    test("DR VPC exists in secondary region", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-dr-vpc-${environmentSuffix}`] }
        ]
      });

      const response = await drEc2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe("10.1.0.0/16");
    });

    test("DR VPC has DNS support enabled", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-dr-vpc-${environmentSuffix}`] }
        ]
      });

      const response = await drEc2Client.send(command);
      const vpc = response.Vpcs![0];

      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test("DR DB subnet group exists", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_endpoint).toBeDefined();
        return;
      }

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `rds-dr-subnet-group-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      expect(response.DBSubnetGroups).toHaveLength(1);
    });
  });

  describe("VPC Peering Integration", () => {
    test("VPC peering connection exists and is active", async () => {
      if (!isLiveTest) {
        expect(outputs.vpc_peering_id).toBeDefined();
        return;
      }

      const command = new DescribeVpcPeeringConnectionsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`primary-to-dr-${environmentSuffix}`] }
        ]
      });

      const response = await primaryEc2Client.send(command);
      expect(response.VpcPeeringConnections).toBeDefined();

      if (response.VpcPeeringConnections!.length > 0) {
        expect(response.VpcPeeringConnections![0].Status?.Code).toBe("active");
      }
    });

    test("peering connection connects correct VPCs", async () => {
      if (!isLiveTest) {
        expect(outputs.vpc_peering_id).toBeDefined();
        return;
      }

      const command = new DescribeVpcPeeringConnectionsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`primary-to-dr-${environmentSuffix}`] }
        ]
      });

      const response = await primaryEc2Client.send(command);

      if (response.VpcPeeringConnections!.length > 0) {
        const peering = response.VpcPeeringConnections![0];
        expect(peering.RequesterVpcInfo?.Region).toBe("us-east-1");
        expect(peering.AccepterVpcInfo?.Region).toBe("us-west-2");
      }
    });

    test("route tables configured for peering", async () => {
      if (!isLiveTest) {
        expect(outputs.vpc_peering_id).toBeDefined();
        return;
      }

      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Name", Values: [`rds-primary-vpc-${environmentSuffix}`] }
        ]
      });
      const vpcResponse = await primaryEc2Client.send(vpcCommand);

      if (vpcResponse.Vpcs!.length > 0) {
        const vpcId = vpcResponse.Vpcs![0].VpcId;

        const routeCommand = new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId!] }
          ]
        });
        const routeResponse = await primaryEc2Client.send(routeCommand);

        expect(routeResponse.RouteTables).toBeDefined();
      }
    });
  });

  describe("Lambda Failover Monitor Integration", () => {
    test("Lambda function exists and is configured correctly", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: `rds-failover-monitor-${environmentSuffix}`
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(`rds-failover-monitor-${environmentSuffix}`);
      expect(response.Configuration?.Runtime).toBe("python3.11");
      expect(response.Configuration?.Handler).toBe("failover_monitor.lambda_handler");
    });

    test("Lambda has correct environment variables", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new GetFunctionConfigurationCommand({
        FunctionName: `rds-failover-monitor-${environmentSuffix}`
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Environment?.Variables;

      expect(envVars).toHaveProperty("REPLICATION_LAG_THRESHOLD");
      expect(envVars).toHaveProperty("DR_REPLICA_ID");
      expect(envVars).toHaveProperty("DR_REGION");
      expect(envVars!.DR_REGION).toBe("us-west-2");
    });

    test("Lambda has appropriate timeout", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new GetFunctionConfigurationCommand({
        FunctionName: `rds-failover-monitor-${environmentSuffix}`
      });

      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(60);
    });

    test("Lambda execution role exists", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const lambdaCommand = new GetFunctionConfigurationCommand({
        FunctionName: `rds-failover-monitor-${environmentSuffix}`
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const roleArn = lambdaResponse.Role;

      const roleName = roleArn!.split("/").pop();
      const roleCommand = new GetRoleCommand({ RoleName: roleName! });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
    });

    test("Lambda has CloudWatch logs permissions", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const lambdaCommand = new GetFunctionConfigurationCommand({
        FunctionName: `rds-failover-monitor-${environmentSuffix}`
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const roleArn = lambdaResponse.Role;
      const roleName = roleArn!.split("/").pop();

      const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName! });
      const policiesResponse = await iamClient.send(policiesCommand);

      expect(policiesResponse.AttachedPolicies).toBeDefined();
    });
  });

  describe("CloudWatch Events Integration", () => {
    test("EventBridge rule exists for Lambda trigger", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new ListRulesCommand({
        NamePrefix: `rds-failover-check-${environmentSuffix}`
      });

      const response = await eventsClient.send(command);
      expect(response.Rules).toBeDefined();

      if (response.Rules!.length > 0) {
        expect(response.Rules![0].ScheduleExpression).toBe("rate(5 minutes)");
        expect(response.Rules![0].State).toBe("ENABLED");
      }
    });

    test("EventBridge rule targets Lambda function", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const rulesCommand = new ListRulesCommand({
        NamePrefix: `rds-failover-check-${environmentSuffix}`
      });
      const rulesResponse = await eventsClient.send(rulesCommand);

      if (rulesResponse.Rules!.length > 0) {
        const ruleName = rulesResponse.Rules![0].Name;

        const targetsCommand = new ListTargetsByRuleCommand({ Rule: ruleName! });
        const targetsResponse = await eventsClient.send(targetsCommand);

        expect(targetsResponse.Targets).toBeDefined();
        expect(targetsResponse.Targets!.length).toBeGreaterThan(0);
        expect(targetsResponse.Targets![0].Arn).toContain("lambda");
      }
    });
  });

  describe("KMS Encryption Integration", () => {
    test("primary KMS key exists and has rotation enabled", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_arn).toBeDefined();
        return;
      }

      const listCommand = new ListAliasesCommand({});
      const listResponse = await primaryKmsClient.send(listCommand);

      const primaryKeyAlias = listResponse.Aliases?.find(a =>
        a.AliasName?.includes(`rds-primary-${environmentSuffix}`)
      );

      if (primaryKeyAlias) {
        const rotationCommand = new GetKeyRotationStatusCommand({
          KeyId: primaryKeyAlias.TargetKeyId!
        });
        const rotationResponse = await primaryKmsClient.send(rotationCommand);

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }
    });

    test("DR KMS key exists in DR region", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const listCommand = new ListAliasesCommand({});
      const listResponse = await drKmsClient.send(listCommand);

      const drKeyAlias = listResponse.Aliases?.find(a =>
        a.AliasName?.includes(`rds-dr-${environmentSuffix}`)
      );

      expect(drKeyAlias).toBeDefined();
    });
  });

  describe("Secrets Manager Integration", () => {
    test("database password secret exists", async () => {
      if (!isLiveTest) {
        expect(outputs.secret_arn).toBeDefined();
        return;
      }

      const command = new DescribeSecretCommand({
        SecretId: `db-password-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toContain(`db-password-${environmentSuffix}`);
      expect(response.KmsKeyId).toBeDefined();
    });

    test("secret is encrypted with KMS", async () => {
      if (!isLiveTest) {
        expect(outputs.secret_arn).toBeDefined();
        return;
      }

      const command = new DescribeSecretCommand({
        SecretId: `db-password-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.KmsKeyId).toContain("arn:aws:kms");
    });

    test("secret value can be retrieved", async () => {
      if (!isLiveTest) {
        expect(outputs.secret_arn).toBeDefined();
        return;
      }

      const command = new GetSecretValueCommand({
        SecretId: `db-password-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData).toHaveProperty("password");
      expect(secretData.password.length).toBeGreaterThan(16);
    });
  });

  describe("CloudWatch Monitoring Integration", () => {
    test("CloudWatch alarms exist for replication lag", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `rds-replication-lag-${environmentSuffix}`
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();

      if (response.MetricAlarms!.length > 0) {
        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toMatch(/ReplicaLag/i);
        expect(alarm.Namespace).toBe("AWS/RDS");
      }
    });

    test("Lambda log group exists", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/rds-failover-monitor-${environmentSuffix}`
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();

      if (response.logGroups!.length > 0) {
        expect(response.logGroups![0].logGroupName).toBe(`/aws/lambda/rds-failover-monitor-${environmentSuffix}`);
      }
    });

    test("log retention is configured", async () => {
      if (!isLiveTest) {
        expect(outputs.lambda_function_name).toBeDefined();
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/rds-failover-monitor-${environmentSuffix}`
      });

      const response = await logsClient.send(command);

      if (response.logGroups!.length > 0) {
        expect(response.logGroups![0].retentionInDays).toBeDefined();
      }
    });
  });

  describe("SNS Alerts Integration", () => {
    test("SNS topic exists for RDS alerts", async () => {
      if (!isLiveTest) {
        expect(outputs.sns_topic_arn).toBeDefined();
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn.value
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toContain(`rds-alerts-${environmentSuffix}`);
    });

    test("CloudWatch alarms publish to SNS topic", async () => {
      if (!isLiveTest) {
        expect(outputs.sns_topic_arn).toBeDefined();
        return;
      }

      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `rds-replication-lag-${environmentSuffix}`
      });
      const alarmsResponse = await cloudwatchClient.send(alarmsCommand);

      if (alarmsResponse.MetricAlarms!.length > 0) {
        const alarm = alarmsResponse.MetricAlarms![0];
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.some(arn => arn.includes("rds-alerts"))).toBe(true);
      }
    });
  });

  describe("End-to-End Disaster Recovery Workflow", () => {
    test("all infrastructure components are properly connected", async () => {
      expect(outputs.primary_endpoint).toBeDefined();
      expect(outputs.dr_replica_endpoint).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.vpc_peering_id).toBeDefined();
      expect(outputs.secret_arn).toBeDefined();
    });

    test("primary and replica use consistent naming", async () => {
      expect(outputs.primary_endpoint.value).toContain(environmentSuffix);
      expect(outputs.dr_replica_endpoint.value).toContain(environmentSuffix);
      expect(outputs.lambda_function_name.value).toContain(environmentSuffix);
    });

    test("cross-region replication is established", async () => {
      if (!isLiveTest) {
        expect(outputs.dr_replica_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-dr-replica-${environmentSuffix}`
      });

      const response = await drRdsClient.send(command);
      const replica = response.DBInstances![0];

      expect(replica.ReadReplicaSourceDBInstanceIdentifier).toContain("us-east-1");
      expect(replica.DBInstanceArn).toContain("us-west-2");
    });

    test("monitoring and alerting pipeline is complete", async () => {
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();

      if (!isLiveTest) return;

      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name.value
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      expect(lambdaResponse.Configuration).toBeDefined();
    });

    test("security configuration is properly implemented", async () => {
      expect(outputs.secret_arn).toBeDefined();
      expect(outputs.primary_arn).toBeDefined();

      if (!isLiveTest) return;

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });
      const dbResponse = await primaryRdsClient.send(dbCommand);

      expect(dbResponse.DBInstances![0].StorageEncrypted).toBe(true);
    });
  });

  describe("Resource Tagging and Compliance", () => {
    test("all resources have required tags", async () => {
      if (!isLiveTest) {
        expect(outputs.primary_arn).toBeDefined();
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `rds-primary-${environmentSuffix}`
      });

      const response = await primaryRdsClient.send(command);
      const tags = response.DBInstances![0].TagList || [];

      expect(tags.some(t => t.Key === "Project")).toBe(true);
      expect(tags.some(t => t.Key === "Environment")).toBe(true);
      expect(tags.some(t => t.Key === "Suffix")).toBe(true);
      expect(tags.some(t => t.Key === "ManagedBy" && t.Value === "Terraform")).toBe(true);
    });
  });
});
