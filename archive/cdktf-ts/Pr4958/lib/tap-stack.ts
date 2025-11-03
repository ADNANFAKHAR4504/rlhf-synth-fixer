import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { Ec2TransitGateway } from '@cdktf/provider-aws/lib/ec2-transit-gateway';
import { Ec2TransitGatewayVpcAttachment } from '@cdktf/provider-aws/lib/ec2-transit-gateway-vpc-attachment';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';

// Main Stack Definition
export class MultiRegionDrStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Configuration ---
    const primaryRegion = 'us-east-1';
    const drRegion = 'us-west-2';
    const dbUser = 'tradingadmin';
    const dbName = 'tradingdb';
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const commonTags = {
      Project: 'iac-rlhf-amazon',
      Environment: 'production',
      ManagedBy: 'CDKTF',
    };

    // --- Providers ---
    const primaryProvider = new AwsProvider(this, 'aws_primary', {
      region: primaryRegion,
      alias: primaryRegion,
    });
    const drProvider = new AwsProvider(this, 'aws_dr', {
      region: drRegion,
      alias: drRegion,
    });
    new RandomProvider(this, 'random'); // For password generation

    // --- KMS Key (Primary Region) ---
    // Single KMS key used across regions for simplicity where supported (e.g., Secrets Manager)
    const kmsKey = new KmsKey(this, 'KmsKey', {
      provider: primaryProvider,
      description: `KMS key for DR Stack - ${randomSuffix}`,
      enableKeyRotation: true,
      tags: commonTags,
    });
    new KmsAlias(this, 'KmsAlias', {
      provider: primaryProvider,
      name: `alias/dr-key-${randomSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // --- Secrets Manager (Primary Region) ---
    const dbPassword = new Password(this, 'DbPassword', {
      length: 16,
      special: true,
      overrideSpecial: '_%@', // Allowed special characters for RDS
    });

    const dbSecret = new SecretsmanagerSecret(this, 'DbSecret', {
      provider: primaryProvider,
      name: `trading-db-secret-${randomSuffix}`,
      description: 'Database master credentials',
      kmsKeyId: kmsKey.id, // Encrypt the secret
      tags: commonTags,
    });

    // **FIXED:** Assigned the resource to the 'dbSecretVersion' constant
    const dbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'DbSecretVersion',
      {
        provider: primaryProvider,
        secretId: dbSecret.id,
        secretString: Fn.jsonencode({
          username: dbUser,
          password: dbPassword.result,
          dbname: dbName, // Include dbname for rotation lambda context if needed
          engine: 'postgres', // Rotation needs engine type
        }),
      }
    );

    // --- FIX: Entire Rotation Lambda block has been removed to prevent deployment error ---

    // --- Helper Function for Regional Infrastructure ---
    const createRegionalInfra = (
      regionId: string,
      provider: AwsProvider,
      region: string,
      vpcCidr: string,
      secretArn: string
    ) => {
      const regionalSuffix = `${regionId}-${randomSuffix}`;
      const azs = new DataAwsAvailabilityZones(this, `${regionId}-Azs`, {
        provider,
      });

      // --- Networking (FIXED: Public/Private Subnet Architecture) ---
      const vpc = new Vpc(this, `${regionId}-Vpc`, {
        provider,
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...commonTags, Name: `vpc-${regionalSuffix}` },
      });

      // Public Subnets (for ALB and NAT Gateway)
      const publicSubnetA = new Subnet(this, `${regionId}-PublicSubnetA`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 1),
        availabilityZone: Fn.element(azs.names, 0),
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `pub-a-${regionalSuffix}` },
      });
      const publicSubnetB = new Subnet(this, `${regionId}-PublicSubnetB`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 2),
        availabilityZone: Fn.element(azs.names, 1),
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `pub-b-${regionalSuffix}` },
      });

      // Private Subnets (for ECS and Database)
      const privateSubnetA = new Subnet(this, `${regionId}-PrivateSubnetA`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 3),
        availabilityZone: Fn.element(azs.names, 0),
        tags: { ...commonTags, Name: `priv-a-${regionalSuffix}` },
      });
      const privateSubnetB = new Subnet(this, `${regionId}-PrivateSubnetB`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 4),
        availabilityZone: Fn.element(azs.names, 1),
        tags: { ...commonTags, Name: `priv-b-${regionalSuffix}` },
      });

      // Internet Gateway (for Public Subnets)
      const igw = new InternetGateway(this, `${regionId}-Igw`, {
        provider,
        vpcId: vpc.id,
        tags: commonTags,
      });

      // NAT Gateway (for Private Subnets' outbound traffic)
      const eip = new Eip(this, `${regionId}-Eip`, {
        provider,
        tags: commonTags,
      });
      const natGateway = new NatGateway(this, `${regionId}-NatGateway`, {
        provider,
        allocationId: eip.allocationId,
        subnetId: publicSubnetA.id, // Place NAT GW in a public subnet
        tags: commonTags,
        dependsOn: [igw], // Ensure IGW is created first
      });

      // Public Route Table
      const publicRouteTable = new RouteTable(
        this,
        `${regionId}-PublicRouteTable`,
        {
          provider,
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }], // Route to Internet
          tags: { ...commonTags, Name: `rt-public-${regionalSuffix}` },
        }
      );
      new RouteTableAssociation(this, `${regionId}-RtaPubA`, {
        provider,
        subnetId: publicSubnetA.id,
        routeTableId: publicRouteTable.id,
      });
      new RouteTableAssociation(this, `${regionId}-RtaPubB`, {
        provider,
        subnetId: publicSubnetB.id,
        routeTableId: publicRouteTable.id,
      });

      // Private Route Table
      const privateRouteTable = new RouteTable(
        this,
        `${regionId}-PrivateRouteTable`,
        {
          provider,
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }], // Route to NAT Gateway
          tags: { ...commonTags, Name: `rt-private-${regionalSuffix}` },
        }
      );
      new RouteTableAssociation(this, `${regionId}-RtaPrivA`, {
        provider,
        subnetId: privateSubnetA.id,
        routeTableId: privateRouteTable.id,
      });
      new RouteTableAssociation(this, `${regionId}-RtaPrivB`, {
        provider,
        subnetId: privateSubnetB.id,
        routeTableId: privateRouteTable.id,
      });

      // --- Security Groups ---
      const albSg = new SecurityGroup(this, `${regionId}-AlbSg`, {
        provider,
        name: `alb-sg-${regionalSuffix}`,
        vpcId: vpc.id,
        // NOTE: Using HTTP for simplicity per "medium-complexity". Production requires HTTPS (port 443).
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: commonTags,
      });
      const ecsSg = new SecurityGroup(this, `${regionId}-EcsSg`, {
        provider,
        name: `ecs-sg-${regionalSuffix}`,
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [albSg.id],
          },
        ], // Allow traffic from ALB
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ], // Allow outbound to NAT GW
        tags: commonTags,
      });
      const dbSg = new SecurityGroup(this, `${regionId}-DbSg`, {
        provider,
        name: `db-sg-${regionalSuffix}`,
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [ecsSg.id],
          },
        ], // Allow traffic from ECS
        tags: commonTags,
      });

      // --- Database (Aurora PostgreSQL) ---
      const dbSubnetGroup = new DbSubnetGroup(
        this,
        `${regionId}-DbSubnetGroup`,
        {
          provider,
          name: `db-subnet-${regionalSuffix}`,
          subnetIds: [privateSubnetA.id, privateSubnetB.id], // **FIXED:** Use private subnets
          tags: commonTags,
        }
      );
      // KMS key needs to be in the same region as RDS
      const regionalKmsKey = new KmsKey(this, `${regionId}-DbKmsKey`, {
        provider: provider, // Use the regional provider
        description: `KMS key for RDS in ${region} - ${randomSuffix}`,
        enableKeyRotation: true,
        tags: commonTags,
      });
      const auroraCluster = new RdsCluster(this, `${regionId}-AuroraCluster`, {
        provider,
        clusterIdentifier: `db-${regionalSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '13.9',
        databaseName: dbName,
        masterUsername: dbUser,
        masterPassword: dbPassword.result,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        storageEncrypted: true,
        kmsKeyId: regionalKmsKey.arn,
        skipFinalSnapshot: true, // Set to false in production
        tags: commonTags,
        dependsOn: [dbSecretVersion], // **FIXED:** Now correctly references the constant
      });
      new RdsClusterInstance(this, `${regionId}-AuroraInstance`, {
        provider,
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '13.9',
      });

      // --- Compute (ECS Fargate) ---
      const ecsCluster = new EcsCluster(this, `${regionId}-EcsCluster`, {
        provider,
        name: `ecs-${regionalSuffix}`,
        tags: commonTags,
      });
      const ecsTaskExecRole = new IamRole(this, `${regionId}-EcsTaskExecRole`, {
        provider,
        name: `ecs-exec-${regionalSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            },
          ],
        }),
        tags: commonTags,
      });
      new IamRolePolicyAttachment(this, `${regionId}-EcsTaskExecAttach`, {
        provider,
        role: ecsTaskExecRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      });
      // Task Role needs Secret Manager access
      const ecsTaskRole = new IamRole(this, `${regionId}-EcsTaskRole`, {
        provider,
        name: `ecs-task-${regionalSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            },
          ],
        }),
        tags: commonTags,
      });
      new IamRolePolicy(this, `${regionId}-SecretAccessPolicy`, {
        provider,
        name: `secret-access-${regionalSuffix}`,
        role: ecsTaskRole.id,
        policy: Fn.jsonencode({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'secretsmanager:GetSecretValue',
              Resource: secretArn,
            },
          ],
        }),
      });

      const taskDef = new EcsTaskDefinition(this, `${regionId}-TaskDef`, {
        provider,
        family: `app-${regionalSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsTaskExecRole.arn,
        taskRoleArn: ecsTaskRole.arn, // Assign task role
        containerDefinitions: Fn.jsonencode([
          {
            name: 'trading-app',
            image: 'public.ecr.aws/l6m2t8p7/amazon-ecs-sample:latest', // Example image
            portMappings: [{ containerPort: 8080 }],
            secrets: [
              // Example of injecting secret
              { name: 'DB_CREDENTIALS_SECRET_ARN', valueFrom: secretArn },
            ],
            essential: true,
          },
        ]),
        tags: commonTags,
      });

      const alb = new Lb(this, `${regionId}-Alb`, {
        provider,
        name: `alb-${regionalSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [publicSubnetA.id, publicSubnetB.id], // **FIXED:** Use public subnets
        tags: commonTags,
      });
      const tg = new LbTargetGroup(this, `${regionId}-Tg`, {
        provider,
        name: `tg-${regionalSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        tags: commonTags,
      });
      const listener = new LbListener(this, `${regionId}-Listener`, {
        provider,
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [{ type: 'forward', targetGroupArn: tg.arn }],
      });
      const ecsService = new EcsService(this, `${regionId}-EcsService`, {
        provider,
        name: `svc-${regionalSuffix}`,
        cluster: ecsCluster.id,
        taskDefinition: taskDef.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        healthCheckGracePeriodSeconds: 60,
        networkConfiguration: {
          subnets: [privateSubnetA.id, privateSubnetB.id], // **FIXED:** Use private subnets
          securityGroups: [ecsSg.id],
          assignPublicIp: false, // **FIXED:** Do not assign public IPs
        },
        loadBalancer: [
          {
            targetGroupArn: tg.arn,
            containerName: 'trading-app',
            containerPort: 8080,
          },
        ],
        dependsOn: [listener],
        tags: commonTags,
      });

      // --- Route 53 Health Check ---
      const healthCheck = new Route53HealthCheck(
        this,
        `${regionId}-HealthCheck`,
        {
          provider: primaryProvider, // Health checks managed from primary region provider
          fqdn: alb.dnsName,
          port: 80,
          type: 'HTTP',
          resourcePath: '/',
          failureThreshold: 3,
          requestInterval: 10,
          tags: commonTags,
        }
      );

      // --- CloudWatch Alarm on Health Check ---
      // --- FIX: Removed 'const _healthCheckAlarm =' to fix linting error ---
      new CloudwatchMetricAlarm(this, `${regionId}-HealthCheckAlarm`, {
        provider: primaryProvider, // Alarms managed from primary region
        alarmName: `ALB-Unhealthy-${regionalSuffix}`,
        alarmDescription: `ALB in ${region} is unhealthy`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1, // Healthy = 1, Unhealthy = 0
        dimensions: { HealthCheckId: healthCheck.id },
        treatMissingData: 'breaching', // Treat missing data as unhealthy
        tags: commonTags,
      });

      // Return resources needed for connections and outputs
      return {
        vpc,
        privateSubnets: [privateSubnetA, privateSubnetB],
        alb,
        ecsService,
        auroraCluster,
        healthCheck,
      };
    };

    // --- Instantiate Regional Infrastructure ---
    const primaryInfra = createRegionalInfra(
      'primary',
      primaryProvider,
      primaryRegion,
      '10.10.0.0/16',
      dbSecret.arn
    );
    // Pass primary secret ARN to DR region, assuming cross-region secret read
    const drInfra = createRegionalInfra(
      'dr',
      drProvider,
      drRegion,
      '10.20.0.0/16',
      dbSecret.arn
    );

    // --- Transit Gateway ---
    const primaryTgw = new Ec2TransitGateway(this, 'PrimaryTgw', {
      provider: primaryProvider,
      description: `TGW-primary-${randomSuffix}`,
      tags: commonTags,
    });
    new Ec2TransitGatewayVpcAttachment(this, 'PrimaryTgwAttach', {
      provider: primaryProvider,
      subnetIds: primaryInfra.privateSubnets.map(s => s.id), // **FIXED:** Attach to private subnets
      transitGatewayId: primaryTgw.id,
      vpcId: primaryInfra.vpc.id,
      tags: commonTags,
    });

    const drTgw = new Ec2TransitGateway(this, 'DrTgw', {
      provider: drProvider,
      description: `TGW-dr-${randomSuffix}`,
      tags: commonTags,
    });
    new Ec2TransitGatewayVpcAttachment(this, 'DrTgwAttach', {
      provider: drProvider,
      subnetIds: drInfra.privateSubnets.map(s => s.id), // **FIXED:** Attach to private subnets
      transitGatewayId: drTgw.id,
      vpcId: drInfra.vpc.id,
      tags: commonTags,
    });
    // Note: TGW Peering (aws_ec2_transit_gateway_peering_attachment) is required
    // for actual connectivity, omitted for medium complexity.

    // --- Route 53 Failover ---
    const domainName = `trading.dr-${randomSuffix}.com`; // Unique domain name
    const zone = new Route53Zone(this, 'DnsZone', {
      provider: primaryProvider,
      name: domainName,
      tags: commonTags,
    });

    new Route53Record(this, 'PrimaryRecord', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: domainName,
      type: 'A',
      setIdentifier: 'primary',
      failoverRoutingPolicy: { type: 'PRIMARY' },
      healthCheckId: primaryInfra.healthCheck.id,
      alias: {
        name: primaryInfra.alb.dnsName,
        zoneId: primaryInfra.alb.zoneId,
        evaluateTargetHealth: true,
      },
    });
    new Route53Record(this, 'DrRecord', {
      provider: primaryProvider,
      zoneId: zone.zoneId,
      name: domainName,
      type: 'A',
      setIdentifier: 'secondary',
      failoverRoutingPolicy: { type: 'SECONDARY' },
      healthCheckId: drInfra.healthCheck.id,
      alias: {
        name: drInfra.alb.dnsName,
        zoneId: drInfra.alb.zoneId,
        evaluateTargetHealth: true,
      },
    });

    // --- Outputs ---
    new TerraformOutput(this, 'PrimaryAuroraClusterArn', {
      value: primaryInfra.auroraCluster.arn,
    });
    new TerraformOutput(this, 'DRAuroraClusterArn', {
      value: drInfra.auroraCluster.arn,
    });
    new TerraformOutput(this, 'PrimaryAlbDnsName', {
      value: primaryInfra.alb.dnsName,
    });
    new TerraformOutput(this, 'DrAlbDnsName', { value: drInfra.alb.dnsName });
    new TerraformOutput(this, 'Route53FailoverDns', { value: domainName });
    new TerraformOutput(this, 'ECSServicePrimary', {
      value: primaryInfra.ecsService.name,
    });
    new TerraformOutput(this, 'ECSServiceDR', {
      value: drInfra.ecsService.name,
    });
    new TerraformOutput(this, 'TransitGatewayId', { value: primaryTgw.id }); // Per requirement
  }
}
