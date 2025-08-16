import { Construct } from 'constructs';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfigurationA } from '@cdktf/provider-aws/lib s3-bucket-lifecycle-configuration-a';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsAccountId } from '@cdktf/provider-aws/lib/data-aws-account-id';
import { Construct } from 'constructs';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { Fn } from 'cdktf';

const commonTags = {
Project: 'SecureMultiRegionApp',
Environment: 'Prod',
Owner: 'SRE-Team',
};

const regions = [
{ name: 'us-east-1', vpcCidr: '10.10.0.0/16' },
{ name: 'us-west-2', vpcCidr: '10.20.0.0/16' },
{ name: 'eu-central-1', vpcCidr: '10.30.0.0/16' },
];

class MultiRegionStack extends TerraformStack {
constructor(scope: Construct, id: string) {
super(scope, id);

    // --- 1. Centralized Resources Provider (us-east-1) ---
    const centralProvider = new AwsProvider(this, 'central-aws', {
      region: 'us-east-1',
      alias: 'central',
    });

    // --- 2. Centralized Logging Setup ---
    const logging = new LoggingConstruct(this, 'Logging', {
      tags: { ...commonTags, Region: 'us-east-1' },
    });
    // The LoggingConstruct implicitly uses the default provider, which we'll set to central
    logging.node.addDependency(centralProvider);

    // --- 3. Centralized Security Setup ---
    const security = new SecurityConstruct(this, 'Security', {
      tags: { ...commonTags, Region: 'us-east-1' },
    });
    security.node.addDependency(centralProvider);

    // --- 4. IAM Role for VPC Flow Logs (must exist in each region) ---
    const flowLogPolicyDoc = new DataAwsIamPolicyDocument(this, 'FlowLogPolicyDoc', {
        statement: [{
            actions: ["sts:AssumeRole"],
            principals: [{ type: "Service", identifiers: ["vpc-flow-logs.amazonaws.com"] }],
        }],
    });

    // Loop through each region to create providers and regional resources
    for (const regionConfig of regions) {
      const region = regionConfig.name;
      const regionalProvider = new AwsProvider(this, `aws-${region}`, {
        region: region,
        alias: region,
      });

      // Create a Flow Log IAM role in each region
      const flowLogRole = new IamRole(this, `FlowLogRole-${region}`, {
        provider: regionalProvider,
        name: `vpc-flow-log-role-${region}`,
        assumeRolePolicy: flowLogPolicyDoc.json,
      });

      const flowLogPermissionsDoc = new DataAwsIamPolicyDocument(this, `FlowLogPermissionsDoc-${region}`, {
          statement: [{
              actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogGroups", "logs:DescribeLogStreams"],
              resources: ["*"], // Restrict in production
          }],
      });

      const flowLogPolicy = new IamPolicy(this, `FlowLogPolicy-${region}`, {
          provider: regionalProvider,
          name: `vpc-flow-log-policy-${region}`,
          policy: flowLogPermissionsDoc.json,
      });

      new IamRolePolicyAttachment(this, `FlowLogAttachment-${region}`, {
          provider: regionalProvider,
          role: flowLogRole.name,
          policyArn: flowLogPolicy.arn,
      });

      // --- 5. Regional Networking ---
      const networking = new NetworkingConstruct(this, `Networking-${region}`, {
        tags: { ...commonTags, Region: region },
        region: region,
        vpcCidr: regionConfig.vpcCidr,
        centralLogBucket: logging.centralLogBucket,
        flowLogRole: flowLogRole,
      });
      networking.node.addDependency(regionalProvider);

      // --- 6. Regional Storage ---
      const storage = new StorageConstruct(this, `Storage-${region}`, {
        tags: { ...commonTags, Region: region },
        region: region,
        dbSubnets: networking.dbSubnets,
        dbSg: networking.dbSg,
        dbSecret: security.dbSecret,
      });
      storage.node.addDependency(regionalProvider);
    }

}
}

const app = new App();
new MultiRegionStack(app, 'secure-multi-region-stack');
app.synth();

export interface StorageConstructProps {
readonly tags: { [key: string]: string };
readonly region: string;
readonly dbSubnets: Subnet[];
readonly dbSg: SecurityGroup;
readonly dbSecret: SecretsmanagerSecret;
}

