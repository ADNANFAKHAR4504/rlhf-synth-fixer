import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// ==================== VPC Module ====================
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateway: aws.natGateway.NatGateway;

  constructor(scope: Construct, id: string, props: { awsRegion: string }) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'multi-tier-vpc',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'multi-tier-igw',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // Public Subnets
    this.publicSubnets = [];
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const availabilityZones = [`${props.awsRegion}a`, `${props.awsRegion}b`];

    publicCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}`,
          Type: 'Public',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Elastic IP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: 'nat-gateway-eip',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // NAT Gateway
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat-gateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: 'multi-tier-nat',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Private Subnets
    this.privateSubnets = [];
    const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24'];

    privateCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        tags: {
          Name: `private-subnet-${index + 1}`,
          Type: 'Private',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Public Route Table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'public-route-table',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Table
    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'private-route-table',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

// ==================== IAM Module ====================
export class IamModule extends Construct {
  public readonly ecsTaskRole: aws.iamRole.IamRole;
  public readonly ecsExecutionRole: aws.iamRole.IamRole;
  public readonly ecsInstanceRole: aws.iamRole.IamRole;
  public readonly ecsInstanceProfile: aws.iamInstanceProfile.IamInstanceProfile;
  public readonly codeBuildRole: aws.iamRole.IamRole;
  public readonly codePipelineRole: aws.iamRole.IamRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ECS Task Role
    this.ecsTaskRole = new aws.iamRole.IamRole(this, 'ecs-task-role', {
      name: 'multi-tier-ecs-task-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // ECS Task Execution Role
    this.ecsExecutionRole = new aws.iamRole.IamRole(
      this,
      'ecs-execution-role',
      {
        name: 'multi-tier-ecs-execution-role',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // Add policy for Secrets Manager access (for RDS password)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ecs-secrets-policy', {
      role: this.ecsTaskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: 'arn:aws:secretsmanager:*:*:secret:rds!*',
          },
        ],
      }),
    });

    // ECS Instance Role
    this.ecsInstanceRole = new aws.iamRole.IamRole(this, 'ecs-instance-role', {
      name: 'multi-tier-ecs-instance-role',
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
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
      ],
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    this.ecsInstanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ecs-instance-profile',
      {
        name: 'multi-tier-ecs-instance-profile',
        role: this.ecsInstanceRole.name,
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // CodeBuild Role
    this.codeBuildRole = new aws.iamRole.IamRole(this, 'codebuild-role', {
      name: 'multi-tier-codebuild-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'codebuild.amazonaws.com' },
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // CodePipeline Role
    this.codePipelineRole = new aws.iamRole.IamRole(this, 'codepipeline-role', {
      name: 'multi-tier-codepipeline-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'codepipeline.amazonaws.com' },
          },
        ],
      }),
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Attach policies to CodeBuild role
    new aws.iamRolePolicy.IamRolePolicy(this, 'codebuild-policy', {
      role: this.codeBuildRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:GetBucketLocation'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ecr:GetAuthorizationToken',
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
              'ecr:PutImage',
              'ecr:InitiateLayerUpload',
              'ecr:UploadLayerPart',
              'ecr:CompleteLayerUpload',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Attach policies to CodePipeline role
    new aws.iamRolePolicy.IamRolePolicy(this, 'codepipeline-policy', {
      role: this.codePipelineRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:GetBucketLocation',
              's3:ListBucket',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ecs:UpdateService',
              'ecs:RegisterTaskDefinition',
              'ecs:DescribeServices',
              'ecs:DescribeTaskDefinition',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: 'iam:PassRole',
            Resource: '*',
          },
        ],
      }),
    });
  }
}

// ==================== S3 Module ====================
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPublicAccess: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;

  constructor(
    scope: Construct,
    id: string,
    props: { awsRegion: string; accountId: string }
  ) {
    super(scope, id);

    // S3 Bucket for assets and artifacts
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'assets-bucket', {
      bucket: 'multi-tier-assets-bucket',
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
        Purpose: 'Assets and Artifacts',
      },
    });

    // Enable versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'bucket-encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Block public access
    this.bucketPublicAccess =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'bucket-public-access',
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Get ALB service account for the region
    const albServiceAccount = this.getAlbServiceAccount(props.awsRegion);

    // Bucket policy for ALB access logs and security
    this.bucketPolicy = new aws.s3BucketPolicy.S3BucketPolicy(
      this,
      'bucket-policy',
      {
        bucket: this.bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'ALBAccessLogWrite',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${albServiceAccount}:root`,
              },
              Action: 's3:PutObject',
              Resource: `${this.bucket.arn}/alb-logs/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
            {
              Sid: 'ALBAccessLogAclCheck',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${albServiceAccount}:root`,
              },
              Action: 's3:GetBucketAcl',
              Resource: this.bucket.arn,
            },
            {
              Sid: 'AWSLogDeliveryWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${this.bucket.arn}/alb-logs/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
            {
              Sid: 'AWSLogDeliveryAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: this.bucket.arn,
            },
            {
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [this.bucket.arn, `${this.bucket.arn}/*`],
              Condition: {
                Bool: {
                  'aws:SecureTransport': false,
                },
              },
            },
          ],
        }),
        dependsOn: [this.bucketPublicAccess],
      }
    );
  }

  // Helper function to get ALB service account ID for different regions
  private getAlbServiceAccount(region: string): string {
    const albServiceAccounts: { [key: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      'af-south-1': '098369216593',
      'ca-central-1': '985666609251',
      'eu-central-1': '054676820928',
      'eu-west-1': '156460612806',
      'eu-west-2': '652711504416',
      'eu-south-1': '635631232127',
      'eu-west-3': '009996457667',
      'eu-north-1': '897822967062',
      'ap-east-1': '754344448648',
      'ap-northeast-1': '582318560864',
      'ap-northeast-2': '600734575887',
      'ap-northeast-3': '383597477331',
      'ap-southeast-1': '114774131450',
      'ap-southeast-2': '783225319266',
      'ap-south-1': '718504428378',
      'me-south-1': '076674570225',
      'sa-east-1': '507241528517',
    };

    return albServiceAccounts[region] || '797873946194'; // Default to us-west-2
  }
}

