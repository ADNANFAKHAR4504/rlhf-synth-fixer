import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Format', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-grade migration infrastructure stack for web application environment in us-east-1'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(Array.isArray(template)).toBe(false);
    });
  });

  describe('Parameters Validation', () => {
    const requiredParameters = [
      'VpcSecurityGroupId',
      'VpcSubnetIds',
      'NotificationEmail',
      'LambdaMemorySize',
      'LambdaTimeout',
      'ExistingMigrationLogsBucketName',
      'ExistingSnsTopicArn',
      'ExistingMigrationTriggerFunctionArn',
      'ExistingStatusNotifierFunctionArn',
      'ExistingRestApiId'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('VpcSecurityGroupId parameter should have correct properties', () => {
      const param = template.Parameters.VpcSecurityGroupId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Security Group ID for Lambda functions in VPC');
      expect(param.AllowedPattern).toBe('^$|^sg-[a-z0-9]+$');
      expect(param.ConstraintDescription).toContain('Must be empty or a valid security group ID');
    });

    test('VpcSubnetIds parameter should have correct properties', () => {
      const param = template.Parameters.VpcSubnetIds;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Subnet IDs for Lambda functions in VPC');
      expect(param.AllowedPattern).toBe('^$|^subnet-[a-z0-9]+(,subnet-[a-z0-9]+)*$');
      expect(param.ConstraintDescription).toContain('comma-separated list of valid subnet IDs');
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Email address for migration status notifications');
      expect(param.AllowedPattern).toBe('^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
      expect(param.ConstraintDescription).toContain('Must be empty or a valid email address');
    });

    test('LambdaMemorySize parameter should have correct properties', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(256);
      expect(param.Description).toContain('Memory size (MB) for Lambda functions');
      expect(param.AllowedValues).toEqual([128, 256, 512, 1024, 2048]);
    });

    test('LambdaTimeout parameter should have correct properties', () => {
      const param = template.Parameters.LambdaTimeout;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(300);
      expect(param.Description).toContain('Timeout (seconds) for Lambda functions');
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(900);
    });

    test('ExistingMigrationLogsBucketName parameter should have correct properties', () => {
      const param = template.Parameters.ExistingMigrationLogsBucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing S3 bucket name for migration logs');
    });

    test('ExistingSnsTopicArn parameter should have correct properties', () => {
      const param = template.Parameters.ExistingSnsTopicArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing SNS Topic ARN for notifications');
    });

    test('ExistingMigrationTriggerFunctionArn parameter should have correct properties', () => {
      const param = template.Parameters.ExistingMigrationTriggerFunctionArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing Lambda ARN for Migration Trigger');
    });

    test('ExistingStatusNotifierFunctionArn parameter should have correct properties', () => {
      const param = template.Parameters.ExistingStatusNotifierFunctionArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing Lambda ARN for Status Notifier');
    });

    test('ExistingRestApiId parameter should have correct properties', () => {
      const param = template.Parameters.ExistingRestApiId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing API Gateway RestApiId to reuse');
    });

    test('should have exactly 10 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });
  });

  describe('Conditions Validation', () => {
    const requiredConditions = [
      'UseVpc',
      'CreateSubscription',
      'CreateBucket',
      'CreateSnsTopic',
      'CreateMigrationTriggerFunction',
      'CreateStatusNotifierFunction',
      'CreateApi'
    ];

    test('should have all required conditions', () => {
      requiredConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('UseVpc condition should use proper boolean logic', () => {
      const condition = template.Conditions.UseVpc;
      expect(condition).toBeDefined();
      expect(condition['Fn::And']).toBeDefined();
      expect(Array.isArray(condition['Fn::And'])).toBe(true);
    });

    test('CreateSubscription condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateSubscription;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
      expect(Array.isArray(condition['Fn::Not'])).toBe(true);
    });

    test('CreateBucket condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateBucket;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
    });

    test('CreateSnsTopic condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateSnsTopic;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
    });

    test('CreateMigrationTriggerFunction condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateMigrationTriggerFunction;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
    });

    test('CreateStatusNotifierFunction condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateStatusNotifierFunction;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
    });

    test('CreateApi condition should use proper boolean logic', () => {
      const condition = template.Conditions.CreateApi;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
    });

    test('should have exactly 7 conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(7);
    });
  });

  describe('Resources Validation', () => {
    const requiredResources = [
      'MigrationLogsBucket',
      'MigrationNotificationsTopic',
      'MigrationNotificationsSubscription',
      'MigrationTriggerFunctionRole',
      'StatusNotifierFunctionRole',
      'MigrationTriggerFunction',
      'StatusNotifierFunction',
      'MigrationApi',
      'MigrateResource',
      'MigrateMethod',
      'ApiGatewayInvokePermission',
      'ApiDeployment',
      'ApiStage'
    ];

    test('should have all required resources', () => {
      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have exactly 13 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13);
    });

    test('MigrationLogsBucket should be properly configured', () => {
      const bucket = template.Resources.MigrationLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
      expect(bucket.Condition).toBe('CreateBucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.Tags).toBeDefined();
    });

    test('MigrationNotificationsTopic should be properly configured', () => {
      const topic = template.Resources.MigrationNotificationsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Retain');
      expect(topic.UpdateReplacePolicy).toBe('Retain');
      expect(topic.Condition).toBe('CreateSnsTopic');
      expect(topic.Properties.DisplayName).toBe('Migration Status Notifications');
      expect(topic.Properties.Tags).toBeDefined();
    });

    test('MigrationNotificationsSubscription should be properly configured', () => {
      const subscription = template.Resources.MigrationNotificationsSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Condition).toBe('CreateSubscription');
      expect(subscription.DeletionPolicy).toBe('Retain');
      expect(subscription.UpdateReplacePolicy).toBe('Retain');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toBeDefined();
    });

    test('MigrationTriggerFunctionRole should be properly configured', () => {
      const role = template.Resources.MigrationTriggerFunctionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Retain');
      expect(role.UpdateReplacePolicy).toBe('Retain');
      expect(role.Condition).toBe('CreateMigrationTriggerFunction');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
    });

    test('StatusNotifierFunctionRole should be properly configured', () => {
      const role = template.Resources.StatusNotifierFunctionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Retain');
      expect(role.UpdateReplacePolicy).toBe('Retain');
      expect(role.Condition).toBe('CreateStatusNotifierFunction');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
    });

    test('MigrationTriggerFunction should be properly configured', () => {
      const function_ = template.Resources.MigrationTriggerFunction;
      expect(function_.Type).toBe('AWS::Lambda::Function');
      expect(function_.DeletionPolicy).toBe('Retain');
      expect(function_.UpdateReplacePolicy).toBe('Retain');
      expect(function_.Condition).toBe('CreateMigrationTriggerFunction');
      expect(function_.Properties.Runtime).toBe('python3.13');
      expect(function_.Properties.Handler).toBe('index.lambda_handler');
      expect(function_.Properties.Role).toBeDefined();
      expect(function_.Properties.Timeout).toBeDefined();
      expect(function_.Properties.MemorySize).toBeDefined();
      expect(function_.Properties.Environment).toBeDefined();
      expect(function_.Properties.Code).toBeDefined();
    });

    test('StatusNotifierFunction should be properly configured', () => {
      const function_ = template.Resources.StatusNotifierFunction;
      expect(function_.Type).toBe('AWS::Lambda::Function');
      expect(function_.DeletionPolicy).toBe('Retain');
      expect(function_.UpdateReplacePolicy).toBe('Retain');
      expect(function_.Condition).toBe('CreateStatusNotifierFunction');
      expect(function_.Properties.Runtime).toBe('python3.13');
      expect(function_.Properties.Handler).toBe('index.lambda_handler');
      expect(function_.Properties.Role).toBeDefined();
      expect(function_.Properties.Timeout).toBe(60);
      expect(function_.Properties.MemorySize).toBe(128);
      expect(function_.Properties.Environment).toBeDefined();
      expect(function_.Properties.Code).toBeDefined();
    });

    test('MigrationApi should be properly configured', () => {
      const api = template.Resources.MigrationApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.DeletionPolicy).toBe('Retain');
      expect(api.UpdateReplacePolicy).toBe('Retain');
      expect(api.Condition).toBe('CreateApi');
      expect(api.Properties.Name).toBeDefined();
      expect(api.Properties.Description).toBe('REST API for triggering migration processes');
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.Tags).toBeDefined();
    });

    test('MigrateResource should be properly configured', () => {
      const resource = template.Resources.MigrateResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.DeletionPolicy).toBe('Retain');
      expect(resource.UpdateReplacePolicy).toBe('Retain');
      expect(resource.Condition).toBe('CreateApi');
      expect(resource.Properties.RestApiId).toBeDefined();
      expect(resource.Properties.ParentId).toBeDefined();
      expect(resource.Properties.PathPart).toBe('migrate');
    });

    test('MigrateMethod should be properly configured', () => {
      const method = template.Resources.MigrateMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.DeletionPolicy).toBe('Retain');
      expect(method.UpdateReplacePolicy).toBe('Retain');
      expect(method.Condition).toBe('CreateApi');
      expect(method.Properties.RestApiId).toBeDefined();
      expect(method.Properties.ResourceId).toBeDefined();
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration).toBeDefined();
      expect(method.Properties.MethodResponses).toBeDefined();
    });

    test('ApiGatewayInvokePermission should be properly configured', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.DeletionPolicy).toBe('Retain');
      expect(permission.UpdateReplacePolicy).toBe('Retain');
      expect(permission.Condition).toBe('CreateApi');
      expect(permission.Properties.FunctionName).toBeDefined();
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.SourceArn).toBeDefined();
    });

    test('ApiDeployment should be properly configured', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DeletionPolicy).toBe('Retain');
      expect(deployment.UpdateReplacePolicy).toBe('Retain');
      expect(deployment.Condition).toBe('CreateApi');
      expect(deployment.DependsOn).toBeDefined();
      expect(deployment.Properties.RestApiId).toBeDefined();
      expect(deployment.Properties.Description).toBeDefined();
    });

    test('ApiStage should be properly configured', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.DeletionPolicy).toBe('Retain');
      expect(stage.UpdateReplacePolicy).toBe('Retain');
      expect(stage.Condition).toBe('CreateApi');
      expect(stage.Properties.RestApiId).toBeDefined();
      expect(stage.Properties.DeploymentId).toBeDefined();
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.Description).toBeDefined();
      expect(stage.Properties.Tags).toBeDefined();
    });
  });

  describe('Resource Dependencies and References', () => {
    test('MigrationNotificationsSubscription should reference correct topic', () => {
      const subscription = template.Resources.MigrationNotificationsSubscription;
      const topicArn = subscription.Properties.TopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn['Fn::If']).toBeDefined();
      expect(topicArn['Fn::If'][0]).toBe('CreateSnsTopic');
    });

    test('MigrationTriggerFunction should reference correct role', () => {
      const function_ = template.Resources.MigrationTriggerFunction;
      const role = function_.Properties.Role;
      expect(role).toBeDefined();
      expect(role['Fn::GetAtt']).toBeDefined();
      expect(role['Fn::GetAtt'][0]).toBe('MigrationTriggerFunctionRole');
      expect(role['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('StatusNotifierFunction should reference correct role', () => {
      const function_ = template.Resources.StatusNotifierFunction;
      const role = function_.Properties.Role;
      expect(role).toBeDefined();
      expect(role['Fn::GetAtt']).toBeDefined();
      expect(role['Fn::GetAtt'][0]).toBe('StatusNotifierFunctionRole');
      expect(role['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('MigrateResource should reference correct API', () => {
      const resource = template.Resources.MigrateResource;
      const restApiId = resource.Properties.RestApiId;
      expect(restApiId).toBeDefined();
      expect(restApiId).toEqual({ Ref: 'MigrationApi' });
    });

    test('MigrateMethod should reference correct resource', () => {
      const method = template.Resources.MigrateMethod;
      const resourceId = method.Properties.ResourceId;
      expect(resourceId).toBeDefined();
      expect(resourceId).toEqual({ Ref: 'MigrateResource' });
    });

    test('ApiDeployment should depend on MigrateMethod', () => {
      const deployment = template.Resources.ApiDeployment;
      const dependsOn = deployment.DependsOn;
      expect(dependsOn).toBeDefined();
      expect(dependsOn).toContain('MigrateMethod');
    });

    test('ApiStage should reference correct deployment', () => {
      const stage = template.Resources.ApiStage;
      const deploymentId = stage.Properties.DeploymentId;
      expect(deploymentId).toBeDefined();
      expect(deploymentId).toEqual({ Ref: 'ApiDeployment' });
    });
  });

  describe('IAM Policy Validation', () => {
    test('MigrationTriggerFunctionRole should have correct policies', () => {
      const role = template.Resources.MigrationTriggerFunctionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);

      const policy = policies[0];
      expect(policy.PolicyName).toBeDefined();
      expect(policy.PolicyDocument).toBeDefined();
      expect(policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(policy.PolicyDocument.Statement).toBeDefined();
    });

    test('StatusNotifierFunctionRole should have correct policies', () => {
      const role = template.Resources.StatusNotifierFunctionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);

      const policy = policies[0];
      expect(policy.PolicyName).toBeDefined();
      expect(policy.PolicyDocument).toBeDefined();
      expect(policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(policy.PolicyDocument.Statement).toBeDefined();
    });

    test('MigrationTriggerFunctionRole should have S3 and SNS permissions', () => {
      const role = template.Resources.MigrationTriggerFunctionRole;
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) => s.Action && Array.isArray(s.Action) && s.Action.some((a: string) => a.includes('s3:')));
      const snsStatement = statements.find((s: any) => s.Action && Array.isArray(s.Action) && s.Action.some((a: string) => a.includes('sns:')));

      expect(s3Statement).toBeDefined();
      expect(snsStatement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(snsStatement.Effect).toBe('Allow');
    });

    test('StatusNotifierFunctionRole should have SNS permissions', () => {
      const role = template.Resources.StatusNotifierFunctionRole;
      const policies = role.Properties.Policies;
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      const snsStatement = statements.find((s: any) => s.Action && Array.isArray(s.Action) && s.Action.some((a: string) => a.includes('sns:')));

      expect(snsStatement).toBeDefined();
      expect(snsStatement.Effect).toBe('Allow');
      expect(snsStatement.Action).toContain('sns:Publish');
    });
  });

  describe('Lambda Function Code Validation', () => {
    test('MigrationTriggerFunction should have valid Python code', () => {
      const function_ = template.Resources.MigrationTriggerFunction;
      const code = function_.Properties.Code;
      expect(code.ZipFile).toBeDefined();
      expect(typeof code.ZipFile).toBe('string');
      expect(code.ZipFile).toContain('import json');
      expect(code.ZipFile).toContain('import boto3');
      expect(code.ZipFile).toContain('def lambda_handler');
    });

    test('StatusNotifierFunction should have valid Python code', () => {
      const function_ = template.Resources.StatusNotifierFunction;
      const code = function_.Properties.Code;
      expect(code.ZipFile).toBeDefined();
      expect(typeof code.ZipFile).toBe('string');
      expect(code.ZipFile).toContain('import json');
      expect(code.ZipFile).toContain('import boto3');
      expect(code.ZipFile).toContain('def lambda_handler');
    });

    test('MigrationTriggerFunction should have environment variables', () => {
      const function_ = template.Resources.MigrationTriggerFunction;
      const env = function_.Properties.Environment;
      expect(env.Variables).toBeDefined();
      expect(env.Variables.S3_BUCKET_NAME).toBeDefined();
      expect(env.Variables.SNS_TOPIC_ARN).toBeDefined();
    });

    test('StatusNotifierFunction should have environment variables', () => {
      const function_ = template.Resources.StatusNotifierFunction;
      const env = function_.Properties.Environment;
      expect(env.Variables).toBeDefined();
      expect(env.Variables.SNS_TOPIC_ARN).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    const requiredOutputs = [
      'ApiGatewayInvokeUrl',
      'SnsTopicArn',
      'MigrationLogsBucketName',
      'MigrationTriggerFunctionArn',
      'StatusNotifierFunctionArn',
      'StackRegion'
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('ApiGatewayInvokeUrl output should be properly configured', () => {
      const output = template.Outputs.ApiGatewayInvokeUrl;
      expect(output.Description).toBe('Invoke URL for the Migration API Gateway');
      expect(output.Condition).toBe('CreateApi');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('SnsTopicArn output should be properly configured', () => {
      const output = template.Outputs.SnsTopicArn;
      expect(output.Description).toBe('ARN of the Migration Notifications SNS Topic');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('MigrationLogsBucketName output should be properly configured', () => {
      const output = template.Outputs.MigrationLogsBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for migration logs');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('MigrationTriggerFunctionArn output should be properly configured', () => {
      const output = template.Outputs.MigrationTriggerFunctionArn;
      expect(output.Description).toBe('ARN of the Migration Trigger Lambda Function');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('StatusNotifierFunctionArn output should be properly configured', () => {
      const output = template.Outputs.StatusNotifierFunctionArn;
      expect(output.Description).toBe('ARN of the Status Notifier Lambda Function');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('StackRegion output should be properly configured', () => {
      const output = template.Outputs.StackRegion;
      expect(output.Description).toBe('AWS Region where the stack is deployed');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('all outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('AWS::StackName');
        // Check if the export name contains the output key (some outputs have different naming)
        const exportName = output.Export.Name['Fn::Sub'];
        if (outputKey === 'ApiGatewayInvokeUrl') {
          expect(exportName).toContain('ApiGatewayUrl');
        } else if (outputKey === 'MigrationLogsBucketName') {
          expect(exportName).toContain('LogsBucket');
        } else if (outputKey === 'MigrationTriggerFunctionArn') {
          expect(exportName).toContain('MigrationTriggerArn');
        } else if (outputKey === 'StatusNotifierFunctionArn') {
          expect(exportName).toContain('StatusNotifierArn');
        } else if (outputKey === 'StackRegion') {
          expect(exportName).toContain('Region');
        } else {
          expect(exportName).toContain(outputKey);
        }
      });
    });
  });

  describe('Conditional Logic Validation', () => {
    test('UseVpc condition should handle empty VPC parameters', () => {
      const condition = template.Conditions.UseVpc;
      expect(condition['Fn::And']).toBeDefined();
      expect(Array.isArray(condition['Fn::And'])).toBe(true);
      expect(condition['Fn::And'].length).toBe(2);
    });

    test('CreateSubscription condition should handle empty email', () => {
      const condition = template.Conditions.CreateSubscription;
      expect(condition['Fn::Not']).toBeDefined();
      expect(Array.isArray(condition['Fn::Not'])).toBe(true);
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
    });

    test('CreateBucket condition should handle existing bucket', () => {
      const condition = template.Conditions.CreateBucket;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
      expect(condition['Fn::Equals'][0]['Ref']).toBe('ExistingMigrationLogsBucketName');
      expect(condition['Fn::Equals'][1]).toBe('');
    });

    test('CreateSnsTopic condition should handle existing topic', () => {
      const condition = template.Conditions.CreateSnsTopic;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
      expect(condition['Fn::Equals'][0]['Ref']).toBe('ExistingSnsTopicArn');
      expect(condition['Fn::Equals'][1]).toBe('');
    });

    test('CreateMigrationTriggerFunction condition should handle existing function', () => {
      const condition = template.Conditions.CreateMigrationTriggerFunction;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
      expect(condition['Fn::Equals'][0]['Ref']).toBe('ExistingMigrationTriggerFunctionArn');
      expect(condition['Fn::Equals'][1]).toBe('');
    });

    test('CreateStatusNotifierFunction condition should handle existing function', () => {
      const condition = template.Conditions.CreateStatusNotifierFunction;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
      expect(condition['Fn::Equals'][0]['Ref']).toBe('ExistingStatusNotifierFunctionArn');
      expect(condition['Fn::Equals'][1]).toBe('');
    });

    test('CreateApi condition should handle existing API', () => {
      const condition = template.Conditions.CreateApi;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(Array.isArray(condition['Fn::Equals'])).toBe(true);
      expect(condition['Fn::Equals'][0]['Ref']).toBe('ExistingRestApiId');
      expect(condition['Fn::Equals'][1]).toBe('');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources should have proper deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Retain');
        expect(resource.UpdateReplacePolicy).toBe('Retain');
      });
    });

    test('S3 bucket should have proper encryption and access controls', () => {
      const bucket = template.Resources.MigrationLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
    });

    test('Lambda functions should have proper runtime and configuration', () => {
      const functions = ['MigrationTriggerFunction', 'StatusNotifierFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.Runtime).toBe('python3.13');
        expect(func.Properties.Handler).toBe('index.lambda_handler');
        expect(func.Properties.Timeout).toBeDefined();
        expect(func.Properties.MemorySize).toBeDefined();
      });
    });

    test('API Gateway should have proper configuration', () => {
      const api = template.Resources.MigrationApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.Description).toBe('REST API for triggering migration processes');
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = [
        'MigrationLogsBucket',
        'MigrationNotificationsTopic',
        'MigrationTriggerFunctionRole',
        'StatusNotifierFunctionRole',
        'MigrationTriggerFunction',
        'StatusNotifierFunction',
        'MigrationApi',
        'ApiStage'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);

        const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe('Migration');
      });
    });
  });

  describe('Template Completeness and Quality', () => {
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have consistent resource naming patterns', () => {
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('should have consistent parameter naming patterns', () => {
      const parameterNames = Object.keys(template.Parameters);
      parameterNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('should have consistent output naming patterns', () => {
      const outputNames = Object.keys(template.Outputs);
      outputNames.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('should have proper error handling in Lambda functions', () => {
      const functions = ['MigrationTriggerFunction', 'StatusNotifierFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        const code = func.Properties.Code.ZipFile;
        expect(code).toContain('try:');
        expect(code).toContain('except Exception as e:');
        expect(code).toContain('logger.error');
      });
    });

    test('should have proper logging in Lambda functions', () => {
      const functions = ['MigrationTriggerFunction', 'StatusNotifierFunction'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        const code = func.Properties.Code.ZipFile;
        expect(code).toContain('import logging');
        expect(code).toContain('logger = logging.getLogger()');
        expect(code).toContain('logger.setLevel(logging.INFO)');
      });
    });
  });
});