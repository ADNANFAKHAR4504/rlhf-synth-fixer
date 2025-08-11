// /**
//  * tap-stack.ts
//  *
//  * This module defines the TapStack class, the main Pulumi ComponentResource for
//  * the TAP (Test Automation Platform) project.
//  *
//  * It orchestrates the instantiation of other resource-specific components
//  * and manages environment-specific configurations.
//  */
// import * as pulumi from '@pulumi/pulumi';
// import { ResourceOptions } from '@pulumi/pulumi';
// // import * as aws from '@pulumi/aws'; // Removed as it's only used in example code

// // Import your nested stacks here. For example:
// // import { DynamoDBStack } from "./dynamodb-stack";

// /**
//  * TapStackArgs defines the input arguments for the TapStack Pulumi component.
//  */
// export interface TapStackArgs {
//   /**
//    * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
//    * Defaults to 'dev' if not provided.
//    */
//   environmentSuffix?: string;

//   /**
//    * Optional default tags to apply to resources.
//    */
//   tags?: pulumi.Input<{ [key: string]: string }>;
// }

// /**
//  * Represents the main Pulumi component resource for the TAP project.
//  *
//  * This component orchestrates the instantiation of other resource-specific components
//  * and manages the environment suffix used for naming and configuration.
//  *
//  * Note:
//  * - DO NOT create resources directly here unless they are truly global.
//  * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
//  */
// export class TapStack extends pulumi.ComponentResource {
//   // Example of a public property for a nested resource's output.
//   // public readonly table: pulumi.Output<string>;

//   /**
//    * Creates a new TapStack component.
//    * @param name The logical name of this Pulumi component.
//    * @param args Configuration arguments including environment suffix and tags.
//    * @param opts Pulumi options.
//    */
//   constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
//     super('tap:stack:TapStack', name, args, opts);

//     // The following variables are commented out as they are only used in example code.
//     // To use them, uncomment the lines below and the corresponding example code.
//     // const environmentSuffix = args.environmentSuffix || 'dev';
//     // const tags = args.tags || {};

//     // --- Instantiate Nested Components Here ---
//     // This is where you would create instances of your other component resources,
//     // passing them the necessary configuration.

//     // Example of instantiating a DynamoDBStack component:
//     // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
//     //   environmentSuffix: environmentSuffix,
//     //   tags: tags,
//     // }, { parent: this });

//     // Example of creating a resource directly (for truly global resources only):
//     // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
//     //   tags: tags,
//     // }, { parent: this });

//     // --- Expose Outputs from Nested Components ---
//     // Make outputs from your nested components available as outputs of this main stack.
//     // this.table = dynamoDBStack.table;

//     // Register the outputs of this component.
//     this.registerOutputs({
//       // table: this.table,
//     });
//   }
// }

// import { Construct } from 'constructs';
// import { TerraformStack, TerraformOutput } from 'cdktf';
// import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
// import { Vpc } from '@cdktf/provider-aws/lib/vpc';
// import { Subnet } from '@cdktf/provider-aws/lib/subnet';
// import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
// import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
// import { Route } from '@cdktf/provider-aws/lib/route';
// import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
// import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
// import { Eip } from '@cdktf/provider-aws/lib/eip';
// import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
// import { Instance } from '@cdktf/provider-aws/lib/instance';
// import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
// import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
// import { Lb } from '@cdktf/provider-aws/lib/lb';
// import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
// import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
// import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
// import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
// import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
// import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
// import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
// import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
// import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
// import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
// import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// export interface TapStackConfig {
//   region: string;
//   environment: string;
// }

// export class TapStack extends TerraformStack {
//   constructor(scope: Construct, id: string, config: TapStackConfig) {
//     super(scope, id);

//     const { region, environment } = config;
//     const prefix = `${environment}-`;

//     // AWS Provider
//     new AwsProvider(this, 'aws', {
//       region: region,
//     });

//     // Get availability zones
//     const azs = new DataAwsAvailabilityZones(this, 'azs', {
//       state: 'available',
//     });

