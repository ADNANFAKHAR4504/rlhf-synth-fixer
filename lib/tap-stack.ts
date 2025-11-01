import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

export interface TapStackArgs {
  stackName: string;
  environmentSuffix: string;
  env: {
    account?: string;
    region?: string;
  };
  
  // Dev environment resource IDs for import
  devRdsInstanceId?: string;
  devVpcId?: string;
  
  // Migration configuration
  migrationPhase?: "initial" | "snapshot" | "blue-green" | "traffic-shift-10" | "traffic-shift-50" | "traffic-shift-100" | "complete";
  
  // Existing resources to import
  devEnvironment?: {
    rdsInstanceIdentifier: string;
    vpcId?: string;
  };
}

/**
 * TapStack - Production infrastructure for fintech payment processing
 * Implements blue-green deployment with gradual traffic shifting
 */
export class TapStack extends pulumi.ComponentResource {
  // Public outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly prodRdsEndpoint: pulumi.Output<string>;
  public readonly prodRdsPort: pulumi.Output<number>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly route53DomainName: pulumi.Output<string>;
  public readonly prodLogBucketName: pulumi.Output<string>;
  public readonly replicaLogBucketName: pulumi.Output<string>;
  public readonly migrationStatus: pulumi.Output<string>;
  public readonly outputs: Record<string, any> = {};

  // Private resources
  private vpc: aws.ec2.Vpc;
  private publicSubnets: aws.ec2.Subnet[] = [];
  private privateSubnets: aws.ec2.Subnet[] = [];
  private natGateways: aws.ec2.NatGateway[] = [];
  private prodRdsInstance: aws.rds.Instance;
  private devRdsSnapshot?: aws.rds.ClusterSnapshot;
  private prodSecurityGroup: aws.ec2.SecurityGroup;
  private albSecurityGroup: aws.ec2.SecurityGroup;
  private dbSecurityGroup: aws.ec2.SecurityGroup;
  private alb: aws.lb.LoadBalancer;
  private targetGroupBlue: aws.lb.TargetGroup;
  private targetGroupGreen: aws.lb.TargetGroup;
  private prodLogBucket: aws.s3.Bucket;
  private replicaLogBucket: aws.s3.Bucket;
  private prodAutoScalingGroup: aws.autoscaling.Group;
  private devAutoScalingGroup?: aws.autoscaling.Group;
  private route53Zone: aws.route53.Zone;
  private ec2Role: aws.iam.Role;
  private kmsKey: aws.kms.Key;

  // Availability zones
  private availabilityZones = ["us-east-1a", "us-east-1b", "us-east-1c"];

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:infrastructure:TapStack", name, {}, opts);

    const defaultOpts: pulumi.ResourceOptions = { parent: this };
    const migrationPhase = args.migrationPhase || "initial";

    // Generate random suffix for resource naming
    const randomSuffix = new pulumi.random.RandomString(
      `${name}-suffix`,
      {
        length: 8,
        special: false,
        upper: false,
      },
      defaultOpts
    );

