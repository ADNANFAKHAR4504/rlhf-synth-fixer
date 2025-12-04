import { describe, it, expect, beforeAll } from '@jest/globals';
import { Testing } from 'cdktf';
import * as path from 'path';
import * as child_process from 'child_process';

describe('Multi-Region Payment Processing Stack', () => {
  let synthedStack: string;

  beforeAll(() => {
    const appPath = path.join(__dirname, '..', '..', 'tap.py');
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';

    try {
      synthedStack = child_process.execSync(`python ${appPath}`, {
        encoding: 'utf-8',
        env: {
          ...process.env,
          ENVIRONMENT_SUFFIX: 'test',
          AWS_REGION: 'us-east-1',
        },
      });
    } catch (error: any) {
      console.error('Error synthesizing stack:', error.message);
      throw error;
    }
  });

  it('should create a valid CDKTF stack', () => {
    expect(synthedStack).toBeDefined();
  });

  describe('DynamoDB Global Table', () => {
    it('should create DynamoDB table with correct configuration', () => {
      expect(synthedStack).toContain('aws_dynamodb_table');
      expect(synthedStack).toContain('payment-transactions');
      expect(synthedStack).toContain('PAY_PER_REQUEST');
    });

    it('should enable point-in-time recovery', () => {
      expect(synthedStack).toContain('point_in_time_recovery');
      expect(synthedStack).toContain('"enabled": true');
    });

    it('should configure replica in us-east-2', () => {
      expect(synthedStack).toContain('replica');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should enable DynamoDB streams', () => {
      expect(synthedStack).toContain('stream_enabled');
      expect(synthedStack).toContain('stream_view_type');
      expect(synthedStack).toContain('NEW_AND_OLD_IMAGES');
    });

    it('should have transaction_id as hash key', () => {
      expect(synthedStack).toContain('hash_key');
      expect(synthedStack).toContain('transaction_id');
    });
  });

  describe('VPC and Networking', () => {
    it('should create VPC in primary region', () => {
      expect(synthedStack).toContain('aws_vpc');
      expect(synthedStack).toContain('payment-vpc');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create VPC in secondary region', () => {
      expect(synthedStack).toContain('payment-vpc');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should create private subnets', () => {
      expect(synthedStack).toContain('aws_subnet');
      expect(synthedStack).toContain('payment-private-subnet');
    });

    it('should create Lambda security groups', () => {
      expect(synthedStack).toContain('aws_security_group');
      expect(synthedStack).toContain('payment-lambda-sg');
    });

    it('should enable DNS support in VPC', () => {
      expect(synthedStack).toContain('enable_dns_support');
      expect(synthedStack).toContain('enable_dns_hostnames');
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create Lambda execution role', () => {
      expect(synthedStack).toContain('aws_iam_role');
      expect(synthedStack).toContain('payment-lambda-role');
    });

    it('should attach basic Lambda execution policy', () => {
      expect(synthedStack).toContain('aws_iam_role_policy_attachment');
      expect(synthedStack).toContain('AWSLambdaBasicExecutionRole');
    });

    it('should attach VPC access execution policy', () => {
      expect(synthedStack).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    it('should have DynamoDB permissions', () => {
      expect(synthedStack).toContain('dynamodb:PutItem');
      expect(synthedStack).toContain('dynamodb:GetItem');
      expect(synthedStack).toContain('dynamodb:UpdateItem');
    });

    it('should have SQS permissions', () => {
      expect(synthedStack).toContain('sqs:SendMessage');
      expect(synthedStack).toContain('sqs:ReceiveMessage');
      expect(synthedStack).toContain('sqs:DeleteMessage');
    });

    it('should have SNS publish permissions', () => {
      expect(synthedStack).toContain('sns:Publish');
    });

    it('should have Route53 permissions', () => {
      expect(synthedStack).toContain('route53:GetHealthCheck');
      expect(synthedStack).toContain('route53:ChangeResourceRecordSets');
    });
  });

  describe('SQS Queues', () => {
    it('should create processing queue in primary region', () => {
      expect(synthedStack).toContain('aws_sqs_queue');
      expect(synthedStack).toContain('payment-processing-queue');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create processing queue in secondary region', () => {
      expect(synthedStack).toContain('payment-processing-queue');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should create dead letter queues', () => {
      expect(synthedStack).toContain('payment-dlq');
    });

    it('should configure dead letter queue redrive policy', () => {
      expect(synthedStack).toContain('redrive_policy');
      expect(synthedStack).toContain('deadLetterTargetArn');
      expect(synthedStack).toContain('maxReceiveCount');
    });

    it('should set appropriate visibility timeout', () => {
      expect(synthedStack).toContain('visibility_timeout_seconds');
    });

    it('should set message retention period', () => {
      expect(synthedStack).toContain('message_retention_seconds');
    });
  });

  describe('SNS Topics', () => {
    it('should create SNS topic in primary region', () => {
      expect(synthedStack).toContain('aws_sns_topic');
      expect(synthedStack).toContain('payment-alerts');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create SNS topic in secondary region', () => {
      expect(synthedStack).toContain('payment-alerts');
      expect(synthedStack).toContain('us-east-2');
    });
  });

  describe('Lambda Functions', () => {
    it('should create payment validation Lambda in primary region', () => {
      expect(synthedStack).toContain('aws_lambda_function');
      expect(synthedStack).toContain('payment-validation');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create payment validation Lambda in secondary region', () => {
      expect(synthedStack).toContain('payment-validation');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should create payment processing Lambda in both regions', () => {
      expect(synthedStack).toContain('payment-processing');
    });

    it('should create failover orchestration Lambda', () => {
      expect(synthedStack).toContain('payment-failover-orchestration');
    });

    it('should set reserved concurrent executions', () => {
      expect(synthedStack).toContain('reserved_concurrent_executions');
    });

    it('should configure Lambda environment variables', () => {
      expect(synthedStack).toContain('TRANSACTIONS_TABLE_NAME');
      expect(synthedStack).toContain('PROCESSING_QUEUE_URL');
      expect(synthedStack).toContain('ALERTS_TOPIC_ARN');
    });

    it('should deploy Lambda in VPC', () => {
      expect(synthedStack).toContain('vpc_config');
      expect(synthedStack).toContain('subnet_ids');
      expect(synthedStack).toContain('security_group_ids');
    });

    it('should use Python 3.11 runtime', () => {
      expect(synthedStack).toContain('python3.11');
    });

    it('should set appropriate timeout values', () => {
      expect(synthedStack).toContain('timeout');
    });

    it('should configure memory size', () => {
      expect(synthedStack).toContain('memory_size');
    });
  });

  describe('Lambda Event Source Mappings', () => {
    it('should create SQS trigger for processing Lambda', () => {
      expect(synthedStack).toContain('aws_lambda_event_source_mapping');
    });

    it('should configure batch size', () => {
      expect(synthedStack).toContain('batch_size');
    });

    it('should configure batching window', () => {
      expect(synthedStack).toContain('maximum_batching_window_in_seconds');
    });
  });

  describe('API Gateway', () => {
    it('should create REST API in primary region', () => {
      expect(synthedStack).toContain('aws_api_gateway_rest_api');
      expect(synthedStack).toContain('payment-api');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create REST API in secondary region', () => {
      expect(synthedStack).toContain('payment-api');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should create /validate resource', () => {
      expect(synthedStack).toContain('aws_api_gateway_resource');
      expect(synthedStack).toContain('validate');
    });

    it('should create POST method', () => {
      expect(synthedStack).toContain('aws_api_gateway_method');
      expect(synthedStack).toContain('POST');
    });

    it('should configure Lambda integration', () => {
      expect(synthedStack).toContain('aws_api_gateway_integration');
      expect(synthedStack).toContain('AWS_PROXY');
    });

    it('should create API deployment', () => {
      expect(synthedStack).toContain('aws_api_gateway_deployment');
    });

    it('should create prod stage', () => {
      expect(synthedStack).toContain('aws_api_gateway_stage');
      expect(synthedStack).toContain('prod');
    });

    it('should grant API Gateway Lambda invocation permissions', () => {
      expect(synthedStack).toContain('aws_lambda_permission');
      expect(synthedStack).toContain('apigateway.amazonaws.com');
    });
  });

  describe('Route 53 Configuration', () => {
    it('should create hosted zone', () => {
      expect(synthedStack).toContain('aws_route53_zone');
      expect(synthedStack).toContain('payment-api');
      expect(synthedStack).toContain('example.com');
    });

    it('should create health check for primary API', () => {
      expect(synthedStack).toContain('aws_route53_health_check');
      expect(synthedStack).toContain('execute-api.us-east-1.amazonaws.com');
    });

    it('should create health check for secondary API', () => {
      expect(synthedStack).toContain('aws_route53_health_check');
      expect(synthedStack).toContain('execute-api.us-east-2.amazonaws.com');
    });

    it('should configure HTTPS health checks', () => {
      expect(synthedStack).toContain('HTTPS');
      expect(synthedStack).toContain('443');
    });

    it('should set health check path to /prod/validate', () => {
      expect(synthedStack).toContain('/prod/validate');
    });

    it('should create primary failover record', () => {
      expect(synthedStack).toContain('aws_route53_record');
      expect(synthedStack).toContain('PRIMARY');
    });

    it('should create secondary failover record', () => {
      expect(synthedStack).toContain('SECONDARY');
    });

    it('should configure CNAME records', () => {
      expect(synthedStack).toContain('CNAME');
    });

    it('should set appropriate TTL', () => {
      expect(synthedStack).toContain('ttl');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create API latency alarm', () => {
      expect(synthedStack).toContain('aws_cloudwatch_metric_alarm');
      expect(synthedStack).toContain('payment-api-latency');
    });

    it('should create Lambda errors alarm', () => {
      expect(synthedStack).toContain('payment-validation-errors');
      expect(synthedStack).toContain('payment-processing-errors');
    });

    it('should create DynamoDB throttle alarm', () => {
      expect(synthedStack).toContain('payment-dynamodb-throttle');
    });

    it('should configure alarm actions with SNS', () => {
      expect(synthedStack).toContain('alarm_actions');
    });

    it('should set comparison operators', () => {
      expect(synthedStack).toContain('comparison_operator');
      expect(synthedStack).toContain('GreaterThanThreshold');
    });

    it('should configure evaluation periods', () => {
      expect(synthedStack).toContain('evaluation_periods');
    });

    it('should set alarm thresholds', () => {
      expect(synthedStack).toContain('threshold');
    });

    it('should monitor appropriate metrics', () => {
      expect(synthedStack).toContain('Latency');
      expect(synthedStack).toContain('Errors');
      expect(synthedStack).toContain('UserErrors');
    });
  });

  describe('CloudWatch Dashboards', () => {
    it('should create dashboard in primary region', () => {
      expect(synthedStack).toContain('aws_cloudwatch_dashboard');
      expect(synthedStack).toContain('payment-dashboard');
      expect(synthedStack).toContain('us-east-1');
    });

    it('should create dashboard in secondary region', () => {
      expect(synthedStack).toContain('payment-dashboard');
      expect(synthedStack).toContain('us-east-2');
    });

    it('should include API Gateway metrics', () => {
      expect(synthedStack).toContain('AWS/ApiGateway');
    });

    it('should include Lambda metrics', () => {
      expect(synthedStack).toContain('AWS/Lambda');
      expect(synthedStack).toContain('Invocations');
      expect(synthedStack).toContain('Duration');
    });

    it('should include DynamoDB metrics', () => {
      expect(synthedStack).toContain('AWS/DynamoDB');
      expect(synthedStack).toContain('ConsumedReadCapacityUnits');
      expect(synthedStack).toContain('ConsumedWriteCapacityUnits');
    });
  });

  describe('SNS Subscriptions', () => {
    it('should subscribe failover Lambda to SNS topic', () => {
      expect(synthedStack).toContain('aws_sns_topic_subscription');
      expect(synthedStack).toContain('lambda');
    });

    it('should grant SNS permission to invoke Lambda', () => {
      expect(synthedStack).toContain('sns.amazonaws.com');
    });
  });

  describe('Resource Tags', () => {
    it('should tag resources with environment', () => {
      expect(synthedStack).toContain('Environment');
      expect(synthedStack).toContain('test');
    });

    it('should tag resources with region', () => {
      expect(synthedStack).toContain('Region');
    });

    it('should tag resources with name', () => {
      expect(synthedStack).toContain('Name');
    });
  });

  describe('Stack Outputs', () => {
    it('should output primary API endpoint', () => {
      expect(synthedStack).toContain('primary_api_endpoint');
    });

    it('should output secondary API endpoint', () => {
      expect(synthedStack).toContain('secondary_api_endpoint');
    });

    it('should output transactions table name', () => {
      expect(synthedStack).toContain('transactions_table_name');
    });

    it('should output hosted zone ID', () => {
      expect(synthedStack).toContain('hosted_zone_id');
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should configure primary provider for us-east-1', () => {
      expect(synthedStack).toContain('us-east-1');
      expect(synthedStack).toContain('primary');
    });

    it('should configure secondary provider for us-east-2', () => {
      expect(synthedStack).toContain('us-east-2');
      expect(synthedStack).toContain('secondary');
    });

    it('should create resources in both regions', () => {
      const usEast1Count = (synthedStack.match(/us-east-1/g) || []).length;
      const usEast2Count = (synthedStack.match(/us-east-2/g) || []).length;
      expect(usEast1Count).toBeGreaterThan(0);
      expect(usEast2Count).toBeGreaterThan(0);
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environment suffix in resource names', () => {
      expect(synthedStack).toContain('-test');
    });

    it('should use environment suffix consistently', () => {
      const suffixMatches = synthedStack.match(/-test/g) || [];
      expect(suffixMatches.length).toBeGreaterThan(10);
    });
  });

  describe('Terraform Backend', () => {
    it('should configure S3 backend', () => {
      expect(synthedStack).toContain('terraform');
      expect(synthedStack).toContain('backend');
      expect(synthedStack).toContain('s3');
    });

    it('should enable encryption', () => {
      expect(synthedStack).toContain('encrypt');
    });

    it('should use environment suffix in state key', () => {
      expect(synthedStack).toContain('test/');
    });
  });

  describe('Disaster Recovery Features', () => {
    it('should implement failover routing', () => {
      expect(synthedStack).toContain('failover_routing_policy');
    });

    it('should configure health checks', () => {
      const healthCheckCount = (synthedStack.match(/aws_route53_health_check/g) || []).length;
      expect(healthCheckCount).toBeGreaterThanOrEqual(2);
    });

    it('should enable global table replication', () => {
      expect(synthedStack).toContain('replica');
    });

    it('should configure automated failover', () => {
      expect(synthedStack).toContain('failover-orchestration');
    });
  });
});
