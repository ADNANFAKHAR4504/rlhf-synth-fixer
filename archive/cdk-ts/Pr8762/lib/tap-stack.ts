import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityGroupsStack } from './security-groups-stack';
import { S3Stack } from './s3-stack';
import { Ec2Stack } from './ec2-stack';
import { RdsStack } from './rds-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create Security Groups stack
    const securityGroupsStack = new SecurityGroupsStack(
      this,
      'SecurityGroupsStack',
      {
        vpc: vpcStack.vpc,
        environmentSuffix,
        env: props?.env,
      }
    );

    // Create S3 stack
    const s3Stack = new S3Stack(this, 'S3Stack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create EC2 stack
    const ec2Stack = new Ec2Stack(this, 'Ec2Stack', {
      vpc: vpcStack.vpc,
      webServerSg: securityGroupsStack.webServerSg,
      albSg: securityGroupsStack.albSg,
      applicationBucket: s3Stack.applicationBucket,
      environmentSuffix,
      env: props?.env,
    });

    // Create RDS stack
    const rdsStack = new RdsStack(this, 'RdsStack', {
      vpc: vpcStack.vpc,
      databaseSg: securityGroupsStack.databaseSg,
      environmentSuffix,
      env: props?.env,
    });

    // Create monitoring stack
    new MonitoringStack(this, 'MonitoringStack', {
      autoScalingGroup: ec2Stack.autoScalingGroup,
      database: rdsStack.database,
      applicationLoadBalancer: ec2Stack.applicationLoadBalancer,
      vpc: vpcStack.vpc,
      environmentSuffix,
      env: props?.env,
    });

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: ec2Stack.applicationLoadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: rdsStack.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Stack.applicationBucket.bucketName,
      description: 'S3 application bucket name',
    });
  }
}
