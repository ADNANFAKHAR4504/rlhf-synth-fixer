## modules.ts

```typescript
import { Construct } from 'constructs';
// VPC
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';

// EC2
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

// Add to imports
import { Password } from '@cdktf/provider-random/lib/password';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// Auto Scaling
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

// ALB (Application Load Balancer)
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';

// CloudWatch
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';

// CloudTrail
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';

// SSM
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// GuardDuty
import { GuarddutyDetector } from '@cdktf/provider-aws/lib/guardduty-detector';

// Config
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { ConfigConfigurationRecorderStatus } from '@cdktf/provider-aws/lib/config-configuration-recorder-status';

// WAFv2
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';

export interface BaseConstructProps {
  projectName: string;
  environment: string;
  tags: { [key: string]: string };
}

export interface VPCConstructProps extends BaseConstructProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  azs: string[];
}

/**
 * VPC Construct: Creates a secure multi-AZ VPC with public/private subnets,
 * NAT Gateways, and Network ACLs following defense-in-depth principles
 */
export class VPCConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly natGateways: NatGateway[] = [];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: VPCConstructProps) {
    super(scope, id);

    // Create VPC with DNS support
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-igw`,
      },
    });

    // Create public subnets and route tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Create public subnets
    props.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.azs[index % props.azs.length],
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-public-${index + 1}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(subnet);

      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create NAT Gateways (one per AZ for high availability)
    const natGatewayCount = Math.min(
      props.azs.length,
      props.publicSubnetCidrs.length
    );
    for (let i = 0; i < natGatewayCount; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-nat-eip-${i + 1}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[i].id,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-nat-${i + 1}`,
        },
      });
      this.natGateways.push(natGateway);
    }

    // Create private subnets with route tables
    props.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.azs[index % props.azs.length],
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-private-${index + 1}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(subnet);

      // Create route table for each private subnet
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-private-rt-${index + 1}`,
        },
      });

      // Route to NAT Gateway (distribute across NATs for AZ resilience)
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index % this.natGateways.length].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create Network ACLs for defense-in-depth
    this.createNetworkAcls(props);
  }

  private createNetworkAcls(props: VPCConstructProps) {
    // Public subnet NACL - Allow HTTP/HTTPS inbound, ephemeral outbound
    const publicNacl = new NetworkAcl(this, 'public-nacl', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-public-nacl`,
      },
    });

    // Allow inbound HTTP/HTTPS from anywhere
    new NetworkAclRule(this, 'public-nacl-http-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'public-nacl-https-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Allow ephemeral ports inbound for return traffic
    new NetworkAclRule(this, 'public-nacl-ephemeral-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 200,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // Allow all outbound traffic
    new NetworkAclRule(this, 'public-nacl-out', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Associate with public subnets
    this.publicSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `public-nacl-assoc-${index}`, {
        networkAclId: publicNacl.id,
        subnetId: subnet.id,
      });
    });

    // Private subnet NACL - Restrict to VPC traffic and required external services
    const privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-private-nacl`,
      },
    });

    // Allow all traffic from within VPC
    new NetworkAclRule(this, 'private-nacl-vpc-in', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: props.vpcCidr,
    });

    // Allow HTTPS outbound for AWS API calls
    new NetworkAclRule(this, 'private-nacl-https-out', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    // Allow ephemeral ports for return traffic
    new NetworkAclRule(this, 'private-nacl-ephemeral-out', {
      networkAclId: privateNacl.id,
      ruleNumber: 200,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: true,
    });

    // Associate with private subnets
    this.privateSubnets.forEach((subnet, index) => {
      new NetworkAclAssociation(this, `private-nacl-assoc-${index}`, {
        networkAclId: privateNacl.id,
        subnetId: subnet.id,
      });
    });
  }
}

export interface IAMRoleConfig {
  roleName: string;
  assumeRolePolicy: any;
  policies: Array<{
    policyName: string;
    policyDocument: any;
  }>;
  managedPolicyArns?: string[];
}

