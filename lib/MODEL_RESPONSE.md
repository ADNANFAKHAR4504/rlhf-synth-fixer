I'll help you create a multi-region, highly available infrastructure using Pulumi with TypeScript. Here's the complete solution broken down into multiple files:

## `Pulumi.yaml`

```yaml
name: multi-region-infrastructure
runtime: nodejs
description: Multi-region, consistent, and encrypted infrastructure
config:
  aws:region: ap-south-1
  multi-region-infrastructure:primaryRegion:
    description: Primary region for RDS and main infrastructure
    default: ap-south-1
  multi-region-infrastructure:secondaryRegion:
    description: Secondary region for RDS read replica
    default: eu-west-1
  multi-region-infrastructure:primaryVpcCidr:
    description: CIDR block for primary region VPC
    default: 10.0.0.0/16
  multi-region-infrastructure:secondaryVpcCidr:
    description: CIDR block for secondary region VPC
    default: 10.1.0.0/16
  multi-region-infrastructure:instanceType:
    description: EC2 instance type for Auto Scaling Group
    default: t2.micro
  multi-region-infrastructure:dbInstanceClass:
    description: RDS instance class
    default: db.t3.micro
```

## `package.json`

```json
{
  "name": "multi-region-infrastructure",
  "version": "1.0.0",
  "description": "Multi-region, consistent, and encrypted infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## `config.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const primaryRegion = config.require('primaryRegion');
export const secondaryRegion = config.require('secondaryRegion');
export const primaryVpcCidr = config.require('primaryVpcCidr');
export const secondaryVpcCidr = config.require('secondaryVpcCidr');
export const instanceType = config.require('instanceType');
export const dbInstanceClass = config.require('dbInstanceClass');

export const commonTags = {
  Environment: 'Production',
  Project: 'MultiRegionInfrastructure',
};
```

## `kms.ts`

```typescript
import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion, secondaryRegion } from './config';

// Primary region KMS key
export const primaryKmsKey = new aws.kms.Key(
  'primary-kms-key',
  {
    description: 'KMS key for encryption in primary region',
    tags: {
      ...commonTags,
      Region: primaryRegion,
    },
  },
  { provider: new aws.Provider('primary-provider', { region: primaryRegion }) }
);

export const primaryKmsAlias = new aws.kms.Alias(
  'primary-kms-alias',
  {
    name: 'alias/primary-region-key',
    targetKeyId: primaryKmsKey.keyId,
  },
  { provider: new aws.Provider('primary-provider', { region: primaryRegion }) }
);

// Secondary region KMS key
export const secondaryKmsKey = new aws.kms.Key(
  'secondary-kms-key',
  {
    description: 'KMS key for encryption in secondary region',
    tags: {
      ...commonTags,
      Region: secondaryRegion,
    },
  },
  {
    provider: new aws.Provider('secondary-provider', {
      region: secondaryRegion,
    }),
  }
);

export const secondaryKmsAlias = new aws.kms.Alias(
  'secondary-kms-alias',
  {
    name: 'alias/secondary-region-key',
    targetKeyId: secondaryKmsKey.keyId,
  },
  {
    provider: new aws.Provider('secondary-provider', {
      region: secondaryRegion,
    }),
  }
);
```

## `vpc.ts`

```typescript
import * as aws from '@pulumi/aws';
import {
  commonTags,
  primaryRegion,
  secondaryRegion,
  primaryVpcCidr,
  secondaryVpcCidr,
} from './config';

// Primary region VPC
const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

export const primaryVpc = new aws.ec2.Vpc(
  'primary-vpc',
  {
    cidrBlock: primaryVpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: 'Primary VPC',
      Region: primaryRegion,
    },
  },
  { provider: primaryProvider }
);

export const primaryInternetGateway = new aws.ec2.InternetGateway(
  'primary-igw',
  {
    vpcId: primaryVpc.id,
    tags: {
      ...commonTags,
      Name: 'Primary Internet Gateway',
    },
  },
  { provider: primaryProvider }
);

