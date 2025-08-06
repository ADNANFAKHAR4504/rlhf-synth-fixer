import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformOutput,
  Fn,
  TerraformVariable,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { VpcNetwork, BastionHost, RdsDatabase } from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

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
    new AwsProvider(this, 'aws', {
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
    // --- Define Input Variables ---
    const myIp = new TerraformVariable(this, 'my_ip', {
      type: 'string',
      description:
        'Your local IP for SSH access, in CIDR format (e.g., 1.2.3.4/32)',
    });

    // --- 1. Create the Network Foundation ---
    const network = new VpcNetwork(this, 'vpc-network', {
      envPrefix: environmentSuffix,
      vpcCidr: '10.0.0.0/16',
    });

    // --- 2. Create the Bastion Host ---
    const bastion = new BastionHost(this, 'bastion-host', {
      envPrefix: environmentSuffix,
      vpcId: network.vpcId,
      publicSubnetId: Fn.element(network.publicSubnetIds, 0),
      allowedSshIp: myIp.stringValue,
    });

    // --- 3. Create the RDS Database ---
    const database = new RdsDatabase(this, 'rds-database', {
      envPrefix: environmentSuffix,
      vpcId: network.vpcId,
      privateSubnetIds: network.privateSubnetIds,
      sourceSecurityGroupId: bastion.securityGroupId,
    });

    // --- Stack Outputs ---
    new TerraformOutput(this, 'bastion_public_ip', {
      value: bastion.instancePublicIp,
      description: 'Public IP of the Bastion Host',
    });

    new TerraformOutput(this, 'rds_instance_endpoint', {
      value: database.rdsEndpoint,
      description: 'The connection endpoint for the RDS instance',
    });

    new TerraformOutput(this, 'ssh_command', {
      value: `ssh ec2-user@${bastion.instancePublicIp}`,
      description:
        'Command to SSH into the Bastion Host (provide your own key)',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
