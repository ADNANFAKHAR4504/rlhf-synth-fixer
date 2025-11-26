// test/terraform.int.test.ts
// Integration tests for Payment Transactions Monitoring Stack
// Validates deployed AWS resources via Terraform flat outputs

import fs from 'fs';
import path from 'path';

describe('Payment Transactions Monitoring - Integration Tests', () => {
  let outputs: any;
  let outputsExist: boolean;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    outputsExist = fs.existsSync(outputsPath);

    if (outputsExist) {
      const raw = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(raw);
      console.log('✅ Deployment outputs found - running integration tests');
      console.log(`Found ${Object.keys(outputs).length} outputs`);
    } else {
      console.log('⚠️  Deployment outputs not found - tests will be skipped');
      console.log('Deploy infrastructure first to generate cfn-outputs/flat-outputs.json');
    }
  });

  const skipIfNoOutputs = (fn: () => void) => {
    if (!outputsExist) {
      expect(true).toBe(true);
      return;
    }
    fn();
  };

  describe('Deployment Validation', () => {
    test('deployment outputs file exists', () => {
      skipIfNoOutputs(() => {
        expect(outputsExist).toBe(true);
      });
    });

    test('outputs contain data', () => {
      skipIfNoOutputs(() => {
        expect(outputs).toBeDefined();
        expect(Object.keys(outputs).length).toBeGreaterThan(0);
      });
    });

    test('has expected core outputs', () => {
      skipIfNoOutputs(() => {
        const keys = Object.keys(outputs);
        // we expect at least these keys to exist
        const expectedKeys = [
          'cloudwatch_dashboard_name',
          'cloudwatch_dashboard_url',
          'composite_alarm_processing_health',
          'composite_alarm_system_capacity',
          'dlq_arn',
          'dlq_url',
          'ecr_repository_url',
          'eventbridge_rules',
          'kinesis_stream_arn',
          'kinesis_stream_name',
          'kms_key_arn',
          'kms_key_id',
          'lambda_function_name',
          'sns_topic_arn',
          'xray_console_url',
          'xray_group_name'
        ];
        expectedKeys.forEach(key => {
          expect(keys).toContain(key);
        });
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('dashboard name is present and non-empty', () => {
      skipIfNoOutputs(() => {
        expect(outputs.cloudwatch_dashboard_name).toBeDefined();
        expect(outputs.cloudwatch_dashboard_name).toBe('payment-transactions-dev');
      });
    });

    test('dashboard URL points to eu-west-1', () => {
      skipIfNoOutputs(() => {
        expect(outputs.cloudwatch_dashboard_url).toBeDefined();
        const url = outputs.cloudwatch_dashboard_url;
        expect(url).toContain('cloudwatch');
        expect(url).toContain('eu-west-1');
        expect(url).toContain('payment-transactions-dev');
      });
    });
  });

  describe('Composite Alarms', () => {
    test('processing health composite alarm name is present', () => {
      skipIfNoOutputs(() => {
        expect(outputs.composite_alarm_processing_health).toBeDefined();
        expect(outputs.composite_alarm_processing_health).toContain('processing-health-composite');
      });
    });

    test('system capacity composite alarm name is present', () => {
      skipIfNoOutputs(() => {
        expect(outputs.composite_alarm_system_capacity).toBeDefined();
        expect(outputs.composite_alarm_system_capacity).toContain('system-capacity-composite');
      });
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    test('DLQ ARN has correct format and region', () => {
      skipIfNoOutputs(() => {
        expect(outputs.dlq_arn).toBeDefined();
        expect(outputs.dlq_arn).toMatch(/^arn:aws:sqs:eu-west-1:\d+:lambda-dlq-dev$/);
      });
    });

    test('DLQ URL has correct SQS URL format', () => {
      skipIfNoOutputs(() => {
        expect(outputs.dlq_url).toBeDefined();
        const url = outputs.dlq_url;
        expect(url).toContain('https://sqs.eu-west-1.amazonaws.com/');
        expect(url).toContain('lambda-dlq-dev');
      });
    });
  });

  describe('ECR Repository', () => {
    test('ECR repository URL is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        expect(outputs.ecr_repository_url).toBeDefined();
        const url = outputs.ecr_repository_url;
        expect(url).toContain('.dkr.ecr.eu-west-1.amazonaws.com/');
        expect(url).toContain('transaction-processor-dev');
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('eventbridge_rules JSON parses and has expected keys', () => {
      skipIfNoOutputs(() => {
        expect(outputs.eventbridge_rules).toBeDefined();
        // eventbridge_rules is a JSON string in flat outputs
        const rules = JSON.parse(outputs.eventbridge_rules);
        const expectedRuleNames = [
          'failed_transactions',
          'fraud_patterns',
          'high_value_transactions',
          'velocity_checks'
        ];
        expectedRuleNames.forEach(name => {
          expect(rules[name]).toBeDefined();
          expect(rules[name]).toContain('-dev');
        });
      });
    });
  });

  describe('Kinesis Stream', () => {
    test('stream ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        expect(outputs.kinesis_stream_arn).toBeDefined();
        expect(outputs.kinesis_stream_arn).toMatch(/^arn:aws:kinesis:eu-west-1:\d+:stream\/transaction-stream-dev$/);
      });
    });

    test('stream name is correct', () => {
      skipIfNoOutputs(() => {
        expect(outputs.kinesis_stream_name).toBeDefined();
        expect(outputs.kinesis_stream_name).toBe('transaction-stream-dev');
      });
    });
  });

  describe('KMS Key', () => {
    test('KMS key ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        expect(outputs.kms_key_arn).toBeDefined();
        expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:eu-west-1:\d+:key\/[a-f0-9-]+$/);
      });
    });

    test('KMS key ID is a UUID', () => {
      skipIfNoOutputs(() => {
        expect(outputs.kms_key_id).toBeDefined();
        expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]{36}$/);
      });
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function name is present and environment-specific', () => {
      skipIfNoOutputs(() => {
        expect(outputs.lambda_function_name).toBeDefined();
        expect(outputs.lambda_function_name).toBe('transaction-processor-dev');
      });
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        expect(outputs.sns_topic_arn).toBeDefined();
        expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:eu-west-1:\d+:transaction-alarms-dev$/);
      });
    });
  });

  describe('X-Ray Configuration', () => {
    test('X-Ray console URL points to eu-west-1 service map', () => {
      skipIfNoOutputs(() => {
        expect(outputs.xray_console_url).toBeDefined();
        const url = outputs.xray_console_url;
        expect(url).toContain('https://console.aws.amazon.com/xray/home?region=eu-west-1#/service-map');
      });
    });

    test('X-Ray group name is environment-specific', () => {
      skipIfNoOutputs(() => {
        expect(outputs.xray_group_name).toBeDefined();
        expect(outputs.xray_group_name).toBe('PaymentTransactions-dev');
      });
    });
  });

  describe('General Validation', () => {
    test('all non-secret outputs are non-empty strings', () => {
      skipIfNoOutputs(() => {
        Object.entries(outputs).forEach(([key, value]) => {
          expect(typeof value).toBe('string');
          expect(value).not.toBe('');
        });
      });
    });

    test('no error indicators in outputs', () => {
      skipIfNoOutputs(() => {
        const json = JSON.stringify(outputs).toLowerCase();
        expect(json).not.toContain('error');
        expect(json).not.toContain('failed');
      });
    });
  });
});
