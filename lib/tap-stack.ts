import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { networkInterfaces } from 'os';
import { ScalableInfrastructure } from './scalable-infra-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = ['us-east-1', 'us-west-2'];

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    AWS_REGION_OVERRIDE.forEach(region => {
      const alias = `region_${region.replace(/-/g, '_')}`; // Prefix with 'region_' and replace dashes
      const awsProvider = new AwsProvider(this, `aws_${alias}`, {
        region: region,
        defaultTags: defaultTags,
        alias: alias,
      });
      // Get public IP of the current machine using Node.js os and network APIs

      function getLocalIp(): string | undefined {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
          for (const net of nets[name]!) {
            // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
              return net.address;
            }
          }
        }
        return undefined;
      }
      const localIp = getLocalIp();

      const dbUsername = Math.random()
        .toString(36)
        .substring(2, 10)
        .replace(/[^a-z]/g, ''); // Generates an 8-char random string with only lowercase letters

      new ScalableInfrastructure(this, `serverless-cms-${region}`, {
        provider: awsProvider,
        allowedCidr: `${localIp}/32`,
        dbUsername: dbUsername,
      });
    });
  }
}
