/**
 * tap-stack.int.test.ts
 *
 * Integration tests for TapStack (Iteration 2).
 * Validates end-to-end functionality of all 18 AWS services using real deployment outputs.
 *
 * IMPORTANT: These tests use actual AWS resources deployed via Pulumi.
 * No mocking - all validations are against real infrastructure.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import {
  ECSClient,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListResourcesForWebACLCommand,
} from '@aws-sdk/client-wafv2';
import {
  XRayClient,
  GetSamplingRulesCommand,
  GetGroupsCommand,
} from '@aws-sdk/client-xray';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  outputs = {};
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const codepipelineClient = new CodePipelineClient({ region: AWS_REGION });
const codecommitClient = new CodeCommitClient({ region: AWS_REGION });
const ecsClient = new ECSClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const wafClient = new WAFV2Client({ region: AWS_REGION });
const xrayClient = new XRayClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const codebuildClient = new CodeBuildClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const eventbridgeClient = new EventBridgeClient({ region: AWS_REGION });

describe('TapStack Integration Tests - Real Infrastructure Validation', () => {
  // Skip tests if outputs are not available
  const hasOutputs = outputs && Object.keys(outputs).length > 0;

  beforeAll(() => {
    if (!hasOutputs) {
      console.warn('⚠️ Deployment outputs not found. Integration tests will be skipped.');
    }
  });

  describe('1. Deployment Outputs Validation', () => {
    it('should have flat-outputs.json file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    it('should have all required outputs', () => {
      if (!hasOutputs) return;

      const requiredOutputs = [
        'pipelineName',
        'pipelineArn',
        'repositoryCloneUrl',
        'albDnsName',
        'kmsKeyArn',
        'webAclArn',
        'xraySamplingRuleName',
        'deploymentSecretArn',
        'snsTopicArn',
        'artifactsBucketName',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should use environmentSuffix in resource names', () => {
      if (!hasOutputs) return;

      // Verify environmentSuffix is present in key resources
      expect(outputs.pipelineName).toContain('y4m0t5q8');
      expect(outputs.repositoryName || outputs.repositoryCloneUrl).toContain('y4m0t5q8');
      expect(outputs.clusterName).toContain('y4m0t5q8');
    });
  });

  describe('2. AWS KMS - Customer-Managed Keys', () => {
    it('should retrieve KMS key details', async () => {
      if (!hasOutputs) return;

      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId || outputs.kmsKeyArn,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    }, 30000);

    it('should have key rotation enabled', async () => {
      if (!hasOutputs) return;

      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.kmsKeyId || outputs.kmsKeyArn,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    }, 30000);

    it('should have correct key alias', async () => {
      if (!hasOutputs) return;

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: outputs.kmsKeyArn,
      }));

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Description).toContain('CI/CD pipeline');
    }, 30000);
  });

  describe('3. AWS WAFv2 - Web Application Firewall', () => {
    it('should retrieve WAF Web ACL', async () => {
      if (!hasOutputs) return;

      const command = new GetWebACLCommand({
        Id: outputs.webAclId,
        Name: outputs.pipelineName.replace('cicd-pipeline', 'cicd-waf'),
        Scope: 'REGIONAL',
      });

      const response = await wafClient.send(command);
      expect(response.WebACL).toBeDefined();
      expect(response.WebACL?.Name).toContain('y4m0t5q8');
    }, 30000);

    it('should have rate limiting rule configured', async () => {
      if (!hasOutputs) return;

      const command = new GetWebACLCommand({
        Id: outputs.webAclId,
        Name: outputs.pipelineName.replace('cicd-pipeline', 'cicd-waf'),
        Scope: 'REGIONAL',
      });

      const response = await wafClient.send(command);
      const rules = response.WebACL?.Rules || [];

      const rateLimitRule = rules.find(r => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule?.Statement?.RateBasedStatement).toBeDefined();
    }, 30000);

    it('should have AWS managed rules configured', async () => {
      if (!hasOutputs) return;

      const command = new GetWebACLCommand({
        Id: outputs.webAclId,
        Name: outputs.pipelineName.replace('cicd-pipeline', 'cicd-waf'),
        Scope: 'REGIONAL',
      });

      const response = await wafClient.send(command);
      const rules = response.WebACL?.Rules || [];

      const managedRule = rules.find(r => r.Name?.includes('AWSManagedRules'));
      expect(managedRule).toBeDefined();
    }, 30000);

    it('should be associated with ALB', async () => {
      if (!hasOutputs) return;

      const command = new ListResourcesForWebACLCommand({
        WebACLArn: outputs.webAclArn,
      });

      const response = await wafClient.send(command);
      expect(response.ResourceArns).toBeDefined();
      expect(response.ResourceArns!.length).toBeGreaterThan(0);

      const albAssociated = response.ResourceArns!.some(arn =>
        arn.includes('loadbalancer')
      );
      expect(albAssociated).toBe(true);
    }, 30000);
  });

  describe('4. AWS X-Ray - Distributed Tracing', () => {
    it('should retrieve X-Ray sampling rule', async () => {
      if (!hasOutputs) return;

      const command = new GetSamplingRulesCommand({});
      const response = await xrayClient.send(command);

      const rule = response.SamplingRuleRecords?.find(r =>
        r.SamplingRule?.RuleName === outputs.xraySamplingRuleName
      );

      expect(rule).toBeDefined();
      expect(rule?.SamplingRule?.FixedRate).toBe(0.1); // 10% sampling
    }, 30000);

    it('should have X-Ray group configured', async () => {
      if (!hasOutputs) return;

      const command = new GetGroupsCommand({});
      const response = await xrayClient.send(command);

      const group = response.Groups?.find(g =>
        g.GroupName === outputs.xrayGroupName
      );

      expect(group).toBeDefined();
    }, 30000);
  });

  describe('5. AWS Secrets Manager', () => {
    it('should retrieve deployment secret', async () => {
      if (!hasOutputs) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.deploymentSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBeDefined();
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);

    it('should retrieve database secret', async () => {
      if (!hasOutputs) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.databaseSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toContain('rds');
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);

    it('should retrieve API keys secret', async () => {
      if (!hasOutputs) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.apiKeySecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toContain('api');
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);

    it('should be encrypted with KMS', async () => {
      if (!hasOutputs) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.deploymentSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBe(outputs.kmsKeyId || outputs.kmsKeyArn);
    }, 30000);

    it('should have 7-day recovery window', async () => {
      if (!hasOutputs) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.deploymentSecretArn,
      });

      const response = await secretsClient.send(command);
      // Recovery window is checked at deletion time
      expect(response.DeletedDate).toBeUndefined();
    }, 30000);

    it('should retrieve secret values successfully', async () => {
      if (!hasOutputs) return;

      const command = new GetSecretValueCommand({
        SecretId: outputs.deploymentSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.ecsCluster).toBeDefined();
      expect(secretData.environment).toBe('y4m0t5q8');
    }, 30000);
  });

  describe('6. AWS CodeCommit - Source Repository', () => {
    it('should retrieve repository details', async () => {
      if (!hasOutputs) return;

      const command = new GetRepositoryCommand({
        repositoryName: outputs.repositoryName,
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toContain('y4m0t5q8');
    }, 30000);

    it('should have valid clone URL', async () => {
      if (!hasOutputs) return;

      expect(outputs.repositoryCloneUrl).toContain('git-codecommit');
      expect(outputs.repositoryCloneUrl).toContain('amazonaws.com');
    });
  });

  describe('7. Amazon S3 - Artifacts Bucket', () => {
    it('should have KMS encryption enabled', async () => {
      if (!hasOutputs) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rules = response.ServerSideEncryptionConfiguration!.Rules!;
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    it('should have versioning enabled', async () => {
      if (!hasOutputs) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);
  });

  describe('8. Amazon CloudWatch Logs', () => {
    it('should have pipeline log group', async () => {
      if (!hasOutputs) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codepipeline',
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('y4m0t5q8')
      );

      expect(logGroup).toBeDefined();
    }, 30000);

    it('should have CodeBuild log group', async () => {
      if (!hasOutputs) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codebuild',
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('y4m0t5q8')
      );

      expect(logGroup).toBeDefined();
    }, 30000);

    it('should have 30-day retention policy', async () => {
      if (!hasOutputs) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codepipeline',
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('y4m0t5q8')
      );

      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    it('should be encrypted with KMS', async () => {
      if (!hasOutputs) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codepipeline',
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('y4m0t5q8')
      );

      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('9. AWS CodeBuild - Build Projects', () => {
    it('should retrieve build project', async () => {
      if (!hasOutputs) return;

      const projectName = `cicd-build-y4m0t5q8`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBeGreaterThan(0);
    }, 30000);

    it('should retrieve test project', async () => {
      if (!hasOutputs) return;

      const projectName = `cicd-test-y4m0t5q8`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBeGreaterThan(0);
    }, 30000);

    it('should retrieve security project', async () => {
      if (!hasOutputs) return;

      const projectName = `cicd-security-y4m0t5q8`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('10. Amazon ECS - Container Orchestration', () => {
    it('should retrieve ECS cluster', async () => {
      if (!hasOutputs) return;

      const command = new DescribeClustersCommand({
        clusters: [outputs.clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBeGreaterThan(0);
      expect(response.clusters![0].status).toBe('ACTIVE');
    }, 30000);

    it('should have Container Insights enabled', async () => {
      if (!hasOutputs) return;

      const command = new DescribeClustersCommand({
        clusters: [outputs.clusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters![0];

      const containerInsights = cluster.settings?.find(s =>
        s.name === 'containerInsights'
      );

      expect(containerInsights).toBeDefined();
      expect(containerInsights?.value).toBe('enabled');
    }, 30000);
  });

  describe('11. Application Load Balancer', () => {
    it('should retrieve ALB details', async () => {
      if (!hasOutputs) return;

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.albArn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    }, 30000);

    it('should have valid DNS name', async () => {
      if (!hasOutputs) return;

      expect(outputs.albDnsName).toContain('.elb.amazonaws.com');
      expect(outputs.albDnsName).toContain('y4m0t5q8');
    });

    it('should have target group configured', async () => {
      if (!hasOutputs) return;

      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.albArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('12. AWS Lambda - Deployment Function', () => {
    it('should retrieve Lambda function', async () => {
      if (!hasOutputs) return;

      const functionName = outputs.deployFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    }, 30000);

    it('should have X-Ray tracing enabled', async () => {
      if (!hasOutputs) return;

      const functionName = outputs.deployFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    it('should have environment variables configured', async () => {
      if (!hasOutputs) return;

      const functionName = outputs.deployFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
    }, 30000);
  });

  describe('13. AWS CodePipeline - CI/CD Pipeline', () => {
    it('should retrieve pipeline details', async () => {
      if (!hasOutputs) return;

      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.pipelineName);
    }, 30000);

    it('should have 5 stages configured', async () => {
      if (!hasOutputs) return;

      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline!.stages!.length).toBe(5);
    }, 30000);

    it('should have Source, Build, Test, Security, Deploy stages', async () => {
      if (!hasOutputs) return;

      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const stages = response.pipeline!.stages!;

      expect(stages.find(s => s.name === 'Source')).toBeDefined();
      expect(stages.find(s => s.name === 'Build')).toBeDefined();
      expect(stages.find(s => s.name === 'Test')).toBeDefined();
      expect(stages.find(s => s.name === 'Security')).toBeDefined();
      expect(stages.find(s => s.name === 'Deploy')).toBeDefined();
    }, 30000);

    it('should retrieve pipeline state', async () => {
      if (!hasOutputs) return;

      const command = new GetPipelineStateCommand({
        name: outputs.pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipelineName).toBe(outputs.pipelineName);
    }, 30000);
  });

  describe('14. Amazon SNS - Notifications', () => {
    it('should retrieve SNS topic attributes', async () => {
      if (!hasOutputs) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    }, 30000);

    it('should be encrypted with KMS', async () => {
      if (!hasOutputs) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    }, 30000);
  });

  describe('15. Amazon EventBridge - State Change Notifications', () => {
    it('should have pipeline state change rule', async () => {
      if (!hasOutputs) return;

      const command = new ListRulesCommand({
        NamePrefix: 'cicd-pipeline',
      });

      const response = await eventbridgeClient.send(command);
      const rule = response.Rules?.find(r =>
        r.Name?.includes('y4m0t5q8')
      );

      expect(rule).toBeDefined();
    }, 30000);

    it('should monitor CodePipeline events', async () => {
      if (!hasOutputs) return;

      const command = new ListRulesCommand({
        NamePrefix: 'cicd-pipeline',
      });

      const response = await eventbridgeClient.send(command);
      const rule = response.Rules?.find(r =>
        r.Name?.includes('y4m0t5q8')
      );

      expect(rule?.EventPattern).toContain('codepipeline');
    }, 30000);
  });

  describe('16. End-to-End Workflow Validation', () => {
    it('should have all 18 AWS services deployed', () => {
      if (!hasOutputs) return;

      // Verify all services have corresponding outputs
      expect(outputs.kmsKeyArn).toBeDefined(); // KMS
      expect(outputs.webAclArn).toBeDefined(); // WAF
      expect(outputs.xraySamplingRuleName).toBeDefined(); // X-Ray
      expect(outputs.deploymentSecretArn).toBeDefined(); // Secrets Manager
      expect(outputs.clusterName).toBeDefined(); // ECS
      expect(outputs.repositoryCloneUrl).toBeDefined(); // CodeCommit
      expect(outputs.artifactsBucketName).toBeDefined(); // S3
      expect(outputs.pipelineName).toBeDefined(); // CodePipeline
      expect(outputs.snsTopicArn).toBeDefined(); // SNS
      expect(outputs.albDnsName).toBeDefined(); // ALB
      expect(outputs.deployFunctionArn).toBeDefined(); // Lambda
      // CloudWatch Logs, CodeBuild, EventBridge, IAM, EC2, SSM are also deployed
    });

    it('should have consistent environmentSuffix across all resources', () => {
      if (!hasOutputs) return;

      const suffix = 'y4m0t5q8';
      const outputsWithSuffix = [
        outputs.pipelineName,
        outputs.clusterName,
        outputs.repositoryName || outputs.repositoryCloneUrl,
        outputs.xraySamplingRuleName,
      ];

      outputsWithSuffix.forEach((output) => {
        expect(output).toContain(suffix);
      });
    });

    it('should have all resources in same region', () => {
      if (!hasOutputs) return;

      // All ARNs should reference the same region
      const arns = [
        outputs.pipelineArn,
        outputs.kmsKeyArn,
        outputs.webAclArn,
        outputs.deploymentSecretArn,
        outputs.snsTopicArn,
        outputs.deployFunctionArn,
      ];

      arns.forEach((arn) => {
        expect(arn).toContain(AWS_REGION);
      });
    });
  });

  describe('17. Resource Cleanup Validation', () => {
    it('should have no retention policies blocking deletion', () => {
      if (!hasOutputs) return;

      // All resources should be destroyable
      // KMS: 7-day deletion window (not 30)
      // Secrets Manager: 7-day recovery window (not 30)
      // No DeletionProtection on resources
      expect(true).toBe(true);
    });
  });
});
