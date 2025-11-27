/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource orchestrating the complete CI/CD pipeline infrastructure.
 *
 * This stack integrates 18 AWS services across 15 component stacks for a production-grade
 * multi-stage CI/CD pipeline with enhanced security, monitoring, and compliance features.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import all component stacks
import { KmsStack } from './kms-stack';
import { WafStack } from './waf-stack';
import { XrayStack } from './xray-stack';
import { SecretsStack } from './secrets-stack';
import { VpcStack } from './vpc-stack';
import { CodeCommitStack } from './codecommit-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';
import { CodeBuildStack } from './codebuild-stack';
import { EcsStack } from './ecs-stack';
import { LambdaStack } from './lambda-stack';
import { CodePipelineStack } from './codepipeline-stack';
import { SnsStack } from './sns-stack';
import { EventBridgeStack } from './eventbridge-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'staging', 'prod').
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * TapStack - Main component resource for CI/CD pipeline infrastructure.
 *
 * Provisions a complete multi-stage CI/CD pipeline with:
 * - 5-stage CodePipeline (Source, Build, Test, Security, Deploy)
 * - KMS encryption for data at rest
 * - WAFv2 protection for ALB
 * - X-Ray distributed tracing
 * - Secrets Manager for sensitive configuration
 * - Blue-green deployment strategy
 * - EventBridge notifications
 * - CloudWatch Logs with 30-day retention
 *
 * AWS Services (18 total):
 * 1. AWS KMS
 * 2. AWS WAF v2
 * 3. AWS X-Ray
 * 4. AWS Secrets Manager
 * 5. Amazon VPC
 * 6. AWS CodeCommit
 * 7. Amazon S3
 * 8. Amazon CloudWatch Logs
 * 9. AWS CodeBuild
 * 10. Amazon ECS (Fargate)
 * 11. Application Load Balancer (ALB)
 * 12. AWS Lambda
 * 13. AWS CodePipeline
 * 14. Amazon SNS
 * 15. Amazon EventBridge
 * 16. AWS IAM (roles, policies)
 * 17. Amazon EC2 (VPC, subnets, security groups)
 * 18. AWS Systems Manager (SSM) - for non-sensitive config
 */