//     // Get latest Amazon Linux 2 AMI
//     const ami = new DataAwsAmi(this, 'amazon-linux', {
//       mostRecent: true,
//       owners: ['amazon'],
//       filter: [
//         {
//           name: 'name',
//           values: ['amzn2-ami-hvm-*-x86_64-gp2'],
//         },
//         {
//           name: 'virtualization-type',
//           values: ['hvm'],
//         },
//       ],
//     });

//     // VPC
//     const vpc = new Vpc(this, 'vpc', {
//       cidrBlock: '10.0.0.0/16',
//       enableDnsHostnames: true,
//       enableDnsSupport: true,
//       tags: {
//         Name: `${prefix}vpc-${region}`,
//         Environment: environment,
//       },
//     });

//     // Internet Gateway
//     const igw = new InternetGateway(this, 'igw', {
//       vpcId: vpc.id,
//       tags: {
//         Name: `${prefix}igw-${region}`,
//         Environment: environment,
//       },
//     });

//     // Public Subnets
//     const publicSubnets: Subnet[] = [];
//     const privateSubnets: Subnet[] = [];

//     for (let i = 0; i < 2; i++) {
//       // Public Subnet
//       const publicSubnet = new Subnet(this, `public-subnet-${i + 1}`, {
//         vpcId: vpc.id,
//         cidrBlock: `10.0.${i + 1}.0/24`,
//         availabilityZone: `\${${azs.fqn}.names[${i}]}`,
//         mapPublicIpOnLaunch: true,
//         tags: {
//           Name: `${prefix}public-subnet-${i + 1}-${region}`,
//           Environment: environment,
//           Type: 'Public',
//         },
//       });
//       publicSubnets.push(publicSubnet);

//       // Private Subnet
//       const privateSubnet = new Subnet(this, `private-subnet-${i + 1}`, {
//         vpcId: vpc.id,
//         cidrBlock: `10.0.${i + 10}.0/24`,
//         availabilityZone: `\${${azs.fqn}.names[${i}]}`,
//         tags: {
//           Name: `${prefix}private-subnet-${i + 1}-${region}`,
//           Environment: environment,
//           Type: 'Private',
//         },
//       });
//       privateSubnets.push(privateSubnet);
//     }

//     // Public Route Table
//     const publicRouteTable = new RouteTable(this, 'public-rt', {
//       vpcId: vpc.id,
//       tags: {
//         Name: `${prefix}public-rt-${region}`,
//         Environment: environment,
//       },
//     });

//     // Public Route to Internet Gateway
//     new Route(this, 'public-route', {
//       routeTableId: publicRouteTable.id,
//       destinationCidrBlock: '0.0.0.0/0',
//       gatewayId: igw.id,
//     });

//     // Associate public subnets with public route table
//     publicSubnets.forEach((subnet, index) => {
//       new RouteTableAssociation(this, `public-rta-${index + 1}`, {
//         subnetId: subnet.id,
//         routeTableId: publicRouteTable.id,
//       });
//     });

//     // NAT Gateways and Private Route Tables
//     const natGateways: NatGateway[] = [];
//     privateSubnets.forEach((subnet, index) => {
//       // Elastic IP for NAT Gateway
//       const eip = new Eip(this, `nat-eip-${index + 1}`, {
//         domain: 'vpc',
//         tags: {
//           Name: `${prefix}nat-eip-${index + 1}-${region}`,
//           Environment: environment,
//         },
//       });

//       // NAT Gateway
//       const natGateway = new NatGateway(this, `nat-gw-${index + 1}`, {
//         allocationId: eip.id,
//         subnetId: publicSubnets[index].id,
//         tags: {
//           Name: `${prefix}nat-gw-${index + 1}-${region}`,
//           Environment: environment,
//         },
//       });
//       natGateways.push(natGateway);

//       // Private Route Table
//       const privateRouteTable = new RouteTable(this, `private-rt-${index + 1}`, {
//         vpcId: vpc.id,
//         tags: {
//           Name: `${prefix}private-rt-${index + 1}-${region}`,
//           Environment: environment,
//         },
//       });

