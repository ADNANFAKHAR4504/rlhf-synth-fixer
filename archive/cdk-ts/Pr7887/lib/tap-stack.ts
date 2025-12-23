import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { EcsClusterConstruct } from './ecs-cluster-construct';
import { ApplicationLoadBalancerConstruct } from './alb-construct';
import { SecretsConstruct } from './secrets-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Apply cost allocation tags to all resources
    cdk.Tags.of(this).add('Environment', `ecs-refactor-${environmentSuffix}`);
    cdk.Tags.of(this).add('Team', 'platform-engineering');
    cdk.Tags.of(this).add('Application', 'ecs-optimization');
    cdk.Tags.of(this).add('CostCenter', 'engineering-ops');

    // Issue 10: Create database credentials in Secrets Manager
    const secrets = new SecretsConstruct(this, 'Secrets', {
      environmentSuffix,
    });

    // Create VPC and networking
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // Issue 1-9: Create ECS cluster with all optimizations
    const ecsCluster = new EcsClusterConstruct(this, 'EcsCluster', {
      environmentSuffix,
      vpc: networking.vpc,
      databaseSecret: secrets.databaseSecret,
    });

    // Issue 5: Create ALB with corrected health checks
    const alb = new ApplicationLoadBalancerConstruct(this, 'ALB', {
      environmentSuffix,
      vpc: networking.vpc,
      fargateService: ecsCluster.fargateService,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: ecsCluster.cluster.clusterName,
      exportName: `cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.loadBalancer.loadBalancerDnsName,
      exportName: `alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: secrets.databaseSecret.secretArn,
      exportName: `db-secret-arn-${environmentSuffix}`,
    });
  }
}