export class StorageConstruct extends Construct {
public readonly dbInstance: DbInstance;

constructor(scope: Construct, id: string, props: StorageConstructProps) {
super(scope, id);

    const { tags, region, dbSubnets, dbSg, dbSecret } = props;

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `db-subnet-group-${region}`,
      subnetIds: dbSubnets.map(subnet => subnet.id),
      tags,
    });

    // Data source to read the secret value during 'plan' and 'apply'
    const dbSecretVersion = new DataAwsSecretsmanagerSecretVersion(this, 'DbSecretVersion', {
      secretId: dbSecret.id,
    });

    this.dbInstance = new DbInstance(this, 'PostgresDb', {
      engine: 'postgres',
      engineVersion: '14.5',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      identifier: `webapp-db-${region}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSg.id],
      multiAz: true,
      storageEncrypted: true,
      // Securely reference the username and password from Secrets Manager
      username: `\${jsondecode(${dbSecretVersion.secretString})["username"]}`,
      password: `\${jsondecode(${dbSecretVersion.secretString})["password"]}`,
      skipFinalSnapshot: true,
      tags,
    });

}
}

export interface NetworkingConstructProps {
readonly tags: { [key: string]: string };
readonly region: string;
readonly vpcCidr: string;
readonly centralLogBucket: S3Bucket;
readonly flowLogRole: IamRole;
}

export class NetworkingConstruct extends Construct {
public readonly vpc: Vpc;
public readonly dbSubnets: Subnet[];
public readonly dbSg: SecurityGroup;

constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
super(scope, id);

    const { tags, region, vpcCidr, centralLogBucket, flowLogRole } = props;

    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `vpc-${region}` },
    });

    new FlowLog(this, 'VpcFlowLog', {
      iamRoleArn: flowLogRole.arn,
      logDestination: centralLogBucket.arn,
      logDestinationType: 's3',
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags,
    });

    const azs = new DataAwsAvailabilityZones(this, 'AZs', { state: 'available' });

    // For this example, we create one of each subnet type. A production setup would loop over AZs.
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: `${vpcCidr.split('.')[0]}.${vpcCidr.split('.')[1]}.1.0/24`,
      availabilityZone: azs.names.get(0),
      tags: { ...tags, Name: `subnet-public-${region}` },
    });

    const privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: `${vpcCidr.split('.')[0]}.${vpcCidr.split('.')[1]}.2.0/24`,
      availabilityZone: azs.names.get(0),
      tags: { ...tags, Name: `subnet-private-${region}` },
    });

    this.dbSubnets = [
        new Subnet(this, 'DbSubnetA', {
            vpcId: this.vpc.id,
            cidrBlock: `${vpcCidr.split('.')[0]}.${vpcCidr.split('.')[1]}.100.0/24`,
            availabilityZone: azs.names.get(0),
            tags: { ...tags, Name: `subnet-db-${region}-a` },
        }),
        new Subnet(this, 'DbSubnetB', {
            vpcId: this.vpc.id,
            cidrBlock: `${vpcCidr.split('.')[0]}.${vpcCidr.split('.')[1]}.101.0/24`,
            availabilityZone: azs.names.get(1),
            tags: { ...tags, Name: `subnet-db-${region}-b` },
        }),
    ];

    // Security Groups
    const appSg = new SecurityGroup(this, 'AppSg', {
      name: `app-sg-${region}`,
      vpcId: this.vpc.id,
      description: 'SG for application servers',
      tags,
    });

    this.dbSg = new SecurityGroup(this, 'DbSg', {
      name: `db-sg-${region}`,
      vpcId: this.vpc.id,
      description: 'SG for RDS database',
      ingress: [{
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [appSg.id], // Only allow traffic from the app security group
          description: 'Allow PostgreSQL access from App SG',
      }],
      tags,
    });

    // Network ACLs for stateless, fine-grained traffic control
    const dbNacl = new NetworkAcl(this, 'DbNacl', {
      vpcId: this.vpc.id,
      subnetIds: this.dbSubnets.map(s => s.id),
      tags: { ...tags, Name: `nacl-db-${region}` },
    });

    new NetworkAclRule(this, 'DbNaclIngressRule', {
      networkAclId: dbNacl.id,
      ruleNumber: 100,
      egress: false,
      protocol: '6', // TCP
      ruleAction: 'allow',
      cidrBlock: privateSubnet.cidrBlock,
      fromPort: 5432,
      toPort: 5432,
    });

    new NetworkAclRule(this, 'DbNaclEgressRule', {
      networkAclId: dbNacl.id,
      ruleNumber: 100,
      egress: true,
      protocol: '6', // TCP
      ruleAction: 'allow',
      cidrBlock: privateSubnet.cidrBlock,
      fromPort: 1024,
      toPort: 65535, // Ephemeral ports
    });

}
}

export interface LoggingConstructProps {
readonly tags: { [key: string]: string };
}

export class LoggingConstruct extends Construct {
public readonly centralLogBucket: S3Bucket;

constructor(scope: Construct, id: string, props: LoggingConstructProps) {
super(scope, id);

    const accountId = new DataAwsAccountId(this, 'CurrentAccount');

    this.centralLogBucket = new S3Bucket(this, 'CentralLogBucket', {
      bucket: `central-logs-${accountId.accountId}-${Fn.randomid({ byteLength: 4 })}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: { applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
      },
      tags: props.tags,
    });

    new S3BucketPublicAccessBlock(this, 'LogBucketPublicAccessBlock', {
      bucket: this.centralLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Policy to allow AWS services (like VPC Flow Logs) to write to this bucket
    const bucketPolicyDoc = new DataAwsIamPolicyDocument(this, 'LogBucketPolicyDoc', {
      statement: [
        {
          effect: 'Allow',
          principals: [{ type: 'Service', identifiers: ['delivery.logs.amazonaws.com'] }],
          actions: ['s3:PutObject'],
          resources: [`${this.centralLogBucket.arn}/*`],
          condition: [{
            test: 'StringEquals',
            variable: 'aws:SourceAccount',
            values: [accountId.accountId],
          }],
        },
        {
            effect: 'Allow',
            principals: [{ type: 'Service', identifiers: ['delivery.logs.amazonaws.com'] }],
            actions: ['s3:GetBucketAcl'],
            resources: [this.centralLogBucket.arn],
            condition: [{
              test: 'StringEquals',
              variable: 'aws:SourceAccount',
              values: [accountId.accountId],
            }],
        }
      ],
    });

    new S3BucketPolicy(this, 'LogBucketPolicy', {
      bucket: this.centralLogBucket.id,
      policy: bucketPolicyDoc.json,
    });

    // Lifecycle rule to transition old logs to cheaper storage and eventually delete them
    new S3BucketLifecycleConfigurationA(this, 'LogBucketLifecycle', {
      bucket: this.centralLogBucket.id,
      rule: [{
        id: 'log-retention-policy',
        status: 'Enabled',
        transition: [
          { days: 90, storageClass: 'STANDARD_IA' },
          { days: 365, storageClass: 'GLACIER_IR' },
        ],
        expiration: {
          days: 2555, // Approx 7 years
        },
        noncurrentVersionExpiration: {
          noncurrentDays: 30,
        },
      }],
    });

}
}

