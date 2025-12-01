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
      expect(typeof template.Description).toBe('string');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('IsProduction condition should check for prod environment', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition['Fn::Equals']).toBeDefined();
    });
  });

  describe('Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.AlbSecurityGroup).toBeDefined();
    });

    test('should have DynamoDB VPC endpoint', () => {
      expect(template.Resources.DynamoDBEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });
  });

  describe('Storage Resources', () => {
    test('should have PaymentTransactionsTable', () => {
      expect(template.Resources.PaymentTransactionsTable).toBeDefined();
      expect(template.Resources.PaymentTransactionsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('PaymentTransactionsTable should have correct key schema', () => {
      const table = template.Resources.PaymentTransactionsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('PaymentTransactionsTable should have GSIs', () => {
      const table = template.Resources.PaymentTransactionsTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toHaveLength(2);
      expect(gsis[0].IndexName).toBe('customer-index');
      expect(gsis[1].IndexName).toBe('status-index');
    });

    test('PaymentTransactionsTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.PaymentTransactionsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('PaymentTransactionsTable should have deletion policies', () => {
      const table = template.Resources.PaymentTransactionsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Compute Resources', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ValidationFunction', () => {
      expect(template.Resources.ValidationFunction).toBeDefined();
      expect(template.Resources.ValidationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have ProcessingFunction', () => {
      expect(template.Resources.ProcessingFunction).toBeDefined();
      expect(template.Resources.ProcessingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should use Node.js 22.x runtime', () => {
      expect(template.Resources.ValidationFunction.Properties.Runtime).toBe('nodejs22.x');
      expect(template.Resources.ProcessingFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda functions should have 512 MB memory', () => {
      expect(template.Resources.ValidationFunction.Properties.MemorySize).toBe(512);
      expect(template.Resources.ProcessingFunction.Properties.MemorySize).toBe(512);
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have target groups', () => {
      expect(template.Resources.ValidationTargetGroup).toBeDefined();
      expect(template.Resources.ProcessingTargetGroup).toBeDefined();
    });

    test('should have Step Functions state machine', () => {
      expect(template.Resources.PaymentStateMachine).toBeDefined();
      expect(template.Resources.PaymentStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS alarm topic', () => {
      expect(template.Resources.AlarmTopic).toBeDefined();
      expect(template.Resources.AlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ValidationFunctionErrorAlarm).toBeDefined();
      expect(template.Resources.ProcessingFunctionErrorAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.StateMachineFailureAlarm).toBeDefined();
      expect(template.Resources.ValidationFunctionDurationAlarm).toBeDefined();
    });

    test('CloudWatch alarms should have correct type', () => {
      expect(template.Resources.ValidationFunctionErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.ProcessingFunctionErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StackName',
        'EnvironmentName',
        'VpcId',
        'AlbDnsName',
        'StateMachineArn',
        'PaymentTableName',
        'ValidationFunctionArn',
        'ProcessingFunctionArn',
        'AlarmTopicArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentSuffix in naming', () => {
      const vpcTags = template.Resources.VPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DynamoDB table name should include environment', () => {
      const tableName = template.Resources.PaymentTransactionsTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Lambda function names should include environment', () => {
      const validationName = template.Resources.ValidationFunction.Properties.FunctionName;
      const processingName = template.Resources.ProcessingFunction.Properties.FunctionName;
      expect(validationName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(processingName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Configuration', () => {
    test('Lambda execution role should have DynamoDB access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
    });

    test('Lambda execution role should have CloudWatch logs access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      expect(logsPolicy).toBeDefined();
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.AlbSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });
});
