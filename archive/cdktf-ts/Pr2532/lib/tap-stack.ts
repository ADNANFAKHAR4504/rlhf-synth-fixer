import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// ? Import your stacks here
import { InfrastructureModule } from './modules';

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
            ManagedBy: 'CDKTF',
            Project: 'tap-infrastructure',
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

    // Get the latest Amazon Linux 2 AMI
    const latestAmi = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // ? Add your stack instantiations here
    const infrastructureConfig = {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24', // 254 available IPs for public resources
      privateSubnetCidr: '10.0.2.0/24', // 254 available IPs for private resources
      instanceType: 't3.micro', // Cost-effective for development, scale up for production
      asgDesiredCapacity: 2, // Balanced between availability and cost
      domainName: `${environmentSuffix}.tap-infrastructure.com`, //  Environment-specific domain
      projectName: 'tap-infrastructure',
      environment: environmentSuffix, //  Use environmentSuffix for consistency
      region: awsRegion,
      amiId: latestAmi.id, // Pass the AMI ID to the module
    };

    // === DEPLOY INFRASTRUCTURE ===
    const infrastructure = new InfrastructureModule(
      this,
      'infrastructure',
      infrastructureConfig
    );

    // === OUTPUTS ===
    // Essential outputs for integration with other systems and debugging

    //  AMI Information - useful for tracking what AMI was used
    new TerraformOutput(this, 'ami-id', {
      value: latestAmi.id,
      description: 'ID of the dynamically selected Amazon Linux 2 AMI',
    });

    new TerraformOutput(this, 'ami-name', {
      value: latestAmi.name,
      description: 'Name of the dynamically selected Amazon Linux 2 AMI',
    });

    new TerraformOutput(this, 'ami-creation-date', {
      value: latestAmi.creationDate,
      description: 'Creation date of the selected AMI',
    });

    // Network outputs - useful for connecting additional resources
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the main VPC',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: infrastructure.publicSubnet.id,
      description: 'ID of the public subnet',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: infrastructure.privateSubnet.id,
      description: 'ID of the private subnet',
    });

    // Compute outputs - for monitoring and management
    new TerraformOutput(this, 'ec2-instance-id', {
      value: infrastructure.ec2Instance.id,
      description: 'ID of the EC2 instance in public subnet',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: infrastructure.ec2Instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 'asg-name', {
      value: infrastructure.asg.name,
      description: 'Name of the Auto Scaling Group',
    });

    // Storage outputs - for application configuration
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket for application data',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    //  DNS outputs - for the newly created hosted zone
    new TerraformOutput(this, 'route53-zone-id', {
      value: infrastructure.route53Zone.zoneId,
      description: 'Zone ID of the newly created Route 53 hosted zone',
    });

    new TerraformOutput(this, 'route53-name-servers', {
      value: infrastructure.route53Zone.nameServers,
      description:
        'Name servers for the newly created Route 53 hosted zone - configure these with your domain registrar',
    });

    new TerraformOutput(this, 'route53-zone-arn', {
      value: infrastructure.route53Zone.arn,
      description: 'ARN of the Route 53 hosted zone',
    });

    // Monitoring outputs - for alerting system integration
    new TerraformOutput(this, 'cloudwatch-alarm-arn', {
      value: infrastructure.cloudwatchAlarm.arn,
      description: 'ARN of the CloudWatch CPU utilization alarm',
    });

    // Security outputs - for audit and compliance
    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructureConfig.vpcCidr,
      description: 'CIDR block of the VPC',
    });

    //  Domain configuration output
    new TerraformOutput(this, 'domain-name', {
      value: infrastructureConfig.domainName,
      description: 'Domain name configured for this environment',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
