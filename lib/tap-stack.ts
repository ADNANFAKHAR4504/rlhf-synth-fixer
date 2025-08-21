import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones} from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { AutoscalingAttachment } from '@cdktf/provider-aws/lib/autoscaling-attachment';
import {
  VpcModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  Route53Module,
  CloudWatchModule,
  IamModule,
  SecurityGroupModule,
} from "../lib/modules";

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
    const namePrefix = "MyApp-";
    const projectTags = {
      Project: "MyApp",
    };

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // Create VPC with public and private subnets across 3 AZs
    const vpcModule = new VpcModule(this, "vpc", {
      namePrefix,
      tags: projectTags,
      cidrBlock: "10.0.0.0/16",
      availabilityZones: [
        azs.names[0],
        azs.names[1],
        azs.names[2],
      ],
    });

    // Create S3 bucket
    const s3Module = new S3Module(this, "s3", {
      namePrefix,
      tags: projectTags,
      bucketName: `${namePrefix.toLowerCase()}app-bucket-${Date.now()}`,
    });

    // Create Security Groups
    const securityGroupModule = new SecurityGroupModule(this, "security-groups", {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
    });

    // Create IAM roles and instance profile
    const iamModule = new IamModule(this, "iam", {
      namePrefix,
      tags: projectTags,
      s3BucketArn: s3Module.bucket.arn,
    });

    // Create RDS database
    const rdsModule = new RdsModule(this, "rds", {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.rdsSecurityGroup.id],
    });

    // Create Application Load Balancer
    const albModule = new AlbModule(this, "alb", {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.albSecurityGroup.id],
    });

    // Create EC2 instances with Auto Scaling
    const ec2Module = new Ec2Module(this, "ec2", {
      namePrefix,
      tags: projectTags,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroupModule.ec2SecurityGroup.id],
      iamInstanceProfile: iamModule.instanceProfile.name,
    });

    // Attach Auto Scaling Group to Load Balancer Target Group
    new AutoscalingAttachment(this, "asg-attachment", {
      autoscalingGroupName: ec2Module.autoScalingGroup.id,
      lbTargetGroupArn: albModule.targetGroup.arn,
    });

    // Create Route53 hosted zone and record
    const route53Module = new Route53Module(this, "route53", {
      namePrefix,
      tags: projectTags,
      domainName: "myapp.example.com",
      albDnsName: albModule.loadBalancer.dnsName,
      albZoneId: albModule.loadBalancer.zoneId,
    });

    // Create CloudWatch log group
    const cloudWatchModule = new CloudWatchModule(this, "cloudwatch", {
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
  }
}
