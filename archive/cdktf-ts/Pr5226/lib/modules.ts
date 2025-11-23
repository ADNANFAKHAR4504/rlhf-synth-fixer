import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { Fn } from 'cdktf';
import { privateKey } from '@cdktf/provider-tls';

export interface BaseConfig {
  region: string;
  environment: string;
  projectName: string;
  tags: { [key: string]: string };
}

export interface NetworkingConfig extends BaseConfig {
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export interface KeyPairConfig extends BaseConfig {
  publicKey?: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly internetGateway: aws.internetGateway.InternetGateway;

  constructor(scope: Construct, id: string, config: NetworkingConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-vpc-${config.environment}`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-igw-${config.environment}`,
        },
      }
    );

    // Create public subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-public-subnet-${index + 1}-${config.environment}`,
          Type: 'Public',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-subnet-${index + 1}-${config.environment}`,
          Type: 'Private',
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-eip-${config.environment}`,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-${config.environment}`,
      },
    });

    // Create route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-public-rt-${config.environment}`,
      },
    });

    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-rt-${config.environment}`,
        },
      }
    );

    // Add routes
    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate route tables with subnets
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export interface SecurityGroupsConfig extends BaseConfig {
  vpcId: string;
}

export class SecurityGroupsConstruct extends Construct {
  public readonly albSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly appSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly rdsSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupsConfig) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        name: `${config.projectName}-alb-sg-${config.environment}`,
        description: 'Security group for Application Load Balancer',
        vpcId: config.vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-alb-sg-${config.environment}`,
        },
      }
    );

    // App Security Group
    this.appSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'app-sg',
      {
        name: `${config.projectName}-app-sg-${config.environment}`,
        description: 'Security group for application servers',
        vpcId: config.vpcId,
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-app-sg-${config.environment}`,
        },
      }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'rds-sg',
      {
        name: `${config.projectName}-rds-sg-${config.environment}`,
        description: 'Security group for RDS database',
        vpcId: config.vpcId,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-rds-sg-${config.environment}`,
        },
      }
    );

    // Add ingress rules after creation to handle references
    new aws.securityGroupRule.SecurityGroupRule(this, 'app-from-alb', {
      type: 'ingress',
      securityGroupId: this.appSecurityGroup.id,
      protocol: 'tcp',
      fromPort: 3000,
      toPort: 3000,
      sourceSecurityGroupId: this.albSecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    new aws.securityGroupRule.SecurityGroupRule(this, 'rds-from-app', {
      type: 'ingress',
      securityGroupId: this.rdsSecurityGroup.id,
      protocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      sourceSecurityGroupId: this.appSecurityGroup.id,
      description: 'Allow PostgreSQL from app servers',
    });
  }
}

export interface DatabaseConfig extends BaseConfig {
  subnetIds: string[];
  securityGroupId: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  backupRetentionPeriod: number;
}

export class DatabaseConstruct extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly dbSecretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;
  public readonly connectionString: string;

  constructor(scope: Construct, id: string, config: DatabaseConfig) {
    super(scope, id);

    // Create DB subnet group
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${config.projectName}-db-subnet-${config.environment}`,
        subnetIds: config.subnetIds,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-db-subnet-${config.environment}`,
        },
      }
    );

    // Generate random password
    const password =
      new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
        this,
        'db-password',
        {
          passwordLength: 32,
          includeSpace: false,
          requireEachIncludedType: true,
          excludeCharacters: '/@"\' \\',
        }
      );

    // Store credentials in Secrets Manager
    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: `${config.projectName}-db-credentials-${config.environment}`,
        description: 'RDS PostgreSQL database credentials',
        tags: config.tags,
      }
    );

    // Create RDS instance FIRST (before secret version)
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db', {
      identifier: `${config.projectName}-db-${config.environment}`,
      engine: 'postgres',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: config.dbName,
      username: 'dbadmin',
      password: password.randomPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroupId],
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: config.environment === 'production',
      skipFinalSnapshot: config.environment !== 'production',
      finalSnapshotIdentifier:
        config.environment === 'production'
          ? `${config.projectName}-db-final-${config.environment}-${Date.now()}`
          : undefined,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-${config.environment}`,
      },
    });

    // Now create secret version AFTER database instance exists
    this.dbSecretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'db-secret-version',
        {
          secretId: this.dbSecret.id,
          secretString: Fn.jsonencode({
            username: 'dbadmin',
            password: password.randomPassword,
            engine: 'postgres',
            host: this.dbInstance.address,
            port: 5432,
            dbname: config.dbName,
          }),
        }
      );

    this.connectionString = Fn.join('', [
      'postgresql://dbadmin:',
      password.randomPassword,
      '@',
      this.dbInstance.address,
      ':5432/',
      config.dbName,
    ]);
  }
}

export interface LoadBalancerConfig extends BaseConfig {
  subnetIds: string[];
  securityGroupId: string;
  vpcId: string;
  certificateArn?: string;
  healthCheckPath: string;
}

export class LoadBalancerConstruct extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly httpListener: aws.lbListener.LbListener;
  public readonly httpsListener?: aws.lbListener.LbListener;

  constructor(scope: Construct, id: string, config: LoadBalancerConfig) {
    super(scope, id);

    // Create ALB
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: `${config.projectName}-alb-${config.environment}`,
      loadBalancerType: 'application',
      subnets: config.subnetIds,
      securityGroups: [config.securityGroupId],
      enableDeletionProtection: config.environment === 'production',
      enableCrossZoneLoadBalancing: true,
      enableHttp2: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-alb-${config.environment}`,
      },
    });

    // Create Target Group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
      name: `${config.projectName}-tg-${config.environment}`,
      port: 3000,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: config.healthCheckPath,
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400,
      },
      tags: {
        ...config.tags,
        Name: `${config.projectName}-tg-${config.environment}`,
      },
    });

    // HTTP Listener (redirect to HTTPS if certificate provided)
    if (config.certificateArn) {
      this.httpListener = new aws.lbListener.LbListener(this, 'http-listener', {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [
          {
            type: 'redirect',
            redirect: {
              port: '443',
              protocol: 'HTTPS',
              statusCode: 'HTTP_301',
            },
          },
        ],
        tags: config.tags,
      });

      this.httpsListener = new aws.lbListener.LbListener(
        this,
        'https-listener',
        {
          loadBalancerArn: this.alb.arn,
          port: 443,
          protocol: 'HTTPS',
          certificateArn: config.certificateArn,
          sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
          defaultAction: [
            {
              type: 'forward',
              targetGroupArn: this.targetGroup.arn,
            },
          ],
          tags: config.tags,
        }
      );
    } else {
      this.httpListener = new aws.lbListener.LbListener(this, 'http-listener', {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: config.tags,
      });
    }
  }
}

