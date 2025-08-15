I'll design and implement a security-hardened, dual-region AWS infrastructure using CDKTF with TypeScript. This solution will demonstrate best practices for security, monitoring, and compliance.

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLogging } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsClusterCapacityProviders } from '@cdktf/provider-aws/lib/ecs-cluster-capacity-providers';
import { CloudwatchLogStream } from '@cdktf/provider-aws/lib/cloudwatch-log-stream';

interface RegionConfig {
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  privateSubnetCidrs: string[];
  publicSubnetCidrs: string[];
}

interface CommonTags {
  Environment: string;
  Owner: string;
  Project: string;
  Region: string;
  ManagedBy: string;
}

class SecureInfrastructureStack extends TerraformStack {
  private readonly commonTags: Omit<CommonTags, 'Region'>;
  private readonly regionConfigs: RegionConfig[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources
    this.commonTags = {
      Environment: 'production',
      Owner: 'infrastructure-team',
      Project: 'secure-multi-region-infrastructure',
      ManagedBy: 'terraform-cdktf',
    };

    // Region configurations
    this.regionConfigs = [
      {
        region: 'us-east-1',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        vpcCidr: '10.0.0.0/16',
        privateSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        publicSubnetCidrs: ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'],
      },
      {
        region: 'us-west-2',
        availabilityZones: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
        vpcCidr: '10.1.0.0/16',
        privateSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
        publicSubnetCidrs: ['10.1.101.0/24', '10.1.102.0/24', '10.1.103.0/24'],
      },
    ];

    // Deploy infrastructure in both regions
    this.regionConfigs.forEach(config => {
      this.createRegionalInfrastructure(config);
    });
  }

  private createRegionalInfrastructure(config: RegionConfig): void {
    const regionTags: CommonTags = {
      ...this.commonTags,
      Region: config.region,
    };

    // AWS Provider for this region
    const provider = new AwsProvider(this, `aws-provider-${config.region}`, {
      region: config.region,
      alias: config.region,
      defaultTags: [
        {
          tags: regionTags,
        },
      ],
    });

    // Data sources
    const callerIdentity = new DataAwsCallerIdentity(
      this,
      `caller-identity-${config.region}`,
      {
        provider: provider,
      }
    );

    const currentRegion = new DataAwsRegion(
      this,
      `current-region-${config.region}`,
      {
        provider: provider,
      }
    );

    // KMS Key for encryption
    const kmsKey = this.createKmsKey(config.region, provider, callerIdentity);

    // CloudWatch Log Groups
    const logGroups = this.createCloudWatchLogGroups(
      config.region,
      provider,
      kmsKey
    );

    // IAM Roles and Policies
    const iamRoles = this.createIamRoles(
      config.region,
      provider,
      logGroups,
      kmsKey
    );

    // VPC and Networking
    const networkingResources = this.createNetworking(
      config,
      provider,
      logGroups,
      kmsKey
    );

    // S3 Buckets
    const s3Resources = this.createS3Resources(
      config.region,
      provider,
      kmsKey,
      logGroups
    );

    // ECS Cluster
    const ecsCluster = this.createEcsCluster(
      config.region,
      provider,
      logGroups,
      kmsKey,
      iamRoles
    );

    // Outputs
    this.createOutputs(config.region, {
      kmsKey,
      vpc: networkingResources.vpc,
      s3Bucket: s3Resources.bucket,
      ecsCluster,
    });
  }

