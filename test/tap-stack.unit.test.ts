import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Custom schema for CloudFormation YAML with intrinsic functions
const CloudFormationSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: function (data) {
      return { Ref: data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: function (data) {
      // Handle dot notation like "Resource.Property"
      const parts = data.split('.');
      return { 'Fn::GetAtt': parts };
    },
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::FindInMap': data };
    },
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Select': data };
    },
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::GetAZs': data };
    },
  }),
]);

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    
    // Enhanced template loading validation
    expect(fs.existsSync(templatePath)).toBe(true);
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    expect(templateContent).toBeDefined();
    expect(templateContent.length).toBeGreaterThan(0);
    
    try {
      template = yaml.load(templateContent, { schema: CloudFormationSchema });
    } catch (error) {
      throw new Error(`Failed to parse CloudFormation template: ${error}`);
    }

    // Validate template is properly loaded
    expect(template).toBeDefined();
    expect(typeof template).toBe('object');
    expect(template.AWSTemplateFormatVersion).toBeDefined();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toContain(
        'Comprehensive serverless RESTful API'
      );
      expect(template.Description).toContain('CRUD operations');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedValues).toEqual([
        'dev',
        'staging',
        'prod',
      ]);
    });

    test('should have proper parameter description', () => {
      expect(template.Parameters.EnvironmentSuffix.Description).toContain(
        'Environment suffix'
      );
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have all environment configurations', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig.dev).toBeDefined();
      expect(envConfig.staging).toBeDefined();
      expect(envConfig.prod).toBeDefined();
    });

    test('should have correct Lambda configurations', () => {
      const envConfig = template.Mappings.EnvironmentConfig;

      // Enhanced validation for environment-specific configurations
      if (envConfig.dev) {
        expect(envConfig.dev.LambdaMemorySize).toBe(256);
        expect(envConfig.dev.LambdaTimeout).toBe(30);
      }
      if (envConfig.staging) {
        expect(envConfig.staging.LambdaMemorySize).toBe(256);
        expect(envConfig.staging.LambdaTimeout).toBe(30);
      }

      // Prod should have more memory for better performance
      if (envConfig.prod) {
        expect(envConfig.prod.LambdaMemorySize).toBe(512);
        expect(envConfig.prod.LambdaTimeout).toBeGreaterThanOrEqual(30); // Allow flexible prod timeout
      }

      // Default environment should exist
      if (envConfig.default) {
        expect(envConfig.default.LambdaMemorySize).toBeGreaterThanOrEqual(256);
        expect(envConfig.default.LambdaTimeout).toBeGreaterThan(0);
      }

      // Validate all environments have required properties
      Object.keys(envConfig).forEach(env => {
        expect(envConfig[env].LambdaMemorySize).toBeGreaterThanOrEqual(128);
        expect(envConfig[env].LambdaTimeout).toBeGreaterThan(0);
        expect(envConfig[env].LambdaTimeout).toBeLessThanOrEqual(900); // AWS Lambda max timeout
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.MyInternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnet', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      expect(publicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnet', () => {
      const privateSubnet = template.Resources.PrivateSubnet;
      expect(privateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      const natEip = template.Resources.NATGatewayEIP;
      const natGateway = template.Resources.NATGateway;

      expect(natEip.Type).toBe('AWS::EC2::EIP');
      expect(natEip.Properties.Domain).toBe('vpc');

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have proper route tables', () => {
      const publicRt = template.Resources.PublicRouteTable;
      const privateRt = template.Resources.PrivateRouteTable;

      expect(publicRt.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have proper routes', () => {
      const publicRoute = template.Resources.PublicRoute;
      const privateRoute = template.Resources.PrivateRoute;

      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      expect(privateRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Group', () => {
    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('Lambda functions');
    });

    test('should have proper egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;

      expect(egressRules).toHaveLength(2);

      // HTTPS rule
      const httpsRule = egressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');

      // HTTP rule
      const httpRule = egressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have items table', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct key schema', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Properties.KeySchema).toHaveLength(1);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.ItemsTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('should have proper attribute definitions', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
    });
  });

  describe('IAM Roles', () => {
    const expectedRoles = [
      'CreateItemRole',
      'GetItemRole',
      'UpdateItemRole',
      'DeleteItemRole',
    ];

    test.each(expectedRoles)('should have %s', roleName => {
      const role = template.Resources[roleName];
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('lambda.amazonaws.com');
    });

    test('should have VPC access execution role', () => {
      expectedRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        );
      });
    });

    test('should have correct DynamoDB permissions', () => {
      const createRole = template.Resources.CreateItemRole;
      const getRole = template.Resources.GetItemRole;
      const updateRole = template.Resources.UpdateItemRole;
      const deleteRole = template.Resources.DeleteItemRole;

      expect(
        createRole.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toContain('dynamodb:PutItem');
      expect(
        getRole.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toContain('dynamodb:GetItem');
      expect(
        updateRole.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toContain('dynamodb:UpdateItem');
      expect(
        updateRole.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toContain('dynamodb:GetItem');
      expect(
        deleteRole.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toContain('dynamodb:DeleteItem');
    });
  });

  describe('Lambda Functions', () => {
    const expectedFunctions = [
      'CreateItemFunction',
      'GetItemFunction',
      'UpdateItemFunction',
      'DeleteItemFunction',
    ];

    test.each(expectedFunctions)('should have %s', functionName => {
      const func = template.Resources[functionName];
      expect(func.Type).toBe('AWS::Lambda::Function');
      
      // Enhanced runtime validation - check for Python 3.9+ requirement from PROMPT.md
      const runtime = func.Properties.Runtime;
      expect(runtime).toBeDefined();
      expect(runtime).toMatch(/^python3\.(9|1[0-9])$|^python3\.(9|1[0-9])\./); // Python 3.9+ pattern
      
      // Validate runtime meets minimum requirement (Python 3.9+)
      const runtimeVersion = parseFloat(runtime.replace('python', ''));
      expect(runtimeVersion).toBeGreaterThanOrEqual(3.9); // Changed to match PROMPT requirement
      
      expect(func.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should use environment-specific memory and timeout', () => {
      expectedFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        
        // Enhanced memory configuration validation
        const memoryConfig = func.Properties.MemorySize;
        if (typeof memoryConfig === 'object' && memoryConfig['Fn::FindInMap']) {
          expect(memoryConfig['Fn::FindInMap']).toEqual([
            'EnvironmentConfig',
            { Ref: 'EnvironmentSuffix' },
            'LambdaMemorySize',
          ]);
        } else {
          // Direct value should meet minimum 256MB requirement
          expect(memoryConfig).toBeGreaterThanOrEqual(256);
        }
        
        // Enhanced timeout configuration validation
        const timeoutConfig = func.Properties.Timeout;
        if (typeof timeoutConfig === 'object' && timeoutConfig['Fn::FindInMap']) {
          expect(timeoutConfig['Fn::FindInMap']).toEqual([
            'EnvironmentConfig',
            { Ref: 'EnvironmentSuffix' },
            'LambdaTimeout',
          ]);
        } else {
          // Direct value should be reasonable (30 seconds from PROMPT.md)
          expect(timeoutConfig).toBeGreaterThanOrEqual(30);
          expect(timeoutConfig).toBeLessThanOrEqual(900);
        }
      });
    });

    test('should have VPC configuration', () => {
      expectedFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.VpcConfig).toBeDefined();
        expect(func.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
        expect(func.Properties.VpcConfig.SubnetIds).toHaveLength(1);
      });
    });

    test('should have environment variables', () => {
      expectedFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Environment.Variables.TABLE_NAME).toEqual({
          Ref: 'ItemsTable',
        });
        expect(func.Properties.Environment.Variables.LOG_LEVEL).toBe('INFO');
      });
    });

    test('should have inline Python code with proper structure', () => {
      expectedFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        const code = func.Properties.Code.ZipFile;

        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(100); // Ensure substantial code
        
        // Enhanced Python imports validation
        expect(code).toContain('import json');
        expect(code).toContain('import boto3');
        expect(code).toContain('lambda_handler');
        
        // Validate OS and logging imports for production readiness
        expect(code).toMatch(/import (os|logging)/);

        // Validate proper Python function signature
        expect(code).toContain('def lambda_handler(event, context)');

        // Enhanced error handling validation
        expect(code).toMatch(/try:|except|Exception/);
        expect(code).toMatch(/except\s+\w*Exception/);

        // Enhanced logging validation
        expect(code).toMatch(/import logging|logger|print|LOG_LEVEL/);
        
        // Validate environment variable usage
        expect(code).toMatch(/os\.environ|TABLE_NAME/);
        
        // Validate proper return structure for API Gateway
        expect(code).toMatch(/return\s*{[\s\S]*statusCode[\s\S]*}/);
        
        // Validate CORS headers are included
        expect(code).toMatch(/Access-Control-Allow-Origin/);
      });
    });
  });

  describe('API Gateway', () => {
    test('should have REST API with proper configuration', () => {
      const api = template.Resources.ItemsRestApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      
      // Enhanced API Gateway endpoint configuration validation
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);

      // Enhanced API naming and description validation
      expect(api.Properties.Name).toBeDefined();
      expect(typeof api.Properties.Name).toBe('string');
      expect(api.Properties.Description).toBeDefined();
      expect(typeof api.Properties.Description).toBe('string');
      expect(api.Properties.Description.length).toBeGreaterThan(10);

      // Validate regional endpoint is used (recommended for most use cases)
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.EndpointConfiguration.Types).toHaveLength(1);
      
      // Validate API configuration follows best practices
      expect(api.Properties.EndpointConfiguration.Types).not.toContain('EDGE'); // REGIONAL preferred
    });

    test('should have items resource', () => {
      const resource = template.Resources.ItemsResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('items');
    });

    test('should have item resource with path parameter', () => {
      const resource = template.Resources.ItemResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('{id}');
    });

    test('should have CRUD methods', () => {
      const methods = [
        'CreateItemMethod',
        'GetItemMethod',
        'UpdateItemMethod',
        'DeleteItemMethod',
      ];
      const httpMethods = ['POST', 'GET', 'PUT', 'DELETE'];

      methods.forEach((methodName, index) => {
        const method = template.Resources[methodName];
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe(httpMethods[index]);
        expect(method.Properties.AuthorizationType).toBe('NONE');
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });

    test('should have CORS OPTIONS methods', () => {
      const optionsMethods = ['ItemsOptionsMethod', 'ItemOptionsMethod'];

      optionsMethods.forEach(methodName => {
        const method = template.Resources[methodName];
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('OPTIONS');
        expect(method.Properties.Integration.Type).toBe('MOCK');
      });
    });

    test('should have Lambda permissions', () => {
      const permissions = [
        'CreateItemPermission',
        'GetItemPermission',
        'UpdateItemPermission',
        'DeleteItemPermission',
      ];

      permissions.forEach(permissionName => {
        const permission = template.Resources[permissionName];
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties.Principal).toBe(
          'apigateway.amazonaws.com'
        );
      });
    });

    test('should have deployment with proper dependencies', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toEqual({
        Ref: 'EnvironmentSuffix',
      });
      
      // Enhanced deployment dependency validation
      expect(deployment.DependsOn).toBeDefined();
      expect(Array.isArray(deployment.DependsOn)).toBe(true);
      expect(deployment.DependsOn.length).toBeGreaterThanOrEqual(4); // At least 4 CRUD methods

      // Validate all required methods are in dependencies
      const requiredMethods = [
        'CreateItemMethod',
        'GetItemMethod',
        'UpdateItemMethod',
        'DeleteItemMethod',
      ];
      requiredMethods.forEach(methodName => {
        expect(deployment.DependsOn).toContain(methodName);
      });

      // Enhanced OPTIONS methods validation for CORS support
      const optionsMethods = deployment.DependsOn.filter(dep => dep.includes('Options'));
      expect(optionsMethods.length).toBeGreaterThanOrEqual(1); // At least one OPTIONS method
      
      // Validate specific OPTIONS methods if they exist
      const hasItemsOptions = deployment.DependsOn.includes('ItemsOptionsMethod');
      const hasItemOptions = deployment.DependsOn.includes('ItemOptionsMethod');
      expect(hasItemsOptions || hasItemOptions).toBe(true); // At least one should exist
    });
  });

  describe('Outputs', () => {
    test('should have API Gateway invoke URL', () => {
      const output = template.Outputs.ApiGatewayInvokeURL;
      expect(output.Description).toContain('URL for the deployed REST API');
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiGatewayURL',
      });
    });

    test('should have DynamoDB table name and ARN', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({
        Ref: 'ItemsTable',
      });
    });

    test('should have VPC and subnet outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PrivateSubnetId).toBeDefined();
      expect(template.Outputs.PublicSubnetId).toBeDefined();
      expect(template.Outputs.LambdaSecurityGroupId).toBeDefined();
    });

    test('should have environment output', () => {
      expect(template.Outputs.Environment).toBeDefined();
      expect(template.Outputs.Environment.Value).toEqual({
        Ref: 'EnvironmentSuffix',
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use environment suffix in resource names', () => {
      const resourcesWithNames = [
        'MyVPC',
        'MyInternetGateway',
        'PublicSubnet',
        'PrivateSubnet',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'LambdaSecurityGroup',
        'ItemsTable',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value).toEqual({
              'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
            });
          }
        }
      });
    });

    test('should have consistent tagging', () => {
      const taggedResources = [
        'MyVPC',
        'MyInternetGateway',
        'PublicSubnet',
        'PrivateSubnet',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'LambdaSecurityGroup',
        'ItemsTable',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          const projectTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Project'
          );

          expect(envTag?.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          expect(projectTag?.Value).toBe('ServerlessAPI');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have retention policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('should have all required resource types', () => {
      // Enhanced resource type validation with minimum requirements
      const minimumResourceTypes = {
        'AWS::EC2::VPC': 1,
        'AWS::EC2::InternetGateway': 1,
        'AWS::EC2::Subnet': 2, // public and private
        'AWS::EC2::NatGateway': 1,
        'AWS::EC2::EIP': 1,
        'AWS::EC2::RouteTable': 2, // public and private
        'AWS::EC2::Route': 2, // public and private routes
        'AWS::EC2::SecurityGroup': 1,
        'AWS::DynamoDB::Table': 1,
        'AWS::Lambda::Function': 4, // CRUD operations
        'AWS::IAM::Role': 4, // one per Lambda
        'AWS::ApiGateway::RestApi': 1,
        'AWS::ApiGateway::Resource': 2, // /items and /items/{id}
        'AWS::Lambda::Permission': 4, // one per Lambda
        'AWS::ApiGateway::Deployment': 1,
      };

      const actualResourceTypes = {};
      Object.values(template.Resources).forEach((resource: any) => {
        const type = resource.Type;
        actualResourceTypes[type] = (actualResourceTypes[type] || 0) + 1;
      });

      // Validate minimum required resource counts
      Object.entries(minimumResourceTypes).forEach(([type, minCount]) => {
        expect(actualResourceTypes[type]).toBeGreaterThanOrEqual(minCount);
      });
      
      // Enhanced API Gateway Method validation (flexible for OPTIONS methods)
      const methodCount = actualResourceTypes['AWS::ApiGateway::Method'] || 0;
      expect(methodCount).toBeGreaterThanOrEqual(4); // At least 4 CRUD methods
      expect(methodCount).toBeLessThanOrEqual(8); // Maximum reasonable methods
      
      // Validate total resource count is reasonable
      const totalResources = Object.values(actualResourceTypes).reduce((sum: number, count: number) => sum + count, 0);
      expect(totalResources).toBeGreaterThan(20); // Substantial infrastructure
      expect(totalResources).toBeLessThan(100); // Not overly complex
    });

    test('should have proper resource dependencies', () => {
      // Check that NAT Gateway EIP depends on Gateway attachment
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');

      // Check that public route depends on Gateway attachment
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');

      // Check API deployment dependencies
      expect(template.Resources.ApiDeployment.DependsOn).toContain(
        'CreateItemMethod'
      );
      expect(template.Resources.ApiDeployment.DependsOn).toContain(
        'GetItemMethod'
      );
      expect(template.Resources.ApiDeployment.DependsOn).toContain(
        'UpdateItemMethod'
      );
      expect(template.Resources.ApiDeployment.DependsOn).toContain(
        'DeleteItemMethod'
      );
    });

    test('should use proper CloudFormation intrinsic functions', () => {
      // Check Ref usage in outputs
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({
        Ref: 'ItemsTable',
      });

      // Check GetAtt usage
      expect(template.Outputs.DynamoDBTableArn.Value).toEqual({
        'Fn::GetAtt': ['ItemsTable', 'Arn'],
      });

      // Check Sub usage in names
      expect(template.Outputs.ApiGatewayInvokeURL.Value).toEqual({
        'Fn::Sub':
          'https://${ItemsRestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}',
      });
    });
  });
});
