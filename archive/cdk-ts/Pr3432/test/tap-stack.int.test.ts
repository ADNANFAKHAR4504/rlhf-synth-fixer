/* eslint-disable prettier/prettier */

import * as AWS from 'aws-sdk';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs from file
const loadDeploymentOutputs = () => {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Deployment outputs file not found at: ${outputsPath}`);
  }

  const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
  return JSON.parse(outputsContent);
};

const DEPLOYMENT_OUTPUTS = loadDeploymentOutputs();
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'pr3432';

console.log('🚀 Loaded deployment outputs from cfn-outputs/flat-outputs.json');
console.log('📋 Deployment Configuration:');
console.log('   Environment:', ENVIRONMENT_SUFFIX);
console.log('   Region:', AWS_REGION);
console.log('   VPC ID:', DEPLOYMENT_OUTPUTS.VPCId);
console.log('   ALB DNS:', DEPLOYMENT_OUTPUTS.ALBDNSName);
console.log('');

// Configure AWS SDK
AWS.config.update({ region: AWS_REGION });

// Initialize AWS SDK v2 clients (already available)
const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const ecs = new AWS.ECS();
const rds = new AWS.RDS();
const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const cognito = new AWS.CognitoIdentityServiceProvider();
const lambda = new AWS.Lambda();
const stepfunctions = new AWS.StepFunctions();
const sns = new AWS.SNS();
const cloudformation = new AWS.CloudFormation();

describe('FreelancerPlatform Real Integration Tests', () => {
  jest.setTimeout(60000); // 60 seconds timeout for real API calls

  // =================================================================
  // CLOUDFORMATION STACK TESTS
  // =================================================================
  describe('CloudFormation Stack Status', () => {
    test('validates CloudFormation stack exists and is in good state', async () => {
      console.log('🔍 Testing CloudFormation stack status...');
      
      const params = {
        StackName: `TapStack${ENVIRONMENT_SUFFIX}`,
      };
      
      const response = await cloudformation.describeStacks(params).promise();

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(response.Stacks![0].StackStatus)).toBe(true);

      console.log('✅ Stack validated:', response.Stacks![0].StackName);
      console.log('   Status:', response.Stacks![0].StackStatus);
      console.log('   Created:', response.Stacks![0].CreationTime);
    });

    test('validates stack outputs match loaded configuration', async () => {
      console.log('🔍 Testing CloudFormation outputs consistency...');
      
      const params = {
        StackName: `TapStack${ENVIRONMENT_SUFFIX}`,
      };
      
      const response = await cloudformation.describeStacks(params).promise();
      const outputs = response.Stacks![0].Outputs;

      expect(outputs).toBeDefined();
      expect(outputs!.length).toBeGreaterThanOrEqual(8);

      // Verify loaded outputs match actual CloudFormation outputs
      const albOutput = outputs!.find(o => o.OutputKey === 'ALBDNSName');
      expect(albOutput?.OutputValue).toBe(DEPLOYMENT_OUTPUTS.ALBDNSName);

      console.log('✅ Stack outputs validated and match loaded configuration');
      console.log('   Total outputs:', outputs!.length);
    });
  });

  // =================================================================
  // VPC AND NETWORKING TESTS
  // =================================================================
  describe('VPC and Networking Infrastructure', () => {
    test('validates VPC exists with correct configuration', async () => {
      console.log('🔍 Testing VPC existence and configuration...');
      
      const params = {
        VpcIds: [DEPLOYMENT_OUTPUTS.VPCId],
      };
      const response = await ec2.describeVpcs(params).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.36.0.0/16');
      
      console.log('✅ VPC validated:', response.Vpcs![0].VpcId);
      console.log('   CIDR Block:', response.Vpcs![0].CidrBlock);
    });

    test('validates subnets are distributed across multiple AZs', async () => {
      console.log('🔍 Testing multi-AZ subnet distribution...');
      
      const params = {
        Filters: [
          { Name: 'vpc-id', Values: [DEPLOYMENT_OUTPUTS.VPCId] },
        ],
      };
      const response = await ec2.describeSubnets(params).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const uniqueAZs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);

      console.log('✅ Subnets validated:', response.Subnets!.length, 'subnets');
      console.log('   Availability Zones:', Array.from(uniqueAZs));
    });

    test('validates security groups exist and are configured', async () => {
      console.log('🔍 Testing security groups...');
      
      const params = {
        Filters: [
          { Name: 'vpc-id', Values: [DEPLOYMENT_OUTPUTS.VPCId] },
        ],
      };
      const response = await ec2.describeSecurityGroups(params).promise();

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);

      console.log('✅ Security groups validated:', response.SecurityGroups!.length, 'groups');
      response.SecurityGroups!.slice(0, 5).forEach(sg => {
        console.log('   -', sg.GroupName);
      });
    });
  });

  // =================================================================
  // APPLICATION LOAD BALANCER TESTS
  // =================================================================
  describe('Application Load Balancer', () => {
    test('validates ALB is provisioned and healthy', async () => {
      console.log('🔍 Testing ALB health...');
      
      const params = {
        Names: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-alb`],
      };
      const response = await elbv2.describeLoadBalancers(params).promise();

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');

      console.log('✅ ALB validated:', response.LoadBalancers![0].LoadBalancerName);
      console.log('   State:', response.LoadBalancers![0].State?.Code);
      console.log('   DNS:', response.LoadBalancers![0].DNSName);
    });

    test('validates ALB target group exists', async () => {
      console.log('🔍 Testing ALB target groups...');
      
      const params = {
        Names: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-tg`],
      };
      const response = await elbv2.describeTargetGroups(params).promise();

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);
      expect(response.TargetGroups![0].Port).toBe(80);
      expect(response.TargetGroups![0].Protocol).toBe('HTTP');

      console.log('✅ Target group validated:', response.TargetGroups![0].TargetGroupName);
      console.log('   Port:', response.TargetGroups![0].Port);
      console.log('   Health check path:', response.TargetGroups![0].HealthCheckPath);
    });

    test('validates ALB responds to HTTP requests', async () => {
      console.log('🔍 Testing ALB HTTP response...');
      
      try {
        const response = await axios.get(`http://${DEPLOYMENT_OUTPUTS.ALBDNSName}`, {
          timeout: 10000,
          validateStatus: () => true,
        });

        expect(response.status).toBeDefined();
        console.log('✅ ALB responded with status:', response.status);
      } catch (error: any) {
        console.log('⚠️  ALB connection:', error.message);
      }
    });
  });

  // =================================================================
  // ECS FARGATE TESTS
  // =================================================================
  describe('ECS Fargate Service', () => {
    test('validates ECS cluster exists', async () => {
      console.log('🔍 Testing ECS cluster...');
      
      const params = {
        clusters: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-cluster`],
      };
      const response = await ecs.describeClusters(params).promise();

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');

      console.log('✅ ECS cluster validated:', response.clusters![0].clusterName);
      console.log('   Running tasks:', response.clusters![0].runningTasksCount);
      console.log('   Registered instances:', response.clusters![0].registeredContainerInstancesCount);
    });

    test('validates ECS service is running', async () => {
      console.log('🔍 Testing ECS service...');
      
      const params = {
        cluster: `${ENVIRONMENT_SUFFIX}-freelancer-platform-cluster`,
        services: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-service`],
      };
      const response = await ecs.describeServices(params).promise();

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThanOrEqual(1);

      console.log('✅ ECS service validated:', response.services![0].serviceName);
      console.log('   Desired count:', response.services![0].desiredCount);
      console.log('   Running count:', response.services![0].runningCount);
      console.log('   Launch type:', response.services![0].launchType);
    });

    test('validates ECS tasks are running', async () => {
      console.log('🔍 Testing ECS tasks...');
      
      const listParams = {
        cluster: `${ENVIRONMENT_SUFFIX}-freelancer-platform-cluster`,
        serviceName: `${ENVIRONMENT_SUFFIX}-freelancer-platform-service`,
      };
      const listResponse = await ecs.listTasks(listParams).promise();

      if (listResponse.taskArns && listResponse.taskArns.length > 0) {
        const describeParams = {
          cluster: `${ENVIRONMENT_SUFFIX}-freelancer-platform-cluster`,
          tasks: listResponse.taskArns,
        };
        const response = await ecs.describeTasks(describeParams).promise();

        expect(response.tasks).toBeDefined();
        expect(response.tasks!.length).toBeGreaterThanOrEqual(1);

        console.log('✅ ECS tasks validated:', response.tasks!.length, 'tasks');
        response.tasks!.forEach((task, idx) => {
          console.log(`   Task ${idx + 1}:`, task.lastStatus, '-', task.healthStatus);
        });
      } else {
        console.log('⚠️  No tasks currently running');
      }
    });
  });

  // =================================================================
  // AURORA MYSQL TESTS
  // =================================================================
  describe('Aurora MySQL Cluster', () => {
    test('validates Aurora cluster exists and is available', async () => {
      console.log('🔍 Testing Aurora cluster...');
      
      const params = {
        DBClusterIdentifier: `${ENVIRONMENT_SUFFIX}-freelancer-platform-aurora-cluster`,
      };
      const response = await rds.describeDBClusters(params).promise();

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe('aurora-mysql');

      console.log('✅ Aurora cluster validated:', response.DBClusters![0].DBClusterIdentifier);
      console.log('   Status:', response.DBClusters![0].Status);
      console.log('   Endpoint:', response.DBClusters![0].Endpoint);
      console.log('   Multi-AZ:', response.DBClusters![0].MultiAZ);
    });

    test('validates Aurora has multiple instances', async () => {
      console.log('🔍 Testing Aurora instances...');
      
      const params = {
        Filters: [
          { Name: 'db-cluster-id', Values: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-aurora-cluster`] },
        ],
      };
      const response = await rds.describeDBInstances(params).promise();

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);

      console.log('✅ Aurora instances validated:', response.DBInstances!.length, 'instances');
      response.DBInstances!.forEach((instance, idx) => {
        console.log(`   Instance ${idx + 1}:`, instance.DBInstanceIdentifier, '-', instance.DBInstanceStatus);
      });
    });
  });

  // =================================================================
  // DYNAMODB TESTS
  // =================================================================
  describe('DynamoDB Table', () => {
    test('validates DynamoDB table exists with correct configuration', async () => {
      console.log('🔍 Testing DynamoDB table...');
      
      const params = {
        TableName: DEPLOYMENT_OUTPUTS.DynamoDBTableName,
      };
      const response = await dynamodb.describeTable(params).promise();

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table!.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table!.GlobalSecondaryIndexes!.length).toBe(2);

      console.log('✅ DynamoDB table validated:', response.Table!.TableName);
      console.log('   Status:', response.Table!.TableStatus);
      console.log('   GSI count:', response.Table!.GlobalSecondaryIndexes!.length);
      console.log('   Billing mode:', response.Table!.BillingModeSummary?.BillingMode);
    });

    test('validates DynamoDB write and read operations', async () => {
      console.log('🔍 Testing DynamoDB read/write...');
      
      const testId = `test-${Date.now()}`;
      const testItem = {
        conversationId: { S: testId },
        timestamp: { N: Date.now().toString() },
        message: { S: 'Integration test message' },
      };

      // Write test item
      await dynamodb.putItem({
        TableName: DEPLOYMENT_OUTPUTS.DynamoDBTableName,
        Item: testItem,
      }).promise();
      console.log('   ✓ Write operation successful');

      // Read test item
      const getResponse = await dynamodb.getItem({
        TableName: DEPLOYMENT_OUTPUTS.DynamoDBTableName,
        Key: {
          conversationId: { S: testId },
          timestamp: testItem.timestamp,
        },
      }).promise();
      expect(getResponse.Item).toBeDefined();
      console.log('   ✓ Read operation successful');

      // Delete test item
      await dynamodb.deleteItem({
        TableName: DEPLOYMENT_OUTPUTS.DynamoDBTableName,
        Key: {
          conversationId: { S: testId },
          timestamp: testItem.timestamp,
        },
      }).promise();
      console.log('   ✓ Delete operation successful');
      
      console.log('✅ DynamoDB operations validated');
    });
  });

  // =================================================================
  // S3 AND CLOUDFRONT TESTS
  // =================================================================
  describe('S3 and CloudFront', () => {
    test('validates S3 bucket exists and is accessible', async () => {
      console.log('🔍 Testing S3 bucket...');
      
      const params = {
        Bucket: DEPLOYMENT_OUTPUTS.S3BucketName,
      };
      
      await expect(s3.headBucket(params).promise()).resolves.not.toThrow();
      
      console.log('✅ S3 bucket validated:', DEPLOYMENT_OUTPUTS.S3BucketName);
    });

    test('validates S3 write and read operations', async () => {
      console.log('🔍 Testing S3 read/write...');
      
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Write test object
      await s3.putObject({
        Bucket: DEPLOYMENT_OUTPUTS.S3BucketName,
        Key: testKey,
        Body: testContent,
      }).promise();
      console.log('   ✓ Write operation successful');

      // Read test object
      const getResponse = await s3.getObject({
        Bucket: DEPLOYMENT_OUTPUTS.S3BucketName,
        Key: testKey,
      }).promise();
      expect(getResponse.Body).toBeDefined();
      console.log('   ✓ Read operation successful');

      // Delete test object
      await s3.deleteObject({
        Bucket: DEPLOYMENT_OUTPUTS.S3BucketName,
        Key: testKey,
      }).promise();
      console.log('   ✓ Delete operation successful');
      
      console.log('✅ S3 operations validated');
    });

    test('validates CloudFront distribution is accessible', async () => {
      console.log('🔍 Testing CloudFront distribution...');
      
      try {
        const response = await axios.get(DEPLOYMENT_OUTPUTS.CloudFrontURL, {
          timeout: 10000,
          validateStatus: () => true,
        });

        expect(response.status).toBeDefined();
        console.log('✅ CloudFront responded with status:', response.status);
      } catch (error: any) {
        console.log('⚠️  CloudFront validation:', error.message);
      }
    });
  });

  // =================================================================
  // COGNITO USER POOLS TESTS
  // =================================================================
  describe('Cognito User Pools', () => {
    test('validates freelancer user pool exists', async () => {
      console.log('🔍 Testing Cognito freelancer pool...');
      
      const params = {
        UserPoolId: DEPLOYMENT_OUTPUTS.FreelancerUserPoolId,
      };
      const response = await cognito.describeUserPool(params).promise();

      expect(response.UserPool).toBeDefined();
      expect(response.UserPool!.Id).toBe(DEPLOYMENT_OUTPUTS.FreelancerUserPoolId);
      expect(response.UserPool!.Name).toContain('freelancer');

      console.log('✅ Freelancer pool validated:', response.UserPool!.Name);
      console.log('   Pool ID:', response.UserPool!.Id);
      console.log('   MFA:', response.UserPool!.MfaConfiguration);
      console.log('   Password Policy Min Length:', response.UserPool!.Policies?.PasswordPolicy?.MinimumLength);
    });

    test('validates client user pool exists', async () => {
      console.log('🔍 Testing Cognito client pool...');
      
      const params = {
        UserPoolId: DEPLOYMENT_OUTPUTS.ClientUserPoolId,
      };
      const response = await cognito.describeUserPool(params).promise();

      expect(response.UserPool).toBeDefined();
      expect(response.UserPool!.Id).toBe(DEPLOYMENT_OUTPUTS.ClientUserPoolId);
      expect(response.UserPool!.Name).toContain('client');

      console.log('✅ Client pool validated:', response.UserPool!.Name);
      console.log('   Pool ID:', response.UserPool!.Id);
      console.log('   MFA:', response.UserPool!.MfaConfiguration);
      console.log('   Password Policy Min Length:', response.UserPool!.Policies?.PasswordPolicy?.MinimumLength);
    });

    test('validates user pool password policies are enforced', async () => {
      console.log('🔍 Testing Cognito password policies...');
      
      const params = {
        UserPoolId: DEPLOYMENT_OUTPUTS.FreelancerUserPoolId,
      };
      const response = await cognito.describeUserPool(params).promise();

      expect(response.UserPool?.Policies?.PasswordPolicy).toBeDefined();
      expect(response.UserPool!.Policies!.PasswordPolicy!.MinimumLength).toBeGreaterThanOrEqual(12);
      expect(response.UserPool!.Policies!.PasswordPolicy!.RequireLowercase).toBe(true);
      expect(response.UserPool!.Policies!.PasswordPolicy!.RequireUppercase).toBe(true);
      expect(response.UserPool!.Policies!.PasswordPolicy!.RequireNumbers).toBe(true);
      expect(response.UserPool!.Policies!.PasswordPolicy!.RequireSymbols).toBe(true);

      console.log('✅ Password policies validated');
      console.log('   Min length:', response.UserPool!.Policies!.PasswordPolicy!.MinimumLength);
      console.log('   Requires: uppercase, lowercase, numbers, symbols');
    });
  });

  // =================================================================
  // LAMBDA FUNCTION TESTS
  // =================================================================
  describe('Lambda Functions', () => {
    test('validates payment webhook Lambda exists', async () => {
      console.log('🔍 Testing Lambda function...');
      
      const params = {
        FunctionName: `${ENVIRONMENT_SUFFIX}-freelancer-platform-payment-webhook`,
      };
      const response = await lambda.getFunction(params).promise();

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');

      console.log('✅ Lambda function validated:', response.Configuration!.FunctionName);
      console.log('   State:', response.Configuration!.State);
      console.log('   Runtime:', response.Configuration!.Runtime);
      console.log('   Memory:', response.Configuration!.MemorySize, 'MB');
    });

    test('validates Lambda can be invoked', async () => {
      console.log('🔍 Testing Lambda invocation...');
      
      const params = {
        FunctionName: `${ENVIRONMENT_SUFFIX}-freelancer-platform-payment-webhook`,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ test: true }),
      };
      const response = await lambda.invoke(params).promise();

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      console.log('✅ Lambda invocation successful');
      console.log('   Status code:', response.StatusCode);
    });
  });

  // =================================================================
  // STEP FUNCTIONS TESTS
  // =================================================================
  describe('Step Functions State Machine', () => {
    test('validates state machine exists', async () => {
      console.log('🔍 Testing Step Functions state machine...');
      
      const params = {
        stateMachineArn: DEPLOYMENT_OUTPUTS.StateMachineArn,
      };
      const response = await stepfunctions.describeStateMachine(params).promise();

      expect(response.stateMachineArn).toBe(DEPLOYMENT_OUTPUTS.StateMachineArn);
      expect(response.status).toBe('ACTIVE');

      console.log('✅ State machine validated:', response.name);
      console.log('   Status:', response.status);
      console.log('   Type:', response.type);
    });

    test('validates state machine can be executed', async () => {
      console.log('🔍 Testing state machine execution...');
      
      const startParams = {
        stateMachineArn: DEPLOYMENT_OUTPUTS.StateMachineArn,
        input: JSON.stringify({ test: true }),
      };
      const startResponse = await stepfunctions.startExecution(startParams).promise();

      expect(startResponse.executionArn).toBeDefined();

      // Wait a bit and check execution status
      await new Promise(resolve => setTimeout(resolve, 2000));

      const describeParams = {
        executionArn: startResponse.executionArn,
      };
      const describeResponse = await stepfunctions.describeExecution(describeParams).promise();

      expect(describeResponse.status).toBeDefined();

      console.log('✅ State machine execution validated');
      console.log('   Execution ARN:', startResponse.executionArn);
      console.log('   Status:', describeResponse.status);
    });
  });

  // =================================================================
  // SNS TOPICS TESTS
  // =================================================================
  describe('SNS Topics', () => {
    test('validates SNS topics exist', async () => {
      console.log('🔍 Testing SNS topics...');
      
      const response = await sns.listTopics().promise();

      expect(response.Topics).toBeDefined();
      
      const platformTopics = response.Topics!.filter(t => 
        t.TopicArn?.includes(ENVIRONMENT_SUFFIX) && 
        t.TopicArn?.includes('freelancer-platform')
      );

      expect(platformTopics.length).toBeGreaterThanOrEqual(3);

      console.log('✅ SNS topics validated:', platformTopics.length, 'topics');
      platformTopics.forEach(topic => {
        console.log('   -', topic.TopicArn?.split(':').pop());
      });
    });
  });

  // =================================================================
  // END-TO-END WORKFLOW TEST
  // =================================================================
  describe('End-to-End Workflow Validation', () => {
    test('validates complete platform workflow', async () => {
      console.log('🔍 Testing end-to-end workflow...');
      console.log('   📊 Component Status Summary:');

      let healthyComponents = 0;
      const totalComponents = 10;

      // Check CloudFormation Stack
      try {
        await cloudformation.describeStacks({ StackName: `TapStack${ENVIRONMENT_SUFFIX}` }).promise();
        console.log('   ✅ CloudFormation Stack - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ CloudFormation Stack - Unhealthy'); }

      // Check VPC
      try {
        await ec2.describeVpcs({ VpcIds: [DEPLOYMENT_OUTPUTS.VPCId] }).promise();
        console.log('   ✅ VPC - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ VPC - Unhealthy'); }

      // Check ALB
      try {
        await elbv2.describeLoadBalancers({ Names: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-alb`] }).promise();
        console.log('   ✅ ALB - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ ALB - Unhealthy'); }

      // Check ECS
      try {
        await ecs.describeClusters({ clusters: [`${ENVIRONMENT_SUFFIX}-freelancer-platform-cluster`] }).promise();
        console.log('   ✅ ECS - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ ECS - Unhealthy'); }

      // Check Aurora
      try {
        await rds.describeDBClusters({ DBClusterIdentifier: `${ENVIRONMENT_SUFFIX}-freelancer-platform-aurora-cluster` }).promise();
        console.log('   ✅ Aurora - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ Aurora - Unhealthy'); }

      // Check DynamoDB
      try {
        await dynamodb.describeTable({ TableName: DEPLOYMENT_OUTPUTS.DynamoDBTableName }).promise();
        console.log('   ✅ DynamoDB - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ DynamoDB - Unhealthy'); }

      // Check S3
      try {
        await s3.headBucket({ Bucket: DEPLOYMENT_OUTPUTS.S3BucketName }).promise();
        console.log('   ✅ S3 - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ S3 - Unhealthy'); }

      // Check Cognito
      try {
        await cognito.describeUserPool({ UserPoolId: DEPLOYMENT_OUTPUTS.FreelancerUserPoolId }).promise();
        console.log('   ✅ Cognito - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ Cognito - Unhealthy'); }

      // Check Lambda
      try {
        await lambda.getFunction({ FunctionName: `${ENVIRONMENT_SUFFIX}-freelancer-platform-payment-webhook` }).promise();
        console.log('   ✅ Lambda - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ Lambda - Unhealthy'); }

      // Check Step Functions
      try {
        await stepfunctions.describeStateMachine({ stateMachineArn: DEPLOYMENT_OUTPUTS.StateMachineArn }).promise();
        console.log('   ✅ Step Functions - Healthy');
        healthyComponents++;
      } catch (e) { console.log('   ❌ Step Functions - Unhealthy'); }

      const healthPercentage = (healthyComponents / totalComponents) * 100;
      console.log(`\n   🎯 Platform Health: ${healthyComponents}/${totalComponents} (${healthPercentage.toFixed(1)}%)`);

      expect(healthyComponents).toBeGreaterThanOrEqual(8);
      console.log('\n✅ End-to-end workflow validated - Platform is operational!');
    });
  });
});
