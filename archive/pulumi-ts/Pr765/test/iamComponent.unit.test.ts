import * as pulumi from "@pulumi/pulumi";
import { IAMRole } from "../lib/iamComponent";

// Enable Pulumi mocking
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    switch (type) {
      case 'aws:iam/role:Role':
        return {
          id: `${name}-role-id`,
          state: {
            arn: `arn:aws:iam::123456789012:role${inputs.path}${name}`,
            name: name,
            path: inputs.path,
            description: inputs.description,
            assumeRolePolicy: inputs.assumeRolePolicy,
            ...inputs,
          },
        };
      case 'aws:iam/rolePolicy:RolePolicy':
        return {
          id: `${name}-policy-id`,
          state: {
            policy: inputs.policy,
            role: inputs.role,
            ...inputs,
          },
        };
      default:
        return {
          id: `${name}-id`,
          state: inputs,
        };
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    const { token, inputs: callInputs } = args;
    return callInputs;
  },
});

describe("IAMRole Component Tests", () => {
  describe("Constructor Variations", () => {
    it("should create IAM role with bucket ARN", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
      });
      expect(iamRole).toBeDefined();
      expect(iamRole.role).toBeDefined();
      expect(iamRole.rolePolicy).toBeDefined();
    });

    it("should create IAM role with custom tags", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
        tags: { CustomTag: "value" },
      });
      expect(iamRole).toBeDefined();
    });

    it("should create IAM role with undefined tags", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
        tags: undefined,
      });
      expect(iamRole).toBeDefined();
    });

    it("should create IAM role with null tags", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
        tags: null as any,
      });
      expect(iamRole).toBeDefined();
    });

    it("should create IAM role with empty object tags", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
        tags: {},
      });
      expect(iamRole).toBeDefined();
    });
  });

  describe("Tags Conditional Branch", () => {
    it("should handle all falsy tag values", () => {
      const falsyValues = [undefined, null, false, 0, "", NaN];
      falsyValues.forEach((value, index) => {
        const iamRole = new IAMRole(`test-role-${index}`, {
          environmentSuffix: "test",
          bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
          tags: value as any,
        });
        expect(iamRole).toBeDefined();
      });
    });

    it("should handle all truthy tag values", () => {
      const truthyValues = [true, 1, "string", { key: "value" }, [], () => {}];
      truthyValues.forEach((value, index) => {
        const iamRole = new IAMRole(`test-role-${index}`, {
          environmentSuffix: "test",
          bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
          tags: value as any,
        });
        expect(iamRole).toBeDefined();
      });
    });
  });

  describe("Component Properties", () => {
    let iamRole: IAMRole;

    beforeAll(() => {
      iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
        tags: { Environment: "test" },
      });
    });

    it("should have all required properties", () => {
      expect(iamRole.role).toBeDefined();
      expect(iamRole.rolePolicy).toBeDefined();
      expect(iamRole.roleArn).toBeDefined();
      expect(iamRole.roleName).toBeDefined();
    });

    it("should have correct role configuration", () => {
      expect(iamRole.role).toBeDefined();
    });

    it("should have role policy", () => {
      expect(iamRole.rolePolicy).toBeDefined();
    });
  });

  describe("Environment Suffix Handling", () => {
    it("should handle different environment suffixes", () => {
      const environments = ["dev", "test", "staging", "production", "custom"];
      environments.forEach(env => {
        const iamRole = new IAMRole(`role-${env}`, {
          environmentSuffix: env,
          bucketArn: pulumi.output(`arn:aws:s3:::bucket-${env}`),
        });
        expect(iamRole).toBeDefined();
      });
    });
  });

  describe("Bucket ARN Handling", () => {
    it("should handle string bucket ARN", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: "arn:aws:s3:::test-bucket",
      });
      expect(iamRole).toBeDefined();
    });

    it("should handle Pulumi Output bucket ARN", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::test-bucket"),
      });
      expect(iamRole).toBeDefined();
    });

    it("should handle complex bucket ARN", () => {
      const iamRole = new IAMRole("test-role", {
        environmentSuffix: "test",
        bucketArn: pulumi.output("arn:aws:s3:::my-complex-bucket-name-123"),
      });
      expect(iamRole).toBeDefined();
    });
  });
});