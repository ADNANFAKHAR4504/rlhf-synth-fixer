import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ResourceOptions } from '@pulumi/pulumi';

export interface InfrastructureStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class InfrastructureStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albZoneId: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly webAclArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(name: string, args: InfrastructureStackArgs, opts?: ResourceOptions) {
    super('tap:infrastructure:InfrastructureStack', name, args, opts);

    // Get current AWS region and account ID
    const current = aws.getCallerIdentity({});
    const region = aws.getRegion({});

    // Configuration
    const config = new pulumi.Config();
    const projectName = pulumi.getProject();
    const stackName = pulumi.getStack();
    const environment = config.get("environment") || stackName;

    // Availability Zones
    const availabilityZones = aws.getAvailabilityZones({
      state: "available",
    });

    // Function to get ELB service account for the region
    function getELBServiceAccount(region: string): string {
      const elbServiceAccounts: { [key: string]: string } = {
        "us-east-1": "127311923021",
        "us-east-2": "033677994240",
        "us-west-1": "027434742980",
        "us-west-2": "797873946194",
        "eu-west-1": "156460612806",
        "eu-central-1": "054676820928",
        "ap-southeast-1": "114774131450",
        "ap-northeast-1": "582318560864",
      };
      return elbServiceAccounts[region] || "127311923021"; // Default to us-east-1
    }

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key("infrastructure-key", {
      description: `KMS key for ${projectName}-${environment} infrastructure encryption`,
      enableKeyRotation: true,
      tags: {
        Name: `${projectName}-${environment}-kms-key`,
        Environment: environment,
      },
    }, { parent: this });

