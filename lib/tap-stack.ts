import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { NetworkStack } from './network-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { AlbStack } from './alb-stack';
import { EcsServiceStack } from './ecs-service-stack';
import { Route53Stack } from './route53-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly networkStack: NetworkStack;
  public readonly ecsClusterStack: EcsClusterStack;
  public readonly albStack: AlbStack;
  public readonly frontendService: EcsServiceStack;
  public readonly backendService: EcsServiceStack;
  public readonly route53Stack: Route53Stack;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('webapp:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'WebApp',
    };

    // Configure AWS provider for eu-west-2
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: 'eu-west-2',
      },
      { parent: this }
    );

    const resourceOpts = { parent: this, provider: awsProvider };

    // Create Network Stack
    this.networkStack = new NetworkStack(
      'webapp-network',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create ECS Cluster Stack
    this.ecsClusterStack = new EcsClusterStack(
      'webapp-ecs',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create ALB Stack
    const publicSubnetIds = pulumi.all(
      this.networkStack.publicSubnets.map(s => s.id)
    );
    this.albStack = new AlbStack(
      'webapp-alb',
      {
        environmentSuffix,
        vpcId: this.networkStack.vpc.id,
        publicSubnetIds: publicSubnetIds,
        albSecurityGroupId: this.networkStack.albSecurityGroup.id,
        tags,
      },
      resourceOpts
    );

    // Create Frontend ECS Service
    const privateSubnetIds = pulumi.all(
      this.networkStack.privateSubnets.map(s => s.id)
    );
    this.frontendService = new EcsServiceStack(
      'webapp-frontend',
      {
        environmentSuffix,
        serviceName: 'frontend',
        clusterArn: this.ecsClusterStack.cluster.arn,
        executionRoleArn: this.ecsClusterStack.executionRole.arn,
        taskRoleArn: this.ecsClusterStack.taskRole.arn,
        ecrRepositoryUrl:
          this.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl,
        containerPort: 3000,
        desiredCount: 2,
        minCapacity: 2,
        maxCapacity: 10,
        cpu: '512',
        memory: '1024',
        targetGroupArn: this.albStack.frontendTargetGroup.arn,
        privateSubnetIds: privateSubnetIds,
        securityGroupId: this.networkStack.ecsSecurityGroup.id,
        logGroupName: `/ecs/webapp-frontend-${environmentSuffix}`,
        containerEnvironment: [
          { name: 'NODE_ENV', value: 'production' },
          { name: 'PORT', value: '3000' },
        ],
        tags,
      },
      { ...resourceOpts, dependsOn: [this.albStack.httpsListener] }
    );

    // Create Backend ECS Service
    this.backendService = new EcsServiceStack(
      'webapp-backend',
      {
        environmentSuffix,
        serviceName: 'backend',
        clusterArn: this.ecsClusterStack.cluster.arn,
        executionRoleArn: this.ecsClusterStack.executionRole.arn,
        taskRoleArn: this.ecsClusterStack.taskRole.arn,
        ecrRepositoryUrl:
          this.ecsClusterStack.ecrRepositoryBackend.repositoryUrl,
        containerPort: 8080,
        desiredCount: 3,
        minCapacity: 3,
        maxCapacity: 15,
        cpu: '512',
        memory: '1024',
        targetGroupArn: this.albStack.backendTargetGroup.arn,
        privateSubnetIds: privateSubnetIds,
        securityGroupId: this.networkStack.ecsSecurityGroup.id,
        logGroupName: `/ecs/webapp-backend-${environmentSuffix}`,
        containerEnvironment: [
          { name: 'NODE_ENV', value: 'production' },
          { name: 'PORT', value: '8080' },
          { name: 'API_PREFIX', value: '/api' },
        ],
        tags,
      },
      { ...resourceOpts, dependsOn: [this.albStack.httpsListener] }
    );

    // Create Route53 Stack
    // Note: Using test domain since example.com is reserved by AWS
    this.route53Stack = new Route53Stack(
      'webapp-dns',
      {
        environmentSuffix,
        domainName: `webapp-${environmentSuffix}.test`,
        subdomain: 'app',
        albDnsName: this.albStack.alb.dnsName,
        albZoneId: this.albStack.alb.zoneId,
        tags,
      },
      resourceOpts
    );

    this.registerOutputs({
      vpcId: this.networkStack.vpc.id,
      clusterArn: this.ecsClusterStack.cluster.arn,
      albDnsName: this.albStack.alb.dnsName,
      applicationUrl: this.route53Stack.fullDomainName,
      frontendEcrUrl: this.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl,
      backendEcrUrl: this.ecsClusterStack.ecrRepositoryBackend.repositoryUrl,
    });
  }
}
