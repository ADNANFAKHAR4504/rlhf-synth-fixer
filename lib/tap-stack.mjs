/**
 * tap-stack.mjs
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the robust cloud environment with S3, EC2, Load Balancer, and security components.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'prod' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 */

/**
 * Represents the main Pulumi component resource for the robust cloud infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'prod';
    const projectName = 'myapp';
    const tags = args.tags || {};
    
    // Merge default tags
    const defaultTags = {
      Project: projectName,
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      ...tags
    };

    // Get availability zones for us-west-1
    const azs = aws.getAvailabilityZones({ state: 'available' });
    
    // Get the latest Amazon Linux 2023 AMI in us-west-1
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64']
        },
        {
          name: 'virtualization-type',
          values: ['hvm']
        },
        {
          name: 'architecture',
          values: ['x86_64']
        },
        {
          name: 'state',
          values: ['available']
        }
      ]
    });
    
    // Note: KeyPair creation removed - EC2 instances will launch without SSH key access
    // This is acceptable for this demo infrastructure as instances have web access via ALB

    // Create VPC
    const vpc = new aws.ec2.Vpc(`${projectName}-${environmentSuffix}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${projectName}-${environmentSuffix}-vpc`,
        ...defaultTags
      }
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`${projectName}-${environmentSuffix}-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environmentSuffix}-igw`,
        ...defaultTags
      }
    }, { parent: this });

    // Create public subnets in two AZs
    const publicSubnet1 = new aws.ec2.Subnet(`${projectName}-${environmentSuffix}-public-subnet-1`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: azs.then(azs => azs.names[0]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${projectName}-${environmentSuffix}-public-subnet-1`,
        Type: 'Public',
        ...defaultTags
      }
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`${projectName}-${environmentSuffix}-public-subnet-2`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: azs.then(azs => azs.names[1]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${projectName}-${environmentSuffix}-public-subnet-2`,
        Type: 'Public',
        ...defaultTags
      }
    }, { parent: this });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(`${projectName}-${environmentSuffix}-public-rt`, {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environmentSuffix}-public-rt`,
        ...defaultTags
      }
    }, { parent: this });

    // Route to Internet Gateway
    const publicRoute = new aws.ec2.Route(`${projectName}-${environmentSuffix}-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id
    }, { parent: this });

    // Associate route table with public subnets
    const publicRtAssoc1 = new aws.ec2.RouteTableAssociation(`${projectName}-${environmentSuffix}-public-rt-assoc-1`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id
    }, { parent: this });

    const publicRtAssoc2 = new aws.ec2.RouteTableAssociation(`${projectName}-${environmentSuffix}-public-rt-assoc-2`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id
    }, { parent: this });

    // Create S3 bucket for application logs with versioning
    const logsBucket = new aws.s3.Bucket(`myapp-${environmentSuffix}-logs-bucket`, {
      bucket: `myapp-${environmentSuffix.toLowerCase()}-logs-${pulumi.getStack().toLowerCase()}`,
      tags: {
        Name: `myapp-${environmentSuffix}-logs-bucket`,
        Purpose: 'ApplicationLogs',
        ...defaultTags
      }
    }, { parent: this });
    
    // Create S3 bucket versioning configuration
    const bucketVersioning = new aws.s3.BucketVersioning(`myapp-${environmentSuffix}-logs-versioning`, {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled'
      }
    }, { parent: this });
    
    // Create S3 bucket public access block
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`myapp-${environmentSuffix}-logs-pab`, {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    }, { parent: this });
    
    // Create S3 bucket server side encryption configuration
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`myapp-${environmentSuffix}-logs-encryption`, {
      bucket: logsBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256'
        }
      }]
    }, { parent: this });

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(`${projectName}-${environmentSuffix}-ec2-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }
        ]
      }),
      tags: {
        Name: `${projectName}-${environmentSuffix}-ec2-role`,
        ...defaultTags
      }
    }, { parent: this });

    // Create custom IAM policy for S3 access
    const s3LogsPolicy = new aws.iam.Policy(`${projectName}-${environmentSuffix}-s3-logs-policy`, {
      description: 'Allow access to application logs bucket',
      policy: logsBucket.arn.apply(bucketArn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket'
            ],
            Resource: [
              bucketArn,
              `${bucketArn}/*`
            ]
          }
        ]
      })),
      tags: {
        Name: `${projectName}-${environmentSuffix}-s3-logs-policy`,
        ...defaultTags
      }
    }, { parent: this });

    // Attach policy to role
    const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(`${projectName}-${environmentSuffix}-role-policy-attachment`, {
      role: ec2Role.name,
      policyArn: s3LogsPolicy.arn
    }, { parent: this });

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(`${projectName}-${environmentSuffix}-instance-profile`, {
      role: ec2Role.name,
      tags: {
        Name: `${projectName}-${environmentSuffix}-instance-profile`,
        ...defaultTags
      }
    }, { parent: this });

    // Create security group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(`${projectName}-${environmentSuffix}-ec2-sg`, {
      namePrefix: `${projectName}-${environmentSuffix}-ec2-sg`,
      vpcId: vpc.id,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP access'
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS access'
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'SSH access from VPC'
        }
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic'
        }
      ],
      tags: {
        Name: `${projectName}-${environmentSuffix}-ec2-sg`,
        ...defaultTags
      }
    }, { parent: this });

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${projectName}-${environmentSuffix}-alb-sg`, {
      namePrefix: `${projectName}-${environmentSuffix}-alb-sg`,
      vpcId: vpc.id,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP access'
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS access'
        }
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic'
        }
      ],
      tags: {
        Name: `${projectName}-${environmentSuffix}-alb-sg`,
        ...defaultTags
      }
    }, { parent: this });

    // Create EC2 instance in first AZ
    const ec2Instance1 = new aws.ec2.Instance(`${projectName}-${environmentSuffix}-instance-1`, {
      ami: ami.then(ami => ami.id),
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      subnetId: publicSubnet1.id,
      iamInstanceProfile: instanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Instance 1 - AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html
`,
      tags: {
        Name: `${projectName}-${environmentSuffix}-instance-1`,
        AZ: 'us-west-1a',
        ...defaultTags
      }
    }, { parent: this });

    // Create EC2 instance in second AZ
    const ec2Instance2 = new aws.ec2.Instance(`${projectName}-${environmentSuffix}-instance-2`, {
      ami: ami.then(ami => ami.id),
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      subnetId: publicSubnet2.id,
      iamInstanceProfile: instanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Instance 2 - AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html
`,
      tags: {
        Name: `${projectName}-${environmentSuffix}-instance-2`,
        AZ: 'us-west-1b',
        ...defaultTags
      }
    }, { parent: this });

    // Create Elastic IPs
    const eip1 = new aws.ec2.Eip(`${projectName}-${environmentSuffix}-eip-1`, {
      instance: ec2Instance1.id,
      domain: 'vpc',
      tags: {
        Name: `${projectName}-${environmentSuffix}-eip-1`,
        ...defaultTags
      }
    }, { parent: this });

    const eip2 = new aws.ec2.Eip(`${projectName}-${environmentSuffix}-eip-2`, {
      instance: ec2Instance2.id,
      domain: 'vpc',
      tags: {
        Name: `${projectName}-${environmentSuffix}-eip-2`,
        ...defaultTags
      }
    }, { parent: this });

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`myapp-${environmentSuffix}-alb`, {
      namePrefix: `tap-`,
      loadBalancerType: 'application',
      subnets: [publicSubnet1.id, publicSubnet2.id],
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: false,
      tags: {
        Name: `${projectName}-${environmentSuffix}-alb`,
        ...defaultTags
      }
    }, { parent: this });

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(`myapp-${environmentSuffix}-tg`, {
      namePrefix: `tap-`,
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
        unhealthyThreshold: 2
      },
      tags: {
        Name: `${projectName}-${environmentSuffix}-tg`,
        ...defaultTags
      }
    }, { parent: this });

    // Attach instances to target group
    const targetGroupAttachment1 = new aws.lb.TargetGroupAttachment(`${projectName}-${environmentSuffix}-tg-attachment-1`, {
      targetGroupArn: targetGroup.arn,
      targetId: ec2Instance1.id,
      port: 80
    }, { parent: this });

    const targetGroupAttachment2 = new aws.lb.TargetGroupAttachment(`${projectName}-${environmentSuffix}-tg-attachment-2`, {
      targetGroupArn: targetGroup.arn,
      targetId: ec2Instance2.id,
      port: 80
    }, { parent: this });

    // Create listener
    const listener = new aws.lb.Listener(`${projectName}-${environmentSuffix}-listener`, {
      loadBalancerArn: alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultActions: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn
        }
      ],
      tags: {
        Name: `${projectName}-${environmentSuffix}-listener`,
        ...defaultTags
      }
    }, { parent: this });

    // Enable AWS Shield Advanced (optional - requires subscription)
    // Note: This is a premium service and requires manual subscription
    // Uncomment if you have AWS Shield Advanced subscription
    /*
    const shieldProtection = new aws.shield.Protection(`${projectName}-${environmentSuffix}-shield`, {
      name: `${projectName}-${environmentSuffix}-alb-protection`,
      resourceArn: alb.arn,
      tags: {
        Name: `${projectName}-${environmentSuffix}-shield`,
        ...defaultTags
      }
    }, { parent: this });
    */

    // Store outputs for export
    this.bucketName = logsBucket.bucket;
    this.albDnsName = alb.dnsName;
    this.vpcId = vpc.id;
    this.eip1Address = eip1.publicIp;
    this.eip2Address = eip2.publicIp;
    this.instance1Id = ec2Instance1.id;
    this.instance2Id = ec2Instance2.id;

    // Register outputs
    this.registerOutputs({
      bucketName: this.bucketName,
      albDnsName: this.albDnsName,
      vpcId: this.vpcId,
      elasticIp1: this.eip1Address,
      elasticIp2: this.eip2Address,
      instance1Id: this.instance1Id,
      instance2Id: this.instance2Id
    });
  }
}

