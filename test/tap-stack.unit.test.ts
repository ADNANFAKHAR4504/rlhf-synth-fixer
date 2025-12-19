import fs from 'fs';
import path from 'path';


interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Conditions: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

interface Parameter {
  Type: string;
  Default?: string | number;
  Description?: string;
  AllowedPattern?: string;
  AllowedValues?: string[];
  MinLength?: number;
  MaxLength?: number;
}

interface Resource {
  Type: string;
  Properties: Record<string, any>;
  DependsOn?: string | string[];
  Condition?: string;
}

interface Output {
  Description: string;
  Value: any;
  Export?: {
    Name: any;
  };
}

interface PolicyStatement {
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
  Principal?: any;
  Condition?: Record<string, any>;
}

interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

const environmentSuffix: string = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Lambda CloudFormation Template', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
 
    const templatePath: string = path.join(__dirname, '../lib/TapStack.json');
    const templateContent: string = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent) as CloudFormationTemplate;
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure Lambda infrastructure with S3 log export');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have VpcId parameter with correct defaults', () => {
      const param: Parameter = template.Parameters.VpcId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('vpc-002dd1e7eb944d35a');
      expect(param.AllowedPattern).toBe('^vpc-[0-9a-f]{8,17}$');

    });

    test('should have S3BucketName parameter with correct defaults', () => {
      const param: Parameter = template.Parameters.S3BucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('lambda-deployments-718240086340');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(63);
    });

    test('should have LambdaFunctionName parameter', () => {
      const param: Parameter = template.Parameters.LambdaFunctionName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecureLambdaFunction');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-_]+$');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
    });

    test('should have Environment parameter with Development default', () => {
      const param: Parameter = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Development');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('should have SubnetIds parameter', () => {
      const param: Parameter = template.Parameters.SubnetIds;
      expect(param).toBeDefined();
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have HasSubnetIds condition', () => {
      const condition: any = template.Conditions.HasSubnetIds;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });

    test('should have BucketExists condition', () => {
      const condition: any = template.Conditions.BucketExists;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have LambdaFunction resource', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('LambdaFunction should have correct properties', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
    });

    test('LambdaFunction should have Role reference', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('LambdaFunction should have conditional VPC config', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig['Fn::If']).toBeDefined();
      expect(lambda.Properties.VpcConfig['Fn::If'][0]).toBe('HasSubnetIds');
    });

    test('LambdaFunction should have environment variables', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      const envVars: Record<string, any> = lambda.Properties.Environment.Variables;
      expect(envVars.LOG_LEVEL).toBe('INFO');
      expect(envVars.S3_BUCKET).toEqual({ Ref: 'S3BucketName' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('LambdaFunction should have correct tags', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      const tags: Array<{ Key: string; Value: any }> = lambda.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
      expect(tags).toContainEqual({
        Key: 'SecurityCompliance',
        Value: 'Required'
      });
    });
  });

  describe('Log Export Lambda Resources', () => {
    test('should have LogExportLambda resource', () => {
      expect(template.Resources.LogExportLambda).toBeDefined();
      expect(template.Resources.LogExportLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('LogExportLambda should have correct configuration', () => {
      const logExport: Resource = template.Resources.LogExportLambda;
      expect(logExport.Properties.Runtime).toBe('python3.11');
      expect(logExport.Properties.Handler).toBe('index.lambda_handler');
      expect(logExport.Properties.Timeout).toBe(300);
      expect(logExport.Properties.MemorySize).toBe(512);
    });

    test('LogExportLambda should have correct Role reference', () => {
      const logExport: Resource = template.Resources.LogExportLambda;
      expect(logExport.Properties.Role).toEqual({ 'Fn::GetAtt': ['LogExportLambdaRole', 'Arn'] });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('LambdaLogGroup should have correct properties', () => {
      const logGroup: Resource = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/lambda/${LambdaFunctionName}' });
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have VPCFlowLogGroup resource', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have LogExportLambdaLogGroup resource', () => {
      expect(template.Resources.LogExportLambdaLogGroup).toBeDefined();
      expect(template.Resources.LogExportLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LogExportLambdaLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role: Resource = template.Resources.LambdaExecutionRole;
      const assumePolicy: PolicyDocument = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have regional condition', () => {
      const role: Resource = template.Resources.LambdaExecutionRole;
      const condition: Record<string, any> = role.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
      expect(condition.StringEquals['aws:RequestedRegion']).toBe('us-east-1');
    });

    test('LambdaExecutionRole should have VPC access policy', () => {
      const role: Resource = template.Resources.LambdaExecutionRole;
      const policies: string[] = role.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('LambdaExecutionRole should have minimal logging permissions', () => {
      const role: Resource = template.Resources.LambdaExecutionRole;
      const policy: { PolicyName: string; PolicyDocument: PolicyDocument } = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('LambdaLoggingPolicy');
      
      const statements: PolicyStatement[] = policy.PolicyDocument.Statement;
      const logStatement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => 
        Array.isArray(s.Action) ? s.Action.includes('logs:CreateLogStream') : s.Action === 'logs:CreateLogStream'
      );
      expect(logStatement?.Resource).toEqual({ 'Fn::Sub': '${LambdaLogGroup.Arn}:*' });
    });

    test('should have LogExportLambdaRole resource', () => {
      expect(template.Resources.LogExportLambdaRole).toBeDefined();
      expect(template.Resources.LogExportLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('LogExportLambdaRole should have export permissions', () => {
      const role: Resource = template.Resources.LogExportLambdaRole;
      const policy: { PolicyName: string; PolicyDocument: PolicyDocument } = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('LogExportPolicy');
      
      const statements: PolicyStatement[] = policy.PolicyDocument.Statement;
      const exportStatement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => 
        Array.isArray(s.Action) ? s.Action.includes('logs:CreateExportTask') : s.Action === 'logs:CreateExportTask'
      );
      expect(exportStatement).toBeDefined();
    });

    test('should have VPCFlowLogRole resource', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Security Group', () => {
    test('should have LambdaSecurityGroup resource', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('LambdaSecurityGroup should reference VPC', () => {
      const sg: Resource = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VpcId' });
    });

    test('LambdaSecurityGroup should have restrictive egress rules', () => {
      const sg: Resource = template.Resources.LambdaSecurityGroup;
      const egress: Array<{ IpProtocol: string; FromPort: number; ToPort: number; Description: string }> = sg.Properties.SecurityGroupEgress;
      
      expect(egress).toHaveLength(3);
      expect(egress[0].IpProtocol).toBe('tcp');
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].Description).toBe('HTTPS for AWS API calls');
    });

    test('LambdaSecurityGroup should have correct tags', () => {
      const sg: Resource = template.Resources.LambdaSecurityGroup;
      const tags: Array<{ Key: string; Value: any }> = sg.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'Environment' }
      });
    });
  });

  describe('EventBridge and Permissions', () => {
    test('should have LogExportScheduleRule resource', () => {
      expect(template.Resources.LogExportScheduleRule).toBeDefined();
      expect(template.Resources.LogExportScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    test('LogExportScheduleRule should have daily cron schedule', () => {
      const rule: Resource = template.Resources.LogExportScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 1 * * ? *)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('LogExportScheduleRule should target LogExportLambda', () => {
      const rule: Resource = template.Resources.LogExportScheduleRule;
      const target: { Arn: any; Id: string } = rule.Properties.Targets[0];
      expect(target.Arn).toEqual({ 'Fn::GetAtt': ['LogExportLambda', 'Arn'] });
      expect(target.Id).toBe('LogExportTarget');
    });

    test('should have LogExportLambdaPermission resource', () => {
      expect(template.Resources.LogExportLambdaPermission).toBeDefined();
      expect(template.Resources.LogExportLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('LogExportLambdaPermission should allow EventBridge invocation', () => {
      const permission: Resource = template.Resources.LogExportLambdaPermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPCFlowLogs resource', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLogs should have correct configuration', () => {
      const flowLog: Resource = template.Resources.VPCFlowLogs;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VpcId' });
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('CloudWatch Alarm', () => {
    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm: Resource = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('LambdaErrorAlarm should reference Lambda function', () => {
      const alarm: Resource = template.Resources.LambdaErrorAlarm;
      const dimensions: Array<{ Name: string; Value: any }> = alarm.Properties.Dimensions;
      expect(dimensions[0].Name).toBe('FunctionName');
      expect(dimensions[0].Value).toEqual({ Ref: 'LambdaFunction' });
    });
  });

  describe('S3 Bucket Policy', () => {
    test('should have S3BucketPolicy resource', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
      expect(template.Resources.S3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3BucketPolicy should reference correct bucket', () => {
      const policy: Resource = template.Resources.S3BucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'S3BucketName' });
    });

    test('S3BucketPolicy should have BucketExists condition', () => {
      const policy: Resource = template.Resources.S3BucketPolicy;
      expect(policy.Condition).toBe('BucketExists');
    });

    test('S3BucketPolicy should allow CloudWatch Logs service', () => {
      const policy: Resource = template.Resources.S3BucketPolicy;
      const statements: PolicyStatement[] = policy.Properties.PolicyDocument.Statement;
      const cwStatement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => (s as any).Sid === 'AllowCloudWatchLogsExport');
      expect(cwStatement?.Principal.Service).toBe('logs.amazonaws.com');
      expect(cwStatement?.Action).toBe('s3:PutObject');
    });

    test('S3BucketPolicy should allow log export Lambda', () => {
      const policy: Resource = template.Resources.S3BucketPolicy;
      const statements: PolicyStatement[] = policy.Properties.PolicyDocument.Statement;
      const lambdaStatement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => (s as any).Sid === 'AllowLogExportLambda');
      expect(lambdaStatement?.Principal.AWS).toEqual({ 'Fn::GetAtt': ['LogExportLambdaRole', 'Arn'] });
    });

    test('S3BucketPolicy should have separate statements for different actions', () => {
      const policy: Resource = template.Resources.S3BucketPolicy;
      const statements: PolicyStatement[] = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThanOrEqual(3);
      
      const putObjectStatement = statements.find((s: PolicyStatement) => (s as any).Sid === 'AllowCloudWatchLogsExport');
      const getBucketAclStatement = statements.find((s: PolicyStatement) => (s as any).Sid === 'AllowCloudWatchLogsGetBucketAcl');
      
      expect(putObjectStatement).toBeDefined();
      expect(getBucketAclStatement).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs: string[] = [
        'LambdaFunctionArn',
        'LambdaFunctionName', 
        'LogGroupName',
        'SecurityGroupId',
        'LogExportLambdaArn',
        'IAMRoleArn'
      ];

      expectedOutputs.forEach((outputName: string) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output: Output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the created Lambda function');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
    });

    test('SecurityGroupId output should be correct', () => {
      const output: Output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe('Security Group ID for the Lambda function');
      expect(output.Value).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('outputs should have export names', () => {
      Object.values(template.Outputs).forEach((output: Output) => {
        expect(output.Export).toBeDefined();
        expect(output.Export?.Name).toEqual(expect.objectContaining({ 'Fn::Sub': expect.any(String) }));
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

    test('should have correct number of resources', () => {
      const expectedResourceCount: number = 15; // All Lambda infrastructure resources (including LogsBucket)
      const resourceCount: number = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResourceCount);
    });

    test('should have correct number of outputs', () => {
      const outputCount: number = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('should have correct number of parameters', () => {
      const paramCount: number = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(5);
    });

    test('should have correct number of conditions', () => {
      const conditionCount: number = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(2);
    });
  });

  describe('Security Compliance', () => {
    test('IAM roles should not have explicit names', () => {
      const roles: string[] = ['LambdaExecutionRole', 'LogExportLambdaRole', 'VPCFlowLogRole'];
      roles.forEach((roleName: string) => {
        const role: Resource = template.Resources[roleName];
        expect(role.Properties.RoleName).toBeUndefined();
      });
    });

    test('Security group should not have explicit name', () => {
      const sg: Resource = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.GroupName).toBeUndefined();
    });

    test('IAM policies should follow least privilege principle', () => {
      const lambdaRole: Resource = template.Resources.LambdaExecutionRole;
      const policy: { PolicyName: string; PolicyDocument: PolicyDocument } = lambdaRole.Properties.Policies[0];
      const statements: PolicyStatement[] = policy.PolicyDocument.Statement;
      
      // Check that log permissions are scoped to specific log group
      const logStatement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => 
        Array.isArray(s.Action) ? s.Action.includes('logs:CreateLogStream') : s.Action === 'logs:CreateLogStream'
      );
      expect(JSON.stringify(logStatement?.Resource)).toContain('LambdaLogGroup.Arn');
      
      // Check that S3 permissions are scoped to specific prefix
      const s3Statement: PolicyStatement | undefined = statements.find((s: PolicyStatement) => 
        Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject'
      );
      expect(JSON.stringify(s3Statement?.Resource)).toContain('lambda-logs/${LambdaFunctionName}/*');
    });

    test('all resources should have appropriate tags', () => {
      const taggedResources: string[] = ['LambdaFunction', 'LogExportLambda', 'LambdaSecurityGroup', 'VPCFlowLogs'];
      taggedResources.forEach((resourceName: string) => {
        const resource: Resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
      });
    });
  });

  describe('Intrinsic Functions', () => {
    test('should use Ref function for parameter references', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.FunctionName).toEqual({ Ref: 'LambdaFunctionName' });
      
      const sg: Resource = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VpcId' });
    });

    test('should use Fn::GetAtt for ARN references', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      
      const permission: Resource = template.Resources.LogExportLambdaPermission;
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['LogExportScheduleRule', 'Arn'] });
    });

    test('should use Fn::Sub for string substitution', () => {
      const logGroup: Resource = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/lambda/${LambdaFunctionName}' });
      
      const outputs: Record<string, Output> = template.Outputs;
      Object.values(outputs).forEach((output: Output) => {
        expect(output.Export?.Name).toEqual(expect.objectContaining({ 'Fn::Sub': expect.any(String) }));
      });
    });

    test('should use Fn::If for conditional resources', () => {
      const lambda: Resource = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig['Fn::If']).toBeDefined();
      expect(lambda.Properties.VpcConfig['Fn::If'][0]).toBe('HasSubnetIds');
    });
  });
});