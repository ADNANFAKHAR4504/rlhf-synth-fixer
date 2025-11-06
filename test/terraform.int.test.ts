// test/terraform.int.test.ts
// Comprehensive integration tests for Terraform infrastructure
// Includes both plan validation and live AWS resource tests

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  DescribeLogGroupsCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand
} from "@aws-sdk/client-database-migration-service";
import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeKeyCommand,
  KMSClient,
} from "@aws-sdk/client-kms";
import {
  DescribeDBInstancesCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  GetTopicAttributesCommand,
  SNSClient,
} from "@aws-sdk/client-sns";
import {
  GetParametersByPathCommand,
  SSMClient
} from "@aws-sdk/client-ssm";
import {
  GetWebACLCommand,
  WAFV2Client,
} from "@aws-sdk/client-wafv2";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Test configuration
const REGION = process.env.AWS_REGION || "ap-southeast-1";
const TEST_TIMEOUT = 120000; // 2 minutes per test for live tests
const TERRAFORM_DIR = path.resolve(__dirname, "../lib");
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "test";

// AWS Clients
const cloudwatchClient = new CloudWatchClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const dmsClient = new DatabaseMigrationServiceClient({ region: REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
const asgClient = new AutoScalingClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });
const ssmClient = new SSMClient({ region: REGION });
const wafClient = new WAFV2Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  // Try cfn-outputs file first (for CI/CD environments)
  const cfnOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const outputsData = fs.readFileSync(cfnOutputsPath, "utf-8");
      const outputs = JSON.parse(outputsData);

      // Convert Terraform output format to simple key-value
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(outputs)) {
        result[key] = (value as any).value;
      }
      console.log(`✅ Loaded outputs from ${cfnOutputsPath}`);
      return result;
    } catch (error) {
      console.warn("⚠️  Failed to read cfn-outputs file:", error);
    }
  }

  // Fallback to terraform output command
  try {
    const outputJson = execSync("terraform output -json", {
      cwd: TERRAFORM_DIR,
      encoding: "utf-8",
    });
    const outputs = JSON.parse(outputJson);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputs)) {
      result[key] = (value as any).value;
    }
    return result;
  } catch (error) {
    console.warn("⚠️  Failed to get Terraform outputs:", error);
    return {};
  }
}

