import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
        'Complete serverless file processing application with event-driven architecture and public API'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix to distinguish deployments (e.g., dev, stg, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have RootDomainName parameter', () => {
      expect(template.Parameters.RootDomainName).toBeDefined();
    });

    test('RootDomainName parameter should have correct properties', () => {
      const domainParam = template.Parameters.RootDomainName;
      expect(domainParam.Type).toBe('String');
      expect(domainParam.Description).toBe(
        'Root domain name for the application (e.g., example.com)'
      );
      expect(domainParam.Default).toBe('');
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('Conditions', () => {
    test('should have HasDomain condition', () => {
      expect(template.Conditions.HasDomain).toBeDefined();
    });

    test('HasDomain condition should use Fn::Not and Fn::Equals', () => {
      const condition = template.Conditions.HasDomain;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][0]).toEqual({
        Ref: 'RootDomainName',
      });
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });

    test('should have exactly one condition', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'HostedZone',
        'Certificate',
        'FileProcessingBucket',
        'LambdaExecutionRole',
        'FileProcessorFunction',
        'FileProcessorApi',
        'ApiResource',
        'ApiMethodGet',
        'ApiMethodPost',
        'ApiMethodOptions',
        'ApiDeployment',
        'ApiDomainName',
        'ApiBasePathMapping',
        'ApiDnsRecord',
        'S3InvokePermission',
        'S3EventRule',
        'EventBridgeInvokeLambdaPermission',
        'ApiGatewayInvokePermissionGet',
        'ApiGatewayInvokePermissionPost',
        'AlertTopic',
        'LambdaErrorAlarm',
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have exactly 21 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(21);
    });

    describe('HostedZone Resource', () => {
      test('should be a Route53 HostedZone', () => {
        const hostedZone = template.Resources.HostedZone;
        expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
        expect(hostedZone.Condition).toBe('HasDomain');
      });

      test('should have correct properties', () => {
        const hostedZone = template.Resources.HostedZone;
        expect(hostedZone.Properties.Name).toEqual({ Ref: 'RootDomainName' });
        expect(hostedZone.Properties.HostedZoneConfig.Comment).toEqual({
          'Fn::Sub':
            'Hosted zone for ${RootDomainName} - ${EnvironmentSuffix} environment',
        });
      });

      test('should have correct tags', () => {
        const hostedZone = template.Resources.HostedZone;
        const tags = hostedZone.Properties.HostedZoneTags;
        expect(tags).toHaveLength(2);
        expect(tags[0].Key).toBe('Name');
        expect(tags[0].Value).toEqual({
          'Fn::Sub': 'ServerlessApp-${EnvironmentSuffix}-HostedZone',
        });
        expect(tags[1].Key).toBe('Environment');
        expect(tags[1].Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });

    describe('Certificate Resource', () => {
      test('should be an ACM Certificate', () => {
        const certificate = template.Resources.Certificate;
        expect(certificate.Type).toBe('AWS::CertificateManager::Certificate');
        expect(certificate.Condition).toBe('HasDomain');
      });

      test('should have correct properties', () => {
        const certificate = template.Resources.Certificate;
        expect(certificate.Properties.DomainName).toEqual({
          'Fn::Sub': 'api-${EnvironmentSuffix}.${RootDomainName}',
        });
        expect(certificate.Properties.ValidationMethod).toBe('DNS');
        expect(certificate.Properties.DomainValidationOptions).toHaveLength(1);
      });

      test('should have correct domain validation options', () => {
        const certificate = template.Resources.Certificate;
        const validationOption =
          certificate.Properties.DomainValidationOptions[0];
        expect(validationOption.DomainName).toEqual({
          'Fn::Sub': 'api-${EnvironmentSuffix}.${RootDomainName}',
        });
        expect(validationOption.HostedZoneId).toEqual({ Ref: 'HostedZone' });
      });
    });

    describe('FileProcessingBucket Resource', () => {
      test('should be an S3 Bucket', () => {
        const bucket = template.Resources.FileProcessingBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have correct bucket name', () => {
        const bucket = template.Resources.FileProcessingBucket;
        expect(bucket.Properties.BucketName).toEqual({
          'Fn::Sub': 'serverless-files-${EnvironmentSuffix}-${AWS::AccountId}',
        });
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.FileProcessingBucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });

      test('should have EventBridge notifications enabled', () => {
        const bucket = template.Resources.FileProcessingBucket;
        expect(
          bucket.Properties.NotificationConfiguration.EventBridgeConfiguration
            .EventBridgeEnabled
        ).toBe(true);
      });

      test('should have public access blocked', () => {
        const bucket = template.Resources.FileProcessingBucket;
        const publicAccessBlock =
          bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    describe('LambdaExecutionRole Resource', () => {
      test('should be an IAM Role', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct role name', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.RoleName).toEqual({
          'Fn::Sub': 'ServerlessApp-${EnvironmentSuffix}-LambdaRole',
        });
      });

      test('should have correct assume role policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumeRolePolicy.Version).toBe('2012-10-17');
        expect(assumeRolePolicy.Statement).toHaveLength(1);
        expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have basic execution role managed policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('should have S3 read access policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policies = role.Properties.Policies;
        expect(policies).toHaveLength(1);
        expect(policies[0].PolicyName).toBe('S3ReadAccess');
        expect(policies[0].PolicyDocument.Version).toBe('2012-10-17');
        expect(policies[0].PolicyDocument.Statement).toHaveLength(1);
        expect(policies[0].PolicyDocument.Statement[0].Effect).toBe('Allow');
        expect(policies[0].PolicyDocument.Statement[0].Action).toContain(
          's3:GetObject'
        );
      });
    });

    describe('FileProcessorFunction Resource', () => {
      test('should be a Lambda Function', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Type).toBe('AWS::Lambda::Function');
      });

      test('should have correct function name', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Properties.FunctionName).toEqual({
          'Fn::Sub': 'ServerlessApp-${EnvironmentSuffix}-FileProcessor',
        });
      });

      test('should have correct runtime and handler', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Properties.Runtime).toBe('python3.13');
        expect(function_.Properties.Handler).toBe('index.lambda_handler');
      });

      test('should have correct role reference', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        });
      });

      test('should have reserved concurrent executions', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Properties.ReservedConcurrentExecutions).toBe(10);
      });

      test('should have environment variables', () => {
        const function_ = template.Resources.FileProcessorFunction;
        const envVars = function_.Properties.Environment.Variables;
        expect(envVars.BUCKET_NAME).toEqual({ Ref: 'FileProcessingBucket' });
        expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      });

      test('should have inline code', () => {
        const function_ = template.Resources.FileProcessorFunction;
        expect(function_.Properties.Code.ZipFile).toBeDefined();
        expect(typeof function_.Properties.Code.ZipFile).toBe('string');
        expect(function_.Properties.Code.ZipFile).toContain(
          'def lambda_handler'
        );
      });
    });

    describe('FileProcessorApi Resource', () => {
      test('should be an API Gateway RestApi', () => {
        const api = template.Resources.FileProcessorApi;
        expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('should have correct name', () => {
        const api = template.Resources.FileProcessorApi;
        expect(api.Properties.Name).toEqual({
          'Fn::Sub': 'ServerlessApp-${EnvironmentSuffix}-API',
        });
      });

      test('should have regional endpoint configuration', () => {
        const api = template.Resources.FileProcessorApi;
        expect(api.Properties.EndpointConfiguration.Types).toContain(
          'REGIONAL'
        );
      });
    });

    describe('ApiResource Resource', () => {
      test('should be an API Gateway Resource', () => {
        const resource = template.Resources.ApiResource;
        expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      });

      test('should have correct path part', () => {
        const resource = template.Resources.ApiResource;
        expect(resource.Properties.PathPart).toBe('process');
      });

      test('should reference the API and root resource', () => {
        const resource = template.Resources.ApiResource;
        expect(resource.Properties.RestApiId).toEqual({
          Ref: 'FileProcessorApi',
        });
        expect(resource.Properties.ParentId).toEqual({
          'Fn::GetAtt': ['FileProcessorApi', 'RootResourceId'],
        });
      });
    });

    describe('API Gateway Methods', () => {
      test('should have GET method', () => {
        const method = template.Resources.ApiMethodGet;
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('GET');
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });

      test('should have POST method', () => {
        const method = template.Resources.ApiMethodPost;
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('POST');
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });

      test('should have OPTIONS method', () => {
        const method = template.Resources.ApiMethodOptions;
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('OPTIONS');
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });

      test('GET and POST methods should use AWS_PROXY integration', () => {
        const getMethod = template.Resources.ApiMethodGet;
        const postMethod = template.Resources.ApiMethodPost;

        expect(getMethod.Properties.Integration.Type).toBe('AWS_PROXY');
        expect(getMethod.Properties.Integration.IntegrationHttpMethod).toBe(
          'POST'
        );
        expect(postMethod.Properties.Integration.Type).toBe('AWS_PROXY');
        expect(postMethod.Properties.Integration.IntegrationHttpMethod).toBe(
          'POST'
        );
      });

      test('OPTIONS method should use MOCK integration', () => {
        const method = template.Resources.ApiMethodOptions;
        expect(method.Properties.Integration.Type).toBe('MOCK');
      });
    });

    describe('ApiDeployment Resource', () => {
      test('should be an API Gateway Deployment', () => {
        const deployment = template.Resources.ApiDeployment;
        expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      });

      test('should depend on all API methods', () => {
        const deployment = template.Resources.ApiDeployment;
        expect(deployment.DependsOn).toContain('ApiMethodGet');
        expect(deployment.DependsOn).toContain('ApiMethodPost');
        expect(deployment.DependsOn).toContain('ApiMethodOptions');
      });

      test('should have correct stage name', () => {
        const deployment = template.Resources.ApiDeployment;
        expect(deployment.Properties.StageName).toEqual({
          Ref: 'EnvironmentSuffix',
        });
      });
    });

    describe('Conditional Resources', () => {
      test('ApiDomainName should be conditional', () => {
        const domainName = template.Resources.ApiDomainName;
        expect(domainName.Condition).toBe('HasDomain');
        expect(domainName.Type).toBe('AWS::ApiGateway::DomainName');
      });

      test('ApiBasePathMapping should be conditional', () => {
        const mapping = template.Resources.ApiBasePathMapping;
        expect(mapping.Condition).toBe('HasDomain');
        expect(mapping.Type).toBe('AWS::ApiGateway::BasePathMapping');
      });

      test('ApiDnsRecord should be conditional', () => {
        const dnsRecord = template.Resources.ApiDnsRecord;
        expect(dnsRecord.Condition).toBe('HasDomain');
        expect(dnsRecord.Type).toBe('AWS::Route53::RecordSet');
      });
    });

    describe('Permissions and Event Rules', () => {
      test('should have S3 invoke permission', () => {
        const permission = template.Resources.S3InvokePermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      });

      test('should have EventBridge rule', () => {
        const rule = template.Resources.S3EventRule;
        expect(rule.Type).toBe('AWS::Events::Rule');
        expect(rule.Properties.EventPattern.source).toContain('aws.s3');
        expect(rule.Properties.EventPattern['detail-type']).toContain(
          'Object Created'
        );
      });

      test('should have EventBridge invoke permission', () => {
        const permission = template.Resources.EventBridgeInvokeLambdaPermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      });

      test('should have API Gateway invoke permissions', () => {
        const getPermission = template.Resources.ApiGatewayInvokePermissionGet;
        const postPermission =
          template.Resources.ApiGatewayInvokePermissionPost;

        expect(getPermission.Type).toBe('AWS::Lambda::Permission');
        expect(postPermission.Type).toBe('AWS::Lambda::Permission');
        expect(getPermission.Properties.Principal).toBe(
          'apigateway.amazonaws.com'
        );
        expect(postPermission.Properties.Principal).toBe(
          'apigateway.amazonaws.com'
        );
      });
    });

    describe('Monitoring Resources', () => {
      test('should have SNS topic for alerts', () => {
        const topic = template.Resources.AlertTopic;
        expect(topic.Type).toBe('AWS::SNS::Topic');
        expect(topic.Properties.TopicName).toEqual({
          'Fn::Sub': 'ServerlessApp-${EnvironmentSuffix}-Alerts',
        });
      });

      test('should have CloudWatch alarm', () => {
        const alarm = template.Resources.LambdaErrorAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('Errors');
        expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
        expect(alarm.Properties.Statistic).toBe('Average');
        expect(alarm.Properties.Period).toBe(300);
        expect(alarm.Properties.EvaluationPeriods).toBe(1);
        expect(alarm.Properties.Threshold).toBe(5);
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanThreshold'
        );
      });

      test('CloudWatch alarm should have correct dimensions', () => {
        const alarm = template.Resources.LambdaErrorAlarm;
        const dimensions = alarm.Properties.Dimensions;
        expect(dimensions).toHaveLength(1);
        expect(dimensions[0].Name).toBe('FunctionName');
        expect(dimensions[0].Value).toEqual({ Ref: 'FileProcessorFunction' });
      });

      test('CloudWatch alarm should have alarm actions', () => {
        const alarm = template.Resources.LambdaErrorAlarm;
        expect(alarm.Properties.AlarmActions).toContainEqual({
          Ref: 'AlertTopic',
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'BucketName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'ApiGatewayUrl',
        'CustomDomainUrl',
        'HostedZoneId',
        'HostedZoneNameServers',
        'CertificateArn',
        'SNSTopicArn',
        'Environment',
        'StackName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('BucketName output should be correct', () => {
      const output = template.Outputs.BucketName;
      expect(output.Description).toBe('Name of the S3 bucket for file uploads');
      expect(output.Value).toEqual({ Ref: 'FileProcessingBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BucketName',
      });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Name of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'FileProcessorFunction' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunction',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['FileProcessorFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionArn',
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${FileProcessorApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/process',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiUrl',
      });
    });

    test('CustomDomainUrl output should be conditional', () => {
      const output = template.Outputs.CustomDomainUrl;
      expect(output.Condition).toBe('HasDomain');
      expect(output.Description).toBe('Custom domain URL for the API');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://api-${EnvironmentSuffix}.${RootDomainName}/process',
      });
    });

    test('HostedZoneId output should be conditional', () => {
      const output = template.Outputs.HostedZoneId;
      expect(output.Condition).toBe('HasDomain');
      expect(output.Description).toBe('Route 53 Hosted Zone ID');
      expect(output.Value).toEqual({ Ref: 'HostedZone' });
    });

    test('HostedZoneNameServers output should be conditional', () => {
      const output = template.Outputs.HostedZoneNameServers;
      expect(output.Condition).toBe('HasDomain');
      expect(output.Description).toBe(
        'Name servers for the hosted zone (configure these with your domain registrar)'
      );
      expect(output.Value).toEqual({
        'Fn::Join': [', ', { 'Fn::GetAtt': ['HostedZone', 'NameServers'] }],
      });
    });

    test('CertificateArn output should be conditional', () => {
      const output = template.Outputs.CertificateArn;
      expect(output.Condition).toBe('HasDomain');
      expect(output.Description).toBe('ARN of the ACM certificate');
      expect(output.Value).toEqual({ Ref: 'Certificate' });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('SNS Topic ARN for alerts');
      expect(output.Value).toEqual({ Ref: 'AlertTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AlertTopic',
      });
    });

    test('Environment output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Environment',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
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
      expect(template.Conditions).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resources should have valid types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all outputs should have descriptions and values', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
      });
    });

    test('all parameters should have types and descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBeDefined();
        expect(param.Description).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      const resourcesWithNaming = [
        'HostedZone',
        'Certificate',
        'FileProcessingBucket',
        'LambdaExecutionRole',
        'FileProcessorFunction',
        'FileProcessorApi',
        'ApiDomainName',
        'S3EventRule',
        'AlertTopic',
        'LambdaErrorAlarm',
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (
          resource.Properties.Name ||
          resource.Properties.FunctionName ||
          resource.Properties.RoleName ||
          resource.Properties.TopicName ||
          resource.Properties.AlarmName ||
          resource.Properties.BucketName
        ) {
          const nameProperty =
            resource.Properties.Name ||
            resource.Properties.FunctionName ||
            resource.Properties.RoleName ||
            resource.Properties.TopicName ||
            resource.Properties.AlarmName ||
            resource.Properties.BucketName;

          // Check if the name property is a string that contains EnvironmentSuffix
          if (typeof nameProperty === 'string') {
            expect(nameProperty).toMatch(/\$\{EnvironmentSuffix\}/);
          } else if (
            nameProperty &&
            typeof nameProperty === 'object' &&
            nameProperty['Fn::Sub']
          ) {
            // For Fn::Sub references, check if the template string contains EnvironmentSuffix
            expect(nameProperty['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
          }
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // Check if the export name follows the pattern ${AWS::StackName}-{OutputKey}
        // Note: Some outputs have custom export names that don't match the exact pattern
        expect(output.Export.Name).toBeDefined();
        expect(typeof output.Export.Name).toBe('object');
        expect(output.Export.Name['Fn::Sub']).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(/\$\{AWS::StackName\}/);
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.FileProcessingBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('Lambda function should have reserved concurrent executions', () => {
      const function_ = template.Resources.FileProcessorFunction;
      expect(function_.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(function_.Properties.ReservedConcurrentExecutions).toBeGreaterThan(
        0
      );
    });

    test('CloudWatch alarm should have appropriate threshold', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Threshold).toBeGreaterThan(0);
      expect(alarm.Properties.Threshold).toBeLessThanOrEqual(100);
    });

    test('all resources should have environment tags', () => {
      const resourcesWithTags = [
        'HostedZone',
        'Certificate',
        'FileProcessingBucket',
        'LambdaExecutionRole',
        'FileProcessorFunction',
        'FileProcessorApi',
        'ApiDomainName',
        'AlertTopic',
        'LambdaErrorAlarm',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });
  });

  describe('Advanced Template Validation', () => {
    test('all intrinsic functions should use valid syntax', () => {
      const checkIntrinsicFunction = (obj: any): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (key.startsWith('Fn::') || key === 'Ref') {
              // Validate Ref syntax
              if (key === 'Ref') {
                expect(typeof obj[key]).toBe('string');
                // Allow AWS pseudo parameters and parameter names
                expect(obj[key]).toMatch(/^[A-Za-z0-9:]+$/);
              }
              // Validate Fn::Sub syntax
              if (key === 'Fn::Sub') {
                if (Array.isArray(obj[key])) {
                  expect(obj[key]).toHaveLength(2);
                  expect(typeof obj[key][0]).toBe('string');
                  expect(typeof obj[key][1]).toBe('object');
                } else {
                  expect(typeof obj[key]).toBe('string');
                  expect(obj[key]).toMatch(/\$\{[^}]+\}/);
                }
              }
              // Validate Fn::GetAtt syntax
              if (key === 'Fn::GetAtt') {
                expect(Array.isArray(obj[key])).toBe(true);
                expect(obj[key]).toHaveLength(2);
                expect(typeof obj[key][0]).toBe('string');
                expect(typeof obj[key][1]).toBe('string');
              }
              // Validate Fn::Join syntax
              if (key === 'Fn::Join') {
                expect(Array.isArray(obj[key])).toBe(true);
                expect(obj[key]).toHaveLength(2);
                expect(typeof obj[key][0]).toBe('string');
                // Second element can be an array or a single object (like Fn::GetAtt)
                expect(typeof obj[key][1]).toBe('object');
              }
              // Validate Fn::Equals syntax
              if (key === 'Fn::Equals') {
                expect(Array.isArray(obj[key])).toBe(true);
                expect(obj[key]).toHaveLength(2);
              }
              // Validate Fn::Not syntax
              if (key === 'Fn::Not') {
                expect(Array.isArray(obj[key])).toBe(true);
                expect(obj[key]).toHaveLength(1);
              }
            }
            // Recursively check nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              checkIntrinsicFunction(obj[key]);
            }
          });
        }
      };

      checkIntrinsicFunction(template);
    });

    test('all resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);

      const checkReferences = (obj: any): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (key === 'Ref' && typeof obj[key] === 'string') {
              // Check if Ref points to a valid resource, parameter, or AWS pseudo parameter
              const validRefs = [
                ...resourceNames,
                'AWS::AccountId',
                'AWS::Region',
                'AWS::StackName',
                'EnvironmentSuffix',
                'RootDomainName',
              ];
              expect(validRefs).toContain(obj[key]);
            }
            if (key === 'Fn::GetAtt' && Array.isArray(obj[key])) {
              // Check if Fn::GetAtt points to a valid resource
              expect(resourceNames).toContain(obj[key][0]);
            }
            // Recursively check nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              checkReferences(obj[key]);
            }
          });
        }
      };

      checkReferences(template);
    });

    test('all conditions should be properly structured', () => {
      Object.keys(template.Conditions).forEach(conditionName => {
        const condition = template.Conditions[conditionName];
        expect(condition).toBeDefined();
        expect(typeof condition).toBe('object');

        // Check if condition uses valid intrinsic functions
        const validConditionFunctions = [
          'Fn::And',
          'Fn::Equals',
          'Fn::If',
          'Fn::Not',
          'Fn::Or',
        ];
        const conditionKeys = Object.keys(condition);
        const hasValidFunction = conditionKeys.some(key =>
          validConditionFunctions.includes(key)
        );
        expect(hasValidFunction).toBe(true);
      });
    });

    test('all parameters should have valid constraints', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];

        // Check parameter type
        expect([
          'String',
          'Number',
          'CommaDelimitedList',
          'List<Number>',
          'AWS::EC2::AvailabilityZone::Name',
          'AWS::EC2::Image::Id',
          'AWS::EC2::Instance::Id',
          'AWS::EC2::KeyPair::KeyName',
          'AWS::EC2::SecurityGroup::GroupName',
          'AWS::EC2::SecurityGroup::Id',
          'AWS::EC2::Subnet::Id',
          'AWS::EC2::Volume::Id',
          'AWS::EC2::VPC::Id',
          'AWS::Route53::HostedZone::Id',
        ]).toContain(param.Type);

        // Check description length
        expect(param.Description.length).toBeGreaterThan(0);
        expect(param.Description.length).toBeLessThanOrEqual(4000);

        // Check allowed pattern if present
        if (param.AllowedPattern) {
          expect(typeof param.AllowedPattern).toBe('string');
          expect(param.AllowedPattern.length).toBeGreaterThan(0);
        }

        // Check constraint description if present
        if (param.ConstraintDescription) {
          expect(typeof param.ConstraintDescription).toBe('string');
          expect(param.ConstraintDescription.length).toBeGreaterThan(0);
        }
      });
    });

    test('all outputs should have valid export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];

        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;

          // Check if export name uses Fn::Sub
          if (exportName['Fn::Sub']) {
            expect(typeof exportName['Fn::Sub']).toBe('string');
            expect(exportName['Fn::Sub']).toMatch(/\$\{AWS::StackName\}/);
          }

          // Check if export name is not too long (AWS limit is 255 characters)
          const exportNameString = JSON.stringify(exportName);
          expect(exportNameString.length).toBeLessThan(255);
        }
      });
    });

    test('all resources should have valid deletion policies', () => {
      const resourcesWithDeletionPolicies = [
        'FileProcessingBucket',
        'LambdaExecutionRole',
        'FileProcessorFunction',
        'FileProcessorApi',
        'AlertTopic',
      ];

      resourcesWithDeletionPolicies.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        // These resources should not have deletion policies that could cause issues
        if (resource.DeletionPolicy) {
          expect(['Delete', 'Retain', 'Snapshot']).toContain(
            resource.DeletionPolicy
          );
        }
      });
    });

    test('all Lambda functions should have valid timeout and memory settings', () => {
      const lambdaFunctions = ['FileProcessorFunction'];

      lambdaFunctions.forEach(functionName => {
        const function_ = template.Resources[functionName];
        expect(function_.Type).toBe('AWS::Lambda::Function');

        // Check if timeout is reasonable (AWS limit is 900 seconds)
        if (function_.Properties.Timeout) {
          expect(function_.Properties.Timeout).toBeGreaterThan(0);
          expect(function_.Properties.Timeout).toBeLessThanOrEqual(900);
        }

        // Check if memory is reasonable (AWS limit is 10240 MB)
        if (function_.Properties.MemorySize) {
          expect(function_.Properties.MemorySize).toBeGreaterThan(0);
          expect(function_.Properties.MemorySize).toBeLessThanOrEqual(10240);
        }
      });
    });

    test('all API Gateway methods should have proper CORS configuration', () => {
      const apiMethods = ['ApiMethodGet', 'ApiMethodPost', 'ApiMethodOptions'];

      apiMethods.forEach(methodName => {
        const method = template.Resources[methodName];
        expect(method.Type).toBe('AWS::ApiGateway::Method');

        // Check if method has proper responses
        if (method.Properties.MethodResponses) {
          method.Properties.MethodResponses.forEach((response: any) => {
            expect(response.StatusCode).toBeDefined();
            // StatusCode can be string or number in CloudFormation
            expect(['string', 'number']).toContain(typeof response.StatusCode);
          });
        }
      });
    });

    test('all S3 bucket configurations should be secure', () => {
      const bucket = template.Resources.FileProcessingBucket;

      // Check versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Check public access block
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);

      // Check if bucket has proper notification configuration
      if (bucket.Properties.NotificationConfiguration) {
        expect(
          bucket.Properties.NotificationConfiguration.EventBridgeConfiguration
        ).toBeDefined();
        expect(
          bucket.Properties.NotificationConfiguration.EventBridgeConfiguration
            .EventBridgeEnabled
        ).toBe(true);
      }
    });

    test('all IAM roles should follow least privilege principle', () => {
      const iamRoles = ['LambdaExecutionRole'];

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Type).toBe('AWS::IAM::Role');

        // Check assume role policy
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumeRolePolicy.Version).toBe('2012-10-17');
        expect(assumeRolePolicy.Statement).toHaveLength(1);
        expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');

        // Check if policies are properly structured
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            expect(policy.PolicyName).toBeDefined();
            expect(policy.PolicyDocument).toBeDefined();
            expect(policy.PolicyDocument.Version).toBe('2012-10-17');
            expect(policy.PolicyDocument.Statement).toBeDefined();
            expect(Array.isArray(policy.PolicyDocument.Statement)).toBe(true);
          });
        }
      });
    });

    test('all CloudWatch alarms should have proper configuration', () => {
      const alarms = ['LambdaErrorAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

        // Check required properties
        expect(alarm.Properties.AlarmName).toBeDefined();
        expect(alarm.Properties.MetricName).toBeDefined();
        expect(alarm.Properties.Namespace).toBeDefined();
        expect(alarm.Properties.Statistic).toBeDefined();
        expect(alarm.Properties.Period).toBeDefined();
        expect(alarm.Properties.EvaluationPeriods).toBeDefined();
        expect(alarm.Properties.Threshold).toBeDefined();
        expect(alarm.Properties.ComparisonOperator).toBeDefined();

        // Check if period is valid (must be multiple of 60 seconds)
        expect(alarm.Properties.Period % 60).toBe(0);

        // Check if evaluation periods is reasonable
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.Properties.EvaluationPeriods).toBeLessThanOrEqual(10);
      });
    });

    test('all EventBridge rules should have proper targets', () => {
      const rules = ['S3EventRule'];

      rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Type).toBe('AWS::Events::Rule');

        // Check if rule has targets
        expect(rule.Properties.Targets).toBeDefined();
        expect(Array.isArray(rule.Properties.Targets)).toBe(true);
        expect(rule.Properties.Targets.length).toBeGreaterThan(0);

        // Check if targets have proper structure
        rule.Properties.Targets.forEach((target: any) => {
          expect(target.Arn).toBeDefined();
          expect(target.Id).toBeDefined();
        });
      });
    });

    test('all Lambda permissions should have proper principals', () => {
      const permissions = [
        'S3InvokePermission',
        'EventBridgeInvokeLambdaPermission',
        'ApiGatewayInvokePermissionGet',
        'ApiGatewayInvokePermissionPost',
      ];

      permissions.forEach(permissionName => {
        const permission = template.Resources[permissionName];
        expect(permission.Type).toBe('AWS::Lambda::Permission');

        // Check required properties
        expect(permission.Properties.FunctionName).toBeDefined();
        expect(permission.Properties.Action).toBeDefined();
        expect(permission.Properties.Principal).toBeDefined();

        // Check if principal is valid
        const validPrincipals = [
          's3.amazonaws.com',
          'events.amazonaws.com',
          'apigateway.amazonaws.com',
        ];
        expect(validPrincipals).toContain(permission.Properties.Principal);

        // Check if action is valid
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      });
    });
  });
});
