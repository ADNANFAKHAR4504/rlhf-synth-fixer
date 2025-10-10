// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  ApiGatewayConstruct: jest.fn().mockImplementation((scope: any, id: string, apiName: string) => ({
    api: {
      id: `api-${apiName}`,
      rootResourceId: `root-${apiName}`,
      arn: `arn:aws:apigateway:us-east-1::/restapis/api-${apiName}`,
    },
    createLambdaIntegration: jest.fn(),
    addCorsOptions: jest.fn(),
    getDeploymentDependencies: jest.fn().mockReturnValue([
      { id: 'method-1' },
      { id: 'method-2' }
    ])
  })),

  DynamoTableConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    table: {
      name: config.tableName,
      arn: `arn:aws:dynamodb:us-east-1:123456789012:table/${config.tableName}`,
      id: `table-${config.tableName}`,
    }
  })),

  LambdaConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    lambda: {
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}`,
      functionName: config.functionName,
      invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}/invocations`,
    },
    attachInlinePolicy: jest.fn()
  })),

  ResourceTags: jest.fn(),
  productsHandlerCode: 'mock-products-handler-code',
  ordersHandlerCode: 'mock-orders-handler-code',
}));

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock Archive Provider
jest.mock("@cdktf/provider-archive/lib/provider", () => ({
  ArchiveProvider: jest.fn(),
}));

// Mock DataAwsCallerIdentity
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string) => ({
    id: `caller-identity-${id}`,
    accountId: '123456789012'
  }))
}));

// Mock DataAwsRegion
jest.mock("@cdktf/provider-aws/lib/data-aws-region", () => ({
  DataAwsRegion: jest.fn().mockImplementation((scope: any, id: string) => ({
    id: `region-${id}`,
    name: 'us-east-1'
  }))
}));

// Mock SSM Parameter
jest.mock("@cdktf/provider-aws/lib/ssm-parameter", () => ({
  SsmParameter: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `param-${id}`,
    name: config.name,
    arn: `arn:aws:ssm:us-east-1:123456789012:parameter${config.name}`,
    value: config.value,
  }))
}));

// Mock API Gateway resources
jest.mock("@cdktf/provider-aws/lib/api-gateway-resource", () => ({
  ApiGatewayResource: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `resource-${id}`,
    restApiId: config.restApiId,
    parentId: config.parentId,
    pathPart: config.pathPart,
  }))
}));

// Mock API Gateway Deployment
jest.mock("@cdktf/provider-aws/lib/api-gateway-deployment", () => ({
  ApiGatewayDeployment: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `deployment-${id}`,
    restApiId: config.restApiId,
  }))
}));

// Mock API Gateway Stage
jest.mock("@cdktf/provider-aws/lib/api-gateway-stage", () => ({
  ApiGatewayStage: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `stage-${id}`,
    stageName: config.stageName,
    restApiId: config.restApiId,
    deploymentId: config.deploymentId,
  }))
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

