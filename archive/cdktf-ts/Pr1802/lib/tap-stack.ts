import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureInfrastructure, SecureInfraConfig } from './modules';
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

const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'SecureTap',
            ManagedBy: 'CDKTF',
            SecurityLevel: 'High',
            DataClassification: 'Confidential',
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
    // Configuration for our secure infrastructure
    const infraConfig: SecureInfraConfig = {
      // VPC CIDR provides 65,536 IP addresses
      vpcCidr: '10.0.0.0/16',

      // Public subnets for NAT gateways and load balancers (256 IPs each)
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],

      // Private subnets for secure workloads (256 IPs each)
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],

      // Multi-AZ deployment for high availability
      availabilityZones: ['us-east-1a', 'us-east-1b'],

      environment: 'production',
      projectName: 'secure-tap',
      awsRegion: awsRegion,
    };

    // Create the secure infrastructure
    const infrastructure = new SecureInfrastructure(
      this,
      'secure-infrastructure',
      infraConfig
    );

    // Outputs for other stacks or external systems to reference

    // VPC information
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the secure VPC',
      sensitive: false,
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructure.vpc.cidrBlock,
      description: 'CIDR block of the secure VPC',
      sensitive: false,
    });

    // Subnet information for deploying additional resources
    new TerraformOutput(this, 'private-subnet-ids', {
      value: infrastructure.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of private subnets for secure workloads',
      sensitive: false,
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: infrastructure.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of public subnets for load balancers',
      sensitive: false,
    });

    // Security resources
    new TerraformOutput(this, 'kms-key-id', {
      value: infrastructure.kmsKey.keyId,
      description: 'KMS key ID for encryption',
      sensitive: false,
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: infrastructure.kmsKey.arn,
      description: 'KMS key ARN for encryption',
      sensitive: false,
    });

    // S3 resources
    new TerraformOutput(this, 'main-s3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the main S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 'main-s3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the main S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 'logging-s3-bucket-name', {
      value: infrastructure.s3LoggingBucket.bucket,
      description: 'Name of the S3 access logging bucket',
      sensitive: false,
    });

    // Lambda resources
    new TerraformOutput(this, 'lambda-function-name', {
      value: infrastructure.lambdaFunction.functionName,
      description: 'Name of the secure Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: infrastructure.lambdaFunction.arn,
      description: 'ARN of the secure Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: infrastructure.lambdaRole.arn,
      description: 'ARN of the Lambda execution role',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-log-group-name', {
      value: infrastructure.lambdaLogGroup.name,
      description: 'Name of the Lambda CloudWatch log group',
      sensitive: false,
    });

    // Security compliance outputs
    new TerraformOutput(this, 'security-summary', {
      value: {
        encryption_at_rest: 'Enabled with customer-managed KMS key',
        logging_enabled: 'S3 access logs and Lambda execution logs',
        network_isolation: 'All resources in private subnets',
        iam_compliance:
          'Least privilege policies with resource-specific permissions',
        public_access: 'Blocked on all S3 buckets',
        key_rotation: 'Enabled on KMS key',
        log_retention: '30 days for Lambda logs',
      },
      description: 'Security compliance summary',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
