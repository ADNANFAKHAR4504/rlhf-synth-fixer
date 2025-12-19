```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class WebAppInfrastructure {
    public readonly vpc: aws.ec2.Vpc;
    public readonly publicSubnets: aws.ec2.Subnet[];
    public readonly privateSubnets: aws.ec2.Subnet[];
    public readonly internetGateway: aws.ec2.InternetGateway;
    public readonly natGateways: aws.ec2.NatGateway[];
    public readonly autoScalingGroup: aws.autoscaling.Group;
    public readonly loadBalancer: aws.lb.LoadBalancer;
    public readonly s3Bucket: aws.s3.Bucket;
    public readonly cloudFrontDistribution: aws.cloudfront.Distribution;
    public readonly provider: aws.Provider;

    constructor(
        region: string,
        environment: string,
        tags: pulumi.Input<Record<string, string>>
    ) {
        this.provider = new aws.Provider(`provider-${environment}`, {
            region: region,
        });

        const resourceTags = pulumi.output(tags).apply(t => ({
            ...t,
            Environment: environment,
        }));

        const azs = aws.getAvailabilityZones({
            state: "available",
        }, { provider: this.provider });

        this.vpc = new aws.ec2.Vpc(`vpc-${environment}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `vpc-${environment}`,
            })),
        }, { provider: this.provider });

        this.internetGateway = new aws.ec2.InternetGateway(`igw-${environment}`, {
            vpcId: this.vpc.id,
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `igw-${environment}`,
            })),
        }, { provider: this.provider });

        this.publicSubnets = [];
        this.privateSubnets = [];

        for (let i = 0; i < 2; i++) {
            const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i + 1}-${environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 1}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                mapPublicIpOnLaunch: true,
                tags: resourceTags.apply(t => ({
                    ...t,
                    Name: `public-subnet-${i + 1}-${environment}`,
                })),
            }, { provider: this.provider });

            const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i + 1}-${environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 10}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                tags: resourceTags.apply(t => ({
                    ...t,
                    Name: `private-subnet-${i + 1}-${environment}`,
                })),
            }, { provider: this.provider });

            this.publicSubnets.push(publicSubnet);
            this.privateSubnets.push(privateSubnet);
        }

        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environment}`, {
            vpcId: this.vpc.id,
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `public-rt-${environment}`,
            })),
        }, { provider: this.provider });

        new aws.ec2.Route(`public-route-${environment}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: this.internetGateway.id,
        }, { provider: this.provider });

        this.publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`public-rta-${i + 1}-${environment}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { provider: this.provider });
        });

        this.natGateways = [];
        this.publicSubnets.forEach((subnet, i) => {
            const eip = new aws.ec2.Eip(`nat-eip-${i + 1}-${environment}`, {
                domain: "vpc",
                tags: resourceTags.apply(t => ({
                    ...t,
                    Name: `nat-eip-${i + 1}-${environment}`,
                })),
            }, { provider: this.provider });

            const natGateway = new aws.ec2.NatGateway(`nat-gw-${i + 1}-${environment}`, {
                allocationId: eip.id,
                subnetId: subnet.id,
                tags: resourceTags.apply(t => ({
                    ...t,
                    Name: `nat-gw-${i + 1}-${environment}`,
                })),
            }, { provider: this.provider });

            this.natGateways.push(natGateway);

            const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${i + 1}-${environment}`, {
                vpcId: this.vpc.id,
                tags: resourceTags.apply(t => ({
                    ...t,
                    Name: `private-rt-${i + 1}-${environment}`,
                })),
            }, { provider: this.provider });

            new aws.ec2.Route(`private-route-${i + 1}-${environment}`, {
                routeTableId: privateRouteTable.id,
                destinationCidrBlock: "0.0.0.0/0",
                natGatewayId: natGateway.id,
            }, { provider: this.provider });

            new aws.ec2.RouteTableAssociation(`private-rta-${i + 1}-${environment}`, {
                subnetId: this.privateSubnets[i].id,
                routeTableId: privateRouteTable.id,
            }, { provider: this.provider });
        });

        const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environment}`, {
            vpcId: this.vpc.id,
            description: "Security group for Application Load Balancer",
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ["0.0.0.0/0"],
                },
                {
                    protocol: "tcp",
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `alb-sg-${environment}`,
            })),
        }, { provider: this.provider });

        const ec2SecurityGroup = new aws.ec2.SecurityGroup(`ec2-sg-${environment}`, {
            vpcId: this.vpc.id,
            description: "Security group for EC2 instances",
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 80,
                    toPort: 80,
                    securityGroups: [albSecurityGroup.id],
                },
                {
                    protocol: "tcp",
                    fromPort: 443,
                    toPort: 443,
                    securityGroups: [albSecurityGroup.id],
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `ec2-sg-${environment}`,
            })),
        }, { provider: this.provider });

        this.loadBalancer = new aws.lb.LoadBalancer(`alb-${environment}`, {
            loadBalancerType: "application",
            subnets: this.publicSubnets.map(subnet => subnet.id),
            securityGroups: [albSecurityGroup.id],
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `alb-${environment}`,
            })),
        }, { provider: this.provider });

        const targetGroup = new aws.lb.TargetGroup(`tg-${environment}`, {
            port: 80,
            protocol: "HTTP",
            vpcId: this.vpc.id,
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                interval: 30,
                matcher: "200",
                path: "/",
                port: "traffic-port",
                protocol: "HTTP",
                timeout: 5,
                unhealthyThreshold: 2,
            },
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `tg-${environment}`,
            })),
        }, { provider: this.provider });

        new aws.lb.Listener(`http-listener-${environment}`, {
            loadBalancerArn: this.loadBalancer.arn,
            port: 80,
            protocol: "HTTP",
            defaultActions: [
                {
                    type: "forward",
                    targetGroupArn: targetGroup.arn,
                },
            ],
        }, { provider: this.provider });

        new aws.lb.Listener(`https-listener-${environment}`, {
            loadBalancerArn: this.loadBalancer.arn,
            port: 443,
            protocol: "HTTPS",
            certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
            defaultActions: [
                {
                    type: "forward",
                    targetGroupArn: targetGroup.arn,
                },
            ],
        }, { provider: this.provider });

        const amiId = aws.ec2.getAmi({
            mostRecent: true,
            owners: ["amazon"],
            filters: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*-x86_64-gp2"],
                },
            ],
        }, { provider: this.provider });

        const instanceRole = new aws.iam.Role(`instance-role-${environment}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "ec2.amazonaws.com",
                        },
                    },
                ],
            }),
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `instance-role-${environment}`,
            })),
        }, { provider: this.provider });

        new aws.iam.RolePolicyAttachment(`instance-role-policy-${environment}`, {
            role: instanceRole.name,
            policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
        }, { provider: this.provider });

        const instanceProfile = new aws.iam.InstanceProfile(`instance-profile-${environment}`, {
            role: instanceRole.name,
        }, { provider: this.provider });

        const launchTemplate = new aws.ec2.LaunchTemplate(`lt-${environment}`, {
            imageId: amiId.then(ami => ami.id),
            instanceType: "t3.micro",
            vpcSecurityGroupIds: [ec2SecurityGroup.id],
            iamInstanceProfile: {
                name: instanceProfile.name,
            },
            userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${environment}</h1>" > /var/www/html/index.html
`).toString("base64"),
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `lt-${environment}`,
            })),
        }, { provider: this.provider });

        this.autoScalingGroup = new aws.autoscaling.Group(`asg-${environment}`, {
            vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
            targetGroupArns: [targetGroup.arn],
            healthCheckType: "ELB",
            healthCheckGracePeriod: 300,
            minSize: 1,
            maxSize: 4,
            desiredCapacity: 2,
            launchTemplate: {
                id: launchTemplate.id,
                version: "$Latest",
            },
            tags: resourceTags.apply(t => [
                {
                    key: "Name",
                    value: `asg-${environment}`,
                    propagateAtLaunch: true,
                },
                ...Object.entries(t).map(([key, value]) => ({
                    key,
                    value,
                    propagateAtLaunch: true,
                })),
            ]),
        }, { provider: this.provider });

        this.s3Bucket = new aws.s3.Bucket(`static-content-${environment}`, {
            versioning: {
                enabled: true,
            },
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `static-content-${environment}`,
            })),
        }, { provider: this.provider });

        new aws.s3.BucketPublicAccessBlock(`static-content-pab-${environment}`, {
            bucket: this.s3Bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { provider: this.provider });

        const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(`oai-${environment}`, {
            comment: `OAI for ${environment}`,
        }, { provider: this.provider });

        const s3BucketPolicy = new aws.s3.BucketPolicy(`static-content-policy-${environment}`, {
            bucket: this.s3Bucket.id,
            policy: pulumi.all([this.s3Bucket.arn, originAccessIdentity.iamArn]).apply(([bucketArn, oaiArn]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "AllowCloudFrontAccess",
                            Effect: "Allow",
                            Principal: {
                                AWS: oaiArn,
                            },
                            Action: "s3:GetObject",
                            Resource: `${bucketArn}/*`,
                        },
                    ],
                })
            ),
        }, { provider: this.provider });

        this.cloudFrontDistribution = new aws.cloudfront.Distribution(`cdn-${environment}`, {
            origins: [
                {
                    domainName: this.s3Bucket.bucketDomainName,
                    originId: `S3-${this.s3Bucket.id}`,
                    s3OriginConfig: {
                        originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
                    },
                },
            ],
            enabled: true,
            isIpv6Enabled: true,
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: `S3-${this.s3Bucket.id}`,
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: "none",
                    },
                },
                viewerProtocolPolicy: "redirect-to-https",
                minTtl: 0,
                defaultTtl: 3600,
                maxTtl: 86400,
            },
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none",
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true,
            },
            tags: resourceTags.apply(t => ({
                ...t,
                Name: `cdn-${environment}`,
            })),
        }, { provider: this.provider });
    }
}
```