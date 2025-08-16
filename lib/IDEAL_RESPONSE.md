import { App, S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning-a';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

/\*\*

- @interface RegionalInfraProps
- @description Defines properties for the regional infrastructure construct.
- @property {{ [key: string]: string }} tags - Common tags for all resources.
  \*/
  interface RegionalInfraProps {
  tags: { [key: string]: string };
  }

/\*\*

- @class RegionalInfraConstruct
- @description A reusable construct that encapsulates all resources for a single region.
- This provides modularity within the monolithic file structure.
  \*/
  class RegionalInfraConstruct extends Construct {
  constructor(scope: Construct, id: string, props: RegionalInfraProps) {
  super(scope, id);

      const { tags } = props;

      // --- Networking ---
      const vpc = new Vpc(this, 'Vpc', {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        tags: { ...tags, Name: 'production-webapp-vpc' },
      });

      new Subnet(this, 'Subnet1', {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        tags: { ...tags, Name: 'production-webapp-subnet-1' },
      });

      const subnet2 = new Subnet(this, 'Subnet2', {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        tags: { ...tags, Name: 'production-webapp-subnet-2' },
      });

      // --- S3 Bucket ---
      const dataBucket = new S3Bucket(this, 'DataBucket', {
        bucket: `production-webapp-data-${this.node.addr.substring(0, 8)}`,
        tags,
      });

      new S3BucketVersioningA(this, 'DataBucketVersioning', {
        bucket: dataBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // --- IAM Role & Policy (Least Privilege) ---
      const ec2Role = new IamRole(this, 'Ec2S3Role', {
        name: 'production-webapp-ec2-s3-role',
        assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'Ec2AssumeRolePolicy', {
          statement: [{
            actions: ['sts:AssumeRole'],
            principals: [{
              type: 'Service',
              identifiers: ['ec2.amazonaws.com'],
            }],
          }],
        }).json,
        tags,
      });

      const s3AccessPolicyDocument = new DataAwsIamPolicyDocument(this, 'S3AccessPolicyDoc', {
        statement: [
          {
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [`${dataBucket.arn}/*`], // Access to objects
          },
          {
            effect: 'Allow',
            actions: ['s3:ListBucket'],
            resources: [dataBucket.arn], // Access to the bucket itself
          },
        ],
      });

      const s3AccessPolicy = new IamPolicy(this, 'S3AccessPolicy', {
        name: 'production-webapp-s3-access-policy',
        policy: s3AccessPolicyDocument.json,
      });

      new IamRolePolicyAttachment(this, 'RolePolicyAttachment', {
        role: ec2Role.name,
        policyArn: s3AccessPolicy.arn,
      });

      const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
        name: 'production-webapp-instance-profile',
        role: ec2Role.name,
      });

      // --- Security Group ---
      const ec2Sg = new SecurityGroup(this, 'Ec2Sg', {
        name: 'production-webapp-ec2-sg',
        vpcId: vpc.id,
        description: 'Allow HTTP and SSH from a specific IP range',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['203.0.113.0/24'],
            description: 'Allow HTTP from trusted network',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['203.0.113.0/24'],
            description: 'Allow SSH from trusted network',
          },
        ],
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags,
      });

      // --- EC2 Instance ---
      new Instance(this, 'WebAppInstance', {
        ami: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 AMI for us-east-1
        instanceType: 't2.micro',
        subnetId: subnet2.id,
        vpcSecurityGroupIds: [ec2Sg.id],
        iamInstanceProfile: instanceProfile.name,
        tags: { ...tags, Name: 'production-webapp-server' },
      });

  }
  }

/\*\*

- @class BackendStack
- @description Provisions the S3 bucket and DynamoDB table for Terraform's remote state.
- This stack must be deployed FIRST and SEPARATELY.
  \*/
  class BackendStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      new AwsProvider(this, 'AWS', { region: 'us-east-1' });

      const stateBucket = new S3Bucket(this, 'TerraformStateBucket', {
        bucket: 'production-webapp-tfstate-bucket',
      });

      new S3BucketVersioningA(this, 'StateBucketVersioning', {
          bucket: stateBucket.id,
          versioningConfiguration: { status: 'Enabled' },
      });

      const lockTable = new DynamodbTable(this, 'TerraformLockTable', {
        name: 'production-webapp-tfstate-lock',
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'LockID',
        attribute: [{ name: 'LockID', type: 'S' }],
      });

      new TerraformOutput(this, 'state_bucket_name', { value: stateBucket.bucket });
      new TerraformOutput(this, 'lock_table_name', { value: lockTable.name });

  }
  }

/\*\*

- @class MainStack
- @description The main stack for the application infrastructure, configured to use the remote backend.
  \*/
  class MainStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      const commonTags = {
        Environment: 'Production',
        Application: 'WebApp',
        Owner: 'DevOps Team',
      };

      // --- REMOTE BACKEND CONFIGURATION ---
      // IMPORTANT: Deploy the 'backend-stack' first, then replace the placeholder
      // values below with the outputs from that deployment.
      new S3Backend(this, {
        bucket: 'production-webapp-tfstate-bucket', // <-- REPLACE WITH OUTPUT
        key: 'production/webapp.tfstate',
        region: 'us-east-1',
        dynamodbTable: 'production-webapp-tfstate-lock', // <-- REPLACE WITH OUTPUT
        encrypt: true,
      });

      new AwsProvider(this, 'AWS', { region: 'us-east-1' });

      // Instantiate the regional infrastructure
      new RegionalInfraConstruct(this, 'us-east-1-infra', { tags: commonTags });

  }
  }

const app = new App();

// --- DEPLOYMENT INSTRUCTIONS ---
// 1. Deploy the BackendStack first: `cdktf deploy 'backend-stack'`
// 2. Note the outputs for 'state_bucket_name' and 'lock_table_name'.
// 3. Update the S3Backend configuration in MainStack with the output values.
// 4. Deploy the MainStack: `cdktf deploy 'main-stack'`
new BackendStack(app, 'backend-stack');
new MainStack(app, 'main-stack');

app.synth();
