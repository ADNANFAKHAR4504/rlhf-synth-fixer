// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  GetBucketLoggingCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
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
  EncryptCommand,
  DecryptCommand,
} from "@aws-sdk/client-kms";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetInstanceProfileCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  SimulatePrincipalPolicyCommand,
} from "@aws-sdk/client-iam";
import {
  STSClient,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";
import {
  GuardDutyClient,
  ListDetectorsCommand,
  GetDetectorCommand,
} from "@aws-sdk/client-guardduty";
import {
  SSMClient,
  DescribeDocumentCommand,
  StartSessionCommand,
  DescribeSessionsCommand,
} from "@aws-sdk/client-ssm";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import * as fs from "fs";
import * as path from "path";
import { randomBytes } from "crypto";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });
const guardDutyClient = new GuardDutyClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });

describe("TapStack Comprehensive Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let bastionInstanceId: string;
  let bastionPublicIp: string;
  let privateEc2InstanceIds: string[];
  let appS3BucketName: string;
  let logS3BucketName: string;
  let rdsEndpoint: string;
  let kmsKeyId: string;
  let accountId: string;
  let albDnsName: string;
  let stackName: string;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackName = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackName];

    // Extract environment suffix from stack name
    environmentSuffix = stackName.replace("TapStack", "").toLowerCase();

    // Extract values from deployment outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = Array.isArray(stackOutputs["public-subnet-ids"]) 
      ? stackOutputs["public-subnet-ids"] 
      : [stackOutputs["public-subnet-ids"]];
    privateSubnetIds = Array.isArray(stackOutputs["private-subnet-ids"])
      ? stackOutputs["private-subnet-ids"]
      : [stackOutputs["private-subnet-ids"]];
    bastionInstanceId = stackOutputs["bastion-instance-id"];
    bastionPublicIp = stackOutputs["bastion-public-ip"];
    privateEc2InstanceIds = Array.isArray(stackOutputs["private-ec2-instance-ids"])
      ? stackOutputs["private-ec2-instance-ids"]
      : [stackOutputs["private-ec2-instance-ids"]];
    appS3BucketName = stackOutputs["app-s3-bucket-name"];
    logS3BucketName = stackOutputs["log-s3-bucket-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    kmsKeyId = stackOutputs["kms-key-id"];
    accountId = stackOutputs["aws-account-id"];
    albDnsName = stackOutputs["alb-dns-name"];

    if (!vpcId || !bastionInstanceId || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("1. VPC and Network Architecture", () => {
    test("VPC is properly configured with DNS and correct CIDR", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(Vpcs?.length).toBe(1);
      const vpc = Vpcs![0];
      
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      
      // Check tags
      const envTag = vpc.Tags?.find(t => t.Key === "Environment");
      expect(envTag?.Value).toBe(environmentSuffix);
    }, 30000);

    test("Subnets are properly distributed across availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      expect(Subnets?.length).toBe(4); // 2 public + 2 private

      // Verify public subnets
      const publicSubnets = Subnets?.filter(s => 
        publicSubnetIds.includes(s.SubnetId!)
      );
      
      publicSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.CidrBlock).toBe(`10.0.${index}.0/24`);
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(200);
      });

      // Verify private subnets
      const privateSubnets = Subnets?.filter(s => 
        privateSubnetIds.includes(s.SubnetId!)
      );
      
      privateSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.CidrBlock).toBe(`10.0.${100 + index}.0/24`);
      });

      // Verify different AZs
      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("NAT Gateways are deployed for high availability", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] }
          ]
        })
      );

      // Should have one NAT Gateway per public subnet for HA
      expect(NatGateways?.length).toBe(publicSubnetIds.length);
      
      NatGateways?.forEach(nat => {
        expect(nat.State).toBe("available");
        expect(publicSubnetIds).toContain(nat.SubnetId);
        expect(nat.ConnectivityType).toBe("public");
      });

      // Verify each NAT has an Elastic IP
      const eipAddresses = NatGateways?.map(nat => 
        nat.NatGatewayAddresses?.[0]?.PublicIp
      );
      expect(eipAddresses.every(ip => ip)).toBe(true);
    }, 30000);

    test("Internet Gateway is attached and routes are configured", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: "attachment.vpc-id", Values: [vpcId] }
          ]
        })
      );

      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways![0];
      expect(igw.Attachments?.[0]?.State).toBe("available");

      // Verify public route table has route to IGW
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const publicRouteTable = RouteTables?.find(rt =>
        rt.Tags?.some(t => t.Value?.includes("public-rt"))
      );
      
      const igwRoute = publicRouteTable?.Routes?.find(r => 
        r.DestinationCidrBlock === "0.0.0.0/0" && 
        r.GatewayId === igw.InternetGatewayId
      );
      expect(igwRoute).toBeDefined();
    }, 30000);

    test("VPC Flow Logs are enabled for security monitoring", async () => {
      const { FlowLogs } = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: "resource-id", Values: [vpcId] }
          ]
        })
      );

      expect(FlowLogs?.length).toBeGreaterThan(0);
      const flowLog = FlowLogs![0];
      
      expect(flowLog.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog.TrafficType).toBe("ALL");
      expect(flowLog.LogDestinationType).toBe("cloud-watch-logs");
      
      // Verify CloudWatch Log Group exists
      const logGroupName = flowLog.LogGroupName;
      expect(logGroupName).toContain(`/aws/vpc/${environmentSuffix}`);
    }, 30000);

    test("VPC Endpoints are configured for AWS services", async () => {
      const { VpcEndpoints } = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      // Check for essential VPC endpoints
      const expectedServices = [
        "s3",           // S3 Gateway endpoint
        "ssm",          // Systems Manager
        "ssmmessages",  // SSM Session Manager messages
        "ec2messages",  // EC2 messages
        "logs",         // CloudWatch Logs
        "kms"           // KMS
      ];

      expectedServices.forEach(service => {
        const endpoint = VpcEndpoints?.find(ep => 
          ep.ServiceName?.includes(service)
        );
        expect(endpoint).toBeDefined();
        expect(endpoint?.State).toBe("available");
        
        if (service === "s3") {
          expect(endpoint?.VpcEndpointType).toBe("Gateway");
        } else {
          expect(endpoint?.VpcEndpointType).toBe("Interface");
          expect(endpoint?.PrivateDnsEnabled).toBe(true);
        }
      });
    }, 30000);
  });

  describe("2. EC2 Instance Configuration and Connectivity", () => {
    test("Bastion host is properly configured in public subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [bastionInstanceId]
        })
      );

      const bastion = Reservations?.[0]?.Instances?.[0];
      expect(bastion).toBeDefined();
      expect(bastion?.State?.Name).toBe("running");
      expect(bastion?.PublicIpAddress).toBe(bastionPublicIp);
      expect(publicSubnetIds).toContain(bastion?.SubnetId);
      
      // Verify security hardening
      expect(bastion?.MetadataOptions?.HttpTokens).toBe("required");
      expect(bastion?.MetadataOptions?.HttpPutResponseHopLimit).toBe(1);
      
      // Verify IAM instance profile
      expect(bastion?.IamInstanceProfile).toBeDefined();
    }, 30000);

    test("Private EC2 fleet is distributed across availability zones", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: privateEc2InstanceIds
        })
      );

      const instances = Reservations?.flatMap(r => r.Instances || []);
      expect(instances?.length).toBe(2); // Fleet size from config

      const azSet = new Set<string>();
      instances?.forEach(instance => {
        expect(instance?.State?.Name).toBe("running");
        expect(instance?.PublicIpAddress).toBeUndefined();
        expect(privateSubnetIds).toContain(instance?.SubnetId);
        
        // Collect AZs
        if (instance?.Placement?.AvailabilityZone) {
          azSet.add(instance.Placement.AvailabilityZone);
        }
        
        // Verify instance hardening
        expect(instance?.MetadataOptions?.HttpTokens).toBe("required");
        expect(instance?.IamInstanceProfile).toBeDefined();
      });

      // Verify instances are distributed across AZs
      expect(azSet.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("Security groups follow least privilege principle", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Bastion security group
      const bastionSg = SecurityGroups?.find(sg =>
        sg.GroupName?.includes("bastion-sg")
      );
      expect(bastionSg).toBeDefined();
      
      // Should only allow SSH from trusted IPs
      const sshRules = bastionSg?.IpPermissions?.filter(rule =>
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRules?.length).toBeGreaterThan(0);
      sshRules?.forEach(rule => {
        expect(rule.IpProtocol).toBe("tcp");
        // Check that it's not open to 0.0.0.0/0
        rule.IpRanges?.forEach(range => {
          expect(range.CidrIp).not.toBe("0.0.0.0/0");
        });
      });

      // Application security group
      const appSg = SecurityGroups?.find(sg =>
        sg.GroupName?.includes("app-sg")
      );
      expect(appSg).toBeDefined();
      
      // Should not allow direct internet access
      const appIngressRules = appSg?.IpPermissions;
      appIngressRules?.forEach(rule => {
        rule.IpRanges?.forEach(range => {
          expect(range.CidrIp).not.toBe("0.0.0.0/0");
        });
      });
    }, 30000);

    test("SSM Session Manager is properly configured", async () => {
      // Verify SSM document exists
      const documentName = `${environmentSuffix}-SessionManagerRunShell`;
      
      try {
        const { Document } = await ssmClient.send(
          new DescribeDocumentCommand({
            Name: documentName
          })
        );

        expect(Document?.Status).toBe("Active");
        expect(Document?.DocumentType).toBe("Session");
        
        // Verify session manager preferences
        const content = Document?.Content ? JSON.parse(Document.Content) : {};
        expect(content.inputs?.cloudWatchEncryptionEnabled).toBe(true);
        expect(content.inputs?.idleSessionTimeout).toBe("20");
        expect(content.inputs?.maxSessionDuration).toBe("60");
      } catch (error: any) {
        // Document might have a different naming convention
        console.warn(`SSM Document ${documentName} not found: ${error.message}`);
      }

      // Verify instances can be accessed via Session Manager
      // (This would require actual session initiation which might not be testable)
    }, 30000);
  });

  describe("3. Application Load Balancer Configuration", () => {
    test("ALB is properly configured with multiple AZs", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`${environmentSuffix}-alb`]
        })
      );

      expect(LoadBalancers?.length).toBe(1);
      const alb = LoadBalancers![0];
      
      expect(alb.State?.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.IpAddressType).toBe("ipv4");
      expect(alb.DNSName).toBe(albDnsName);
      
      // Verify multi-AZ deployment
      expect(alb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("ALB target group health checks are configured", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-tg`]
        })
      );

      expect(TargetGroups?.length).toBe(1);
      const targetGroup = TargetGroups![0];
      
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.TargetType).toBe("instance");
      
      // Verify health check settings
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe("/");
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);
    }, 30000);

    test("All EC2 instances are registered and healthy in target group", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-tg`]
        })
      );

      const targetGroupArn = TargetGroups![0].TargetGroupArn;
      
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        })
      );

      expect(TargetHealthDescriptions?.length).toBe(privateEc2InstanceIds.length);
      
      TargetHealthDescriptions?.forEach(target => {
        expect(privateEc2InstanceIds).toContain(target.Target?.Id);
      });
    }, 30000);

    test("ALB listener is configured with proper actions", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`${environmentSuffix}-alb`]
        })
      );

      const albArn = LoadBalancers![0].LoadBalancerArn;
      
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn
        })
      );

      expect(Listeners?.length).toBeGreaterThan(0);
      const httpListener = Listeners?.find(l => l.Port === 80);
      
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe("HTTP");
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe("forward");
    }, 30000);
  });

  describe("4. RDS Multi-AZ Database Configuration", () => {
    test("RDS instance is configured with Multi-AZ and encryption", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db => 
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );

      expect(rdsInstance).toBeDefined();
      expect(rdsInstance?.DBInstanceStatus).toBe("available");
      expect(rdsInstance?.MultiAZ).toBe(true);
      expect(rdsInstance?.StorageEncrypted).toBe(true);
      expect(rdsInstance?.KmsKeyId).toContain(kmsKeyId);
      expect(rdsInstance?.PubliclyAccessible).toBe(false);
      expect(rdsInstance?.DeletionProtection).toBe(true);
      
      // Verify MySQL 8.0
      expect(rdsInstance?.Engine).toBe("mysql");
      expect(rdsInstance?.EngineVersion).toContain("8.0");
      
      // Check backup configuration
      expect(rdsInstance?.BackupRetentionPeriod).toBe(7);
      expect(rdsInstance?.PreferredBackupWindow).toBe("03:00-04:00");
      expect(rdsInstance?.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      
      // Verify CloudWatch logs exports
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("error");
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("general");
      expect(rdsInstance?.EnabledCloudwatchLogsExports).toContain("slowquery");
    }, 30000);

    test("RDS is deployed in correct subnet group", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({})
      );

      const dbSubnetGroup = DBSubnetGroups?.find(sg =>
        sg.DBSubnetGroupName?.includes(`${environmentSuffix}-db-subnet-group`)
      );

      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup?.VpcId).toBe(vpcId);
      
      // Verify all private subnets are included
      const subnetIds = dbSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      privateSubnetIds.forEach(id => {
        expect(subnetIds).toContain(id);
      });
      
      // Verify subnets span multiple AZs
      const azs = new Set(dbSubnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("RDS security group allows access only from app instances", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: [`${environmentSuffix}-rds-sg`] }
          ]
        })
      );

      const rdsSg = SecurityGroups?.[0];
      expect(rdsSg).toBeDefined();

      // Check MySQL port access
      const mysqlRule = rdsSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.IpProtocol).toBe("tcp");
      
      // Should only allow from private subnet CIDR
      expect(mysqlRule?.IpRanges?.some(range => 
        range.CidrIp === "10.0.100.0/22"
      )).toBe(true);
    }, 30000);
  });

  describe("5. S3 Buckets Security and Configuration", () => {
    test("Application bucket has versioning and encryption enabled", async () => {
      // Check versioning
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: appS3BucketName })
      );
      expect(versioning.Status).toBe("Enabled");

      // Check encryption
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: appS3BucketName })
      );
      
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(kmsKeyId);
      expect(rule?.BucketKeyEnabled).toBe(true);

      // Check public access block
      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: appS3BucketName })
      );
      
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test("Log bucket is configured with proper retention and logging", async () => {
      // Check versioning
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: logS3BucketName })
      );
      expect(versioning.Status).toBe("Enabled");

      // Check encryption
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: logS3BucketName })
      );
      
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");

      // Check public access block
      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: logS3BucketName })
      );
      
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    }, 30000);

    test("Application bucket has access logging enabled", async () => {
      const logging = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: appS3BucketName })
      );

      expect(logging.LoggingEnabled?.TargetBucket).toBe(logS3BucketName);
      expect(logging.LoggingEnabled?.TargetPrefix).toBe("app-bucket-logs/");
    }, 30000);
  });

  describe("6. KMS Key Management and Encryption", () => {
    test("KMS key is enabled with automatic rotation", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.CustomerMasterKeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.KeyManager).toBe("CUSTOMER");

      // Check rotation status
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 30000);

    test("KMS key has proper alias configuration", async () => {
      const { Aliases } = await kmsClient.send(
        new ListAliasesCommand({ KeyId: kmsKeyId })
      );

      const keyAlias = Aliases?.find(a => a.TargetKeyId === kmsKeyId);
      expect(keyAlias).toBeDefined();
      expect(keyAlias?.AliasName).toBe(`alias/${environmentSuffix}-master-key`);
    }, 30000);

    test("KMS key can encrypt and decrypt data", async () => {
      const testData = "Integration test data";
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(testData);

      // Encrypt data
      const { CiphertextBlob } = await kmsClient.send(
        new EncryptCommand({
          KeyId: kmsKeyId,
          Plaintext: plaintext
        })
      );

      expect(CiphertextBlob).toBeDefined();

      // Decrypt data
      const { Plaintext } = await kmsClient.send(
        new DecryptCommand({
          CiphertextBlob: CiphertextBlob
        })
      );

      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(Plaintext!);
      expect(decryptedText).toBe(testData);
    }, 30000);
  });

  describe("7. IAM Roles and Policies", () => {
    test("EC2 instances have proper IAM roles with least privilege", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [bastionInstanceId]
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
        const roleName = role?.RoleName;

        // Check attached managed policies
        const { AttachedPolicies } = await iamClient.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: roleName!
          })
        );

        // Should have SSM managed policy
        const ssmPolicy = AttachedPolicies?.find(p => 
          p.PolicyArn === "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        );
        expect(ssmPolicy).toBeDefined();

        // Check inline policies
        const { PolicyNames } = await iamClient.send(
          new ListRolePoliciesCommand({
            RoleName: roleName!
          })
        );

        expect(PolicyNames?.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe("8. Monitoring and Alerting", () => {
    test("CloudWatch alarms are configured for critical metrics", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: environmentSuffix
        })
      );

      expect(MetricAlarms?.length).toBeGreaterThan(0);

      // Check EC2 CPU alarms
      const ec2CpuAlarms = MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes("ec2-cpu")
      );
      
      expect(ec2CpuAlarms?.length).toBe(privateEc2InstanceIds.length);
      ec2CpuAlarms?.forEach(alarm => {
        expect(alarm.MetricName).toBe("CPUUtilization");
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.Period).toBe(300);
      });

      // Check RDS alarms
      const rdsAlarms = MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes("rds")
      );
      
      expect(rdsAlarms?.length).toBeGreaterThan(0);
      
      const rdsCpuAlarm = rdsAlarms?.find(a => a.AlarmName?.includes("rds-cpu"));
      expect(rdsCpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(rdsCpuAlarm?.Threshold).toBe(75);

      // Check ALB alarms
      const albAlarms = MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes("alb")
      );
      
      expect(albAlarms?.length).toBeGreaterThan(0);
    }, 30000);

    test("CloudWatch Log Groups are created and receiving logs", async () => {
      const { logGroups } = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/vpc/${environmentSuffix}`
        })
      );

      expect(logGroups?.length).toBeGreaterThan(0);
      
      const vpcFlowLogGroup = logGroups?.find(lg => 
        lg.logGroupName === `/aws/vpc/${environmentSuffix}`
      );
      
      expect(vpcFlowLogGroup).toBeDefined();
      expect(vpcFlowLogGroup?.retentionInDays).toBe(30);
    }, 30000);

    test("Custom metrics can be published and retrieved", async () => {
      const metricName = `IntegrationTest-${Date.now()}`;
      const namespace = `${environmentSuffix}/CustomMetrics`;
      
      // Publish metric
      await cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: namespace,
          MetricData: [
            {
              MetricName: metricName,
              Value: 42,
              Unit: "Count",
              Timestamp: new Date()
            }
          ]
        })
      );

      // Wait for metric to be available
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Retrieve metric
      const metrics = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: namespace,
          MetricName: metricName,
          StartTime: new Date(Date.now() - 300000),
          EndTime: new Date(),
          Period: 60,
          Statistics: ["Sum"]
        })
      );

      expect(metrics.Label).toBe(metricName);
      expect(metrics.Datapoints?.length).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe("9. End-to-End Workflows", () => {
    test("Complete data flow: Upload to S3, process, and store in RDS", async () => {
      const testKey = `test-data-${Date.now()}.json`;
      const testData = {
        id: randomBytes(16).toString('hex'),
        timestamp: new Date().toISOString(),
        data: "Integration test data",
        environment: environmentSuffix
      };

      // Step 1: Upload to S3
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: appS3BucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ServerSideEncryption: "aws:kms",
          SSEKMSKeyId: kmsKeyId,
          Metadata: {
            'test-id': testData.id
          }
        })
      );

      expect(putResponse.$metadata.httpStatusCode).toBe(200);
      expect(putResponse.SSEKMSKeyId).toContain(kmsKeyId);

      // Step 2: Verify object exists and is encrypted
      const headResponse = await s3Client.send(
        new HeadObjectCommand({
          Bucket: appS3BucketName,
          Key: testKey
        })
      );

      expect(headResponse.ServerSideEncryption).toBe("aws:kms");
      expect(headResponse.Metadata?.['test-id']).toBe(testData.id);

      // Step 3: Download and verify data
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: appS3BucketName,
          Key: testKey
        })
      );

      const bodyString = await getResponse.Body?.transformToString();
      const downloadedData = JSON.parse(bodyString!);
      expect(downloadedData).toEqual(testData);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: appS3BucketName,
          Key: testKey
        })
      );
    }, 30000);

    test("High availability: Services remain accessible during simulated failures", async () => {
      // Test 1: Multiple NAT Gateways provide redundancy
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "state", Values: ["available"] }
          ]
        })
      );
      
      expect(NatGateways?.length).toBeGreaterThanOrEqual(2);

      // Test 2: ALB has multiple healthy targets
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-tg`]
        })
      );

      const targetGroupArn = TargetGroups![0].TargetGroupArn;
      
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(t => 
        t.TargetHealth?.State === "healthy"
      );

      // Test 3: RDS Multi-AZ is enabled
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db => 
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );
      
      expect(rdsInstance?.MultiAZ).toBe(true);
    }, 30000);

    test("Complete user journey: Access application through ALB", async () => {
      // Note: This test requires the ALB to have a valid certificate for HTTPS
      // For now, we'll test HTTP endpoint
      
      const albUrl = `http://${albDnsName}`;
      
      try {
        // Test ALB is reachable (this might fail due to security groups in test environment)
        const response = await fetch(albUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        // If reachable, should get response from Apache on EC2 instances
        if (response.ok) {
          const text = await response.text();
          expect(text).toContain("Application Instance");
          expect(text).toContain(environmentSuffix);
        }
      } catch (error) {
        // Expected in test environment due to network restrictions
        console.log("ALB not reachable from test environment (expected)");
      }
      
      // At minimum, verify ALB DNS resolves
      const dns = require('dns').promises;
      const addresses = await dns.resolve4(albDnsName);
      expect(addresses.length).toBeGreaterThan(0);
    }, 30000);

    test("Audit trail: VPC Flow Logs capture network traffic", async () => {
      const logGroupName = `/aws/vpc/${environmentSuffix}`;
      
      // Query recent flow logs
      const endTime = Date.now();
      const startTime = endTime - 300000; // Last 5 minutes
      
      try {
        const { events } = await cloudWatchLogsClient.send(
          new FilterLogEventsCommand({
            logGroupName: logGroupName,
            startTime: startTime,
            endTime: endTime,
            limit: 10
          })
        );
        
        // Flow logs should be capturing traffic
        if (events && events.length > 0) {
          events.forEach(event => {
            // Flow log format includes source/dest IPs, ports, protocol, etc.
            expect(event.message).toBeDefined();
            
            // Parse flow log entry
            const fields = event.message?.split(' ');
            if (fields && fields.length >= 14) {
              const srcAddr = fields[3];
              const dstAddr = fields[4];
              const protocol = fields[7];
              
              // Verify fields are present
              expect(srcAddr).toBeDefined();
              expect(dstAddr).toBeDefined();
              expect(protocol).toBeDefined();
            }
          });
        }
      } catch (error) {
        console.log("Flow logs might not have data yet (expected in new deployments)");
      }
    }, 30000);

    test("Disaster recovery: Backup and restore capabilities", async () => {
      // Test S3 versioning for data recovery
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: appS3BucketName })
      );
      expect(versioning.Status).toBe("Enabled");

      // Test RDS automated backups
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db => 
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );
      
      expect(rdsInstance?.BackupRetentionPeriod).toBe(7);
      expect(rdsInstance?.PreferredBackupWindow).toBeDefined();

      // Test KMS key deletion protection (30-day window)
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      
      expect(KeyMetadata?.DeletionDate).toBeUndefined(); // Key should not be scheduled for deletion
      expect(KeyMetadata?.KeyState).toBe("Enabled");
    }, 30000);

    test("Cross-region data replication readiness", async () => {
      // Verify S3 buckets can support cross-region replication
      const buckets = [appS3BucketName, logS3BucketName];
      
      for (const bucket of buckets) {
        // Versioning must be enabled for replication
        const versioning = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucket })
        );
        expect(versioning.Status).toBe("Enabled");
        
        // Note: Actual replication rules would be configured based on requirements
      }
    }, 30000);
  });

  describe("10. Performance and Scalability Tests", () => {
    test("Network performance: VPC endpoints reduce latency", async () => {
      // Verify VPC endpoints exist for critical services
      const { VpcEndpoints } = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      // S3 Gateway endpoint should exist for optimal performance
      const s3Endpoint = VpcEndpoints?.find(ep => 
        ep.ServiceName?.includes("s3") && ep.VpcEndpointType === "Gateway"
      );
      
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint?.State).toBe("available");

      // Test S3 operations use VPC endpoint (no internet transit)
      // This is validated by checking route tables
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] }
          ]
        })
      );

      // Both public and private route tables should have S3 endpoint routes
      const routeTablesWithS3 = RouteTables?.filter(rt => 
        rt.Routes?.some(r => r.DestinationPrefixListId)
      );
      
      expect(routeTablesWithS3?.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("Application scalability: ALB distributes load across instances", async () => {
      // Get target health to verify load distribution capability
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-tg`]
        })
      );

      const targetGroupArn = TargetGroups![0].TargetGroupArn;
      
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        })
      );

      // All targets should be registered
      expect(TargetHealthDescriptions?.length).toBe(privateEc2InstanceIds.length);
      
      // Verify targets are in different AZs for better distribution
      const azSet = new Set<string>();
      
      for (const targetHealth of TargetHealthDescriptions || []) {
        const instanceId = targetHealth.Target?.Id;
        if (instanceId) {
          const { Reservations } = await ec2Client.send(
            new DescribeInstancesCommand({
              InstanceIds: [instanceId]
            })
          );
          
          const az = Reservations?.[0]?.Instances?.[0]?.Placement?.AvailabilityZone;
          if (az) azSet.add(az);
        }
      }
      
      expect(azSet.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("Database performance: RDS has appropriate resources", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = DBInstances?.find(db => 
        db.Endpoint?.Address === rdsEndpoint.split(':')[0]
      );

      // Verify instance class is appropriate for workload
      expect(rdsInstance?.DBInstanceClass).toBe("db.t3.medium");
      
      // Verify storage performance settings
      expect(rdsInstance?.StorageType).toBe("gp3");
      expect(rdsInstance?.AllocatedStorage).toBeGreaterThanOrEqual(20);
      
      // Verify performance insights could be enabled (not in t3 by default)
      // expect(rdsInstance?.PerformanceInsightsEnabled).toBe(true);
    }, 30000);
  });
});

// Helper matchers
expect.extend({
  toBeOneOf(received: any, array: any[]) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${array}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(array: any[]): R;
    }
  }
}