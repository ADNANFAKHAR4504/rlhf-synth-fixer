import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Serverless CRUD API', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the template for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for serverless API', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless RESTful API');
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toBe(
        'Environment name for resource tagging and naming'
      );
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.MyVPC).toBeDefined();
      expect(template.Resources.MyVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.MyVPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();

      const publicSubnet = template.Resources.PublicSubnet.Properties;
      const privateSubnet = template.Resources.PrivateSubnet.Properties;

      expect(publicSubnet.CidrBlock).toBe('10.0.1.0/24');
      expect(privateSubnet.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have internet gateway and NAT gateway', () => {
      expect(template.Resources.MyInternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
    });

    test('should have proper routing tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should have MyCrudTable resource', () => {
      expect(template.Resources.MyCrudTable).toBeDefined();
      expect(template.Resources.MyCrudTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('MyCrudTable should have correct properties', () => {
      const table = template.Resources.MyCrudTable.Properties;
      expect(table.TableName).toEqual({
        'Fn::Sub': 'MyCrudTable${Environment}',
      });
      expect(table.BillingMode).toBe('ON_DEMAND');
      expect(table.DeletionProtectionEnabled).toBe(false);
      expect(
        table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('MyCrudTable should have correct schema', () => {
      const table = template.Resources.MyCrudTable.Properties;

      expect(table.AttributeDefinitions).toHaveLength(1);
      expect(table.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.AttributeDefinitions[0].AttributeType).toBe('S');

      expect(table.KeySchema).toHaveLength(1);
      expect(table.KeySchema[0].AttributeName).toBe('id');
      expect(table.KeySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'CreateItemFunction',
      'GetItemFunction',
      'UpdateItemFunction',
      'DeleteItemFunction',
    ];

    lambdaFunctions.forEach(functionName => {
      test(`should have ${functionName}`, () => {
        expect(template.Resources[functionName]).toBeDefined();
        expect(template.Resources[functionName].Type).toBe(
          'AWS::Lambda::Function'
        );
      });

      test(`${functionName} should have correct runtime and configuration`, () => {
        const lambdaFunc = template.Resources[functionName].Properties;
        expect(lambdaFunc.Runtime).toBe('python3.11');
        expect(lambdaFunc.Handler).toBe('index.lambda_handler');
        expect(lambdaFunc.Timeout).toBe(30);
        expect(lambdaFunc.MemorySize).toBe(256);
      });

      test(`${functionName} should be in VPC private subnet`, () => {
        const lambdaFunc = template.Resources[functionName].Properties;
        expect(lambdaFunc.VpcConfig).toBeDefined();
        expect(lambdaFunc.VpcConfig.SecurityGroupIds).toEqual([
          {
            Ref: 'LambdaSecurityGroup',
          },
        ]);
        expect(lambdaFunc.VpcConfig.SubnetIds).toEqual([
          {
            Ref: 'PrivateSubnet',
          },
        ]);
      });

      test(`${functionName} should have environment variables`, () => {
        const lambdaFunc = template.Resources[functionName].Properties;
        expect(lambdaFunc.Environment.Variables.TABLE_NAME).toEqual({
          Ref: 'MyCrudTable',
        });
        expect(lambdaFunc.Environment.Variables.ENVIRONMENT).toEqual({
          Ref: 'Environment',
        });
      });
    });
  });

  describe('IAM Roles', () => {
    const iamRoles = [
      'CreateItemRole',
      'GetItemRole',
      'UpdateItemRole',
      'DeleteItemRole',
    ];

    iamRoles.forEach(roleName => {
      test(`should have ${roleName} with least privilege`, () => {
        expect(template.Resources[roleName]).toBeDefined();
        expect(template.Resources[roleName].Type).toBe('AWS::IAM::Role');
      });

      test(`${roleName} should have VPC access policy`, () => {
        const role = template.Resources[roleName].Properties;
        expect(role.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        );
      });

      test(`${roleName} should have specific DynamoDB permissions`, () => {
        const role = template.Resources[roleName].Properties;
        expect(role.Policies).toHaveLength(1);

        const policy = role.Policies[0];
        expect(policy.PolicyDocument.Statement[0].Resource).toEqual({
          'Fn::GetAtt': ['MyCrudTable', 'Arn'],
        });

        // Check specific permissions based on role
        const expectedActions: { [key: string]: string[] } = {
          CreateItemRole: ['dynamodb:PutItem'],
          GetItemRole: ['dynamodb:GetItem'],
          UpdateItemRole: ['dynamodb:UpdateItem'],
          DeleteItemRole: ['dynamodb:DeleteItem'],
        };

        expect(policy.PolicyDocument.Statement[0].Action).toEqual(
          expectedActions[roleName]
        );
      });
    });
  });

  describe('API Gateway', () => {
    test('should have REST API', () => {
      expect(template.Resources.MyRestApi).toBeDefined();
      expect(template.Resources.MyRestApi.Type).toBe(
        'AWS::ApiGateway::RestApi'
      );
    });

    test('should have items resource and item resource with path parameter', () => {
      expect(template.Resources.ItemsResource).toBeDefined();
      expect(template.Resources.ItemResource).toBeDefined();

      expect(template.Resources.ItemsResource.Properties.PathPart).toBe(
        'items'
      );
      expect(template.Resources.ItemResource.Properties.PathPart).toBe('{id}');
    });

    test('should have CRUD HTTP methods', () => {
      const methods = [
        'CreateItemMethod',
        'GetItemMethod',
        'UpdateItemMethod',
        'DeleteItemMethod',
      ];

      const expectedHttpMethods = ['POST', 'GET', 'PUT', 'DELETE'];

      methods.forEach((method, index) => {
        expect(template.Resources[method]).toBeDefined();
        expect(template.Resources[method].Type).toBe('AWS::ApiGateway::Method');
        expect(template.Resources[method].Properties.HttpMethod).toBe(
          expectedHttpMethods[index]
        );
        expect(template.Resources[method].Properties.Integration.Type).toBe(
          'AWS_PROXY'
        );
      });
    });

    test('should have OPTIONS methods for CORS', () => {
      expect(template.Resources.ItemsOptionsMethod).toBeDefined();
      expect(template.Resources.ItemOptionsMethod).toBeDefined();

      [
        template.Resources.ItemsOptionsMethod,
        template.Resources.ItemOptionsMethod,
      ].forEach(optionsMethod => {
        expect(optionsMethod.Properties.HttpMethod).toBe('OPTIONS');
        expect(optionsMethod.Properties.Integration.Type).toBe('MOCK');
      });
    });

    test('should have deployment and stage', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiStage).toBeDefined();

      expect(template.Resources.ApiDeployment.Type).toBe(
        'AWS::ApiGateway::Deployment'
      );
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
    });
  });

  describe('Lambda Permissions', () => {
    const permissions = [
      'CreateItemPermission',
      'GetItemPermission',
      'UpdateItemPermission',
      'DeleteItemPermission',
    ];

    permissions.forEach(permission => {
      test(`should have ${permission} for API Gateway`, () => {
        expect(template.Resources[permission]).toBeDefined();
        expect(template.Resources[permission].Type).toBe(
          'AWS::Lambda::Permission'
        );

        const perm = template.Resources[permission].Properties;
        expect(perm.Action).toBe('lambda:InvokeFunction');
        expect(perm.Principal).toBe('apigateway.amazonaws.com');
      });
    });
  });

  describe('Security Group', () => {
    test('should have Lambda security group with least privilege', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );

      const sg = template.Resources.LambdaSecurityGroup.Properties;
      expect(sg.SecurityGroupEgress).toHaveLength(2);

      // Check HTTPS and HTTP outbound rules
      const httpsRule = sg.SecurityGroupEgress.find(
        (rule: any) => rule.FromPort === 443
      );
      const httpRule = sg.SecurityGroupEgress.find(
        (rule: any) => rule.FromPort === 80
      );

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpRule.ToPort).toBe(80);
    });
  });

  describe('Outputs', () => {
    test('should have API Gateway URL output', () => {
      expect(template.Outputs.ApiGatewayInvokeURL).toBeDefined();
      const output = template.Outputs.ApiGatewayInvokeURL;
      expect(output.Description).toContain('REST API');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${MyRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}',
      });
    });

    test('should have DynamoDB table name output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toContain('DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'MyCrudTable' });
    });

    test('should have VPC infrastructure outputs', () => {
      const infrastructureOutputs = [
        'VPCId',
        'PrivateSubnetId',
        'PublicSubnetId',
        'LambdaSecurityGroupId',
      ];

      infrastructureOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any retain policies (for testing)', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('should have proper resource count for serverless CRUD API', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // VPC (7) + DynamoDB (1) + Lambda (4) + IAM (4) + API Gateway (11) + Security (1) + Permissions (4)
      expect(resourceCount).toBeGreaterThan(25);
    });

    test('Lambda functions should have proper Python code embedded', () => {
      const lambdaFunctions = [
        'CreateItemFunction',
        'GetItemFunction',
        'UpdateItemFunction',
        'DeleteItemFunction',
      ];

      lambdaFunctions.forEach(functionName => {
        const lambdaFunc = template.Resources[functionName].Properties;
        expect(lambdaFunc.Code.ZipFile).toContain('import json');
        expect(lambdaFunc.Code.ZipFile).toContain('import boto3');
        expect(lambdaFunc.Code.ZipFile).toContain('lambda_handler');
        expect(lambdaFunc.Code.ZipFile).toContain(
          'Access-Control-Allow-Origin'
        );
      });
    });
  });

  describe('CRUD Operations Validation', () => {
    test('CreateItemFunction should handle POST operations', () => {
      const func = template.Resources.CreateItemFunction.Properties;
      expect(func.Code.ZipFile).toContain('created_at');
      expect(func.Code.ZipFile).toContain('table.put_item');
      expect(func.Code.ZipFile).toContain("statusCode': 201");
    });

    test('GetItemFunction should handle GET operations', () => {
      const func = template.Resources.GetItemFunction.Properties;
      expect(func.Code.ZipFile).toContain('table.get_item');
      expect(func.Code.ZipFile).toContain('pathParameters');
      expect(func.Code.ZipFile).toContain('Item not found');
    });

    test('UpdateItemFunction should handle PUT operations', () => {
      const func = template.Resources.UpdateItemFunction.Properties;
      expect(func.Code.ZipFile).toContain('table.update_item');
      expect(func.Code.ZipFile).toContain('UpdateExpression');
      expect(func.Code.ZipFile).toContain('updated_at');
    });

    test('DeleteItemFunction should handle DELETE operations', () => {
      const func = template.Resources.DeleteItemFunction.Properties;
      expect(func.Code.ZipFile).toContain('table.delete_item');
      expect(func.Code.ZipFile).toContain('ReturnValues');
      expect(func.Code.ZipFile).toContain('deleted_item');
    });
  });
});