//       // Private Route to NAT Gateway
//       new Route(this, `private-route-${index + 1}`, {
//         routeTableId: privateRouteTable.id,
//         destinationCidrBlock: '0.0.0.0/0',
//         natGatewayId: natGateway.id,
//       });

//       // Associate private subnet with private route table
//       new RouteTableAssociation(this, `private-rta-${index + 1}`, {
//         subnetId: subnet.id,
//         routeTableId: privateRouteTable.id,
//       });
//     });

//     // Security Groups
//     const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
//       name: `${prefix}alb-sg-${region}`,
//       description: 'Security group for Application Load Balancer',
//       vpcId: vpc.id,
//       ingress: [
//         {
//           fromPort: 80,
//           toPort: 80,
//           protocol: 'tcp',
//           cidrBlocks: ['0.0.0.0/0'],
//           description: 'HTTP',
//         },
//         {
//           fromPort: 443,
//           toPort: 443,
//           protocol: 'tcp',
//           cidrBlocks: ['0.0.0.0/0'],
//           description: 'HTTPS',
//         },
//       ],
//       egress: [
//         {
//           fromPort: 0,
//           toPort: 0,
//           protocol: '-1',
//           cidrBlocks: ['0.0.0.0/0'],
//           description: 'All outbound traffic',
//         },
//       ],
//       tags: {
//         Name: `${prefix}alb-sg-${region}`,
//         Environment: environment,
//       },
//     });

//     const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
//       name: `${prefix}ec2-sg-${region}`,
//       description: 'Security group for EC2 instances',
//       vpcId: vpc.id,
//       ingress: [
//         {
//           fromPort: 80,
//           toPort: 80,
//           protocol: 'tcp',
//           securityGroups: [albSecurityGroup.id],
//           description: 'HTTP from ALB',
//         },
//         {
//           fromPort: 22,
//           toPort: 22,
//           protocol: 'tcp',
//           cidrBlocks: ['0.0.0.0/0'], // In production, restrict this to your IP
//           description: 'SSH',
//         },
//       ],
//       egress: [
//         {
//           fromPort: 0,
//           toPort: 0,
//           protocol: '-1',
//           cidrBlocks: ['0.0.0.0/0'],
//           description: 'All outbound traffic',
//         },
//       ],
//       tags: {
//         Name: `${prefix}ec2-sg-${region}`,
//         Environment: environment,
//       },
//     });

//     const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
//       name: `${prefix}rds-sg-${region}`,
//       description: 'Security group for RDS database',
//       vpcId: vpc.id,
//       ingress: [
//         {
//           fromPort: 3306,
//           toPort: 3306,
//           protocol: 'tcp',
//           securityGroups: [ec2SecurityGroup.id],
//           description: 'MySQL from EC2',
//         },
//       ],
//       egress: [
//         {
//           fromPort: 0,
//           toPort: 0,
//           protocol: '-1',
//           cidrBlocks: ['0.0.0.0/0'],
//           description: 'All outbound traffic',
//         },
//       ],
//       tags: {
//         Name: `${prefix}rds-sg-${region}`,
//         Environment: environment,
//       },
//     });

//     // IAM Role for EC2
//     const ec2Role = new IamRole(this, 'ec2-role', {
//       name: `${prefix}ec2-role-${region}`,
//       assumeRolePolicy: JSON.stringify({
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Action: 'sts:AssumeRole',
//             Effect: 'Allow',
//             Principal: {
//               Service: 'ec2.amazonaws.com',
//             },
//           },
//         ],
//       }),
//       tags: {
//         Name: `${prefix}ec2-role-${region}`,
//         Environment: environment,
//       },
//     });

//     // Attach CloudWatch Agent policy to EC2 role
//     new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy', {
//       role: ec2Role.name,
//       policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
//     });

//     // Attach SSM policy for EC2 role
//     new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
//       role: ec2Role.name,
//       policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
//     });

//     // EC2 Instance Profile
//     const ec2InstanceProfile = new IamInstanceProfile(this, 'ec2-instance-profile', {
//       name: `${prefix}ec2-instance-profile-${region}`,
//       role: ec2Role.name,
//     });