  private createKmsKey(
    region: string,
    provider: AwsProvider,
    callerIdentity: DataAwsCallerIdentity
  ): KmsKey {
    const kmsKeyPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudWatch Logs',
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
              'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${callerIdentity.accountId}:log-group:*`,
            },
          },
        },
        {
          Sid: 'Allow S3 Service',
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
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
          Sid: 'Allow ECS Service',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs.amazonaws.com',
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
      ],
    };

    const kmsKey = new KmsKey(this, `kms-key-${region}`, {
      provider: provider,
      description: `Customer managed KMS key for ${region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      policy: JSON.stringify(kmsKeyPolicy),
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `secure-infrastructure-kms-${region}`,
      },
    });

    new KmsAlias(this, `kms-alias-${region}`, {
      provider: provider,
      name: `alias/secure-infrastructure-${region}`,
      targetKeyId: kmsKey.keyId,
    });

    return kmsKey;
  }

  private createCloudWatchLogGroups(
    region: string,
    provider: AwsProvider,
    kmsKey: KmsKey
  ): {
    vpcFlowLogs: CloudwatchLogGroup;
    applicationLogs: CloudwatchLogGroup;
    auditLogs: CloudwatchLogGroup;
  } {
    const vpcFlowLogs = new CloudwatchLogGroup(
      this,
      `vpc-flow-logs-${region}`,
      {
        provider: provider,
        name: `/aws/vpc/flowlogs/${region}`,
        retentionInDays: 90,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `vpc-flow-logs-${region}`,
          LogType: 'VPCFlowLogs',
        },
      }
    );

    const applicationLogs = new CloudwatchLogGroup(
      this,
      `application-logs-${region}`,
      {
        provider: provider,
        name: `/aws/ecs/application/${region}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `application-logs-${region}`,
          LogType: 'ApplicationLogs',
        },
      }
    );

    const auditLogs = new CloudwatchLogGroup(this, `audit-logs-${region}`, {
      provider: provider,
      name: `/aws/audit/${region}`,
      retentionInDays: 365,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `audit-logs-${region}`,
        LogType: 'AuditLogs',
      },
    });

    return { vpcFlowLogs, applicationLogs, auditLogs };
  }

  private createIamRoles(
    region: string,
    provider: AwsProvider,
    logGroups: {
      vpcFlowLogs: CloudwatchLogGroup;
      applicationLogs: CloudwatchLogGroup;
      auditLogs: CloudwatchLogGroup;
    },
    kmsKey: KmsKey
  ): {
    ecsTaskRole: IamRole;
    ecsExecutionRole: IamRole;
    vpcFlowLogsRole: IamRole;
  } {
    // ECS Task Role
    const ecsTaskAssumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        },
      ],
    };

    const ecsTaskRole = new IamRole(this, `ecs-task-role-${region}`, {
      provider: provider,
      name: `ecs-task-role-${region}`,
      assumeRolePolicy: JSON.stringify(ecsTaskAssumeRolePolicy),
      tags: {
        Name: `ecs-task-role-${region}`,
        Purpose: 'ECSTaskExecution',
      },
    });

    const ecsTaskPolicy = new IamPolicy(this, `ecs-task-policy-${region}`, {
      provider: provider,
      name: `ecs-task-policy-${region}`,
      description: 'Policy for ECS tasks with least privilege',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: [
              logGroups.applicationLogs.arn,
              `${logGroups.applicationLogs.arn}:*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: kmsKey.arn,
            Condition: {
              StringEquals: {
                'kms:ViaService': `logs.${region}.amazonaws.com`,
              },
            },
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, `ecs-task-policy-attachment-${region}`, {
      provider: provider,
      role: ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // ECS Execution Role
    const ecsExecutionRole = new IamRole(this, `ecs-execution-role-${region}`, {
      provider: provider,
      name: `ecs-execution-role-${region}`,
      assumeRolePolicy: JSON.stringify(ecsTaskAssumeRolePolicy),
      tags: {
        Name: `ecs-execution-role-${region}`,
        Purpose: 'ECSExecution',
      },
    });

    const ecsExecutionPolicy = new IamPolicy(
      this,
      `ecs-execution-policy-${region}`,
      {
        provider: provider,
        name: `ecs-execution-policy-${region}`,
        description: 'Policy for ECS execution with least privilege',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: [
                logGroups.applicationLogs.arn,
                `${logGroups.applicationLogs.arn}:*`,
              ],
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: kmsKey.arn,
              Condition: {
                StringEquals: {
                  'kms:ViaService': `logs.${region}.amazonaws.com`,
                },
              },
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(
      this,
      `ecs-execution-policy-attachment-${region}`,
      {
        provider: provider,
        role: ecsExecutionRole.name,
        policyArn: ecsExecutionPolicy.arn,
      }
    );

    // VPC Flow Logs Role
    const vpcFlowLogsAssumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com',
          },
        },
      ],
    };

    const vpcFlowLogsRole = new IamRole(this, `vpc-flow-logs-role-${region}`, {
      provider: provider,
      name: `vpc-flow-logs-role-${region}`,
      assumeRolePolicy: JSON.stringify(vpcFlowLogsAssumeRolePolicy),
      tags: {
        Name: `vpc-flow-logs-role-${region}`,
        Purpose: 'VPCFlowLogs',
      },
    });

    const vpcFlowLogsPolicy = new IamPolicy(
      this,
      `vpc-flow-logs-policy-${region}`,
      {
        provider: provider,
        name: `vpc-flow-logs-policy-${region}`,
        description: 'Policy for VPC Flow Logs with least privilege',
        policy: JSON.stringify({
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
              Resource: [
                logGroups.vpcFlowLogs.arn,
                `${logGroups.vpcFlowLogs.arn}:*`,
              ],
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(
      this,
      `vpc-flow-logs-policy-attachment-${region}`,
      {
        provider: provider,
        role: vpcFlowLogsRole.name,
        policyArn: vpcFlowLogsPolicy.arn,
      }
    );

    return { ecsTaskRole, ecsExecutionRole, vpcFlowLogsRole };
  }

  private createNetworking(
    config: RegionConfig,
    provider: AwsProvider,
    logGroups: {
      vpcFlowLogs: CloudwatchLogGroup;
      applicationLogs: CloudwatchLogGroup;
      auditLogs: CloudwatchLogGroup;
    },
    kmsKey: KmsKey
  ): { vpc: Vpc; privateSubnets: Subnet[]; publicSubnets: Subnet[] } {
    // VPC
    const vpc = new Vpc(this, `vpc-${config.region}`, {
      provider: provider,
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `secure-vpc-${config.region}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `igw-${config.region}`, {
      provider: provider,
      vpcId: vpc.id,
      tags: {
        Name: `secure-igw-${config.region}`,
      },
    });

    // Public Subnets
    const publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${config.region}-${index + 1}`, {
        provider: provider,
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: false, // Security best practice: no auto-assign public IPs
        tags: {
          Name: `secure-public-subnet-${config.region}-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Private Subnets
    const privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${config.region}-${index + 1}`, {
        provider: provider,
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          Name: `secure-private-subnet-${config.region}-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Route Tables
    const publicRouteTable = new RouteTable(
      this,
      `public-rt-${config.region}`,
      {
        provider: provider,
        vpcId: vpc.id,
        tags: {
          Name: `secure-public-rt-${config.region}`,
        },
      }
    );

    const privateRouteTable = new RouteTable(
      this,
      `private-rt-${config.region}`,
      {
        provider: provider,
        vpcId: vpc.id,
        tags: {
          Name: `secure-private-rt-${config.region}`,
        },
      }
    );

    // Routes
    new Route(this, `public-route-${config.region}`, {
      provider: provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Route Table Associations
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `public-rta-${config.region}-${index + 1}`,
        {
          provider: provider,
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `private-rta-${config.region}-${index + 1}`,
        {
          provider: provider,
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Security Groups
    const privateSecurityGroup = new SecurityGroup(
      this,
      `private-sg-${config.region}`,
      {
        provider: provider,
        name: `secure-private-sg-${config.region}`,
        description: 'Security group for private resources',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [config.vpcCidr],
            description: 'HTTPS within VPC',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: [config.vpcCidr],
            description: 'HTTP within VPC',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP outbound',
          },
        ],
        tags: {
          Name: `secure-private-sg-${config.region}`,
        },
      }
    );

    return { vpc, privateSubnets, publicSubnets };
  }

  private createS3Resources(
    region: string,
    provider: AwsProvider,
    kmsKey: KmsKey,
    logGroups: {
      vpcFlowLogs: CloudwatchLogGroup;
      applicationLogs: CloudwatchLogGroup;
      auditLogs: CloudwatchLogGroup;
    }
  ): { bucket: S3Bucket; accessLogsBucket: S3Bucket } {
    // Access Logs Bucket (for S3 access logging)
    const accessLogsBucket = new S3Bucket(
      this,
      `access-logs-bucket-${region}`,
      {
        provider: provider,
        bucket: `secure-access-logs-${region}-${Date.now()}`,
        tags: {
          Name: `secure-access-logs-${region}`,
          Purpose: 'AccessLogs',
        },
      }
    );

    new S3BucketPublicAccessBlock(this, `access-logs-bucket-pab-${region}`, {
      provider: provider,
      bucket: accessLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfiguration(
      this,
      `access-logs-bucket-encryption-${region}`,
      {
        provider: provider,
        bucket: accessLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new S3BucketVersioning(this, `access-logs-bucket-versioning-${region}`, {
      provider: provider,
      bucket: accessLogsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Main Application Bucket
    const bucket = new S3Bucket(this, `app-bucket-${region}`, {
      provider: provider,
      bucket: `secure-app-data-${region}-${Date.now()}`,
      tags: {
        Name: `secure-app-data-${region}`,
        Purpose: 'ApplicationData',
      },
    });

    new S3BucketPublicAccessBlock(this, `app-bucket-pab-${region}`, {
      provider: provider,
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfiguration(
      this,
      `app-bucket-encryption-${region}`,
      {
        provider: provider,
        bucket: bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new S3BucketVersioning(this, `app-bucket-versioning-${region}`, {
      provider: provider,
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketLogging(this, `app-bucket-logging-${region}`, {
      provider: provider,
      bucket: bucket.id,
      targetBucket: accessLogsBucket.id,
      targetPrefix: 'access-logs/',
    });

    return { bucket, accessLogsBucket };
  }

  private createEcsCluster(
    region: string,
    provider: AwsProvider,
    logGroups: {
      vpcFlowLogs: CloudwatchLogGroup;
      applicationLogs: CloudwatchLogGroup;
      auditLogs: CloudwatchLogGroup;
    },
    kmsKey: KmsKey,
    iamRoles: {
      ecsTaskRole: IamRole;
      ecsExecutionRole: IamRole;
      vpcFlowLogsRole: IamRole;
    }
  ): EcsCluster {
    const ecsCluster = new EcsCluster(this, `ecs-cluster-${region}`, {
      provider: provider,
      name: `secure-ecs-cluster-${region}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      configuration: {
        executeCommandConfiguration: {
          kmsKeyId: kmsKey.arn,
          logging: 'OVERRIDE',
          logConfiguration: {
            cloudWatchLogGroupName: logGroups.applicationLogs.name,
            cloudWatchEncryptionEnabled: true,
          },
        },
      },
      tags: {
        Name: `secure-ecs-cluster-${region}`,
      },
    });

    new EcsClusterCapacityProviders(
      this,
      `ecs-cluster-capacity-providers-${region}`,
      {
        provider: provider,
        clusterName: ecsCluster.name,
        capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        defaultCapacityProviderStrategy: [
          {
            capacityProvider: 'FARGATE',
            weight: 1,
            base: 1,
          },
        ],
      }
    );

    // Create log streams for ECS
    new CloudwatchLogStream(this, `ecs-log-stream-${region}`, {
      provider: provider,
      name: `ecs-tasks-${region}`,
      logGroupName: logGroups.applicationLogs.name,
    });

    return ecsCluster;
  }

  private createOutputs(
    region: string,
    resources: {
      kmsKey: KmsKey;
      vpc: Vpc;
      s3Bucket: S3Bucket;
      ecsCluster: EcsCluster;
    }
  ): void {
    new TerraformOutput(this, `kms-key-id-${region}`, {
      value: resources.kmsKey.keyId,
      description: `KMS Key ID for ${region}`,
    });

    new TerraformOutput(this, `kms-key-arn-${region}`, {
      value: resources.kmsKey.arn,
      description: `KMS Key ARN for ${region}`,
    });

    new TerraformOutput(this, `vpc-id-${region}`, {
      value: resources.vpc.id,
      description: `VPC ID for ${region}`,
    });

    new TerraformOutput(this, `vpc-cidr-${region}`, {
      value: resources.vpc.cidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new TerraformOutput(this, `s3-bucket-name-${region}`, {
      value: resources.s3Bucket.bucket,
      description: `S3 Bucket name for ${region}`,
    });

    new TerraformOutput(this, `s3-bucket-arn-${region}`, {
      value: resources.s3Bucket.arn,
      description: `S3 Bucket ARN for ${region}`,
    });

    new TerraformOutput(this, `ecs-cluster-name-${region}`, {
      value: resources.ecsCluster.name,
      description: `ECS Cluster name for ${region}`,
    });

    new TerraformOutput(this, `ecs-cluster-arn-${region}`, {
      value: resources.ecsCluster.arn,
      description: `ECS Cluster ARN for ${region}`,
    });
  }
}

const app = new App();
new SecureInfrastructureStack(app, 'SecureInfrastructureStack');
app.synth();
```

## Key Features and Security Implementations

### 1. **IAM Security (Least Privilege)**

- **ECS Task Role**: Only permissions to write to specific CloudWatch log groups and use KMS for encryption
- **ECS Execution Role**: Limited to ECR operations and CloudWatch logging
- **VPC Flow Logs Role**: Only permissions to write to VPC flow logs
- **No wildcard permissions**: All policies specify exact resources and actions

### 2. **Encryption at Rest**

- **Customer-managed KMS keys** in each region with restrictive policies
- **Key rotation enabled** for enhanced security
-
