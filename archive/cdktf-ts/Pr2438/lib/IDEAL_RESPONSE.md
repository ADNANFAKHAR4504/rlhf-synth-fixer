CDKTF TypeScript AWS Infrastructure for Elastic Beanstalk
This project provides a comprehensive, monolithic CDKTF stack written in TypeScript to deploy a highly available and resilient web application environment on AWS. It leverages AWS Elastic Beanstalk for the application layer, Amazon RDS for the database, and Route 53 for DNS failover.

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

1. Monolithic & Self-Contained
   All AWS resources are defined within a single TapStack class to provide a clear, holistic view of the infrastructure.

The stack is self-contained and creates all necessary components without requiring user-provided values, ensuring consistent and reproducible deployments.

2. High Availability & Resilience
   Multi-AZ VPC: The network is built across two availability zones (us-east-1a and us-east-1b) to protect against single-zone failures.

Elastic Beanstalk: The application layer is managed by Elastic Beanstalk, which handles provisioning, load balancing, and auto-scaling.

Multi-AZ RDS: The RDS database is deployed in a Multi-AZ configuration for automatic failover.

Route 53 DNS Failover: Two Route 53 records (primary and secondary) are configured with health checks. If the primary Elastic Beanstalk environment becomes unhealthy, Route 53 will automatically fail over to a secondary endpoint (a static S3 website in this example).

3. Security by Default
   Least Privilege IAM: The Elastic Beanstalk instance profile and service role are granted only the permissions necessary for the application to run and for the service to manage resources.

Strict Security Groups: The RDS instance only allows inbound traffic from the Elastic Beanstalk environment's security group on the PostgreSQL port.

Private Database: The RDS instance is placed in private subnets, isolating it from direct public access.

4. Operational Excellence
   CloudWatch Monitoring: A CloudWatch alarm monitors the health of the Elastic Beanstalk environment (EnvironmentHealth). If the environment is unhealthy, it triggers an SNS notification.

