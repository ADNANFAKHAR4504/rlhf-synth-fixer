// ecs-microservices-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as appmesh from 'aws-cdk-lib/aws-appmesh';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { SERVICES } from '../config/service-config';
import { AppMeshServiceConstruct } from '../constructs/app-mesh-service';
import { MicroserviceConstruct } from '../constructs/microservice';

export interface EcsMicroservicesStackProps extends cdk.StackProps {
  isLocalStack?: boolean;
  environmentSuffix?: string;
}

export class EcsMicroservicesStack extends cdk.Stack {
  public readonly albDnsName: string;
  public readonly clusterName: string;
  public readonly meshName?: string;
  private vpc: ec2.Vpc;
  private cluster: ecs.Cluster;
  private alb: elbv2.ApplicationLoadBalancer;
  private mesh: appmesh.Mesh;
  private secrets: { [key: string]: secretsmanager.Secret };
  private httpListener!: elbv2.ApplicationListener;
  private isLocalStack: boolean;
  private isCiCd: boolean;
  private environmentSuffix: string;

  constructor(
    scope: Construct,
    id: string,
    props?: EcsMicroservicesStackProps
  ) {
    super(scope, id, props);
    this.isLocalStack = props?.isLocalStack ?? false;
    this.environmentSuffix = props?.environmentSuffix || 'dev';

    // Detect simplified mode for resource-constrained environments
    this.isCiCd =
      process.env.CI === 'true' ||
      process.env.CI === '1' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.USE_SIMPLIFIED_MODE === 'true' ||
      process.env.CDK_DEFAULT_ACCOUNT === '123456789012' ||
      Boolean(process.env.CDK_DEFAULT_ACCOUNT?.startsWith('123456789012'));

    this.createVpc();
    this.createEcsCluster();
    this.createSecrets();
    this.createAppMesh();
    this.createLoadBalancer();
    this.deployMicroservices();

    // Initialize readonly properties with the actual values
    this.albDnsName = this.alb.loadBalancerDnsName;
    this.clusterName = this.cluster.clusterName;
    this.meshName = this.mesh?.meshName;
  }

