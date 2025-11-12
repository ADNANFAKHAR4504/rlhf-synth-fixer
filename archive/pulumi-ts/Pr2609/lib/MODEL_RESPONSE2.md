```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class EnvironmentMigrationStack {
    public readonly vpc: aws.ec2.Vpc;
    public readonly publicSubnets: aws.ec2.Subnet[];
    public readonly privateSubnets: aws.ec2.Subnet[];
    public readonly s3Bucket: aws.s3.Bucket;
    public readonly rdsInstance: aws.rds.Instance;
    public readonly dynamoTable: aws.dynamodb.Table;
    public readonly lambdaFunction: aws.lambda.Function;
    public readonly cloudFrontDistribution: aws.cloudfront.Distribution;
    public readonly alb: aws.lb.LoadBalancer;
    public readonly ec2Instance: aws.ec2.Instance;
    public readonly kmsKey: aws.kms.Key;
    public readonly secret: aws.secretsmanager.Secret;
    public readonly natGateway: aws.ec2.NatGateway;
    public readonly internetGateway: aws.ec2.InternetGateway;
    public readonly targetGroup: aws.lb.TargetGroup;
    public readonly cloudFrontLogsBucket: aws.s3.Bucket;

    public readonly vpcId: pulumi.Output<string>;
    public readonly publicSubnetIds: pulumi.Output<string>[];
    public readonly privateSubnetIds: pulumi.Output<string>[];
    public readonly s3BucketName: pulumi.Output<string>;
    public readonly s3BucketArn: pulumi.Output<string>;
    public readonly rdsEndpoint: pulumi.Output<string>;
    public readonly dynamoTableName: pulumi.Output<string>;
    public readonly dynamoTableArn: pulumi.Output<string>;
    public readonly lambdaFunctionName: pulumi.Output<string>;
    public readonly lambdaFunctionArn: pulumi.Output<string>;
    public readonly cloudFrontDomainName: pulumi.Output<string>;
    public readonly cloudFrontDistributionId: pulumi.Output<string>;
    public readonly albDnsName: pulumi.Output<string>;
    public readonly albArn: pulumi.Output<string>;
    public readonly ec2InstanceId: pulumi.Output<string>;
    public readonly ec2PublicIp: pulumi.Output<string>;
    public readonly kmsKeyId: pulumi.Output<string>;
    public readonly kmsKeyArn: pulumi.Output<string>;
    public readonly secretArn: pulumi.Output<string>;

    constructor(
        region: string,
        environment: string,
        tags: Record<string, string>
    ) {
        const provider = new aws.Provider(`provider-${environment}`, {
            region: region,
        });

        const finalTags = {
            ...tags,
            Environment: environment,
        };

        this.kmsKey = new aws.kms.Key(`kms-key-${environment}`, {
            description: `KMS key for ${environment}`,
            tags: finalTags,
        }, { provider });

        const kmsAlias = new aws.kms.Alias(`kms-alias-${environment}`, {
            name: `alias/${environment}-key`,
            targetKeyId: this.kmsKey.keyId,
        }, { provider });

        this.vpc = new aws.ec2.Vpc(`vpc-${environment}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...finalTags,
                Name: `vpc-${environment}`,
            },
        }, { provider });

        this.internetGateway = new aws.ec2.InternetGateway(`igw-${environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...finalTags,
                Name: `igw-${environment}`,
            },
        }, { provider });

        const azs = aws.getAvailabilityZones({
            state: "available",
        }, { provider });

        this.publicSubnets = [];
        this.privateSubnets = [];

        for (let i = 0; i < 2; i++) {
            const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i}-${environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 1}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                mapPublicIpOnLaunch: true,
                tags: {
                    ...finalTags,
                    Name: `public-subnet-${i}-${environment}`,
                },
            }, { provider });

            const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i}-${environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 10}.0/24`,
                availabilityZone: azs.then(azs => azs.names[i]),
                tags: {
                    ...finalTags,
                    Name: `private-subnet-${i}-${environment}`,
                },
            }, { provider });

            this.publicSubnets.push(publicSubnet);
            this.privateSubnets.push(privateSubnet);
        }

        const eip = new aws.ec2.Eip(`nat-eip-${environment}`, {
            domain: "vpc",
            tags: finalTags,
        }, { provider });

        this.natGateway = new aws.ec2.NatGateway(`nat-gateway-${environment}`, {
            allocationId: eip.id,
            subnetId: this.publicSubnets[0].id,
            tags: {
                ...finalTags,
                Name: `nat-gateway-${environment}`,
            },
        }, { provider });

        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...finalTags,
                Name: `public-rt-${environment}`,
            },
        }, { provider });

        new aws.ec2.Route(`public-route-${environment}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: this.internetGateway.id,
        }, { provider });

        const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...finalTags,
                Name: `private-rt-${environment}`,
            },
        }, { provider });

        new aws.ec2.Route(`private-route-${environment}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: this.natGateway.id,
        }, { provider });

        this.publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`public-rta-${i}-${environment}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { provider });
        });

        this.privateSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`private-rta-${i}-${environment}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id,
            }, { provider });
        });

        this.s3Bucket = new aws.s3.Bucket(`s3-bucket-${environment}`, {
            bucket: `s3-bucket-${environment}-${Math.random().toString(36).substring(7)}`,
            versioning: {
                enabled: true,
            },
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "aws:kms",
                        kmsMasterKeyId: this.kmsKey.arn,
                    },
                },
            },
            tags: finalTags,
        }, { provider });

        new aws.s3.BucketPublicAccessBlock(`s3-bucket-pab-${environment}`, {
            bucket: this.s3Bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { provider });

        const ec2Role = new aws.iam.Role(`ec2-role-${environment}`, {
            path: "/service/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "ec2.amazonaws.com",
                    },
                }],
            }),
            tags: finalTags,
        }, { provider });

        new aws.iam.RolePolicyAttachment(`ec2-policy-${environment}`, {
            role: ec2Role.name,
            policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
        }, { provider });

        const ec2InstanceProfile = new aws.iam.InstanceProfile(`ec2-profile-${environment}`, {
            path: "/service/",
            role: ec2Role.name,
            tags: finalTags,
        }, { provider });

        const securityGroup = new aws.ec2.SecurityGroup(`sg-${environment}`, {
            vpcId: this.vpc.id,
            description: `Security group for ${environment}`,
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
            tags: {
                ...finalTags,
                Name: `sg-${environment}`,
            },
        }, { provider });

        const amiId = aws.ec2.getAmi({
            mostRecent: true,
            owners: ["amazon"],
            filters: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*-x86_64-gp2"],
                },
            ],
        }, { provider });

        this.ec2Instance = new aws.ec2.Instance(`ec2-${environment}`, {
            ami: amiId.then(ami => ami.id),
            instanceType: "t3.micro",
            subnetId: this.publicSubnets[0].id,
            vpcSecurityGroupIds: [securityGroup.id],
            iamInstanceProfile: ec2InstanceProfile.name,
            tags: {
                ...finalTags,
                Name: `ec2-${environment}`,
            },
        }, { provider });

        new aws.cloudwatch.MetricAlarm(`cpu-alarm-${environment}`, {
            alarmDescription: `CPU utilization alarm for ${environment}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "CPUUtilization",
            namespace: "AWS/EC2",
            period: 300,
            statistic: "Average",
            threshold: 80,
            dimensions: {
                InstanceId: this.ec2Instance.id,
            },
            tags: finalTags,
        }, { provider });

        const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environment}`, {
            subnetIds: this.privateSubnets.map(subnet => subnet.id),
            tags: {
                ...finalTags,
                Name: `db-subnet-group-${environment}`,
            },
        }, { provider });

        const dbSecurityGroup = new aws.ec2.SecurityGroup(`db-sg-${environment}`, {
            vpcId: this.vpc.id,
            description: `Database security group for ${environment}`,
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 3306,
                    toPort: 3306,
                    securityGroups: [securityGroup.id],
                },
            ],
            tags: {
                ...finalTags,
                Name: `db-sg-${environment}`,
            },
        }, { provider });

        this.rdsInstance = new aws.rds.Instance(`rds-${environment}`, {
            identifier: `rds-${environment}`,
            engine: "mysql",
            engineVersion: "8.0",
            instanceClass: "db.t3.micro",
            allocatedStorage: 20,
            storageType: "gp2",
            storageEncrypted: true,
            kmsKeyId: this.kmsKey.arn,
            dbName: "mydb",
            username: "admin",
            password: "password123",
            vpcSecurityGroupIds: [dbSecurityGroup.id],
            dbSubnetGroupName: dbSubnetGroup.name,
            multiAz: true,
            skipFinalSnapshot: true,
            tags: finalTags,
        }, { provider });

        this.dynamoTable = new aws.dynamodb.Table(`dynamo-${environment}`, {
            name: `dynamo-${environment}`,
            billingMode: "PAY_PER_REQUEST",
            hashKey: "id",
            attributes: [
                {
                    name: "id",
                    type: "S",
                },
            ],
            serverSideEncryption: {
                enabled: true,
                kmsKeyArn: this.kmsKey.arn,
            },
            tags: finalTags,
        }, { provider });

        this.secret = new aws.secretsmanager.Secret(`secret-${environment}`, {
            name: `secret-${environment}`,
            description: `Secret for ${environment}`,
            kmsKeyId: this.kmsKey.id,
            tags: finalTags,
        }, { provider });

        new aws.secretsmanager.SecretVersion(`secret-version-${environment}`, {
            secretId: this.secret.id,
            secretString: JSON.stringify({
                database_password: "password123",
                api_key: "secret-api-key",
            }),
        }, { provider });

        const lambdaRole = new aws.iam.Role(`lambda-role-${environment}`, {
            path: "/service/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com",
                    },
                }],
            }),
            tags: finalTags,
        }, { provider });

        new aws.iam.RolePolicyAttachment(`lambda-vpc-policy-${environment}`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { provider });

        const lambdaPolicy = new aws.iam.RolePolicy(`lambda-policy-${environment}`, {
            role: lambdaRole.id,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "secretsmanager:GetSecretValue",
                        ],
                        Resource: this.secret.arn,
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                        ],
                        Resource: this.dynamoTable.arn,
                    },
                ],
            }),
        }, { provider });

        const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${environment}`, {
            vpcId: this.vpc.id,
            description: `Lambda security group for ${environment}`,
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ],
            tags: {
                ...finalTags,
                Name: `lambda-sg-${environment}`,
            },
        }, { provider });

        this.lambdaFunction = new aws.lambda.Function(`lambda-${environment}`, {
            name: `lambda-${environment}`,
            runtime: "nodejs18.x",
            handler: "index.handler",
            role: lambdaRole.arn,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(`
                    exports.handler = async (event) => {
                        return {
                            statusCode: 200,
                            body: JSON.stringify('Hello from Lambda!'),
                        };
                    };
                `),
            }),
            vpcConfig: {
                subnetIds: this.privateSubnets.map(subnet => subnet.id),
                securityGroupIds: [lambdaSecurityGroup.id],
            },
            environment: {
                variables: {
                    SECRET_ARN: this.secret.arn,
                    DYNAMO_TABLE: this.dynamoTable.name,
                },
            },
            tags: finalTags,
        }, { provider });

        this.alb = new aws.lb.LoadBalancer(`alb-${environment}`, {
            name: `alb-${environment}`,
            loadBalancerType: "application",
            subnets: this.publicSubnets.map(subnet => subnet.id),
            securityGroups: [securityGroup.id],
            enableCrossZoneLoadBalancing: true,
            tags: finalTags,
        }, { provider });

        this.targetGroup = new aws.lb.TargetGroup(`tg-${environment}`, {
            name: `tg-${environment}`,
            port: 80,
            protocol: "HTTP",
            vpcId: this.vpc.id,
            healthCheck: {
                enabled: true,
                path: "/",
                protocol: "HTTP",
            },
            tags: finalTags,
        }, { provider });

        new aws.lb.TargetGroupAttachment(`tg-attachment-${environment}`, {
            targetGroupArn: this.targetGroup.arn,
            targetId: this.ec2Instance.id,
            port: 80,
        }, { provider });

        new aws.lb.Listener(`alb-listener-${environment}`, {
            loadBalancerArn: this.alb.arn,
            port: 80,
            protocol: "HTTP",
            defaultActions: [{
                type: "forward",
                targetGroupArn: this.targetGroup.arn,
            }],
            tags: finalTags,
        }, { provider });

        this.cloudFrontLogsBucket = new aws.s3.Bucket(`cf-logs-${environment}`, {
            bucket: `cf-logs-${environment}-${Math.random().toString(36).substring(7)}`,
            tags: finalTags,
        }, { provider });

        this.cloudFrontDistribution = new aws.cloudfront.Distribution(`cf-${environment}`, {
            origins: [{
                domainName: this.alb.dnsName,
                originId: `alb-${environment}`,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "http-only",
                    originSslProtocols: ["TLSv1.2"],
                },
            }],
            enabled: true,
            defaultCacheBehavior: {
                allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: `alb-${environment}`,
                viewerProtocolPolicy: "redirect-to-https",
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: "none",
                    },
                },
            },
            restrictions: {
                geoRestriction: {
                    restrictionType: "none",
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true,
            },
            loggingConfig: {
                bucket: this.cloudFrontLogsBucket.bucketDomainName,
                includeCookies: false,
                prefix: "cloudfront-logs/",
            },
            tags: finalTags,
        }, { provider });

        this.vpcId = this.vpc.id;
        this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.id);
        this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.id);
        this.s3BucketName = this.s3Bucket.bucket;
        this.s3BucketArn = this.s3Bucket.arn;
        this.rdsEndpoint = this.rdsInstance.endpoint;
        this.dynamoTableName = this.dynamoTable.name;
        this.dynamoTableArn = this.dynamoTable.arn;
        this.lambdaFunctionName = this.lambdaFunction.name;
        this.lambdaFunctionArn = this.lambdaFunction.arn;
        this.cloudFrontDomainName = this.cloudFrontDistribution.domainName;
        this.cloudFrontDistributionId = this.cloudFrontDistribution.id;
        this.albDnsName = this.alb.dnsName;
        this.albArn = this.alb.arn;
        this.ec2InstanceId = this.ec2Instance.id;
        this.ec2PublicIp = this.ec2Instance.publicIp;
        this.kmsKeyId = this.kmsKey.keyId;
        this.kmsKeyArn = this.kmsKey.arn;
        this.secretArn = this.secret.arn;
    }
}
```
