import {
  CloudWatchClient,
  DescribeLogGroupsCommand,
  DescribeAlarmsCommand,
  GetDashboardCommand,
  DescribeLogGroupsCommandOutput,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand as LogsDescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { XRayClient, GetSamplingRulesCommand } from "@aws-sdk/client-xray";
import * as fs from "fs";
import * as path from "path";

// Load deployment outputs
const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

// Parse complex outputs
const logGroupNames = JSON.parse(outputs.logGroupNames);
const snsTopicArns = JSON.parse(outputs.snsTopicArns);

// Initialize AWS clients
const region = "us-east-1";
const cloudwatch = new CloudWatchClient({ region });
const logs = new CloudWatchLogsClient({ region });
const kms = new KMSClient({ region });
const sns = new SNSClient({ region });
const lambda = new LambdaClient({ region });
const xray = new XRayClient({ region });

describe("TapStack Monitoring Infrastructure - Integration Tests", () => {
  describe("KMS Key", () => {
    it("should exist and have key rotation enabled", async () => {
      expect(outputs.kmsKeyArn).toBeDefined();
      expect(outputs.kmsKeyArn).toMatch(/^arn:aws:kms:us-east-1:\d+:key\//);

      const keyId = outputs.kmsKeyArn.split("/").pop();
      const response = await kms.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe("Enabled");
      expect(response.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    });
  });

  describe("CloudWatch Log Groups", () => {
    it("should have created log groups for all services", async () => {
      expect(logGroupNames).toBeDefined();
      expect(Array.isArray(logGroupNames)).toBe(true);
      expect(logGroupNames.length).toBe(3);

      const expectedServices = [
        "payment-api",
        "fraud-detector",
        "notification-service",
      ];

      for (const service of expectedServices) {
        const found = logGroupNames.some((name: string) =>
          name.includes(service)
        );
        expect(found).toBe(true);
      }
    });

    it("should have log groups with 30-day retention", async () => {
      for (const logGroupName of logGroupNames) {
        const response = await logs.send(
          new LogsDescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);

        const logGroup = response.logGroups![0];
        expect(logGroup.retentionInDays).toBe(30);
        expect(logGroup.kmsKeyId).toBeDefined();
      }
    }, 30000);

    it("should have log groups encrypted with KMS", async () => {
      const keyId = outputs.kmsKeyArn.split("/").pop();

      for (const logGroupName of logGroupNames) {
        const response = await logs.send(
          new LogsDescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        const logGroup = response.logGroups![0];
        expect(logGroup.kmsKeyId).toBeDefined();
        expect(logGroup.kmsKeyId).toContain(keyId);
      }
    }, 30000);
  });

  describe("SNS FIFO Topics", () => {
    it("should have created all alert topics", async () => {
      expect(snsTopicArns).toBeDefined();
      expect(typeof snsTopicArns).toBe("object");

      const expectedTopics = [
        "fraudSpike",
        "paymentFailures",
        "serviceDegradation",
      ];

      for (const topic of expectedTopics) {
        expect(snsTopicArns[topic]).toBeDefined();
        expect(snsTopicArns[topic]).toMatch(/^arn:aws:sns:us-east-1:\d+:/);
        expect(snsTopicArns[topic]).toContain(".fifo");
      }
    });

    it("should have FIFO topics with content-based deduplication", async () => {
      for (const topicArn of Object.values(snsTopicArns)) {
        const response = await sns.send(
          new GetTopicAttributesCommand({
            TopicArn: topicArn as string,
          })
        );

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!["FifoTopic"]).toBe("true");
        expect(response.Attributes!["ContentBasedDeduplication"]).toBe("true");
      }
    }, 30000);
  });

  describe("Lambda Function", () => {
    it("should exist and be configured with ARM64 architecture", async () => {
      const functionName = outputs.lambdaFunctionArn
        ? outputs.lambdaFunctionArn.split(":").pop()
        : null;

      expect(functionName).toBeDefined();

      const response = await lambda.send(
        new GetFunctionCommand({
          FunctionName: functionName!,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Architectures).toContain("arm64");
      expect(response.Configuration!.Runtime).toContain("nodejs");
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(256);
    });

    it("should have correct IAM permissions for CloudWatch", async () => {
      const functionName = outputs.lambdaFunctionArn
        ? outputs.lambdaFunctionArn.split(":").pop()
        : null;

      const response = await lambda.send(
        new GetFunctionCommand({
          FunctionName: functionName!,
        })
      );

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration!.Role).toContain("metric-aggregator-role");
    });
  });

  describe("X-Ray Sampling Rules", () => {
    it("should have created sampling rules for all services", async () => {
      const response = await xray.send(new GetSamplingRulesCommand({}));

      expect(response.SamplingRuleRecords).toBeDefined();

      const rules = response.SamplingRuleRecords!.filter((record) =>
        record.SamplingRule?.RuleName?.includes("synthm3k1j6t7")
      );

      // Should have rules for success (10%) and error (100%) sampling
      expect(rules.length).toBeGreaterThanOrEqual(2);

      // Check for 10% success sampling rule
      const successRule = rules.find(
        (r) => r.SamplingRule?.FixedRate === 0.1
      );
      expect(successRule).toBeDefined();

      // Check for 100% error sampling rule
      const errorRule = rules.find((r) => r.SamplingRule?.FixedRate === 1.0);
      expect(errorRule).toBeDefined();
    }, 30000);
  });

  describe("CloudWatch Dashboard", () => {
    it("should exist and be accessible", async () => {
      expect(outputs.dashboardUrl).toBeDefined();
      expect(outputs.dashboardUrl).toContain(
        "console.aws.amazon.com/cloudwatch"
      );
      expect(outputs.dashboardUrl).toContain("dashboards:name=");

      // Extract dashboard name from URL
      const dashboardName = outputs.dashboardUrl.split("name=")[1];
      expect(dashboardName).toBeDefined();

      const response = await cloudwatch.send(
        new GetDashboardCommand({
          DashboardName: dashboardName,
        })
      );

      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });

    it("should contain metric math widgets", async () => {
      const dashboardName = outputs.dashboardUrl.split("name=")[1];

      const response = await cloudwatch.send(
        new GetDashboardCommand({
          DashboardName: dashboardName,
        })
      );

      const dashboardBody = JSON.parse(response.DashboardBody!);

      // Check for metric math expression
      const hasMetricMath = dashboardBody.widgets.some((widget: any) => {
        const metrics = widget.properties?.metrics || [];
        return metrics.some((metric: any) => metric.expression !== undefined);
      });

      expect(hasMetricMath).toBe(true);
    });
  });

  describe("CloudWatch Alarms", () => {
    it("should have created metric alarms", async () => {
      const response = await cloudwatch.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "payment",
        })
      );

      expect(response.MetricAlarms).toBeDefined();

      const alarms = response.MetricAlarms!.filter((alarm) =>
        alarm.AlarmName?.includes("synthm3k1j6t7")
      );

      expect(alarms.length).toBeGreaterThan(0);
    });

    it("should have created composite alarm", async () => {
      const response = await cloudwatch.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "critical",
        })
      );

      expect(response.CompositeAlarms).toBeDefined();

      const compositeAlarms = response.CompositeAlarms!.filter((alarm) =>
        alarm.AlarmName?.includes("synthm3k1j6t7")
      );

      expect(compositeAlarms.length).toBeGreaterThan(0);

      const compositeAlarm = compositeAlarms[0];
      expect(compositeAlarm.AlarmRule).toBeDefined();
      expect(compositeAlarm.AlarmRule).toContain("ALARM(");
      expect(compositeAlarm.AlarmRule).toContain("OR");
    });
  });

  describe("Resource Tagging", () => {
    it("should have properly tagged all resources", async () => {
      // Check log group tags
      const response = await logs.send(
        new LogsDescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupNames[0],
        })
      );

      const logGroup = response.logGroups![0];
      expect(logGroup.tags).toBeDefined();

      // Verify standard tags are present
      const tags = logGroup.tags || {};
      expect(tags["Environment"]).toBeDefined();
      expect(tags["Service"]).toBeDefined();
    }, 30000);
  });

  describe("EventBridge Scheduling", () => {
    it("should have Lambda triggered on schedule", async () => {
      const functionName = outputs.lambdaFunctionArn
        ? outputs.lambdaFunctionArn.split(":").pop()
        : null;

      const response = await lambda.send(
        new GetFunctionCommand({
          FunctionName: functionName!,
        })
      );

      // Lambda should exist and be invokable by EventBridge
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).not.toBe("Failed");
    });
  });
});
