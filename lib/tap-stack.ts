import * as pulumi from '@pulumi/pulumi';
import { Infrastructure, InfrastructureConfig } from './infrastructure';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly infrastructure: Infrastructure;
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly applicationRoleArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly instanceProfileArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const config = new pulumi.Config();
    const region = config.require('region');

    const infrastructureConfig: InfrastructureConfig = {
      region,
      availabilityZones: config.requireObject<string[]>('availabilityZones'),
      vpcCidr: config.require('vpcCidr'),
      publicSubnetCidrs: config.requireObject<string[]>('publicSubnetCidrs'),
      privateSubnetCidrs: config.requireObject<string[]>('privateSubnetCidrs'),
      rdsConfig: config.requireObject('rdsConfig'),
      s3Config: config.requireObject('s3Config'),
      tags: {
        ...(config.getObject<Record<string, string>>('tags') || {}),
        ...(args.tags || {}),
        Environment: environmentSuffix,
      },
    };

    // Create the infrastructure
    this.infrastructure = new Infrastructure(
      'infrastructure',
      infrastructureConfig,
      environmentSuffix,
      { parent: this }
    );

    // Export outputs
    this.vpcId = this.infrastructure.vpcId;
    this.publicSubnetIds = this.infrastructure.publicSubnetIds;
    this.privateSubnetIds = this.infrastructure.privateSubnetIds;
    this.rdsEndpoint = this.infrastructure.rdsEndpoint;
    this.s3BucketName = this.infrastructure.s3BucketName;
    this.applicationRoleArn = this.infrastructure.applicationRoleArn;
    this.kmsKeyId = this.infrastructure.kmsKeyId;
    this.instanceProfileArn = this.infrastructure.instanceProfileArn;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      rdsEndpoint: this.rdsEndpoint,
      s3BucketName: this.s3BucketName,
      applicationRoleArn: this.applicationRoleArn,
      kmsKeyId: this.kmsKeyId,
      instanceProfileArn: this.instanceProfileArn,
    });
  }
}
