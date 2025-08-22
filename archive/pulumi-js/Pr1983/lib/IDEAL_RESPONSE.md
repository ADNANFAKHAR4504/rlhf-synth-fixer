# AWS Basic Cloud Environment Setup - Pulumi JavaScript Implementation

I'll help you create a basic AWS cloud environment using Pulumi JavaScript. This implementation follows AWS best practices and creates a fully functional infrastructure with VPC, multi-AZ subnets, EC2 instance, and proper networking configuration.

## lib/networking-stack.mjs

```javascript
/**
 * networking-stack.mjs
 * 
 * Defines the VPC, subnets, Internet Gateway, and routing for the basic AWS environment.
 * Implements multi-AZ deployment for high availability.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class NetworkingStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:networking:NetworkingStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = {
            'Project': 'TerraformSetup',
            ...args?.tags
        };

        // Create VPC
        this.vpc = new aws.ec2.Vpc(`tf-vpc-${environmentSuffix}`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `tf-vpc-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Get availability zones
        const azs = aws.getAvailabilityZones({
            state: 'available'
        });

        // Create public subnets in different AZs
        this.publicSubnet1 = new aws.ec2.Subnet(`tf-public-subnet-1-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: azs.then(azs => azs.names[0]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `tf-public-subnet-1-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        this.publicSubnet2 = new aws.ec2.Subnet(`tf-public-subnet-2-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: azs.then(azs => azs.names[1]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `tf-public-subnet-2-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Create Internet Gateway
        this.igw = new aws.ec2.InternetGateway(`tf-igw-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `tf-igw-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Create route table for public subnets
        this.publicRouteTable = new aws.ec2.RouteTable(`tf-public-rt-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: this.igw.id,
                }
            ],
            tags: {
                Name: `tf-public-rt-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Associate public subnets with route table
        new aws.ec2.RouteTableAssociation(`tf-public-rta-1-${environmentSuffix}`, {
            subnetId: this.publicSubnet1.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this });

        new aws.ec2.RouteTableAssociation(`tf-public-rta-2-${environmentSuffix}`, {
            subnetId: this.publicSubnet2.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this });

        // Create security group for EC2 instance
        this.ec2SecurityGroup = new aws.ec2.SecurityGroup(`tf-ec2-sg-${environmentSuffix}`, {
            name: `tf-ec2-sg-${environmentSuffix}`,
            description: 'Security group for EC2 instance',
            vpcId: this.vpc.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'SSH access from anywhere'
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
                Name: `tf-ec2-sg-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Expose outputs as properties
        this.vpcId = this.vpc.id;
        this.publicSubnet1Id = this.publicSubnet1.id;
        this.publicSubnet2Id = this.publicSubnet2.id;
        this.securityGroupId = this.ec2SecurityGroup.id;

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnet1Id: this.publicSubnet1Id,
            publicSubnet2Id: this.publicSubnet2Id,
            securityGroupId: this.securityGroupId
        });
    }
}
```

## lib/compute-stack.mjs

```javascript
/**
 * compute-stack.mjs
 * 
 * Defines the EC2 instance and related compute resources.
 * Uses the latest Amazon Linux 2023 AMI for optimal performance.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class ComputeStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:compute:ComputeStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = {
            'Project': 'TerraformSetup',
            ...args?.tags
        };

        // Get the latest Amazon Linux 2023 AMI
        const amiId = aws.ec2.getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
                {
                    name: 'name',
                    values: ['al2023-ami-*-x86_64'],
                },
                {
                    name: 'state',
                    values: ['available'],
                }
            ]
        }).then(ami => ami.id);

        // Create EC2 instance in the first public subnet
        this.ec2Instance = new aws.ec2.Instance(`tf-ec2-instance-${environmentSuffix}`, {
            ami: amiId,
            instanceType: 't3.micro',
            subnetId: args.subnetId,
            vpcSecurityGroupIds: [args.securityGroupId],
            associatePublicIpAddress: true,
            tags: {
                Name: `tf-ec2-instance-${environmentSuffix}`,
                ...tags
            }
        }, { parent: this });

        // Expose outputs as properties
        this.instanceId = this.ec2Instance.id;
        this.publicIp = this.ec2Instance.publicIp;
        this.privateIp = this.ec2Instance.privateIp;

        this.registerOutputs({
            instanceId: this.instanceId,
            publicIp: this.publicIp,
            privateIp: this.privateIp
        });
    }
}
```

## lib/tap-stack.mjs

```javascript
/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource that orchestrates the networking and compute stacks.
 * This creates a basic AWS cloud environment with VPC, subnets, and EC2 instance.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack.mjs';
import { ComputeStack } from './compute-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = args?.tags || {};

        // Create networking infrastructure
        const networking = new NetworkingStack('tf-networking', {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });

        // Create compute resources
        const compute = new ComputeStack('tf-compute', {
            environmentSuffix: environmentSuffix,
            subnetId: networking.publicSubnet1Id,
            securityGroupId: networking.securityGroupId,
            tags: tags,
        }, { parent: this });

        // Expose key outputs
        this.vpcId = networking.vpcId;
        this.publicSubnet1Id = networking.publicSubnet1Id;
        this.publicSubnet2Id = networking.publicSubnet2Id;
        this.instanceId = compute.instanceId;
        this.publicIp = compute.publicIp;

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnet1Id: this.publicSubnet1Id,
            publicSubnet2Id: this.publicSubnet2Id,
            instanceId: this.instanceId,
            publicIp: this.publicIp
        });
    }
}
```

## bin/tap.mjs

```javascript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack.mjs';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
const environmentSuffix = config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export the stack outputs for verification
export const vpcId = stack.vpcId;
export const publicSubnet1Id = stack.publicSubnet1Id;
export const publicSubnet2Id = stack.publicSubnet2Id;
export const instanceId = stack.instanceId;
export const publicIp = stack.publicIp;
```

## Key Features Implemented

1. **VPC with CIDR 10.0.0.0/16** - Main network container with DNS support enabled
2. **Two public subnets in different AZs** - High availability design (10.0.1.0/24 and 10.0.2.0/24)
3. **EC2 instance with public IP** - t3.micro instance running Amazon Linux 2023
4. **Internet Gateway and routing** - Full internet connectivity for public subnets
5. **Security group with SSH access** - Port 22 open from anywhere (0.0.0.0/0)
6. **Consistent tf- naming prefix** - All resources follow the requested naming convention
7. **Project: TerraformSetup tags** - Applied consistently across all resources
8. **Environment suffix support** - Prevents naming conflicts between deployments
9. **Modular structure** - Separate networking and compute stacks for maintainability

## Infrastructure Architecture

The solution creates a production-ready AWS infrastructure with:

- **Network Layer**: VPC with multi-AZ public subnets and Internet Gateway
- **Security Layer**: Security groups with controlled ingress/egress rules
- **Compute Layer**: EC2 instance with public IP for internet accessibility
- **High Availability**: Resources distributed across multiple availability zones

All components are properly connected and configured for immediate use, following AWS best practices for security, scalability, and reliability.