    // =========================================================================
    // 1. KMS Key for Encryption (AES-256)
    // =========================================================================
    this.kmsKey = new aws.kms.Key(
      `prod-kms-${args.environmentSuffix}`,
      {
        description: "KMS key for production encryption",
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-kms-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    const kmsAlias = new aws.kms.Alias(
      `prod-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/prod-encryption-${args.environmentSuffix}`,
        targetKeyId: this.kmsKey.keyId,
      },
      defaultOpts
    );

    // =========================================================================
    // 2. VPC Configuration with 3 AZs
    // =========================================================================
    this.vpc = new aws.ec2.Vpc(
      `prod-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-vpc-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    this.vpcId = this.vpc.id;

    // Internet Gateway for public subnets
    const internetGateway = new aws.ec2.InternetGateway(
      `prod-igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-igw-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // Public and Private Subnets across 3 AZs
    const publicCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
    const privateCidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"];

    // Create Public Subnets
    this.availabilityZones.forEach((az, index) => {
      const publicSubnet = new aws.ec2.Subnet(
        `prod-public-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicCidrs[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: pulumi.interpolate`prod-public-${az}-${randomSuffix.result}`,
            Type: "public",
          },
        },
        defaultOpts
      );
      this.publicSubnets.push(publicSubnet);
    });

    // Create Private Subnets
    this.availabilityZones.forEach((az, index) => {
      const privateSubnet = new aws.ec2.Subnet(
        `prod-private-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateCidrs[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: pulumi.interpolate`prod-private-${az}-${randomSuffix.result}`,
            Type: "private",
          },
        },
        defaultOpts
      );
      this.privateSubnets.push(privateSubnet);
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    this.availabilityZones.forEach((az, index) => {
      const eip = new aws.ec2.Eip(
        `prod-eip-${az}-${args.environmentSuffix}`,
        {
          vpc: true,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: pulumi.interpolate`prod-eip-${az}-${randomSuffix.result}`,
          },
        },
        defaultOpts
      );
      eips.push(eip);
    });

    // Create NAT Gateways in each AZ
    this.publicSubnets.forEach((subnet, index) => {
      const natGateway = new aws.ec2.NatGateway(
        `prod-nat-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          allocationId: eips[index].id,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: pulumi.interpolate`prod-nat-${this.availabilityZones[index]}-${randomSuffix.result}`,
          },
        },
        defaultOpts
      );
      this.natGateways.push(natGateway);
    });

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `prod-public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-public-rt-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    new aws.ec2.Route(
      `prod-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: internetGateway.id,
      },
      defaultOpts
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `prod-public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        defaultOpts
      );
    });

    // Private Route Tables (one per AZ for NAT Gateway)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `prod-private-rt-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: pulumi.interpolate`prod-private-rt-${this.availabilityZones[index]}-${randomSuffix.result}`,
          },
        },
        defaultOpts
      );

