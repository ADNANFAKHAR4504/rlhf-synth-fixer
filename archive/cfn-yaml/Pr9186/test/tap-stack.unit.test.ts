import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template for testing (converted from YAML using cfn-flip)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Metadata', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Security Configuration as Code');
    });
  });

  describe('Template Structure', () => {
    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters).toHaveProperty('EnvironmentSuffix');
      expect(template.Parameters).toHaveProperty('VpcId');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions).toHaveProperty('CreateVPC');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(10);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBe(4);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter should be configured correctly', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix).toBeDefined();
      expect(envSuffix.Type).toBe('String');
      expect(envSuffix.Description).toContain('Environment suffix');
      expect(envSuffix.Default).toBe('dev');
    });

    test('VpcId parameter should be optional', () => {
      const vpcId = template.Parameters.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId.Type).toBe('String');
      expect(vpcId.Description).toContain('optional');
      expect(vpcId.Default).toBe('');
    });
  });

  describe('S3 Bucket Resource', () => {
    test('should have ProdAppDataBucket with correct properties', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have SSE-S3 encryption enabled', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should use environment suffix in name', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      expect(bucket.Properties.BucketName).toEqual({ 'Fn::Sub': 'prod-app-data-${EnvironmentSuffix}' });
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function resource', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct runtime and configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
    });

    test('Lambda function should use environment suffix in name', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.FunctionName).toEqual({ 'Fn::Sub': 'prod-app-processor-${EnvironmentSuffix}' });
    });
  });

  describe('IAM Roles', () => {
    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'prod-lambda-s3-role-${EnvironmentSuffix}' });
    });

    test('Lambda execution role should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      
      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:PutObject');
    });

    test('should have VPC Flow Logs role', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'vpc-flow-logs-role-${EnvironmentSuffix}' });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda Log Group', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.LogGroupClass).toBe('STANDARD');
    });

    test('should have Lambda Error Alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have Lambda Duration Alarm', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Threshold).toBe(25000);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.ProdAlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      expect(topic.Properties.TopicName).toEqual({ 'Fn::Sub': 'prod-alerts-topic-${EnvironmentSuffix}' });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC resource for flow logs when needed', () => {
      const vpc = template.Resources.VPCForFlowLogs;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('CreateVPC');
    });

    test('should have VPC Flow Logs resource', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPC Flow Logs should have correct format without invalid fields', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Properties.LogFormat).toContain('${srcaddr}');
      expect(flowLogs.Properties.LogFormat).toContain('${dstaddr}');
      expect(flowLogs.Properties.LogFormat).toContain('${action}');
      expect(flowLogs.Properties.LogFormat).not.toContain('windowstart');
      expect(flowLogs.Properties.LogFormat).not.toContain('windowend');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'BucketName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'VPCFlowLogsId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('BucketName output should be correct', () => {
      const output = template.Outputs.BucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ProdAppDataBucket' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BucketName',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn'],
      });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaArn',
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toContain('SNS topic');
      expect(output.Value).toEqual({ Ref: 'ProdAlertsTopic' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopicArn',
      });
    });

    test('VPCFlowLogsId output should be correct', () => {
      const output = template.Outputs.VPCFlowLogsId;
      expect(output.Description).toContain('VPC Flow Logs');
      expect(output.Value).toEqual({ Ref: 'VPCFlowLogs' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCFlowLogsId',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('Lambda should not use wildcard permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Resource) {
            const resources = Array.isArray(statement.Resource) 
              ? statement.Resource 
              : [statement.Resource];
            
            resources.forEach((resource: any) => {
              if (typeof resource === 'string') {
                expect(resource).not.toBe('*');
              }
            });
          }
        });
      });
    });

    test('S3 bucket should not allow public access', () => {
      const bucket = template.Resources.ProdAppDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('SNS topic should use encryption', () => {
      const topic = template.Resources.ProdAlertsTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      expect(topic.Properties.KmsMasterKeyId).not.toBe('');
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda should depend on its Log Group', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
    });

    test('Lambda alarms should reference Lambda function', () => {
      const errorAlarm = template.Resources.LambdaErrorAlarm;
      const durationAlarm = template.Resources.LambdaDurationAlarm;
      
      expect(errorAlarm.Properties.Dimensions).toContainEqual({
        Name: 'FunctionName',
        Value: { Ref: 'LambdaFunction' }
      });
      
      expect(durationAlarm.Properties.Dimensions).toContainEqual({
        Name: 'FunctionName',
        Value: { Ref: 'LambdaFunction' }
      });
    });

    test('VPC Flow Logs should reference Log Group and Role', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Properties.LogDestination).toHaveProperty('Fn::GetAtt');
      expect(flowLogs.Properties.LogDestination['Fn::GetAtt'][0]).toBe('VPCFlowLogsGroup');
      
      expect(flowLogs.Properties.DeliverLogsPermissionArn).toHaveProperty('Fn::GetAtt');
      expect(flowLogs.Properties.DeliverLogsPermissionArn['Fn::GetAtt'][0]).toBe('VPCFlowLogsRole');
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'ProdAppDataBucket',
        'LambdaExecutionRole',
        'LambdaFunction',
        'ProdAlertsTopic',
        'LambdaErrorAlarm',
        'LambdaDurationAlarm',
        'VPCFlowLogsRole',
        'VPCFlowLogsGroup',
        'VPCFlowLogs',
        'LambdaLogGroup'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });
  });
});
