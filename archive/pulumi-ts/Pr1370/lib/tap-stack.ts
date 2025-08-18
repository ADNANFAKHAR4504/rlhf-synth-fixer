/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of the Infrastructure component
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { Infrastructure, InfrastructureSummary } from './infrastructure';

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
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of the Infrastructure component
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly s3BucketId: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly iamRoleArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly infrastructureSummary: pulumi.Output<InfrastructureSummary>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'corporate-infrastructure',
      ManagedBy: 'pulumi',
      Owner: 'infrastructure-team',
      CostCenter: 'IT-Operations',
      ...args.tags,
    };

    // --- Instantiate Infrastructure Component ---
    const infrastructure = new Infrastructure(
      'tap-infrastructure',
      {
        environmentSuffix: environmentSuffix,
        tags: commonTags,
      },
      { parent: this }
    );

    // --- Expose Outputs from Infrastructure Component ---
    this.s3BucketId = infrastructure.s3BucketId;
    this.s3BucketArn = infrastructure.s3BucketArn;
    this.iamRoleArn = infrastructure.iamRoleArn;
    this.rdsEndpoint = infrastructure.rdsEndpoint;
    this.rdsInstanceId = infrastructure.rdsInstanceId;
    this.dynamoTableName = infrastructure.dynamoTableName;
    this.dynamoTableArn = infrastructure.dynamoTableArn;
    this.infrastructureSummary = infrastructure.infrastructureSummary;

    // Register the outputs of this component
    this.registerOutputs({
      s3BucketId: this.s3BucketId,
      s3BucketArn: this.s3BucketArn,
      iamRoleArn: this.iamRoleArn,
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: this.rdsInstanceId,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,
      infrastructureSummary: this.infrastructureSummary,
    });
  }
}

// Re-export the InfrastructureSummary interface for external use
export type { InfrastructureSummary };
