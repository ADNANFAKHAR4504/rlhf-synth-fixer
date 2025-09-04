import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { InfrastructureModule, InfrastructureModuleConfig } from './modules';
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'Financial Services Infrastructure',
            ManagedBy: 'CDKTF',
            Compliance: 'SOX-PCI-DSS',
            CostCenter: 'IT-Infrastructure',
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
    // Infrastructure configuration
    // These values should be moved to environment variables or parameter store in production
    const config: InfrastructureModuleConfig = {
      // VPC CIDR block - provides 65,536 IP addresses for growth
      vpcCidr: '10.0.0.0/16',

      // Company IP range - restrict access to known corporate network
      // TODO: Replace with actual company IP range
      companyIpRange: '203.0.113.0/24', // Example IP range - replace with actual

      // AMI ID for Amazon Linux 2 in us-west-2
      // TODO: Use latest AMI ID or implement AMI lookup
      amiId: 'ami-01102c5e8ab69fb75', // Amazon Linux 2 AMI

      // Instance type - t3.micro for cost optimization in non-production
      // Consider larger instances for production workloads
      instanceType: 't3.micro',

      // Database credentials - should be stored in AWS Secrets Manager in production
      dbUsername: process.env.DB_USERNAME || 'admin',
      dbPassword: process.env.DB_PASSWORD || 'changeme123!', // TODO: Use AWS Secrets Manager

      // Environment designation
      environment: environmentSuffix,
    };

    // Deploy the infrastructure module with configuration
    const infrastructure = new InfrastructureModule(
      this,
      'infrastructure',
      config
    );

    // Stack Outputs - Critical information for operations and integration

    // S3 bucket name for application logs
    // Used by applications for log storage configuration
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket for application logs',
      sensitive: false,
    });

    // EC2 instance ID for monitoring and management
    new TerraformOutput(this, 'ec2-instance-id', {
      value: infrastructure.ec2Instance.id,
      description: 'ID of the application server EC2 instance',
      sensitive: false,
    });

    // RDS endpoint for application database connections
    // Applications use this endpoint to connect to the database
    new TerraformOutput(this, 'rds-endpoint', {
      value: infrastructure.rdsInstance.endpoint,
      description: 'RDS database endpoint for application connections',
      sensitive: false,
    });

    // CloudTrail ARN for compliance reporting
    new TerraformOutput(this, 'cloudtrail-arn', {
      value: infrastructure.cloudTrail.arn,
      description: 'ARN of the CloudTrail for audit logging',
      sensitive: false,
    });

    // WAF Web ACL ARN for application integration
    new TerraformOutput(this, 'waf-webacl-arn', {
      value: infrastructure.wafWebAcl.arn,
      description: 'ARN of the WAF Web ACL for application protection',
      sensitive: false,
    });

    // VPC ID for reference by other stacks or resources
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the main VPC',
      sensitive: false,
    });

    // Application server public IP for access configuration
    new TerraformOutput(this, 'app-server-public-ip', {
      value: infrastructure.ec2Instance.publicIp,
      description: 'Public IP address of the application server',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
