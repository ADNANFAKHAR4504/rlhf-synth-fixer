/**
 * Unit Tests for Payment Processing CloudFormation Stack
 * Tests template structure, resource configurations, and compliance requirements
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load CloudFormation templates
const loadTemplate = (filename) => {
  const templatePath = join(process.cwd(), 'lib', filename);
  const content = readFileSync(templatePath, 'utf8');
  return JSON.parse(content);
};

describe('Master Stack Template Tests', () => {
  let masterStack;

  beforeAll(() => {
    masterStack = loadTemplate('master-stack.json');
  });

  test('should have valid CloudFormation format version', () => {
    expect(masterStack.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have descriptive metadata', () => {
    expect(masterStack.Description).toBeDefined();
    expect(masterStack.Description).toContain('payment processing');
  });

  test('should define EnvironmentSuffix parameter', () => {
    expect(masterStack.Parameters.EnvironmentSuffix).toBeDefined();
    expect(masterStack.Parameters.EnvironmentSuffix.Type).toBe('String');
    expect(masterStack.Parameters.EnvironmentSuffix.AllowedPattern).toBe('[a-z0-9-]+');
  });

  test('should define Environment parameter with allowed values', () => {
    expect(masterStack.Parameters.Environment).toBeDefined();
    expect(masterStack.Parameters.Environment.AllowedValues).toEqual(['production', 'staging']);
  });

  test('should require DB credentials parameters', () => {
    expect(masterStack.Parameters.DBMasterUsername).toBeDefined();
    expect(masterStack.Parameters.DBMasterPassword).toBeDefined();
    expect(masterStack.Parameters.DBMasterPassword.NoEcho).toBe(true);
    expect(masterStack.Parameters.DBMasterPassword.MinLength).toBe(8);
  });

  test('should define nested stack template URL parameters', () => {
    expect(masterStack.Parameters.VPCStackTemplateURL).toBeDefined();
    expect(masterStack.Parameters.DatabaseStackTemplateURL).toBeDefined();
    expect(masterStack.Parameters.ApplicationStackTemplateURL).toBeDefined();
  });

  test('should create VPCStack resource', () => {
    expect(masterStack.Resources.VPCStack).toBeDefined();
    expect(masterStack.Resources.VPCStack.Type).toBe('AWS::CloudFormation::Stack');
    expect(masterStack.Resources.VPCStack.Properties.TemplateURL).toBeDefined();
  });

  test('should create DatabaseStack with dependency on VPCStack', () => {
    expect(masterStack.Resources.DatabaseStack).toBeDefined();
    expect(masterStack.Resources.DatabaseStack.DependsOn).toBe('VPCStack');
  });

  test('should create ApplicationStack with dependency on DatabaseStack', () => {
    expect(masterStack.Resources.ApplicationStack).toBeDefined();
    expect(masterStack.Resources.ApplicationStack.DependsOn).toBe('DatabaseStack');
  });

  test('should pass EnvironmentSuffix to all nested stacks', () => {
    const vpcParams = masterStack.Resources.VPCStack.Properties.Parameters;
    const dbParams = masterStack.Resources.DatabaseStack.Properties.Parameters;
    const appParams = masterStack.Resources.ApplicationStack.Properties.Parameters;

    expect(vpcParams.EnvironmentSuffix).toBeDefined();
    expect(dbParams.EnvironmentSuffix).toBeDefined();
    expect(appParams.EnvironmentSuffix).toBeDefined();
  });

  test('should pass VPC outputs to downstream stacks', () => {
    const dbParams = masterStack.Resources.DatabaseStack.Properties.Parameters;
    const appParams = masterStack.Resources.ApplicationStack.Properties.Parameters;

    expect(dbParams.VPCId).toBeDefined();
    expect(dbParams.PrivateSubnetIds).toBeDefined();
    expect(appParams.VPCId).toBeDefined();
    expect(appParams.PrivateSubnetIds).toBeDefined();
  });

  test('should pass database outputs to application stack', () => {
    const appParams = masterStack.Resources.ApplicationStack.Properties.Parameters;

    expect(appParams.DBSecretArn).toBeDefined();
    expect(appParams.DBClusterEndpoint).toBeDefined();
    expect(appParams.KMSKeyId).toBeDefined();
  });

  test('should export key outputs', () => {
    expect(masterStack.Outputs.VPCId).toBeDefined();
    expect(masterStack.Outputs.APIEndpoint).toBeDefined();
    expect(masterStack.Outputs.DBClusterEndpoint).toBeDefined();
  });

  test('should tag nested stacks appropriately', () => {
    const vpcTags = masterStack.Resources.VPCStack.Properties.Tags;
    const dbTags = masterStack.Resources.DatabaseStack.Properties.Tags;
    const appTags = masterStack.Resources.ApplicationStack.Properties.Tags;

    expect(vpcTags).toBeDefined();
    expect(dbTags).toBeDefined();
    expect(appTags).toBeDefined();

    expect(vpcTags.find(t => t.Key === 'Environment')).toBeDefined();
    expect(vpcTags.find(t => t.Key === 'ManagedBy')).toBeDefined();
  });
});

describe('VPC Stack Template Tests', () => {
  let vpcStack;

  beforeAll(() => {
    vpcStack = loadTemplate('vpc-stack.json');
  });

  test('should have valid CloudFormation format', () => {
    expect(vpcStack.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(vpcStack.Description).toContain('VPC infrastructure');
  });

  test('should create VPC with proper CIDR and DNS settings', () => {
    expect(vpcStack.Resources.VPC).toBeDefined();
    expect(vpcStack.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(vpcStack.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(vpcStack.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    expect(vpcStack.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
  });

  test('should create 3 private subnets across availability zones', () => {
    expect(vpcStack.Resources.PrivateSubnet1).toBeDefined();
    expect(vpcStack.Resources.PrivateSubnet2).toBeDefined();
    expect(vpcStack.Resources.PrivateSubnet3).toBeDefined();

    expect(vpcStack.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(vpcStack.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    expect(vpcStack.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
  });

  test('should create 3 public subnets for NAT gateways', () => {
    expect(vpcStack.Resources.PublicSubnet1).toBeDefined();
    expect(vpcStack.Resources.PublicSubnet2).toBeDefined();
    expect(vpcStack.Resources.PublicSubnet3).toBeDefined();

    expect(vpcStack.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
  });

  test('should create Internet Gateway', () => {
    expect(vpcStack.Resources.InternetGateway).toBeDefined();
    expect(vpcStack.Resources.AttachGateway).toBeDefined();
  });

  test('should create NAT Gateway with EIP', () => {
    expect(vpcStack.Resources.NATGateway1).toBeDefined();
    expect(vpcStack.Resources.NATGateway1EIP).toBeDefined();
    expect(vpcStack.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');
    expect(vpcStack.Resources.NATGateway1EIP.Properties.Domain).toBe('vpc');
  });

  test('should create route tables for public and private subnets', () => {
    expect(vpcStack.Resources.PublicRouteTable).toBeDefined();
    expect(vpcStack.Resources.PrivateRouteTable1).toBeDefined();
  });

  test('should create route to Internet Gateway for public subnets', () => {
    expect(vpcStack.Resources.PublicRoute).toBeDefined();
    expect(vpcStack.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
  });

  test('should create route to NAT Gateway for private subnets', () => {
    expect(vpcStack.Resources.PrivateRoute1).toBeDefined();
    expect(vpcStack.Resources.PrivateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
  });

  test('should associate subnets with route tables', () => {
    expect(vpcStack.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
    expect(vpcStack.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
  });

  test('should include EnvironmentSuffix in all resource names', () => {
    const vpc = vpcStack.Resources.VPC;
    const igw = vpcStack.Resources.InternetGateway;
    const privateSubnet = vpcStack.Resources.PrivateSubnet1;

    expect(JSON.stringify(vpc.Properties.Tags)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(igw.Properties.Tags)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(privateSubnet.Properties.Tags)).toContain('EnvironmentSuffix');
  });

  test('should output VPC and subnet IDs', () => {
    expect(vpcStack.Outputs.VPCId).toBeDefined();
    expect(vpcStack.Outputs.PrivateSubnetIds).toBeDefined();
    expect(vpcStack.Outputs.PublicSubnetIds).toBeDefined();
  });

  test('should return comma-delimited subnet list', () => {
    const privateOutput = vpcStack.Outputs.PrivateSubnetIds.Value;
    expect(privateOutput['Fn::Join']).toBeDefined();
    expect(privateOutput['Fn::Join'][0]).toBe(',');
  });
});

describe('Database Stack Template Tests', () => {
  let dbStack;

  beforeAll(() => {
    dbStack = loadTemplate('database-stack.json');
  });

  test('should have valid CloudFormation format', () => {
    expect(dbStack.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(dbStack.Description).toContain('Database infrastructure');
  });

  test('should require VPC and subnet parameters', () => {
    expect(dbStack.Parameters.VPCId).toBeDefined();
    expect(dbStack.Parameters.PrivateSubnetIds).toBeDefined();
    expect(dbStack.Parameters.PrivateSubnetIds.Type).toBe('CommaDelimitedList');
  });

  test('should require database credentials parameters', () => {
    expect(dbStack.Parameters.DBMasterUsername).toBeDefined();
    expect(dbStack.Parameters.DBMasterPassword).toBeDefined();
    expect(dbStack.Parameters.DBMasterUsername.NoEcho).toBe(true);
    expect(dbStack.Parameters.DBMasterPassword.NoEcho).toBe(true);
  });

  test('should create KMS key for encryption', () => {
    expect(dbStack.Resources.KMSKey).toBeDefined();
    expect(dbStack.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    expect(dbStack.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
  });

  test('should create KMS key alias', () => {
    expect(dbStack.Resources.KMSKeyAlias).toBeDefined();
    expect(dbStack.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
  });

  test('should create security groups for DB and Lambda', () => {
    expect(dbStack.Resources.DBSecurityGroup).toBeDefined();
    expect(dbStack.Resources.LambdaSecurityGroup).toBeDefined();
  });

  test('should allow Lambda to access database on port 3306', () => {
    const dbSG = dbStack.Resources.DBSecurityGroup;
    const ingress = dbSG.Properties.SecurityGroupIngress[0];

    expect(ingress.IpProtocol).toBe('tcp');
    expect(ingress.FromPort).toBe(3306);
    expect(ingress.ToPort).toBe(3306);
  });

  test('should create DB subnet group', () => {
    expect(dbStack.Resources.DBSubnetGroup).toBeDefined();
    expect(dbStack.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
  });

  test('should store credentials in Secrets Manager', () => {
    expect(dbStack.Resources.DBSecret).toBeDefined();
    expect(dbStack.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
  });

  test('should encrypt secrets with KMS', () => {
    const secret = dbStack.Resources.DBSecret;
    expect(secret.Properties.KmsKeyId).toBeDefined();
  });

  test('should create Aurora MySQL cluster', () => {
    expect(dbStack.Resources.DBCluster).toBeDefined();
    expect(dbStack.Resources.DBCluster.Type).toBe('AWS::RDS::DBCluster');
    expect(dbStack.Resources.DBCluster.Properties.Engine).toBe('aurora-mysql');
  });

  test('should enable storage encryption for RDS', () => {
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.StorageEncrypted).toBe(true);
    expect(cluster.Properties.KmsKeyId).toBeDefined();
  });

  test('should configure automated backups', () => {
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
  });

  test('should enable CloudWatch logs export', () => {
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.EnableCloudwatchLogsExports).toEqual(['error', 'general', 'slowquery']);
  });

  test('should create 2 DB instances for Multi-AZ', () => {
    expect(dbStack.Resources.DBInstance1).toBeDefined();
    expect(dbStack.Resources.DBInstance2).toBeDefined();

    const instance1 = dbStack.Resources.DBInstance1;
    const instance2 = dbStack.Resources.DBInstance2;

    expect(instance1.Properties.Engine).toBe('aurora-mysql');
    expect(instance2.Properties.Engine).toBe('aurora-mysql');
    expect(instance1.Properties.PubliclyAccessible).toBe(false);
    expect(instance2.Properties.PubliclyAccessible).toBe(false);
  });

  test('should create CloudWatch alarm for CPU utilization', () => {
    expect(dbStack.Resources.DBCPUAlarm).toBeDefined();
    expect(dbStack.Resources.DBCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');

    const alarm = dbStack.Resources.DBCPUAlarm;
    expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    expect(alarm.Properties.Threshold).toBe(80);
    expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
  });

  test('should output database endpoints and credentials', () => {
    expect(dbStack.Outputs.DBClusterEndpoint).toBeDefined();
    expect(dbStack.Outputs.DBSecretArn).toBeDefined();
    expect(dbStack.Outputs.KMSKeyId).toBeDefined();
    expect(dbStack.Outputs.LambdaSecurityGroupId).toBeDefined();
  });

  test('should include EnvironmentSuffix in resource names', () => {
    const kmsKey = dbStack.Resources.KMSKey;
    const dbSecret = dbStack.Resources.DBSecret;
    const dbCluster = dbStack.Resources.DBCluster;

    expect(JSON.stringify(kmsKey.Properties.Tags)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(dbSecret.Properties.Name)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(dbCluster.Properties.Tags)).toContain('EnvironmentSuffix');
  });
});

describe('Application Stack Template Tests', () => {
  let appStack;

  beforeAll(() => {
    appStack = loadTemplate('application-stack.json');
  });

  test('should have valid CloudFormation format', () => {
    expect(appStack.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(appStack.Description).toContain('Application infrastructure');
  });

  test('should require database and VPC parameters', () => {
    expect(appStack.Parameters.DBSecretArn).toBeDefined();
    expect(appStack.Parameters.DBClusterEndpoint).toBeDefined();
    expect(appStack.Parameters.KMSKeyId).toBeDefined();
    expect(appStack.Parameters.VPCId).toBeDefined();
    expect(appStack.Parameters.PrivateSubnetIds).toBeDefined();
  });

  test('should create SQS dead letter queue', () => {
    expect(appStack.Resources.DeadLetterQueue).toBeDefined();
    expect(appStack.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
  });

  test('should encrypt SQS queues with KMS', () => {
    const dlq = appStack.Resources.DeadLetterQueue;
    const txQueue = appStack.Resources.TransactionQueue;

    expect(dlq.Properties.KmsMasterKeyId).toBeDefined();
    expect(txQueue.Properties.KmsMasterKeyId).toBeDefined();
  });

  test('should create transaction queue with DLQ configuration', () => {
    expect(appStack.Resources.TransactionQueue).toBeDefined();
    const queue = appStack.Resources.TransactionQueue;

    expect(queue.Properties.RedrivePolicy).toBeDefined();
    expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
  });

  test('should set appropriate queue retention periods', () => {
    const dlq = appStack.Resources.DeadLetterQueue;
    const txQueue = appStack.Resources.TransactionQueue;

    expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
    expect(txQueue.Properties.MessageRetentionPeriod).toBe(345600); // 4 days
  });

  test('should create Lambda execution role with proper trust policy', () => {
    expect(appStack.Resources.LambdaExecutionRole).toBeDefined();
    const role = appStack.Resources.LambdaExecutionRole;

    expect(role.Type).toBe('AWS::IAM::Role');
    const trustPolicy = role.Properties.AssumeRolePolicyDocument;
    expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
  });

  test('should grant Lambda VPC access', () => {
    const role = appStack.Resources.LambdaExecutionRole;
    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
  });

  test('should grant Lambda access to Secrets Manager', () => {
    const role = appStack.Resources.LambdaExecutionRole;
    const policy = role.Properties.Policies[0];

    const secretsStatement = policy.PolicyDocument.Statement.find(
      s => s.Action && s.Action.includes('secretsmanager:GetSecretValue')
    );
    expect(secretsStatement).toBeDefined();
  });

  test('should grant Lambda access to KMS for decryption', () => {
    const role = appStack.Resources.LambdaExecutionRole;
    const policy = role.Properties.Policies[0];

    const kmsStatement = policy.PolicyDocument.Statement.find(
      s => s.Action && s.Action.includes('kms:Decrypt')
    );
    expect(kmsStatement).toBeDefined();
  });

  test('should grant Lambda access to Parameter Store', () => {
    const role = appStack.Resources.LambdaExecutionRole;
    const policy = role.Properties.Policies[0];

    const ssmStatement = policy.PolicyDocument.Statement.find(
      s => s.Action && s.Action.includes('ssm:GetParameter')
    );
    expect(ssmStatement).toBeDefined();
  });

  test('should grant Lambda access to SQS queues', () => {
    const role = appStack.Resources.LambdaExecutionRole;
    const policy = role.Properties.Policies[0];

    const sqsStatement = policy.PolicyDocument.Statement.find(
      s => s.Action && s.Action.includes('sqs:SendMessage')
    );
    expect(sqsStatement).toBeDefined();
  });

  test('should create Lambda function with proper configuration', () => {
    expect(appStack.Resources.PaymentProcessorFunction).toBeDefined();
    const lambda = appStack.Resources.PaymentProcessorFunction;

    expect(lambda.Type).toBe('AWS::Lambda::Function');
    expect(lambda.Properties.Runtime).toBe('python3.11');
    expect(lambda.Properties.Handler).toBe('index.handler');
    expect(lambda.Properties.Timeout).toBe(60);
    expect(lambda.Properties.MemorySize).toBe(512);
  });

  test('should configure Lambda with required environment variables', () => {
    const lambda = appStack.Resources.PaymentProcessorFunction;
    const env = lambda.Properties.Environment.Variables;

    expect(env.DB_SECRET_ARN).toBeDefined();
    expect(env.DB_ENDPOINT).toBeDefined();
    expect(env.ENVIRONMENT_SUFFIX).toBeDefined();
    expect(env.QUEUE_URL).toBeDefined();
  });

  test('should deploy Lambda in VPC private subnets', () => {
    const lambda = appStack.Resources.PaymentProcessorFunction;
    expect(lambda.Properties.VpcConfig).toBeDefined();
    expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
  });

  test('should create CloudWatch alarm for Lambda errors', () => {
    expect(appStack.Resources.LambdaErrorAlarm).toBeDefined();
    const alarm = appStack.Resources.LambdaErrorAlarm;

    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    expect(alarm.Properties.MetricName).toBe('Errors');
    expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    expect(alarm.Properties.Threshold).toBe(5);
  });

  test('should create API Gateway REST API', () => {
    expect(appStack.Resources.RestApi).toBeDefined();
    const api = appStack.Resources.RestApi;

    expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
  });

  test('should create API Gateway API key', () => {
    expect(appStack.Resources.ApiKey).toBeDefined();
    const key = appStack.Resources.ApiKey;

    expect(key.Type).toBe('AWS::ApiGateway::ApiKey');
    expect(key.Properties.Enabled).toBe(true);
  });

  test('should create usage plan with throttling', () => {
    expect(appStack.Resources.UsagePlan).toBeDefined();
    const plan = appStack.Resources.UsagePlan;

    expect(plan.Type).toBe('AWS::ApiGateway::UsagePlan');
    expect(plan.Properties.Throttle.BurstLimit).toBe(200);
    expect(plan.Properties.Throttle.RateLimit).toBe(100);
  });

  test('should require API key for endpoints', () => {
    expect(appStack.Resources.PaymentMethod).toBeDefined();
    const method = appStack.Resources.PaymentMethod;

    expect(method.Properties.ApiKeyRequired).toBe(true);
    expect(method.Properties.HttpMethod).toBe('POST');
  });

  test('should create API Gateway role for Lambda invocation', () => {
    expect(appStack.Resources.ApiGatewayRole).toBeDefined();
    const role = appStack.Resources.ApiGatewayRole;

    expect(role.Type).toBe('AWS::IAM::Role');
    const policy = role.Properties.Policies[0];
    expect(policy.PolicyDocument.Statement[0].Action).toBe('lambda:InvokeFunction');
  });

  test('should create SSM parameter for configuration', () => {
    expect(appStack.Resources.ConfigParameter).toBeDefined();
    const param = appStack.Resources.ConfigParameter;

    expect(param.Type).toBe('AWS::SSM::Parameter');
    expect(param.Properties.Type).toBe('String');
    expect(param.Properties.Value).toContain('processingTimeout');
  });

  test('should output API endpoint and queue URLs', () => {
    expect(appStack.Outputs.APIEndpoint).toBeDefined();
    expect(appStack.Outputs.QueueURL).toBeDefined();
    expect(appStack.Outputs.LambdaFunctionArn).toBeDefined();
  });

  test('should include EnvironmentSuffix in resource names', () => {
    const dlq = appStack.Resources.DeadLetterQueue;
    const txQueue = appStack.Resources.TransactionQueue;
    const lambda = appStack.Resources.PaymentProcessorFunction;
    const role = appStack.Resources.LambdaExecutionRole;
    const api = appStack.Resources.RestApi;

    expect(JSON.stringify(dlq.Properties.QueueName)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(txQueue.Properties.QueueName)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(lambda.Properties.FunctionName)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(role.Properties.RoleName)).toContain('EnvironmentSuffix');
    expect(JSON.stringify(api.Properties.Name)).toContain('EnvironmentSuffix');
  });
});

describe('Security and Compliance Tests', () => {
  let masterStack, vpcStack, dbStack, appStack;

  beforeAll(() => {
    masterStack = loadTemplate('master-stack.json');
    vpcStack = loadTemplate('vpc-stack.json');
    dbStack = loadTemplate('database-stack.json');
    appStack = loadTemplate('application-stack.json');
  });

  test('should not have hardcoded credentials', () => {
    const templates = [masterStack, vpcStack, dbStack, appStack];
    templates.forEach(template => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/password.*:.*["'][^${"]/i);
      expect(templateStr).not.toMatch(/secret.*:.*["'][^${"]/i);
      expect(templateStr).not.toMatch(/key.*:.*["'][^${"]/i);
    });
  });

  test('should require encryption at rest for all data stores', () => {
    // RDS encryption
    expect(dbStack.Resources.DBCluster.Properties.StorageEncrypted).toBe(true);

    // SQS encryption
    expect(appStack.Resources.DeadLetterQueue.Properties.KmsMasterKeyId).toBeDefined();
    expect(appStack.Resources.TransactionQueue.Properties.KmsMasterKeyId).toBeDefined();

    // Secrets Manager encryption
    expect(dbStack.Resources.DBSecret.Properties.KmsKeyId).toBeDefined();
  });

  test('should not expose databases publicly', () => {
    expect(dbStack.Resources.DBInstance1.Properties.PubliclyAccessible).toBe(false);
    expect(dbStack.Resources.DBInstance2.Properties.PubliclyAccessible).toBe(false);
  });

  test('should use least-privilege IAM policies', () => {
    const lambdaRole = appStack.Resources.LambdaExecutionRole;
    const policy = lambdaRole.Properties.Policies[0];

    // Check that resources are scoped (not using "*")
    policy.PolicyDocument.Statement.forEach(statement => {
      if (statement.Resource && Array.isArray(statement.Resource)) {
        statement.Resource.forEach(resource => {
          if (typeof resource === 'object') {
            expect(resource).toHaveProperty('Fn::GetAtt');
          }
        });
      }
    });
  });

  test('should enable KMS key rotation', () => {
    expect(dbStack.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
  });

  test('should implement network isolation', () => {
    // Lambda should be in VPC
    const lambda = appStack.Resources.PaymentProcessorFunction;
    expect(lambda.Properties.VpcConfig).toBeDefined();
    expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();

    // Database should use security groups
    expect(dbStack.Resources.DBSecurityGroup).toBeDefined();
  });

  test('should not have any DeletionPolicy set to Retain', () => {
    const templates = [masterStack, vpcStack, dbStack, appStack];
    templates.forEach(template => {
      Object.keys(template.Resources || {}).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  test('should enable CloudWatch monitoring and logging', () => {
    // RDS CloudWatch logs
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
    expect(cluster.Properties.EnableCloudwatchLogsExports.length).toBeGreaterThan(0);

    // CloudWatch alarms
    expect(dbStack.Resources.DBCPUAlarm).toBeDefined();
    expect(appStack.Resources.LambdaErrorAlarm).toBeDefined();
  });

  test('should implement proper backup retention', () => {
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
  });

  test('should use secure communication protocols', () => {
    // API Gateway should use HTTPS (REGIONAL endpoints use HTTPS by default)
    const api = appStack.Resources.RestApi;
    expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');

    // Check API endpoint URL uses HTTPS
    const apiEndpoint = appStack.Outputs.APIEndpoint.Value;
    expect(JSON.stringify(apiEndpoint)).toContain('https://');
  });
});

describe('Multi-Environment Support Tests', () => {
  let masterStack, vpcStack, dbStack, appStack;

  beforeAll(() => {
    masterStack = loadTemplate('master-stack.json');
    vpcStack = loadTemplate('vpc-stack.json');
    dbStack = loadTemplate('database-stack.json');
    appStack = loadTemplate('application-stack.json');
  });

  test('should accept EnvironmentSuffix parameter in all stacks', () => {
    expect(masterStack.Parameters.EnvironmentSuffix).toBeDefined();
    expect(vpcStack.Parameters.EnvironmentSuffix).toBeDefined();
    expect(dbStack.Parameters.EnvironmentSuffix).toBeDefined();
    expect(appStack.Parameters.EnvironmentSuffix).toBeDefined();
  });

  test('should use Fn::Sub to include EnvironmentSuffix in resource names', () => {
    const templates = [vpcStack, dbStack, appStack];
    templates.forEach(template => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toMatch(/\$\{EnvironmentSuffix\}/);
    });
  });

  test('should support environment-specific parameter values', () => {
    expect(masterStack.Parameters.Environment.AllowedValues).toContain('production');
    expect(masterStack.Parameters.Environment.AllowedValues).toContain('staging');
  });

  test('should tag resources with environment information', () => {
    const checkTags = (resource) => {
      if (resource.Properties && resource.Properties.Tags) {
        return resource.Properties.Tags.some(tag =>
          tag.Key === 'Environment' || tag.Key === 'Name'
        );
      }
      return false;
    };

    // Check VPC resources
    expect(checkTags(vpcStack.Resources.VPC)).toBe(true);

    // Check Database resources
    expect(checkTags(dbStack.Resources.KMSKey)).toBe(true);
  });
});

describe('High Availability and Resilience Tests', () => {
  let vpcStack, dbStack, appStack;

  beforeAll(() => {
    vpcStack = loadTemplate('vpc-stack.json');
    dbStack = loadTemplate('database-stack.json');
    appStack = loadTemplate('application-stack.json');
  });

  test('should deploy resources across multiple availability zones', () => {
    // Check private subnets use different AZs
    const subnet1 = vpcStack.Resources.PrivateSubnet1.Properties.AvailabilityZone;
    const subnet2 = vpcStack.Resources.PrivateSubnet2.Properties.AvailabilityZone;
    const subnet3 = vpcStack.Resources.PrivateSubnet3.Properties.AvailabilityZone;

    expect(subnet1['Fn::Select'][0]).toBe(0);
    expect(subnet2['Fn::Select'][0]).toBe(1);
    expect(subnet3['Fn::Select'][0]).toBe(2);
  });

  test('should create multiple database instances for failover', () => {
    expect(dbStack.Resources.DBInstance1).toBeDefined();
    expect(dbStack.Resources.DBInstance2).toBeDefined();
  });

  test('should implement dead letter queue for failed messages', () => {
    const dlq = appStack.Resources.DeadLetterQueue;
    const txQueue = appStack.Resources.TransactionQueue;

    expect(dlq).toBeDefined();
    expect(txQueue.Properties.RedrivePolicy).toBeDefined();
    expect(txQueue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
  });

  test('should configure NAT gateway for outbound connectivity', () => {
    expect(vpcStack.Resources.NATGateway1).toBeDefined();
    expect(vpcStack.Resources.NATGateway1EIP).toBeDefined();
  });

  test('should set appropriate timeout and retry values', () => {
    const lambda = appStack.Resources.PaymentProcessorFunction;
    expect(lambda.Properties.Timeout).toBeDefined();
    expect(lambda.Properties.Timeout).toBeGreaterThan(0);

    const txQueue = appStack.Resources.TransactionQueue;
    expect(txQueue.Properties.VisibilityTimeout).toBe(300);
  });
});

describe('Cost Optimization Tests', () => {
  let dbStack, appStack;

  beforeAll(() => {
    dbStack = loadTemplate('database-stack.json');
    appStack = loadTemplate('application-stack.json');
  });

  test('should use appropriate instance sizes', () => {
    const instance1 = dbStack.Resources.DBInstance1;
    const instance2 = dbStack.Resources.DBInstance2;

    expect(instance1.Properties.DBInstanceClass).toBe('db.t3.medium');
    expect(instance2.Properties.DBInstanceClass).toBe('db.t3.medium');
  });

  test('should set reasonable Lambda memory allocation', () => {
    const lambda = appStack.Resources.PaymentProcessorFunction;
    expect(lambda.Properties.MemorySize).toBe(512);
    expect(lambda.Properties.Timeout).toBe(60);
  });

  test('should use appropriate message retention periods', () => {
    const dlq = appStack.Resources.DeadLetterQueue;
    const txQueue = appStack.Resources.TransactionQueue;

    // 14 days for DLQ (max)
    expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    // 4 days for transaction queue
    expect(txQueue.Properties.MessageRetentionPeriod).toBe(345600);
  });

  test('should optimize backup windows for off-peak times', () => {
    const cluster = dbStack.Resources.DBCluster;
    expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
    expect(cluster.Properties.PreferredMaintenanceWindow).toBeDefined();
  });
});
