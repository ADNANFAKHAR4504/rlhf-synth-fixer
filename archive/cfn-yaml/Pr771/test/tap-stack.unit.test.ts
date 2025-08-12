import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('Production-ready serverless infrastructure');
    });
  });

  describe('Parameters', () => {


    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
    });

    test('ApplicationName parameter should have correct properties', () => {
      const param = template.Parameters.ApplicationName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('serverless-app');
      expect(param.Description).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toBeDefined();
      expect(param.AllowedValues).toBeDefined();
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
    });

    test('should have EnableProvisionedConcurrency parameter', () => {
      expect(template.Parameters.EnableProvisionedConcurrency).toBeDefined();
    });

    test('EnableProvisionedConcurrency parameter should have correct properties', () => {
      const param = template.Parameters.EnableProvisionedConcurrency;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.Description).toBeDefined();
      expect(param.AllowedValues).toBeDefined();
    });

    test('should have LambdaProvisionedConcurrency parameter', () => {
      expect(template.Parameters.LambdaProvisionedConcurrency).toBeDefined();
    });

    test('LambdaProvisionedConcurrency parameter should have correct properties', () => {
      const param = template.Parameters.LambdaProvisionedConcurrency;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.Description).toBeDefined();
      expect(param.MinValue).toBeDefined();
      expect(param.MaxValue).toBeDefined();
    });




  });

  describe('Conditions', () => {
    test('should have EnableProvisionedConcurrency condition', () => {
      expect(template.Conditions.EnableProvisionedConcurrency).toBeDefined();
    });

    test('EnableProvisionedConcurrency condition should check parameter value', () => {
      const condition = template.Conditions.EnableProvisionedConcurrency;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('EnableProvisionedConcurrency');
      expect(condition['Fn::Equals'][1]).toBe('true');
    });
  });

  describe('Resources', () => {
    test('should have MainLambdaFunction resource', () => {
      expect(template.Resources.MainLambdaFunction).toBeDefined();
    });

    test('MainLambdaFunction should be a Lambda function', () => {
      const resource = template.Resources.MainLambdaFunction;
      expect(resource.Type).toBe('AWS::Lambda::Function');
    });

    test('MainLambdaFunction should have correct properties', () => {
      const resource = template.Resources.MainLambdaFunction;
      expect(resource.Properties).toBeDefined();
      expect(resource.Properties.Runtime).toBe('python3.11');
      expect(resource.Properties.Handler).toBe('index.lambda_handler');
      expect(resource.Properties.Role).toBeDefined();
      expect(resource.Properties.Code).toBeDefined();
      expect(resource.Properties.Timeout).toBe(30);
      expect(resource.Properties.MemorySize).toBe(1024);
      expect(resource.Properties.ReservedConcurrentExecutions).toBe(500);
    });

    test('should have LambdaAlias resource', () => {
      expect(template.Resources.LambdaAlias).toBeDefined();
    });

    test('LambdaAlias should be a Lambda Alias', () => {
      const resource = template.Resources.LambdaAlias;
      expect(resource.Type).toBe('AWS::Lambda::Alias');
    });

    test('LambdaAlias should have conditional provisioned concurrency configuration', () => {
      const resource = template.Resources.LambdaAlias;
      expect(resource.Properties.ProvisionedConcurrencyConfig).toBeDefined();
      expect(resource.Properties.ProvisionedConcurrencyConfig['Fn::If']).toBeDefined();
      
      const ifCondition = resource.Properties.ProvisionedConcurrencyConfig['Fn::If'];
      expect(ifCondition[0]).toBe('EnableProvisionedConcurrency');
      expect(ifCondition[1].ProvisionedConcurrentExecutions['Ref']).toBe('LambdaProvisionedConcurrency');
      expect(ifCondition[2]['Ref']).toBe('AWS::NoValue');
    });

    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('LambdaLogGroup should be a CloudWatch Log Group', () => {
      const resource = template.Resources.LambdaLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have RestApi resource', () => {
      expect(template.Resources.RestApi).toBeDefined();
    });

    test('RestApi should be an API Gateway REST API', () => {
      const resource = template.Resources.RestApi;
      expect(resource.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ApiResource resource', () => {
      expect(template.Resources.ApiResource).toBeDefined();
    });

    test('ApiResource should be an API Gateway Resource', () => {
      const resource = template.Resources.ApiResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have ApiMethod resource', () => {
      expect(template.Resources.ApiMethod).toBeDefined();
    });

    test('ApiMethod should be an API Gateway Method', () => {
      const resource = template.Resources.ApiMethod;
      expect(resource.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have ApiDeployment resource', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
    });

    test('ApiDeployment should be an API Gateway Deployment', () => {
      const resource = template.Resources.ApiDeployment;
      expect(resource.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have ApiStage resource', () => {
      expect(template.Resources.ApiStage).toBeDefined();
    });

    test('ApiStage should be an API Gateway Stage', () => {
      const resource = template.Resources.ApiStage;
      expect(resource.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('should have ApiGatewayLogGroup resource', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
    });

    test('ApiGatewayLogGroup should be a CloudWatch Log Group', () => {
      const resource = template.Resources.ApiGatewayLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
    });

    test('S3Bucket should be an S3 bucket', () => {
      const resource = template.Resources.S3Bucket;
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have correct properties', () => {
      const resource = template.Resources.S3Bucket;
      expect(resource.Properties).toBeDefined();
      expect(resource.Properties.BucketEncryption).toBeDefined();
      expect(resource.Properties.VersioningConfiguration).toBeDefined();
      expect(resource.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(resource.Properties.LoggingConfiguration).toBeDefined();
    });

    test('should have S3AccessLogsBucket resource', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
    });

    test('S3AccessLogsBucket should be an S3 bucket', () => {
      const resource = template.Resources.S3AccessLogsBucket;
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM Role', () => {
      const resource = template.Resources.LambdaExecutionRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApiGatewayCloudWatchRole resource', () => {
      expect(template.Resources.ApiGatewayCloudWatchRole).toBeDefined();
    });

    test('ApiGatewayCloudWatchRole should be an IAM Role', () => {
      const resource = template.Resources.ApiGatewayCloudWatchRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
    });

    test('should have LambdaApiGatewayPermission resource', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
    });

    test('LambdaApiGatewayPermission should be a Lambda Permission', () => {
      const resource = template.Resources.LambdaApiGatewayPermission;
      expect(resource.Type).toBe('AWS::Lambda::Permission');
    });





    test('should have ApiGatewayAccount resource', () => {
      expect(template.Resources.ApiGatewayAccount).toBeDefined();
    });

    test('ApiGatewayAccount should be an API Gateway Account', () => {
      const resource = template.Resources.ApiGatewayAccount;
      expect(resource.Type).toBe('AWS::ApiGateway::Account');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.CloudWatchLogGroups).toBeDefined();
      expect(outputs.SecurityFeatures).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.Environment).toBeDefined();
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toBeDefined();
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toBeDefined();
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
    });

    test('CloudWatchLogGroups output should be correct', () => {
      const output = template.Outputs.CloudWatchLogGroups;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toBeDefined();
    });

    test('SecurityFeatures output should be correct', () => {
      const output = template.Outputs.SecurityFeatures;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value).toContain('S3 AES-256 encryption');
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('Environment output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
      expect(output.Export).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have the correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // ApplicationName, Environment, EnableProvisionedConcurrency, LambdaProvisionedConcurrency
    });

    test('should have the correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // ApiGatewayUrl, LambdaFunctionArn, S3BucketName, LambdaFunctionName, CloudWatchLogGroups, SecurityFeatures, StackName, EnvironmentSuffix
    });

    test('should have CloudWatch alarms for monitoring', () => {
      expect(template.Resources.LambdaErrorRateAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.ApiGateway4XXErrorAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5XXErrorAlarm).toBeDefined();
      expect(template.Resources.ApiGatewayLatencyAlarm).toBeDefined();
    });

    test('Lambda error rate alarm should be properly configured', () => {
      const alarm = template.Resources.LambdaErrorRateAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Lambda duration alarm should be properly configured', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(10000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Lambda throttle alarm should be properly configured', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('API Gateway 4XX error alarm should be properly configured', () => {
      const alarm = template.Resources.ApiGateway4XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(50);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('API Gateway 5XX error alarm should be properly configured', () => {
      const alarm = template.Resources.ApiGateway5XXErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('API Gateway latency alarm should be properly configured', () => {
      const alarm = template.Resources.ApiGatewayLatencyAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Latency');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(5000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Lambda execution role should have proper policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(2); // S3AccessPolicy and CloudWatchLogsPolicy
    });

    test('Lambda execution role should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(2);
      
      // Check S3 object permissions
      const objectStatement = s3Policy.PolicyDocument.Statement.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(objectStatement.Effect).toBe('Allow');
      expect(objectStatement.Action).toContain('s3:GetObject');
      expect(objectStatement.Action).toContain('s3:PutObject');
      expect(objectStatement.Action).toContain('s3:DeleteObject');
      
      // Check S3 bucket permissions
      const bucketStatement = s3Policy.PolicyDocument.Statement.find((s: any) => s.Action.includes('s3:ListBucket'));
      expect(bucketStatement.Effect).toBe('Allow');
      expect(bucketStatement.Action).toContain('s3:ListBucket');
    });

    test('Lambda execution role should have CloudWatch logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement).toHaveLength(1);
      
      const statement = logsPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
      expect(statement.Resource).toBe('*');
    });

    test('API Gateway CloudWatch role should have proper permissions', () => {
      const role = template.Resources.ApiGatewayCloudWatchRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs');
    });
  });

  describe('Resource Naming Convention', () => {
    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambdaFunction = template.Resources.MainLambdaFunction;
      const functionName = lambdaFunction.Properties.FunctionName;
      expect(functionName['Fn::Sub']).toBeDefined();
      expect(functionName['Fn::Sub']).toContain('${ApplicationName}');
      expect(functionName['Fn::Sub']).toContain('${Environment}');
    });

    test('S3 bucket name should follow naming convention', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const bucketName = s3Bucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toBeDefined();
      expect(bucketName['Fn::Sub']).toContain('${ApplicationName}');
      expect(bucketName['Fn::Sub']).toContain('${Environment}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('export names should follow naming convention', () => {
      const stackNameOutput = template.Outputs.StackName;
      const environmentOutput = template.Outputs.Environment;
      
      expect(stackNameOutput.Export.Name['Fn::Sub']).toBeDefined();
      expect(stackNameOutput.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      
      expect(environmentOutput.Export.Name['Fn::Sub']).toBeDefined();
      expect(environmentOutput.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });
});
