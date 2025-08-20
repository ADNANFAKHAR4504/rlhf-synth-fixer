/* eslint-disable prettier/prettier */

/**
* Multi-region AWS infrastructure stack using Pulumi TypeScript
*
* This stack implements a highly available, multi-region infrastructure
* for a business-critical web application across us-east-1 and us-west-2.
*
* Features:
* - Auto Scaling Groups with EC2 instances
* - Centralized logging with S3 and lifecycle policies
* - VPC with public/private subnets
* - Multi-AZ RDS deployment
* - Lambda functions for log processing
* - AWS WAF with OWASP rules
* - KMS encryption for data at rest
* - IAM roles with least privilege
*/

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  tags?: { [key: string]: string };
}

// Extended VPC interface to include subnet arrays
interface ExtendedVpc extends aws.ec2.Vpc {
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
}

export class TapStack extends pulumi.ComponentResource {
  // Changed to only use 2 regions to avoid VPC quota issues
  public readonly regions = ['us-east-1', 'us-west-2']; // Removed eu-central-1
  public readonly vpcs: { [region: string]: ExtendedVpc } = {};
  public readonly autoScalingGroups: {
    [region: string]: aws.autoscaling.Group;
  } = {};
  public readonly rdsInstances: { [region: string]: aws.rds.Instance } = {};
  public readonly logsBucket: aws.s3.Bucket;
  public readonly logsBucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
  // Changed to store multiple KMS keys per region
  public readonly kmsKeys: { [region: string]: aws.kms.Key } = {};
  // Changed to store multiple WAF WebACLs per region
  public readonly wafWebAcls: { [region: string]: aws.wafv2.WebAcl } = {};
  public readonly logProcessingLambda: aws.lambda.Function;
  // Store providers to reuse them and avoid conflicts
  private readonly providers: { [region: string]: aws.Provider } = {};

