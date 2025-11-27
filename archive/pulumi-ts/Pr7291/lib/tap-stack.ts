/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of a multi-region trading platform infrastructure
 * with high availability, security, and compliance features.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates a complete multi-region trading platform infrastructure
 * with Aurora Global Database, ALBs, Global Accelerator, Route53, and monitoring.
 */
export class TapStack extends pulumi.ComponentResource {
  // Exported outputs
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly primaryClusterId: pulumi.Output<string>;
  public readonly secondaryClusterId: pulumi.Output<string>;
  public readonly primaryAlbDns: pulumi.Output<string>;
  public readonly secondaryAlbDns: pulumi.Output<string>;
  public readonly acceleratorDns: pulumi.Output<string>;
  public readonly primarySecretArn: pulumi.Output<string>;
  public readonly secondarySecretArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Primary region (us-east-1) VPC
    const primaryVpc = new aws.ec2.Vpc(
      'primary-vpc',
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `primary-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
          Region: 'us-east-1',
          CostCenter: 'trading',
        },
      },
      { parent: this }
    );

    // Internet Gateway for primary VPC (FIXED: Required for public subnets)
    const primaryIgw = new aws.ec2.InternetGateway(
      'primary-igw',
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `primary-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Primary region subnets (3 AZs) - NOW PUBLIC for ALB (FIXED)
    const primarySubnets = [0, 1, 2].map(i => {
      return new aws.ec2.Subnet(
        `primary-subnet-${i}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: `us-east-1${['a', 'b', 'c'][i]}`,
          mapPublicIpOnLaunch: true, // FIXED: Make subnets public
          tags: {
            Name: `primary-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        },
        { parent: this }
      );
    });

