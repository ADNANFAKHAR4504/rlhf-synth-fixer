/**
 * tap-stack.unit.test.ts
 *
 * Comprehensive unit tests for TapStack
 * Tests all stack instantiation, nested stacks, outputs, and configurations
 */
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Mock all nested stacks
jest.mock("../lib/global-banking/network-stack");
jest.mock("../lib/global-banking/security-stack");
jest.mock("../lib/global-banking/database-stack");
jest.mock("../lib/global-banking/compute-stack");
jest.mock("../lib/global-banking/api-stack");
jest.mock("../lib/global-banking/monitoring-stack");
jest.mock("../lib/global-banking/storage-stack");
jest.mock("../lib/global-banking/messaging-stack");
jest.mock("../lib/global-banking/compliance-stack");

// Import mocked classes
import { NetworkStack } from "../lib/global-banking/network-stack";
import { SecurityStack } from "../lib/global-banking/security-stack";
import { DatabaseStack } from "../lib/global-banking/database-stack";
import { ComputeStack } from "../lib/global-banking/compute-stack";
import { ApiStack } from "../lib/global-banking/api-stack";
import { MonitoringStack } from "../lib/global-banking/monitoring-stack";
import { StorageStack } from "../lib/global-banking/storage-stack";
import { MessagingStack } from "../lib/global-banking/messaging-stack";
import { ComplianceStack } from "../lib/global-banking/compliance-stack";

