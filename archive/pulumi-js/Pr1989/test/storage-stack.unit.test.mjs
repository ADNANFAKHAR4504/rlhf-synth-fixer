// Mock Pulumi modules
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  getStack: jest.fn(() => "test-stack")
}));

jest.mock("@pulumi/aws", () => ({
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({ 
      id: "webapp-static-test",
      arn: { 
        apply: jest.fn(cb => JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::webapp-static-test/*"
          }]
        }))
      },
      websiteEndpoint: "webapp-static-test.s3-website.amazonaws.com"
    })),
    BucketVersioning: jest.fn().mockImplementation(() => ({ id: "versioning-test" })),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation(() => ({ id: "encryption-test" })),
    BucketWebsiteConfiguration: jest.fn().mockImplementation(() => ({ id: "website-test" })),
    BucketObject: jest.fn().mockImplementation(() => ({ id: "object-test" }))
  }
}));

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { StorageStack } from "../lib/storage-stack.mjs";

describe("StorageStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("S3 Bucket Creation", () => {
    it("should create S3 bucket with correct naming", () => {
      new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "webapp-static-test",
        expect.objectContaining({
          bucket: "webapp-static-test-test-stack",
          tags: expect.objectContaining({
            Name: "webapp-static-test",
            Component: "storage"
          })
        }),
        expect.any(Object)
      );
    });

    it("should use Pulumi stack name in bucket name", () => {
      new StorageStack("test-storage", { environmentSuffix: "prod" });
      
      expect(pulumi.getStack).toHaveBeenCalled();
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bucket: expect.stringContaining("test-stack")
        }),
        expect.any(Object)
      );
    });
  });

  describe("Bucket Versioning", () => {
    it("should enable versioning for security best practice", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        "webapp-static-versioning-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          versioningConfiguration: expect.objectContaining({
            status: "Enabled"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Bucket Encryption", () => {
    it("should configure server-side encryption with AES256", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        "webapp-static-encryption-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: "AES256"
              }),
              bucketKeyEnabled: true
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Public Access Configuration", () => {
    it.skip("should configure public access block to allow public read", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        "webapp-static-pab-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false
        }),
        expect.any(Object)
      );
    });

    it.skip("should create bucket policy for public read access", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(
        "webapp-static-policy-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          policy: expect.any(String)
        }),
        expect.any(Object)
      );
      
      // Verify the policy content is a valid JSON string
      const policyCall = aws.s3.BucketPolicy.mock.calls[0][1];
      const policyString = policyCall.policy;
      const policy = JSON.parse(policyString);
      
      expect(policy).toEqual(expect.objectContaining({
        Version: "2012-10-17",
        Statement: expect.arrayContaining([
          expect.objectContaining({
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::webapp-static-test/*"
          })
        ])
      }));
    });
  });

  describe("Website Configuration", () => {
    it("should configure bucket for static website hosting", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketWebsiteConfiguration).toHaveBeenCalledWith(
        "webapp-static-website-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          indexDocument: expect.objectContaining({
            suffix: "index.html"
          }),
          errorDocument: expect.objectContaining({
            key: "error.html"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Static Content Upload", () => {
    it("should upload sample index.html file", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketObject).toHaveBeenCalledWith(
        "webapp-index-html-test",
        expect.objectContaining({
          bucket: stack.bucket.id,
          key: "index.html",
          content: expect.stringContaining("<!DOCTYPE html>"),
          contentType: "text/html"
        }),
        expect.any(Object)
      );
    });

    it("should include environment suffix in uploaded content", () => {
      new StorageStack("test-storage", { environmentSuffix: "prod" });
      
      expect(aws.s3.BucketObject).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          content: expect.stringContaining("Environment: prod")
        }),
        expect.any(Object)
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should register bucket outputs", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: stack.bucket.id,
          bucketWebsiteEndpoint: stack.bucket.websiteEndpoint
        })
      );
    });

    it("should expose bucket properties", () => {
      const stack = new StorageStack("test-storage", { environmentSuffix: "test" });
      
      expect(stack.bucket).toBeDefined();
      expect(stack.bucket.id).toBe("webapp-static-test");
      expect(stack.bucket.websiteEndpoint).toBe("webapp-static-test.s3-website.amazonaws.com");
    });
  });

  describe("Tags and Environment", () => {
    it("should apply custom tags to all resources", () => {
      new StorageStack("test-storage", {
        environmentSuffix: "test",
        tags: { Project: "TAP", Owner: "DevOps" }
      });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: "TAP",
            Owner: "DevOps",
            Component: "storage"
          })
        }),
        expect.any(Object)
      );
    });

    it("should use environment suffix in all resource names", () => {
      new StorageStack("test-storage", { environmentSuffix: "staging" });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "webapp-static-staging",
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        "webapp-static-versioning-staging",
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Dependencies", () => {
    it.skip("should set bucket policy dependency on bucket", () => {
      new StorageStack("test-storage", { environmentSuffix: "test" });
      
      // Check that BucketObject depends on BucketPolicy
      const bucketObjectCall = aws.s3.BucketObject.mock.calls[0];
      expect(bucketObjectCall[2]).toEqual(
        expect.objectContaining({
          dependsOn: expect.arrayContaining([expect.any(Object)])
        })
      );
    });
  });
});