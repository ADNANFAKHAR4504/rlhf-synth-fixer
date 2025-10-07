import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Travel Platform CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Scalable Travel Platform API with Caching, Monitoring, and Event-Driven Integration'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'CacheNodeType',
        'ApiThrottlingRate',
        'ApiThrottlingBurst'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('CacheNodeType parameter should have allowed values', () => {
      const param = template.Parameters.CacheNodeType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cache.t3.micro');
      expect(param.AllowedValues).toContain('cache.t3.micro');
      expect(param.AllowedValues).toContain('cache.t3.small');
      expect(param.AllowedValues).toContain('cache.t3.medium');
    });

    test('throttling parameters should have correct defaults', () => {
      expect(template.Parameters.ApiThrottlingRate.Default).toBe(10000);
      expect(template.Parameters.ApiThrottlingBurst.Default).toBe(5000);
    });
  });

  describe('Core Resources', () => {
    test('should have TravelDataTable DynamoDB table', () => {
      const table = template.Resources.TravelDataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TravelDataTable should have correct key schema', () => {
      const table = template.Resources.TravelDataTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('searchType');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('searchId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TravelDataTable should have GSI for timestamp queries', () => {
      const table = template.Resources.TravelDataTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('timestamp-index');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('searchType');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('timestamp');
    });

    test('should have SearchLambdaFunction', () => {
      const lambda = template.Resources.SearchLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have CacheCluster ElastiCache', () => {
      const cache = template.Resources.CacheCluster;
      expect(cache).toBeDefined();
      expect(cache.Type).toBe('AWS::ElastiCache::CacheCluster');
      expect(cache.Properties.Engine).toBe('redis');
      expect(cache.Properties.NumCacheNodes).toBe(1);
    });

    test('should have TravelApi API Gateway', () => {
      const api = template.Resources.TravelApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Description).toBe('Travel Platform REST API');
    });

    test('should have EventBridge resources', () => {
      expect(template.Resources.EventBus).toBeDefined();
      expect(template.Resources.EventBus.Type).toBe('AWS::Events::EventBus');
      expect(template.Resources.IntegrationRule).toBeDefined();
      expect(template.Resources.IntegrationRule.Type).toBe('AWS::Events::Rule');
    });
  });

  describe('Security Resources', () => {
    test('should have Lambda execution role with correct permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('TravelApiPolicy');
    });

    test('should have security groups for Lambda and Cache', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.CacheSecurityGroup).toBeDefined();
      
      const cacheSG = template.Resources.CacheSecurityGroup;
      expect(cacheSG.Properties.SecurityGroupIngress[0].FromPort).toBe(6379);
      expect(cacheSG.Properties.SecurityGroupIngress[0].ToPort).toBe(6379);
    });
  });

  describe('API Gateway Setup', () => {
    test('should have search resource and method', () => {
      expect(template.Resources.SearchResource).toBeDefined();
      expect(template.Resources.SearchMethod).toBeDefined();
      
      const method = template.Resources.SearchMethod;
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have API Gateway deployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toContain('SearchMethod');
    });

    test('should have Lambda permission for API Gateway', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
      expect(template.Resources.ApiErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.ApiErrorAlarm.Properties.MetricName).toBe('5XXError');
    });

    test('should have X-Ray service map', () => {
      const xray = template.Resources.XRayServiceMap;
      expect(xray).toBeDefined();
      expect(xray.Type).toBe('AWS::XRay::Group');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC and subnets', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();
      
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have cache subnet group', () => {
      const subnetGroup = template.Resources.CacheSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });
  });

  describe('Integration Resources', () => {
    test('should have SQS queue and policy for integration', () => {
      expect(template.Resources.IntegrationQueue).toBeDefined();
      expect(template.Resources.IntegrationQueuePolicy).toBeDefined();
      
      const queue = template.Resources.IntegrationQueue;
      expect(queue.Type).toBe('AWS::SQS::Queue');
      expect(queue.Properties.VisibilityTimeout).toBe(300);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'TravelDataTableName',
        'TravelDataTableArn',
        'CacheEndpoint',
        'EventBusName',
        'DashboardURL',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const table = template.Resources.TravelDataTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TravelData${EnvironmentSuffix}',
      });
    });

    test('Lambda function should have correct naming', () => {
      const lambda = template.Resources.SearchLambdaFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TravelSearchApi${EnvironmentSuffix}',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Travel platform has many more resources than the simple table
      expect(resourceCount).toBeGreaterThan(15);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Lambda Code Validation', () => {
    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.SearchLambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
    });

    test('Lambda should have correct environment variables', () => {
      const lambda = template.Resources.SearchLambdaFunction;
      const env = lambda.Properties.Environment.Variables;
      
      expect(env.TABLE_NAME).toBeDefined();
      expect(env.EVENT_BUS_NAME).toBeDefined();
    });

    test('Lambda should have VPC configuration', () => {
      const lambda = template.Resources.SearchLambdaFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });
  });
});
