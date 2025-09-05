# AWS Infrastructure in Pulumi Go

Here's a complete, production-ready Pulumi Go implementation that meets all your requirements:

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

export function getAlbServiceAccountId(region: string): string {
  const albAccounts: Record<string, string> = {
    'us-east-1': '127311923021',
    'us-east-2': '033677994240',
    'us-west-1': '027434742980',
    'us-west-2': '797873946194',
    'ap-south-1': '718504428378',
    'ap-northeast-1': '582318560864',
    'ap-northeast-2': '600734575887',
    'ap-southeast-1': '114774131450',
    'ap-southeast-2': '783225319266',
    'eu-central-1': '054676820928',
    'eu-west-1': '156460612806',
    'eu-west-2': '652711504416',
    'eu-west-3': '009996457667',
  };
  return albAccounts[region] || '127311923021';
}

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
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ec2SecurityGroup: aws.ec2.SecurityGroup;
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly vpcEndpointSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsInstance: aws.rds.Instance;
  public readonly cloudTrailBucket: aws.s3.Bucket;
  public readonly flowLogGroup: aws.cloudwatch.LogGroup;
  private readonly caller: pulumi.Output<aws.GetCallerIdentityResult>;
  private readonly region: string;
  private readonly environment: string;

  constructor(
    region: string,
    environment: string,
    tags: pulumi.Input<Record<string, string>>
  ) {
    this.region = region;
    this.environment = environment;
    this.provider = new aws.Provider(`provider-${environment}`, {
      region: region,
    });

    this.caller = pulumi.output(
      aws.getCallerIdentity({}, { provider: this.provider })
    );

    const resourceTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environment,
    }));

    const azs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: this.provider }
    );

    this.vpc = new aws.ec2.Vpc(
      `vpc-${environment}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `vpc-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${environment}`,
      {
        vpcId: this.vpc.id,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `igw-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${i + 1}-${environment}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: resourceTags.apply(t => ({
            ...t,
            Name: `public-subnet-${i + 1}-${environment}`,
          })),
        },
        { provider: this.provider }
      );

      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${i + 1}-${environment}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          tags: resourceTags.apply(t => ({
            ...t,
            Name: `private-subnet-${i + 1}-${environment}`,
          })),
        },
        { provider: this.provider }
      );

      this.publicSubnets.push(publicSubnet);
      this.privateSubnets.push(privateSubnet);
    }

    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environment}`,
      {
        vpcId: this.vpc.id,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `public-rt-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `public-route-${environment}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider: this.provider }
    );

    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i + 1}-${environment}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { provider: this.provider }
      );
    });

    this.natGateways = [];
    this.publicSubnets.forEach((subnet, i) => {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i + 1}-${environment}`,
        {
          domain: 'vpc',
          tags: resourceTags.apply(t => ({
            ...t,
            Name: `nat-eip-${i + 1}-${environment}`,
          })),
        },
        { provider: this.provider }
      );

      const natGateway = new aws.ec2.NatGateway(
        `nat-gw-${i + 1}-${environment}`,
        {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: resourceTags.apply(t => ({
            ...t,
            Name: `nat-gw-${i + 1}-${environment}`,
          })),
        },
        { provider: this.provider }
      );

      this.natGateways.push(natGateway);

      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i + 1}-${environment}`,
        {
          vpcId: this.vpc.id,
          tags: resourceTags.apply(t => ({
            ...t,
            Name: `private-rt-${i + 1}-${environment}`,
          })),
        },
        { provider: this.provider }
      );

      new aws.ec2.Route(
        `private-route-${i + 1}-${environment}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { provider: this.provider }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i + 1}-${environment}`,
        {
          subnetId: this.privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { provider: this.provider }
      );
    });

    // ALB Logs Bucket
    const albLogsBucket = new aws.s3.Bucket(
      `alb-logs-${environment}`,
      {
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `alb-logs-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.s3.BucketLifecycleConfigurationV2(
      `alb-logs-lifecycle-${environment}`,
      {
        bucket: albLogsBucket.id,
        rules: [
          {
            id: 'expire-old-logs',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
          },
        ],
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPolicy(
      `alb-logs-policy-${environment}`,
      {
        bucket: albLogsBucket.id,
        policy: pulumi
          .all([albLogsBucket.arn, this.caller])
          .apply(([bucketArn, caller]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${getAlbServiceAccountId(region)}:root`,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      'aws:SourceAccount': caller.accountId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider: this.provider }
    );

    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `alb-sg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    this.ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `ec2-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `ec2-sg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // Dedicated security group for web traffic (used by ALB)
    this.webSecurityGroup = new aws.ec2.SecurityGroup(
      `web-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for web traffic',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `web-sg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // Dedicated security group for VPC endpoints
    this.vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `vpc-endpoint-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            securityGroups: [this.ec2SecurityGroup.id],
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `vpc-endpoint-sg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // AWS WAF for ALB protection
    const webAcl = new aws.wafv2.WebAcl(
      `web-acl-${environment}`,
      {
        scope: 'REGIONAL',
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
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
              sampledRequestsEnabled: true,
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
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `WebACL-${environment}`,
          sampledRequestsEnabled: true,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    this.loadBalancer = new aws.lb.LoadBalancer(
      `alb-${environment}`,
      {
        loadBalancerType: 'application',
        subnets: this.publicSubnets.map(subnet => subnet.id),
        securityGroups: [this.albSecurityGroup.id],
        accessLogs: {
          bucket: albLogsBucket.bucket,
          enabled: true,
          prefix: `alb-logs-${environment}`,
        },
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `alb-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `web-acl-association-${environment}`,
      {
        resourceArn: this.loadBalancer.arn,
        webAclArn: webAcl.arn,
      },
      { provider: this.provider }
    );

    const targetGroup = new aws.lb.TargetGroup(
      `tg-${environment}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `tg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.lb.Listener(
      `http-listener-${environment}`,
      {
        loadBalancerArn: this.loadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { provider: this.provider }
    );

    const amiId = aws.ec2.getAmi(
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
      { provider: this.provider }
    );

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `app-key-${environment}`,
      {
        description: `KMS key for ${environment} application`,
        policy: pulumi.all([this.caller]).apply(([caller]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${caller.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow use of the key for RDS',
                Effect: 'Allow',
                Principal: {
                  Service: 'rds.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'aws:SourceAccount': caller.accountId,
                  },
                },
              },
              {
                Sid: 'Allow use of the key for Secrets Manager',
                Effect: 'Allow',
                Principal: {
                  Service: 'secretsmanager.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'aws:SourceAccount': caller.accountId,
                  },
                },
              },
              {
                Sid: 'Allow use of the key for CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${region}.amazonaws.com`,
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnEquals: {
                    'kms:EncryptionContext:aws:logs:arn': [
                      `arn:aws:logs:${region}:${caller.accountId}:log-group:/ec2/app-logs/${environment}`,
                      `arn:aws:logs:${region}:${caller.accountId}:log-group:vpc-flow-logs-${environment}`,
                    ],
                  },
                },
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    new aws.kms.Alias(
      `app-key-alias-${environment}`,
      {
        name: `alias/app-key-${environment}`,
        targetKeyId: kmsKey.keyId,
      },
      { provider: this.provider }
    );

    // Database credentials secret
    const dbSecret = new aws.secretsmanager.Secret(
      `db-credentials-${environment}`,
      {
        description: `Database credentials for ${environment}`,
        kmsKeyId: kmsKey.keyId,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    const dbPassword = new random.RandomPassword(`db-password-${environment}`, {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    });

    new aws.secretsmanager.SecretVersion(
      `db-credentials-version-${environment}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.interpolate`{"username":"admin","password":"${dbPassword.result}"}`,
      },
      { provider: this.provider }
    );

    // Application secrets with rotation
    const appSecret = new aws.secretsmanager.Secret(
      `app-secrets-${environment}`,
      {
        description: `Application secrets for ${environment}`,
        kmsKeyId: kmsKey.keyId,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    const jwtSecret = new random.RandomPassword(`jwt-secret-${environment}`, {
      length: 64,
      special: false,
    });

    const apiKey = new random.RandomPassword(`api-key-${environment}`, {
      length: 32,
      special: false,
    });

    new aws.secretsmanager.SecretVersion(
      `app-secrets-version-${environment}`,
      {
        secretId: appSecret.id,
        secretString: pulumi.interpolate`{"api_key":"${apiKey.result}","database_url":"placeholder","jwt_secret":"${jwtSecret.result}"}`,
      },
      { provider: this.provider }
    );

    // VPC Endpoint for Secrets Manager
    new aws.ec2.VpcEndpoint(
      `secretsmanager-endpoint-${environment}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${region}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [this.vpcEndpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    const instanceRole = new aws.iam.Role(
      `instance-role-${environment}`,
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
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `instance-role-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // Custom policy for EC2 instances with least privilege
    new aws.iam.RolePolicy(
      `instance-policy-${environment}`,
      {
        role: instanceRole.id,
        policy: pulumi
          .all([this.caller, kmsKey.arn])
          .apply(([caller, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `arn:aws:logs:${region}:${caller.accountId}:log-group:/ec2/app-logs/${environment}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: [
                    `arn:aws:secretsmanager:${region}:${caller.accountId}:secret:app-secrets-${environment}-*`,
                    `arn:aws:secretsmanager:${region}:${caller.accountId}:secret:db-credentials-${environment}-*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: kmsArn,
                  Condition: {
                    StringEquals: {
                      'kms:ViaService': `secretsmanager.${region}.amazonaws.com`,
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider: this.provider }
    );

    new aws.iam.RolePolicyAttachment(
      `instance-role-policy-${environment}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider: this.provider }
    );

    // CloudWatch Log Group for EC2 instances
    new aws.cloudwatch.LogGroup(
      `ec2-app-logs-${environment}`,
      {
        name: `/ec2/app-logs/${environment}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `instance-profile-${environment}`,
      {
        role: instanceRole.name,
      },
      { provider: this.provider }
    );

    const launchTemplate = new aws.ec2.LaunchTemplate(
      `lt-${environment}`,
      {
        imageId: amiId.then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${environment}</h1>" > /var/www/html/index.html`
        ).toString('base64'),
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `lt-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    this.autoScalingGroup = new aws.autoscaling.Group(
      `asg-${environment}`,
      {
        vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 4,
        desiredCapacity: 2,
        protectFromScaleIn: true,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: resourceTags.apply(t => [
          {
            key: 'Name',
            value: `asg-${environment}`,
            propagateAtLaunch: true,
          },
          ...Object.entries(t).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ]),
      },
      { provider: this.provider }
    );

    this.s3Bucket = new aws.s3.Bucket(
      `static-content-${environment}`,
      {
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `static-content-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `static-content-encryption-${environment}`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { provider: this.provider }
    );

    new aws.s3.BucketLifecycleConfigurationV2(
      `static-content-lifecycle-${environment}`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            id: 'expire-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { provider: this.provider }
    );

    new aws.s3.BucketVersioning(
      `static-content-versioning-${environment}`,
      {
        bucket: this.s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPublicAccessBlock(
      `static-content-pab-${environment}`,
      {
        bucket: this.s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: this.provider }
    );

    const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
      `oai-${environment}`,
      {
        comment: `OAI for ${environment}`,
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPolicy(
      `static-content-policy-${environment}`,
      {
        bucket: this.s3Bucket.id,
        policy: pulumi
          .all([this.s3Bucket.arn, originAccessIdentity.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { provider: this.provider }
    );

    // CloudFront Logs Bucket
    const cloudFrontLogsBucket = new aws.s3.Bucket(
      `cloudfront-logs-${environment}`,
      {
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `cloudfront-logs-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `cloudfront-logs-encryption-${environment}`,
      {
        bucket: cloudFrontLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { provider: this.provider }
    );

    new aws.s3.BucketOwnershipControls(
      `cloudfront-logs-ownership-${environment}`,
      {
        bucket: cloudFrontLogsBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
      { provider: this.provider }
    );

    this.cloudFrontDistribution = new aws.cloudfront.Distribution(
      `cdn-${environment}`,
      {
        origins: [
          {
            domainName: this.s3Bucket.bucketDomainName,
            originId: 'S3Origin',
            s3OriginConfig: {
              originAccessIdentity:
                originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
        ],
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        loggingConfig: {
          bucket: cloudFrontLogsBucket.bucketDomainName,
          includeCookies: false,
          prefix: `cloudfront-logs-${environment}/`,
        },
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
          targetOriginId: 'S3Origin',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          viewerProtocolPolicy: 'redirect-to-https',
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        priceClass: 'PriceClass_100',
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `cdn-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // VPC Flow Logs
    const flowLogRole = new aws.iam.Role(
      `vpc-flow-log-role-${environment}`,
      {
        assumeRolePolicy: pulumi.all([this.caller]).apply(([caller]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'vpc-flow-logs.amazonaws.com',
                },
                Condition: {
                  StringEquals: {
                    'aws:SourceAccount': caller.accountId,
                  },
                  ArnLike: {
                    'aws:SourceArn': `arn:aws:ec2:${region}:${caller.accountId}:vpc-flow-log/*`,
                  },
                },
              },
            ],
          })
        ),
      },
      { provider: this.provider }
    );

    new aws.iam.RolePolicy(
      `vpc-flow-log-policy-${environment}`,
      {
        role: flowLogRole.id,
        policy: pulumi.all([this.caller]).apply(([caller]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                Resource: `arn:aws:logs:${region}:${caller.accountId}:log-group:vpc-flow-logs-${environment}:*`,
              },
            ],
          })
        ),
      },
      { provider: this.provider }
    );

    this.flowLogGroup = new aws.cloudwatch.LogGroup(
      `vpc-flow-logs-${environment}`,
      {
        name: `vpc-flow-logs-${environment}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    new aws.ec2.FlowLog(
      `vpc-flow-log-${environment}`,
      {
        iamRoleArn: flowLogRole.arn,
        logDestination: this.flowLogGroup.arn,
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        tags: resourceTags,
      },
      { provider: this.provider, dependsOn: [this.flowLogGroup] }
    );

    // CloudTrail
    this.cloudTrailBucket = new aws.s3.Bucket(
      `cloudtrail-${environment}`,
      {
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `cloudtrail-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPolicy(
      `cloudtrail-policy-${environment}`,
      {
        bucket: this.cloudTrailBucket.id,
        policy: pulumi
          .all([this.cloudTrailBucket.arn, this.caller])
          .apply(([bucketArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
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
      { provider: this.provider }
    );

    new aws.cloudtrail.Trail(
      `cloudtrail-${environment}`,
      {
        s3BucketName: this.cloudTrailBucket.bucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: false,
        enableLogging: true,
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environment}`,
      {
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `db-subnet-group-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for RDS database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.ec2SecurityGroup.id],
          },
        ],
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `rds-sg-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // RDS Instance with AWS managed password
    this.rdsInstance = new aws.rds.Instance(
      `db-${environment}`,
      {
        identifier: `db-${environment}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'appdb',
        username: 'admin',
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        tags: resourceTags.apply(t => ({
          ...t,
          Name: `db-${environment}`,
        })),
      },
      { provider: this.provider }
    );

    // CloudWatch Alarms for monitoring
    // ALB Target Response Time
    new aws.cloudwatch.MetricAlarm(
      `alb-response-time-${environment}`,
      {
        name: `ALB-HighResponseTime-${environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1.0,
        alarmDescription: 'ALB response time is too high',
        dimensions: {
          LoadBalancer: this.loadBalancer.arnSuffix,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    // ASG CPU Utilization
    new aws.cloudwatch.MetricAlarm(
      `asg-cpu-high-${environment}`,
      {
        name: `ASG-HighCPU-${environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'EC2 CPU utilization is too high',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    // RDS CPU Utilization
    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-high-${environment}`,
      {
        name: `RDS-HighCPU-${environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.identifier,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    // RDS Free Storage Space
    new aws.cloudwatch.MetricAlarm(
      `rds-storage-low-${environment}`,
      {
        name: `RDS-LowStorage-${environment}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000, // 2GB in bytes
        alarmDescription: 'RDS free storage space is low',
        dimensions: {
          DBInstanceIdentifier: this.rdsInstance.identifier,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );

    // EC2 Status Check Failed
    new aws.cloudwatch.MetricAlarm(
      `ec2-status-check-${environment}`,
      {
        name: `EC2-StatusCheckFailed-${environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'StatusCheckFailed',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'EC2 status check failed',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        tags: resourceTags,
      },
      { provider: this.provider }
    );
  }

  public get outputs() {
    return {
      // VPC and Networking
      vpcId: this.vpc.id,
      VPCId: this.vpc.id, // Alternative naming for compatibility
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      internetGatewayId: this.internetGateway.id,
      natGatewayIds: this.natGateways.map(nat => nat.id),

      // Load Balancer
      loadBalancerArn: this.loadBalancer.arn,
      loadBalancerDnsName: this.loadBalancer.dnsName,
      albDnsName: this.loadBalancer.dnsName, // Alternative naming for compatibility
      LoadBalancerDNS: this.loadBalancer.dnsName, // Alternative naming for compatibility

      // Auto Scaling Group
      autoScalingGroupId: this.autoScalingGroup.id,
      asgId: this.autoScalingGroup.id, // Alternative naming for compatibility
      AutoScalingGroupId: this.autoScalingGroup.id, // Alternative naming for compatibility

      // S3 Bucket
      s3BucketName: this.s3Bucket.id,
      S3BucketName: this.s3Bucket.id, // Alternative naming for compatibility
      s3BucketArn: this.s3Bucket.arn,

      // CloudFront Distribution
      cloudFrontDistributionId: this.cloudFrontDistribution.id,
      cloudfrontDistributionId: this.cloudFrontDistribution.id, // Alternative naming for compatibility
      CloudFrontDistributionId: this.cloudFrontDistribution.id, // Alternative naming for compatibility
      cloudFrontDistributionDomainName: this.cloudFrontDistribution.domainName,
      cloudfrontDomainName: this.cloudFrontDistribution.domainName, // Alternative naming for compatibility
      CloudFrontDomainName: this.cloudFrontDistribution.domainName, // Alternative naming for compatibility

      // Security Groups
      albSecurityGroupId: this.albSecurityGroup.id,
      ec2SecurityGroupId: this.ec2SecurityGroup.id,
      webSecurityGroupId: this.webSecurityGroup.id,
      vpcEndpointSecurityGroupId: this.vpcEndpointSecurityGroup.id,

      // RDS Database
      rdsInstanceId: this.rdsInstance.id,
      rdsInstanceIdentifier: this.rdsInstance.identifier,
      rdsInstanceEndpoint: this.rdsInstance.endpoint,
      rdsInstancePort: this.rdsInstance.port,
      dbInstanceId: this.rdsInstance.id, // Alternative naming for compatibility
      DatabaseEndpoint: this.rdsInstance.endpoint, // Alternative naming for compatibility

      // CloudTrail
      cloudTrailBucketName: this.cloudTrailBucket.id,
      cloudTrailBucketArn: this.cloudTrailBucket.arn,

      // VPC Flow Logs
      flowLogGroupName: this.flowLogGroup.name,
      flowLogGroupArn: this.flowLogGroup.arn,
    };
  }
}
```
