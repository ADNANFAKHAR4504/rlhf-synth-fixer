CDKTF TypeScript AWS Infrastructure
This project provides a comprehensive, monolithic CDKTF stack written in TypeScript to deploy a secure, highly available, and well-monitored environment on AWS.

Project Structure
.
├── bin/
│ └── tap.ts # Entry point of the CDKTF application
├── lib/
│ └── tap-stack.ts # Core stack definition with all resources
└── tests/
├── tap-stack.int.test.ts # Integration tests for resource interactions
└── tap-stack.unit.test.ts # Unit tests for individual resource configurations

Core Principles & Best Practices Followed

1. Monolithic Stack (lib/tap-stack.ts)
   All AWS resources are defined within a single TapStack class. This simplifies dependency management and provides a clear, holistic view of the entire infrastructure, which is ideal for tightly coupled components.

2. Security by Default
   Least Privilege IAM: The EC2 instance role only grants the specific permissions required to interact with the created S3 bucket and CloudWatch Logs. No wildcard resource permissions are used for S3.

Strict Security Groups:

EC2 instances only allow inbound HTTP from the Application Load Balancer and SSH from a predefined, restricted IP range (10.0.0.0/16). All other inbound traffic is denied.

The RDS instance only allows inbound traffic from the EC2 instances' security group on the PostgreSQL port.

Encrypted Storage: The S3 bucket and RDS database instance both have server-side encryption enabled by default.

3. High Availability
   Multi-AZ VPC: The VPC and its subnets are spread across two availability zones (us-east-1a and us-east-1b) to ensure resilience against a single AZ failure.

Multi-AZ RDS: The RDS database is deployed in a Multi-AZ configuration, which provides automatic failover for enhanced availability.

Application Load Balancer (ALB): The ALB distributes traffic across EC2 instances in both public subnets, ensuring that the application remains available even if one instance fails.

4. Operational Excellence
   Resource Tagging: All resources are consistently tagged with Environment, Owner, and Project for cost allocation, automation, and operational management.

CloudWatch Monitoring: A CloudWatch alarm is configured to monitor the CPUUtilization of the EC2 instances. It will trigger an SNS notification to a specified email if the CPU exceeds 75% for a sustained period.

Randomized Resource Naming: A random suffix is appended to all globally unique resource names (like S3 buckets, IAM roles, and security groups) to prevent naming conflicts during subsequent deployments.

5. Self-Contained & Reproducible
   The stack is designed to be self-contained. It creates all necessary components, including the VPC, subnets, and IAM roles, without relying on pre-existing infrastructure. This ensures that the environment can be reproduced reliably.

Getting Started
Install Dependencies:

npm install

Synthesize the Stack:

npx cdktf synth

Run Tests:

npm test

Deploy to AWS:

npx cdktf deploy

Infrastructure Code
bin/tap.ts
#!/usr/bin/env node
import { App } from "cdktf";
import { TapStack } from "../lib/tap-stack";

const app = new App();

new TapStack(app, "tap-aws-stack", {
env: {
region: "us-east-1",
},
});

app.synth();

lib/tap-stack.ts
import { Construct } from "constructs";
import { App, TerraformStack, Fn } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";

interface TapStackConfig {
env: {
region: string;
};
}