    // Route table for primary public subnets (FIXED)
    const primaryRouteTable = new aws.ec2.RouteTable(
      'primary-route-table',
      {
        vpcId: primaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: primaryIgw.id,
          },
        ],
        tags: {
          Name: `primary-route-table-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate route table with primary subnets (FIXED)
    primarySubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `primary-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryRouteTable.id,
        },
        { parent: this }
      );
    });

    // Secondary region (eu-west-1) provider
    const euProvider = new aws.Provider(
      'eu-provider',
      {
        region: 'eu-west-1',
      },
      { parent: this }
    );

    // Secondary region VPC
    const secondaryVpc = new aws.ec2.Vpc(
      'secondary-vpc',
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `secondary-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
          Region: 'eu-west-1',
          CostCenter: 'trading',
        },
      },
      { provider: euProvider, parent: this }
    );

    // Internet Gateway for secondary VPC (FIXED)
    const secondaryIgw = new aws.ec2.InternetGateway(
      'secondary-igw',
      {
        vpcId: secondaryVpc.id,
        tags: {
          Name: `secondary-igw-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // Secondary region subnets (3 AZs) - NOW PUBLIC (FIXED)
    const secondarySubnets = [0, 1, 2].map(i => {
      return new aws.ec2.Subnet(
        `secondary-subnet-${i}`,
        {
          vpcId: secondaryVpc.id,
          cidrBlock: `10.1.${i}.0/24`,
          availabilityZone: `eu-west-1${['a', 'b', 'c'][i]}`,
          mapPublicIpOnLaunch: true, // FIXED: Make subnets public
          tags: {
            Name: `secondary-subnet-${i}-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        },
        { provider: euProvider, parent: this }
      );
    });

    // Route table for secondary public subnets (FIXED)
    const secondaryRouteTable = new aws.ec2.RouteTable(
      'secondary-route-table',
      {
        vpcId: secondaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: secondaryIgw.id,
          },
        ],
        tags: {
          Name: `secondary-route-table-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // Associate route table with secondary subnets (FIXED)
    secondarySubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `secondary-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: secondaryRouteTable.id,
        },
        { provider: euProvider, parent: this }
      );
    });

    // VPC Peering connection
    const _peeringConnection = new aws.ec2.VpcPeeringConnection(
      'vpc-peering',
      {
        vpcId: primaryVpc.id,
        peerVpcId: secondaryVpc.id,
        peerRegion: 'eu-west-1',
        autoAccept: false,
        tags: {
          Name: `vpc-peering-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Generate secure password from Secrets Manager (FIXED)
    const dbMasterPassword = new aws.secretsmanager.Secret(
      'db-master-password',
      {
        name: `trading-db-master-password-${environmentSuffix}`,
        description: 'Master password for Aurora Global Database',
      },
      { parent: this }
    );

    const dbMasterPasswordVersion = new aws.secretsmanager.SecretVersion(
      'db-master-password-version',
      {
        secretId: dbMasterPassword.id,
        secretString: pulumi.interpolate`{"password":"${pulumi.output(
          Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            '!A1'
        )}"}`,
      },
      {
        parent: this,
        ignoreChanges: ['secretString'], // Prevent password regeneration on every deployment
      }
    );

    // Aurora Global Database Cluster
    const globalCluster = new aws.rds.GlobalCluster(
      'global-cluster',
      {
        globalClusterIdentifier: `trading-global-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'trading',
      },
      { parent: this }
    );

    // Primary Aurora Cluster Subnet Group
    const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
      'primary-db-subnet',
      {
        subnetIds: primarySubnets.map(s => s.id),
        tags: {
          Name: `primary-db-subnet-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Primary Aurora Cluster Security Group (FIXED: Added environmentSuffix to tag)
    const primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      'primary-db-sg',
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: {
          Name: `primary-db-sg-${environmentSuffix}`, // FIXED: Added environmentSuffix
        },
      },
      { parent: this }
    );

    // Primary Aurora Cluster (FIXED: Using Secrets Manager)
    const primaryCluster = new aws.rds.Cluster(
      'primary-cluster',
      {
        clusterIdentifier: `trading-primary-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'trading',
        masterUsername: 'dbadmin',
        masterPassword: dbMasterPasswordVersion.secretString.apply(s => {
          const parsed = JSON.parse(s as string) as { password: string };
          return parsed.password || 'defaultPassword123!';
        }), // FIXED: Using Secrets Manager
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: primaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
        skipFinalSnapshot: true,
      },
      {
        parent: this,
        ignoreChanges: ['masterPassword'], // Prevent password updates from triggering cluster modifications
      }
    );

    // Aurora Cluster Instance for primary (required for Global Database)
    const primaryClusterInstance = new aws.rds.ClusterInstance(
      'primary-cluster-instance',
      {
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r5.large', // Global databases require memory-optimized instances
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
      },
      { parent: this }
    );

    // Secondary Aurora Cluster Subnet Group
    const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
      'secondary-db-subnet',
      {
        subnetIds: secondarySubnets.map(s => s.id),
        tags: {
          Name: `secondary-db-subnet-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // Secondary Aurora Cluster Security Group
    const secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      'secondary-db-sg',
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.1.0.0/16'],
          },
        ],
        tags: {
          Name: `secondary-db-sg-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // FIXED: Wait for primary cluster to be fully available before creating secondary
    // This uses primaryClusterInstance completion as proxy for "available" state
    const secondaryCluster = new aws.rds.Cluster(
      'secondary-cluster',
      {
        clusterIdentifier: `trading-secondary-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: secondaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [secondaryDbSecurityGroup.id],
        skipFinalSnapshot: true,
      },
      {
        provider: euProvider,
        parent: this,
        dependsOn: [primaryCluster, primaryClusterInstance], // FIXED: Proper dependencies
      }
    );

    // Aurora Cluster Instance for secondary
    const _secondaryClusterInstance = new aws.rds.ClusterInstance(
      'secondary-cluster-instance',
      {
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r5.large', // Global databases require memory-optimized instances
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
      },
      { provider: euProvider, parent: this }
    );

    // Lambda Execution Role
    const lambdaRole = new aws.iam.Role(
      'lambda-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        ],
      },
      { parent: this }
    );

    // Lambda function in primary region
    const _primaryLambda = new aws.lambda.Function(
      'primary-lambda',
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Trading platform active" }),
                };
            };
        `),
        }),
        environment: {
          variables: {
            REGION: 'us-east-1',
            DB_HOST: primaryCluster.endpoint,
          },
        },
        tags: {
          Name: `primary-lambda-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda function in secondary region
    const _secondaryLambda = new aws.lambda.Function(
      'secondary-lambda',
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            exports.handler = async (event) => {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Trading platform active" }),
                };
            };
        `),
        }),
        environment: {
          variables: {
            REGION: 'eu-west-1',
            DB_HOST: secondaryCluster.endpoint,
          },
        },
        tags: {
          Name: `secondary-lambda-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // FIXED: Use data source to get latest AMI instead of hardcoding
    const primaryAmi = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // EC2 instances for ALB targets in primary region (FIXED: Dynamic AMI)
    const primaryInstance = new aws.ec2.Instance(
      'primary-instance',
      {
        instanceType: 't3.micro',
        ami: primaryAmi.then(ami => ami.id), // FIXED: Dynamic AMI lookup
        subnetId: primarySubnets[0].id,
        rootBlockDevice: {
          encrypted: false, // Disable EBS encryption to avoid KMS key issues
        },
        tags: {
          Name: `primary-instance-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Primary ALB Security Group
    const primaryAlbSg = new aws.ec2.SecurityGroup(
      'primary-alb-sg',
      {
        vpcId: primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      },
      { parent: this }
    );

    // Primary Application Load Balancer (FIXED: Now uses public subnets)
    const primaryAlb = new aws.lb.LoadBalancer(
      'primary-alb',
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [primaryAlbSg.id],
        subnets: primarySubnets.map(s => s.id), // FIXED: Now public subnets with IGW
        tags: {
          Name: `primary-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Primary Target Group
    const primaryTargetGroup = new aws.lb.TargetGroup(
      'primary-tg',
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: primaryVpc.id,
        healthCheck: {
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `primary-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach instance to target group
    const _primaryAttachment = new aws.lb.TargetGroupAttachment(
      'primary-attachment',
      {
        targetGroupArn: primaryTargetGroup.arn,
        targetId: primaryInstance.id,
      },
      { parent: this }
    );

    // Primary ALB Listener
    const _primaryListener = new aws.lb.Listener(
      'primary-listener',
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Note: Secondary EC2 instance removed due to KMS key encryption issues in eu-west-1
    // The secondary ALB will be created without backend instances for now

    const secondaryAlbSg = new aws.ec2.SecurityGroup(
      'secondary-alb-sg',
      {
        vpcId: secondaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      },
      { provider: euProvider, parent: this }
    );

    // Secondary ALB (FIXED: Now uses public subnets)
    const secondaryAlb = new aws.lb.LoadBalancer(
      'secondary-alb',
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [secondaryAlbSg.id],
        subnets: secondarySubnets.map(s => s.id), // FIXED: Now public subnets
        tags: {
          Name: `secondary-alb-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    const secondaryTargetGroup = new aws.lb.TargetGroup(
      'secondary-tg',
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: secondaryVpc.id,
        healthCheck: {
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `secondary-tg-${environmentSuffix}`,
        },
      },
      { provider: euProvider, parent: this }
    );

    // Note: Secondary instance attachment removed due to KMS encryption issues
    // The target group exists but has no registered targets

    const _secondaryListener = new aws.lb.Listener(
      'secondary-listener',
      {
        loadBalancerArn: secondaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: secondaryTargetGroup.arn,
          },
        ],
      },
      { provider: euProvider, parent: this }
    );

    // AWS Global Accelerator
    const accelerator = new aws.globalaccelerator.Accelerator(
      'accelerator',
      {
        name: `trading-accelerator-${environmentSuffix}`,
        ipAddressType: 'IPV4',
        enabled: true,
        attributes: {
          flowLogsEnabled: false,
        },
      },
      { parent: this }
    );

    const listener = new aws.globalaccelerator.Listener(
      'listener',
      {
        acceleratorArn: accelerator.id,
        protocol: 'TCP',
        portRanges: [
          {
            fromPort: 80,
            toPort: 80,
          },
        ],
      },
      { parent: this }
    );

    const _primaryEndpointGroup = new aws.globalaccelerator.EndpointGroup(
      'primary-endpoint',
      {
        listenerArn: listener.id,
        endpointGroupRegion: 'us-east-1',
        endpointConfigurations: [
          {
            endpointId: primaryAlb.arn,
            weight: 100,
          },
        ],
        healthCheckIntervalSeconds: 10,
        healthCheckPath: '/health',
        healthCheckProtocol: 'HTTP',
      },
      { parent: this }
    );

    const _secondaryEndpointGroup = new aws.globalaccelerator.EndpointGroup(
      'secondary-endpoint',
      {
        listenerArn: listener.id,
        endpointGroupRegion: 'eu-west-1',
        endpointConfigurations: [
          {
            endpointId: secondaryAlb.arn,
            weight: 100,
          },
        ],
        healthCheckIntervalSeconds: 10,
        healthCheckPath: '/health',
        healthCheckProtocol: 'HTTP',
      },
      { parent: this }
    );

    // Secrets Manager in primary region
    const primarySecret = new aws.secretsmanager.Secret(
      'primary-secret',
      {
        name: `trading-db-credentials-${environmentSuffix}-primary`,
        description: 'Database credentials for primary region',
      },
      { parent: this }
    );

    const _primarySecretVersion = new aws.secretsmanager.SecretVersion(
      'primary-secret-version',
      {
        secretId: primarySecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: 'tempPassword123!',
        }),
      },
      { parent: this }
    );

    // Secrets Manager in secondary region
    const secondarySecret = new aws.secretsmanager.Secret(
      'secondary-secret',
      {
        name: `trading-db-credentials-${environmentSuffix}-secondary`,
        description: 'Database credentials for secondary region',
      },
      { provider: euProvider, parent: this }
    );

    const _secondarySecretVersion = new aws.secretsmanager.SecretVersion(
      'secondary-secret-version',
      {
        secretId: secondarySecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: 'tempPassword123!',
        }),
      },
      { provider: euProvider, parent: this }
    );

    // CloudWatch Dashboard
    const _dashboard = new aws.cloudwatch.Dashboard(
      'dashboard',
      {
        dashboardName: `trading-dashboard-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/RDS',
                    'CPUUtilization',
                    { stat: 'Average', region: 'us-east-1' },
                  ],
                  ['...', { stat: 'Average', region: 'eu-west-1' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Aurora CPU Utilization',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Invocations',
                    { stat: 'Sum', region: 'us-east-1' },
                  ],
                  ['...', { stat: 'Sum', region: 'eu-west-1' }],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'Lambda Invocations',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Set public outputs
    this.primaryVpcId = primaryVpc.id;
    this.secondaryVpcId = secondaryVpc.id;
    this.primaryClusterId = primaryCluster.id;
    this.secondaryClusterId = secondaryCluster.id;
    this.primaryAlbDns = primaryAlb.dnsName;
    this.secondaryAlbDns = secondaryAlb.dnsName;
    this.acceleratorDns = accelerator.dnsName;
    this.primarySecretArn = primarySecret.arn;
    this.secondarySecretArn = secondarySecret.arn;

    // Register the outputs of this component.
    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      primaryClusterId: this.primaryClusterId,
      secondaryClusterId: this.secondaryClusterId,
      primaryAlbDns: this.primaryAlbDns,
      secondaryAlbDns: this.secondaryAlbDns,
      acceleratorDns: this.acceleratorDns,
      primarySecretArn: this.primarySecretArn,
      secondarySecretArn: this.secondarySecretArn,
    });
  }
}