export interface ComputeConfig extends BaseConfig {
  subnetIds: string[];
  securityGroupId: string;
  instanceType: string;
  keyName: string;
  targetGroupArn: string;
  dbConnectionString: string;
  dbSecretArn: string;
  userData?: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
}

export class KeyPairConstruct extends Construct {
  public readonly keyPair: aws.keyPair.KeyPair;
  public readonly keyPairName: string;

  constructor(scope: Construct, id: string, config: KeyPairConfig) {
    super(scope, id);

    this.keyPairName = `${config.projectName}-keypair-${config.environment}`;

    if (config.publicKey) {
      // Use provided public key
      this.keyPair = new aws.keyPair.KeyPair(this, 'keypair', {
        keyName: this.keyPairName,
        publicKey: config.publicKey,
        tags: {
          ...config.tags,
          Name: this.keyPairName,
        },
      });
    } else {
      const tlsPrivateKey = new privateKey.PrivateKey(this, 'private-key', {
        algorithm: 'RSA',
        rsaBits: 4096,
      });

      this.keyPair = new aws.keyPair.KeyPair(this, 'keypair', {
        keyName: this.keyPairName,
        publicKey: tlsPrivateKey.publicKeyOpenssh,
        tags: {
          ...config.tags,
          Name: this.keyPairName,
        },
      });

      // Store private key in Secrets Manager
      const keypairSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
        this,
        'keypair-secret',
        {
          name: `${this.keyPairName}-private`,
          description: 'Private key for EC2 instances',
          tags: config.tags,
        }
      );

      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'keypair-secret-version',
        {
          secretId: keypairSecret.id,
          secretString: tlsPrivateKey.privateKeyPem,
        }
      );
    }
  }
}

export class ComputeConstruct extends Construct {
  public readonly instances: aws.instance.Instance[];
  public readonly launchTemplate: aws.launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscalingGroup.AutoscalingGroup;

  constructor(scope: Construct, id: string, config: ComputeConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2023 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // IAM role for EC2 instances
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    const instanceRole = new aws.iamRole.IamRole(this, 'instance-role', {
      name: `${config.projectName}-instance-role-${config.environment}`,
      assumeRolePolicy: JSON.stringify(assumeRolePolicy),
      tags: config.tags,
    });

    // Attach policies for Secrets Manager and CloudWatch
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ssm-policy',
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'cloudwatch-policy',
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    // Custom policy for Secrets Manager
    const secretsPolicy = new aws.iamPolicy.IamPolicy(this, 'secrets-policy', {
      name: `${config.projectName}-secrets-policy-${config.environment}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: config.dbSecretArn,
          },
        ],
      }),
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'secrets-policy-attachment',
      {
        role: instanceRole.name,
        policyArn: secretsPolicy.arn,
      }
    );

    const instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'instance-profile',
      {
        name: `${config.projectName}-instance-profile-${config.environment}`,
        role: instanceRole.name,
        tags: config.tags,
      }
    );

    // Use the custom userData if provided, otherwise use empty string
    const userData = config.userData
      ? Fn.base64encode(Fn.rawString(config.userData))
      : '';

    // Create Launch Template
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(this, 'lt', {
      name: `${config.projectName}-lt-${config.environment}`,
      imageId: ami.id,
      instanceType: config.instanceType,
      keyName: config.keyName,
      vpcSecurityGroupIds: [config.securityGroupId],
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      userData: userData,
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...config.tags,
            Name: `${config.projectName}-app-${config.environment}`,
            Type: 'Application',
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...config.tags,
            Name: `${config.projectName}-app-volume-${config.environment}`,
          },
        },
      ],
      monitoring: {
        enabled: true,
      },
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
        instanceMetadataTags: 'enabled',
      },
      tags: config.tags,
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'asg',
      {
        name: `${config.projectName}-asg-${config.environment}`,
        minSize: config.minSize,
        maxSize: config.maxSize,
        desiredCapacity: config.desiredCapacity,
        vpcZoneIdentifier: config.subnetIds,
        targetGroupArns: [config.targetGroupArn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tag: Object.entries(config.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
        enabledMetrics: [
          'GroupMinSize',
          'GroupMaxSize',
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupTotalInstances',
        ],
      }
    );

    // Create initial EC2 instances for immediate deployment
    this.instances = [];
  }
}