describe("TapStack Unit Tests", () => {
  const { 
    ApiGatewayConstruct,
    DynamoTableConstruct,
    LambdaConstruct,
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { ArchiveProvider } = require("@cdktf/provider-archive/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsRegion } = require("@cdktf/provider-aws/lib/data-aws-region");
  const { SsmParameter } = require("@cdktf/provider-aws/lib/ssm-parameter");
  const { ApiGatewayResource } = require("@cdktf/provider-aws/lib/api-gateway-resource");
  const { ApiGatewayDeployment } = require("@cdktf/provider-aws/lib/api-gateway-deployment");
  const { ApiGatewayStage } = require("@cdktf/provider-aws/lib/api-gateway-stage");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      // Verify Archive Provider is configured
      expect(ArchiveProvider).toHaveBeenCalledWith(
        expect.anything(),
        'archive'
      );
    });

    test("should create TapStack with custom AWS region", () => {
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

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = { tags: { Owner: 'DevOps-Team', Department: 'Engineering' } };

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
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

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

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'custom-terraform-states',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-terraform-states',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/TestStack.tfstate'
        })
      );
    });
  });

  describe("DynamoDB Table Configuration", () => {
    test("should create products table with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsTableCall = DynamoTableConstruct.mock.calls.find(
        (call: any) => call[1] === 'products-table'
      );

      expect(productsTableCall[2]).toEqual(expect.objectContaining({
        tableName: 'products-dev',
        hashKey: 'productId',
        hashKeyType: 'S',
        gsi: [{
          name: 'CategoryIndex',
          hashKey: 'category',
          hashKeyType: 'S',
          rangeKey: 'createdAt',
          rangeKeyType: 'S'
        }]
      }));
    });

    test("should create orders table with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ordersTableCall = DynamoTableConstruct.mock.calls.find(
        (call: any) => call[1] === 'orders-table'
      );

      expect(ordersTableCall[2]).toEqual(expect.objectContaining({
        tableName: 'orders-dev',
        hashKey: 'orderId',
        hashKeyType: 'S',
        gsi: [{
          name: 'CustomerIndex',
          hashKey: 'customerId',
          hashKeyType: 'S',
          rangeKey: 'createdAt',
          rangeKeyType: 'S'
        }]
      }));
    });

    test("should create tables with environment-specific names", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const productsTableCall = DynamoTableConstruct.mock.calls.find(
        (call: any) => call[1] === 'products-table'
      );

      const ordersTableCall = DynamoTableConstruct.mock.calls.find(
        (call: any) => call[1] === 'orders-table'
      );

      expect(productsTableCall[2].tableName).toBe('products-staging');
      expect(ordersTableCall[2].tableName).toBe('orders-staging');
    });

    test("should apply common tags to DynamoDB tables", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Environment: 'dev',
        ManagedBy: 'Terraform',
        Project: 'ecommerce-serverless'
      };

      DynamoTableConstruct.mock.calls.forEach((call: any) => {
        expect(call[3]).toEqual(expectedTags);
      });
    });
  });

  describe("Lambda Function Configuration", () => {
    test("should create products Lambda with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsLambdaCall = LambdaConstruct.mock.calls.find(
        (call: any) => call[1] === 'products-lambda'
      );

      expect(productsLambdaCall[2]).toEqual(expect.objectContaining({
        functionName: 'products-api-dev',
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        environment: {
          PRODUCTS_TABLE_PARAM: '/ecommerce/dev/tables/products'
        },
        inlineCode: 'mock-products-handler-code',
        logRetentionDays: 30
      }));
    });

    test("should create orders Lambda with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ordersLambdaCall = LambdaConstruct.mock.calls.find(
        (call: any) => call[1] === 'orders-lambda'
      );

      expect(ordersLambdaCall[2]).toEqual(expect.objectContaining({
        functionName: 'orders-api-dev',
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        environment: {
          ORDERS_TABLE_PARAM: '/ecommerce/dev/tables/orders'
        },
        inlineCode: 'mock-orders-handler-code',
        logRetentionDays: 30
      }));
    });

    test("should attach DynamoDB and SSM permissions to Lambda functions", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsLambda = LambdaConstruct.mock.results.find(
        (result: any) => result.value.lambda.functionName === 'products-api-dev'
      ).value;

      const ordersLambda = LambdaConstruct.mock.results.find(
        (result: any) => result.value.lambda.functionName === 'orders-api-dev'
      ).value;

      expect(productsLambda.attachInlinePolicy).toHaveBeenCalledWith(
        'dynamodb-access',
        expect.objectContaining({
          Version: '2012-10-17',
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query'
              ])
            }),
            expect.objectContaining({
              Effect: 'Allow',
              Action: ['ssm:GetParameter']
            })
          ])
        })
      );

      expect(ordersLambda.attachInlinePolicy).toHaveBeenCalledWith(
        'dynamodb-access',
        expect.any(Object)
      );
    });

    test("should create Lambda functions with environment-specific names", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const productsLambdaCall = LambdaConstruct.mock.calls.find(
        (call: any) => call[1] === 'products-lambda'
      );

      const ordersLambdaCall = LambdaConstruct.mock.calls.find(
        (call: any) => call[1] === 'orders-lambda'
      );

      expect(productsLambdaCall[2].functionName).toBe('products-api-prod');
      expect(ordersLambdaCall[2].functionName).toBe('orders-api-prod');
    });
  });

  describe("SSM Parameter Store Configuration", () => {
    test("should store products table name in Parameter Store", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsTableParam = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'products-table-param'
      );

      expect(productsTableParam[2]).toEqual(expect.objectContaining({
        name: '/ecommerce/dev/tables/products',
        type: 'String',
        value: 'products-dev',
        tags: {
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'ecommerce-serverless'
        }
      }));
    });

    test("should store orders table name in Parameter Store", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ordersTableParam = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'orders-table-param'
      );

      expect(ordersTableParam[2]).toEqual(expect.objectContaining({
        name: '/ecommerce/dev/tables/orders',
        type: 'String',
        value: 'orders-dev'
      }));
    });

    test("should use environment-specific parameter paths", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const productsTableParam = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'products-table-param'
      );

      const ordersTableParam = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'orders-table-param'
      );

      expect(productsTableParam[2].name).toBe('/ecommerce/staging/tables/products');
      expect(ordersTableParam[2].name).toBe('/ecommerce/staging/tables/orders');
    });
  });

  describe("API Gateway Configuration", () => {
    test("should create API Gateway with correct name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(ApiGatewayConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'api-gateway',
        'ecommerce-api-dev',
        {
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'ecommerce-serverless'
        }
      );
    });

    test("should create API resources for products", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsResource = ApiGatewayResource.mock.calls.find(
        (call: any) => call[1] === 'products-resource'
      );

      const productIdResource = ApiGatewayResource.mock.calls.find(
        (call: any) => call[1] === 'product-id-resource'
      );

      expect(productsResource[2]).toEqual(expect.objectContaining({
        pathPart: 'products'
      }));

      expect(productIdResource[2]).toEqual(expect.objectContaining({
        pathPart: '{id}'
      }));
    });

    test("should create API resources for orders", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ordersResource = ApiGatewayResource.mock.calls.find(
        (call: any) => call[1] === 'orders-resource'
      );

      const orderIdResource = ApiGatewayResource.mock.calls.find(
        (call: any) => call[1] === 'order-id-resource'
      );

      expect(ordersResource[2]).toEqual(expect.objectContaining({
        pathPart: 'orders'
      }));

      expect(orderIdResource[2]).toEqual(expect.objectContaining({
        pathPart: '{id}'
      }));
    });

    test("should setup Lambda integrations for all endpoints", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const apiGateway = ApiGatewayConstruct.mock.results[0].value;

      // Verify products integrations
      expect(apiGateway.createLambdaIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: 'products' }),
        'GET',
        expect.objectContaining({ functionName: 'products-api-dev' }),
        'products'
      );

      expect(apiGateway.createLambdaIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: '{id}' }),
        'GET',
        expect.objectContaining({ functionName: 'products-api-dev' }),
        'product-id'
      );

      // Verify orders integrations
      expect(apiGateway.createLambdaIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: 'orders' }),
        'POST',
        expect.objectContaining({ functionName: 'orders-api-dev' }),
        'orders'
      );

      expect(apiGateway.createLambdaIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: '{id}' }),
        'GET',
        expect.objectContaining({ functionName: 'orders-api-dev' }),
        'order-id'
      );
    });

    test("should add CORS options for all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const apiGateway = ApiGatewayConstruct.mock.results[0].value;

      expect(apiGateway.addCorsOptions).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: 'products' }),
        'products'
      );

      expect(apiGateway.addCorsOptions).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: '{id}' }),
        'product-id'
      );

      expect(apiGateway.addCorsOptions).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: 'orders' }),
        'orders'
      );

      expect(apiGateway.addCorsOptions).toHaveBeenCalledWith(
        expect.objectContaining({ pathPart: '{id}' }),
        'order-id'
      );
    });

    test("should create API deployment with dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(ApiGatewayDeployment).toHaveBeenCalledWith(
        expect.anything(),
        'api-deployment',
        expect.objectContaining({
          restApiId: expect.stringContaining('api-ecommerce-api-dev'),
          dependsOn: expect.arrayContaining([
            { id: 'method-1' },
            { id: 'method-2' }
          ]),
          description: expect.stringContaining('Deployment for dev stage at')
        })
      );
    });

    test("should create API stage with environment name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(ApiGatewayStage).toHaveBeenCalledWith(
        expect.anything(),
        'api-stage',
        expect.objectContaining({
          stageName: 'staging',
          description: 'staging stage',
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(9);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('api-gateway-url');
      expect(outputIds).toContain('products-lambda-arn');
      expect(outputIds).toContain('orders-lambda-arn');
      expect(outputIds).toContain('products-table-name');
      expect(outputIds).toContain('orders-table-name');
      expect(outputIds).toContain('products-table-arn');
      expect(outputIds).toContain('orders-table-arn');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('aws-region');
    });

    test("should output correct API Gateway URL", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const apiGatewayOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'api-gateway-url'
      );

      expect(apiGatewayOutput[2]).toEqual({
        value: 'https://api-ecommerce-api-dev.execute-api.us-east-1.amazonaws.com/dev',
        description: 'API Gateway endpoint URL'
      });
    });

    test("should output Lambda function ARNs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsLambdaOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'products-lambda-arn'
      );

      const ordersLambdaOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'orders-lambda-arn'
      );

      expect(productsLambdaOutput[2].value).toBe(
        'arn:aws:lambda:us-east-1:123456789012:function:products-api-dev'
      );

      expect(ordersLambdaOutput[2].value).toBe(
        'arn:aws:lambda:us-east-1:123456789012:function:orders-api-dev'
      );
    });

    test("should output DynamoDB table details", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsTableNameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'products-table-name'
      );

      const ordersTableArnOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'orders-table-arn'
      );

      expect(productsTableNameOutput[2].value).toBe('products-dev');
      expect(ordersTableArnOutput[2].value).toBe(
        'arn:aws:dynamodb:us-east-1:123456789012:table/orders-dev'
      );
    });
  });

  describe("Data Sources", () => {
    test("should create DataAwsCallerIdentity for account information", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current'
      );
    });

    test("should create DataAwsRegion for current region", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsRegion).toHaveBeenCalledWith(
        expect.anything(),
        'current-region'
      );
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const productsTableCall = DynamoTableConstruct.mock.calls[0];
      expect(productsTableCall[2].tableName).toBe('products-dev');

      const apiGatewayCall = ApiGatewayConstruct.mock.calls[0];
      expect(apiGatewayCall[2]).toBe('ecommerce-api-dev');
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const productsLambdaCall = LambdaConstruct.mock.calls.find(
        (call: any) => call[1] === 'products-lambda'
      );
      expect(productsLambdaCall[2].functionName).toBe('products-api-staging');

      const ordersTableCall = DynamoTableConstruct.mock.calls.find(
        (call: any) => call[1] === 'orders-table'
      );
      expect(ordersTableCall[2].tableName).toBe('orders-staging');
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const apiStageCall = ApiGatewayStage.mock.calls[0];
      expect(apiStageCall[2].stageName).toBe('prod');

      const expectedTags = {
        Environment: 'prod',
        ManagedBy: 'Terraform',
        Project: 'ecommerce-serverless'
      };

      const productsTableCall = DynamoTableConstruct.mock.calls[0];
      expect(productsTableCall[3]).toEqual(expectedTags);
    });
  });

  describe("Tag Propagation", () => {
    test("should propagate common tags to all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Environment: 'dev',
        ManagedBy: 'Terraform',
        Project: 'ecommerce-serverless'
      };

      // Check DynamoTableConstruct
      DynamoTableConstruct.mock.calls.forEach((call: any) => {
        expect(call[3]).toEqual(expectedTags);
      });

      // Check LambdaConstruct
      LambdaConstruct.mock.calls.forEach((call: any) => {
        expect(call[3]).toEqual(expectedTags);
      });

      // Check ApiGatewayConstruct
      const apiGatewayCall = ApiGatewayConstruct.mock.calls[0];
      expect(apiGatewayCall[3]).toEqual(expectedTags);

      // Check SsmParameter
      SsmParameter.mock.calls.forEach((call: any) => {
        expect(call[2].tags).toEqual(expectedTags);
      });
    });

    test("should update tags based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      const productsTableCall = DynamoTableConstruct.mock.calls[0];
      expect(productsTableCall[3].Environment).toBe('qa');

      const ordersLambdaCall = LambdaConstruct.mock.calls[1];
      expect(ordersLambdaCall[3].Environment).toBe('qa');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: { tags: { Owner: 'TeamA' } }
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'eu-west-1'
        })
      );
    });
  });

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern across all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      // Check DynamoDB tables
      const productsTableCall = DynamoTableConstruct.mock.calls[0];
      const ordersTableCall = DynamoTableConstruct.mock.calls[1];
      expect(productsTableCall[2].tableName).toBe('products-test');
      expect(ordersTableCall[2].tableName).toBe('orders-test');

      // Check Lambda functions
      const productsLambdaCall = LambdaConstruct.mock.calls[0];
      const ordersLambdaCall = LambdaConstruct.mock.calls[1];
      expect(productsLambdaCall[2].functionName).toBe('products-api-test');
      expect(ordersLambdaCall[2].functionName).toBe('orders-api-test');

      // Check API Gateway
      const apiGatewayCall = ApiGatewayConstruct.mock.calls[0];
      expect(apiGatewayCall[2]).toBe('ecommerce-api-test');
    });

    test("should include environment suffix in parameter names", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const productsParamCall = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'products-table-param'
      );
      const ordersParamCall = SsmParameter.mock.calls.find(
        (call: any) => call[1] === 'orders-table-param'
      );

      expect(productsParamCall[2].name).toBe('/ecommerce/staging/tables/products');
      expect(ordersParamCall[2].name).toBe('/ecommerce/staging/tables/orders');
    });
  });

  describe("Lambda IAM Permissions", () => {
    test("should grant DynamoDB permissions for products table and GSI", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const productsLambda = LambdaConstruct.mock.results[0].value;
      const attachCall = productsLambda.attachInlinePolicy.mock.calls[0];
      
      expect(attachCall[0]).toBe('dynamodb-access');
      const policy = attachCall[1];
      const dynamoStatement = policy.Statement[0];

      expect(dynamoStatement.Resource).toContain(
        'arn:aws:dynamodb:us-east-1:123456789012:table/products-dev'
      );
      expect(dynamoStatement.Resource).toContain(
        'arn:aws:dynamodb:us-east-1:123456789012:table/products-dev/index/*'
      );
    });

    test("should grant SSM GetParameter permissions with correct resource scope", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ordersLambda = LambdaConstruct.mock.results[1].value;
      const attachCall = ordersLambda.attachInlinePolicy.mock.calls[0];
      
      const policy = attachCall[1];
      const ssmStatement = policy.Statement[1];

      expect(ssmStatement.Action).toEqual(['ssm:GetParameter']);
      expect(ssmStatement.Resource).toContain('/ecommerce/dev/tables/*');
    });
  });

  describe("Integration Tests", () => {
    test("should create complete serverless infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(ArchiveProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(DataAwsRegion).toHaveBeenCalledTimes(1);
      expect(DynamoTableConstruct).toHaveBeenCalledTimes(2);
      expect(SsmParameter).toHaveBeenCalledTimes(2);
      expect(LambdaConstruct).toHaveBeenCalledTimes(2);
      expect(ApiGatewayConstruct).toHaveBeenCalledTimes(1);
      expect(ApiGatewayResource).toHaveBeenCalledTimes(4);
      expect(ApiGatewayDeployment).toHaveBeenCalledTimes(1);
      expect(ApiGatewayStage).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(9);

      expect(stack).toBeDefined();
    });

    test("should maintain resource relationships and dependencies", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Verify that tables are created before parameters
      const tablesCreated = DynamoTableConstruct.mock.invocationCallOrder[0];
      const paramsCreated = SsmParameter.mock.invocationCallOrder[0];
      expect(tablesCreated).toBeLessThan(paramsCreated);

      // Verify parameters are created before Lambdas
      const lambdasCreated = LambdaConstruct.mock.invocationCallOrder[0];
      expect(paramsCreated).toBeLessThan(lambdasCreated);

      // Verify API Gateway is created after Lambdas
      const apiGatewayCreated = ApiGatewayConstruct.mock.invocationCallOrder[0];
      expect(lambdasCreated).toBeLessThan(apiGatewayCreated);

      // Verify API resources are created after API Gateway
      const apiResourceCreated = ApiGatewayResource.mock.invocationCallOrder[0];
      expect(apiGatewayCreated).toBeLessThan(apiResourceCreated);

      // Verify deployment is created after all resources and methods
      const deploymentCreated = ApiGatewayDeployment.mock.invocationCallOrder[0];
      expect(apiResourceCreated).toBeLessThan(deploymentCreated);
    });

    test("should pass table names from DynamoDB to SSM parameters correctly", () => {
      const app = new App();
      new TapStack(app, "ParameterTest");

      const productsTable = DynamoTableConstruct.mock.results[0].value.table.name;
      const ordersTable = DynamoTableConstruct.mock.results[1].value.table.name;

      const productsParamCall = SsmParameter.mock.calls[0];
      const ordersParamCall = SsmParameter.mock.calls[1];

      expect(productsParamCall[2].value).toBe(productsTable);
      expect(ordersParamCall[2].value).toBe(ordersTable);
    });

    test("should configure API Gateway with Lambda integrations end-to-end", () => {
      const app = new App();
      new TapStack(app, "ApiIntegrationTest", {
        environmentSuffix: 'staging'
      });

      // Verify API Gateway is created with correct name
      const apiGatewayCall = ApiGatewayConstruct.mock.calls[0];
      expect(apiGatewayCall[2]).toBe('ecommerce-api-staging');

      // Verify Lambda integrations are set up
      const apiGateway = ApiGatewayConstruct.mock.results[0].value;
      expect(apiGateway.createLambdaIntegration).toHaveBeenCalledTimes(4);

      // Verify CORS is configured for all endpoints
      expect(apiGateway.addCorsOptions).toHaveBeenCalledTimes(4);

      // Verify deployment uses collected dependencies
      expect(apiGateway.getDeploymentDependencies).toHaveBeenCalled();

      // Verify stage is created with correct environment
      const stageCall = ApiGatewayStage.mock.calls[0];
      expect(stageCall[2].stageName).toBe('staging');
    });

    test("should handle AWS region configuration across all resources", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-central-1',
        stateBucketRegion: 'us-west-2'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );

      // Verify state bucket uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2'
        })
      );
    });
  });
});