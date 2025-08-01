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
      expect(template.Description).toBe(
        'Secure Serverless Application Infrastructure with API Gateway, Lambda, and DynamoDB'
      );
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Suffix for the environment (e.g., dev, prod)');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters.');
    });

    test('ApplicationName parameter should have correct properties', () => {
      const appNameParam = template.Parameters.ApplicationName;
      expect(appNameParam.Type).toBe('String');
      expect(appNameParam.Default).toBe('serverless-app');
      expect(appNameParam.Description).toBe('Application name for resource naming');
    });
  });

  describe('VPC Infrastructure Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda security group should have correct egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      
      expect(egressRules).toHaveLength(2);
      expect(egressRules[0].FromPort).toBe(443);
      expect(egressRules[0].ToPort).toBe(443);
      expect(egressRules[1].FromPort).toBe(80);
      expect(egressRules[1].ToPort).toBe(80);
    });

    test('should have DynamoDB VPC endpoint', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDB table', () => {
      expect(template.Resources.DynamoDBTable).toBeDefined();
      expect(template.Resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct configuration', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have correct attribute definitions', () => {
      const table = template.Resources.DynamoDBTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.DynamoDBTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('IAM Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have API Gateway role', () => {
      expect(template.Resources.APIGatewayRole).toBeDefined();
      expect(template.Resources.APIGatewayRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have correct managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('Lambda execution role should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('DynamoDBAccess');
      
      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:UpdateItem');
      expect(statement.Action).toContain('dynamodb:DeleteItem');
      expect(statement.Action).toContain('dynamodb:Query');
      expect(statement.Action).toContain('dynamodb:Scan');
    });

    test('API Gateway role should have Lambda invoke policy', () => {
      const role = template.Resources.APIGatewayRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('LambdaInvokePolicy');
      
      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('lambda:InvokeFunction');
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('Lambda function should have correct environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'DynamoDBTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });


    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('import json');
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaPermission).toBeDefined();
      expect(template.Resources.LambdaPermission.Type).toBe('AWS::Lambda::Permission');
      
      const permission = template.Resources.LambdaPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      expect(template.Resources.RestApi).toBeDefined();
      expect(template.Resources.RestApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('REST API should have correct configuration', () => {
      const api = template.Resources.RestApi;
      expect(api.Properties.Description).toBe('Secure REST API for serverless application');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API resource', () => {
      expect(template.Resources.ApiResource).toBeDefined();
      expect(template.Resources.ApiResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(template.Resources.ApiResource.Properties.PathPart).toBe('data');
    });

    test('should have GET method', () => {
      expect(template.Resources.GetMethod).toBeDefined();
      expect(template.Resources.GetMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.GetMethod.Properties.HttpMethod).toBe('GET');
      expect(template.Resources.GetMethod.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have POST method', () => {
      expect(template.Resources.PostMethod).toBeDefined();
      expect(template.Resources.PostMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.PostMethod.Properties.HttpMethod).toBe('POST');
      expect(template.Resources.PostMethod.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have OPTIONS method for CORS', () => {
      expect(template.Resources.OptionsMethod).toBeDefined();
      expect(template.Resources.OptionsMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.OptionsMethod.Properties.HttpMethod).toBe('OPTIONS');
      expect(template.Resources.OptionsMethod.Properties.Integration.Type).toBe('MOCK');
    });

    test('GET and POST methods should have AWS_PROXY integration', () => {
      const getMethod = template.Resources.GetMethod;
      const postMethod = template.Resources.PostMethod;
      
      expect(getMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(postMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(getMethod.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      expect(postMethod.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have API deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('GetMethod');
      expect(deployment.DependsOn).toContain('PostMethod');
      expect(deployment.DependsOn).toContain('OptionsMethod');
    });

    test('should have API stage', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
      
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.StageName).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'DynamoDBTableName',
        'LambdaFunctionName',
        'VPCId',
        'PrivateSubnetIds'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/data'
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'DynamoDBTable' });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Lambda function name');
      expect(output.Value).toEqual({ Ref: 'LambdaFunction' });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('PrivateSubnetIds output should be correct', () => {
      const output = template.Outputs.PrivateSubnetIds;
      expect(output.Description).toBe('Private subnet IDs');
      expect(output.Value).toEqual({
        'Fn::Sub': '${PrivateSubnet1},${PrivateSubnet2}'
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC resources should have consistent tags', () => {
      const vpcResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'LambdaSecurityGroup'
      ];

      vpcResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          expect(nameTag).toBeDefined();
        }
      });
    });

    test('application resources should have consistent tags', () => {
      const appResources = [
        'DynamoDBTable',
        'LambdaExecutionRole',
        'APIGatewayRole',
        'LambdaFunction',
        'RestApi',
        'ApiStage'
      ];

      appResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          expect(nameTag).toBeDefined();
        }
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on Internet Gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Default public route should depend on Internet Gateway attachment', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('API deployment should depend on all methods', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('GetMethod');
      expect(deployment.DependsOn).toContain('PostMethod');
      expect(deployment.DependsOn).toContain('OptionsMethod');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      const namingPatterns = {
        DynamoDBTable: '${ApplicationName}-table-${EnvironmentSuffix}',
        LambdaFunction: '${ApplicationName}-function-${EnvironmentSuffix}',
        RestApi: '${ApplicationName}-api-${EnvironmentSuffix}'
      };

      Object.keys(namingPatterns).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource && resource.Properties) {
          const nameProperty = resource.Properties.TableName || 
                              resource.Properties.FunctionName || 
                              resource.Properties.Name;
          if (nameProperty) {
            expect(nameProperty).toEqual({
              'Fn::Sub': namingPatterns[resourceKey as keyof typeof namingPatterns]
            });
          }
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^\$\{ApplicationName\}-.*-\$\{EnvironmentSuffix\}$/);
          }
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have reasonable resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // VPC + DDB + Lambda + API Gateway resources
      expect(resourceCount).toBeLessThan(50); // Not too many resources
    });

    test('should have reasonable parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and ApplicationName
    });

    test('should have reasonable output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // All the defined outputs
    });
  });
});
