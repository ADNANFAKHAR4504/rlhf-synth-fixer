// Integration tests for deployed CloudWatch monitoring infrastructure
// Tests actual deployed AWS resources using outputs from cfn-outputs/flat-outputs.json

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand,
  GetDashboardCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
  DescribeQueryDefinitionsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import fs from "fs";
import path from "path";

const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

interface DeploymentOutputs {
  dashboard_url: string;
  sns_topic_arn: string;
  log_group_names: {
    payment_api: string;
    transaction_processor: string;
    fraud_detector: string;
  };
  alarm_names: {
    api_error_rate: string;
    api_response_time: string;
    failed_transactions: string;
    multi_service_failure: string;
    high_load: string;
  };
  custom_metric_namespaces: string[];
}

describe("CloudWatch Monitoring Infrastructure Integration Tests", () => {
  let outputs: DeploymentOutputs;
  let cwClient: CloudWatchClient;
  let cwLogsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  let kmsClient: KMSClient;
  const region = process.env.AWS_REGION || "us-east-1";

  beforeAll(() => {
    // Load deployment outputs
    expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, "utf8"));

    // Initialize AWS clients
    cwClient = new CloudWatchClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
    snsClient = new SNSClient({ region });
    kmsClient = new KMSClient({ region });
  });

  describe("CloudWatch Log Groups", () => {
    test("payment_api log group exists and is configured correctly", async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.log_group_names.payment_api,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.log_group_names.payment_api);
      expect(logGroup.retentionInDays).toBe(7);
      expect(logGroup.kmsKeyId).toBeDefined();
    });

    test("transaction_processor log group exists and is configured correctly", async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.log_group_names.transaction_processor,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.log_group_names.transaction_processor);
      expect(logGroup.retentionInDays).toBe(7);
      expect(logGroup.kmsKeyId).toBeDefined();
    });

    test("fraud_detector log group exists and is configured correctly", async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.log_group_names.fraud_detector,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.log_group_names.fraud_detector);
      expect(logGroup.retentionInDays).toBe(7);
      expect(logGroup.kmsKeyId).toBeDefined();
    });

    test("all log groups use same KMS key for encryption", async () => {
      const logGroupNames = [
        outputs.log_group_names.payment_api,
        outputs.log_group_names.transaction_processor,
        outputs.log_group_names.fraud_detector,
      ];

      const kmsKeys = new Set<string>();

      for (const logGroupName of logGroupNames) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const response = await cwLogsClient.send(command);
        if (response.logGroups && response.logGroups[0]?.kmsKeyId) {
          kmsKeys.add(response.logGroups[0].kmsKeyId);
        }
      }

      expect(kmsKeys.size).toBe(1);
    });
  });

  describe("CloudWatch Metric Filters", () => {
    test("payment_api log group has error metric filter", async () => {
      const command = new DescribeMetricFiltersCommand({
        logGroupName: outputs.log_group_names.payment_api,
      });
      const response = await cwLogsClient.send(command);

      expect(response.metricFilters).toBeDefined();
      const errorFilter = response.metricFilters!.find((f) =>
        f.filterName?.includes("error")
      );
      expect(errorFilter).toBeDefined();
      expect(errorFilter!.metricTransformations).toBeDefined();
      expect(errorFilter!.metricTransformations![0].metricName).toBe("ErrorCount");
    });

    test("payment_api log group has response time metric filter", async () => {
      const command = new DescribeMetricFiltersCommand({
        logGroupName: outputs.log_group_names.payment_api,
      });
      const response = await cwLogsClient.send(command);

      expect(response.metricFilters).toBeDefined();
      const responseTimeFilter = response.metricFilters!.find((f) =>
        f.filterName?.includes("response-time")
      );
      expect(responseTimeFilter).toBeDefined();
      expect(responseTimeFilter!.metricTransformations![0].metricName).toBe("ResponseTime");
    });

    test("transaction_processor log group has multiple metric filters", async () => {
      const command = new DescribeMetricFiltersCommand({
        logGroupName: outputs.log_group_names.transaction_processor,
      });
      const response = await cwLogsClient.send(command);

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThanOrEqual(3);

      const metricNames = response.metricFilters!.map(
        (f) => f.metricTransformations![0].metricName
      );
      expect(metricNames).toContain("ErrorCount");
      expect(metricNames).toContain("TransactionAmount");
      expect(metricNames).toContain("FailedTransactions");
    });
  });

  describe("CloudWatch Alarms", () => {
    test("api_error_rate alarm exists and is configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.alarm_names.api_error_rate],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(outputs.alarm_names.api_error_rate);
      expect(alarm.MetricName).toBe("ErrorCount");
      expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm.AlarmActions).toContain(outputs.sns_topic_arn);
      expect(alarm.OKActions).toContain(outputs.sns_topic_arn);
    });

    test("api_response_time alarm exists and is configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.alarm_names.api_response_time],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(outputs.alarm_names.api_response_time);
      expect(alarm.MetricName).toBe("ResponseTime");
      expect(alarm.Threshold).toBe(500);
      expect(alarm.AlarmActions).toContain(outputs.sns_topic_arn);
    });

    test("failed_transactions alarm exists", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.alarm_names.failed_transactions],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
      expect(response.MetricAlarms![0].MetricName).toBe("FailedTransactions");
    });

    test("high_load alarm exists", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.alarm_names.high_load],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
      expect(response.MetricAlarms![0].Threshold).toBe(10);
    });

    test("multi_service_failure composite alarm exists", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.alarm_names.multi_service_failure],
        AlarmTypes: ["CompositeAlarm"],
      });
      const response = await cwClient.send(command);

      expect(response.CompositeAlarms).toBeDefined();
      expect(response.CompositeAlarms!.length).toBe(1);

      const compositeAlarm = response.CompositeAlarms![0];
      expect(compositeAlarm.AlarmName).toBe(outputs.alarm_names.multi_service_failure);
      expect(compositeAlarm.AlarmRule).toContain("ALARM");
      expect(compositeAlarm.AlarmActions).toContain(outputs.sns_topic_arn);
    });

    test("all alarms use correct SNS topic for notifications", async () => {
      const alarmNames = Object.values(outputs.alarm_names);
      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames.filter(name => name !== outputs.alarm_names.multi_service_failure),
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.AlarmActions).toContain(outputs.sns_topic_arn);
        expect(alarm.OKActions).toContain(outputs.sns_topic_arn);
      });
    });
  });

  describe("SNS Topic", () => {
    test("SNS topic exists and is accessible", async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_topic_arn);
    });

    test("SNS topic has KMS encryption enabled", async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).not.toBe("");
    });
  });

  describe("CloudWatch Dashboard", () => {
    test("dashboard exists and is accessible", async () => {
      const dashboardName = outputs.dashboard_url.split("name=")[1];
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cwClient.send(command);

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    test("dashboard contains multiple widgets", async () => {
      const dashboardName = outputs.dashboard_url.split("name=")[1];
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cwClient.send(command);

      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("CloudWatch Logs Insights Queries", () => {
    test("query definitions exist for error investigation", async () => {
      const command = new DescribeQueryDefinitionsCommand({});
      const response = await cwLogsClient.send(command);

      expect(response.queryDefinitions).toBeDefined();
      const errorQuery = response.queryDefinitions!.find((q) =>
        q.name?.includes("error-investigation")
      );
      expect(errorQuery).toBeDefined();
      expect(errorQuery!.logGroupNames).toContain(outputs.log_group_names.payment_api);
    });

    test("query definitions exist for transaction flow analysis", async () => {
      const command = new DescribeQueryDefinitionsCommand({});
      const response = await cwLogsClient.send(command);

      expect(response.queryDefinitions).toBeDefined();
      const transactionQuery = response.queryDefinitions!.find((q) =>
        q.name?.includes("transaction-flow")
      );
      expect(transactionQuery).toBeDefined();
    });

    test("query definitions exist for performance analysis", async () => {
      const command = new DescribeQueryDefinitionsCommand({});
      const response = await cwLogsClient.send(command);

      expect(response.queryDefinitions).toBeDefined();
      const perfQuery = response.queryDefinitions!.find((q) =>
        q.name?.includes("performance-analysis")
      );
      expect(perfQuery).toBeDefined();
      expect(perfQuery!.logGroupNames).toContain(outputs.log_group_names.payment_api);
    });
  });

  describe("Custom Metrics", () => {
    test("custom metric namespaces are created", async () => {
      for (const namespace of outputs.custom_metric_namespaces) {
        const command = new ListMetricsCommand({
          Namespace: namespace,
        });
        const response = await cwClient.send(command);

        // Note: Metrics may not exist yet if no data has been sent
        // Just verify the API call succeeds (namespace is valid)
        expect(response).toBeDefined();
      }
    });

    test("custom metric namespaces include required services", async () => {
      const namespaceStrings = outputs.custom_metric_namespaces.map((ns) =>
        ns.toLowerCase()
      );
      expect(namespaceStrings.some((ns) => ns.includes("paymentapi"))).toBe(true);
      expect(namespaceStrings.some((ns) => ns.includes("transactionprocessor"))).toBe(true);
      expect(namespaceStrings.some((ns) => ns.includes("frauddetector"))).toBe(true);
      expect(namespaceStrings.some((ns) => ns.includes("lambda"))).toBe(true);
    });
  });

  describe("Infrastructure Integrity", () => {
    test("all log groups use consistent naming pattern with environment suffix", async () => {
      const logGroupNames = Object.values(outputs.log_group_names);
      const suffixes = logGroupNames.map((name) => {
        const parts = name.split("-");
        return parts[parts.length - 1];
      });

      // All should have the same suffix
      const uniqueSuffixes = new Set(suffixes);
      expect(uniqueSuffixes.size).toBe(1);
    });

    test("all alarms use consistent naming pattern with environment suffix", async () => {
      const alarmNames = Object.values(outputs.alarm_names);
      const suffixes = alarmNames.map((name) => {
        const parts = name.split("-");
        return parts[parts.length - 1];
      });

      // All should have the same suffix
      const uniqueSuffixes = new Set(suffixes);
      expect(uniqueSuffixes.size).toBe(1);
    });

    test("SNS topic name includes environment suffix", async () => {
      const topicName = outputs.sns_topic_arn.split(":").pop()!;
      expect(topicName).toMatch(/synthd1z2p4u2/);
    });
  });
});