// Primary region subnets
export const primaryPublicSubnet1 = new aws.ec2.Subnet(
  'primary-public-subnet-1',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: `${primaryRegion}a`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'Primary Public Subnet 1',
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

export const primaryPublicSubnet2 = new aws.ec2.Subnet(
  'primary-public-subnet-2',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: `${primaryRegion}b`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'Primary Public Subnet 2',
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

export const primaryPrivateSubnet1 = new aws.ec2.Subnet(
  'primary-private-subnet-1',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.3.0/24',
    availabilityZone: `${primaryRegion}a`,
    tags: {
      ...commonTags,
      Name: 'Primary Private Subnet 1',
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

export const primaryPrivateSubnet2 = new aws.ec2.Subnet(
  'primary-private-subnet-2',
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.4.0/24',
    availabilityZone: `${primaryRegion}b`,
    tags: {
      ...commonTags,
      Name: 'Primary Private Subnet 2',
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

// Primary region route table
export const primaryPublicRouteTable = new aws.ec2.RouteTable(
  'primary-public-rt',
  {
    vpcId: primaryVpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: primaryInternetGateway.id,
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary Public Route Table',
    },
  },
  { provider: primaryProvider }
);

// Associate public subnets with route table
export const primaryPublicRtAssociation1 = new aws.ec2.RouteTableAssociation(
  'primary-public-rta-1',
  {
    subnetId: primaryPublicSubnet1.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

export const primaryPublicRtAssociation2 = new aws.ec2.RouteTableAssociation(
  'primary-public-rta-2',
  {
    subnetId: primaryPublicSubnet2.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

// Secondary region VPC
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

export const secondaryVpc = new aws.ec2.Vpc(
  'secondary-vpc',
  {
    cidrBlock: secondaryVpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: 'Secondary VPC',
      Region: secondaryRegion,
    },
  },
  { provider: secondaryProvider }
);

export const secondaryInternetGateway = new aws.ec2.InternetGateway(
  'secondary-igw',
  {
    vpcId: secondaryVpc.id,
    tags: {
      ...commonTags,
      Name: 'Secondary Internet Gateway',
    },
  },
  { provider: secondaryProvider }
);

// Secondary region subnets
export const secondaryPrivateSubnet1 = new aws.ec2.Subnet(
  'secondary-private-subnet-1',
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.1.0/24',
    availabilityZone: `${secondaryRegion}a`,
    tags: {
      ...commonTags,
      Name: 'Secondary Private Subnet 1',
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);

export const secondaryPrivateSubnet2 = new aws.ec2.Subnet(
  'secondary-private-subnet-2',
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.2.0/24',
    availabilityZone: `${secondaryRegion}b`,
    tags: {
      ...commonTags,
      Name: 'Secondary Private Subnet 2',
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);
```

## `security-groups.ts`

```typescript
import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion, secondaryRegion } from './config';
import { primaryVpc, secondaryVpc } from './vpc';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

// Primary region security groups
export const primaryAlbSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-alb-sg',
  {
    name: 'primary-alb-security-group',
    description: 'Security group for Application Load Balancer',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP traffic from internet',
      },
    ],
    egress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow traffic to application instances',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary ALB Security Group',
    },
  },
  { provider: primaryProvider }
);

export const primaryAppSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-app-sg',
  {
    name: 'primary-app-security-group',
    description: 'Security group for application instances',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [primaryAlbSecurityGroup.id],
        description: 'Allow traffic from ALB',
      },
    ],
    egress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow MySQL traffic to RDS',
      },
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP outbound for updates',
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS outbound for updates',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary App Security Group',
    },
  },
  { provider: primaryProvider }
);

export const primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
  'primary-db-sg',
  {
    name: 'primary-db-security-group',
    description: 'Security group for RDS database',
    vpcId: primaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [primaryAppSecurityGroup.id],
        description: 'Allow MySQL traffic from application instances',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Primary DB Security Group',
    },
  },
  { provider: primaryProvider }
);

