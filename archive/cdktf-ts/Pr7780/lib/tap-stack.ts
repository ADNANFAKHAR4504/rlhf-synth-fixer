import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { PaymentProcessingInfrastructure } from './payment-processing-infrastructure';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
  awsRegionOverride?: string;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const regionOverride = props?.awsRegionOverride || AWS_REGION_OVERRIDE;
    const awsRegion = regionOverride
      ? regionOverride
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [
      {
        tags: {
          Environment: environmentSuffix,
          Project: 'payment-processing',
          CostCenter: 'fintech',
          ManagedBy: 'cdktf',
        },
      },
    ];

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
    this.addOverride('terraform.backend.s3.use_lockfile', false);

    // Create Payment Processing Infrastructure
    const infrastructure = new PaymentProcessingInfrastructure(
      this,
      'payment-processing',
      {
        environmentSuffix,
        awsRegion,
      }
    );

    // Export critical outputs
    new TerraformOutput(this, 'vpc_id', {
      value: infrastructure.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: infrastructure.albDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'ecs_cluster_name', {
      value: infrastructure.ecsClusterName,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: infrastructure.rdsEndpoint,
      description: 'RDS Aurora Endpoint',
    });

    new TerraformOutput(this, 'cloudfront_domain', {
      value: infrastructure.cloudfrontDomain,
      description: 'CloudFront Distribution Domain',
    });

    new TerraformOutput(this, 'ecr_repository_url', {
      value: infrastructure.ecrRepositoryUrl,
      description: 'ECR Repository URL',
    });
  }
}
