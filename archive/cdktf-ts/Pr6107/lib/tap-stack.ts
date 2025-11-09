import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { IamStack } from './iam-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { LoadBalancerStack } from './loadbalancer-stack';
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const PRIMARY_REGION = 'us-east-1';
const DR_REGION = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure Primary AWS Provider (us-east-1)
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: PRIMARY_REGION,
      defaultTags: defaultTags,
      alias: 'primary',
    });

    // Configure DR AWS Provider (us-east-2)
    const drProvider = new AwsProvider(this, 'aws-dr', {
      region: DR_REGION,
      defaultTags: defaultTags,
      alias: 'dr',
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Deploy networking in both regions
    const primaryNetworking = new NetworkingStack(this, 'primary-networking', {
      environmentSuffix,
      region: PRIMARY_REGION,
      provider: primaryProvider,
    });

    const drNetworking = new NetworkingStack(this, 'dr-networking', {
      environmentSuffix,
      region: DR_REGION,
      provider: drProvider,
    });

    // Deploy IAM resources (global, but created in primary)
    // Note: Creating placeholder buckets for IAM, will be replaced with actual buckets
    const placeholderBucketArn = `arn:aws:s3:::payment-assets-${environmentSuffix}-placeholder`;

    const iamStack = new IamStack(this, 'iam', {
      environmentSuffix,
      s3BucketPrimaryArn: placeholderBucketArn,
      s3BucketDrArn: placeholderBucketArn,
    });

    // Deploy storage with cross-region replication
    const storageStack = new StorageStack(this, 'storage', {
      environmentSuffix,
      replicationRoleArn: iamStack.outputs.replicationRoleArn,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryProvider: primaryProvider,
      drProvider: drProvider,
    });

    // Deploy database (Aurora Global Database)
    const databaseStack = new DatabaseStack(this, 'database', {
      environmentSuffix,
      primaryVpcId: primaryNetworking.outputs.vpcId,
      drVpcId: drNetworking.outputs.vpcId,
      primaryDbSubnetIds: primaryNetworking.outputs.databaseSubnetIds,
      drDbSubnetIds: drNetworking.outputs.databaseSubnetIds,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryProvider: primaryProvider,
      drProvider: drProvider,
    });

    // Deploy load balancers in both regions
    const primaryLb = new LoadBalancerStack(this, 'primary-lb', {
      environmentSuffix,
      vpcId: primaryNetworking.outputs.vpcId,
      publicSubnetIds: primaryNetworking.outputs.publicSubnetIds,
      region: PRIMARY_REGION,
      provider: primaryProvider,
    });

    const drLb = new LoadBalancerStack(this, 'dr-lb', {
      environmentSuffix,
      vpcId: drNetworking.outputs.vpcId,
      publicSubnetIds: drNetworking.outputs.publicSubnetIds,
      region: DR_REGION,
      provider: drProvider,
    });

    // Deploy compute (Auto Scaling Groups) in both regions
    const primaryCompute = new ComputeStack(this, 'primary-compute', {
      environmentSuffix,
      vpcId: primaryNetworking.outputs.vpcId,
      privateSubnetIds: primaryNetworking.outputs.privateSubnetIds,
      targetGroupArn: primaryLb.outputs.targetGroupArn,
      instanceProfileName: iamStack.outputs.ec2InstanceProfileName,
      region: PRIMARY_REGION,
      provider: primaryProvider,
    });

    const drCompute = new ComputeStack(this, 'dr-compute', {
      environmentSuffix,
      vpcId: drNetworking.outputs.vpcId,
      privateSubnetIds: drNetworking.outputs.privateSubnetIds,
      targetGroupArn: drLb.outputs.targetGroupArn,
      instanceProfileName: iamStack.outputs.ec2InstanceProfileName,
      region: DR_REGION,
      provider: drProvider,
    });

    // Deploy monitoring (CloudWatch alarms and SNS)
    const monitoringStack = new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryAlbArn: primaryLb.outputs.albArn,
      drAlbArn: drLb.outputs.albArn,
      primaryAsgName: primaryCompute.outputs.asgName,
      drAsgName: drCompute.outputs.asgName,
      primaryDbClusterId: databaseStack.outputs.primaryClusterId,
      drDbClusterId: databaseStack.outputs.drClusterId,
      primaryTargetGroupArn: primaryLb.outputs.targetGroupArn,
      drTargetGroupArn: drLb.outputs.targetGroupArn,
      primaryProvider: primaryProvider,
      drProvider: drProvider,
    });

    // Outputs
    new TerraformOutput(this, 'primary_alb_dns', {
      value: primaryLb.outputs.albDnsName,
      description: 'Primary ALB DNS name',
    });

    new TerraformOutput(this, 'dr_alb_dns', {
      value: drLb.outputs.albDnsName,
      description: 'DR ALB DNS name',
    });

    new TerraformOutput(this, 'primary_db_endpoint', {
      value: databaseStack.outputs.primaryClusterEndpoint,
      description: 'Primary database cluster endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'dr_db_endpoint', {
      value: databaseStack.outputs.drClusterEndpoint,
      description: 'DR database cluster endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'primary_s3_bucket', {
      value: storageStack.outputs.primaryBucketId,
      description: 'Primary S3 bucket name',
    });

    new TerraformOutput(this, 'dr_s3_bucket', {
      value: storageStack.outputs.drBucketId,
      description: 'DR S3 bucket name',
    });

    new TerraformOutput(this, 'primary_sns_topic', {
      value: monitoringStack.outputs.primarySnsTopicArn,
      description: 'Primary SNS topic ARN for alarms',
    });

    new TerraformOutput(this, 'dr_sns_topic', {
      value: monitoringStack.outputs.drSnsTopicArn,
      description: 'DR SNS topic ARN for alarms',
    });

    new TerraformOutput(this, 'global_cluster_id', {
      value: databaseStack.outputs.globalClusterId,
      description: 'Global cluster identifier',
    });

    new TerraformOutput(this, 'primary_cluster_id', {
      value: databaseStack.outputs.primaryClusterId,
      description: 'Primary cluster identifier',
    });

    new TerraformOutput(this, 'dr_cluster_id', {
      value: databaseStack.outputs.drClusterId,
      description: 'DR cluster identifier',
    });

    new TerraformOutput(this, 'primary_vpc_id', {
      value: primaryNetworking.outputs.vpcId,
      description: 'Primary VPC ID',
    });

    new TerraformOutput(this, 'dr_vpc_id', {
      value: drNetworking.outputs.vpcId,
      description: 'DR VPC ID',
    });

    new TerraformOutput(this, 'primary_target_group_arn', {
      value: primaryLb.outputs.targetGroupArn,
      description: 'Primary target group ARN',
    });

    new TerraformOutput(this, 'primary_asg_name', {
      value: primaryCompute.outputs.asgName,
      description: 'Primary Auto Scaling Group name',
    });

    new TerraformOutput(this, 'dr_asg_name', {
      value: drCompute.outputs.asgName,
      description: 'DR Auto Scaling Group name',
    });
  }
}
