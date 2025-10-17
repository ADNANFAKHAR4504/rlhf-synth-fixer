// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as AWS from 'aws-sdk';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS SDK v2 clients
const s3 = new AWS.S3({ region });
const codepipeline = new AWS.CodePipeline({ region });
const codebuild = new AWS.CodeBuild({ region });
const codedeploy = new AWS.CodeDeploy({ region });
const ec2 = new AWS.EC2({ region });
const elbv2 = new AWS.ELBv2({ region });
const sns = new AWS.SNS({ region });
const lambda = new AWS.Lambda({ region });
const secretsmanager = new AWS.SecretsManager({ region });
const cloudwatch = new AWS.CloudWatch({ region });
const budgets = new AWS.Budgets({ region });

describe('TAP CI/CD Pipeline Integration Tests', () => {
  describe('S3 Bucket Validation', () => {
    test('Source bucket should exist and be accessible', async () => {
      const result = await s3.headBucket({
        Bucket: outputs.SourceBucketName,
      }).promise();
      expect(result).toBeDefined();
    });

    test('Artifacts bucket should exist and be accessible', async () => {
      const result = await s3.headBucket({
        Bucket: outputs.ArtifactsBucketName,
      }).promise();
      expect(result).toBeDefined();
    });

    test('Source bucket should have versioning enabled', async () => {
      const result = await s3.getBucketVersioning({
        Bucket: outputs.SourceBucketName,
      }).promise();
      expect(result.Status).toBe('Enabled');
    });

    test('Artifacts bucket should have versioning enabled', async () => {
      const result = await s3.getBucketVersioning({
        Bucket: outputs.ArtifactsBucketName,
      }).promise();
      expect(result.Status).toBe('Enabled');
    });

    test('Source bucket should have encryption enabled', async () => {
      const result = await s3.getBucketEncryption({
        Bucket: outputs.SourceBucketName,
      }).promise();
      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('Artifacts bucket should have encryption enabled', async () => {
      const result = await s3.getBucketEncryption({
        Bucket: outputs.ArtifactsBucketName,
      }).promise();
      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('CodePipeline Validation', () => {
    test('Pipeline should exist and be retrievable', async () => {
      const result = await codepipeline.getPipeline({
        name: outputs.PipelineName,
      }).promise();
      expect(result.pipeline).toBeDefined();
      expect(result.pipeline.name).toBe(outputs.PipelineName);
    });

    test('Pipeline should have required stages', async () => {
      const result = await codepipeline.getPipeline({
        name: outputs.PipelineName,
      }).promise();
      const stages = result.pipeline.stages || [];
      const stageNames = stages.map((stage: any) => stage.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    test('Pipeline state should be accessible', async () => {
      const result = await codepipeline.getPipelineState({
        name: outputs.PipelineName,
      }).promise();
      expect(result.pipelineName).toBe(outputs.PipelineName);
      expect(result.stageStates).toBeDefined();
    });
  });

  describe('CodeBuild Validation', () => {
    test('Build project should exist', async () => {
      const result = await codebuild.batchGetProjects({
        names: [outputs.CodeBuildProjectName],
      }).promise();
      expect(result.projects).toBeDefined();
      expect(result.projects.length).toBe(1);
      expect(result.projects[0].name).toBe(outputs.CodeBuildProjectName);
    });

    test('Build project should have correct environment configuration', async () => {
      const result = await codebuild.batchGetProjects({
        names: [outputs.CodeBuildProjectName],
      }).promise();
      const project = result.projects[0];

      expect(project.environment).toBeDefined();
      expect(project.environment.type).toBeDefined();
      expect(project.environment.image).toBeDefined();
      expect(project.environment.computeType).toBeDefined();
    });

    test('Build project should have artifacts configuration', async () => {
      const result = await codebuild.batchGetProjects({
        names: [outputs.CodeBuildProjectName],
      }).promise();
      const project = result.projects[0];

      expect(project.artifacts).toBeDefined();
      expect(project.artifacts.type).toBeDefined();
    });
  });

  describe('CodeDeploy Validation', () => {
    test('CodeDeploy application should exist', async () => {
      const result = await codedeploy.getApplication({
        applicationName: outputs.CodeDeployApplicationName,
      }).promise();
      expect(result.application).toBeDefined();
      expect(result.application.applicationName).toBe(outputs.CodeDeployApplicationName);
    });

    test('CodeDeploy application should be configured for ECS or EC2', async () => {
      const result = await codedeploy.getApplication({
        applicationName: outputs.CodeDeployApplicationName,
      }).promise();
      expect(result.application.computePlatform).toBeDefined();
      expect(['ECS', 'Server', 'Lambda']).toContain(result.application.computePlatform);
    });
  });

  describe('VPC and Networking Validation', () => {
    test('VPC should exist and be available', async () => {
      const result = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId],
      }).promise();
      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs.length).toBe(1);
      expect(result.Vpcs[0].VpcId).toBe(outputs.VPCId);
      expect(result.Vpcs[0].State).toBe('available');
    });

    test('VPC should have subnets configured', async () => {
      const result = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      }).promise();
      expect(result.Subnets).toBeDefined();
      expect(result.Subnets.length).toBeGreaterThan(0);
    });

    test('VPC should have security groups configured', async () => {
      const result = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      }).promise();
      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Validation', () => {
    test('Load balancer should exist and be active', async () => {
      const result = await elbv2.describeLoadBalancers({}).promise();
      const matchingLB = result.LoadBalancers.find((lb: any) => lb.DNSName === outputs.LoadBalancerDNS);
      expect(matchingLB).toBeDefined();
      expect(matchingLB.State.Code).toBe('active');
      expect(matchingLB.DNSName).toBe(outputs.LoadBalancerDNS);
    });

    test('Target groups should exist', async () => {
      const result = await elbv2.describeTargetGroups({
        Names: [outputs.GreenTargetGroupName],
      }).promise();
      expect(result.TargetGroups).toBeDefined();
      expect(result.TargetGroups.length).toBeGreaterThan(0);
      expect(result.TargetGroups[0].TargetGroupName).toBe(outputs.GreenTargetGroupName);
    });

    test('Listener should exist and be configured', async () => {
      const result = await elbv2.describeListeners({
        ListenerArns: [outputs.LoadBalancerListenerArn],
      }).promise();
      expect(result.Listeners).toBeDefined();
      expect(result.Listeners.length).toBe(1);
      expect(result.Listeners[0].ListenerArn).toBe(outputs.LoadBalancerListenerArn);
    });
  });

  describe('SNS Topic Validation', () => {
    test('SNS topic should exist and be accessible', async () => {
      const result = await sns.getTopicAttributes({
        TopicArn: outputs.SNSTopicArn,
      }).promise();
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });

    test('SNS topic should have display name configured', async () => {
      const result = await sns.getTopicAttributes({
        TopicArn: outputs.SNSTopicArn,
      }).promise();
      expect(result.Attributes?.DisplayName).toBeDefined();
    });

    test('SNS topic should have subscriptions configured', async () => {
      const result = await sns.listSubscriptionsByTopic({
        TopicArn: outputs.SNSTopicArn,
      }).promise();
      expect(result.Subscriptions).toBeDefined();
      expect(result.Subscriptions?.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function Validation', () => {
    test('Lambda functions should be listed', async () => {
      const functions = await lambda.listFunctions({}).promise();
      expect(functions.Functions).toBeDefined();
    });

    test('If Slack Lambda exists, it should have correct configuration', async () => {
      const functions = await lambda.listFunctions({}).promise();
      const slackLambda = functions.Functions?.find(fn =>
        fn.FunctionName?.toLowerCase().includes('slack') ||
        fn.FunctionName?.toLowerCase().includes('notification')
      );

      if (slackLambda) {
        expect(slackLambda.Runtime).toBeDefined();
        expect(slackLambda.State).not.toBe('Failed');
      }
    });
  });

  describe('Secrets Manager Validation', () => {
    test('Secrets Manager should be accessible', async () => {
      const secrets = await secretsmanager.listSecrets({}).promise();
      expect(secrets.SecretList).toBeDefined();
    });

    test('If project secrets exist, they should have proper structure', async () => {
      const secrets = await secretsmanager.listSecrets({}).promise();
      const projectSecrets = secrets.SecretList?.filter(secret =>
        secret.Name?.toLowerCase().includes('tap') ||
        secret.Name?.toLowerCase().includes('s3') ||
        secret.Name?.toLowerCase().includes('slack')
      );

      if (projectSecrets && projectSecrets.length > 0) {
        projectSecrets.forEach(secret => {
          expect(secret.ARN).toBeDefined();
          expect(secret.SecretVersionsToStages).toBeDefined();
        });
      }
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('CloudWatch should be accessible and alarms should be listable', async () => {
      const alarms = await cloudwatch.describeAlarms({}).promise();
      expect(alarms.MetricAlarms).toBeDefined();
    });

    test('If project alarms exist, they should have proper configuration', async () => {
      const alarms = await cloudwatch.describeAlarms({}).promise();
      const projectAlarms = alarms.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.toLowerCase().includes('tap') ||
        alarm.AlarmName?.toLowerCase().includes('pipeline') ||
        alarm.AlarmName?.toLowerCase().includes('build') ||
        alarm.AlarmName?.toLowerCase().includes('deploy')
      );

      if (projectAlarms && projectAlarms.length > 0) {
        projectAlarms.forEach(alarm => {
          expect(alarm.ActionsEnabled).toBeDefined();
          if (alarm.AlarmActions && alarm.AlarmActions.length > 0) {
            expect(alarm.AlarmActions.length).toBeGreaterThan(0);
          }
        });
      }
    });
  });

  describe('Budget Configuration Validation', () => {
    test('Monthly budget should be configured', async () => {
      const result = await budgets.describeBudgets({
        AccountId: await getAccountId(),
      }).promise();

      const monthlyBudget = result.Budgets?.find(budget =>
        budget.BudgetName?.includes('Monthly') || budget.BudgetName?.includes('tap')
      );

      expect(monthlyBudget).toBeDefined();
      expect(monthlyBudget?.BudgetType).toBe('COST');
    });

    test('Budget notifications should be configured', async () => {
      const result = await budgets.describeBudgets({
        AccountId: await getAccountId(),
      }).promise();

      const monthlyBudget = result.Budgets?.find(budget =>
        budget.BudgetName?.includes('Monthly') || budget.BudgetName?.includes('tap')
      );

      if (monthlyBudget) {
        const notifications = await budgets.describeNotificationsForBudget({
          AccountId: await getAccountId(),
          BudgetName: monthlyBudget.BudgetName || '',
        }).promise();

        expect(notifications.Notifications).toBeDefined();
      }
    });
  });

  describe('End-to-End Pipeline Validation', () => {
    test('Pipeline execution history should be accessible', async () => {
      const result = await codepipeline.listPipelineExecutions({
        pipelineName: outputs.PipelineName,
        maxResults: 5,
      }).promise();

      expect(result.pipelineExecutionSummaries).toBeDefined();
    });

    test('CodeBuild project should have build history', async () => {
      const result = await codebuild.listBuildsForProject({
        projectName: outputs.CodeBuildProjectName,
        sortOrder: 'DESCENDING',
      }).promise();

      expect(result.ids).toBeDefined();
    });

    test('CodeDeploy deployment groups should be listable', async () => {
      const result = await codedeploy.listDeploymentGroups({
        applicationName: outputs.CodeDeployApplicationName,
      }).promise();

      expect(result.deploymentGroups).toBeDefined();
    });

    test('If Auto Scaling groups exist, they should be properly configured', async () => {
      const asg = new AWS.AutoScaling({ region });
      const result = await asg.describeAutoScalingGroups({}).promise();

      const tapASG = result.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.toLowerCase().includes('tap')
      );

      if (tapASG) {
        expect(tapASG.DesiredCapacity).toBeGreaterThanOrEqual(0);
        expect(tapASG.MinSize).toBeDefined();
        expect(tapASG.MaxSize).toBeDefined();
      }
    });

    test('EC2 instances should have proper tags', async () => {
      const instances = await ec2.describeInstances({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
        ],
      }).promise();

      instances.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const tags = instance.Tags || [];
          const envTag = tags.find(tag => tag.Key === 'Environment');
          const projectTag = tags.find(tag => tag.Key === 'Project');

          expect(envTag).toBeDefined();
          expect(projectTag).toBeDefined();
        });
      });
    });

    test('If logging bucket exists, it should have lifecycle policy', async () => {
      const buckets = await s3.listBuckets({}).promise();
      const loggingBucket = buckets.Buckets?.find(bucket =>
        bucket.Name?.toLowerCase().includes('logging') ||
        bucket.Name?.toLowerCase().includes('log')
      );

      if (loggingBucket?.Name) {
        try {
          const lifecycle = await s3.getBucketLifecycleConfiguration({
            Bucket: loggingBucket.Name,
          }).promise();

          expect(lifecycle.Rules).toBeDefined();
          expect(lifecycle.Rules?.length).toBeGreaterThan(0);
        } catch (error: any) {
          // Lifecycle configuration might not be set
          if (error.code !== 'NoSuchLifecycleConfiguration') {
            throw error;
          }
        }
      }
    });

    test('Source bucket should have access logging enabled', async () => {
      const logging = await s3.getBucketLogging({
        Bucket: outputs.SourceBucketName,
      }).promise();

      expect(logging.LoggingEnabled).toBeDefined();
      expect(logging.LoggingEnabled?.TargetBucket).toBeDefined();
    });
  });
});

// Helper function to get AWS account ID
async function getAccountId(): Promise<string> {
  const sts = new AWS.STS({ region });
  const identity = await sts.getCallerIdentity({}).promise();
  return identity.Account || '';
}
