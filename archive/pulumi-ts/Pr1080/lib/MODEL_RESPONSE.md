```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration
const config = new pulumi.Config();
const vpcCidr = config.get('vpcCidr') || '10.0.0.0/16';
const sshAllowedCidr = config.get('sshAllowedCidr') || '0.0.0.0/0';
const projectName = config.get('projectName') || 'production-web-app';

// Common tags
const commonTags = {
  Environment: 'Production',
};

// Get availability zones
const availabilityZones = aws.getAvailabilityZones({
  state: 'available',
});

// VPC
const vpc = new aws.ec2.Vpc('main-vpc', {
  cidrBlock: vpcCidr,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `${projectName}-vpc`,
    ...commonTags,
  },
});

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway('main-igw', {
  vpcId: vpc.id,
  tags: {
    Name: `${projectName}-igw`,
    ...commonTags,
  },
});

// Public Subnets
const publicSubnets = [];
const privateSubnets = [];

for (let i = 0; i < 3; i++) {
  // Public Subnet
  const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i + 1}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i + 1}.0/24`,
    availabilityZone: availabilityZones.then(azs => azs.names[i]),
    mapPublicIpOnLaunch: true,
    tags: {
      Name: `${projectName}-public-subnet-${i + 1}`,
      Type: 'Public',
      ...commonTags,
    },
  });
  publicSubnets.push(publicSubnet);

  // Private Subnet
  const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i + 1}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i + 10}.0/24`,
    availabilityZone: availabilityZones.then(azs => azs.names[i]),
    tags: {
      Name: `${projectName}-private-subnet-${i + 1}`,
      Type: 'Private',
      ...commonTags,
    },
  });
  privateSubnets.push(privateSubnet);
}

// NAT Gateways
const natGateways = [];
const elasticIps = [];

for (let i = 0; i < 3; i++) {
  const elasticIp = new aws.ec2.Eip(`nat-eip-${i + 1}`, {
    domain: 'vpc',
    tags: {
      Name: `${projectName}-nat-eip-${i + 1}`,
      ...commonTags,
    },
  });
  elasticIps.push(elasticIp);

  const natGateway = new aws.ec2.NatGateway(`nat-gateway-${i + 1}`, {
    allocationId: elasticIp.id,
    subnetId: publicSubnets[i].id,
    tags: {
      Name: `${projectName}-nat-gateway-${i + 1}`,
      ...commonTags,
    },
  });
  natGateways.push(natGateway);
}

// Public Route Table
const publicRouteTable = new aws.ec2.RouteTable('public-rt', {
  vpcId: vpc.id,
  tags: {
    Name: `${projectName}-public-rt`,
    ...commonTags,
  },
});

const publicRoute = new aws.ec2.Route('public-route', {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: internetGateway.id,
});

// Associate public subnets with public route table
publicSubnets.forEach((subnet, index) => {
  new aws.ec2.RouteTableAssociation(`public-rta-${index + 1}`, {
    subnetId: subnet.id,
    routeTableId: publicRouteTable.id,
  });
});

// Private Route Tables
privateSubnets.forEach((subnet, index) => {
  const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${index + 1}`, {
    vpcId: vpc.id,
    tags: {
      Name: `${projectName}-private-rt-${index + 1}`,
      ...commonTags,
    },
  });

  new aws.ec2.Route(`private-route-${index + 1}`, {
    routeTableId: privateRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGateways[index].id,
  });

  new aws.ec2.RouteTableAssociation(`private-rta-${index + 1}`, {
    subnetId: subnet.id,
    routeTableId: privateRouteTable.id,
  });
});

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup('alb-sg', {
  name: `${projectName}-alb-sg`,
  description: 'Security group for Application Load Balancer',
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
  tags: {
    Name: `${projectName}-alb-sg`,
    ...commonTags,
  },
});

const ec2SecurityGroup = new aws.ec2.SecurityGroup('ec2-sg', {
  name: `${projectName}-ec2-sg`,
  description: 'Security group for EC2 instances',
  vpcId: vpc.id,
  ingress: [
    {
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [sshAllowedCidr],
    },
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
    Name: `${projectName}-ec2-sg`,
    ...commonTags,
  },
});

const rdsSecurityGroup = new aws.ec2.SecurityGroup('rds-sg', {
  name: `${projectName}-rds-sg`,
  description: 'Security group for RDS MySQL instance',
  vpcId: vpc.id,
  ingress: [
    {
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      securityGroups: [ec2SecurityGroup.id],
    },
  ],
  tags: {
    Name: `${projectName}-rds-sg`,
    ...commonTags,
  },
});

// IAM Role for EC2
const ec2Role = new aws.iam.Role('ec2-role', {
  name: `${projectName}-ec2-role`,
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

const ec2Policy = new aws.iam.RolePolicy('ec2-policy', {
  name: `${projectName}-ec2-policy`,
  role: ec2Role.id,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        Resource: '*',
      },
    ],
  }),
});

