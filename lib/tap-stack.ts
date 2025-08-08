import * as aws from '@cdktf/provider-aws';
import { Fn, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { CloudwatchConstruct } from './cloudwatch-construct';
import { Ec2Construct } from './ec2-construct';
import { IamConstruct } from './iam-construct';
import { S3Construct } from './s3-construct';
import { VpcConstruct } from './vpc-construct';

export interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  // added so bin/tap.ts can pass these without TS errors
  stateBucket?: string;
  stateBucketRegion?: string;
  defaultTags?: {
    tags: {
      Environment?: string;
      Owner?: string;
      Service?: string;
      // bin passes Repository & CommitAuthor; allow passthrough
      Repository?: string;
      CommitAuthor?: string;
    };
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props?: TapStackProps) {
    super(scope, name);

    const region = process.env.AWS_REGION || props?.awsRegion || 'us-west-2';
    new aws.provider.AwsProvider(this, 'aws', { region });

    const environment =
      process.env.ENVIRONMENT || props?.environmentSuffix || 'development';

    // unique suffix for resources to avoid collisions across PRs/environments
    const uniqueSuffix = Fn.substr(Fn.sha1(name), 0, 6);

    const commonTags = {
      Environment: environment,
      Owner: 'team-infra',
      Service: 'core',
      ManagedBy: 'Terraform',
      ...props?.defaultTags?.tags,
    };

    const azs = [`${region}a`, `${region}b`, `${region}c`];

    const vpc = new VpcConstruct(this, `Vpc-${uniqueSuffix}`, {
      environment,
      region,
      vpcCidr: '10.0.0.0/16',
      azs,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
      databaseSubnetCidrs: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'],
      commonTags,
    });

    const iam = new IamConstruct(this, `Iam-${uniqueSuffix}`, {
      environment,
      roleNameSuffix: uniqueSuffix,
      commonTags,
    });

    const ec2 = new Ec2Construct(this, `Ec2-${uniqueSuffix}`, {
      environment,
      vpcId: vpc.vpcId,
      subnetId: vpc.publicSubnets[0],
      instanceType: 't3.micro',
      keyName: process.env.EC2_KEY_NAME || '',
      iamInstanceProfile: iam.ec2ProfileName,
      allowedCidrBlocks: ['0.0.0.0/0'],
      logGroupName: `/aws/ec2/${environment}-${uniqueSuffix}`,
      resourceSuffix: uniqueSuffix,
      commonTags,
    });

    new S3Construct(this, `S3-${uniqueSuffix}`, {
      environment,
      // globally unique bucket name
      bucketName: `${environment}-assets-${uniqueSuffix}`,
      enableVersioning: true,
      lifecycleRules:
        environment === 'production'
          ? []
          : [
              {
                id: 'expire-old-objects',
                status: 'Enabled',
                expiration: { days: 30 },
                noncurrent_version_expiration: { noncurrent_days: 15 },
              },
            ],
      commonTags,
    });

    new CloudwatchConstruct(this, `Cloudwatch-${uniqueSuffix}`, {
      environment,
      instanceId: ec2.instanceId,
      logGroupName: `/aws/application/${environment}-${uniqueSuffix}`,
      commonTags,
    });

    new TerraformOutput(this, 'vpc_id', { value: vpc.vpcId });
    new TerraformOutput(this, 'instance_id', { value: ec2.instanceId });
  }
}
