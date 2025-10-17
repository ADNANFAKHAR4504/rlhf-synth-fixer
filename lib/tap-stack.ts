import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import {
  NetworkingModule,
  DatabaseModule,
  ContainerServiceModule,
  StaticAssetsModule,
  MonitoringModule,
  NetworkingModuleConfig,
  DatabaseModuleConfig,
  ContainerServiceModuleConfig,
  StaticAssetsModuleConfig,
  MonitoringModuleConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // Application-specific configuration
  projectName?: string;
  containerImage?: string;
  containerPort?: number;
  certificateArn?: string;
  domainName?: string;
  hostedZoneId?: string;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Configuration with defaults
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const projectName = props?.projectName || 'myapp';
    const containerImage = props?.containerImage || 'nginx:latest';
    const containerPort = props?.containerPort || 3000;

    // Set environment-specific configurations
    const isProduction =
      environmentSuffix === 'production' || environmentSuffix === 'prod';

    const defaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [
          {
            tags: {
              Environment: environmentSuffix,
              Project: projectName,
              ManagedBy: 'Terraform',
              Stack: id,
            },
          },
        ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, 'random');

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

    // ==========================================
    // Module Instantiation with proper dependencies
    // ==========================================

    // 1. Networking Module - Foundation for all other resources
    const networkingConfig: NetworkingModuleConfig = {
      vpcCidr: '10.0.0.0/16',
      environment: environmentSuffix,
      projectName: projectName,
    };

    const networking = new NetworkingModule(
      this,
      'networking',
      networkingConfig
    );

    // 2. Database Module - Depends on networking
    const databaseConfig: DatabaseModuleConfig = {
      vpc: networking.vpc,
      dbSubnetGroup: networking.dbSubnetGroup,
      environment: environmentSuffix,
      projectName: projectName,
      instanceClass: isProduction ? 'db.r6g.large' : 'db.t3.micro',
      allocatedStorage: isProduction ? 100 : 20,
      databaseName: `${projectName.replace(/-/g, '_')}_db`,
    };

    const database = new DatabaseModule(this, 'database', databaseConfig);

    // 3. Container Service Module - Depends on networking and database
    const containerServiceConfig: ContainerServiceModuleConfig = {
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      publicSubnets: networking.publicSubnets,
      dbSecurityGroup: database.securityGroup,
      dbSecret: database.secretsManager,
      environment: environmentSuffix,
      projectName: projectName,
      containerImage: containerImage,
      containerPort: containerPort,
      cpu: isProduction ? 1024 : 256,
      memory: isProduction ? 2048 : 512,
      desiredCount: isProduction ? 2 : 1,
      minCapacity: isProduction ? 2 : 1,
      maxCapacity: isProduction ? 10 : 3,
      certificateArn: props?.certificateArn,
      domainName: props?.domainName,
      hostedZoneId: props?.hostedZoneId,
    };

    const containerService = new ContainerServiceModule(
      this,
      'container-service',
      containerServiceConfig
    );

    // 4. Static Assets Module - Independent
    const staticAssetsConfig: StaticAssetsModuleConfig = {
      environment: environmentSuffix,
      projectName: projectName,
    };

    const staticAssets = new StaticAssetsModule(
      this,
      'static-assets',
      staticAssetsConfig
    );

    // 5. Monitoring Module - Depends on container service and database
    const monitoringConfig: MonitoringModuleConfig = {
      environment: environmentSuffix,
      projectName: projectName,
      albArn: containerService.alb.arn,
      targetGroupArn: containerService.targetGroup.arn,
      clusterName: containerService.cluster.name,
      serviceName: containerService.service.name,
      rdsIdentifier: database.rdsInstance.identifier,
    };

    const monitoring = new MonitoringModule(
      this,
      'monitoring',
      monitoringConfig
    );

    // Networking Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: networking.vpc.cidrBlock,
      description: 'VPC CIDR Block',
    });

    // Database Outputs
    new TerraformOutput(this, 'rds-endpoint', {
      value: database.rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: database.secretsManager.arn,
      description: 'ARN of the database credentials secret',
    });

    // Container Service Outputs
    new TerraformOutput(this, 'alb-dns-name', {
      value: containerService.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-url', {
      value: `http://${containerService.alb.dnsName}`,
      description: 'Application URL',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: containerService.cluster.name,
      description: 'ECS Cluster name',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: containerService.service.name,
      description: 'ECS Service name',
    });

    new TerraformOutput(this, 'task-definition-arn', {
      value: containerService.taskDefinition.arn,
      description: 'ECS Task Definition ARN',
    });

    // Static Assets Outputs
    new TerraformOutput(this, 'static-assets-bucket', {
      value: staticAssets.bucket.id,
      description: 'Static assets S3 bucket name',
    });

    new TerraformOutput(this, 'static-assets-bucket-arn', {
      value: staticAssets.bucket.arn,
      description: 'Static assets S3 bucket ARN',
    });

    // Monitoring Outputs
    new TerraformOutput(this, 'dashboard-url', {
      value: `https://${awsRegion}.console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new TerraformOutput(this, 'alarm-count', {
      value: monitoring.alarms.length.toString(),
      description: 'Number of CloudWatch alarms configured',
    });

    // Log Group Output
    new TerraformOutput(this, 'log-group-name', {
      value: containerService.logGroup.name,
      description: 'CloudWatch Log Group name for ECS tasks',
    });
  }
}
