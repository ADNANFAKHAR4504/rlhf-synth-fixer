import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class VpcStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:VpcStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        // Get availability zones for the region
        const azs = aws.getAvailabilityZones({
            state: "available",
        });

        // Create VPC
        this.vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...tags,
                Name: `tap-vpc-${environmentSuffix}`,
            },
        }, { parent: this });

        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                ...tags,
                Name: `tap-igw-${environmentSuffix}`,
            },
        }, { parent: this });

        // Create public subnets
        this.publicSubnets = [];
        this.privateSubnets = [];

        // Create 2 public subnets (one in each AZ)
        for (let i = 0; i < 2; i++) {
            const publicSubnet = new aws.ec2.Subnet(`tap-public-subnet-${i}-${environmentSuffix}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i * 2}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                mapPublicIpOnLaunch: true,
                tags: {
                    ...tags,
                    Name: `tap-public-subnet-${i}-${environmentSuffix}`,
                },
            }, { parent: this });
            this.publicSubnets.push(publicSubnet);
        }

        // Create 2 private subnets (one in each AZ) for RDS
        for (let i = 0; i < 2; i++) {
            const privateSubnet = new aws.ec2.Subnet(`tap-private-subnet-${i}-${environmentSuffix}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${100 + i * 2}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                tags: {
                    ...tags,
                    Name: `tap-private-subnet-${i}-${environmentSuffix}`,
                },
            }, { parent: this });
            this.privateSubnets.push(privateSubnet);
        }

        // Create route table for public subnets
        const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                ...tags,
                Name: `tap-public-rt-${environmentSuffix}`,
            },
        }, { parent: this });

        // Add route to Internet Gateway
        new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: igw.id,
        }, { parent: this });

        // Associate public subnets with route table
        this.publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`tap-public-rta-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        });

        // Export VPC and subnet IDs
        this.vpcId = this.vpc.id;
        this.publicSubnetIds = this.publicSubnets.map(s => s.id);
        this.privateSubnetIds = this.privateSubnets.map(s => s.id);

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}