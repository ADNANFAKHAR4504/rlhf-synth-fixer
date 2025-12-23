import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack, TerraformOutput } from 'cdktf';
// import { S3Backend } from 'cdktf';  // Commented out for local testing
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Construct } from 'constructs';
import {
  VPCModule,
  KMSModule,
  SecretsModule,
  RDSModule,
  IAMModule,
  ALBModule,
  ECSModule,
} from './payment-processing-modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    // const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    // const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend (commented out for local testing)
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });
    // this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get AWS Account ID
    const caller = new DataAwsCallerIdentity(this, 'current', {});

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Application: 'PaymentProcessing',
      CostCenter: 'Finance',
      ManagedBy: 'CDKTF',
    };

    // Certificate ARN for HTTPS (should be passed as environment variable in real deployment)
    const certificateArn =
      process.env.ACM_CERTIFICATE_ARN ||
      'arn:aws:acm:us-east-1:123456789012:certificate/example';

    // Availability Zones for us-east-1
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // VPC Module
    const vpc = new VPCModule(this, 'vpc', {
      environmentSuffix,
      tags: commonTags,
      cidrBlock: '10.0.0.0/16',
      availabilityZones,
    });

    // KMS Module
    const kms = new KMSModule(this, 'kms', {
      environmentSuffix,
      tags: commonTags,
      region: awsRegion,
      accountId: caller.accountId,
    });

    // Secrets Manager Module
    const secrets = new SecretsModule(this, 'secrets', {
      environmentSuffix,
      tags: commonTags,
    });

    // IAM Module
    const iam = new IAMModule(this, 'iam', {
      environmentSuffix,
      tags: commonTags,
      s3FlowLogsBucketArn: vpc.flowLogsBucket.arn,
      secretArn: secrets.rdsSecret.arn,
    });

    // ALB Module
    const alb = new ALBModule(this, 'alb', {
      environmentSuffix,
      tags: commonTags,
      vpcId: vpc.vpc.id,
      publicSubnetIds: vpc.publicSubnets.map(s => s.id),
      certificateArn,
    });

    // RDS Module
    const rds = new RDSModule(this, 'rds', {
      environmentSuffix,
      tags: commonTags,
      vpcId: vpc.vpc.id,
      privateSubnetIds: vpc.privateSubnets.map(s => s.id),
      ecsSecurityGroupId: '', // Will be set after ECS module creation
      kmsKeyArn: kms.key.arn,
      masterPasswordSecretArn: secrets.rdsSecret.arn,
    });

    // ECS Module
    const ecs = new ECSModule(this, 'ecs', {
      environmentSuffix,
      tags: commonTags,
      vpcId: vpc.vpc.id,
      privateSubnetIds: vpc.privateSubnets.map(s => s.id),
      albSecurityGroupId: alb.securityGroup.id,
      albTargetGroupArn: alb.targetGroup.arn,
      taskExecutionRoleArn: iam.ecsTaskExecutionRole.arn,
      taskRoleArn: iam.ecsTaskRole.arn,
      rdsEndpoint: rds.cluster.endpoint,
      secretArn: secrets.rdsSecret.arn,
    });

    // Update RDS security group to allow ECS traffic
    rds.securityGroup.addOverride('ingress', [
      {
        from_port: 3306,
        to_port: 3306,
        protocol: 'tcp',
        security_groups: [ecs.securityGroup.id],
        cidr_blocks: [],
        ipv6_cidr_blocks: [],
        prefix_list_ids: [],
        self: false,
        description: 'MySQL from ECS tasks only',
      },
    ]);

    // Outputs
    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.alb.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new TerraformOutput(this, 'rds_cluster_endpoint', {
      value: rds.cluster.endpoint,
      description: 'RDS Aurora cluster endpoint',
    });

    new TerraformOutput(this, 'vpc_flow_logs_bucket', {
      value: vpc.flowLogsBucket.bucket,
      description: 'S3 bucket name for VPC flow logs',
    });

    new TerraformOutput(this, 'ecs_cluster_name', {
      value: ecs.cluster.name,
      description: 'ECS cluster name',
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: kms.key.id,
      description: 'KMS key ID for RDS encryption',
    });
  }
}
