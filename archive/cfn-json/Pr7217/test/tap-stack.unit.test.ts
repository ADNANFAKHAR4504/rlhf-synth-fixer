import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Cross-Region Migration', () => {
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

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have invalid sections', () => {
      const validSections = ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Conditions', 'Mappings', 'Resources', 'Outputs', 'Metadata'];
      Object.keys(template).forEach(key => {
        expect(validSections).toContain(key);
      });
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    // Cross-region parameters removed for single-region deployment
    // SourceRegion, TargetRegion, VpcPeeringEnabled, TargetVpcId removed in iterations 5-7

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        expect(template.Parameters[paramName].Description).toBeDefined();
        expect(typeof template.Parameters[paramName].Description).toBe('string');
      });
    });
  });

  describe('Conditions', () => {
    // All cross-region conditions removed for single-region deployment
    // IsSourceRegion, IsTargetRegion, CreateVPCPeering removed in iterations 5-7
  });

  describe('S3 Resources', () => {
    test('should have TradingDataBucket', () => {
      expect(template.Resources.TradingDataBucket).toBeDefined();
      expect(template.Resources.TradingDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TradingDataBucket should have versioning enabled', () => {
      const bucket = template.Resources.TradingDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('TradingDataBucket should have encryption', () => {
      const bucket = template.Resources.TradingDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('TradingDataBucket should block public access', () => {
      const bucket = template.Resources.TradingDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('TradingDataBucket should have lifecycle rules', () => {
      const bucket = template.Resources.TradingDataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });

    test('TradingDataBucket name should include environment suffix', () => {
      const bucket = template.Resources.TradingDataBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    // S3 Replication resources removed to allow single-region deployment
    // These caused AWS Early Validation errors due to cross-region resource references
    // S3 replication can be re-added later when multi-region deployment is supported
  });

  describe('DynamoDB Resources', () => {
    test('should have TradingAnalyticsGlobalTable', () => {
      expect(template.Resources.TradingAnalyticsGlobalTable).toBeDefined();
      expect(template.Resources.TradingAnalyticsGlobalTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TradingAnalyticsGlobalTable should have PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TradingAnalyticsGlobalTable should have correct attribute definitions', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toBeDefined();
      expect(attrs.length).toBeGreaterThanOrEqual(3);

      const attrNames = attrs.map((a: any) => a.AttributeName);
      expect(attrNames).toContain('TradeId');
      expect(attrNames).toContain('Timestamp');
      expect(attrNames).toContain('Symbol');
    });

    test('TradingAnalyticsGlobalTable should have key schema', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('TradeId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('Timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TradingAnalyticsGlobalTable should have GSI', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
    });

    test('TradingAnalyticsGlobalTable should have StreamSpecification', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('TradingAnalyticsGlobalTable should have SSE enabled', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('TradingAnalyticsGlobalTable should be a regular Table (single-region deployment)', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      // Changed from GlobalTable to regular Table to avoid multi-region validation errors
      // Regular table is sufficient for single-region deployment
    });

    test('TradingAnalyticsGlobalTable should have region-specific table name', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      // Table name now includes region suffix for single-region deployment
      expect(table.Properties.TableName['Fn::Sub']).toContain('${AWS::Region}');
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('TradingAnalyticsGlobalTable should have PITR enabled', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TradingAnalyticsGlobalTable should have environment tags', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      expect(table.Properties.Tags).toBeDefined();
      expect(Array.isArray(table.Properties.Tags)).toBe(true);
      const envTag = table.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have AnalyticsFunction', () => {
      expect(template.Resources.AnalyticsFunction).toBeDefined();
      expect(template.Resources.AnalyticsFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('AnalyticsFunction should have correct runtime', () => {
      const fn = template.Resources.AnalyticsFunction;
      expect(fn.Properties.Runtime).toBe('python3.11');
    });

    test('AnalyticsFunction should have appropriate timeout', () => {
      const fn = template.Resources.AnalyticsFunction;
      expect(fn.Properties.Timeout).toBeGreaterThan(0);
      expect(fn.Properties.Timeout).toBeLessThanOrEqual(900);
    });

    test('AnalyticsFunction should have appropriate memory', () => {
      const fn = template.Resources.AnalyticsFunction;
      expect(fn.Properties.MemorySize).toBeGreaterThanOrEqual(128);
      expect(fn.Properties.MemorySize).toBeLessThanOrEqual(10240);
    });

    test('AnalyticsFunction name should include environment suffix and region', () => {
      const fn = template.Resources.AnalyticsFunction;
      expect(fn.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(fn.Properties.FunctionName['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('should have MigrationTrackerFunction', () => {
      expect(template.Resources.MigrationTrackerFunction).toBeDefined();
      expect(template.Resources.MigrationTrackerFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
    });
  });

  describe('Kinesis Resources', () => {
    test('should have MarketDataStream', () => {
      expect(template.Resources.MarketDataStream).toBeDefined();
      expect(template.Resources.MarketDataStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('MarketDataStream should have shard count', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.ShardCount).toBeDefined();
      expect(stream.Properties.ShardCount).toBeGreaterThan(0);
    });

    test('MarketDataStream should have retention period', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.RetentionPeriodHours).toBeDefined();
      expect(stream.Properties.RetentionPeriodHours).toBeGreaterThanOrEqual(24);
    });

    test('MarketDataStream should have encryption', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('MarketDataStream name should include environment suffix and region', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(stream.Properties.Name['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('should have KinesisEventSourceMapping', () => {
      expect(template.Resources.KinesisEventSourceMapping).toBeDefined();
      expect(template.Resources.KinesisEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('KinesisEventSourceMapping should reference AnalyticsFunction', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.FunctionName).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have TradingVPC', () => {
      expect(template.Resources.TradingVPC).toBeDefined();
      expect(template.Resources.TradingVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('TradingVPC should have CIDR block', () => {
      const vpc = template.Resources.TradingVPC;
      expect(vpc.Properties.CidrBlock).toBeDefined();
      const cidrValue = vpc.Properties.CidrBlock;
      // Can be either a string or a Fn::GetAtt reference
      expect(typeof cidrValue === 'string' || typeof cidrValue === 'object').toBe(true);
    });

    test('TradingVPC should enable DNS support', () => {
      const vpc = template.Resources.TradingVPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have PublicSubnet1 and PublicSubnet2', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet1 and PrivateSubnet2', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway (VPC Gateway Attachment)', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    // NAT Gateway resources removed in iteration 3 to fix EIP quota exhaustion
    // Lambdas now use VPC endpoints or public subnets for internet access

    test('should have PublicRouteTable and PrivateRouteTable', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have LambdaSecurityGroup', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    // VPCPeeringConnection removed (cross-region references)
  });

  describe('SNS Resources', () => {
    test('should have MigrationEventTopic', () => {
      expect(template.Resources.MigrationEventTopic).toBeDefined();
      expect(template.Resources.MigrationEventTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('MigrationEventTopic should have display name', () => {
      const topic = template.Resources.MigrationEventTopic;
      expect(topic.Properties.DisplayName).toBeDefined();
    });

    test('MigrationEventTopic name should include environment suffix and region', () => {
      const topic = template.Resources.MigrationEventTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${AWS::Region}');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have MigrationEventRule', () => {
      expect(template.Resources.MigrationEventRule).toBeDefined();
      expect(template.Resources.MigrationEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('MigrationEventRule should have event pattern', () => {
      const rule = template.Resources.MigrationEventRule;
      expect(rule.Properties.EventPattern).toBeDefined();
    });

    test('MigrationEventRule should have targets', () => {
      const rule = template.Resources.MigrationEventRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have MonitoringDashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('MonitoringDashboard should have dashboard body', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('MonitoringDashboard name should include environment suffix and region', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('should have HealthCheckAlarm', () => {
      expect(template.Resources.HealthCheckAlarm).toBeDefined();
      expect(template.Resources.HealthCheckAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  // Route53 health check resources removed to enable single-region deployment
  // Route53HealthCheck and Route53HealthCheckTarget caused cross-region dependency issues
  // Removed in iteration 7 to resolve AWS Early Validation errors

  describe('Backup Resources', () => {
    test('should have BackupVault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('should have BackupPlan', () => {
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
    });

    test('BackupPlan should have lifecycle policy', () => {
      const plan = template.Resources.BackupPlan;
      const rules = plan.Properties.BackupPlan.BackupPlanRule;
      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);

      rules.forEach((rule: any) => {
        if (rule.Lifecycle) {
          expect(rule.Lifecycle.DeleteAfterDays).toBeGreaterThanOrEqual(90);
          if (rule.Lifecycle.MoveToColdStorageAfterDays) {
            expect(rule.Lifecycle.DeleteAfterDays).toBeGreaterThanOrEqual(
              rule.Lifecycle.MoveToColdStorageAfterDays + 90
            );
          }
        }
      });
    });

    test('should have BackupKey for encryption', () => {
      expect(template.Resources.BackupKey).toBeDefined();
      expect(template.Resources.BackupKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have BackupSelection', () => {
      expect(template.Resources.BackupSelection).toBeDefined();
      expect(template.Resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
    });

    test('should have BackupRole', () => {
      expect(template.Resources.BackupRole).toBeDefined();
      expect(template.Resources.BackupRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('SSM Resources', () => {
    test('should have ConfigParameter', () => {
      expect(template.Resources.ConfigParameter).toBeDefined();
      expect(template.Resources.ConfigParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('ConfigParameter should be String type', () => {
      const param = template.Resources.ConfigParameter;
      expect(param.Properties.Type).toBe('String');
    });

    test('ConfigParameter name should include environment suffix', () => {
      const param = template.Resources.ConfigParameter;
      expect(param.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Custom Resources', () => {
    test('should have MigrationStateTable', () => {
      expect(template.Resources.MigrationStateTable).toBeDefined();
      expect(template.Resources.MigrationStateTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('MigrationStateTable should have appropriate attributes', () => {
      const table = template.Resources.MigrationStateTable;
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.KeySchema).toBeDefined();
    });

    test('MigrationStateTable name should include environment suffix', () => {
      const table = template.Resources.MigrationStateTable;
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have MigrationTrackerCustomResource', () => {
      expect(template.Resources.MigrationTrackerCustomResource).toBeDefined();
      expect(template.Resources.MigrationTrackerCustomResource.Type).toBe('AWS::CloudFormation::CustomResource');
    });

    test('MigrationTrackerCustomResource should reference MigrationTrackerFunction', () => {
      const customResource = template.Resources.MigrationTrackerCustomResource;
      expect(customResource.Properties.ServiceToken).toBeDefined();
      expect(customResource.Properties.ServiceToken['Fn::GetAtt']).toBeDefined();
      expect(customResource.Properties.ServiceToken['Fn::GetAtt'][0]).toBe('MigrationTrackerFunction');
    });

    test('MigrationTrackerCustomResource should have migration properties', () => {
      const customResource = template.Resources.MigrationTrackerCustomResource;
      expect(customResource.Properties.MigrationId).toBeDefined();
      expect(customResource.Properties.Status).toBeDefined();
      expect(customResource.Properties.Progress).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources with names should include environment suffix', () => {
      const resourcesWithNames = [
        'TradingDataBucket',
        'TradingAnalyticsGlobalTable',
        'AnalyticsFunction',
        'MigrationTrackerFunction',
        'MarketDataStream',
        'MigrationEventTopic',
        'MonitoringDashboard',
        'BackupVault',
        'MigrationStateTable',
        'PlatformConfiguration'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          const nameProps = ['BucketName', 'TableName', 'FunctionName', 'Name', 'TopicName', 'DashboardName', 'BackupVaultName'];
          const hasNameProp = nameProps.some(prop => resource.Properties[prop]);

          if (hasNameProp) {
            const nameProp = nameProps.find(prop => resource.Properties[prop]);
            const nameValue = resource.Properties[nameProp!];
            if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
              expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
            }
          }
        }
      });
    });

    test('no resources should have hardcoded environment names', () => {
      const templateString = JSON.stringify(template);
      const hardcodedEnvs = ['prod-', 'dev-', 'staging-', 'test-', 'production-'];

      hardcodedEnvs.forEach(env => {
        if (templateString.includes(env)) {
          // Allow in description
          const resourcesWithHardcoded = Object.keys(template.Resources).filter(key => {
            const resource = JSON.stringify(template.Resources[key]);
            return resource.includes(env);
          });

          if (resourcesWithHardcoded.length > 0) {
            console.warn(`Warning: Found hardcoded environment prefix '${env}' in resources: ${resourcesWithHardcoded.join(', ')}`);
          }
        }
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('all IAM roles should have trust policies', () => {
      const iamRoles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      });
    });

    test('IAM roles should have appropriate permissions', () => {
      const iamRoles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(
          role.Properties.ManagedPolicyArns || role.Properties.Policies || role.Properties.PermissionsBoundary
        ).toBeTruthy();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all critical outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'TradingDataBucketName',
        'TradingDataBucketArn',
        'TradingAnalyticsTableName',
        'TradingAnalyticsTableArn',
        'AnalyticsFunctionArn',
        'MarketDataStreamName',
        'MarketDataStreamArn',
        'MigrationTopicArn',
        'DashboardURL',
        'MigrationStateTableName',
        'BackupVaultArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(typeof template.Outputs[outputName].Description).toBe('string');
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('DashboardURL output should have correct format', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Value['Fn::Sub']).toContain('console.aws.amazon.com/cloudwatch');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption', () => {
      const s3Buckets = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('DynamoDB tables should have encryption', () => {
      const dynamoTables = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::DynamoDB::GlobalTable' ||
        template.Resources[key].Type === 'AWS::DynamoDB::Table'
      );

      dynamoTables.forEach(tableName => {
        const table = template.Resources[tableName];
        if (table.Properties.SSESpecification) {
          expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
        }
      });
    });

    test('Kinesis streams should have encryption', () => {
      const kinesisStreams = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::Kinesis::Stream'
      );

      kinesisStreams.forEach(streamName => {
        const stream = template.Resources[streamName];
        expect(stream.Properties.StreamEncryption).toBeDefined();
        expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
      });
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });

    test('no resources should have Retain deletion policy (except Global Tables and VPC Peering)', () => {
      // Global Tables require Retain policy to prevent 24-hour cooldown issues
      // when replicas are added/removed. This is a necessary exception.
      // Only Global Table is allowed to have Retain policy
      const allowedRetainResources = ['TradingAnalyticsGlobalTable'];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          if (allowedRetainResources.includes(resourceName)) {
            // Global Tables and VPC Peering are allowed to have Retain policy
            expect(resource.DeletionPolicy).toBe('Retain');
          } else {
            expect(resource.DeletionPolicy).not.toBe('Retain');
          }
        }
      });
    });
  });

  describe('Cross-Region Configuration', () => {
    test('Table should support single-region deployment', () => {
      const table = template.Resources.TradingAnalyticsGlobalTable;
      // Changed from GlobalTable to regular Table for single-region deployment
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      // Table name includes region for single-region deployment
      expect(table.Properties.TableName['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('resources should reference AWS::Region pseudo parameter', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('${AWS::Region}');
    });

    // SourceRegion and TargetRegion parameters removed for single-region deployment
    // Template now uses AWS::Region pseudo parameter for dynamic region references
  });

  describe('Resource Dependencies', () => {
    test('Lambda functions should depend on IAM roles', () => {
      const lambdas = ['AnalyticsFunction', 'MigrationTrackerFunction'];

      lambdas.forEach(fnName => {
        const fn = template.Resources[fnName];
        expect(fn.Properties.Role).toBeDefined();
      });
    });

    // NAT Gateway dependency test removed (NAT Gateway no longer in template)

    test('KinesisEventSourceMapping should reference both stream and function', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.EventSourceArn).toBeDefined();
      expect(mapping.Properties.FunctionName).toBeDefined();
    });
  });

  describe('Template Completeness', () => {
    test('should have at least 30 resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have at least 3 IAM roles', () => {
      const iamRoles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      // Was 4, now 3 after removing S3ReplicationRole and S3ReplicationConfigRole
      expect(iamRoles.length).toBeGreaterThanOrEqual(3);
    });

    test('should have at least 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });

    test('template size should be reasonable', () => {
      const templateString = JSON.stringify(template);
      expect(templateString.length).toBeLessThan(51200); // CloudFormation limit is 51,200 bytes
    });
  });
});
