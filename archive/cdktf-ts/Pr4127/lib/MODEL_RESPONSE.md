```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, TerraformVariable } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessIdentity } from '@cdktf/provider-aws/lib/cloudfront-origin-access-identity';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

class WordPressStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Provider configuration
    new AwsProvider(this, 'aws', {
      region: 'us-east-2',
    });

    // Common tags
    const commonTags = {
      Project: 'iac-rlhf-amazon',
    };

    // Parameters
    const dbUser = new TerraformVariable(this, 'DBUser', {
      type: 'string',
      description: 'Database master username',
      default: 'wpdbadmin',
    });

    const dbPassword = new TerraformVariable(this, 'DBPassword', {
      type: 'string',
      description: 'Database master password',
      sensitive: true,
      default: 'WordPr3ss!2024',
    });

    // Get latest Amazon Linux 2 AMI
    const latestAmi = new DataAwsAmi(this, 'latest-ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // 1. NETWORKING

    // Create VPC
    const vpc = new Vpc(this, 'wordpress-vpc', {
      cidrBlock: '10.15.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: 'wordpress-vpc',
      },
    });

    // Create public subnet
    const publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: vpc.id,
      cidrBlock: '10.15.1.0/24',
      availabilityZone: 'us-east-2a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: 'public-subnet',
      },
    });

    // Create private subnet for RDS (required for DB subnet group)
    const privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: vpc.id,
      cidrBlock: '10.15.2.0/24',
      availabilityZone: 'us-east-2b',
      mapPublicIpOnLaunch: false,
      tags: {
        ...commonTags,
        Name: 'private-subnet',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'internet-gateway', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'wordpress-igw',
      },
    });

    // Create Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'public-route-table',
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate route table with public subnet
    new RouteTableAssociation(this, 'public-route-table-association', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // 5. SECURITY GROUPS

    // Create Web Server Security Group
    const webServerSG = new SecurityGroup(this, 'WebServerSG', {
      name: 'WebServerSG',
      description: 'Security group for WordPress web server',
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'WebServerSG',
      },
    });

    // Add inbound rule for HTTP
    new SecurityGroupRule(this, 'web-server-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webServerSG.id,
    });

    // Add outbound rule for web server
    new SecurityGroupRule(this, 'web-server-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webServerSG.id,
    });

    // Create Database Security Group
    const databaseSG = new SecurityGroup(this, 'DatabaseSG', {
      name: 'DatabaseSG',
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'DatabaseSG',
      },
    });

    // Add inbound rule for MySQL from Web Server SG only
    new SecurityGroupRule(this, 'database-mysql-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: webServerSG.id,
      securityGroupId: databaseSG.id,
    });

    // 4. STORAGE (S3)

    // Create S3 bucket for media uploads
    const mediaBucket = new S3Bucket(this, 'wordpress-media-bucket', {
      bucketPrefix: 'wordpress-media-',
      tags: commonTags,
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'media-bucket-pab', {
      bucket: mediaBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'media-bucket-versioning', {
      bucket: mediaBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // 2. APPLICATION SERVER (EC2)

    // Create IAM Role for EC2
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'wordpress-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // Attach S3 policy to role
    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: 'wordpress-s3-policy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${mediaBucket.arn}/*`,
          },
        ],
      }),
    });

    // Create Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'wordpress-instance-profile',
        role: ec2Role.name,
        tags: commonTags,
      }
    );

    // 3. DATABASE (RDS)

    // Create DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'wordpress-db-subnet-group',
      subnetIds: [publicSubnet.id, privateSubnet.id],
      tags: {
        ...commonTags,
        Name: 'wordpress-db-subnet-group',
      },
    });

    // Create RDS MySQL instance
    const database = new DbInstance(this, 'wordpress-database', {
      identifier: 'wordpress-db',
      engine: 'mysql',
      engineVersion: '8.0.35',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'wordpress',
      username: dbUser.value,
      password: dbPassword.value,
      vpcSecurityGroupIds: [databaseSG.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      tags: {
        ...commonTags,
        Name: 'wordpress-database',
      },
    });

    // User Data script for EC2
    const userDataScript = `#!/bin/bash
# Update system
yum update -y

# Install Apache, PHP, and MySQL client
amazon-linux-extras install -y php7.4
yum install -y httpd mysql

# Start Apache
systemctl start httpd
systemctl enable httpd

# Install WordPress
cd /var/www/html
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
cp -r wordpress/* .
rm -rf wordpress latest.tar.gz

# Set permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Create wp-config.php
cat > /var/www/html/wp-config.php << 'EOF'
<?php
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', '${dbUser.value}' );
define( 'DB_PASSWORD', '${dbPassword.value}' );
define( 'DB_HOST', '${database.endpoint}' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

\$table_prefix = 'wp_';

define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
EOF

# Restart Apache
systemctl restart httpd`;

    // Create EC2 Instance
    const webServer = new Instance(this, 'wordpress-web-server', {
      ami: latestAmi.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [webServerSG.id],
      iamInstanceProfile: instanceProfile.name,
      associatePublicIpAddress: true,
      userData: Buffer.from(userDataScript).toString('base64'),
      tags: {
        ...commonTags,
        Name: 'wordpress-web-server',
      },
    });

    // 6. CONTENT DELIVERY (CloudFront)

    // Create Origin Access Identity
    const oai = new CloudfrontOriginAccessIdentity(this, 'cloudfront-oai', {
      comment: 'OAI for WordPress media bucket',
    });

    // Create bucket policy for CloudFront
    new S3BucketPolicy(this, 'media-bucket-policy', {
      bucket: mediaBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontAccess',
            Effect: 'Allow',
            Principal: {
              AWS: oai.iamArn,
            },
            Action: 's3:GetObject',
            Resource: `${mediaBucket.arn}/*`,
          },
        ],
      }),
    });

    // Create CloudFront Distribution
    const distribution = new CloudfrontDistribution(this, 'wordpress-cdn', {
      enabled: true,
      isIpv6Enabled: true,
      comment: 'WordPress media CDN',
      defaultRootObject: 'index.html',

      origin: [
        {
          domainName: mediaBucket.bucketRegionalDomainName,
          originId: 'S3-${mediaBucket.id}',
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
      ],

      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 'S3-${mediaBucket.id}',
        viewerProtocolPolicy: 'redirect-to-https',

        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },

        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000,
      },

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      tags: commonTags,
    });

    // 7. MONITORING (CloudWatch)

    // Create SNS Topic for alerts
    const alarmTopic = new SnsTopic(this, 'cpu-alarm-topic', {
      name: 'wordpress-cpu-alarms',
      tags: commonTags,
    });

    // Create CloudWatch Alarm for CPU
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: 'wordpress-high-cpu',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'Alarm when CPU exceeds 70%',
      dimensions: {
        InstanceId: webServer.id,
      },
      alarmActions: [alarmTopic.arn],
      tags: commonTags,
    });

    // 8. OUTPUTS

    new TerraformOutput(this, 'WebsiteURL', {
      value: `http://${webServer.publicIp}`,
      description: 'URL of the WordPress website',
    });

    new TerraformOutput(this, 'S3BucketName', {
      value: mediaBucket.id,
      description: 'Name of the S3 bucket for media uploads',
    });

    new TerraformOutput(this, 'CloudFrontDomainName', {
      value: distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'DatabaseEndpoint', {
      value: database.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'EC2InstanceId', {
      value: webServer.id,
      description: 'EC2 instance ID',
    });
  }
}

// Initialize the app
const app = new App();
new WordPressStack(app, 'wordpress-stack');
app.synth();
```
