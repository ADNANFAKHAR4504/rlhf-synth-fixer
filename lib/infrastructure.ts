import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export interface InfrastructureProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
  secondaryRegion?: string;
  instanceType?: string;
  minCapacity?: number;
  maxCapacity?: number;
  desiredCapacity?: number;
  vpcCidr?: string;
  keyPairName?: string;
}

export class Infrastructure extends cdk.Stack {
  public readonly isProduction: boolean;
  public readonly removalPolicy: cdk.RemovalPolicy;
  public readonly environmentSuffix: string;
  public readonly region: string;
  public readonly commonTags: { [key: string]: string };

  // Resources that need to be accessed across methods
  public vpc: ec2.Vpc;
  public alb: elbv2.ApplicationLoadBalancer;
  public logBucket: s3.Bucket;
  public globalTable?: dynamodb.TableV2;
  public instanceRole: iam.Role;
  public albSecurityGroup: ec2.SecurityGroup;
  public instanceSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: InfrastructureProps) {
    super(scope, id, props);

    // Initialize configuration
    this.environmentSuffix = props.environmentSuffix;
    this.region = props.region;
    this.isProduction = props.environmentSuffix.toLowerCase().includes('prod');
    this.removalPolicy = this.isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Set default values for optional parameters
    const instanceType = props.instanceType || 't3.medium';
    const minCapacity = props.minCapacity || 2;
    const maxCapacity = props.maxCapacity || 6;
    const desiredCapacity = props.desiredCapacity || 2;
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const keyPairName = props.keyPairName || undefined;

    // Common tags for all resources
    this.commonTags = {
      Environment: 'Production',
      Project: 'WebApp',
      ManagedBy: 'CDK',
      EnvironmentSuffix: this.environmentSuffix,
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'WebApp');
    cdk.Tags.of(this).add('EnvironmentSuffix', this.environmentSuffix);

    // Create IAM role for EC2 instances
    this.createIamRole();

    // Create infrastructure in this region
    this.createRegionInfrastructure(
      this.region,
      vpcCidr,
      instanceType,
      minCapacity,
      maxCapacity,
      desiredCapacity,
      keyPairName
    );

    // Create DynamoDB Global Table (only in primary region)
    if (props.secondaryRegion) {
      this.createDynamoDbGlobalTable(props.secondaryRegion);
    }

    // Output important values
    this.createOutputs(this.region);
  }

  private createIamRole(): void {
    // Create IAM role for EC2 instances with least privilege
    this.instanceRole = new iam.Role(
      this,
      `WebAppInstanceRole-${this.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        roleName: `webapp-instance-role-${this.environmentSuffix}-${this.region}`,
        description:
          'IAM role for WebApp EC2 instances with least privilege access',
      }
    );

    // Add managed policy for SSM access (for maintenance)
    this.instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Add CloudWatch Logs permissions
    this.instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: ['arn:aws:logs:*:*:*'],
      })
    );

    // Apply removal policy
    this.instanceRole.applyRemovalPolicy(this.removalPolicy);
  }

  private createRegionInfrastructure(
    region: string,
    vpcCidr: string,
    instanceType: string,
    minCapacity: number,
    maxCapacity: number,
    desiredCapacity: number,
    keyPairName?: string
  ): void {
    // Create VPC in this region
    this.vpc = this.createVpc(`vpc-${this.environmentSuffix}`, vpcCidr);

    // Create security groups
    this.albSecurityGroup = this.createAlbSecurityGroup(this.vpc, 'webapp');
    this.instanceSecurityGroup = this.createInstanceSecurityGroup(
      this.vpc,
      this.albSecurityGroup,
      'webapp'
    );

    // Create S3 bucket for logs
    this.logBucket = this.createLogBucket('webapp', region);

    // Create Application Load Balancer
    this.alb = this.createApplicationLoadBalancer(
      this.vpc,
      this.albSecurityGroup,
      'webapp',
      this.logBucket
    );

    // Create Auto Scaling Group with EC2 instances
    this.createAutoScalingGroup(
      this.vpc,
      this.instanceSecurityGroup,
      this.alb,
      'webapp',
      instanceType,
      minCapacity,
      maxCapacity,
      desiredCapacity,
      keyPairName
    );

    // Grant S3 permissions to instances
    this.logBucket.grantReadWrite(this.instanceRole);

    // Grant DynamoDB permissions to instances (if global table exists)
    if (this.globalTable) {
      this.globalTable.grantReadWriteData(this.instanceRole);
    }
  }

  private createVpc(name: string, cidr: string): ec2.Vpc {
    const vpc = new ec2.Vpc(this, name, {
      ipAddresses: ec2.IpAddresses.cidr(cidr),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    vpc.applyRemovalPolicy(this.removalPolicy);

    // Add VPC Flow Logs
    vpc.addFlowLog(`${name}-flow-logs`, {
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    return vpc;
  }

  private createAlbSecurityGroup(
    vpc: ec2.Vpc,
    prefix: string
  ): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(
      this,
      `${prefix}-alb-sg-${this.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        securityGroupName: `${prefix}-alb-sg-${this.environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Allow HTTPS traffic
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    sg.applyRemovalPolicy(this.removalPolicy);
    return sg;
  }

  private createInstanceSecurityGroup(
    vpc: ec2.Vpc,
    albSg: ec2.SecurityGroup,
    prefix: string
  ): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(
      this,
      `${prefix}-instance-sg-${this.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        securityGroupName: `${prefix}-instance-sg-${this.environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Only allow traffic from ALB on HTTP
    sg.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // Only allow traffic from ALB on HTTPS
    sg.addIngressRule(
      albSg,
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from ALB only'
    );

    sg.applyRemovalPolicy(this.removalPolicy);
    return sg;
  }

  private createApplicationLoadBalancer(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    prefix: string,
    logBucket: s3.Bucket
  ): elbv2.ApplicationLoadBalancer {
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${prefix}-alb-${this.environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        loadBalancerName: `webapp-alb-${this.environmentSuffix}`,
        securityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Enable access logs
    alb.logAccessLogs(logBucket, `alb-logs/${prefix}`);

    alb.applyRemovalPolicy(this.removalPolicy);
    return alb;
  }

  private createLogBucket(prefix: string, region: string): s3.Bucket {
    const bucket = new s3.Bucket(
      this,
      `${prefix}-logs-${this.environmentSuffix}`,
      {
        bucketName: `webapp-logs-${prefix}-${this.environmentSuffix}-${region}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: cdk.Duration.days(90),
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(60),
              },
            ],
          },
        ],
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: !this.isProduction,
      }
    );

    // Grant permissions for ALB to write logs
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
        ],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    return bucket;
  }

  private createAutoScalingGroup(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    alb: elbv2.ApplicationLoadBalancer,
    prefix: string,
    instanceType: string,
    minCapacity: number,
    maxCapacity: number,
    desiredCapacity: number,
    keyPairName?: string
  ): autoscaling.AutoScalingGroup {
    // Read userData.sh script and substitute CDK variables
    const userDataScriptPath = path.join(__dirname, 'userData.sh');
    let userDataScript = fs.readFileSync(userDataScriptPath, 'utf8');

    // Substitute placeholders in the script
    userDataScript = userDataScript
      .replace(/__AWS_REGION__/g, this.region)
      .replace(/__S3_BUCKET_NAME__/g, this.logBucket.bucketName)
      .replace(
        /__DYNAMODB_TABLE_NAME__/g,
        this.globalTable?.tableName || `webapp-data-${this.environmentSuffix}`
      )
      .replace(/__ENVIRONMENT_SUFFIX__/g, this.environmentSuffix)
      .replace(/__PREFIX__/g, prefix);

    // User data script for web application with test app
    const userData = ec2.UserData.forLinux();
    userData.addCommands(userDataScript);

    // Create launch template for better control
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${prefix}-lt-${this.environmentSuffix}`,
      {
        launchTemplateName: `webapp-lt-${this.environmentSuffix}`,
        instanceType: new ec2.InstanceType(instanceType),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        userData,
        role: this.instanceRole,
        securityGroup,
        keyPair: keyPairName
          ? new ec2.KeyPair(this, 'KeyPair', { keyPairName })
          : undefined,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(30, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              deleteOnTermination: !this.isProduction,
            }),
          },
        ],
      }
    );

    launchTemplate.applyRemovalPolicy(this.removalPolicy);

    // Create Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `${prefix}-asg-${this.environmentSuffix}`,
      {
        vpc,
        autoScalingGroupName: `webapp-asg-${this.environmentSuffix}`,
        launchTemplate,
        minCapacity,
        maxCapacity,
        desiredCapacity,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthChecks: autoscaling.HealthChecks.ec2(),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
          waitOnResourceSignals: false,
        }),
      }
    );

    // Add target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${prefix}-tg-${this.environmentSuffix}`,
      {
        vpc,
        targetGroupName: `webapp-tg-${this.environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [asg],
        healthCheck: {
          enabled: true,
          path: '/health',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Add listener to ALB
    alb.addListener(`${prefix}-listener-${this.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add scaling policies
    asg.scaleOnCpuUtilization(
      `${prefix}-cpu-scaling-${this.environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        cooldown: cdk.Duration.minutes(5),
      }
    );

    asg.scaleOnRequestCount(
      `${prefix}-request-scaling-${this.environmentSuffix}`,
      {
        targetRequestsPerMinute: 1000,
      }
    );

    asg.applyRemovalPolicy(this.removalPolicy);

    return asg;
  }

  private createDynamoDbGlobalTable(secondaryRegion: string): void {
    // Create DynamoDB Global Table with replication to secondary region
    this.globalTable = new dynamodb.TableV2(
      this,
      `webapp-global-table-${this.environmentSuffix}`,
      {
        tableName: `webapp-data-${this.environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billing: dynamodb.Billing.onDemand(),
        encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        replicas: [
          {
            region: secondaryRegion,
          },
        ],
        removalPolicy: this.removalPolicy,
      }
    );

    // Grant read/write permissions to EC2 instances
    this.globalTable.grantReadWriteData(this.instanceRole);

    // Add Global Secondary Index
    this.globalTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }

  private createOutputs(region: string): void {
    // VPC and Networking Outputs
    new cdk.CfnOutput(this, `${region}-VPCId`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${this.environmentSuffix}-${region}`,
    });

    // Subnet Outputs
    new cdk.CfnOutput(this, `${region}-PublicSubnet1Id`, {
      value: this.vpc.publicSubnets[0].subnetId,
      description: 'Public Subnet 1 ID',
      exportName: `public-subnet-1-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-PublicSubnet2Id`, {
      value: this.vpc.publicSubnets[1].subnetId,
      description: 'Public Subnet 2 ID',
      exportName: `public-subnet-2-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-PrivateSubnet1Id`, {
      value: this.vpc.privateSubnets[0].subnetId,
      description: 'Private Subnet 1 ID',
      exportName: `private-subnet-1-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-PrivateSubnet2Id`, {
      value: this.vpc.privateSubnets[1].subnetId,
      description: 'Private Subnet 2 ID',
      exportName: `private-subnet-2-${this.environmentSuffix}-${region}`,
    });

    // Security Group Outputs
    new cdk.CfnOutput(this, `${region}-ALBSecurityGroupId`, {
      value: this.albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `alb-sg-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-WebServerSecurityGroupId`, {
      value: this.instanceSecurityGroup.securityGroupId,
      description: 'Web Server Security Group ID',
      exportName: `web-server-sg-${this.environmentSuffix}-${region}`,
    });

    // ALB Outputs
    new cdk.CfnOutput(this, `${region}-ApplicationLoadBalancerDNS`, {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `alb-dns-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-ApplicationLoadBalancerURL`, {
      value: `http://${this.alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL',
      exportName: `alb-url-${this.environmentSuffix}-${region}`,
    });

    // Additional Infrastructure Outputs
    if (this.globalTable) {
      new cdk.CfnOutput(this, `${region}-DynamoDBTableName`, {
        value: this.globalTable.tableName,
        description: 'DynamoDB Global Table name',
        exportName: `dynamodb-global-table-${this.environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, `${region}-LogBucket`, {
      value: this.logBucket.bucketName,
      description: 'Log bucket',
      exportName: `log-bucket-${this.environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `${region}-Region`, {
      value: region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, `${region}-Environment`, {
      value: this.isProduction ? 'Production' : 'Non-Production',
      description: 'Environment type',
    });
  }
}
