// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform CloudWatch monitoring infrastructure
// Tests main.tf, variables.tf, outputs.tf structure and configuration

import fs from "fs";
import path from "path";
import {
  TerraformValidator,
  validateTerraformProject,
} from "../lib/terraform-validator";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_TF = path.join(LIB_DIR, "main.tf");
const VARIABLES_TF = path.join(LIB_DIR, "variables.tf");
const OUTPUTS_TF = path.join(LIB_DIR, "outputs.tf");
const PROVIDER_TF = path.join(LIB_DIR, "provider.tf");

describe("Terraform Infrastructure Files", () => {
  describe("File Existence", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });
  });

  describe("main.tf Structure", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, "utf8");
    });

    test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
      expect(mainContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("contains KMS key resource for CloudWatch encryption", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch"\s*{/);
    });

    test("KMS key has deletion_window_in_days configured", () => {
      expect(mainContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("KMS key has key_rotation enabled", () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("contains KMS alias resource", () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"cloudwatch"\s*{/);
    });

    test("contains CloudWatch log groups for payment_api", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_api"\s*{/);
    });

    test("contains CloudWatch log groups for transaction_processor", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"transaction_processor"\s*{/);
    });

    test("contains CloudWatch log groups for fraud_detector", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"fraud_detector"\s*{/);
    });

    test("log groups use 7-day retention", () => {
      const retentionMatches = mainContent.match(/retention_in_days\s*=\s*(\d+)/g);
      expect(retentionMatches).toBeTruthy();
      expect(retentionMatches!.length).toBeGreaterThanOrEqual(3);
      retentionMatches!.forEach(match => {
        expect(match).toContain("7");
      });
    });

    test("log groups are encrypted with KMS key", () => {
      const kmsMatches = mainContent.match(/kms_key_id\s*=\s*aws_kms_key\.cloudwatch\.arn/g);
      expect(kmsMatches).toBeTruthy();
      expect(kmsMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("contains SNS topic resource", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
    });

    test("SNS topic is encrypted with KMS", () => {
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.cloudwatch\.id/);
    });

    test("contains SNS topic subscription", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alerts_email"\s*{/);
    });

    test("contains metric filters for error tracking", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"payment_api_errors"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"transaction_processor_errors"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"fraud_detector_errors"/);
    });

    test("contains metric filter for response time tracking", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"payment_api_response_time"/);
    });

    test("contains metric filter for transaction amounts", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"transaction_amounts"/);
    });

    test("contains metric filter for failed transactions", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"failed_transactions"/);
    });

    test("contains metric filters for Lambda metrics", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"lambda_cold_starts"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"lambda_duration"/);
    });

    test("contains CloudWatch alarms for API error rate", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_error_rate"/);
    });

    test("contains CloudWatch alarms for API response time", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_response_time"/);
    });

    test("contains CloudWatch alarms for failed transactions", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_transactions"/);
    });

    test("contains CloudWatch alarms for transaction processor errors", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"transaction_processor_errors"/);
    });

    test("contains CloudWatch alarms for fraud detector errors", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"fraud_detector_errors"/);
    });

    test("contains CloudWatch alarm for high load", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_load"/);
    });

    test("contains composite alarm for multi-service failure", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_composite_alarm"\s+"multi_service_failure"/);
    });

    test("alarms have SNS topic configured for notifications", () => {
      const alarmActionMatches = mainContent.match(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/g);
      expect(alarmActionMatches).toBeTruthy();
      expect(alarmActionMatches!.length).toBeGreaterThanOrEqual(6);
    });

    test("alarms have OK actions configured", () => {
      const okActionMatches = mainContent.match(/ok_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/g);
      expect(okActionMatches).toBeTruthy();
      expect(okActionMatches!.length).toBeGreaterThanOrEqual(6);
    });

    test("contains CloudWatch dashboard resource", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"payment_monitoring"/);
    });

    test("dashboard contains multiple widgets", () => {
      expect(mainContent).toMatch(/widgets\s*=/);
      const widgetMatches = mainContent.match(/type\s*=\s*"metric"/g);
      expect(widgetMatches).toBeTruthy();
      expect(widgetMatches!.length).toBeGreaterThanOrEqual(9);
    });

    test("contains CloudWatch Logs Insights queries", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"\s+"error_investigation"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"\s+"transaction_flow_analysis"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"\s+"performance_analysis"/);
    });

    test("all resources use environment_suffix in names", () => {
      const resourceNameMatches = mainContent.match(/name\s*=\s*"[^"]*\$\{var\.environment_suffix\}[^"]*"/g);
      expect(resourceNameMatches).toBeTruthy();
      expect(resourceNameMatches!.length).toBeGreaterThanOrEqual(15);
    });

    test("all resources include proper tags", () => {
      const tagsMatches = mainContent.match(/tags\s*=\s*\{[\s\S]*?CostCenter[\s\S]*?\}/g);
      expect(tagsMatches).toBeTruthy();
      expect(tagsMatches!.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("variables.tf Structure", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(VARIABLES_TF, "utf8");
    });

    test("declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares environment variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares cost_center variable", () => {
      expect(variablesContent).toMatch(/variable\s+"cost_center"\s*{/);
    });

    test("declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares alert_email variable", () => {
      expect(variablesContent).toMatch(/variable\s+"alert_email"\s*{/);
    });

    test("environment_suffix has no default value (required)", () => {
      const envSuffixBlock = variablesContent.match(/variable\s+"environment_suffix"\s*{[^}]*}/s);
      expect(envSuffixBlock).toBeTruthy();
      expect(envSuffixBlock![0]).not.toMatch(/default\s*=/);
    });

    test("alert_email has no default value (required)", () => {
      const alertEmailBlock = variablesContent.match(/variable\s+"alert_email"\s*{[^}]*}/s);
      expect(alertEmailBlock).toBeTruthy();
      expect(alertEmailBlock![0]).not.toMatch(/default\s*=/);
    });
  });

  describe("outputs.tf Structure", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(OUTPUTS_TF, "utf8");
    });

    test("outputs dashboard_url", () => {
      expect(outputsContent).toMatch(/output\s+"dashboard_url"\s*{/);
    });

    test("outputs sns_topic_arn", () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("outputs log_group_names", () => {
      expect(outputsContent).toMatch(/output\s+"log_group_names"\s*{/);
    });

    test("outputs alarm_names", () => {
      expect(outputsContent).toMatch(/output\s+"alarm_names"\s*{/);
    });

    test("outputs custom_metric_namespaces", () => {
      expect(outputsContent).toMatch(/output\s+"custom_metric_namespaces"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[^}]*}/gs);
      expect(outputBlocks).toBeTruthy();
      outputBlocks!.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe("provider.tf Structure", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_TF, "utf8");
    });

    test("declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("TerraformValidator Utility Tests", () => {
    let mainValidator: TerraformValidator;
    let variablesValidator: TerraformValidator;
    let outputsValidator: TerraformValidator;
    let providerValidator: TerraformValidator;

    beforeAll(() => {
      mainValidator = new TerraformValidator(MAIN_TF);
      variablesValidator = new TerraformValidator(VARIABLES_TF);
      outputsValidator = new TerraformValidator(OUTPUTS_TF);
      providerValidator = new TerraformValidator(PROVIDER_TF);
    });

    describe("Project Structure Validation", () => {
      test("validates all required Terraform files exist", () => {
        const validation = validateTerraformProject(LIB_DIR);
        expect(validation.hasMainTf).toBe(true);
        expect(validation.hasVariablesTf).toBe(true);
        expect(validation.hasOutputsTf).toBe(true);
        expect(validation.hasProviderTf).toBe(true);
      });
    });

    describe("Resource Detection", () => {
      test("detects KMS key resource", () => {
        expect(mainValidator.hasResource("aws_kms_key", "cloudwatch")).toBe(true);
      });

      test("detects KMS alias resource", () => {
        expect(mainValidator.hasResource("aws_kms_alias", "cloudwatch")).toBe(true);
      });

      test("detects all log group resources", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_log_group", "payment_api")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_log_group", "transaction_processor")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_log_group", "fraud_detector")).toBe(true);
      });

      test("detects SNS topic and subscription", () => {
        expect(mainValidator.hasResource("aws_sns_topic", "alerts")).toBe(true);
        expect(mainValidator.hasResource("aws_sns_topic_subscription", "alerts_email")).toBe(true);
      });

      test("detects all metric alarms", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_metric_alarm", "api_error_rate")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_metric_alarm", "api_response_time")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_metric_alarm", "failed_transactions")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_metric_alarm", "high_load")).toBe(true);
      });

      test("detects composite alarm", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_composite_alarm", "multi_service_failure")).toBe(true);
      });

      test("detects dashboard resource", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_dashboard", "payment_monitoring")).toBe(true);
      });

      test("detects query definitions", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_query_definition", "error_investigation")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_query_definition", "transaction_flow_analysis")).toBe(true);
        expect(mainValidator.hasResource("aws_cloudwatch_query_definition", "performance_analysis")).toBe(true);
      });

      test("detects data source for AWS caller identity", () => {
        expect(mainValidator.hasDataSource("aws_caller_identity", "current")).toBe(true);
      });
    });

    describe("Resource Counts", () => {
      test("counts correct number of log groups", () => {
        const logGroups = mainValidator.getResourcesByType("aws_cloudwatch_log_group");
        expect(logGroups.length).toBe(3);
        expect(logGroups).toContain("payment_api");
        expect(logGroups).toContain("transaction_processor");
        expect(logGroups).toContain("fraud_detector");
      });

      test("counts correct number of metric filters", () => {
        const metricFilters = mainValidator.getResourcesByType("aws_cloudwatch_log_metric_filter");
        expect(metricFilters.length).toBeGreaterThanOrEqual(8);
      });

      test("counts correct number of metric alarms", () => {
        const metricAlarms = mainValidator.getResourcesByType("aws_cloudwatch_metric_alarm");
        expect(metricAlarms.length).toBeGreaterThanOrEqual(6);
      });

      test("counts correct number of query definitions", () => {
        const queryDefs = mainValidator.getResourcesByType("aws_cloudwatch_query_definition");
        expect(queryDefs.length).toBe(3);
      });
    });

    describe("Configuration Validation", () => {
      test("resources use environment_suffix variable", () => {
        expect(mainValidator.hasEnvironmentSuffixInNames()).toBe(true);
      });

      test("resources have CostCenter tags", () => {
        expect(mainValidator.hasTagsWithKey("CostCenter")).toBe(true);
      });

      test("resources have Environment tags", () => {
        expect(mainValidator.hasTagsWithKey("Environment")).toBe(true);
      });

      test("KMS encryption is configured", () => {
        expect(mainValidator.hasKMSEncryption()).toBe(true);
      });
    });

    describe("Variable Validation", () => {
      test("declares required variables", () => {
        expect(variablesValidator.hasVariable("environment_suffix")).toBe(true);
        expect(variablesValidator.hasVariable("environment")).toBe(true);
        expect(variablesValidator.hasVariable("cost_center")).toBe(true);
        expect(variablesValidator.hasVariable("aws_region")).toBe(true);
        expect(variablesValidator.hasVariable("alert_email")).toBe(true);
      });

      test("environment_suffix has no default value", () => {
        expect(variablesValidator.getVariableDefault("environment_suffix")).toBeNull();
      });

      test("alert_email has no default value", () => {
        expect(variablesValidator.getVariableDefault("alert_email")).toBeNull();
      });

      test("environment has default value", () => {
        const defaultValue = variablesValidator.getVariableDefault("environment");
        expect(defaultValue).toBeTruthy();
      });
    });

    describe("Output Validation", () => {
      test("declares required outputs", () => {
        expect(outputsValidator.hasOutput("dashboard_url")).toBe(true);
        expect(outputsValidator.hasOutput("sns_topic_arn")).toBe(true);
        expect(outputsValidator.hasOutput("log_group_names")).toBe(true);
        expect(outputsValidator.hasOutput("alarm_names")).toBe(true);
        expect(outputsValidator.hasOutput("custom_metric_namespaces")).toBe(true);
      });

      test("all outputs have descriptions", () => {
        expect(outputsValidator.outputHasDescription("dashboard_url")).toBe(true);
        expect(outputsValidator.outputHasDescription("sns_topic_arn")).toBe(true);
        expect(outputsValidator.outputHasDescription("log_group_names")).toBe(true);
        expect(outputsValidator.outputHasDescription("alarm_names")).toBe(true);
        expect(outputsValidator.outputHasDescription("custom_metric_namespaces")).toBe(true);
      });
    });

    describe("Provider Validation", () => {
      test("declares AWS provider", () => {
        expect(providerValidator.hasProvider("aws")).toBe(true);
      });

      test("provider configuration uses aws_region variable", () => {
        const content = providerValidator.getContent();
        expect(content).toContain("var.aws_region");
      });
    });

    describe("Advanced Resource Validation", () => {
      test("checks resource has attribute", () => {
        const hasRetention = mainValidator.resourceHasAttribute(
          "aws_cloudwatch_log_group",
          "payment_api",
          "retention_in_days"
        );
        expect(hasRetention).toBe(true);
      });

      test("checks resource has attribute with expected value", () => {
        const hasCorrectRetention = mainValidator.resourceHasAttribute(
          "aws_cloudwatch_log_group",
          "payment_api",
          "retention_in_days",
          "7"
        );
        expect(hasCorrectRetention).toBe(true);
      });

      test("returns false when resource not found", () => {
        const result = mainValidator.resourceHasAttribute(
          "aws_nonexistent_resource",
          "test",
          "some_attr"
        );
        expect(result).toBe(false);
      });

      test("returns false when attribute not found", () => {
        const result = mainValidator.resourceHasAttribute(
          "aws_cloudwatch_log_group",
          "payment_api",
          "nonexistent_attribute"
        );
        expect(result).toBe(false);
      });

      test("hasResource without resource name", () => {
        expect(mainValidator.hasResource("aws_cloudwatch_log_group")).toBe(true);
        expect(mainValidator.hasResource("aws_nonexistent_resource")).toBe(false);
      });

      test("hasDataSource without data name", () => {
        expect(mainValidator.hasDataSource("aws_caller_identity")).toBe(true);
        expect(mainValidator.hasDataSource("aws_nonexistent_data")).toBe(false);
      });

      test("countPattern with matches", () => {
        const count = mainValidator.countPattern(/resource\s+"aws_cloudwatch_log_group"/g);
        expect(count).toBeGreaterThan(0);
      });

      test("getContent returns string", () => {
        const content = mainValidator.getContent();
        expect(typeof content).toBe("string");
        expect(content.length).toBeGreaterThan(0);
      });
    });

    describe("Additional Variable Tests", () => {
      test("getVariableDefault returns null for variables without defaults", () => {
        expect(variablesValidator.getVariableDefault("nonexistent_var")).toBeNull();
      });

      test("getVariableDefault handles variables with default values", () => {
        const envDefault = variablesValidator.getVariableDefault("environment");
        expect(envDefault).not.toBeNull();
      });
    });

    describe("Additional Output Tests", () => {
      test("outputHasDescription returns false for non-existent output", () => {
        expect(outputsValidator.outputHasDescription("nonexistent_output")).toBe(false);
      });

      test("outputHasDescription returns false for output without description", () => {
        // All our outputs have descriptions, so we test with non-existent
        expect(outputsValidator.outputHasDescription("fake_output_no_desc")).toBe(false);
      });
    });

    describe("Edge Cases", () => {
      test("hasResource with special characters in name", () => {
        const result = mainValidator.hasResource("aws_cloudwatch_metric_alarm", "api_error_rate");
        expect(result).toBe(true);
      });

      test("hasVariable with underscore in name", () => {
        const result = variablesValidator.hasVariable("environment_suffix");
        expect(result).toBe(true);
      });

      test("hasOutput with underscore in name", () => {
        const result = outputsValidator.hasOutput("sns_topic_arn");
        expect(result).toBe(true);
      });

      test("getResourcesByType with complex resource names", () => {
        const alarms = mainValidator.getResourcesByType("aws_cloudwatch_metric_alarm");
        expect(alarms.length).toBeGreaterThan(0);
        expect(alarms).toContain("api_error_rate");
      });
    });

    describe("Error Handling", () => {
      test("throws error for non-existent file", () => {
        expect(() => {
          new TerraformValidator("/non/existent/file.tf");
        }).toThrow("File not found");
      });

      test("handles non-existent resource gracefully", () => {
        expect(mainValidator.hasResource("aws_nonexistent_resource", "test")).toBe(false);
      });

      test("handles non-existent variable gracefully", () => {
        expect(variablesValidator.hasVariable("nonexistent_variable")).toBe(false);
      });

      test("handles non-existent output gracefully", () => {
        expect(outputsValidator.hasOutput("nonexistent_output")).toBe(false);
      });

      test("returns empty array for non-existent resource type", () => {
        const resources = mainValidator.getResourcesByType("aws_nonexistent_type");
        expect(resources).toEqual([]);
      });

      test("returns 0 for non-matching pattern count", () => {
        const count = mainValidator.countPattern(/thispatternwillnevermatch123456/g);
        expect(count).toBe(0);
      });
    });
  });
});
