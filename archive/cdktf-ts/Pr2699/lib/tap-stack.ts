import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  NetworkingModule,
  ComputeModule,
  StorageModule,
  DatabaseModule,
  MonitoringModule,
  IamModule,
  SecurityGroupsModule,
} from './modules';
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

    // ? Add your stack instantiations her
    // Configuration variables - customize these for your environment
    const config = {
      region: awsRegion,
      // Replace with your specific AMI ID (Amazon Linux 2 example)
      amiId: 'ami-0c02fb55956c7d316',
      // Replace with your key pair name
      keyPairName: 'production-key-poetic-primate',
      // Replace with your company's IP range for SSH access
      allowedSshCidr: '203.0.113.0/24', // Example IP range - replace with actual
      // S3 bucket name - must be globally unique
      bucketName: 'my-app-storage-bucket-12345-rlhf-ts',
      // VPC and subnet configuration
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    };

    // Common tags applied to all resources for compliance and cost tracking
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'WebApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ManagedBy: 'CDKTF',
    };

    // 1. Create IAM roles and policies first (dependencies for EC2)
    const iamModule = new IamModule(this, 'iam', commonTags);

    // 2. Create networking infrastructure (VPC, subnets, gateways)
    const networkingModule = new NetworkingModule(this, 'networking', {
      vpcCidr: config.vpcCidr,
      publicSubnetCidrs: config.publicSubnetCidrs,
      privateSubnetCidrs: config.privateSubnetCidrs,
      tags: commonTags,
    });

    // 3. Create security groups (dependencies for EC2 and RDS)
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      'security-groups',
      networkingModule.vpc.id,
      config.allowedSshCidr,
      commonTags
    );

    // 4. Create compute resources (EC2 instance)
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: networkingModule.vpc.id,
      publicSubnetId: networkingModule.publicSubnets[0].id,
      amiId: config.amiId,
      keyPairName: config.keyPairName,
      allowedSshCidr: config.allowedSshCidr,
      iamInstanceProfileName: iamModule.instanceProfile.name,
      ec2SecurityGroupId: securityGroupsModule.ec2SecurityGroup.id,
      tags: commonTags,
    });

    // 5. Create storage resources (S3 bucket with encryption and lifecycle)
    const storageModule = new StorageModule(this, 'storage', {
      bucketName: config.bucketName,
      tags: commonTags,
    });

    // 6. Create database resources (RDS in private subnet)
    const databaseModule = new DatabaseModule(this, 'database', {
      vpcId: networkingModule.vpc.id,
      privateSubnetIds: networkingModule.privateSubnets.map(
        subnet => subnet.id
      ),
      ec2SecurityGroupId: securityGroupsModule.rdsSecurityGroup.id,
      tags: commonTags,
    });

    // 7. Create monitoring and alerting (CloudWatch alarms)
    new MonitoringModule(this, 'monitoring', {
      instanceId: computeModule.instance.id,
      dbInstanceId: databaseModule.dbInstance.id,
      tags: commonTags,
    });

    // Stack Outputs - Important information for operations and integration
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: computeModule.instance.id,
      description: 'ID of the EC2 web server instance',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: computeModule.instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.bucket.bucket,
      description: 'Name of the S3 bucket for application storage',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.dbInstance.endpoint,
      description: 'RDS database endpoint for application connection',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: networkingModule.natGateways.map(nat => nat.id),
      description: 'IDs of the NAT Gateways for high availability',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkingModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of private subnets for internal resources',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkingModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of public subnets for internet-facing resources',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
