import * as fs from 'fs';
import * as path from 'path';
import { loadFraudDetectionTemplate, FraudDetectionTemplateLoader } from '../lib/fraud-detection-template-loader';

describe('FraudDetectionStack Unit Tests', () => {
  let template: any;
  let loader: FraudDetectionTemplateLoader;
  const templatePath = path.join(__dirname, '..', 'lib', 'fraud-detection-template.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
    loader = loadFraudDetectionTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toContain('Serverless Fraud Detection Pipeline');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters).toHaveProperty('EnvironmentSuffix');
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct table name with environmentSuffix', () => {
      const tableName = template.Resources.TransactionTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toBe('transactions-${EnvironmentSuffix}');
    });

    test('should have correct key schema', () => {
      const keySchema = template.Resources.TransactionTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(template.Resources.TransactionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled', () => {
      expect(template.Resources.TransactionTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have encryption enabled', () => {
      expect(template.Resources.TransactionTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('S3 Bucket', () => {
    test('should have TransactionArchiveBucket resource', () => {
      expect(template.Resources.TransactionArchiveBucket).toBeDefined();
      expect(template.Resources.TransactionArchiveBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have globally unique bucket name with AccountId', () => {
      const bucketName = template.Resources.TransactionArchiveBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have versioning enabled', () => {
      expect(template.Resources.TransactionArchiveBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle rule for Glacier transition', () => {
      const rules = template.Resources.TransactionArchiveBucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].Transitions[0].TransitionInDays).toBe(90);
      expect(rules[0].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('should have intelligent tiering configuration', () => {
      const tiering = template.Resources.TransactionArchiveBucket.Properties.IntelligentTieringConfigurations;
      expect(tiering).toHaveLength(1);
      expect(tiering[0].Status).toBe('Enabled');
    });
  });

  describe('SNS Topic', () => {
    test('should have ComplianceAlertTopic resource', () => {
      expect(template.Resources.ComplianceAlertTopic).toBeDefined();
      expect(template.Resources.ComplianceAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have correct topic name with environmentSuffix', () => {
      const topicName = template.Resources.ComplianceAlertTopic.Properties.TopicName;
      expect(topicName['Fn::Sub']).toBe('compliance-alerts-${EnvironmentSuffix}');
    });

    test('should have display name', () => {
      expect(template.Resources.ComplianceAlertTopic.Properties.DisplayName).toBe('Fraud Detection Compliance Alerts');
    });
  });

  describe('Lambda Functions', () => {
    describe('FraudDetectionLambda', () => {
      test('should have FraudDetectionLambda resource', () => {
        expect(template.Resources.FraudDetectionLambda).toBeDefined();
        expect(template.Resources.FraudDetectionLambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have correct function name with environmentSuffix', () => {
        const functionName = template.Resources.FraudDetectionLambda.Properties.FunctionName;
        expect(functionName['Fn::Sub']).toBe('fraud-detection-${EnvironmentSuffix}');
      });

      test('should use Python 3.11 runtime', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.Runtime).toBe('python3.11');
      });

      test('should have 1GB memory', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.MemorySize).toBe(1024);
      });

      test('should have 60 second timeout', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.Timeout).toBe(60);
      });

      test('should have reserved concurrency configured', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.ReservedConcurrentExecutions).toBeDefined();
        expect(template.Resources.FraudDetectionLambda.Properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
      });

      test('should have X-Ray tracing enabled', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.TracingConfig.Mode).toBe('Active');
      });

      test('should have environment variables', () => {
        const envVars = template.Resources.FraudDetectionLambda.Properties.Environment.Variables;
        expect(envVars.TABLE_NAME).toBeDefined();
        expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      });

      test('should have inline code', () => {
        expect(template.Resources.FraudDetectionLambda.Properties.Code.ZipFile).toBeDefined();
        expect(template.Resources.FraudDetectionLambda.Properties.Code.ZipFile).toContain('import boto3');
      });

      test('should depend on log group', () => {
        expect(template.Resources.FraudDetectionLambda.DependsOn).toBe('FraudDetectionLambdaLogGroup');
      });
    });

    describe('PostProcessLambda', () => {
      test('should have PostProcessLambda resource', () => {
        expect(template.Resources.PostProcessLambda).toBeDefined();
        expect(template.Resources.PostProcessLambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have correct function name with environmentSuffix', () => {
        const functionName = template.Resources.PostProcessLambda.Properties.FunctionName;
        expect(functionName['Fn::Sub']).toBe('post-process-${EnvironmentSuffix}');
      });

      test('should use Python 3.11 runtime', () => {
        expect(template.Resources.PostProcessLambda.Properties.Runtime).toBe('python3.11');
      });

      test('should have environment variables for table and bucket', () => {
        const envVars = template.Resources.PostProcessLambda.Properties.Environment.Variables;
        expect(envVars.TABLE_NAME).toBeDefined();
        expect(envVars.BUCKET_NAME).toBeDefined();
      });
    });
  });

  describe('IAM Roles', () => {
    describe('FraudDetectionLambdaRole', () => {
      test('should have FraudDetectionLambdaRole resource', () => {
        expect(template.Resources.FraudDetectionLambdaRole).toBeDefined();
        expect(template.Resources.FraudDetectionLambdaRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have Lambda service trust policy', () => {
        const assumePolicy = template.Resources.FraudDetectionLambdaRole.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have AWSLambdaBasicExecutionRole managed policy', () => {
        const managedPolicies = template.Resources.FraudDetectionLambdaRole.Properties.ManagedPolicyArns;
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      });

      test('should have X-Ray write access policy', () => {
        const managedPolicies = template.Resources.FraudDetectionLambdaRole.Properties.ManagedPolicyArns;
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
      });

      test('should have DynamoDB access policy', () => {
        const policies = template.Resources.FraudDetectionLambdaRole.Properties.Policies;
        const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
        expect(dynamoPolicy).toBeDefined();
        expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      });

      test('should have SNS publish access policy', () => {
        const policies = template.Resources.FraudDetectionLambdaRole.Properties.Policies;
        const snsPolicy = policies.find((p: any) => p.PolicyName === 'SNSPublishAccess');
        expect(snsPolicy).toBeDefined();
        expect(snsPolicy.PolicyDocument.Statement[0].Action).toContain('sns:Publish');
      });
    });

    describe('PostProcessLambdaRole', () => {
      test('should have PostProcessLambdaRole resource', () => {
        expect(template.Resources.PostProcessLambdaRole).toBeDefined();
        expect(template.Resources.PostProcessLambdaRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have S3 access policy', () => {
        const policies = template.Resources.PostProcessLambdaRole.Properties.Policies;
        const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
        expect(s3Policy).toBeDefined();
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      });

      test('should have DynamoDB read access policy', () => {
        const policies = template.Resources.PostProcessLambdaRole.Properties.Policies;
        const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBReadAccess');
        expect(dynamoPolicy).toBeDefined();
        expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      });
    });

    describe('StepFunctionsRole', () => {
      test('should have StepFunctionsRole resource', () => {
        expect(template.Resources.StepFunctionsRole).toBeDefined();
        expect(template.Resources.StepFunctionsRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have Step Functions service trust policy', () => {
        const assumePolicy = template.Resources.StepFunctionsRole.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Principal.Service).toBe('states.amazonaws.com');
      });

      test('should have Lambda invoke access', () => {
        const policies = template.Resources.StepFunctionsRole.Properties.Policies;
        const lambdaPolicy = policies.find((p: any) => p.PolicyName === 'LambdaInvokeAccess');
        expect(lambdaPolicy).toBeDefined();
        expect(lambdaPolicy.PolicyDocument.Statement[0].Action).toContain('lambda:InvokeFunction');
      });
    });

    describe('EventBridgeRole', () => {
      test('should have EventBridgeRole resource', () => {
        expect(template.Resources.EventBridgeRole).toBeDefined();
        expect(template.Resources.EventBridgeRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have EventBridge service trust policy', () => {
        const assumePolicy = template.Resources.EventBridgeRole.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Principal.Service).toBe('events.amazonaws.com');
      });

      test('should have Step Functions start execution access', () => {
        const policies = template.Resources.EventBridgeRole.Properties.Policies;
        const sfnPolicy = policies.find((p: any) => p.PolicyName === 'StepFunctionsExecutionAccess');
        expect(sfnPolicy).toBeDefined();
        expect(sfnPolicy.PolicyDocument.Statement[0].Action).toContain('states:StartExecution');
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have FraudDetectionLambdaLogGroup', () => {
      expect(template.Resources.FraudDetectionLambdaLogGroup).toBeDefined();
      expect(template.Resources.FraudDetectionLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have PostProcessLambdaLogGroup', () => {
      expect(template.Resources.PostProcessLambdaLogGroup).toBeDefined();
      expect(template.Resources.PostProcessLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have 30-day retention for fraud detection logs', () => {
      expect(template.Resources.FraudDetectionLambdaLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have 30-day retention for post-process logs', () => {
      expect(template.Resources.PostProcessLambdaLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Step Functions State Machine', () => {
    test('should have FraudDetectionStateMachine resource', () => {
      expect(template.Resources.FraudDetectionStateMachine).toBeDefined();
      expect(template.Resources.FraudDetectionStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('should have correct state machine name with environmentSuffix', () => {
      const name = template.Resources.FraudDetectionStateMachine.Properties.StateMachineName;
      expect(name['Fn::Sub']).toBe('fraud-detection-workflow-${EnvironmentSuffix}');
    });

    test('should have definition string', () => {
      const definition = template.Resources.FraudDetectionStateMachine.Properties.DefinitionString;
      expect(definition).toBeDefined();
    });

    test('should have role ARN reference', () => {
      const roleArn = template.Resources.FraudDetectionStateMachine.Properties.RoleArn;
      expect(roleArn['Fn::GetAtt']).toEqual(['StepFunctionsRole', 'Arn']);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have TransactionEventRule resource', () => {
      expect(template.Resources.TransactionEventRule).toBeDefined();
      expect(template.Resources.TransactionEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have correct rule name with environmentSuffix', () => {
      const name = template.Resources.TransactionEventRule.Properties.Name;
      expect(name['Fn::Sub']).toBe('transaction-event-rule-${EnvironmentSuffix}');
    });

    test('should have event pattern for high-risk transactions', () => {
      const eventPattern = template.Resources.TransactionEventRule.Properties.EventPattern;
      expect(eventPattern.source).toContain('custom.transactions');
      expect(eventPattern['detail-type']).toContain('Transaction Received');
      expect(eventPattern.detail.riskLevel).toContain('high');
    });

    test('should be enabled', () => {
      expect(template.Resources.TransactionEventRule.Properties.State).toBe('ENABLED');
    });

    test('should have Step Functions target', () => {
      const targets = template.Resources.TransactionEventRule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Id).toBe('FraudDetectionTarget');
    });
  });

  describe('Stack Outputs', () => {
    test('should have StateMachineArn output', () => {
      expect(template.Outputs.StateMachineArn).toBeDefined();
      expect(template.Outputs.StateMachineArn.Value.Ref).toBe('FraudDetectionStateMachine');
    });

    test('should have ArchiveBucketName output', () => {
      expect(template.Outputs.ArchiveBucketName).toBeDefined();
      expect(template.Outputs.ArchiveBucketName.Value.Ref).toBe('TransactionArchiveBucket');
    });

    test('should have ComplianceTopicArn output', () => {
      expect(template.Outputs.ComplianceTopicArn).toBeDefined();
      expect(template.Outputs.ComplianceTopicArn.Value.Ref).toBe('ComplianceAlertTopic');
    });

    test('should have TransactionTableName output', () => {
      expect(template.Outputs.TransactionTableName).toBeDefined();
      expect(template.Outputs.TransactionTableName.Value.Ref).toBe('TransactionTable');
    });

    test('should have FraudDetectionLambdaArn output', () => {
      expect(template.Outputs.FraudDetectionLambdaArn).toBeDefined();
      expect(template.Outputs.FraudDetectionLambdaArn.Value['Fn::GetAtt']).toEqual(['FraudDetectionLambda', 'Arn']);
    });

    test('should have exports with environmentSuffix', () => {
      expect(template.Outputs.StateMachineArn.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Outputs.ArchiveBucketName.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Outputs.ComplianceTopicArn.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Resource Count', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13); // 13 CloudFormation resources
    });
  });

  describe('No Retain Policies', () => {
    test('should not have any RemovalPolicy Retain', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('RemovalPolicy');
      expect(templateStr).not.toContain('Retain');
    });

    test('should not have DeletionProtection enabled', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('DeletionProtection');
    });
  });

  describe('Template Loader Tests', () => {
    test('loader should load template correctly', () => {
      expect(loader.getTemplate()).toBeDefined();
    });

    test('should get resources correctly', () => {
      const resources = loader.getResources();
      expect(Object.keys(resources).length).toBe(13);
    });

    test('should get specific resource', () => {
      const table = loader.getResource('TransactionTable');
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should get parameters correctly', () => {
      const params = loader.getParameters();
      expect(params.EnvironmentSuffix).toBeDefined();
    });

    test('should get specific parameter', () => {
      const param = loader.getParameter('EnvironmentSuffix');
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });

    test('should get outputs correctly', () => {
      const outputs = loader.getOutputs();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should get specific output', () => {
      const output = loader.getOutput('StateMachineArn');
      expect(output).toBeDefined();
    });

    test('should get resources by type', () => {
      const iamRoles = loader.getResourcesByType('AWS::IAM::Role');
      expect(Object.keys(iamRoles).length).toBe(4);
    });

    test('should check resource existence', () => {
      expect(loader.hasResource('TransactionTable')).toBe(true);
      expect(loader.hasResource('NonExistent')).toBe(false);
    });

    test('should check parameter existence', () => {
      expect(loader.hasParameter('EnvironmentSuffix')).toBe(true);
      expect(loader.hasParameter('NonExistent')).toBe(false);
    });

    test('should check output existence', () => {
      expect(loader.hasOutput('StateMachineArn')).toBe(true);
      expect(loader.hasOutput('NonExistent')).toBe(false);
    });

    test('should get resource count', () => {
      expect(loader.getResourceCount()).toBe(13);
    });

    test('should get parameter count', () => {
      expect(loader.getParameterCount()).toBe(1);
    });

    test('should get output count', () => {
      expect(loader.getOutputCount()).toBe(5);
    });

    test('should validate resource property', () => {
      expect(loader.validateResourceProperty('TransactionTable', 'Type', 'AWS::DynamoDB::Table')).toBe(true);
      expect(loader.validateResourceProperty('TransactionTable', 'Type', 'Wrong')).toBe(false);
      expect(loader.validateResourceProperty('NonExistent', 'Type')).toBe(false);
      expect(loader.validateResourceProperty('TransactionTable', 'Type')).toBe(true);
      expect(loader.validateResourceProperty('TransactionTable', 'Properties.NonExistent.Deep.Path')).toBe(false);
    });

    test('should get resource property', () => {
      const billingMode = loader.getResourceProperty('TransactionTable', 'Properties.BillingMode');
      expect(billingMode).toBe('PAY_PER_REQUEST');
    });

    test('should check resource property existence', () => {
      expect(loader.hasResourceProperty('TransactionTable', 'Properties.BillingMode')).toBe(true);
      expect(loader.hasResourceProperty('TransactionTable', 'Properties.NonExistent')).toBe(false);
    });

    test('should get IAM roles', () => {
      const roles = loader.getIAMRoles();
      expect(Object.keys(roles).length).toBe(4);
    });

    test('should get Lambda functions', () => {
      const functions = loader.getLambdaFunctions();
      expect(Object.keys(functions).length).toBe(2);
    });

    test('should get DynamoDB tables', () => {
      const tables = loader.getDynamoDBTables();
      expect(Object.keys(tables).length).toBe(1);
    });

    test('should get S3 buckets', () => {
      const buckets = loader.getS3Buckets();
      expect(Object.keys(buckets).length).toBe(1);
    });

    test('should get SNS topics', () => {
      const topics = loader.getSNSTopics();
      expect(Object.keys(topics).length).toBe(1);
    });

    test('should get Step Functions state machines', () => {
      const machines = loader.getStepFunctionsStateMachines();
      expect(Object.keys(machines).length).toBe(1);
    });

    test('should get EventBridge rules', () => {
      const rules = loader.getEventBridgeRules();
      expect(Object.keys(rules).length).toBe(1);
    });

    test('should get Log Groups', () => {
      const logGroups = loader.getLogGroups();
      expect(Object.keys(logGroups).length).toBe(2);
    });

    test('should check environment suffix usage', () => {
      expect(loader.usesEnvironmentSuffix('TransactionTable')).toBe(true);
      expect(loader.usesEnvironmentSuffix('FraudDetectionLambda')).toBe(true);
    });

    test('should check for retain policy', () => {
      expect(loader.hasRetainPolicy()).toBe(false);
    });

    test('should check for deletion protection', () => {
      expect(loader.hasDeletionProtection()).toBe(false);
    });

    test('should handle getResource with undefined resources', () => {
      const resource = loader.getResource('TransactionTable');
      expect(resource).toBeDefined();
    });

    test('should handle getParameter with defined parameters', () => {
      const param = loader.getParameter('EnvironmentSuffix');
      expect(param).toBeDefined();
    });

    test('should handle getOutput with defined outputs', () => {
      const output = loader.getOutput('StateMachineArn');
      expect(output).toBeDefined();
    });

    test('should get resources by type with matching resources', () => {
      const tables = loader.getResourcesByType('AWS::DynamoDB::Table');
      expect(Object.keys(tables).length).toBe(1);
      expect(tables).toHaveProperty('TransactionTable');
    });

    test('should get resources by type with no matching resources', () => {
      const resources = loader.getResourcesByType('AWS::NonExistent::Resource');
      expect(Object.keys(resources).length).toBe(0);
    });

    test('should validate resource property with nested path', () => {
      expect(loader.validateResourceProperty('FraudDetectionLambda', 'Properties.Runtime', 'python3.11')).toBe(true);
    });

    test('should get resource property with deep nesting', () => {
      const tracing = loader.getResourceProperty('FraudDetectionLambda', 'Properties.TracingConfig.Mode');
      expect(tracing).toBe('Active');
    });

    test('should handle resource property with non-existent path', () => {
      const prop = loader.getResourceProperty('TransactionTable', 'Properties.NonExistent.Deep.Path');
      expect(prop).toBeUndefined();
    });

    test('should handle hasResourceProperty with deep path', () => {
      expect(loader.hasResourceProperty('FraudDetectionLambda', 'Properties.TracingConfig.Mode')).toBe(true);
      expect(loader.hasResourceProperty('FraudDetectionLambda', 'Properties.NonExistent.Path')).toBe(false);
    });
  });
});