      new aws.ec2.Route(
        `prod-private-route-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: this.natGateways[index].id,
        },
        defaultOpts
      );

      new aws.ec2.RouteTableAssociation(
        `prod-private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        defaultOpts
      );
    });

    // =========================================================================
    // 3. Security Groups
    // =========================================================================

    // ALB Security Group - HTTPS only from internet
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-alb-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production ALB - HTTPS only",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS from internet",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-alb-sg-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // Application Security Group - Access from ALB only
    this.prodSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-app-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production application instances",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.albSecurityGroup.id],
            description: "Allow traffic from ALB",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-app-sg-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // Database Security Group - Access from application subnet only
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-db-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production RDS - restricted to app subnet",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.prodSecurityGroup.id],
            description: "Allow MySQL from application instances only",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-db-sg-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // =========================================================================
    // 4. IAM Roles with Least Privilege
    // =========================================================================

    // EC2 Instance Role
    this.ec2Role = new aws.iam.Role(
      `prod-ec2-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "ec2.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-ec2-role-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // S3 Access Policy (least privilege)
    const s3Policy = new aws.iam.Policy(
      `prod-s3-policy-${args.environmentSuffix}`,
      {
        policy: pulumi
          .all([this.vpc.id])
          .apply(([vpcId]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
                  Resource: [
                    `arn:aws:s3:::prod-logs-${args.environmentSuffix}-*`,
                    `arn:aws:s3:::prod-logs-${args.environmentSuffix}-*/*`,
                  ],
                },
              ],
            })
          ),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // RDS Access Policy
    const rdsPolicy = new aws.iam.Policy(
      `prod-rds-policy-${args.environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "rds:DescribeDBInstances",
                "rds:DescribeDBClusters",
                "rds-db:connect",
              ],
              Resource: "*",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      `prod-ec2-s3-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: s3Policy.arn,
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-ec2-rds-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: rdsPolicy.arn,
      },
      defaultOpts
    );

    // SSM Policy for Systems Manager
    new aws.iam.RolePolicyAttachment(
      `prod-ec2-ssm-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      },
      defaultOpts
    );

    // CloudWatch Policy
    new aws.iam.RolePolicyAttachment(
      `prod-ec2-cloudwatch-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn:
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      },
      defaultOpts
    );

    // Instance Profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `prod-instance-profile-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // =========================================================================
    // 5. RDS MySQL with Multi-AZ and Encryption
    // =========================================================================

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `prod-db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: this.privateSubnets.map((s) => s.id),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-db-subnet-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // RDS Parameter Group
    const dbParameterGroup = new aws.rds.ParameterGroup(
      `prod-db-params-${args.environmentSuffix}`,
      {
        family: "mysql8.0",
        parameters: [
          {
            name: "character_set_server",
            value: "utf8mb4",
          },
          {
            name: "collation_server",
            value: "utf8mb4_unicode_ci",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // Import dev RDS snapshot if provided
    let snapshotIdentifier: pulumi.Output<string> | undefined;
    if (args.devEnvironment?.rdsInstanceIdentifier && migrationPhase !== "initial") {
      this.devRdsSnapshot = new aws.rds.ClusterSnapshot(
        `dev-snapshot-${args.environmentSuffix}`,
        {
          dbClusterIdentifier: args.devEnvironment.rdsInstanceIdentifier,
          dbClusterSnapshotIdentifier: `dev-migration-snapshot-${args.environmentSuffix}`,
          tags: {
            Environment: "development",
            ManagedBy: "pulumi",
            MigrationPhase: migrationPhase,
          },
        },
        defaultOpts
      );
      snapshotIdentifier = this.devRdsSnapshot.id;
    }

    // Production RDS Instance
    this.prodRdsInstance = new aws.rds.Instance(
      `prod-rds-${args.environmentSuffix}`,
      {
        identifier: pulumi.interpolate`prod-rds-${randomSuffix.result}`,
        engine: "mysql",
        engineVersion: "8.0",
        instanceClass: "db.r5.large",
        allocatedStorage: 100,
        storageType: "gp3",
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        
        // Multi-AZ deployment
        multiAz: true,
        
        // Network configuration
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.dbSecurityGroup.id],
        publiclyAccessible: false,
        
        // Backup configuration
        backupRetentionPeriod: 7,
        backupWindow: "03:00-04:00",
        maintenanceWindow: "mon:04:00-mon:05:00",
        
        // Point-in-time recovery (enabled by default with backup retention)
        
        // Credentials
        username: "admin",
        password: pulumi.secret("ChangeMe12345!"), // Should be from secrets manager
        
        // Enhanced monitoring
        monitoringInterval: 60,
        monitoringRoleArn: this.createRdsMonitoringRole(args, defaultOpts).arn,
        enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
        
        // Performance Insights
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: this.kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        
        // Snapshot configuration
        snapshotIdentifier: snapshotIdentifier,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: pulumi.interpolate`prod-final-snapshot-${randomSuffix.result}`,
        
        // Deletion protection
        deletionProtection: true,
        
        // Parameter group
        parameterGroupName: dbParameterGroup.name,
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-rds-${randomSuffix.result}`,
        },
      },
      { ...defaultOpts, ignoreChanges: ["password"] }
    );

    this.prodRdsEndpoint = this.prodRdsInstance.endpoint;
    this.prodRdsPort = this.prodRdsInstance.port;

    // =========================================================================
    // 6. S3 Buckets with Lifecycle and Cross-Region Replication
    // =========================================================================

    // Primary production log bucket (us-east-1)
    this.prodLogBucket = new aws.s3.Bucket(
      `prod-logs-${args.environmentSuffix}`,
      {
        bucket: pulumi.interpolate`prod-logs-${args.environmentSuffix}-${randomSuffix.result}`,
        
        // Versioning for replication
        versioning: {
          enabled: true,
        },
        
        // Server-side encryption
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        },
        
        // Lifecycle policy
        lifecycleRules: [
          {
            id: "transition-to-ia",
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: "STANDARD_IA",
              },
              {
                days: 90,
                storageClass: "GLACIER",
              },
            ],
            expiration: {
              days: 365,
            },
          },
        ],
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-logs-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    this.prodLogBucketName = this.prodLogBucket.id;

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `prod-logs-public-block-${args.environmentSuffix}`,
      {
        bucket: this.prodLogBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultOpts
    );

    // Replica bucket in us-west-2 for cross-region replication
    const replicaProvider = new aws.Provider(
      `replica-provider-${args.environmentSuffix}`,
      {
        region: "us-west-2",
      },
      defaultOpts
    );

    this.replicaLogBucket = new aws.s3.Bucket(
      `prod-logs-replica-${args.environmentSuffix}`,
      {
        bucket: pulumi.interpolate`prod-logs-replica-${args.environmentSuffix}-${randomSuffix.result}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-logs-replica-${randomSuffix.result}`,
        },
      },
      { ...defaultOpts, provider: replicaProvider }
    );

    this.replicaLogBucketName = this.replicaLogBucket.id;

    // Replication role
    const replicationRole = new aws.iam.Role(
      `prod-replication-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "s3.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    const replicationPolicy = new aws.iam.Policy(
      `prod-replication-policy-${args.environmentSuffix}`,
      {
        policy: pulumi
          .all([this.prodLogBucket.arn, this.replicaLogBucket.arn])
          .apply(([sourceArn, destArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket",
                  ],
                  Resource: sourceArn,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                  ],
                  Resource: `${sourceArn}/*`,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                  ],
                  Resource: `${destArn}/*`,
                },
              ],
            })
          ),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-replication-attachment-${args.environmentSuffix}`,
      {
        role: replicationRole.name,
        policyArn: replicationPolicy.arn,
      },
      defaultOpts
    );

    // Configure replication
    new aws.s3.BucketReplicationConfig(
      `prod-logs-replication-${args.environmentSuffix}`,
      {
        role: replicationRole.arn,
        bucket: this.prodLogBucket.id,
        rules: [
          {
            id: "replicate-all",
            status: "Enabled",
            destination: {
              bucket: this.replicaLogBucket.arn,
              replicationTime: {
                status: "Enabled",
                minutes: 15,
              },
              metrics: {
                status: "Enabled",
                minutes: 15,
              },
            },
          },
        ],
      },
      { ...defaultOpts, dependsOn: [replicationPolicy] }
    );

    // =========================================================================
    // 7. Application Load Balancer
    // =========================================================================

    this.alb = new aws.lb.LoadBalancer(
      `prod-alb-${args.environmentSuffix}`,
      {
        loadBalancerType: "application",
        subnets: this.publicSubnets.map((s) => s.id),
        securityGroups: [this.albSecurityGroup.id],
        enableHttp2: true,
        enableDeletionProtection: true,
        
        // Access logs to S3
        accessLogs: {
          bucket: this.prodLogBucket.id,
          prefix: "alb-logs",
          enabled: true,
        },
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: pulumi.interpolate`prod-alb-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    this.albDnsName = this.alb.dnsName;

    // Blue Target Group (existing/dev)
    this.targetGroupBlue = new aws.lb.TargetGroup(
      `prod-tg-blue-${args.environmentSuffix}`,
      {
        port: 8080,
        protocol: "HTTP",
        vpcId: this.vpc.id,
        targetType: "instance",
        
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: "HTTP",
          matcher: "200",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        
        deregistrationDelay: 30,
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Color: "blue",
          Name: pulumi.interpolate`prod-tg-blue-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // Green Target Group (new production)
    this.targetGroupGreen = new aws.lb.TargetGroup(
      `prod-tg-green-${args.environmentSuffix}`,
      {
        port: 8080,
        protocol: "HTTP",
        vpcId: this.vpc.id,
        targetType: "instance",
        
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: "HTTP",
          matcher: "200",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        
        deregistrationDelay: 30,
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Color: "green",
          Name: pulumi.interpolate`prod-tg-green-${randomSuffix.result}`,
        },
      },
      defaultOpts
    );

    // HTTPS Listener (requires ACM certificate)
    const listener = new aws.lb.Listener(
      `prod-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
        // certificateArn: "<ACM_CERTIFICATE_ARN>", // Needs to be provided
        
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: this.targetGroupGreen.arn,
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // =========================================================================
    // 8. EC2 Auto Scaling Groups (Blue-Green Deployment)
    // =========================================================================

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // Launch Template for Green (Production - m5.large)
    const launchTemplateGreen = new aws.ec2.LaunchTemplate(
      `prod-lt-green-${args.environmentSuffix}`,
      {
        imageId: ami.then((a) => a.id),
        instanceType: "m5.large",
        
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        
        vpcSecurityGroupIds: [this.prodSecurityGroup.id],
        
        // IMDSv2 enforcement
        metadataOptions: {
          httpEndpoint: "enabled",
          httpTokens: "required", // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
        },
        
        // EBS encryption
        blockDeviceMappings: [
          {
            deviceName: "/dev/xvda",
            ebs: {
              volumeSize: 50,
              volumeType: "gp3",
              encrypted: true,
              kmsKeyId: this.kmsKey.arn,
              deleteOnTermination: true,
            },
          },
        ],
        
        userData: pulumi.output(this.prodRdsInstance.endpoint).apply(endpoint =>
          Buffer.from(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent docker
systemctl start docker
systemctl enable docker

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "metrics": {
    "namespace": "Production/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [{"name": "cpu_usage_idle"}],
        "totalcpu": false
      },
      "mem": {
        "measurement": [{"name": "mem_used_percent"}]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Set database connection string
echo "DB_ENDPOINT=${endpoint}" >> /etc/environment

# Start application (placeholder)
docker run -d -p 8080:8080 -e DB_ENDPOINT=${endpoint} my-app:latest
`).toString("base64")
        ),
        
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: {
              Environment: "production",
              ManagedBy: "pulumi",
              Deployment: "green",
              Name: pulumi.interpolate`prod-instance-green-${randomSuffix.result}`,
            },
          },
        ],
        
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // Auto Scaling Group - Green (Production)
    this.prodAutoScalingGroup = new aws.autoscaling.Group(
      `prod-asg-green-${args.environmentSuffix}`,
      {
        vpcZoneIdentifiers: this.privateSubnets.map((s) => s.id),
        targetGroupArns: [this.targetGroupGreen.arn],
        
        minSize: 3,
        maxSize: 9,
        desiredCapacity: 3,
        
        healthCheckType: "ELB",
        healthCheckGracePeriod: 300,
        
        launchTemplate: {
          id: launchTemplateGreen.id,
          version: "$Latest",
        },
        
        tags: [
          {
            key: "Environment",
            value: "production",
            propagateAtLaunch: true,
          },
          {
            key: "ManagedBy",
            value: "pulumi",
            propagateAtLaunch: true,
          },
          {
            key: "Deployment",
            value: "green",
            propagateAtLaunch: true,
          },
          {
            key: "Name",
            value: pulumi.interpolate`prod-asg-green-${randomSuffix.result}`.apply(v => v),
            propagateAtLaunch: true,
          },
        ],
      },
      defaultOpts
    );

    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `prod-scale-up-${args.environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: "ChangeInCapacity",
        cooldown: 300,
        autoscalingGroupName: this.prodAutoScalingGroup.name,
      },
      defaultOpts
    );

    const scaleDownPolicy = new aws.autoscaling.Policy(
      `prod-scale-down-${args.environmentSuffix}`,
      {
        scalingAdjustment: -1,
        adjustmentType: "ChangeInCapacity",
        cooldown: 300,
        autoscalingGroupName: this.prodAutoScalingGroup.name,
      },
      defaultOpts
    );

    // Launch Template for Blue (Dev - t3.micro) - Optional for rollback
    if (migrationPhase !== "complete") {
      const launchTemplateBlue = new aws.ec2.LaunchTemplate(
        `prod-lt-blue-${args.environmentSuffix}`,
        {
          imageId: ami.then((a) => a.id),
          instanceType: "t3.micro",
          
          iamInstanceProfile: {
            arn: instanceProfile.arn,
          },
          
          vpcSecurityGroupIds: [this.prodSecurityGroup.id],
          
          metadataOptions: {
            httpEndpoint: "enabled",
            httpTokens: "required",
            httpPutResponseHopLimit: 1,
          },
          
          blockDeviceMappings: [
            {
              deviceName: "/dev/xvda",
              ebs: {
                volumeSize: 20,
                volumeType: "gp3",
                encrypted: true,
                kmsKeyId: this.kmsKey.arn,
                deleteOnTermination: true,
              },
            },
          ],
          
          tags: {
            Environment: "development",
            ManagedBy: "pulumi",
          },
        },
        defaultOpts
      );

      this.devAutoScalingGroup = new aws.autoscaling.Group(
        `prod-asg-blue-${args.environmentSuffix}`,
        {
          vpcZoneIdentifiers: this.privateSubnets.map((s) => s.id),
          targetGroupArns: [this.targetGroupBlue.arn],
          
          minSize: 0,
          maxSize: 3,
          desiredCapacity: migrationPhase === "initial" || migrationPhase === "traffic-shift-10" ? 1 : 0,
          
          healthCheckType: "ELB",
          healthCheckGracePeriod: 300,
          
          launchTemplate: {
            id: launchTemplateBlue.id,
            version: "$Latest",
          },
          
          tags: [
            {
              key: "Environment",
              value: "development",
              propagateAtLaunch: true,
            },
            {
              key: "ManagedBy",
              value: "pulumi",
              propagateAtLaunch: true,
            },
            {
              key: "Deployment",
              value: "blue",
              propagateAtLaunch: true,
            },
          ],
        },
        defaultOpts
      );
    }

    // =========================================================================
    // 9. Route53 Weighted Routing
    // =========================================================================

    // Create hosted zone
    this.route53Zone = new aws.route53.Zone(
      `prod-zone-${args.environmentSuffix}`,
      {
        name: `production-${args.environmentSuffix}.example.com`,
        comment: "Production hosted zone for payment processing",
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    this.route53DomainName = this.route53Zone.name;

    // Determine weights based on migration phase
    const weights = this.getTrafficWeights(migrationPhase);

    // Green (Production) Record
    const recordGreen = new aws.route53.Record(
      `prod-record-green-${args.environmentSuffix}`,
      {
        zoneId: this.route53Zone.zoneId,
        name: `app.production-${args.environmentSuffix}.example.com`,
        type: "A",
        
        aliases: [
          {
            name: this.alb.dnsName,
            zoneId: this.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
        
        setIdentifier: "green-production",
        weightedRoutingPolicies: [
          {
            weight: weights.green,
          },
        ],
      },
      defaultOpts
    );

    // Blue (Dev) Record - for rollback capability
    if (migrationPhase !== "complete") {
      const recordBlue = new aws.route53.Record(
        `prod-record-blue-${args.environmentSuffix}`,
        {
          zoneId: this.route53Zone.zoneId,
          name: `app.production-${args.environmentSuffix}.example.com`,
          type: "A",
          
          aliases: [
            {
              name: this.alb.dnsName,
              zoneId: this.alb.zoneId,
              evaluateTargetHealth: true,
            },
          ],
          
          setIdentifier: "blue-development",
          weightedRoutingPolicies: [
            {
              weight: weights.blue,
            },
          ],
        },
        defaultOpts
      );
    }

    // =========================================================================
    // 10. CloudWatch Alarms
    // =========================================================================

    // SNS Topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `prod-alarms-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`prod-alarms-${randomSuffix.result}`,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `prod-cpu-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when CPU exceeds 80%",
        alarmActions: [alarmTopic.arn, scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: this.prodAutoScalingGroup.name,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // Database Connections Alarm
    new aws.cloudwatch.MetricAlarm(
      `prod-db-connections-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "DatabaseConnections",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when RDS connections exceed 80",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.prodRdsInstance.identifier,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // ALB Target Health Alarm
    new aws.cloudwatch.MetricAlarm(
      `prod-target-health-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 2,
        metricName: "HealthyHostCount",
        namespace: "AWS/ApplicationELB",
        period: 60,
        statistic: "Average",
        threshold: 2,
        alarmDescription: "Triggers when healthy hosts drop below 2",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          TargetGroup: this.targetGroupGreen.arnSuffix,
          LoadBalancer: this.alb.arnSuffix,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // RDS CPU Alarm
    new aws.cloudwatch.MetricAlarm(
      `prod-rds-cpu-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when RDS CPU exceeds 80%",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.prodRdsInstance.identifier,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // =========================================================================
    // Output Generation for cfn-outputs/flat-outputs.json
    // =========================================================================

    this.migrationStatus = pulumi.output(migrationPhase);

    this.outputs = {
      vpcId: this.vpcId,
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
      prodRdsEndpoint: this.prodRdsEndpoint,
      prodRdsPort: this.prodRdsPort,
      albDnsName: this.albDnsName,
      albArn: this.alb.arn,
      targetGroupGreenArn: this.targetGroupGreen.arn,
      targetGroupBlueArn: this.targetGroupBlue.arn,
      prodAutoScalingGroupName: this.prodAutoScalingGroup.name,
      route53ZoneId: this.route53Zone.zoneId,
      route53DomainName: this.route53DomainName,
      prodLogBucketName: this.prodLogBucketName,
      replicaLogBucketName: this.replicaLogBucketName,
      kmsKeyId: this.kmsKey.keyId,
      ec2RoleArn: this.ec2Role.arn,
      migrationPhase: this.migrationStatus,
      trafficWeights: pulumi.output(weights),
    };

    // Write outputs to file
    this.writeOutputsToFile(args);

    this.registerOutputs(this.outputs);
  }

  /**
   * Helper: Get traffic weights based on migration phase
   */
  private getTrafficWeights(phase: string): { blue: number; green: number } {
    switch (phase) {
      case "initial":
      case "snapshot":
        return { blue: 100, green: 0 };
      case "blue-green":
      case "traffic-shift-10":
        return { blue: 90, green: 10 };
      case "traffic-shift-50":
        return { blue: 50, green: 50 };
      case "traffic-shift-100":
      case "complete":
        return { blue: 0, green: 100 };
      default:
        return { blue: 100, green: 0 };
    }
  }

  /**
   * Helper: Create RDS monitoring IAM role
   */
  private createRdsMonitoringRole(
    args: TapStackArgs,
    opts: pulumi.ResourceOptions
  ): aws.iam.Role {
    const role = new aws.iam.Role(
      `prod-rds-monitoring-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "monitoring.rds.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      opts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-rds-monitoring-attachment-${args.environmentSuffix}`,
      {
        role: role.name,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
      },
      opts
    );

    return role;
  }

  /**
   * Helper: Write outputs to JSON file
   */
  private writeOutputsToFile(args: TapStackArgs): void {
    pulumi.all(this.outputs).apply((outputs) => {
      const outputDir = path.join(process.cwd(), "cfn-outputs");
      const outputFile = path.join(outputDir, "flat-outputs.json");

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write outputs
      fs.writeFileSync(
        outputFile,
        JSON.stringify(outputs, null, 2),
        "utf-8"
      );

      console.log(` Outputs written to: ${outputFile}`);
    });
  }
}
