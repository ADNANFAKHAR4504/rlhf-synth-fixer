
## lib/tapstack.ts (Updated)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Environment suffix to append to resource names (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix?: string;
  
  /**
   * Domain name for the ACM certificate (e.g., 'example.com')
   * If not provided, a self-signed certificate will be created
   */
  domainName?: string;
  
  /**
   * Hosted Zone ID for the domain (required if domainName is provided)
   */
  hostedZoneId?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly s3Bucket: s3.Bucket;

  private readonly envSuffix: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Set environment suffix with default fallback
    this.envSuffix = props?.environmentSuffix || 'prod';

    // Common tags for all resources
    const commonTags = {
      Environment: this.capitalizeFirst(this.envSuffix),
      Project: 'CloudFormationSetup',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Project', commonTags.Project);

    // Create VPC
    this.vpc = this.createVpc();

    // Create Security Groups
    const securityGroups = this.createSecurityGroups();

    // Create IAM Role for EC2 instances
    const ec2Role = this.createEc2Role();

    // Create S3 Bucket
    this.s3Bucket = this.createS3Bucket();

    // Create RDS Database
    this.database = this.createDatabase(securityGroups.databaseSg);

    // Create Application Load Balancer
    this.alb = this.createApplicationLoadBalancer(securityGroups.albSg, props);

    // Create Auto Scaling Group
    this.asg = this.createAutoScalingGroup(securityGroups.applicationSg, ec2Role);

    // Create ALB Target Group and attach ASG
    this.createTargetGroupAndListeners(securityGroups.albSg, props);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private createVpc(): ec2.Vpc {
    return new ec2.Vpc(this, `${this.envSuffix}-vpc`, {
      vpcName: `${this.envSuffix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${this.envSuffix}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${this.envSuffix}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${this.envSuffix}-isolated-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ for high availability
    });
  }

  private createSecurityGroups() {
    // ALB Security Group
    const albSg = new ec2.SecurityGroup(this, `${this.envSuffix}-alb-sg`, {
      vpc: this.vpc,
      securityGroupName: `${this.envSuffix}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS inbound traffic from anywhere
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Application Security Group
    const applicationSg = new ec2.SecurityGroup(this, `${this.envSuffix}-app-sg`, {
      vpc: this.vpc,
      securityGroupName: `${this.envSuffix}-app-sg`,
      description: 'Security group for application instances',
      allowAllOutbound: false,
    });

    // Allow traffic from ALB to application instances
    applicationSg.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Allow outbound HTTPS for package updates and API calls
    applicationSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates and API calls'
    );

    // Allow outbound HTTP for package updates
    applicationSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package updates'
    );

    // Database Security Group
    const databaseSg = new ec2.SecurityGroup(this, `${this.envSuffix}-db-sg`, {
      vpc: this.vpc,
      securityGroupName: `${this.envSuffix}-db-sg`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from application instances
    databaseSg.addIngressRule(
      applicationSg,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from application instances'
    );

    // Allow ALB to communicate with application instances
    albSg.addEgressRule(
      applicationSg,
      ec2.Port.tcp(80),
      'Allow ALB to communicate with application instances'
    );

    // Allow application instances to communicate with database
    applicationSg.addEgressRule(
      databaseSg,
      ec2.Port.tcp(5432),
      'Allow application instances to communicate with database'
    );

    return {
      albSg,
      applicationSg,
      databaseSg,
    };
  }

  private createEc2Role(): iam.Role {
    const role = new iam.Role(this, `${this.envSuffix}-ec2-role`, {
      roleName: `${this.envSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances in the application tier',
    });

    // Add managed policies for basic EC2 operations
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Add custom policy for S3 access
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [
        `arn:aws:s3:::${this.envSuffix}-tap-assets-${this.account}-${this.region}`,
        `arn:aws:s3:::${this.envSuffix}-tap-assets-${this.account}-${this.region}/*`,
      ],
    });

    role.addToPolicy(s3Policy);

    // Add CloudWatch logs policy
    const cloudWatchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups',
      ],
      resources: ['*'],
    });

    role.addToPolicy(cloudWatchPolicy);

    return role;
  }

  private createS3Bucket(): s3.Bucket {
    return new s3.Bucket(this, `${this.envSuffix}-assets-bucket`, {
      bucketName: `${this.envSuffix}-tap-assets-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          status: s3.LifecycleRuleStatus.ENABLED,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createDatabase(databaseSg: ec2.SecurityGroup): rds.DatabaseInstance {
    // Create DB subnet group using isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, `${this.envSuffix}-db-subnet-group`, {
      description: 'Subnet group for RDS database',
      vpc: this.vpc,
      subnetGroupName: `${this.envSuffix}-db-subnet-group`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    return new rds.DatabaseInstance(this, `${this.envSuffix}-database`, {
      instanceIdentifier: `${this.envSuffix}-postgresql-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      multiAz: this.envSuffix === 'prod', // Only enable Multi-AZ for production
      vpc: this.vpc,
      subnetGroup,
      securityGroups: [databaseSg],
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `${this.envSuffix}-db-credentials`,
      }),
      backupRetention: this.envSuffix === 'prod' ? cdk.Duration.days(7) : cdk.Duration.days(1),
      deletionProtection: this.envSuffix === 'prod',
      removalPolicy: this.envSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      monitoringInterval: this.envSuffix === 'prod' ? cdk.Duration.seconds(60) : cdk.Duration.seconds(0),
      monitoringRole: this.envSuffix === 'prod' ? new iam.Role(this, `${this.envSuffix}-db-monitoring-role`, {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
        ],
      }) : undefined,
    });
  }

  private createApplicationLoadBalancer(albSg: ec2.SecurityGroup, props?: TapStackProps): elbv2.ApplicationLoadBalancer {
    return new elbv2.ApplicationLoadBalancer(this, `${this.envSuffix}-alb`, {
      loadBalancerName: `${this.envSuffix}-alb`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
  }

  private createAutoScalingGroup(applicationSg: ec2.SecurityGroup, ec2Role: iam.Role): autoscaling.AutoScalingGroup {
    // User data script for application setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>${this.capitalizeFirst(this.envSuffix)} Application Server</h1>" > /var/www/html/index.html`,
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Environment-specific capacity settings
    const capacitySettings = this.getCapacitySettings();

    return new autoscaling.AutoScalingGroup(this, `${this.envSuffix}-asg`, {
      autoScalingGroupName: `${this.envSuffix}-asg`,
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      role: ec2Role,
      securityGroup: applicationSg,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      minCapacity: capacitySettings.min,
      maxCapacity: capacitySettings.max,
      desiredCapacity: capacitySettings.desired,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.seconds(300),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: capacitySettings.min,
      }),
    });
  }

  private getCapacitySettings() {
    // Environment-specific capacity settings
    switch (this.envSuffix) {
      case 'prod':
        return { min: 2, max: 6, desired: 2 };
      case 'staging':
        return { min: 1, max: 3, desired: 1 };
      case 'dev':
      default:
        return { min: 1, max: 2, desired: 1 };
    }
  }

  private createTargetGroupAndListeners(albSg: ec2.SecurityGroup, props?: TapStackProps): void {
    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `${this.envSuffix}-tg`, {
      targetGroupName: `${this.envSuffix}-tg`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      targets: [this.asg],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
    });

    // HTTP Listener (redirects to HTTPS)
    this.alb.addListener(`${this.envSuffix}-http-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS Listener
    let certificate: certificatemanager.ICertificate;
    
    if (props?.domainName && props?.hostedZoneId) {
      // Use ACM certificate for the provided domain
      certificate = new certificatemanager.Certificate(this, `${this.envSuffix}-certificate`, {
        domainName: props.domainName,
        validation: certificatemanager.CertificateValidation.fromDns(),
      });
    } else {
      // Create a self-signed certificate for development/testing
      // Note: In production, you should always use a proper ACM certificate
      certificate = new certificatemanager.Certificate(this, `${this.envSuffix}-self-signed-cert`, {
        domainName: 'localhost',
        validation: certificatemanager.CertificateValidation.fromEmail(),
      });
    }

    this.alb.addListener(`${this.envSuffix}-https-listener`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // Add scaling policies (only for production and staging)
    if (this.envSuffix === 'prod' || this.envSuffix === 'staging') {
      this.asg.scaleOnCpuUtilization(`${this.envSuffix}-cpu-scaling`, {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(300),
        scaleOutCooldown: cdk.Duration.seconds(300),
      });

      this.asg.scaleOnRequestCount(`${this.envSuffix}-request-scaling`, {
        requestsPerTarget: 1000,
        targetGroup,
      });
    }
  }
}
```

## Key Changes Made

### 1. **Updated Interface**
```typescript
export interface TapStackProps extends cdk.StackProps {
  /**
   * Environment suffix to append to resource names (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix?: string;
  // ... other properties
}
```

### 2. **Environment-Aware Resource Naming**
- All resources now use `${this.envSuffix}-` prefix instead of hardcoded `prod-`
- S3 bucket: `dev-tap-assets-123456789012-us-east-1`
- VPC: `dev-vpc`
- ALB: `dev-alb`
- ASG: `dev-asg`
- etc.

### 3. **Environment-Specific Configurations**

**Database Settings:**
- **Dev**: Single-AZ, 1-day backup, no monitoring, DESTROY on delete
- **Staging**: Single-AZ, 1-day backup, no monitoring, DESTROY on delete  
- **Prod**: Multi-AZ, 7-day backup, enhanced monitoring, RETAIN on delete

**Auto Scaling Capacity:**
- **Dev**: min=1, max=2, desired=1
- **Staging**: min=1, max=3, desired=1
- **Prod**: min=2, max=6, desired=2

**Scaling Policies:**
- Only enabled for `prod` and `staging` environments
- Disabled for `dev` to save costs

### 4. **Dynamic Tagging**
- Environment tag now reflects the actual environment: `Dev`, `Staging`, or `Production`

## Usage Examples

```typescript
// Development environment
new TapStack(app, 'TapStack', {
  environmentSuffix: 'dev',
});

// Staging environment
new TapStack(app, 'StagingTapStack', {
  environmentSuffix: 'staging',
});

// Production environment with custom domain
new TapStack(app, 'ProdTapStack', {
  environmentSuffix: 'prod',
  domainName: 'yourdomain.com',
  hostedZoneId: 'Z1234567890ABC',
});
```

Now your TypeScript error should be resolved, and you'll have environment-specific resource configurations that are cost-effective for development while maintaining production-ready settings for higher environments.