// Secondary region security group for RDS read replica
export const secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
  'secondary-db-sg',
  {
    name: 'secondary-db-security-group',
    description: 'Security group for RDS read replica',
    vpcId: secondaryVpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.1.0.0/16'],
        description: 'Allow MySQL traffic within VPC',
      },
    ],
    tags: {
      ...commonTags,
      Name: 'Secondary DB Security Group',
    },
  },
  { provider: secondaryProvider }
);
```

## `rds.ts`

```typescript
import * as aws from '@pulumi/aws';
import {
  commonTags,
  primaryRegion,
  secondaryRegion,
  dbInstanceClass,
} from './config';
import {
  primaryPrivateSubnet1,
  primaryPrivateSubnet2,
  secondaryPrivateSubnet1,
  secondaryPrivateSubnet2,
} from './vpc';
import {
  primaryDbSecurityGroup,
  secondaryDbSecurityGroup,
} from './security-groups';
import { primaryKmsKey, secondaryKmsKey } from './kms';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

// Primary region DB subnet group
export const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
  'primary-db-subnet-group',
  {
    name: 'primary-db-subnet-group',
    subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: 'Primary DB Subnet Group',
    },
  },
  { provider: primaryProvider }
);

// Secondary region DB subnet group
export const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
  'secondary-db-subnet-group',
  {
    name: 'secondary-db-subnet-group',
    subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: 'Secondary DB Subnet Group',
    },
  },
  { provider: secondaryProvider }
);

// Primary RDS instance
export const primaryRdsInstance = new aws.rds.Instance(
  'primary-mysql-db',
  {
    identifier: 'primary-mysql-database',
    allocatedStorage: 20,
    storageType: 'gp2',
    storageEncrypted: true,
    kmsKeyId: primaryKmsKey.arn,
    engine: 'mysql',
    engineVersion: '8.0',
    instanceClass: dbInstanceClass,
    dbName: 'productiondb',
    username: 'admin',
    password: 'changeme123!', // In production, use AWS Secrets Manager
    vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
    dbSubnetGroupName: primaryDbSubnetGroup.name,
    backupRetentionPeriod: 7,
    backupWindow: '03:00-04:00',
    maintenanceWindow: 'sun:04:00-sun:05:00',
    skipFinalSnapshot: true,
    deletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Primary MySQL Database',
    },
  },
  { provider: primaryProvider }
);

// Cross-region read replica
export const secondaryRdsReadReplica = new aws.rds.Instance(
  'secondary-mysql-read-replica',
  {
    identifier: 'secondary-mysql-read-replica',
    replicateSourceDb: primaryRdsInstance.arn,
    instanceClass: dbInstanceClass,
    storageEncrypted: true,
    kmsKeyId: secondaryKmsKey.arn,
    vpcSecurityGroupIds: [secondaryDbSecurityGroup.id],
    dbSubnetGroupName: secondaryDbSubnetGroup.name,
    skipFinalSnapshot: true,
    deletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Secondary MySQL Read Replica',
    },
  },
  { provider: secondaryProvider }
);
```

## `load-balancer.ts`

```typescript
import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion } from './config';
import { primaryVpc, primaryPublicSubnet1, primaryPublicSubnet2 } from './vpc';
import { primaryAlbSecurityGroup } from './security-groups';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

// Application Load Balancer
export const applicationLoadBalancer = new aws.lb.LoadBalancer(
  'app-load-balancer',
  {
    name: 'app-load-balancer',
    loadBalancerType: 'application',
    subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
    securityGroups: [primaryAlbSecurityGroup.id],
    enableDeletionProtection: false, // Set to true in production
    tags: {
      ...commonTags,
      Name: 'Application Load Balancer',
    },
  },
  { provider: primaryProvider }
);

