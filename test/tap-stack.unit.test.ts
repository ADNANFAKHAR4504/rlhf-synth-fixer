import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Image Processing CloudFormation Template', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Image Processing System with S3, Lambda, DynamoDB, and CloudWatch'
      );
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('Environment suffix');
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('S3 Resources', () => {
    test('should have ImageBucket with correct configuration', () => {
      const bucket = template.Resources.ImageBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const props = bucket.Properties;
      expect(props.BucketName).toEqual({
        'Fn::Sub': 'image-processing-bucket-${EnvironmentSuffix}'
      });
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have S3 event notifications configured', () => {
      const bucket = template.Resources.ImageBucket;
      const props = bucket.Properties;

      expect(props.NotificationConfiguration.LambdaConfigurations).toHaveLength(2);
      const configs = props.NotificationConfiguration.LambdaConfigurations;
      
      // Check for JPG configuration
      const jpgConfig = configs.find((config: any) => 
        config.Filter.S3Key.Rules.some((rule: any) => rule.Value === '.jpg')
      );
      expect(jpgConfig).toBeDefined();
      
      // Check for PNG configuration
      const pngConfig = configs.find((config: any) => 
        config.Filter.S3Key.Rules.some((rule: any) => rule.Value === '.png')
      );
      expect(pngConfig).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ImageMetadataTable with correct configuration', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      const props = table.Properties;
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.TableName).toEqual({
        'Fn::Sub': 'image-metadata-${EnvironmentSuffix}'
      });
    });

    test('should have correct DynamoDB table structure', () => {
      const table = template.Resources.ImageMetadataTable;
      const props = table.Properties;

      // Check attribute definitions
      expect(props.AttributeDefinitions).toHaveLength(3);
      const attrs = props.AttributeDefinitions.reduce((acc: any, attr: any) => {
        acc[attr.AttributeName] = attr.AttributeType;
        return acc;
      }, {});
      expect(attrs.imageId).toBe('S');
      expect(attrs.uploadTimestamp).toBe('N');
      expect(attrs.status).toBe('S');

      // Check key schema
      expect(props.KeySchema).toHaveLength(2);
      expect(props.KeySchema[0].AttributeName).toBe('imageId');
      expect(props.KeySchema[0].KeyType).toBe('HASH');
      expect(props.KeySchema[1].AttributeName).toBe('uploadTimestamp');
      expect(props.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('should have Global Secondary Index configured correctly', () => {
      const table = template.Resources.ImageMetadataTable;
      const props = table.Properties;

      expect(props.GlobalSecondaryIndexes).toHaveLength(1);
      const gsi = props.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('StatusIndex');
      expect(gsi.KeySchema[0].AttributeName).toBe('status');
      expect(gsi.KeySchema[0].KeyType).toBe('HASH');
      expect(gsi.KeySchema[1].AttributeName).toBe('uploadTimestamp');
      expect(gsi.KeySchema[1].KeyType).toBe('RANGE');
      expect(gsi.Projection.ProjectionType).toBe('ALL');
    });

    test('should have data protection features enabled', () => {
      const table = template.Resources.ImageMetadataTable;
      const props = table.Properties;

      expect(props.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Resources', () => {
    test('should have ImageProcessorFunction with correct runtime', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const props = lambda.Properties;
      expect(props.Runtime).toBe('python3.9');
      expect(props.Handler).toBe('index.handler');
      expect(props.Timeout).toBe(300);
      expect(props.MemorySize).toBe(1024);
    });

    test('should have Lambda function with environment variables', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const props = lambda.Properties;

      expect(props.Environment.Variables).toBeDefined();
      expect(props.Environment.Variables.METADATA_TABLE).toEqual({ Ref: 'ImageMetadataTable' });
      expect(props.Environment.Variables.PROCESSED_BUCKET).toEqual({ Ref: 'ImageBucket' });
      expect(props.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have IAM role with correct policies', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const policy = policies[0];
      expect(policy.PolicyName).toBe('ImageProcessorPolicy');

      const statements = policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      // Check S3 permissions
      const s3Statement = statements.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');

      // Check DynamoDB permissions
      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();

      // Check CloudWatch permissions
      const cwStatement = statements.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
    });

    test('should have S3 Lambda permission', () => {
      const permission = template.Resources.S3InvokeLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });


  describe('CloudWatch Resources', () => {
    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const props = alarm.Properties;
      expect(props.MetricName).toBe('Errors');
      expect(props.Namespace).toBe('AWS/Lambda');
      expect(props.Threshold).toBe(5);
      expect(props.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have Lambda duration alarm', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Threshold).toBe(240000);
    });

    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.ImageProcessingDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'image-processing-${EnvironmentSuffix}'
      });
    });

    test('should have Lambda log group', () => {
      const logGroup = template.Resources.ImageProcessorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ImageBucketName',
        'ImageMetadataTableName',
        'ImageProcessorFunctionArn',
        'DashboardURL',
        'ImageBucketArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have dashboard URL output with correct format', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=image-processing-${EnvironmentSuffix}'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have all critical resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
    });
  });

  describe('Naming Conventions', () => {
    test('should use environment suffix in resource names', () => {
      const bucket = template.Resources.ImageBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'image-processing-bucket-${EnvironmentSuffix}'
      });

      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'image-metadata-${EnvironmentSuffix}'
      });

      const dashboard = template.Resources.ImageProcessingDashboard;
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'image-processing-${EnvironmentSuffix}'
      });
    });

    test('should have consistent tagging strategy', () => {
      const resourcesWithTags = [
        'ImageBucket',
        'ImageMetadataTable',
        'ImageProcessorRole',
        'ImageProcessorFunction'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) =>
            tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });
  });
});