  private createVpc(): void {
    const vpcName =
      this.node.tryGetContext('vpcName') ||
      process.env.VPC_NAME ||
      `microservices-vpc-${this.stackName}`;

    // Use more conservative defaults for CI/CD to avoid resource limits
    const defaultMaxAzs = this.isCiCd ? '2' : '3';
    const defaultNatGateways = this.isCiCd ? '1' : '3';

    const maxAzs = parseInt(
      this.node.tryGetContext('maxAzs') ||
        process.env.VPC_MAX_AZS ||
        defaultMaxAzs,
      10
    );
    const natGateways = parseInt(
      this.node.tryGetContext('natGateways') ||
        process.env.VPC_NAT_GATEWAYS ||
        defaultNatGateways,
      10
    );
    const vpcCidr =
      this.node.tryGetContext('vpcCidr') ||
      process.env.VPC_CIDR ||
      '10.0.0.0/16';
    const cidrMask = parseInt(
      this.node.tryGetContext('cidrMask') || process.env.VPC_CIDR_MASK || '24',
      10
    );

    this.vpc = new ec2.Vpc(this, 'MicroservicesVpc', {
      vpcName,
      maxAzs,
      natGateways,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const logRetentionKey =
      this.node.tryGetContext('logRetentionDays') ||
      process.env.LOG_RETENTION_DAYS ||
      'ONE_MONTH';
    const retentionDays =
      logs.RetentionDays[logRetentionKey as keyof typeof logs.RetentionDays] ||
      logs.RetentionDays.ONE_MONTH;

    new logs.LogGroup(this, 'VpcFlowLogs', {
      logGroupName:
        process.env.VPC_FLOW_LOG_GROUP_NAME ||
        `/aws/vpc/flowlogs/${this.stackName}`,
      retention: retentionDays,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.vpc.addFlowLog('FlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });
  }

  private createEcsCluster(): void {
    const clusterName =
      this.node.tryGetContext('clusterName') ||
      process.env.ECS_CLUSTER_NAME ||
      `microservices-cluster-${this.stackName}`;
    const enableContainerInsights =
      this.node.tryGetContext('enableContainerInsights') !== false &&
      process.env.ECS_ENABLE_CONTAINER_INSIGHTS !== 'false';

    // For CI/CD environments, don't enable FARGATE capacity providers to avoid cleanup issues
    const isCiCd =
      process.env.CI === 'true' ||
      process.env.CDK_DEFAULT_ACCOUNT === '123456789012';
    const enableFargateCapacityProviders = !isCiCd;

    this.cluster = new ecs.Cluster(this, 'MicroservicesCluster', {
      clusterName,
      vpc: this.vpc,
      containerInsights: enableContainerInsights,
      enableFargateCapacityProviders,
    });

    if (enableFargateCapacityProviders) {
      this.cluster.enableFargateCapacityProviders();
    }
  }

  private createSecrets(): void {
    const secretPrefix =
      process.env.SECRET_PREFIX || `/microservices-${this.environmentSuffix}`;
    const dbHost = process.env.DATABASE_HOST || 'database.example.com';
    const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10);
    const dbName = process.env.DATABASE_NAME || 'microservices';
    const dbEngine = process.env.DATABASE_ENGINE || 'postgres';
    const apiKeyLength = parseInt(process.env.API_KEY_LENGTH || '32', 10);

    this.secrets = {
      databaseUrl: new secretsmanager.Secret(this, 'DatabaseUrl', {
        secretName:
          process.env.DATABASE_SECRET_NAME || `${secretPrefix}/database-url`,
        description: 'Database connection URL',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            engine: dbEngine,
            host: dbHost,
            port: dbPort,
            database: dbName,
          }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      }),
      apiKey: new secretsmanager.Secret(this, 'ApiKey', {
        secretName:
          process.env.API_KEY_SECRET_NAME || `${secretPrefix}/api-key`,
        description: 'External API Key',
        generateSecretString: {
          passwordLength: apiKeyLength,
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      }),
    };
  }

  private createAppMesh(): void {
    // Skip App Mesh creation in CI/CD mode (no Envoy sidecars)
    if (this.isCiCd) {
      console.log('Skipping App Mesh creation in CI/CD mode');
      return;
    }

    const meshName =
      this.node.tryGetContext('meshName') ||
      process.env.APP_MESH_NAME ||
      `microservices-mesh-${this.stackName}`;
    const egressFilter =
      process.env.APP_MESH_EGRESS_FILTER === 'DROP_ALL'
        ? appmesh.MeshFilterType.DROP_ALL
        : appmesh.MeshFilterType.ALLOW_ALL;

    this.mesh = new appmesh.Mesh(this, 'MicroservicesMesh', {
      meshName,
      egressFilter,
    });
  }

  private createLoadBalancer(): void {
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ALB',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    const albName =
      this.node.tryGetContext('albName') ||
      process.env.ALB_NAME ||
      `ms-alb-${this.stackName}`.substring(0, 32);
    const enableHttp2 = process.env.ALB_ENABLE_HTTP2 !== 'false';
    const idleTimeout = parseInt(process.env.ALB_IDLE_TIMEOUT || '60', 10);
    const enableDeletionProtection =
      process.env.ALB_DELETION_PROTECTION === 'true';

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'MicroservicesAlb', {
      loadBalancerName: albName,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      deletionProtection: enableDeletionProtection,
      http2Enabled: enableHttp2,
      idleTimeout: cdk.Duration.seconds(idleTimeout),
    });

    const enableLogBucket =
      !this.isLocalStack && process.env.ALB_ENABLE_ACCESS_LOGS !== 'false';
    if (enableLogBucket) {
      const logBucketName =
        process.env.ALB_LOGS_BUCKET_NAME ||
        `alb-logs-${this.account}-${this.region}-${this.stackName}`;
      const logRetentionDays = parseInt(
        process.env.ALB_LOG_RETENTION_DAYS || '90',
        10
      );

      const albLogsBucket = new s3.Bucket(this, 'AlbLogsBucket', {
        bucketName: logBucketName,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [{ expiration: cdk.Duration.days(logRetentionDays) }],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      this.alb.logAccessLogs(albLogsBucket);
    }

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Service not found',
      }),
    });

    this.httpListener = httpListener;
  }

  private deployMicroservices(): void {
    const deployedServices: { [key: string]: MicroserviceConstruct } = {};

    const servicesToDeploy = SERVICES.filter(
      service =>
        !service.optional ||
        (service.optional &&
          this.node.tryGetContext('includeOptional') === 'true')
    );

    const serviceSecurityGroups: { [key: string]: ec2.SecurityGroup } = {};

    servicesToDeploy.forEach(serviceConfig => {
      const sg = new ec2.SecurityGroup(
        this,
        `${serviceConfig.name}SecurityGroup`,
        {
          vpc: this.vpc,
          description: `Security group for ${serviceConfig.name}`,
          allowAllOutbound: false,
        }
      );

      sg.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'Allow HTTPS outbound'
      );
      sg.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'Allow HTTP outbound'
      );
      sg.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(9901),
        'App Mesh Envoy admin'
      );
      sg.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(15000),
        'App Mesh Envoy'
      );
      sg.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(15001),
        'App Mesh Envoy'
      );

      serviceSecurityGroups[serviceConfig.name] = sg;
    });

    if (
      serviceSecurityGroups['payment-api'] &&
      serviceSecurityGroups['fraud-detector']
    ) {
      serviceSecurityGroups['payment-api'].connections.allowTo(
        serviceSecurityGroups['fraud-detector'],
        ec2.Port.tcp(8081),
        'Payment API to Fraud Detector'
      );

      serviceSecurityGroups['fraud-detector'].connections.allowTo(
        serviceSecurityGroups['payment-api'],
        ec2.Port.tcp(8080),
        'Fraud Detector to Payment API'
      );
    }

    if (serviceSecurityGroups['transaction-api']) {
      if (serviceSecurityGroups['payment-api']) {
        serviceSecurityGroups['transaction-api'].connections.allowTo(
          serviceSecurityGroups['payment-api'],
          ec2.Port.tcp(8080),
          'Transaction API to Payment API'
        );
      }

      if (serviceSecurityGroups['fraud-detector']) {
        serviceSecurityGroups['transaction-api'].connections.allowTo(
          serviceSecurityGroups['fraud-detector'],
          ec2.Port.tcp(8081),
          'Transaction API to Fraud Detector'
        );
      }
    }

    const albSg = this.alb.connections.securityGroups[0];
    servicesToDeploy.forEach(serviceConfig => {
      albSg.connections.allowTo(
        serviceSecurityGroups[serviceConfig.name],
        ec2.Port.tcp(serviceConfig.port),
        `ALB to ${serviceConfig.name}`
      );
    });

    servicesToDeploy.forEach(serviceConfig => {
      const repository = new ecr.Repository(
        this,
        `${serviceConfig.name}Repository`,
        {
          repositoryName: `${serviceConfig.name}-${this.environmentSuffix}`,
          imageScanOnPush: true,
          imageTagMutability: ecr.TagMutability.MUTABLE,
          lifecycleRules: [
            {
              maxImageCount: parseInt(
                process.env.ECR_MAX_IMAGE_COUNT || '10',
                10
              ),
              rulePriority: 1,
              description: `Keep only ${process.env.ECR_MAX_IMAGE_COUNT || '10'} images`,
            },
          ],
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteImages: true,
        }
      );

      // Create App Mesh service only if App Mesh is enabled
      const appMeshService = this.isCiCd
        ? null
        : new AppMeshServiceConstruct(this, `${serviceConfig.name}AppMesh`, {
            mesh: this.mesh!,
            serviceName: serviceConfig.name,
            port: serviceConfig.port,
            healthCheckPath: serviceConfig.healthCheckPath,
          });

      const service = new MicroserviceConstruct(
        this,
        `${serviceConfig.name}Service`,
        {
          cluster: this.cluster,
          vpc: this.vpc,
          serviceName: serviceConfig.name,
          repository,
          image: serviceConfig.image,
          cpu: serviceConfig.cpu,
          memory: serviceConfig.memory,
          port: serviceConfig.port,
          desiredCount: parseInt(process.env.ECS_DESIRED_COUNT || '2', 10),
          secrets: this.secrets,
          securityGroup: serviceSecurityGroups[serviceConfig.name],
          virtualNode: appMeshService?.virtualNode || undefined,
          environment: serviceConfig.environment || {},
          healthCheckPath: serviceConfig.healthCheckPath,
        }
      );

      deployedServices[serviceConfig.name] = service;

      const targetGroup = new elbv2.ApplicationTargetGroup(
        this,
        `${serviceConfig.name}TargetGroup`,
        {
          targetGroupName:
            `${serviceConfig.name}-tg-${this.environmentSuffix}`.substring(
              0,
              32
            ),
          vpc: this.vpc,
          port: this.isCiCd ? 80 : serviceConfig.port, // Use port 80 for nginx in CI/CD
          protocol: elbv2.ApplicationProtocol.HTTP,
          targetType: elbv2.TargetType.IP,
          healthCheck: {
            enabled: true,
            path: this.isCiCd ? '/' : serviceConfig.healthCheckPath, // Use root path for nginx
            protocol: elbv2.Protocol.HTTP,
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(10),
            unhealthyThresholdCount: 3,
            healthyThresholdCount: 2,
          },
          deregistrationDelay: cdk.Duration.seconds(30),
        }
      );

      service.service.attachToApplicationTargetGroup(targetGroup);

      this.httpListener.addTargetGroups(`${serviceConfig.name}Route`, {
        targetGroups: [targetGroup],
        priority: serviceConfig.priority,
        conditions: [
          elbv2.ListenerCondition.pathPatterns([
            `${serviceConfig.path}/*`,
            serviceConfig.path,
          ]),
        ],
      });
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    // Only output mesh name if mesh was created
    if (this.mesh) {
      new cdk.CfnOutput(this, 'MeshName', {
        value: this.mesh.meshName,
        description: 'App Mesh Name',
      });
    }
  }
}
