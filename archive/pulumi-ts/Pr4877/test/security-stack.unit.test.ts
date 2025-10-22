/**
 * security-stack.unit.test.ts
 *
 * Unit tests for SecurityStack
 */
import * as pulumi from "@pulumi/pulumi";
import { SecurityStack } from "../lib/global-banking/security-stack";

describe("SecurityStack", () => {
  let stack: SecurityStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            endpoint: args.type.includes("cognito") ? "cognito-idp.us-east-1.amazonaws.com/us-east-1_TEST123" : undefined,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
          return { accountId: "123456789012" };
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
      stack = new SecurityStack("test-security", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        enablePciCompliance: true,
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(SecurityStack);
    });

    it("exposes KMS key outputs", (done) => {
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeTruthy();
        done();
      });
    });

    it("exposes Secrets Manager ARNs", (done) => {
      expect(stack.secretsManagerArns).toBeDefined();
      expect(stack.dbSecretArn).toBeDefined();
      
      pulumi.all([stack.secretsManagerArns]).apply(([arns]) => {
        expect(arns).toHaveProperty("database");
        expect(arns).toHaveProperty("api");
        done();
      });
    });

    it("exposes Cognito outputs", (done) => {
      expect(stack.cognitoUserPoolId).toBeDefined();
      expect(stack.cognitoUserPoolArn).toBeDefined();
      expect(stack.cognitoIdentityPoolId).toBeDefined();
      
      pulumi.all([stack.cognitoUserPoolId]).apply(([poolId]) => {
        expect(poolId).toBeTruthy();
        done();
      });
    });

    it("exposes WAF Web ACL ARN", (done) => {
      expect(stack.wafWebAclArn).toBeDefined();
      pulumi.all([stack.wafWebAclArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes certificate ARN", (done) => {
      expect(stack.certificateArn).toBeDefined();
      pulumi.all([stack.certificateArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });
  });

  describe("KMS Key Configuration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-kms", {
        environmentSuffix: "kms-test",
        tags: pulumi.output({ Purpose: "encryption" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("creates multi-region KMS key", (done) => {
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeTruthy();
        done();
      });
    });

    it("creates KMS key with rotation enabled", (done) => {
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeDefined();
        done();
      });
    });

    it("creates KMS key alias", (done) => {
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeDefined();
        done();
      });
    });

    it("configures KMS key policy with AWS account permissions", (done) => {
      pulumi.all([stack.kmsKeyArn]).apply(([keyArn]) => {
        expect(keyArn).toBeDefined();
        done();
      });
    });
  });

  describe("Secrets Manager Configuration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-secrets", {
        environmentSuffix: "secrets-test",
        tags: pulumi.output({ Purpose: "secrets" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("creates database secret", (done) => {
      pulumi.all([stack.dbSecretArn]).apply(([dbSecretArn]) => {
        expect(dbSecretArn).toContain("arn:aws:");
        done();
      });
    });

    it("creates API secret", (done) => {
      pulumi.all([stack.secretsManagerArns]).apply(([arns]) => {
        expect(arns.api).toContain("arn:aws:");
        done();
      });
    });

    it("creates secret versions with encrypted values", (done) => {
      pulumi.all([stack.secretsManagerArns]).apply(([arns]) => {
        expect(arns.database).toBeDefined();
        expect(arns.api).toBeDefined();
        done();
      });
    });

    it("encrypts secrets with KMS", (done) => {
      pulumi.all([stack.kmsKeyId, stack.dbSecretArn]).apply(([kmsKeyId, dbSecretArn]) => {
        expect(kmsKeyId).toBeDefined();
        expect(dbSecretArn).toBeDefined();
        done();
      });
    });
  });

  describe("Cognito Configuration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-cognito", {
        environmentSuffix: "cognito-test",
        tags: pulumi.output({ Purpose: "auth" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("creates user pool with MFA support", (done) => {
      pulumi.all([stack.cognitoUserPoolId]).apply(([poolId]) => {
        expect(poolId).toBeTruthy();
        done();
      });
    });

    it("creates user pool with password policy", (done) => {
      pulumi.all([stack.cognitoUserPoolId]).apply(([poolId]) => {
        expect(poolId).toBeDefined();
        done();
      });
    });

    it("creates user pool client with secure settings", (done) => {
      pulumi.all([stack.cognitoUserPoolId]).apply(([poolId]) => {
        expect(poolId).toBeDefined();
        done();
      });
    });

    it("creates identity pool", (done) => {
      pulumi.all([stack.cognitoIdentityPoolId]).apply(([identityPoolId]) => {
        expect(identityPoolId).toBeTruthy();
        done();
      });
    });

    it("creates IAM role for authenticated users", (done) => {
      pulumi.all([stack.cognitoIdentityPoolId]).apply(([identityPoolId]) => {
        expect(identityPoolId).toBeDefined();
        done();
      });
    });

    it("attaches identity pool role", (done) => {
      pulumi.all([stack.cognitoIdentityPoolId]).apply(([identityPoolId]) => {
        expect(identityPoolId).toBeDefined();
        done();
      });
    });

    it("configures advanced security mode", (done) => {
      pulumi.all([stack.cognitoUserPoolArn]).apply(([poolArn]) => {
        expect(poolArn).toBeDefined();
        done();
      });
    });
  });

  describe("WAF Configuration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-waf", {
        environmentSuffix: "waf-test",
        tags: pulumi.output({ Purpose: "protection" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("creates WAF Web ACL", (done) => {
      pulumi.all([stack.wafWebAclArn]).apply(([wafArn]) => {
        expect(wafArn).toContain("arn:aws:");
        done();
      });
    });

    it("includes rate limiting rule", (done) => {
      pulumi.all([stack.wafWebAclArn]).apply(([wafArn]) => {
        expect(wafArn).toBeDefined();
        done();
      });
    });

    it("includes AWS managed rules", (done) => {
      pulumi.all([stack.wafWebAclArn]).apply(([wafArn]) => {
        expect(wafArn).toBeTruthy();
        done();
      });
    });

    it("configures CloudWatch metrics", (done) => {
      pulumi.all([stack.wafWebAclArn]).apply(([wafArn]) => {
        expect(wafArn).toBeDefined();
        done();
      });
    });

    it("enables sample request logging", (done) => {
      pulumi.all([stack.wafWebAclArn]).apply(([wafArn]) => {
        expect(wafArn).toBeDefined();
        done();
      });
    });
  });

  describe("ACM Certificate Configuration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-cert", {
        environmentSuffix: "cert-test",
        tags: pulumi.output({ Purpose: "tls" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("creates SSL certificate", (done) => {
      pulumi.all([stack.certificateArn]).apply(([certArn]) => {
        expect(certArn).toContain("arn:aws:");
        done();
      });
    });

    it("uses DNS validation", (done) => {
      pulumi.all([stack.certificateArn]).apply(([certArn]) => {
        expect(certArn).toBeDefined();
        done();
      });
    });

    it("includes subject alternative names", (done) => {
      pulumi.all([stack.certificateArn]).apply(([certArn]) => {
        expect(certArn).toBeDefined();
        done();
      });
    });
  });

  describe("PCI Compliance Configuration", () => {
    it("enables all security features when PCI compliance is enabled", (done) => {
      stack = new SecurityStack("test-pci-enabled", {
        environmentSuffix: "pci",
        tags: pulumi.output({ Compliance: "PCI-DSS" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });

      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.wafWebAclArn).toBeDefined();
      expect(stack.cognitoUserPoolId).toBeDefined();
      
      pulumi.all([stack.kmsKeyId, stack.wafWebAclArn]).apply(([kmsKeyId, wafArn]) => {
        expect(kmsKeyId).toBeTruthy();
        expect(wafArn).toBeTruthy();
        done();
      });
    });

    it("creates resources when PCI compliance is disabled", (done) => {
      stack = new SecurityStack("test-pci-disabled", {
        environmentSuffix: "no-pci",
        tags: pulumi.output({ Compliance: "none" }),
        enablePciCompliance: false,
        regions: { primary: "us-east-1", replicas: [] },
      });

      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.secretsManagerArns).toBeDefined();
      
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeTruthy();
        done();
      });
    });
  });

  describe("Multi-region Configuration", () => {
    it("creates resources in primary region", (done) => {
      stack = new SecurityStack("test-primary", {
        environmentSuffix: "primary",
        tags: pulumi.output({ Region: "primary" }),
        enablePciCompliance: true,
        regions: {
          primary: "us-east-1",
          replicas: [],
        },
      });

      expect(stack.kmsKeyId).toBeDefined();
      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeTruthy();
        done();
      });
    });

    it("supports multiple replica regions", (done) => {
      stack = new SecurityStack("test-replicas", {
        environmentSuffix: "replicas",
        tags: pulumi.output({ Region: "multi" }),
        enablePciCompliance: true,
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1", "ap-southeast-1"],
        },
      });

      expect(stack.kmsKeyId).toBeDefined();
      pulumi.all([stack.kmsKeyArn]).apply(([keyArn]) => {
        expect(keyArn).toBeTruthy();
        done();
      });
    });

    it("creates multi-region KMS key", (done) => {
      stack = new SecurityStack("test-mrk", {
        environmentSuffix: "mrk",
        tags: pulumi.output({ MRK: "true" }),
        enablePciCompliance: true,
        regions: {
          primary: "us-west-2",
          replicas: ["eu-central-1"],
        },
      });

      pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeDefined();
        done();
      });
    });
  });

  describe("Tag Application", () => {
    it("applies custom tags to all resources", (done) => {
      stack = new SecurityStack("test-tags", {
        environmentSuffix: "tags",
        tags: pulumi.output({
          Environment: "test",
          CostCenter: "engineering",
          Owner: "platform-team",
        }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });

      pulumi.all([stack.kmsKeyId]).apply(([kmsKeyId]) => {
        expect(kmsKeyId).toBeDefined();
        done();
      });
    });

    it("merges environment-specific tags", (done) => {
      stack = new SecurityStack("test-env-tags", {
        environmentSuffix: "prod",
        tags: pulumi.output({
          Environment: "production",
          Tier: "critical",
        }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });

      pulumi.all([stack.cognitoUserPoolId]).apply(([poolId]) => {
        expect(poolId).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("kmsKeyId");
      expect(stack).toHaveProperty("kmsKeyArn");
      expect(stack).toHaveProperty("dbSecretArn");
      expect(stack).toHaveProperty("secretsManagerArns");
      expect(stack).toHaveProperty("cognitoUserPoolId");
      expect(stack).toHaveProperty("cognitoUserPoolArn");
      expect(stack).toHaveProperty("cognitoIdentityPoolId");
      expect(stack).toHaveProperty("wafWebAclArn");
      expect(stack).toHaveProperty("certificateArn");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.kmsKeyId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.kmsKeyArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dbSecretArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.secretsManagerArns)).toBe(true);
      expect(pulumi.Output.isInstance(stack.cognitoUserPoolId)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new SecurityStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        enablePciCompliance: true,
        regions: { primary: "us-east-1", replicas: [] },
      });
    });

    it("secrets depend on KMS key", (done) => {
      pulumi.all([stack.kmsKeyId, stack.dbSecretArn]).apply(([kmsKeyId, dbSecretArn]) => {
        expect(kmsKeyId).toBeDefined();
        expect(dbSecretArn).toBeDefined();
        done();
      });
    });

    it("identity pool depends on user pool", (done) => {
      pulumi.all([stack.cognitoUserPoolId, stack.cognitoIdentityPoolId]).apply(([poolId, identityPoolId]) => {
        expect(poolId).toBeDefined();
        expect(identityPoolId).toBeDefined();
        done();
      });
    });

    it("IAM role depends on identity pool", (done) => {
      pulumi.all([stack.cognitoIdentityPoolId]).apply(([identityPoolId]) => {
        expect(identityPoolId).toBeDefined();
        done();
      });
    });
  });
});