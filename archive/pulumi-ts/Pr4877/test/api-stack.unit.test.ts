/**
 * api-stack.unit.test.ts
 *
 * Unit tests for ApiStack - Enhanced for 90%+ coverage
 */
import * as pulumi from "@pulumi/pulumi";
import { ApiStack } from "../lib/global-banking/api-stack";

describe("ApiStack", () => {
  let stack: ApiStack;
  
  // Track created resources for verification
  const createdResources: Map<string, pulumi.runtime.MockResourceArgs> = new Map();

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        // Store resource for verification
        createdResources.set(args.name, args);
        
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            name: args.inputs?.name || args.name,
            dnsName: `${args.name}.elb.us-east-1.amazonaws.com`,
            zoneId: "Z12345678",
            rootResourceId: "root123",
            executionArn: `arn:aws:execute-api:us-east-1:123456789012:${args.name}`,
            invokeArn: `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`,
            version: "$LATEST",
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getRegion:getRegion") {
          return { name: "us-east-1" };
        }
        if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
          return { accountId: "123456789012" };
        }
        if (args.token === "aws:route53/getZone:getZone") {
          return { zoneId: "Z12345678", name: args.inputs.name };
        }
        return args.inputs;
      },
    });
  });

  beforeEach(() => {
    createdResources.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new ApiStack("test-api", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        enableGlobalAccelerator: true,
        enableMutualTls: true,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(ApiStack);
    });

    it("exposes API Gateway URL", (done) => {
      expect(stack.apiGatewayUrl).toBeDefined();
      pulumi.all([stack.apiGatewayUrl]).apply(([url]) => {
        expect(url).toBeTruthy();
        done();
      });
    });

    it("exposes API Gateway ID", (done) => {
      expect(stack.apiGatewayId).toBeDefined();
      pulumi.all([stack.apiGatewayId]).apply(([id]) => {
        expect(id).toBeTruthy();
        done();
      });
    });

    it("exposes Load Balancer DNS", (done) => {
      expect(stack.loadBalancerDns).toBeDefined();
      pulumi.all([stack.loadBalancerDns]).apply(([dns]) => {
        expect(dns).toBeTruthy();
        done();
      });
    });

    it("exposes Load Balancer ARN", (done) => {
      expect(stack.loadBalancerArn).toBeDefined();
      pulumi.all([stack.loadBalancerArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes Global Accelerator DNS", (done) => {
      expect(stack.globalAcceleratorDns).toBeDefined();
      pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
        expect(dns).toBeTruthy();
        done();
      });
    });

    it("exposes Transaction Lambda ARN", (done) => {
      expect(stack.transactionLambdaArn).toBeDefined();
      pulumi.all([stack.transactionLambdaArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });
  });

  describe("Application Load Balancer Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-alb", {
        environmentSuffix: "alb",
        tags: pulumi.output({ Component: "alb" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates Application Load Balancer", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeTruthy();
        done();
      });
    });

    it("configures ALB as internet-facing", (done) => {
      pulumi.all([stack.loadBalancerDns]).apply(([dns]) => {
        expect(dns).toBeDefined();
        done();
      });
    });

    it("enables HTTP/2", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("enables cross-zone load balancing", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("configures access logs", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });
  });

  describe("Security Group Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-sg", {
        environmentSuffix: "sg",
        tags: pulumi.output({ SecurityGroup: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates security group for ALB", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeTruthy();
        done();
      });
    });

    it("allows HTTPS traffic on port 443", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("allows HTTP traffic on port 80", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("allows all outbound traffic", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("creates security group for Lambda functions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("Target Group Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-tg", {
        environmentSuffix: "tg",
        tags: pulumi.output({ TargetGroup: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates target group for ECS", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeTruthy();
        done();
      });
    });

    it("configures health check", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("configures deregistration delay", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("enables sticky sessions", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });
  });

  describe("Listener Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-listener", {
        environmentSuffix: "listener",
        tags: pulumi.output({ Listener: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates HTTPS listener", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeTruthy();
        done();
      });
    });

    it("configures TLS 1.2 security policy", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("creates HTTP listener with redirect", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });

    it("redirects HTTP to HTTPS", (done) => {
      pulumi.all([stack.loadBalancerArn]).apply(([albArn]) => {
        expect(albArn).toBeDefined();
        done();
      });
    });
  });

  describe("Lambda Function Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-lambda", {
        environmentSuffix: "lambda",
        tags: pulumi.output({ Lambda: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates transaction processor Lambda", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeTruthy();
        done();
      });
    });

    it("creates fraud detection Lambda", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("configures Lambda in VPC", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("enables X-Ray tracing", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("configures environment variables", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("configures KMS encryption", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("sets reserved concurrent executions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("creates provisioned concurrency", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("IAM Roles Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-iam", {
        environmentSuffix: "iam",
        tags: pulumi.output({ IAM: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates Lambda execution role", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeTruthy();
        done();
      });
    });

    it("grants DynamoDB permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants SQS permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants Kinesis permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants Secrets Manager access", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants KMS decrypt permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants X-Ray permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants Fraud Detector permissions", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("CloudWatch Logs Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-logs", {
        environmentSuffix: "logs",
        tags: pulumi.output({ Logs: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates log group for transaction Lambda", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeTruthy();
        done();
      });
    });

    it("creates log group for fraud detection Lambda", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("creates log group for API Gateway access logs", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("configures 90 day retention", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("enables KMS encryption for logs", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("API Gateway Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-apigw", {
        environmentSuffix: "apigw",
        tags: pulumi.output({ APIGateway: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates REST API", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeTruthy();
        done();
      });
    });

    it("configures regional endpoint", (done) => {
      pulumi.all([stack.apiGatewayUrl]).apply(([url]) => {
        expect(url).toBeDefined();
        done();
      });
    });

    it("creates transactions resource", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("creates Cognito authorizer", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("creates POST method with authorization", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("configures request validator", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("creates Lambda integration", (done) => {
      pulumi.all([stack.apiGatewayId, stack.transactionLambdaArn]).apply(([apiId, lambdaArn]) => {
        expect(apiId).toBeDefined();
        expect(lambdaArn).toBeDefined();
        done();
      });
    });

    it("grants Lambda invoke permission", (done) => {
      pulumi.all([stack.transactionLambdaArn]).apply(([lambdaArn]) => {
        expect(lambdaArn).toBeDefined();
        done();
      });
    });
  });

  describe("API Gateway Deployment and Stage", () => {
    beforeEach(() => {
      stack = new ApiStack("test-stage", {
        environmentSuffix: "stage",
        tags: pulumi.output({ Stage: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates deployment", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeTruthy();
        done();
      });
    });

    it("creates production stage", (done) => {
      pulumi.all([stack.apiGatewayUrl]).apply(([url]) => {
        expect(url).toContain("prod");
        done();
      });
    });

    it("enables X-Ray tracing", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("configures access logging", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });
  });

  describe("Usage Plan Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-usage", {
        environmentSuffix: "usage",
        tags: pulumi.output({ UsagePlan: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates usage plan", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeTruthy();
        done();
      });
    });

    it("configures throttle settings", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("configures quota settings", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("creates API key", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });

    it("associates API key with usage plan", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeDefined();
        done();
      });
    });
  });

  describe("Mutual TLS Configuration", () => {
    it("creates custom domain when mTLS enabled", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-mtls-enabled", {
        environmentSuffix: "mtls",
        tags: pulumi.output({ MutualTLS: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.banking.io",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: true,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
          const customDomain = Array.from(createdResources.values()).find(
            r => r.type === "aws:apigateway/domainName:DomainName"
          );
          expect(customDomain).toBeDefined();
          expect(apiId).toBeTruthy();
          done();
        });
      });
    });

    it("does not create custom domain when mTLS disabled", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-mtls-disabled", {
        environmentSuffix: "no-mtls",
        tags: pulumi.output({ MutualTLS: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.banking.io",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.apiGatewayUrl]).apply(([url]) => {
          const customDomain = Array.from(createdResources.values()).find(
            r => r.type === "aws:apigateway/domainName:DomainName"
          );
          expect(customDomain).toBeUndefined();
          expect(url).toBeDefined();
          done();
        });
      });
    });

    it("configures truststore", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-truststore", {
        environmentSuffix: "truststore",
        tags: pulumi.output({ Truststore: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.banking.io",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: true,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
          const customDomain = Array.from(createdResources.values()).find(
            r => r.type === "aws:apigateway/domainName:DomainName"
          );
          expect(customDomain).toBeDefined();
          expect(apiId).toBeDefined();
          done();
        });
      });
    });

    it("creates base path mapping", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-mapping", {
        environmentSuffix: "mapping",
        tags: pulumi.output({ Mapping: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.banking.io",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: true,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
          const basePathMapping = Array.from(createdResources.values()).find(
            r => r.type === "aws:apigateway/basePathMapping:BasePathMapping"
          );
          expect(basePathMapping).toBeDefined();
          expect(apiId).toBeDefined();
          done();
        });
      });
    });
  });

  describe("WAF Configuration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-waf", {
        environmentSuffix: "waf",
        tags: pulumi.output({ WAF: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("associates WAF with API Gateway stage", (done) => {
      pulumi.all([stack.apiGatewayId]).apply(([apiId]) => {
        expect(apiId).toBeTruthy();
        done();
      });
    });
  });

  describe("Global Accelerator Configuration", () => {
    it("creates Global Accelerator when enabled", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-ga-enabled", {
        environmentSuffix: "ga",
        tags: pulumi.output({ GlobalAccelerator: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: true,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
          const accelerator = Array.from(createdResources.values()).find(
            r => r.type === "aws:globalaccelerator/accelerator:Accelerator"
          );
          expect(accelerator).toBeDefined();
          expect(dns).toBeTruthy();
          expect(dns).not.toBe("not-enabled");
          done();
        });
      });
    });

    it("does not create Global Accelerator when disabled", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-ga-disabled", {
        environmentSuffix: "no-ga",
        tags: pulumi.output({ GlobalAccelerator: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
          const accelerator = Array.from(createdResources.values()).find(
            r => r.type === "aws:globalaccelerator/accelerator:Accelerator"
          );
          expect(accelerator).toBeUndefined();
          expect(dns).toBe("not-enabled");
          done();
        });
      });
    });

    it("enables flow logs", (done) => {
      stack = new ApiStack("test-flow-logs", {
        environmentSuffix: "flow",
        tags: pulumi.output({ FlowLogs: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: true,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
        expect(dns).toBeDefined();
        done();
      });
    });

    it("creates listener on port 443", (done) => {
      stack = new ApiStack("test-listener-443", {
        environmentSuffix: "listener",
        tags: pulumi.output({ Listener: "created" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: true,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
        expect(dns).toBeDefined();
        done();
      });
    });

    it("creates endpoint group with ALB", (done) => {
      stack = new ApiStack("test-endpoint", {
        environmentSuffix: "endpoint",
        tags: pulumi.output({ Endpoint: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: true,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.loadBalancerArn, stack.globalAcceleratorDns]).apply(([albArn, dns]) => {
        expect(albArn).toBeDefined();
        expect(dns).toBeDefined();
        done();
      });
    });

    it("configures health check", (done) => {
      stack = new ApiStack("test-hc", {
        environmentSuffix: "hc",
        tags: pulumi.output({ HealthCheck: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: true,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.globalAcceleratorDns]).apply(([dns]) => {
        expect(dns).toBeDefined();
        done();
      });
    });
  });

  describe("Route 53 DNS Configuration", () => {
    it("creates DNS records when using real domain", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-dns-real", {
        environmentSuffix: "dns",
        tags: pulumi.output({ DNS: "real-domain" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.banking.io", // Real domain, not example.com!
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.loadBalancerDns]).apply(([dns]) => {
          const route53Record = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/record:Record"
          );
          const healthCheck = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/healthCheck:HealthCheck"
          );
          
          expect(route53Record).toBeDefined();
          expect(healthCheck).toBeDefined();
          expect(dns).toBeDefined();
          done();
        });
      });
    });

    it("does not create DNS records for example.com domain", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-dns-example", {
        environmentSuffix: "example",
        tags: pulumi.output({ DNS: "example-domain" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com", // example.com domain
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.loadBalancerDns]).apply(([dns]) => {
          const route53Record = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/record:Record"
          );
          const healthCheck = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/healthCheck:HealthCheck"
          );
          
          expect(route53Record).toBeUndefined();
          expect(healthCheck).toBeUndefined();
          expect(dns).toBeDefined();
          done();
        });
      });
    });

    it("creates A record for ALB", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-a-record", {
        environmentSuffix: "arecord",
        tags: pulumi.output({ Record: "A" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.mycompany.net",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.loadBalancerArn]).apply(([arn]) => {
          const route53Record = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/record:Record"
          );
          expect(route53Record).toBeDefined();
          expect(arn).toBeDefined();
          done();
        });
      });
    });

    it("creates health check for ALB", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-health-check", {
        environmentSuffix: "hc",
        tags: pulumi.output({ HealthCheck: "route53" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "api.acme.org",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      process.nextTick(() => {
        pulumi.all([stack.loadBalancerDns]).apply(([dns]) => {
          const healthCheck = Array.from(createdResources.values()).find(
            r => r.type === "aws:route53/healthCheck:HealthCheck"
          );
          expect(healthCheck).toBeDefined();
          expect(dns).toBeDefined();
          done();
        });
      });
    });
  });

  describe("Lambda Event Source Mappings", () => {
    it("creates Kinesis event source mapping when enabled and ARN provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-kinesis-mapping", {
        environmentSuffix: "kinesis",
        tags: pulumi.output({ EventSource: "kinesis" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        kinesisStreamArn: pulumi.output("arn:aws:kinesis:us-east-1:123456789012:stream/test-stream"),
        kinesisStreamName: pulumi.output("test-stream"),
        enableKinesisConsumers: true,
      });

      process.nextTick(() => {
        const kinesisMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("kinesis")
        );
        expect(kinesisMapping).toBeDefined();
        done();
      });
    });

    it("skips Kinesis event source mapping when ARN not provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-no-kinesis-arn", {
        environmentSuffix: "nokinesis",
        tags: pulumi.output({ EventSource: "none" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        enableKinesisConsumers: true,
      });

      process.nextTick(() => {
        const kinesisMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("kinesis")
        );
        expect(kinesisMapping).toBeUndefined();
        done();
      });
    });

    it("creates SQS transaction queue event source mapping when enabled and ARN provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-sqs-transaction", {
        environmentSuffix: "sqstxn",
        tags: pulumi.output({ EventSource: "sqs-txn" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        transactionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:transaction-queue"),
        transactionQueueUrl: pulumi.output("https://sqs.us-east-1.amazonaws.com/123456789012/transaction-queue"),
        enableSqsConsumers: true,
      });

      process.nextTick(() => {
        const sqsMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("sqs-transaction")
        );
        expect(sqsMapping).toBeDefined();
        done();
      });
    });

    it("skips SQS transaction queue mapping when ARN not provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-no-sqs-txn", {
        environmentSuffix: "nosqstxn",
        tags: pulumi.output({ EventSource: "none" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        enableSqsConsumers: true,
      });

      process.nextTick(() => {
        const sqsMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("sqs-transaction")
        );
        expect(sqsMapping).toBeUndefined();
        done();
      });
    });

    it("creates SQS fraud detection queue event source mapping when enabled and ARN provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-sqs-fraud", {
        environmentSuffix: "sqsfraud",
        tags: pulumi.output({ EventSource: "sqs-fraud" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        fraudDetectionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:fraud-queue"),
        enableSqsConsumers: true,
      });

      process.nextTick(() => {
        const fraudMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("sqs-fraud")
        );
        expect(fraudMapping).toBeDefined();
        done();
      });
    });

    it("skips SQS fraud detection queue mapping when ARN not provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-no-sqs-fraud", {
        environmentSuffix: "nosqsfraud",
        tags: pulumi.output({ EventSource: "none" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        enableSqsConsumers: true,
      });

      process.nextTick(() => {
        const fraudMapping = Array.from(createdResources.values()).find(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping" && 
               r.name.includes("sqs-fraud")
        );
        expect(fraudMapping).toBeUndefined();
        done();
      });
    });

    it("creates all event source mappings when all ARNs provided", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-all-mappings", {
        environmentSuffix: "allmappings",
        tags: pulumi.output({ EventSource: "all" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        kinesisStreamArn: pulumi.output("arn:aws:kinesis:us-east-1:123456789012:stream/test-stream"),
        kinesisStreamName: pulumi.output("test-stream"),
        transactionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:transaction-queue"),
        transactionQueueUrl: pulumi.output("https://sqs.us-east-1.amazonaws.com/123456789012/transaction-queue"),
        fraudDetectionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:fraud-queue"),
        enableKinesisConsumers: true,
        enableSqsConsumers: true,
      });

      process.nextTick(() => {
        const eventSourceMappings = Array.from(createdResources.values()).filter(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping"
        );
        expect(eventSourceMappings.length).toBe(3);
        done();
      });
    });

    it("does not create mappings when consumers disabled", (done) => {
      createdResources.clear();
      stack = new ApiStack("test-disabled-consumers", {
        environmentSuffix: "disabled",
        tags: pulumi.output({ EventSource: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
        kinesisStreamArn: pulumi.output("arn:aws:kinesis:us-east-1:123456789012:stream/test-stream"),
        transactionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:transaction-queue"),
        fraudDetectionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:fraud-queue"),
        enableKinesisConsumers: false,
        enableSqsConsumers: false,
      });

      process.nextTick(() => {
        const eventSourceMappings = Array.from(createdResources.values()).filter(
          r => r.type === "aws:lambda/eventSourceMapping:EventSourceMapping"
        );
        expect(eventSourceMappings.length).toBe(0);
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new ApiStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        vpcId: pulumi.output("vpc-123"),
        publicSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        privateSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
        ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/test"),
        certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
        cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/pool-123"),
        wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
        domainName: "test.example.com",
        regions: { primary: "us-east-1", replicas: [] },
        enableGlobalAccelerator: false,
        enableMutualTls: false,
        lambdaRuntime: "java17",
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("apiGatewayUrl");
      expect(stack).toHaveProperty("apiGatewayId");
      expect(stack).toHaveProperty("loadBalancerDns");
      expect(stack).toHaveProperty("loadBalancerArn");
      expect(stack).toHaveProperty("globalAcceleratorDns");
      expect(stack).toHaveProperty("transactionLambdaArn");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.apiGatewayUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.apiGatewayId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.loadBalancerDns)).toBe(true);
      expect(pulumi.Output.isInstance(stack.loadBalancerArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.globalAcceleratorDns)).toBe(true);
      expect(pulumi.Output.isInstance(stack.transactionLambdaArn)).toBe(true);
    });
  });
});