import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: Template;
  let jsonTemplate: any;

  beforeAll(() => {
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');
    
    // Load JSON template for detailed assertions
    const templateContent = fs.readFileSync(jsonPath, 'utf8');
    jsonTemplate = JSON.parse(templateContent);
    
    // Create template from JSON for assertions
    template = Template.fromJSON(jsonTemplate);
  });

  describe('Template Structure Validation', () => {
    test('Template format version is correct', () => {
      expect(jsonTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('Template description is present', () => {
      expect(jsonTemplate.Description).toContain('TapStack');
      expect(jsonTemplate.Description).toContain('webhook processing');
    });

    test('Template has all required sections', () => {
      expect(jsonTemplate.Parameters).toBeDefined();
      expect(jsonTemplate.Resources).toBeDefined();
      expect(jsonTemplate.Outputs).toBeDefined();
      expect(jsonTemplate.Conditions).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('All required parameters are defined', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'ApiStageName',
        'WebhookApiKeyParamPath',
        'ValidatorSecretParamPath',
        'ProcessorApiKeyParamPath',
        'UseVpcEndpoints',
        'VpcCidr'
      ];

      requiredParams.forEach(param => {
        expect(jsonTemplate.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter has correct properties', () => {
      const param = jsonTemplate.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
      expect(param.Default).toBe('dev');
    });

    test('UseVpcEndpoints parameter has allowed values', () => {
      const param = jsonTemplate.Parameters.UseVpcEndpoints;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('CIDR parameters have correct default values', () => {
      expect(jsonTemplate.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
      expect(jsonTemplate.Parameters.PrivateSubnet1Cidr.Default).toBe('10.0.1.0/24');
      expect(jsonTemplate.Parameters.PrivateSubnet2Cidr.Default).toBe('10.0.2.0/24');
    });
  });

  describe('Conditions Validation', () => {
    test('CreateEndpoints condition is properly defined', () => {
      const condition = jsonTemplate.Conditions.CreateEndpoints;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
    });

    test('CreateNat condition is properly defined', () => {
      const condition = jsonTemplate.Conditions.CreateNat;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('VPC is created with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: { Ref: 'VpcCidr' },
        EnableDnsSupport: true,
        EnableDnsHostnames: true
      });
    });

    test('Private subnets are created in different AZs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: { Ref: 'PrivateSubnet1Cidr' },
        Tags: [{ Key: 'Name', Value: { 'Fn::Sub': 'PrivateSubnet1-${EnvironmentSuffix}' } }]
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: { Ref: 'PrivateSubnet2Cidr' },
        Tags: [{ Key: 'Name', Value: { 'Fn::Sub': 'PrivateSubnet2-${EnvironmentSuffix}' } }]
      });
    });

    test('Internet Gateway is conditionally created', () => {
      template.hasResource('AWS::EC2::InternetGateway', {
        Condition: 'CreateNat'
      });
    });

    test('NAT Gateways are conditionally created', () => {
      template.hasResource('AWS::EC2::NatGateway', {
        Condition: 'CreateNat'
      });
    });

    test('VPC endpoints are conditionally created', () => {
      template.hasResource('AWS::EC2::VPCEndpoint', {
        Condition: 'CreateEndpoints'
      });
    });

    test('S3 and DynamoDB gateway endpoints are always created', () => {
      const endpoints = ['S3GatewayEndpoint', 'DynamoDBGatewayEndpoint'];
      endpoints.forEach(endpoint => {
        expect(jsonTemplate.Resources[endpoint]).toBeDefined();
        expect(jsonTemplate.Resources[endpoint].Condition).toBeUndefined();
      });
    });
  });

  describe('Storage Resources Validation', () => {
    test('S3 buckets have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('Raw bucket has lifecycle configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30
                }
              ]
            }
          ]
        }
      });
    });

    test('DynamoDB table has Point-in-Time Recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });
  });

  describe('Lambda Functions Validation', () => {
    const lambdaFunctions = ['ReceiverFn', 'ValidatorFn', 'ProcessorFn'];

    test('All Lambda functions have VPC configuration', () => {
      lambdaFunctions.forEach(func => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: { 'Fn::Sub': `${func}-${'${EnvironmentSuffix}'}` },
          VpcConfig: {
            SecurityGroupIds: [{ Ref: 'LambdaSecurityGroup' }],
            SubnetIds: [
              { Ref: 'PrivateSubnet1' },
              { Ref: 'PrivateSubnet2' }
            ]
          }
        });
      });
    });

    test('Lambda functions have dead letter queue configured', () => {
      lambdaFunctions.forEach(func => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          DeadLetterConfig: {
            TargetArn: { 'Fn::GetAtt': ['Dlq', 'Arn'] }
          }
        });
      });
    });

    test('Receiver function uses Node.js runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler'
      });
    });

    test('Validator and Processor functions use Python runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler'
      });
    });

    test('Lambda functions have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            S3_BUCKET: { Ref: 'RawBucket' },
            VALIDATOR_ARN: { Ref: 'ValidatorFn' }
          }
        }
      });
    });

    test('Lambda functions have reserved concurrent executions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 100
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 50
      });
    });
  });

  describe('IAM Roles Validation', () => {
    test('Lambda roles have correct trust policy', () => {
      const roles = ['ReceiverRole', 'ValidatorRole', 'ProcessorRole'];
      roles.forEach(role => {
        template.hasResourceProperties('AWS::IAM::Role', {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          }
        });
      });
    });

    test('Lambda roles have VPCAccessExecutionRole policy attached', () => {
      const roles = ['ReceiverRole', 'ValidatorRole', 'ProcessorRole'];
      roles.forEach(role => {
        template.hasResourceProperties('AWS::IAM::Role', {
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ]
        });
      });
    });

    test('Receiver role has inline policies defined', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'ReceiverPolicy'
          }
        ]
      });
    });

    test('Validator role has inline policies defined', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'ValidatorPolicy'
          }
        ]
      });
    });

    test('Processor role has inline policies defined', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'ProcessorPolicy'
          }
        ]
      });
    });
  });

  describe('API Gateway Validation', () => {
    test('API Gateway is regional endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('Webhook resource and POST method are configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'webhook'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE'
      });
    });

    test('API Gateway has Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        }
      });
    });

    test('Lambda permission for API Gateway is configured', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com'
      });
    });

    test('API Gateway has method settings configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: 'POST',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/webhook',
            ThrottlingBurstLimit: 2000,
            ThrottlingRateLimit: 1000
          }
        ]
      });
    });
  });

  describe('Monitoring and Logging Validation', () => {
    test('CloudWatch log groups are created for all functions', () => {
      const logGroups = ['ReceiverLogGroup', 'ValidatorLogGroup', 'ProcessorLogGroup'];
      logGroups.forEach(logGroup => {
        expect(jsonTemplate.Resources[logGroup]).toBeDefined();
      });
    });

    test('Log groups have retention policy set', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('S3 buckets have logging enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          DestinationBucketName: { Ref: 'LogsBucket' },
          LogFilePrefix: 'access/'
        }
      });
    });
  });

  describe('Dead Letter Queue Validation', () => {
    test('DLQ is created with correct properties', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600,
        QueueName: { 'Fn::Sub': 'TapDlq-${EnvironmentSuffix}' }
      });
    });
  });

  describe('Outputs Validation', () => {
    test('All required outputs are defined', () => {
      const outputs = jsonTemplate.Outputs;
      expect(outputs.ApiInvokeUrl).toBeDefined();
      expect(outputs.WebhookTableName).toBeDefined();
      expect(outputs.RawBucketName).toBeDefined();
      expect(outputs.DlqUrl).toBeDefined();
    });

    test('API invoke URL output is correct', () => {
      const output = jsonTemplate.Outputs.ApiInvokeUrl;
      expect(output.Description).toBe('API Gateway Invoke URL');
      expect(output.Value['Fn::Sub']).toContain('execute-api');
    });

    test('DynamoDB table name output is correct', () => {
      const output = jsonTemplate.Outputs.WebhookTableName;
      expect(output.Description).toBe('DynamoDB Table Name');
      expect(output.Value.Ref).toBe('WebhookTable');
    });

    test('S3 bucket name output is correct', () => {
      const output = jsonTemplate.Outputs.RawBucketName;
      expect(output.Description).toBe('S3 Raw Bucket Name');
      expect(output.Value.Ref).toBe('RawBucket');
    });

    test('DLQ URL output is correct', () => {
      const output = jsonTemplate.Outputs.DlqUrl;
      expect(output.Description).toBe('Dead Letter Queue URL');
      expect(output.Value.Ref).toBe('Dlq');
    });
  });

  describe('Resource Count Validation', () => {
    test('All expected resources are created', () => {
      const resources = jsonTemplate.Resources;
      const resourceCount = Object.keys(resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should have significant number of resources
    });

    test('Key resource types are present', () => {
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::ApiGateway::RestApi',
        'AWS::SQS::Queue'
      ];

      resourceTypes.forEach(type => {
        const resourcesOfType = Object.values(jsonTemplate.Resources).filter(
          (resource: any) => resource.Type === type
        );
        expect(resourcesOfType.length).toBeGreaterThan(0);
      });
    });
  });
});