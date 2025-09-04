import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs × 3 subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Configuration', () => {
    test('creates website bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'error.html',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates pipeline artifacts bucket', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates pipeline source bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3); // website, artifacts, source
    });
  });

  describe('CloudFront Configuration', () => {
    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultRootObject: 'index.html',
          CustomErrorResponses: [
            {
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
            },
          ],
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });
  });

  describe('Lambda Configuration', () => {
    test('creates Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            NODE_ENV: 'production',
          },
        },
      });
    });

    test('API Lambda function is in VPC', () => {
      // Find the API Lambda function specifically
      const lambdas = template.findResources('AWS::Lambda::Function');
      const apiLambda = Object.values(lambdas).find((lambda: any) => 
        lambda.Properties.Handler === 'index.handler' && 
        lambda.Properties.Runtime === 'nodejs18.x' &&
        lambda.Properties.VpcConfig
      ) as any;
      
      expect(apiLambda).toBeDefined();
      expect(apiLambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(apiLambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });
  });

  describe('API Gateway Configuration', () => {
    test('creates REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api',
        Description: 'TAP API Gateway',
      });
    });

    test('creates API methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    test('creates CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });
  });

  describe('RDS Configuration', () => {
    test('creates RDS instance with correct properties', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        DBName: 'tapdb',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
          },
        ],
      });
    });

    test('creates database subnet group', () => {
      const subnetGroups = template.findResources('AWS::RDS::DBSubnetGroup');
      const subnetGroup = Object.values(subnetGroups)[0] as any;
      
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for TapDatabase database');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('CodePipeline Configuration', () => {
    test('creates CodeBuild project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'tap-build',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:5.0',
          Type: 'LINUX_CONTAINER',
        },
      });
    });

    test('creates CodePipeline', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline',
      });
      
      // Verify pipeline has the required stages
      const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelines)[0] as any;
      const stages = pipeline.Properties.Stages;
      
      expect(stages).toHaveLength(3);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Deploy');
    });
  });

  describe('Security Configuration', () => {
    test('all S3 buckets block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('RDS instance is encrypted', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('API Lambda function has security group', () => {
      // Find the API Lambda function specifically
      const lambdas = template.findResources('AWS::Lambda::Function');
      const apiLambda = Object.values(lambdas).find((lambda: any) => 
        lambda.Properties.Handler === 'index.handler' && 
        lambda.Properties.Runtime === 'nodejs18.x' &&
        lambda.Properties.VpcConfig
      ) as any;
      
      expect(apiLambda).toBeDefined();
      expect(apiLambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates website URL output', () => {
      template.hasOutput('WebsiteURL', {
        Description: 'Website URL',
      });
    });

    test('creates API URL output', () => {
      template.hasOutput('ApiURL', {
        Description: 'API Gateway URL',
      });
    });

    test('creates database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('creates pipeline source bucket output', () => {
      template.hasOutput('PipelineSourceBucket', {
        Description: 'Pipeline Source S3 Bucket',
      });
    });
  });

  describe('Environment Suffix Support', () => {
    test('supports environment suffix in resource naming', () => {
      const appWithSuffix = new cdk.App({
        context: {
          envSuffix: 'dev',
        },
      });
      const stackWithSuffix = new TapStack(appWithSuffix, 'TestTapStackDev');
      const templateWithSuffix = Template.fromStack(stackWithSuffix);

      templateWithSuffix.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-dev-api',
      });
    });
  });
});
