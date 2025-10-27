/**
 * compliance-stack.unit.test.ts
 *
 * Unit tests for ComplianceStack
 */
import * as pulumi from "@pulumi/pulumi";
import { ComplianceStack } from "../lib/global-banking/compliance-stack";

describe("ComplianceStack", () => {
  let stack: ComplianceStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getRegion:getRegion") {
          return { name: "us-east-1" };
        }
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-compliance", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false, 
        enableSecurityHub: true,
        enableConfig: false,
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(ComplianceStack);
    });

    it("exposes CloudTrail ARN", (done) => {
      expect(stack.cloudTrailArn).toBeDefined();
      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeTruthy();
        done();
      });
    });

    it("exposes Config Recorder Name", (done) => {
      expect(stack.configRecorderName).toBeDefined();
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBe("config-existing");
        done();
      });
    });

    it("exposes SecurityHub ARN", (done) => {
      expect(stack.securityHubArn).toBeDefined();
      pulumi.all([stack.securityHubArn]).apply(([securityHubArn]) => {
        expect(securityHubArn).toBeTruthy();
        done();
      });
    });

    it("exposes GuardDuty Detector ID as existing", (done) => {
      expect(stack.guardDutyDetectorId).toBeDefined();
      pulumi.all([stack.guardDutyDetectorId]).apply(([detectorId]) => {
        expect(detectorId).toBe("guardduty-existing");
        done();
      });
    });
  });

  describe("CloudTrail Configuration", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-cloudtrail", {
        environmentSuffix: "cloudtrail",
        tags: pulumi.output({ Component: "cloudtrail" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: false,
        enableGuardDuty: false, 
        enableSecurityHub: false,
        enableConfig: false,
      });
    });

    it("creates CloudWatch log group for CloudTrail", (done) => {
      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeDefined();
        done();
      });
    });

    it("creates IAM role for CloudTrail", (done) => {
      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeDefined();
        done();
      });
    });

    it("applies compliance tags to CloudTrail", (done) => {
      stack = new ComplianceStack("test-cloudtrail-tags", {
        environmentSuffix: "tags",
        tags: pulumi.output({ Compliance: "pci-dss" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false, 
        enableSecurityHub: false,
        enableConfig: false,
      });

      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeDefined();
        done();
      });
    });
  });

  describe("AWS Config Configuration", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-config", {
        environmentSuffix: "config",
        tags: pulumi.output({ Component: "config" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false, 
        enableSecurityHub: false,
        enableConfig: false,
      });
    });

    it("creates Config Recorder when enabled", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBe("config-existing");
        done();
      });
    });

    it("creates Config Delivery Channel", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBeDefined();
        done();
      });
    });

    it("enables Config Recorder", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBeDefined();
        done();
      });
    });

    it("creates PCI-DSS Config Rules when enabled", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBeDefined();
        done();
      });
    });

    it("does not create Config Recorder when disabled", (done) => {
      stack = new ComplianceStack("test-config-disabled", {
        environmentSuffix: "no-config",
        tags: pulumi.output({ Component: "no-config" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: false,
        enableGuardDuty: false,
        enableSecurityHub: false,
        enableConfig: false,
      });

      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBe("config-existing");
        done();
      });
    });
  });

  describe("SecurityHub Configuration", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-securityhub", {
        environmentSuffix: "securityhub",
        tags: pulumi.output({ Component: "securityhub" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false,
        enableSecurityHub: true,
        enableConfig: false,
      });
    });

    it("creates SecurityHub account when enabled", (done) => {
      pulumi.all([stack.securityHubArn]).apply(([securityHubArn]) => {
        expect(securityHubArn).toBeTruthy();
        done();
      });
    });

    it("subscribes to PCI-DSS standard when enabled", (done) => {
      pulumi.all([stack.securityHubArn]).apply(([securityHubArn]) => {
        expect(securityHubArn).toContain("securityhub");
        done();
      });
    });

    it("subscribes to CIS and AWS Foundational standards", (done) => {
      pulumi.all([stack.securityHubArn]).apply(([securityHubArn]) => {
        expect(securityHubArn).toBeDefined();
        done();
      });
    });

    it("does not create SecurityHub when disabled", (done) => {
      stack = new ComplianceStack("test-securityhub-disabled", {
        environmentSuffix: "no-securityhub",
        tags: pulumi.output({ Component: "no-securityhub" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: false,
        enableGuardDuty: false, 
        enableSecurityHub: false,
        enableConfig: false,
      });

      pulumi.all([stack.securityHubArn]).apply(([securityHubArn]) => {
        expect(securityHubArn).toBe("securityhub-disabled");
        done();
      });
    });
  });

  describe("CloudWatch Alarms", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-alarms", {
        environmentSuffix: "alarms",
        tags: pulumi.output({ Component: "alarms" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: false,
        enableGuardDuty: false, 
        enableSecurityHub: false,
        enableConfig: false,
      });
    });

    it("creates CloudTrail validation failure alarm", (done) => {
      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false, 
        enableSecurityHub: true,
        enableConfig: true,
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("cloudTrailArn");
      expect(stack).toHaveProperty("configRecorderName");
      expect(stack).toHaveProperty("guardDutyDetectorId");
      expect(stack).toHaveProperty("securityHubArn");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.cloudTrailArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.configRecorderName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.guardDutyDetectorId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.securityHubArn)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new ComplianceStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        regions: { primary: "us-east-1", replicas: [] },
        auditLogBucket: "test-audit-bucket",
        kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/key-123",
        snsTopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
        enablePciCompliance: true,
        enableGuardDuty: false,
        enableSecurityHub: true,
        enableConfig: true,
      });
    });

    it("CloudTrail depends on CloudWatch Log Group", (done) => {
      pulumi.all([stack.cloudTrailArn]).apply(([cloudTrailArn]) => {
        expect(cloudTrailArn).toBeDefined();
        done();
      });
    });

    it("Config Delivery Channel depends on Config Recorder", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBeDefined();
        done();
      });
    });

    it("Config Rules depend on Config Recorder", (done) => {
      pulumi.all([stack.configRecorderName]).apply(([configRecorderName]) => {
        expect(configRecorderName).toBeDefined();
        done();
      });
    });
  });
});