/**
 * IAM Construct: Creates least-privilege IAM roles and policies
 */
export class IAMConstruct extends Construct {
  constructor(scope: Construct, id: string, __props: BaseConstructProps) {
    super(scope, id);
  }

  public createRole(config: IAMRoleConfig): IamRole {
    const role = new IamRole(this, config.roleName, {
      name: config.roleName,
      assumeRolePolicy: JSON.stringify(config.assumeRolePolicy),
      tags: {
        Name: config.roleName,
      },
    });

    // Attach inline policies
    config.policies.forEach(policy => {
      new IamRolePolicy(this, `${config.roleName}-${policy.policyName}`, {
        role: role.name, // Changed from role.id to role.name
        name: policy.policyName,
        policy: JSON.stringify(policy.policyDocument),
      });
    });

    // Attach managed policies
    if (config.managedPolicyArns) {
      config.managedPolicyArns.forEach((arn, index) => {
        new IamRolePolicyAttachment(
          this,
          `${config.roleName}-managed-${index}`,
          {
            role: role.name,
            policyArn: arn,
          }
        );
      });
    }

    return role;
  }

  /**
   * Example MFA-enforced policy for sensitive operations
   * This should be attached to user groups requiring MFA
   */
  public static getMfaEnforcedPolicyDocument(): any {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyAllExceptListedIfNoMFA',
          Effect: 'Deny',
          NotAction: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListUsers',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
          ],
          Resource: '*',
          Condition: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        },
      ],
    };
  }

  public static getEc2InstancePolicy(
    bucketArns: string[],
    secretArns: string[]
  ): any {
    const statements: any[] = [];

    // S3 Access - only add if bucketArns is not empty
    if (bucketArns.length > 0) {
      statements.push({
        Sid: 'S3Access',
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        Resource: bucketArns.flatMap(arn => [arn, `${arn}/*`]),
      });
    }

    // Secrets Manager Access - only add if secretArns is not empty
    if (secretArns.length > 0) {
      statements.push({
        Sid: 'SecretsManagerAccess',
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        Resource: secretArns,
      });
    }

    // Always include CloudWatch Logs
    statements.push({
      Sid: 'CloudWatchLogs',
      Effect: 'Allow',
      Action: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      Resource: 'arn:aws:logs:*:*:log-group:/aws/ec2/*',
    });

    // Always include SSM Access
    statements.push({
      Sid: 'SSMAccess',
      Effect: 'Allow',
      Action: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath',
      ],
      Resource: 'arn:aws:ssm:*:*:parameter/*',
    });

    // Always include CloudWatch Metrics
    statements.push({
      Sid: 'CloudWatchMetrics',
      Effect: 'Allow',
      Action: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics',
      ],
      Resource: '*',
    });

    return {
      Version: '2012-10-17',
      Statement: statements,
    };
  }
}

export interface S3BucketConstructProps extends BaseConstructProps {
  bucketName: string;
  encryption?: 'SSE-S3' | 'SSE-KMS';
  kmsKeyArn?: string;
  versioning?: boolean;
  accessLogging?: {
    targetBucket: string;
    targetPrefix: string;
  };
}

/**
 * S3 Bucket Construct: Creates secure S3 buckets with encryption,
 * public access blocking, and access logging
 */
