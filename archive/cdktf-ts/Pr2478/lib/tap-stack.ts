import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { WebAppInfrastructure } from './modules';
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

    // Configuration variables - centralized for easy management
    const config = {
      region: awsRegion, // Required region as per specifications
      environment: environmentSuffix, // Environment tag for resource organization
      instanceType: 't3.micro', // Cost-effective instance type suitable for web servers
      projectName: 'SecureWebApp',
    };

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: config.projectName,
            Environment: config.environment,
            ManagedBy: 'CDKTF',
            Owner: 'DevOps Team',
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
    // Deploy the complete web application infrastructure
    // This includes VPC, subnets, security groups, EC2 instances, monitoring, and logging
    const webAppInfra = new WebAppInfrastructure(
      this,
      'web-app-infrastructure',
      {
        environment: config.environment,
        instanceType: config.instanceType,
        region: config.region,
      }
    );

    // Outputs for external consumption and integration with other stacks
    // These outputs can be used by other Terraform configurations or CI/CD pipelines

    // Network infrastructure outputs
    new TerraformOutput(this, 'vpc-id', {
      value: webAppInfra.vpcId,
      description: 'ID of the VPC created for the web application',
      sensitive: false,
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: webAppInfra.publicSubnetIds,
      description:
        'IDs of public subnets for load balancers and public-facing resources',
      sensitive: false,
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: webAppInfra.privateSubnetIds,
      description: 'IDs of private subnets for databases and internal services',
      sensitive: false,
    });

    // Compute infrastructure outputs
    new TerraformOutput(this, 'ec2-instance-ids', {
      value: webAppInfra.ec2InstanceIds,
      description: 'IDs of EC2 instances running the web application',
      sensitive: false,
    });

    // Storage and monitoring outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: webAppInfra.s3BucketName,
      description:
        'Name of S3 bucket for storing application logs (encrypted at rest)',
      sensitive: false,
    });

    new TerraformOutput(this, 'cloudwatch-alarm-arn', {
      value: webAppInfra.cloudwatchAlarmArn,
      description: 'ARN of CloudWatch alarm monitoring CPU utilization',
      sensitive: false,
    });

    // Additional outputs for operational use
    new TerraformOutput(this, 'region', {
      value: config.region,
      description: 'AWS region where resources are deployed',
      sensitive: false,
    });

    new TerraformOutput(this, 'environment', {
      value: config.environment,
      description: 'Environment name for resource identification',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
