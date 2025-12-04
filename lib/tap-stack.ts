import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { NetworkingConstruct } from './networking-construct';
import { ContainerRegistryConstruct } from './container-registry-construct';
import { PipelineConstruct } from './pipeline-construct';
import { EcsDeploymentConstruct } from './ecs-deployment-construct';
import { MonitoringConstruct } from './monitoring-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch = 'main',
    } = props;

    // VPC and networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // ECR repository for container images
    const containerRegistry = new ContainerRegistryConstruct(
      this,
      'ContainerRegistry',
      {
        environmentSuffix,
      }
    );

    // ECS cluster and deployment infrastructure
    const ecsDeployment = new EcsDeploymentConstruct(this, 'EcsDeployment', {
      environmentSuffix,
      vpc: networking.vpc,
      ecrRepository: containerRegistry.repository,
    });

    // CodePipeline for CI/CD automation
    const pipeline = new PipelineConstruct(this, 'Pipeline', {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch,
      ecrRepository: containerRegistry.repository,
      ecsService: ecsDeployment.service,
      ecsCluster: ecsDeployment.cluster,
    });

    // Monitoring and alerting
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      pipeline: pipeline.pipeline,
      ecsService: ecsDeployment.service,
      loadBalancer: ecsDeployment.loadBalancer,
    });

    // Stack outputs for integration tests
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
      exportName: `cicd-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: containerRegistry.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `cicd-ecr-uri-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: ecsDeployment.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `cicd-ecs-cluster-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: ecsDeployment.service.serviceName,
      description: 'ECS Service Name',
      exportName: `cicd-ecs-service-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: ecsDeployment.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: `cicd-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipeline.pipelineName,
      description: 'CodePipeline Name',
      exportName: `cicd-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoring.alarmTopic.topicArn,
      description: 'SNS Alarm Topic ARN',
      exportName: `cicd-alarm-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: pipeline.buildProject.projectName,
      description: 'CodeBuild Project Name',
      exportName: `cicd-build-project-${environmentSuffix}`,
    });
  }
}
