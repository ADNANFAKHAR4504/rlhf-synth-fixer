import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { Construct } from 'constructs';

// Import all modules
import {
  VpcModule,
  SecurityGroupsModule,
  IamRolesModule,
  AlbModule,
  AsgModule,
  LambdaModule,
  SqsModule,
  CloudWatchModule,
  SsmModule,
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

    // Configure Archive Provider
    new ArchiveProvider(this, 'archive');

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

    // Project configuration
    const projectName = 'myapp'; // Change this to your project name
    const environment = environmentSuffix;

    // 1. Create VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      projectName,
      environment,
    });

    // 2. Create SQS Module (needed for IAM roles)
    const sqsModule = new SqsModule(this, 'sqs', {
      queueName: `${projectName}-${environment}-processing-queue`,
      environment,
    });

    // 3. Create Security Groups Module
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      'security-groups',
      {
        vpcId: vpcModule.vpc.id,
        projectName,
        environment,
      }
    );

    // 4. Create IAM Roles Module
    const iamRolesModule = new IamRolesModule(this, 'iam-roles', {
      projectName,
      environment,
      sqsQueueArn: sqsModule.queue.arn,
    });

    const albModule = new AlbModule(this, 'alb', {
      projectName,
      environment,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnetIds,
      securityGroupId: securityGroupsModule.albSecurityGroup.id,
      logBucket: `${projectName}-${environment}-alb-logs-${awsRegion}`,
    });

    // 6. Create ASG Module
    const asgModule = new AsgModule(this, 'asg', {
      projectName,
      environment,
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnetIds,
      targetGroupArn: albModule.targetGroup.arn,
      securityGroupId: securityGroupsModule.ec2SecurityGroup.id,
      instanceProfileName: iamRolesModule.ec2InstanceProfile.name,
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
    });

    // 7. Create Lambda Module
    const lambdaModule = new LambdaModule(this, 'lambda', {
      projectName,
      environment,
      roleArn: iamRolesModule.lambdaRole.arn,
      sqsQueueArn: sqsModule.queue.arn,
      timeout: 300,
    });

    // 8. Create CloudWatch Module
    new CloudWatchModule(this, 'cloudwatch', {
      projectName,
      environment,
      asgName: asgModule.autoScalingGroup.name,
      lambdaFunctionName: lambdaModule.function.functionName,
      albArn: albModule.alb.arn,
    });

    // 9. Create SSM Parameters Module
    new SsmModule(this, 'ssm', {
      projectName,
      environment,
      parameters: {
        db_host: 'localhost',
        db_port: '5432',
        app_version: '1.0.0',
        feature_flags: JSON.stringify({ newFeature: true }),
      },
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnetIds,
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnetIds,
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'ALB DNS name',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asgModule.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambdaModule.function.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaModule.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'sqs-queue-url', {
      value: sqsModule.queue.url,
      description: 'SQS queue URL',
    });

    new TerraformOutput(this, 'sqs-queue-arn', {
      value: sqsModule.queue.arn,
      description: 'SQS queue ARN',
    });
  }
}
