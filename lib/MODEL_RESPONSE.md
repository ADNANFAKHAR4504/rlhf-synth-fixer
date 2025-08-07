```typescript

// vpc-stack.ts
import {
  cloudwatchLogGroup,
  dataAwsRegion,
  eip,
  flowLog,
  iamRole,
  iamRolePolicy,
  internetGateway,
  natGateway,
  provider,
  routeTable,
  routeTableAssociation,
  subnet,
  vpc,
} from "@cdktf/provider-aws";
import { Fn, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface VpcStackConfig {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
}

export class VpcStack extends TerraformStack {
  public readonly vpcId: string;
  public readonly publicSubnets: string[];
  public readonly privateSubnets: string[];
  public readonly databaseSubnets: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, config: VpcStackConfig) {
    super(scope, id);

    new provider.AwsProvider(this, "aws", {
      region: config.region,
    });

    new dataAwsRegion.DataAwsRegion(this, "current");

    const mainVpc = new vpc.Vpc(this, "MainVpc", {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc`,
      },
    });

    const igw = new internetGateway.InternetGateway(this, "IGW", {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-igw`,
      },
    });

    const publicSubnets = config.publicSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `PublicSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-public-subnet-${i + 1}`,
        },
      });
    });

    const privateSubnets = config.privateSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `PrivateSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-subnet-${i + 1}`,
        },
      });
    });

    const databaseSubnets = config.databaseSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `DatabaseSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-database-subnet-${i + 1}`,
        },
      });
    });

    const eips = privateSubnets.map((_, i) => {
      return new eip.Eip(this, `NatEip${i}`, {
        domain: "vpc",
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-eip-${i + 1}`,
        },
      });
    });

    const natGateways = privateSubnets.map((_, i) => {
      return new natGateway.NatGateway(this, `NatGateway${i}`, {
        allocationId: eips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-gateway-${i + 1}`,
        },
      });
    });

    const publicRT = new routeTable.RouteTable(this, "PublicRT", {
      vpcId: mainVpc.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-public-rt`,
      },
    });

    publicSubnets.forEach((s, i) => {
      new routeTableAssociation.RouteTableAssociation(this, `PublicRTA${i}`, {
        subnetId: s.id,
        routeTableId: publicRT.id,
      });
    });

    privateSubnets.forEach((s, i) => {
      const rt = new routeTable.RouteTable(this, `PrivateRT${i}`, {
        vpcId: mainVpc.id,
        route: [
          {
            cidrBlock: "0.0.0.0/0",
            natGatewayId: natGateways[i].id,
          },
        ],
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-rt-${i + 1}`,
        },
      });

      new routeTableAssociation.RouteTableAssociation(this, `PrivateRTA${i}`, {
        subnetId: s.id,
        routeTableId: rt.id,
      });
    });

    const dbRT = new routeTable.RouteTable(this, "DatabaseRT", {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-database-rt`,
      },
    });

    databaseSubnets.forEach((s, i) => {
      new routeTableAssociation.RouteTableAssociation(this, `DatabaseRTA${i}`, {
        subnetId: s.id,
        routeTableId: dbRT.id,
      });
    });

    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(this, "VpcFlowLogGroup", {
      name: `/aws/vpc/flowlogs/${config.environment}`,
      retentionInDays: config.environment === "production" ? 365 : 30,
      tags: config.commonTags,
    });

    const flowLogRole = new iamRole.IamRole(this, "VpcFlowLogRole", {
      name: `${config.environment}-vpc-flow-log-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "vpc-flow-logs.amazonaws.com",
            },
          },
        ],
      }),
      tags: config.commonTags,
    });

    new iamRolePolicy.IamRolePolicy(this, "VpcFlowLogPolicy", {
      name: `${config.environment}-vpc-flow-log-policy`,
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogGroups",
              "logs:DescribeLogStreams",
            ],
            Resource: "*",
          },
        ],
      }),
    });

    new flowLog.FlowLog(this, "VpcFlowLog", {
      iamRoleArn: flowLogRole.arn,
      logDestination: logGroup.arn,
      trafficType: "ALL",
      vpcId: mainVpc.id,
    });

    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map(s => s.id);
    this.privateSubnets = privateSubnets.map(s => s.id);
    this.databaseSubnets = databaseSubnets.map(s => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGateways.map(n => n.id);

    new TerraformOutput(this, "vpc_id", { value: this.vpcId });
    new TerraformOutput(this, "public_subnet_ids", { value: this.publicSubnets });
    new TerraformOutput(this, "private_subnet_ids", { value: this.privateSubnets });
    new TerraformOutput(this, "database_subnet_ids", { value: this.databaseSubnets });
    new TerraformOutput(this, "internet_gateway_id", { value: this.internetGatewayId });
    new TerraformOutput(this, "nat_gateway_ids", { value: this.natGatewayIds });
  }
}

---

// iam-stack.ts
import {
  iamInstanceProfile,
  iamRole,
  iamRolePolicy,
} from "@cdktf/provider-aws";
import { TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface IamStackConfig {
  environment: string;
  commonTags: { [key: string]: string };
}

export class IamStack extends TerraformStack {
  public readonly ec2RoleArn: string;
  public readonly ec2ProfileName: string;
  public readonly s3ServiceRoleArn: string;
  public readonly cloudwatchRoleArn: string;

  constructor(scope: Construct, id: string, config: IamStackConfig) {
    super(scope, id);

    const ec2Role = new iamRole.IamRole(this, "Ec2Role", {
      name: `${config.environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: config.commonTags,
    });

    const ec2Profile = new iamInstanceProfile.IamInstanceProfile(this, "Ec2Profile", {
      name: `${config.environment}-ec2-profile`,
      role: ec2Role.name,
      tags: config.commonTags,
    });

    new iamRolePolicy.IamRolePolicy(this, "Ec2Policy", {
      name: `${config.environment}-ec2-policy`,
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "ec2:DescribeVolumes",
              "ec2:DescribeTags",
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject"],
            Resource: `arn:aws:s3:::${config.environment}-*/*`,
          },
        ],
      }),
    });

    const s3ServiceRole = new iamRole.IamRole(this, "S3ServiceRole", {
      name: `${config.environment}-s3-service-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "s3.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: config.commonTags,
    });

    const cloudwatchRole = new iamRole.IamRole(this, "CloudWatchRole", {
      name: `${config.environment}-cloudwatch-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "logs.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: config.commonTags,
    });

    this.ec2RoleArn = ec2Role.arn;
    this.ec2ProfileName = ec2Profile.name;
    this.s3ServiceRoleArn = s3ServiceRole.arn;
    this.cloudwatchRoleArn = cloudwatchRole.arn;

    new TerraformOutput(this, "ec2_role_arn", {
      value: this.ec2RoleArn,
    });

    new TerraformOutput(this, "ec2_instance_profile_name", {
      value: this.ec2ProfileName,
    });

    new TerraformOutput(this, "s3_service_role_arn", {
      value: this.s3ServiceRoleArn,
    });

    new TerraformOutput(this, "cloudwatch_role_arn", {
      value: this.cloudwatchRoleArn,
    });
  }
}

