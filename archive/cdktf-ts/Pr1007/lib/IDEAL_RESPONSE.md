import { App, S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { ResourceNamer } from './utils';
import { NetworkingModule } from './networking-module';
import { DatabaseModule } from './database-module';
import { ComputeModule } from './compute-module';

// --- Configuration ---
const environment = 'prod'; // Change to 'dev', 'staging', etc., as needed.
const awsRegion = 'us-east-1';

const commonTags = {
Project: 'EnterpriseWebApp',
Environment: environment,
ManagedBy: 'CDKTF',
Owner: 'SRE Team',
};

/\*\*

- @class BackendStack
- @description Provisions the S3 bucket and DynamoDB table for Terraform's remote state.
- This should be deployed FIRST and SEPARATELY.
  \*/
  class BackendStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      new AwsProvider(this, 'AWS', { region: awsRegion });

      const namer = new ResourceNamer(environment);

      const stateBucket = new S3Bucket(this, 'TerraformStateBucket', {
        bucket: namer.name('tfstate', 'main-bucket'),
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
          },
        },
        tags: commonTags,
      });

      const lockTable = new DynamodbTable(this, 'TerraformLockTable', {
        name: namer.name('tflock', 'main-table'),
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'LockID',
        attribute: [{ name: 'LockID', type: 'S' }],
        tags: commonTags,
      });

      new TerraformOutput(this, 'state_bucket_name', { value: stateBucket.bucket });
      new TerraformOutput(this, 'lock_table_name', { value: lockTable.name });

  }
  }

/\*\*

- @class EnterpriseStack
- @description The main stack for the application infrastructure, using the remote backend.
  \*/
  class EnterpriseStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      const namer = new ResourceNamer(environment);

      // --- REMOTE BACKEND CONFIGURATION ---
      // The bucket and dynamodbTable values must be updated with the output
      // from the initial deployment of the BackendStack.
      new S3Backend(this, {
        bucket: 'prod-tfstate-main-bucket', // <-- REPLACE WITH OUTPUT
        key: `enterprise-app/${environment}.tfstate`,
        region: awsRegion,
        dynamodbTable: 'prod-tflock-main-table', // <-- REPLACE WITH OUTPUT
        encrypt: true,
      });

      new AwsProvider(this, 'AWS', { region: awsRegion });

      // --- Instantiate Modules ---
      const networking = new NetworkingModule(this, 'Networking', {
        environment,
        tags: commonTags,
        namer,
        vpcCidr: '10.0.0.0/16',
      });

      const database = new DatabaseModule(this, 'Database', {
        environment,
        tags: commonTags,
        namer,
        privateSubnets: networking.privateSubnets,
        instanceClass: 'db.t3.small',
      });

      const compute = new ComputeModule(this, 'Compute', {
          environment,
          tags: commonTags,
          namer,
          instanceType: 't3.micro',
          amiId: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 AMI in us-east-1
          subnet: networking.publicSubnets[0], // Deploying in a public subnet for this example
      });

      // --- Outputs ---
      new TerraformOutput(this, 'db_endpoint', {
        value: database.dbInstance.endpoint,
        description: 'RDS database endpoint',
      });
      new TerraformOutput(this, 'instance_public_ip', {
          value: compute.instance.publicIp,
          description: 'Public IP of the EC2 instance',
      });

  }
  }

const app = new App();

// Two-phase deployment:
// 1. Deploy BackendStack: `cdktf deploy 'backend-stack'`
// 2. Update S3Backend config in EnterpriseStack with outputs.
// 3. Deploy EnterpriseStack: `cdktf deploy 'enterprise-stack'`
new BackendStack(app, 'backend-stack');
new EnterpriseStack(app, 'enterprise-stack');

app.synth();

// compute-module

import { Construct } from 'constructs';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { BaseModuleProps } from './utils';

/\*\*

- @interface ComputeModuleProps
- @description Configuration properties for the ComputeModule.
  \*/
  export interface ComputeModuleProps extends BaseModuleProps {
  readonly instanceType: string;
  readonly amiId: string;
  readonly subnet: Subnet; // For a single instance; an ASG would take a list of subnets.
  }

