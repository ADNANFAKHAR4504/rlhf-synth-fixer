import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { TerraformVariable } from 'cdktf';
import {
  NetworkingConstruct,
  SecureComputeConstruct,
  SecretsConstruct,
} from './modules';

// ? Import your stacks here
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

    // Define common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
      Project: 'Production-Infrastructure',
      Owner: 'Platform-Team',
    };

    // Create Networking Infrastructure
    const networkingModule = new NetworkingConstruct(this, 'networking', {
      tags: commonTags,
    });

    // Create Secrets Management
    const secretsModule = new SecretsConstruct(this, 'secrets', {
      tags: commonTags,
    });

    const instanceTypeVariable = new TerraformVariable(
      this,
      'ec2_instance_type',
      {
        type: 'string',
        default: 't3.medium',
        description: 'EC2 instance type for the compute instance',
      }
    );

    // Create Secure Compute Instance in Private Subnet
    const secureComputeModule = new SecureComputeConstruct(
      this,
      'secure-compute',
      {
        instanceType: instanceTypeVariable.stringValue,
        subnetId: networkingModule.privateSubnet.id,
        vpcId: networkingModule.vpc.id,
        secretArn: secretsModule.secret.arn,
        tags: commonTags,
      }
    );

    // Terraform Outputs - 10 outputs as requested
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'Production VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: networkingModule.publicSubnet.id,
      description: 'Public subnet ID',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: networkingModule.privateSubnet.id,
      description: 'Private subnet ID',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkingModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networkingModule.natGateway.id,
      description: 'NAT Gateway ID for private subnet connectivity',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: secureComputeModule.instance.id,
      description: 'Secure EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-instance-private-ip', {
      value: secureComputeModule.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: secureComputeModule.securityGroup.id,
      description: 'EC2 instance security group ID',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: secureComputeModule.role.arn,
      description: 'IAM role ARN for EC2 instance',
    });

    new TerraformOutput(this, 'secret-arn', {
      value: secretsModule.secret.arn,
      description: 'Secrets Manager secret ARN for database credentials',
    });
  }
}
