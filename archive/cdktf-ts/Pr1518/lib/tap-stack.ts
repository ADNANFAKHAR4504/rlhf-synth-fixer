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
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { VpcModule, ElbModule, AsgModule, RdsModule } from './modules';
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
    // =============================================================================
    // VARIABLES - Configurable parameters for flexibility and reusability
    // =============================================================================

    // Application Configuration
    const appName = new TerraformVariable(this, 'app_name', {
      type: 'string',
      default: 'tap-web-app',
      description: 'Name of the application - used for resource naming',
    });

    // VPC Configuration
    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      default: '10.0.0.0/16',
      description: 'CIDR block for VPC - provides IP address space',
    });

    // EC2 Instance Configuration
    const instanceType = new TerraformVariable(this, 'instance_type', {
      type: 'string',
      default: 't3.micro',
      description: 'EC2 instance type for web servers',
    });

    // Auto Scaling Configuration
    const asgMinSize = new TerraformVariable(this, 'asg_min_size', {
      type: 'number',
      default: 1,
      description:
        'Minimum number of instances in ASG - ensures baseline capacity',
    });

    const asgMaxSize = new TerraformVariable(this, 'asg_max_size', {
      type: 'number',
      default: 3,
      description: 'Maximum number of instances in ASG - controls cost',
    });

    const asgDesiredCapacity = new TerraformVariable(
      this,
      'asg_desired_capacity',
      {
        type: 'number',
        default: 1,
        description: 'Desired number of instances - one per AZ for HA',
      }
    );

    // RDS Configuration
    const dbInstanceClass = new TerraformVariable(this, 'db_instance_class', {
      type: 'string',
      default: 'db.t3.medium',
      description: 'RDS instance class - determines compute and memory',
    });

    const dbAllocatedStorage = new TerraformVariable(
      this,
      'db_allocated_storage',
      {
        type: 'number',
        default: 20,
        description: 'Initial storage allocation for RDS in GB',
      }
    );

    const dbName = new TerraformVariable(this, 'db_name', {
      type: 'string',
      default: 'tapdb',
      description: 'Name of the database to create',
    });

    const dbUsername = new TerraformVariable(this, 'db_username', {
      type: 'string',
      default: 'admin',
      description: 'Master username for database',
    });

    // Security Configuration - No hardcoded credentials
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // =============================================================================
    // INFRASTRUCTURE MODULES - Building blocks for high availability
    // =============================================================================

    // VPC Module - Foundation networking layer
    // Creates multi-AZ network infrastructure with proper isolation
    const vpc = new VpcModule(this, 'vpc', {
      cidrBlock: vpcCidr.stringValue,
      region: 'us-east-1',
      name: appName.stringValue,
    });

    // ELB Module - Load balancing layer
    // Distributes traffic across multiple AZs and instances
    const elb = new ElbModule(this, 'elb', {
      name: appName.stringValue,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.publicSubnets.map(subnet => subnet.id), // Public subnets for internet access
      securityGroupIds: [vpc.webSecurityGroup.id],
    });

    // ASG Module - Compute layer with auto-scaling
    // Provides elastic capacity with automatic failure recovery
    const asg = new AsgModule(this, 'asg', {
      name: appName.stringValue,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id), // Private subnets for security
      targetGroupArn: elb.targetGroup.arn,
      instanceType: instanceType.stringValue,
      minSize: asgMinSize.numberValue,
      maxSize: asgMaxSize.numberValue,
      desiredCapacity: asgDesiredCapacity.numberValue,
      securityGroupIds: [vpc.webSecurityGroup.id],
    });

    // RDS Module - Database layer with Multi-AZ deployment
    // Provides persistent data storage with automatic failover
    const rds = new RdsModule(this, 'rds', {
      name: appName.stringValue,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: dbInstanceClass.stringValue,
      allocatedStorage: dbAllocatedStorage.numberValue,
      dbName: dbName.stringValue,
      username: dbUsername.stringValue,
      password: dbPasswordSecret.secretString,
      vpcSecurityGroupIds: [vpc.dbSecurityGroup.id], // Database security group
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id), // Private subnets for security
      backupRetentionPeriod: 7, // Required minimum 7-day retention
      multiAz: true, // Required Multi-AZ for high availability
    });

    // =============================================================================
    // OUTPUTS - Critical resource information for external access and monitoring
    // =============================================================================

    // Load Balancer DNS - Primary application endpoint
    new TerraformOutput(this, 'load_balancer_dns', {
      value: elb.loadBalancer.dnsName,
      description:
        'DNS name of the Application Load Balancer - use this to access the application',
    });

    // Load Balancer Zone ID - For Route 53 alias records
    new TerraformOutput(this, 'load_balancer_zone_id', {
      value: elb.loadBalancer.zoneId,
      description: 'Zone ID of the load balancer for DNS configuration',
    });

    // RDS Endpoint - Database connection string
    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint for database connections',
      sensitive: false, // Endpoint is not sensitive, but connection details are
    });

    // RDS Port - Database connection port
    new TerraformOutput(this, 'rds_port', {
      value: rds.dbInstance.port,
      description: 'Port number for database connections',
    });

    // Auto Scaling Group Details
    new TerraformOutput(this, 'asg_name', {
      value: asg.autoScalingGroup.name,
      description:
        'Name of the Auto Scaling Group for monitoring and management',
    });

    new TerraformOutput(this, 'asg_arn', {
      value: asg.autoScalingGroup.arn,
      description:
        'ARN of the Auto Scaling Group for IAM policies and monitoring',
    });

    // VPC Information
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
      description: 'VPC ID for additional resource deployment',
    });

    new TerraformOutput(this, 'availability_zones', {
      value: vpc.availabilityZones,
      description:
        'Availability zones used for deployment - shows multi-AZ setup',
    });

    // Security Group IDs for additional resources
    new TerraformOutput(this, 'web_security_group_id', {
      value: vpc.webSecurityGroup.id,
      description:
        'Security group ID for web tier - use for additional web resources',
    });

    new TerraformOutput(this, 'db_security_group_id', {
      value: vpc.dbSecurityGroup.id,
      description:
        'Security group ID for database tier - use for additional DB resources',
    });

    // Application URL - Constructed endpoint for easy access
    new TerraformOutput(this, 'application_url', {
      value: `http://${elb.loadBalancer.dnsName}`,
      description: 'Complete application URL - ready to use endpoint',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
