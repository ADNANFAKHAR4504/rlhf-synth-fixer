import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  KmsModule,
  VpcModule,
  SecretsManagerModule,
  RdsModule,
  Ec2Module,
  S3Module,
  CloudWatchModule,
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

    // Get account ID for constructing ARNs
    // const currentAccount = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
    //   this,
    //   'current'
    // );

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'TAP',
            ManagedBy: 'CDKTF',
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

    // 1. KMS Module - Create encryption keys first
    const kmsModule = new KmsModule(this, 'kms');

    // 2. VPC Module - Create networking infrastructure
    const azs = [`${awsRegion}a`, `${awsRegion}b`];
    const vpcModule = new VpcModule(this, 'vpc', kmsModule.key.arn, azs);

    // 3. Secrets Manager Module - Store database credentials
    const secretsModule = new SecretsManagerModule(
      this,
      'secrets',
      kmsModule.key.id
    );

    // 4. RDS Module - Create PostgreSQL database
    const rdsModule = new RdsModule(this, 'rds', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      kmsKeyId: kmsModule.key.id,
      kmsKeyArn: kmsModule.key.arn,
      dbSecret: secretsModule.dbSecret,
    });

    // 5. EC2 Module - Create compute instance
    const ec2Module = new Ec2Module(this, 'ec2', {
      vpcId: vpcModule.vpc.id,
      publicSubnetId: vpcModule.publicSubnets[0].id,
      kmsKeyArn: kmsModule.key.arn,
      s3BucketArn: '', // This will be updated after S3 bucket creation
      secretArn: secretsModule.dbSecret.arn,
      rdsSecurityGroupId: rdsModule.securityGroup.id,
    });

    // 6. S3 Module - Create log storage bucket
    // Now that EC2 role is created, we can use its ARN
    const s3Module = new S3Module(
      this,
      's3',
      kmsModule.key.arn,
      ec2Module.role.arn
    );

    // Update EC2 module's policy with the actual S3 bucket ARN (resolving circular dependency)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ec2-s3-policy-update', {
      role: ec2Module.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject'],
            Resource: [`${s3Module.bucket.arn}/*`],
          },
        ],
      }),
    });

    // 7. CloudWatch Module - Set up monitoring and alerting
    const cloudWatchModule = new CloudWatchModule(
      this,
      'cloudwatch',
      kmsModule.key.arn
    );

    // Stack Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS PostgreSQL endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: ec2Module.instance.publicIp,
      description: 'EC2 instance public IP',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 log bucket name',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.id,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN',
    });

    new TerraformOutput(this, 'secret-arn', {
      value: secretsModule.dbSecret.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'ec2-log-group', {
      value: cloudWatchModule.ec2LogGroup.name,
      description: 'EC2 CloudWatch log group name',
    });

    new TerraformOutput(this, 'rds-log-group', {
      value: cloudWatchModule.rdsLogGroup.name,
      description: 'RDS CloudWatch log group name',
    });

    new TerraformOutput(this, 'alarm-name', {
      value: cloudWatchModule.alarm.alarmName,
      description: 'CloudWatch alarm name for RDS connection failures',
    });

    // Add outputs for subnet IDs for verification
    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id).join(','),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id).join(','),
      description: 'Private subnet IDs',
    });
  }
}