---

// ec2-stack.ts
import {
  cloudwatchLogGroup,
  dataAwsAmi,
  instance,
  securityGroup,
} from "@cdktf/provider-aws";
import { Fn, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface Ec2StackConfig {
  environment: string;
  vpcId: string;
  subnetId: string;
  instanceType: string;
  keyName?: string;
  iamInstanceProfile: string;
  allowedCidrBlocks: string[];
  commonTags: { [key: string]: string };
}

export class Ec2Stack extends TerraformStack {
  public readonly instanceId: string;
  public readonly privateIp: string;
  public readonly publicIp: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, config: Ec2StackConfig) {
    super(scope, id);

    const ami = new dataAwsAmi.DataAwsAmi(this, "AmazonLinuxAmi", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    const sg = new securityGroup.SecurityGroup(this, "Ec2SG", {
      namePrefix: `${config.environment}-ec2-`,
      vpcId: config.vpcId,
      ingress: [
        ...config.allowedCidrBlocks.map((cidr) => ({
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [cidr],
        })),
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/8"],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/8"],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-ec2-sg`,
      },
    });

    const ec2 = new instance.Instance(this, "WebServer", {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [sg.id],
      keyName: config.keyName || undefined,
      iamInstanceProfile: config.iamInstanceProfile,
      userData: Fn.base64encode(
        `#!/bin/bash
        yum update -y
        yum install -y amazon-cloudwatch-agent httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>${config.environment} server</h1>" > /var/www/html/index.html`
      ),
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: config.environment === "production" ? 20 : 10,
        deleteOnTermination: true,
        encrypted: true,
      },
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-web-server`,
        Type: "WebServer",
      },
    });

    new cloudwatchLogGroup.CloudwatchLogGroup(this, "Ec2LogGroup", {
      name: `/aws/ec2/${config.environment}`,
      retentionInDays: config.environment === "production" ? 365 : 30,
      tags: config.commonTags,
    });

    this.instanceId = ec2.id;
    this.privateIp = ec2.privateIp;
    this.publicIp = ec2.publicIp;
    this.securityGroupId = sg.id;

    new TerraformOutput(this, "instance_id", { value: this.instanceId });
    new TerraformOutput(this, "instance_private_ip", { value: this.privateIp });
    new TerraformOutput(this, "instance_public_ip", { value: this.publicIp });
    new TerraformOutput(this, "security_group_id", { value: this.securityGroupId });
  }
}

---

// s3-stack.ts
import * as aws from "@cdktf/provider-aws";
import { TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface LifecycleRule {
  id: string;
  status: string;
  expiration: { days: number };
  noncurrent_version_expiration: { noncurrent_days: number };
}

interface S3StackConfig {
  environment: string;
  bucketName: string;
  enableVersioning?: boolean;
  lifecycleRules?: LifecycleRule[];
  commonTags: { [key: string]: string };
}

export class S3Stack extends TerraformStack {
  public readonly bucketId: string;
  public readonly bucketArn: string;
  public readonly bucketDomainName: string;
  public readonly accessLogsBucketId: string;

  constructor(scope: Construct, id: string, config: S3StackConfig) {
    super(scope, id);

    const mainBucket = new aws.s3Bucket.S3Bucket(this, "MainBucket", {
      bucket: config.bucketName,
      tags: {
        ...config.commonTags,
        Name: config.bucketName,
        Type: "Storage",
      },
    });

    new aws.s3BucketVersioning.S3BucketVersioningA(this, "Versioning", {
      bucket: mainBucket.id,
      versioningConfiguration: {
        status: config.enableVersioning ? "Enabled" : "Disabled",
      },
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      "Encryption",
      {
        bucket: mainBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "PublicAccess", {
      bucket: mainBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(this, "Lifecycle", {
        bucket: mainBucket.id,
        rule: config.lifecycleRules.map((rule) => ({
          id: rule.id,
          status: rule.status,
          expiration: [{ days: rule.expiration.days }],
          noncurrentVersionExpiration: [
            { noncurrentDays: rule.noncurrent_version_expiration.noncurrent_days },
          ],
        })),
      });
    }

    const accessLogBucket = new aws.s3Bucket.S3Bucket(this, "AccessLogsBucket", {
      bucket: `${config.bucketName}-access-logs`,
      tags: {
        ...config.commonTags,
        Name: `${config.bucketName}-access-logs`,
        Type: "AccessLogs",
      },
    });

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "AccessLogsPublicAccess", {
      bucket: accessLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      "AccessLogsEncryption",
      {
        bucket: accessLogBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketLogging.S3BucketLoggingA(this, "BucketLogging", {
      bucket: mainBucket.id,
      targetBucket: accessLogBucket.id,
      targetPrefix: "access-logs/",
    });

    this.bucketId = mainBucket.id;
    this.bucketArn = mainBucket.arn;
    this.bucketDomainName = mainBucket.bucketDomainName;
    this.accessLogsBucketId = accessLogBucket.id;

    new TerraformOutput(this, "bucket_id", { value: this.bucketId });
    new TerraformOutput(this, "bucket_arn", { value: this.bucketArn });
    new TerraformOutput(this, "bucket_domain_name", { value: this.bucketDomainName });
    new TerraformOutput(this, "access_logs_bucket_id", { value: this.accessLogsBucketId });
  }
}

---

// cloudwatch-stack.ts
import {
  cloudwatchDashboard,
  cloudwatchLogGroup,
  cloudwatchMetricAlarm,
  snsTopic,
} from "@cdktf/provider-aws";
import { TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

interface CloudwatchStackConfig {
  environment: string;
  instanceId: string;
  commonTags: { [key: string]: string };
}

export class CloudwatchStack extends TerraformStack {
  public readonly dashboardUrl: string;
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, config: CloudwatchStackConfig) {
    super(scope, id);

    const topic = new snsTopic.SnsTopic(this, "AlertsTopic", {
      name: `${config.environment}-infrastructure-alerts`,
      tags: config.commonTags,
    });

    new cloudwatchDashboard.CloudwatchDashboard(this, "Dashboard", {
      dashboardName: `${config.environment}-infrastructure-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/EC2", "CPUUtilization", "InstanceId", config.instanceId],
                [".", "NetworkIn", ".", "."],
                [".", "NetworkOut", ".", "."],
              ],
              view: "timeSeries",
              stacked: false,
              region: "us-west-2",
              title: "EC2 Instance Metrics",
              period: 300,
            },
          },
        ],
      }),
    });

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "HighCpuAlarm", {
      alarmName: `${config.environment}-high-cpu-utilization`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Average",
      threshold: config.environment === "production" ? 80 : 90,
      alarmDescription: "This metric monitors EC2 CPU utilization",
      alarmActions: [topic.arn],
      dimensions: {
        InstanceId: config.instanceId,
      },
      tags: config.commonTags,
    });

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "InstanceHealthAlarm", {
      alarmName: `${config.environment}-instance-health-check`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "StatusCheckFailed",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Maximum",
      threshold: 0,
      alarmDescription: "This metric monitors EC2 health check",
      alarmActions: [topic.arn],
      dimensions: {
        InstanceId: config.instanceId,
      },
      tags: config.commonTags,
    });

    new cloudwatchLogGroup.CloudwatchLogGroup(this, "AppLogGroup", {
      name: `/aws/application/${config.environment}`,
      retentionInDays: config.environment === "production" ? 365 : 30,
      tags: config.commonTags,
    });

    this.dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=${config.environment}-infrastructure-dashboard`;
    this.snsTopicArn = topic.arn;

    new TerraformOutput(this, "dashboard_url", {
      value: this.dashboardUrl,
    });

    new TerraformOutput(this, "sns_topic_arn", {
      value: this.snsTopicArn,
    });
  }
}

---

// tap-stack.ts
import { App, Fn, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { CloudwatchStack } from "./cloudwatch-stack";
import { Ec2Stack } from "./ec2-stack";
import { IamStack } from "./iam-stack";
import { S3Stack } from "./s3-stack";
import { VpcStack } from "./vpc-stack";

class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const environment = process.env.ENVIRONMENT || "development";
    const region = process.env.AWS_REGION || "us-west-2";

    const commonTags = {
      Environment: environment,
      Owner: "team-infra",
      Service: "core",
      CostCenter: "1234",
      ManagedBy: "Terraform",
    };

    const azs = [`${region}a`, `${region}b`, `${region}c`];

    const vpcCidr = "10.0.0.0/16";
    const publicSubnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
    const privateSubnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"];
    const databaseSubnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"];

    const vpcStack = new VpcStack(this, "VpcStack", {
      environment,
      region,
      vpcCidr,
      azs,
      publicSubnetCidrs: publicSubnets,
      privateSubnetCidrs: privateSubnets,
      databaseSubnetCidrs: databaseSubnets,
      commonTags,
    });

    const iamStack = new IamStack(this, "IamStack", {
      environment,
      commonTags,
    });

    const ec2Stack = new Ec2Stack(this, "Ec2Stack", {
      environment,
      vpcId: vpcStack.vpcId,
      subnetId: Fn.element(vpcStack.publicSubnets, 0),
      instanceType: "t3.micro",
      keyName: process.env.EC2_KEY_NAME || "",
      iamInstanceProfile: iamStack.ec2ProfileName,
      allowedCidrBlocks: ["0.0.0.0/0"],
      commonTags,
    });

    const s3Stack = new S3Stack(this, "S3Stack", {
      environment,
      bucketName: `${environment}-assets-bucket`,
      enableVersioning: true,
      lifecycleRules: environment === "production" ? [] : [
        {
          id: "expire-old-objects",
          status: "Enabled",
          expiration: { days: 30 },
          noncurrent_version_expiration: { noncurrent_days: 15 }
        }
      ],
      commonTags,
    });

    const cloudwatchStack = new CloudwatchStack(this, "CloudwatchStack", {
      environment,
      instanceId: ec2Stack.instanceId,
      commonTags,
    });

  }
}

const app = new App();
new TapStack(app, "iac-291687");
app.synth();

export { TapStack };
