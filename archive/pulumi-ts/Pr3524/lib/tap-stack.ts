import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ApiStack } from './api-stack';
import { DatabaseStack } from './database-stack';
import { DistributionStack } from './distribution-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';
import { StorageStack } from './storage-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create storage resources
    const storageStack = new StorageStack(
      'storage',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create database resources
    const databaseStack = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create monitoring stack
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create Lambda functions
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        licensesTableArn: databaseStack.licensesTableArn,
        analyticsTableArn: databaseStack.analyticsTableArn,
        logGroupArns: monitoringStack.logGroupArns,
        tags,
      },
      { parent: this }
    );

    // Create CloudFront distribution
    const distributionStack = new DistributionStack(
      'distribution',
      {
        environmentSuffix,
        bucketId: storageStack.bucketId,
        bucketArn: storageStack.bucketArn,
        bucketDomainName: storageStack.bucketDomainName,
        edgeLambdaArn: lambdaStack.edgeLambdaQualifiedArn,
        logsBucketDomainName: storageStack.logsBucketDomainName,
        tags,
      },
      { parent: this }
    );

    // Create API Gateway
    const apiStack = new ApiStack(
      'api',
      {
        environmentSuffix,
        licenseApiLambdaArn: lambdaStack.licenseApiLambdaArn,
        licenseApiLambdaName: lambdaStack.licenseApiLambdaName,
        usageTrackingLambdaArn: lambdaStack.usageTrackingLambdaArn,
        usageTrackingLambdaName: lambdaStack.usageTrackingLambdaName,
        signedUrlLambdaArn: lambdaStack.signedUrlLambdaArn,
        signedUrlLambdaName: lambdaStack.signedUrlLambdaName,
        tags,
      },
      { parent: this }
    );

    this.bucketName = storageStack.bucketName;
    this.distributionUrl = distributionStack.distributionUrl;
    this.apiUrl = apiStack.apiUrl;

    this.registerOutputs({
      bucketName: this.bucketName,
      distributionUrl: this.distributionUrl,
      apiUrl: this.apiUrl,
    });
  }
}
