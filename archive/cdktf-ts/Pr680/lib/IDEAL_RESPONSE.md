// main.ts
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, NamedRemoteWorkspace } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc, Subnet, NatGateway, InternetGateway, RouteTable, Route, RouteTableAssociation } from "@cdktf/provider-aws/lib/vpc";
import { SecurityGroup, SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group";
import { S3Bucket, S3BucketLifecycleConfiguration, S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3";
import { KmsKey } from "@cdktf/provider-aws/lib/kms";
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { IamRole, IamPolicy, IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam";
import { CloudwatchLogGroup, CloudwatchLogStream, CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch";

const TAGS = {
Project: "MyProject",
Environment: "Dev",
Owner: "Akshat Jain"
};

class MyInfraStack extends TerraformStack {
constructor(scope: Construct, id: string) {
super(scope, id);

    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    // Networking
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...TAGS, Name: "main-vpc" },
    });

    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const azs = ["a", "b", "c"];

    for (let i = 0; i < azs.length; i++) {
      publicSubnets.push(
        new Subnet(this, `public-subnet-${azs[i]}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: `us-east-1${azs[i]}`,
          mapPublicIpOnLaunch: true,
          tags: { ...TAGS, Name: `public-subnet-${azs[i]}` },
        })
      );

      privateSubnets.push(
        new Subnet(this, `private-subnet-${azs[i]}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: `us-east-1${azs[i]}`,
          mapPublicIpOnLaunch: false,
          tags: { ...TAGS, Name: `private-subnet-${azs[i]}` },
        })
      );
    }

    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: { ...TAGS, Name: "main-igw" },
    });

    const publicRt = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: { ...TAGS, Name: "public-rt" },
    });

    new Route(this, "public-default-route", {
      routeTableId: publicRt.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        routeTableId: publicRt.id,
        subnetId: subnet.id,
      });
    });

    const natGateway = new NatGateway(this, "nat-gateway", {
      subnetId: publicSubnets[0].id,
      allocationId: "${aws_eip.nat.id}", // mockup placeholder
      tags: { ...TAGS, Name: "main-nat-gateway" },
    });

    // Security
    const sg = new SecurityGroup(this, "web-sg", {
      vpcId: vpc.id,
      description: "Allow HTTP/SSH from specific IPs",
      ingress: [
        { fromPort: 22, toPort: 22, protocol: "tcp", cidrBlocks: ["203.0.113.0/24"] },
        { fromPort: 80, toPort: 80, protocol: "tcp", cidrBlocks: ["203.0.113.0/24"] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      tags: { ...TAGS, Name: "web-sg" },
    });

    // Storage (S3 + KMS)
    const kmsKey = new KmsKey(this, "s3-kms-key", {
      description: "S3 encryption key",
      deletionWindowInDays: 10,
      tags: TAGS,
    });

    const bucket = new S3Bucket(this, "secure-bucket", {
      bucketPrefix: "myproject-secure-",
      tags: TAGS,
    });

    new S3BucketServerSideEncryptionConfiguration(this, "bucket-encryption", {
      bucket: bucket.bucket,
      rule: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "aws:kms", kmsMasterKeyId: kmsKey.keyId } }],
    });

    new S3BucketLifecycleConfiguration(this, "bucket-lifecycle", {
      bucket: bucket.bucket,
      rule: [
        {
          id: "expire-old-versions",
          enabled: true,
          noncurrentVersionExpiration: { noncurrentDays: 30 },
          transition: [{ days: 60, storageClass: "GLACIER" }],
        },
      ],
    });

    // IAM
    const ec2Role = new IamRole(this, "ec2-role", {
      name: "ec2-role",
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
      tags: TAGS,
    });

    const s3Policy = new IamPolicy(this, "ec2-s3-policy", {
      name: "ec2-s3-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:*", "logs:*"],
            Resource: ["*"]
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "attach-s3", {
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    // Compute
    const lt = new LaunchTemplate(this, "launch-template", {
      namePrefix: "lt-",
      imageId: "ami-12345678",
      instanceType: "t3.micro",
      keyName: "your-keypair",
      vpcSecurityGroupIds: [sg.id],
      iamInstanceProfile: {
        name: "ec2-role"
      },
      tags: TAGS,
    });

    new AutoscalingGroup(this, "asg", {
      desiredCapacity: 2,
      maxSize: 4,
      minSize: 1,
      vpcZoneIdentifier: privateSubnets.map(s => s.id),
      launchTemplate: { id: lt.id, version: "$Latest" },
      tags: [{ key: "Name", value: "web-server", propagateAtLaunch: true }],
    });

    // Monitoring
    new CloudwatchLogGroup(this, "log-group", {
      name: "/ec2/web",
      retentionInDays: 14,
      tags: TAGS,
    });

    new CloudwatchMetricAlarm(this, "cpu-alarm", {
      alarmName: "HighCPUUtilization",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 60,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "Triggered when CPU exceeds 80%",
      actionsEnabled: true,
      dimensions: {
        AutoScalingGroupName: "asg"
      },
      tags: TAGS,
    });

}
}

const app = new App();
new MyInfraStack(app, "aws-infra-stack");
app.synth();
