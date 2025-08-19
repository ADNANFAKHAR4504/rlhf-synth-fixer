/* eslint-disable prettier/prettier */
/**
 * Multi-region AWS infrastructure stack using Pulumi TypeScript
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  tags?: { [key: string]: string };
}

interface ExtendedVpc extends aws.ec2.Vpc {
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
}

export class TapStack extends pulumi.ComponentResource {
  public readonly regions = ['us-east-1', 'us-west-2'];
  public readonly vpcs: { [region: string]: ExtendedVpc } = {};
  public readonly autoScalingGroups: { [region: string]: aws.autoscaling.Group } = {};
  public readonly rdsInstances: { [region: string]: aws.rds.Instance } = {};
  public readonly kmsKeys: { [region: string]: aws.kms.Key } = {}; // Regional KMS keys
  public readonly wafWebAcls: { [region: string]: aws.wafv2.WebAcl } = {}; // Regional WAF ACLs
  public readonly logsBucket: aws.s3.Bucket;
  public readonly logsBucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly logProcessingLambda: aws.lambda.Function;

  constructor(name: string, args: TapStackArgs = {}, opts?: pulumi.ComponentResourceOptions) {
    super('tap:infrastructure:TapStack', name, {}, opts);

    const defaultTags = {
      Environment: pulumi.getStack(),
      Application: 'nova-model-breaking',
      Owner: 'infrastructure-team',
      Project: 'IaC-AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create primary KMS key in us-east-1 for S3 bucket
    const primaryKmsKey = this.createKmsKey('us-east-1', defaultTags);

    // Create centralized S3 bucket for logs in us-east-1
    const bucketResult = this.createLogsBucket(primaryKmsKey, defaultTags);
    this.logsBucket = bucketResult.bucket;
    this.logsBucketPublicAccessBlock = bucketResult.publicAccessBlock;

    // Create Lambda function for log processing in us-east-1
    this.logProcessingLambda = this.createLogProcessingLambda(primaryKmsKey, defaultTags);

    // Deploy infrastructure in each region
    this.regions.forEach(region => {
      this.deployRegionalInfrastructure(region, defaultTags);
    });

    this.registerOutputs({
      regions: this.regions,
      logsBucket: this.logsBucket.bucket,
      primaryKmsKeyId: primaryKmsKey.keyId,
    });
  }

  private createKmsKey(region: string, tags: { [key: string]: string }, provider?: aws.Provider): aws.kms.Key {
    const callerIdentity = aws.getCallerIdentity();
    
    const key = new aws.kms.Key(`infrastructure-kms-key-${region}`, {
      description: `KMS key for encrypting infrastructure data at rest in ${region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      policy: callerIdentity.then(identity => JSON.stringify({
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
      })),
      tags,
    }, { parent: this, provider });

    this.kmsKeys[region] = key;
    return key;
  }

  private createLogsBucket(kmsKey: aws.kms.Key, tags: { [key: string]: string }): { bucket: aws.s3.Bucket, publicAccessBlock: aws.s3.BucketPublicAccessBlock } {
    const stackName = pulumi.getStack().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const timestamp = Date.now();
    let bucketName = `nova-model-logs-${stackName}-${timestamp}`;
    
    if (bucketName.length > 63) {
      const prefix = 'nova-model-logs-';
      const suffix = `-${timestamp}`;
      const maxStackNameLen = 63 - prefix.length - suffix.length;
      const truncatedStackName = stackName.substring(0, maxStackNameLen);
      bucketName = `${prefix}${truncatedStackName}${suffix}`;
    }

    const bucket = new aws.s3.Bucket('centralized-logs-bucket', {
      bucket: bucketName,
      versioning: { enabled: true },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
        },
      },
      lifecycleRules: [{
        id: 'transition-to-glacier',
        enabled: true,
        transitions: [{ days: 30, storageClass: 'GLACIER' }],
      }],
      tags,
    }, { parent: this });

    const publicAccessBlock = new aws.s3.BucketPublicAccessBlock('logs-bucket-public-access-block', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    return { bucket, publicAccessBlock };
  }

  private createLogProcessingLambda(kmsKey: aws.kms.Key, tags: { [key: string]: string }): aws.lambda.Function {
    const lambdaRole = new aws.iam.Role('log-processing-lambda-role', {
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
    }, { parent: this });

    new aws.iam.RolePolicyAttachment('lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    const lambdaS3Policy = new aws.iam.RolePolicy('lambda-s3-policy', {
      role: lambdaRole.id,
      policy: pulumi.jsonStringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
            ],
            Resource: pulumi.interpolate`${this.logsBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
            ],
            Resource: kmsKey.arn,
          },
        ],
      }),
    }, { parent: this });

    return new aws.lambda.Function('log-processing-function', {
      runtime: aws.lambda.Runtime.Python3d9,
      code: new pulumi.asset.AssetArchive({
        'lambda_function.py': new pulumi.asset.StringAsset(`
import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
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
    }, { parent: this, dependsOn: [lambdaS3Policy] });
  }

  private createWafWebAcl(region: string, tags: { [key: string]: string }, provider: aws.Provider): aws.wafv2.WebAcl {
    const webAcl = new aws.wafv2.WebAcl(`owasp-web-acl-${region}`, {
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: 'WebACLMetric',
      },
      tags,
    }, { parent: this, provider });

    this.wafWebAcls[region] = webAcl;
    return webAcl;
  }

  private deployRegionalInfrastructure(region: string, tags: { [key: string]: string }): void {
    const provider = new aws.Provider(`provider-${region}`, {
      region: region,
    }, { parent: this });

    // Create regional KMS key
    const regionalKmsKey = this.createKmsKey(region, tags, provider);

    // Create regional WAF WebACL
    const regionalWafWebAcl = this.createWafWebAcl(region, tags, provider);

    const vpc = this.createVpc(region, tags, provider);
    this.vpcs[region] = vpc;

    const webSecurityGroup = this.createWebSecurityGroup(region, vpc, tags, provider);
    const dbSecurityGroup = this.createDbSecurityGroup(region, vpc, webSecurityGroup, tags, provider);

    const ec2Role = this.createEc2Role(region, tags, provider);

    const instanceProfile = new aws.iam.InstanceProfile(`ec2-instance-profile-${region}`, {
      role: ec2Role.name,
    }, { parent: this, provider });

    const launchTemplate = this.createLaunchTemplate(region, webSecurityGroup, instanceProfile, regionalKmsKey, tags, provider);

    const asg = new aws.autoscaling.Group(`asg-${region}`, {
      name: `nova-model-asg-${region}-${Date.now()}`, // Add timestamp to avoid conflicts
      minSize: 1, // Reduced for faster startup
      maxSize: 4,
      desiredCapacity: 1,
      vpcZoneIdentifiers: vpc.privateSubnetIds,
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
    }, { parent: this, provider });

    this.autoScalingGroups[region] = asg;

    const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${region}`, {
      subnetIds: vpc.privateSubnetIds,
      tags,
    }, { parent: this, provider });

    const rdsInstance = new aws.rds.Instance(`rds-${region}`, {
      identifier: `nova-model-db-${region}-${Date.now()}`, // Add timestamp to avoid conflicts
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: regionalKmsKey.arn, // Use regional KMS key
      dbName: 'novamodel',
      username: 'admin',
      password: 'temporarypassword123!',
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: false, // Disabled for cost savings in test
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      tags,
    }, { parent: this, provider });

    this.rdsInstances[region] = rdsInstance;

    this.createApplicationLoadBalancer(region, vpc, webSecurityGroup, asg, regionalWafWebAcl, tags, provider);
  }

  private getCidrBlockForRegion(region: string): string {
    const cidrBlocks: { [key: string]: string } = {
      'us-east-1': '10.0.0.0/16',
      'us-west-2': '10.1.0.0/16',
    };
    return cidrBlocks[region] || '10.0.0.0/16';
  }

  private createVpc(region: string, tags: { [key: string]: string }, provider: aws.Provider): ExtendedVpc {
    const vpc = new aws.ec2.Vpc(`vpc-${region}`, {
      cidrBlock: this.getCidrBlockForRegion(region),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `nova-model-vpc-${region}`,
      },
    }, { parent: this, provider });

    const internetGateway = new aws.ec2.InternetGateway(`igw-${region}`, {
      vpcId: vpc.id,
      tags: {
        ...tags,
        Name: `nova-model-igw-${region}`,
      },
    }, { parent: this, provider });

    const publicSubnet1 = new aws.ec2.Subnet(`public-subnet-1-${region}`, {
      vpcId: vpc.id,
      cidrBlock: this.getSubnetCidr(region, 'public', 0),
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        ...tags,
        Name: `nova-model-public-subnet-1-${region}`,
      },
    }, { parent: this, provider });

    const publicSubnet2 = new aws.ec2.Subnet(`public-subnet-2-${region}`, {
      vpcId: vpc.id,
      cidrBlock: this.getSubnetCidr(region, 'public', 1),
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        ...tags,
        Name: `nova-model-public-subnet-2-${region}`,
      },
    }, { parent: this, provider });

    const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${region}`, {
      vpcId: vpc.id,
      cidrBlock: this.getSubnetCidr(region, 'private', 0),
      availabilityZone: `${region}a`,
      tags: {
        ...tags,
        Name: `nova-model-private-subnet-1-${region}`,
      },
    }, { parent: this, provider });

    const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${region}`, {
      vpcId: vpc.id,
      cidrBlock: this.getSubnetCidr(region, 'private', 1),
      availabilityZone: `${region}b`,
      tags: {
        ...tags,
        Name: `nova-model-private-subnet-2-${region}`,
      },
    }, { parent: this, provider });

    const eip1 = new aws.ec2.Eip(`eip-1-${region}`, {
      domain: 'vpc',
      tags: {
        ...tags,
        Name: `nova-model-eip-1-${region}`,
      },
    }, { parent: this, provider });

    const natGateway1 = new aws.ec2.NatGateway(`nat-1-${region}`, {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        ...tags,
        Name: `nova-model-nat-1-${region}`,
      },
    }, { parent: this, provider });

    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${region}`, {
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
    }, { parent: this, provider });

    const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${region}`, {
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
    }, { parent: this, provider });

    new aws.ec2.RouteTableAssociation(`public-rta-1-${region}`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this, provider });

    new aws.ec2.RouteTableAssociation(`public-rta-2-${region}`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this, provider });

    new aws.ec2.RouteTableAssociation(`private-rta-1-${region}`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this, provider });

    new aws.ec2.RouteTableAssociation(`private-rta-2-${region}`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this, provider });

    const extendedVpc = vpc as ExtendedVpc;
    extendedVpc.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    extendedVpc.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    return extendedVpc;
  }

  private getSubnetCidr(region: string, type: 'public' | 'private', index: number): string {
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
    return new aws.ec2.SecurityGroup(`web-sg-${region}`, {
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
    }, { parent: this, provider });
  }

  private createDbSecurityGroup(
    region: string,
    vpc: aws.ec2.Vpc,
    webSecurityGroup: aws.ec2.SecurityGroup,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): aws.ec2.SecurityGroup {
    return new aws.ec2.SecurityGroup(`db-sg-${region}`, {
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
    }, { parent: this, provider });
  }

  private createEc2Role(region: string, tags: { [key: string]: string }, provider: aws.Provider): aws.iam.Role {
    const role = new aws.iam.Role(`ec2-role-${region}`, {
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
    }, { parent: this, provider });

    new aws.iam.RolePolicyAttachment(`ec2-cloudwatch-agent-${region}`, {
      role: role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this, provider });

    new aws.iam.RolePolicy(`ec2-s3-logs-policy-${region}`, {
      role: role.id,
      policy: pulumi.jsonStringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
            ],
            Resource: pulumi.interpolate`${this.logsBucket.arn}/ec2-logs/*`,
          },
        ],
      }),
    }, { parent: this, provider });

    return role;
  }

  private createLaunchTemplate(
    region: string,
    securityGroup: aws.ec2.SecurityGroup,
    instanceProfile: aws.iam.InstanceProfile,
    kmsKey: aws.kms.Key,
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

    return new aws.ec2.LaunchTemplate(`launch-template-${region}`, {
      namePrefix: `nova-model-${region}-`,
      imageId: aws.ec2.getAmi({
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
        ],
      }, { provider }).then(ami => ami.id),
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData,
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: 'true',
            kmsKeyId: kmsKey.arn,
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags,
        },
        {
          resourceType: 'volume',
          tags,
        },
      ],
    }, { parent: this, provider });
  }

  private createApplicationLoadBalancer(
    region: string,
    vpc: ExtendedVpc,
    securityGroup: aws.ec2.SecurityGroup,
    asg: aws.autoscaling.Group,
    wafWebAcl: aws.wafv2.WebAcl,
    tags: { [key: string]: string },
    provider: aws.Provider
  ): void {
    const regionCode = region === 'us-east-1' ? 'use1' : 'usw2';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    const alb = new aws.lb.LoadBalancer(`alb-${region}`, {
      name: `nova-alb-${regionCode}`,
      loadBalancerType: 'application',
      subnets: vpc.publicSubnetIds,
      securityGroups: [securityGroup.id],
      tags,
    }, { parent: this, provider });

    const targetGroup = new aws.lb.TargetGroup(`tg-${region}`, {
      name: `nova-tg-${regionCode}-${randomSuffix}`,
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
    }, { parent: this, provider });

    new aws.lb.Listener(`listener-${region}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    }, { parent: this, provider });

    new aws.autoscaling.Attachment(`asg-attachment-${region}`, {
      autoscalingGroupName: asg.id,
      lbTargetGroupArn: targetGroup.arn,
    }, { parent: this, provider });

    // Associate regional WAF with regional ALB
    new aws.wafv2.WebAclAssociation(`waf-association-${region}`, {
      resourceArn: alb.arn,
      webAclArn: wafWebAcl.arn,
    }, { parent: this, provider });
  }
}
