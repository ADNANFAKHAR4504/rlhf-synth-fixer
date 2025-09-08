import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  allowedIpRanges: string[];
  domainName?: string;
  createHostedZone?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, allowedIpRanges, domainName, createHostedZone } =
      props;

    const kmsKey = new kms.Key(this, 'SecureCloudKMSKey', {
      alias: `secure-cloud-kms-${environmentSuffix}`,
      description: `KMS key for SecureCloud environment encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SecureCloudVPC', {
      vpcName: `SecureCloudVPC-${environmentSuffix}`,
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `Database-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // Multi-AZ NAT for high availability
    });

    // Create S3 bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(this, 'SecureCloudBucket', {
      bucketName: `secure-cloud-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'SecureCloudLogGroup', {
      logGroupName: `/aws/ec2/secure-cloud-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create IAM role for EC2 with least privilege access to S3
    const ec2Role = new iam.Role(this, 'SecureCloudEC2Role', {
      roleName: `SecureCloudEC2Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    new iam.InstanceProfile(this, 'SecureCloudInstanceProfile', {
      instanceProfileName: `SecureCloudInstanceProfile-${environmentSuffix}`,
      role: ec2Role,
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      securityGroupName: `ALBSecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for Application Load Balancer - ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow HTTP/HTTPS from allowed IP ranges
    allowedIpRanges.forEach(ipRange => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(80),
        `Allow HTTP from ${ipRange}`
      );
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(443),
        `Allow HTTPS from ${ipRange}`
      );
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      securityGroupName: `EC2SecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for EC2 instances - ${environmentSuffix}`,
      allowAllOutbound: true, // Allow outbound for updates and S3 access
    });

    // Allow traffic from ALB to EC2
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow SSH from allowed IP ranges (optional, can be removed for production)
    allowedIpRanges.forEach(ipRange => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(22),
        `Allow SSH from ${ipRange}`
      );
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      securityGroupName: `RDSSecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for RDS instances - ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow database access from EC2
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2'
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Secure Cloud Environment - ${environmentSuffix}</h1>" > /var/www/html/index.html`,

      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "httpd-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "httpd-error"
          }
        ]
      }
    }
  }
}
EOF`,
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Get latest Amazon Linux AMI
    const ami = ec2.MachineImage.latestAmazonLinux2();

    // Create EC2 instance
    const ec2Instance = new ec2.Instance(this, 'SecureCloudEC2', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Create RDS subnet group
    const rdsSubnetGroup = new rds.SubnetGroup(this, 'RDSSubnetGroup', {
      subnetGroupName: `rds-subnet-group-${environmentSuffix}`,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      description: `Subnet group for RDS instances - ${environmentSuffix}`,
    });

    // Create Multi-AZ RDS instance
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureCloudRDS', {
      instanceIdentifier: `secure-cloud-rds-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: rdsSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `secure-cloud-db-credentials-${environmentSuffix}`,
        encryptionKey: kmsKey,
      }),
      multiAz: true, // High availability
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureCloudALB', {
      loadBalancerName: `secure-cloud-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'SecureCloudTargetGroup',
      {
        targetGroupName: `secure-cloud-tg-${environmentSuffix}`,
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [new targets.InstanceTarget(ec2Instance)],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(10),
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    // Add listener to ALB
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Route 53 configuration (optional)
    if (domainName) {
      try {
        let hostedZone: route53.IHostedZone;

        if (createHostedZone) {
          // Create a new hosted zone
          hostedZone = new route53.HostedZone(this, 'HostedZone', {
            zoneName: domainName,
          });

          new cdk.CfnOutput(this, 'NameServers', {
            value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers!),
            description:
              'Name servers for the hosted zone - update your domain registrar',
          });
        } else {
          // Look up existing hosted zone
          const rootDomain = domainName.split('.').slice(-2).join('.'); // Get root domain
          hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: rootDomain,
          });
        }

        // Create A record pointing to the ALB
        new route53.ARecord(this, 'ALBARecord', {
          zone: hostedZone,
          recordName: domainName,
          target: route53.RecordTarget.fromAlias(
            new route53targets.LoadBalancerTarget(alb)
          ),
        });

        new cdk.CfnOutput(this, 'ApplicationURL', {
          value: `http://${domainName}`,
          description: 'Application URL',
        });
      } catch (error) {
        console.warn(
          `Could not configure Route 53 for domain ${domainName}: ${error}`
        );
        new cdk.CfnOutput(this, 'ApplicationURL', {
          value: `http://${alb.loadBalancerDnsName}`,
          description: 'Application URL (using ALB DNS name)',
        });
      }
    } else {
      new cdk.CfnOutput(this, 'ApplicationURL', {
        value: `http://${alb.loadBalancerDnsName}`,
        description: 'Application URL (using ALB DNS name)',
      });
    }

    // Apply tags to all resources
    const commonTags = props.tags || {};
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Add environment tag
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Endpoint',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
    });
  }
}
