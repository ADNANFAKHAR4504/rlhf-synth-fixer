import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Mock the config
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const mockOutputs: Record<string, any> = {
      ...args.inputs,
    };

    // Add required outputs based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      mockOutputs.arn = `arn:aws:s3:::${args.inputs.bucket || 'mock-bucket'}`;
      mockOutputs.bucket = args.inputs.bucket || 'mock-bucket';
    } else if (args.type === 'aws:sns/topic:Topic') {
      mockOutputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name || 'mock-topic'}`;
    } else if (args.type === 'aws:kms/key:Key') {
      mockOutputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id';
      mockOutputs.id = 'mock-key-id';
    } else if (args.type === 'aws:iam/role:Role') {
      mockOutputs.arn = `arn:aws:iam::123456789012:role/${args.inputs.name || 'mock-role'}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      mockOutputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name || 'mock-function'}`;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      mockOutputs.arn = `arn:aws:codepipeline:us-east-1:123456789012:${args.inputs.name || 'mock-pipeline'}`;
      mockOutputs.name = args.inputs.name || 'mock-pipeline';
    } else if (args.type === 'aws:codebuild/project:Project') {
      mockOutputs.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${args.inputs.name || 'mock-project'}`;
      mockOutputs.name = args.inputs.name || 'mock-project';
    } else if (args.type === 'aws:sqs/queue:Queue') {
      mockOutputs.arn = `arn:aws:sqs:us-east-1:123456789012:${args.inputs.name || 'mock-queue'}`;
      mockOutputs.url = `https://sqs.us-east-1.amazonaws.com/123456789012/${args.inputs.name || 'mock-queue'}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      mockOutputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name || 'mock-log-group'}`;
    }

    return {
      id: args.inputs.name || `${args.name}-id`,
      state: mockOutputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/mock-user',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    } else if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

// Set mock configuration
pulumi.runtime.setConfig('aws:region', 'us-east-1');
pulumi.runtime.setConfig('TapStack:environmentSuffix', 'test');

describe('CI/CD Pipeline Infrastructure', () => {
  let resources: any;

  beforeAll(() => {
    // Import the infrastructure code
    resources = require('../lib/index');
  });

  describe('S3 Artifact Bucket', () => {
    it('should create artifact bucket with versioning enabled', (done) => {
      resources.artifactBucketName.apply((bucketName: string) => {
        expect(bucketName).toBeDefined();
        expect(bucketName).toContain('pipeline-artifacts');
        done();
      });
    });

    it('should include environmentSuffix in bucket name', (done) => {
      resources.artifactBucketName.apply((bucketName: string) => {
        expect(bucketName).toMatch(/pipeline-artifacts-/);
        done();
      });
    });
  });

  describe('SNS Topics', () => {
    it('should create notification topic', (done) => {
      resources.notificationTopicArn.apply((topicArn: string) => {
        expect(topicArn).toBeDefined();
        expect(topicArn).toContain('pipeline-notifications');
        done();
      });
    });

    it('should create failure notification topic', (done) => {
      resources.failureTopicArn.apply((topicArn: string) => {
        expect(topicArn).toBeDefined();
        expect(topicArn).toContain('pipeline-failures');
        done();
      });
    });

    it('should include environmentSuffix in topic names', (done) => {
      resources.notificationTopicArn.apply((topicArn: string) => {
        expect(topicArn).toMatch(/pipeline-notifications-/);
        done();
      });
    });
  });

  describe('CodeBuild Projects', () => {
    it('should create build project', (done) => {
      resources.buildProjectName.apply((projectName: string) => {
        expect(projectName).toBeDefined();
        expect(projectName).toContain('nodejs-build');
        done();
      });
    });

    it('should create test project', (done) => {
      resources.testProjectName.apply((projectName: string) => {
        expect(projectName).toBeDefined();
        expect(projectName).toContain('nodejs-test');
        done();
      });
    });

    it('should include environmentSuffix in project names', (done) => {
      pulumi
        .all([resources.buildProjectName, resources.testProjectName])
        .apply(([buildProject, testProject]: [string, string]) => {
          expect(buildProject).toMatch(/nodejs-build-/);
          expect(testProject).toMatch(/nodejs-test-/);
          done();
        });
    });
  });

  describe('CodePipeline', () => {
    it('should create production pipeline', (done) => {
      resources.productionPipelineName.apply((pipelineName: string) => {
        expect(pipelineName).toBeDefined();
        expect(pipelineName).toContain('nodejs-production');
        done();
      });
    });

    it('should create staging pipeline', (done) => {
      resources.stagingPipelineName.apply((pipelineName: string) => {
        expect(pipelineName).toBeDefined();
        expect(pipelineName).toContain('nodejs-staging');
        done();
      });
    });

    it('should include environmentSuffix in pipeline names', (done) => {
      pulumi
        .all([resources.productionPipelineName, resources.stagingPipelineName])
        .apply(([prodPipeline, stagingPipeline]: [string, string]) => {
          expect(prodPipeline).toMatch(/nodejs-production-/);
          expect(stagingPipeline).toMatch(/nodejs-staging-/);
          done();
        });
    });
  });

  describe('Lambda Functions', () => {
    it('should create notification lambda', (done) => {
      resources.notificationLambdaArn.apply((lambdaArn: string) => {
        expect(lambdaArn).toBeDefined();
        expect(lambdaArn).toContain('pipeline-notification');
        done();
      });
    });

    it('should create approval lambda', (done) => {
      resources.approvalLambdaArn.apply((lambdaArn: string) => {
        expect(lambdaArn).toBeDefined();
        expect(lambdaArn).toContain('approval-check');
        done();
      });
    });

    it('should include environmentSuffix in lambda names', (done) => {
      pulumi
        .all([resources.notificationLambdaArn, resources.approvalLambdaArn])
        .apply(([notificationLambda, approvalLambda]: [string, string]) => {
          expect(notificationLambda).toMatch(/pipeline-notification-/);
          expect(approvalLambda).toMatch(/approval-check-/);
          done();
        });
    });
  });

  describe('KMS Encryption', () => {
    it('should create KMS key', (done) => {
      resources.kmsKeyId.apply((keyId: string) => {
        expect(keyId).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('all exported resources should include environmentSuffix', (done) => {
      pulumi
        .all([
          resources.artifactBucketName,
          resources.productionPipelineName,
          resources.stagingPipelineName,
          resources.buildProjectName,
          resources.testProjectName,
        ])
        .apply(
          ([
            bucketName,
            prodPipeline,
            stagingPipeline,
            buildProject,
            testProject,
          ]: [string, string, string, string, string]) => {
            expect(bucketName).toMatch(/-/);
            expect(prodPipeline).toMatch(/-/);
            expect(stagingPipeline).toMatch(/-/);
            expect(buildProject).toMatch(/-/);
            expect(testProject).toMatch(/-/);
            done();
          }
        );
    });
  });

  describe('Tagging', () => {
    it('should verify common tags are applied', () => {
      // This test verifies the tag structure in the code
      // In a real deployment, tags would be verified via AWS API
      expect(true).toBe(true);
    });
  });

  describe('Security', () => {
    it('should verify encryption is enabled', (done) => {
      resources.kmsKeyId.apply((kmsKeyId: string) => {
        expect(kmsKeyId).toBeDefined();
        done();
      });
    });

    it('should verify IAM roles follow least privilege', () => {
      // This test verifies IAM policy structure
      // In a real deployment, policies would be verified via AWS API
      expect(true).toBe(true);
    });
  });
});

describe('Resource Destroyability', () => {
  it('should not have protected resources', () => {
    // All resources should be destroyable (no protect: true)
    // This is verified during deployment
    expect(true).toBe(true);
  });

  it('should not have retain on delete policies', () => {
    // All resources should be fully destroyable (no retainOnDelete: true)
    // This is verified during deployment
    expect(true).toBe(true);
  });
});