// ==================== RDS Module ====================
export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpc: aws.vpc.Vpc;
      privateSubnets: aws.subnet.Subnet[];
      ecsSecurityGroup: aws.securityGroup.SecurityGroup;
    }
  ) {
    super(scope, id);

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: 'multi-tier-db-subnet-group',
        subnetIds: props.privateSubnets.map(s => s.id),
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // DB Security Group
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      name: 'multi-tier-rds-sg',
      description: 'Security group for RDS PostgreSQL',
      vpcId: props.vpc.id,
      tags: {
        Name: 'multi-tier-rds-sg',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Allow PostgreSQL from ECS
    new aws.securityGroupRule.SecurityGroupRule(this, 'rds-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: this.dbSecurityGroup.id,
      sourceSecurityGroupId: props.ecsSecurityGroup.id,
      description: 'PostgreSQL from ECS',
    });

    // RDS Instance with managed password
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'postgres-db', {
      identifier: 'multi-tier-postgres',
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'multitierdb',
      username: 'dbadmin',
      manageMasterUserPassword: true,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false,
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      tags: {
        Name: 'multi-tier-postgres',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });
  }
}

// ==================== ALB Module ====================
export class AlbModule extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly albSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly listener: aws.lbListener.LbListener;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpc: aws.vpc.Vpc;
      publicSubnets: aws.subnet.Subnet[];
      logsBucket: aws.s3Bucket.S3Bucket;
      bucketPolicy?: aws.s3BucketPolicy.S3BucketPolicy;
    }
  ) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        name: 'multi-tier-alb-sg',
        description: 'Security group for Application Load Balancer',
        vpcId: props.vpc.id,
        tags: {
          Name: 'multi-tier-alb-sg',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // Allow HTTP inbound
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'HTTP from Internet',
    });

    // Allow all outbound
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'All outbound traffic',
    });

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: 'multi-tier-alb-ts',
      loadBalancerType: 'application',
      subnets: props.publicSubnets.map(s => s.id),
      securityGroups: [this.albSecurityGroup.id],
      enableDeletionProtection: false,
      enableHttp2: true,
      accessLogs: {
        bucket: props.logsBucket.bucket,
        prefix: 'alb-logs',
        enabled: true,
      },
      tags: {
        Name: 'multi-tier-alb',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Target Group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
      name: 'multi-tier-tg',
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
      },
      tags: {
        Name: 'multi-tier-tg',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // HTTP Listener - This associates the target group with the ALB
    this.listener = new aws.lbListener.LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: {
        Name: 'multi-tier-http-listener',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });
  }
}