const ec2InstanceProfile = new aws.iam.InstanceProfile('ec2-instance-profile', {
  name: `${projectName}-ec2-instance-profile`,
  role: ec2Role.name,
  tags: commonTags,
});

// IAM Role for RDS
const rdsRole = new aws.iam.Role('rds-role', {
  name: `${projectName}-rds-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'rds.amazonaws.com',
        },
      },
    ],
  }),
  tags: commonTags,
});

// KMS Key for RDS encryption
const rdsKmsKey = new aws.kms.Key('rds-kms-key', {
  description: 'KMS key for RDS encryption',
  tags: {
    Name: `${projectName}-rds-kms-key`,
    ...commonTags,
  },
});

const rdsKmsAlias = new aws.kms.Alias('rds-kms-alias', {
  name: `alias/${projectName}-rds-key`,
  targetKeyId: rdsKmsKey.keyId,
});

// RDS Subnet Group
const rdsSubnetGroup = new aws.rds.SubnetGroup('rds-subnet-group', {
  name: `${projectName}-rds-subnet-group`,
  subnetIds: privateSubnets.map(subnet => subnet.id),
  tags: {
    Name: `${projectName}-rds-subnet-group`,
    ...commonTags,
  },
});

// RDS MySQL Instance
const rdsInstance = new aws.rds.Instance('mysql-instance', {
  identifier: `${projectName}-mysql`,
  engine: 'mysql',
  engineVersion: '8.0',
  instanceClass: 'db.t3.micro',
  allocatedStorage: 20,
  storageType: 'gp2',
  storageEncrypted: true,
  kmsKeyId: rdsKmsKey.arn,
  dbName: 'production',
  username: 'admin',
  password: 'changeme123!',
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  dbSubnetGroupName: rdsSubnetGroup.name,
  skipFinalSnapshot: true,
  tags: {
    Name: `${projectName}-mysql`,
    ...commonTags,
  },
});

// Launch Template
const launchTemplate = new aws.ec2.LaunchTemplate('launch-template', {
  name: `${projectName}-launch-template`,
  imageId: aws.ec2
    .getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    })
    .then(ami => ami.id),
  instanceType: 't3.micro',
  vpcSecurityGroupIds: [ec2SecurityGroup.id],
  iamInstanceProfile: {
    name: ec2InstanceProfile.name,
  },
  userData: Buffer.from(
    `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
`
  ).toString('base64'),
  tagSpecifications: [
    {
      resourceType: 'instance',
      tags: {
        Name: `${projectName}-instance`,
        ...commonTags,
      },
    },
  ],
  tags: {
    Name: `${projectName}-launch-template`,
    ...commonTags,
  },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer('app-lb', {
  name: `${projectName}-alb`,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: publicSubnets.map(subnet => subnet.id),
  tags: {
    Name: `${projectName}-alb`,
    ...commonTags,
  },
});

// Target Group
const targetGroup = new aws.lb.TargetGroup('app-tg', {
  name: `${projectName}-tg`,
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
  tags: {
    Name: `${projectName}-tg`,
    ...commonTags,
  },
});

// ALB Listener
const albListener = new aws.lb.Listener('app-listener', {
  loadBalancerArn: alb.arn,
  port: '80',
  protocol: 'HTTP',
  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
  tags: {
    Name: `${projectName}-listener`,
    ...commonTags,
  },
});

// Auto Scaling Group
const autoScalingGroup = new aws.autoscaling.Group('app-asg', {
  name: `${projectName}-asg`,
  vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
  targetGroupArns: [targetGroup.arn],
  healthCheckType: 'ELB',
  healthCheckGracePeriod: 300,
  minSize: 2,
  maxSize: 6,
  desiredCapacity: 2,
  launchTemplate: {
    id: launchTemplate.id,
    version: '$Latest',
  },
  tags: [
    {
      key: 'Name',
      value: `${projectName}-asg`,
      propagateAtLaunch: true,
    },
    {
      key: 'Environment',
      value: 'Production',
      propagateAtLaunch: true,
    },
  ],
});

// S3 Bucket
const s3Bucket = new aws.s3.Bucket('app-bucket', {
  bucket: `${projectName}-bucket-${Math.random()
    .toString(36)
    .substring(2, 15)}`,
  tags: {
    Name: `${projectName}-bucket`,
    ...commonTags,
  },
});

// S3 Bucket Versioning
const s3BucketVersioning = new aws.s3.BucketVersioningV2(
  'app-bucket-versioning',
  {
    bucket: s3Bucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

// S3 Bucket Public Access Block
const s3BucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  'app-bucket-pab',
  {
    bucket: s3Bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Exports
export const vpcId = vpc.id;
export const publicSubnetIds = publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = privateSubnets.map(subnet => subnet.id);
export const albDnsName = alb.dnsName;
export const rdsEndpoint = rdsInstance.endpoint;
export const s3BucketName = s3Bucket.id;
```
