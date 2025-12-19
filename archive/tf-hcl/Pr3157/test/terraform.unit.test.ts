// Unit tests for Terraform Search API infrastructure
// These tests validate the Terraform configuration structure without deploying

import fs from 'fs';
import path from 'path';

const libPath = path.resolve(__dirname, '../lib');

describe('Terraform Search API Configuration', () => {
  
  describe('Core Configuration Files', () => {
    test('provider.tf configures AWS provider correctly', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
      
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
      expect(content).toContain('hashicorp/aws');
    });

    test('variable.tf declares all required variables', () => {
      const varPath = path.join(libPath, 'variable.tf');
      expect(fs.existsSync(varPath)).toBe(true);
      
      const content = fs.readFileSync(varPath, 'utf8');
      expect(content).toMatch(/variable\s+"app_name"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toContain('us-east-1');
    });
  });

  describe('Network Module', () => {
    test('network.tf creates VPC with proper configuration', () => {
      const networkPath = path.join(libPath, 'network.tf');
      expect(fs.existsSync(networkPath)).toBe(true);
      
      const content = fs.readFileSync(networkPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toContain('10.0.0.0/16');
      expect(content).toContain('enable_dns_support');
      expect(content).toContain('enable_dns_hostnames');
    });

    test('creates public and private subnets across multiple AZs', () => {
      const networkPath = path.join(libPath, 'network.tf');
      const content = fs.readFileSync(networkPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_subnets"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_subnets"/);
      expect(content).toMatch(/count\s*=\s*2/);
      // Check for dynamic AZ assignment
      expect(content).toMatch(/availability_zone.*us-east-1/);
      expect(content).toMatch(/"a"\s*:\s*"b"/); // Ternary operator for AZ selection
    });

    test('configures NAT gateway and internet gateway', () => {
      const networkPath = path.join(libPath, 'network.tf');
      const content = fs.readFileSync(networkPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(content).toMatch(/resource\s+"aws_eip"/);
    });

    test('creates security group for Lambda', () => {
      const networkPath = path.join(libPath, 'network.tf');
      const content = fs.readFileSync(networkPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"/);
    });
  });

  describe('IAM Module', () => {
    test('creates Lambda execution role', () => {
      const iamPath = path.join(libPath, 'iam.tf');
      expect(fs.existsSync(iamPath)).toBe(true);
      
      const content = fs.readFileSync(iamPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(content).toContain('lambda.amazonaws.com');
    });

    test('Lambda policy grants access to DynamoDB', () => {
      const iamPath = path.join(libPath, 'iam.tf');
      const content = fs.readFileSync(iamPath, 'utf8');
      
      expect(content).toContain('dynamodb:GetItem');
      expect(content).toContain('dynamodb:PutItem');
      expect(content).toContain('dynamodb:Query');
      expect(content).toContain('aws_dynamodb_table.search_data.arn');
    });

    test('Lambda policy grants X-Ray permissions', () => {
      const iamPath = path.join(libPath, 'iam.tf');
      const content = fs.readFileSync(iamPath, 'utf8');
      
      expect(content).toContain('xray:PutTraceSegments');
      expect(content).toContain('xray:PutTelemetryRecords');
    });

    test('Lambda policy grants EventBridge permissions', () => {
      const iamPath = path.join(libPath, 'iam.tf');
      const content = fs.readFileSync(iamPath, 'utf8');
      
      expect(content).toContain('events:PutEvents');
      expect(content).toContain('aws_cloudwatch_event_bus.notification_bus.arn');
    });
  });

  describe('DynamoDB Module', () => {
    test('creates DynamoDB table with proper configuration', () => {
      const dynamoPath = path.join(libPath, 'dynamodb.tf');
      expect(fs.existsSync(dynamoPath)).toBe(true);
      
      const content = fs.readFileSync(dynamoPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"search_data"/);
      expect(content).toContain('PAY_PER_REQUEST');
      expect(content).toContain('hash_key');
    });

    test('DynamoDB table has GSI for query access', () => {
      const dynamoPath = path.join(libPath, 'dynamodb.tf');
      const content = fs.readFileSync(dynamoPath, 'utf8');
      
      expect(content).toContain('global_secondary_index');
      expect(content).toContain('QueryIndex');
      expect(content).toMatch(/hash_key\s*=\s*"query"/);
    });
  });

  describe('ElastiCache Module', () => {
    test('creates Redis cluster', () => {
      const cachePath = path.join(libPath, 'elasticache.tf');
      expect(fs.existsSync(cachePath)).toBe(true);
      
      const content = fs.readFileSync(cachePath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_elasticache_cluster"\s+"redis_cache"/);
      expect(content).toMatch(/engine\s*=\s*"redis"/);
      expect(content).toContain('cache.t3.small');
    });

    test('Redis uses private subnets', () => {
      const cachePath = path.join(libPath, 'elasticache.tf');
      const content = fs.readFileSync(cachePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_elasticache_subnet_group"/);
      expect(content).toContain('aws_subnet.private_subnets');
    });

    test('Redis has security group restricting access to Lambda', () => {
      const cachePath = path.join(libPath, 'elasticache.tf');
      const content = fs.readFileSync(cachePath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"redis_sg"/);
      expect(content).toContain('from_port   = 6379');
      expect(content).toContain('aws_security_group.lambda_sg.id');
    });
  });

  describe('Lambda Module', () => {
    test('Lambda function configuration is correct', () => {
      const lambdaPath = path.join(libPath, 'lambda.tf');
      expect(fs.existsSync(lambdaPath)).toBe(true);
      
      const content = fs.readFileSync(lambdaPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"search_function"/);
      expect(content).toContain('nodejs18.x');
      expect(content).toContain('index.handler');
    });

    test('Lambda function code exists', () => {
      const zipPath = path.join(libPath, 'search_function.zip');
      expect(fs.existsSync(zipPath)).toBe(true);
    });

    test('Lambda has VPC configuration', () => {
      const lambdaPath = path.join(libPath, 'lambda.tf');
      const content = fs.readFileSync(lambdaPath, 'utf8');
      
      expect(content).toContain('vpc_config');
      expect(content).toContain('aws_subnet.private_subnets');
    });

    test('Lambda has X-Ray tracing enabled', () => {
      const lambdaPath = path.join(libPath, 'lambda.tf');
      const content = fs.readFileSync(lambdaPath, 'utf8');
      
      expect(content).toContain('tracing_config');
      expect(content).toMatch(/mode\s*=\s*"Active"/);
    });

    test('Lambda has environment variables for all services', () => {
      const lambdaPath = path.join(libPath, 'lambda.tf');
      const content = fs.readFileSync(lambdaPath, 'utf8');
      
      expect(content).toContain('DYNAMODB_TABLE');
      expect(content).toContain('REDIS_ENDPOINT');
      expect(content).toContain('REDIS_PORT');
      expect(content).toContain('EVENT_BUS');
    });
  });

  describe('API Gateway Module', () => {
    test('creates REST API', () => {
      const apiPath = path.join(libPath, 'api_gateway.tf');
      expect(fs.existsSync(apiPath)).toBe(true);
      
      const content = fs.readFileSync(apiPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"api"/);
      expect(content).toContain('REGIONAL');
    });

    test('creates /search resource with GET and POST methods', () => {
      const apiPath = path.join(libPath, 'api_gateway.tf');
      const content = fs.readFileSync(apiPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"search"/);
      expect(content).toMatch(/path_part\s*=\s*"search"/);
      expect(content).toMatch(/http_method\s*=\s*"GET"/);
      expect(content).toMatch(/http_method\s*=\s*"POST"/);
    });

    test('API Gateway integrates with Lambda', () => {
      const apiPath = path.join(libPath, 'api_gateway.tf');
      const content = fs.readFileSync(apiPath, 'utf8');
      
      expect(content).toContain('AWS_PROXY');
      expect(content).toContain('aws_lambda_function.search_function.invoke_arn');
    });

    test('API Gateway has X-Ray tracing enabled', () => {
      const apiPath = path.join(libPath, 'api_gateway.tf');
      const content = fs.readFileSync(apiPath, 'utf8');
      
      expect(content).toContain('xray_tracing_enabled = true');
    });
  });

  describe('CloudWatch Module', () => {
    test('creates log groups for API Gateway and Lambda', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      expect(fs.existsSync(cwPath)).toBe(true);
      
      const content = fs.readFileSync(cwPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_logs"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
    });

    test('creates dashboard with metrics', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      const content = fs.readFileSync(cwPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
      expect(content).toContain('AWS/ApiGateway');
      expect(content).toContain('AWS/Lambda');
      expect(content).toContain('AWS/DynamoDB');
      expect(content).toContain('AWS/ElastiCache');
    });

    test('creates alarms for API latency and Lambda errors', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      const content = fs.readFileSync(cwPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    });

    test('creates SNS topic for alerts', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      const content = fs.readFileSync(cwPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });
  });

  describe('X-Ray and EventBridge Module', () => {
    test('creates X-Ray sampling rule', () => {
      const xrayPath = path.join(libPath, 'xray.tf');
      expect(fs.existsSync(xrayPath)).toBe(true);
      
      const content = fs.readFileSync(xrayPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_xray_sampling_rule"/);
    });

    test('creates EventBridge event bus', () => {
      const xrayPath = path.join(libPath, 'xray.tf');
      const content = fs.readFileSync(xrayPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_bus"\s+"notification_bus"/);
    });

    test('creates EventBridge rule for search events', () => {
      const xrayPath = path.join(libPath, 'xray.tf');
      const content = fs.readFileSync(xrayPath, 'utf8');
      
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"search_events"/);
      expect(content).toContain('SearchPerformed');
    });
  });

  describe('Outputs Module', () => {
    test('exports all required outputs', () => {
      const outputPath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const content = fs.readFileSync(outputPath, 'utf8');
      expect(content).toMatch(/output\s+"api_url"/);
      expect(content).toMatch(/output\s+"dynamodb_table_name"/);
      expect(content).toMatch(/output\s+"redis_endpoint"/);
      expect(content).toMatch(/output\s+"dashboard_url"/);
      expect(content).toMatch(/output\s+"event_bus_name"/);
    });
  });
});