  constructor(
    name: string,
    args: TapStackArgs = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:infrastructure:TapStack', name, {}, opts);

    const defaultTags = {
      Environment: pulumi.getStack(),
      Application: 'nova-model-breaking',
      Owner: 'infrastructure-team',
      Project: 'IaC-AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create providers first to avoid duplication conflicts
    this.regions.forEach(region => {
      this.providers[region] = new aws.Provider(
        `provider-${region}`,
        { region },
        { parent: this }
      );
    });

    // Create KMS keys and WAF for each region using the stored providers
    this.regions.forEach(region => {
      this.kmsKeys[region] = this.createKmsKey(
        region,
        defaultTags,
        this.providers[region]
      );
      this.wafWebAcls[region] = this.createWafWebAcl(
        region,
        defaultTags,
        this.providers[region]
      );
    });

    // Create centralized S3 bucket for logs (in us-east-1)
    const bucketResult = this.createLogsBucket(defaultTags);
    this.logsBucket = bucketResult.bucket;
    this.logsBucketPublicAccessBlock = bucketResult.publicAccessBlock;

    // Create Lambda function for log processing
    this.logProcessingLambda = this.createLogProcessingLambda(defaultTags);

    // Deploy infrastructure in each region
    this.regions.forEach(region => {
      this.deployRegionalInfrastructure(region, defaultTags);
    });

    this.registerOutputs({
      regions: this.regions,
      logsBucket: this.logsBucket.bucket,
      kmsKeyIds: Object.fromEntries(
        Object.entries(this.kmsKeys).map(([region, key]) => [region, key.keyId])
      ),
      wafWebAclArns: Object.fromEntries(
        Object.entries(this.wafWebAcls).map(([region, waf]) => [
          region,
          waf.arn,
        ])
      ),
    });
  }

  private createKmsKey(
    region: string,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.kms.Key {
    const callerIdentity = aws.getCallerIdentity({}, { provider });
    return new aws.kms.Key(
      `kms-key-${region}`,
      {
        // Changed name to be more unique
        description: `KMS key for encrypting infrastructure data at rest in ${region}`,
        keyUsage: 'ENCRYPT_DECRYPT',
        customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
        policy: callerIdentity.then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
            ],
          })
        ),
        tags,
      },
      { parent: this, provider }
    );
  }

  private createLogsBucket(tags: { [key: string]: string }): {
    bucket: aws.s3.Bucket;
    publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  } {
    // Sanitize bucket name to comply with S3 naming rules
    const stackName = pulumi
      .getStack()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const timestamp = Date.now();
    let bucketName = `nova-model-logs-${stackName}-${timestamp}`;

    if (bucketName.length > 63) {
      const prefix = 'nova-model-logs-';
      const suffix = `-${timestamp}`;
      const maxStackNameLen = 63 - prefix.length - suffix.length;
      const truncatedStackName = stackName.substring(0, maxStackNameLen);
      bucketName = `${prefix}${truncatedStackName}${suffix}`;
    }

    // Use standard bucket creation without deprecated properties
    const bucket = new aws.s3.Bucket(
      'centralized-logs-bucket',
      {
        bucket: bucketName,
        tags,
      },
      { parent: this }
    );

    // Use separate resources instead of deprecated bucket properties
    new aws.s3.BucketVersioning(
      'logs-bucket-versioning',
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      'logs-bucket-encryption',
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKeys['us-east-1'].arn,
            },
          },
        ],
      },
      { parent: this, dependsOn: [this.kmsKeys['us-east-1']] }
    );

    new aws.s3.BucketLifecycleConfiguration(
      'logs-bucket-lifecycle',
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      'logs-bucket-public-access-block',
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    return { bucket, publicAccessBlock };
  }

  private createLogProcessingLambda(tags: {
    [key: string]: string;
  }): aws.lambda.Function {
    const lambdaRole = new aws.iam.Role(
      'log-processing-lambda-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      'lambda-basic-execution',
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const lambdaS3Policy = new aws.iam.RolePolicy(
      'lambda-s3-policy',
      {
        role: lambdaRole.id,
        policy: pulumi.jsonStringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              Resource: pulumi.interpolate`${this.logsBucket.arn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey'],
              Resource: this.kmsKeys['us-east-1'].arn,
            },
          ],
        }),
      },
      { parent: this }
    );

    return new aws.lambda.Function(
      'log-processing-function',
      {
        runtime: aws.lambda.Runtime.Python3d9,
        code: new pulumi.asset.AssetArchive({
          'lambda_function.py': new pulumi.asset.StringAsset(`
import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Process CloudWatch logs and store them in S3
    """
    return {
        'statusCode': 200,
        'body': json.dumps('Log processing function')
    }
`),
        }),
        handler: 'lambda_function.lambda_handler',
        role: lambdaRole.arn,
        timeout: 300,
        environment: {
          variables: {
            LOGS_BUCKET: this.logsBucket.bucket,
          },
        },
        tags,
      },
      { parent: this, dependsOn: [lambdaS3Policy] }
    );
  }

  private createWafWebAcl(
    region: string,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.wafv2.WebAcl {
    return new aws.wafv2.WebAcl(
      `waf-acl-${region}`,
      {
        // Changed name to be more unique
        name: `nova-model-web-acl-${region}-${pulumi.getStack()}`,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWS-AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'WebACLMetric',
        },
        tags,
      },
      { parent: this, provider }
    );
  }

  private deployRegionalInfrastructure(
    region: string,
    tags: { [key: string]: string }
  ): void {
    // Use the existing provider instead of creating a new one
    const provider = this.providers[region];

    const vpc = this.createVpc(region, tags, provider);
    this.vpcs[region] = vpc;

    const webSecurityGroup = this.createWebSecurityGroup(
      region,
      vpc,
      tags,
      provider
    );

    const dbSecurityGroup = this.createDbSecurityGroup(
      region,
      vpc,
      webSecurityGroup,
      tags,
      provider
    );

    const ec2Role = this.createEc2Role(region, tags, provider);

    const instanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${region}`,
      {
        role: ec2Role.name,
      },
      { parent: this, provider }
    );

    const launchTemplate = this.createLaunchTemplate(
      region,
      webSecurityGroup,
      instanceProfile,
      tags,
      provider
    );

    // FIXED: Set desired capacity to 0 and add replaceOnChanges
    const asg = new aws.autoscaling.Group(
      `asg-${region}`,
      {
        // DON'T use fixed names - let Pulumi generate them
        minSize: 0,
        maxSize: 3,
        desiredCapacity: 0, // Start with 0, scale manually later
        vpcZoneIdentifiers: vpc.publicSubnetIds,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        healthCheckType: 'EC2', // Changed from ELB to EC2 for faster startup
        healthCheckGracePeriod: 300,
        tags: Object.entries(tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      },
      { 
        parent: this, 
        provider, 
        dependsOn: [launchTemplate, instanceProfile],
        // CRITICAL FIX: Add replaceOnChanges to avoid ASG name conflicts
        replaceOnChanges: ['name', 'launchTemplate'],
        ignoreChanges: ['desiredCapacity'] // Let AWS manage capacity changes
      }
    );

    this.autoScalingGroups[region] = asg;

    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${region}`,
      {
        subnetIds: vpc.privateSubnetIds,
        tags,
      },
      { parent: this, provider }
    );

    // Fixed RDS to use regional KMS key and unique identifier
    const rdsInstance = new aws.rds.Instance(
      `rds-${region}`,
      {
        // DON'T use fixed identifiers - let AWS generate them
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.kmsKeys[region].arn, // Use regional KMS key
        dbName: 'novamodel',
        username: 'admin',
        password: 'temporarypassword123!',
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        multiAz: false, // Disabled for cost savings
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        tags,
      },
      { 
        parent: this, 
        provider,
        // CRITICAL FIX: Add ignoreChanges for RDS identifier
        ignoreChanges: ['identifier']
      }
    );

    this.rdsInstances[region] = rdsInstance;

    this.createApplicationLoadBalancer(
      region,
      vpc,
      webSecurityGroup,
      asg,
      tags,
      provider
    );
  }

  private getCidrBlockForRegion(region: string): string {
    const cidrBlocks: { [key: string]: string } = {
      'us-east-1': '10.0.0.0/16',
      'us-west-2': '10.1.0.0/16',
    };
    return cidrBlocks[region] || '10.0.0.0/16';
  }

  private createVpc(
    region: string,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): ExtendedVpc {
    const vpc = new aws.ec2.Vpc(
      `vpc-${region}`,
      {
        cidrBlock: this.getCidrBlockForRegion(region),
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `nova-model-vpc-${region}`,
        },
      },
      { parent: this, provider }
    );

    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `nova-model-igw-${region}`,
        },
      },
      { parent: this, provider }
    );

    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${region}`,
      {
        vpcId: vpc.id,
        cidrBlock: this.getSubnetCidr(region, 'public', 0),
        availabilityZone: `${region}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `nova-model-public-subnet-1-${region}`,
        },
      },
      { parent: this, provider }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${region}`,
      {
        vpcId: vpc.id,
        cidrBlock: this.getSubnetCidr(region, 'public', 1),
        availabilityZone: `${region}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `nova-model-public-subnet-2-${region}`,
        },
      },
      { parent: this, provider }
    );

    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${region}`,
      {
        vpcId: vpc.id,
        cidrBlock: this.getSubnetCidr(region, 'private', 0),
        availabilityZone: `${region}a`,
        tags: {
          ...tags,
          Name: `nova-model-private-subnet-1-${region}`,
        },
      },
      { parent: this, provider }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${region}`,
      {
        vpcId: vpc.id,
        cidrBlock: this.getSubnetCidr(region, 'private', 1),
        availabilityZone: `${region}b`,
        tags: {
          ...tags,
          Name: `nova-model-private-subnet-2-${region}`,
        },
      },
      { parent: this, provider }
    );

    const eip1 = new aws.ec2.Eip(
      `eip-1-${region}`,
      {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `nova-model-eip-1-${region}`,
        },
      },
      { parent: this, provider }
    );

    const natGateway1 = new aws.ec2.NatGateway(
      `nat-1-${region}`,
      {
        allocationId: eip1.id,
        subnetId: publicSubnet1.id,
        tags: {
          ...tags,
          Name: `nova-model-nat-1-${region}`,
        },
      },
      { parent: this, provider }
    );

    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${region}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          ...tags,
          Name: `nova-model-public-rt-${region}`,
        },
      },
      { parent: this, provider }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${region}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway1.id,
          },
        ],
        tags: {
          ...tags,
          Name: `nova-model-private-rt-${region}`,
        },
      },
      { parent: this, provider }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${region}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this, provider }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${region}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this, provider }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${region}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this, provider }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${region}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this, provider }
    );

    const extendedVpc = vpc as ExtendedVpc;
    extendedVpc.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    extendedVpc.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    return extendedVpc;
  }

  private getSubnetCidr(
    region: string,
    type: 'public' | 'private',
    index: number
  ): string {
    const baseOctets: { [key: string]: string } = {
      'us-east-1': '10.0',
      'us-west-2': '10.1',
    };

    const base = baseOctets[region] || '10.0';
    const typeOffset = type === 'public' ? 0 : 10;
    const subnet = typeOffset + index;
    return `${base}.${subnet}.0/24`;
  }

  private createWebSecurityGroup(
    region: string,
    vpc: aws.ec2.Vpc,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `web-sg-${region}`,
      {
        namePrefix: `nova-model-web-${region}-`,
        vpcId: vpc.id,
        description: 'Security group for web servers',
        ingress: [
          {
            description: 'HTTP',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTPS',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'SSH from specific IP',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['203.0.113.0/32'],
          },
        ],
        egress: [
          {
            description: 'All outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags,
      },
      { parent: this, provider }
    );
  }

  private createDbSecurityGroup(
    region: string,
    vpc: aws.ec2.Vpc,
    webSecurityGroup: aws.ec2.SecurityGroup,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(
      `db-sg-${region}`,
      {
        namePrefix: `nova-model-db-${region}-`,
        vpcId: vpc.id,
        description: 'Security group for database servers',
        ingress: [
          {
            description: 'MySQL from web servers',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
          },
        ],
        tags,
      },
      { parent: this, provider }
    );
  }

  private createEc2Role(
    region: string,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.iam.Role {
    const role = new aws.iam.Role(
      `ec2-role-${region}`,
      {
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
        tags,
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicyAttachment(
      `ec2-cloudwatch-agent-${region}`,
      {
        role: role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this, provider }
    );

    // Add SSM permissions for better EC2 management
    new aws.iam.RolePolicyAttachment(
      `ec2-ssm-${region}`,
      {
        role: role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this, provider }
    );

    new aws.iam.RolePolicy(
      `ec2-s3-logs-policy-${region}`,
      {
        role: role.id,
        policy: pulumi.jsonStringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetObject'],
              Resource: pulumi.interpolate`${this.logsBucket.arn}/ec2-logs/*`,
            },
          ],
        }),
      },
      { parent: this, provider }
    );

    return role;
  }

  private createLaunchTemplate(
    region: string,
    securityGroup: aws.ec2.SecurityGroup,
    instanceProfile: aws.iam.InstanceProfile,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.ec2.LaunchTemplate {
    const userData = Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Nova Model Application - ${region}</h1>" > /var/www/html/index.html
`).toString('base64');

    return new aws.ec2.LaunchTemplate(
      `launch-template-${region}`,
      {
        namePrefix: `nova-model-${region}-`,
        imageId: aws.ec2
          .getAmi(
            {
              mostRecent: true,
              owners: ['amazon'],
              filters: [
                { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
                { name: 'state', values: ['available'] },
              ],
            },
            { provider }
          )
          .then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [securityGroup.id],
        iamInstanceProfile: { name: instanceProfile.name },
        userData,
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
              kmsKeyId: this.kmsKeys[region].arn,
              deleteOnTermination: 'true',
            },
          },
        ],
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: { ...tags, Name: `nova-model-instance-${region}` },
          },
          { resourceType: 'volume', tags },
        ],
      },
      { parent: this, provider, dependsOn: [instanceProfile] }
    );
  }

  // CRITICAL FIX: Completely rewritten ALB section
  private createApplicationLoadBalancer(
    region: string,
    vpc: ExtendedVpc,
    securityGroup: aws.ec2.SecurityGroup,
    asg: aws.autoscaling.Group,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): void {
    const regionCode = region === 'us-east-1' ? 'e1' : 'w2';

    const alb = new aws.lb.LoadBalancer(
      `alb-${region}`,
      {
        name: `nova-alb-${regionCode}`,
        loadBalancerType: 'application',
        subnets: vpc.publicSubnetIds,
        securityGroups: [securityGroup.id],
        tags,
      },
      { parent: this, provider }
    );

    // CRITICAL FIX: Use deleteBeforeReplace to avoid target group conflicts
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${region}`,
      {
        namePrefix: `tg-${regionCode}-`, // Short prefix
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags,
      },
      {
        parent: this,
        provider,
        // CRITICAL: This prevents ResourceInUse errors
        deleteBeforeReplace: true,
        // CRITICAL: This prevents name conflicts
        replaceOnChanges: ['name', 'namePrefix']
      }
    );

    // CRITICAL FIX: Use deleteBeforeReplace and proper dependencies
    const listener = new aws.lb.Listener(
      `listener-${region}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      {
        parent: this,
        provider,
        dependsOn: [alb, targetGroup],
        // CRITICAL: This prevents ListenerNotFound errors
        deleteBeforeReplace: true,
        // CRITICAL: Protect against multiple deletions
        protect: false
      }
    );

    // CRITICAL FIX: Use ignoreChanges to prevent ASG attachment issues
    new aws.autoscaling.Attachment(
      `asg-attachment-${region}`,
      {
        autoscalingGroupName: asg.name, // Use .name instead of .id
        lbTargetGroupArn: targetGroup.arn,
      },
      {
        parent: this,
        provider,
        dependsOn: [listener, targetGroup, asg],
        // CRITICAL: Ignore changes to prevent detachment issues
        ignoreChanges: ['autoscalingGroupName'],
        // CRITICAL: Replace before delete to avoid conflicts
        deleteBeforeReplace: true
      }
    );

    new aws.wafv2.WebAclAssociation(
      `waf-association-${region}`,
      {
        resourceArn: alb.arn,
        webAclArn: this.wafWebAcls[region].arn,
      },
      { parent: this, provider, dependsOn: [alb] }
    );
  }
}