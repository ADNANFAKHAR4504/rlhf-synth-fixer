// tapstack
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Fn, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import {
  AlbModule,
  CloudwatchModule,
  Ec2Module,
  IamModule,
  RdsModule,
  Route53Module,
  VpcModule,
} from '../lib/module';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // NEW: Add a domain name property to the stack props
  domainName?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [
          {
            tags: {
              Project: 'TAP',
              Environment: environmentSuffix,
              ManagedBy: 'CDKTF',
            },
          },
        ];

    // Configure the AWS Provider. The 'region' specified here
    // will be used by all resources in all modules.
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- Configuration Variables and Naming Conventions ---
    const prefix = 'tap';
    const namingConvention = (resourceName: string) =>
      `${prefix}-${resourceName}-${environmentSuffix}`;
    const instanceType = 't3.micro';
    const sshKeyName = 'ssh-key-aug';
    const myIp = '206.84.231.196/32';
    // Use the domain name from the props, or a placeholder if none is provided.
    // NOTE: You must replace 'your-actual-domain.com' with a domain that
    // has a Hosted Zone in your AWS account. Otherwise, the deployment will fail.
    const domainName = props?.domainName || 'your-actual-domain.com';

    // --- Module Instantiation and Composition ---
    // 1. Create a secure VPC with public and private subnets across multiple AZs.
    const vpc = new VpcModule(this, namingConvention('vpc'), {
      name: namingConvention('vpc'),
      cidrBlock: '10.0.0.0/16',
    });

    // 2. Create an IAM role with policies for the EC2 instance.
    const iam = new IamModule(this, namingConvention('iam'), {
      name: namingConvention('ec2-iam-role'),
    });

    // We create the security groups first so their IDs can be passed to the modules.
    // They are created with no rules to avoid circular dependencies.
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg-main', {
      name: namingConvention('ec2-sg'),
      vpcId: vpc.vpcIdOutput,
      description: 'Security group for EC2 instances',
      tags: { Name: namingConvention('ec2-sg') },
    });

    const albSecurityGroup = new SecurityGroup(this, 'alb-sg-main', {
      name: namingConvention('alb-sg'),
      vpcId: vpc.vpcIdOutput,
      description: 'Security group for the Application Load Balancer',
      tags: { Name: namingConvention('alb-sg') },
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg-main', {
      name: namingConvention('rds-sg'),
      vpcId: vpc.vpcIdOutput,
      description: 'Security group for the RDS database',
      tags: { Name: namingConvention('rds-sg') },
    });

    // Define all ingress and egress rules as separate resources to avoid dependency loops.
    // Ingress rules
    new SecurityGroupRule(this, 'ec2-ingress-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      securityGroupId: ec2SecurityGroup.id,
      cidrBlocks: [myIp],
      description: 'Allow SSH from a specific IP',
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow HTTP traffic from the internet',
    });

    new SecurityGroupRule(this, 'ec2-ingress-from-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: ec2SecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    new SecurityGroupRule(this, 'rds-ingress-from-alb', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: rdsSecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
      description: 'Allow inbound database traffic from ALB',
    });

    // Egress rules (outbound traffic)
    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: ec2SecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow all outbound traffic',
    });

    new SecurityGroupRule(this, 'alb-egress-to-ec2', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      sourceSecurityGroupId: ec2SecurityGroup.id,
      description: 'Allow outbound traffic to EC2 instances',
    });

    new SecurityGroupRule(this, 'alb-egress-to-rds', {
      type: 'egress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      sourceSecurityGroupId: rdsSecurityGroup.id,
      description: 'Allow outbound traffic to RDS',
    });

    new SecurityGroupRule(this, 'rds-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: rdsSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow all outbound traffic',
    });

    // 4. Provision a highly available EC2 instance.
    const ec2 = new Ec2Module(this, namingConvention('ec2'), {
      name: namingConvention('ec2'),
      vpcId: vpc.vpcIdOutput,
      subnetId: Fn.element(vpc.privateSubnetIdsOutput, 0),
      instanceType: instanceType,
      ami: 'ami-084a7d336e816906b',
      keyName: sshKeyName,
      instanceProfileName: iam.instanceProfileName,
      ec2SecurityGroupId: ec2SecurityGroup.id,
    });

    // 5. Deploy an Application Load Balancer.
    const alb = new AlbModule(this, namingConvention('alb'), {
      name: namingConvention('alb'),
      vpcId: vpc.vpcIdOutput,
      publicSubnetIds: vpc.publicSubnetIdsOutput,
      targetGroupArn: ec2.targetGroupArnOutput,
      albSecurityGroupId: albSecurityGroup.id,
    });

    // 6. Set up a secure RDS PostgreSQL database in the private subnets.
    const rds = new RdsModule(this, namingConvention('rds'), {
      name: namingConvention('rds-db'),
      engine: 'postgres',
      engineVersion: '13.4',
      instanceClass: 'db.t3.micro',
      username: 'admin',
      allocatedStorage: 20,
      vpcId: vpc.vpcIdOutput,
      privateSubnetIds: vpc.privateSubnetIdsOutput,
      dbSecurityGroupId: rdsSecurityGroup.id,
    });

    // 7. Configure Route 53 DNS record for the ALB.
    new Route53Module(this, namingConvention('route53'), {
      zoneName: domainName,
      recordName: 'app',
      albZoneId: alb.albZoneIdOutput,
      albDnsName: alb.albDnsNameOutput,
    });

    // 8. Create CloudWatch alarms for critical services.
    new CloudwatchModule(this, namingConvention('cloudwatch'), {
      instanceId: ec2.instanceIdOutput,
      dbInstanceId: rds.dbInstanceIdOutput,
    });

    // --- Outputs for easy access after deployment ---
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcIdOutput,
      description: 'The ID of the main VPC.',
    });
    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.albDnsNameOutput,
      description: 'The DNS name of the Application Load Balancer.',
    });
    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.dbEndpointOutput,
      description: 'The endpoint of the RDS database instance.',
      sensitive: true,
    });
  }
}
