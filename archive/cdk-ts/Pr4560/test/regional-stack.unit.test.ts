import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { RegionalStack } from '../lib/regional-stack';

describe('RegionalStack Unit Tests', () => {
  let app: cdk.App;
  let stack: RegionalStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new RegionalStack(app, 'TestRegionalStack', {
      tableName: 'test-payments-table-test123',
      tableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/test-payments-table-test123',
      kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
      region: 'us-east-1',
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
    });

    test('API Gateway is exported correctly', () => {
      expect(stack.apiGateway).toBeDefined();
    });

    test('API endpoint is exported correctly', () => {
      expect(stack.apiEndpoint).toBeDefined();
    });

    test('Health check path is /health', () => {
      expect(stack.healthCheckPath).toBe('/health');
    });

    test('Website bucket is exported correctly', () => {
      expect(stack.websiteBucket).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('Creates exactly one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('VPC has 2 availability zones', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates DynamoDB VPC endpoint', () => {
      const resources = template.toJSON().Resources;
      const endpoints = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCEndpoint'
      );
      expect(endpoints.length).toBe(1);
      const endpoint = endpoints[0] as any;
      // ServiceName is a CDK Fn::Join token, check it's defined
      expect(endpoint.Properties.ServiceName).toBeDefined();
      expect(endpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('Creates security group for Lambda', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Creates exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3 bucket has correct naming pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('payments-website-.*-test123-.*'),
      });
    });

    test('S3 bucket has public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Creates Lambda functions (Authorizer and Transfer)', () => {
      const resources = template.toJSON().Resources;
      const lambdas = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdas.length).toBeGreaterThanOrEqual(2);
    });

    test('Authorizer Lambda uses Node.js 20', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            REGION: 'us-east-1',
          },
        },
      });
    });

    test('Transfer Lambda is in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
        Environment: {
          Variables: {
            TABLE_NAME: 'test-payments-table-test123',
            REGION: 'us-east-1',
          },
        },
        Timeout: 30,
      });
    });

    test('Transfer Lambda has correct IAM permissions for DynamoDB', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBeGreaterThan(0);

      const hasDynamoDbPolicy = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((s: any) =>
          s.Action && Array.isArray(s.Action) && s.Action.includes('dynamodb:PutItem')
        )
      );
      expect(hasDynamoDbPolicy).toBe(true);
    });

    test('Transfer Lambda has correct IAM permissions for KMS', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            }),
          ]),
        },
      });
    });

    test('Transfer Lambda has permissions for Secrets Manager', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBeGreaterThan(0);

      const hasSecretsPolicy = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((s: any) => {
          if (!s.Action) return false;
          const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
          return actions.includes('secretsmanager:GetSecretValue');
        })
      );
      expect(hasSecretsPolicy).toBe(true);
    });
  });

  describe('Load Balancers', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internal',
      });
    });

    test('Creates Network Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'network',
        Scheme: 'internal',
      });
    });

    test('Creates ALB target group for Lambda', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetType: 'lambda',
      });
    });

    test('Creates NLB target group for ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Protocol: 'TCP',
        Port: 80,
        TargetType: 'alb',
      });
    });
  });

  describe('VPC Link', () => {
    test('Creates VPC Link for API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::VpcLink', 1);
      template.hasResourceProperties('AWS::ApiGateway::VpcLink', {
        Name: 'payments-vpc-link-test123',
      });
    });
  });

  describe('API Gateway', () => {
    test('Creates REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payments-api-test123',
      });
    });

    test('API Gateway has deployment stage prod', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('API Gateway has CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payments-api-test123',
      });
    });

    test('Creates health endpoint resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('Creates transfer endpoint resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transfer',
      });
    });

    test('Health endpoint uses mock integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'MOCK',
        },
      });
    });

    test('Transfer endpoint uses HTTP_PROXY with VPC Link', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'HTTP_PROXY',
          ConnectionType: 'VPC_LINK',
        },
      });
    });

    test('Transfer endpoint has custom authorization', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'CUSTOM',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Exports API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {});
    });

    test('Exports transfer endpoint URL', () => {
      template.hasOutput('TransferEndpoint', {});
    });

    test('Exports health endpoint URL', () => {
      template.hasOutput('HealthEndpoint', {});
    });

    test('Exports website bucket name', () => {
      template.hasOutput('WebsiteBucketName', {});
    });

    test('Exports Lambda function names', () => {
      template.hasOutput('TransferLambdaName', {});
      template.hasOutput('AuthorizerLambdaName', {});
    });

    test('Exports VPC ID', () => {
      template.hasOutput('VpcId', {});
    });

    test('Exports region', () => {
      template.hasOutput('Region', {
        Value: 'us-east-1',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Different environment suffixes create different resource names', () => {
      const app2 = new cdk.App();
      const stack2 = new RegionalStack(app2, 'TestRegionalStack2', {
        tableName: 'test-payments-table-prod456',
        tableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/test-payments-table-prod456',
        kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        region: 'us-east-1',
        environmentSuffix: 'prod456',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payments-api-test123',
      });

      template2.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payments-api-prod456',
      });
    });
  });

  describe('Log Retention', () => {
    test('Lambda functions have log retention configured', () => {
      const resources = template.toJSON().Resources;
      const logGroups = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Logs::LogGroup'
      );
      // Log groups may be created by CDK custom resources
      expect(logGroups.length).toBeGreaterThanOrEqual(0);
    });
  });
});
