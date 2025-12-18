import fs from 'fs';
import path from 'path';

describe('Fitness Tracking Backend CloudFormation Template - LocalStack Compatible', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Fitness Tracking Backend Infrastructure - LocalStack Compatible');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasNotificationEmail).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {
    test('should have exactly 5 parameters (LocalStack compatible)', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(5);
    });

    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'ApiName',
        'DynamoDBReadCapacity',
        'DynamoDBWriteCapacity',
        'NotificationEmail'
      ];
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('should NOT have removed parameters (for LocalStack compatibility)', () => {
      expect(template.Parameters.RedisNodeType).toBeUndefined();
      expect(template.Parameters.CognitoSocialProvider).toBeUndefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
    });

    test('ApiName parameter should have correct properties', () => {
      const param = template.Parameters.ApiName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('FitnessAPI');
      expect(param.Description).toBe('Name of the API Gateway');
    });

    test('DynamoDB capacity parameters should have correct properties', () => {
      const readParam = template.Parameters.DynamoDBReadCapacity;
      const writeParam = template.Parameters.DynamoDBWriteCapacity;
      
      expect(readParam.Type).toBe('Number');
      expect(readParam.Default).toBe(5);
      expect(readParam.MinValue).toBe(1);
      expect(readParam.MaxValue).toBe(100);
      
      expect(writeParam.Type).toBe('Number');
      expect(writeParam.Default).toBe(5);
      expect(writeParam.MinValue).toBe(1);
      expect(writeParam.MaxValue).toBe(100);
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('test@example.com');
      expect(param.Description).toBe('Email for SNS notifications');
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.FitnessVPC).toBeDefined();
      expect(template.Resources.FitnessVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.FitnessVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have required subnets (simplified for LocalStack)', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
    });

    test('should NOT have second public subnet (removed for LocalStack)', () => {
      expect(template.Resources.PublicSubnet2).toBeUndefined();
    });

    test('Private subnets should have correct properties', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('Public subnet should have correct properties', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should NOT have NAT Gateways (removed for LocalStack)', () => {
      expect(template.Resources.NATGateway1).toBeUndefined();
      expect(template.Resources.NATGateway2).toBeUndefined();
      expect(template.Resources.NATGateway1EIP).toBeUndefined();
      expect(template.Resources.NATGateway2EIP).toBeUndefined();
    });

    test('should have simplified route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('should NOT have second private route table (simplified)', () => {
      expect(template.Resources.PrivateRouteTable2).toBeUndefined();
      expect(template.Resources.PrivateRoute1).toBeUndefined();
      expect(template.Resources.PrivateRoute2).toBeUndefined();
    });
  });

  describe('Security Resources', () => {
    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should NOT have Redis security group (ElastiCache removed)', () => {
      expect(template.Resources.RedisSecurityGroup).toBeUndefined();
    });

    test('LambdaSecurityGroup should have correct properties', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.GroupDescription).toBe('Security group for Lambda functions');
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have KMS key and alias', () => {
      expect(template.Resources.FitnessKMSKey).toBeDefined();
      expect(template.Resources.FitnessKMSKeyAlias).toBeDefined();
      expect(template.Resources.FitnessKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.FitnessKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have simplified key policy (LocalStack compatible)', () => {
      const keyPolicy = template.Resources.FitnessKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
    });

    test('KMS alias should reference the key', () => {
      const alias = template.Resources.FitnessKMSKeyAlias;
      expect(alias.Properties.AliasName).toBe('alias/fitness-tracker-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'FitnessKMSKey' });
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have both DynamoDB tables', () => {
      expect(template.Resources.UserProfilesTable).toBeDefined();
      expect(template.Resources.WorkoutHistoryTable).toBeDefined();
    });

    test('UserProfilesTable should have correct properties', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${AWS::StackName}-UserProfiles'
      });
    });

    test('UserProfilesTable should have SSE encryption with KMS', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'FitnessKMSKey' });
    });

    test('UserProfilesTable should have correct key schema', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' }
      ]);
    });

    test('UserProfilesTable should have EmailIndex GSI', () => {
      const table = template.Resources.UserProfilesTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toHaveLength(1);
      expect(gsis[0].IndexName).toBe('EmailIndex');
    });

    test('WorkoutHistoryTable should have correct properties', () => {
      const table = template.Resources.WorkoutHistoryTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${AWS::StackName}-WorkoutHistory'
      });
    });

    test('WorkoutHistoryTable should have SSE encryption with KMS', () => {
      const table = template.Resources.WorkoutHistoryTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'FitnessKMSKey' });
    });

    test('WorkoutHistoryTable should have correct key schema', () => {
      const table = template.Resources.WorkoutHistoryTable;
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'workoutTimestamp', KeyType: 'RANGE' }
      ]);
    });

    test('WorkoutHistoryTable should have two GSIs', () => {
      const table = template.Resources.WorkoutHistoryTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toHaveLength(2);
      expect(gsis[0].IndexName).toBe('WorkoutTypeIndex');
      expect(gsis[1].IndexName).toBe('UserDateIndex');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.FitnessAssetsBucket).toBeDefined();
      expect(template.Resources.FitnessAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct properties', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      expect(bucket.Properties.BucketName).toBe('fitness-assets-cfn');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have KMS encryption', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket should have public access block', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Cognito Resources', () => {
    test('should have Cognito User Pool and Client', () => {
      expect(template.Resources.FitnessUserPool).toBeDefined();
      expect(template.Resources.FitnessUserPoolClient).toBeDefined();
    });

    test('User Pool should have correct properties', () => {
      const pool = template.Resources.FitnessUserPool;
      expect(pool.Type).toBe('AWS::Cognito::UserPool');
      expect(pool.Properties.UserPoolName).toEqual({
        'Fn::Sub': '${AWS::StackName}-UserPool'
      });
      expect(pool.Properties.UsernameAttributes).toEqual(['email']);
      expect(pool.Properties.AutoVerifiedAttributes).toEqual(['email']);
    });

    test('User Pool password policy should be simplified (LocalStack compatible)', () => {
      const pool = template.Resources.FitnessUserPool;
      const policy = pool.Properties.Policies.PasswordPolicy;
      expect(policy.MinimumLength).toBe(8);
      expect(policy.RequireUppercase).toBe(true);
      expect(policy.RequireLowercase).toBe(true);
      expect(policy.RequireNumbers).toBe(true);
      expect(policy.RequireSymbols).toBe(false); // Simplified for LocalStack
    });

    test('User Pool Client should have correct properties', () => {
      const client = template.Resources.FitnessUserPoolClient;
      expect(client.Type).toBe('AWS::Cognito::UserPoolClient');
      expect(client.Properties.ClientName).toEqual({
        'Fn::Sub': '${AWS::StackName}-AppClient'
      });
      expect(client.Properties.GenerateSecret).toBe(false);
    });

    test('User Pool Client should NOT have advanced features (LocalStack)', () => {
      const client = template.Resources.FitnessUserPoolClient;
      expect(client.Properties.PreventUserExistenceErrors).toBeUndefined();
      expect(client.Properties.SupportedIdentityProviders).toBeUndefined();
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic and subscription', () => {
      expect(template.Resources.AchievementTopic).toBeDefined();
      expect(template.Resources.EmailSubscription).toBeDefined();
    });

    test('SNS topic should have correct properties', () => {
      const topic = template.Resources.AchievementTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': '${AWS::StackName}-Achievements'
      });
      expect(topic.Properties.DisplayName).toBe('Fitness Achievement Notifications');
    });

    test('SNS topic should NOT have KMS encryption (removed for LocalStack)', () => {
      const topic = template.Resources.AchievementTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
    });

    test('Email subscription should be conditional', () => {
      const sub = template.Resources.EmailSubscription;
      expect(sub.Type).toBe('AWS::SNS::Subscription');
      expect(sub.Condition).toBe('HasNotificationEmail');
      expect(sub.Properties.Protocol).toBe('email');
    });
  });

  describe('IAM Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should use BasicExecutionRole (not VPC, for LocalStack)', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(managedPolicies).not.toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda role should have DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const dynamoStatement = policy.Statement.find((s: any) => 
        s.Action.some((a: string) => a.startsWith('dynamodb:'))
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Effect).toBe('Allow');
    });

    test('Lambda role should have S3 permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((s: any) => 
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Lambda role should have SNS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const snsStatement = policy.Statement.find((s: any) => 
        s.Action.some((a: string) => a.startsWith('sns:'))
      );
      expect(snsStatement).toBeDefined();
    });

    test('Lambda role should NOT have ElastiCache permissions (removed)', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const cacheStatement = policy.Statement.find((s: any) => 
        s.Action && s.Action.some((a: string) => a.startsWith('elasticache:'))
      );
      expect(cacheStatement).toBeUndefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have both Lambda functions', () => {
      expect(template.Resources.WorkoutProcessingFunction).toBeDefined();
      expect(template.Resources.LeaderboardFunction).toBeDefined();
    });

    test('WorkoutProcessingFunction should have correct properties', () => {
      const lambda = template.Resources.WorkoutProcessingFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('Lambda functions should NOT have VPC config (removed for LocalStack)', () => {
      const lambda1 = template.Resources.WorkoutProcessingFunction;
      const lambda2 = template.Resources.LeaderboardFunction;
      expect(lambda1.Properties.VpcConfig).toBeUndefined();
      expect(lambda2.Properties.VpcConfig).toBeUndefined();
    });

    test('WorkoutProcessingFunction should have correct environment variables', () => {
      const lambda = template.Resources.WorkoutProcessingFunction;
      const env = lambda.Properties.Environment.Variables;
      expect(env.USER_PROFILES_TABLE).toEqual({ Ref: 'UserProfilesTable' });
      expect(env.WORKOUT_HISTORY_TABLE).toEqual({ Ref: 'WorkoutHistoryTable' });
      expect(env.ACHIEVEMENT_TOPIC_ARN).toEqual({ Ref: 'AchievementTopic' });
      expect(env.ASSETS_BUCKET).toEqual({ Ref: 'FitnessAssetsBucket' });
    });

    test('Lambda functions should NOT have REDIS_ENDPOINT (removed)', () => {
      const lambda1 = template.Resources.WorkoutProcessingFunction;
      const lambda2 = template.Resources.LeaderboardFunction;
      expect(lambda1.Properties.Environment.Variables.REDIS_ENDPOINT).toBeUndefined();
      expect(lambda2.Properties.Environment.Variables.REDIS_ENDPOINT).toBeUndefined();
    });

    test('Lambda functions should have inline code', () => {
      const lambda1 = template.Resources.WorkoutProcessingFunction;
      const lambda2 = template.Resources.LeaderboardFunction;
      expect(lambda1.Properties.Code.ZipFile).toBeDefined();
      expect(lambda2.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda1.Properties.Code.ZipFile).toBe('string');
      expect(typeof lambda2.Properties.Code.ZipFile).toBe('string');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.FitnessAPI).toBeDefined();
      expect(template.Resources.FitnessAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('API should have correct properties', () => {
      const api = template.Resources.FitnessAPI;
      expect(api.Properties.Name).toEqual({ Ref: 'ApiName' });
      expect(api.Properties.Description).toBe('Fitness Tracking Mobile API');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have API resources and methods', () => {
      expect(template.Resources.WorkoutResource).toBeDefined();
      expect(template.Resources.WorkoutMethod).toBeDefined();
      expect(template.Resources.LeaderboardResource).toBeDefined();
      expect(template.Resources.LeaderboardMethod).toBeDefined();
    });

    test('should have Cognito authorizer', () => {
      expect(template.Resources.ApiAuthorizer).toBeDefined();
      expect(template.Resources.ApiAuthorizer.Type).toBe('AWS::ApiGateway::Authorizer');
      expect(template.Resources.ApiAuthorizer.Properties.Type).toBe('COGNITO_USER_POOLS');
    });

    test('should have API deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(template.Resources.ApiDeployment.Properties.StageName).toBe('dev');
    });

    test('should have Lambda permissions for API Gateway', () => {
      expect(template.Resources.WorkoutLambdaPermission).toBeDefined();
      expect(template.Resources.LeaderboardLambdaPermission).toBeDefined();
    });

    test('WorkoutMethod should use Cognito authorization', () => {
      const method = template.Resources.WorkoutMethod;
      expect(method.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
      expect(method.Properties.AuthorizerId).toEqual({ Ref: 'ApiAuthorizer' });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have basic CloudWatch alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should NOT have CloudWatch Dashboard (removed for LocalStack)', () => {
      expect(template.Resources.FitnessDashboard).toBeUndefined();
    });

    test('should NOT have DynamoDB throttle alarm (removed for LocalStack)', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeUndefined();
    });

    test('LambdaErrorAlarm should have correct properties', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('ElastiCache Resources (Should NOT Exist)', () => {
    test('should NOT have ElastiCache cluster (removed for LocalStack)', () => {
      expect(template.Resources.RedisCluster).toBeUndefined();
    });

    test('should NOT have ElastiCache subnet group (removed for LocalStack)', () => {
      expect(template.Resources.RedisSubnetGroup).toBeUndefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'WorkoutProcessingFunctionArn',
        'LeaderboardFunctionArn',
        'WorkoutHistoryTableName',
        'UserProfilesTableName',
        'S3BucketName',
        'CognitoUserPoolId',
        'CognitoUserPoolClientId',
        'SNSTopicArn',
        'VPCId',
        'KMSKeyId'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should NOT have Redis endpoint output (removed)', () => {
      expect(template.Outputs.RedisClusterEndpoint).toBeUndefined();
    });

    test('should NOT have Dashboard output (removed)', () => {
      expect(template.Outputs.CloudWatchDashboardName).toBeUndefined();
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${FitnessAPI}.execute-api.${AWS::Region}.amazonaws.com/dev'
      });
    });

    test('outputs should have export names', () => {
      const output = template.Outputs.WorkoutHistoryTableName;
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WorkoutHistoryTable'
      });
    });
  });

  describe('LocalStack Compatibility Checks', () => {
    test('should not contain any ElastiCache resources', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::ElastiCache::CacheCluster');
      expect(resourceTypes).not.toContain('AWS::ElastiCache::SubnetGroup');
    });

    test('should not contain NAT Gateway resources', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).not.toContain('AWS::EC2::EIP');
    });

    test('should not contain CloudWatch Dashboard', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::CloudWatch::Dashboard');
    });

    test('DynamoDB tables should have SSE encryption with KMS', () => {
      const userTable = template.Resources.UserProfilesTable;
      const workoutTable = template.Resources.WorkoutHistoryTable;
      expect(userTable.Properties.SSESpecification).toBeDefined();
      expect(userTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(userTable.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(workoutTable.Properties.SSESpecification).toBeDefined();
      expect(workoutTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(workoutTable.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('S3 bucket should have bucket encryption', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('SNS topic should not have KMS encryption', () => {
      const topic = template.Resources.AchievementTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
    });

    test('Lambda functions should not have VPC configuration', () => {
      const lambdas = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      lambdas.forEach((lambda: any) => {
        expect(lambda.Properties.VpcConfig).toBeUndefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have approximately 35 resources (LocalStack compatible)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
      expect(resourceCount).toBeLessThanOrEqual(40);
    });

    test('should have correct VPC-related resource count', () => {
      const vpcResources = Object.values(template.Resources).filter((r: any) => 
        r.Type && (r.Type.startsWith('AWS::EC2::') || r.Type === 'AWS::EC2::VPC')
      );
      expect(vpcResources.length).toBeGreaterThan(8);
    });

    test('should have 2 DynamoDB tables', () => {
      const dynamoResources = Object.values(template.Resources).filter((r: any) => 
        r.Type === 'AWS::DynamoDB::Table'
      );
      expect(dynamoResources.length).toBe(2);
    });

    test('should have 2 Lambda functions', () => {
      const lambdaResources = Object.values(template.Resources).filter((r: any) => 
        r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaResources.length).toBe(2);
    });

    test('should have 1 S3 bucket', () => {
      const s3Resources = Object.values(template.Resources).filter((r: any) => 
        r.Type === 'AWS::S3::Bucket'
      );
      expect(s3Resources.length).toBe(1);
    });

    test('should have 2 Cognito resources', () => {
      const cognitoResources = Object.values(template.Resources).filter((r: any) => 
        r.Type && r.Type.startsWith('AWS::Cognito::')
      );
      expect(cognitoResources.length).toBe(2);
    });
  });
});