//     // Database Credentials Secret
//     const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
//       name: `${prefix}db-credentials-${region}`,
//       description: 'Database credentials for RDS instance',
//       tags: {
//         Name: `${prefix}db-credentials-${region}`,
//         Environment: environment,
//       },
//     });

//     new SecretsmanagerSecretVersion(this, 'db-secret-version', {
//       secretId: dbSecret.id,
//       secretString: JSON.stringify({
//         username: 'admin',
//         password: 'changeme123!', // In production, use a secure password generator
//       }),
//     });

//     // CloudWatch Log Groups
//     new CloudwatchLogGroup(this, 'ec2-log-group', {
//       name: `/aws/ec2/${prefix}application-${region}`,
//       retentionInDays: 7,
//       tags: {
//         Name: `${prefix}ec2-logs-${region}`,
//         Environment: environment,
//       },
//     });

//     new CloudwatchLogGroup(this, 'rds-log-group', {
//       name: `/aws/rds/instance/${prefix}database-${region}/error`,
//       retentionInDays: 7,
//       tags: {
//         Name: `${prefix}rds-logs-${region}`,
//         Environment: environment,
//       },
//     });

//     // RDS Subnet Group
//     const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
//       name: `${prefix}db-subnet-group-${region}`,
//       subnetIds: privateSubnets.map(subnet => subnet.id),
//       tags: {
//         Name: `${prefix}db-subnet-group-${region}`,
//         Environment: environment,
//       },
//     });

//     // RDS Instance
//     const rdsInstance = new DbInstance(this, 'rds-instance', {
//       identifier: `${prefix}database-${region}`,
//       engine: 'mysql',
//       engineVersion: '8.0',
//       instanceClass: 'db.t3.micro',
//       allocatedStorage: 20,
//       storageType: 'gp2',
//       dbName: 'appdb',
//       username: 'admin',
//       // manageUserPassword: true,
//       // userPasswordSecretKmsKeyId: 'alias/aws/secretsmanager',
//       dbSubnetGroupName: dbSubnetGroup.name,
//       vpcSecurityGroupIds: [rdsSecurityGroup.id],
//       backupRetentionPeriod: 7,
//       backupWindow: '03:00-04:00',
//       maintenanceWindow: 'sun:04:00-sun:05:00',
//       storageEncrypted: true,
//       monitoringInterval: 60,
//       monitoringRoleArn: `arn:aws:iam::\${data.aws_caller_identity.current.account_id}:role/rds-monitoring-role`,
//       enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
//       skipFinalSnapshot: true, // Set to false in production
//       tags: {
//         Name: `${prefix}database-${region}`,
//         Environment: environment,
//       },
//     });

//     // EC2 Instances
//     const instances: Instance[] = [];
//     publicSubnets.forEach((subnet, index) => {
//       const instance = new Instance(this, `ec2-instance-${index + 1}`, {
//         ami: ami.id,
//         instanceType: 't3.micro',
//         subnetId: subnet.id,
//         vpcSecurityGroupIds: [ec2SecurityGroup.id],
//         iamInstanceProfile: ec2InstanceProfile.name,
//         userData: Buffer.from(`#!/bin/bash
// yum update -y
// yum install -y httpd
// systemctl start httpd
// systemctl enable httpd
// echo "<h1>Hello from ${region} - Instance ${index + 1}</h1>" > /var/www/html/index.html
// # Install CloudWatch agent
// wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
// rpm -U ./amazon-cloudwatch-agent.rpm
//         `).toString('base64'),
//         tags: {
//           Name: `${prefix}app-server-${index + 1}-${region}`,
//           Environment: environment,
//         },
//       });
//       instances.push(instance);
//     });

//     // Application Load Balancer
//     const alb = new Lb(this, 'alb', {
//       name: `${prefix}alb-${region}`,
//       internal: false,
//       loadBalancerType: 'application',
//       securityGroups: [albSecurityGroup.id],
//       subnets: publicSubnets.map(subnet => subnet.id),
//       enableDeletionProtection: false, // Set to true in production
//       tags: {
//         Name: `${prefix}alb-${region}`,
//         Environment: environment,
//       },
//     });

