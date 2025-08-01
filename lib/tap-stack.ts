// IaC - AWS Nova Model Breaking
// Expert level Terraform CDK implementation for secure, scalable AWS infrastructure
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Core Infrastructure Imports
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

// S3 and KMS
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// EC2 and Auto Scaling
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';

// CloudFront and Route53
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';

// Lambda and CloudWatch
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';

// Security Services
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';

// IAM
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  domainName?: string;
  defaultTags?: { [key: string]: string };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = 'us-west-2'; // Changed to us-west-2 for deployment

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Owner: 'DevOps-Team',
      Project: 'IaC-AWS-Nova-Model-Breaking',
    };

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [{ tags: commonTags }],
    });

    // Configure local backend for testing
    // Comment out S3 backend configuration for now
    /*
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    */

    // KMS Key for encryption
    const kmsKey = new KmsKey(this, 'main-kms-key', {
      description: 'KMS key for encrypting resources',
      tags: commonTags,
    });

    // VPC and Networking (using smaller CIDR to avoid conflicts)
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '172.16.0.0/16', // Changed from 10.0.0.0/16 to avoid conflicts
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: `main-vpc-${environmentSuffix}` },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '172.16.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: 'public-subnet-1' },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '172.16.2.0/24',
      availabilityZone: 'us-west-2b',
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: 'public-subnet-2' },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '172.16.3.0/24',
      availabilityZone: 'us-west-2a',
      tags: { ...commonTags, Name: 'private-subnet-1' },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '172.16.4.0/24',
      availabilityZone: 'us-west-2b',
      tags: { ...commonTags, Name: 'private-subnet-2' },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: 'main-igw' },
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: 'public-route-table' },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-rt-assoc-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rt-assoc-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: `flow-log-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
          },
        ],
      }),
      tags: commonTags,
    });

    const flowLogPolicy = new IamPolicy(this, 'flow-log-policy', {
      name: `flow-log-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'flow-log-policy-attachment', {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    new FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestinationType: 'cloud-watch-logs',
      vpcId: vpc.id,
      trafficType: 'ALL',
      tags: commonTags,
    });

    // S3 Bucket with KMS encryption and versioning
    const appBucket = new S3Bucket(this, 'app-bucket', {
      bucketPrefix: `nova-app-${environmentSuffix}-`,
      tags: commonTags,
    });

    new S3BucketVersioningA(this, 'app-bucket-versioning', {
      bucket: appBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'app-bucket-encryption',
      {
        bucket: appBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
          },
        ],
      }
    );

    // Security Groups
    const webSecurityGroup = new SecurityGroup(this, 'web-security-group', {
      name: `web-sg-${environmentSuffix}`,
      description: 'Security group for web servers',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: commonTags,
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-security-group', {
      name: `db-sg-${environmentSuffix}`,
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [webSecurityGroup.id],
        },
      ],
      tags: commonTags,
    });

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `ec2-role-${environmentSuffix}`,
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
      tags: commonTags,
    });

    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `ec2-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
      }
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new LaunchTemplate(this, 'web-launch-template', {
      name: `web-template-${environmentSuffix}`,
      imageId: 'ami-0cf2b4e024cdb6960', // Amazon Linux 2 for us-west-2
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [webSecurityGroup.id],
      iamInstanceProfile: {
        name: ec2InstanceProfile.name,
      },
      userData: Buffer.from(
        `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Nova Model Breaking App</h1>" > /var/www/html/index.html
