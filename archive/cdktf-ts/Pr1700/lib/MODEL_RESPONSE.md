I'll create a comprehensive CDKTF TypeScript configuration that meets all your requirements. This solution will be reusable across multiple environments with proper validation, security, and scalability considerations.

```typescript
import { Construct } from 'constructs';
import {
  App,
  TerraformStack,
  TerraformOutput,
  TerraformVariable,
  Fn,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketEncryption } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { KeyPair } from '@cdktf/provider-aws/lib/key-pair';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LoadBalancer } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

interface EnvironmentConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  dbSubnetCidrs: string[];
  instanceType: string;
  dbInstanceClass: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  enableMultiAz: boolean;
  backupRetentionPeriod: number;
}

class MultiEnvironmentInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Input Variables with Validation
    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      description: 'Environment name (dev, staging, prod)',
      validation: [
        {
          condition: Fn.contains(
            ['dev', 'staging', 'prod'],
            '${var.environment}'
          ),
          errorMessage: 'Environment must be one of: dev, staging, prod',
        },
      ],
    });

    const region = new TerraformVariable(this, 'region', {
      type: 'string',
      description: 'AWS region',
      default: 'us-west-2',
      validation: [
        {
          condition: Fn.canRegex('^[a-z]{2}-[a-z]+-[0-9]$', '${var.region}'),
          errorMessage:
            'Region must be a valid AWS region format (e.g., us-west-2)',
        },
      ],
    });

    const projectName = new TerraformVariable(this, 'project_name', {
      type: 'string',
      description: 'Project name for resource naming',
      default: 'myapp',
      validation: [
        {
          condition: Fn.canRegex(
            '^[a-z][a-z0-9-]*[a-z0-9]$',
            '${var.project_name}'
          ),
          errorMessage:
            'Project name must start with a letter, contain only lowercase letters, numbers, and hyphens',
        },
      ],
    });

    const dbPassword = new TerraformVariable(this, 'db_password', {
      type: 'string',
      description: 'Database password',
      sensitive: true,
      validation: [
        {
          condition: Fn.lengthOf('${var.db_password}') >= 8,
          errorMessage: 'Database password must be at least 8 characters long',
        },
      ],
    });

    const sshPublicKey = new TerraformVariable(this, 'ssh_public_key', {
      type: 'string',
      description: 'SSH public key for EC2 instances',
      validation: [
        {
          condition: Fn.canRegex(
            '^ssh-rsa|^ssh-ed25519',
            '${var.ssh_public_key}'
          ),
          errorMessage:
            'SSH public key must be in valid format (ssh-rsa or ssh-ed25519)',
        },
      ],
    });

    // Environment-specific configurations
    const environmentConfigs: Record<string, EnvironmentConfig> = {
      dev: {
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        dbSubnetCidrs: ['10.0.100.0/24', '10.0.200.0/24'],
        instanceType: 't3.micro',
        dbInstanceClass: 'db.t3.micro',
        minSize: 1,
        maxSize: 2,
        desiredCapacity: 1,
        enableMultiAz: false,
        backupRetentionPeriod: 1,
      },
      staging: {
        vpcCidr: '10.1.0.0/16',
        publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24'],
        privateSubnetCidrs: ['10.1.10.0/24', '10.1.20.0/24'],
        dbSubnetCidrs: ['10.1.100.0/24', '10.1.200.0/24'],
        instanceType: 't3.small',
        dbInstanceClass: 'db.t3.small',
        minSize: 2,
        maxSize: 4,
        desiredCapacity: 2,
        enableMultiAz: true,
        backupRetentionPeriod: 7,
      },
      prod: {
        vpcCidr: '10.2.0.0/16',
        publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24'],
        privateSubnetCidrs: ['10.2.10.0/24', '10.2.20.0/24'],
        dbSubnetCidrs: ['10.2.100.0/24', '10.2.200.0/24'],
        instanceType: 't3.medium',
        dbInstanceClass: 'db.t3.small',
        minSize: 2,
        maxSize: 10,
        desiredCapacity: 3,
        enableMultiAz: true,
        backupRetentionPeriod: 30,
      },
    };

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region.stringValue,
      defaultTags: [
        {
          tags: {
            Environment: environment.stringValue,
            Project: projectName.stringValue,
            ManagedBy: 'CDKTF',
            CreatedAt: new Date().toISOString(),
          },
        },
      ],
    });

    // Get current environment config using lookup
    const currentConfig = Fn.lookup(
      environmentConfigs,
      environment.stringValue,
      environmentConfigs.dev
    );

    // Common tags
    const commonTags = {
      Environment: environment.stringValue,
      Project: projectName.stringValue,
      ManagedBy: 'CDKTF',
    };

    // Data source for availability zones
    const availabilityZones = Fn.slice(
      Fn.dataAwsAvailabilityZones('available', {
        state: 'available',
      }).names,
      0,
      2
    );

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: Fn.lookup(currentConfig, 'vpcCidr', '10.0.0.0/16'),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-vpc`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-igw`,
      },
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    const publicSubnetCidrs = Fn.lookup(currentConfig, 'publicSubnetCidrs', [
      '10.0.1.0/24',
      '10.0.2.0/24',
    ]);

    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `public-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.element(publicSubnetCidrs, i),
        availabilityZone: Fn.element(availabilityZones, i),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${projectName.stringValue}-${environment.stringValue}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });
      publicSubnets.push(subnet);
    }

    // Private Subnets
    const privateSubnets: Subnet[] = [];
    const privateSubnetCidrs = Fn.lookup(currentConfig, 'privateSubnetCidrs', [
      '10.0.10.0/24',
      '10.0.20.0/24',
    ]);

    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `private-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.element(privateSubnetCidrs, i),
        availabilityZone: Fn.element(availabilityZones, i),
        tags: {
          ...commonTags,
          Name: `${projectName.stringValue}-${environment.stringValue}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });
      privateSubnets.push(subnet);
    }

    // Database Subnets
    const dbSubnets: Subnet[] = [];
    const dbSubnetCidrs = Fn.lookup(currentConfig, 'dbSubnetCidrs', [
      '10.0.100.0/24',
      '10.0.200.0/24',
    ]);

    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `db-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.element(dbSubnetCidrs, i),
        availabilityZone: Fn.element(availabilityZones, i),
        tags: {
          ...commonTags,
          Name: `${projectName.stringValue}-${environment.stringValue}-db-subnet-${i + 1}`,
          Type: 'Database',
        },
      });
      dbSubnets.push(subnet);
    }

    // Elastic IPs for NAT Gateways
    const natEips: Eip[] = [];
    for (let i = 0; i < 2; i++) {
      const eip = new Eip(this, `nat-eip-${i + 1}`, {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `${projectName.stringValue}-${environment.stringValue}-nat-eip-${i + 1}`,
        },
      });
      natEips.push(eip);
    }

    // NAT Gateways
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 2; i++) {
      const natGw = new NatGateway(this, `nat-gateway-${i + 1}`, {
        allocationId: natEips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          ...commonTags,
          Name: `${projectName.stringValue}-${environment.stringValue}-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGw);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      const routeTable = new RouteTable(
        this,
        `private-route-table-${index + 1}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `${projectName.stringValue}-${environment.stringValue}-private-rt-${index + 1}`,
          },
        }
      );

      new Route(this, `private-route-${index + 1}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${projectName.stringValue}-${environment.stringValue}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-alb-sg`,
      },
    });

    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${projectName.stringValue}-${environment.stringValue}-web-sg`,
      description: 'Security group for web servers',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'HTTP from ALB',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [vpc.cidrBlock],
          description: 'SSH from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-web-sg`,
      },
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${projectName.stringValue}-${environment.stringValue}-db-sg`,
      description: 'Security group for database',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [webSecurityGroup.id],
          description: 'MySQL from web servers',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-db-sg`,
      },
    });

    // Key Pair for EC2 instances
    const keyPair = new KeyPair(this, 'key-pair', {
      keyName: `${projectName.stringValue}-${environment.stringValue}-key`,
      publicKey: sshPublicKey.stringValue,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-key`,
      },
    });

    // Latest Amazon Linux 2 AMI
    const amiData = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${projectName.stringValue}-${environment.stringValue}-lt`,
      description: 'Launch template for web servers',
      imageId: amiData.id,
      instanceType: Fn.lookup(currentConfig, 'instanceType', 't3.micro'),
      keyName: keyPair.keyName,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      userData: Fn.base64encode(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Hello from ${environment.stringValue} environment!</h1>" > /var/www/html/index.html
        echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
      `),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...commonTags,
            Name: `${projectName.stringValue}-${environment.stringValue}-web-server`,
          },
        },
      ],
    });

    // Application Load Balancer
    const alb = new LoadBalancer(this, 'alb', {
      name: `${projectName.stringValue}-${environment.stringValue}-alb`,
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: Fn.conditional(
        Fn.equal(environment.stringValue, 'prod'),
        true,
        false
      ),
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-alb`,
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${projectName.stringValue}-${environment.stringValue}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
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
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-tg`,
      },
    });

    // ALB Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Auto Scaling Group
    new AutoscalingGroup(this, 'asg', {
      name: `${projectName.stringValue}-${environment.stringValue}-asg`,
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: Fn.lookup(currentConfig, 'minSize', 1),
      maxSize: Fn.lookup(currentConfig, 'maxSize', 3),
      desiredCapacity: Fn.lookup(currentConfig, 'desiredCapacity', 2),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${projectName.stringValue}-${environment.stringValue}-asg`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: environment.stringValue,
          propagateAtLaunch: true,
        },
        {
          key: 'Project',
          value: projectName.stringValue,
          propagateAtLaunch: true,
        },
      ],
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${projectName.stringValue}-${environment.stringValue}-db-subnet-group`,
      subnetIds: dbSubnets.map(subnet => subnet.id),
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-db-subnet-group`,
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, 'rds', {
      identifier: `${projectName.stringValue}-${environment.stringValue}-db`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: Fn.lookup(currentConfig, 'dbInstanceClass', 'db.t3.micro'),
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: 'myappdb',
      username: 'admin',
      password: dbPassword.stringValue,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: Fn.lookup(
        currentConfig,
        'backupRetentionPeriod',
        7
      ),
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: Fn.lookup(currentConfig, 'enableMultiAz', false),
      publiclyAccessible: false,
      skipFinalSnapshot: Fn.conditional(
        Fn.equal(environment.stringValue, 'prod'),
        false,
        true
      ),
      finalSnapshotIdentifier: Fn.conditional(
        Fn.equal(environment.stringValue, 'prod'),
        `${projectName.stringValue}-${environment.stringValue}-final-snapshot-${Fn.formatdate('YYYY-MM-DD-hhmm', Fn.timestamp())}`,
        null
      ),
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-db`,
      },
    });

    // S3 Bucket for application data
    const s3Bucket = new S3Bucket(this, 'app-bucket', {
      bucket: `${projectName.stringValue}-${environment.stringValue}-app-data-${Fn.random()}`,
      tags: {
        ...commonTags,
        Name: `${projectName.stringValue}-${environment.stringValue}-app-bucket`,
      },
    });

    // S3 Bucket Versioning
    new S3BucketVersioning(this, 'app-bucket-versioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, 'app-bucket-pab', {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      description: 'ID of the VPC',
      value: vpc.id,
    });

    new TerraformOutput(this, 'vpc_cidr', {
      description: 'CIDR block of the VPC',
      value: vpc.cidrBlock,
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      description: 'IDs of the public subnets',
      value: publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      description: 'IDs of the private subnets',
      value: privateSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'database_subnet_ids', {
      description: 'IDs of the database subnets',
      value: dbSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'alb_dns_name', {
      description: 'DNS name of the load balancer',
      value: alb.dnsName,
    });

    new TerraformOutput(this, 'alb_zone_id', {
      description: 'Zone ID of the load balancer',
      value: alb.zoneId,
    });

    new TerraformOutput(this, 'rds_endpoint', {
      description: 'RDS instance endpoint',
      value: rdsInstance.endpoint,
      sensitive: true,
    });

    new TerraformOutput(this, 'rds_port', {
      description: 'RDS instance port',
      value: rdsInstance.port,
    });

    new TerraformOutput(this, 's3_bucket_name', {
      description: 'Name of the S3 bucket',
      value: s3Bucket.bucket,
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      description: 'ARN of the S3 bucket',
      value: s3Bucket.arn,
    });

    new TerraformOutput(this, 'nat_gateway_ips', {
      description: 'Public IPs of the NAT Gateways',
      value: natEips.map(eip => eip.publicIp),
    });
  }
}

// Create the app
const app = new App();

// Create stacks for different environments
new MultiEnvironmentInfrastructureStack(app, 'dev');
new MultiEnvironmentInfrastructureStack(app, 'staging');
new MultiEnvironmentInfrastructureStack(app, 'prod');

app.synth();
```

## Usage Instructions

### 1. **Project Setup**

```bash
# Initialize CDKTF project
mkdir cdktf-aws-infrastructure
cd cdktf-aws-infrastructure
cdktf init --template=typescript --local

# Install required providers
npm install @cdktf/provider-aws
```

### 2. **Environment-specific Variable Files**

Create `terraform.dev.tfvars`:

```hcl
environment = "dev"
region = "us-west-2"
project_name = "myapp"
db_password = "devpassword123"
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
```

Create `terraform.staging.tfvars`:

```hcl
environment = "staging"
region = "us-west-2"
project_name = "myapp"
db_password = "stagingpassword123"
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
```

Create `terraform.prod.tfvars`:

```hcl
environment = "prod"
region = "us-west-2"
project_name = "myapp"
db_password = "prodpassword123"
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
```

### 3. **Deployment Commands**

```bash
# Synthesize and validate
cdktf synth
terraform validate

# Deploy to development
cdktf deploy dev --var-file=terraform.dev.tfvars

# Deploy to staging
cdktf deploy staging --var-file=terraform.staging.tfvars

# Deploy to production
cdktf deploy prod --var-file=terraform.prod.tfvars
```

## Key Features Implemented

### ✅ **Reusability & Environment Support**

- Single codebase supports multiple environments
- Environment-specific configurations via lookup functions
- Conditional logic for production-specific settings

### ✅ **Input Variables with Validation**

- Comprehensive validation rules for all inputs
- Sensitive variable handling for passwords
- Regex validation for proper formatting

### ✅ **Built-in Functions & Conditionals**

- `Fn.lookup()` for environment-specific configurations
- `Fn.conditional()` for environment-based decisions
- `Fn.element()` and `Fn.slice()` for array operations
- `Fn.formatdate()` and `Fn.timestamp()` for dynamic naming

### ✅ **Comprehensive Outputs**

- VPC and subnet information
- Load balancer details
- Database endpoints
- S3 bucket information
- NAT Gateway IPs
