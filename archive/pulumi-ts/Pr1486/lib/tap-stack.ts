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

    const region = config.get('region') || 'ap-south-1';

    const infrastructureConfig: InfrastructureConfig = {
      region,
      availabilityZones: config.getObject<string[]>('availabilityZones') || [
        `${region}a`,
        `${region}b`,
      ],
      vpcCidr: config.get('vpcCidr') || '10.0.0.0/16',
      publicSubnetCidrs: config.getObject<string[]>('publicSubnetCidrs') || [
        '10.0.1.0/24',
        '10.0.2.0/24',
      ],
      privateSubnetCidrs: config.getObject<string[]>('privateSubnetCidrs') || [
        '10.0.10.0/24',
        '10.0.20.0/24',
      ],
      rdsConfig: config.getObject('rdsConfig') || {
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        engine: 'mysql',
        engineVersion: '8.0',
        dbName: 'appdb',
        username: 'admin',
      },
      s3Config: config.getObject('s3Config') || {
        lifecyclePolicies: {
          transitionToIa: 30,
          transitionToGlacier: 90,
          expiration: 365,
        },
      },
      tags: {
        ...(config.getObject<Record<string, string>>('tags') || {
          Environment: environmentSuffix,
          Project: 'TAP',
          Owner: 'DevTeam',
        }),
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
