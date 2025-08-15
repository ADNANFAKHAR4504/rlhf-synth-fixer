import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { NetworkModule, ComputeModule, DatabaseModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    const awsProvider = new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const tags = {
      Environment: 'Production',
      Owner: 'DevOpsTeam',
    };

    const network = new NetworkModule(this, 'Network', {
      awsProvider: awsProvider,
      vpcCidrBlock: '10.0.0.0/16',
      tags: tags,
    });

    const compute = new ComputeModule(this, 'Compute', {
      awsProvider: awsProvider,
      subnetId: network.publicSubnet.id,
      securityGroupId: network.ec2SecurityGroup.id,
      keyName: 'my-dev-keypair', // <-- Replace with your key pair name
      tags: tags,
    });

    const database = new DatabaseModule(this, 'Database', {
      awsProvider: awsProvider,
      subnetIds: [
        network.privateSubnet.id,
        network.privateSubnet2.id, // include second private subnet for Multi-AZ
      ],
      securityGroupId: network.rdsSecurityGroup.id,
      tags: tags,
    });

    // --- Stack Outputs ---
    new TerraformOutput(this, 'vpcId', {
      value: network.vpc.id,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetId', {
      value: network.publicSubnet.id,
      description: 'The ID of the public subnet.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: network.privateSubnet.id,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'ec2InstanceId', {
      value: compute.instance.id,
      description: 'The ID of the EC2 instance.',
    });

    new TerraformOutput(this, 'ec2PublicIp', {
      value: compute.instance.publicIp,
      description: 'The public IP address of the EC2 instance.',
    });

    new TerraformOutput(this, 'rdsInstanceEndpoint', {
      value: database.dbInstance.endpoint,
      description: 'The connection endpoint for the RDS database instance.',
      sensitive: true,
    });

    new TerraformOutput(this, 'databaseSecretArn', {
      value: database.dbSecret.arn,
      description: 'The ARN of the secret containing the RDS password.',
      sensitive: true,
    });
  }
}
