import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export class WebAppDeploymentStack {
  public readonly provider: aws.Provider;
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnet: aws.ec2.Subnet;
  public readonly privateSubnet: aws.ec2.Subnet;
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly publicRoute: aws.ec2.Route;
  public readonly publicRouteTableAssociation: aws.ec2.RouteTableAssociation;
  public readonly privateRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTableAssociation: aws.ec2.RouteTableAssociation;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ec2SecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSubnetGroup: aws.rds.SubnetGroup;
  public readonly rdsInstance: aws.rds.Instance;
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretVersion: aws.secretsmanager.SecretVersion;
  public readonly ec2Role: aws.iam.Role;
  public readonly ec2Policy: aws.iam.Policy;
  public readonly ec2RolePolicyAttachment: aws.iam.RolePolicyAttachment;
  public readonly ec2InstanceProfile: aws.iam.InstanceProfile;
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly albListener: aws.lb.Listener;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly cloudWatchLogGroup: aws.cloudwatch.LogGroup;
  public readonly backupVault: aws.backup.Vault;
  public readonly backupPlan: aws.backup.Plan;
  public readonly backupSelection: aws.backup.Selection;
  public readonly backupRole: aws.iam.Role;
  public readonly backupRolePolicyAttachment: aws.iam.RolePolicyAttachment;
  public readonly privateSubnet2: aws.ec2.Subnet;
  public readonly publicSubnet2: aws.ec2.Subnet;
  public readonly publicRouteTableAssociation2: aws.ec2.RouteTableAssociation;
  public readonly cloudFront: aws.cloudfront.Distribution;
  public readonly waf: aws.wafv2.WebAcl;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly natGateway2: aws.ec2.NatGateway;
  public readonly eip: aws.ec2.Eip;
  public readonly eip2: aws.ec2.Eip;
  public readonly availabilityZones: pulumi.Output<string[]>;
  private readonly latestAmi: pulumi.Output<string>;
  public readonly bastionInstance: aws.ec2.Instance;
  public readonly webServer1: aws.ec2.Instance;
  public readonly webServer2: aws.ec2.Instance;
  public readonly s3Bucket: aws.s3.Bucket;
  public readonly kmsKey: aws.kms.Key;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaRole: aws.iam.Role;

  static create(
    region: string,
    environment: string,
    tags: pulumi.Input<{ [key: string]: string }>
  ): WebAppDeploymentStack {
    const provider = new aws.Provider(`provider-${environment}`, {
      region: region,
    });

    const availabilityZones = pulumi
      .output(
        aws.getAvailabilityZones(
          {
            state: 'available',
          },
          { provider }
        )
      )
      .apply(az => az.names);

    const latestAmi = pulumi
      .output(
        aws.ec2.getAmi(
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
          { provider }
        )
      )
      .apply(ami => ami.id);

    return new WebAppDeploymentStack(
      region,
      environment,
      tags,
      provider,
      availabilityZones,
      latestAmi
    );
  }

  private constructor(
    region: string,
    environment: string,
    tags: pulumi.Input<{ [key: string]: string }>,
    provider: aws.Provider,
    availabilityZones: pulumi.Output<string[]>,
    latestAmi: pulumi.Output<string>
  ) {
    const allTags = {
      ...tags,
      Environment: environment,
    };

    this.provider = provider;
    this.availabilityZones = availabilityZones;
    this.latestAmi = latestAmi;

    this.vpc = new aws.ec2.Vpc(
      `vpc-${environment}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...allTags,
          Name: `vpc-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.publicSubnet = new aws.ec2.Subnet(
      `public-subnet-${environment}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: this.availabilityZones.apply(azs => azs[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...allTags,
          Name: `public-subnet-${environment}`,
          Type: 'Public',
        },
      },
      { provider: this.provider }
    );

    this.privateSubnet = new aws.ec2.Subnet(
      `private-subnet-${environment}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: this.availabilityZones.apply(azs => azs[0]),
        tags: {
          ...allTags,
          Name: `private-subnet-${environment}`,
          Type: 'Private',
        },
      },
      { provider: this.provider }
    );

    this.publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${environment}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: this.availabilityZones.apply(azs => azs[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...allTags,
          Name: `public-subnet-2-${environment}`,
          Type: 'Public',
        },
      },
      { provider: this.provider }
    );

    this.privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${environment}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.4.0/24',
        availabilityZone: this.availabilityZones.apply(azs => azs[1]),
        tags: {
          ...allTags,
          Name: `private-subnet-2-${environment}`,
          Type: 'Private',
        },
      },
      { provider: this.provider }
    );

    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...allTags,
          Name: `igw-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...allTags,
          Name: `public-rt-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.publicRoute = new aws.ec2.Route(
      `public-route-${environment}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider: this.provider }
    );

    this.publicRouteTableAssociation = new aws.ec2.RouteTableAssociation(
      `public-rta-${environment}`,
      {
        subnetId: this.publicSubnet.id,
        routeTableId: this.publicRouteTable.id,
      },
      { provider: this.provider }
    );

    this.privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...allTags,
          Name: `private-rt-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.publicRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
      `public-rta-2-${environment}`,
      {
        subnetId: this.publicSubnet2.id,
        routeTableId: this.publicRouteTable.id,
      },
      { provider: this.provider }
    );

    this.eip = new aws.ec2.Eip(
      `eip-${environment}`,
      {
        domain: 'vpc',
        tags: {
          ...allTags,
          Name: `eip-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.eip2 = new aws.ec2.Eip(
      `eip-2-${environment}`,
      {
        domain: 'vpc',
        tags: {
          ...allTags,
          Name: `eip-2-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.natGateway = new aws.ec2.NatGateway(
      `nat-${environment}`,
      {
        allocationId: this.eip.id,
        subnetId: this.publicSubnet.id,
        tags: {
          ...allTags,
          Name: `nat-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.natGateway2 = new aws.ec2.NatGateway(
      `nat-2-${environment}`,
      {
        allocationId: this.eip2.id,
        subnetId: this.publicSubnet2.id,
        tags: {
          ...allTags,
          Name: `nat-2-${environment}`,
        },
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `private-route-${environment}`,
      {
        routeTableId: this.privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { provider: this.provider }
    );

    this.privateRouteTableAssociation = new aws.ec2.RouteTableAssociation(
      `private-rta-${environment}`,
      {
        subnetId: this.privateSubnet.id,
        routeTableId: this.privateRouteTable.id,
      },
      { provider: this.provider }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${environment}`,
      {
        subnetId: this.privateSubnet2.id,
        routeTableId: this.privateRouteTable.id,
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
        tags: {
          ...allTags,
          Name: `alb-sg-${environment}`,
        },
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
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
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
        tags: {
          ...allTags,
          Name: `ec2-sg-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environment}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for RDS database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [this.ec2SecurityGroup.id],
          },
        ],
        tags: {
          ...allTags,
          Name: `rds-sg-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.rdsSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${environment}`,
      {
        subnetIds: [this.privateSubnet.id, this.privateSubnet2.id],
        tags: {
          ...allTags,
          Name: `rds-subnet-group-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.secret = new aws.secretsmanager.Secret(
      `app-secrets-${environment}`,
      {
        description: 'Application secrets',
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.secretVersion = new aws.secretsmanager.SecretVersion(
      `app-secrets-version-${environment}`,
      {
        secretId: this.secret.id,
        secretString: JSON.stringify({
          api_key: 'your-api-key-here',
        }),
      },
      { provider: this.provider }
    );

    this.rdsInstance = new aws.rds.Instance(
      `rds-${environment}`,
      {
        allocatedStorage: 20,
        storageType: 'gp2',
        engine: 'postgres',
        engineVersion: '15',
        instanceClass: 'db.t3.micro',
        dbName: 'webapp',
        username: 'dbadmin',
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
        dbSubnetGroupName: this.rdsSubnetGroup.name,
        multiAz: true,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `rds-final-snapshot-${environment}`,
        tags: {
          ...allTags,
          Name: `rds-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.cloudWatchLogGroup = new aws.cloudwatch.LogGroup(
      `log-group-${environment}`,
      {
        name: `/aws/ec2/${environment}`,
        retentionInDays: 14,
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.ec2Role = new aws.iam.Role(
      `ec2-role-${environment}`,
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
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.ec2Policy = new aws.iam.Policy(
      `ec2-policy-${environment}`,
      {
        policy: this.secret.arn.apply(secretArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: secretArn,
              },
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: `arn:aws:logs:${region}:*:log-group:/aws/ec2/${environment}:*`,
              },
            ],
          })
        ),
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(
      `ec2-role-policy-attachment-${environment}`,
      {
        role: this.ec2Role.name,
        policyArn: this.ec2Policy.arn,
      },
      { provider: this.provider }
    );

    // Attach Session Manager policy for secure access
    new aws.iam.RolePolicyAttachment(
      `ec2-ssm-policy-attachment-${environment}`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider: this.provider }
    );

    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${environment}`,
      {
        role: this.ec2Role.name,
        tags: allTags,
      },
      { provider: this.provider }
    );

    const userData = pulumi
      .all([this.secret.name, region])
      .apply(([_secretName, _region]) =>
        Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y nginx
systemctl start nginx
systemctl enable nginx

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/${environment}",
                        "log_stream_name": "{instance_id}/nginx-access"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/ec2/${environment}",
                        "log_stream_name": "{instance_id}/nginx-error"
                    }
                ]
            }
        }
    }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`
        ).toString('base64')
      );

    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `launch-template-${environment}`,
      {
        imageId: this.latestAmi,
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile.name,
        },
        userData: userData,
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...allTags,
              Name: `webapp-instance-${environment}`,
            },
          },
        ],
      },
      { provider: this.provider }
    );

    this.targetGroup = new aws.lb.TargetGroup(
      `target-group-${environment}`,
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
        tags: {
          ...allTags,
          Name: `target-group-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.alb = new aws.lb.LoadBalancer(
      `alb-${environment}`,
      {
        loadBalancerType: 'application',
        subnets: [this.publicSubnet.id, this.publicSubnet2.id],
        securityGroups: [this.albSecurityGroup.id],
        tags: {
          ...allTags,
          Name: `alb-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.albListener = new aws.lb.Listener(
      `alb-listener-${environment}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { provider: this.provider }
    );

    this.autoScalingGroup = new aws.autoscaling.Group(
      `asg-${environment}`,
      {
        vpcZoneIdentifiers: [this.publicSubnet.id, this.publicSubnet2.id],
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `asg-${environment}`,
            propagateAtLaunch: true,
          },
          ...Object.entries(allTags).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ],
      },
      { provider: this.provider }
    );

    this.backupRole = new aws.iam.Role(
      `backup-role-${environment}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'backup.amazonaws.com',
              },
            },
          ],
        }),
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.backupRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
      `backup-role-policy-attachment-${environment}`,
      {
        role: this.backupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      },
      { provider: this.provider }
    );

    this.backupVault = new aws.backup.Vault(
      `backup-vault-${environment}`,
      {
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.backupPlan = new aws.backup.Plan(
      `backup-plan-${environment}`,
      {
        rules: [
          {
            ruleName: `daily-backup-${environment}`,
            targetVaultName: this.backupVault.name,
            schedule: 'cron(0 2 * * ? *)',
            lifecycle: {
              deleteAfter: 30,
            },
          },
        ],
        tags: allTags,
      },
      { provider: this.provider }
    );

    this.backupSelection = new aws.backup.Selection(
      `backup-selection-${environment}`,
      {
        iamRoleArn: this.backupRole.arn,
        planId: this.backupPlan.id,
        resources: [this.rdsInstance.arn],
      },
      { provider: this.provider }
    );

    this.waf = new aws.wafv2.WebAcl(
      `waf-${environment}`,
      {
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
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        tags: allTags,
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `waf-${environment}`,
          sampledRequestsEnabled: true,
        },
      },
      { provider: this.provider }
    );

    this.cloudFront = new aws.cloudfront.Distribution(
      `cloudfront-${environment}`,
      {
        origins: [
          {
            domainName: this.alb.dnsName,
            originId: `alb-${environment}`,
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
          targetOriginId: `alb-${environment}`,
          compress: true,
          viewerProtocolPolicy: 'redirect-to-https',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        webAclId: this.waf.arn,
        tags: allTags,
      },
      { provider: this.provider }
    );

    // KMS Key for encryption
    this.kmsKey = new aws.kms.Key(
      `kms-key-${environment}`,
      {
        description: `KMS key for ${environment} environment`,
        tags: allTags,
      },
      { provider: this.provider }
    );

    // S3 Bucket for data storage
    this.s3Bucket = new aws.s3.Bucket(
      `s3-bucket-${environment}`,
      {
        bucket: `healthapp-phi-data-${environment}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
          },
        },
        tags: allTags,
      },
      { provider: this.provider }
    );

    // Lambda execution role
    this.lambdaRole = new aws.iam.Role(
      `lambda-role-${environment}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: allTags,
      },
      { provider: this.provider }
    );

    // Lambda function for S3 processing
    this.lambdaFunction = new aws.lambda.Function(
      `lambda-function-${environment}`,
      {
        name: `healthapp-s3-processor-${environment}`,
        runtime: 'python3.9',
        handler: 'index.handler',
        role: this.lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }
`),
        }),
        tags: allTags,
      },
      { provider: this.provider }
    );

    // Bastion host for secure access via Session Manager
    this.bastionInstance = new aws.ec2.Instance(
      `bastion-${environment}`,
      {
        instanceType: 't3.micro',
        ami: this.latestAmi,
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        iamInstanceProfile: this.ec2InstanceProfile.name,
        tags: {
          ...allTags,
          Name: `bastion-${environment}`,
        },
      },
      { provider: this.provider }
    );

    // Web server instances
    this.webServer1 = new aws.ec2.Instance(
      `web-server-1-${environment}`,
      {
        instanceType: 't3.micro',
        ami: this.latestAmi,
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        userData: userData,
        iamInstanceProfile: this.ec2InstanceProfile.name,
        tags: {
          ...allTags,
          Name: `web-server-1-${environment}`,
        },
      },
      { provider: this.provider }
    );

    this.webServer2 = new aws.ec2.Instance(
      `web-server-2-${environment}`,
      {
        instanceType: 't3.micro',
        ami: this.latestAmi,
        subnetId: this.publicSubnet2.id,
        vpcSecurityGroupIds: [this.ec2SecurityGroup.id],
        userData: userData,
        iamInstanceProfile: this.ec2InstanceProfile.name,
        tags: {
          ...allTags,
          Name: `web-server-2-${environment}`,
        },
      },
      { provider: this.provider }
    );
  }
}