/\*\*

- @class ComputeModule
- @description A reusable construct for creating compute resources (EC2 instances via Launch Templates).
  \*/
  export class ComputeModule extends Construct {
  public readonly instance: Instance;

constructor(scope: Construct, id:string, props: ComputeModuleProps) {
super(scope, id);

    const { tags, namer, instanceType, amiId, subnet } = props;

    const launchTemplate = new LaunchTemplate(this, 'AppLaunchTemplate', {
      name: namer.name('lt', 'main-app'),
      imageId: amiId,
      instanceType: instanceType,
      tags,
    });

    // This example creates a single instance for simplicity.
    // In a production setup, you would create an Auto Scaling Group here
    // that references the launch template.
    this.instance = new Instance(this, 'AppInstance', {
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      subnetId: subnet.id,
      tags: { ...tags, Name: namer.name('ec2', 'app-server-01') },
    });

}
}

// database-module

import { Construct } from 'constructs';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Fn } from 'cdktf';
import { BaseModuleProps } from './utils';

/\*\*

- @interface DatabaseModuleProps
- @description Configuration properties for the DatabaseModule.
  \*/
  export interface DatabaseModuleProps extends BaseModuleProps {
  readonly privateSubnets: Subnet[];
  readonly instanceClass: string;
  }

/\*\*

- @class DatabaseModule
- @description A reusable construct for creating an RDS PostgreSQL database.
  \*/
  export class DatabaseModule extends Construct {
  public readonly dbInstance: DbInstance;

constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
super(scope, id);

    const { tags, namer, privateSubnets, instanceClass } = props;

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: namer.name('db-subnet-group', 'main'),
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags,
    });

    this.dbInstance = new DbInstance(this, 'PostgresDb', {
      engine: 'postgres',
      engineVersion: '14.5',
      instanceClass,
      allocatedStorage: 20,
      identifier: namer.name('db', 'main-app'),
      dbName: 'main_app_db',
      username: 'admin',
      // IMPORTANT: In a real-world scenario, this password should be managed by AWS Secrets Manager.
      password: `db-password-${Fn.randomuuid()}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: props.environment === 'prod', // Example of environment-specific configuration
      skipFinalSnapshot: props.environment !== 'prod',
      deletionProtection: props.environment === 'prod',
      tags,
      // --- LIFECYCLE POLICY ---
      // Prevent accidental deletion of this stateful, critical resource.
      lifecycle: {
        preventDestroy: true,
      },
    });

}
}

// networking-module

import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { BaseModuleProps } from './utils';

/\*\*

- @interface NetworkingModuleProps
- @description Configuration properties for the NetworkingModule.
  \*/
  export interface NetworkingModuleProps extends BaseModuleProps {
  readonly vpcCidr: string;
  }

/\*\*

- @class NetworkingModule
- @description A reusable construct for creating the core network infrastructure (VPC, Subnets).
  \*/
  export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];

constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
super(scope, id);

    const { tags, namer, vpcCidr } = props;

    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: namer.name('vpc', 'main') },
      // --- LIFECYCLE POLICY ---
      // Prevent accidental deletion of this critical resource.
      lifecycle: {
        preventDestroy: true,
      },
    });

    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: namer.name('igw', 'main') },
    });

    const azs = new DataAwsAvailabilityZones(this, 'AZs', { state: 'available' });

    // For simplicity, this example creates one public and one private subnet.
    // A production setup would loop through available AZs.
    this.publicSubnets = [
      new Subnet(this, 'PublicSubnet01', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: azs.names.get(0),
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: namer.name('subnet', 'public-1') },
      }),
    ];

    this.privateSubnets = [
      new Subnet(this, 'PrivateSubnet01', {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.101.0/24',
        availabilityZone: azs.names.get(0),
        tags: { ...tags, Name: namer.name('subnet', 'private-1') },
      }),
    ];
    // Note: Route tables, NAT Gateways, etc., are omitted for brevity but would be included here.

}
}
