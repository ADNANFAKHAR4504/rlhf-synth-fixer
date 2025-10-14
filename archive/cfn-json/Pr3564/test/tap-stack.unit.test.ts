import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Podcast Hosting Platform CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Podcast Hosting Platform - Dev Environment (us-west-2) - MediaConvert + inline S3 notification'
      );
    });

    test('should have resources and outputs sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have InputBucket with correct properties', () => {
      const bucket = template.Resources.InputBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub'][0]).toContain('pod-in-${EnvSuffix}${RandomSuffix}');
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.CorsConfiguration).toBeDefined();
      // InputBucket no longer has DependsOn to avoid circular dependencies
      expect(bucket.DependsOn).toBeUndefined();
    });

    test('should have OutputBucket with correct properties', () => {
      const bucket = template.Resources.OutputBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub'][0]).toContain('pod-out-${EnvSuffix}${RandomSuffix}');
      expect(bucket.Properties.CorsConfiguration).toBeDefined();
    });

    test('should have RssBucket with correct properties', () => {
      const bucket = template.Resources.RssBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub'][0]).toContain('pod-rss-${EnvSuffix}${RandomSuffix}');
    });

    test('InputBucket should have S3 notification for Lambda', () => {
      const bucket = template.Resources.InputBucket;
      const notification = bucket.Properties.NotificationConfiguration;
      expect(notification.LambdaConfigurations).toHaveLength(1);
      expect(notification.LambdaConfigurations[0].Event).toBe('s3:ObjectCreated:*');
      expect(notification.LambdaConfigurations[0].Function).toEqual({
        "Fn::GetAtt": ["ProcessingLambda", "Arn"]
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have PodcastMetadataTable with correct properties', () => {
      const table = template.Resources.PodcastMetadataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName['Fn::Sub']).toBeDefined();
      expect(table.Properties.TableName['Fn::Sub'][0]).toContain('pod-meta-${EnvSuffix}${RandomSuffix}');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('PodcastMetadataTable should have correct attribute definitions', () => {
      const table = template.Resources.PodcastMetadataTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      
      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('podcastId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('episodeId');
      expect(attributeDefinitions[1].AttributeType).toBe('S');
    });

    test('PodcastMetadataTable should have correct key schema', () => {
      const table = template.Resources.PodcastMetadataTable;
      const keySchema = table.Properties.KeySchema;
      
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('podcastId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('episodeId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('IAM Roles', () => {
    test('should have MediaConvertRole with correct properties', () => {
      const role = template.Resources.MediaConvertRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub'][0]).toContain('pod-mc-${EnvSuffix}${RandomSuffix}');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('mediaconvert.amazonaws.com');
    });

    test('should have ProcessingLambdaRole with correct properties', () => {
      const role = template.Resources.ProcessingLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub'][0]).toContain('pod-proc-${EnvSuffix}${RandomSuffix}');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns)
        .toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have RssGeneratorLambdaRole with correct properties', () => {
      const role = template.Resources.RssGeneratorLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub'][0]).toContain('pod-rss-${EnvSuffix}${RandomSuffix}');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('lambda.amazonaws.com');
    });

    test('MediaConvertRole should have correct S3 permissions', () => {
      const role = template.Resources.MediaConvertRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      expect(policy.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.Statement[0].Action).toContain('s3:ListBucket');
      expect(policy.Statement[1].Action).toContain('s3:PutObject');
      expect(policy.Statement[1].Action).toContain('s3:PutObjectAcl');
    });

    test('ProcessingLambdaRole should have correct permissions', () => {
      const role = template.Resources.ProcessingLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const statements = policy.Statement;
      
      // Check S3 permissions
      const s3Statement = statements.find((s: any) => Array.isArray(s.Action) ? s.Action.includes('s3:GetObject') : s.Action === 's3:GetObject');
      expect(s3Statement).toBeDefined();
      
      // Check MediaConvert permissions
      const mcStatement = statements.find((s: any) => Array.isArray(s.Action) ? s.Action.includes('mediaconvert:CreateJob') : s.Action === 'mediaconvert:CreateJob');
      expect(mcStatement).toBeDefined();
      
      // Check DynamoDB permissions
      const ddbStatement = statements.find((s: any) => Array.isArray(s.Action) ? s.Action.includes('dynamodb:PutItem') : s.Action === 'dynamodb:PutItem');
      expect(ddbStatement).toBeDefined();
      
      // Check SNS permissions
      const snsStatement = statements.find((s: any) => Array.isArray(s.Action) ? s.Action.includes('sns:Publish') : s.Action === 'sns:Publish');
      expect(snsStatement).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have ProcessingLambda with correct properties', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBeDefined();
      expect(lambda.Properties.FunctionName['Fn::Sub'][0]).toContain('pod-proc-${EnvSuffix}${RandomSuffix}');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(120);
    });

    test('should have RssGeneratorLambda with correct properties', () => {
      const lambda = template.Resources.RssGeneratorLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBeDefined();
      expect(lambda.Properties.FunctionName['Fn::Sub'][0]).toContain('pod-rss-${EnvSuffix}${RandomSuffix}');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('ProcessingLambda should have correct environment variables', () => {
      const lambda = template.Resources.ProcessingLambda;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.MC_ROLE).toEqual({
        "Fn::GetAtt": ["MediaConvertRole", "Arn"]
      });
      expect(envVars.METADATA_TABLE).toEqual({
        "Ref": "PodcastMetadataTable"
      });
      expect(envVars.OUTPUT_BUCKET).toEqual({
        "Ref": "OutputBucket"
      });
      expect(envVars.COMPLETION_TOPIC_ARN).toEqual({
        "Ref": "CompletionTopic"
      });
    });

    test('RssGeneratorLambda should have correct environment variables', () => {
      const lambda = template.Resources.RssGeneratorLambda;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.METADATA_TABLE).toEqual({
        "Ref": "PodcastMetadataTable"
      });
      expect(envVars.RSS_BUCKET).toEqual({
        "Ref": "RssBucket"
      });
      expect(envVars.CLOUDFRONT_DOMAIN).toEqual({
        "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]
      });
    });

    test('ProcessingLambda should have inline code', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
      
      const codeLines = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      expect(codeLines[0]).toBe('import boto3');
      expect(codeLines.some((line: string) => line.includes('def handler(event, context):'))).toBe(true);
    });
  });

  describe('SNS Topics', () => {
    test('should have CompletionTopic with correct properties', () => {
      const topic = template.Resources.CompletionTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toBeDefined();
      expect(topic.Properties.TopicName['Fn::Sub'][0]).toContain('pod_complete_${EnvSuffix}_${RandomSuffix}');
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('lambda');
    });

    test('should have ErrorTopic with correct properties', () => {
      const topic = template.Resources.ErrorTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toBeDefined();
      expect(topic.Properties.TopicName['Fn::Sub'][0]).toContain('pod_error_${EnvSuffix}_${RandomSuffix}');
    });
  });

  describe('Lambda Permissions', () => {
    test('should have LambdaInvokePermission with correct properties', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn['Fn::Sub']).toBe('arn:aws:s3:::pod-in-${EnvironmentSuffix}-${AWS::AccountId}');
      expect(permission.Properties.SourceAccount).toEqual({
        "Ref": "AWS::AccountId"
      });
    });

    test('should have SNSInvokePermission with correct properties', () => {
      const permission = template.Resources.SNSInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('sns.amazonaws.com');
    });
  });

  describe('CloudFront Distribution', () => {
    test('should have CloudFrontDistribution with correct properties', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution).toBeDefined();
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      
      const config = distribution.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
      expect(config.Origins).toHaveLength(2);
      expect(config.PriceClass).toBe('PriceClass_100');
    });

    test('should have CloudFrontOriginAccessIdentity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(oai.Properties.CloudFrontOriginAccessIdentityConfig.Comment)
        .toBe('OAI for podcast content');
    });

    test('CloudFront should have correct origins', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      
      expect(origins[0].Id).toBe('OutputS3Origin');
      expect(origins[1].Id).toBe('RssS3Origin');
      
      expect(origins[0].S3OriginConfig).toBeDefined();
      expect(origins[1].S3OriginConfig).toBeDefined();
    });

    test('CloudFront should have correct cache behaviors', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const config = distribution.Properties.DistributionConfig;
      
      expect(config.DefaultCacheBehavior.TargetOriginId).toBe('OutputS3Origin');
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      
      expect(config.CacheBehaviors).toHaveLength(1);
      expect(config.CacheBehaviors[0].PathPattern).toBe('*/feed.xml');
      expect(config.CacheBehaviors[0].TargetOriginId).toBe('RssS3Origin');
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have OutputBucketPolicy with correct properties', () => {
      const policy = template.Resources.OutputBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Principal.CanonicalUser).toEqual({
        "Fn::GetAtt": ["CloudFrontOriginAccessIdentity", "S3CanonicalUserId"]
      });
    });

    test('should have RssBucketPolicy with correct properties', () => {
      const policy = template.Resources.RssBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
    });
  });

  describe('CloudWatch Alarm', () => {
    test('should have MetricsAlarm with correct properties', () => {
      const alarm = template.Resources.MetricsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toBeDefined();
      expect(alarm.Properties.AlarmName['Fn::Sub'][0]).toContain('PodErrors-${EnvSuffix}${RandomSuffix}');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('MetricsAlarm should monitor ProcessingLambda', () => {
      const alarm = template.Resources.MetricsAlarm;
      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('FunctionName');
      expect(dimension.Value).toEqual({
        "Ref": "ProcessingLambda"
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'UploadBucketName',
        'CloudFrontDomain', 
        'RssFeedUrl'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('UploadBucketName output should be correct', () => {
      const output = template.Outputs.UploadBucketName;
      expect(output.Description).toBe('Name of S3 bucket for podcast uploads');
      expect(output.Value).toEqual({ Ref: 'InputBucket' });
    });

    test('CloudFrontDomain output should be correct', () => {
      const output = template.Outputs.CloudFrontDomain;
      expect(output.Description).toBe('Domain name for the CloudFront distribution');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
      });
    });

    test('RssFeedUrl output should be correct', () => {
      const output = template.Outputs.RssFeedUrl;
      expect(output.Description).toBe('Base URL for RSS feeds');
      expect(output.Value['Fn::Join']).toBeDefined();
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all expected resources', () => {
      const expectedResources = [
        'InputBucket', 'OutputBucket', 'RssBucket',
        'PodcastMetadataTable', 'MediaConvertRole', 'ProcessingLambdaRole',
        'RssGeneratorLambdaRole', 'CompletionTopic', 'ErrorTopic',
        'LambdaInvokePermission', 'SNSInvokePermission', 'ProcessingLambda',
        'RssGeneratorLambda', 'CloudFrontOriginAccessIdentity',
        'OutputBucketPolicy', 'RssBucketPolicy', 'CloudFrontDistribution',
        'MetricsAlarm'
      ];
      
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
      
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResources.length);
    });

    test('should have exactly six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Dependencies', () => {
    test('InputBucket should not have circular dependencies', () => {
      const bucket = template.Resources.InputBucket;
      // Circular dependencies have been resolved - InputBucket no longer depends on LambdaInvokePermission
      expect(bucket.DependsOn).toBeUndefined();
    });

    test('Lambda roles should have proper trust relationships', () => {
      const processingRole = template.Resources.ProcessingLambdaRole;
      const rssRole = template.Resources.RssGeneratorLambdaRole;
      const mediaConvertRole = template.Resources.MediaConvertRole;
      
      expect(processingRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('lambda.amazonaws.com');
      expect(rssRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('lambda.amazonaws.com');
      expect(mediaConvertRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('mediaconvert.amazonaws.com');
    });

    test('should have proper resource references', () => {
      const processingLambda = template.Resources.ProcessingLambda;
      const rssLambda = template.Resources.RssGeneratorLambda;
      const completionTopic = template.Resources.CompletionTopic;
      
      // ProcessingLambda should reference MediaConvertRole
      expect(processingLambda.Properties.Environment.Variables.MC_ROLE)
        .toEqual({ "Fn::GetAtt": ["MediaConvertRole", "Arn"] });
        
      // CompletionTopic should reference RssGeneratorLambda
      expect(completionTopic.Properties.Subscription[0].Endpoint)
        .toEqual({ "Fn::GetAtt": ["RssGeneratorLambda", "Arn"] });
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have CORS configuration', () => {
      const inputBucket = template.Resources.InputBucket;
      const outputBucket = template.Resources.OutputBucket;
      
      expect(inputBucket.Properties.CorsConfiguration).toBeDefined();
      expect(outputBucket.Properties.CorsConfiguration).toBeDefined();
      
      const inputCors = inputBucket.Properties.CorsConfiguration.CorsRules[0];
      expect(inputCors.AllowedMethods).toContain('GET');
      expect(inputCors.AllowedMethods).toContain('PUT');
      expect(inputCors.AllowedMethods).toContain('POST');
    });

    test('Lambda functions should have timeout configured', () => {
      const processingLambda = template.Resources.ProcessingLambda;
      const rssLambda = template.Resources.RssGeneratorLambda;
      
      expect(processingLambda.Properties.Timeout).toBe(120);
      expect(rssLambda.Properties.Timeout).toBe(60);
    });

    test('IAM roles should have least privilege policies', () => {
      const processingRole = template.Resources.ProcessingLambdaRole;
      const rssRole = template.Resources.RssGeneratorLambdaRole;
      
      const processingPolicy = processingRole.Properties.Policies[0].PolicyDocument;
      const rssPolicy = rssRole.Properties.Policies[0].PolicyDocument;
      
      // ProcessingLambda should only have necessary permissions
      expect(processingPolicy.Statement.some((s: any) => {
        const hasS3GetAction = Array.isArray(s.Action) ? s.Action.includes('s3:GetObject') : s.Action === 's3:GetObject';
        const hasInputBucketResource = s.Resource && Array.isArray(s.Resource) && 
          s.Resource.some((r: any) => r && typeof r === 'object' && r['Fn::Sub'] && r['Fn::Sub'].includes('pod-in-'));
        return hasS3GetAction && hasInputBucketResource;
      })).toBe(true);
      
      // RssGeneratorLambda should only have DynamoDB read and S3 write to RSS bucket
      expect(rssPolicy.Statement.some((s: any) => 
        Array.isArray(s.Action) ? s.Action.includes('dynamodb:Query') : s.Action === 'dynamodb:Query'
      )).toBe(true);
      expect(rssPolicy.Statement.some((s: any) => {
        const hasS3PutAction = Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject';
        const hasRssBucketResource = s.Resource && Array.isArray(s.Resource) && 
          s.Resource.some((r: any) => r && typeof r === 'object' && r['Fn::Sub'] && r['Fn::Sub'].includes('pod-rss-'));
        return hasS3PutAction && hasRssBucketResource;
      })).toBe(true);
    });
  });
});
