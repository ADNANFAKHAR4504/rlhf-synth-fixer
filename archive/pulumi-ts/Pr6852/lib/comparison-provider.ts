import * as pulumi from '@pulumi/pulumi';
import { ConfigComparison } from './types';
import { environmentConfigs } from './config';

/**
 * Generate configuration comparison report
 */
export function generateConfigComparison(): ConfigComparison {
  const differences: string[] = [];

  // Compare VPC CIDRs
  differences.push(
    `VPC CIDR: dev=${environmentConfigs.dev.vpcCidr}, staging=${environmentConfigs.staging.vpcCidr}, prod=${environmentConfigs.prod.vpcCidr}`
  );

  // Compare RDS instance classes
  differences.push(
    `RDS Instance: dev=${environmentConfigs.dev.rdsInstanceClass}, staging=${environmentConfigs.staging.rdsInstanceClass}, prod=${environmentConfigs.prod.rdsInstanceClass}`
  );

  // Compare API Gateway rate limits
  differences.push(
    `API Rate Limit: dev=${environmentConfigs.dev.apiGatewayRateLimit}, staging=${environmentConfigs.staging.apiGatewayRateLimit}, prod=${environmentConfigs.prod.apiGatewayRateLimit}`
  );

  // Compare DynamoDB capacity
  differences.push(
    `DynamoDB Read Capacity: dev=${environmentConfigs.dev.dynamoReadCapacity}, staging=${environmentConfigs.staging.dynamoReadCapacity}, prod=${environmentConfigs.prod.dynamoReadCapacity}`
  );
  differences.push(
    `DynamoDB Write Capacity: dev=${environmentConfigs.dev.dynamoWriteCapacity}, staging=${environmentConfigs.staging.dynamoWriteCapacity}, prod=${environmentConfigs.prod.dynamoWriteCapacity}`
  );

  // Compare S3 retention
  differences.push(
    `S3 Retention: dev=${environmentConfigs.dev.s3RetentionDays} days, staging=${environmentConfigs.staging.s3RetentionDays} days, prod=${environmentConfigs.prod.s3RetentionDays} days`
  );

  // Compare CloudWatch thresholds
  differences.push(
    `CloudWatch Threshold: dev=${environmentConfigs.dev.cloudWatchThreshold}%, staging=${environmentConfigs.staging.cloudWatchThreshold}%, prod=${environmentConfigs.prod.cloudWatchThreshold}%`
  );

  return {
    dev: environmentConfigs.dev,
    staging: environmentConfigs.staging,
    prod: environmentConfigs.prod,
    differences,
  };
}

/**
 * Custom dynamic provider for configuration comparison
 */
export class ConfigComparisonProvider
  implements pulumi.dynamic.ResourceProvider
{
  async create(_inputs: any): Promise<pulumi.dynamic.CreateResult> {
    const comparison = generateConfigComparison();
    return {
      id: 'config-comparison',
      outs: {
        report: comparison,
      },
    };
  }

  async update(
    _id: string,
    _olds: any,
    _news: any
  ): Promise<pulumi.dynamic.UpdateResult> {
    const comparison = generateConfigComparison();
    return {
      outs: {
        report: comparison,
      },
    };
  }

  async read(id: string, props: any): Promise<pulumi.dynamic.ReadResult> {
    return {
      id,
      props,
    };
  }

  async delete(_id: string, _props: any): Promise<void> {
    // Nothing to delete
  }
}

/**
 * Custom resource for configuration comparison
 */
export class ConfigComparisonResource extends pulumi.dynamic.Resource {
  public readonly report!: pulumi.Output<ConfigComparison>;

  /* istanbul ignore next */
  constructor(name: string, opts?: pulumi.CustomResourceOptions) {
    super(new ConfigComparisonProvider(), name, { report: undefined }, opts);
  }
}
