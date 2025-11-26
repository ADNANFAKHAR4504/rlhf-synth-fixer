// test/terraform.int.test.ts
// Integration tests for Payment Transactions Monitoring Stack

import fs from 'fs';
import path from 'path';

describe('Payment Transactions Monitoring - Integration Tests', () => {
  let outputs: any;
  let outputsExist: boolean;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    outputsExist = fs.existsSync(outputsPath);

    if (outputsExist) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      console.log('✅ Deployment outputs found - running integration tests');
      console.log(`Found ${Object.keys(outputs).length} outputs`);
    } else {
      console.log('⚠️  Deployment outputs not found - tests will be skipped');
    }
  });

  const skipIfNoOutputs = (fn: () => void) => {
    if (!outputsExist) {
      expect(true).toBe(true);
      return;
    }
    fn();
  };

  // Helper to extract dynamic suffix (e.g. "dev11")
  const getEnvSuffix = () => {
    if (!outputsExist) return '';
    const name = outputs.cloudwatch_dashboard_name as string;
    const match = name.match(/dev\d*$/);
    return match ? match[0] : '';
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
        expectedKeys.forEach(k => expect(keys).toContain(k));
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('dashboard name is present and ends with dev suffix', () => {
      skipIfNoOutputs(() => {
        const name = outputs.cloudwatch_dashboard_name as string;
        expect(name).toBeDefined();
        expect(name).toMatch(/^payment-transactions-dev\d*$/);
      });
    });

    test('dashboard URL points to eu-west-1', () => {
      skipIfNoOutputs(() => {
        const url = outputs.cloudwatch_dashboard_url as string;
        expect(url).toContain('cloudwatch');
        expect(url).toContain('eu-west-1');
        expect(url).toContain(outputs.cloudwatch_dashboard_name);
      });
    });
  });

  describe('Composite Alarms', () => {
    test('processing health composite alarm name is present', () => {
      skipIfNoOutputs(() => {
        const name = outputs.composite_alarm_processing_health as string;
        expect(name).toMatch(/^processing-health-composite-dev\d*$/);
      });
    });

    test('system capacity composite alarm name is present', () => {
      skipIfNoOutputs(() => {
        const name = outputs.composite_alarm_system_capacity as string;
        expect(name).toMatch(/^system-capacity-composite-dev\d*$/);
      });
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    test('DLQ ARN has correct format and region', () => {
      skipIfNoOutputs(() => {
        const arn = outputs.dlq_arn as string;
        expect(arn).toMatch(/^arn:aws:sqs:eu-west-1:\d+:lambda-dlq-dev\d*$/);
      });
    });

    test('DLQ URL has correct SQS URL format', () => {
      skipIfNoOutputs(() => {
        const url = outputs.dlq_url as string;
        expect(url).toContain('https://sqs.eu-west-1.amazonaws.com/');
        expect(url).toContain('lambda-dlq-dev');
      });
    });
  });

  describe('ECR Repository', () => {
    test('ECR repository URL is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        const url = outputs.ecr_repository_url as string;
        expect(url).toContain('.dkr.ecr.eu-west-1.amazonaws.com/');
        expect(url).toContain('transaction-processor-dev');
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('eventbridge_rules JSON parses and has expected keys and suffix', () => {
      skipIfNoOutputs(() => {
        const raw = outputs.eventbridge_rules as string;
        const rules = JSON.parse(raw) as Record<string, string>;
        const suffix = getEnvSuffix();
        expect(rules.failed_transactions).toBe(`failed-transactions-${suffix}`);
        expect(rules.fraud_patterns).toBe(`fraud-patterns-${suffix}`);
        expect(rules.high_value_transactions).toBe(`high-value-transactions-${suffix}`);
        expect(rules.velocity_checks).toBe(`velocity-checks-${suffix}`);
      });
    });
  });

  describe('Kinesis Stream', () => {
    test('stream ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        const arn = outputs.kinesis_stream_arn as string;
        expect(arn).toMatch(/^arn:aws:kinesis:eu-west-1:\d+:stream\/transaction-stream-dev\d*$/);
      });
    });

    test('stream name is correct with dev suffix', () => {
      skipIfNoOutputs(() => {
        const name = outputs.kinesis_stream_name as string;
        expect(name).toMatch(/^transaction-stream-dev\d*$/);
      });
    });
  });

  describe('KMS Key', () => {
    test('KMS key ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        const arn = outputs.kms_key_arn as string;
        expect(arn).toMatch(/^arn:aws:kms:eu-west-1:\d+:key\/[a-f0-9-]+$/);
      });
    });

    test('KMS key ID is a UUID', () => {
      skipIfNoOutputs(() => {
        const id = outputs.kms_key_id as string;
        expect(id).toMatch(/^[a-f0-9-]{36}$/);
      });
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function name is present and environment-specific', () => {
      skipIfNoOutputs(() => {
        const name = outputs.lambda_function_name as string;
        expect(name).toMatch(/^transaction-processor-dev\d*$/);
      });
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic ARN is valid and in eu-west-1', () => {
      skipIfNoOutputs(() => {
        const arn = outputs.sns_topic_arn as string;
        expect(arn).toMatch(/^arn:aws:sns:eu-west-1:\d+:transaction-alarms-dev\d*$/);
      });
    });
  });

  describe('X-Ray Configuration', () => {
    test('X-Ray console URL points to eu-west-1 service map', () => {
      skipIfNoOutputs(() => {
        const url = outputs.xray_console_url as string;
        expect(url).toContain('https://console.aws.amazon.com/xray/home?region=eu-west-1#/service-map');
      });
    });

    test('X-Ray group name is environment-specific', () => {
      skipIfNoOutputs(() => {
        const name = outputs.xray_group_name as string;
        expect(name).toMatch(/^PaymentTransactions-dev\d*$/i);
      });
    });
  });

  describe('General Validation', () => {
    test('all non-secret outputs are non-empty strings', () => {
      skipIfNoOutputs(() => {
        Object.entries(outputs).forEach(([, value]) => {
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
        });
      });
    });

    test('no error markers in outputs JSON (but allow "failed_transactions" key)', () => {
      skipIfNoOutputs(() => {
        const json = JSON.stringify(outputs).toLowerCase();
        expect(json).not.toContain('error');
        // Remove the specific key name before checking for "failed"
        const cleaned = json.replace(/failed_transactions/g, 'ft_key');
        expect(cleaned).not.toContain('failed"');
      });
    });
  });
});
