import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect, describe, test, beforeEach} from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${id}`,
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    publicSubnets: [0, 1].map(i => ({
      id: `public-subnet-${i}`,
      cidrBlock: `10.0.${i}.0/24`,
      availabilityZone: `${config.region}${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: [0, 1].map(i => ({
      id: `private-subnet-${i}`,
      cidrBlock: `10.0.${i + 10}.0/24`,
      availabilityZone: `${config.region}${String.fromCharCode(97 + i)}`
    })),
    natGateway: {
      id: 'nat-gateway-1',
      allocationId: 'eip-nat-1',
      subnetId: 'public-subnet-0'
    },
    internetGateway: {
      id: 'igw-main',
      vpcId: `vpc-${id}`
    },
    securityGroup: {
      id: `sg-lambda-${id}`,
      name: `${config.environment}-lambda-sg`,
      vpcId: `vpc-${id}`,
      description: 'Security group for Lambda functions'
    }
  })),

  S3Module: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: {
      id: config.bucketName,
      arn: `arn:aws:s3:::${config.bucketName}`,
      bucketRegionalDomainName: `${config.bucketName}.s3.amazonaws.com`,
      bucketDomainName: `${config.bucketName}.s3.amazonaws.com`
    },
    bucketOwnershipControls: {
      id: `${config.bucketName}-ownership`,
      bucket: config.bucketName
    },
    bucketVersioning: {
      id: `${config.bucketName}-versioning`,
      bucket: config.bucketName,
      status: 'Enabled'
    },
    bucketEncryption: {
      id: `${config.bucketName}-encryption`,
      bucket: config.bucketName
    },
    bucketPublicAccessBlock: {
      id: `${config.bucketName}-public-access-block`,
      bucket: config.bucketName
    }
  })),

  LambdaModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    function: {
      id: `lambda-${config.functionName}`,
      functionName: config.functionName,
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}`,
      invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}/invocations`
    },
    role: {
      id: `${config.functionName}-role`,
      name: `${config.functionName}-role`,
      arn: `arn:aws:iam::123456789012:role/${config.functionName}-role`
    },
    logGroup: {
      id: `${config.functionName}-log-group`,
      name: `/aws/lambda/${config.functionName}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/${config.functionName}:*`
    },
    alias: {
      id: `${config.functionName}-alias`,
      name: 'live',
      functionName: config.functionName
    }
  })),

  CloudFrontModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    distribution: {
      id: `cloudfront-${id}`,
      domainName: 'd123456abcdef8.cloudfront.net',
      arn: `arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE`
    },
    originAccessControl: {
      id: `oac-${id}`,
      name: `${config.environment}-s3-oac`
    }
  })),

  SecretsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    secret: {
      id: `secret-${config.secretName}`,
      name: config.secretName,
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${config.secretName}-AbCdEf`
    },
    secretVersion: {
      id: `${config.secretName}-version`,
      secretId: `secret-${config.secretName}`,
      versionId: 'AWSCURRENT'
    }
  })),

  ApiGatewayModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    api: {
      id: `apigw-${config.apiName}`,
      name: config.apiName,
      executionArn: `arn:aws:execute-api:us-east-1:123456789012:abcdef123/*`
    },
    stage: {
      id: `${config.apiName}-stage`,
      name: config.environment,
      invokeUrl: `https://abcdef123.execute-api.us-east-1.amazonaws.com/${config.environment}`
    },
    integration: {
      id: `${config.apiName}-integration`,
      integrationUri: config.lambdaFunctionArn
    }
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dashboard: {
      id: `dashboard-${config.environment}`,
      dashboardName: `${config.environment}-serverless-dashboard`,
      dashboardArn: `arn:aws:cloudwatch::123456789012:dashboard/${config.environment}-serverless-dashboard`
    },
    alarms: [
      {
        id: 'lambda-error-alarm',
        alarmName: `${config.lambdaFunctionName}-error-rate`
      },
      {
        id: 'lambda-concurrent-alarm',
        alarmName: `${config.lambdaFunctionName}-concurrent-executions`
      },
      {
        id: 'lambda-duration-alarm',
        alarmName: `${config.lambdaFunctionName}-duration`
      }
    ]
  }))
}));

// Mock AWS provider modules
jest.mock("@cdktf/provider-aws", () => ({
  iamRolePolicy: {
    IamRolePolicy: jest.fn()
  },
  s3BucketPolicy: {
    S3BucketPolicy: jest.fn()
  },
  lambdaPermission: {
    LambdaPermission: jest.fn()
  }
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack,
    Fn: actual.Fn
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock the addOverride method
const mockAddOverride = jest.fn();
TapStack.prototype.addOverride = mockAddOverride;

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule,
    S3Module,
    LambdaModule,
    CloudFrontModule,
    SecretsModule,
    ApiGatewayModule,
    MonitoringModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const aws = require("@cdktf/provider-aws");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [{
            tags: {
              Environment: 'dev',
              ManagedBy: 'CDKTF',
              Stack: 'TestStack',
              Project: 'ServerlessApp'
            }
          }]
        })
      );
    });

    test("should create TapStack with custom aws region from props", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should apply custom default tags when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Team: 'DevOps',
          CostCenter: 'Engineering'
        }
      };

      new TapStack(app, "TestStack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'ap-south-1',
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'ap-south-1',
          encrypt: true
        })
      );
    });
  });

  describe("VPC Module Tests", () => {
    test("should create VpcModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          azCount: 2,
          region: 'us-east-1',
          environment: 'dev'
        })
      );
    });

    test("should create VPC with correct resources", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.vpc.id).toBe('vpc-vpc');
      expect(stack.vpc.publicSubnets).toHaveLength(2);
      expect(stack.vpc.privateSubnets).toHaveLength(2);
      expect(stack.vpc.natGateway).toBeDefined();
      expect(stack.vpc.internetGateway).toBeDefined();
      expect(stack.vpc.securityGroup).toBeDefined();
    });

    test("should pass correct environment to VPC module", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          environment: 'staging'
        })
      );
    });
  });

  describe("Secrets Module Tests", () => {
    test("should create SecretsModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SecretsModule).toHaveBeenCalledWith(
        expect.anything(),
        'secrets',
        expect.objectContaining({
          secretName: 'dev-new-app-secrets',
          description: 'Application secrets for serverless app',
          environment: 'dev',
          secretData: {
            apiKey: 'YOUR_API_KEY_HERE',
            dbConnectionString: 'YOUR_CONNECTION_STRING_HERE',
            jwtSecret: 'YOUR_JWT_SECRET_HERE'
          },
          rotationDays: 90
        })
      );
    });

    test("should use environment suffix in secret name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(SecretsModule).toHaveBeenCalledWith(
        expect.anything(),
        'secrets',
        expect.objectContaining({
          secretName: 'prod-new-app-secrets',
          environment: 'prod'
        })
      );
    });
  });

  describe("S3 Module Tests", () => {
    test("should create S3Module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        'content-storage',
        expect.objectContaining({
          bucketName: expect.stringMatching(/^dev-serverless-content-\d+$/),
          environment: 'dev',
          enableCors: true,
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'delete-old-logs',
              status: 'Enabled',
              prefix: 'logs/',
              expiration: { days: 30 }
            }),
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
              prefix: 'archives/',
              transition: expect.arrayContaining([
                { days: 30, storageClass: 'STANDARD_IA' },
                { days: 90, storageClass: 'GLACIER' }
              ])
            })
          ])
        })
      );
    });

    test("should create unique bucket name with timestamp", () => {
      const app = new App();
      const beforeTime = Date.now();
      new TapStack(app, "TestStack");
      const afterTime = Date.now();

      const bucketCall = S3Module.mock.calls[0];
      const bucketName = bucketCall[2].bucketName;
      const match = bucketName.match(/^dev-serverless-content-(\d+)$/);
      
      expect(match).toBeTruthy();
      const timestamp = parseInt(match![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("Lambda Module Tests", () => {
    test("should create LambdaModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      const secretsModule = SecretsModule.mock.results[0].value;
      const s3Module = S3Module.mock.results[0].value;

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'api-lambda',
        expect.objectContaining({
          functionName: 'dev-api-handler',
          handler: 'index.handler',
          runtime: 'python3.9',
          memorySize: 1024,
          timeout: 30,
          sourceBucket: 'lambda-zip-b',
          sourceKey: 'security-lambda.zip',
          environment: 'dev',
          vpcConfig: {
            subnetIds: ['private-subnet-0', 'private-subnet-1'],
            securityGroupIds: ['sg-lambda-vpc']
          },
          environmentVariables: {
            ENVIRONMENT: 'dev',
            SECRET_ARN: secretsModule.secret.arn,
            S3_BUCKET: s3Module.bucket.id,
            REGION: 'us-east-1'
          },
          reservedConcurrentExecutions: 50
        })
      );
    });

    test("should set production concurrency for prod environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'api-lambda',
        expect.objectContaining({
          reservedConcurrentExecutions: 200
        })
      );
    });

    test("should pass VPC configuration to Lambda", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      const lambdaCall = LambdaModule.mock.calls[0];
      expect(lambdaCall[2].vpcConfig).toEqual({
        subnetIds: ['private-subnet-0', 'private-subnet-1'],
        securityGroupIds: ['sg-lambda-vpc']
      });
    });
  });

  describe("API Gateway Module Tests", () => {
    test("should create ApiGatewayModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;

      expect(ApiGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'http-api',
        expect.objectContaining({
          apiName: 'dev-serverless-api',
          environment: 'dev',
          lambdaFunctionArn: lambdaModule.function.arn,
          lambdaFunctionName: lambdaModule.function.functionName,
          throttleSettings: {
            rateLimit: 1000,
            burstLimit: 500
          }
        })
      );
    });

    test("should set production throttle settings for prod environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(ApiGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'http-api',
        expect.objectContaining({
          throttleSettings: {
            rateLimit: 10000,
            burstLimit: 5000
          }
        })
      );
    });
  });

  describe("CloudFront Module Tests", () => {
    test("should create CloudFrontModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;

      expect(CloudFrontModule).toHaveBeenCalledWith(
        expect.anything(),
        'cdn',
        expect.objectContaining({
          s3BucketDomainName: s3Module.bucket.bucketRegionalDomainName,
          s3BucketId: s3Module.bucket.id,
          environment: 'dev',
          priceClass: 'PriceClass_100'
        })
      );
    });

    test("should set production price class for prod environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(CloudFrontModule).toHaveBeenCalledWith(
        expect.anything(),
        'cdn',
        expect.objectContaining({
          priceClass: 'PriceClass_All'
        })
      );
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create MonitoringModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      const apiModule = ApiGatewayModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          environment: 'dev',
          lambdaFunctionName: lambdaModule.function.functionName,
          apiId: apiModule.api.id
        })
      );
    });
  });

  describe("IAM Permissions", () => {
    test("should create Lambda S3 access policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      const s3Module = S3Module.mock.results[0].value;

      expect(aws.iamRolePolicy.IamRolePolicy).toHaveBeenCalledWith(
        expect.anything(),
        'lambda-s3-policy',
        expect.objectContaining({
          name: `${lambdaModule.function.functionName}-s3-access`,
          role: lambdaModule.role.id,
          policy: expect.stringContaining(s3Module.bucket.arn)
        })
      );
    });

    test("should create Lambda Secrets Manager access policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      const secretsModule = SecretsModule.mock.results[0].value;

      expect(aws.iamRolePolicy.IamRolePolicy).toHaveBeenCalledWith(
        expect.anything(),
        'lambda-secrets-policy',
        expect.objectContaining({
          name: `${lambdaModule.function.functionName}-secrets-access`,
          role: lambdaModule.role.id,
          policy: expect.stringContaining(secretsModule.secret.arn)
        })
      );
    });

    test("should create Lambda X-Ray tracing policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;

      expect(aws.iamRolePolicy.IamRolePolicy).toHaveBeenCalledWith(
        expect.anything(),
        'lambda-xray-policy',
        expect.objectContaining({
          name: `${lambdaModule.function.functionName}-xray-access`,
          role: lambdaModule.role.id,
          policy: expect.stringContaining('xray:PutTraceSegments')
        })
      );
    });

    test("should create S3 bucket policy for CloudFront", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;
      const cdnModule = CloudFrontModule.mock.results[0].value;

      expect(aws.s3BucketPolicy.S3BucketPolicy).toHaveBeenCalledWith(
        expect.anything(),
        's3-cloudfront-policy',
        expect.objectContaining({
          bucket: s3Module.bucket.id,
          policy: expect.stringContaining(cdnModule.distribution.arn)
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('api-endpoint');
      expect(outputIds).toContain('cloudfront-domain');
      expect(outputIds).toContain('cloudfront-distribution-id');
      expect(outputIds).toContain('s3-bucket-name');
      expect(outputIds).toContain('lambda-function-name');
      expect(outputIds).toContain('lambda-function-arn');
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('monitoring-dashboard-url');
    });

    test("should create API endpoint output with correct value", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const apiModule = ApiGatewayModule.mock.results[0].value;
      const apiOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'api-endpoint'
      );
      
      expect(apiOutput[2].value).toBe(apiModule.stage.invokeUrl);
      expect(apiOutput[2].description).toBe('API Gateway endpoint URL');
    });

    test("should create CloudFront outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const cdnModule = CloudFrontModule.mock.results[0].value;
      
      const domainOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'cloudfront-domain'
      );
      expect(domainOutput[2].value).toBe(cdnModule.distribution.domainName);
      
      const idOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'cloudfront-distribution-id'
      );
      expect(idOutput[2].value).toBe(cdnModule.distribution.id);
    });

    test("should create monitoring dashboard URL output", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      const dashboardOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'monitoring-dashboard-url'
      );
      
      expect(dashboardOutput[2].value).toContain(monitoringModule.dashboard.dashboardName);
      expect(dashboardOutput[2].value).toContain('cloudwatch');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC subnets to Lambda", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      const lambdaCall = LambdaModule.mock.calls[0];
      
      expect(lambdaCall[2].vpcConfig.subnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
      expect(lambdaCall[2].vpcConfig.securityGroupIds).toContain(
        vpcModule.securityGroup.id
      );
    });

    test("should pass Lambda ARN to API Gateway", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      const apiCall = ApiGatewayModule.mock.calls[0];
      
      expect(apiCall[2].lambdaFunctionArn).toBe(lambdaModule.function.arn);
      expect(apiCall[2].lambdaFunctionName).toBe(lambdaModule.function.functionName);
    });

    test("should pass S3 bucket to CloudFront", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;
      const cdnCall = CloudFrontModule.mock.calls[0];
      
      expect(cdnCall[2].s3BucketDomainName).toBe(s3Module.bucket.bucketRegionalDomainName);
      expect(cdnCall[2].s3BucketId).toBe(s3Module.bucket.id);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallOrder = VpcModule.mock.invocationCallOrder[0];
      const secretsCallOrder = SecretsModule.mock.invocationCallOrder[0];
      const s3CallOrder = S3Module.mock.invocationCallOrder[0];
      const lambdaCallOrder = LambdaModule.mock.invocationCallOrder[0];
      const apiCallOrder = ApiGatewayModule.mock.invocationCallOrder[0];
      const cdnCallOrder = CloudFrontModule.mock.invocationCallOrder[0];
      const monitoringCallOrder = MonitoringModule.mock.invocationCallOrder[0];
      
      // VPC should be created first
      expect(vpcCallOrder).toBeLessThan(lambdaCallOrder);
      
      // Secrets and S3 should be created before Lambda
      expect(secretsCallOrder).toBeLessThan(lambdaCallOrder);
      expect(s3CallOrder).toBeLessThan(lambdaCallOrder);
      
      // Lambda should be created before API Gateway
      expect(lambdaCallOrder).toBeLessThan(apiCallOrder);
      
      // S3 should be created before CloudFront
      expect(s3CallOrder).toBeLessThan(cdnCallOrder);
      
      // API should be created before monitoring
      expect(apiCallOrder).toBeLessThan(monitoringCallOrder);
    });
  });

  describe("Environment Configuration", () => {
    test("should use dev as default environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'api-lambda',
        expect.objectContaining({
          functionName: 'dev-api-handler'
        })
      );
    });

    test("should use provided environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'staging/TestStack.tfstate'
        })
      );

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'api-lambda',
        expect.objectContaining({
          functionName: 'staging-api-handler',
          environment: 'staging'
        })
      );

      expect(ApiGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'http-api',
        expect.objectContaining({
          apiName: 'staging-serverless-api',
          environment: 'staging'
        })
      );
    });

    test("should handle production environment settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      // Check production-specific settings
      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'api-lambda',
        expect.objectContaining({
          reservedConcurrentExecutions: 200 // prod setting
        })
      );

      expect(ApiGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'http-api',
        expect.objectContaining({
          throttleSettings: {
            rateLimit: 10000,
            burstLimit: 5000
          }
        })
      );

      expect(CloudFrontModule).toHaveBeenCalledWith(
        expect.anything(),
        'cdn',
        expect.objectContaining({
          priceClass: 'PriceClass_All'
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
      // Should use default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          azCount: 2,
          region: 'us-east-1',
          environment: 'dev'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should use 'dev' as fallback
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });

    test("should handle AWS region override constant", () => {
      // This would require modifying the AWS_REGION_OVERRIDE in the actual code
      // For now, we just test that the override mechanism works
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1'
        })
      );
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecretsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(LambdaModule).toHaveBeenCalledTimes(1);
      expect(ApiGatewayModule).toHaveBeenCalledTimes(1);
      expect(CloudFrontModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
    });

    test("should expose all modules as public properties", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack.vpc).toBeDefined();
      expect(stack.storage).toBeDefined();
      expect(stack.lambda).toBeDefined();
      expect(stack.cdn).toBeDefined();
      expect(stack.api).toBeDefined();
      expect(stack.secrets).toBeDefined();
      expect(stack.monitoring).toBeDefined();
    });

    test("should create resources with consistent naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      const lambdaModule = LambdaModule.mock.results[0].value;
      expect(lambdaModule.function.functionName).toBe('test-api-handler');

      const apiModule = ApiGatewayModule.mock.results[0].value;
      expect(apiModule.api.name).toBe('test-serverless-api');

      const secretsModule = SecretsModule.mock.results[0].value;
      expect(secretsModule.secret.name).toBe('test-new-app-secrets');
    });
  });

  describe("Region-specific Configuration", () => {
    test("should configure resources for different regions", () => {
      const regions = ['us-west-2', 'eu-central-1', 'ap-northeast-1'];
      
      regions.forEach(region => {
        jest.clearAllMocks();
        const app = new App();
        
        new TapStack(app, "TestStack", {
          awsRegion: region
        });

        expect(AwsProvider).toHaveBeenCalledWith(
          expect.anything(),
          'aws',
          expect.objectContaining({
            region: region
          })
        );

        expect(VpcModule).toHaveBeenCalledWith(
          expect.anything(),
          'vpc',
          expect.objectContaining({
            region: region
          })
        );
      });
    });

    test("should handle state bucket in different region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1',
        stateBucketRegion: 'us-east-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });
  });

  describe("Stack ID and Naming", () => {
    test("should use stack ID in resource naming and tags", () => {
      const app = new App();
      new TapStack(app, "MyCustomStack", {
        environmentSuffix: 'dev'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/MyCustomStack.tfstate'
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [{
            tags: expect.objectContaining({
              Stack: 'MyCustomStack'
            })
          }]
        })
      );
    });
  });

  describe("Lambda Environment Variables", () => {
    test("should pass all required environment variables to Lambda", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaCall = LambdaModule.mock.calls[0];
      const envVars = lambdaCall[2].environmentVariables;

      expect(envVars).toHaveProperty('ENVIRONMENT', 'dev');
      expect(envVars).toHaveProperty('SECRET_ARN');
      expect(envVars).toHaveProperty('S3_BUCKET');
      expect(envVars).toHaveProperty('REGION', 'us-east-1');
    });

    test("should use correct region in Lambda environment variables", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-south-1'
      });

      const lambdaCall = LambdaModule.mock.calls[0];
      expect(lambdaCall[2].environmentVariables.REGION).toBe('ap-south-1');
    });
  });

  describe("S3 Lifecycle Rules", () => {
    test("should configure S3 lifecycle rules correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Call = S3Module.mock.calls[0];
      const lifecycleRules = s3Call[2].lifecycleRules;

      expect(lifecycleRules).toHaveLength(2);
      
      const logsRule = lifecycleRules.find((r: any) => r.id === 'delete-old-logs');
      expect(logsRule).toMatchObject({
        status: 'Enabled',
        prefix: 'logs/',
        expiration: { days: 30 }
      });

      const archiveRule = lifecycleRules.find((r: any) => r.id === 'transition-to-ia');
      expect(archiveRule).toMatchObject({
        status: 'Enabled',
        prefix: 'archives/',
        transition: expect.arrayContaining([
          { days: 30, storageClass: 'STANDARD_IA' },
          { days: 90, storageClass: 'GLACIER' }
        ])
      });
    });
  });
});