Randomized Resource Naming: A random suffix is appended to all globally unique resource names to prevent naming conflicts across deployments.

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
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamPolicyAttachment } from "@cdktf/provider-aws/lib/iam-policy-attachment";
import { ElasticBeanstalkApplication } from "@cdktf/provider-aws/lib/elastic-beanstalk-application";
import { ElasticBeanstalkEnvironment } from "@cdktf/provider-aws/lib/elastic-beanstalk-environment";
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { Route53HealthCheck } from "@cdktf/provider-aws/lib/route53-health-check";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketWebsiteConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";

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

    // 1. AWS Provider and VPC Setup
    new AwsProvider(this, "aws", { region });

    const vpc = new Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
    });

    const igw = new InternetGateway(this, "main-igw", { vpcId: vpc.id });

    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      route: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
    });

    const publicSubnetA = new Subnet(this, "public-subnet-a", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: `${region}a`,
    });

    const publicSubnetB = new Subnet(this, "public-subnet-b", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: `${region}b`,
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
    });

    const privateSubnetB = new Subnet(this, "private-subnet-b", {
      vpcId: vpc.id,
      cidrBlock: "10.0.102.0/24",
      availabilityZone: `${region}b`,
    });

    // 2. Security Groups
    const ebSg = new SecurityGroup(this, "eb-sg", {
      name: `eb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: "Allow HTTP traffic to Elastic Beanstalk",
      ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      ],
    });

    const rdsSg = new SecurityGroup(this, "rds-sg", {
      name: `rds-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: "Allow traffic from Beanstalk to RDS",
      ingress: [
        { protocol: "tcp", fromPort: 5432, toPort: 5432, securityGroups: [ebSg.id] },
      ],
    });

    // 3. IAM Roles (Least Privilege)
    const ebServiceRole = new IamRole(this, "eb-service-role", {
      name: `eb-service-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Action: "sts:AssumeRole", Effect: "Allow", Principal: { Service: "elasticbeanstalk.amazonaws.com" } }],
      }),
    });
    new IamPolicyAttachment(this, "eb-service-policy", {
      role: ebServiceRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService",
    });

    const ebInstanceRole = new IamRole(this, "eb-instance-role", {
      name: `eb-instance-role-${randomSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Action: "sts:AssumeRole", Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" } }],
      }),
    });
    new IamPolicyAttachment(this, "eb-instance-policy", {
      role: ebInstanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
    });

    const instanceProfile = new IamInstanceProfile(this, "eb-instance-profile", {
      name: `eb-instance-profile-${randomSuffix}`,
      role: ebInstanceRole.name,
    });

    // 4. RDS Database (Multi-AZ)
    const dbSubnetGroup = new DbSubnetGroup(this, "rds-subnet-group", {
      name: `rds-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
    });

    const dbInstance = new DbInstance(this, "rds-instance", {
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
      skipFinalSnapshot: true,
    });

    // 5. Elastic Beanstalk Application
    const app = new ElasticBeanstalkApplication(this, "beanstalk-app", {
      name: `webapp-${randomSuffix}`,
    });

    const ebEnv = new ElasticBeanstalkEnvironment(this, "beanstalk-env", {
      name: `webapp-env-${randomSuffix}`,
      application: app.name,
      solutionStackName: "64bit Amazon Linux 2 v5.8.0 running Node.js 18",
      setting: [
        { namespace: "aws:autoscaling:launchconfiguration", name: "IamInstanceProfile", value: instanceProfile.name },
        { namespace: "aws:ec2:vpc", name: "VPCId", value: vpc.id },
        { namespace: "aws:ec2:vpc", name: "Subnets", value: `${publicSubnetA.id},${publicSubnetB.id}` },
        { namespace: "aws:ec2:vpc", name: "ELBSubnets", value: `${publicSubnetA.id},${publicSubnetB.id}` },
        { namespace: "aws:elasticbeanstalk:environment", name: "ServiceRole", value: ebServiceRole.arn },
        { namespace: "aws:elasticbeanstalk:environment", name: "LoadBalancerType", value: "application" },
        { namespace: "aws:elasticbeanstalk:healthreporting:system", name: "SystemType", value: "enhanced" },
        { namespace: "aws:autoscaling:launchconfiguration", name: "SecurityGroups", value: ebSg.id },
      ],
    });

    // 6. Route 53 DNS Failover
    const zone = new Route53Zone(this, "zone", {
      name: `my-resilient-app-${randomSuffix}.com`,
    });

    const healthCheck = new Route53HealthCheck(this, "eb-health-check", {
      fqdn: ebEnv.cname,
      port: 80,
      type: "HTTP",
      failureThreshold: 3,
      requestInterval: 30,
    });

    const failoverS3Bucket = new S3Bucket(this, "failover-bucket", {
      bucket: `failover-bucket-${randomSuffix}`,
    });
    new S3BucketWebsiteConfigurationA(this, "failover-website", {
        bucket: failoverS3Bucket.bucket,
        indexDocument: { suffix: "index.html" },
    });

    new Route53Record(this, "primary-record", {
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: "A",
      alias: [{ name: ebEnv.cname, zoneId: ebEnv.zones[0], evaluateTargetHealth: true }],
      failoverRoutingPolicy: [{ type: "PRIMARY" }],
      setIdentifier: "primary-eb-environment",
      healthCheckId: healthCheck.id,
    });

    new Route53Record(this, "secondary-record", {
      zoneId: zone.zoneId,
      name: `www.${zone.name}`,
      type: "A",
      alias: [{ name: failoverS3Bucket.websiteEndpoint, zoneId: failoverS3Bucket.hostedZoneId, evaluateTargetHealth: false }],
      failoverRoutingPolicy: [{ type: "SECONDARY" }],
      setIdentifier: "secondary-failover-s3",
    });

    // 7. CloudWatch Alarms
    const snsTopic = new SnsTopic(this, "alarm-topic", {
      name: `eb-alarm-topic-${randomSuffix}`,
    });
    new SnsTopicSubscription(this, "alarm-email-subscription", {
      topicArn: snsTopic.arn,
      protocol: "email",
      endpoint: "monitoring-alerts@example.com",
    });

    new CloudwatchMetricAlarm(this, "eb-health-alarm", {
      alarmName: `eb-unhealthy-env-alarm-${randomSuffix}`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      metricName: "EnvironmentHealth",
      namespace: "AWS/ElasticBeanstalk",
      period: 60,
      statistic: "Average",
      threshold: 1,
      dimensions: { EnvironmentName: ebEnv.name },
      alarmActions: [snsTopic.arn],
    });

}
}

tests/tap-stack.unit.test.ts
import "./setup.js";

declare global {
namespace jest {
interface Matchers<R> {
toHaveResource(construct: any): R;
toHaveResourceWithProperties(construct: any, properties: any): R;
}
}
}

import { Testing, TerraformStack } from "cdktf";
import { TapStack } from "../lib/tap-stack";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { ElasticBeanstalkApplication } from "@cdktf/provider-aws/lib/elastic-beanstalk-application";
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";

describe("Unit Tests for TapStack", () => {
let stack: TerraformStack;
let synthesized: string;

beforeAll(() => {
const app = Testing.app();
stack = new TapStack(app, "test-stack", {
env: { region: "us-east-1" },
});
synthesized = Testing.synth(stack);
});

it("should create a VPC", () => {
expect(synthesized).toHaveResource(Vpc);
});

it("should create a Multi-AZ RDS instance", () => {
expect(synthesized).toHaveResourceWithProperties(DbInstance, {
multi_az: true,
});
});

it("should create an Elastic Beanstalk application", () => {
expect(synthesized).toHaveResource(ElasticBeanstalkApplication);
});

it("should create a Route 53 Zone", () => {
expect(synthesized).toHaveResource(Route53Zone);
});

it("should create a CloudWatch alarm for environment health", () => {
expect(synthesized).toHaveResourceWithProperties(CloudwatchMetricAlarm, {
metric_name: "EnvironmentHealth",
namespace: "AWS/ElasticBeanstalk",
});
});
});

tests/tap-stack.int.test.ts
import "./setup.js";

declare global {
namespace jest {
interface Matchers<R> {
toHaveResource(construct: any): R;
toHaveResourceWithProperties(construct: any, properties: any): R;
}
}
}

import { Testing, TerraformStack } from "cdktf";
import { TapStack } from "../lib/tap-stack";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { ElasticBeanstalkEnvironment } from "@cdktf/provider-aws/lib/elastic-beanstalk-environment";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";

describe("Integration Tests for TapStack", () => {
let stack: TerraformStack;
let synthesized: string;

beforeAll(() => {
const app = Testing.app();
stack = new TapStack(app, "test-stack", {
env: { region: "us-east-1" },
});
synthesized = Testing.synth(stack);
});

it("should configure the RDS security group to only allow traffic from Beanstalk", () => {
expect(synthesized).toHaveResourceWithProperties(SecurityGroup, {
name: expect.stringMatching(/^rds-sg-/),
ingress: expect.arrayContaining([
expect.objectContaining({
security_groups: ["${aws_security_group.eb-sg.id}"],
}),
]),
});
});

it("should configure the Beanstalk environment in the correct VPC and subnets", () => {
expect(synthesized).toHaveResourceWithProperties(ElasticBeanstalkEnvironment, {
setting: expect.arrayContaining([
expect.objectContaining({
namespace: "aws:ec2:vpc",
name: "VPCId",
value: "${aws_vpc.main-vpc.id}"
}),
expect.objectContaining({
namespace: "aws:ec2:vpc",
name: "Subnets",
value: "${aws_subnet.public-subnet-a.id},${aws_subnet.public-subnet-b.id}"
})
])
});
});

it("should create primary and secondary Route 53 failover records", () => {
expect(synthesized).toHaveResourceWithProperties(Route53Record, {
failover_routing_policy: [{ type: "PRIMARY" }],
});
expect(synthesized).toHaveResourceWithProperties(Route53Record, {
failover_routing_policy: [{ type: "SECONDARY" }],
});
});
});