`
      ).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: commonTags,
        },
      ],
    });

    // Auto Scaling Group
    new AutoscalingGroup(this, 'web-asg', {
      name: `web-asg-${environmentSuffix}`,
      vpcZoneIdentifier: [publicSubnet1.id, publicSubnet2.id],
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: 'Name',
          value: `web-asg-${environmentSuffix}`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
          propagateAtLaunch: true,
        },
        {
          key: 'Owner',
          value: 'DevOps-Team',
          propagateAtLaunch: true,
        },
      ],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: commonTags,
    });

    // RDS Instance (Multi-AZ)
    new DbInstance(this, 'main-database', {
      identifier: `nova-db-${environmentSuffix}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      dbName: 'novaapp',
      username: 'admin',
      password: 'changeme123!', // In production, use AWS Secrets Manager
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      tags: commonTags,
    });

    // Lambda Role for Compliance Checks
    const lambdaRole = new IamRole(this, 'lambda-compliance-role', {
      name: `lambda-compliance-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Lambda Function for Compliance Checks
    const complianceLambda = new LambdaFunction(this, 'compliance-lambda', {
      functionName: `compliance-checker-${environmentSuffix}`,
      runtime: 'python3.9',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: 'lambda_function.zip',
      tags: commonTags,
    });

    // CloudWatch Event Rule for Lambda trigger
    const complianceEventRule = new CloudwatchEventRule(
      this,
      'compliance-event-rule',
      {
        name: `compliance-check-rule-${environmentSuffix}`,
        description: 'Trigger compliance checks',
        scheduleExpression: 'rate(24 hours)',
        tags: commonTags,
      }
    );

    new CloudwatchEventTarget(this, 'compliance-lambda-target', {
      rule: complianceEventRule.name,
      arn: complianceLambda.arn,
    });

    new LambdaPermission(this, 'allow-cloudwatch-lambda', {
      statementId: 'AllowExecutionFromCloudWatch',
      action: 'lambda:InvokeFunction',
      functionName: complianceLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: complianceEventRule.arn,
    });

    // WAFv2 Web ACL (updated from deprecated WAF Classic)
    new Wafv2WebAcl(this, 'main-waf', {
      name: `nova-waf-${environmentSuffix}`,
      scope: 'CLOUDFRONT',
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `NovaWAFv2${environmentSuffix}`,
      },
      tags: commonTags,
    });

    // GuardDuty Detector (commented out to avoid conflicts)
    // Note: GuardDuty allows only one detector per account per region
    // Uncomment if no detector exists in the account
    /*
    new GuarddutyDetector(this, 'main-guardduty', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      tags: commonTags,
    });
    */

    // ACM Certificate and Route53 (commented out for deployment stability)
    // Uncomment when domain validation is properly configured
    /*
    const certificate = new AcmCertificate(this, 'main-certificate', {
      domainName: domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validationMethod: 'DNS',
      tags: commonTags,
    });

    // Route53 Hosted Zone
    const hostedZone = new Route53Zone(this, 'main-zone', {
      name: domainName,
      tags: commonTags,
    });

    // Route53 Health Check
    const healthCheck = new Route53HealthCheck(this, 'main-health-check', {
      fqdn: domainName,
      port: 443,
      type: 'HTTPS',
      resourcePath: '/',
      failureThreshold: 3,
      requestInterval: 30,
      tags: commonTags,
    });
    */

    // CloudFront Distribution (with fallback certificate)
    const distribution = new CloudfrontDistribution(this, 'main-cloudfront', {
      origin: [
        {
          domainName: appBucket.bucketDomainName,
          originId: 'S3-nova-app',
          s3OriginConfig: {
            originAccessIdentity: '',
          },
        },
      ],
      enabled: true,
      defaultCacheBehavior: {
        allowedMethods: [
          'DELETE',
          'GET',
          'HEAD',
          'OPTIONS',
          'PATCH',
          'POST',
          'PUT',
        ],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 'S3-nova-app',
        compress: true,
        viewerProtocolPolicy: 'redirect-to-https',
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
      },
      // Use CloudFront default certificate instead of custom ACM
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      tags: commonTags,
    });

    // Route53 Records (commented out due to certificate issues)
    // Uncomment when ACM certificate is properly validated
    /*
    new Route53Record(this, 'primary-record', {
      zoneId: hostedZone.zoneId,
      name: domainName,
      type: 'A',
      setIdentifier: 'primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: healthCheck.id,
      alias: {
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: true,
      },
    });
    */

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'cloudfront-domain', {
      value: distribution.domainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: appBucket.bucket,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });
  }
}
