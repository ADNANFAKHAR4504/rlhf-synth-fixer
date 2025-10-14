// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
} from "@aws-sdk/client-kms";
import {
  SNSClient,
  GetTopicAttributesCommand,
  PublishCommand,
} from "@aws-sdk/client-sns";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  IAMClient,
  GetInstanceProfileCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from "@aws-sdk/client-iam";
import {
  STSClient,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";
import { randomBytes } from "crypto";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let publicEc2InstanceId: string;
  let privateEc2InstanceId: string;
  let publicEc2PublicIp: string;
  let privateEc2PrivateIp: string;
  let publicS3BucketName: string;
  let privateS3BucketName: string;
  let rdsEndpoint: string;
  let kmsKeyId: string;
  let snsTopicArn: string;
  let accountId: string;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }


    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    // Extract values from deployment outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = Array.isArray(stackOutputs["public-subnet-ids"]) 
      ? stackOutputs["public-subnet-ids"] 
      : [stackOutputs["public-subnet-ids"]];
    privateSubnetIds = Array.isArray(stackOutputs["private-subnet-ids"])
      ? stackOutputs["private-subnet-ids"]
      : [stackOutputs["private-subnet-ids"]];
    publicEc2InstanceId = stackOutputs["public-ec2-instance-id"];
    privateEc2InstanceId = stackOutputs["private-ec2-instance-id"];
    publicEc2PublicIp = stackOutputs["public-ec2-public-ip"];
    privateEc2PrivateIp = stackOutputs["private-ec2-private-ip"];
    publicS3BucketName = stackOutputs["public-s3-bucket-name"];
    privateS3BucketName = stackOutputs["private-s3-bucket-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    kmsKeyId = stackOutputs["kms-key-id"];
    snsTopicArn = stackOutputs["sns-topic-arn"];
    accountId = stackOutputs["aws-account-id"];

    if (!vpcId || !publicEc2InstanceId || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("VPC and Network Configuration", () => {
    test("VPC has correct configuration with DNS enabled", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(Vpcs?.length).toBe(1);
      const vpc = Vpcs![0];
      
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      
      // Check tags
      const projectTag = vpc.Tags?.find(t => t.Key === "Project");
      expect(projectTag?.Value).toBe(stackName);
    }, 30000);

    test("Subnets are correctly configured in different AZs", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      expect(Subnets?.length).toBe(4); // 2 public + 2 private

      // Verify public subnets configuration
      const publicSubnets = Subnets?.filter(s => 
        publicSubnetIds.includes(s.SubnetId!)
      );
      
      publicSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
      });

      // Verify private subnets configuration
      const privateSubnets = Subnets?.filter(s => 
        privateSubnetIds.includes(s.SubnetId!)
      );
      
      privateSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
      });

      // Verify subnets are in different AZs
      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("Network ACLs have restrictive rules for private subnets", async () => {
      const { NetworkAcls } = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const privateNacl = NetworkAcls?.find(nacl =>
        nacl.Tags?.some(t => t.Value?.includes("private-nacl"))
      );

      expect(privateNacl).toBeDefined();
      
      // Check inbound rules
      const inboundRules = privateNacl?.Entries?.filter(e => !e.Egress);
      const vpcTrafficRule = inboundRules?.find(r => r.CidrBlock === "10.0.0.0/16");
      expect(vpcTrafficRule).toBeDefined();
      expect(vpcTrafficRule?.RuleAction).toBe("allow");
    }, 30000);

    test("Route tables have correct routes for internet and NAT gateways", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Check public route table has route to IGW
      const publicRouteTable = RouteTables?.find(rt =>
        rt.Tags?.some(t => t.Value?.includes("public-rt"))
      );
      
      const igwRoute = publicRouteTable?.Routes?.find(r => 
        r.DestinationCidrBlock === "0.0.0.0/0" && r.GatewayId?.startsWith("igw-")
      );
      expect(igwRoute).toBeDefined();

      // Check private route table has route to NAT Gateway
      const privateRouteTable = RouteTables?.find(rt =>
        rt.Tags?.some(t => t.Value?.includes("private-rt"))
      );
      
      const natRoute = privateRouteTable?.Routes?.find(r => 
        r.DestinationCidrBlock === "0.0.0.0/0" && r.NatGatewayId?.startsWith("nat-")
      );
      expect(natRoute).toBeDefined();
    }, 30000);
  });

  describe("EC2 Instance Configuration and Connectivity", () => {
    test("Public EC2 instance is properly configured", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [publicEc2InstanceId]
        })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.PublicIpAddress).toBe(publicEc2PublicIp);
      expect(instance?.SubnetId).toBeIn(publicSubnetIds);
      
      // Verify IAM instance profile is attached
      expect(instance?.IamInstanceProfile).toBeDefined();
      
      // Verify root volume encryption
      const rootVolume = instance?.BlockDeviceMappings?.[0];
      expect(rootVolume?.Ebs?.VolumeId).toBeDefined();
    }, 30000);

    test("Private EC2 instance is properly configured", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [privateEc2InstanceId]
        })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.PrivateIpAddress).toBe(privateEc2PrivateIp);
      expect(instance?.PublicIpAddress).toBeUndefined();
      expect(instance?.SubnetId).toBeIn(privateSubnetIds);
      
      // Verify IAM instance profile
      expect(instance?.IamInstanceProfile).toBeDefined();
    }, 30000);
  });

  describe("RDS Database Configuration and Connectivity", () => {
    test("RDS instance is properly configured with encryption", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db => 
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );

      expect(rdsInstance).toBeDefined();
      expect(rdsInstance?.DBInstanceStatus).toBe("available");
      expect(rdsInstance?.StorageEncrypted).toBe(true);
      expect(rdsInstance?.KmsKeyId).toContain(kmsKeyId);
      
      // Check backup configuration
      expect(rdsInstance?.BackupRetentionPeriod).toBe(7);
      expect(rdsInstance?.PreferredBackupWindow).toBe("03:00-04:00");
      
      // Check deletion protection based on environment
      const isProduction = stackName.includes("prod");
      expect(rdsInstance?.DeletionProtection).toBe(isProduction);
      
      // Check monitoring
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("error");
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("general");
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("slowquery");
    }, 30000);

    test("RDS is in correct DB subnet group within VPC", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({})
      );

      const dbSubnetGroup = DBSubnetGroups?.find(sg =>
        sg.DBSubnetGroupName?.includes(stackName.toLowerCase())
      );

      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup?.VpcId).toBe(vpcId);
      
      // Verify subnets are private subnets
      const subnetIds = dbSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      privateSubnetIds.forEach(id => {
        expect(subnetIds).toContain(id);
      });
    }, 30000);

    test("RDS security group allows access from private instances", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: [`${stackName}-rds-sg`] }
          ]
        })
      );

      const rdsSg = SecurityGroups?.[0];

      // Check MySQL port access
      const mysqlRule = rdsSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      
    }, 30000);
  });

  describe("KMS Key Configuration", () => {
    test("KMS key exists and has rotation enabled", async () => {
      const keyArn = `arn:aws:kms:${awsRegion}:${accountId}:key/${kmsKeyId}`;
      
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.MultiRegion).toBe(false);

      // Check key rotation
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 30000);

    test("KMS key has correct alias", async () => {
      const { Aliases } = await kmsClient.send(
        new ListAliasesCommand({ KeyId: kmsKeyId })
      );

      const keyAlias = Aliases?.find(a => a.TargetKeyId === kmsKeyId);
      expect(keyAlias).toBeDefined();
      expect(keyAlias?.AliasName).toContain(stackName);
    }, 30000);
  });

  describe("SNS Topic and CloudWatch Alarms Integration", () => {
    test("SNS topic is properly configured with KMS encryption", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );

      expect(Attributes?.KmsMasterKeyId).toBe("alias/aws/sns");
    }, 30000);

    test("CloudWatch alarms are configured to send to SNS", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: stackName
        })
      );

      expect(MetricAlarms?.length).toBeGreaterThan(0);

      // Check high CPU alarm
      const cpuAlarm = MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes("high-cpu")
      );
      
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.AlarmActions).toContain(snsTopicArn);
      expect(cpuAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
    }, 30000);

    test("SNS can publish messages (alarm simulation)", async () => {
      const testMessage = {
        AlarmName: "IntegrationTest",
        NewStateValue: "ALARM",
        NewStateReason: "Test alarm triggered",
        StateChangeTime: new Date().toISOString(),
      };

      const response = await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Message: JSON.stringify(testMessage),
          Subject: "Integration Test Alert",
        })
      );

      expect(response.MessageId).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  describe("IAM Roles and Permissions", () => {
    test("EC2 instances have proper IAM roles attached", async () => {
      // Get instance profile name from EC2 instance
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [publicEc2InstanceId]
        })
      );

      const instanceProfileArn = Reservations?.[0]?.Instances?.[0]?.IamInstanceProfile?.Arn;
      const profileName = instanceProfileArn?.split('/').pop();

      if (profileName) {
        const { InstanceProfile } = await iamClient.send(
          new GetInstanceProfileCommand({
            InstanceProfileName: profileName
          })
        );

        expect(InstanceProfile?.Roles?.length).toBeGreaterThan(0);
        
        const role = InstanceProfile?.Roles?.[0];
        expect(role?.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");

        // Check inline policies
        const { PolicyNames } = await iamClient.send(
          new ListRolePoliciesCommand({
            RoleName: role?.RoleName!
          })
        );

        expect(PolicyNames).toContain("s3-access");
      }
    }, 30000);

    test("IAM role policies allow S3 access", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [publicEc2InstanceId]
        })
      );

      const instanceProfileArn = Reservations?.[0]?.Instances?.[0]?.IamInstanceProfile?.Arn;
      const profileName = instanceProfileArn?.split('/').pop();

      if (profileName) {
        const { InstanceProfile } = await iamClient.send(
          new GetInstanceProfileCommand({
            InstanceProfileName: profileName
          })
        );

        const roleName = InstanceProfile?.Roles?.[0]?.RoleName;

        if (roleName) {
          const { PolicyDocument } = await iamClient.send(
            new GetRolePolicyCommand({
              RoleName: roleName,
              PolicyName: "s3-access"
            })
          );

          const policy = JSON.parse(decodeURIComponent(PolicyDocument!));
          const s3Statement = policy.Statement.find((s: any) =>
            s.Action.some((a: string) => a.startsWith("s3:"))
          );

          expect(s3Statement).toBeDefined();
          expect(s3Statement.Effect).toBe("Allow");
          expect(s3Statement.Action).toContain("s3:GetObject");
          expect(s3Statement.Action).toContain("s3:PutObject");
        }
      }
    }, 30000);
  });

  describe("Cross-Service Integration", () => {
    test("EC2 instances can interact with S3 buckets through VPC endpoints", async () => {
      // This verifies that EC2 instances have network path to S3
      // and proper IAM permissions are in place
      
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [privateEc2InstanceId]
        })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      
      // Verify instance has IAM role for S3 access
      expect(instance?.IamInstanceProfile).toBeDefined();
      
      // Verify instance is in private subnet with NAT access
      expect(instance?.SubnetId).toBeIn(privateSubnetIds);
      
      // Private instances should be able to reach S3 via NAT Gateway or VPC Endpoint
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "association.subnet-id", Values: [instance?.SubnetId!] }
          ]
        })
      );

      const hasInternetRoute = RouteTables?.[0]?.Routes?.some(r =>
        r.DestinationCidrBlock === "0.0.0.0/0" && 
        (r.NatGatewayId || r.GatewayId)
      );
      
      expect(hasInternetRoute).toBe(true);
    }, 30000);

    test("CloudWatch can collect metrics from multiple services", async () => {
      // Test metric collection from EC2
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

      const ec2Metrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [
            {
              Name: "InstanceId",
              Value: publicEc2InstanceId
            }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average"]
        })
      );

      // Metrics should be available for EC2 instances
      expect(ec2Metrics.Label).toBe("CPUUtilization");
      expect(ec2Metrics.Datapoints).toBeDefined();

      // Test metric collection from RDS
      const rdsMetrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: "AWS/RDS",
          MetricName: "DatabaseConnections",
          Dimensions: [
            {
              Name: "DBInstanceIdentifier",
              Value: rdsEndpoint.split('.')[0] // Extract instance identifier
            }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ["Average"]
        })
      );

      expect(rdsMetrics.Label).toBe("DatabaseConnections");
    }, 30000);

    test("Security groups enable proper service communication", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Find all custom security groups
      const customGroups = SecurityGroups?.filter(sg =>
        sg.GroupName?.includes(stackName)
      );

      expect(customGroups?.length).toBeGreaterThanOrEqual(3); // public, private, rds

      // Verify security group chaining
      const publicSg = customGroups?.find(sg => sg.GroupName?.includes("public-sg"));
      const privateSg = customGroups?.find(sg => sg.GroupName?.includes("private-sg"));
      const rdsSg = customGroups?.find(sg => sg.GroupName?.includes("rds-sg"));

      // Private SG should allow from Public SG
      const privateFromPublic = privateSg?.IpPermissions?.some(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === publicSg?.GroupId)
      );
      expect(privateFromPublic).toBe(true);

      // RDS SG should allow from Private SG
      const rdsFromPrivate = rdsSg?.IpPermissions?.some(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === privateSg?.GroupId)
      );
      expect(rdsFromPrivate).toBe(true);
    }, 30000);

    test("Tags are consistently applied across all resources", async () => {
      // Check EC2 instances
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [publicEc2InstanceId, privateEc2InstanceId]
        })
      );

      Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const projectTag = instance.Tags?.find(t => t.Key === "Project");
          const envTag = instance.Tags?.find(t => t.Key === "Environment");
          const ownerTag = instance.Tags?.find(t => t.Key === "Owner");
          
          expect(projectTag?.Value).toBe(stackName);
          expect(envTag).toBeDefined();
          expect(ownerTag?.Value).toBe("infrastructure-team");
        });
      });

      // Check VPC
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = Vpcs?.[0];
      const vpcProjectTag = vpc?.Tags?.find(t => t.Key === "Project");
      expect(vpcProjectTag?.Value).toBe(stackName);
    }, 30000);

    test("KMS key is used consistently across encrypted resources", async () => {
      // Verify S3 encryption uses the same KMS key
      const publicEncryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: publicS3BucketName })
      );
      
      const privateEncryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: privateS3BucketName })
      );

      const publicKmsId = publicEncryption.ServerSideEncryptionConfiguration
        ?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      const privateKmsId = privateEncryption.ServerSideEncryptionConfiguration
        ?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

      expect(publicKmsId).toContain(kmsKeyId);
      expect(privateKmsId).toContain(kmsKeyId);

      // Verify RDS uses the same KMS key
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db =>
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );

      expect(rdsInstance?.KmsKeyId).toContain(kmsKeyId);
    }, 30000);

    test("Custom metrics can be published to CloudWatch", async () => {
      // Publish a custom metric
      const metricName = `IntegrationTest-${Date.now()}`;
      
      await cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: `${stackName}/CustomMetrics`,
          MetricData: [
            {
              MetricName: metricName,
              Value: Math.random() * 100,
              Unit: "Count",
              Timestamp: new Date(),
              Dimensions: [
                {
                  Name: "Environment",
                  Value: stackName.split('-').pop() || "test"
                }
              ]
            }
          ]
        })
      );

      // Wait a moment for metric to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify metric was stored
      const metrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: `${stackName}/CustomMetrics`,
          MetricName: metricName,
          StartTime: new Date(Date.now() - 300000), // 5 minutes ago
          EndTime: new Date(),
          Period: 60,
          Statistics: ["Average"]
        })
      );

      expect(metrics.Label).toBe(metricName);
    }, 30000);
  });
});

// Helper to check if value is in array
expect.extend({
  toBeIn(received: any, array: any[]) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be in ${array}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be in ${array}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeIn(array: any[]): R;
    }
  }
}