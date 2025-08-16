import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecureCompliantInfra } from './secure-compliant-infra';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  projectName?: string;
  allowedSshCidr?: string;
  vpcCidr?: string;
  regions?: string[];
}

export class TapStack extends pulumi.ComponentResource {
  public readonly secureInfra: SecureCompliantInfra;
  public readonly vpcIds: typeof this.secureInfra.vpcIds;
  public readonly ec2InstanceIds: typeof this.secureInfra.ec2InstanceIds;
  public readonly rdsEndpoints: typeof this.secureInfra.rdsEndpoints;
  public readonly cloudtrailArn: typeof this.secureInfra.cloudtrailArn;
  public readonly webAclArn: typeof this.secureInfra.webAclArn;
  public readonly cloudtrailBucketName: typeof this.secureInfra.cloudtrailBucketName;
  public readonly kmsKeyArns: typeof this.secureInfra.kmsKeyArns;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    this.secureInfra = new SecureCompliantInfra(
      'secure-infra',
      {
        projectName: args.projectName || 'webapp',
        environment: environmentSuffix,
        allowedSshCidr: args.allowedSshCidr || '203.0.113.0/24',
        vpcCidr: args.vpcCidr || '10.0.0.0/16',
        regions: args.regions || ['us-west-1', 'ap-south-1'],
      },
      { parent: this }
    );

    this.vpcIds = this.secureInfra.vpcIds;
    this.ec2InstanceIds = this.secureInfra.ec2InstanceIds;
    this.rdsEndpoints = this.secureInfra.rdsEndpoints;
    this.cloudtrailArn = this.secureInfra.cloudtrailArn;
    this.webAclArn = this.secureInfra.webAclArn;
    this.cloudtrailBucketName = this.secureInfra.cloudtrailBucketName;
    this.kmsKeyArns = this.secureInfra.kmsKeyArns;

    this.registerOutputs({
      vpcIds: this.vpcIds,
      ec2InstanceIds: this.ec2InstanceIds,
      rdsEndpoints: this.rdsEndpoints,
      cloudtrailArn: this.cloudtrailArn,
      webAclArn: this.webAclArn,
      cloudtrailBucketName: this.cloudtrailBucketName,
      kmsKeyArns: this.kmsKeyArns,
    });
  }
}
