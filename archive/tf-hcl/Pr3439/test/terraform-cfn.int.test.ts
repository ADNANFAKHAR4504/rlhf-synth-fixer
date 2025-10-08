import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('Travel Platform API - CloudFormation Integration Tests', () => {
  const OUTPUT_FILE_PATH = resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  const FLAT_OUTPUT_FILE_PATH = resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');

  interface StackOutput {
    sensitive: boolean;
    type: string;
    value: string;
  }

  interface StackOutputs {
    api_gateway_url: StackOutput;
    cloudtrail_name: StackOutput;
    cloudtrail_s3_bucket: StackOutput;
    cloudwatch_dashboard_name: StackOutput;
    cloudwatch_log_group_api: StackOutput;
    cloudwatch_log_group_lambda: StackOutput;
    dynamodb_table_name: StackOutput;
    gdpr_lambda_function_name?: StackOutput;
    lambda_function_name: StackOutput;
    redis_endpoint: StackOutput;
    sns_topic_arn: StackOutput;
    vpc_id: StackOutput;
    waf_web_acl_arn: StackOutput;
  }

  interface FlatOutputs {
    api_gateway_url: string;
    cloudtrail_name: string;
    cloudtrail_s3_bucket: string;
    cloudwatch_dashboard_name: string;
    cloudwatch_log_group_api: string;
    cloudwatch_log_group_lambda: string;
    dynamodb_table_name: string;
    gdpr_lambda_function_name?: string;
    lambda_function_name: string;
    redis_endpoint: string;
    sns_topic_arn: string;
    vpc_id: string;
    waf_web_acl_arn: string;
  }

  let outputs: StackOutputs;
  let flatOutputs: FlatOutputs;

  beforeAll(() => {
    if (!existsSync(OUTPUT_FILE_PATH)) {
      throw new Error(`Output file not found at ${OUTPUT_FILE_PATH}. Please run Terraform apply first.`);
    }

    const outputContent = readFileSync(OUTPUT_FILE_PATH, 'utf-8');
    outputs = JSON.parse(outputContent);

    if (existsSync(FLAT_OUTPUT_FILE_PATH)) {
      const flatContent = readFileSync(FLAT_OUTPUT_FILE_PATH, 'utf-8');
      flatOutputs = JSON.parse(flatContent);
    }
  });

  describe('API Gateway Integration', () => {
    test('API Gateway URL should be valid', () => {
      const apiUrl = outputs.api_gateway_url.value;
      expect(apiUrl).toMatch(/^https:\/\/[\w-]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod\/search$/);
    });

    test('API Gateway should use HTTPS', () => {
      const apiUrl = outputs.api_gateway_url.value;
      expect(apiUrl).toMatch(/^https:\/\//);
    });

    test('API Gateway should be in correct region', () => {
      const apiUrl = outputs.api_gateway_url.value;
      const regionMatch = apiUrl.match(/execute-api\.([a-z0-9-]+)\.amazonaws/);
      expect(regionMatch).toBeTruthy();
      expect(regionMatch![1]).toBe('us-east-1');
    });

    test('API Gateway stage should be prod', () => {
      const apiUrl = outputs.api_gateway_url.value;
      expect(apiUrl).toContain('/prod/');
    });

    test('API Gateway endpoint should be /search', () => {
      const apiUrl = outputs.api_gateway_url.value;
      expect(apiUrl).toMatch(/\/search$/);
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table name should follow naming convention', () => {
      const tableName = outputs.dynamodb_table_name.value;
      expect(tableName).toBe('travel-platform-api-search-data');
    });

    test('DynamoDB table name should not exceed AWS limits', () => {
      const tableName = outputs.dynamodb_table_name.value;
      expect(tableName.length).toBeLessThanOrEqual(255);
      expect(tableName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });
  });

  describe('Lambda Integration', () => {
    test('Lambda function name should follow naming convention', () => {
      const functionName = outputs.lambda_function_name.value;
      expect(functionName).toBe('travel-platform-api-search-handler');
    });

    test('Lambda function name should be valid', () => {
      const functionName = outputs.lambda_function_name.value;
      expect(functionName).toMatch(/^[a-zA-Z0-9-_]+$/);
      expect(functionName.length).toBeLessThanOrEqual(64);
    });

    test('Lambda CloudWatch log group should match function name', () => {
      const functionName = outputs.lambda_function_name.value;
      const logGroup = outputs.cloudwatch_log_group_lambda.value;
      expect(logGroup).toBe(`/aws/lambda/${functionName}`);
    });
  });

  describe('ElastiCache Redis Integration', () => {
    test('Redis endpoint should be valid', () => {
      const redisEndpoint = outputs.redis_endpoint.value;
      // Redis endpoint format can be: master.{cluster}.{id}.{region}.cache.amazonaws.com or {cluster}.{id}.cache.amazonaws.com
      expect(redisEndpoint).toMatch(/^(master\.|replica\.)?[a-zA-Z0-9-]+\.[a-z0-9]+(\.[a-z0-9]+)?\.cache\.amazonaws\.com$/);
    });

    test('Redis endpoint should follow naming convention', () => {
      const redisEndpoint = outputs.redis_endpoint.value;
      expect(redisEndpoint).toContain('travel-platform-api-redis');
    });
  });

  describe('CloudWatch Integration', () => {
    test('API Gateway log group should be correctly formatted', () => {
      const logGroup = outputs.cloudwatch_log_group_api.value;
      expect(logGroup).toBe('/aws/apigateway/travel-platform-api-prod');
    });

    test('CloudWatch log groups should exist', () => {
      // Verify API Gateway and Lambda log groups are configured
      expect(outputs.cloudwatch_log_group_api.value).toBeTruthy();
      expect(outputs.cloudwatch_log_group_lambda.value).toBeTruthy();
    });

    test('All log groups should follow AWS naming conventions', () => {
      const apiLogGroup = outputs.cloudwatch_log_group_api.value;
      const lambdaLogGroup = outputs.cloudwatch_log_group_lambda.value;

      [apiLogGroup, lambdaLogGroup].forEach(logGroup => {
        expect(logGroup).toMatch(/^[/\w-]+$/);
        expect(logGroup.length).toBeLessThanOrEqual(512);
      });
    });
  });

  describe('SNS Integration', () => {
    test('SNS topic ARN should be valid', () => {
      const topicArn = outputs.sns_topic_arn.value;
      expect(topicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9_-]+$/);
    });

    test('SNS topic should be in correct region', () => {
      const topicArn = outputs.sns_topic_arn.value;
      const arnParts = topicArn.split(':');
      expect(arnParts[3]).toBe('us-east-1');
    });

    test('SNS topic name should follow convention', () => {
      const topicArn = outputs.sns_topic_arn.value;
      const topicName = topicArn.split(':').pop();
      expect(topicName).toBe('travel-platform-api-alerts');
    });
  });

  describe('VPC Integration', () => {
    test('VPC ID should be valid', () => {
      const vpcId = outputs.vpc_id.value;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });
  });

  describe('WAF Integration', () => {
    test('WAF Web ACL ARN should be valid', () => {
      const wafArn = outputs.waf_web_acl_arn.value;
      expect(wafArn).toMatch(/^arn:aws:wafv2:[a-z0-9-]+:\d{12}:regional\/webacl\/[a-zA-Z0-9_-]+\/[a-f0-9-]+$/);
    });

    test('WAF should be regional (not global)', () => {
      const wafArn = outputs.waf_web_acl_arn.value;
      expect(wafArn).toContain(':regional/webacl/');
    });

    test('WAF Web ACL name should follow convention', () => {
      const wafArn = outputs.waf_web_acl_arn.value;
      expect(wafArn).toContain('/travel-platform-api-waf');
    });
  });

  describe('CloudTrail Integration', () => {
    test('CloudTrail name should follow convention', () => {
      const trailName = outputs.cloudtrail_name.value;
      // Accept either naming convention
      expect(trailName).toMatch(/^travel-platform-api-(audit-)?trail$/);
    });

    test('CloudTrail S3 bucket should be unique', () => {
      const bucketName = outputs.cloudtrail_s3_bucket.value;
      expect(bucketName).toMatch(/^travel-platform-api-cloudtrail-logs-\d{12}$/);
    });

    test('CloudTrail S3 bucket should include account ID', () => {
      const bucketName = outputs.cloudtrail_s3_bucket.value;
      const accountId = outputs.sns_topic_arn.value.split(':')[4];
      expect(bucketName).toContain(accountId);
    });
  });

  describe('Security & Compliance Validation', () => {
    test('All ARNs should be from the same AWS account', () => {
      const snsArn = outputs.sns_topic_arn.value;
      const wafArn = outputs.waf_web_acl_arn.value;

      const snsAccount = snsArn.split(':')[4];
      const wafAccount = wafArn.split(':')[4];

      expect(snsAccount).toBe(wafAccount);
    });

    test('All regional resources should be in the same region', () => {
      const apiUrl = outputs.api_gateway_url.value;
      const snsArn = outputs.sns_topic_arn.value;
      const wafArn = outputs.waf_web_acl_arn.value;

      const apiRegion = apiUrl.match(/execute-api\.([a-z0-9-]+)\.amazonaws/)?.[1];
      const snsRegion = snsArn.split(':')[3];
      const wafRegion = wafArn.split(':')[3];

      expect(apiRegion).toBe('us-east-1');
      expect(snsRegion).toBe('us-east-1');
      expect(wafRegion).toBe('us-east-1');
    });

    test('Sensitive data should not be exposed', () => {
      Object.entries(outputs).forEach(([key, output]) => {
        // Redis endpoint might contain connection info
        if (key === 'redis_endpoint') {
          expect(output.value).not.toContain('password');
          expect(output.value).not.toContain('auth');
        }
      });
    });
  });

  describe('Naming Conventions', () => {
    test('All resources should follow project naming convention', () => {
      const projectName = 'travel-platform-api';
      const resources = [
        outputs.cloudtrail_name.value,
        outputs.dynamodb_table_name.value,
        outputs.lambda_function_name.value,
      ];

      // Add GDPR outputs if they exist
      if (outputs.gdpr_lambda_function_name) {
        resources.push(outputs.gdpr_lambda_function_name.value);
      }

      resources.forEach(resource => {
        expect(resource).toContain(projectName);
      });
    });

    test('S3 bucket should have globally unique name', () => {
      const bucketName = outputs.cloudtrail_s3_bucket.value;
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Output Consistency', () => {
    test('Flat outputs should match structured outputs', () => {
      if (flatOutputs) {
        Object.keys(flatOutputs).forEach(key => {
          expect(flatOutputs[key as keyof FlatOutputs]).toBe(outputs[key as keyof StackOutputs]?.value);
        });
      }
    });

    test('All expected outputs should be present', () => {
      const requiredOutputs = [
        'api_gateway_url',
        'cloudtrail_name',
        'cloudtrail_s3_bucket',
        'cloudwatch_log_group_api',
        'cloudwatch_log_group_lambda',
        'dynamodb_table_name',
        'lambda_function_name',
        'redis_endpoint',
        'sns_topic_arn',
        'vpc_id',
        'waf_web_acl_arn'
      ];

      const optionalOutputs = [
        'gdpr_lambda_function_name',
        'gdpr_lambda_arn',
        'gdpr_event_rule_name',
        'cloudwatch_dashboard_name'
      ];

      // Check required outputs
      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output as keyof StackOutputs]).toHaveProperty('value');
        expect(outputs[output as keyof StackOutputs]?.value).toBeTruthy();
      });

      // Check optional outputs if they exist
      optionalOutputs.forEach(output => {
        if (outputs[output as keyof StackOutputs]) {
          expect(outputs[output as keyof StackOutputs]).toHaveProperty('value');
        }
      });
    });

    test('No outputs should be marked as sensitive', () => {
      Object.values(outputs).forEach(output => {
        expect(output.sensitive).toBe(false);
      });
    });
  });

  describe('Integration Endpoints', () => {
    test('API Gateway URL should be reachable format', () => {
      const apiUrl = outputs.api_gateway_url.value;
      const url = new URL(apiUrl);

      expect(url.protocol).toBe('https:');
      expect(url.hostname).toContain('.execute-api.');
      expect(url.pathname).toBe('/prod/search');
    });

    test('Redis endpoint should be valid hostname', () => {
      const redisEndpoint = outputs.redis_endpoint.value;
      expect(redisEndpoint).not.toContain('://');
      expect(redisEndpoint).not.toContain(':6379'); // Port should not be in endpoint
      expect(redisEndpoint.split('.').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('GDPR Compliance Validation', () => {
    test('CloudTrail should be enabled for audit logging', () => {
      expect(outputs.cloudtrail_name.value).toBeTruthy();
      expect(outputs.cloudtrail_s3_bucket.value).toBeTruthy();
    });

    test('All log groups should exist for data processing transparency', () => {
      expect(outputs.cloudwatch_log_group_api.value).toBeTruthy();
      expect(outputs.cloudwatch_log_group_lambda.value).toBeTruthy();
    });
  });

  describe('High Availability Validation', () => {
    test('Redis endpoint indicates cluster setup', () => {
      const redisEndpoint = outputs.redis_endpoint.value;
      // ElastiCache cluster endpoints typically have this format
      expect(redisEndpoint).toMatch(/\.([\w-]+)\.cache\.amazonaws\.com$/);
    });

    test('WAF is protecting the API', () => {
      expect(outputs.waf_web_acl_arn).toBeDefined();
      expect(outputs.waf_web_acl_arn.value).toBeTruthy();
      expect(outputs.waf_web_acl_arn.value).toContain('travel-platform-api-waf');
    });
  });
});