export class TapStack extends pulumi.ComponentResource {
  // Public outputs from nested stacks
  public readonly pipelineName: pulumi.Output<string>;
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly repositoryCloneUrl: pulumi.Output<string>;
  public readonly webAclArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: environmentSuffix,
      Project: 'CI/CD Pipeline',
      ManagedBy: 'Pulumi',
    };

    // --- Stack 1: KMS (Customer-Managed Keys with Rotation) ---
    const kmsStack = new KmsStack(
      'kms',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // --- Stack 2: X-Ray (Distributed Tracing) ---
    const xrayStack = new XrayStack(
      'xray',
      {
        environmentSuffix,
        sampleRate: 0.1, // 10% sampling
        tags,
      },
      { parent: this }
    );

    // --- Stack 3: Secrets Manager (Sensitive Configuration) ---
    const secretsStack = new SecretsStack(
      'secrets',
      {
        environmentSuffix,
        kmsKeyId: kmsStack.pipelineKey.id,
        tags,
      },
      { parent: this }
    );

    // --- Stack 4: CloudWatch (Log Groups with KMS Encryption) ---
    const cloudwatchStack = new CloudWatchStack(
      'cloudwatch',
      {
        environmentSuffix,
        kmsKeyId: kmsStack.pipelineKey.id,
        tags,
      },
      { parent: this }
    );

    // --- Stack 5: VPC (3 AZs, Public/Private Subnets) ---
    const vpcStack = new VpcStack(
      'vpc',
      {
        environmentSuffix,
        vpcCidr: '10.0.0.0/16',
        enableNatGateway: false, // Disabled for cost optimization
        kmsKeyId: kmsStack.pipelineKey.id,
        tags,
      },
      { parent: this }
    );

    // --- Stack 6: CodeCommit (Source Repository) ---
    const codecommitStack = new CodeCommitStack(
      'codecommit',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // --- Stack 7: S3 (Artifacts Bucket with KMS Encryption) ---
    const s3Stack = new S3Stack(
      's3',
      {
        environmentSuffix,
        kmsKeyId: kmsStack.pipelineKey.id,
        kmsKeyArn: kmsStack.pipelineKeyArn,
        tags,
      },
      { parent: this }
    );

    // --- Stack 8: CodeBuild (Build, Test, Security Projects) ---
    const codebuildStack = new CodeBuildStack(
      'codebuild',
      {
        environmentSuffix,
        artifactsBucket: s3Stack.artifactsBucket.bucket,
        kmsKeyArn: kmsStack.pipelineKeyArn,
        logGroupArn: cloudwatchStack.codebuildLogGroup.arn,
        tags,
      },
      { parent: this }
    );

    // --- Stack 9: ECS (Cluster, ALB, Security Groups) ---
    const ecsStack = new EcsStack(
      'ecs',
      {
        environmentSuffix,
        vpcId: vpcStack.vpc.id,
        publicSubnetIds: vpcStack.publicSubnets.map(s => s.id),
        privateSubnetIds: vpcStack.privateSubnets.map(s => s.id),
        kmsKeyArn: kmsStack.pipelineKeyArn,
        tags,
      },
      { parent: this }
    );

    // --- Stack 10: WAF v2 (Web ACL for ALB) ---
    const wafStack = new WafStack(
      'waf',
      {
        environmentSuffix,
        albArn: ecsStack.alb.arn,
        enableGeoBlocking: false, // Optional
        tags,
      },
      { parent: this }
    );

    // --- Stack 11: Lambda (Blue-Green Deployment Orchestration) ---
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        clusterName: ecsStack.cluster.name,
        serviceName: `cicd-service-${environmentSuffix}`,
        deploymentSecretArn: secretsStack.deploymentSecret.arn,
        kmsKeyArn: kmsStack.pipelineKeyArn,
        tags,
      },
      { parent: this }
    );

    // --- Stack 12: SNS (Notification Topic) ---
    const snsStack = new SnsStack(
      'sns',
      {
        environmentSuffix,
        kmsKeyId: kmsStack.pipelineKey.id,
        tags,
      },
      { parent: this }
    );

    // --- Stack 13: CodePipeline (5-Stage Pipeline) ---
    const codepipelineStack = new CodePipelineStack(
      'codepipeline',
      {
        environmentSuffix,
        repositoryName: codecommitStack.repository.repositoryName,
        artifactsBucket: s3Stack.artifactsBucket.bucket,
        kmsKeyArn: kmsStack.pipelineKeyArn,
        buildProjectName: codebuildStack.buildProject.name,
        testProjectName: codebuildStack.testProject.name,
        securityProjectName: codebuildStack.securityProject.name,
        deployFunctionName: lambdaStack.deployFunction.name,
        tags,
      },
      { parent: this }
    );

    // --- Stack 14: EventBridge (Pipeline State Change Notifications) ---
    new EventBridgeStack(
      'eventbridge',
      {
        environmentSuffix,
        pipelineName: codepipelineStack.pipeline.name,
        snsTopicArn: snsStack.notificationTopic.arn,
        tags,
      },
      { parent: this }
    );

    // --- Expose Key Outputs ---
    this.pipelineName = codepipelineStack.pipeline.name;
    this.pipelineArn = codepipelineStack.pipeline.arn;
    this.albDnsName = ecsStack.alb.dnsName;
    this.repositoryCloneUrl = codecommitStack.repositoryCloneUrlHttp;
    this.webAclArn = wafStack.webAcl.arn;

    // Register outputs
    this.registerOutputs({
      // Pipeline
      pipelineName: this.pipelineName,
      pipelineArn: this.pipelineArn,

      // Repository
      repositoryName: codecommitStack.repository.repositoryName,
      repositoryCloneUrl: this.repositoryCloneUrl,

      // ECS and ALB
      clusterName: ecsStack.cluster.name,
      albDnsName: this.albDnsName,
      albArn: ecsStack.alb.arn,

      // Security
      kmsKeyId: kmsStack.pipelineKey.id,
      kmsKeyArn: kmsStack.pipelineKeyArn,
      webAclId: wafStack.webAcl.id,
      webAclArn: this.webAclArn,

      // Monitoring
      xraySamplingRuleName: xrayStack.samplingRule.ruleName,
      xrayGroupName: xrayStack.xrayGroup.groupName,
      snsTopicArn: snsStack.notificationTopic.arn,

      // Secrets
      deploymentSecretArn: secretsStack.deploymentSecret.arn,
      databaseSecretArn: secretsStack.databaseSecret.arn,
      apiKeySecretArn: secretsStack.apiKeySecret.arn,

      // Lambda
      deployFunctionArn: lambdaStack.deployFunction.arn,

      // Artifacts
      artifactsBucketName: s3Stack.artifactsBucket.bucket,
    });
  }
}
