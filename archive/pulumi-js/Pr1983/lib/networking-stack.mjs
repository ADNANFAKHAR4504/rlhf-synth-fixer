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