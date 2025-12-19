import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { EcsStack } from './ecs-stack';
import { PipelineStack } from './pipeline-stack';

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

    // Create network infrastructure
    const network = new NetworkStack(this, 'Network', {
      environmentSuffix,
    });

    // Create database
    const database = new DatabaseStack(this, 'Database', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.rdsSecurityGroup,
    });

    // Create EFS storage
    const storage = new StorageStack(this, 'Storage', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.efsSecurityGroup,
    });

    // Create ECS cluster and service
    const ecs = new EcsStack(this, 'Ecs', {
      environmentSuffix,
      vpc: network.vpc,
      ecsSecurityGroup: network.ecsSecurityGroup,
      albSecurityGroup: network.albSecurityGroup,
      fileSystem: storage.fileSystem,
      accessPoint: storage.accessPoint,
      dbSecret: database.secret,
    });

    // Create CI/CD pipeline
    const pipeline = new PipelineStack(this, 'Pipeline', {
      environmentSuffix,
      ecsCluster: ecs.cluster,
      ecsService: ecs.service,
    });

    // Add dependencies
    database.node.addDependency(network);
    storage.node.addDependency(network);
    ecs.node.addDependency(database);
    ecs.node.addDependency(storage);
    pipeline.node.addDependency(ecs);

    // Stack outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: ecs.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `ClusterName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: ecs.service.serviceName,
      description: 'ECS Service Name',
      exportName: `ServiceName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: ecs.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: `LoadBalancerDns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
      exportName: `DatabaseEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret.secretArn,
      description: 'Database Secret ARN',
      exportName: `DatabaseSecretArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FileSystemId', {
      value: storage.fileSystem.fileSystemId,
      description: 'EFS File System ID',
      exportName: `FileSystemId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
      exportName: `PipelineArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: network.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });
  }
}
