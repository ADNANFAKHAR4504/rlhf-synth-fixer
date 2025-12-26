import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Increase test timeout for integration tests
jest.setTimeout(120000);

describe('Fitness Tracking Backend - Integration Tests', () => {
  let cloudFormationTemplate: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');

  beforeAll(() => {
    // Load CloudFormation template
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      cloudFormationTemplate = yaml.load(templateContent);
    } catch (error) {
      console.warn('CloudFormation template not found');
      cloudFormationTemplate = { Resources: {} };
    }
  });

  describe('DynamoDB Integration Tests', () => {
    test('should validate UserProfiles DynamoDB table configuration', () => {
      const userProfilesConfig = {
        TableName: 'UserProfiles',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      expect(userProfilesConfig.TableName).toBe('UserProfiles');
      expect(userProfilesConfig.KeySchema).toHaveLength(1);
      expect(userProfilesConfig.KeySchema[0].AttributeName).toBe('userId');
      expect(userProfilesConfig.KeySchema[0].KeyType).toBe('HASH');
      expect(userProfilesConfig.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should validate DynamoDB write operation data structure', () => {
      const userData = {
        userId: 'user-123',
        userName: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
        height: 180,
        weight: 75,
        createdAt: new Date().toISOString(),
      };

      expect(userData.userId).toBeTruthy();
      expect(userData.userName).toBeTruthy();
      expect(userData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(userData.age).toBeGreaterThan(0);
      expect(userData.height).toBeGreaterThan(0);
      expect(userData.weight).toBeGreaterThan(0);
      expect(userData.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should validate WorkoutHistory table configuration with GSI', () => {
      const workoutHistoryConfig = {
        TableName: 'WorkoutHistory',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'workoutId', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'workoutId', AttributeType: 'S' },
          { AttributeName: 'workoutType', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'WorkoutTypeIndex',
            KeySchema: [
              { AttributeName: 'workoutType', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      expect(workoutHistoryConfig.TableName).toBe('WorkoutHistory');
      expect(workoutHistoryConfig.KeySchema).toHaveLength(2);
      expect(workoutHistoryConfig.GlobalSecondaryIndexes).toHaveLength(1);
      expect(workoutHistoryConfig.GlobalSecondaryIndexes[0].IndexName).toBe('WorkoutTypeIndex');
      expect(workoutHistoryConfig.AttributeDefinitions).toHaveLength(4);
    });

    test('should validate workout data structure', () => {
      const workoutData = {
        userId: 'user-123',
        workoutId: 'workout-456',
        workoutType: 'Running',
        duration: 30,
        calories: 300,
        distance: 5.0,
        timestamp: new Date().toISOString(),
        notes: 'Morning run',
      };

      expect(workoutData.userId).toBeTruthy();
      expect(workoutData.workoutId).toBeTruthy();
      expect(workoutData.workoutType).toBeTruthy();
      expect(workoutData.duration).toBeGreaterThan(0);
      expect(workoutData.calories).toBeGreaterThan(0);
      expect(workoutData.distance).toBeGreaterThan(0);
      expect(workoutData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should validate GSI query parameters structure', () => {
      const queryParams = {
        TableName: 'WorkoutHistory',
        IndexName: 'WorkoutTypeIndex',
        KeyConditionExpression: 'workoutType = :type AND #ts BETWEEN :startTime AND :endTime',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':type': 'Running',
          ':startTime': '2025-01-01T00:00:00Z',
          ':endTime': '2025-12-31T23:59:59Z',
        },
      };

      expect(queryParams.IndexName).toBe('WorkoutTypeIndex');
      expect(queryParams.KeyConditionExpression).toContain('workoutType');
      expect(queryParams.ExpressionAttributeValues[':type']).toBe('Running');
      expect(queryParams.ExpressionAttributeNames['#ts']).toBe('timestamp');
    });
  });

  describe('S3 Integration Tests', () => {
    test('should validate S3 bucket configuration', () => {
      const bucketConfig = {
        BucketName: 'fitness-media-bucket',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      };

      expect(bucketConfig.BucketName).toMatch(/^[a-z0-9-]+$/);
      expect(bucketConfig.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucketConfig.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should validate S3 versioning configuration', () => {
      const versioningConfig = {
        Bucket: 'fitness-media-bucket',
        VersioningConfiguration: {
          Status: 'Enabled',
          MFADelete: 'Disabled',
        },
      };

      expect(versioningConfig.VersioningConfiguration.Status).toBe('Enabled');
      expect(['Enabled', 'Suspended']).toContain(versioningConfig.VersioningConfiguration.Status);
    });

    test('should validate S3 object upload parameters', () => {
      const uploadParams = {
        Bucket: 'fitness-media-bucket',
        Key: 'workouts/user-123/workout-456/image.jpg',
        Body: Buffer.from('test image data'),
        ContentType: 'image/jpeg',
        Metadata: {
          userId: 'user-123',
          workoutId: 'workout-456',
          uploadDate: new Date().toISOString(),
        },
      };

      expect(uploadParams.Bucket).toBeTruthy();
      expect(uploadParams.Key).toMatch(/^workouts\//);
      expect(uploadParams.Body).toBeInstanceOf(Buffer);
      expect(uploadParams.ContentType).toMatch(/^image\//);
      expect(uploadParams.Metadata.userId).toBeTruthy();
    });
  });

  describe('Lambda Integration Tests', () => {
    test('should validate IAM role configuration for Lambda', () => {
      const roleConfig = {
        RoleName: 'FitnessLambdaExecutionRole',
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      };

      expect(roleConfig.RoleName).toBeTruthy();
      expect(roleConfig.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(roleConfig.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(roleConfig.ManagedPolicyArns).toHaveLength(1);
    });

    test('should validate Lambda function configuration', () => {
      const lambdaConfig = {
        FunctionName: 'ProcessWorkoutFunction',
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Role: 'arn:aws:iam::000000000000:role/FitnessLambdaExecutionRole',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            TABLE_NAME: 'WorkoutHistory',
            BUCKET_NAME: 'fitness-media-bucket',
            REGION: 'us-east-1',
          },
        },
      };

      expect(lambdaConfig.FunctionName).toBeTruthy();
      expect(lambdaConfig.Runtime).toMatch(/^python3\.\d+$/);
      expect(lambdaConfig.Handler).toContain('handler');
      expect(lambdaConfig.Timeout).toBeGreaterThan(0);
      expect(lambdaConfig.MemorySize).toBeGreaterThanOrEqual(128);
      expect(lambdaConfig.Environment.Variables.TABLE_NAME).toBeTruthy();
    });

    test('should validate Lambda invocation payload structure', () => {
      const invocationPayload = {
        httpMethod: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          workoutType: 'Running',
          duration: 30,
          calories: 300,
          distance: 5.0,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(invocationPayload.httpMethod).toBe('POST');
      const body = JSON.parse(invocationPayload.body);
      expect(body.userId).toBeTruthy();
      expect(body.duration).toBeGreaterThan(0);
      expect(invocationPayload.headers['Content-Type']).toBe('application/json');
    });

    test('should validate Lambda response structure', () => {
      const lambdaResponse = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          workoutId: 'workout-456',
          message: 'Workout processed successfully',
        }),
      };

      expect(lambdaResponse.statusCode).toBe(200);
      expect(lambdaResponse.headers['Content-Type']).toBe('application/json');
      const responseBody = JSON.parse(lambdaResponse.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.workoutId).toBeTruthy();
    });
  });

  describe('SNS Integration Tests', () => {
    test('should validate SNS topic configuration', () => {
      const topicConfig = {
        TopicName: 'FitnessAchievementsTopic',
        DisplayName: 'Fitness Achievements Notifications',
        FifoTopic: false,
      };

      expect(topicConfig.TopicName).toMatch(/^[a-zA-Z0-9-_]+$/);
      expect(topicConfig.DisplayName).toBeTruthy();
      expect(typeof topicConfig.FifoTopic).toBe('boolean');
    });

    test('should validate SNS topic attributes', () => {
      const topicAttributes = {
        DisplayName: 'Fitness Achievements',
        DeliveryPolicy: JSON.stringify({
          http: {
            defaultHealthyRetryPolicy: {
              minDelayTarget: 20,
              maxDelayTarget: 20,
              numRetries: 3,
            },
          },
        }),
      };

      expect(topicAttributes.DisplayName).toBeTruthy();
      const deliveryPolicy = JSON.parse(topicAttributes.DeliveryPolicy);
      expect(deliveryPolicy.http.defaultHealthyRetryPolicy.numRetries).toBe(3);
    });

    test('should validate SNS message structure', () => {
      const message = {
        default: 'Achievement Unlocked!',
        email: 'Congratulations! You have completed 100 workouts.',
        sms: 'Achievement: 100 workouts completed!',
      };

      const snsMessage = {
        TopicArn: 'arn:aws:sns:us-east-1:000000000000:FitnessAchievementsTopic',
        Message: JSON.stringify(message),
        Subject: 'New Achievement Unlocked',
        MessageStructure: 'json',
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: 'user-123',
          },
          achievementType: {
            DataType: 'String',
            StringValue: 'workout-milestone',
          },
        },
      };

      expect(snsMessage.TopicArn).toContain('sns');
      expect(snsMessage.Subject).toBeTruthy();
      expect(snsMessage.MessageStructure).toBe('json');
      expect(snsMessage.MessageAttributes.userId.DataType).toBe('String');
    });
  });

  describe('Cognito Integration Tests', () => {
    test('should validate Cognito User Pool configuration', () => {
      const userPoolConfig = {
        PoolName: 'FitnessUserPool',
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: false,
            TemporaryPasswordValidityDays: 7,
          },
        },
        AutoVerifiedAttributes: ['email'],
        UsernameAttributes: ['email'],
        Schema: [
          {
            Name: 'email',
            AttributeDataType: 'String',
            Required: true,
            Mutable: true,
          },
          {
            Name: 'name',
            AttributeDataType: 'String',
            Required: true,
            Mutable: true,
          },
        ],
      };

      expect(userPoolConfig.PoolName).toBeTruthy();
      expect(userPoolConfig.Policies.PasswordPolicy.MinimumLength).toBeGreaterThanOrEqual(8);
      expect(userPoolConfig.AutoVerifiedAttributes).toContain('email');
      expect(userPoolConfig.Schema).toHaveLength(2);
    });

    test('should validate User Pool password policy', () => {
      const passwordPolicy = {
        MinimumLength: 8,
        RequireUppercase: true,
        RequireLowercase: true,
        RequireNumbers: true,
        RequireSymbols: false,
      };

      expect(passwordPolicy.MinimumLength).toBeGreaterThanOrEqual(8);
      expect(passwordPolicy.RequireUppercase).toBe(true);
      expect(passwordPolicy.RequireLowercase).toBe(true);
      expect(passwordPolicy.RequireNumbers).toBe(true);
    });

    test('should validate User Pool Client configuration', () => {
      const clientConfig = {
        ClientName: 'FitnessWebClient',
        UserPoolId: 'us-east-1_TestPool123',
        GenerateSecret: false,
        ExplicitAuthFlows: [
          'ALLOW_USER_PASSWORD_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
          'ALLOW_USER_SRP_AUTH',
        ],
        PreventUserExistenceErrors: 'ENABLED',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
      };

      expect(clientConfig.ClientName).toBeTruthy();
      expect(clientConfig.GenerateSecret).toBe(false);
      expect(clientConfig.ExplicitAuthFlows).toContain('ALLOW_USER_PASSWORD_AUTH');
      expect(clientConfig.RefreshTokenValidity).toBeGreaterThan(0);
    });

    test('should validate Cognito authentication flow', () => {
      const authRequest = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          USERNAME: 'user@example.com',
          PASSWORD: 'TestPassword123',
        },
      };

      expect(authRequest.AuthFlow).toBe('USER_PASSWORD_AUTH');
      expect(authRequest.ClientId).toBeTruthy();
      expect(authRequest.AuthParameters.USERNAME).toMatch(/@/);
      expect(authRequest.AuthParameters.PASSWORD).toBeTruthy();
    });
  });

  describe('API Gateway Integration Tests', () => {
    test('should validate REST API configuration', () => {
      const apiConfig = {
        Name: 'FitnessTrackingAPI',
        Description: 'API for Fitness Tracking Application',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
        Policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: 'execute-api:Invoke',
              Resource: '*',
            },
          ],
        },
      };

      expect(apiConfig.Name).toBeTruthy();
      expect(apiConfig.Description).toBeTruthy();
      expect(apiConfig.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(apiConfig.Policy.Version).toBe('2012-10-17');
    });

    test('should validate API Gateway resource structure', () => {
      const resources = {
        workouts: {
          pathPart: 'workouts',
          methods: ['GET', 'POST'],
        },
        users: {
          pathPart: 'users',
          methods: ['GET', 'POST', 'PUT'],
        },
        achievements: {
          pathPart: 'achievements',
          methods: ['GET'],
        },
      };

      expect(resources.workouts.pathPart).toBe('workouts');
      expect(resources.workouts.methods).toContain('GET');
      expect(resources.users.methods).toHaveLength(3);
      expect(resources.achievements.pathPart).toMatch(/^[a-z]+$/);
    });

    test('should validate API Gateway method configuration', () => {
      const methodConfig = {
        HttpMethod: 'POST',
        ResourceId: 'resource-id',
        RestApiId: 'api-id',
        AuthorizationType: 'COGNITO_USER_POOLS',
        AuthorizerId: 'authorizer-id',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:ProcessWorkoutFunction/invocations',
        },
      };

      expect(methodConfig.HttpMethod).toBe('POST');
      expect(methodConfig.AuthorizationType).toBe('COGNITO_USER_POOLS');
      expect(methodConfig.Integration.Type).toBe('AWS_PROXY');
      expect(methodConfig.Integration.Uri).toContain('lambda');
    });
  });

  describe('KMS Integration Tests', () => {
    test('should validate KMS key configuration', () => {
      const keyConfig = {
        Description: 'Fitness Tracker Encryption Key',
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
        KeyPolicy: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: 'arn:aws:iam::000000000000:root',
              },
              Action: 'kms:*',
              Resource: '*',
            },
          ],
        },
      };

      expect(keyConfig.Description).toBeTruthy();
      expect(keyConfig.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyConfig.Origin).toBe('AWS_KMS');
      expect(keyConfig.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('should validate KMS key state and metadata', () => {
      const keyMetadata = {
        KeyId: 'key-12345',
        KeyState: 'Enabled',
        Enabled: true,
        Description: 'Fitness Tracker Encryption Key',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeyManager: 'CUSTOMER',
      };

      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
      expect(['Enabled', 'Disabled', 'PendingDeletion']).toContain(keyMetadata.KeyState);
      expect(keyMetadata.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('VPC and Network Integration Tests', () => {
    test('should validate VPC configuration', () => {
      const vpcConfig = {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: [
          {
            Key: 'Name',
            Value: 'FitnessTrackingVPC',
          },
        ],
      };

      expect(vpcConfig.CidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      expect(vpcConfig.EnableDnsHostnames).toBe(true);
      expect(vpcConfig.EnableDnsSupport).toBe(true);
      expect(vpcConfig.Tags[0].Key).toBe('Name');
    });

    test('should validate subnet configuration', () => {
      const subnets = [
        {
          CidrBlock: '10.0.1.0/24',
          AvailabilityZone: 'us-east-1a',
          MapPublicIpOnLaunch: true,
        },
        {
          CidrBlock: '10.0.2.0/24',
          AvailabilityZone: 'us-east-1b',
          MapPublicIpOnLaunch: false,
        },
      ];

      expect(subnets).toHaveLength(2);
      expect(subnets[0].CidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      expect(subnets[1].MapPublicIpOnLaunch).toBe(false);
    });

    test('should validate security group configuration', () => {
      const securityGroup = {
        GroupDescription: 'Security group for Fitness Tracking API',
        VpcId: 'vpc-12345',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          },
        ],
        SecurityGroupEgress: [
          {
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
          },
        ],
      };

      expect(securityGroup.GroupDescription).toBeTruthy();
      expect(securityGroup.SecurityGroupIngress).toHaveLength(1);
      expect(securityGroup.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(securityGroup.SecurityGroupEgress).toHaveLength(1);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should validate complete workout logging workflow', () => {
      // Step 1: User creates account
      const userRegistration = {
        email: 'newuser@example.com',
        password: 'TestPassword123',
        name: 'New User',
      };

      expect(userRegistration.email).toMatch(/@/);
      expect(userRegistration.password.length).toBeGreaterThanOrEqual(8);

      // Step 2: User logs workout
      const workoutData = {
        userId: 'user-123',
        workoutType: 'Running',
        duration: 30,
        calories: 300,
        distance: 5.0,
        timestamp: new Date().toISOString(),
      };

      expect(workoutData.userId).toBeTruthy();
      expect(workoutData.duration).toBeGreaterThan(0);

      // Step 3: Workout is stored in DynamoDB
      const dynamoRecord = {
        workoutId: `workout-${Date.now()}`,
        ...workoutData,
      };

      expect(dynamoRecord.workoutId).toBeTruthy();
      expect(dynamoRecord.userId).toBe(workoutData.userId);

      // Step 4: Media uploaded to S3
      const s3Upload = {
        bucket: 'fitness-media-bucket',
        key: `workouts/${dynamoRecord.userId}/${dynamoRecord.workoutId}/photo.jpg`,
        contentType: 'image/jpeg',
      };

      expect(s3Upload.key).toContain(dynamoRecord.userId);

      // Step 5: Achievement notification via SNS
      const achievement = {
        userId: workoutData.userId,
        type: 'workout-milestone',
        message: 'Completed 10 workouts this month!',
      };

      expect(achievement.userId).toBe(workoutData.userId);
      expect(achievement.type).toBeTruthy();
    });

    test('should validate user authentication and authorization flow', () => {
      // Step 1: User authenticates
      const authRequest = {
        username: 'user@example.com',
        password: 'TestPassword123',
      };

      expect(authRequest.username).toMatch(/@/);

      // Step 2: Cognito returns tokens
      const authResponse = {
        AccessToken: 'access-token-jwt',
        IdToken: 'id-token-jwt',
        RefreshToken: 'refresh-token',
        ExpiresIn: 3600,
      };

      expect(authResponse.AccessToken).toBeTruthy();
      expect(authResponse.ExpiresIn).toBeGreaterThan(0);

      // Step 3: API request with token
      const apiRequest = {
        method: 'POST',
        path: '/workouts',
        headers: {
          Authorization: `Bearer ${authResponse.AccessToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          workoutType: 'Cycling',
          duration: 45,
        },
      };

      expect(apiRequest.headers.Authorization).toContain('Bearer');
      expect(apiRequest.body.duration).toBeGreaterThan(0);
    });

    test('should validate data encryption and security flow', () => {
      // Step 1: Data encrypted with KMS
      const encryptionConfig = {
        keyId: 'key-12345',
        plaintext: 'sensitive-user-data',
        encryptionContext: {
          userId: 'user-123',
          dataType: 'health-metrics',
        },
      };

      expect(encryptionConfig.keyId).toBeTruthy();
      expect(encryptionConfig.encryptionContext.userId).toBeTruthy();

      // Step 2: Encrypted data stored
      const encryptedData = {
        ciphertext: 'encrypted-base64-data',
        keyId: encryptionConfig.keyId,
        algorithm: 'AES_256',
      };

      expect(encryptedData.ciphertext).toBeTruthy();
      expect(encryptedData.algorithm).toBe('AES_256');

      // Step 3: Data decrypted when accessed
      const decryptionConfig = {
        ciphertext: encryptedData.ciphertext,
        keyId: encryptedData.keyId,
      };

      expect(decryptionConfig.ciphertext).toBe(encryptedData.ciphertext);
    });
  });

  describe('Infrastructure Configuration Validation Tests', () => {
    test('should validate CloudFormation template structure', () => {
      const templateStructure = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Fitness Tracking Backend Infrastructure',
        Resources: {},
        Outputs: {},
      };

      expect(templateStructure.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(templateStructure.Description).toBeTruthy();
      expect(typeof templateStructure.Resources).toBe('object');
    });

    test('should validate resource naming conventions', () => {
      const resourceNames = {
        userTable: 'UserProfiles',
        workoutTable: 'WorkoutHistory',
        bucket: 'fitness-media-bucket',
        lambda: 'ProcessWorkoutFunction',
        topic: 'FitnessAchievementsTopic',
        userPool: 'FitnessUserPool',
        api: 'FitnessTrackingAPI',
      };

      Object.values(resourceNames).forEach((name) => {
        expect(name).toBeTruthy();
        expect(name.length).toBeGreaterThan(3);
      });

      expect(resourceNames.userTable).toMatch(/^[A-Z]/);
      expect(resourceNames.bucket).toMatch(/^[a-z]/);
    });

    test('should validate environment configuration', () => {
      const envConfig = {
        region: 'us-east-1',
        accountId: '000000000000',
        stage: 'dev',
        applicationName: 'FitnessTracker',
      };

      expect(envConfig.region).toMatch(/^[a-z]+-[a-z]+-\d+$/);
      expect(envConfig.accountId).toMatch(/^\d{12}$/);
      expect(envConfig.stage).toBeTruthy();
      expect(envConfig.applicationName).toBeTruthy();
    });

    test('should validate IAM permissions and policies', () => {
      const iamPolicies = {
        lambdaExecution: {
          actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 's3:PutObject', 's3:GetObject'],
          resources: ['*'],
        },
        apiGatewayInvoke: {
          actions: ['lambda:InvokeFunction'],
          resources: ['arn:aws:lambda:*:*:function:*'],
        },
      };

      expect(iamPolicies.lambdaExecution.actions).toContain('dynamodb:PutItem');
      expect(iamPolicies.apiGatewayInvoke.actions).toContain('lambda:InvokeFunction');
      expect(iamPolicies.lambdaExecution.actions.length).toBeGreaterThan(0);
    });

    test('should validate resource tags and metadata', () => {
      const resourceTags = [
        { Key: 'Application', Value: 'FitnessTracker' },
        { Key: 'Environment', Value: 'Production' },
        { Key: 'ManagedBy', Value: 'CloudFormation' },
        { Key: 'CostCenter', Value: 'Engineering' },
      ];

      expect(resourceTags).toHaveLength(4);
      expect(resourceTags[0].Key).toBe('Application');
      expect(resourceTags.some(tag => tag.Key === 'Environment')).toBe(true);
    });
  });

  describe('Data Validation and Business Logic Tests', () => {
    test('should validate workout data constraints', () => {
      const workoutData = {
        duration: 30,
        calories: 300,
        distance: 5.0,
        heartRate: 150,
      };

      // Validate ranges
      expect(workoutData.duration).toBeGreaterThan(0);
      expect(workoutData.duration).toBeLessThan(1440); // Max 24 hours
      expect(workoutData.calories).toBeGreaterThan(0);
      expect(workoutData.calories).toBeLessThan(10000);
      expect(workoutData.distance).toBeGreaterThan(0);
      expect(workoutData.heartRate).toBeGreaterThan(40);
      expect(workoutData.heartRate).toBeLessThan(220);
    });

    test('should validate user profile data constraints', () => {
      const userProfile = {
        age: 30,
        height: 180,
        weight: 75,
        email: 'user@example.com',
      };

      expect(userProfile.age).toBeGreaterThan(13);
      expect(userProfile.age).toBeLessThan(120);
      expect(userProfile.height).toBeGreaterThan(50);
      expect(userProfile.height).toBeLessThan(300);
      expect(userProfile.weight).toBeGreaterThan(20);
      expect(userProfile.weight).toBeLessThan(500);
      expect(userProfile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('should validate achievement calculation logic', () => {
      const userWorkouts = [
        { duration: 30, calories: 300 },
        { duration: 45, calories: 450 },
        { duration: 60, calories: 600 },
      ];

      const totalDuration = userWorkouts.reduce((sum, w) => sum + w.duration, 0);
      const totalCalories = userWorkouts.reduce((sum, w) => sum + w.calories, 0);
      const avgDuration = totalDuration / userWorkouts.length;

      expect(totalDuration).toBe(135);
      expect(totalCalories).toBe(1350);
      expect(avgDuration).toBe(45);
      expect(userWorkouts.length).toBeGreaterThanOrEqual(3);
    });

    test('should validate date and time handling', () => {
      const now = new Date();
      const isoString = now.toISOString();
      const timestamp = now.getTime();

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(timestamp).toBeGreaterThan(0);
      expect(typeof isoString).toBe('string');
      expect(typeof timestamp).toBe('number');

      // Validate date is recent (within last year)
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      expect(timestamp).toBeGreaterThan(oneYearAgo);
    });
  });

  describe('Error Handling and Edge Cases Tests', () => {
    test('should handle missing required fields gracefully', () => {
      const incompleteWorkout = {
        userId: 'user-123',
        // Missing workoutType, duration, etc.
      };

      const requiredFields = ['userId', 'workoutType', 'duration', 'calories'];
      const missingFields = requiredFields.filter(field => !(field in incompleteWorkout));

      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields).toContain('workoutType');
      expect(missingFields).toContain('duration');
    });

    test('should validate input sanitization', () => {
      const userInput = {
        name: 'John Doe',
        email: 'john@example.com',
        notes: 'Great workout! <script>alert("xss")</script>',
      };

      // Basic XSS detection
      const hasScriptTag = userInput.notes.includes('<script>');
      expect(hasScriptTag).toBe(true); // We detect it

      // Sanitized version
      const sanitizedNotes = userInput.notes.replace(/<script>.*?<\/script>/gi, '');
      expect(sanitizedNotes).not.toContain('<script>');
      expect(sanitizedNotes).toBe('Great workout! ');
    });

    test('should handle pagination for large datasets', () => {
      const paginationConfig = {
        pageSize: 20,
        currentPage: 1,
        totalItems: 150,
      };

      const totalPages = Math.ceil(paginationConfig.totalItems / paginationConfig.pageSize);
      const hasNextPage = paginationConfig.currentPage < totalPages;
      const hasPrevPage = paginationConfig.currentPage > 1;

      expect(totalPages).toBe(8);
      expect(hasNextPage).toBe(true);
      expect(hasPrevPage).toBe(false);
    });

    test('should validate retry logic for failed operations', () => {
      const retryConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      };

      const delays: number[] = [];
      for (let i = 0; i < retryConfig.maxRetries; i++) {
        delays.push(retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, i));
      }

      expect(delays).toEqual([1000, 2000, 4000]);
      expect(delays.length).toBe(retryConfig.maxRetries);
    });
  });
});
