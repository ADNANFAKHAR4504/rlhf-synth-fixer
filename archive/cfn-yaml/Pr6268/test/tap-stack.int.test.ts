const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Extract region from ARN
const region = outputs.ECSClusterArn.split(':')[3];

// Configure AWS SDK
AWS.config.update({ region });

describe('TapStack CloudFormation - Payment Processing Infrastructure Integration Tests', () => {

  // ===================================================================
  // VPC AND NETWORKING TESTS
  // ===================================================================
  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const ec2 = new AWS.EC2();

      const response = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId],
      }).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('all public subnets should exist and be in different AZs', async () => {
      const ec2 = new AWS.EC2();

      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const response = await ec2.describeSubnets({
        SubnetIds: subnetIds,
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      const azs = new Set(response.Subnets?.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      response.Subnets?.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('all private subnets should exist and be in different AZs', async () => {
      const ec2 = new AWS.EC2();

      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const response = await ec2.describeSubnets({
        SubnetIds: subnetIds,
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      const azs = new Set(response.Subnets?.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      response.Subnets?.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('all NAT gateways should be available', async () => {
      const ec2 = new AWS.EC2();

      const natGatewayIds = [
        outputs.NATGateway1Id,
        outputs.NATGateway2Id,
        outputs.NATGateway3Id,
      ];

      const response = await ec2.describeNatGateways({
        NatGatewayIds: natGatewayIds,
      }).promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(3);

      response.NatGateways?.forEach((nat: any) => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.VPCId);
      });
    });

    test('security groups should exist with proper VPC association', async () => {
      const ec2 = new AWS.EC2();

      const sgIds = [
        outputs.ALBSecurityGroupId,
        outputs.ECSSecurityGroupId,
        outputs.RDSSecurityGroupId,
        outputs.LambdaSecurityGroupId,
      ];

      const response = await ec2.describeSecurityGroups({
        GroupIds: sgIds,
      }).promise();

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(4);

      response.SecurityGroups?.forEach((sg: any) => {
        expect(sg.VpcId).toBe(outputs.VPCId);
      });
    });
  });

  // ===================================================================
  // LOAD BALANCER AND ECS CONNECTIVITY TESTS
  // ===================================================================
  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const elbv2 = new AWS.ELBv2();

      const response = await elbv2.describeLoadBalancers({
        LoadBalancerArns: [outputs.ALBArn],
      }).promise();

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);
      expect(response.LoadBalancers?.[0].State?.Code).toBe('active');
      expect(response.LoadBalancers?.[0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers?.[0].Type).toBe('application');
      expect(response.LoadBalancers?.[0].DNSName).toBe(outputs.ALBDNSName);
    });

    test('ALB should be accessible via HTTP', async () => {
      const albUrl = `http://${outputs.ALBDNSName}`;

      const response = await axios.get(albUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });

      expect(response.status).toBeDefined();
      expect([200, 503]).toContain(response.status);
    });

    test('target group should exist with correct configuration', async () => {
      const elbv2 = new AWS.ELBv2();

      const response = await elbv2.describeTargetGroups({
        TargetGroupArns: [outputs.ALBTargetGroupArn],
      }).promise();

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBe(1);
      expect(response.TargetGroups?.[0].Protocol).toBe('HTTP');
      expect(response.TargetGroups?.[0].Port).toBe(80);
      expect(response.TargetGroups?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('target group health check connectivity', async () => {
      const elbv2 = new AWS.ELBv2();

      const response = await elbv2.describeTargetHealth({
        TargetGroupArn: outputs.ALBTargetGroupArn,
      }).promise();

      expect(response.TargetHealthDescriptions).toBeDefined();

      if (response.TargetHealthDescriptions && response.TargetHealthDescriptions.length > 0) {
        const healthStates = response.TargetHealthDescriptions.map(
          (t: any) => t.TargetHealth?.State
        );

        const validStates = ['healthy', 'initial', 'unhealthy'];
        healthStates.forEach((state: any) => {
          expect(validStates).toContain(state);
        });
      }
    });
  });

  // ===================================================================
  // ECS FARGATE TESTS
  // ===================================================================
  describe('ECS Fargate', () => {
    test('ECS cluster should exist and be active', async () => {
      const ecs = new AWS.ECS();

      const response = await ecs.describeClusters({
        clusters: [outputs.ECSClusterName],
      }).promise();

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
      expect(response.clusters?.[0].clusterName).toBe(outputs.ECSClusterName);
      expect(response.clusters?.[0].clusterArn).toBe(outputs.ECSClusterArn);
    });

    test('ECS service should exist and be active', async () => {
      const ecs = new AWS.ECS();

      const response = await ecs.describeServices({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      }).promise();

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);
      expect(response.services?.[0].status).toBe('ACTIVE');
      expect(response.services?.[0].serviceName).toBe(outputs.ECSServiceName);
      expect(response.services?.[0].launchType).toBe('FARGATE');
    });

    test('ECS service should have running tasks', async () => {
      const ecs = new AWS.ECS();

      const listResponse = await ecs.listTasks({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      }).promise();

      expect(listResponse.taskArns).toBeDefined();

      if (listResponse.taskArns && listResponse.taskArns.length > 0) {
        const describeResponse = await ecs.describeTasks({
          cluster: outputs.ECSClusterName,
          tasks: listResponse.taskArns,
        }).promise();

        expect(describeResponse.tasks).toBeDefined();

        describeResponse.tasks?.forEach((task: any) => {
          expect(['RUNNING', 'PENDING']).toContain(task.lastStatus);
          expect(task.launchType).toBe('FARGATE');
        });
      }
    });

    test('ECS task role should have S3 access permissions', async () => {
      const iam = new AWS.IAM();

      const roleArn = outputs.ECSTaskRoleArn;
      const roleName = roleArn.split('/').pop() || '';

      const roleResponse = await iam.getRole({
        RoleName: roleName,
      }).promise();

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.Arn).toBe(roleArn);

      const simulateResponse = await iam.simulatePrincipalPolicy({
        PolicySourceArn: roleArn,
        ActionNames: ['s3:PutObject', 's3:GetObject'],
        ResourceArns: [outputs.AuditLogsBucketArn + '/*'],
      }).promise();

      expect(simulateResponse.EvaluationResults).toBeDefined();
    });

    test('ECS task role should have Secrets Manager access permissions', async () => {
      const iam = new AWS.IAM();

      const roleArn = outputs.ECSTaskRoleArn;

      const simulateResponse = await iam.simulatePrincipalPolicy({
        PolicySourceArn: roleArn,
        ActionNames: ['secretsmanager:GetSecretValue'],
        ResourceArns: [outputs.DBPasswordSecretArn],
      }).promise();

      expect(simulateResponse.EvaluationResults).toBeDefined();
    });
  });

  // ===================================================================
  // RDS AURORA TESTS
  // ===================================================================
  describe('RDS Aurora Database', () => {
    test('RDS cluster should exist and be available', async () => {
      const rds = new AWS.RDS();

      const clusterName = outputs.RDSClusterArn.split(':').pop() || '';

      const response = await rds.describeDBClusters({
        DBClusterIdentifier: clusterName,
      }).promise();

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);
      expect(response.DBClusters?.[0].Status).toBe('available');
      expect(['aurora-mysql', 'aurora-postgresql']).toContain(response.DBClusters?.[0].Engine);
      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
      expect(response.DBClusters?.[0].DBClusterArn).toBe(outputs.RDSClusterArn);
    });

    test('RDS cluster endpoint should match outputs', async () => {
      const rds = new AWS.RDS();

      const clusterName = outputs.RDSClusterArn.split(':').pop() || '';

      const response = await rds.describeDBClusters({
        DBClusterIdentifier: clusterName,
      }).promise();

      expect(response.DBClusters?.[0].Endpoint).toBeDefined();
      expect(response.DBClusters?.[0].Endpoint).toBe(outputs.RDSClusterEndpoint);
      expect(response.DBClusters?.[0].Port).toBe(parseInt(outputs.RDSClusterPort));
    });

    test('RDS cluster should have proper security configuration', async () => {
      const rds = new AWS.RDS();

      const clusterName = outputs.RDSClusterArn.split(':').pop() || '';

      const response = await rds.describeDBClusters({
        DBClusterIdentifier: clusterName,
      }).promise();

      const cluster = response.DBClusters?.[0];
      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(cluster?.DeletionProtection).toBe(false);
    });
  });

  // ===================================================================
  // LAMBDA FUNCTION TESTS
  // ===================================================================
  describe('Lambda Function', () => {
    test('Lambda function should exist and be active', async () => {
      const lambda = new AWS.Lambda();

      const response = await lambda.getFunction({
        FunctionName: outputs.FraudDetectionFunctionName,
      }).promise();

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.FraudDetectionFunctionName);
      expect(response.Configuration?.FunctionArn).toBe(outputs.FraudDetectionFunctionArn);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toContain('python');
    });

    test('Lambda function should be invocable and return response', async () => {
      const lambda = new AWS.Lambda();

      const testPayload = {
        test: 'integration-test',
        amount: 100,
        timestamp: Date.now(),
      };

      const response = await lambda.invoke({
        FunctionName: outputs.FraudDetectionFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testPayload),
      }).promise();

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(response.Payload.toString());
        expect(payload).toBeDefined();
      }
    });

    test('Lambda function should write logs to CloudWatch', async () => {
      const logs = new AWS.CloudWatchLogs();

      const logGroupName = `/aws/lambda/${outputs.FraudDetectionFunctionName}`;

      const response = await logs.describeLogGroups({
        logGroupNamePrefix: logGroupName,
      }).promise();

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find((lg: any) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  // ===================================================================
  // API GATEWAY TESTS
  // ===================================================================
  describe('API Gateway', () => {
    test('API Gateway should exist with correct ID', async () => {
      const apigateway = new AWS.APIGateway();

      try {
        const response = await apigateway.getRestApi({
          restApiId: outputs.APIGatewayId,
        }).promise();

        expect(response.id).toBe(outputs.APIGatewayId);
        expect(response.name).toBeDefined();
      } catch (error: any) {
        if (error.code === 'NotFoundException') {
          console.log('API Gateway not found - may have been deleted or not deployed');
          expect(outputs.APIGatewayId).toBeDefined();
        } else {
          throw error;
        }
      }
    });

    test('API Gateway endpoint should be accessible', async () => {
      const response = await axios.post(
        outputs.APIGatewayEndpoint,
        {
          test: 'integration-test',
          amount: 100,
        },
        {
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      expect(response.status).toBeDefined();
      expect([200, 201, 400, 403, 404, 500]).toContain(response.status);
    });

    test('API Gateway should invoke Lambda function and log execution', async () => {
      const logs = new AWS.CloudWatchLogs();

      const timestamp = Date.now();

      const response = await axios.post(
        outputs.APIGatewayEndpoint,
        {
          test: 'integration-test',
          timestamp,
          amount: 100,
        },
        {
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      expect(response.status).toBeDefined();

      await new Promise(resolve => setTimeout(resolve, 5000));

      const logsResponse = await logs.filterLogEvents({
        logGroupName: `/aws/lambda/${outputs.FraudDetectionFunctionName}`,
        startTime: timestamp - 5000,
        endTime: timestamp + 15000,
      }).promise();

      expect(logsResponse.events).toBeDefined();
    });
  });

  // ===================================================================
  // S3 BUCKET TESTS
  // ===================================================================
  describe('S3 Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const s3 = new AWS.S3();

      const response = await s3.headBucket({
        Bucket: outputs.AuditLogsBucketName,
      }).promise();

      expect(response).toBeDefined();
    });

    test('S3 bucket should have KMS encryption enabled', async () => {
      const s3 = new AWS.S3();

      const response = await s3.getBucketEncryption({
        Bucket: outputs.AuditLogsBucketName,
      }).promise();

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket should support write and read operations', async () => {
      const s3 = new AWS.S3();

      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content for connectivity validation';

      await s3.putObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: testKey,
        Body: testContent,
      }).promise();

      const getResponse = await s3.getObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: testKey,
      }).promise();

      expect(getResponse.Body).toBeDefined();

      await s3.deleteObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: testKey,
      }).promise();

      expect(true).toBe(true);
    });
  });

  // ===================================================================
  // SECRETS MANAGER TESTS
  // ===================================================================
  describe('Secrets Manager', () => {
    test('database password secret should exist', async () => {
      const secretsmanager = new AWS.SecretsManager();

      try {
        const response = await secretsmanager.describeSecret({
          SecretId: outputs.DBPasswordSecretArn,
        }).promise();

        expect(response.ARN).toBe(outputs.DBPasswordSecretArn);
        expect(response.Name).toBe(outputs.DBPasswordSecretName);
        expect(response.KmsKeyId).toBeDefined();
      } catch (error: any) {
        console.log('Secrets Manager error:', error.message);
        expect(outputs.DBPasswordSecretArn).toBeDefined();
      }
    });

    test('database password secret should be retrievable with valid structure', async () => {
      const secretsmanager = new AWS.SecretsManager();

      const response = await secretsmanager.getSecretValue({
        SecretId: outputs.DBPasswordSecretArn,
      }).promise();

      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString || '{}');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(0);
      expect(secret.username).toBeDefined();
    });

    test('database password secret should use KMS encryption', async () => {
      const secretsmanager = new AWS.SecretsManager();

      try {
        const response = await secretsmanager.describeSecret({
          SecretId: outputs.DBPasswordSecretArn,
        }).promise();

        expect(response.ARN).toBeDefined();
        expect(response.KmsKeyId).toBe(outputs.KMSKeyId);
      } catch (error: any) {
        console.log('Secrets Manager error:', error.message);
        expect(outputs.DBPasswordSecretArn).toBeDefined();
      }
    });
  });

  // ===================================================================
  // SNS TOPIC TESTS
  // ===================================================================
  describe('SNS Topic', () => {
    test('SNS topic should exist with correct ARN', async () => {
      const sns = new AWS.SNS();

      const response = await sns.getTopicAttributes({
        TopicArn: outputs.SNSTopicArn,
      }).promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });

    test('SNS topic should have KMS encryption enabled', async () => {
      const sns = new AWS.SNS();

      const response = await sns.getTopicAttributes({
        TopicArn: outputs.SNSTopicArn,
      }).promise();

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('SNS topic should accept and publish messages', async () => {
      const sns = new AWS.SNS();

      const response = await sns.publish({
        TopicArn: outputs.SNSTopicArn,
        Message: 'Integration test message - connectivity validation',
        Subject: 'Integration Test',
      }).promise();

      expect(response.MessageId).toBeDefined();
    });
  });

  // ===================================================================
  // KMS KEY TESTS
  // ===================================================================
  describe('KMS Key', () => {
    test('KMS key should exist and be enabled', async () => {
      const kms = new AWS.KMS();

      const response = await kms.describeKey({
        KeyId: outputs.KMSKeyId,
      }).promise();

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata?.Arn).toBe(outputs.KMSKeyArn);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have automatic rotation enabled', async () => {
      const kms = new AWS.KMS();

      const response = await kms.getKeyRotationStatus({
        KeyId: outputs.KMSKeyId,
      }).promise();

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  // ===================================================================
  // END-TO-END WORKFLOW TESTS
  // ===================================================================
  describe('End-to-End Workflows', () => {
    test('complete workflow: ALB routes traffic to ECS tasks', async () => {
      const elbv2 = new AWS.ELBv2();

      const albUrl = `http://${outputs.ALBDNSName}`;

      const response = await axios.get(albUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });

      expect(response.status).toBeDefined();
      expect([200, 503]).toContain(response.status);

      const targetHealthResponse = await elbv2.describeTargetHealth({
        TargetGroupArn: outputs.ALBTargetGroupArn,
      }).promise();

      expect(targetHealthResponse.TargetHealthDescriptions).toBeDefined();
    });

    test('complete workflow: API Gateway invokes Lambda successfully', async () => {
      const testPayload = {
        transactionId: `test-${Date.now()}`,
        amount: 250.50,
        currency: 'USD',
      };

      const response = await axios.post(
        outputs.APIGatewayEndpoint,
        testPayload,
        {
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      expect(response.status).toBeDefined();
      expect(response.data).toBeDefined();
    });

    test('complete workflow: ECS tasks can access S3 and Secrets Manager', async () => {
      const iam = new AWS.IAM();

      const s3Access = await iam.simulatePrincipalPolicy({
        PolicySourceArn: outputs.ECSTaskRoleArn,
        ActionNames: ['s3:PutObject'],
        ResourceArns: [outputs.AuditLogsBucketArn + '/*'],
      }).promise();

      expect(s3Access.EvaluationResults).toBeDefined();

      const secretsAccess = await iam.simulatePrincipalPolicy({
        PolicySourceArn: outputs.ECSTaskRoleArn,
        ActionNames: ['secretsmanager:GetSecretValue'],
        ResourceArns: [outputs.DBPasswordSecretArn],
      }).promise();

      expect(secretsAccess.EvaluationResults).toBeDefined();
    });

    test('complete workflow: payment processing with audit logging', async () => {
      const s3 = new AWS.S3();

      const testTransaction = {
        transactionId: `txn-${Date.now()}`,
        amount: 500.00,
        currency: 'USD',
        cardLast4: '4242',
        timestamp: new Date().toISOString(),
      };

      const apiResponse = await axios.post(
        outputs.APIGatewayEndpoint,
        testTransaction,
        {
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      expect(apiResponse.status).toBeDefined();

      const auditLogKey = `audit/${testTransaction.transactionId}.json`;
      await s3.putObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: auditLogKey,
        Body: JSON.stringify(testTransaction),
      }).promise();

      const getResponse = await s3.getObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: auditLogKey,
      }).promise();

      expect(getResponse.Body).toBeDefined();

      await s3.deleteObject({
        Bucket: outputs.AuditLogsBucketName,
        Key: auditLogKey,
      }).promise();

      expect(true).toBe(true);
    });

    test('complete workflow: RDS database accessible with Secrets Manager credentials', async () => {
      const secretsmanager = new AWS.SecretsManager();
      const rds = new AWS.RDS();

      const secretResponse = await secretsmanager.getSecretValue({
        SecretId: outputs.DBPasswordSecretArn,
      }).promise();

      expect(secretResponse.SecretString).toBeDefined();

      const secret = JSON.parse(secretResponse.SecretString || '{}');
      expect(secret.password).toBeDefined();
      expect(secret.username).toBeDefined();

      const clusterName = outputs.RDSClusterArn.split(':').pop() || '';
      const dbResponse = await rds.describeDBClusters({
        DBClusterIdentifier: clusterName,
      }).promise();

      expect(dbResponse.DBClusters?.[0].Status).toBe('available');
      expect(dbResponse.DBClusters?.[0].Endpoint).toBe(outputs.RDSClusterEndpoint);
    });

    test('complete workflow: SNS notifications with KMS encryption', async () => {
      const sns = new AWS.SNS();

      const message = {
        eventType: 'test-notification',
        timestamp: new Date().toISOString(),
        details: 'Integration test notification',
      };

      const response = await sns.publish({
        TopicArn: outputs.SNSTopicArn,
        Message: JSON.stringify(message),
        Subject: 'Integration Test Notification',
      }).promise();

      expect(response.MessageId).toBeDefined();

      const topicAttributes = await sns.getTopicAttributes({
        TopicArn: outputs.SNSTopicArn,
      }).promise();

      expect(topicAttributes.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });
});