export class TapStack extends TerraformStack {
constructor(scope: Construct, id: string, config: TapStackConfig) {
super(scope, id);

    const region = config.env.region;
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const defaultTags = {
      Environment: "Production",
      Owner: "DevTeam",
      Project: "TAP",
    };

    // 1. AWS Provider and VPC Setup
    new AwsProvider(this, "aws", { region });

    const vpc = new Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      tags: defaultTags,
    });

    const igw = new InternetGateway(this, "main-igw", {
      vpcId: vpc.id,
      tags: defaultTags,
    });

    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
        },
      ],
      tags: defaultTags,
    });

    const publicSubnetA = new Subnet(this, "public-subnet-a", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags: defaultTags,
    });

    const publicSubnetB = new Subnet(this, "public-subnet-b", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
      tags: defaultTags,
    });

    new RouteTableAssociation(this, "public-rta-a", {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, "public-rta-b", {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    const privateSubnetA = new Subnet(this, "private-subnet-a", {
      vpcId: vpc.id,
      cidrBlock: "10.0.101.0/24",
      availabilityZone: `${region}a`,
      tags: defaultTags,
    });

    const privateSubnetB = new Subnet(this, "private-subnet-b", {
      vpcId: vpc.id,
      cidrBlock: "10.0.102.0/24",
      availabilityZone: `${region}b`,
      tags: defaultTags,
    });

    // 2. Security Groups
    const albSg = new SecurityGroup(this, "alb-sg", {
      name: `alb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: "Allow HTTP traffic to ALB",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: defaultTags,
    });

    const ec2Sg = new SecurityGroup(this, "ec2-sg", {
      name: `ec2-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: "Allow traffic to EC2 instances",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["10.0.0.0/16"], // Predefined, restricted IP range
        },
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: defaultTags,
    });

    const rdsSg = new SecurityGroup(this, "rds-sg", {
      name: `rds-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: "Allow traffic from EC2 to RDS",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ec2Sg.id],
        },
      ],
      tags: defaultTags,
    });

    // 3. S3 Bucket (Encrypted)
    const s3Bucket = new S3Bucket(this, "storage-bucket", {
      bucket: `tap-storage-bucket-${randomSuffix}`,
      tags: defaultTags,
    });

    new S3BucketServerSideEncryptionConfigurationA(this, "s3-encryption", {
      bucket: s3Bucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // 4. IAM Role for EC2 (Least Privilege)
    const ec2Role = new IamRole(this, "ec2-role", {
      name: `ec2-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
          },
        ],
      }),
      tags: defaultTags,
    });

    const ec2Policy = new IamPolicy(this, "ec2-policy", {
      name: `ec2-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject"],
            Resource: `${s3Bucket.arn}/*`, // Specific to the created bucket
          },
          {
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: "arn:aws:logs:*:*:*",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "ec2-policy-attachment", {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `ec2-instance-profile-${randomSuffix}`,
      role: ec2Role.name,
    });

    // 5. EC2 Instances
    const ami = new DataAwsAmi(this, "amazon-linux-ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    const ec2InstanceA = new Instance(this, "ec2-instance-a", {
      ami: ami.id,
      instanceType: "t2.micro",
      subnetId: publicSubnetA.id,
      vpcSecurityGroupIds: [ec2Sg.id],
      iamInstanceProfile: instanceProfile.name,
      tags: defaultTags,
    });

    const ec2InstanceB = new Instance(this, "ec2-instance-b", {
      ami: ami.id,
      instanceType: "t2.micro",
      subnetId: publicSubnetB.id,
      vpcSecurityGroupIds: [ec2Sg.id],
      iamInstanceProfile: instanceProfile.name,
      tags: defaultTags,
    });

    // 6. Application Load Balancer
    const alb = new Lb(this, "alb", {
      name: `app-lb-${randomSuffix}`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSg.id],
      subnets: [publicSubnetA.id, publicSubnetB.id],
      tags: defaultTags,
    });

    const targetGroup = new LbTargetGroup(this, "alb-tg", {
      name: `app-tg-${randomSuffix}`,
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.id,
      targetType: "instance",
      tags: defaultTags,
      healthCheck: {
        path: "/",
        protocol: "HTTP",
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new LbListener(this, "alb-listener", {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // 7. RDS Database (Multi-AZ)
    const dbSubnetGroup = new DbSubnetGroup(this, "rds-subnet-group", {
      name: `rds-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
      tags: defaultTags,
    });

    new DbInstance(this, "rds-instance", {
      identifier: `rds-db-${randomSuffix}`,
      allocatedStorage: 20,
      instanceClass: "db.t3.micro",
      engine: "postgres",
      engineVersion: "14.5",
      username: "admin",
      password: "MustBeChangedInSecretsManager1",
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      multiAz: true,
      storageEncrypted: true,
      skipFinalSnapshot: true,
      tags: defaultTags,
    });

    // 8. CloudWatch Monitoring and Alarms
    const snsTopic = new SnsTopic(this, "alarm-topic", {
      name: `alarm-topic-${randomSuffix}`,
      displayName: "High CPU Alarm Topic",
    });

    new SnsTopicSubscription(this, "alarm-email-subscription", {
      topicArn: snsTopic.arn,
      protocol: "email",
      endpoint: "monitoring-alerts@example.com",
    });

    new CloudwatchMetricAlarm(this, "ec2-cpu-alarm-a", {
      alarmName: `high-cpu-alarm-instance-a-${randomSuffix}`,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 120,
      statistic: "Average",
      threshold: 75,
      alarmDescription: "This metric monitors EC2 CPU utilization for instance A.",
      dimensions: {
        InstanceId: ec2InstanceA.id,
      },
      alarmActions: [snsTopic.arn],
    });

    new CloudwatchMetricAlarm(this, "ec2-cpu-alarm-b", {
      alarmName: `high-cpu-alarm-instance-b-${randomSuffix}`,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 120,
      statistic: "Average",
      threshold: 75,
      alarmDescription: "This metric monitors EC2 CPU utilization for instance B.",
      dimensions: {
        InstanceId: ec2InstanceB.id,
      },
      alarmActions: [snsTopic.arn],
    });

}
}
