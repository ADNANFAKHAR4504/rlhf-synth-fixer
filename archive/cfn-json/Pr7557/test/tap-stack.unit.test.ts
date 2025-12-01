import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Cross-Region Trading Analytics Migration', () => {
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
      expect(template.Description).toContain('Cross-Region Trading Analytics Migration');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Unique suffix');
    });

    test('should have DatabaseMasterUsername parameter', () => {
      expect(template.Parameters.DatabaseMasterUsername).toBeDefined();
      expect(template.Parameters.DatabaseMasterUsername.Default).toBe('dbadmin');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.SourceVpcCidr).toBeDefined();
      expect(template.Parameters.SourceVpcCidr.Default).toBe('10.0.0.0/16');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have Source VPC', () => {
      expect(template.Resources.SourceVPC).toBeDefined();
      expect(template.Resources.SourceVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have public and private subnets for source VPC', () => {
      expect(template.Resources.SourcePublicSubnet1).toBeDefined();
      expect(template.Resources.SourcePublicSubnet2).toBeDefined();
      expect(template.Resources.SourcePrivateSubnet1).toBeDefined();
      expect(template.Resources.SourcePrivateSubnet2).toBeDefined();
    });

    test('should have Internet Gateway for source VPC', () => {
      expect(template.Resources.SourceInternetGateway).toBeDefined();
      expect(template.Resources.SourceIGWAttachment).toBeDefined();
    });

    test('should have route tables configured', () => {
      expect(template.Resources.SourcePublicRouteTable).toBeDefined();
      expect(template.Resources.SourcePublicRoute).toBeDefined();
    });
  });

  describe('S3 Cross-Region Replication', () => {
    test('should have source S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.HistoricalDataBucketSource;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have target S3 bucket for replication', () => {
      const bucket = template.Resources.HistoricalDataBucketTarget;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('source bucket should have replication configuration', () => {
      const bucket = template.Resources.HistoricalDataBucketSource;
      expect(bucket.Properties.ReplicationConfiguration).toBeDefined();
      expect(bucket.Properties.ReplicationConfiguration.Rules).toHaveLength(1);
    });

    test('replication should reference target bucket ARN correctly', () => {
      const bucket = template.Resources.HistoricalDataBucketSource;
      const replicationRule = bucket.Properties.ReplicationConfiguration.Rules[0];
      expect(replicationRule.Destination.Bucket).toEqual({
        'Fn::GetAtt': ['HistoricalDataBucketTarget', 'Arn']
      });
    });

    test('should have S3 replication role with correct permissions', () => {
      const role = template.Resources.S3ReplicationRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
    });

    test('replication should have encryption enabled', () => {
      const sourceBucket = template.Resources.HistoricalDataBucketSource;
      const targetBucket = template.Resources.HistoricalDataBucketTarget;
      expect(sourceBucket.Properties.BucketEncryption).toBeDefined();
      expect(targetBucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('DynamoDB Global Tables', () => {
    test('should have DynamoDB Global Table for dashboard state', () => {
      const table = template.Resources.DashboardStateTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('should have replicas in both regions', () => {
      const table = template.Resources.DashboardStateTable;
      expect(table.Properties.Replicas).toHaveLength(2);
      const regions = table.Properties.Replicas.map((r: any) => r.Region);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('eu-central-1');
    });

    test('should have encryption enabled', () => {
      const table = template.Resources.DashboardStateTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.DashboardStateTable;
      table.Properties.Replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });
  });

  describe('Kinesis Data Streams', () => {
    test('should have Kinesis stream for market data', () => {
      const stream = template.Resources.MarketDataStreamSource;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.MarketDataStreamSource;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });
  });

  describe('Aurora Global Database', () => {
    test('should have Aurora Global Cluster', () => {
      const cluster = template.Resources.AuroraGlobalCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::GlobalCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should have Aurora Primary Cluster', () => {
      const cluster = template.Resources.AuroraPrimaryCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora should have deletion protection disabled for testing', () => {
      const globalCluster = template.Resources.AuroraGlobalCluster;
      const primaryCluster = template.Resources.AuroraPrimaryCluster;
      expect(globalCluster.Properties.DeletionProtection).toBe(false);
      expect(primaryCluster.Properties.DeletionProtection).toBe(false);
    });

    test('should have database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have at least one database instance', () => {
      expect(template.Resources.AuroraPrimaryInstance1).toBeDefined();
      expect(template.Resources.AuroraPrimaryInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('database should use secrets manager for credentials', () => {
      const secret = template.Resources.DatabaseMasterSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('Aurora should have encryption enabled', () => {
      const globalCluster = template.Resources.AuroraGlobalCluster;
      const primaryCluster = template.Resources.AuroraPrimaryCluster;
      expect(globalCluster.Properties.StorageEncrypted).toBe(true);
      expect(primaryCluster.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have data transform Lambda function', () => {
      const func = template.Resources.DataTransformFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('nodejs22.x');
    });

    test('should have dashboard API Lambda function', () => {
      const func = template.Resources.DashboardApiFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda functions should have execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have event source mapping for Kinesis', () => {
      const mapping = template.Resources.EventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });
  });

  describe('API Gateway', () => {
    test('should have REST API for dashboard', () => {
      const api = template.Resources.DashboardApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway resources and methods', () => {
      expect(template.Resources.DashboardResource).toBeDefined();
      expect(template.Resources.UserResource).toBeDefined();
      expect(template.Resources.SessionResource).toBeDefined();
      expect(template.Resources.DashboardMethod).toBeDefined();
    });

    test('should have API deployment without hardcoded environment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Properties.Description).toEqual({
        'Fn::Sub': 'API deployment for ${EnvironmentSuffix}'
      });
    });

    test('should have API stage', () => {
      const stage = template.Resources.ApiStage;
      expect(stage).toBeDefined();
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.TracingEnabled).toBe(true);
    });

    test('should have Lambda invoke permission for API Gateway', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Step Functions', () => {
    test('should have Step Functions state machine', () => {
      const stateMachine = template.Resources.DataPipelineStateMachine;
      expect(stateMachine).toBeDefined();
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('should have Step Functions execution role', () => {
      const role = template.Resources.StepFunctionsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for migration status', () => {
      const topic = template.Resources.MigrationStatusTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ReplicationLagAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
    });

    test('replication lag alarm should reference both buckets correctly', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(2);
      const dimensions = alarm.Properties.Dimensions;
      expect(dimensions[0].Value).toEqual({ Ref: 'HistoricalDataBucketSource' });
      expect(dimensions[1].Value).toEqual({ Ref: 'HistoricalDataBucketTarget' });
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.MigrationLogGroup).toBeDefined();
      expect(template.Resources.ApiLogGroup).toBeDefined();
    });

    test('should have EventBridge event bus and rules', () => {
      expect(template.Resources.MigrationEventBus).toBeDefined();
      expect(template.Resources.ReplicationEventRule).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesToCheck = [
        'SourceVPC',
        'HistoricalDataBucketSource',
        'HistoricalDataBucketTarget',
        'DashboardStateTable',
        'MarketDataStreamSource',
        'AuroraGlobalCluster',
        'DataTransformFunction',
        'DashboardApiFunction',
        'DashboardApi',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check if resource has a name property that includes environment suffix
        const properties = resource.Properties;
        if (properties.BucketName) {
          expect(JSON.stringify(properties.BucketName)).toContain('EnvironmentSuffix');
        } else if (properties.TableName) {
          expect(JSON.stringify(properties.TableName)).toContain('EnvironmentSuffix');
        } else if (properties.Name) {
          expect(JSON.stringify(properties.Name)).toContain('EnvironmentSuffix');
        } else if (properties.FunctionName) {
          expect(JSON.stringify(properties.FunctionName)).toContain('EnvironmentSuffix');
        }
      });
    });

    test('all resources should follow naming convention pattern', () => {
      const expectedPrefix = 'trading-analytics-';

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const props = resource.Properties;

        // Check various name properties
        const nameProps = [
          props.BucketName,
          props.TableName,
          props.Name,
          props.FunctionName,
          props.TopicName,
          props.RoleName,
          props.DBClusterIdentifier,
          props.GlobalClusterIdentifier,
          props.AlarmName
        ].filter(Boolean);

        nameProps.forEach(nameProp => {
          if (typeof nameProp === 'object' && nameProp['Fn::Sub']) {
            expect(nameProp['Fn::Sub']).toContain(expectedPrefix);
          }
        });
      });
    });
  });

  describe('Deletion and Cleanup Policies', () => {
    test('S3 buckets should not have retention policies preventing deletion', () => {
      const sourceBucket = template.Resources.HistoricalDataBucketSource;
      const targetBucket = template.Resources.HistoricalDataBucketTarget;

      // Should not have DeletionPolicy: Retain
      expect(sourceBucket.DeletionPolicy).not.toBe('Retain');
      expect(targetBucket.DeletionPolicy).not.toBe('Retain');
    });

    test('Aurora clusters should allow deletion without final snapshot', () => {
      const globalCluster = template.Resources.AuroraGlobalCluster;
      const primaryCluster = template.Resources.AuroraPrimaryCluster;

      expect(globalCluster.Properties.DeletionProtection).toBe(false);
      expect(primaryCluster.Properties.DeletionProtection).toBe(false);
    });

    test('database instances should not have deletion policy Retain', () => {
      const instance = template.Resources.AuroraPrimaryInstance1;
      expect(instance.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Security and Encryption', () => {
    test('S3 buckets should have encryption enabled', () => {
      const buckets = [
        template.Resources.HistoricalDataBucketSource,
        template.Resources.HistoricalDataBucketTarget
      ];

      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.DashboardStateTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.MarketDataStreamSource;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('Aurora database should have encryption enabled', () => {
      const globalCluster = template.Resources.AuroraGlobalCluster;
      const primaryCluster = template.Resources.AuroraPrimaryCluster;

      expect(globalCluster.Properties.StorageEncrypted).toBe(true);
      expect(primaryCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('SNS topic should have KMS encryption', () => {
      const topic = template.Resources.MigrationStatusTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SourceVPCId',
        'HistoricalDataBucketSourceName',
        'HistoricalDataBucketTargetName',
        'DashboardTableName',
        'KinesisStreamName',
        'DatabaseClusterEndpoint',
        'ApiEndpoint',
        'MigrationStatusTopicArn',
        'StateMachineArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description).not.toBe('');
      });
    });

    test('outputs should have export names with environment suffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(JSON.stringify(output.Export.Name)).toContain('EnvironmentSuffix');
      });
    });

    test('should have output for target bucket', () => {
      const output = template.Outputs.HistoricalDataBucketTargetName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Target S3 bucket');
      expect(output.Value).toEqual({ Ref: 'HistoricalDataBucketTarget' });
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

    test('should have reasonable number of resources for cross-region migration', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have all parameters with descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Description).toBeDefined();
        expect(param.Type).toBeDefined();
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should have properly configured IAM roles', () => {
      const roles = [
        'S3ReplicationRole',
        'LambdaExecutionRole',
        'StepFunctionsRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('Lambda execution role should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('S3 replication role should have correct permissions', () => {
      const role = template.Resources.S3ReplicationRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyDocument.Statement).toBeDefined();
      expect(policy.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Region Requirements', () => {
    test('should have configuration for both us-east-1 and eu-central-1', () => {
      const table = template.Resources.DashboardStateTable;
      const replicas = table.Properties.Replicas;

      const regions = replicas.map((r: any) => r.Region);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('eu-central-1');
    });
  });
});