export class S3BucketConstruct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketPolicy: S3BucketPolicy;

  constructor(scope: Construct, id: string, props: S3BucketConstructProps) {
    super(scope, id);

    // Create bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags: {
        ...props.tags,
        Name: props.bucketName,
      },
    });

    // Configure versioning
    if (props.versioning !== false) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Block public access
    new S3BucketPublicAccessBlock(this, 'pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Bucket policy to deny public access
    this.bucketPolicy = new S3BucketPolicy(this, 'policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              `arn:aws:s3:::${props.bucketName}`,
              `arn:aws:s3:::${props.bucketName}/*`,
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${props.bucketName}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption':
                  props.encryption === 'SSE-KMS' ? 'aws:kms' : 'AES256',
              },
            },
          },
        ],
      }),
    });

    // Access logging
    if (props.accessLogging) {
      new S3BucketLoggingA(this, 'logging', {
        bucket: this.bucket.id,
        targetBucket: props.accessLogging.targetBucket,
        targetPrefix: props.accessLogging.targetPrefix,
      });
    }
  }
}

export interface RDSConstructProps extends BaseConstructProps {
  instanceIdentifier: string;
  instanceClass: string;
  allocatedStorage: number;
  engine: string;
  multiAz: boolean;
  subnetIds: string[];
  vpcSecurityGroupIds: string[];
  backupRetentionPeriod: number;
  backupWindow: string;
  maintenanceWindow: string;
  deletionProtection: boolean;
  kmsKeyId?: string;
  storageEncrypted: boolean;
}

/**
 * RDS Construct: Creates Multi-AZ RDS instances with encryption and
 * Secrets Manager integration
 */
export class RDSConstruct extends Construct {
  public readonly instance: DbInstance;
  public readonly secret: SecretsmanagerSecret;
  public readonly secretVersion: SecretsmanagerSecretVersion;
  public readonly dbPassword: Password;

  constructor(scope: Construct, id: string, props: RDSConstructProps) {
    super(scope, id);

    // Generate random password for database
    this.dbPassword = new Password(this, 'db-password', {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    });

    // Create DB subnet group - use lowercase name
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `${props.instanceIdentifier.toLowerCase()}-subnet-group`,
      subnetIds: props.subnetIds,
      tags: {
        ...props.tags,
        Name: `${props.instanceIdentifier}-subnet-group`,
      },
    });

    // Create secret for DB credentials
    this.secret = new SecretsmanagerSecret(this, 'secret', {
      name: `${props.instanceIdentifier}-credentials`,
      description: `Database credentials for ${props.instanceIdentifier}`,
      tags: {
        ...props.tags,
        Name: `${props.instanceIdentifier}-credentials`,
      },
    });

    // Create RDS instance
    this.instance = new DbInstance(this, 'instance', {
      identifier: props.instanceIdentifier.toLowerCase(),
      engine: props.engine,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: props.storageEncrypted,
      kmsKeyId: props.kmsKeyId,

      // Credentials
      username: 'dbadmin',
      password: this.dbPassword.result,

      // Multi-AZ and subnet configuration
      multiAz: props.multiAz,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: props.vpcSecurityGroupIds,

      // Backup configuration
      backupRetentionPeriod: props.backupRetentionPeriod,
      backupWindow: props.backupWindow,
      maintenanceWindow: props.maintenanceWindow,

      // Security
      deletionProtection: props.deletionProtection,
      skipFinalSnapshot: !props.deletionProtection,
      finalSnapshotIdentifier: `${props.instanceIdentifier.toLowerCase()}-final-snapshot`,

      // Performance Insights
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,

      tags: {
        ...props.tags,
        Name: props.instanceIdentifier,
      },
    });

    // Generate secret values with proper references
    this.secretVersion = new SecretsmanagerSecretVersion(
      this,
      'secret-version',
      {
        secretId: this.secret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: this.dbPassword.result,
          engine: props.engine,
          host: this.instance.endpoint,
          port: props.engine === 'postgres' ? 5432 : 3306,
          dbname: 'appdb',
        }),
      }
    );
  }
}

export interface ALBASGConstructProps extends BaseConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  healthCheckPath: string;
  instanceRole: IamRole;
  instanceSecurityGroupId: string;
  albSecurityGroupId: string;
  targetPort: number;
  launchTemplateUserData?: string;
  keyName?: string;
}

/**
 * ALB and ASG Construct: Creates Application Load Balancer with
 * Auto Scaling Group for high availability
 */
