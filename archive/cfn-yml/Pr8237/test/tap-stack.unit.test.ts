import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Quiz Platform Infrastructure', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toBe('Serverless Quiz Platform Infrastructure with Personalization');
    });

    test('should have all main sections', () => {
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('production');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'development',
        'staging',
        'production'
      ]);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toBe(
        'Unique suffix for resource naming to avoid conflicts'
      );
    });
  });

  describe('S3 Resources', () => {
    test('should have QuizResultsBucket resource', () => {
      expect(template.Resources.QuizResultsBucket).toBeDefined();
      expect(template.Resources.QuizResultsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('QuizResultsBucket should have correct deletion policies', () => {
      const bucket = template.Resources.QuizResultsBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('QuizResultsBucket should have versioning enabled', () => {
      const bucket = template.Resources.QuizResultsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('QuizResultsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.QuizResultsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);

      const transitionRule = bucket.Properties.LifecycleConfiguration.Rules.find(
        (r: any) => r.Id === 'TransitionToIA'
      );
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions).toHaveLength(2);
    });

    test('QuizResultsBucket should have public access blocked', () => {
      const bucket = template.Resources.QuizResultsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have QuestionsTable resource', () => {
      expect(template.Resources.QuestionsTable).toBeDefined();
      expect(template.Resources.QuestionsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have ResultsTable resource', () => {
      expect(template.Resources.ResultsTable).toBeDefined();
      expect(template.Resources.ResultsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('QuestionsTable should have correct properties', () => {
      const table = template.Resources.QuestionsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(10);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(10);
    });

    test('QuestionsTable should have correct attributes', () => {
      const table = template.Resources.QuestionsTable;
      const attrs = table.Properties.AttributeDefinitions;

      expect(attrs).toContainEqual({ AttributeName: 'question_id', AttributeType: 'S' });
      expect(attrs).toContainEqual({ AttributeName: 'category', AttributeType: 'S' });
      expect(attrs).toContainEqual({ AttributeName: 'difficulty', AttributeType: 'N' });
    });

    test('QuestionsTable should have global secondary index', () => {
      const table = template.Resources.QuestionsTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);

      const gsi = table.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('CategoryIndex');
      expect(gsi.KeySchema).toHaveLength(2);
    });

    test('ResultsTable should have TTL enabled', () => {
      const table = template.Resources.ResultsTable;
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
    });

    test('ResultsTable should have stream enabled', () => {
      const table = template.Resources.ResultsTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Lambda Functions', () => {
    test('should have QuizGenerationFunction resource', () => {
      expect(template.Resources.QuizGenerationFunction).toBeDefined();
      expect(template.Resources.QuizGenerationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have QuizScoringFunction resource', () => {
      expect(template.Resources.QuizScoringFunction).toBeDefined();
      expect(template.Resources.QuizScoringFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have QuizRetrievalFunction resource', () => {
      expect(template.Resources.QuizRetrievalFunction).toBeDefined();
      expect(template.Resources.QuizRetrievalFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('QuizGenerationFunction should have correct configuration', () => {
      const lambda = template.Resources.QuizGenerationFunction;
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Timeout).toBe(300); // 5 minutes
      expect(lambda.Properties.MemorySize).toBe(1024);
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('QuizGenerationFunction should have environment variables', () => {
      const lambda = template.Resources.QuizGenerationFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.QUESTIONS_TABLE).toEqual({ Ref: 'QuestionsTable' });
      expect(envVars.RESULTS_TABLE).toEqual({ Ref: 'ResultsTable' });
      expect(envVars.S3_BUCKET).toEqual({ Ref: 'QuizResultsBucket' });
    });

    test('QuizScoringFunction should have correct configuration', () => {
      const lambda = template.Resources.QuizScoringFunction;
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(512);
    });
  });

  describe('IAM Roles', () => {
    test('should have QuizGenerationLambdaRole', () => {
      expect(template.Resources.QuizGenerationLambdaRole).toBeDefined();
      expect(template.Resources.QuizGenerationLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have QuizScoringLambdaRole', () => {
      expect(template.Resources.QuizScoringLambdaRole).toBeDefined();
      expect(template.Resources.QuizScoringLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('QuizGenerationLambdaRole should have correct policies', () => {
      const role = template.Resources.QuizGenerationLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );

      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
    });
  });

  describe('AWS Personalize', () => {
    test('should have PersonalizeDatasetGroup resource', () => {
      expect(template.Resources.PersonalizeDatasetGroup).toBeDefined();
      expect(template.Resources.PersonalizeDatasetGroup.Type).toBe('AWS::Personalize::DatasetGroup');
    });

    test('should have PersonalizeSchema resource', () => {
      expect(template.Resources.PersonalizeSchema).toBeDefined();
      expect(template.Resources.PersonalizeSchema.Type).toBe('AWS::Personalize::Schema');
    });

    test('should have PersonalizeDataset resource', () => {
      expect(template.Resources.PersonalizeDataset).toBeDefined();
      expect(template.Resources.PersonalizeDataset.Type).toBe('AWS::Personalize::Dataset');
      expect(template.Resources.PersonalizeDataset.Properties.DatasetType).toBe('Interactions');
    });

    test('should have PersonalizeRole resource', () => {
      expect(template.Resources.PersonalizeRole).toBeDefined();
      expect(template.Resources.PersonalizeRole.Type).toBe('AWS::IAM::Role');
    });

    test('PersonalizeSchema should have correct interaction schema structure', () => {
      const schema = template.Resources.PersonalizeSchema;
      expect(schema.Properties.Schema).toBeDefined();
      const schemaObj = JSON.parse(schema.Properties.Schema);
      expect(schemaObj.fields).toBeDefined();
      expect(schemaObj.fields.length).toBeGreaterThan(0);
      expect(schemaObj.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'USER_ID' }),
          expect.objectContaining({ name: 'ITEM_ID' }),
          expect.objectContaining({ name: 'TIMESTAMP' }),
          expect.objectContaining({ name: 'SCORE' })
        ])
      );
    });
  });

  describe('API Gateway', () => {
    test('should have QuizAPI resource', () => {
      expect(template.Resources.QuizAPI).toBeDefined();
      expect(template.Resources.QuizAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('QuizAPI should have correct configuration', () => {
      const api = template.Resources.QuizAPI;
      expect(api.Properties.Description).toBe('Quiz Platform API Gateway');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API resources for quiz endpoints', () => {
      expect(template.Resources.QuizResource).toBeDefined();
      expect(template.Resources.GenerateResource).toBeDefined();
      expect(template.Resources.SubmitResource).toBeDefined();
      expect(template.Resources.QuizIdResource).toBeDefined();
      expect(template.Resources.ResultsResource).toBeDefined();
    });

    test('should have API methods for POST and GET operations', () => {
      expect(template.Resources.GenerateMethod).toBeDefined();
      expect(template.Resources.GenerateMethod.Properties.HttpMethod).toBe('POST');

      expect(template.Resources.SubmitMethod).toBeDefined();
      expect(template.Resources.SubmitMethod.Properties.HttpMethod).toBe('POST');

      expect(template.Resources.GetQuizMethod).toBeDefined();
      expect(template.Resources.GetQuizMethod.Properties.HttpMethod).toBe('GET');
      
      expect(template.Resources.GetResultsMethod).toBeDefined();
      expect(template.Resources.GetResultsMethod.Properties.HttpMethod).toBe('GET');
    });

    test('should have API deployment', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have Lambda permissions for API Gateway', () => {
      expect(template.Resources.GenerateLambdaPermission).toBeDefined();
      expect(template.Resources.GenerateLambdaPermission.Type).toBe('AWS::Lambda::Permission');

      expect(template.Resources.ScoringLambdaPermission).toBeDefined();
      expect(template.Resources.ScoringLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.QuizMetricsDashboard).toBeDefined();
      expect(template.Resources.QuizMetricsDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch Alarms', () => {
      expect(template.Resources.GenerationErrorAlarm).toBeDefined();
      expect(template.Resources.GenerationErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');

      expect(template.Resources.HighLatencyAlarm).toBeDefined();
      expect(template.Resources.HighLatencyAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('GenerationErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.GenerationErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('HighLatencyAlarm should have correct configuration', () => {
      const alarm = template.Resources.HighLatencyAlarm;
      expect(alarm.Properties.MetricName).toBe('Latency');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(1000);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'QuizResultsBucketName',
        'QuestionsTableName',
        'ResultsTableName',
        'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('ApiEndpoint output should have correct value', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Value['Fn::Sub']).toContain('https://${QuizAPI}.execute-api');
    });

    test('outputs should have export names', () => {
      const exportableOutputs = [
        'ApiEndpoint',
        'QuizResultsBucketName',
        'QuestionsTableName',
        'ResultsTableName'
      ];

      exportableOutputs.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all deletable resources should have Delete policies', () => {
      const resources = Object.keys(template.Resources);
      const deletableTypes = [
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::ApiGateway::RestApi',
        'AWS::CloudWatch::Dashboard',
        'AWS::CloudWatch::Alarm'
      ];

      resources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (deletableTypes.includes(resource.Type)) {
          expect(resource.DeletionPolicy).toBe('Delete');
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });

    test('resources with names should use EnvironmentSuffix', () => {
      // Check S3 bucket
      const bucketName = template.Resources.QuizResultsBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check DynamoDB tables
      const questionsTableName = template.Resources.QuestionsTable.Properties.TableName;
      expect(questionsTableName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const resultsTableName = template.Resources.ResultsTable.Properties.TableName;
      expect(resultsTableName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check Lambda functions
      const genFunctionName = template.Resources.QuizGenerationFunction.Properties.FunctionName;
      expect(genFunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const scoringFunctionName = template.Resources.QuizScoringFunction.Properties.FunctionName;
      expect(scoringFunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

    test('should have at least 15 resources for complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15);
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        expect(template.Resources[resourceKey].Type).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('IAM roles should follow least privilege principle', () => {
      const roles = ['QuizGenerationLambdaRole', 'QuizScoringLambdaRole'];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
          .toBe('lambda.amazonaws.com');
      });
    });

    test('DynamoDB tables should have Point-in-Time Recovery enabled for Questions table', () => {
      const table = template.Resources.QuestionsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('S3 bucket should not allow public access', () => {
      const bucket = template.Resources.QuizResultsBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });
  });
});