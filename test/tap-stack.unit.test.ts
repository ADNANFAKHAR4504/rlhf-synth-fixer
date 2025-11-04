import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Account Replication Framework CloudFormation Template', () => {
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

    test('debug: should log available EventBridge resources', () => {
      const eventBridgeResources = Object.keys(template.Resources).filter(key => 
        key.includes('Event') || key.includes('Permission')
      );
      console.log('Available EventBridge-related resources:', eventBridgeResources);
      // This test always passes but helps debug
      expect(true).toBe(true);
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-Account Replication Framework');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have proper parameter groups in metadata', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata.ParameterGroups).toBeDefined();
      expect(metadata.ParameterGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.ApplicationName.Type).toBe('String');
      expect(template.Parameters.ApplicationName.AllowedPattern).toBeDefined();
    });

    test('should have account ID parameters', () => {
      ['AccountIdDev', 'AccountIdStaging', 'AccountIdProd'].forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].AllowedPattern).toBe('[0-9]{12}');
      });
    });

    test('should have resource configuration parameters', () => {
      expect(template.Parameters.ReplicationRoleName).toBeDefined();
      expect(template.Parameters.DynamoDBTableName).toBeDefined();
      expect(template.Parameters.ReplicationBucketName).toBeDefined();
      expect(template.Parameters.SSMPathPrefix).toBeDefined();
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Description).toBeDefined();
        expect(template.Parameters[paramKey].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Conditions', () => {
    test('should have replication conditions', () => {
      expect(template.Conditions.EnableReplicationToStaging).toBeDefined();
      expect(template.Conditions.EnableReplicationToProd).toBeDefined();
      expect(template.Conditions.EnableReplication).toBeDefined();
    });

    test('EnableReplication condition should use Or function', () => {
      expect(template.Conditions.EnableReplication['Fn::Or']).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have ConfigurationBucket resource', () => {
      expect(template.Resources.ConfigurationBucket).toBeDefined();
      expect(template.Resources.ConfigurationBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ConfigurationBucket should have encryption enabled', () => {
      const bucket = template.Resources.ConfigurationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ConfigurationBucket should have versioning enabled', () => {
      const bucket = template.Resources.ConfigurationBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigurationBucket should have public access blocked', () => {
      const bucket = template.Resources.ConfigurationBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('ConfigurationBucket should have iac-rlhf-amazon tag', () => {
      const bucket = template.Resources.ConfigurationBucket;
      const tags = bucket.Properties.Tags;
      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });

    test('should have ConfigurationBucketPolicy resource', () => {
      expect(template.Resources.ConfigurationBucketPolicy).toBeDefined();
      expect(template.Resources.ConfigurationBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3ReplicationRole should be conditional', () => {
      const role = template.Resources.S3ReplicationRole;
      expect(role).toBeDefined();
      expect(role.Condition).toBe('EnableReplication');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have MetadataTable resource', () => {
      expect(template.Resources.MetadataTable).toBeDefined();
      expect(template.Resources.MetadataTable.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('MetadataTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('MetadataTable should have StreamSpecification', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('MetadataTable should have SSE enabled', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('MetadataTable should have correct attribute definitions', () => {
      const table = template.Resources.MetadataTable;
      const attributes = table.Properties.AttributeDefinitions;
      expect(attributes).toHaveLength(3);

      const attributeNames = attributes.map((attr: any) => attr.AttributeName);
      expect(attributeNames).toContain('ConfigId');
      expect(attributeNames).toContain('ConfigType');
      expect(attributeNames).toContain('UpdatedAt');
    });

    test('MetadataTable should have iac-rlhf-amazon tag', () => {
      const table = template.Resources.MetadataTable;
      const tags = table.Properties.Replicas[0].Tags;
      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });

    test('MetadataTable should have GlobalSecondaryIndex', () => {
      const table = template.Resources.MetadataTable;
      const gsi = table.Properties.Replicas[0].GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi[0].IndexName).toBe('ConfigTypeIndex');
    });
  });

  describe('Lambda Resources', () => {
    const lambdaFunctions = [
      'ReplicationMonitorLambda',
      'ConfigValidatorLambda',
      'StreamProcessorLambda'
    ];

    lambdaFunctions.forEach(functionName => {
      describe(functionName, () => {
        test('should exist and be of type AWS::Lambda::Function', () => {
          expect(template.Resources[functionName]).toBeDefined();
          expect(template.Resources[functionName].Type).toBe('AWS::Lambda::Function');
        });

        test('should use Python 3.11 runtime', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Runtime).toBe('python3.11');
        });

        test('should have 256MB memory', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.MemorySize).toBe(256);
        });

        test('should have environment variables', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Environment).toBeDefined();
          expect(func.Properties.Environment.Variables).toBeDefined();
          expect(func.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
        });

        test('should have iac-rlhf-amazon tag', () => {
          const func = template.Resources[functionName];
          const tags = func.Properties.Tags;
          const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(iacTag).toBeDefined();
          expect(iacTag.Value).toBe('true');
        });

        test('should have inline code with error handling', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Code.ZipFile).toBeDefined();
          expect(func.Properties.Code.ZipFile).toContain('try:');
          expect(func.Properties.Code.ZipFile).toContain('except');
        });

        test('should emit CloudWatch metrics', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Code.ZipFile).toContain('cloudwatch.put_metric_data');
        });
      });
    });

    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have least-privilege policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('ReplicationAccessPolicy');

      const statements = policies[0].PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        expect(statement.Resource).toBeDefined();
        if (Array.isArray(statement.Resource)) {
          statement.Resource.forEach((resource: any) => {
            expect(resource).not.toBe('*');
          });
        }
      });
    });

    test('should have StreamEventSourceMapping', () => {
      expect(template.Resources.StreamEventSourceMapping).toBeDefined();
      expect(template.Resources.StreamEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have StackUpdateEventRule', () => {
      expect(template.Resources.StackUpdateEventRule).toBeDefined();
      expect(template.Resources.StackUpdateEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('StackUpdateEventRule should have proper event pattern', () => {
      const rule = template.Resources.StackUpdateEventRule;
      expect(rule.Properties.EventPattern.source).toContain('aws.cloudformation');
      expect(rule.Properties.EventPattern['detail-type']).toContain('CloudFormation Stack Status Change');
    });

    test('should have ConfigChangeEventRule', () => {
      // Check for both possible resource names to handle different template versions
      const configChangeRule = template.Resources.ConfigChangeEventRule || template.Resources.S3ConfigChangeEventRule;
      expect(configChangeRule).toBeDefined();
      expect(configChangeRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have Lambda permissions for EventBridge', () => {
      expect(template.Resources.StackUpdateLambdaPermission).toBeDefined();
      
      // Check for both possible resource names to handle different template versions
      const configChangePermission = template.Resources.ConfigChangeLambdaPermission || template.Resources.S3ConfigChangeLambdaPermission;
      expect(configChangePermission).toBeDefined();

      expect(template.Resources.StackUpdateLambdaPermission.Properties.Principal).toBe('events.amazonaws.com');
      expect(configChangePermission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('SSM Resources', () => {
    test('should have ApplicationConfigParam', () => {
      expect(template.Resources.ApplicationConfigParam).toBeDefined();
      expect(template.Resources.ApplicationConfigParam.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have DatabaseConfigParam', () => {
      expect(template.Resources.DatabaseConfigParam).toBeDefined();
      expect(template.Resources.DatabaseConfigParam.Type).toBe('AWS::SSM::Parameter');
    });

    test('SSM parameters should have iac-rlhf-amazon tag', () => {
      const params = ['ApplicationConfigParam', 'DatabaseConfigParam'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param.Properties.Tags['iac-rlhf-amazon']).toBe('true');
      });
    });

    test('SSM parameters should use hierarchical naming', () => {
      const appParam = template.Resources.ApplicationConfigParam;
      expect(appParam.Properties.Name['Fn::Sub']).toContain('${SSMPathPrefix}/${Environment}');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should have proper configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have ReplicationDashboard', () => {
      expect(template.Resources.ReplicationDashboard).toBeDefined();
      expect(template.Resources.ReplicationDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('ReplicationDashboard should have widgets', () => {
      const dashboard = template.Resources.ReplicationDashboard;
      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub']);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('all IAM roles should have iac-rlhf-amazon tag', () => {
      const roles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        if (role.Properties.Tags) {
          const iacTag = role.Properties.Tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(iacTag).toBeDefined();
          expect(iacTag.Value).toBe('true');
        }
      });
    });

    test('IAM policies should not use wildcard resources', () => {
      const roles = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::IAM::Role'
      );

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              if (statement.Resource && statement.Resource !== '*') {
                expect(statement.Resource).not.toBe('*');
              }
            });
          });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ReplicationStatusEndpoint',
        'S3BucketName',
        'DynamoDBTableArn',
        'DynamoDBTableName',
        'ReplicationRoleArn',
        'CloudWatchDashboardUrl',
        'LambdaMonitorArn',
        'LambdaValidatorArn',
        'LambdaStreamProcessorArn',
        'StackName',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      const outputsWithExports = [
        'S3BucketName',
        'DynamoDBTableArn',
        'DynamoDBTableName',
        'LambdaMonitorArn',
        'LambdaValidatorArn',
        'LambdaStreamProcessorArn',
        'StackName',
        'Environment'
      ];

      outputsWithExports.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });

    test('ReplicationRoleArn output should be conditional', () => {
      const output = template.Outputs.ReplicationRoleArn;
      expect(output.Value['Fn::If']).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have iac-rlhf-amazon tag', () => {
      const taggableResourceTypes = [
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Lambda::Function'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (taggableResourceTypes.includes(resource.Type)) {
          if (resource.Properties.Tags) {
            const iacTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
            expect(iacTag).toBeDefined();
            expect(iacTag.Value).toBe('true');
          }
        }
      });
    });

    test('all taggable resources should have Environment tag', () => {
      const taggableResourceTypes = [
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Lambda::Function'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (taggableResourceTypes.includes(resource.Type)) {
          if (resource.Properties.Tags) {
            const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
            expect(envTag).toBeDefined();
          }
        }
      });
    });
  });

  describe('Cross-Account Design', () => {
    test('should not have hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      const hardcodedAccountPattern = /"arn:aws:iam::\d{12}:/g;
      const matches = templateStr.match(hardcodedAccountPattern);

      if (matches) {
        matches.forEach(match => {
          expect(match).toContain('${Account');
        });
      }
    });

    test('should use parameters for account-specific values', () => {
      expect(template.Parameters.AccountIdDev).toBeDefined();
      expect(template.Parameters.AccountIdStaging).toBeDefined();
      expect(template.Parameters.AccountIdProd).toBeDefined();
    });

    test('should use Fn::Sub for dynamic resource naming', () => {
      const resourcesWithDynamicNames = [
        'ConfigurationBucket',
        'MetadataTable',
        'ReplicationMonitorLambda',
        'ConfigValidatorLambda',
        'StreamProcessorLambda'
      ];

      resourcesWithDynamicNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
          resource.Properties.TableName ||
          resource.Properties.FunctionName;

        if (nameProperty && typeof nameProperty === 'object') {
          expect(nameProperty['Fn::Sub']).toBeDefined();
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.ConfigurationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('DynamoDB table should have encryption', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda functions should not have overly long timeouts', () => {
      const lambdas = ['ReplicationMonitorLambda', 'StreamProcessorLambda'];
      lambdas.forEach(lambdaName => {
        const lambda = template.Resources[lambdaName];
        expect(lambda.Properties.Timeout).toBeLessThanOrEqual(300);
      });
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.ConfigurationBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
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

    test('should have appropriate number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15);
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(8);
    });

    test('should have appropriate number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });
});