export class ALBASGConstruct extends Construct {
  public readonly alb: Alb;
  public readonly targetGroup: AlbTargetGroup;
  public readonly asg: AutoscalingGroup;
  public readonly launchTemplate: LaunchTemplate;

  constructor(scope: Construct, id: string, props: ALBASGConstructProps) {
    super(scope, id);

    // Create ALB
    this.alb = new Alb(this, 'alb', {
      name: `${props.projectName}-${props.environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [props.albSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: props.environment === 'production',
      enableHttp2: true,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-alb`,
      },
    });

    // Create target group
    this.targetGroup = new AlbTargetGroup(this, 'tg', {
      name: `${props.projectName}-${props.environment}-tg`,
      port: props.targetPort,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: props.healthCheckPath,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-tg`,
      },
    });

    // Create ALB listener
    new AlbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });

    // Create launch template
    this.launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `${props.projectName}-${props.environment}-lt`,
      imageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 in us-east-1
      instanceType: props.instanceType,
      keyName: props.keyName,
      vpcSecurityGroupIds: [props.instanceSecurityGroupId],
      iamInstanceProfile: {
        arn: new IamInstanceProfile(this, 'instance-profile', {
          name: `${props.projectName}-${props.environment}-instance-profile`,
          role: props.instanceRole.name,
        }).arn,
      },
      userData: Buffer.from(
        props.launchTemplateUserData || this.getDefaultUserData()
      ).toString('base64'),
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 30,
            volumeType: 'gp3',
            encrypted: 'true',
            deleteOnTermination: 'true',
          },
        },
      ],
      metadataOptions: {
        httpTokens: 'required', // IMDSv2 required
        httpPutResponseHopLimit: 1,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...props.tags,
            Name: `${props.projectName}-${props.environment}-asg-instance`,
          },
        },
      ],
    });

    // Create Auto Scaling Group
    this.asg = new AutoscalingGroup(this, 'asg', {
      name: `${props.projectName}-${props.environment}-asg`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.privateSubnetIds,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      targetGroupArns: [this.targetGroup.arn],
      tag: Object.entries(props.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Target tracking scaling policy
    new AutoscalingPolicy(this, 'scale-policy', {
      name: `${props.projectName}-${props.environment}-scale-policy`,
      autoscalingGroupName: this.asg.name,
      policyType: 'TargetTrackingScaling',
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
        targetValue: 70,
      },
    });
  }

  private getDefaultUserData(): string {
    return `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Health Check Page</h1>" > /var/www/html/health
`;
  }
}

export interface MonitoringConstructProps extends BaseConstructProps {
  vpcId: string;
  auditBucketName: string;
  cloudTrailName: string;
  logRetentionDays: number;
  enableFlowLogs: boolean;
}

/**
 * Monitoring Construct: Sets up CloudTrail, VPC Flow Logs, and CloudWatch
 */
export class MonitoringConstruct extends Construct {
  public readonly cloudTrail: Cloudtrail;
  public readonly logGroup: CloudwatchLogGroup;
  public readonly flowLogs?: FlowLog;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new CloudwatchLogGroup(this, 'trail-logs', {
      name: `/aws/cloudtrail/${props.cloudTrailName}`,
      retentionInDays: props.logRetentionDays,
      tags: {
        ...props.tags,
        Name: `/aws/cloudtrail/${props.cloudTrailName}`,
      },
    });

    // IAM role for CloudTrail to write to CloudWatch Logs
    const cloudTrailRole = new IamRole(this, 'cloudtrail-role', {
      name: `${props.projectName}-${props.environment}-cloudtrail-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'cloudtrail-policy', {
      role: cloudTrailRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${this.logGroup.arn}:*`,
          },
        ],
      }),
    });

    // Create CloudTrail
    this.cloudTrail = new Cloudtrail(this, 'trail', {
      name: props.cloudTrailName,
      s3BucketName: props.auditBucketName,
      s3KeyPrefix: 'cloudtrail',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      cloudWatchLogsGroupArn: `${this.logGroup.arn}:*`,
      cloudWatchLogsRoleArn: cloudTrailRole.arn,
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::*/'],
            },
          ],
        },
      ],
      tags: {
        ...props.tags,
        Name: props.cloudTrailName,
      },
    });

    // VPC Flow Logs
    if (props.enableFlowLogs) {
      const flowLogGroup = new CloudwatchLogGroup(this, 'flow-logs', {
        name: `/aws/vpc/flowlogs/${props.vpcId}`,
        retentionInDays: props.logRetentionDays,
        tags: {
          ...props.tags,
          Name: `/aws/vpc/flowlogs/${props.vpcId}`,
        },
      });

      const flowLogRole = new IamRole(this, 'flow-log-role', {
        name: `${props.projectName}-${props.environment}-flow-log-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      });

      new IamRolePolicy(this, 'flow-log-policy', {
        role: flowLogRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: `${flowLogGroup.arn}:*`,
            },
          ],
        }),
      });

      this.flowLogs = new FlowLog(this, 'vpc-flow-logs', {
        iamRoleArn: flowLogRole.arn,
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogGroup.arn,
        trafficType: 'ALL',
        vpcId: props.vpcId,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-vpc-flow-logs`,
        },
      });
    }
  }
}

export interface SecurityConstructProps extends BaseConstructProps {
  region: string;
  configBucketName: string;
  snsTopicArn?: string;
}

/**
 * Security Construct: Enables GuardDuty, AWS Config, and WAF
 */
export class SecurityConstruct extends Construct {
  public readonly guardDutyDetector: GuarddutyDetector;
  public readonly configRecorder: ConfigConfigurationRecorder;
  public readonly wafWebAcl?: Wafv2WebAcl;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Enable GuardDuty
    this.guardDutyDetector = new GuarddutyDetector(this, 'guardduty', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-guardduty`,
      },
    });

    // Setup AWS Config
    const configRole = new IamRole(this, 'config-role', {
      name: `${props.projectName}-${props.environment}-config-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'config-policy', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole',
    });

    new IamRolePolicy(this, 'config-s3-policy', {
      role: configRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetBucketVersioning', 's3:PutObject', 's3:GetObject'],
            Resource: [
              `arn:aws:s3:::${props.configBucketName}`,
              `arn:aws:s3:::${props.configBucketName}/*`,
            ],
          },
        ],
      }),
    });

    // Create Config Recorder
    this.configRecorder = new ConfigConfigurationRecorder(this, 'recorder', {
      name: `${props.projectName}-${props.environment}-recorder`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create Config Delivery Channel
    new ConfigDeliveryChannel(this, 'delivery-channel', {
      name: `${props.projectName}-${props.environment}-delivery`,
      s3BucketName: props.configBucketName,
      s3KeyPrefix: 'config',
      snsTopicArn: props.snsTopicArn,
    });

    // Start Config Recorder
    new ConfigConfigurationRecorderStatus(this, 'recorder-status', {
      name: this.configRecorder.name,
      isEnabled: true,
      dependsOn: [this.configRecorder],
    });

    // Create WAF WebACL
    this.wafWebAcl = new Wafv2WebAcl(this, 'waf', {
      name: `${props.projectName}-${props.environment}-waf`,
      description: 'Web ACL for application protection',
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rule: [
        {
          name: 'RateLimitRule',
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
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
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
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
            metricName: 'AWSManagedRulesKnownBadInputsRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'WebACLMetric',
        sampledRequestsEnabled: true,
      },
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-waf`,
      },
    });
  }
}

/**
 * SSM Parameter Store helper for non-sensitive configuration
 */
export class SSMParameterHelper {
  public static createParameter(
    scope: Construct,
    id: string,
    name: string,
    value: string,
    description: string,
    tags: { [key: string]: string }
  ): SsmParameter {
    return new SsmParameter(scope, id, {
      name: name,
      type: 'String',
      value: value,
      description: description,
      tags: tags,
    });
  }

  public static createSecureParameter(
    scope: Construct,
    id: string,
    name: string,
    value: string,
    description: string,
    tags: { [key: string]: string }
  ): SsmParameter {
    return new SsmParameter(scope, id, {
      name: name,
      type: 'SecureString',
      value: value,
      description: description,
      tags: tags,
    });
  }
}

/**
 * CloudWatch Alarms helper
 */
export class CloudWatchAlarmsHelper {
  public static createHighCPUAlarm(
    scope: Construct,
    id: string,
    instanceId: string,
    snsTopicArn: string,
    threshold: number = 80
  ): CloudwatchMetricAlarm {
    return new CloudwatchMetricAlarm(scope, id, {
      alarmName: `${instanceId}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: threshold,
      dimensions: {
        InstanceId: instanceId,
      },
      alarmActions: [snsTopicArn],
      treatMissingData: 'notBreaching',
    });
  }

  public static createRDSStorageAlarm(
    scope: Construct,
    id: string,
    dbInstanceIdentifier: string,
    snsTopicArn: string,
    thresholdBytes: number = 5 * 1024 * 1024 * 1024 // 5GB
  ): CloudwatchMetricAlarm {
    return new CloudwatchMetricAlarm(scope, id, {
      alarmName: `${dbInstanceIdentifier}-low-storage`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: thresholdBytes,
      dimensions: {
        DBInstanceIdentifier: dbInstanceIdentifier,
      },
      alarmActions: [snsTopicArn],
      treatMissingData: 'notBreaching',
    });
  }

  public static createUnauthorizedAPICallsAlarm(
    scope: Construct,
    id: string,
    snsTopicArn: string,
    logGroupName: string
  ): CloudwatchMetricAlarm {
    const metricFilter = new CloudwatchLogMetricFilter(scope, `${id}-filter`, {
      name: 'UnauthorizedAPICalls',
      pattern:
        '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }',
      logGroupName: logGroupName,
      metricTransformation: {
        name: 'UnauthorizedAPICalls',
        namespace: 'CloudTrailMetrics',
        value: '1',
      },
    });

    return new CloudwatchMetricAlarm(scope, id, {
      alarmName: 'unauthorized-api-calls',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: metricFilter.metricTransformation.name,
      namespace: metricFilter.metricTransformation.namespace,
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmActions: [snsTopicArn],
      treatMissingData: 'notBreaching',
    });
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Import custom modules
import {
  VPCConstruct,
  IAMConstruct,
  S3BucketConstruct,
  RDSConstruct,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new RandomProvider(this, 'random', {});

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${awsRegion}/${id}.tfstate`, // Add region to path
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: id,
    };

    // Create VPC
    const vpcModule = new VPCConstruct(this, 'vpc', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      azs: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Create KMS key for encryption
    const kmsModule = new (class extends Construct {
      public readonly key: KmsKey;
      public readonly alias: KmsAlias;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.key = new KmsKey(scope, 'kms-key', {
          description: `${id}-${environmentSuffix} encryption key`,
          enableKeyRotation: true,
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-kms-key`,
          },
        });

        this.alias = new KmsAlias(scope, 'kms-alias', {
          name: `alias/${id}-${environmentSuffix}`,
          targetKeyId: this.key.keyId,
        });
      }
    })(this, 'kms');

    // Create IAM roles
    const iamModule = new IAMConstruct(this, 'iam', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
    });

    // Create S3 buckets
    const publicS3Module = new S3BucketConstruct(this, 'public-s3', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      bucketName: `${id.toLowerCase()}-${environmentSuffix}-pubblic-assets`, // Convert to lowercase
      encryption: 'SSE-S3',
      versioning: true,
    });

    const privateS3Module = new S3BucketConstruct(this, 'private-s3', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      bucketName: `${id.toLowerCase()}-${environmentSuffix}-priivate-data`, // Convert to lowercase
      encryption: 'SSE-KMS',
      kmsKeyArn: kmsModule.key.arn,
      versioning: true,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${id}-${environmentSuffix}-alb-sg`,
      description: 'Security group for ALB',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-alb-sg`,
      },
    });

    const instanceSecurityGroup = new SecurityGroup(this, 'instance-sg', {
      name: `${id}-${environmentSuffix}-instance-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'Allow HTTP from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-instance-sg`,
      },
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-${environmentSuffix}-rds-sg`,
      description: 'Security group for RDS',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [instanceSecurityGroup.id],
          description: 'Allow PostgreSQL from instances',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-rds-sg`,
      },
    });

    // Create EC2 instance role
    const ec2Role = iamModule.createRole({
      roleName: `${id}-${environmentSuffix}-ecc2-role`,
      assumeRolePolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      policies: [
        {
          policyName: 'ec2-policy',
          policyDocument: IAMConstruct.getEc2InstancePolicy(
            [publicS3Module.bucket.arn, privateS3Module.bucket.arn],
            []
          ),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      ],
    });

    // ADD THIS: Create instance profile for the role
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${id}-${environmentSuffix}-instannce-profile`,
        role: ec2Role.name,
      }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create public EC2 instance
    const publicEc2Module = new (class extends Construct {
      public readonly instance: Instance;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.instance = new Instance(scope, 'public-instance', {
          instanceType: 't3.micro',
          ami: ami.id,
          subnetId: vpcModule.publicSubnets[0].id,
          vpcSecurityGroupIds: [instanceSecurityGroup.id],
          iamInstanceProfile: ec2InstanceProfile.name, // Use instance profile name, not role name
          metadataOptions: {
            httpTokens: 'required',
            httpPutResponseHopLimit: 1,
          },
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-public-instance`,
          },
        });
      }
    })(this, 'public-ec2');

    // Create private EC2 instance
    const privateEc2Module = new (class extends Construct {
      public readonly instance: Instance;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.instance = new Instance(scope, 'private-instance', {
          instanceType: 't3.micro',
          ami: ami.id,
          subnetId: vpcModule.privateSubnets[0].id,
          vpcSecurityGroupIds: [instanceSecurityGroup.id],
          iamInstanceProfile: ec2InstanceProfile.name, // Use instance profile name, not role name
          metadataOptions: {
            httpTokens: 'required',
            httpPutResponseHopLimit: 1,
          },
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-private-instance`,
          },
        });
      }
    })(this, 'private-ec2');

    // Create RDS instance
    const rdsModule = new RDSConstruct(this, 'rds', {
      projectName: id.toLowerCase(),
      environment: environmentSuffix,
      tags: commonTags,
      instanceIdentifier: `${id.toLowerCase()}-${environmentSuffix}-db`,
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      engine: 'postgres',
      multiAz: environmentSuffix === 'production',
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: environmentSuffix === 'production' ? 30 : 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: environmentSuffix === 'production',
      kmsKeyId: kmsModule.key.arn, // Changed from .id to .arn
      storageEncrypted: true,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-ec2-instance-id', {
      value: publicEc2Module.instance.id,
      description: 'Public EC2 instance ID',
    });

    new TerraformOutput(this, 'public-ec2-public-ip', {
      value: publicEc2Module.instance.publicIp,
      description: 'Public EC2 instance public IP address',
    });

    new TerraformOutput(this, 'private-ec2-instance-id', {
      value: privateEc2Module.instance.id,
      description: 'Private EC2 instance ID',
    });

    new TerraformOutput(this, 'private-ec2-private-ip', {
      value: privateEc2Module.instance.privateIp,
      description: 'Private EC2 instance private IP address',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
```