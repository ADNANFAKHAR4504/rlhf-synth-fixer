import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';

// Import your stacks/modules here
import {
  NetworkingModule,
  SecurityGroupsModule,
  IamModule,
  AutoScalingModule,
  LoadBalancerModule,
  CloudWatchModule,
  RdsModule,
  S3Module,
  SnsModule,
  StandardTags,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  notificationEmail?: string;
  // Add this for testing purposes
  overrideRegion?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Make region selection more explicit and testable
    const getAwsRegion = (): string => {
      // Check for override region first (for testing)
      if (props?.overrideRegion) {
        return props.overrideRegion;
      }
      // Default to us-west-2 for production deployments
      return props?.awsRegion || 'us-west-2';
    };

    const awsRegion = getAwsRegion();
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];
    const notificationEmail = props?.notificationEmail || 'admin@example.com';

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

    // Standard tags for all resources
    const standardTags: StandardTags = {
      Environment: environmentSuffix,
      Project: 'TAP',
      ManagedBy: 'Terraform',
      CreatedBy: 'CDKTF',
    };

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // 1. Networking Module - Get VPC and subnets
    const networkingModule = new NetworkingModule(this, 'networking', {
      region: awsRegion,
      standardTags,
    });

    // 2. Security Groups Module - Create security groups for ALB, EC2, and RDS
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      'security-groups',
      {
        vpcId: networkingModule.vpc.id,
        standardTags,
      }
    );

    // 3. IAM Module - Create IAM roles and policies for EC2
    const iamModule = new IamModule(this, 'iam', {
      standardTags,
      environmentSuffix, // Add this
    });

    // 4. S3 Module - Create S3 bucket for logs
    const s3Module = new S3Module(this, 's3', {
      standardTags,
    });

    // 5. SNS Module - Create SNS topic for alerts
    const snsModule = new SnsModule(this, 'sns', {
      email: notificationEmail,
      standardTags,
    });

    // 6. Load Balancer Module - Create ALB and target group
    const loadBalancerModule = new LoadBalancerModule(this, 'load-balancer', {
      subnetIds: networkingModule.publicSubnetIds,
      securityGroupId: securityGroupsModule.albSecurityGroup.id,
      vpcId: networkingModule.vpc.id,
      standardTags,
    });

    // 7. Auto Scaling Module - Create launch template and ASG
    const autoScalingModule = new AutoScalingModule(this, 'auto-scaling', {
      subnetIds: networkingModule.publicSubnetIds,
      securityGroupId: securityGroupsModule.ec2SecurityGroup.id,
      instanceProfileName: iamModule.instanceProfile.name,
      targetGroupArn: loadBalancerModule.targetGroup.arn,
      standardTags,
    });

    // 8. CloudWatch Module - Create CloudWatch alarms
    new CloudWatchModule(this, 'cloudwatch', {
      autoScalingGroupName: autoScalingModule.autoScalingGroup.name,
      scaleUpPolicyArn: autoScalingModule.scaleUpPolicy.arn,
      scaleDownPolicyArn: autoScalingModule.scaleDownPolicy.arn,
      snsTopicArn: snsModule.topic.arn,
      standardTags,
    });

    // 9. RDS Module - Create RDS instance
    const rdsModule = new RdsModule(this, 'rds', {
      subnetIds:
        networkingModule.privateSubnetIds.length > 0
          ? networkingModule.privateSubnetIds
          : networkingModule.publicSubnetIds,
      securityGroupId: securityGroupsModule.rdsSecurityGroup.id,
      standardTags,
    });

    // Terraform Outputs - Fix the problematic outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'VPC ID',
    });

    // Replace the problematic public-subnet-ids output with:
    new TerraformOutput(this, 'public-subnet-ids', {
      value: Fn.jsonencode(networkingModule.publicSubnetIds),
      description: 'Public subnet IDs as JSON',
    });

    new TerraformOutput(this, 'load-balancer-dns-name', {
      value: loadBalancerModule.loadBalancer.dnsName,
      description: 'Load balancer DNS name',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: loadBalancerModule.targetGroup.arn,
      description: 'Target group ARN',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: autoScalingModule.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for logs',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: snsModule.topic.arn,
      description: 'SNS topic ARN for alerts',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityGroupsModule.ec2SecurityGroup.id,
      description: 'EC2 security group ID',
    });

    // FIX 2: Use Fn.lookup for accessing list elements
    new TerraformOutput(this, 'rds-secret-arn', {
      value: Fn.conditional(
        rdsModule.dbInstance.masterUserSecret !== undefined,
        'Secret ARN available in AWS Secrets Manager',
        'managed-by-aws'
      ),
      description: 'RDS credentials secret status',
    });
  }
}
