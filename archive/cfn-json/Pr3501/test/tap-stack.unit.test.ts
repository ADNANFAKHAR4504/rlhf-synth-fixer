import * as fs from 'fs';
import * as path from 'path';

// Load the CloudFormation template
const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('Lead Scoring Infrastructure - Unit Tests', () => {
  describe('Template Structure', () => {
    test('should have valid CloudFormation template structure', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion', '2010-09-09');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
      expect(template).toHaveProperty('Parameters');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe('Lead Scoring Pipeline Infrastructure');
    });

    test('should have notification email parameter', () => {
      expect(template.Parameters).toHaveProperty('NotificationEmail');
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.Default).toBe('sales-team@company.com');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket for model artifacts', () => {
      expect(template.Resources).toHaveProperty('ModelArtifactsBucket');
      const bucket = template.Resources.ModelArtifactsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have DynamoDB table for lead scores', () => {
      expect(template.Resources).toHaveProperty('LeadsTable');
      const table = template.Resources.LeadsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.LeadsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('leadId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Compute Resources', () => {
    test('should have Lambda function for lead scoring', () => {
      expect(template.Resources).toHaveProperty('LeadScoringFunction');
      const lambda = template.Resources.LeadScoringFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.MemorySize).toBe(1024);
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.LeadScoringFunction;
      expect(lambda.Properties.Environment.Variables).toHaveProperty('DYNAMODB_TABLE');
      expect(lambda.Properties.Environment.Variables).toHaveProperty('EVENT_BUS_NAME');
    });

    test('should have Lambda execution role with correct policies', () => {
      expect(template.Resources).toHaveProperty('LambdaExecutionRole');
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      // Check managed policies
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );

      // Check inline policies
      const inlinePolicy = role.Properties.Policies[0];
      expect(inlinePolicy.PolicyName).toBe('LeadScoringPolicy');
      const statements = inlinePolicy.PolicyDocument.Statement;

      // Check DynamoDB permissions
      const dynamoStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');

      // Check EventBridge permissions
      const eventsStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('events:PutEvents')
      );
      expect(eventsStatement).toBeDefined();

      // Check CloudWatch permissions
      const cloudwatchStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cloudwatchStatement).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayRestApi');
      const api = template.Resources.ApiGatewayRestApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API resource for /score endpoint', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayResource');
      const resource = template.Resources.ApiGatewayResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('score');
    });

    test('should have POST method with Lambda integration', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayMethod');
      const method = template.Resources.ApiGatewayMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have request validator and model', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayRequestValidator');
      expect(template.Resources).toHaveProperty('ApiGatewayModel');

      const model = template.Resources.ApiGatewayModel;
      const schema = typeof model.Properties.Schema === 'string'
        ? JSON.parse(model.Properties.Schema)
        : model.Properties.Schema;
      expect(schema.required).toContain('companySize');
      expect(schema.required).toContain('industry');
      expect(schema.required).toContain('engagementMetrics');
    });

    test('should have deployment and stage with throttling', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayDeployment');
      expect(template.Resources).toHaveProperty('ApiGatewayStage');

      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.MethodSettings[0].ThrottlingRateLimit).toBe(100);
      expect(stage.Properties.MethodSettings[0].ThrottlingBurstLimit).toBe(200);
    });

    test('should have usage plan with throttling', () => {
      expect(template.Resources).toHaveProperty('ApiGatewayUsagePlan');
      const usagePlan = template.Resources.ApiGatewayUsagePlan;
      expect(usagePlan.Properties.Throttle.RateLimit).toBe(100);
      expect(usagePlan.Properties.Throttle.BurstLimit).toBe(200);
    });
  });

  describe('Event-Driven Architecture', () => {
    test('should have EventBridge custom event bus', () => {
      expect(template.Resources).toHaveProperty('LeadEventBus');
      const bus = template.Resources.LeadEventBus;
      expect(bus.Type).toBe('AWS::Events::EventBus');
    });

    test('should have rule for high-value leads (score > 80)', () => {
      expect(template.Resources).toHaveProperty('HighValueLeadRule');
      const rule = template.Resources.HighValueLeadRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Description).toContain('score > 80');
      expect(rule.Properties.EventPattern.source).toContain('lead.scoring');
      expect(rule.Properties.EventPattern['detail-type']).toContain('Lead Scored');
    });

    test('should have rule for very high score alerts (score > 95)', () => {
      expect(template.Resources).toHaveProperty('VeryHighScoreRule');
      const rule = template.Resources.VeryHighScoreRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Description).toContain('score > 95');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have SNS topic for high-score notifications', () => {
      expect(template.Resources).toHaveProperty('HighScoreTopic');
      const topic = template.Resources.HighScoreTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources).toHaveProperty('LeadScoringLogGroup');
      expect(template.Resources).toHaveProperty('LeadRoutingLogGroup');

      const scoringLog = template.Resources.LeadScoringLogGroup;
      expect(scoringLog.Type).toBe('AWS::Logs::LogGroup');
      expect(scoringLog.Properties.RetentionInDays).toBe(7);
    });

    test('should have CloudWatch alarm for high latency', () => {
      expect(template.Resources).toHaveProperty('LatencyAlarm');
      const alarm = template.Resources.LatencyAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ScoringLatency');
      expect(alarm.Properties.Namespace).toBe('LeadScoring');
      expect(alarm.Properties.Threshold).toBe(3000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources).toHaveProperty('ScoringDashboard');
      const dashboard = template.Resources.ScoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');

      // Parse dashboard body to check widgets
      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub']);
      expect(dashboardBody.widgets).toHaveLength(3);
      expect(dashboardBody.widgets[0].properties.title).toBe('Scoring Latency');
      expect(dashboardBody.widgets[1].properties.title).toBe('Average Lead Score');
      expect(dashboardBody.widgets[2].properties.title).toBe('Lambda Invocations');
    });
  });

  describe('Outputs', () => {
    test('should have API endpoint URL output', () => {
      expect(template.Outputs).toHaveProperty('ApiEndpointUrl');
      expect(template.Outputs.ApiEndpointUrl.Description).toContain('API Gateway endpoint');
    });

    test('should have dashboard URL output', () => {
      expect(template.Outputs).toHaveProperty('DashboardUrl');
      expect(template.Outputs.DashboardUrl.Description).toContain('CloudWatch Dashboard');
    });

    test('should have DynamoDB table name output', () => {
      expect(template.Outputs).toHaveProperty('DynamoDBTableName');
      expect(template.Outputs.DynamoDBTableName.Value.Ref).toBe('LeadsTable');
    });

    test('should have SNS topic ARN output', () => {
      expect(template.Outputs).toHaveProperty('SNSTopicArn');
      expect(template.Outputs.SNSTopicArn.Value.Ref).toBe('HighScoreTopic');
    });
  });

  describe('Security and Best Practices', () => {
    test('should use least privilege IAM policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;

      statements.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        // Check that resources are specific (not *)
        if (statement.Action && !statement.Action.includes('cloudwatch:PutMetricData')) {
          expect(statement.Resource).toBeDefined();
          expect(statement.Resource).not.toBe('*');
        }
      });
    });

    test('should have S3 bucket with security settings', () => {
      const bucket = template.Resources.ModelArtifactsBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have DynamoDB with point-in-time recovery', () => {
      const table = template.Resources.LeadsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have proper resource tagging', () => {
      const taggedResources = [
        'ModelArtifactsBucket',
        'LeadsTable',
        'HighScoreTopic',
        'LeadEventBus',
        'LeadScoringFunction',
        'ApiGatewayRestApi'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const appTag = resource.Properties.Tags.find((t: any) => t.Key === 'Application');
        expect(appTag).toBeDefined();
        expect(appTag.Value).toBe('lead-scoring-system');
      });
    });
  });

  describe('Lambda Function Code', () => {
    test('should have mock scoring logic in Lambda code', () => {
      const lambda = template.Resources.LeadScoringFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain('calculate_mock_score');
      expect(code).toContain('import random');
      expect(code).toContain('company_size');
      expect(code).toContain('engagement_metrics');
    });

    test('Lambda code should validate required fields', () => {
      const lambda = template.Resources.LeadScoringFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain("required_fields = ['companySize', 'industry', 'engagementMetrics']");
      expect(code).toContain('Missing required field');
    });

    test('Lambda code should handle caching', () => {
      const lambda = template.Resources.LeadScoringFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain('Check cache in DynamoDB');
      expect(code).toContain('Using cached score');
      expect(code).toContain('ttl');
    });

    test('Lambda code should publish to EventBridge', () => {
      const lambda = template.Resources.LeadScoringFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain("events.put_events");
      expect(code).toContain("'Source': 'lead.scoring'");
      expect(code).toContain("'DetailType': 'Lead Scored'");
    });

    test('Lambda code should send CloudWatch metrics', () => {
      const lambda = template.Resources.LeadScoringFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Sub'];
      expect(code).toContain("cloudwatch.put_metric_data");
      expect(code).toContain("'MetricName': 'ScoringLatency'");
      expect(code).toContain("'MetricName': 'LeadScore'");
    });
  });

  describe('Enhanced Services - Secrets Manager', () => {
    test('should have Secrets Manager resource for configuration', () => {
      expect(template.Resources).toHaveProperty('LeadScoringSecrets');
      const secret = template.Resources.LeadScoringSecrets;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Description).toContain('SageMaker endpoint');
    });

    test('Secrets Manager should have proper configuration', () => {
      const secret = template.Resources.LeadScoringSecrets;
      // SecretString uses Fn::Sub, so we need to parse the template string
      const secretTemplateString = secret.Properties.SecretString['Fn::Sub'];
      const secretData = JSON.parse(secretTemplateString);
      expect(secretData).toHaveProperty('enrichmentApiKey');
      expect(secretData).toHaveProperty('sagemakerEndpoint');
      expect(secretData).toHaveProperty('scoringThreshold');
      expect(secretData.scoringThreshold).toBe(80);
    });

    test('Lambda function should have permission to read secrets', () => {
      const role = template.Resources.LambdaExecutionRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      const secretsStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
      expect(secretsStatement.Effect).toBe('Allow');
    });
  });

  describe('Enhanced Services - EventBridge Scheduler', () => {
    test('should have EventBridge Scheduler for batch processing', () => {
      expect(template.Resources).toHaveProperty('BatchLeadProcessingSchedule');
      const schedule = template.Resources.BatchLeadProcessingSchedule;
      expect(schedule.Type).toBe('AWS::Scheduler::Schedule');
      expect(schedule.Properties.ScheduleExpression).toBe('rate(15 minutes)');
    });

    test('should have scheduler execution role', () => {
      expect(template.Resources).toHaveProperty('BatchProcessingSchedulerRole');
      const role = template.Resources.BatchProcessingSchedulerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumeRole = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('scheduler.amazonaws.com');
    });

    test('scheduler should target Lambda function', () => {
      const schedule = template.Resources.BatchLeadProcessingSchedule;
      expect(schedule.Properties.Target.Arn['Fn::GetAtt'][0]).toBe('BatchProcessingFunction');
      expect(schedule.Properties.Target.Arn['Fn::GetAtt'][1]).toBe('Arn');
      expect(schedule.Properties.Target.RoleArn['Fn::GetAtt'][0]).toBe('BatchProcessingSchedulerRole');
    });

    test('scheduler should have proper input payload', () => {
      const schedule = template.Resources.BatchLeadProcessingSchedule;
      const input = JSON.parse(schedule.Properties.Target.Input);
      expect(input.action).toBe('processQueuedLeads');
      expect(input.batchSize).toBe(50);
    });

    test('scheduler role should have permission to invoke Lambda', () => {
      const role = template.Resources.BatchProcessingSchedulerRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('SchedulerExecutionPolicy');
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('lambda:InvokeFunction');
      expect(statement.Effect).toBe('Allow');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(26); // Updated count with enhanced services
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(4); // Allow for additional outputs
    });

    test('should include all 10 AWS services', () => {
      const resources = template.Resources;

      // S3
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::S3::Bucket')).toBe(true);

      // DynamoDB
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::DynamoDB::Table')).toBe(true);

      // SNS
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::SNS::Topic')).toBe(true);

      // EventBridge
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::Events::EventBus')).toBe(true);

      // IAM
      expect(Object.values(resources).some((r: any) => r.Type.startsWith('AWS::IAM:'))).toBe(true);

      // CloudWatch
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::CloudWatch::Dashboard')).toBe(true);

      // Lambda
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::Lambda::Function')).toBe(true);

      // API Gateway
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::ApiGateway::RestApi')).toBe(true);

      // Secrets Manager
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::SecretsManager::Secret')).toBe(true);

      // EventBridge Scheduler
      expect(Object.values(resources).some((r: any) => r.Type === 'AWS::Scheduler::Schedule')).toBe(true);
    });
  });
});