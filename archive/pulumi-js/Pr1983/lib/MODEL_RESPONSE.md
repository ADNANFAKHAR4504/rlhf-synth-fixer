# AWS Basic Cloud Environment Setup - Pulumi JavaScript Implementation

I'll help you create a basic AWS cloud environment using Pulumi JavaScript. This setup will include a VPC with multi-AZ subnets, an EC2 instance, and proper networking configuration following AWS best practices.

Here's the implementation with modular code structure:

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

        const tags = {
            'Project': 'TerraformSetup',
            ...args.tags
        };

        // Create VPC
        this.vpc = new aws.ec2.Vpc(`tf-vpc`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: 'tf-vpc',
                ...tags
            }
        }, { parent: this });

        // Get availability zones
        const azs = aws.getAvailabilityZones({
            state: 'available'
        });

        // Create public subnets in different AZs
        this.publicSubnet1 = new aws.ec2.Subnet(`tf-public-subnet-1`, {
            vpcId: this.vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: azs.then(azs => azs.names[0]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: 'tf-public-subnet-1',
                ...tags
            }
        }, { parent: this });

        this.publicSubnet2 = new aws.ec2.Subnet(`tf-public-subnet-2`, {
            vpcId: this.vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: azs.then(azs => azs.names[1]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: 'tf-public-subnet-2',
                ...tags
            }
        }, { parent: this });

        // Create Internet Gateway
        this.igw = new aws.ec2.InternetGateway(`tf-igw`, {
            vpcId: this.vpc.id,
            tags: {
                Name: 'tf-igw',
                ...tags
            }
        }, { parent: this });

        // Create route table for public subnets
        this.publicRouteTable = new aws.ec2.RouteTable(`tf-public-rt`, {
            vpcId: this.vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: this.igw.id,
                }
            ],
            tags: {
                Name: 'tf-public-rt',
                ...tags
            }
        }, { parent: this });

        // Associate public subnets with route table
        new aws.ec2.RouteTableAssociation(`tf-public-rta-1`, {
            subnetId: this.publicSubnet1.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this });

        new aws.ec2.RouteTableAssociation(`tf-public-rta-2`, {
            subnetId: this.publicSubnet2.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this });

        // Create security group for EC2 instance
        this.ec2SecurityGroup = new aws.ec2.SecurityGroup(`tf-ec2-sg`, {
            name: 'tf-ec2-sg',
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
                Name: 'tf-ec2-sg',
                ...tags
            }
        }, { parent: this });

        this.registerOutputs({
            vpcId: this.vpc.id,
            publicSubnet1Id: this.publicSubnet1.id,
            publicSubnet2Id: this.publicSubnet2.id,
            securityGroupId: this.ec2SecurityGroup.id
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

        const tags = {
            'Project': 'TerraformSetup',
            ...args.tags
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
        this.ec2Instance = new aws.ec2.Instance(`tf-ec2-instance`, {
            ami: amiId,
            instanceType: 't3.micro',
            subnetId: args.subnetId,
            securityGroups: [args.securityGroupId],
            associatePublicIpAddress: true,
            tags: {
                Name: 'tf-ec2-instance',
                ...tags
            }
        }, { parent: this });

        this.registerOutputs({
            instanceId: this.ec2Instance.id,
            publicIp: this.ec2Instance.publicIp,
            privateIp: this.ec2Instance.privateIp
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

        const tags = args.tags || {};

        // Create networking infrastructure
        const networking = new NetworkingStack('tf-networking', {
            tags: tags,
        }, { parent: this });

        // Create compute resources
        const compute = new ComputeStack('tf-compute', {
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

This implementation provides:

1. **VPC with CIDR 10.0.0.0/16** - Main network container
2. **Two public subnets in different AZs** - For high availability (10.0.1.0/24 and 10.0.2.0/24)
3. **EC2 instance with public IP** - t3.micro instance in the first subnet
4. **Internet Gateway and routing** - Enables internet access
5. **Security group with SSH access** - Allows port 22 from anywhere
6. **Consistent tf- naming prefix** - As requested
7. **Project: TerraformSetup tags** - Applied to all resources
8. **Modular structure** - Separate networking and compute stacks

The setup uses the latest Amazon Linux 2023 AMI and follows AWS best practices for networking, including proper subnet association and security group configuration. The multi-AZ deployment ensures high availability, and the modular approach makes the code maintainable and reusable.