export interface SecurityConstructProps {
readonly tags: { [key: string]: string };
}

export class SecurityConstruct extends Construct {
public readonly dbSecret: SecretsmanagerSecret;
public readonly appRole: IamRole;

constructor(scope: Construct, id: string, props: SecurityConstructProps) {
super(scope, id);

    // Create a secret to store the database password
    this.dbSecret = new SecretsmanagerSecret(this, 'DbPasswordSecret', {
      namePrefix: 'webapp/db-password',
      description: 'Password for the RDS database',
      tags: props.tags,
    });

    // Generate and store a random password in the secret
    new SecretsmanagerSecretVersion(this, 'DbPasswordVersion', {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: Fn.randomstring({ length: 16, special: true }),
      }),
    });

    // Create a least-privilege IAM Role for application EC2 instances
    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, 'AppAssumeRolePolicy', {
      statement: [{
        actions: ['sts:AssumeRole'],
        principals: [{
          type: 'Service',
          identifiers: ['ec2.amazonaws.com'],
        }],
      }],
    });

    this.appRole = new IamRole(this, 'AppInstanceRole', {
      name: 'ApplicationInstanceRole',
      assumeRolePolicy: assumeRolePolicy.json,
      description: 'IAM Role for application instances with least privilege',
      tags: props.tags,
    });
    // Note: In a real application, you would attach a custom IAM policy here
    // granting specific, minimal permissions needed by the app.

}
}
