import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import {
  NetworkingModule,
  DatabaseModule,
  IAMModule,
  ComputeModule,
  LoadBalancerModule,
  DNSModule,
  VPCPeeringModule,
  EnvironmentConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

export const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE || '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Determine if we should append environment suffix (only if explicitly provided and not default)
    const shouldAppendSuffix =
      props?.environmentSuffix && props.environmentSuffix !== 'dev';

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with DynamoDB locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Environment configurations
    const environments: EnvironmentConfig[] = [
      {
        name: `dev${shouldAppendSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.0.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 7,
        awsRegion: awsRegion,
        tags: {
          Environment: 'dev',
          Project: 'fintech-app',
          CostCenter: 'development',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
      {
        name: `staging${shouldAppendSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.1.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 30,
        awsRegion: awsRegion,
        tags: {
          Environment: 'staging',
          Project: 'fintech-app',
          CostCenter: 'staging',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
      {
        name: `prod${shouldAppendSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.2.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 90,
        awsRegion: awsRegion,
        tags: {
          Environment: 'prod',
          Project: 'fintech-app',
          CostCenter: 'production',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
    ];

    // Create Route53 hosted zone for DNS records
    const hostedZone = new aws.route53Zone.Route53Zone(this, 'hosted-zone', {
      name: 'mytszone.com',
      tags: {
        Name: 'mytszone.com',
        Project: 'fintech-app',
        ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
      },
    });

    // Store networking modules for VPC peering
    const networkingModules: { [key: string]: NetworkingModule } = {};
    const databases: { [key: string]: DatabaseModule } = {};

    // Create all environments
    environments.forEach(envConfig => {
      // 1. Networking
      const networking = new NetworkingModule(
        this,
        `${envConfig.name}-networking`,
        envConfig
      );
      networkingModules[envConfig.name] = networking;

      // 2. IAM Roles
      const iam = new IAMModule(this, `${envConfig.name}-iam`, envConfig);

      // 3. Load Balancer
      const loadBalancer = new LoadBalancerModule(
        this,
        `${envConfig.name}-alb`,
        envConfig,
        networking
      );

      // 4. Database (with dependency on networking)
      const database = new DatabaseModule(
        this,
        `${envConfig.name}-database`,
        envConfig,
        networking
      );
      databases[envConfig.name] = database;

      // 5. Compute (ECS) - depends on database being ready
      const compute = new ComputeModule(
        this,
        `${envConfig.name}-compute`,
        envConfig,
        networking,
        iam,
        loadBalancer.securityGroup.id,
        database
      );

      // 6. ALB Listener
      loadBalancer.createListener(compute.targetGroup);

      // 7. DNS
      const dns = new DNSModule(
        this,
        `${envConfig.name}-dns`,
        envConfig,
        loadBalancer.alb,
        hostedZone.zoneId
      );

      // Stack dependencies - ECS depends on RDS
      // compute.service.addOverride('depends_on', [
      //   `\${${database.cluster.terraformResourceType}.${database.cluster.friendlyUniqueId}}`,
      // ]);

      // Output critical endpoints
      new TerraformOutput(this, `${envConfig.name}-vpc-id`, {
        value: networking.vpc.id,
        description: `VPC ID for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-alb-dns`, {
        value: loadBalancer.alb.dnsName,
        description: `ALB DNS name for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-alb-zone-id`, {
        value: loadBalancer.alb.zoneId,
        description: `ALB Zone ID for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-rds-endpoint`, {
        value: database.cluster.endpoint,
        description: `RDS endpoint for ${envConfig.name}`,
        sensitive: true,
      });

      new TerraformOutput(this, `${envConfig.name}-ecs-cluster`, {
        value: compute.cluster.name,
        description: `ECS cluster name for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-ecs-cluster-arn`, {
        value: compute.cluster.arn,
        description: `ECS cluster ARN for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-ecs-service-name`, {
        value: compute.service.name,
        description: `ECS service name for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-vpc-cidr`, {
        value: networking.vpc.cidrBlock,
        description: `VPC CIDR block for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-dns-record`, {
        value: dns.record.fqdn,
        description: `DNS FQDN for ${envConfig.name}`,
      });
    });

    // Setup VPC Peering between staging and prod
    const stagingEnv = `staging${shouldAppendSuffix ? `-${environmentSuffix}` : ''}`;
    const prodEnv = `prod${shouldAppendSuffix ? `-${environmentSuffix}` : ''}`;

    if (networkingModules[stagingEnv] && networkingModules[prodEnv]) {
      const vpcPeering = new VPCPeeringModule(
        this,
        'staging-prod-peering',
        networkingModules[stagingEnv].vpc,
        networkingModules[prodEnv].vpc,
        {
          name: `${stagingEnv}-to-${prodEnv}-peering`,
          tags: {
            Name: `${stagingEnv}-to-${prodEnv}-peering`,
            Project: 'fintech-app',
            Purpose: 'data-migration',
            ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
          },
        }
      );

      // Add peering routes to all route tables for both environments
      const stagingNetwork = networkingModules[stagingEnv];
      const prodNetwork = networkingModules[prodEnv];

      // Staging to Prod routes
      vpcPeering.addPeeringRoutes(
        stagingNetwork.publicRouteTable,
        prodNetwork.vpc.cidrBlock
      );
      vpcPeering.addPeeringRoutes(
        stagingNetwork.databaseRouteTable,
        prodNetwork.vpc.cidrBlock
      );
      stagingNetwork.privateRouteTables.forEach(rt => {
        vpcPeering.addPeeringRoutes(rt, prodNetwork.vpc.cidrBlock);
      });

      // Prod to Staging routes
      vpcPeering.addPeeringRoutes(
        prodNetwork.publicRouteTable,
        stagingNetwork.vpc.cidrBlock
      );
      vpcPeering.addPeeringRoutes(
        prodNetwork.databaseRouteTable,
        stagingNetwork.vpc.cidrBlock
      );
      prodNetwork.privateRouteTables.forEach(rt => {
        vpcPeering.addPeeringRoutes(rt, stagingNetwork.vpc.cidrBlock);
      });

      new TerraformOutput(this, 'vpc-peering-connection-id', {
        value: vpcPeering.peeringConnection.id,
        description: 'VPC Peering Connection ID between staging and prod',
      });
    }

    // Output Route53 Hosted Zone
    new TerraformOutput(this, 'route53-zone-id', {
      value: hostedZone.zoneId,
      description: 'Route53 hosted zone ID for mytszone.com',
    });

    new TerraformOutput(this, 'route53-name-servers', {
      value: hostedZone.nameServers,
      description: 'Route53 name servers for mytszone.com',
    });
  }
}
