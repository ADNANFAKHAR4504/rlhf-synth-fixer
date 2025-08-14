/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecurityStack } from './stacks/security-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Optional list of allowed IP ranges for security policies.
   * Defaults to ['203.0.113.0/24'] if not provided.
   */
  allowedIpRanges?: string[];

  /**
   * Optional flag to enable enhanced security features.
   * Defaults to false if not provided.
   */
  enableEnhancedSecurity?: boolean;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., SecurityStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  // S3 Buckets
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly primaryBucketArn: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;

  // KMS Keys
  public readonly s3KmsKeyId: pulumi.Output<string>;
  public readonly s3KmsKeyArn: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyId: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyArn: pulumi.Output<string>;

  // IAM Roles
  public readonly dataAccessRoleArn: pulumi.Output<string>;
  public readonly auditRoleArn: pulumi.Output<string>;

  // CloudTrail properties
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailLogGroupArn: pulumi.Output<string>;

  // Security Policies
  public readonly securityPolicyArn: pulumi.Output<string>;
  public readonly mfaEnforcementPolicyArn: pulumi.Output<string>;
  public readonly ec2LifecyclePolicyArn: pulumi.Output<string>;
  public readonly s3SecurityPolicyArn: pulumi.Output<string>;
  public readonly cloudTrailProtectionPolicyArn: pulumi.Output<string>;
  public readonly kmsProtectionPolicyArn: pulumi.Output<string>;

  // Region confirmation
  public readonly region: string;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {};
    const allowedIpRanges = args?.allowedIpRanges;
    const enableEnhancedSecurity = args?.enableEnhancedSecurity;

    // --- Instantiate Nested Components Here ---
    // Create the security infrastructure stack
    const securityStack = new SecurityStack(
      'security-infrastructure',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
        allowedIpRanges: allowedIpRanges,
        enableEnhancedSecurity: enableEnhancedSecurity,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    // Make outputs from the security stack available as outputs of this main stack
    this.primaryBucketName = securityStack.primaryBucketName;
    this.primaryBucketArn = securityStack.primaryBucketArn;
    this.auditBucketName = securityStack.auditBucketName;
    this.auditBucketArn = securityStack.auditBucketArn;
    this.s3KmsKeyId = securityStack.s3KmsKeyId;
    this.s3KmsKeyArn = securityStack.s3KmsKeyArn;
    this.cloudTrailKmsKeyId = securityStack.cloudTrailKmsKeyId;
    this.cloudTrailKmsKeyArn = securityStack.cloudTrailKmsKeyArn;
    this.dataAccessRoleArn = securityStack.dataAccessRoleArn;
    this.auditRoleArn = securityStack.auditRoleArn;
    // CloudTrail references
    this.cloudTrailArn = securityStack.cloudTrailArn;
    this.cloudTrailLogGroupArn = securityStack.cloudTrailLogGroupArn;
    this.securityPolicyArn = securityStack.securityPolicyArn;
    this.mfaEnforcementPolicyArn = securityStack.mfaEnforcementPolicyArn;
    this.ec2LifecyclePolicyArn = securityStack.ec2LifecyclePolicyArn;
    this.s3SecurityPolicyArn = securityStack.s3SecurityPolicyArn;
    this.cloudTrailProtectionPolicyArn =
      securityStack.cloudTrailProtectionPolicyArn;
    this.kmsProtectionPolicyArn = securityStack.kmsProtectionPolicyArn;
    this.region = securityStack.region;

    // Register the outputs of this component.
    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      primaryBucketArn: this.primaryBucketArn,
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
      s3KmsKeyId: this.s3KmsKeyId,
      s3KmsKeyArn: this.s3KmsKeyArn,
      cloudTrailKmsKeyId: this.cloudTrailKmsKeyId,
      cloudTrailKmsKeyArn: this.cloudTrailKmsKeyArn,
      dataAccessRoleArn: this.dataAccessRoleArn,
      auditRoleArn: this.auditRoleArn,
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
      securityPolicyArn: this.securityPolicyArn,
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicyArn,
      s3SecurityPolicyArn: this.s3SecurityPolicyArn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
      kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
      region: this.region,
    });
  }
}