    const kmsKeyAlias = new aws.kms.Alias("infrastructure-key-alias", {
      name: `alias/${projectName}-${environment}-key`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // VPC
    const vpc = new aws.ec2.Vpc("main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${projectName}-${environment}-vpc`,
        Environment: environment,
      },
    }, { parent: this });

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway("main-igw", {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-igw`,
        Environment: environment,
      },
    }, { parent: this });

    // Public Subnets (one per AZ)
    const publicSubnets = [0, 1].map((i) =>
      new aws.ec2.Subnet(`public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${projectName}-${environment}-public-subnet-${i}`,
          Environment: environment,
          Type: "public",
        },
      }, { parent: this })
    );

    // Private Subnets (one per AZ)
    const privateSubnets = [0, 1].map((i) =>
      new aws.ec2.Subnet(`private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        tags: {
          Name: `${projectName}-${environment}-private-subnet-${i}`,
          Environment: environment,
          Type: "private",
        },
      }, { parent: this })
    );

    // Elastic IPs for NAT Gateways
    const natEips = [0, 1].map((i) =>
      new aws.ec2.Eip(`nat-eip-${i}`, {
        domain: "vpc",
        tags: {
          Name: `${projectName}-${environment}-nat-eip-${i}`,
          Environment: environment,
        },
      }, { parent: this })
    );

    // NAT Gateways (one per public subnet)
    const natGateways = [0, 1].map((i) =>
      new aws.ec2.NatGateway(`nat-gateway-${i}`, {
        allocationId: natEips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `${projectName}-${environment}-nat-gateway-${i}`,
          Environment: environment,
        },
      }, { parent: this, dependsOn: [internetGateway] })
    );

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable("public-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-public-rt`,
        Environment: environment,
      },
    }, { parent: this });

    const privateRouteTables = [0, 1].map((i) =>
      new aws.ec2.RouteTable(`private-route-table-${i}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${projectName}-${environment}-private-rt-${i}`,
          Environment: environment,
        },
      }, { parent: this })
    );

    // Routes
    const publicRoute = new aws.ec2.Route("public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    }, { parent: this });

    const privateRoutes = [0, 1].map((i) =>
      new aws.ec2.Route(`private-route-${i}`, {
        routeTableId: privateRouteTables[i].id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id,
      }, { parent: this })
    );

    // Route Table Associations
    const publicRouteTableAssociations = publicSubnets.map((subnet, i) =>
      new aws.ec2.RouteTableAssociation(`public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this })
    );

    const privateRouteTableAssociations = privateSubnets.map((subnet, i) =>
      new aws.ec2.RouteTableAssociation(`private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTables[i].id,
      }, { parent: this })
    );

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new aws.s3.Bucket("alb-access-logs", {
      bucket: `${projectName}-${environment}-alb-logs-${pulumi.getStack()}`,
      forceDestroy: true,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      },
      tags: {
        Name: `${projectName}-${environment}-alb-logs`,
        Environment: environment,
      },
    }, { parent: this });

    // S3 Bucket Public Access Block for ALB logs
    const albLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("alb-logs-pab", {
      bucket: albLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // S3 Bucket Policy for ALB Access Logs
    const albLogsBucketPolicy = new aws.s3.BucketPolicy("alb-logs-bucket-policy", {
      bucket: albLogsBucket.id,
      policy: pulumi.all([albLogsBucket.arn, region]).apply(([bucketArn, currentRegion]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Deny",
              Principal: "*",
              Action: "s3:*",
              Resource: [bucketArn, `${bucketArn}/*`],
              Condition: {
                Bool: {
                  "aws:SecureTransport": "false"
                }
              }
            },
            {
              Effect: "Allow",
              Principal: {
                AWS: `arn:aws:iam::${getELBServiceAccount(currentRegion.name)}:root`
              },
              Action: "s3:PutObject",
              Resource: `${bucketArn}/*`
            }
          ]
        })
      )
    }, { parent: this });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup("alb-security-group", {
      name: `${projectName}-${environment}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: vpc.id,
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
        Name: `${projectName}-${environment}-alb-sg`,
        Environment: environment,
      },
    }, { parent: this });

    const ec2SecurityGroup = new aws.ec2.SecurityGroup("ec2-security-group", {
      name: `${projectName}-${environment}-ec2-sg`,
      description: "Security group for EC2 instances",
      vpcId: vpc.id,
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
      tags: {
        Name: `${projectName}-${environment}-ec2-sg`,
        Environment: environment,
      },
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer("main-alb", {
      name: `${projectName}-${environment}-alb`,
      loadBalancerType: "application",
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      accessLogs: {
        bucket: albLogsBucket.bucket,
        enabled: true,
      },
      tags: {
        Name: `${projectName}-${environment}-alb`,
        Environment: environment,
      },
    }, { parent: this });

    // Target Group
    const targetGroup = new aws.lb.TargetGroup("main-target-group", {
      name: `${projectName}-${environment}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/health",
        matcher: "200",
      },
      tags: {
        Name: `${projectName}-${environment}-tg`,
        Environment: environment,
      },
    }, { parent: this });

    // ALB Listener
    const albListener = new aws.lb.Listener("main-alb-listener", {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
      }],
    }, { parent: this });

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role("ec2-role", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ec2.amazonaws.com"
          }
        }]
      }),
      tags: {
        Name: `${projectName}-${environment}-ec2-role`,
        Environment: environment,
      },
    }, { parent: this });

    // IAM Instance Profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile("ec2-instance-profile", {
      role: ec2Role.name,
    }, { parent: this });

    // Attach policies to EC2 role
    const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment("ec2-role-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    }, { parent: this });

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate("main-launch-template", {
      name: `${projectName}-${environment}-lt`,
      imageId: aws.ec2.getAmi({
        mostRecent: true,
        owners: ["amazon"],
        filters: [
          {
            name: "name",
            values: ["amzn2-ami-hvm-*-x86_64-gp2"],
          },
        ],
      }).then(ami => ami.id),
      instanceType: "t3.micro",
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: ec2InstanceProfile.name,
      },
      userData: Buffer.from(`#!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        `).toString('base64'),
      tagSpecifications: [{
        resourceType: "instance",
        tags: {
          Name: `${projectName}-${environment}-instance`,
          Environment: environment,
        },
      }],
    }, { parent: this });

    // Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group("main-asg", {
      name: `${projectName}-${environment}-asg`,
      vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
      },
      tags: [
        {
          key: "Name",
          value: `${projectName}-${environment}-asg`,
          propagateAtLaunch: false,
        },
        {
          key: "Environment",
          value: environment,
          propagateAtLaunch: true,
        },
      ],
    }, { parent: this });

    // DynamoDB Table
    const dynamoTable = new aws.dynamodb.Table("main-table", {
      name: `${projectName}-${environment}-table`,
      billingMode: "PROVISIONED",
      readCapacity: 5,
      writeCapacity: 5,
      hashKey: "id",
      attributes: [{
        name: "id",
        type: "S",
      }],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `${projectName}-${environment}-dynamodb`,
        Environment: environment,
      },
    }, { parent: this });

    // Secrets Manager Secret
    const appSecret = new aws.secretsmanager.Secret("app-secret", {
      name: `${projectName}-${environment}-app-secrets`,
      description: "Application secrets",
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `${projectName}-${environment}-secrets`,
        Environment: environment,
      },
    }, { parent: this });

    const appSecretVersion = new aws.secretsmanager.SecretVersion("app-secret-version", {
      secretId: appSecret.id,
      secretString: JSON.stringify({
        database_url: pulumi.interpolate`dynamodb://${dynamoTable.name}`,
        api_key: "your-api-key-here",
        jwt_secret: "your-jwt-secret-here",
      }),
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup("main-log-group", {
      name: `/aws/ec2/${projectName}-${environment}`,
      retentionInDays: 14,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `${projectName}-${environment}-logs`,
        Environment: environment,
      },
    }, { parent: this });

    // S3 Bucket for CloudFront logs
    const cloudFrontLogsBucket = new aws.s3.Bucket("cloudfront-logs", {
      bucket: `${projectName}-${environment}-cloudfront-logs-${pulumi.getStack()}`,
      forceDestroy: true,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      },
      tags: {
        Name: `${projectName}-${environment}-cloudfront-logs`,
        Environment: environment,
      },
    }, { parent: this });

    // S3 Bucket Public Access Block for CloudFront logs
    const cloudFrontLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("cloudfront-logs-pab", {
      bucket: cloudFrontLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // S3 Bucket Policy for CloudFront logs (SSL enforcement)
    const cloudFrontLogsBucketPolicy = new aws.s3.BucketPolicy("cloudfront-logs-bucket-policy", {
      bucket: cloudFrontLogsBucket.id,
      policy: cloudFrontLogsBucket.arn.apply(bucketArn =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Deny",
              Principal: "*",
              Action: "s3:*",
              Resource: [bucketArn, `${bucketArn}/*`],
              Condition: {
                Bool: {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        })
      )
    }, { parent: this });

    // WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl("main-web-acl", {
      name: `${projectName}-${environment}-web-acl`,
      description: "Web ACL for DDoS protection",
      scope: "CLOUDFRONT",
      defaultAction: {
        allow: {},
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesCommonRuleSet",
              vendorName: "AWS",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudwatchMetricsEnabled: true,
            metricName: "CommonRuleSetMetric",
          },
        },
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesKnownBadInputsRuleSet",
              vendorName: "AWS",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudwatchMetricsEnabled: true,
            metricName: "KnownBadInputsRuleSetMetric",
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `${projectName}${environment}WebAcl`,
      },
      tags: {
        Name: `${projectName}-${environment}-waf`,
        Environment: environment,
      },
    }, { parent: this });

    // CloudFront Distribution with WAF
    const cloudFrontDistribution = new aws.cloudfront.Distribution("main-distribution", {
      origins: [{
        domainName: alb.dnsName,
        originId: "ALB",
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
        targetOriginId: "ALB",
        compress: true,
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: "none",
          },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
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
        bucket: cloudFrontLogsBucket.bucketDomainName,
        includeCookies: false,
        prefix: "cloudfront-logs/",
      },
      webAclId: webAcl.arn,
      tags: {
        Name: `${projectName}-${environment}-cloudfront`,
        Environment: environment,
      },
    }, { parent: this });

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(subnet => subnet.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(subnet => subnet.id));
    this.albDnsName = alb.dnsName;
    this.albZoneId = alb.zoneId;
    this.cloudFrontDomainName = cloudFrontDistribution.domainName;
    this.dynamoTableName = dynamoTable.name;
    this.secretArn = appSecret.arn;
    this.kmsKeyId = kmsKey.keyId;
    this.kmsKeyArn = kmsKey.arn;
    this.webAclArn = webAcl.arn;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      albZoneId: this.albZoneId,
      cloudFrontDomainName: this.cloudFrontDomainName,
      dynamoTableName: this.dynamoTableName,
      secretArn: this.secretArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      webAclArn: this.webAclArn,
      logGroupName: this.logGroupName,
    });
  }
}