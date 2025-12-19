import { Construct } from 'constructs';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb as ApplicationLoadBalancer } from '@cdktf/provider-aws/lib/alb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { DataAwsAmiIds } from '@cdktf/provider-aws/lib/data-aws-ami-ids';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { Fn } from 'cdktf';

export interface VpcModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        Environment: 'production',
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-igw`,
      },
    });

    // Create public subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${index + 1}`,
          Type: 'public',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        tags: {
          Name: `${id}-private-subnet-${index + 1}`,
          Type: 'private',
        },
      });
    });

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `${id}-nat-eip-${index + 1}`,
        },
      });
    });

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `${id}-nat-gateway-${index + 1}`,
        },
      });
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-public-rt`,
      },
    });

    // Add route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create private route tables and associate with NAT gateways
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-private-rt-${index + 1}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

export interface S3ModuleProps {
  bucketName: string;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Create S3 bucket (keep it private)
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        Purpose: 'static-website-hosting',
      },
    });

    // Configure bucket for static website hosting (optional for CloudFront setup)
    new S3BucketWebsiteConfiguration(this, 'website-config', {
      bucket: this.bucket.id,
      indexDocument: {
        suffix: 'index.html',
      },
      errorDocument: {
        key: 'error.html',
      },
    });

    // Keep bucket private but allow CloudFront access
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: false, // Allow CloudFront policy
      ignorePublicAcls: true,
      restrictPublicBuckets: false, // Allow CloudFront access
    });

    // Create Origin Access Control
    const oac = new CloudfrontOriginAccessControl(this, 'oac', {
      name: `${props.bucketName}-oac`,
      description: 'OAC for S3 bucket',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // Create CloudFront distribution
    this.distribution = new CloudfrontDistribution(this, 'distribution', {
      origin: [
        {
          domainName: this.bucket.bucketDomainName,
          originId: 's3-origin',
          originAccessControlId: oac.id,
        },
      ],
      enabled: true,
      defaultRootObject: 'index.html',
      defaultCacheBehavior: {
        targetOriginId: 's3-origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
      },
      customErrorResponse: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
      ],
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      tags: {
        Name: `${props.bucketName}-distribution`,
        Purpose: 'static-website-cdn',
      },
    });

    // Create bucket policy for CloudFront OAC
    const bucketPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'bucket-policy-document',
      {
        statement: [
          {
            sid: 'AllowCloudFrontServicePrincipal',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudfront.amazonaws.com'],
              },
            ],
            actions: ['s3:GetObject'],
            resources: [`${this.bucket.arn}/*`],
            condition: [
              {
                test: 'StringEquals',
                variable: 'AWS:SourceArn',
                values: [this.distribution.arn],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument.json,
    });
  }
}

export interface IamModuleProps {
  roleName: string;
}

export class IamModule extends Construct {
  public readonly instanceRole: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create assume role policy document
    const assumeRolePolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    // Create IAM role for EC2 instances
    this.instanceRole = new IamRole(this, 'instance-role', {
      name: props.roleName,
      assumeRolePolicy: assumeRolePolicyDocument.json,
      tags: {
        Name: props.roleName,
        Purpose: 'ec2-web-server-role',
      },
    });

    // Attach necessary policies
    new IamRolePolicyAttachment(this, 'ssm-policy-attachment', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-policy-attachment', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${props.roleName}-profile`,
      role: this.instanceRole.name,
    });
  }
}

export interface AutoScalingModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  publicSubnetIds: string[];
  instanceProfile: IamInstanceProfile;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
}

export class AutoScalingModule extends Construct {
  public readonly loadBalancer: ApplicationLoadBalancer;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: AutoScalingModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const amiData = new DataAwsAmiIds(this, 'amazon-linux-ami', {
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
      sortAscending: false,
    });

    // Create security group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${id}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
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
      tags: {
        Name: `${id}-alb-sg`,
      },
    });

    // Create security group for EC2 instances
    const instanceSecurityGroup = new SecurityGroup(this, 'instance-sg', {
      name: `${id}-instance-sg`,
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
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
      tags: {
        Name: `${id}-instance-sg`,
      },
    });

    // User data script for web server setup
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
echo "<h1>Error Page</h1>" > /var/www/html/error.html
`;

    // Create launch template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${id}-launch-template`,
      imageId: Fn.element(amiData.ids, 0),
      instanceType: 't3.micro',
      iamInstanceProfile: {
        name: props.instanceProfile.name,
      },
      vpcSecurityGroupIds: [instanceSecurityGroup.id],
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${id}-web-server`,
            Environment: 'production',
          },
        },
      ],
    });

    // Create Application Load Balancer
    this.loadBalancer = new ApplicationLoadBalancer(this, 'alb', {
      name: `${id}-alb`,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `${id}-alb`,
      },
    });

    // Create target group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${id}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
      },
      tags: {
        Name: `${id}-target-group`,
      },
    });

    // Create ALB listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${id}-asg`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${id}-asg`,
          propagateAtLaunch: false,
        },
      ],
    });
  }
}
