import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { AutoscalingAttachment } from '@cdktf/provider-aws/lib/autoscaling-attachment';
import {
  VpcModule,
  S3Module,
  Ec2Module,
  AlbModule,
  Route53Module,
  CloudWatchModule,
  IamModule,
  SecurityGroupModule,
  RdsModule,
} from '../lib/modules';
import { TerraformOutput } from 'cdktf';
import { Fn } from 'cdktf';

// ? Import your stacks here
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

    // Common configuration
    const namePrefix = 'MyApp-';
    const projectTags = {
      Project: 'MyApp',
    };

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with public and private subnets across 3 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      namePrefix,
      tags: projectTags,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [
        Fn.element(azs.names, 0),
        Fn.element(azs.names, 1),
        Fn.element(azs.names, 2),
      ],
    });

    // Create S3 bucket
    const s3Module = new S3Module(this, 's3', {
      namePrefix,
      tags: projectTags,
      bucketName: `${namePrefix.toLowerCase()}app-bucket-${Date.now()}`,
    });

    // Create Security Groups
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-groups',
      {
        namePrefix,
        tags: projectTags,
        vpcId: vpcModule.vpc.id,
      }
    );

    // Create IAM roles and instance profile
    const iamModule = new IamModule(this, 'iam', {
      namePrefix,
      tags: projectTags,
      s3BucketArn: s3Module.bucket.arn,
    });

    //Create RDS database
    const rds = new RdsModule(this, 'rds', {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.rdsSecurityGroup.id],
    });

    // Create Application Load Balancer
    const albModule = new AlbModule(this, 'alb', {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.albSecurityGroup.id],
    });

    // Create EC2 instances with Auto Scaling
    const ec2Module = new Ec2Module(this, 'ec2', {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.ec2SecurityGroup.id],
      iamInstanceProfile: iamModule.instanceProfile.name,
    });

    // Attach Auto Scaling Group to Load Balancer Target Group
    new AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: ec2Module.autoScalingGroup.id,
      lbTargetGroupArn: albModule.targetGroup.arn,
    });

    // Create Route53 hosted zone and record
    const route53Module = new Route53Module(this, 'route53', {
      namePrefix,
      tags: projectTags,
      domainName: 'myapp-demo.local',
      albDnsName: albModule.loadBalancer.dnsName,
      albZoneId: albModule.loadBalancer.zoneId,
    });

    // Create CloudWatch log group
    const cloudWatchModule = new CloudWatchModule(this, 'cloudwatch', {
      namePrefix,
      tags: projectTags,
      logGroupName: `${namePrefix}application-logs`,
    });

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment

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
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    // VPC Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'alb-security-group-id', {
      value: securityGroupModule.albSecurityGroup.id,
      description: 'ID of the ALB Security Group',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityGroupModule.ec2SecurityGroup.id,
      description: 'ID of the EC2 Security Group',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityGroupModule.rdsSecurityGroup.id,
      description: 'ID of the RDS Security Group',
    });

    // IAM Outputs
    new TerraformOutput(this, 'instance-profile-name', {
      value: iamModule.instanceProfile.name,
      description: 'Name of the EC2 Instance Profile',
    });
    // ALB Outputs
    new TerraformOutput(this, 'load-balancer-dns', {
      value: albModule.loadBalancer.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new TerraformOutput(this, 'load-balancer-zone-id', {
      value: albModule.loadBalancer.zoneId,
      description: 'Zone ID of the Application Load Balancer',
    });

    new TerraformOutput(this, 'load-balancer-arn', {
      value: albModule.loadBalancer.arn,
      description: 'ARN of the Application Load Balancer',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: albModule.targetGroup.arn,
      description: 'ARN of the Target Group',
    });

    // EC2 Auto Scaling Outputs
    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: ec2Module.autoScalingGroup.name,
      description: 'Name of the Auto Scaling Group',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: ec2Module.launchTemplate.id,
      description: 'ID of the Launch Template',
    });

    // Route53 Outputs
    new TerraformOutput(this, 'hosted-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'ID of the Route53 Hosted Zone',
    });

    new TerraformOutput(this, 'domain-name', {
      value: route53Module.record.name,
      description: 'Domain name configured in Route53',
    });

    // CloudWatch Outputs
    new TerraformOutput(this, 'log-group-name', {
      value: cloudWatchModule.logGroup.name,
      description: 'Name of the CloudWatch Log Group',
    });

    new TerraformOutput(this, 'log-group-arn', {
      value: cloudWatchModule.logGroup.arn,
      description: 'ARN of the CloudWatch Log Group',
    });

    // Availability Zones Output
    new TerraformOutput(this, 'availability-zones', {
      value: [
        Fn.element(azs.names, 0),
        Fn.element(azs.names, 1),
        Fn.element(azs.names, 2),
      ],
      description: 'Availability zones used for the infrastructure',
    });
  }
}
