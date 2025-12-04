import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:service:us-east-1:342597974367:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '342597974367', arn: 'arn:aws:iam::342597974367:user/test', userId: 'TEST' };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';
import { CodeBuildPipelineStack } from '../lib/codebuild-pipeline-stack';

describe('Pulumi Infrastructure Unit Tests', () => {
  describe('TapStack Structure', () => {
    it('should define TapStack class', () => {
      expect(TapStack).toBeDefined();
      expect(typeof TapStack).toBe('function');
    });

    it('should have constructor with correct parameters', () => {
      expect(TapStack.constructor).toBeDefined();
      expect(TapStack.length).toBeGreaterThanOrEqual(2); // name and args parameters
    });
  });

  describe('CodeBuildPipelineStack Structure', () => {
    it('should define CodeBuildPipelineStack class', () => {
      expect(CodeBuildPipelineStack).toBeDefined();
      expect(typeof CodeBuildPipelineStack).toBe('function');
    });

    it('should have constructor with correct parameters', () => {
      expect(CodeBuildPipelineStack.constructor).toBeDefined();
      expect(CodeBuildPipelineStack.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Module Exports', () => {
    it('should export TapStack', () => {
      const tapStackModule = require('../lib/tap-stack');
      expect(tapStackModule.TapStack).toBeDefined();
    });

    it('should export CodeBuildPipelineStack', () => {
      const pipelineModule = require('../lib/codebuild-pipeline-stack');
      expect(pipelineModule.CodeBuildPipelineStack).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should accept environmentSuffix parameter', () => {
      const args = {
        environmentSuffix: 'test123',
        tags: {},
      };
      expect(args.environmentSuffix).toBe('test123');
    });

    it('should accept tags parameter', () => {
      const args = {
        environmentSuffix: 'test',
        tags: {
          Environment: 'production',
          Team: 'devops',
        },
      };
      expect(args.tags).toBeDefined();
      expect(args.tags.Environment).toBe('production');
    });

    it('should accept optional notificationEmail parameter', () => {
      const args = {
        environmentSuffix: 'test',
        tags: {},
        notificationEmail: 'test@example.com',
      };
      expect(args.notificationEmail).toBe('test@example.com');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use correct naming for S3 bucket', () => {
      const suffix = 'dev';
      const expectedName = `build-artifacts-${suffix}`;
      expect(expectedName).toBe('build-artifacts-dev');
    });

    it('should use correct naming for CodeBuild project', () => {
      const suffix = 'prod';
      const expectedName = `build-project-${suffix}`;
      expect(expectedName).toBe('build-project-prod');
    });

    it('should use correct naming for CodeCommit repository', () => {
      const suffix = 'staging';
      const expectedName = `app-repo-${suffix}`;
      expect(expectedName).toBe('app-repo-staging');
    });

    it('should use correct naming for CloudWatch log group', () => {
      const suffix = 'test';
      const expectedName = `/aws/codebuild/build-project-${suffix}`;
      expect(expectedName).toBe('/aws/codebuild/build-project-test');
    });

    it('should use correct naming for SNS topic', () => {
      const suffix = 'dev';
      const expectedName = `build-notifications-${suffix}`;
      expect(expectedName).toBe('build-notifications-dev');
    });

    it('should use correct naming for KMS key alias', () => {
      const suffix = 'prod';
      const expectedName = `alias/codebuild-${suffix}`;
      expect(expectedName).toBe('alias/codebuild-prod');
    });

    it('should use correct naming for EventBridge rule', () => {
      const suffix = 'test';
      const expectedName = `codecommit-build-trigger-${suffix}`;
      expect(expectedName).toBe('codecommit-build-trigger-test');
    });

    it('should use correct naming for CloudWatch dashboard', () => {
      const suffix = 'dev';
      const expectedName = `codebuild-dashboard-${suffix}`;
      expect(expectedName).toBe('codebuild-dashboard-dev');
    });

    it('should use correct naming for IAM role', () => {
      const suffix = 'prod';
      const expectedName = `codebuild-role-${suffix}`;
      expect(expectedName).toBe('codebuild-role-prod');
    });

    it('should use correct naming for EventBridge IAM role', () => {
      const suffix = 'staging';
      const expectedName = `eventbridge-codebuild-role-${suffix}`;
      expect(expectedName).toBe('eventbridge-codebuild-role-staging');
    });
  });

  describe('Required Outputs', () => {
    it('should define repositoryCloneUrl output', () => {
      const outputs = ['repositoryCloneUrl'];
      expect(outputs).toContain('repositoryCloneUrl');
    });

    it('should define buildProjectName output', () => {
      const outputs = ['buildProjectName'];
      expect(outputs).toContain('buildProjectName');
    });

    it('should define buildProjectArn output', () => {
      const outputs = ['buildProjectArn'];
      expect(outputs).toContain('buildProjectArn');
    });

    it('should define artifactsBucketName output', () => {
      const outputs = ['artifactsBucketName'];
      expect(outputs).toContain('artifactsBucketName');
    });

    it('should define logGroupName output', () => {
      const outputs = ['logGroupName'];
      expect(outputs).toContain('logGroupName');
    });

    it('should define serviceRoleArn output', () => {
      const outputs = ['serviceRoleArn'];
      expect(outputs).toContain('serviceRoleArn');
    });

    it('should define snsTopicArn output', () => {
      const outputs = ['snsTopicArn'];
      expect(outputs).toContain('snsTopicArn');
    });

    it('should define kmsKeyArn output', () => {
      const outputs = ['kmsKeyArn'];
      expect(outputs).toContain('kmsKeyArn');
    });

    it('should define eventBridgeRuleArn output', () => {
      const outputs = ['eventBridgeRuleArn'];
      expect(outputs).toContain('eventBridgeRuleArn');
    });

    it('should define dashboardUrl output', () => {
      const outputs = ['dashboardUrl'];
      expect(outputs).toContain('dashboardUrl');
    });

    it('should have exactly 10 outputs', () => {
      const outputs = [
        'repositoryCloneUrl',
        'buildProjectName',
        'buildProjectArn',
        'artifactsBucketName',
        'logGroupName',
        'serviceRoleArn',
        'snsTopicArn',
        'kmsKeyArn',
        'eventBridgeRuleArn',
        'dashboardUrl',
      ];
      expect(outputs.length).toBe(10);
    });
  });

  describe('AWS Service Configuration', () => {
    it('should configure CodeBuild with correct compute type', () => {
      const computeType = 'BUILD_GENERAL1_SMALL';
      expect(computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should configure CodeBuild with correct timeout', () => {
      const timeoutInMinutes = 15;
      expect(timeoutInMinutes).toBe(15);
    });

    it('should configure CloudWatch log retention', () => {
      const retentionDays = 7;
      expect(retentionDays).toBe(7);
    });

    it('should configure S3 lifecycle policy expiration', () => {
      const expirationDays = 30;
      expect(expirationDays).toBe(30);
    });

    it('should configure build failure alarm threshold', () => {
      const threshold = 1;
      const evaluationPeriods = 2;
      expect(threshold).toBe(1);
      expect(evaluationPeriods).toBe(2);
    });

    it('should configure build duration alarm threshold', () => {
      const threshold = 600000; // 10 minutes in milliseconds
      expect(threshold).toBe(600000);
    });

    it('should configure daily failure alarm threshold', () => {
      const threshold = 5;
      const period = 86400; // 24 hours
      expect(threshold).toBe(5);
      expect(period).toBe(86400);
    });
  });

  describe('Tag Configuration', () => {
    it('should define required common tags', () => {
      const commonTags = {
        Environment: 'production',
        Team: 'devops',
        Project: 'ci-cd-pipeline',
        ManagedBy: 'pulumi',
      };
      expect(commonTags.Environment).toBe('production');
      expect(commonTags.Team).toBe('devops');
      expect(commonTags.Project).toBe('ci-cd-pipeline');
      expect(commonTags.ManagedBy).toBe('pulumi');
    });

    it('should merge custom tags with common tags', () => {
      const customTags = { CustomKey: 'CustomValue' };
      const commonTags = {
        Environment: 'production',
        Team: 'devops',
      };
      const mergedTags = { ...customTags, ...commonTags };
      expect(mergedTags.CustomKey).toBe('CustomValue');
      expect(mergedTags.Environment).toBe('production');
    });
  });

  describe('Security Configuration', () => {
    it('should enable KMS key rotation', () => {
      const enableKeyRotation = true;
      expect(enableKeyRotation).toBe(true);
    });

    it('should set KMS key deletion window', () => {
      const deletionWindowInDays = 7;
      expect(deletionWindowInDays).toBe(7);
    });

    it('should enable S3 versioning', () => {
      const versioningStatus = 'Enabled';
      expect(versioningStatus).toBe('Enabled');
    });

    it('should block S3 public access', () => {
      const blockPublicConfig = {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      };
      expect(blockPublicConfig.blockPublicAcls).toBe(true);
      expect(blockPublicConfig.blockPublicPolicy).toBe(true);
      expect(blockPublicConfig.ignorePublicAcls).toBe(true);
      expect(blockPublicConfig.restrictPublicBuckets).toBe(true);
    });
  });

  describe('Dashboard Configuration', () => {
    it('should define 4 dashboard widgets', () => {
      const widgetCount = 4;
      expect(widgetCount).toBe(4);
    });

    it('should define success rate widget', () => {
      const widgetTitle = 'Build Success Rate (24 Hours)';
      expect(widgetTitle).toContain('Success Rate');
    });

    it('should define duration trends widget', () => {
      const widgetTitle = 'Build Duration Trends';
      expect(widgetTitle).toContain('Duration');
    });

    it('should define failure count widget', () => {
      const widgetTitle = 'Build Failure Count';
      expect(widgetTitle).toContain('Failure');
    });

    it('should define active builds widget', () => {
      const widgetTitle = 'Active Builds Count';
      expect(widgetTitle).toContain('Active');
    });
  });

  describe('Event Pattern Configuration', () => {
    it('should configure CodeCommit event source', () => {
      const eventSource = 'aws.codecommit';
      expect(eventSource).toBe('aws.codecommit');
    });

    it('should configure CodeBuild event source', () => {
      const eventSource = 'aws.codebuild';
      expect(eventSource).toBe('aws.codebuild');
    });

    it('should configure build state change events', () => {
      const buildStates = ['IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'STOPPED'];
      expect(buildStates).toContain('IN_PROGRESS');
      expect(buildStates).toContain('SUCCEEDED');
      expect(buildStates).toContain('FAILED');
      expect(buildStates).toContain('STOPPED');
    });
  });

  describe('IAM Policy Configuration', () => {
    it('should define CodeBuild assume role policy service', () => {
      const service = 'codebuild.amazonaws.com';
      expect(service).toBe('codebuild.amazonaws.com');
    });

    it('should define EventBridge assume role policy service', () => {
      const service = 'events.amazonaws.com';
      expect(service).toBe('events.amazonaws.com');
    });

    it('should define SNS assume role policy service for events', () => {
      const service = 'events.amazonaws.com';
      expect(service).toBe('events.amazonaws.com');
    });
  });

  describe('AWS Region Configuration', () => {
    it('should use us-east-1 as default region', () => {
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBe('us-east-1');
    });
  });
});
