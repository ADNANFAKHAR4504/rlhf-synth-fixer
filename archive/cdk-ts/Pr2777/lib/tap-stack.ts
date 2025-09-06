import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  createCertificate: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Certificate creation flag - default false to avoid validation issues
    const createCertificate = props?.createCertificate || false;

    // Certificate configuration variable (only used if createCertificate is true)
    const certificateConfig = {
      domainName: 'yourdomain.com', // Replace with your actual domain
      subjectAlternativeNames: ['*.yourdomain.com'],
      validationEmails: {
        'admin@yourdomain.com': 'yourdomain.com',
        'wildcard@yourdomain.com': '*.yourdomain.com',
      },
    };

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'WebApplication',
      ManagedBy: 'CDK',
      CostCenter: 'Engineering',
      Owner: 'Platform-Team',
    };

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(this).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(this).add('Owner', commonTags.Owner);

    // =============================================================================
    // VPC & NETWORKING
    // =============================================================================

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `ProductionVPC-${environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 2, // One NAT Gateway per AZ for high availability
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // =============================================================================
    // SECURITY GROUPS
    // =============================================================================

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      securityGroupName: `ALBSecurityGroup-${environmentSuffix}`,
      description: `Security group for Application Load Balancer - ${environmentSuffix}`,
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS traffic from internet
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `EC2SecurityGroup-${environmentSuffix}`,
      description: `Security group for EC2 instances - ${environmentSuffix}`,
      allowAllOutbound: true,
    });

    // Allow traffic from ALB to EC2 instances on port 80
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Allow SSH access for maintenance (consider removing in production)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      securityGroupName: `RDSSecurityGroup-${environmentSuffix}`,
      description: `Security group for RDS PostgreSQL database - ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access from EC2 instances
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instances'
    );

    // =============================================================================
    // IAM ROLES & POLICIES
    // =============================================================================

    // IAM Role for EC2 instances with S3 read-only access
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      roleName: `EC2InstanceRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `IAM role for EC2 instances with S3 read-only access - ${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
      ],
    });

    // Instance Profile for EC2 instances
    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `EC2InstanceProfile-${environmentSuffix}`,
      role: ec2Role,
    });

    // =============================================================================
    // SSL CERTIFICATE
    // =============================================================================

    // Create a certificate only if explicitly enabled
    let certificate: certificatemanager.Certificate | undefined;

    if (createCertificate) {
      certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
        domainName: certificateConfig.domainName,
        subjectAlternativeNames: certificateConfig.subjectAlternativeNames,
        validation: certificatemanager.CertificateValidation.fromEmail(
          certificateConfig.validationEmails
        ),
      });
    }

    // Alternative: Use DNS validation if you have a Route53 hosted zone
    // if (createCertificate) {
    //   certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
    //     domainName: certificateConfig.domainName,
    //     subjectAlternativeNames: certificateConfig.subjectAlternativeNames,
    //     validation: certificatemanager.CertificateValidation.fromDns(),
    //   });
    // }

    // =============================================================================
    // COMPUTE - AUTO SCALING GROUP
    // =============================================================================

    // User data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Web Server - Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html',
      `echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html`,
      'echo "<p>Deployed with AWS CDK</p>" >> /var/www/html/index.html'
    );

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `LaunchTemplate-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        autoScalingGroupName: `AutoScalingGroup-${environmentSuffix}`,
        vpc,
        launchTemplate,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 3,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // =============================================================================
    // APPLICATION LOAD BALANCER
    // =============================================================================

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        loadBalancerName: `ApplicationLoadBalancer-${environmentSuffix}`,
        vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: albSecurityGroup,
      }
    );

    // Target Group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `TargetGroup-${environmentSuffix}`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
      targetType: elbv2.TargetType.INSTANCE,
    });

    // HTTPS Listener with SSL certificate (only if certificate is enabled)
    if (certificate) {
      alb.addListener('HTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });
    }

    // HTTP Listener - redirect to HTTPS if certificate exists, otherwise serve directly
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: certificate
        ? elbv2.ListenerAction.redirect({
            protocol: 'HTTPS',
            port: '443',
            permanent: true,
          })
        : elbv2.ListenerAction.forward([targetGroup]),
    });
    // =============================================================================
    // DATABASE - RDS POSTGRESQL
    // =============================================================================

    // Subnet Group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: `DBSubnetGroup-${environmentSuffix}`,
      vpc,
      description: `Subnet group for RDS PostgreSQL database - ${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Parameter Group for PostgreSQL optimization
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      name: `DBParameterGroup-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      description: `Parameter group for PostgreSQL 14.9 - ${environmentSuffix}`,
    });

    // RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, 'PostgreSQLDatabase', {
      instanceIdentifier: `PostgreSQLDatabase-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `production-db-credentials-${environmentSuffix}`,
      }),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true,
      multiAz: true, // High availability
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      parameterGroup: dbParameterGroup,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      databaseName: 'productiondb',
    });

    // =============================================================================
    // OUTPUTS
    // =============================================================================

    // Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `ProductionVPCId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `ProductionALBDNS-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL database endpoint',
      exportName: `ProductionDBEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `ProductionASGName-${environmentSuffix}`,
    });

    // Only output certificate ARN if certificate was created
    if (certificate) {
      new cdk.CfnOutput(this, 'CertificateArn', {
        value: certificate.certificateArn,
        description: 'SSL Certificate ARN',
        exportName: `ProductionCertificateArn-${environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, 'AccessUrl', {
      value: certificate
        ? `https://${alb.loadBalancerDnsName}`
        : `http://${alb.loadBalancerDnsName}`,
      description: 'Application access URL',
      exportName: `ProductionAccessUrl-${environmentSuffix}`,
    });
  }
}
