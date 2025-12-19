import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { WebAppModules, WebAppModulesConfig } from './modules';
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
    // Configuration for the web application infrastructure
    // These values would typically come from environment variables or config files
    const config: WebAppModulesConfig = {
      region: awsRegion, // Required region as per specifications
      amiId: 'ami-01102c5e8ab69fb75', // Amazon Linux 2 AMI for us-west-2
      instanceType: 't3.micro', // Cost-effective instance type for web servers
      dbUsername: process.env.DB_USERNAME || 'admin', // Database master username
      dbPassword: process.env.DB_PASSWORD || 'changeme123!', // Use AWS Secrets Manager in production
      domainName: 'iacnova.com', // Domain name for Route 53 DNS
      environment: environmentSuffix, // Environment tag for all resources
    };

    // Create all AWS resources using the modules
    const webAppModules = new WebAppModules(this, 'web-app', config);

    // Output the ELB DNS name for external access
    // This is the primary endpoint users will access
    new TerraformOutput(this, 'load-balancer-dns', {
      value: webAppModules.loadBalancer.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    // Output the Auto Scaling Group name for monitoring and management
    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: webAppModules.autoScalingGroup.name,
      description: 'Name of the Auto Scaling Group',
    });

    // Output the RDS endpoint for application configuration
    // Applications use this endpoint to connect to the database
    new TerraformOutput(this, 'rds-endpoint', {
      value: webAppModules.rdsInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true, // Mark as sensitive to avoid logging
    });

    // Output the Secrets Manager ARN for credential retrieval
    new TerraformOutput(this, 'secrets-manager-arn', {
      value: webAppModules.secretsManagerSecret.arn,
      description:
        'ARN of the Secrets Manager secret containing DB credentials',
    });

    // Output the Route 53 hosted zone ID for DNS management
    new TerraformOutput(this, 'route53-zone-id', {
      value: webAppModules.route53Zone.zoneId,
      description: 'Route 53 hosted zone ID',
    });

    // Output the VPC ID for reference by other stacks or resources
    new TerraformOutput(this, 'vpc-id', {
      value: webAppModules.vpc.id,
      description: 'ID of the main VPC',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
