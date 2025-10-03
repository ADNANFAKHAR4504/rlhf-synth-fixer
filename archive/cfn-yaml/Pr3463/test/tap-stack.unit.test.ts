import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Fitness Tracking Backend CloudFormation Template', () => {
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
      expect(template.Description).toBe('Fitness Tracking Backend Infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(1);
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0].Label.default).toBe('Environment Configuration');
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasSocialProvider).toBeDefined();
      expect(template.Conditions.HasNotificationEmail).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'EnvironmentSuffix',
      'ApiName',
      'DynamoDBReadCapacity',
      'DynamoDBWriteCapacity',
      'CognitoSocialProvider',
      'NotificationEmail',
      'RedisNodeType'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
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

    test('RedisNodeType parameter should have correct properties', () => {
      const param = template.Parameters.RedisNodeType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cache.t3.micro');
      expect(param.AllowedValues).toEqual(['cache.t3.micro', 'cache.t3.small', 'cache.t3.medium']);
    });
  });

  describe('Network Resources', () => {
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

    test('should have all required subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('Private subnets should have correct properties', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('Public subnets should have correct properties', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateways and EIPs', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
    });

    test('should have route tables and routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute2).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.RedisSecurityGroup).toBeDefined();
    });

    test('LambdaSecurityGroup should have correct properties', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for Lambda functions');
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('RedisSecurityGroup should allow Redis port from Lambda', () => {
      const sg = template.Resources.RedisSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(6379);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(6379);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('LambdaSecurityGroup');
    });

    test('should have KMS key and alias', () => {
      expect(template.Resources.FitnessKMSKey).toBeDefined();
      expect(template.Resources.FitnessKMSKeyAlias).toBeDefined();
      expect(template.Resources.FitnessKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.FitnessKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy = template.Resources.FitnessKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);
      expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(keyPolicy.Statement[1].Sid).toBe('Allow services to use the key');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have UserProfiles table', () => {
      expect(template.Resources.UserProfilesTable).toBeDefined();
      expect(template.Resources.UserProfilesTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('UserProfiles table should have correct properties', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.AttributeDefinitions).toHaveLength(2);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('userId');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('UserProfiles table should have email GSI', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('EmailIndex');
      expect(table.Properties.GlobalSecondaryIndexes[0].KeySchema[0].AttributeName).toBe('email');
    });

    test('should have WorkoutHistory table', () => {
      expect(template.Resources.WorkoutHistoryTable).toBeDefined();
      expect(template.Resources.WorkoutHistoryTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('WorkoutHistory table should have correct properties', () => {
      const table = template.Resources.WorkoutHistoryTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(4);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('userId');
      expect(table.Properties.KeySchema[1].AttributeName).toBe('workoutTimestamp');
    });

    test('WorkoutHistory table should have correct GSIs', () => {
      const table = template.Resources.WorkoutHistoryTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(2);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('WorkoutTypeIndex');
      expect(table.Properties.GlobalSecondaryIndexes[1].IndexName).toBe('UserDateIndex');
    });

    test('DynamoDB tables should have encryption enabled', () => {
      const userTable = template.Resources.UserProfilesTable;
      const workoutTable = template.Resources.WorkoutHistoryTable;
      
      expect(userTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(userTable.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(workoutTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(workoutTable.Properties.SSESpecification.SSEType).toBe('KMS');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.FitnessAssetsBucket).toBeDefined();
      expect(template.Resources.FitnessAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct properties', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      expect(bucket.Properties.BucketName).toBe('fitness-assets-cfn');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have security configurations', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.FitnessAssetsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('FitnessKMSKey');
    });
  });

  describe('Cognito Resources', () => {
    test('should have Cognito User Pool', () => {
      expect(template.Resources.FitnessUserPool).toBeDefined();
      expect(template.Resources.FitnessUserPool.Type).toBe('AWS::Cognito::UserPool');
    });

    test('User Pool should have correct properties', () => {
      const pool = template.Resources.FitnessUserPool;
      expect(pool.Properties.UsernameAttributes).toEqual(['email']);
      expect(pool.Properties.AutoVerifiedAttributes).toEqual(['email']);
      expect(pool.Properties.Schema).toHaveLength(2);
    });

    test('User Pool should have password policy', () => {
      const policy = template.Resources.FitnessUserPool.Properties.Policies.PasswordPolicy;
      expect(policy.MinimumLength).toBe(8);
      expect(policy.RequireUppercase).toBe(true);
      expect(policy.RequireLowercase).toBe(true);
      expect(policy.RequireNumbers).toBe(true);
      expect(policy.RequireSymbols).toBe(true);
    });

    test('should have User Pool Client', () => {
      expect(template.Resources.FitnessUserPoolClient).toBeDefined();
      expect(template.Resources.FitnessUserPoolClient.Type).toBe('AWS::Cognito::UserPoolClient');
    });

    test('User Pool Client should have correct properties', () => {
      const client = template.Resources.FitnessUserPoolClient;
      expect(client.Properties.ExplicitAuthFlows).toContain('ALLOW_USER_SRP_AUTH');
      expect(client.Properties.ExplicitAuthFlows).toContain('ALLOW_REFRESH_TOKEN_AUTH');
      expect(client.Properties.GenerateSecret).toBe(false);
      expect(client.Properties.PreventUserExistenceErrors).toBe('ENABLED');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have correct policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('FitnessLambdaPolicy');
    });

    test('should have WorkoutProcessing Lambda function', () => {
      expect(template.Resources.WorkoutProcessingFunction).toBeDefined();
      expect(template.Resources.WorkoutProcessingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('WorkoutProcessing function should have correct properties', () => {
      const fn = template.Resources.WorkoutProcessingFunction;
      expect(fn.Properties.Runtime).toBe('python3.9');
      expect(fn.Properties.Handler).toBe('index.handler');
      expect(fn.Properties.Timeout).toBe(30);
      expect(fn.Properties.MemorySize).toBe(256);
    });

    test('should have Leaderboard Lambda function', () => {
      expect(template.Resources.LeaderboardFunction).toBeDefined();
      expect(template.Resources.LeaderboardFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should have correct environment variables', () => {
      const workout = template.Resources.WorkoutProcessingFunction;
      expect(workout.Properties.Environment.Variables.USER_PROFILES_TABLE.Ref).toBe('UserProfilesTable');
      expect(workout.Properties.Environment.Variables.WORKOUT_HISTORY_TABLE.Ref).toBe('WorkoutHistoryTable');
      expect(workout.Properties.Environment.Variables.REDIS_ENDPOINT['Fn::GetAtt'][0]).toBe('RedisCluster');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      expect(template.Resources.FitnessAPI).toBeDefined();
      expect(template.Resources.FitnessAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('API should have correct properties', () => {
      const api = template.Resources.FitnessAPI;
      expect(api.Properties.Name.Ref).toBe('ApiName');
      expect(api.Properties.Description).toBe('Fitness Tracking Mobile API');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have API resources and methods', () => {
      expect(template.Resources.WorkoutResource).toBeDefined();
      expect(template.Resources.WorkoutMethod).toBeDefined();
      expect(template.Resources.LeaderboardResource).toBeDefined();
      expect(template.Resources.LeaderboardMethod).toBeDefined();
    });

    test('API methods should have Cognito authorization', () => {
      expect(template.Resources.WorkoutMethod.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
      expect(template.Resources.LeaderboardMethod.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
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
  });

  describe('ElastiCache Resources', () => {
    test('should have Redis subnet group', () => {
      expect(template.Resources.RedisSubnetGroup).toBeDefined();
      expect(template.Resources.RedisSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have Redis cluster', () => {
      expect(template.Resources.RedisCluster).toBeDefined();
      expect(template.Resources.RedisCluster.Type).toBe('AWS::ElastiCache::CacheCluster');
    });

    test('Redis cluster should have correct properties', () => {
      const redis = template.Resources.RedisCluster;
      expect(redis.Properties.Engine).toBe('redis');
      expect(redis.Properties.NumCacheNodes).toBe(1);
      expect(redis.Properties.CacheNodeType.Ref).toBe('RedisNodeType');
    });
  });

  describe('SNS Resources', () => {
    test('should have Achievement topic', () => {
      expect(template.Resources.AchievementTopic).toBeDefined();
      expect(template.Resources.AchievementTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('Achievement topic should have KMS encryption', () => {
      const topic = template.Resources.AchievementTopic;
      expect(topic.Properties.KmsMasterKeyId.Ref).toBe('FitnessKMSKey');
      expect(topic.Properties.DisplayName).toBe('Fitness Achievement Notifications');
    });

    test('should have conditional email subscription', () => {
      expect(template.Resources.EmailSubscription).toBeDefined();
      expect(template.Resources.EmailSubscription.Condition).toBe('HasNotificationEmail');
      expect(template.Resources.EmailSubscription.Properties.Protocol).toBe('email');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.FitnessDashboard).toBeDefined();
      expect(template.Resources.FitnessDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
    });

    test('Lambda error alarm should have correct properties', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('DynamoDB throttle alarm should have correct properties', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Properties.Threshold).toBe(0);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'ApiEndpoint',
      'WorkoutProcessingFunctionArn',
      'LeaderboardFunctionArn',
      'WorkoutHistoryTableName',
      'S3BucketName',
      'CognitoUserPoolId',
      'SNSTopicArn',
      'RedisClusterEndpoint',
      'CloudWatchDashboardName'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value['Fn::Sub']).toContain('https://${FitnessAPI}.execute-api.${AWS::Region}.amazonaws.com/dev');
    });

    test('All outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40); // Adjust based on actual count
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with Name tag should follow naming convention', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = Array.isArray(resource.Properties.Tags) ? resource.Properties.Tags : [];
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub'] || nameTag.Value).toBeDefined();
          }
        }
      });
    });

    test('all resources should have consistent tags', () => {
      const expectedTags = ['Environment', 'Project', 'Owner'];
      
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
          
          expectedTags.forEach(expectedTag => {
            expect(tagKeys).toContain(expectedTag);
          });
          
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag.Value).toBe('FitnessTracker');
          
          const ownerTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
          expect(ownerTag.Value).toBe('FitnessBackendTeam');
        }
      });
    });
  });

  describe('Conditions', () => {
    test('HasSocialProvider condition should be defined correctly', () => {
      const condition = template.Conditions.HasSocialProvider;
      expect(condition['Fn::Not'][0]['Fn::Equals'][0].Ref).toBe('CognitoSocialProvider');
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });

    test('HasNotificationEmail condition should be defined correctly', () => {
      const condition = template.Conditions.HasNotificationEmail;
      expect(condition['Fn::Not'][0]['Fn::Equals'][0].Ref).toBe('NotificationEmail');
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });
  });

  describe('Cross-Resource References', () => {
    test('network resources should reference each other correctly', () => {
      // VPC references
      expect(template.Resources.PrivateSubnet1.Properties.VpcId.Ref).toBe('FitnessVPC');
      expect(template.Resources.PrivateSubnet2.Properties.VpcId.Ref).toBe('FitnessVPC');
      expect(template.Resources.PublicSubnet1.Properties.VpcId.Ref).toBe('FitnessVPC');
      expect(template.Resources.PublicSubnet2.Properties.VpcId.Ref).toBe('FitnessVPC');
      
      // NAT Gateway references
      expect(template.Resources.NATGateway1.Properties.AllocationId['Fn::GetAtt'][0]).toBe('NATGateway1EIP');
      expect(template.Resources.NATGateway2.Properties.AllocationId['Fn::GetAtt'][0]).toBe('NATGateway2EIP');
    });

    test('security group references should be correct', () => {
      expect(template.Resources.RedisSecurityGroup.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('LambdaSecurityGroup');
    });

    test('Lambda functions should reference correct resources', () => {
      // WorkoutProcessing function
      const workoutEnvVars = template.Resources.WorkoutProcessingFunction.Properties.Environment.Variables;
      expect(workoutEnvVars.USER_PROFILES_TABLE.Ref).toBe('UserProfilesTable');
      expect(workoutEnvVars.WORKOUT_HISTORY_TABLE.Ref).toBe('WorkoutHistoryTable');
      expect(workoutEnvVars.ACHIEVEMENT_TOPIC_ARN.Ref).toBe('AchievementTopic');
      expect(workoutEnvVars.ASSETS_BUCKET.Ref).toBe('FitnessAssetsBucket');
    });

    test('API Gateway should reference Lambda functions correctly', () => {
      const workoutUri = template.Resources.WorkoutMethod.Properties.Integration.Uri['Fn::Sub'];
      const leaderboardUri = template.Resources.LeaderboardMethod.Properties.Integration.Uri['Fn::Sub'];
      
      expect(workoutUri).toContain('${WorkoutProcessingFunction.Arn}');
      expect(leaderboardUri).toContain('${LeaderboardFunction.Arn}');
    });

    test('API Gateway should reference Cognito authorizer', () => {
      expect(template.Resources.WorkoutMethod.Properties.AuthorizerId.Ref).toBe('ApiAuthorizer');
      expect(template.Resources.LeaderboardMethod.Properties.AuthorizerId.Ref).toBe('ApiAuthorizer');
    });
  });
});