//     // Target Group
//     const targetGroup = new LbTargetGroup(this, 'tg', {
//       name: `${prefix}tg-${region}`,
//       port: 80,
//       protocol: 'HTTP',
//       vpcId: vpc.id,
//       healthCheck: {
//         enabled: true,
//         healthyThreshold: 2,
//         interval: 30,
//         matcher: '200',
//         path: '/',
//         port: 'traffic-port',
//         protocol: 'HTTP',
//         timeout: 5,
//         unhealthyThreshold: 2,
//       },
//       tags: {
//         Name: `${prefix}tg-${region}`,
//         Environment: environment,
//       },
//     });

//     // Target Group Attachments
//     instances.forEach((instance, index) => {
//       new LbTargetGroupAttachment(this, `tg-attachment-${index + 1}`, {
//         targetGroupArn: targetGroup.arn,
//         targetId: instance.id,
//         port: 80,
//       });
//     });

//     // Load Balancer Listener
//     new LbListener(this, 'alb-listener', {
//       loadBalancerArn: alb.arn,
//       port: 80,
//       protocol: 'HTTP',
//       defaultAction: [
//         {
//           type: 'forward',
//           targetGroupArn: targetGroup.arn,
//         },
//       ],
//     });

//     // Outputs
//     new TerraformOutput(this, 'vpc-id', {
//       value: vpc.id,
//       description: 'VPC ID',
//     });

//     new TerraformOutput(this, 'alb-dns-name', {
//       value: alb.dnsName,
//       description: 'Application Load Balancer DNS name',
//     });

//     new TerraformOutput(this, 'rds-endpoint', {
//       value: rdsInstance.endpoint,
//       description: 'RDS instance endpoint',
//     });

//     new TerraformOutput(this, 'region', {
//       value: region,
//       description: 'AWS Region',
//     });
//   }
// }

/**
 * tap-stack.ts
 *
 * Unified TAP Stack Definition
 *
 * This merges the original Pulumi-style TapStack skeleton with the
 * full AWS infrastructure provisioning logic using CDKTF.
 *
 * It creates a highly available VPC, subnets, routing, NAT gateways,
 * security groups, EC2 instances, RDS, ALB, IAM roles, secrets,
 * CloudWatch logging, and outputs.
 *
 * Notes:
 * - Uses AWS provider via CDKTF
 * - Designed to be reusable across environments and regions
 */

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

/**
 * TapStackArgs defines the input arguments for the TapStack CDKTF component.
 */
export interface TapStackArgs {
  /**
   * AWS region for deployment
   */
  region: string;

  /**
   * Environment name (e.g., dev, prod)
   */
  environment: string;
  tags?: { [key: string]: string };
}

