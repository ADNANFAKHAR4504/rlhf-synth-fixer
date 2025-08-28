import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// --- Environment Configuration ---
// An array defining the configuration for every environment.
// This approach ensures all environments are declared and managed together.
const allEnvironments = [
{
env: 'dev' as const,
vpcCidr: '10.10.0.0/16',
instanceType: 't3.micro',
dbInstanceClass: 'db.t3.micro',
tags: { Environment: 'Development', ManagedBy: 'CDKTF' },
},
{
env: 'staging' as const,
vpcCidr: '10.20.0.0/16',
instanceType: 't3.small',
dbInstanceClass: 'db.t3.small',
tags: { Environment: 'Staging', ManagedBy: 'CDKTF' },
},
{
env: 'prod' as const,
vpcCidr: '10.30.0.0/16',
instanceType: 't3.medium',
dbInstanceClass: 'db.t3.medium',
tags: { Environment: 'Production', ManagedBy: 'CDKTF' },
},
];

// --- All-In-One Multi-Environment Stack ---
// This stack is designed to create and manage resources for all environments
// within a single Terraform state file.
class MultiEnvironmentStack extends TerraformStack {
constructor(scope: Construct, id: string) {
super(scope, id);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    // --- Shared Data Sources ---
    // Fetch data once to be used by all environments in the loop.
    const callerIdentity = new DataAwsCallerIdentity(this, 'CallerIdentity');
    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    // --- Resource Creation Loop ---
    // Iterate through each environment configuration and create a full set of resources.
    allEnvironments.forEach(config => {
      // Basic input validation
      if (!config.vpcCidr.endsWith('/16')) {
        throw new Error(`VPC CIDR for ${config.env} must be a /16 prefix.`);
      }

      // Create a logical scope for each environment to keep resource names unique.
      const envScope = new Construct(this, `${config.env}-environment`);
      const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 4);

      // --- VPC ---
      const vpc = new Vpc(envScope, 'VPC', {
        cidrBlock: config.vpcCidr,
        tags: { ...config.tags, Name: `vpc-${config.env}` },
      });

      // --- Subnet ---
      const subnet = new Subnet(envScope, 'PublicSubnet', {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 0),
        tags: { ...config.tags, Name: `subnet-${config.env}` },
      });

      // --- EC2 Instance ---
      const instance = new Instance(envScope, 'WebServer', {
        ami: ami.id,
        instanceType: config.instanceType,
        subnetId: subnet.id,
        tags: { ...config.tags, Name: `server-${config.env}` },
      });

      // --- RDS Database ---
      const db = new DbInstance(envScope, 'Database', {
        instanceClass: config.dbInstanceClass,
        engine: 'postgres',
        allocatedStorage: 20,
        username: 'dbadmin',
        password: 'use-secrets-manager-in-real-projects',
        skipFinalSnapshot: true,
        tags: { ...config.tags, Name: `db-${config.env}` },
      });

      // --- S3 Bucket ---
      const bucket = new S3Bucket(envScope, 'DataBucket', {
        bucket: `app-data-${config.env}-${callerIdentity.accountId}-${uniqueSuffix}`.toLowerCase(),
        tags: { ...config.tags, Name: `bucket-${config.env}` },
      });

      // --- Environment-Specific Outputs ---
      // Outputs are suffixed with the environment name for clarity.
      new TerraformOutput(this, `VpcId-${config.env}`, { value: vpc.id });
      new TerraformOutput(this, `WebServerPublicIp-${config.env}`, { value: instance.publicIp });
      new TerraformOutput(this, `RdsEndpoint-${config.env}`, { value: db.endpoint });
      new TerraformOutput(this, `S3BucketName-${config.env}`, { value: bucket.bucket });
    });

}
}

// --- Main Application ---
const app = new App();
new MultiEnvironmentStack(app, 'multi-environment-stack');
app.synth();
