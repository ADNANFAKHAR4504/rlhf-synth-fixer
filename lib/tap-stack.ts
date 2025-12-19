import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as applicationinsights from 'aws-cdk-lib/aws-applicationinsights';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as resourcegroups from 'aws-cdk-lib/aws-resourcegroups';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  enableApplicationInsights?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Application Insights is a Pro/Enterprise feature in LocalStack
    const enableApplicationInsights = props?.enableApplicationInsights ?? false;

    // Create VPC with CIDR 10.0.0.0/16
    // Note: NAT Gateway support in LocalStack Community is limited
    // Using PRIVATE_ISOLATED instead of PRIVATE_WITH_EGRESS to avoid NAT Gateway requirement
    const vpc = new ec2.Vpc(this, 'MigrationVpc', {
      vpcName: `migration-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      // Explicitly specify availability zones to prevent CDK from calling EC2 DescribeAvailabilityZones API
      // This is required because EC2 service is not enabled in the LocalStack GitHub Actions container
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // No NAT Gateway for LocalStack
        },
      ],
      natGateways: 0, // Disable NAT Gateways for LocalStack compatibility
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for EC2 instance allowing HTTP/HTTPS
    const webServerSg = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc,
      securityGroupName: `web-server-sg-${environmentSuffix}`,
      description: 'Security group for web server allowing HTTP/HTTPS traffic',
      allowAllOutbound: true,
    });

    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webServerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Remove SSH access rule since we're using Session Manager
    // webServerSg.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(22),
    //   'Allow SSH access'
    // );

    // Enhanced IAM Role for EC2 instance with S3 access and Session Manager permissions
    const ec2Role = new iam.Role(this, 'EC2S3Role', {
      roleName: `ec2-s3-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instance with S3 access and Session Manager permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // CloudWatch Log Group for application logs
    const appLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/migration-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Log Group for Session Manager logs
    const sessionLogGroup = new logs.LogGroup(this, 'SessionManagerLogGroup', {
      logGroupName: `/aws/ssm/session-manager-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EC2 Instance with latest Amazon Linux 2 AMI and enhanced monitoring
    const webServer = new ec2.Instance(this, 'WebServerInstance', {
      vpc,
      instanceName: `web-server-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webServerSg,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
    });

    // Enhanced user data to install web server and CloudWatch agent
    webServer.userData.addCommands(
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Migration Server Ready</h1>" > /var/www/html/index.html',
      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/migration-app-${environmentSuffix}",
            "log_stream_name": "{instance_id}/httpd/access.log"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/migration-app-${environmentSuffix}",
            "log_stream_name": "{instance_id}/httpd/error.log"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "Migration/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF`,
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Session Manager document for logging configuration
    new ssm.CfnDocument(this, 'SessionManagerPreferences', {
      documentType: 'Session',
      documentFormat: 'JSON',
      name: `SSM-SessionManagerRunShell-${environmentSuffix}`,
      content: {
        schemaVersion: '1.0',
        description: 'Document to hold regional settings for Session Manager',
        sessionType: 'Standard_Stream',
        inputs: {
          s3BucketName: '',
          s3KeyPrefix: '',
          s3EncryptionEnabled: true,
          cloudWatchLogGroupName: sessionLogGroup.logGroupName,
          cloudWatchEncryptionEnabled: false,
          cloudWatchStreamingEnabled: true,
          kmsKeyId: '',
          runAsEnabled: false,
          runAsDefaultUser: '',
          idleSessionTimeout: '20',
          maxSessionDuration: '60',
          shellProfile: {
            windows: '',
            linux: 'cd /home/ec2-user; pwd; ls -la',
          },
        },
      },
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        securityGroupName: `database-sg-${environmentSuffix}`,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(webServerSg.securityGroupId),
      ec2.Port.tcp(3306),
      'Allow MySQL access from web server'
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      subnetGroupName: `database-subnet-group-${environmentSuffix}`,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Updated for LocalStack compatibility
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Instance in private subnet with automated backups
    const database = new rds.DatabaseInstance(this, 'MigrationDatabase', {
      instanceIdentifier: `migration-database-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: 'migrationdb',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `migration-db-credentials-${environmentSuffix}`,
      }),
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      multiAz: false,
      publiclyAccessible: false,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Enhanced monitoring may not be fully supported in LocalStack Community
      monitoringInterval: cdk.Duration.seconds(0), // Disable enhanced monitoring for LocalStack
      // Performance Insights not supported for t3.micro instances
      enablePerformanceInsights: false,
    });

    // S3 Bucket for application logs with blocked public access
    const logsBucket = new s3.Bucket(this, 'ApplicationLogsBucket', {
      bucketName: `migration-app-logs-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudWatch Application Insights is a Pro/Enterprise feature in LocalStack
    // Only create these resources if explicitly enabled
    if (enableApplicationInsights) {
      // Create Resource Group for Application Insights
      const resourceGroup = new resourcegroups.CfnGroup(
        this,
        'MigrationResourceGroup',
        {
          name: `migration-resources-${environmentSuffix}`,
          description: 'Resource group for migration application monitoring',
          resourceQuery: {
            type: 'TAG_FILTERS_1_0',
            query: {
              resourceTypeFilters: ['AWS::AllSupported'],
              tagFilters: [
                {
                  key: 'Environment',
                  values: [environmentSuffix],
                },
              ],
            },
          },
          tags: [
            {
              key: 'Environment',
              value: environmentSuffix,
            },
            {
              key: 'Application',
              value: 'Migration',
            },
          ],
        }
      );

      // CloudWatch Application Insights Application
      const appInsights = new applicationinsights.CfnApplication(
        this,
        'MigrationAppInsights',
        {
          resourceGroupName: resourceGroup.name!,
          autoConfigurationEnabled: true,
          cweMonitorEnabled: true,
          opsCenterEnabled: true,
          tags: [
            {
              key: 'Environment',
              value: environmentSuffix,
            },
            {
              key: 'Application',
              value: 'Migration',
            },
          ],
        }
      );

      // Ensure resource group is created before Application Insights
      appInsights.addDependency(resourceGroup);

      // Output for Application Insights resource group
      new cdk.CfnOutput(this, 'ApplicationInsightsResourceGroupName', {
        value: resourceGroup.name!,
        description: 'CloudWatch Application Insights resource group name',
      });
    }

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the migration VPC',
    });

    new cdk.CfnOutput(this, 'WebServerInstanceId', {
      value: webServer.instanceId,
      description: 'ID of the web server EC2 instance',
    });

    new cdk.CfnOutput(this, 'WebServerPublicIp', {
      value: webServer.instancePublicIp,
      description: 'Public IP address of the web server',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket name for application logs',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecret', {
      value: database.secret?.secretName || 'N/A',
      description: 'AWS Secrets Manager secret name for database credentials',
    });

    new cdk.CfnOutput(this, 'SessionManagerLogGroupName', {
      value: sessionLogGroup.logGroupName,
      description: 'CloudWatch log group for Session Manager sessions',
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: appLogGroup.logGroupName,
      description: 'CloudWatch log group for application logs',
    });
  }
}
