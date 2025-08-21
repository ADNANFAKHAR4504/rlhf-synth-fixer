import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc-construct';
import { IamConstruct } from './constructs/iam-construct';
import { S3Construct } from './constructs/s3-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
// import { EksConstruct } from './constructs/eks-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  envConfig: {
    region: string;
    replicationRegion: string;
    vpcCidr: string;
    maxAzs: number;
    enableLogging: boolean;
    s3ExpressOneZone: boolean;
  };
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'Vpc', {
      environmentSuffix: props.environmentSuffix,
      vpcCidr: props.envConfig.vpcCidr,
      maxAzs: props.envConfig.maxAzs,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create IAM roles and policies
    const iamConstruct = new IamConstruct(this, 'Iam', {
      environmentSuffix: props.environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create S3 buckets with cross-region replication
    const s3Construct = new S3Construct(this, 'S3', {
      environmentSuffix: props.environmentSuffix,
      primaryRegion: props.envConfig.region,
      replicationRegion: props.envConfig.replicationRegion,
      enableS3Express: props.envConfig.s3ExpressOneZone,
      replicationRole: iamConstruct.s3ReplicationRole,
    });

    // Create monitoring and logging
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix: props.environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
      vpc: vpcConstruct.vpc,
      logRetentionDays: props.environmentSuffix === 'prod' ? 90 : 30,
    });

    // Create EKS cluster with dashboard support
    // Note: Commenting out EKS for now to simplify deployment
    // const eksConstruct = new EksConstruct(this, 'Eks', {
    //   environmentSuffix: props.environmentSuffix,
    //   vpc: vpcConstruct.vpc,
    //   clusterRole: iamConstruct.eksClusterRole,
    //   nodeGroupRole: iamConstruct.eksNodeGroupRole,
    //   enableDashboard: true,
    // });

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID for environment',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Construct.primaryBucket.bucketName,
      description: 'Primary S3 bucket name',
    });

    // new cdk.CfnOutput(this, 'EksClusterName', {
    //   value: eksConstruct.cluster.clusterName,
    //   description: 'EKS cluster name',
    // });
  }
}
