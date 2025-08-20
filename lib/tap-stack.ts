import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformOutput,
  TerraformVariable,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureModules, ModulesConfig } from './modules';
import { Fn } from 'cdktf';

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

    const appName = new TerraformVariable(this, 'app_name', {
      type: 'string',
      default: 'MyApp',
      description: 'Application name used for resource naming',
    });

    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      default: '10.0.0.0/16',
      description: 'CIDR block for VPC',
    });

    const publicSubnetCidrs = new TerraformVariable(
      this,
      'public_subnet_cidrs',
      {
        type: 'list(string)',
        default: ['10.0.1.0/24', '10.0.2.0/24'],
        description: 'CIDR blocks for public subnets',
      }
    );

    const privateSubnetCidrs = new TerraformVariable(
      this,
      'private_subnet_cidrs',
      {
        type: 'list(string)',
        default: ['10.0.10.0/24', '10.0.20.0/24'],
        description: 'CIDR blocks for private subnets',
      }
    );

    const availabilityZones = new TerraformVariable(
      this,
      'availability_zones',
      {
        type: 'list(string)',
        default: ['us-east-1a', 'us-east-1b'],
        description: 'Availability zones for subnets',
      }
    );

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: appName.stringValue,
            ManagedBy: 'CDKTF',
            Environment: environmentSuffix,
          },
        },
      ],
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
    // Configuration object for modules
    const config: ModulesConfig = {
      region: awsRegion,
      appName: appName.stringValue,
      vpcCidr: vpcCidr.stringValue,
      publicSubnetCidrs: publicSubnetCidrs.listValue,
      privateSubnetCidrs: privateSubnetCidrs.listValue,
      availabilityZones: availabilityZones.listValue,
    };

    // Deploy secure modules
    const secureInfra = new SecureModules(
      this,
      'secure-infrastructure',
      config
    );

    // Outputs for important resource information
    // These outputs can be used by other stacks or for reference

    // Network Information
    new TerraformOutput(this, 'vpc_id', {
      value: secureInfra.vpc.id,
      description: 'VPC ID for the secure infrastructure',
    });

    // FIXED: Extract subnet IDs for outputs
    const publicSubnetIds = secureInfra.publicSubnets.map(subnet => subnet.id);
    const privateSubnetIds = secureInfra.privateSubnets.map(subnet => subnet.id);

    // FIXED: Use Fn.tolist for subnet ID outputs
    new TerraformOutput(this, 'public_subnet_ids', {
      value: Fn.tolist(publicSubnetIds),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: Fn.tolist(privateSubnetIds),
      description: 'Private subnet IDs where application resources are deployed',
    });

    // Security Information
    new TerraformOutput(this, 'kms_key_id', {
      value: secureInfra.kmsKey.keyId,
      description: 'KMS key ID used for encryption across all services',
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: secureInfra.kmsKey.arn,
      description: 'KMS key ARN for encryption',
    });

    new TerraformOutput(this, 'kms_alias', {
      value: secureInfra.kmsAlias.name,
      description: 'KMS key alias for easier reference',
    });

    // IAM Information
    new TerraformOutput(this, 'lambda_role_arn', {
      value: secureInfra.lambdaRole.arn,
      description: 'Lambda execution role ARN with least privilege permissions',
    });

    new TerraformOutput(this, 'lambda_role_name', {
      value: secureInfra.lambdaRole.name,
      description: 'Lambda execution role name',
    });

    // Storage Information
    new TerraformOutput(this, 's3_bucket_name', {
      value: secureInfra.s3Bucket.id,
      description: 'S3 bucket name with encryption and logging enabled',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: secureInfra.s3Bucket.arn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 'ebs_volume_id', {
      value: secureInfra.ebsVolume.id,
      description: 'EBS volume ID with KMS encryption',
    });

    // Compute Information
    new TerraformOutput(this, 'lambda_function_name', {
      value: secureInfra.lambdaFunction.functionName,
      description: 'Lambda function name deployed in private subnet',
    });

    new TerraformOutput(this, 'lambda_function_arn', {
      value: secureInfra.lambdaFunction.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'lambda_log_group_name', {
      value: secureInfra.lambdaLogGroup.name,
      description: 'CloudWatch log group name for Lambda function',
    });

    new TerraformOutput(this, 'lambda_log_group_arn', {
      value: secureInfra.lambdaLogGroup.arn,
      description: 'CloudWatch log group ARN',
    });

    // Database Information
    new TerraformOutput(this, 'rds_endpoint', {
      value: secureInfra.rdsInstance.endpoint,
      description: 'RDS instance endpoint for database connections',
      sensitive: true, // Mark as sensitive to avoid displaying in logs
    });

    new TerraformOutput(this, 'rds_instance_id', {
      value: secureInfra.rdsInstance.id,
      description: 'RDS instance identifier',
    });

    // Summary Output
    new TerraformOutput(this, 'deployment_summary', {
      value: {
        region: awsRegion,
        app_name: appName.stringValue,
        vpc_id: secureInfra.vpc.id,
        kms_key_alias: secureInfra.kmsAlias.name,
        s3_bucket: secureInfra.s3Bucket.id,
        lambda_function: secureInfra.lambdaFunction.functionName,
        rds_instance: secureInfra.rdsInstance.identifier,
      },
      description: 'Summary of deployed secure infrastructure components',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
