import * as aws from "@cdktf/provider-aws";
import { App, Fn, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { CloudwatchStack } from './cloudwatch-stack';
import { Ec2Stack } from './ec2-stack';
import { IamStack } from './iam-stack';
import { S3Stack } from './s3-stack';
import { VpcStack } from './vpc-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: {
    tags: {
      Environment?: string;
      Owner?: string;
      Service?: string;
    };
  };
}

class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props?: TapStackProps) {
    super(scope, name);
  
  new aws.provider.AwsProvider(this, "aws", {
      region: process.env.AWS_REGION || props?.awsRegion || "us-west-2",
    });

    const environment =
      process.env.ENVIRONMENT || props?.environmentSuffix || 'development';
    const region = process.env.AWS_REGION || props?.awsRegion || 'us-west-2';

    const commonTags = props?.defaultTags?.tags || {
      Environment: environment,
      Owner: 'team-infra',
      Service: 'core',
      CostCenter: '1234',
      ManagedBy: 'Terraform',
    };

    const azs = [`${region}a`, `${region}b`, `${region}c`];

    const vpcCidr = '10.0.0.0/16';
    const publicSubnets = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const privateSubnets = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
    const databaseSubnets = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

    const vpcStack = new VpcStack(this, 'VpcStack', {
      environment,
      region,
      vpcCidr,
      azs,
      publicSubnetCidrs: publicSubnets,
      privateSubnetCidrs: privateSubnets,
      databaseSubnetCidrs: databaseSubnets,
      commonTags,
    });

    const iamStack = new IamStack(this, 'IamStack', {
      environment,
      commonTags,
    });

    const ec2Stack = new Ec2Stack(this, 'Ec2Stack', {
      environment,
      vpcId: vpcStack.vpcId,
      subnetId: Fn.element(vpcStack.publicSubnets, 0),
      instanceType: 't3.micro',
      keyName: process.env.EC2_KEY_NAME || '',
      iamInstanceProfile: iamStack.ec2ProfileName,
      allowedCidrBlocks: ['0.0.0.0/0'],
      commonTags,
    });

    new S3Stack(this, 'S3Stack', {
      environment,
      bucketName: `${environment}-assets-bucket`,
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

    new CloudwatchStack(this, 'CloudwatchStack', {
      environment,
      instanceId: ec2Stack.instanceId,
      commonTags,
    });
  }
}

const app = new App();
new TapStack(app, 'iac-291687');
app.synth();

export { TapStack };
