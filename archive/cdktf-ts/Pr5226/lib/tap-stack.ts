import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';

// Import the constructs from modules
import {
  NetworkingConstruct,
  NetworkingConfig,
  SecurityGroupsConstruct,
  SecurityGroupsConfig,
  DatabaseConstruct,
  DatabaseConfig,
  LoadBalancerConstruct,
  LoadBalancerConfig,
  ComputeConstruct,
  ComputeConfig,
  KeyPairConstruct, // Add this import
  KeyPairConfig,
} from './modules';

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

    new TlsProvider(this, 'tls', {});

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

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current', {});

    // Define common configuration
    const projectName = 'ecommerce';
    const environment = environmentSuffix;
    const commonTags = {
      Project: projectName,
      Environment: environment,
      ManagedBy: 'CDKTF',
      Owner: 'DevOps',
      CostCenter: 'Engineering',
    };

    // Configure availability zones based on region
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // 1. Create Networking Infrastructure
    const networkingConfig: NetworkingConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      vpcCidr: '10.0.0.0/16',
      availabilityZones: availabilityZones,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
    };

    const networking = new NetworkingConstruct(
      this,
      'networking',
      networkingConfig
    );

    // 2. Create Security Groups
    const securityGroupsConfig: SecurityGroupsConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      vpcId: networking.vpc.id,
    };

    const securityGroups = new SecurityGroupsConstruct(
      this,
      'security-groups',
      securityGroupsConfig
    );

    const keyPairConfig: KeyPairConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      // Optionally provide a public key, or let it generate one
    };

    const keyPair = new KeyPairConstruct(this, 'keypair', keyPairConfig);

    // 3. Create Database
    const databaseConfig: DatabaseConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      subnetIds: networking.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.rdsSecurityGroup.id,
      instanceClass:
        environment === 'production' ? 'db.t3.medium' : 'db.t3.micro',
      allocatedStorage: environment === 'production' ? 100 : 20,
      dbName: 'ecommercedb',
      backupRetentionPeriod: environment === 'production' ? 7 : 1,
    };

    const database = new DatabaseConstruct(this, 'database', databaseConfig);

    // 4. Create Load Balancer
    const loadBalancerConfig: LoadBalancerConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      subnetIds: networking.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.albSecurityGroup.id,
      vpcId: networking.vpc.id,
      healthCheckPath: '/api/health',
      // certificateArn: 'arn:aws:acm:region:account-id:certificate/certificate-id', // Add your ACM certificate ARN for HTTPS
    };

    const loadBalancer = new LoadBalancerConstruct(
      this,
      'load-balancer',
      loadBalancerConfig
    );

    // 5. Create Compute Resources (Auto Scaling Group)
    const computeConfig: ComputeConfig = {
      region: awsRegion,
      environment: environment,
      projectName: projectName,
      tags: commonTags,
      subnetIds: networking.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.appSecurityGroup.id,
      instanceType: environment === 'production' ? 't3.medium' : 't3.micro',
      keyName: keyPair.keyPairName, // Use the actual key pair name from the construct
      targetGroupArn: loadBalancer.targetGroup.arn,
      dbConnectionString: database.connectionString,
      dbSecretArn: database.dbSecret.arn,
      minSize: environment === 'production' ? 2 : 1,
      maxSize: environment === 'production' ? 6 : 3,
      desiredCapacity: environment === 'production' ? 3 : 2,
    };

    const compute = new ComputeConstruct(this, 'compute', computeConfig);

    // Terraform Outputs - Only necessary ones
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: loadBalancer.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: database.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: database.dbSecret.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: compute.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'key-pair-name', {
      value: keyPair.keyPairName,
      description: 'EC2 Key Pair name',
    });
  }
}
