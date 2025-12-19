import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';

export class WordpressStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const region = 'us-east-2';
    const commonTags = { Project: 'iac-rlhf-amazon' };

    new AwsProvider(this, 'aws', { region });
    new RandomProvider(this, 'random');

    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const dbUser = 'wpadmin';

    // FIX: Use a Data Source to automatically find the latest Amazon Linux 2 AMI.
    // This removes the hardcoded AMI ID.
    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-2.0.*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Securely Create and Store DB Password
    const dbPassword = new Password(this, 'DbPassword', {
      length: 20,
      special: true,
      overrideSpecial: '_-#.',
    });

    const dbSecret = new SecretsmanagerSecret(this, 'DbSecret', {
      name: `wordpress-db-secret-${randomSuffix}`,
      tags: commonTags,
    });
    const dbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'DbSecretVersion',
      {
        secretId: dbSecret.id,
        secretString: Fn.jsonencode({
          username: dbUser,
          password: dbPassword.result,
        }),
      }
    );

    // Networking
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.15.0.0/16',
      tags: commonTags,
    });
    const subnetA = new Subnet(this, 'PublicSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.15.1.0/24',
      mapPublicIpOnLaunch: true,
      availabilityZone: `${region}a`,
      tags: commonTags,
    });
    const subnetB = new Subnet(this, 'PublicSubnetB', {
      vpcId: vpc.id,
      cidrBlock: '10.15.2.0/24',
      mapPublicIpOnLaunch: true,
      availabilityZone: `${region}b`,
      tags: commonTags,
    });

    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: commonTags,
    });
    const routeTable = new RouteTable(this, 'RouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: commonTags,
    });
    new RouteTableAssociation(this, 'RouteTableAssociationA', {
      subnetId: subnetA.id,
      routeTableId: routeTable.id,
    });
    new RouteTableAssociation(this, 'RouteTableAssociationB', {
      subnetId: subnetB.id,
      routeTableId: routeTable.id,
    });

    // Security Groups
    const webServerSg = new SecurityGroup(this, 'WebServerSG', {
      vpcId: vpc.id,
      name: `WebServerSG-${randomSuffix}`,
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
    const databaseSg = new SecurityGroup(this, 'DatabaseSG', {
      vpcId: vpc.id,
      name: `DatabaseSG-${randomSuffix}`,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [webServerSg.id],
        },
      ],
      tags: commonTags,
    });

    // Storage (S3)
    const bucket = new S3Bucket(this, 'S3Bucket', {
      bucket: `wordpress-media-${randomSuffix}`,
      tags: commonTags,
    });

    // IAM Role for EC2
    const s3AccessPolicy = new IamPolicy(this, 'S3AccessPolicy', {
      name: `s3-access-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${bucket.arn}/*`,
          },
        ],
      }),
    });
    const secretsManagerPolicy = new IamPolicy(this, 'SecretsManagerPolicy', {
      name: `secrets-manager-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'secretsmanager:GetSecretValue',
            Resource: dbSecret.arn,
          },
        ],
      }),
    });
    const ec2Role = new IamRole(this, 'EC2Role', {
      name: `ec2-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });
    new IamRolePolicyAttachment(this, 'S3PolicyAttachment', {
      role: ec2Role.name,
      policyArn: s3AccessPolicy.arn,
    });
    new IamRolePolicyAttachment(this, 'SecretsManagerPolicyAttachment', {
      role: ec2Role.name,
      policyArn: secretsManagerPolicy.arn,
    });
    const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
      name: `instance-profile-${randomSuffix}`,
      role: ec2Role.name,
    });

    // Database (RDS)
    const dbInstance = new DbInstance(this, 'RDSInstance', {
      identifier: `wordpress-db-${randomSuffix}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'wordpressdb',
      username: dbUser,
      password: dbPassword.result,
      vpcSecurityGroupIds: [databaseSg.id],
      dbSubnetGroupName: new DbSubnetGroup(this, 'DbSubnetGroup', {
        name: `db-subnet-group-${randomSuffix}`,
        subnetIds: [subnetA.id, subnetB.id],
        tags: commonTags,
      }).name,
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      tags: commonTags,
      dependsOn: [dbSecretVersion],
    });

    // User Data Script for EC2
    const userDataScript = `#!/bin/bash -xe
yum update -y
yum install -y httpd php php-mysqlnd jq

wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
cp -r wordpress/* /var/www/html/

chown -R apache:apache /var/www/html/
chmod -R 755 /var/www/html/

SECRET_ARN="${dbSecret.arn}"
REGION="${region}"
DB_USER="${dbUser}"
DB_HOST="${dbInstance.address}"
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$REGION" | jq -r '.SecretString' | jq -r '.password')

cat << EOF > /var/www/html/wp-config.php
<?php
define( 'DB_NAME', 'wordpressdb' );
define( 'DB_USER', '$DB_USER' );
define( 'DB_PASSWORD', '$DB_PASSWORD' );
define( 'DB_HOST', '$DB_HOST' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );
define('FS_METHOD', 'direct');
\\$table_prefix = 'wp_';
define( 'WP_DEBUG', false );
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
EOF

systemctl start httpd
systemctl enable httpd
`;

    const ec2Instance = new Instance(this, 'EC2Instance', {
      ami: ami.id, // Use the AMI ID from the data source
      instanceType: 't3.micro',
      subnetId: subnetA.id,
      vpcSecurityGroupIds: [webServerSg.id],
      iamInstanceProfile: instanceProfile.name,
      userData: userDataScript,
      tags: commonTags,
    });

    // Content Delivery (CloudFront)
    const cfDistribution = new CloudfrontDistribution(
      this,
      'CloudFrontDistribution',
      {
        origin: [
          { domainName: bucket.bucketRegionalDomainName, originId: bucket.id },
        ],
        enabled: true,
        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: bucket.id,
          forwardedValues: { queryString: false, cookies: { forward: 'none' } },
          viewerProtocolPolicy: 'allow-all',
        },
        restrictions: { geoRestriction: { restrictionType: 'none' } },
        viewerCertificate: { cloudfrontDefaultCertificate: true },
        tags: commonTags,
      }
    );

    // Monitoring (CloudWatch)
    // **FIX**: Assigned the alarm resource to the constant 'cpuAlarm'
    const cpuAlarm = new CloudwatchMetricAlarm(this, 'CPUAlarm', {
      alarmName: `High-CPU-Utilization-${randomSuffix}`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 5,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 60,
      statistic: 'Average',
      threshold: 70,
      dimensions: { InstanceId: ec2Instance.id },
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, 'WebsiteURL', {
      value: `http://${ec2Instance.publicDns}`,
    });
    new TerraformOutput(this, 'S3BucketName', { value: bucket.bucket });
    new TerraformOutput(this, 'CloudFrontDomainName', {
      value: cfDistribution.domainName,
    });
    new TerraformOutput(this, 'DBSecretARN', {
      value: dbSecret.arn,
      description: 'ARN of the Secrets Manager secret for the DB password',
    });
    new TerraformOutput(this, 'EC2InstanceId', {
      value: ec2Instance.id,
      description: 'ID of the WordPress EC2 Instance',
    });
    new TerraformOutput(this, 'CPUAlarmName', {
      value: cpuAlarm.alarmName,
      description: 'Name of the EC2 High CPU Utilization Alarm',
    });
    new TerraformOutput(this, 'DBInstanceIdentifier', {
      value: dbInstance.identifier,
      description: 'Identifier of the RDS DB Instance',
    });
  }
}
