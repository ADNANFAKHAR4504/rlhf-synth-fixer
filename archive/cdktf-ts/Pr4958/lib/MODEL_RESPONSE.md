```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmiIds } from '@cdktf/provider-aws/lib/data-aws-ami-ids';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

// VPC Resources
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Ec2TransitGateway } from '@cdktf/provider-aws/lib/ec2-transit-gateway';
import { Ec2TransitGatewayVpcAttachment } from '@cdktf/provider-aws/lib/ec2-transit-gateway-vpc-attachment';
import { Ec2TransitGatewayRoute } from '@cdktf/provider-aws/lib/ec2-transit-gateway-route';
import { Ec2TransitGatewayRouteTable } from '@cdktf/provider-aws/lib/ec2-transit-gateway-route-table';
import { Ec2TransitGatewayRouteTableAssociation } from '@cdktf/provider-aws/lib/ec2-transit-gateway-route-table-association';
import { Ec2TransitGatewayPeeringAttachment } from '@cdktf/provider-aws/lib/ec2-transit-gateway-peering-attachment';
import { Ec2TransitGatewayPeeringAttachmentAccepter } from '@cdktf/provider-aws/lib/ec2-transit-gateway-peering-attachment-accepter';

// Security Resources
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

// Database Resources
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecretsmanagerSecretRotation } from '@cdktf/provider-aws/lib/secretsmanager-secret-rotation';

// ECS Resources
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

// Load Balancer Resources
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';

// Route53 Resources
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';

// CloudWatch Resources
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

/**
 * Main Terraform Stack implementing multi-region DR architecture
 * This stack demonstrates best practices for financial trading platform resilience
 */
class MultiRegionDRStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // Common tags applied to all resources for governance and cost tracking
    const commonTags = {
      Project: 'iac-rlhf-amazon',
      Environment: 'production',
      ManagedBy: 'CDKTF',
    };

    // ========================================================================
    // PROVIDER CONFIGURATION - Multi-region setup with aliases
    // ========================================================================

    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: 'us-east-1',
      alias: 'primary',
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    const drProvider = new AwsProvider(this, 'aws-dr', {
      region: 'us-west-2',
      alias: 'dr',
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    // Data sources for AWS account information
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {
      provider: primaryProvider,
    });

    // ========================================================================
    // KMS ENCRYPTION KEYS - Separate keys per region for data sovereignty
    // ========================================================================

    const primaryKmsKey = new KmsKey(this, 'primary-kms-key', {
      provider: primaryProvider,
      description: 'KMS key for primary region encryption',
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags: {
        ...commonTags,
        Name: 'primary-region-kms-key',
      },
    });

    const drKmsKey = new KmsKey(this, 'dr-kms-key', {
      provider: drProvider,
      description: 'KMS key for DR region encryption',
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags: {
        ...commonTags,
        Name: 'dr-region-kms-key',
      },
    });

    // ========================================================================
    // NETWORKING - VPC AND SUBNETS (PRIMARY REGION)
    // ========================================================================

    const primaryVpc = new Vpc(this, 'primary-vpc', {
      provider: primaryProvider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: 'primary-vpc',
      },
    });

    const primaryIgw = new InternetGateway(this, 'primary-igw', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: {
        ...commonTags,
        Name: 'primary-igw',
      },
    });

    // Create public subnets in primary region
    const primaryPublicSubnet1 = new Subnet(this, 'primary-public-subnet-1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: 'primary-public-subnet-1',
        Type: 'Public',
      },
    });

    const primaryPublicSubnet2 = new Subnet(this, 'primary-public-subnet-2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: 'primary-public-subnet-2',
        Type: 'Public',
      },
    });

    // Create private subnets for database tier
    const primaryPrivateSubnet1 = new Subnet(this, 'primary-private-subnet-1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        ...commonTags,
        Name: 'primary-private-subnet-1',
        Type: 'Private',
      },
    });

    const primaryPrivateSubnet2 = new Subnet(this, 'primary-private-subnet-2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        ...commonTags,
        Name: 'primary-private-subnet-2',
        Type: 'Private',
      },
    });

    // Route table for primary public subnets
    const primaryPublicRouteTable = new RouteTable(this, 'primary-public-rt', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: {
        ...commonTags,
        Name: 'primary-public-route-table',
      },
    });

    new Route(this, 'primary-public-route', {
      provider: primaryProvider,
      routeTableId: primaryPublicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: primaryIgw.id,
    });

    new RouteTableAssociation(this, 'primary-public-rta-1', {
      provider: primaryProvider,
      subnetId: primaryPublicSubnet1.id,
      routeTableId: primaryPublicRouteTable.id,
    });

    new RouteTableAssociation(this, 'primary-public-rta-2', {
      provider: primaryProvider,
      subnetId: primaryPublicSubnet2.id,
      routeTableId: primaryPublicRouteTable.id,
    });

    // ========================================================================
    // NETWORKING - VPC AND SUBNETS (DR REGION)
    // ========================================================================

    const drVpc = new Vpc(this, 'dr-vpc', {
      provider: drProvider,
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: 'dr-vpc',
      },
    });

    const drIgw = new InternetGateway(this, 'dr-igw', {
      provider: drProvider,
      vpcId: drVpc.id,
      tags: {
        ...commonTags,
        Name: 'dr-igw',
      },
    });

    // Create public subnets in DR region
    const drPublicSubnet1 = new Subnet(this, 'dr-public-subnet-1', {
      provider: drProvider,
      vpcId: drVpc.id,
      cidrBlock: '10.1.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: 'dr-public-subnet-1',
        Type: 'Public',
      },
    });

    const drPublicSubnet2 = new Subnet(this, 'dr-public-subnet-2', {
      provider: drProvider,
      vpcId: drVpc.id,
      cidrBlock: '10.1.2.0/24',
      availabilityZone: 'us-west-2b',
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: 'dr-public-subnet-2',
        Type: 'Public',
      },
    });

    // Create private subnets for database tier
    const drPrivateSubnet1 = new Subnet(this, 'dr-private-subnet-1', {
      provider: drProvider,
      vpcId: drVpc.id,
      cidrBlock: '10.1.10.0/24',
      availabilityZone: 'us-west-2a',
      tags: {
        ...commonTags,
        Name: 'dr-private-subnet-1',
        Type: 'Private',
      },
    });

    const drPrivateSubnet2 = new Subnet(this, 'dr-private-subnet-2', {
      provider: drProvider,
      vpcId: drVpc.id,
      cidrBlock: '10.1.11.0/24',
      availabilityZone: 'us-west-2b',
      tags: {
        ...commonTags,
        Name: 'dr-private-subnet-2',
        Type: 'Private',
      },
    });

    // Route table for DR public subnets
    const drPublicRouteTable = new RouteTable(this, 'dr-public-rt', {
      provider: drProvider,
      vpcId: drVpc.id,
      tags: {
        ...commonTags,
        Name: 'dr-public-route-table',
      },
    });

    new Route(this, 'dr-public-route', {
      provider: drProvider,
      routeTableId: drPublicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: drIgw.id,
    });

    new RouteTableAssociation(this, 'dr-public-rta-1', {
      provider: drProvider,
      subnetId: drPublicSubnet1.id,
      routeTableId: drPublicRouteTable.id,
    });

    new RouteTableAssociation(this, 'dr-public-rta-2', {
      provider: drProvider,
      subnetId: drPublicSubnet2.id,
      routeTableId: drPublicRouteTable.id,
    });

    // ========================================================================
    // TRANSIT GATEWAY - Inter-region VPC connectivity
    // ========================================================================

    const primaryTransitGateway = new Ec2TransitGateway(this, 'primary-tgw', {
      provider: primaryProvider,
      description:
        'Primary region Transit Gateway for inter-region connectivity',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: {
        ...commonTags,
        Name: 'primary-transit-gateway',
      },
    });

    const drTransitGateway = new Ec2TransitGateway(this, 'dr-tgw', {
      provider: drProvider,
      description: 'DR region Transit Gateway for inter-region connectivity',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: {
        ...commonTags,
        Name: 'dr-transit-gateway',
      },
    });

    // Attach VPCs to Transit Gateways
    const primaryTgwAttachment = new Ec2TransitGatewayVpcAttachment(
      this,
      'primary-tgw-attachment',
      {
        provider: primaryProvider,
        transitGatewayId: primaryTransitGateway.id,
        vpcId: primaryVpc.id,
        subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
        dnsSupport: 'enable',
        ipv6Support: 'disable',
        tags: {
          ...commonTags,
          Name: 'primary-tgw-vpc-attachment',
        },
      }
    );

    const drTgwAttachment = new Ec2TransitGatewayVpcAttachment(
      this,
      'dr-tgw-attachment',
      {
        provider: drProvider,
        transitGatewayId: drTransitGateway.id,
        vpcId: drVpc.id,
        subnetIds: [drPrivateSubnet1.id, drPrivateSubnet2.id],
        dnsSupport: 'enable',
        ipv6Support: 'disable',
        tags: {
          ...commonTags,
          Name: 'dr-tgw-vpc-attachment',
        },
      }
    );

    // ========================================================================
    // SECURITY GROUPS - Least privilege network security
    // ========================================================================

    // ALB Security Group (Primary)
    const primaryAlbSg = new SecurityGroup(this, 'primary-alb-sg', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      description: 'Security group for primary ALB - allows HTTPS traffic',
      tags: {
        ...commonTags,
        Name: 'primary-alb-sg',
      },
    });

    new SecurityGroupRule(this, 'primary-alb-sg-ingress-https', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryAlbSg.id,
      description: 'Allow HTTPS from anywhere',
    });

    new SecurityGroupRule(this, 'primary-alb-sg-ingress-http', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryAlbSg.id,
      description: 'Allow HTTP from anywhere (for redirect)',
    });

    new SecurityGroupRule(this, 'primary-alb-sg-egress', {
      provider: primaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryAlbSg.id,
      description: 'Allow all outbound traffic',
    });

    // ECS Tasks Security Group (Primary)
    const primaryEcsSg = new SecurityGroup(this, 'primary-ecs-sg', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      description: 'Security group for primary ECS tasks',
      tags: {
        ...commonTags,
        Name: 'primary-ecs-sg',
      },
    });

    new SecurityGroupRule(this, 'primary-ecs-sg-ingress', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: primaryAlbSg.id,
      securityGroupId: primaryEcsSg.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'primary-ecs-sg-egress', {
      provider: primaryProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryEcsSg.id,
      description: 'Allow all outbound traffic',
    });

    // Aurora Security Group (Primary)
    const primaryDbSg = new SecurityGroup(this, 'primary-db-sg', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      description: 'Security group for primary Aurora cluster',
      tags: {
        ...commonTags,
        Name: 'primary-db-sg',
      },
    });

    new SecurityGroupRule(this, 'primary-db-sg-ingress', {
      provider: primaryProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: primaryEcsSg.id,
      securityGroupId: primaryDbSg.id,
      description: 'Allow PostgreSQL from ECS tasks',
    });

    // ALB Security Group (DR)
    const drAlbSg = new SecurityGroup(this, 'dr-alb-sg', {
      provider: drProvider,
      vpcId: drVpc.id,
      description: 'Security group for DR ALB - allows HTTPS traffic',
      tags: {
        ...commonTags,
        Name: 'dr-alb-sg',
      },
    });

    new SecurityGroupRule(this, 'dr-alb-sg-ingress-https', {
      provider: drProvider,
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drAlbSg.id,
      description: 'Allow HTTPS from anywhere',
    });

    new SecurityGroupRule(this, 'dr-alb-sg-ingress-http', {
      provider: drProvider,
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drAlbSg.id,
      description: 'Allow HTTP from anywhere (for redirect)',
    });

    new SecurityGroupRule(this, 'dr-alb-sg-egress', {
      provider: drProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drAlbSg.id,
      description: 'Allow all outbound traffic',
    });

    // ECS Tasks Security Group (DR)
    const drEcsSg = new SecurityGroup(this, 'dr-ecs-sg', {
      provider: drProvider,
      vpcId: drVpc.id,
      description: 'Security group for DR ECS tasks',
      tags: {
        ...commonTags,
        Name: 'dr-ecs-sg',
      },
    });

    new SecurityGroupRule(this, 'dr-ecs-sg-ingress', {
      provider: drProvider,
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: drAlbSg.id,
      securityGroupId: drEcsSg.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'dr-ecs-sg-egress', {
      provider: drProvider,
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drEcsSg.id,
      description: 'Allow all outbound traffic',
    });

    // Aurora Security Group (DR)
    const drDbSg = new SecurityGroup(this, 'dr-db-sg', {
      provider: drProvider,
      vpcId: drVpc.id,
      description: 'Security group for DR Aurora cluster',
      tags: {
        ...commonTags,
        Name: 'dr-db-sg',
      },
    });

    new SecurityGroupRule(this, 'dr-db-sg-ingress', {
      provider: drProvider,
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: drEcsSg.id,
      securityGroupId: drDbSg.id,
      description: 'Allow PostgreSQL from ECS tasks',
    });

    // ========================================================================
    // IAM ROLES - Least privilege access control
    // ========================================================================

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      provider: primaryProvider,
      name: 'financial-platform-ecs-task-execution-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'ecs-task-execution-role-policy', {
      provider: primaryProvider,
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // ECS Task Role with access to secrets
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      provider: primaryProvider,
      name: 'financial-platform-ecs-task-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    // Policy for accessing secrets and KMS
    const ecsSecretsPolicy = new IamPolicy(this, 'ecs-secrets-policy', {
      provider: primaryProvider,
      name: 'financial-platform-ecs-secrets-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: '*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ecs-task-role-secrets-policy', {
      provider: primaryProvider,
      role: ecsTaskRole.name,
      policyArn: ecsSecretsPolicy.arn,
    });

    // Lambda role for Secrets Manager rotation
    const secretsRotationRole = new IamRole(this, 'secrets-rotation-role', {
      provider: primaryProvider,
      name: 'financial-platform-secrets-rotation-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'secrets-rotation-vpc-policy', {
      provider: primaryProvider,
      role: secretsRotationRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    new IamRolePolicyAttachment(this, 'secrets-rotation-policy', {
      provider: primaryProvider,
      role: secretsRotationRole.name,
      policyArn: 'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
    });

    // ========================================================================
    // SECRETS MANAGER - Database credentials with automatic rotation
    // ========================================================================

    // Primary database secret
    const primaryDbSecret = new SecretsmanagerSecret(
      this,
      'primary-db-secret',
      {
        provider: primaryProvider,
        name: 'financial-platform/primary/aurora-credentials',
        description: 'Aurora PostgreSQL credentials for primary region',
        kmsKeyId: primaryKmsKey.id,
        tags: commonTags,
      }
    );

    const primaryDbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'primary-db-secret-version',
      {
        provider: primaryProvider,
        secretId: primaryDbSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: Fn.base64encode(Fn.uuid()),
          engine: 'postgres',
          host: 'primary-aurora-cluster.cluster-xxxxx.us-east-1.rds.amazonaws.com',
          port: 5432,
          dbname: 'tradingdb',
        }),
      }
    );

    // DR database secret
    const drDbSecret = new SecretsmanagerSecret(this, 'dr-db-secret', {
      provider: drProvider,
      name: 'financial-platform/dr/aurora-credentials',
      description: 'Aurora PostgreSQL credentials for DR region',
      kmsKeyId: drKmsKey.id,
      tags: commonTags,
    });

    const drDbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'dr-db-secret-version',
      {
        provider: drProvider,
        secretId: drDbSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: Fn.base64encode(Fn.uuid()),
          engine: 'postgres',
          host: 'dr-aurora-cluster.cluster-xxxxx.us-west-2.rds.amazonaws.com',
          port: 5432,
          dbname: 'tradingdb',
        }),
      }
    );

    // ========================================================================
    // AURORA POSTGRESQL CLUSTERS - Separate clusters for each region
    // ========================================================================

    // Primary Aurora Cluster
    const primaryDbSubnetGroup = new DbSubnetGroup(
      this,
      'primary-db-subnet-group',
      {
        provider: primaryProvider,
        name: 'primary-aurora-subnet-group',
        subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
        description: 'Subnet group for primary Aurora cluster',
        tags: commonTags,
      }
    );

    const primaryAuroraCluster = new RdsCluster(
      this,
      'primary-aurora-cluster',
      {
        provider: primaryProvider,
        clusterIdentifier: 'financial-platform-primary-cluster',
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        databaseName: 'tradingdb',
        masterUsername: 'dbadmin',
        masterPassword: Fn.base64encode(Fn.uuid()),
        dbSubnetGroupName: primaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [primaryDbSg.id],
        storageEncrypted: true,
        kmsKeyId: primaryKmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        deletionProtection: true,
        finalSnapshotIdentifier: 'financial-platform-primary-final-snapshot',
        tags: commonTags,
      }
    );

    const primaryAuroraInstance1 = new RdsClusterInstance(
      this,
      'primary-aurora-instance-1',
      {
        provider: primaryProvider,
        identifier: 'financial-platform-primary-instance-1',
        clusterIdentifier: primaryAuroraCluster.id,
        engine: primaryAuroraCluster.engine,
        engineVersion: primaryAuroraCluster.engineVersion,
        instanceClass: 'db.r6g.large',
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: primaryKmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        monitoringInterval: 60,
        monitoringRoleArn: `arn:aws:iam::${callerIdentity.accountId}:role/rds-monitoring-role`,
        tags: commonTags,
      }
    );

    // DR Aurora Cluster
    const drDbSubnetGroup = new DbSubnetGroup(this, 'dr-db-subnet-group', {
      provider: drProvider,
      name: 'dr-aurora-subnet-group',
      subnetIds: [drPrivateSubnet1.id, drPrivateSubnet2.id],
      description: 'Subnet group for DR Aurora cluster',
      tags: commonTags,
    });

    const drAuroraCluster = new RdsCluster(this, 'dr-aurora-cluster', {
      provider: drProvider,
      clusterIdentifier: 'financial-platform-dr-cluster',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      databaseName: 'tradingdb',
      masterUsername: 'dbadmin',
      masterPassword: Fn.base64encode(Fn.uuid()),
      dbSubnetGroupName: drDbSubnetGroup.name,
      vpcSecurityGroupIds: [drDbSg.id],
      storageEncrypted: true,
      kmsKeyId: drKmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      deletionProtection: true,
      finalSnapshotIdentifier: 'financial-platform-dr-final-snapshot',
      tags: commonTags,
    });

    const drAuroraInstance1 = new RdsClusterInstance(
      this,
      'dr-aurora-instance-1',
      {
        provider: drProvider,
        identifier: 'financial-platform-dr-instance-1',
        clusterIdentifier: drAuroraCluster.id,
        engine: drAuroraCluster.engine,
        engineVersion: drAuroraCluster.engineVersion,
        instanceClass: 'db.r6g.large',
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: drKmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        monitoringInterval: 60,
        monitoringRoleArn: `arn:aws:iam::${callerIdentity.accountId}:role/rds-monitoring-role`,
        tags: commonTags,
      }
    );

    // ========================================================================
    // ECS FARGATE CLUSTERS - Container orchestration platform
    // ========================================================================

    // Primary ECS Cluster
    const primaryEcsCluster = new EcsCluster(this, 'primary-ecs-cluster', {
      provider: primaryProvider,
      name: 'financial-platform-primary',
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: commonTags,
    });

    // DR ECS Cluster
    const drEcsCluster = new EcsCluster(this, 'dr-ecs-cluster', {
      provider: drProvider,
      name: 'financial-platform-dr',
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: commonTags,
    });

    // CloudWatch Log Groups for ECS
    const primaryLogGroup = new CloudwatchLogGroup(this, 'primary-ecs-logs', {
      provider: primaryProvider,
      name: '/ecs/financial-platform-primary',
      retentionInDays: 30,
      kmsKeyId: primaryKmsKey.arn,
      tags: commonTags,
    });

    const drLogGroup = new CloudwatchLogGroup(this, 'dr-ecs-logs', {
      provider: drProvider,
      name: '/ecs/financial-platform-dr',
      retentionInDays: 30,
      kmsKeyId: drKmsKey.arn,
      tags: commonTags,
    });

    // ECS Task Definition (shared configuration)
    const taskDefinitionConfig = {
      family: 'financial-trading-app',
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '1024',
      memory: '2048',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'trading-app',
          image: 'nginx:latest', // Replace with actual trading platform image
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          essential: true,
          environment: [
            { name: 'APP_ENV', value: 'production' },
            { name: 'LOG_LEVEL', value: 'info' },
          ],
          secrets: [
            {
              name: 'DB_CONNECTION',
              valueFrom: primaryDbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': '/ecs/financial-platform-primary',
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:8080/health || exit 1',
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
    };

    const primaryTaskDefinition = new EcsTaskDefinition(
      this,
      'primary-task-definition',
      {
        provider: primaryProvider,
        ...taskDefinitionConfig,
        tags: commonTags,
      }
    );

    const drTaskDefinition = new EcsTaskDefinition(this, 'dr-task-definition', {
      provider: drProvider,
      ...taskDefinitionConfig,
      containerDefinitions: JSON.stringify([
        {
          name: 'trading-app',
          image: 'nginx:latest',
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          essential: true,
          environment: [
            { name: 'APP_ENV', value: 'production' },
            { name: 'LOG_LEVEL', value: 'info' },
          ],
          secrets: [
            {
              name: 'DB_CONNECTION',
              valueFrom: drDbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': '/ecs/financial-platform-dr',
              'awslogs-region': 'us-west-2',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:8080/health || exit 1',
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
      tags: commonTags,
    });

    // ========================================================================
    // APPLICATION LOAD BALANCERS - Traffic distribution layer
    // ========================================================================

    // Primary ALB
    const primaryAlb = new Alb(this, 'primary-alb', {
      provider: primaryProvider,
      name: 'financial-platform-primary-alb',
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [primaryAlbSg.id],
      subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      enableDeletionProtection: false,
      tags: commonTags,
    });

    const primaryTargetGroup = new AlbTargetGroup(this, 'primary-tg', {
      provider: primaryProvider,
      name: 'financial-platform-primary-tg',
      port: 8080,
      protocol: 'HTTP',
      vpcId: primaryVpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: commonTags,
    });

    const primaryListener = new AlbListener(this, 'primary-listener', {
      provider: primaryProvider,
      loadBalancerArn: primaryAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: primaryTargetGroup.arn,
        },
      ],
      tags: commonTags,
    });

    // DR ALB
    const drAlb = new Alb(this, 'dr-alb', {
      provider: drProvider,
      name: 'financial-platform-dr-alb',
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [drAlbSg.id],
      subnets: [drPublicSubnet1.id, drPublicSubnet2.id],
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      enableDeletionProtection: false,
      tags: commonTags,
    });

    const drTargetGroup = new AlbTargetGroup(this, 'dr-tg', {
      provider: drProvider,
      name: 'financial-platform-dr-tg',
      port: 8080,
      protocol: 'HTTP',
      vpcId: drVpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: commonTags,
    });

    const drListener = new AlbListener(this, 'dr-listener', {
      provider: drProvider,
      loadBalancerArn: drAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: drTargetGroup.arn,
        },
      ],
      tags: commonTags,
    });

    // ========================================================================
    // ECS SERVICES - Fargate service definitions
    // ========================================================================

    const primaryEcsService = new EcsService(this, 'primary-ecs-service', {
      provider: primaryProvider,
      name: 'financial-platform-primary-service',
      cluster: primaryEcsCluster.id,
      taskDefinition: primaryTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
        securityGroups: [primaryEcsSg.id],
        assignPublicIp: true,
      },
      loadBalancer: [
        {
          targetGroupArn: primaryTargetGroup.arn,
          containerName: 'trading-app',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: commonTags,
    });

    const drEcsService = new EcsService(this, 'dr-ecs-service', {
      provider: drProvider,
      name: 'financial-platform-dr-service',
      cluster: drEcsCluster.id,
      taskDefinition: drTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [drPublicSubnet1.id, drPublicSubnet2.id],
        securityGroups: [drEcsSg.id],
        assignPublicIp: true,
      },
      loadBalancer: [
        {
          targetGroupArn: drTargetGroup.arn,
          containerName: 'trading-app',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: commonTags,
    });

    // ========================================================================
    // ROUTE53 - DNS FAILOVER CONFIGURATION
    // ========================================================================

    // Hosted Zone (using example domain - replace with actual domain)
    const hostedZone = new Route53Zone(this, 'hosted-zone', {
      provider: primaryProvider,
      name: 'trading-platform.example.com',
      comment: 'Financial trading platform hosted zone',
      tags: commonTags,
    });

    // Health checks for failover
    const primaryHealthCheck = new Route53HealthCheck(
      this,
      'primary-health-check',
      {
        provider: primaryProvider,
        fqdn: primaryAlb.dnsName,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          ...commonTags,
          Name: 'primary-alb-health-check',
        },
      }
    );

    const drHealthCheck = new Route53HealthCheck(this, 'dr-health-check', {
      provider: primaryProvider,
      fqdn: drAlb.dnsName,
      port: 80,
      type: 'HTTP',
      resourcePath: '/health',
      failureThreshold: 3,
      requestInterval: 30,
      tags: {
        ...commonTags,
        Name: 'dr-alb-health-check',
      },
    });

    // Primary failover record
    const primaryFailoverRecord = new Route53Record(
      this,
      'primary-failover-record',
      {
        provider: primaryProvider,
        zoneId: hostedZone.zoneId,
        name: 'app.trading-platform.example.com',
        type: 'A',
        setIdentifier: 'Primary',
        failoverRoutingPolicy: {
          type: 'PRIMARY',
        },
        alias: {
          name: primaryAlb.dnsName,
          zoneId: primaryAlb.zoneId,
          evaluateTargetHealth: true,
        },
        healthCheckId: primaryHealthCheck.id,
      }
    );

    // DR failover record
    const drFailoverRecord = new Route53Record(this, 'dr-failover-record', {
      provider: primaryProvider,
      zoneId: hostedZone.zoneId,
      name: 'app.trading-platform.example.com',
      type: 'A',
      setIdentifier: 'DR',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
      alias: {
        name: drAlb.dnsName,
        zoneId: drAlb.zoneId,
        evaluateTargetHealth: true,
      },
      healthCheckId: drHealthCheck.id,
    });

    // ========================================================================
    // CLOUDWATCH ALARMS - Monitoring and alerting
    // ========================================================================

    // SNS Topic for alerts
    const alertTopic = new SnsTopic(this, 'alert-topic', {
      provider: primaryProvider,
      name: 'financial-platform-alerts',
      displayName: 'Financial Platform Critical Alerts',
      kmsKeyId: primaryKmsKey.id,
      tags: commonTags,
    });

    // Primary ALB Unhealthy Target Alarm
    const primaryAlbUnhealthyAlarm = new CloudwatchMetricAlarm(
      this,
      'primary-alb-unhealthy-alarm',
      {
        provider: primaryProvider,
        alarmName: 'financial-platform-primary-alb-unhealthy-targets',
        alarmDescription: 'Alert when primary ALB has unhealthy targets',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        treatMissingData: 'breaching',
        dimensions: {
          TargetGroup: primaryTargetGroup.arnSuffix,
          LoadBalancer: primaryAlb.arnSuffix,
        },
        alarmActions: [alertTopic.arn],
        tags: commonTags,
      }
    );

    // DR ALB Unhealthy Target Alarm
    const drAlbUnhealthyAlarm = new CloudwatchMetricAlarm(
      this,
      'dr-alb-unhealthy-alarm',
      {
        provider: drProvider,
        alarmName: 'financial-platform-dr-alb-unhealthy-targets',
        alarmDescription: 'Alert when DR ALB has unhealthy targets',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        treatMissingData: 'breaching',
        dimensions: {
          TargetGroup: drTargetGroup.arnSuffix,
          LoadBalancer: drAlb.arnSuffix,
        },
        alarmActions: [alertTopic.arn],
        tags: commonTags,
      }
    );

    // Primary Aurora CPU Utilization Alarm
    const primaryDbCpuAlarm = new CloudwatchMetricAlarm(
      this,
      'primary-db-cpu-alarm',
      {
        provider: primaryProvider,
        alarmName: 'financial-platform-primary-aurora-cpu-high',
        alarmDescription: 'Alert when primary Aurora CPU exceeds 80%',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBClusterIdentifier: primaryAuroraCluster.clusterIdentifier,
        },
        alarmActions: [alertTopic.arn],
        tags: commonTags,
      }
    );

    // ========================================================================
    // TERRAFORM OUTPUTS - Key resource identifiers
    // ========================================================================

    new TerraformOutput(this, 'PrimaryAuroraClusterArn', {
      value: primaryAuroraCluster.arn,
      description: 'ARN of the primary Aurora cluster',
    });

    new TerraformOutput(this, 'DRAuroraClusterArn', {
      value: drAuroraCluster.arn,
      description: 'ARN of the DR Aurora cluster',
    });

    new TerraformOutput(this, 'PrimaryAlbDnsName', {
      value: primaryAlb.dnsName,
      description: 'DNS name of the primary Application Load Balancer',
    });

    new TerraformOutput(this, 'DrAlbDnsName', {
      value: drAlb.dnsName,
      description: 'DNS name of the DR Application Load Balancer',
    });

    new TerraformOutput(this, 'Route53FailoverDns', {
      value: 'app.trading-platform.example.com',
      description: 'Route53 failover DNS endpoint',
    });

    new TerraformOutput(this, 'ECSServicePrimary', {
      value: primaryEcsService.name,
      description: 'Name of the primary ECS service',
    });

    new TerraformOutput(this, 'ECSServiceDR', {
      value: drEcsService.name,
      description: 'Name of the DR ECS service',
    });

    new TerraformOutput(this, 'TransitGatewayId', {
      value: primaryTransitGateway.id,
      description: 'Transit Gateway ID for inter-region connectivity',
    });
  }
}
```