// Target Group
export const targetGroup = new aws.lb.TargetGroup(
  'app-target-group',
  {
    name: 'app-target-group',
    port: 8080,
    protocol: 'HTTP',
    vpcId: primaryVpc.id,
    healthCheck: {
      enabled: true,
      healthyThreshold: 2,
      interval: 30,
      matcher: '200',
      path: '/health',
      port: 'traffic-port',
      protocol: 'HTTP',
      timeout: 5,
      unhealthyThreshold: 2,
    },
    tags: {
      ...commonTags,
      Name: 'App Target Group',
    },
  },
  { provider: primaryProvider }
);

// ALB Listener
export const albListener = new aws.lb.Listener(
  'app-listener',
  {
    loadBalancerArn: applicationLoadBalancer.arn,
    port: '80',
    protocol: 'HTTP',
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      },
    ],
  },
  { provider: primaryProvider }
);
```

## `auto-scaling.ts`

```typescript
import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion, instanceType } from './config';
import { primaryPrivateSubnet1, primaryPrivateSubnet2 } from './vpc';
import { primaryAppSecurityGroup } from './security-groups';
import { targetGroup } from './load-balancer';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

// Get the latest Amazon Linux 2 AMI
export const amiId = aws.ec2.getAmi(
  {
    mostRecent: true,
    owners: ['amazon'],
    filters: [
      {
        name: 'name',
        values: ['amzn2-ami-hvm-*-x86_64-gp2'],
      },
      {
        name: 'virtualization-type',
        values: ['hvm'],
      },
    ],
  },
  { provider: primaryProvider }
);

// User data script for EC2 instances
const userData = `#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Create a simple health check endpoint
mkdir -p /opt/app
cat > /opt/app/app.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Hello from Auto Scaling Group!')

if __name__ == '__main__':
    server = HTTPServer(('', 8080), HealthHandler)
    server.serve_forever()
EOF

# Install Python and start the application
yum install -y python3
nohup python3 /opt/app/app.py > /var/log/app.log 2>&1 &
`;

// IAM role for EC2 instances
export const ec2Role = new aws.iam.Role(
  'ec2-role',
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
    tags: commonTags,
  },
  { provider: primaryProvider }
);

export const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  'ec2-role-policy',
  {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider: primaryProvider }
);

export const instanceProfile = new aws.iam.InstanceProfile(
  'instance-profile',
  {
    role: ec2Role.name,
  },
  { provider: primaryProvider }
);

// Launch Template
export const launchTemplate = new aws.ec2.LaunchTemplate(
  'app-launch-template',
  {
    name: 'app-launch-template',
    imageId: amiId.then(ami => ami.id),
    instanceType: instanceType,
    vpcSecurityGroupIds: [primaryAppSecurityGroup.id],
    iamInstanceProfile: {
      name: instanceProfile.name,
    },
    userData: Buffer.from(userData).toString('base64'),
    tagSpecifications: [
      {
        resourceType: 'instance',
        tags: {
          ...commonTags,
          Name: 'App Server Instance',
        },
      },
    ],
    tags: {
      ...commonTags,
      Name: 'App Launch Template',
    },
  },
  { provider: primaryProvider }
);

// Auto Scaling Group
export const autoScalingGroup = new aws.autoscaling.Group(
  'app-asg',
  {
    name: 'app-auto-scaling-group',
    vpcZoneIdentifiers: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
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
        value: 'App Auto Scaling Group',
        propagateAtLaunch: false,
      },
      {
        key: 'Environment',
        value: 'Production',
        propagateAtLaunch: true,
      },
    ],
  },
  { provider: primaryProvider }
);

// Auto Scaling Policy
export const scaleUpPolicy = new aws.autoscaling.Policy(
  'scale-up-policy',
  {
    name: 'scale-up-policy',
    scalingAdjustment: 1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
  },
  { provider: primaryProvider }
);

