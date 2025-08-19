import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  SubnetModule,
  SecurityGroupModule,
  IamModule,
  Ec2Module,
  RdsModule,
  S3Module,
  CommonConfig,
} from './modules';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
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
    // Common configuration for all resources
    const config: CommonConfig = {
      environment: process.env.ENVIRONMENT || 'dev',
      owner: process.env.OWNER || 'devops-team',
      region: 'us-east-1',
      projectName: 'tap-infrastructure',
    };

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: config.environment,
            Owner: config.owner,
            ManagedBy: 'Terraform-CDKTF',
            Project: config.projectName,
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

    // ? Add your stack instantiations here
    // Create VPC with Internet Gateway
    const vpcModule = new VpcModule(this, 'vpc', {
      ...config,
      cidrBlock: '10.0.0.0/16',
    });

    // Create subnets with NAT Gateways and routing
    const subnetModule = new SubnetModule(this, 'subnets', {
      ...config,
      vpc: vpcModule.vpc,
      internetGateway: vpcModule.internetGateway,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    });

    // Create security groups with proper access controls
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-groups',
      {
        ...config,
        vpc: vpcModule.vpc,
        sshCidrBlock: process.env.SSH_CIDR_BLOCK || '203.0.113.15/32', // Restrict in production
      }
    );

    // Create IAM roles and policies
    const iamModule = new IamModule(this, 'iam', config);

    // Create EC2 instances in public subnets
    const ec2Module = new Ec2Module(this, 'ec2', {
      ...config,
      subnets: subnetModule.publicSubnets,
      securityGroups: [
        securityGroupModule.sshSecurityGroup,
        securityGroupModule.webSecurityGroup,
      ],
      instanceProfile: iamModule.ec2InstanceProfile,
      instanceType: process.env.INSTANCE_TYPE || 't3.micro',
      keyName: 'nova-model-key',
    });

    // Create RDS instance in private subnets
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );
    const rdsModule = new RdsModule(this, 'rds', {
      ...config,
      privateSubnets: subnetModule.privateSubnets,
      securityGroup: securityGroupModule.dbSecurityGroup,
      dbName: process.env.DB_NAME || 'tapdb',
      dbUsername: process.env.DB_USERNAME || 'admin',
      dbPassword: dbPasswordSecret.secretString,
      instanceClass: process.env.DB_INSTANCE_CLASS || 'db.t3.medium',
    });

    // Create S3 bucket for logs
    const s3Module = new S3Module(this, 's3', config);

    // CloudWatch Log Group
    const flowLogGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      name: `${config.projectName}-vpc-flow-logs`,
      retentionInDays: 90,
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: `${config.projectName}-vpc-flow-log-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    // IAM Policy for CloudWatch permissions
    new IamRolePolicy(this, 'flow-log-policy', {
      name: `${config.projectName}-vpc-flow-log-policy`,
      role: flowLogRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${flowLogGroup.arn}:*`,
          },
        ],
      }),
    });

    // Flow Log Resource
    new FlowLog(this, 'vpc-flow-log', {
      vpcId: vpcModule.vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
    });

    // Export important outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: subnetModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: subnetModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Module.instances.map(instance => instance.id),
      description: 'IDs of the created EC2 instances',
    });

    new TerraformOutput(this, 'ec2-public-ips', {
      value: ec2Module.instances.map(instance => instance.publicIp),
      description: 'Public IP addresses of EC2 instances',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 's3-logs-bucket-name', {
      value: s3Module.logsBucket.bucket,
      description: 'Name of the S3 logs bucket',
    });

    new TerraformOutput(this, 'nat-gateway-ips', {
      value: subnetModule.natGateways.map(nat => nat.publicIp),
      description: 'Public IP addresses of NAT Gateways',
    });
    // ! Instead, create separate stacks for each resource type.
  }
}
