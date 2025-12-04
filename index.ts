/**
 * Pulumi Program Entry Point - CI/CD Pipeline for Payment Processing Microservices
 *
 * This program deploys a complete CI/CD pipeline infrastructure including:
 * - CodePipeline with Source, Build, Test, Approval, and Deploy stages
 * - CodeBuild projects for unit tests and Docker image builds
 * - CodeDeploy for ECS blue-green deployments
 * - S3 bucket for artifacts with encryption and lifecycle rules
 * - SNS notifications for pipeline events
 * - CloudWatch Logs for build projects
 * - IAM roles with least privilege access
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get Pulumi configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');

// Required configuration
const environmentSuffix =
  config.require('environmentSuffix') || pulumi.getStack();
const region = awsConfig.get('region') || 'us-east-2';

// GitHub configuration
const githubOwner = config.get('githubOwner') || 'your-github-org';
const githubRepo = config.get('githubRepo') || 'payment-service';
const githubBranch = config.get('githubBranch') || 'main';

// Notification configuration
const notificationEmail =
  config.get('notificationEmail') || 'devops@example.com';

// ECS configuration (these would typically point to existing ECS resources)
const ecsClusterName =
  config.get('ecsClusterName') || `payment-cluster-${environmentSuffix}`;
const ecsServiceName =
  config.get('ecsServiceName') || `payment-service-${environmentSuffix}`;
const ecsBlueTargetGroupName =
  config.get('ecsBlueTargetGroupName') ||
  `payment-blue-tg-${environmentSuffix}`;
const ecsGreenTargetGroupName =
  config.get('ecsGreenTargetGroupName') ||
  `payment-green-tg-${environmentSuffix}`;
const albListenerArn =
  config.get('albListenerArn') ||
  `arn:aws:elasticloadbalancing:${region}:123456789012:listener/app/payment-alb-${environmentSuffix}/1234567890abcdef/1234567890abcdef`;

// Create the main stack
const stack = new TapStack('TapStack', {
  environmentSuffix,
  region,
  githubRepo,
  githubBranch,
  githubOwner,
  notificationEmail,
  ecsClusterName,
  ecsServiceName,
  ecsBlueTargetGroupName,
  ecsGreenTargetGroupName,
  albListenerArn,
  tags: {
    Environment: environmentSuffix,
    Project: 'payment-processing-cicd',
    CostCenter: 'fintech-operations',
    ManagedBy: 'pulumi',
  },
});

// Export stack outputs
export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
export const unitTestProjectArn = stack.unitTestProjectArn;
export const dockerBuildProjectArn = stack.dockerBuildProjectArn;
export const codeDeployApplicationArn = stack.codeDeployApplicationArn;
export const snsTopicArn = stack.snsTopicArn;
