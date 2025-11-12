/**
 * TapStack wrapper for testing compatibility
 *
 * This class wraps the functional Pulumi infrastructure to provide a
 * testable interface that matches the expected test structure.
 */

import * as pulumi from '@pulumi/pulumi';
import * as infrastructure from './index';

export interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  tags?: Record<string, string>;
}

export class TapStack {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly rdsClusterEndpoint: pulumi.Output<string>;
  public readonly rdsClusterReadEndpoint: pulumi.Output<string>;
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly rdsPasswordSecret: pulumi.Output<string>;

  constructor(_name: string, _props?: TapStackProps) {
    // The actual infrastructure is created in lib/index.ts
    // This class just provides access to the exports for testing
    // Parameters are kept for API compatibility but not used

    // Expose all exports from the infrastructure module
    this.albDnsName = infrastructure.albDnsName;
    this.vpcId = infrastructure.vpcId;
    this.ecsClusterName = infrastructure.ecsClusterName;
    this.ecsServiceName = infrastructure.ecsServiceName;
    this.rdsClusterEndpoint = infrastructure.rdsClusterEndpoint;
    this.rdsClusterReadEndpoint = infrastructure.rdsClusterReadEndpoint;
    this.flowLogsBucketName = infrastructure.flowLogsBucketName;
    this.rdsPasswordSecret = infrastructure.rdsPasswordSecret;
  }
}
