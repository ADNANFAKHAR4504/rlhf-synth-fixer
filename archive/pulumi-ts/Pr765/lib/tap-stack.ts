/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations for secure AWS infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CloudWatchMonitoring } from './cloudWatchComponent';
import { IAMRole } from './iamComponent';
import { SecureS3Bucket } from './secureS3Bucket';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'development', 'production').
   * Defaults to 'development' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of secure S3 buckets, IAM roles
 * with least privilege, and CloudWatch monitoring infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  // Stack outputs for integration testing
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly bucketRegionalDomainName: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyAlias: pulumi.Output<string>;
  public readonly roleArn: pulumi.Output<string>;
  public readonly roleName: pulumi.Output<string>;
  public readonly roleId: pulumi.Output<string>;
  public readonly rolePath: pulumi.Output<string | undefined>;
  public readonly metricAlarmArn: pulumi.Output<string>;
  public readonly metricAlarmName: pulumi.Output<string>;
  public readonly logGroupArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly eventRuleArn: pulumi.Output<string>;
  public readonly eventRuleName: pulumi.Output<string>;
  public readonly eventTargetId: pulumi.Output<string>;
  public readonly bucketVersioningId: pulumi.Output<string>;
  public readonly bucketEncryptionId: pulumi.Output<string>;
  public readonly bucketPublicAccessBlockId: pulumi.Output<string>;
  public readonly rolePolicyId: pulumi.Output<string>;
  public readonly rolePolicyName: pulumi.Output<string>;
  /**
   * Creates a new TapStack component.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get environment suffix from args, config, or default to 'dev'
    const config = new pulumi.Config();
    const environmentSuffix =
      args.environmentSuffix || config.get('environmentSuffix') || 'dev';

    const tags = args.tags || {};

    // Merge with mandatory tags
    const allTags = pulumi.all([tags]).apply(([userTags]) => ({
      ...userTags,
      Department: 'Security',
      Project: 'PulumiIaCProject',
    }));

    // Create secure S3 buckets for both development and production environments
    const bucket = new SecureS3Bucket(
      'development-bucket',
      {
        environmentSuffix: environmentSuffix,
        tags: allTags,
      },
      { parent: this }
    );

    // Create IAM roles with least privilege for each environment
    const role = new IAMRole(
      `${environmentSuffix}-role`,
      {
        environmentSuffix: environmentSuffix,
        bucketArn: bucket.bucketArn,
        tags: allTags,
      },
      { parent: this }
    );

    // Create CloudWatch monitoring for production bucket
    const monitoring = new CloudWatchMonitoring(
      `${environmentSuffix}-monitoring`,
      {
        environmentSuffix: environmentSuffix,
        bucketName: bucket.bucketName,
        tags: allTags,
      },
      { parent: this }
    );

    // Assign outputs to public properties for stack-level access
    this.bucketArn = bucket.bucketArn;
    this.bucketName = bucket.bucketName;
    this.bucketId = bucket.bucket.id;
    this.bucketDomainName = bucket.bucket.bucketDomainName;
    this.bucketRegionalDomainName = bucket.bucket.bucketRegionalDomainName;
    this.kmsKeyArn = bucket.kmsKey.keyArn;
    this.kmsKeyId = bucket.kmsKey.keyId;
    this.kmsKeyAlias = bucket.kmsKey.keyAlias.name;
    this.roleArn = role.roleArn;
    this.roleName = role.roleName;
    this.roleId = role.role.id;
    this.rolePath = role.role.path;
    this.metricAlarmArn = monitoring.metricAlarm.arn;
    this.metricAlarmName = monitoring.metricAlarm.name;
    this.logGroupArn = monitoring.logGroup.arn;
    this.logGroupName = monitoring.logGroup.name;
    this.eventRuleArn = monitoring.eventRule.arn;
    this.eventRuleName = monitoring.eventRule.name;
    this.eventTargetId = monitoring.eventTarget.targetId;
    this.bucketVersioningId = bucket.bucketVersioning.id;
    this.bucketEncryptionId = bucket.bucketEncryption.id;
    this.bucketPublicAccessBlockId = bucket.bucketPublicAccessBlock.id;
    this.rolePolicyId = role.rolePolicy.id;
    this.rolePolicyName = role.rolePolicy.name;

    // Register the outputs of this component
    this.registerOutputs({
      // S3 Bucket outputs
      bucketArn: this.bucketArn,
      bucketName: this.bucketName,
      bucketId: this.bucketId,
      bucketDomainName: this.bucketDomainName,
      bucketRegionalDomainName: this.bucketRegionalDomainName,
      // KMS Key outputs
      kmsKeyArn: this.kmsKeyArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyAlias: this.kmsKeyAlias,
      // IAM Role outputs
      roleArn: this.roleArn,
      roleName: this.roleName,
      roleId: this.roleId,
      rolePath: this.rolePath,
      // CloudWatch Monitoring outputs
      metricAlarmArn: this.metricAlarmArn,
      metricAlarmName: this.metricAlarmName,
      logGroupArn: this.logGroupArn,
      logGroupName: this.logGroupName,
      eventRuleArn: this.eventRuleArn,
      eventRuleName: this.eventRuleName,
      eventTargetId: this.eventTargetId,
      // Additional AWS resource outputs for integration testing
      bucketVersioningId: this.bucketVersioningId,
      bucketEncryptionId: this.bucketEncryptionId,
      bucketPublicAccessBlockId: this.bucketPublicAccessBlockId,
      rolePolicyId: this.rolePolicyId,
      rolePolicyName: this.rolePolicyName,
    });
  }
}