/**
 * Represents the main TAP stack.
 *
 * This class provisions:
 * - VPC with public/private subnets across two AZs
 * - NAT gateways & routing
 * - Security groups for ALB, EC2, RDS
 * - IAM roles & instance profiles
 * - Secrets in Secrets Manager
 * - CloudWatch log groups
 * - EC2 instances behind an ALB
 * - RDS MySQL instance in private subnets
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, args: TapStackArgs) {
    super(scope, id);

    const { region, environment } = args;
    const prefix = `${environment}-`;

    // AWS Provider
    new AwsProvider(this, 'aws', { region });

    // Availability Zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: `${prefix}vpc-${region}`, Environment: environment },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `${prefix}igw-${region}`, Environment: environment },
    });

    // Public and Private Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${prefix}public-subnet-${i + 1}-${region}`,
          Environment: environment,
          Type: 'Public',
        },
      });
      publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `private-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `${prefix}private-subnet-${i + 1}-${region}`,
          Environment: environment,
          Type: 'Private',
        },
      });
      privateSubnets.push(privateSubnet);
    }

    // Public Route Table & Route
    const publicRT = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: { Name: `${prefix}public-rt-${region}`, Environment: environment },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRT.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, idx) => {
      new RouteTableAssociation(this, `public-rta-${idx + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRT.id,
      });
    });

    // NAT Gateways, Private RTs, Routes
    privateSubnets.forEach((subnet, idx) => {
      const eip = new Eip(this, `nat-eip-${idx + 1}`, {
        domain: 'vpc',
        tags: {
          Name: `${prefix}nat-eip-${idx + 1}-${region}`,
          Environment: environment,
        },
      });

      const natGw = new NatGateway(this, `nat-gw-${idx + 1}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[idx].id,
        tags: {
          Name: `${prefix}nat-gw-${idx + 1}-${region}`,
          Environment: environment,
        },
      });

      const privateRT = new RouteTable(this, `private-rt-${idx + 1}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${prefix}private-rt-${idx + 1}-${region}`,
          Environment: environment,
        },
      });

      new Route(this, `private-route-${idx + 1}`, {
        routeTableId: privateRT.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      new RouteTableAssociation(this, `private-rta-${idx + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRT.id,
      });
    });

    // Security Groups
    const albSG = new SecurityGroup(this, 'alb-sg', {
      name: `${prefix}alb-sg-${region}`,
      description: 'Security group for ALB',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { Name: `${prefix}alb-sg-${region}`, Environment: environment },
    });

    const ec2SG = new SecurityGroup(this, 'ec2-sg', {
      name: `${prefix}ec2-sg-${region}`,
      description: 'Security group for EC2 instances',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSG.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { Name: `${prefix}ec2-sg-${region}`, Environment: environment },
    });

    const rdsSG = new SecurityGroup(this, 'rds-sg', {
      name: `${prefix}rds-sg-${region}`,
      description: 'Security group for RDS',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [ec2SG.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { Name: `${prefix}rds-sg-${region}`, Environment: environment },
    });

    // IAM Role, Instance Profile
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `${prefix}ec2-role-${region}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    new IamRolePolicyAttachment(this, 'ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const ec2Profile = new IamInstanceProfile(this, 'ec2-profile', {
      name: `${prefix}ec2-instance-profile-${region}`,
      role: ec2Role.name,
    });

    // Secrets Manager
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `${prefix}db-credentials-${region}`,
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-ver', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'admin',
        password: 'changeme123!',
      }),
    });

    // CloudWatch Logs
    new CloudwatchLogGroup(this, 'ec2-log', {
      name: `/aws/ec2/${prefix}app-${region}`,
      retentionInDays: 7,
    });
    new CloudwatchLogGroup(this, 'rds-log', {
      name: `/aws/rds/${prefix}db-${region}/error`,
      retentionInDays: 7,
    });

    // RDS
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${prefix}db-subnet-group-${region}`,
      subnetIds: privateSubnets.map(s => s.id),
    });

    const rds = new DbInstance(this, 'rds', {
      identifier: `${prefix}database-${region}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'admin',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSG.id],
      skipFinalSnapshot: true,
    });

    // EC2 Instances
    const instances = publicSubnets.map((subnet, idx) => {
      return new Instance(this, `ec2-${idx + 1}`, {
        ami: ami.id,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [ec2SG.id],
        iamInstanceProfile: ec2Profile.name,
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${region} - Instance ${idx + 1}</h1>" > /var/www/html/index.html`
        ).toString('base64'),
      });
    });

    // ALB + Target Group
    const alb = new Lb(this, 'alb', {
      name: `${prefix}alb-${region}`,
      loadBalancerType: 'application',
      securityGroups: [albSG.id],
      subnets: publicSubnets.map(s => s.id),
    });

    const tg = new LbTargetGroup(this, 'tg', {
      name: `${prefix}tg-${region}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
    });

    instances.forEach((instance, idx) => {
      new LbTargetGroupAttachment(this, `tg-attach-${idx + 1}`, {
        targetGroupArn: tg.arn,
        targetId: instance.id,
        port: 80,
      });
    });

    new LbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: tg.arn }],
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', { value: vpc.id });
    new TerraformOutput(this, 'alb-dns', { value: alb.dnsName });
    new TerraformOutput(this, 'rds-endpoint', { value: rds.endpoint });
  }
}
