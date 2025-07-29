import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
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
        'TAP Stack - Serverless Backend Infrastructure with VPC, Lambda, API Gateway, and DynamoDB'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toHaveLength(3);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have ProjectName parameter', () => {
      const param = template.Parameters.ProjectName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tap-stack');
      expect(param.Description).toBe(
        'Project name for resource naming and tagging'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters and hyphens'
      );
    });

    test('should have DynamoDB capacity parameters', () => {
      const readParam = template.Parameters.DynamoDBReadCapacity;
      const writeParam = template.Parameters.DynamoDBWriteCapacity;

      expect(readParam).toBeDefined();
      expect(readParam.Type).toBe('Number');
      expect(readParam.Default).toBe(5);
      expect(readParam.MinValue).toBe(1);
      expect(readParam.Description).toBe('DynamoDB read capacity units');

      expect(writeParam).toBeDefined();
      expect(writeParam.Type).toBe('Number');
      expect(writeParam.Default).toBe(5);
      expect(writeParam.MinValue).toBe(1);
      expect(writeParam.Description).toBe('DynamoDB write capacity units');
    });

    test('should have Lambda configuration parameters', () => {
      const memoryParam = template.Parameters.LambdaMemorySize;
      const timeoutParam = template.Parameters.LambdaTimeout;

      expect(memoryParam).toBeDefined();
      expect(memoryParam.Type).toBe('Number');
      expect(memoryParam.Default).toBe(256);
      expect(memoryParam.AllowedValues).toContain(128);
      expect(memoryParam.AllowedValues).toContain(256);
      expect(memoryParam.AllowedValues).toContain(512);
      expect(memoryParam.Description).toBe('Lambda function memory size in MB');

      expect(timeoutParam).toBeDefined();
      expect(timeoutParam.Type).toBe('Number');
      expect(timeoutParam.Default).toBe(30);
      expect(timeoutParam.MinValue).toBe(1);
      expect(timeoutParam.MaxValue).toBe(900);
      expect(timeoutParam.Description).toBe(
        'Lambda function timeout in seconds'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Sub': '${AWS::Region}a',
      });

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Sub': '${AWS::Region}b',
      });
    });

    test('should have private route tables', () => {
      const routeTable1 = template.Resources.PrivateRouteTable1;
      const routeTable2 = template.Resources.PrivateRouteTable2;

      expect(routeTable1).toBeDefined();
      expect(routeTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable2).toBeDefined();
      expect(routeTable2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have subnet route table associations', () => {
      const association1 =
        template.Resources.PrivateSubnet1RouteTableAssociation;
      const association2 =
        template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(association1).toBeDefined();
      expect(association1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association2).toBeDefined();
      expect(association2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have DynamoDB VPC endpoint', () => {
      const endpoint = template.Resources.DynamoDBVPCEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb',
      });
      expect(endpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(endpoint.Properties.RouteTableIds).toHaveLength(2);
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for Lambda function'
      );
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupEgress[0].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupEgress[0].ToPort).toBe(443);
    });

    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('DynamoDBAccess');
    });

    test('should have Lambda function', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      const api = template.Resources.ApiGateway;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.Policy).toBeDefined();
    });

    test('should have API Gateway resource policy for VPC access', () => {
      const api = template.Resources.ApiGateway;
      const policy = api.Properties.Policy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(1);
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(
        policy.Statement[0].Condition.StringEquals['aws:SourceVpc']
      ).toBeDefined();
    });

    test('should have API Gateway resource', () => {
      const resource = template.Resources.ApiGatewayResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('api');
    });

    test('should have API Gateway methods', () => {
      const getMethod = template.Resources.ApiGatewayGetMethod;
      const postMethod = template.Resources.ApiGatewayPostMethod;
      const optionsMethod = template.Resources.ApiGatewayOptionsMethod;

      expect(getMethod).toBeDefined();
      expect(getMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(getMethod.Properties.HttpMethod).toBe('GET');

      expect(postMethod).toBeDefined();
      expect(postMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(postMethod.Properties.HttpMethod).toBe('POST');

      expect(optionsMethod).toBeDefined();
      expect(optionsMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(optionsMethod.Properties.HttpMethod).toBe('OPTIONS');
    });

    test('should have API Gateway deployment', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have API Gateway stage with logging', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage).toBeDefined();
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings).toBeDefined();
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });

    test('should have Lambda permissions for API Gateway', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDB table with correct configuration', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have correct DynamoDB table properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PROVISIONED');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct DynamoDB attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('should have correct DynamoDB key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have provisioned throughput configuration', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const throughput = table.Properties.ProvisionedThroughput;

      expect(throughput).toBeDefined();
      expect(throughput.ReadCapacityUnits).toEqual({
        Ref: 'DynamoDBReadCapacity',
      });
      expect(throughput.WriteCapacityUnits).toEqual({
        Ref: 'DynamoDBWriteCapacity',
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have API Gateway 4xx alarm', () => {
      const alarm = template.Resources.ApiGateway4xxAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
    });

    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across all resources', () => {
      const resourcesWithTags = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'LambdaSecurityGroup',
        'LambdaExecutionRole',
        'DynamoDBVPCEndpoint',
        'LambdaFunction',
        'LambdaErrorAlarm',
        'TurnAroundPromptTable',
        'ApiGateway4xxAlarm',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const environmentTag = tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');

          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have API Gateway URL output', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output).toBeDefined();
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/api',
      });
      expect(output.Export).toBeDefined();
    });

    test('should have DynamoDB table outputs', () => {
      const nameOutput = template.Outputs.TurnAroundPromptTableName;
      const arnOutput = template.Outputs.TurnAroundPromptTableArn;

      expect(nameOutput).toBeDefined();
      expect(nameOutput.Description).toBe('Name of the DynamoDB table');
      expect(nameOutput.Value).toEqual({ Ref: 'TurnAroundPromptTable' });

      expect(arnOutput).toBeDefined();
      expect(arnOutput.Description).toBe('ARN of the DynamoDB table');
      expect(arnOutput.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
    });

    test('should have Lambda function outputs', () => {
      const nameOutput = template.Outputs.LambdaFunctionName;
      const arnOutput = template.Outputs.LambdaFunctionArn;

      expect(nameOutput).toBeDefined();
      expect(nameOutput.Description).toBe('Lambda function name');
      expect(nameOutput.Value).toEqual({ Ref: 'LambdaFunction' });

      expect(arnOutput).toBeDefined();
      expect(arnOutput.Description).toBe('Lambda function ARN');
      expect(arnOutput.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn'],
      });
    });

    test('should have environment and stack outputs', () => {
      const envOutput = template.Outputs.EnvironmentSuffix;
      const stackOutput = template.Outputs.StackName;

      expect(envOutput).toBeDefined();
      expect(envOutput.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(envOutput.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      expect(stackOutput).toBeDefined();
      expect(stackOutput.Description).toBe('Name of this CloudFormation stack');
      expect(stackOutput.Value).toEqual({ Ref: 'AWS::StackName' });
    });
  });

  describe('Security Validation', () => {
    test('should have proper IAM role permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies[0];

      expect(dynamoPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:GetItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:PutItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:UpdateItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:DeleteItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:Query'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:Scan'
      );
    });

    test('should have VPC-only API Gateway policy', () => {
      const api = template.Resources.ApiGateway;
      const policy = api.Properties.Policy;

      expect(
        policy.Statement[0].Condition.StringEquals['aws:SourceVpc']
      ).toEqual({ Ref: 'VPC' });
    });

    test('should have secure Lambda VPC configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      const vpcConfig = lambda.Properties.VpcConfig;

      expect(vpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(vpcConfig.SecurityGroupIds[0]).toEqual({
        Ref: 'LambdaSecurityGroup',
      });
      expect(vpcConfig.SubnetIds).toHaveLength(2);
    });
  });

  describe('Production Readiness', () => {
    test('should have deletion policies for complete cleanup', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have monitoring and alerting', () => {
      const lambdaAlarm = template.Resources.LambdaErrorAlarm;
      const api4xxAlarm = template.Resources.ApiGateway4xxAlarm;

      expect(lambdaAlarm).toBeDefined();
      expect(api4xxAlarm).toBeDefined();
    });

    test('should use region-agnostic configurations', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      const endpoint = template.Resources.DynamoDBVPCEndpoint;

      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Sub': '${AWS::Region}a',
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Sub': '${AWS::Region}b',
      });
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb',
      });
    });
  });

  describe('Template Validation', () => {
    test('should be valid JSON', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
    });

    test('should have no circular references', () => {
      const visited = new Set();
      const checkCircular = (obj: any, path: string[] = []): void => {
        if (obj && typeof obj === 'object') {
          if (visited.has(obj)) {
            throw new Error(
              `Circular reference detected at path: ${path.join('.')}`
            );
          }
          visited.add(obj);

          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              checkCircular(obj[key], [...path, key]);
            }
          }

          visited.delete(obj);
        }
      };

      expect(() => checkCircular(template)).not.toThrow();
    });

    test('should have consistent resource naming', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        // Resource names should be PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });
});
