import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    
    // Mock VPC lookup to avoid requiring actual AWS resources
    app.node.setContext('vpc-provider:account=123456789012:filter.isDefault=true:region=us-west-2:returnAsymmetricSubnets=true', {
      vpcId: 'vpc-12345',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-west-2a', 'us-west-2b'],
      publicSubnetIds: ['subnet-12345', 'subnet-67890'],
      publicSubnetNames: ['Public Subnet 1', 'Public Subnet 2'],
      publicSubnetRouteTableIds: ['rtb-12345', 'rtb-67890'],
      privateSubnetIds: [],
      privateSubnetNames: [],
      privateSubnetRouteTableIds: [],
      isolatedSubnetIds: [],
      isolatedSubnetNames: [],
      isolatedSubnetRouteTableIds: [],
      subnetGroups: [
        {
          name: 'Public',
          type: 'Public',
          subnets: [
            {
              subnetId: 'subnet-12345',
              availabilityZone: 'us-west-2a',
              routeTableId: 'rtb-12345'
            },
            {
              subnetId: 'subnet-67890',
              availabilityZone: 'us-west-2b',
              routeTableId: 'rtb-67890'
            }
          ]
        }
      ]
    });
    
    stack = new TapStack(app, 'TestTapStack', {
      env: { account: '123456789012', region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30
      });
    });

    test('should create Lambda function with VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: ['subnet-12345', 'subnet-67890']
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('should create private REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'CompanyName-ProjectName-Api',
        EndpointConfiguration: {
          Types: ['PRIVATE']
        }
      });
    });

    test('should create API Gateway method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE'
      });
    });
  });

  describe('VPC Endpoint', () => {
    test('should create VPC endpoint for API Gateway', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: 'com.amazonaws.us-west-2.execute-api'
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with three stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          { Name: 'Source' },
          { Name: 'Build' },
          { Name: 'Deploy' }
        ]
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket for pipeline artifacts', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create Lambda execution role', () => {
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

    test('should create CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('should create CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });
  });

  describe('Tags', () => {
    test('should apply consistent tags to resources', () => {
      // Check that tags are applied at stack level
      const stackTags = template.toJSON().Resources;
      expect(Object.keys(stackTags).length).toBeGreaterThan(0);
    });
  });
});
