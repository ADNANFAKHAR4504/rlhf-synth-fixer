/**
 * Integration tests for the CI/CD Build System
 * Tests deployed AWS resources using actual AWS APIs
 */

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();
const codebuild = new AWS.CodeBuild();
const cloudwatch = new AWS.CloudWatchLogs();
const sns = new AWS.SNS();
const iam = new AWS.IAM();
const events = new AWS.CloudWatchEvents();

describe('CI/CD Build System Integration Tests', () => {
  describe('S3 Artifacts Bucket', () => {
    it('should exist and be accessible', async () => {
      const params = {
        Bucket: outputs.artifactsBucketName,
      };

      const result = await s3.headBucket(params).promise();
      expect(result).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const params = {
        Bucket: outputs.artifactsBucketName,
      };

      const result = await s3.getBucketVersioning(params).promise();
      expect(result.Status).toBe('Enabled');
    });

    it('should have lifecycle configuration for 30-day expiration', async () => {
      const params = {
        Bucket: outputs.artifactsBucketName,
      };

      const result = await s3.getBucketLifecycleConfiguration(params).promise();
      expect(result.Rules).toBeDefined();
      expect(result.Rules.length).toBeGreaterThan(0);

      const expirationRule = result.Rules[0];
      expect(expirationRule.Status).toBe('Enabled');
      expect(expirationRule.Expiration?.Days).toBe(30);
    });

    it('should have proper tags', async () => {
      const params = {
        Bucket: outputs.artifactsBucketName,
      };

      const result = await s3.getBucketTagging(params).promise();
      expect(result.TagSet).toBeDefined();

      const tags = result.TagSet.reduce(
        (acc, tag) => {
          acc[tag.Key] = tag.Value;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tags.Environment).toBe('Production');
      expect(tags.Team).toBe('DevOps');
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist and be accessible', async () => {
      const params = {
        names: [outputs.codebuildProjectName],
      };

      const result = await codebuild.batchGetProjects(params).promise();
      expect(result.projects).toBeDefined();
      expect(result.projects?.length).toBe(1);

      const project = result.projects![0];
      expect(project.name).toBe(outputs.codebuildProjectName);
    });

    it('should have correct configuration', async () => {
      const params = {
        names: [outputs.codebuildProjectName],
      };

      const result = await codebuild.batchGetProjects(params).promise();
      const project = result.projects![0];

      // Verify compute type
      expect(project.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');

      // Verify image
      expect(project.environment?.image).toContain('aws/codebuild/standard');

      // Verify timeouts
      expect(project.timeoutInMinutes).toBe(20);
      expect(project.queuedTimeoutInMinutes).toBe(5);

      // Verify artifacts configuration
      expect(project.artifacts?.type).toBe('S3');
      expect(project.artifacts?.location).toBe(outputs.artifactsBucketName);
    });

    it('should have proper tags', async () => {
      const params = {
        names: [outputs.codebuildProjectName],
      };

      const result = await codebuild.batchGetProjects(params).promise();
      const project = result.projects![0];

      expect(project.tags).toBeDefined();
      const tags = project.tags!.reduce(
        (acc, tag) => {
          acc[tag.key!] = tag.value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tags.Environment).toBe('Production');
      expect(tags.Team).toBe('DevOps');
    });

    it('should have correct IAM role attached', async () => {
      const params = {
        names: [outputs.codebuildProjectName],
      };

      const result = await codebuild.batchGetProjects(params).promise();
      const project = result.projects![0];

      expect(project.serviceRole).toBe(outputs.codebuildRoleArn);
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should exist and be accessible', async () => {
      const params = {
        logGroupNamePrefix: outputs.logGroupName,
      };

      const result = await cloudwatch.describeLogGroups(params).promise();
      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThanOrEqual(1);

      const logGroup = result.logGroups?.find(
        (lg) => lg.logGroupName === outputs.logGroupName
      );
      expect(logGroup).toBeDefined();
    });

    it('should have 7-day retention policy', async () => {
      const params = {
        logGroupNamePrefix: outputs.logGroupName,
      };

      const result = await cloudwatch.describeLogGroups(params).promise();
      const logGroup = result.logGroups?.find(
        (lg) => lg.logGroupName === outputs.logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      const params = {
        TopicArn: outputs.snsTopicArn,
      };

      const result = await sns.getTopicAttributes(params).promise();
      expect(result.Attributes).toBeDefined();
    });

    it('should have email subscription', async () => {
      const params = {
        TopicArn: outputs.snsTopicArn,
      };

      const result = await sns.listSubscriptionsByTopic(params).promise();
      expect(result.Subscriptions).toBeDefined();
      expect(result.Subscriptions?.length).toBeGreaterThan(0);

      const emailSubscription = result.Subscriptions?.find(
        (sub) => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
    });
  });

  describe('IAM Role and Policies', () => {
    it('should have CodeBuild role with correct permissions', async () => {
      const roleName = outputs.codebuildRoleArn.split('/').pop()!;
      const params = {
        RoleName: roleName,
      };

      const result = await iam.getRole(params).promise();
      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);
    });

    it('should have inline policies attached to CodeBuild role', async () => {
      const roleName = outputs.codebuildRoleArn.split('/').pop()!;
      const params = {
        RoleName: roleName,
      };

      const result = await iam.listRolePolicies(params).promise();
      expect(result.PolicyNames).toBeDefined();
      expect(result.PolicyNames.length).toBeGreaterThan(0);
    });

    it('should allow S3 access for CodeBuild role', async () => {
      const roleName = outputs.codebuildRoleArn.split('/').pop()!;
      const listParams = {
        RoleName: roleName,
      };

      const policies = await iam.listRolePolicies(listParams).promise();
      const policyName = policies.PolicyNames[0];

      const getParams = {
        RoleName: roleName,
        PolicyName: policyName,
      };

      const policy = await iam.getRolePolicy(getParams).promise();
      const policyDocument = JSON.parse(
        decodeURIComponent(policy.PolicyDocument!)
      );

      const s3Actions = policyDocument.Statement.filter((stmt: any) =>
        stmt.Action.some((action: string) => action.includes('s3:'))
      );

      expect(s3Actions.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Events Rules', () => {
    it('should have event rules for build state changes', async () => {
      const params = {
        NamePrefix: 'codebuild-',
      };

      const result = await events.listRules(params).promise();
      expect(result.Rules).toBeDefined();
      expect(result.Rules?.length).toBeGreaterThanOrEqual(3); // SUCCEEDED, FAILED, STOPPED

      const ruleNames = result.Rules?.map((rule) => rule.Name) || [];
      expect(
        ruleNames.some((name) => name?.includes('succeeded'))
      ).toBeTruthy();
      expect(ruleNames.some((name) => name?.includes('failed'))).toBeTruthy();
      expect(ruleNames.some((name) => name?.includes('stopped'))).toBeTruthy();
    });

    it('should have targets configured for each rule', async () => {
      const rulesParams = {
        NamePrefix: 'codebuild-',
      };

      const rulesResult = await events.listRules(rulesParams).promise();
      const rules = rulesResult.Rules || [];

      for (const rule of rules) {
        const targetsParams = {
          Rule: rule.Name!,
        };

        const targetsResult = await events
          .listTargetsByRule(targetsParams)
          .promise();
        expect(targetsResult.Targets).toBeDefined();
        expect(targetsResult.Targets?.length).toBeGreaterThan(0);

        // Verify target is SNS topic
        const snsTarget = targetsResult.Targets?.find((target) =>
          target.Arn?.includes('sns')
        );
        expect(snsTarget).toBeDefined();
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all resources properly connected', async () => {
      // Verify CodeBuild can write to S3
      const codebuildParams = {
        names: [outputs.codebuildProjectName],
      };
      const codebuildResult = await codebuild
        .batchGetProjects(codebuildParams)
        .promise();
      const project = codebuildResult.projects![0];

      expect(project.artifacts?.location).toBe(outputs.artifactsBucketName);

      // Verify CodeBuild logs to CloudWatch
      expect(project.logsConfig?.cloudWatchLogs?.groupName).toBe(
        outputs.logGroupName
      );

      // Verify event rules target correct project
      const rulesParams = {
        NamePrefix: 'codebuild-',
      };
      const rulesResult = await events.listRules(rulesParams).promise();

      // Filter to only our stack's rules
      const ourRules = rulesResult.Rules?.filter((rule) =>
        rule.Name?.includes('synthj2t0k6m8')
      );

      expect(ourRules).toBeDefined();
      expect(ourRules!.length).toBeGreaterThan(0);

      for (const rule of ourRules || []) {
        const pattern = JSON.parse(rule.EventPattern || '{}');
        if (pattern.detail && pattern.detail['project-name']) {
          expect(pattern.detail['project-name']).toContain(
            outputs.codebuildProjectName
          );
        }
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in all resource names', () => {
      expect(outputs.artifactsBucketName).toContain('synthj2t0k6m8');
      expect(outputs.codebuildProjectName).toContain('synthj2t0k6m8');
      expect(outputs.logGroupName).toContain('synthj2t0k6m8');
      expect(outputs.snsTopicArn).toContain('synthj2t0k6m8');
      expect(outputs.codebuildRoleArn).toContain('synthj2t0k6m8');
    });
  });
});