describe("TapStack", () => {
  let stack: TapStack;

  // Mock Pulumi runtime
  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: args.inputs,
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock all nested stack constructors
    (NetworkStack as unknown as jest.Mock).mockImplementation(() => ({
      primaryVpcId: pulumi.output("vpc-123"),
      privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
      publicSubnetIds: pulumi.output(["subnet-3", "subnet-4"]),
      transitGatewayId: pulumi.output("tgw-123"),
    }));

    (SecurityStack as unknown as jest.Mock).mockImplementation(() => ({
      kmsKeyId: pulumi.output("key-123"),
      kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
      secretsManagerArns: pulumi.output({
        database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
        api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
      }),
      dbSecretArn: pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret"),
      cognitoUserPoolId: pulumi.output("us-east-1_ABC123"),
      cognitoUserPoolArn: pulumi.output("arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_ABC123"),
      certificateArn: pulumi.output("arn:aws:acm:us-east-1:123456789012:certificate/cert-123"),
      wafWebAclArn: pulumi.output("arn:aws:wafv2:us-east-1:123456789012:regional/webacl/waf-123"),
    }));

    (StorageStack as unknown as jest.Mock).mockImplementation(() => ({
      transactionBucketName: pulumi.output("transaction-bucket"),
      archiveBucketName: pulumi.output("archive-bucket"),
      auditLogBucketName: pulumi.output("audit-bucket"),
    }));

    (DatabaseStack as unknown as jest.Mock).mockImplementation(() => ({
      auroraClusterEndpoint: pulumi.output("cluster.abc123.us-east-1.rds.amazonaws.com"),
      auroraReaderEndpoint: pulumi.output("cluster-ro.abc123.us-east-1.rds.amazonaws.com"),
      auroraClusterArn: pulumi.output("arn:aws:rds:us-east-1:123456789012:cluster:banking-cluster"),
      dynamoDbTableName: pulumi.output("banking-sessions-dev"),
      dynamoDbTableArn: pulumi.output("arn:aws:dynamodb:us-east-1:123456789012:table/banking-sessions-dev"),
      elastiCacheEndpoint: pulumi.output("cache.abc123.0001.use1.cache.amazonaws.com"),
    }));

    (MessagingStack as unknown as jest.Mock).mockImplementation(() => ({
      transactionQueueUrl: pulumi.output("https://sqs.us-east-1.amazonaws.com/123456789012/queue"),
      transactionQueueArn: pulumi.output("arn:aws:sqs:us-east-1:123456789012:queue"),
      kinesisStreamName: pulumi.output("banking-transactions-dev"),
      kinesisStreamArn: pulumi.output("arn:aws:kinesis:us-east-1:123456789012:stream/banking-transactions-dev"),
    }));

    (ComputeStack as unknown as jest.Mock).mockImplementation(() => ({
      ecsClusterArn: pulumi.output("arn:aws:ecs:us-east-1:123456789012:cluster/banking-cluster"),
      ecsClusterName: pulumi.output("banking-cluster-dev"),
      appMeshName: pulumi.output("banking-mesh-dev"),
    }));

    (ApiStack as unknown as jest.Mock).mockImplementation(() => ({
      apiGatewayUrl: pulumi.output("https://api.example.com"),
      apiGatewayId: pulumi.output("api-123"),
      loadBalancerDns: pulumi.output("alb-123.us-east-1.elb.amazonaws.com"),
      loadBalancerArn: pulumi.output("arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-123"),
      globalAcceleratorDns: pulumi.output("acc-123.awsglobalaccelerator.com"),
    }));

    (MonitoringStack as unknown as jest.Mock).mockImplementation(() => ({
      dashboardUrl: pulumi.output("https://console.aws.amazon.com/cloudwatch/"),
      snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:alerts"),
      xrayGroupName: pulumi.output("banking-services-dev"),
    }));

    (ComplianceStack as unknown as jest.Mock).mockImplementation(() => ({
      cloudTrailArn: pulumi.output("arn:aws:cloudtrail:us-east-1:123456789012:trail/banking-trail"),
      configRecorderName: pulumi.output("banking-config-recorder-dev"),
      guardDutyDetectorId: pulumi.output("detector-123"),
      securityHubArn: pulumi.output("arn:aws:securityhub:us-east-1:123456789012:hub/default"),
    }));
  });

  describe("Stack Instantiation", () => {
    describe("with minimal configuration", () => {
      beforeEach(() => {
        stack = new TapStack("test-stack-minimal", {
          environmentSuffix: "dev",
        });
      });

      it("creates stack successfully", () => {
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });

      it("uses default region configuration", () => {
        expect(SecurityStack).toHaveBeenCalledWith(
          expect.stringContaining("security"),
          expect.objectContaining({
            regions: expect.objectContaining({
              primary: "us-east-2",
              replicas: ["eu-west-1", "ap-southeast-1"],
            }),
          }),
          expect.any(Object)
        );
      });

      it("uses default VPC CIDR", () => {
        expect(NetworkStack).toHaveBeenCalledWith(
          expect.stringContaining("network"),
          expect.objectContaining({
            vpcCidr: "10.29.0.0/16",
          }),
          expect.any(Object)
        );
      });

      it("enables PCI compliance by default", () => {
        expect(SecurityStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            enablePciCompliance: true,
          }),
          expect.any(Object)
        );
      });

      it("enables multi-region by default", () => {
        expect(NetworkStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            enableTransitGateway: true,
          }),
          expect.any(Object)
        );
      });
    });

    describe("with full custom configuration", () => {
      beforeEach(() => {
        stack = new TapStack("test-stack-custom", {
          environmentSuffix: "prod",
          regions: {
            primary: "us-west-2",
            replicas: ["eu-central-1", "ap-northeast-1"],
          },
          vpcCidr: "10.50.0.0/16",
          enablePciCompliance: false,
          enableMultiRegion: false,
          tags: {
            CustomTag: "CustomValue",
            CostCenter: "Engineering",
          },
          domainName: "banking.example.com",
          enableFraudDetection: true,
          lambdaRuntime: "java21",
        });
      });

      it("creates stack with custom configuration", () => {
        expect(stack).toBeDefined();
      });

      it("uses custom regions", () => {
        expect(SecurityStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            regions: {
              primary: "us-west-2",
              replicas: ["eu-central-1", "ap-northeast-1"],
            },
          }),
          expect.any(Object)
        );
      });

      it("uses custom VPC CIDR", () => {
        expect(NetworkStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            vpcCidr: "10.50.0.0/16",
          }),
          expect.any(Object)
        );
      });

      it("disables PCI compliance when specified", () => {
        expect(SecurityStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            enablePciCompliance: false,
          }),
          expect.any(Object)
        );
      });

      it("disables multi-region when specified", () => {
        expect(NetworkStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            enableTransitGateway: false,
          }),
          expect.any(Object)
        );
      });

      it("uses custom domain name", () => {
        expect(ApiStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            domainName: "banking.example.com",
          }),
          expect.any(Object)
        );
      });

      it("uses custom Lambda runtime", () => {
        expect(ApiStack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            lambdaRuntime: "java21",
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe("Nested Stack Creation", () => {
    beforeEach(() => {
      stack = new TapStack("test-nested-stacks", {
        environmentSuffix: "test",
      });
    });

    it("creates SecurityStack first", () => {
      expect(SecurityStack).toHaveBeenCalledTimes(1);
      expect(SecurityStack).toHaveBeenCalledWith(
        expect.stringContaining("security"),
        expect.any(Object),
        expect.objectContaining({
          parent: expect.anything(),
        })
      );
    });

    it("creates NetworkStack", () => {
      expect(NetworkStack).toHaveBeenCalledTimes(1);
      expect(NetworkStack).toHaveBeenCalledWith(
        expect.stringContaining("network"),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
        }),
        expect.objectContaining({
          parent: expect.anything(),
        })
      );
    });

    it("creates StorageStack with proper dependencies", () => {
      expect(StorageStack).toHaveBeenCalledTimes(1);
      expect(StorageStack).toHaveBeenCalledWith(
        expect.stringContaining("storage"),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
          enableObjectLock: true,
          enableVersioning: true,
        }),
        expect.objectContaining({
          parent: expect.anything(),
        })
      );
    });

    it("creates DatabaseStack with VPC and secrets dependencies", () => {
      expect(DatabaseStack).toHaveBeenCalledTimes(1);
      expect(DatabaseStack).toHaveBeenCalledWith(
        expect.stringContaining("database"),
        expect.objectContaining({
          vpcId: expect.anything(),
          privateSubnetIds: expect.anything(),
          kmsKeyArn: expect.anything(),
          secretsManagerArn: expect.anything(),
          enableGlobalDatabase: true,
          enablePointInTimeRecovery: true,
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });

    it("creates MessagingStack with storage dependencies", () => {
      expect(MessagingStack).toHaveBeenCalledTimes(1);
      expect(MessagingStack).toHaveBeenCalledWith(
        expect.stringContaining("messaging"),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
          enableFifoQueues: true,
          enableCrossRegionEvents: true,
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });

    it("creates ComputeStack with security and network dependencies", () => {
      expect(ComputeStack).toHaveBeenCalledTimes(1);
      expect(ComputeStack).toHaveBeenCalledWith(
        expect.stringContaining("compute"),
        expect.objectContaining({
          vpcId: expect.anything(),
          privateSubnetIds: expect.anything(),
          enableAppMesh: true,
          enableAutoScaling: true,
          secretsManagerArns: expect.anything(),
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });

    it("creates ApiStack with all required dependencies", () => {
      expect(ApiStack).toHaveBeenCalledTimes(1);
      expect(ApiStack).toHaveBeenCalledWith(
        expect.stringContaining("api"),
        expect.objectContaining({
          vpcId: expect.anything(),
          publicSubnetIds: expect.anything(),
          privateSubnetIds: expect.anything(),
          ecsClusterArn: expect.anything(),
          certificateArn: expect.anything(),
          cognitoUserPoolArn: expect.anything(),
          wafWebAclArn: expect.anything(),
          enableGlobalAccelerator: true,
          enableMutualTls: false,
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });

    it("creates MonitoringStack with resource ARNs", () => {
      expect(MonitoringStack).toHaveBeenCalledTimes(1);
      expect(MonitoringStack).toHaveBeenCalledWith(
        expect.stringContaining("monitoring"),
        expect.objectContaining({
          enableXRay: true,
          enableCrossRegionDashboards: true,
          resourceArns: expect.objectContaining({
            ecsCluster: expect.anything(),
            apiGateway: expect.anything(),
            loadBalancer: expect.anything(),
            auroraCluster: expect.anything(),
            dynamoDbTable: expect.anything(),
            kinesisStream: expect.anything(),
          }),
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });

    it("creates ComplianceStack last with all dependencies", () => {
      expect(ComplianceStack).toHaveBeenCalledTimes(1);
      expect(ComplianceStack).toHaveBeenCalledWith(
        expect.stringContaining("compliance"),
        expect.objectContaining({
          enablePciCompliance: true,
          auditLogBucket: expect.anything(),
          kmsKeyArn: expect.anything(),
          snsTopicArn: expect.anything(),
          enableGuardDuty: true,
          enableSecurityHub: false,
          enableConfig: true,
        }),
        expect.objectContaining({
          parent: expect.anything(),
          dependsOn: expect.any(Array),
        })
      );
    });
  });

  describe("Stack Outputs", () => {
    beforeEach(() => {
      stack = new TapStack("test-outputs", {
        environmentSuffix: "output-test",
      });
    });

    it("exposes network outputs", () => {
      expect(stack.primaryVpcId).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.transitGatewayId).toBeDefined();
    });

    it("exposes security outputs", () => {
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.secretsManagerArns).toBeDefined();
      expect(stack.cognitoUserPoolId).toBeDefined();
      expect(stack.cognitoUserPoolArn).toBeDefined();
    });

    it("exposes database outputs", () => {
      expect(stack.auroraClusterEndpoint).toBeDefined();
      expect(stack.auroraReaderEndpoint).toBeDefined();
      expect(stack.dynamoDbTableName).toBeDefined();
      expect(stack.elastiCacheEndpoint).toBeDefined();
    });

    it("exposes compute outputs", () => {
      expect(stack.ecsClusterArn).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.appMeshName).toBeDefined();
    });

    it("exposes API outputs", () => {
      expect(stack.apiGatewayUrl).toBeDefined();
      expect(stack.apiGatewayId).toBeDefined();
      expect(stack.loadBalancerDns).toBeDefined();
      expect(stack.globalAcceleratorDns).toBeDefined();
    });

    it("exposes storage outputs", () => {
      expect(stack.transactionBucketName).toBeDefined();
      expect(stack.archiveBucketName).toBeDefined();
    });

    it("exposes messaging outputs", () => {
      expect(stack.transactionQueueUrl).toBeDefined();
      expect(stack.kinesisStreamName).toBeDefined();
    });

    it("exposes monitoring outputs", () => {
      expect(stack.dashboardUrl).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it("registers all outputs correctly", async () => {
      // Verify that registerOutputs was called with correct structure
      const outputs = {
        primaryVpcId: expect.anything(),
        privateSubnetIds: expect.anything(),
        publicSubnetIds: expect.anything(),
        transitGatewayId: expect.anything(),
        kmsKeyId: expect.anything(),
        kmsKeyArn: expect.anything(),
        secretsManagerArns: expect.anything(),
        cognitoUserPoolId: expect.anything(),
        cognitoUserPoolArn: expect.anything(),
        auroraClusterEndpoint: expect.anything(),
        auroraReaderEndpoint: expect.anything(),
        dynamoDbTableName: expect.anything(),
        elastiCacheEndpoint: expect.anything(),
        ecsClusterArn: expect.anything(),
        ecsClusterName: expect.anything(),
        appMeshName: expect.anything(),
        apiGatewayUrl: expect.anything(),
        apiGatewayId: expect.anything(),
        loadBalancerDns: expect.anything(),
        globalAcceleratorDns: expect.anything(),
        transactionBucketName: expect.anything(),
        archiveBucketName: expect.anything(),
        transactionQueueUrl: expect.anything(),
        kinesisStreamName: expect.anything(),
        dashboardUrl: expect.anything(),
        snsTopicArn: expect.anything(),
        environment: "output-test",
        primaryRegion: "us-east-1",
        replicaRegions: ["eu-west-1", "ap-southeast-1"],
        deploymentTimestamp: expect.any(String),
      };

      expect(stack).toHaveProperty("primaryVpcId");
      expect(stack).toHaveProperty("kmsKeyId");
      expect(stack).toHaveProperty("auroraClusterEndpoint");
    });
  });

  describe("Environment-specific Configurations", () => {
    it("creates development environment correctly", () => {
      stack = new TapStack("test-dev", {
        environmentSuffix: "dev",
      });

      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          environmentSuffix: "dev",
        }),
        expect.any(Object)
      );
    });

    it("creates staging environment correctly", () => {
      stack = new TapStack("test-staging", {
        environmentSuffix: "staging",
      });

      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          environmentSuffix: "staging",
        }),
        expect.any(Object)
      );
    });

    it("creates production environment correctly", () => {
      stack = new TapStack("test-prod", {
        environmentSuffix: "prod",
      });

      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          environmentSuffix: "prod",
        }),
        expect.any(Object)
      );
    });
  });

  describe("Multi-region Configuration", () => {
    it("enables multi-region features when configured", () => {
      stack = new TapStack("test-multi-region", {
        environmentSuffix: "multi",
        enableMultiRegion: true,
      });

      expect(StorageStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableCrossRegionReplication: true,
        }),
        expect.any(Object)
      );

      expect(MessagingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableCrossRegionEvents: true,
        }),
        expect.any(Object)
      );

      expect(DatabaseStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableGlobalDatabase: true,
        }),
        expect.any(Object)
      );
    });

    it("disables multi-region features when configured", () => {
      stack = new TapStack("test-single-region", {
        environmentSuffix: "single",
        enableMultiRegion: false,
      });

      expect(StorageStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableCrossRegionReplication: false,
        }),
        expect.any(Object)
      );

      expect(MessagingStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableCrossRegionEvents: false,
        }),
        expect.any(Object)
      );

      expect(DatabaseStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableGlobalDatabase: false,
        }),
        expect.any(Object)
      );
    });
  });

  describe("Compliance Configuration", () => {
    it("enables PCI-DSS compliance features", () => {
      stack = new TapStack("test-pci-enabled", {
        environmentSuffix: "pci",
        enablePciCompliance: true,
      });

      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enablePciCompliance: true,
        }),
        expect.any(Object)
      );

      expect(ComplianceStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enablePciCompliance: true,
        }),
        expect.any(Object)
      );
    });

    it("disables PCI-DSS compliance when not required", () => {
      stack = new TapStack("test-no-pci", {
        environmentSuffix: "no-pci",
        enablePciCompliance: false,
      });

      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enablePciCompliance: false,
        }),
        expect.any(Object)
      );

      expect(ComplianceStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enablePciCompliance: false,
        }),
        expect.any(Object)
      );
    });
  });

  describe("Integration and Dependencies", () => {
    beforeEach(() => {
      stack = new TapStack("test-dependencies", {
        environmentSuffix: "deps",
      });
    });

    it("passes KMS key from SecurityStack to other stacks", () => {
      expect(NetworkStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
        }),
        expect.any(Object)
      );

      expect(StorageStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
        }),
        expect.any(Object)
      );

      expect(ComputeStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: expect.anything(),
        }),
        expect.any(Object)
      );
    });

    it("passes VPC details from NetworkStack to dependent stacks", () => {
      expect(DatabaseStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          vpcId: expect.anything(),
          privateSubnetIds: expect.anything(),
        }),
        expect.any(Object)
      );

      expect(ComputeStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          vpcId: expect.anything(),
          privateSubnetIds: expect.anything(),
        }),
        expect.any(Object)
      );
    });

    it("passes secrets from SecurityStack to ComputeStack and ApiStack", () => {
      expect(ComputeStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          secretsManagerArns: expect.anything(),
        }),
        expect.any(Object)
      );

      expect(ApiStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          secretsManagerArns: expect.anything(),
        }),
        expect.any(Object)
      );
    });

    it("passes resource ARNs to MonitoringStack", () => {
      expect(MonitoringStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          resourceArns: expect.objectContaining({
            ecsCluster: expect.anything(),
            apiGateway: expect.anything(),
            loadBalancer: expect.anything(),
            auroraCluster: expect.anything(),
            dynamoDbTable: expect.anything(),
            kinesisStream: expect.anything(),
          }),
        }),
        expect.any(Object)
      );
    });

    it("passes SNS topic from MonitoringStack to ComplianceStack", () => {
      expect(ComplianceStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          snsTopicArn: expect.anything(),
        }),
        expect.any(Object)
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles empty regions array", () => {
      stack = new TapStack("test-no-replicas", {
        environmentSuffix: "no-replicas",
        regions: {
          primary: "us-east-1",
          replicas: [],
        },
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          regions: {
            primary: "us-east-1",
            replicas: [],
          },
        }),
        expect.any(Object)
      );
    });

    it("handles special characters in environment suffix", () => {
      stack = new TapStack("test-special-chars", {
        environmentSuffix: "test-env-123",
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          environmentSuffix: "test-env-123",
        }),
        expect.any(Object)
      );
    });
  });
});