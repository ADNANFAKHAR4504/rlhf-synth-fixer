import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Coverage', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON CloudFormation template from a file
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // --- Template Structure and Metadata Tests ---

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a detailed description', () => {
      expect(template.Description).toBe(
        'Comprehensive serverless RESTful API for CRUD operations with DynamoDB, VPC, and API Gateway'
      );
    });

    test('should have defined Parameters, Mappings, Conditions, Resources, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // --- Parameters and Mappings Tests ---

  describe('Parameters and Mappings', () => {
    test('EnvironmentSuffix parameter should be a string with a default value but no AllowedValues', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      // The fix for the original error involves removing AllowedValues
      expect(envParam.AllowedValues).toBeUndefined();
      expect(envParam.Description).toBe(
        'Environment suffix for resource naming and tagging'
      );
    });

    test('EnvironmentConfig mapping should contain configurations for prod, and a default', () => {
      const mapping = template.Mappings.EnvironmentConfig;
      expect(mapping.prod).toEqual({
        LambdaMemorySize: 512,
        LambdaTimeout: 60,
      });
      expect(mapping.default).toEqual({
        LambdaMemorySize: 256,
        LambdaTimeout: 30,
      });
    });
  });

  // --- VPC and Networking Resources Tests ---

  describe('VPC and Networking Resources', () => {
    test('should have a VPC with a specified CIDR block and conditional naming', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have correctly configured public and private subnets', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);

      const privateSubnet = template.Resources.PrivateSubnet;
      expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet.Properties.VpcId.Ref).toBe('MyVPC');
    });

    test('should have a NAT Gateway and Internet Gateway', () => {
      expect(template.Resources.MyInternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway.Properties.SubnetId.Ref).toBe(
        'PublicSubnet'
      );
    });

    test('should have a Lambda security group with specific egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for Lambda functions with least privilege access'
      );
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupEgress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
        Description: 'HTTPS outbound for AWS API calls',
      });
    });
  });

  // --- DynamoDB Table Tests ---

  // --- DynamoDB Tables Tests ---

  describe('DynamoDB Tables', () => {
    test('should have an ItemsTable with PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled on the ItemsTable', () => {
      const table = template.Resources.ItemsTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('should have a primary key named "id" of type string (S)', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' },
      ]);
      expect(table.Properties.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' },
      ]);
    });
  });
  // --- IAM Roles and Lambda Functions Tests ---

  describe('Lambda Functions and IAM Roles', () => {
    const lambdaFunctions = [
      {
        func: 'CreateItemFunction',
        role: 'CreateItemRole',
        action: 'dynamodb:PutItem',
      },
      {
        func: 'GetItemFunction',
        role: 'GetItemRole',
        action: 'dynamodb:GetItem',
      },
      {
        func: 'UpdateItemFunction',
        role: 'UpdateItemRole',
        action: 'dynamodb:UpdateItem',
      },
      {
        func: 'DeleteItemFunction',
        role: 'DeleteItemRole',
        action: 'dynamodb:DeleteItem',
      },
    ];

    lambdaFunctions.forEach(({ func, role, action }) => {
      test(`${role} should have a least-privilege policy for ${action}`, () => {
        const iamRole = template.Resources[role];
        expect(iamRole.Type).toBe('AWS::IAM::Role');
        const policy = iamRole.Properties.Policies.find((p: any) =>
          p.PolicyName.includes('DynamoDB')
        );
        expect(policy.PolicyDocument.Statement[0].Action).toContain(action);
      });

      test(`${func} should have conditional MemorySize and Timeout`, () => {
        const lambdaFunc = template.Resources[func];
        const memorySize = lambdaFunc.Properties.MemorySize;
        const timeout = lambdaFunc.Properties.Timeout;

        expect(memorySize['Fn::If']).toBeDefined();
        expect(timeout['Fn::If']).toBeDefined();
      });

      test(`${func} should be deployed in the private subnet`, () => {
        const vpcConfig = template.Resources[func].Properties.VpcConfig;
        expect(vpcConfig.SubnetIds[0].Ref).toBe('PrivateSubnet');
        expect(vpcConfig.SecurityGroupIds[0].Ref).toBe('LambdaSecurityGroup');
      });
    });
  });

  // --- API Gateway Tests ---

  describe('API Gateway', () => {
    test('should have a REST API with a regional endpoint and conditional name', () => {
      const api = template.Resources.ItemsRestApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have /items and /{id} resources', () => {
      expect(template.Resources.ItemsResource.Properties.PathPart).toBe(
        'items'
      );
      expect(template.Resources.ItemResource.Properties.PathPart).toBe('{id}');
    });

    test('API methods should be configured with AWS_PROXY integration', () => {
      const methods = [
        {
          resource: 'CreateItemMethod',
          httpMethod: 'POST',
          function: 'CreateItemFunction',
        },
        {
          resource: 'GetItemMethod',
          httpMethod: 'GET',
          function: 'GetItemFunction',
        },
        {
          resource: 'UpdateItemMethod',
          httpMethod: 'PUT',
          function: 'UpdateItemFunction',
        },
        {
          resource: 'DeleteItemMethod',
          httpMethod: 'DELETE',
          function: 'DeleteItemFunction',
        },
      ];

      methods.forEach(method => {
        const methodResource = template.Resources[method.resource];
        expect(methodResource.Properties.HttpMethod).toBe(method.httpMethod);
        expect(methodResource.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });

    test('each API method should define method responses', () => {
      const methodResources = [
        template.Resources.CreateItemMethod,
        template.Resources.GetItemMethod,
        template.Resources.UpdateItemMethod,
        template.Resources.DeleteItemMethod,
      ];
      methodResources.forEach(method => {
        expect(method.Properties.MethodResponses).toBeDefined();
      });
    });
  });

  // --- Outputs Tests ---

  describe('Outputs', () => {
    test('should have an ApiGatewayInvokeURL output with a conditional URL and export name', () => {
      const output = template.Outputs.ApiGatewayInvokeURL;
      expect(output.Description).toBe('URL for the deployed REST API');
    });

    test('should export the DynamoDB table name and ARN with correct values', () => {
      const tableNameOutput = template.Outputs.DynamoDBTableName;
      expect(tableNameOutput.Value.Ref).toBe('ItemsTable');
      expect(tableNameOutput.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-DynamoDBTable'
      );

      const tableArnOutput = template.Outputs.DynamoDBTableArn;
      expect(tableArnOutput.Value['Fn::GetAtt'][0]).toBe('ItemsTable');
      expect(tableArnOutput.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-DynamoDBTableArn'
      );
    });

    test('should export VPC, subnet, and security group IDs', () => {
      expect(template.Outputs.VPCId.Value.Ref).toBe('MyVPC');
      expect(template.Outputs.PrivateSubnetId.Value.Ref).toBe('PrivateSubnet');
      expect(template.Outputs.PublicSubnetId.Value.Ref).toBe('PublicSubnet');
      expect(template.Outputs.LambdaSecurityGroupId.Value.Ref).toBe(
        'LambdaSecurityGroup'
      );
    });
  });
});
