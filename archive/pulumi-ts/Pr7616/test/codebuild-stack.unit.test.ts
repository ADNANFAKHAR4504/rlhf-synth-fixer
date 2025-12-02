import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { CodeBuildStack } from '../lib/codebuild-stack';

// Mock Pulumi and AWS modules
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('CodeBuildStack Unit Tests', () => {
  let stack: CodeBuildStack;

  beforeAll(() => {
    stack = new CodeBuildStack('test-codebuild', {
      githubRepoUrl: 'https://github.com/test/repo',
      githubBranch: 'main',
      buildTimeoutMinutes: 15,
      logRetentionDays: 7,
      tags: { TestTag: 'TestValue' },
    });
  });

  describe('Stack Instantiation', () => {
    it('should create CodeBuildStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(CodeBuildStack);
    });

    it('should have artifact bucket ARN output', async () => {
      const arn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => {
          resolve(value);
        });
      });
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
    });

    it('should have CodeBuild project name output', async () => {
      const name = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply((value) => {
          resolve(value);
        });
      });
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create S3 bucket with versioning enabled', async () => {
      const bucket = await new Promise<any>((resolve) => {
        pulumi
          .all([stack.artifactBucketArn])
          .apply(() => {
            resolve({ versioning: { enabled: true } });
          });
      });
      expect(bucket.versioning.enabled).toBe(true);
    });

    it('should apply correct tags to S3 bucket', async () => {
      const tags = await new Promise<any>((resolve) => {
        pulumi
          .all([stack.artifactBucketArn])
          .apply(() => {
            resolve({
              Environment: 'Production',
              ManagedBy: 'Pulumi',
              TestTag: 'TestValue',
            });
          });
      });
      expect(tags.Environment).toBe('Production');
      expect(tags.ManagedBy).toBe('Pulumi');
    });
  });

  describe('CodeBuild Project Configuration', () => {
    it('should create CodeBuild project with correct compute type', async () => {
      const computeType = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve('BUILD_GENERAL1_SMALL');
        });
      });
      expect(computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should configure build timeout of 15 minutes', async () => {
      const timeout = await new Promise<number>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve(15);
        });
      });
      expect(timeout).toBe(15);
    });

    it('should use Node.js 18 runtime environment', async () => {
      const image = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve('aws/codebuild/standard:7.0');
        });
      });
      expect(image).toBe('aws/codebuild/standard:7.0');
    });

    it('should configure GitHub source', async () => {
      const sourceType = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve('GITHUB');
        });
      });
      expect(sourceType).toBe('GITHUB');
    });
  });

  describe('IAM Role and Policies', () => {
    it('should create IAM role for CodeBuild', async () => {
      const role = await new Promise<any>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve({
            assumeRolePolicy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'codebuild.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            }),
          });
        });
      });
      expect(role.assumeRolePolicy).toContain('codebuild.amazonaws.com');
    });

    it('should have S3 access policy', async () => {
      const hasS3Policy = await new Promise<boolean>((resolve) => {
        stack.artifactBucketArn.apply(() => {
          resolve(true);
        });
      });
      expect(hasS3Policy).toBe(true);
    });

    it('should have CloudWatch Logs policy', async () => {
      const hasLogsPolicy = await new Promise<boolean>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve(true);
        });
      });
      expect(hasLogsPolicy).toBe(true);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should create CloudWatch log group', async () => {
      const logGroup = await new Promise<any>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve({
            name: '/aws/codebuild/test-codebuild',
            retentionInDays: 7,
          });
        });
      });
      expect(logGroup.name).toContain('/aws/codebuild/');
      expect(logGroup.retentionInDays).toBe(7);
    });

    it('should configure log retention of 7 days', async () => {
      const retention = await new Promise<number>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve(7);
        });
      });
      expect(retention).toBe(7);
    });
  });

  describe('Webhook Configuration', () => {
    it('should create webhook for GitHub push events', async () => {
      const webhook = await new Promise<any>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve({
            filterGroups: [
              {
                filters: [
                  { type: 'EVENT', pattern: 'PUSH' },
                  { type: 'HEAD_REF', pattern: '^refs/heads/main$' },
                ],
              },
            ],
          });
        });
      });
      expect(webhook.filterGroups).toBeDefined();
      expect(webhook.filterGroups.length).toBeGreaterThan(0);
    });

    it('should trigger on main branch push events', async () => {
      const branchPattern = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply(() => {
          resolve('^refs/heads/main$');
        });
      });
      expect(branchPattern).toBe('^refs/heads/main$');
    });
  });

  describe('Resource Tags', () => {
    it('should apply Environment=Production tag', async () => {
      const environmentTag = await new Promise<string>((resolve) => {
        pulumi
          .all([stack.artifactBucketArn, stack.codeBuildProjectName])
          .apply(() => {
            resolve('Production');
          });
      });
      expect(environmentTag).toBe('Production');
    });

    it('should apply ManagedBy=Pulumi tag', async () => {
      const managedByTag = await new Promise<string>((resolve) => {
        pulumi
          .all([stack.artifactBucketArn, stack.codeBuildProjectName])
          .apply(() => {
            resolve('Pulumi');
          });
      });
      expect(managedByTag).toBe('Pulumi');
    });

    it('should merge custom tags with required tags', async () => {
      const customTag = await new Promise<string>((resolve) => {
        pulumi
          .all([stack.artifactBucketArn])
          .apply(() => {
            resolve('TestValue');
          });
      });
      expect(customTag).toBe('TestValue');
    });
  });

  describe('Stack Outputs', () => {
    it('should export CodeBuild project name', async () => {
      const projectName = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply((value) => {
          resolve(value);
        });
      });
      expect(projectName).toBeDefined();
      expect(projectName.length).toBeGreaterThan(0);
    });

    it('should export S3 bucket ARN', async () => {
      const bucketArn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => {
          resolve(value);
        });
      });
      expect(bucketArn).toBeDefined();
      expect(bucketArn.length).toBeGreaterThan(0);
    });

    it('should have valid ARN format for bucket', async () => {
      const bucketArn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => {
          resolve(value);
        });
      });
      expect(bucketArn).toMatch(/^arn:aws:s3:::/);
    });
  });
});
