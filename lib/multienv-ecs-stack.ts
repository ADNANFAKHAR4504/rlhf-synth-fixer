import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

export interface EnvironmentConfig {
  envName: string;
  vpcCidr: string;
  hostedZoneName?: string;
  hostedZone?: route53.IHostedZone;
  domainName: string;
  imageName: string;
  imageTag: string;
  port: number;
  cpu: number;
  memoryLimit: number;
}

export class MultiEnvEcsStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);
    cdk.Tags.of(this).add('envName', config.envName);

    // Create a VPC
    const vpc = new ec2.Vpc(this, `${config.envName}Vpc`, {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 3,
      natGateways: 1,
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, `${config.envName}EcsCluster`, {
      vpc,
      clusterName: `${config.envName}Tap`,
    });

    // Add EC2 capacity for LocalStack compatibility (Fargate not fully supported in Community)
    const autoScalingGroup = cluster.addCapacity(
      `${config.envName}DefaultAutoScalingGroup`,
      {
        instanceType: new ec2.InstanceType('t3.small'),
        machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 2,
        // Use $Default for LocalStack to avoid LaunchTemplate.LatestVersionNumber issue
        ...(isLocalStack
          ? {
              vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            }
          : {}),
      }
    );

    // For LocalStack, explicitly set the launch template version to avoid LatestVersionNumber issue
    if (isLocalStack && autoScalingGroup.node.defaultChild) {
      const asgResource = autoScalingGroup.node.defaultChild as cdk.CfnResource;
      asgResource.addPropertyOverride('LaunchTemplate.Version', '$Default');
    }

    // Enable ECS Container Insights (only if not LocalStack)
    if (!isLocalStack) {
      cluster.addDefaultCloudMapNamespace({
        name: `${config.envName}.local`,
      });
    }

    const configParam = new ssm.StringParameter(
      this,
      `${config.envName}ConfigParameter`,
      {
        parameterName: `/${config.envName}/config`,
        stringValue: config.envName,
        tier: ssm.ParameterTier.STANDARD, // Use STANDARD for LocalStack compatibility
        description: 'Environment config',
      }
    );

    // Apply removal policy for LocalStack
    if (isLocalStack) {
      configParam.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Use EC2 task definition instead of Fargate for LocalStack Community compatibility
    const taskDefinition = new ecs.Ec2TaskDefinition(
      this,
      `${config.envName}TaskDef`,
      {
        networkMode: ecs.NetworkMode.BRIDGE,
      }
    );

    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry(
        `${config.imageName}:${config.imageTag}`
      ),
      memoryLimitMiB: config.memoryLimit,
      cpu: config.cpu,
      portMappings: [
        {
          containerPort: config.port,
          hostPort: 0, // Dynamic port mapping for EC2
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        CONFIG_PARAMETER_NAME: `/${config.envName}/config`,
        ENV_NAME: config.envName,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${config.envName}-app`,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          `curl -f http://localhost:${config.port} || exit 1`,
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(10),
      },
    });

    // Grant SSM read access
    configParam.grantRead(taskDefinition.taskRole);

    // Use EC2 service instead of Fargate
    const ecsService = new ecs.Ec2Service(this, `${config.envName}Service`, {
      cluster,
      taskDefinition,
      desiredCount: 2,
      serviceName: `${config.envName}-svc`,
      // Cloud Map only if not LocalStack
      ...(isLocalStack
        ? {}
        : {
            cloudMapOptions: {
              name: 'app',
            },
          }),
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    // Apply removal policy for LocalStack
    if (isLocalStack) {
      (lb.node.defaultChild as cdk.CfnResource).applyRemovalPolicy(
        cdk.RemovalPolicy.DESTROY
      );
    }

    /** DNS Certificate - optional for LocalStack */
    let listener: elbv2.ApplicationListener;
    let certificate: acm.ICertificate | undefined;

    if (isLocalStack) {
      // Use HTTP listener for LocalStack (ACM certificates are complex in LocalStack)
      listener = lb.addListener(`${config.envName}HttpListener`, {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
      });
    } else {
      // Use HTTPS for real AWS
      const certArn = ssm.StringParameter.valueForStringParameter(
        this,
        '/app/certArn'
      );
      certificate = acm.Certificate.fromCertificateArn(
        this,
        `${config.envName}Cert`,
        certArn
      );
      listener = lb.addListener(`${config.envName}HttpsListener`, {
        port: 443,
        certificates: [certificate],
        protocol: elbv2.ApplicationProtocol.HTTPS,
      });
    }

    listener.addTargets('ECS', {
      port: 80, // Use dynamic port with ECS EC2
      targets: [ecsService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        healthyHttpCodes: '200-299',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    // Auto-scaling for ECS service
    const scalableTarget = ecsService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 5,
    });

    scalableTarget.scaleOnCpuUtilization(`${config.envName}CpuScaling`, {
      targetUtilizationPercent: 50,
    });

    scalableTarget.scaleOnMemoryUtilization(`${config.envName}MemoryScaling`, {
      targetUtilizationPercent: 60,
    });

    // --- Route 53 Record (if using Route53) - Skip for LocalStack ---
    if (config.hostedZoneName && !isLocalStack) {
      const zone =
        process.env.NODE_ENV === 'test'
          ? route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
              hostedZoneId: 'Z111111QQQQQQQ',
              zoneName: config.hostedZoneName!,
            })
          : route53.HostedZone.fromLookup(this, `${config.envName}Zone`, {
              domainName: config.hostedZoneName!,
            });

      new route53.ARecord(this, `${config.envName}AliasRecord`, {
        recordName: config.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.LoadBalancerTarget(lb)
        ),
        zone,
      });
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: zone.hostedZoneId,
        description: 'Route53 Hosted Zone ID',
      });
    }

    // CloudWatch Alarms (simplified for LocalStack)
    if (!isLocalStack) {
      new cloudwatch.Alarm(this, `${config.envName}HighCpuAlarm`, {
        metric: ecsService.metricCpuUtilization(),
        evaluationPeriods: 2,
        threshold: 80,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmName: `${config.envName}:HighCpuAlarm`,
      });

      new cloudwatch.Alarm(this, `${config.envName}HighMemoryAlarm`, {
        metric: ecsService.metricMemoryUtilization(),
        evaluationPeriods: 2,
        threshold: 80,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmName: `${config.envName}:HighMemoryAlarm`,
      });
    }

    //Output
    // --- Outputs ---
    new cdk.CfnOutput(this, 'LoadBalanceDNS', {
      value: lb.loadBalancerDnsName,
      description: 'Load balancer dns name',
    });
    new cdk.CfnOutput(this, 'envName', {
      value: config.envName,
      description: 'Environment name',
    });
    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'Application domain name',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      description: 'ECS Cluster ARN',
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: taskDefinition.taskDefinitionArn,
      description: 'Task Definition ARN',
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: ecsService.serviceName,
      description: 'ECS Service Name',
    });

    new cdk.CfnOutput(this, 'ListenerArn', {
      value: listener.listenerArn,
      description: 'Load Balancer Listener ARN',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: lb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'LoadBalancerSecurityGroupId', {
      value: lb.connections.securityGroups
        .map(sg => sg.securityGroupId)
        .join(','),
      description: 'Security Group of the ALB',
    });

    new cdk.CfnOutput(this, 'SSMConfigParameterName', {
      value: `/${config.envName}/config`,
      description: 'SSM Parameter Name',
    });

    // Only output certificate ARN if it exists (not LocalStack)
    if (certificate) {
      new cdk.CfnOutput(this, 'SSLCertificateArn', {
        value: certificate.certificateArn,
        description: 'SSL Certificate ARN',
      });
    }

    // Cloud Map Namespace output (only if not LocalStack)
    if (!isLocalStack) {
      new cdk.CfnOutput(this, 'Namespace', {
        value: `${config.envName}.local`,
        description: 'ECS Cloud Map namespace name',
      });
    }

    // Route 53 Outputs
    if (config.hostedZoneName) {
      new cdk.CfnOutput(this, 'HostedZoneName', {
        value: config.hostedZoneName,
        description: 'Route53 Hosted Zone Name',
      });

      new cdk.CfnOutput(this, 'DomainARecord', {
        value: config.domainName,
        description: 'Route53 A Record for service',
      });
    }
  }
}