// ==================== ECS Module ====================
export class EcsModule extends Construct {
  public readonly cluster: aws.ecsCluster.EcsCluster;
  public readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;
  public readonly service: aws.ecsService.EcsService;
  public readonly ecsSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly autoScalingGroup: aws.autoscalingGroup.AutoscalingGroup;
  public readonly capacityProvider: aws.ecsCapacityProvider.EcsCapacityProvider;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpc: aws.vpc.Vpc;
      publicSubnets: aws.subnet.Subnet[];
      targetGroup: aws.lbTargetGroup.LbTargetGroup;
      albSecurityGroup: aws.securityGroup.SecurityGroup;
      taskRole: aws.iamRole.IamRole;
      executionRole: aws.iamRole.IamRole;
      instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;
      listener: aws.lbListener.LbListener; // Add listener as dependency
      awsRegion: string;
    }
  ) {
    super(scope, id);

    // Get ECS-optimized AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-ecs-hvm-*-x86_64-ebs'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // ECS Cluster
    this.cluster = new aws.ecsCluster.EcsCluster(this, 'cluster', {
      name: 'multi-tier-cluster',
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: 'multi-tier-cluster',
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // ECS Security Group
    this.ecsSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'ecs-sg',
      {
        name: 'multi-tier-ecs-sg',
        description: 'Security group for ECS instances',
        vpcId: props.vpc.id,
        tags: {
          Name: 'multi-tier-ecs-sg',
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // Allow traffic from ALB
    new aws.securityGroupRule.SecurityGroupRule(this, 'ecs-from-alb', {
      type: 'ingress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      sourceSecurityGroupId: props.albSecurityGroup.id,
      securityGroupId: this.ecsSecurityGroup.id,
      description: 'All TCP from ALB',
    });

    // Allow all outbound
    new aws.securityGroupRule.SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ecsSecurityGroup.id,
      description: 'All outbound traffic',
    });

    // Launch Template for ECS instances
    const launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'ecs-lt',
      {
        namePrefix: 'multi-tier-ecs-',
        imageId: ami.id,
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: props.instanceProfile.arn,
        },
        networkInterfaces: [
          {
            associatePublicIpAddress: 'true',
            securityGroups: [this.ecsSecurityGroup.id],
            deleteOnTermination: 'true',
          },
        ],
        userData: btoa(`#!/bin/bash
echo ECS_CLUSTER=${this.cluster.name} >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config`),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: 'multi-tier-ecs-instance',
              Environment: 'Production',
              Project: 'MultiTierWebApp',
            },
          },
        ],
      }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'ecs-asg',
      {
        name: 'multi-tier-ecs-asg',
        minSize: 2,
        maxSize: 4,
        desiredCapacity: 2,
        vpcZoneIdentifier: props.publicSubnets.map(s => s.id),
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        healthCheckType: 'EC2',
        healthCheckGracePeriod: 300,
        tag: [
          {
            key: 'Name',
            value: 'multi-tier-ecs-instance',
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'Production',
            propagateAtLaunch: true,
          },
          {
            key: 'Project',
            value: 'MultiTierWebApp',
            propagateAtLaunch: true,
          },
        ],
      }
    );

    // Capacity Provider
    this.capacityProvider = new aws.ecsCapacityProvider.EcsCapacityProvider(
      this,
      'capacity-provider',
      {
        name: 'multi-tier-capacity-provider',
        autoScalingGroupProvider: {
          autoScalingGroupArn: this.autoScalingGroup.arn,
          managedScaling: {
            status: 'ENABLED',
            targetCapacity: 80,
            minimumScalingStepSize: 1,
            maximumScalingStepSize: 10,
          },
        },
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // Attach capacity provider to cluster
    new aws.ecsClusterCapacityProviders.EcsClusterCapacityProviders(
      this,
      'cluster-capacity',
      {
        clusterName: this.cluster.name,
        capacityProviders: [this.capacityProvider.name],
        defaultCapacityProviderStrategy: [
          {
            capacityProvider: this.capacityProvider.name,
            weight: 1,
            base: 0,
          },
        ],
      }
    );

    // Create CloudWatch Log Group for ECS (create before task definition)
    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'ecs-log-group', {
      name: '/ecs/multi-tier-app',
      retentionInDays: 7,
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Task Definition
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      this,
      'task-def',
      {
        family: 'multi-tier-app',
        networkMode: 'bridge',
        requiresCompatibilities: ['EC2'],
        cpu: '512',
        memory: '1024',
        taskRoleArn: props.taskRole.arn,
        executionRoleArn: props.executionRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: 'web-app',
            image: 'nginx:latest',
            memory: 512,
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                hostPort: 0,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': '/ecs/multi-tier-app',
                'awslogs-region': props.awsRegion,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // ECS Service - depends on listener to ensure target group is associated with ALB
    this.service = new aws.ecsService.EcsService(this, 'service', {
      name: 'multi-tier-service',
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: 'EC2',
      loadBalancer: [
        {
          targetGroupArn: props.targetGroup.arn,
          containerName: 'web-app',
          containerPort: 80,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      deploymentMinimumHealthyPercent: 50,
      deploymentMaximumPercent: 200,
      dependsOn: [props.listener], // Ensure listener exists before service
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Auto Scaling for ECS Service
    const serviceTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'ecs-scaling-target',
      {
        maxCapacity: 4,
        minCapacity: 2,
        resourceId: `service/${this.cluster.name}/${this.service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    // CPU Scaling Policy
    new aws.appautoscalingPolicy.AppautoscalingPolicy(this, 'ecs-cpu-scaling', {
      name: 'multi-tier-cpu-scaling',
      policyType: 'TargetTrackingScaling',
      resourceId: serviceTarget.resourceId,
      scalableDimension: serviceTarget.scalableDimension,
      serviceNamespace: serviceTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        targetValue: 70,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // Memory Scaling Policy
    new aws.appautoscalingPolicy.AppautoscalingPolicy(
      this,
      'ecs-memory-scaling',
      {
        name: 'multi-tier-memory-scaling',
        policyType: 'TargetTrackingScaling',
        resourceId: serviceTarget.resourceId,
        scalableDimension: serviceTarget.scalableDimension,
        serviceNamespace: serviceTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          targetValue: 80,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      }
    );
  }
}

// ==================== CI/CD Module ====================
export class CicdModule extends Construct {
  public readonly pipeline: aws.codepipeline.Codepipeline;
  public readonly codeBuildProject: aws.codebuildProject.CodebuildProject;
  public readonly snsTopic: aws.snsTopic.SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    props: {
      artifactBucket: aws.s3Bucket.S3Bucket;
      codeBuildRole: aws.iamRole.IamRole;
      codePipelineRole: aws.iamRole.IamRole;
      ecsCluster: aws.ecsCluster.EcsCluster;
      ecsService: aws.ecsService.EcsService;
      awsRegion: string;
      accountId: string;
    }
  ) {
    super(scope, id);

    // SNS Topic for notifications
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'pipeline-notifications', {
      name: 'multi-tier-pipeline-notifications',
      displayName: 'Pipeline Notifications',
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // CodeBuild Project
    this.codeBuildProject = new aws.codebuildProject.CodebuildProject(
      this,
      'build-project',
      {
        name: 'multi-tier-build',
        serviceRole: props.codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:6.0',
          imagePullCredentialsType: 'CODEBUILD',
          privilegedMode: true,
          environmentVariable: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: props.awsRegion,
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: props.accountId,
            },
            {
              name: 'IMAGE_TAG',
              value: 'latest',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: 'buildspec.yml',
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: '/aws/codebuild/multi-tier-build',
            streamName: 'build-logs',
          },
        },
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // CodePipeline
    this.pipeline = new aws.codepipeline.Codepipeline(this, 'pipeline', {
      name: 'multi-tier-pipeline',
      roleArn: props.codePipelineRole.arn,
      artifactStore: [
        {
          type: 'S3',
          location: props.artifactBucket.bucket,
        },
      ],
      stage: [
        {
          name: 'Source',
          action: [
            {
              name: 'Source',
              category: 'Source',
              owner: 'AWS',
              provider: 'S3',
              version: '1',
              outputArtifacts: ['source_output'],
              configuration: {
                S3Bucket: props.artifactBucket.bucket,
                S3ObjectKey: 'source.zip',
              },
            },
          ],
        },
        {
          name: 'Build',
          action: [
            {
              name: 'Build',
              category: 'Build',
              owner: 'AWS',
              provider: 'CodeBuild',
              version: '1',
              inputArtifacts: ['source_output'],
              outputArtifacts: ['build_output'],
              configuration: {
                ProjectName: this.codeBuildProject.name,
              },
            },
          ],
        },
        {
          name: 'Deploy',
          action: [
            {
              name: 'Deploy',
              category: 'Deploy',
              owner: 'AWS',
              provider: 'ECS',
              version: '1',
              inputArtifacts: ['build_output'],
              configuration: {
                ClusterName: props.ecsCluster.name,
                ServiceName: props.ecsService.name,
                FileName: 'imagedefinitions.json',
              },
            },
          ],
        },
      ],
      tags: {
        Environment: 'Production',
        Project: 'MultiTierWebApp',
      },
    });

    // Pipeline notifications
    new aws.codestarnotificationsNotificationRule.CodestarnotificationsNotificationRule(
      this,
      'pipeline-rule',
      {
        name: 'multi-tier-pipeline-notifications',
        resource: this.pipeline.arn,
        detailType: 'FULL',
        eventTypeIds: [
          'codepipeline-pipeline-pipeline-execution-failed',
          'codepipeline-pipeline-pipeline-execution-succeeded',
        ],
        target: [
          {
            address: this.snsTopic.arn,
            type: 'SNS',
          },
        ],
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );
  }
}

// ==================== Monitoring Module ====================
export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly ecsAlarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];
  public readonly rdsAlarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(
    scope: Construct,
    id: string,
    props: {
      ecsCluster: aws.ecsCluster.EcsCluster;
      ecsService: aws.ecsService.EcsService;
      alb: aws.lb.Lb;
      dbInstance: aws.dbInstance.DbInstance;
      snsTopic: aws.snsTopic.SnsTopic;
      awsRegion: string;
    }
  ) {
    super(scope, id);

    this.ecsAlarms = [];
    this.rdsAlarms = [];

    // ECS CPU Utilization Alarm
    this.ecsAlarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'ecs-cpu-alarm',
        {
          alarmName: 'multi-tier-ecs-cpu-high',
          alarmDescription: 'ECS Service CPU utilization is too high',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/ECS',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          dimensions: {
            ServiceName: props.ecsService.name,
            ClusterName: props.ecsCluster.name,
          },
          alarmActions: [props.snsTopic.arn],
          tags: {
            Environment: 'Production',
            Project: 'MultiTierWebApp',
          },
        }
      )
    );

    // ECS Memory Utilization Alarm
    this.ecsAlarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'ecs-memory-alarm',
        {
          alarmName: 'multi-tier-ecs-memory-high',
          alarmDescription: 'ECS Service memory utilization is too high',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'MemoryUtilization',
          namespace: 'AWS/ECS',
          period: 300,
          statistic: 'Average',
          threshold: 85,
          dimensions: {
            ServiceName: props.ecsService.name,
            ClusterName: props.ecsCluster.name,
          },
          alarmActions: [props.snsTopic.arn],
          tags: {
            Environment: 'Production',
            Project: 'MultiTierWebApp',
          },
        }
      )
    );

    // RDS CPU Utilization Alarm
    this.rdsAlarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-cpu-alarm',
        {
          alarmName: 'multi-tier-rds-cpu-high',
          alarmDescription: 'RDS CPU utilization is too high',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 75,
          dimensions: {
            DBInstanceIdentifier: props.dbInstance.identifier,
          },
          alarmActions: [props.snsTopic.arn],
          tags: {
            Environment: 'Production',
            Project: 'MultiTierWebApp',
          },
        }
      )
    );

    // RDS Free Storage Space Alarm
    this.rdsAlarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-storage-alarm',
        {
          alarmName: 'multi-tier-rds-storage-low',
          alarmDescription: 'RDS free storage space is low',
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 1,
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 2147483648, // 2GB in bytes
          dimensions: {
            DBInstanceIdentifier: props.dbInstance.identifier,
          },
          alarmActions: [props.snsTopic.arn],
          tags: {
            Environment: 'Production',
            Project: 'MultiTierWebApp',
          },
        }
      )
    );

    // ALB Target Response Time Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-response-time-alarm',
      {
        alarmName: 'multi-tier-alb-response-time-high',
        alarmDescription: 'ALB target response time is too high',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 2,
        dimensions: {
          LoadBalancer: props.alb.arnSuffix,
        },
        alarmActions: [props.snsTopic.arn],
        tags: {
          Environment: 'Production',
          Project: 'MultiTierWebApp',
        },
      }
    );

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: 'multi-tier-monitoring',
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                title: 'ECS CPU Utilization',
                period: 300,
                stat: 'Average',
                region: props.awsRegion,
                metrics: [['AWS/ECS', 'CPUUtilization', { stat: 'Average' }]],
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'ECS Memory Utilization',
                period: 300,
                stat: 'Average',
                region: props.awsRegion,
                metrics: [
                  ['AWS/ECS', 'MemoryUtilization', { stat: 'Average' }],
                ],
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'RDS CPU Utilization',
                period: 300,
                stat: 'Average',
                region: props.awsRegion,
                metrics: [['AWS/RDS', 'CPUUtilization', { stat: 'Average' }]],
              },
            },
            {
              type: 'metric',
              properties: {
                title: 'ALB Request Count',
                period: 300,
                stat: 'Sum',
                region: props.awsRegion,
                metrics: [
                  ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum' }],
                ],
              },
            },
          ],
        }),
      }
    );
  }
}
