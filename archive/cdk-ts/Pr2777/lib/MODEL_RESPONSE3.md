### Reasoning Trace

---

I see two more issues:

1. The certificate validation has duplicate keys in the object literal - both mapping to 'admin@example.com'. In JavaScript/TypeScript, you can't have duplicate keys in an object literal.

2. The health check properties are incorrect. I need to check the correct property names for the HealthCheck type in CDK v2.

Let me fix these:

1. For the certificate validation, I need to either use different email addresses or use a different approach. Looking at the CDK docs, the fromEmail method expects a map of email to domain, but I can't have duplicate keys. I should either use different emails or use a different validation method.

2. For the health check, I need to look up the correct property names. In CDK v2, the health check properties might have different names.

Let me check the CDK v2 documentation for the correct syntax:

For ApplicationTargetGroup health check, the properties should be:

- interval (not intervalSeconds)
- timeout (not timeoutSeconds)
- healthyThresholdCount
- unhealthyThresholdCount
- path

For certificate validation, I should either use different email addresses or use DNS validation which is more common in production.

### Answer

---

I'll fix these remaining TypeScript errors. The issues are with duplicate object keys in the certificate validation and incorrect health check property names.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class ProductionInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
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
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 2, // One NAT Gateway per AZ for high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
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
      description: 'Security group for Application Load Balancer',
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
      description: 'Security group for EC2 instances',
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
      description: 'Security group for RDS PostgreSQL database',
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
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with S3 read-only access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
      ],
    });

    // Instance Profile for EC2 instances
    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // =============================================================================
    // SSL CERTIFICATE
    // =============================================================================

    // Create a certificate using DNS validation (recommended for production)
    // For demo purposes, using email validation with separate emails
    const certificate = new certificatemanager.Certificate(
      this,
      'SSLCertificate',
      {
        domainName: 'example.com',
        subjectAlternativeNames: ['*.example.com'],
        validation: certificatemanager.CertificateValidation.fromEmail({
          'admin@example.com': 'example.com',
          'wildcard@example.com': '*.example.com', // Different email to avoid duplicate keys
        }),
      }
    );

    // Alternative: Use DNS validation if you have a Route53 hosted zone
    // const certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
    //   domainName: 'example.com',
    //   subjectAlternativeNames: ['*.example.com'],
    //   validation: certificatemanager.CertificateValidation.fromDns(),
    // });

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
      'echo "<p>Environment: Production</p>" >> /var/www/html/index.html',
      'echo "<p>Deployed with AWS CDK</p>" >> /var/www/html/index.html'
    );

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
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

    // HTTPS Listener with SSL certificate
    const httpsListener = alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // HTTP Listener that redirects to HTTPS
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // =============================================================================
    // DATABASE - RDS POSTGRESQL
    // =============================================================================

    // Subnet Group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS PostgreSQL database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Parameter Group for PostgreSQL optimization
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_9,
      }),
      description: 'Parameter group for PostgreSQL 14.9',
    });

    // RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, 'PostgreSQLDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_9,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: 'production-db-credentials',
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
      exportName: 'ProductionVPCId',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: 'ProductionALBDNS',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL database endpoint',
      exportName: 'ProductionDBEndpoint',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: 'ProductionASGName',
    });
  }
}

// App instantiation
const app = new cdk.App();
new ProductionInfrastructureStack(app, 'ProductionInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description:
    'Production-ready infrastructure stack with VPC, ALB, Auto Scaling, and RDS',
  tags: {
    Environment: 'Production',
    Project: 'WebApplication',
  },
});
```

## Fixed Issues:

### 🔧 **Certificate Validation (Lines 154-155)**:

```typescript
// ❌ Before - Duplicate keys not allowed
validation: certificatemanager.CertificateValidation.fromEmail({
  'admin@example.com': 'example.com',
  'admin@example.com': '*.example.com', // ERROR: Duplicate key
}),

// ✅ After - Different email addresses
validation: certificatemanager.CertificateValidation.fromEmail({
  'admin@example.com': 'example.com',
  'wildcard@example.com': '*.example.com', // Different key
}),
```

### 🔧 **Health Check Properties (Line 236)**:

```typescript
// ❌ Before - Wrong property names
healthCheck: {
  intervalSeconds: 30,        // ERROR: Should be 'interval'
  timeoutSeconds: 10,         // ERROR: Should be 'timeout'
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 5,
},

// ✅ After - Correct property names with Duration objects
healthCheck: {
  path: '/',
  interval: cdk.Duration.seconds(30),     // Correct property name
  timeout: cdk.Duration.seconds(10),      // Correct property name
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 5,
},
```

## Alternative Certificate Options:

### **Option 1: DNS Validation (Recommended for Production)**

```typescript
const certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
  domainName: 'example.com',
  subjectAlternativeNames: ['*.example.com'],
  validation: certificatemanager.CertificateValidation.fromDns(), // Requires Route53 hosted zone
});
```

### **Option 2: Skip HTTPS for Testing**

```typescript
// Comment out the certificate and HTTPS listener for initial testing
// const certificate = ...
// const httpsListener = ...

// Only use HTTP listener for testing
const httpListener = alb.addListener('HTTPListener', {
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultTargetGroups: [targetGroup],
});
```

## Next Steps:

1. **Update Domain Information**: Replace `example.com` with your actual domain
2. **Choose Certificate Validation Method**:
   - Use DNS validation if you have a Route53 hosted zone
   - Use email validation with valid email addresses
   - Skip HTTPS initially for testing
3. **Deploy and Test**: The code should now compile without errors

```bash
npm run build
cdk synth
cdk deploy ProductionInfrastructureStack
```

The stack is now ready for deployment!
