import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  NetworkingModule,
  SecurityGroupsModule,
  ComputeModule,
  IamModule,
  StorageModule,
  LambdaModule,
  DatabaseModule,
  AnalyticsModule,
  MonitoringModule,
  ModuleConfig,
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'secure-web-application',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
            Owner: 'infrastructure-team',
            CostCenter: 'engineering',
          },
        },
      ],
    });

    // Configuration for the entire stack
    const config: ModuleConfig = {
      environment: environmentSuffix,
      region: awsRegion,
      companyName: 'acme-corp',
      // Company IP ranges for restricted access - replace with actual IPs
      allowedCidrBlocks: ['203.0.113.0/24', '198.51.100.0/24'],
      keyPairName: 'production-key-poetic-primate', // Must exist in AWS
      amiId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI ID for us-east-1
    };

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
    // Create networking infrastructure with VPC, subnets, and gateways
    const networking = new NetworkingModule(this, 'networking', config);

    // Create security groups with restrictive rules
    const securityGroups = new SecurityGroupsModule(
      this,
      'security-groups',
      networking.vpc,
      config
    );

    // Create IAM roles and policies with least privilege access
    const iam = new IamModule(this, 'iam', config);

    // Deploy EC2 instances in private subnets with detailed monitoring
    const compute = new ComputeModule(
      this,
      'compute',
      networking.privateSubnets,
      securityGroups.ec2SecurityGroup,
      iam.ec2InstanceProfile,
      config
    );

    // Create encrypted S3 buckets with public access blocked
    const storage = new StorageModule(this, 'storage', config);

    // Deploy Lambda function in VPC for secure database access
    const lambda = new LambdaModule(
      this,
      'lambda',
      networking.privateSubnets,
      securityGroups.lambdaSecurityGroup,
      iam.lambdaRole,
      config
    );

    // Create DynamoDB table and RDS instance with encryption
    const database = new DatabaseModule(
      this,
      'database',
      networking.privateSubnets,
      securityGroups.rdsSecurityGroup,
      config
    );

    // Deploy Elasticsearch domain with encryption at rest
    const analytics = new AnalyticsModule(this, 'analytics', config);

    // Set up comprehensive monitoring with CloudTrail, CloudWatch, and SNS
    const monitoring = new MonitoringModule(
      this,
      'monitoring',
      storage.logsBucket,
      compute.instances,
      config
    );

    // Output important resource identifiers for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID for the secure environment',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: compute.instances.map(instance => instance.id),
      description: 'EC2 instance IDs deployed in private subnets',
    });

    new TerraformOutput(this, 'app-bucket-name', {
      value: storage.appBucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: storage.logsBucket.bucket,
      description: 'S3 bucket name for audit logs',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: database.dynamoTable.name,
      description: 'DynamoDB table name with PITR enabled',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: database.rdsInstance.endpoint,
      description: 'RDS instance endpoint (private access only)',
      sensitive: true,
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambda.lambdaFunction.functionName,
      description: 'Lambda function name deployed in VPC',
    });

    new TerraformOutput(this, 'elasticsearch-endpoint', {
      value: analytics.elasticsearchDomain.endpoint,
      description: 'Elasticsearch domain endpoint with encryption',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoring.snsTopic.arn,
      description: 'SNS topic ARN for alarm notifications',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: monitoring.cloudTrail.arn,
      description: 'CloudTrail ARN with KMS encryption enabled',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networking.natGateway.id,
      description: 'NAT Gateway ID for private subnet internet access',
    });

    new TerraformOutput(this, 's3-vpc-endpoint-id', {
      value: networking.s3VpcEndpoint.id,
      description: 'S3 VPC Endpoint ID for private S3 access',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
