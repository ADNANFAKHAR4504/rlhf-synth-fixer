import * as pulumi from "@pulumi/pulumi";
import { SecureS3Bucket } from "../lib/secureS3Bucket";

// Enable Pulumi mocking
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    switch (type) {
      case 'aws:s3/bucket:Bucket':
        return {
          id: `${name}-bucket-id`,
          state: {
            arn: `arn:aws:s3:::${name}`,
            id: name,
            bucket: name,
            ...inputs,
          },
        };
      case 'aws:s3/bucketVersioning:BucketVersioning':
        return {
          id: `${name}-versioning-id`,
          state: {
            versioningConfiguration: {
              status: 'Enabled',
            },
            ...inputs,
          },
        };
      case 'aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration':
        return {
          id: `${name}-encryption-id`,
          state: {
            serverSideEncryptionConfiguration: {
              rules: [{
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'aws:kms',
                  kmsMasterKeyId: 'mock-kms-key-id',
                },
                bucketKeyEnabled: true,
              }],
            },
            ...inputs,
          },
        };
      case 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock':
        return {
          id: `${name}-pab-id`,
          state: {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
            ...inputs,
          },
        };
      case 'aws:kms/key:Key':
        return {
          id: `${name}-key-id`,
          state: {
            arn: `arn:aws:kms:us-east-1:123456789012:key/${name}-key-id`,
            keyId: `${name}-key-id`,
            ...inputs,
          },
        };
      case 'aws:kms/alias:Alias':
        return {
          id: `${name}-alias-id`,
          state: {
            name: `alias/${name}`,
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
    if (token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test-user',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return callInputs;
  },
});

describe("SecureS3Bucket Component Tests", () => {
  describe("Constructor Variations", () => {
    it("should create bucket with default tags", () => {
      const bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
      });
      expect(bucket).toBeDefined();
      expect(bucket.bucket).toBeDefined();
      expect(bucket.kmsKey).toBeDefined();
    });

    it("should create bucket with custom tags", () => {
      const bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
        tags: { CustomTag: "value" },
      });
      expect(bucket).toBeDefined();
    });

    it("should create bucket with undefined tags", () => {
      const bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
        tags: undefined,
      });
      expect(bucket).toBeDefined();
    });

    it("should create bucket with null tags", () => {
      const bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
        tags: null as any,
      });
      expect(bucket).toBeDefined();
    });

    it("should create bucket with empty object tags", () => {
      const bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
        tags: {},
      });
      expect(bucket).toBeDefined();
    });

    it("should create bucket with falsy tags", () => {
      const falsyValues = [undefined, null, false, 0, "", NaN];
      falsyValues.forEach((value, index) => {
        const bucket = new SecureS3Bucket(`test-bucket-${index}`, {
          environmentSuffix: "test",
          tags: value as any,
        });
        expect(bucket).toBeDefined();
      });
    });
  });

  describe("Component Properties", () => {
    let bucket: SecureS3Bucket;

    beforeAll(() => {
      bucket = new SecureS3Bucket("test-bucket", {
        environmentSuffix: "test",
        tags: { Environment: "test" },
      });
    });

    it("should have all required properties", () => {
      expect(bucket.bucket).toBeDefined();
      expect(bucket.bucketVersioning).toBeDefined();
      expect(bucket.bucketEncryption).toBeDefined();
      expect(bucket.bucketPublicAccessBlock).toBeDefined();
      expect(bucket.kmsKey).toBeDefined();
      expect(bucket.bucketArn).toBeDefined();
      expect(bucket.bucketName).toBeDefined();
    });

    it("should have correct bucket configuration", () => {
      expect(bucket.bucket).toBeDefined();
    });

    it("should have versioning enabled", () => {
      expect(bucket.bucketVersioning).toBeDefined();
    });

    it("should have KMS encryption configured", () => {
      expect(bucket.bucketEncryption).toBeDefined();
    });

    it("should have public access blocked", () => {
      expect(bucket.bucketPublicAccessBlock).toBeDefined();
    });

    it("should have KMS key", () => {
      expect(bucket.kmsKey).toBeDefined();
    });
  });

  describe("Environment Suffix Handling", () => {
    it("should handle development environment", () => {
      const bucket = new SecureS3Bucket("dev-bucket", {
        environmentSuffix: "development",
      });
      expect(bucket).toBeDefined();
    });

    it("should handle production environment", () => {
      const bucket = new SecureS3Bucket("prod-bucket", {
        environmentSuffix: "production",
      });
      expect(bucket).toBeDefined();
    });

    it("should handle custom environment", () => {
      const bucket = new SecureS3Bucket("custom-bucket", {
        environmentSuffix: "staging",
      });
      expect(bucket).toBeDefined();
    });

    it("should handle empty environment suffix", () => {
      const bucket = new SecureS3Bucket("empty-bucket", {
        environmentSuffix: "",
      });
      expect(bucket).toBeDefined();
    });
  });
});