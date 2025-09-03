import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { InfrastructureModules, ModulesConfig } from './modules';
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
    // Configuration for the infrastructure
    // These values can be parameterized through environment variables or config files
    const config: ModulesConfig = {
      environment: process.env.ENVIRONMENT || 'dev',
      project: 'IaC - AWS Nova Model Breaking',

      // Conditional deployment flags - can be controlled via environment variables
      enableRds: process.env.ENABLE_RDS === 'true' || true, // Default to true
      enableAutoScaling: process.env.ENABLE_ASG === 'true' || true, // Default to true

      // EC2 Configuration
      instanceType: process.env.INSTANCE_TYPE || 't3.micro', // Cost-effective for dev/test

      // RDS Configuration
      dbInstanceClass: process.env.DB_INSTANCE_CLASS || 'db.t3.micro',
      dbUsername: process.env.DB_USERNAME || 'admin',
      dbPassword: process.env.DB_PASSWORD || 'changeme123!', // Use AWS Secrets Manager in production

      // Auto Scaling Configuration
      minSize: parseInt(process.env.MIN_SIZE || '1'),
      maxSize: parseInt(process.env.MAX_SIZE || '3'),
      desiredCapacity: parseInt(process.env.DESIRED_CAPACITY || '2'),
    };

    // Validate configuration
    this.validateConfig(config);

    // Deploy the infrastructure modules
    const infrastructure = new InfrastructureModules(
      this,
      'infrastructure',
      config
    );

    // Outputs for external consumption and operational visibility
    // These outputs provide essential information for connecting to and managing the infrastructure

    // VPC Information
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the VPC',
      sensitive: false,
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructure.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
      sensitive: false,
    });

    // Load Balancer Information
    new TerraformOutput(this, 'load-balancer-dns', {
      value: infrastructure.loadBalancer.dnsName,
      description: 'DNS name of the Application Load Balancer',
      sensitive: false,
    });

    new TerraformOutput(this, 'load-balancer-zone-id', {
      value: infrastructure.loadBalancer.zoneId,
      description: 'Hosted zone ID of the load balancer',
      sensitive: false,
    });

    // Auto Scaling Group Information (conditional output)
    if (config.enableAutoScaling && infrastructure.autoScalingGroup) {
      new TerraformOutput(this, 'autoscaling-group-name', {
        value: infrastructure.autoScalingGroup.name,
        description: 'Name of the Auto Scaling Group',
        sensitive: false,
      });

      new TerraformOutput(this, 'autoscaling-group-arn', {
        value: infrastructure.autoScalingGroup.arn,
        description: 'ARN of the Auto Scaling Group',
        sensitive: false,
      });
    }

    // RDS Information (conditional output)
    if (config.enableRds && infrastructure.rdsInstance) {
      new TerraformOutput(this, 'rds-endpoint', {
        value: infrastructure.rdsInstance.endpoint,
        description: 'RDS instance endpoint',
        sensitive: false, // Endpoint is not sensitive, but connection details are
      });

      new TerraformOutput(this, 'rds-port', {
        value: infrastructure.rdsInstance.port.toString(),
        description: 'RDS instance port',
        sensitive: false,
      });

      // Note: Database credentials should be managed through AWS Secrets Manager
      // and not exposed as outputs in production environments
    }

    // S3 Bucket Information
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
      sensitive: false,
    });

    // KMS Key Information
    new TerraformOutput(this, 'kms-key-id', {
      value: infrastructure.kmsKey.keyId,
      description: 'ID of the KMS key used for S3 encryption',
      sensitive: false,
    });

    // CloudWatch Alarm Information (conditional output)
    if (config.enableAutoScaling && infrastructure.cpuAlarm) {
      new TerraformOutput(this, 'cpu-alarm-arn', {
        value: infrastructure.cpuAlarm.arn,
        description: 'ARN of the CPU utilization CloudWatch alarm',
        sensitive: false,
      });
    }

    // Security Group Information for troubleshooting and integration
    new TerraformOutput(this, 'web-security-group-id', {
      value: infrastructure.webSecurityGroup.id,
      description: 'ID of the web security group',
      sensitive: false,
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: infrastructure.dbSecurityGroup.id,
      description: 'ID of the database security group',
      sensitive: false,
    });

    // Subnet Information for potential future integrations
    new TerraformOutput(this, 'public-subnet-ids', {
      value: infrastructure.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
      sensitive: false,
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: infrastructure.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
      sensitive: false,
    });

    // IAM Role Information
    new TerraformOutput(this, 'ec2-role-arn', {
      value: infrastructure.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
      sensitive: false,
    });
  }

  /**
   * Validates the configuration to ensure all required values are present and valid
   * This helps catch configuration errors early in the deployment process
   */
  private validateConfig(config: ModulesConfig): void {
    const errors: string[] = [];

    // Validate environment
    if (!config.environment || config.environment.trim() === '') {
      errors.push('Environment must be specified');
    }

    // Validate project name
    if (!config.project || config.project.trim() === '') {
      errors.push('Project name must be specified');
    }

    // Validate instance type
    const validInstanceTypes = [
      't3.micro',
      't3.small',
      't3.medium',
      't3.large',
      'm5.large',
      'm5.xlarge',
    ];
    if (!validInstanceTypes.includes(config.instanceType)) {
      console.warn(
        `Instance type ${config.instanceType} may not be optimal. Consider using: ${validInstanceTypes.join(', ')}`
      );
    }

    // Validate Auto Scaling configuration
    if (config.enableAutoScaling) {
      if (config.minSize < 1) {
        errors.push('Minimum size must be at least 1');
      }
      if (config.maxSize < config.minSize) {
        errors.push(
          'Maximum size must be greater than or equal to minimum size'
        );
      }
      if (
        config.desiredCapacity < config.minSize ||
        config.desiredCapacity > config.maxSize
      ) {
        errors.push(
          'Desired capacity must be between minimum and maximum size'
        );
      }
    }

    // Validate RDS configuration
    if (config.enableRds) {
      if (!config.dbUsername || config.dbUsername.length < 1) {
        errors.push('Database username must be specified when RDS is enabled');
      }
      if (!config.dbPassword || config.dbPassword.length < 8) {
        errors.push(
          'Database password must be at least 8 characters when RDS is enabled'
        );
      }

      // Warn about using default password
      if (config.dbPassword === 'changeme123!') {
        console.warn(
          'WARNING: Using default database password. Please change this for production deployments and consider using AWS Secrets Manager.'
        );
      }
    }

    // Throw error if any validation failures
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    // Log configuration summary
    console.log('Configuration Summary:');
    console.log(`- Environment: ${config.environment}`);
    console.log(`- Project: ${config.project}`);
    console.log(`- RDS Enabled: ${config.enableRds}`);
    console.log(`- Auto Scaling Enabled: ${config.enableAutoScaling}`);
    console.log(`- Instance Type: ${config.instanceType}`);
    if (config.enableAutoScaling) {
      console.log(
        `- ASG Size: ${config.minSize}-${config.maxSize} (desired: ${config.desiredCapacity})`
      );
    }
    if (config.enableRds) {
      console.log(`- DB Instance Class: ${config.dbInstanceClass}`);
    }
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
