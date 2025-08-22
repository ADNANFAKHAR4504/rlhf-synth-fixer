import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
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

  constructor(
    name: string,
    args: InfrastructureStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:InfrastructureStack', name, args, opts);

    // AWS Provider with hardcoded region
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // Get current AWS account ID
    const current = aws.getCallerIdentity({}, { provider: awsProvider });

    // Configuration
    const config = new pulumi.Config();
    const projectName = pulumi.getProject();
    const stackName = pulumi.getStack();
    const environment =
      args.environmentSuffix || config.get('environment') || stackName;

    // Availability Zones
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: awsProvider }
    );

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `${environment}-infrastructure-key`,
      {
        description: `KMS key for ${projectName}-${environment} infrastructure encryption`,
        enableKeyRotation: true,
        policy: current.then(c =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${c.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'logs.us-east-1.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow EC2',
                Effect: 'Allow',
                Principal: {
                  Service: 'ec2.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          Name: `${environment}-${projectName}-kms-key`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    new aws.kms.Alias(
      `${environment}-infrastructure-key-alias`,
      {
        name: `alias/${environment}-${projectName}-key`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this, provider: awsProvider }
    );

    // VPC
    const vpc = new aws.ec2.Vpc(
      `${environment}-main-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${environment}-${projectName}-vpc`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `${environment}-main-igw`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${environment}-${projectName}-igw`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Public Subnets (one per AZ)
    const publicSubnets = [0, 1].map(
      i =>
        new aws.ec2.Subnet(
          `${environment}-public-subnet-${i}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: availabilityZones.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${environment}-${projectName}-public-subnet-${i}`,
              Environment: environment,
              Type: 'public',
            },
          },
          { parent: this, provider: awsProvider }
        )
    );

    // Private Subnets (one per AZ)
    const privateSubnets = [0, 1].map(
      i =>
        new aws.ec2.Subnet(
          `${environment}-private-subnet-${i}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: availabilityZones.then(azs => azs.names[i]),
            tags: {
              Name: `${environment}-${projectName}-private-subnet-${i}`,
              Environment: environment,
              Type: 'private',
            },
          },
          { parent: this, provider: awsProvider }
        )
    );

    // Elastic IPs for NAT Gateways
    const natEips = [0, 1].map(
      i =>
        new aws.ec2.Eip(
          `${environment}-nat-eip-${i}`,
          {
            domain: 'vpc',
            tags: {
              Name: `${environment}-${projectName}-nat-eip-${i}`,
              Environment: environment,
            },
          },
          { parent: this, provider: awsProvider }
        )
    );

    // NAT Gateways (one per public subnet)
    const natGateways = [0, 1].map(
      i =>
        new aws.ec2.NatGateway(
          `${environment}-nat-gateway-${i}`,
          {
            allocationId: natEips[i].id,
            subnetId: publicSubnets[i].id,
            tags: {
              Name: `${environment}-${projectName}-nat-gateway-${i}`,
              Environment: environment,
            },
          },
          { parent: this, provider: awsProvider, dependsOn: [internetGateway] }
        )
    );

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `${environment}-public-route-table`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${environment}-${projectName}-public-rt`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    const privateRouteTables = [0, 1].map(
      i =>
        new aws.ec2.RouteTable(
          `${environment}-private-route-table-${i}`,
          {
            vpcId: vpc.id,
            tags: {
              Name: `${environment}-${projectName}-private-rt-${i}`,
              Environment: environment,
            },
          },
          { parent: this, provider: awsProvider }
        )
    );

    // Routes
    new aws.ec2.Route(
      `${environment}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this, provider: awsProvider }
    );

    [0, 1].map(
      i =>
        new aws.ec2.Route(
          `${environment}-private-route-${i}`,
          {
            routeTableId: privateRouteTables[i].id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[i].id,
          },
          { parent: this, provider: awsProvider }
        )
    );

    // Route Table Associations
    publicSubnets.map(
      (subnet, i) =>
        new aws.ec2.RouteTableAssociation(
          `${environment}-public-rta-${i}`,
          {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
          },
          { parent: this, provider: awsProvider }
        )
    );

    privateSubnets.map(
      (subnet, i) =>
        new aws.ec2.RouteTableAssociation(
          `${environment}-private-rta-${i}`,
          {
            subnetId: subnet.id,
            routeTableId: privateRouteTables[i].id,
          },
          { parent: this, provider: awsProvider }
        )
    );

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new aws.s3.Bucket(
      `${environment}-alb-access-logs`,
      {
        bucket: `${environment}-${projectName}-alb-logs-${stackName}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        },
        tags: {
          Name: `${environment}-${projectName}-alb-logs`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // S3 Bucket Public Access Block for ALB logs
    new aws.s3.BucketPublicAccessBlock(
      `${environment}-alb-logs-pab`,
      {
        bucket: albLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider: awsProvider }
    );

    // S3 Bucket Policy for ALB Access Logs
    new aws.s3.BucketPolicy(
      `${environment}-alb-logs-bucket-policy`,
      {
        bucket: albLogsBucket.id,
        policy: albLogsBucket.arn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'logdelivery.elb.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `${bucketArn}/AWSLogs/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this, provider: awsProvider }
    );

    // Security Groups with least privilege
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-alb-security-group`,
      {
        name: `${environment}-${projectName}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'HTTP to private subnets only',
          },
        ],
        tags: {
          Name: `${environment}-${projectName}-alb-sg`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-ec2-security-group`,
      {
        name: `${environment}-${projectName}-ec2-sg`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB only',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS for package updates',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP for package updates',
          },
        ],
        tags: {
          Name: `${environment}-${projectName}-ec2-sg`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${environment}-main-alb`,
      {
        name: `${environment}-${projectName}-alb`,
        loadBalancerType: 'application',
        subnets: publicSubnets.map(subnet => subnet.id),
        securityGroups: [albSecurityGroup.id],
        accessLogs: {
          bucket: albLogsBucket.bucket,
          enabled: true,
        },
        tags: {
          Name: `${environment}-${projectName}-alb`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `${environment}-main-target-group`,
      {
        name: `${environment}-${projectName}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/health',
          matcher: '200',
        },
        tags: {
          Name: `${environment}-${projectName}-tg`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // ALB Listener
    new aws.lb.Listener(
      `${environment}-main-alb-listener`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this, provider: awsProvider }
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new aws.iam.Role(
      `${environment}-ec2-role`,
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
        tags: {
          Name: `${environment}-${projectName}-ec2-role`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // IAM Policy for EC2 instances - minimal permissions
    const ec2Policy = new aws.iam.Policy(
      `${environment}-ec2-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:us-east-1:*:*',
            },
          ],
        }),
      },
      { parent: this, provider: awsProvider }
    );

    // IAM Instance Profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${environment}-ec2-instance-profile`,
      {
        role: ec2Role.name,
      },
      { parent: this, provider: awsProvider }
    );

    // Attach minimal policy to EC2 role
    new aws.iam.RolePolicyAttachment(
      `${environment}-ec2-role-policy`,
      {
        role: ec2Role.name,
        policyArn: ec2Policy.arn,
      },
      { parent: this, provider: awsProvider }
    );

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `${environment}-main-launch-template`,
      {
        name: `${environment}-${projectName}-lt`,
        imageId: aws.ec2
          .getAmi(
            {
              mostRecent: true,
              owners: ['amazon'],
              filters: [
                {
                  name: 'name',
                  values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                },
              ],
            },
            { provider: awsProvider }
          )
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
            echo "OK" > /var/www/html/health
        `
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${environment}-${projectName}-instance`,
              Environment: environment,
            },
          },
        ],
      },
      { parent: this, provider: awsProvider }
    );

    // Auto Scaling Group
    new aws.autoscaling.Group(
      `${environment}-main-asg`,
      {
        name: `${environment}-${projectName}-asg`,
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
            value: `${environment}-${projectName}-asg`,
            propagateAtLaunch: false,
          },
          {
            key: 'Environment',
            value: environment,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this, provider: awsProvider }
    );

    // DynamoDB Table
    const dynamoTable = new aws.dynamodb.Table(
      `${environment}-main-table`,
      {
        name: `${environment}-${projectName}-table`,
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Name: `${environment}-${projectName}-dynamodb`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Generate stable random values for secrets based on environment and project
    const seedString = `${environment}-${projectName}-${stackName}`;
    const hash = seedString.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const stableRandom = Math.abs(hash).toString(36);
    const apiKeyValue = `api-key-${stableRandom}-${environment}`;
    const jwtSecretValue = `jwt-secret-${stableRandom}-${environment}-extra-entropy`;

    // Secrets Manager Secret
    const appSecret = new aws.secretsmanager.Secret(
      `${environment}-app-secret`,
      {
        name: `${environment}-${projectName}-app-secrets`,
        description: 'Application secrets',
        kmsKeyId: kmsKey.id,
        tags: {
          Name: `${environment}-${projectName}-secrets`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    new aws.secretsmanager.SecretVersion(
      `${environment}-app-secret-version`,
      {
        secretId: appSecret.id,
        secretString: pulumi.interpolate`{
          "database_url": "dynamodb://${dynamoTable.name}",
          "api_key": "${apiKeyValue}",
          "jwt_secret": "${jwtSecretValue}"
        }`,
      },
      { parent: this, provider: awsProvider }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `${environment}-main-log-group`,
      {
        name: `/aws/ec2/${environment}-${projectName}`,
        retentionInDays: 14,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `${environment}-${projectName}-logs`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // S3 Bucket for CloudFront logs
    const cloudFrontLogsBucket = new aws.s3.Bucket(
      `${environment}-cloudfront-logs`,
      {
        bucket: `${environment}-${projectName}-cloudfront-logs-${stackName}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        },
        tags: {
          Name: `${environment}-${projectName}-cloudfront-logs`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // S3 Bucket Public Access Block for CloudFront logs
    new aws.s3.BucketPublicAccessBlock(
      `${environment}-cloudfront-logs-pab`,
      {
        bucket: cloudFrontLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider: awsProvider }
    );

    // S3 Bucket Policy for CloudFront logs (SSL enforcement)
    new aws.s3.BucketPolicy(
      `${environment}-cloudfront-logs-bucket-policy`,
      {
        bucket: cloudFrontLogsBucket.id,
        policy: cloudFrontLogsBucket.arn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this, provider: awsProvider }
    );

    // WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(
      `${environment}-main-web-acl`,
      {
        name: `${environment}-${projectName}-web-acl`,
        description: 'Web ACL for DDoS protection',
        scope: 'CLOUDFRONT',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `${environment}${projectName}WebAcl`,
        },
        tags: {
          Name: `${environment}-${projectName}-waf`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // CloudFront Distribution with WAF
    const cloudFrontDistribution = new aws.cloudfront.Distribution(
      `${environment}-main-distribution`,
      {
        origins: [
          {
            domainName: alb.dnsName,
            originId: 'ALB',
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        enabled: true,
        defaultCacheBehavior: {
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: 'ALB',
          compress: true,
          viewerProtocolPolicy: 'redirect-to-https',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        loggingConfig: {
          bucket: cloudFrontLogsBucket.bucketDomainName,
          includeCookies: false,
          prefix: 'cloudfront-logs/',
        },
        webAclId: webAcl.arn,
        tags: {
          Name: `${environment}-${projectName}-cloudfront`,
          Environment: environment,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(
      publicSubnets.map(subnet => subnet.id)
    );
    this.privateSubnetIds = pulumi.output(
      privateSubnets.map(subnet => subnet.id)
    );
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
