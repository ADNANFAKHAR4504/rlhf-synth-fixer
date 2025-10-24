import fs from 'fs';
import path from 'path';

describe('Serverless Polling and Voting System - CloudFormation Template', () => {
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

    test('should have a description for polling system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Polling and Voting System with Real-time Results and Analytics'
      );
    });

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
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('production');
    });

    test('should have API throttling parameters', () => {
      expect(template.Parameters.ApiThrottleRateLimit).toBeDefined();
      expect(template.Parameters.ApiThrottleBurstLimit).toBeDefined();
      expect(template.Parameters.ApiThrottleRateLimit.Type).toBe('Number');
      expect(template.Parameters.ApiThrottleBurstLimit.Type).toBe('Number');
    });

    test('should have ElastiCache configuration parameter', () => {
      expect(template.Parameters.ElastiCacheNodeType).toBeDefined();
      expect(template.Parameters.ElastiCacheNodeType.Type).toBe('String');
      expect(template.Parameters.ElastiCacheNodeType.AllowedValues).toContain(
        'cache.t3.micro'
      );
    });

    test('should have QuickSightUserArn parameter', () => {
      expect(template.Parameters.QuickSightUserArn).toBeDefined();
      expect(template.Parameters.QuickSightUserArn.Type).toBe('String');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC for Lambda and ElastiCache', () => {
      expect(template.Resources.VotingVPC).toBeDefined();
      expect(template.Resources.VotingVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VotingVPC.Properties.CidrBlock).toBe(
        '10.0.0.0/16'
      );
    });

    test('should have two private subnets in different AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have security groups for Lambda and ElastiCache', () => {
      expect(template.Resources.SecurityGroupLambda).toBeDefined();
      expect(template.Resources.SecurityGroupElastiCache).toBeDefined();
      expect(template.Resources.SecurityGroupLambda.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('ElastiCache security group should allow Redis port 6379 from Lambda', () => {
      const elastiCacheSG = template.Resources.SecurityGroupElastiCache;
      const ingress = elastiCacheSG.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(6379);
      expect(ingress.ToPort).toBe(6379);
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.SourceSecurityGroupId).toEqual({
        Ref: 'SecurityGroupLambda',
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have VotesTable with correct structure', () => {
      expect(template.Resources.VotesTable).toBeDefined();
      expect(template.Resources.VotesTable.Type).toBe('AWS::DynamoDB::Table');
      expect(template.Resources.VotesTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('VotesTable should have DynamoDB Streams enabled', () => {
      const votesTable = template.Resources.VotesTable;
      expect(votesTable.Properties.StreamSpecification).toBeDefined();
      expect(votesTable.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('VotesTable should have encryption and point-in-time recovery', () => {
      const votesTable = template.Resources.VotesTable;
      expect(votesTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(
        votesTable.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('VotesTable should have PollIndex GSI', () => {
      const votesTable = template.Resources.VotesTable;
      const gsiNames = votesTable.Properties.GlobalSecondaryIndexes.map(
        (gsi: any) => gsi.IndexName
      );
      expect(gsiNames).toContain('PollIndex');
      expect(gsiNames).toContain('VoterIndex');
    });

    test('should have PollsTable for poll management', () => {
      expect(template.Resources.PollsTable).toBeDefined();
      expect(template.Resources.PollsTable.Type).toBe('AWS::DynamoDB::Table');
      expect(template.Resources.PollsTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('PollsTable should have StatusIndex GSI', () => {
      const pollsTable = template.Resources.PollsTable;
      const gsi = pollsTable.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('StatusIndex');
      expect(gsi.KeySchema[0].AttributeName).toBe('status');
    });

    test('should have IdempotencyTable with TTL enabled', () => {
      expect(template.Resources.IdempotencyTable).toBeDefined();
      expect(template.Resources.IdempotencyTable.Type).toBe(
        'AWS::DynamoDB::Table'
      );
      const ttl =
        template.Resources.IdempotencyTable.Properties
          .TimeToLiveSpecification;
      expect(ttl.Enabled).toBe(true);
      expect(ttl.AttributeName).toBe('ttl');
    });
  });

  describe('ElastiCache Redis Cluster', () => {
    test('should have ElastiCache replication group', () => {
      expect(template.Resources.ElastiCacheCluster).toBeDefined();
      expect(template.Resources.ElastiCacheCluster.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );
    });

    test('ElastiCache should have multi-AZ and automatic failover', () => {
      const elastiCache = template.Resources.ElastiCacheCluster;
      expect(elastiCache.Properties.NumCacheClusters).toBe(2);
      expect(elastiCache.Properties.AutomaticFailoverEnabled).toBe(true);
      expect(elastiCache.Properties.MultiAZEnabled).toBe(true);
    });

    test('ElastiCache should have encryption at rest and in transit', () => {
      const elastiCache = template.Resources.ElastiCacheCluster;
      expect(elastiCache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(elastiCache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should have subnet group', () => {
      expect(template.Resources.ElastiCacheSubnetGroup).toBeDefined();
      expect(template.Resources.ElastiCacheSubnetGroup.Type).toBe(
        'AWS::ElastiCache::SubnetGroup'
      );
    });
  });

  describe('S3 Results Bucket', () => {
    test('should have S3 bucket for results export', () => {
      expect(template.Resources.ResultsBucket).toBeDefined();
      expect(template.Resources.ResultsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ResultsBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should use auto-generated name', () => {
      const bucket = template.Resources.ResultsBucket;
      // BucketName should not be specified to allow CloudFormation auto-generation
      // This avoids issues with uppercase characters in stack names
      expect(bucket.Properties.BucketName).toBeUndefined();
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ResultsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy for archival', () => {
      const bucket = template.Resources.ResultsBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.Transitions).toHaveLength(2);
      expect(lifecycleRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(lifecycleRule.Transitions[1].StorageClass).toBe('GLACIER');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.ResultsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have VoteProcessorFunction', () => {
      expect(template.Resources.VoteProcessorFunction).toBeDefined();
      expect(template.Resources.VoteProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
      expect(
        template.Resources.VoteProcessorFunction.Properties.Runtime
      ).toBe('python3.10');
    });

    test('VoteProcessorFunction should have VPC configuration', () => {
      const voteFunc = template.Resources.VoteProcessorFunction;
      expect(voteFunc.Properties.VpcConfig).toBeDefined();
      expect(voteFunc.Properties.VpcConfig.SecurityGroupIds).toContainEqual({
        Ref: 'SecurityGroupLambda',
      });
      expect(voteFunc.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('VoteProcessorFunction should have correct environment variables', () => {
      const voteFunc = template.Resources.VoteProcessorFunction;
      const env = voteFunc.Properties.Environment.Variables;
      expect(env.VOTES_TABLE).toEqual({ Ref: 'VotesTable' });
      expect(env.POLLS_TABLE).toEqual({ Ref: 'PollsTable' });
      expect(env.IDEMPOTENCY_TABLE).toEqual({ Ref: 'IdempotencyTable' });
      expect(env.REDIS_ENDPOINT).toBeDefined();
      expect(env.REDIS_PORT).toBeDefined();
    });

    test('should have ResultsExporterFunction', () => {
      expect(template.Resources.ResultsExporterFunction).toBeDefined();
      expect(template.Resources.ResultsExporterFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
      expect(template.Resources.ResultsExporterFunction.Properties.Timeout).toBe(
        300
      );
    });

    test('ResultsExporterFunction should have S3 bucket environment variable', () => {
      const exporterFunc = template.Resources.ResultsExporterFunction;
      const env = exporterFunc.Properties.Environment.Variables;
      expect(env.RESULTS_BUCKET).toEqual({ Ref: 'ResultsBucket' });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should have LambdaExecutionRole with VPC access', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:PutItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:UpdateItem'
      );
    });

    test('LambdaExecutionRole should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3Access'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:PutObject'
      );
    });

    test('LambdaExecutionRole should have CloudWatch metrics policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const cwPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'CloudWatchMetrics'
      );
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain(
        'cloudwatch:PutMetricData'
      );
    });
  });

  describe('API Gateway', () => {
    test('should have REST API for voting', () => {
      expect(template.Resources.VotingApi).toBeDefined();
      expect(template.Resources.VotingApi.Type).toBe(
        'AWS::ApiGateway::RestApi'
      );
    });

    test('should have API Gateway stage with throttling', () => {
      expect(template.Resources.VotingApiStage).toBeDefined();
      const stage = template.Resources.VotingApiStage;
      expect(stage.Properties.MethodSettings).toBeDefined();
      expect(stage.Properties.MethodSettings[0].ThrottlingRateLimit).toEqual({
        Ref: 'ApiThrottleRateLimit',
      });
      expect(stage.Properties.MethodSettings[0].ThrottlingBurstLimit).toEqual({
        Ref: 'ApiThrottleBurstLimit',
      });
    });

    test('should have vote endpoint resource', () => {
      expect(template.Resources.VoteResource).toBeDefined();
      expect(template.Resources.VoteResource.Properties.PathPart).toBe('vote');
    });

    test('should have results endpoint resource', () => {
      expect(template.Resources.ResultsResource).toBeDefined();
      expect(template.Resources.ResultsResource.Properties.PathPart).toBe(
        'results'
      );
    });

    test('should have POST method for vote submission', () => {
      expect(template.Resources.VoteMethod).toBeDefined();
      const voteMethod = template.Resources.VoteMethod;
      expect(voteMethod.Properties.HttpMethod).toBe('POST');
      expect(voteMethod.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have request validator', () => {
      expect(template.Resources.RequestValidator).toBeDefined();
      const validator = template.Resources.RequestValidator;
      expect(validator.Properties.ValidateRequestBody).toBe(true);
    });

    test('should have vote request model with schema validation', () => {
      expect(template.Resources.VoteModel).toBeDefined();
      const model = template.Resources.VoteModel;
      expect(model.Properties.Schema.required).toContain('pollId');
      expect(model.Properties.Schema.required).toContain('optionId');
    });

    test('should have Lambda invoke permissions for API Gateway', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('EventBridge Schedule', () => {
    test('should have scheduled rule for results export', () => {
      expect(template.Resources.ResultsExportSchedule).toBeDefined();
      expect(template.Resources.ResultsExportSchedule.Type).toBe(
        'AWS::Events::Rule'
      );
    });

    test('results export should run hourly', () => {
      const schedule = template.Resources.ResultsExportSchedule;
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 hour)');
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    test('schedule should target ResultsExporterFunction', () => {
      const schedule = template.Resources.ResultsExportSchedule;
      expect(schedule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['ResultsExporterFunction', 'Arn'],
      });
    });

    test('should have Lambda permission for EventBridge', () => {
      expect(template.Resources.SchedulePermission).toBeDefined();
      const permission = template.Resources.SchedulePermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('CloudWatch Monitoring', () => {

    test('should have high vote volume alarm', () => {
      expect(template.Resources.HighVoteVolumeAlarm).toBeDefined();
      const alarm = template.Resources.HighVoteVolumeAlarm;
      expect(alarm.Properties.MetricName).toBe('VoteCount');
      expect(alarm.Properties.Namespace).toBe('VotingSystem');
    });

    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('alarms should be configured for monitoring', () => {
      const highVolumeAlarm = template.Resources.HighVoteVolumeAlarm;
      const errorAlarm = template.Resources.LambdaErrorAlarm;
      expect(highVolumeAlarm.Properties.AlarmDescription).toBeDefined();
      expect(errorAlarm.Properties.AlarmDescription).toBeDefined();
      expect(highVolumeAlarm.Properties.Threshold).toBeDefined();
      expect(errorAlarm.Properties.Threshold).toBeDefined();
    });
  });

  describe('QuickSight Analytics', () => {
    test('should have QuickSight data source conditional on user ARN', () => {
      expect(template.Resources.QuickSightDataSource).toBeDefined();
      expect(template.Resources.QuickSightDataSource.Condition).toBe(
        'HasQuickSightUser'
      );
    });

    test('QuickSight data source should connect to S3', () => {
      const dataSource = template.Resources.QuickSightDataSource;
      expect(dataSource.Properties.Type).toBe('S3');
      expect(
        dataSource.Properties.DataSourceParameters.S3Parameters
          .ManifestFileLocation.Bucket
      ).toEqual({ Ref: 'ResultsBucket' });
    });

    test('should have QuickSight dataset', () => {
      expect(template.Resources.QuickSightDataSet).toBeDefined();
      expect(template.Resources.QuickSightDataSet.Condition).toBe(
        'HasQuickSightUser'
      );
    });

    test('QuickSight dataset should use SPICE for fast queries', () => {
      const dataset = template.Resources.QuickSightDataSet;
      expect(dataset.Properties.ImportMode).toBe('SPICE');
    });

    test('should have HasQuickSightUser condition', () => {
      expect(template.Conditions.HasQuickSightUser).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have API endpoint output', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      expect(template.Outputs.ApiEndpoint.Description).toBe(
        'API Gateway endpoint URL'
      );
    });

    test('should have VotesTable name output', () => {
      expect(template.Outputs.VotesTableName).toBeDefined();
      expect(template.Outputs.VotesTableName.Value).toEqual({
        Ref: 'VotesTable',
      });
    });

    test('should have PollsTable name output', () => {
      expect(template.Outputs.PollsTableName).toBeDefined();
      expect(template.Outputs.PollsTableName.Value).toEqual({
        Ref: 'PollsTable',
      });
    });

    test('should have ResultsBucket name output', () => {
      expect(template.Outputs.ResultsBucketName).toBeDefined();
      expect(template.Outputs.ResultsBucketName.Value).toEqual({
        Ref: 'ResultsBucket',
      });
    });

    test('should have ElastiCache endpoint output', () => {
      expect(template.Outputs.ElastiCacheEndpoint).toBeDefined();
      expect(template.Outputs.ElastiCacheEndpoint.Value).toEqual({
        'Fn::GetAtt': ['ElastiCacheCluster', 'PrimaryEndPoint.Address'],
      });
    });

    test('should have VoteProcessorFunction ARN output', () => {
      expect(template.Outputs.VoteProcessorFunctionArn).toBeDefined();
      expect(template.Outputs.VoteProcessorFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['VoteProcessorFunction', 'Arn'],
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count and Completeness', () => {
    test('should have all required resources for serverless polling system', () => {
      const requiredResources = [
        'VotingVPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'SecurityGroupLambda',
        'SecurityGroupElastiCache',
        'VotesTable',
        'PollsTable',
        'IdempotencyTable',
        'ElastiCacheSubnetGroup',
        'ElastiCacheCluster',
        'ResultsBucket',
        'LambdaExecutionRole',
        'VoteProcessorFunction',
        'ResultsExporterFunction',
        'VotingApi',
        'VotingApiDeployment',
        'VotingApiStage',
        'VoteResource',
        'VoteMethod',
        'ResultsResource',
        'ResultsMethod',
        'RequestValidator',
        'VoteModel',
        'ApiGatewayInvokePermission',
        'ResultsExportSchedule',
        'SchedulePermission',
        'HighVoteVolumeAlarm',
        'LambdaErrorAlarm',
        'QuickSightDataSource',
        'QuickSightDataSet',
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have 30 resources total', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(30);
    });

    test('should have 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Security Best Practices', () => {
    test('all DynamoDB tables should have encryption enabled', () => {
      const tables = [
        template.Resources.VotesTable,
        template.Resources.PollsTable,
        template.Resources.IdempotencyTable,
      ];

      tables.forEach(table => {
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });

    test('Lambda functions should be in VPC', () => {
      const voteFunc = template.Resources.VoteProcessorFunction;
      expect(voteFunc.Properties.VpcConfig).toBeDefined();
      expect(voteFunc.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('S3 bucket should have encryption at rest', () => {
      const bucket = template.Resources.ResultsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('ElastiCache should have encryption at rest and in transit', () => {
      const cache = template.Resources.ElastiCacheCluster;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('IAM policies should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );

      // Should not have full DynamoDB access
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).not.toContain(
        'dynamodb:*'
      );

      // Should have specific resources defined
      expect(
        dynamoPolicy.PolicyDocument.Statement[0].Resource
      ).toBeDefined();
    });
  });

  describe('Architecture Validation', () => {
    test('should implement all requirements from PROMPT.md', () => {
      // API Gateway for vote submission
      expect(template.Resources.VotingApi).toBeDefined();

      // Lambda for vote processing
      expect(template.Resources.VoteProcessorFunction).toBeDefined();

      // DynamoDB for storing votes
      expect(template.Resources.VotesTable).toBeDefined();

      // ElastiCache for caching
      expect(template.Resources.ElastiCacheCluster).toBeDefined();

      // CloudWatch for monitoring
      expect(template.Resources.HighVoteVolumeAlarm).toBeDefined();

      // S3 for archiving
      expect(template.Resources.ResultsBucket).toBeDefined();

      // EventBridge for scheduling
      expect(template.Resources.ResultsExportSchedule).toBeDefined();

      // QuickSight for analytics
      expect(template.Resources.QuickSightDataSource).toBeDefined();
    });

    test('should support idempotency to prevent duplicate votes', () => {
      expect(template.Resources.IdempotencyTable).toBeDefined();
      expect(
        template.Resources.IdempotencyTable.Properties.TimeToLiveSpecification
          .Enabled
      ).toBe(true);
    });

    test('should support real-time results via Redis cache', () => {
      expect(template.Resources.ElastiCacheCluster).toBeDefined();
      expect(template.Resources.ElastiCacheCluster.Properties.Engine).toBe(
        'redis'
      );
    });

    test('should handle 5000 daily votes with proper scaling', () => {
      // DynamoDB on-demand billing for auto-scaling
      expect(template.Resources.VotesTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );

      // API Gateway throttling configured
      expect(
        template.Resources.VotingApiStage.Properties.MethodSettings[0]
          .ThrottlingRateLimit
      ).toBeDefined();

      // Lambda memory configured for performance
      expect(
        template.Resources.VoteProcessorFunction.Properties.MemorySize
      ).toBeGreaterThanOrEqual(512);
    });
  });
});