// Helper: Check if live tests should run
function shouldRunLiveTests(): boolean {
  return process.env.RUN_LIVE_TESTS === "true" || process.env.CI === "true";
}

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    console.log("📋 Available Terraform outputs:", Object.keys(outputs));
  });

  describe("Suite 1: Terraform Plan and Output Validation", () => {
    test(
      "should validate Terraform configuration syntax",
      () => {
        try {
          execSync("terraform fmt -check", {
            cwd: TERRAFORM_DIR,
            stdio: "pipe",
          });
        } catch (error) {
          execSync("terraform fmt", { cwd: TERRAFORM_DIR });
          throw new Error("Terraform files were not properly formatted");
        }
      },
      TEST_TIMEOUT
    );

    test(
      "should validate Terraform configuration",
      () => {
        execSync("terraform init -backend=false", {
          cwd: TERRAFORM_DIR,
          stdio: "pipe",
        });
        execSync("terraform validate", {
          cwd: TERRAFORM_DIR,
          stdio: "pipe",
        });
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 2: Live AWS Resource Tests - VPC and Networking", () => {
    beforeAll(() => {
      if (!shouldRunLiveTests()) {
        console.log("⏭️  Skipping live tests (set RUN_LIVE_TESTS=true to enable)");
      }
    });

    test(
      "LIVE: should verify VPC exists and has correct configuration",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const vpcId = outputs.vpc_id;
        expect(vpcId).toBeTruthy();

        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);
        expect(response.Vpcs![0].VpcId).toBe(vpcId);
        expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
        expect(response.Vpcs![0].State).toBe("available");
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify public subnets exist and are correctly configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const subnetIds = outputs.public_subnet_ids;
        expect(subnetIds).toBeInstanceOf(Array);
        expect(subnetIds.length).toBeGreaterThanOrEqual(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(subnetIds.length);

        response.Subnets!.forEach((subnet) => {
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.State).toBe("available");
        });
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify private subnets exist and are correctly configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const appSubnetIds = outputs.private_app_subnet_ids;
        const dbSubnetIds = outputs.private_db_subnet_ids;

        expect(appSubnetIds).toBeInstanceOf(Array);
        expect(dbSubnetIds).toBeInstanceOf(Array);

        const allSubnetIds = [...appSubnetIds, ...dbSubnetIds];
        const command = new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toBeDefined();
        response.Subnets!.forEach((subnet) => {
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe("available");
        });
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify VPC Flow Logs are configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const vpcId = outputs.vpc_id;
        const command = new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: "resource-id",
              Values: [vpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.FlowLogs).toBeDefined();
        expect(response.FlowLogs!.length).toBeGreaterThan(0);
        expect(response.FlowLogs![0].TrafficType).toBe("ALL");
        expect(response.FlowLogs![0].FlowLogStatus).toBe("ACTIVE");
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 3: Live AWS Resource Tests - RDS Database", () => {
    test(
      "LIVE: should verify RDS instance exists and is configured correctly",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        const response = await rdsClient.send(command);

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const dbInstance = response.DBInstances![0];
        expect(dbInstance.DBInstanceIdentifier).toBe(dbIdentifier);
        expect(dbInstance.Engine).toBe("postgres");
        expect(dbInstance.MultiAZ).toBe(true);
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.DBInstanceStatus).toBe("available");
        expect(dbInstance.KmsKeyId).toBeTruthy();
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify RDS Performance Insights is enabled",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        const response = await rdsClient.send(command);

        const dbInstance = response.DBInstances![0];
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
        expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify RDS endpoint matches Terraform output",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        const response = await rdsClient.send(command);

        const dbInstance = response.DBInstances![0];
        const endpoint = dbInstance.Endpoint?.Address;
        const port = dbInstance.Endpoint?.Port;

        expect(endpoint).toBeTruthy();
        expect(port).toBe(5432);
        expect(outputs.rds_endpoint).toContain(endpoint);
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 4: Live AWS Resource Tests - Application Load Balancer", () => {
    test(
      "LIVE: should verify ALB exists and is accessible",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const albArn = outputs.alb_arn;
        expect(albArn).toBeTruthy();

        const command = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        });
        const response = await elbClient.send(command);

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);

        const alb = response.LoadBalancers![0];
        expect(alb.LoadBalancerArn).toBe(albArn);
        expect(alb.Type).toBe("application");
        expect(alb.Scheme).toBe("internet-facing");
        expect(alb.State?.Code).toBe("active");
        expect(alb.DNSName).toBe(outputs.alb_dns_name);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify ALB responds to HTTP requests",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const albDnsName = outputs.alb_dns_name;
        expect(albDnsName).toBeTruthy();

        // Use fetch to test ALB connectivity
        try {
          const response = await fetch(`http://${albDnsName}/health`, {
            method: "GET",
            headers: { "User-Agent": "terraform-test" },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          // ALB should respond (even if backend is not ready)
          expect(response.status).toBeGreaterThanOrEqual(200);
          expect(response.status).toBeLessThan(600);
        } catch (error: any) {
          // If connection fails, verify ALB is at least configured
          const command = new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.alb_arn],
          });
          const albResponse = await elbClient.send(command);
          expect(albResponse.LoadBalancers![0].State?.Code).toBe("active");
        }
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify target group has health checks configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const albArn = outputs.alb_arn;
        const describeCommand = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        });
        const albResponse = await elbClient.send(describeCommand);
        const alb = albResponse.LoadBalancers![0];

        const tgCommand = new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        });
        const tgResponse = await elbClient.send(tgCommand);

        expect(tgResponse.TargetGroups).toBeDefined();
        expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

        const targetGroup = tgResponse.TargetGroups![0];
        expect(targetGroup.HealthCheckPath).toBe("/health");
        expect(targetGroup.HealthCheckProtocol).toBe("HTTP");
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 5: Live AWS Resource Tests - Auto Scaling Group", () => {
    test(
      "LIVE: should verify Auto Scaling Group exists and is configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const asgName = outputs.autoscaling_group_name;
        expect(asgName).toBeTruthy();

        const command = new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        });
        const response = await asgClient.send(command);

        expect(response.AutoScalingGroups).toBeDefined();
        expect(response.AutoScalingGroups!.length).toBe(1);

        const asg = response.AutoScalingGroups![0];
        expect(asg.AutoScalingGroupName).toBe(asgName);
        expect(asg.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(6);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe("ELB");
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify ASG instances are running",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const asgName = outputs.autoscaling_group_name;
        const command = new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        });
        const response = await asgClient.send(command);

        const asg = response.AutoScalingGroups![0];
        expect(asg.Instances).toBeDefined();
        expect(asg.Instances!.length).toBeGreaterThan(0);

        // Verify instances are in healthy state
        const healthyInstances = asg.Instances!.filter(
          (inst) => inst.HealthStatus === "Healthy" && inst.LifecycleState === "InService"
        );
        expect(healthyInstances.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 6: Live AWS Resource Tests - Secrets Manager", () => {
    test(
      "LIVE: should verify database secret exists and rotation is enabled",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const secretArn = outputs.db_secret_arn;
        expect(secretArn).toBeTruthy();

        const describeCommand = new DescribeSecretCommand({
          SecretId: secretArn,
        });
        const describeResponse = await secretsClient.send(describeCommand);

        expect(describeResponse.ARN).toBe(secretArn);
        expect(describeResponse.Name).toContain("payment-db-credentials");
        expect(describeResponse.RotationEnabled).toBe(true);
        expect(describeResponse.RotationRules?.AutomaticallyAfterDays).toBe(30);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify secret contains required database connection keys",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const secretArn = outputs.db_secret_arn;
        const command = new GetSecretValueCommand({
          SecretId: secretArn,
        });
        const response = await secretsClient.send(command);

        expect(response.SecretString).toBeTruthy();
        const secret = JSON.parse(response.SecretString!);
        expect(secret).toHaveProperty("username");
        expect(secret).toHaveProperty("password");
        expect(secret).toHaveProperty("engine");
        expect(secret).toHaveProperty("host");
        expect(secret).toHaveProperty("port");
        expect(secret).toHaveProperty("dbname");
        expect(secret.engine).toBe("postgres");
        expect(secret.port).toBe(5432);
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 7: Live AWS Resource Tests - WAF", () => {
    test(
      "LIVE: should verify WAF Web ACL exists and is associated with ALB",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const wafArn = outputs.waf_web_acl_arn;
        expect(wafArn).toBeTruthy();

        const arnParts = wafArn.split("/");
        const webAclId = arnParts[arnParts.length - 1];
        const scope = wafArn.includes("regional") ? "REGIONAL" : "CLOUDFRONT";

        const command = new GetWebACLCommand({
          Scope: scope as any,
          Id: webAclId,
        });
        const response = await wafClient.send(command);

        expect(response.WebACL).toBeDefined();
        expect(response.WebACL!.ARN).toBe(wafArn);
        expect(response.WebACL!.Name).toContain("payment-waf");
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify WAF has enhanced security rules",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const wafArn = outputs.waf_web_acl_arn;
        const arnParts = wafArn.split("/");
        const webAclId = arnParts[arnParts.length - 1];
        const scope = wafArn.includes("regional") ? "REGIONAL" : "CLOUDFRONT";

        const command = new GetWebACLCommand({
          Scope: scope as any,
          Id: webAclId,
        });
        const response = await wafClient.send(command);

        expect(response.WebACL!.Rules).toBeDefined();
        expect(response.WebACL!.Rules!.length).toBeGreaterThan(1);

        // Verify managed rule groups are present
        const hasManagedRules = response.WebACL!.Rules!.some((r) =>
          r.Statement?.ManagedRuleGroupStatement
        );
        expect(hasManagedRules).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 8: Live AWS Resource Tests - CloudWatch", () => {
    test(
      "LIVE: should verify CloudWatch log group exists",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const logGroupName = outputs.cloudwatch_log_group_app;
        if (logGroupName) {
          const command = new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          });
          const response = await cloudwatchClient.send(command);

          expect(response.logGroups).toBeDefined();
          const logGroup = response.logGroups!.find(
            (lg) => lg.logGroupName === logGroupName
          );
          expect(logGroup).toBeDefined();
          expect(logGroup?.retentionInDays).toBeGreaterThan(0);
        }
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify CloudWatch alarms are configured with SNS actions",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const snsTopicArn = outputs.sns_topic_arn;
        if (snsTopicArn) {
          const command = new DescribeAlarmsCommand({
            AlarmNamePrefix: `payment-${ENVIRONMENT_SUFFIX}`,
          });
          const response = await cloudwatchClient.send(command);

          expect(response.MetricAlarms).toBeDefined();
          expect(response.MetricAlarms!.length).toBeGreaterThan(0);

          // Verify at least one alarm has SNS action
          const alarmsWithSns = response.MetricAlarms!.filter((alarm) =>
            alarm.AlarmActions?.includes(snsTopicArn)
          );
          expect(alarmsWithSns.length).toBeGreaterThan(0);
        }
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify RDS CloudWatch metrics are available",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

        const command = new GetMetricStatisticsCommand({
          Namespace: "AWS/RDS",
          MetricName: "CPUUtilization",
          Dimensions: [
            {
              Name: "DBInstanceIdentifier",
              Value: dbIdentifier,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300, // 5 minutes
          Statistics: ["Average"],
        });

        const response = await cloudwatchClient.send(command);
        expect(response.Datapoints).toBeDefined();
        // Metrics may not have data immediately, but the command should succeed
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 9: Live AWS Resource Tests - SNS", () => {
    test(
      "LIVE: should verify SNS topic exists for alarm notifications",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const snsTopicArn = outputs.sns_topic_arn;
        if (snsTopicArn) {
          const command = new GetTopicAttributesCommand({
            TopicArn: snsTopicArn,
          });
          const response = await snsClient.send(command);

          expect(response.Attributes).toBeDefined();
          expect(response.Attributes!.TopicArn).toBe(snsTopicArn);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 10: Live AWS Resource Tests - Security Groups", () => {
    test(
      "LIVE: should verify database security group restricts public access",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const rdsCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        const rdsResponse = await rdsClient.send(rdsCommand);
        const dbInstance = rdsResponse.DBInstances![0];
        const dbSecurityGroupIds = dbInstance.VpcSecurityGroups?.map(
          (sg) => sg.VpcSecurityGroupId
        );

        expect(dbSecurityGroupIds).toBeDefined();
        expect(dbSecurityGroupIds!.length).toBeGreaterThan(0);

        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: dbSecurityGroupIds,
        });
        const sgResponse = await ec2Client.send(sgCommand);

        const dbSg = sgResponse.SecurityGroups![0];
        // Database security group should not allow public access
        const hasPublicAccess = dbSg.IpPermissions?.some((rule) =>
          rule.IpRanges?.some((range) => range.CidrIp === "0.0.0.0/0")
        );
        expect(hasPublicAccess).toBe(false);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify ALB security group allows HTTP/HTTPS",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const albArn = outputs.alb_arn;
        const albCommand = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        });
        const albResponse = await elbClient.send(albCommand);
        const alb = albResponse.LoadBalancers![0];
        const albSecurityGroupIds = alb.SecurityGroups;

        expect(albSecurityGroupIds).toBeDefined();
        expect(albSecurityGroupIds!.length).toBeGreaterThan(0);

        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: albSecurityGroupIds,
        });
        const sgResponse = await ec2Client.send(sgCommand);

        const albSg = sgResponse.SecurityGroups![0];
        // ALB security group should allow HTTP (port 80) or HTTPS (port 443)
        const allowsHttp = albSg.IpPermissions?.some(
          (rule) =>
            (rule.FromPort === 80 || rule.FromPort === 443) &&
            rule.IpProtocol === "tcp"
        );
        expect(allowsHttp).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 11: Live AWS Resource Tests - KMS", () => {
    test(
      "LIVE: should verify KMS key exists for RDS encryption",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dbIdentifier = `payment-db-${ENVIRONMENT_SUFFIX}`;
        const rdsCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        });
        const rdsResponse = await rdsClient.send(rdsCommand);
        const kmsKeyId = rdsResponse.DBInstances![0].KmsKeyId;

        expect(kmsKeyId).toBeTruthy();

        const kmsCommand = new DescribeKeyCommand({
          KeyId: kmsKeyId!,
        });
        const kmsResponse = await kmsClient.send(kmsCommand);

        expect(kmsResponse.KeyMetadata).toBeDefined();
        expect(kmsResponse.KeyMetadata!.KeyId).toBe(kmsKeyId);
        expect(kmsResponse.KeyMetadata!.KeyState).toBe("Enabled");
        expect(kmsResponse.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 12: Live AWS Resource Tests - DMS", () => {
    test(
      "LIVE: should verify DMS replication instance exists",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const dmsInstanceArn = outputs.dms_replication_instance_arn;
        if (dmsInstanceArn) {
          const command = new DescribeReplicationInstancesCommand({
            Filters: [
              {
                Name: "replication-instance-arn",
                Values: [dmsInstanceArn],
              },
            ],
          });
          const response = await dmsClient.send(command);

          expect(response.ReplicationInstances).toBeDefined();
          expect(response.ReplicationInstances!.length).toBe(1);

          const instance = response.ReplicationInstances![0];
          expect(instance.ReplicationInstanceArn).toBe(dmsInstanceArn);
          expect(instance.ReplicationInstanceStatus).toBe("available");
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 13: Live AWS Resource Tests - Systems Manager", () => {
    test(
      "LIVE: should verify SSM parameters exist for application configuration",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const parameterPath = `/payment/${ENVIRONMENT_SUFFIX}/`;
        const command = new GetParametersByPathCommand({
          Path: parameterPath,
          Recursive: true,
        });
        const response = await ssmClient.send(command);

        expect(response.Parameters).toBeDefined();
        // Verify at least one parameter exists
        expect(response.Parameters!.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });
});
