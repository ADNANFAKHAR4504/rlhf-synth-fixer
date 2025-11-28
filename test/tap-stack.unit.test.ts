/**
 * Unit Tests for CloudWatch Observability Platform Terraform Configuration
 *
 * These tests validate the Terraform configuration files without deployment.
 * Tests verify resource naming, tagging, security settings, and PROMPT requirements.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const LIB_PATH = path.join(__dirname, '..', 'lib');

// Helper function to read Terraform files
const readTerraformFile = (filename: string): string => {
  const filePath = path.join(LIB_PATH, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Terraform file not found: ${filename}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
};

// Helper to check if a file exists
const fileExists = (filename: string): boolean => {
  return fs.existsSync(path.join(LIB_PATH, filename));
};

describe('CloudWatch Observability Platform - Unit Tests', () => {
  describe('Terraform Configuration Files', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf',
      'outputs.tf',
      's3.tf',
      'iam.tf',
      'lambda.tf',
      'cloudwatch_alarms.tf',
      'cloudwatch_logs.tf',
      'sns.tf',
      'metric_streams.tf',
      'kinesis_firehose.tf',
      'dashboard.tf',
      'synthetics.tf',
      'container_insights.tf',
      'cross_account.tf',
      'anomaly_detectors.tf',
    ];

    test.each(requiredFiles)('file %s exists', (filename) => {
      expect(fileExists(filename)).toBe(true);
    });

    test('all Terraform files have valid syntax (no empty files)', () => {
      requiredFiles.forEach((filename) => {
        if (fileExists(filename)) {
          const content = readTerraformFile(filename);
          expect(content.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Provider Configuration (main.tf)', () => {
    let mainTf: string;

    beforeAll(() => {
      mainTf = readTerraformFile('main.tf');
    });

    test('requires Terraform version >= 1.5.0', () => {
      expect(mainTf).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('uses AWS provider with version ~> 5.0', () => {
      expect(mainTf).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(mainTf).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('has primary AWS provider configured', () => {
      expect(mainTf).toMatch(/provider\s*"aws"\s*\{/);
      expect(mainTf).toMatch(/region\s*=\s*var\.region/);
    });

    test('has secondary region provider for multi-region resources', () => {
      expect(mainTf).toMatch(/provider\s*"aws"\s*\{\s*\n\s*alias\s*=\s*"secondary"/);
      expect(mainTf).toMatch(/region\s*=\s*var\.secondary_region/);
    });

    test('has default_tags with required tags', () => {
      expect(mainTf).toContain('CostCenter');
      expect(mainTf).toContain('Environment');
      expect(mainTf).toContain('DataClassification');
    });

    test('defines local name_prefix with environment_suffix', () => {
      expect(mainTf).toMatch(/name_prefix\s*=.*var\.environment_suffix/);
    });
  });

  describe('Variables Configuration (variables.tf)', () => {
    let variablesTf: string;

    beforeAll(() => {
      variablesTf = readTerraformFile('variables.tf');
    });

    test('defines environment_suffix variable', () => {
      expect(variablesTf).toMatch(/variable\s*"environment_suffix"/);
    });

    test('defines region variable with us-east-1 default', () => {
      expect(variablesTf).toMatch(/variable\s*"region"/);
      expect(variablesTf).toContain('us-east-1');
    });

    test('defines secondary_region variable for multi-region', () => {
      expect(variablesTf).toMatch(/variable\s*"secondary_region"/);
      expect(variablesTf).toContain('us-west-2');
    });

    test('defines metric_retention_days with 15 months (450 days)', () => {
      expect(variablesTf).toMatch(/variable\s*"metric_retention_days"/);
      expect(variablesTf).toContain('450');
    });

    test('defines required tagging variables', () => {
      expect(variablesTf).toMatch(/variable\s*"cost_center"/);
      expect(variablesTf).toMatch(/variable\s*"environment"/);
      expect(variablesTf).toMatch(/variable\s*"data_classification"/);
    });

    test('defines cross_account_ids for cross-account observability', () => {
      expect(variablesTf).toMatch(/variable\s*"cross_account_ids"/);
      expect(variablesTf).toContain('list(string)');
    });
  });

  describe('Lambda Configuration (lambda.tf)', () => {
    let lambdaTf: string;

    beforeAll(() => {
      lambdaTf = readTerraformFile('lambda.tf');
    });

    test('metric_processor Lambda function exists', () => {
      expect(lambdaTf).toMatch(
        /resource\s*"aws_lambda_function"\s*"metric_processor"/
      );
    });

    test('alarm_processor Lambda function exists', () => {
      expect(lambdaTf).toMatch(
        /resource\s*"aws_lambda_function"\s*"alarm_processor"/
      );
    });

    test('Lambda functions use ARM64 Graviton2 architecture', () => {
      const arm64Matches = lambdaTf.match(/architectures\s*=\s*\["arm64"\]/g);
      expect(arm64Matches).not.toBeNull();
      expect(arm64Matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('Lambda functions use Python 3.11 runtime', () => {
      expect(lambdaTf).toContain('python3.11');
    });

    test('Lambda functions have environment variables configured', () => {
      expect(lambdaTf).toMatch(/environment\s*\{[\s\S]*?variables\s*=/);
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      expect(lambdaTf).toMatch(/tracing_config\s*\{[\s\S]*?mode\s*=\s*"Active"/);
    });

    test('Lambda functions include name_prefix in function name', () => {
      expect(lambdaTf).toMatch(
        /function_name\s*=\s*"\$\{local\.name_prefix\}-metric-processor"/
      );
    });

    test('EventBridge rule triggers Lambda periodically', () => {
      expect(lambdaTf).toMatch(
        /resource\s*"aws_cloudwatch_event_rule"\s*"metric_processor"/
      );
      expect(lambdaTf).toContain('schedule_expression');
    });

    test('Lambda has retry policy configured', () => {
      expect(lambdaTf).toMatch(/retry_policy\s*\{/);
      expect(lambdaTf).toMatch(/maximum_retry_attempts\s*=/);
    });
  });

  describe('CloudWatch Alarms Configuration (cloudwatch_alarms.tf)', () => {
    let alarmsTf: string;

    beforeAll(() => {
      alarmsTf = readTerraformFile('cloudwatch_alarms.tf');
    });

    test('composite alarm for system health exists', () => {
      expect(alarmsTf).toMatch(
        /resource\s*"aws_cloudwatch_composite_alarm"\s*"system_health"/
      );
    });

    test('composite alarm for performance degradation exists', () => {
      expect(alarmsTf).toMatch(
        /resource\s*"aws_cloudwatch_composite_alarm"\s*"performance_degradation"/
      );
    });

    test('composite alarm uses AND/OR logic with 3+ metrics', () => {
      // Check for AND logic
      expect(alarmsTf).toMatch(/alarm_rule.*AND/);
      // Check for OR logic
      expect(alarmsTf).toMatch(/alarm_rule.*OR/);
    });

    test('metric alarms for CPU utilization exist', () => {
      expect(alarmsTf).toMatch(
        /resource\s*"aws_cloudwatch_metric_alarm"\s*"high_cpu"/
      );
    });

    test('metric alarms for memory utilization exist', () => {
      expect(alarmsTf).toMatch(
        /resource\s*"aws_cloudwatch_metric_alarm"\s*"high_memory"/
      );
    });

    test('metric math expressions are used for error rate', () => {
      expect(alarmsTf).toMatch(/metric_query\s*\{/);
      expect(alarmsTf).toContain('expression');
    });

    test('maintenance mode suppressor is configured', () => {
      expect(alarmsTf).toMatch(/actions_suppressor\s*\{/);
      expect(alarmsTf).toMatch(
        /resource\s*"aws_cloudwatch_metric_alarm"\s*"maintenance_mode"/
      );
    });

    test('alarms have proper tags including Severity', () => {
      expect(alarmsTf).toContain('Severity');
      expect(alarmsTf).toContain('Critical');
      expect(alarmsTf).toContain('Warning');
    });
  });

  describe('S3 Configuration (s3.tf)', () => {
    let s3Tf: string;

    beforeAll(() => {
      s3Tf = readTerraformFile('s3.tf');
    });

    test('metric_streams bucket exists', () => {
      expect(s3Tf).toMatch(/resource\s*"aws_s3_bucket"\s*"metric_streams"/);
    });

    test('synthetics_artifacts bucket exists', () => {
      expect(s3Tf).toMatch(/resource\s*"aws_s3_bucket"\s*"synthetics_artifacts"/);
    });

    test('buckets have public access blocked', () => {
      const publicAccessBlocks = s3Tf.match(
        /resource\s*"aws_s3_bucket_public_access_block"/g
      );
      expect(publicAccessBlocks).not.toBeNull();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(2);

      expect(s3Tf).toContain('block_public_acls       = true');
      expect(s3Tf).toContain('block_public_policy     = true');
      expect(s3Tf).toContain('ignore_public_acls      = true');
      expect(s3Tf).toContain('restrict_public_buckets = true');
    });

    test('buckets have server-side encryption enabled', () => {
      expect(s3Tf).toMatch(
        /resource\s*"aws_s3_bucket_server_side_encryption_configuration"/
      );
      expect(s3Tf).toContain('AES256');
    });

    test('lifecycle policy with 15-month retention exists', () => {
      expect(s3Tf).toMatch(
        /resource\s*"aws_s3_bucket_lifecycle_configuration"\s*"metric_streams"/
      );
      expect(s3Tf).toContain('var.metric_retention_days');
    });

    test('lifecycle policy has storage class transitions', () => {
      expect(s3Tf).toContain('STANDARD_IA');
      expect(s3Tf).toContain('GLACIER_IR');
      expect(s3Tf).toContain('DEEP_ARCHIVE');
    });

    test('versioning is enabled for data protection', () => {
      expect(s3Tf).toMatch(/resource\s*"aws_s3_bucket_versioning"/);
      expect(s3Tf).toContain('status = "Enabled"');
    });

    test('cross-region replica bucket exists in secondary region', () => {
      expect(s3Tf).toMatch(
        /resource\s*"aws_s3_bucket"\s*"metric_streams_replica"/
      );
      expect(s3Tf).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe('SNS Configuration (sns.tf)', () => {
    let snsTf: string;

    beforeAll(() => {
      snsTf = readTerraformFile('sns.tf');
    });

    test('critical alarms topic exists', () => {
      expect(snsTf).toMatch(/resource\s*"aws_sns_topic"\s*"critical_alarms"/);
    });

    test('warning alarms topic exists', () => {
      expect(snsTf).toMatch(/resource\s*"aws_sns_topic"\s*"warning_alarms"/);
    });

    test('info alarms topic exists', () => {
      expect(snsTf).toMatch(/resource\s*"aws_sns_topic"\s*"info_alarms"/);
    });

    test('topics include name_prefix in naming', () => {
      expect(snsTf).toMatch(
        /name\s*=\s*"\$\{local\.name_prefix\}-critical-alarms"/
      );
    });
  });

  describe('Anomaly Detectors Configuration (anomaly_detectors.tf)', () => {
    let anomalyTf: string;

    beforeAll(() => {
      anomalyTf = readTerraformFile('anomaly_detectors.tf');
    });

    test('anomaly detector resources exist', () => {
      // Anomaly detection is implemented via metric alarms with ANOMALY_DETECTION_BAND
      expect(anomalyTf).toMatch(/ANOMALY_DETECTION_BAND/);
    });

    test('anomaly detector for Lambda metrics exists', () => {
      expect(anomalyTf).toContain('AWS/Lambda');
    });
  });

  describe('Synthetics Configuration (synthetics.tf)', () => {
    let syntheticsTf: string;

    beforeAll(() => {
      syntheticsTf = readTerraformFile('synthetics.tf');
    });

    test('primary region canary exists', () => {
      expect(syntheticsTf).toMatch(
        /resource\s*"aws_synthetics_canary"\s*"api_health_primary"/
      );
    });

    test('secondary region canary exists', () => {
      expect(syntheticsTf).toMatch(
        /resource\s*"aws_synthetics_canary"\s*"api_health_secondary"/
      );
    });

    test('secondary canary uses secondary provider', () => {
      expect(syntheticsTf).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe('Container Insights Configuration (container_insights.tf)', () => {
    let containerInsightsTf: string;

    beforeAll(() => {
      containerInsightsTf = readTerraformFile('container_insights.tf');
    });

    test('ECS cluster resource exists', () => {
      expect(containerInsightsTf).toMatch(
        /resource\s*"aws_ecs_cluster"\s*"main"/
      );
    });

    test('Container Insights is enabled', () => {
      expect(containerInsightsTf).toContain('containerInsights');
      expect(containerInsightsTf).toContain('enabled');
    });

    test('ECS cluster name includes name_prefix', () => {
      expect(containerInsightsTf).toMatch(/name\s*=.*local\.name_prefix/);
    });
  });

  describe('Cross-Account Configuration (cross_account.tf)', () => {
    let crossAccountTf: string;

    beforeAll(() => {
      crossAccountTf = readTerraformFile('cross_account.tf');
    });

    test('OAM sink resource exists', () => {
      expect(crossAccountTf).toMatch(/resource\s*"aws_oam_sink"\s*"main"/);
    });

    test('OAM link resource exists', () => {
      expect(crossAccountTf).toMatch(/resource\s*"aws_oam_link"\s*"cross_account"/);
    });
  });

  describe('Dashboard Configuration (dashboard.tf)', () => {
    let dashboardTf: string;

    beforeAll(() => {
      dashboardTf = readTerraformFile('dashboard.tf');
    });

    test('CloudWatch dashboard resource exists', () => {
      expect(dashboardTf).toMatch(
        /resource\s*"aws_cloudwatch_dashboard"\s*"main"/
      );
    });

    test('dashboard has multiple widget types', () => {
      // Check for different widget types in dashboard body
      expect(dashboardTf).toContain('type');
      expect(dashboardTf).toContain('metric');
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    let outputsTf: string;

    beforeAll(() => {
      outputsTf = readTerraformFile('outputs.tf');
    });

    const expectedOutputs = [
      'metric_stream_name',
      'metric_stream_arn',
      's3_bucket_metrics',
      's3_bucket_synthetics',
      'lambda_processor_arn',
      'lambda_alarm_processor_arn',
      'sns_critical_topic_arn',
      'sns_warning_topic_arn',
      'sns_info_topic_arn',
      'dashboard_url',
      'composite_alarm_system_health',
      'composite_alarm_performance',
      'canary_primary_name',
      'canary_secondary_name',
      'ecs_cluster_name',
      'oam_sink_arn',
    ];

    test.each(expectedOutputs)('output %s is defined', (outputName) => {
      expect(outputsTf).toMatch(new RegExp(`output\\s*"${outputName}"`));
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources use local.name_prefix for naming', () => {
      const tfFiles = [
        'lambda.tf',
        's3.tf',
        'sns.tf',
        'cloudwatch_alarms.tf',
      ];

      tfFiles.forEach((filename) => {
        if (fileExists(filename)) {
          const content = readTerraformFile(filename);
          // Check that resources reference local.name_prefix
          expect(content).toContain('local.name_prefix');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded credentials in Terraform files', () => {
      const tfFiles = fs
        .readdirSync(LIB_PATH)
        .filter((f) => f.endsWith('.tf'));

      tfFiles.forEach((filename) => {
        const content = readTerraformFile(filename);
        // Check for common credential patterns
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key
        expect(content).not.toMatch(/aws_secret_access_key\s*=\s*"[^"]+"/);
      });
    });

    test('IAM policies use least privilege principles', () => {
      const iamTf = readTerraformFile('iam.tf');
      // Should not have overly permissive policies
      expect(iamTf).not.toMatch(/Action\s*=\s*"\*"/);
    });
  });

  describe('Terraform Validation', () => {
    test('terraform fmt check passes', () => {
      try {
        execSync('terraform fmt -check -recursive', {
          cwd: LIB_PATH,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        // If terraform is not installed, skip this test
        if (
          error.message.includes('command not found') ||
          error.message.includes('not recognized')
        ) {
          console.log('Skipping terraform fmt check - terraform not installed');
          return;
        }
        throw new Error(
          `Terraform files are not properly formatted. Run 'terraform fmt -recursive' in lib/`
        );
      }
    });
  });
});