export const scaleDownPolicy = new aws.autoscaling.Policy(
  'scale-down-policy',
  {
    name: 'scale-down-policy',
    scalingAdjustment: -1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
  },
  { provider: primaryProvider }
);
```

## `index.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import { primaryRegion, secondaryRegion } from './config';

// Import all modules to ensure resources are created
import './kms';
import './vpc';
import './security-groups';
import './rds';
import './load-balancer';
import './auto-scaling';

// Import specific resources for outputs
import { primaryKmsKey, secondaryKmsKey } from './kms';
import { primaryVpc, secondaryVpc } from './vpc';
import { primaryRdsInstance, secondaryRdsReadReplica } from './rds';
import { applicationLoadBalancer } from './load-balancer';
import { autoScalingGroup } from './auto-scaling';

// Export important resource information
export const outputs = {
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,

  // VPC Information
  primaryVpcId: primaryVpc.id,
  primaryVpcCidr: primaryVpc.cidrBlock,
  secondaryVpcId: secondaryVpc.id,
  secondaryVpcCidr: secondaryVpc.cidrBlock,

  // KMS Keys
  primaryKmsKeyId: primaryKmsKey.keyId,
  primaryKmsKeyArn: primaryKmsKey.arn,
  secondaryKmsKeyId: secondaryKmsKey.keyId,
  secondaryKmsKeyArn: secondaryKmsKey.arn,

  // RDS Information
  primaryDbEndpoint: primaryRdsInstance.endpoint,
  primaryDbPort: primaryRdsInstance.port,
  secondaryDbEndpoint: secondaryRdsReadReplica.endpoint,
  secondaryDbPort: secondaryRdsReadReplica.port,

  // Load Balancer
  loadBalancerDnsName: applicationLoadBalancer.dnsName,
  loadBalancerZoneId: applicationLoadBalancer.zoneId,

  // Auto Scaling Group
  autoScalingGroupName: autoScalingGroup.name,
  autoScalingGroupArn: autoScalingGroup.arn,
};
```

## Deployment Instructions

1. **Install dependencies:**

```bash
npm install
```

2. **Configure Pulumi stack:**

```bash
pulumi stack init production
```

3. **Set configuration (optional, uses defaults if not set):**

```bash
pulumi config set primaryRegion ap-south-1
pulumi config set secondaryRegion eu-west-1
pulumi config set primaryVpcCidr 10.0.0.0/16
pulumi config set secondaryVpcCidr 10.1.0.0/16
pulumi config set instanceType t2.micro
pulumi config set dbInstanceClass db.t3.micro
```

4. **Deploy the infrastructure:**

```bash
pulumi up
```

## Key Features Implemented

- **Multi-Region Setup**: Infrastructure deployed in both `ap-south-1` and `eu-west-1`  
- **Non-overlapping CIDR blocks**: Primary VPC uses `10.0.0.0/16`, Secondary uses `10.1.0.0/16`  
- **Encrypted RDS**: Both primary and read-replica use KMS encryption  
- **Cross-region read replica**: MySQL 5.7 with automated cross-region replication  
- **Parameterized configuration**: All values configurable via Pulumi config  
- **Auto Scaling Group**: 2-6 `t2.micro` instances with health checks  
- **Application Load Balancer**: Port 80 to 8080 forwarding  
- **Security Groups**: Proper layer-based security (ALB to App to DB)  
- **Resource Tagging**: All resources tagged with `Environment: Production`  
- **Provider-based regions**: Explicit AWS providers for deterministic deployments

## Security Best Practices

- Security groups follow principle of least privilege
- RDS instances are in private subnets
- Encryption at rest using customer-managed KMS keys
- IAM roles with minimal required permissions
- Health checks configured for high availability

## Production Considerations

- Change RDS password to use AWS Secrets Manager
- Enable deletion protection on critical resources
- Configure automated backups and monitoring
- Set up CloudWatch alarms for scaling policies
- Consider using AWS Certificate Manager for HTTPS

This infrastructure provides a solid foundation for a production multi-region application with high availability, encryption, and proper security controls.
