import fs from 'fs';
import path from 'path';

const environmentName = process.env.ENVIRONMENT_NAME || 'dev';

describe('CDR Data Pipeline CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'CDR Migration System - Complete Data Pipeline'
      );
    });
  });

  describe('Parameters', () => {
    const expectedParameters = ['EnvironmentName', 'RedshiftMasterUsername', 'AuroraMasterUsername'];
    
    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.Description).toBe('Environment name for the deployment');
    });

    test('database username parameters should be configured correctly', () => {
      const redshiftParam = template.Parameters.RedshiftMasterUsername;
      const auroraParam = template.Parameters.AuroraMasterUsername;
      
      expect(redshiftParam.Type).toBe('String');
      expect(redshiftParam.Default).toBe('admin');
      expect(auroraParam.Type).toBe('String');
      expect(auroraParam.Default).toBe('admin');
    });
  });

  describe('Network and Storage Integration', () => {
    test('VPC-Subnet-Database Integration: should have VPC and subnets for database connectivity', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('S3-Security-Encryption Integration: should have S3 bucket for data archival with proper configuration', () => {
      const bucket = template.Resources.CDRArchivalBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const props = bucket.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('DynamoDB-Streams-Recovery Integration: should have DynamoDB table for real-time lookups', () => {
      const table = template.Resources.CDRDynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      
      const props = table.Properties;
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('Database-Subnet-VPC Integration: should validate subnet groups for databases', () => {
      const redshiftSubnetGroup = template.Resources.RedshiftSubnetGroup;
      const auroraSubnetGroup = template.Resources.AuroraDBSubnetGroup;
      
      expect(redshiftSubnetGroup.Type).toBe('AWS::Redshift::ClusterSubnetGroup');
      expect(auroraSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      expect(redshiftSubnetGroup.Properties.SubnetIds).toEqual([
        { 'Ref': 'PrivateSubnet1' },
        { 'Ref': 'PrivateSubnet2' }
      ]);
    });
  });

  describe('Storage and Lambda Integration', () => {
    test('Kinesis-Lambda Integration: should have Kinesis stream connected to Lambda processor', () => {
      const stream = template.Resources.CDRKinesisStream;
      const lambda = template.Resources.TransformLambdaFunction;
      const eventMapping = template.Resources.KinesisEventSourceMapping;
      
      expect(stream.Type).toBe('AWS::Kinesis::Stream');
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(eventMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      
      // Validate integration
      expect(eventMapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['CDRKinesisStream', 'Arn']
      });
      expect(eventMapping.Properties.FunctionName).toEqual({
        'Fn::GetAtt': ['TransformLambdaFunction', 'Arn']
      });
    });

    test('Firehose-S3-Redshift Integration: should have Firehose delivery stream connected to S3 and Redshift', () => {
      const firehose = template.Resources.CDRFirehoseStream;
      expect(firehose).toBeDefined();
      expect(firehose.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
      
      const config = firehose.Properties.RedshiftDestinationConfiguration;
      expect(config.S3Configuration.BucketARN).toEqual({
        'Fn::GetAtt': ['CDRArchivalBucket', 'Arn']
      });
      expect(config.ClusterJDBCURL).toEqual({
        'Fn::Sub': 'jdbc:redshift://${RedshiftCluster.Endpoint.Address}:${RedshiftCluster.Endpoint.Port}/cdrwarehouse'
      });
    });

    test('Lambda-Resource Integration: should validate Lambda function environment variables reference other resources', () => {
      const transformLambda = template.Resources.TransformLambdaFunction;
      const crawlerLambda = template.Resources.CrawlerTriggerLambda;
      
      const transformEnv = transformLambda.Properties.Environment.Variables;
      const crawlerEnv = crawlerLambda.Properties.Environment.Variables;
      
      expect(transformEnv.FIREHOSE_STREAM).toEqual({
        'Ref': 'CDRFirehoseStream'
      });
      expect(crawlerEnv.CRAWLER_NAME).toEqual({
        'Ref': 'CDRGlueCrawler'
      });
    });
  });

  describe('Lambda and Glue Integration', () => {
    test('Glue-Database Integration: should have Glue database and crawler for data cataloging', () => {
      const database = template.Resources.GlueDatabase;
      const crawler = template.Resources.CDRGlueCrawler;
      
      expect(database.Type).toBe('AWS::Glue::Database');
      expect(crawler.Type).toBe('AWS::Glue::Crawler');
      
      expect(crawler.Properties.DatabaseName).toEqual({
        'Ref': 'GlueDatabase'
      });
    });

    test('EventBridge-Lambda-Glue Integration: should have crawler trigger Lambda with EventBridge schedule', () => {
      const triggerLambda = template.Resources.CrawlerTriggerLambda;
      const schedule = template.Resources.CrawlerTriggerSchedule;
      const permission = template.Resources.CrawlerTriggerLambdaPermission;
      
      expect(triggerLambda.Type).toBe('AWS::Lambda::Function');
      expect(schedule.Type).toBe('AWS::Events::Rule');
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      
      // Validate EventBridge to Lambda integration
      expect(schedule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['CrawlerTriggerLambda', 'Arn']
      });
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['CrawlerTriggerSchedule', 'Arn']
      });
    });

    test('Glue-S3 Integration: should validate Glue crawler targets S3 bucket paths', () => {
      const crawler = template.Resources.CDRGlueCrawler;
      const s3Targets = crawler.Properties.Targets.S3Targets;
      
      expect(s3Targets).toHaveLength(1);
      expect(s3Targets[0].Path).toEqual({
        'Fn::Sub': 's3://${CDRArchivalBucket}/cdr-data/'
      });
    });
  });

  describe('Database and DMS Integration', () => {
    test('Redshift-VPC Integration: should have Redshift cluster with proper configuration', () => {
      const cluster = template.Resources.RedshiftCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::Redshift::Cluster');
      
      const props = cluster.Properties;
      expect(props.NodeType).toBe('ra3.4xlarge');
      expect(props.ClusterSubnetGroupName).toEqual({
        'Ref': 'RedshiftSubnetGroup'
      });
      expect(props.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${RedshiftSecret}:SecretString:password}}'
      });
    });

    test('Aurora-RDS Integration: should have Aurora cluster with serverless v2 scaling', () => {
      const cluster = template.Resources.AuroraDBCluster;
      const instance1 = template.Resources.AuroraDBInstance1;
      const instance2 = template.Resources.AuroraDBInstance2;
      
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance2.Type).toBe('AWS::RDS::DBInstance');
      
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(instance1.Properties.DBClusterIdentifier).toEqual({
        'Ref': 'AuroraDBCluster'
      });
    });

    test('Database-SecretsManager Integration: should validate secrets management for database credentials', () => {
      const redshiftSecret = template.Resources.RedshiftSecret;
      const auroraSecret = template.Resources.AuroraPasswordSecret;
      
      expect(redshiftSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(auroraSecret.Type).toBe('AWS::SecretsManager::Secret');
      
      expect(redshiftSecret.Properties.GenerateSecretString).toBeDefined();
      expect(auroraSecret.Properties.GenerateSecretString).toBeDefined();
    });
  });

  describe('Lambda and Messaging Integration', () => {
    test('EventBridge-Lambda Integration: should have validation Lambda with EventBridge trigger', () => {
      const validationLambda = template.Resources.ValidationLambda;
      const eventRule = template.Resources.ValidationEventRule;
      const permission = template.Resources.ValidationLambdaPermission;
      
      expect(validationLambda.Type).toBe('AWS::Lambda::Function');
      expect(eventRule.Type).toBe('AWS::Events::Rule');
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      
      expect(eventRule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['ValidationLambda', 'Arn']
      });
    });

    test('DynamoDB-Streams-Lambda Integration: should validate DynamoDB stream connection to Lambda triggers', () => {
      const table = template.Resources.CDRDynamoDBTable;
      const eventMapping = template.Resources.KinesisEventSourceMapping;
      
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(eventMapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['CDRKinesisStream', 'Arn']
      });
    });

    test('Lambda-VPC Integration: should have billing processor Lambda with VPC configuration', () => {
      const billingLambda = template.Resources.BillingProcessorLambda;
      expect(billingLambda).toBeDefined();
      expect(billingLambda.Type).toBe('AWS::Lambda::Function');
      
      const vpcConfig = billingLambda.Properties.VpcConfig;
      expect(vpcConfig.SubnetIds).toEqual([
        { 'Ref': 'PrivateSubnet1' },
        { 'Ref': 'PrivateSubnet2' }
      ]);
      expect(vpcConfig.SecurityGroupIds).toEqual([
        { 'Ref': 'LambdaSecurityGroup' }
      ]);
    });
  });

  describe('Lambda and Orchestration Integration', () => {
    test('StepFunctions-Lambda-CloudWatch Integration: should have Step Functions state machine for billing workflow', () => {
      const stateMachine = template.Resources.BillingStateMachine;
      const logGroup = template.Resources.BillingStateMachineLogGroup;
      
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      
      const loggingConfig = stateMachine.Properties.LoggingConfiguration;
      expect(loggingConfig.Level).toBe('ALL');
      expect(loggingConfig.Destinations[0].CloudWatchLogsLogGroup.LogGroupArn).toEqual({
        'Fn::GetAtt': ['BillingStateMachineLogGroup', 'Arn']
      });
    });

    test('EventBridge-StepFunctions Integration: should have EventBridge schedule for state machine execution', () => {
      const scheduleRule = template.Resources.BillingScheduleRule;
      const scheduleRole = template.Resources.BillingScheduleRole;
      
      expect(scheduleRule.Type).toBe('AWS::Events::Rule');
      expect(scheduleRole.Type).toBe('AWS::IAM::Role');
      
      expect(scheduleRule.Properties.Targets[0].Arn).toEqual({
        'Ref': 'BillingStateMachine'
      });
      expect(scheduleRule.Properties.Targets[0].RoleArn).toEqual({
        'Fn::GetAtt': ['BillingScheduleRole', 'Arn']
      });
    });

    test('StepFunctions-Lambda ARN Integration: should validate state machine definition includes Lambda function ARNs', () => {
      const stateMachine = template.Resources.BillingStateMachine;
      const definition = stateMachine.Properties.DefinitionString;
      
      // The definition should reference the billing processor Lambda
      expect(definition['Fn::Sub']).toContain('${BillingProcessorLambda.Arn}');
    });
  });

  describe('IAM Roles and Permissions Integration', () => {
    test('IAM-Service Integration: should have properly configured IAM roles for all services', () => {
      const expectedRoles = [
        'FirehoseDeliveryRole',
        'TransformLambdaRole', 
        'GlueCrawlerRole',
        'CrawlerTriggerLambdaRole',
        'ValidationLambdaRole',
        'BillingStepFunctionRole',
        'BillingProcessorLambdaRole',
        'BillingScheduleRole'
      ];
      
      expectedRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('IAM-Firehose-S3-Redshift Integration: should validate Firehose delivery role has S3 and Redshift permissions', () => {
      const role = template.Resources.FirehoseDeliveryRole;
      const policyDoc = role.Properties.Policies[0].PolicyDocument;
      
      // Collect all actions from all statements
      const allActions = policyDoc.Statement.flatMap((stmt: any) => stmt.Action);
      
      expect(allActions).toContain('s3:PutObject');
      expect(allActions).toContain('s3:GetObject');
      expect(allActions).toContain('redshift-data:ExecuteStatement');
    });

    test('IAM-Lambda-Service Integration: should validate Lambda roles have appropriate service permissions', () => {
      const transformRole = template.Resources.TransformLambdaRole;
      const crawlerRole = template.Resources.GlueCrawlerRole;
      
      expect(transformRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole'
      );
      expect(crawlerRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole'
      );
    });

    test('SecurityGroup-VPC-Database Integration: should validate security groups are properly configured', () => {
      const redshiftSG = template.Resources.RedshiftSecurityGroup;
      const auroraSG = template.Resources.AuroraSecurityGroup;
      const lambdaSG = template.Resources.LambdaSecurityGroup;
      
      expect(redshiftSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(auroraSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lambdaSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      // Validate Lambda can access databases
      expect(redshiftSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({
        'Ref': 'LambdaSecurityGroup'
      });
    });
  });

  describe('Outputs and Cross-Stack References', () => {
    test('CloudFormation-Outputs Integration: should have all required outputs for stack integration', () => {
      const expectedOutputs = [
        'KinesisStreamARN',
        'S3BucketName', 
        'DynamoDBTableName',
        'RedshiftClusterId',
        'AuroraClusterId',
        'StepFunctionStateMachineARN'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('Output-Resource-Reference Integration: should validate output values reference correct resources', () => {
      const outputs = template.Outputs;
      
      expect(outputs.KinesisStreamARN.Value).toEqual({
        'Fn::GetAtt': ['CDRKinesisStream', 'Arn']
      });
      expect(outputs.S3BucketName.Value).toEqual({
        'Ref': 'CDRArchivalBucket'
      });
      expect(outputs.DynamoDBTableName.Value).toEqual({
        'Ref': 'CDRDynamoDBTable'
      });
      expect(outputs.StepFunctionStateMachineARN.Value).toEqual({
        'Ref': 'BillingStateMachine'
      });
    });

    test('Cross-Stack-Export Integration: should have export names for cross-stack references', () => {
      const exportNameMappings = {
        'StepFunctionStateMachineARN': 'StepFunctionARN'
      };
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        
        const expectedExportName = exportNameMappings[outputKey] || outputKey;
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`
        });
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
    });

    test('should have expected number of resources for complex data pipeline', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Complex pipeline should have many resources
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Environment-Resource-Naming Integration: resources should follow consistent naming with environment prefix', () => {
      const resources = template.Resources;
      
      // Check stream naming
      expect(resources.CDRKinesisStream.Properties.Name).toEqual({
        'Fn::Sub': 'cdr-ingestion-stream-${EnvironmentSuffix}'
      });
      
      // Check bucket naming  
      expect(resources.CDRArchivalBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cdr-archive-${EnvironmentSuffix}-${AWS::AccountId}'
      });
      
      // Check table naming
      expect(resources.CDRDynamoDBTable.Properties.TableName).toEqual({
        'Fn::Sub': 'cdr-realtime-lookup-${EnvironmentSuffix}'
      });
    });

    test('IAM-AssumeRole-Service Integration: IAM roles should have correct service principals for assume role policies', () => {
      const roleServiceMappings = {
        'FirehoseDeliveryRole': 'firehose.amazonaws.com',
        'TransformLambdaRole': 'lambda.amazonaws.com',
        'GlueCrawlerRole': 'glue.amazonaws.com',
        'BillingStepFunctionRole': 'states.amazonaws.com'
      };
      
      Object.entries(roleServiceMappings).forEach(([roleName, expectedService]) => {
        const role = template.Resources[roleName];
        if (role) {
          const principal = role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service;
          expect(principal).toBe(expectedService);
        }
      });
    });
  });
});
