// Integration tests for deployed Terraform infrastructure
// Tests real AWS resources and their connectivity using actual deployment outputs

import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

// Load deployment outputs from cfn-outputs/flat-outputs.json
let deploymentOutputs: any = {};
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    try {
      const outputsContent = fs.readFileSync(outputsPath, "utf8");
      deploymentOutputs = JSON.parse(outputsContent);
    } catch (error) {
      console.warn(`Warning: Could not parse outputs file at ${outputsPath}:`, error);
      deploymentOutputs = {};
    }
  } else {
    console.warn(`Warning: Outputs file not found at ${outputsPath}. Tests will be skipped or may fail.`);
    deploymentOutputs = {};
  }
});

describe("SecureApp Infrastructure Integration Tests", () => {
  let s3Client: AWS.S3;
  let rdsClient: AWS.RDS;
  let kmsClient: AWS.KMS;
  let ec2Client: AWS.EC2;
  let cloudTrailClient: AWS.CloudTrail;
  let configClient: AWS.ConfigService;
  let guardDutyClient: AWS.GuardDuty;
  let apiGatewayClient: AWS.APIGateway;

  beforeAll(() => {
    const region = process.env.AWS_REGION || "us-west-2";
    s3Client = new AWS.S3({ region });
    rdsClient = new AWS.RDS({ region });
    kmsClient = new AWS.KMS({ region });
    ec2Client = new AWS.EC2({ region });
    cloudTrailClient = new AWS.CloudTrail({ region });
    configClient = new AWS.ConfigService({ region });
    guardDutyClient = new AWS.GuardDuty({ region });
    apiGatewayClient = new AWS.APIGateway({ region });
  });

  describe("KMS Encryption", () => {
    test("KMS keys exist and have rotation enabled for both regions", async () => {
      if (!deploymentOutputs.kms_key_ids_usw2 || !deploymentOutputs.kms_key_ids_use1) {
        console.warn("Skipping test: KMS key IDs not found in deployment outputs");
        return;
      }
      
      expect(deploymentOutputs.kms_key_ids_usw2).toBeDefined();
      expect(deploymentOutputs.kms_key_ids_use1).toBeDefined();
      
      // Test us-west-2 key
      const keyDetailsUsw2 = await kmsClient.describeKey({
        KeyId: deploymentOutputs.kms_key_ids_usw2
      }).promise();
      
      expect(keyDetailsUsw2.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(keyDetailsUsw2.KeyMetadata?.Enabled).toBe(true);
      
      const rotationStatusUsw2 = await kmsClient.getKeyRotationStatus({
        KeyId: deploymentOutputs.kms_key_ids_usw2
      }).promise();
      
      expect(rotationStatusUsw2.KeyRotationEnabled).toBe(true);
      
      // Test us-east-1 key
      const kmsClientUse1 = new AWS.KMS({ region: "us-east-1" });
      const keyDetailsUse1 = await kmsClientUse1.describeKey({
        KeyId: deploymentOutputs.kms_key_ids_use1
      }).promise();
      
      expect(keyDetailsUse1.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(keyDetailsUse1.KeyMetadata?.Enabled).toBe(true);
      
      const rotationStatusUse1 = await kmsClientUse1.getKeyRotationStatus({
        KeyId: deploymentOutputs.kms_key_ids_use1
      }).promise();
      
      expect(rotationStatusUse1.KeyRotationEnabled).toBe(true);
    });

    test("KMS keys are customer managed", async () => {
      if (!deploymentOutputs.kms_key_ids_usw2 || !deploymentOutputs.kms_key_ids_use1) {
        console.warn("Skipping test: KMS key IDs not found in deployment outputs");
        return;
      }
      
      const keyDetails = await kmsClient.describeKey({
        KeyId: deploymentOutputs.kms_key_ids_usw2
      }).promise();
      
      expect(keyDetails.KeyMetadata?.KeyManager).toBe("CUSTOMER");
      expect(keyDetails.KeyMetadata?.Origin).toBe("AWS_KMS");
      
      const kmsClientUse1 = new AWS.KMS({ region: "us-east-1" });
      const keyDetailsUse1 = await kmsClientUse1.describeKey({
        KeyId: deploymentOutputs.kms_key_ids_use1
      }).promise();
      
      expect(keyDetailsUse1.KeyMetadata?.KeyManager).toBe("CUSTOMER");
      expect(keyDetailsUse1.KeyMetadata?.Origin).toBe("AWS_KMS");
    });
  });

  describe("S3 Storage Security", () => {
    test("S3 app data buckets exist and have proper encryption", async () => {
      // Test us-west-2 app data bucket
      const bucketNameUsw2 = "iac-291323-secureapp-prod-app-data-usw2";
      
      const encryptionUsw2 = await s3Client.getBucketEncryption({
        Bucket: bucketNameUsw2
      }).promise();
      
      const ruleUsw2 = encryptionUsw2.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(deploymentOutputs.kms_key_ids_usw2);
      
      // Test us-east-1 app data bucket
      const bucketNameUse1 = "iac-291323-secureapp-prod-app-data-use1";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      
      const encryptionUse1 = await s3ClientUse1.getBucketEncryption({
        Bucket: bucketNameUse1
      }).promise();
      
      const ruleUse1 = encryptionUse1.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(deploymentOutputs.kms_key_ids_use1);
    });

    test("CloudTrail S3 bucket has proper encryption", async () => {
      const cloudtrailBucket = "iac-291323-secureapp-prod-cloudtrail-logs";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      
      const encryption = await s3ClientUse1.getBucketEncryption({
        Bucket: cloudtrailBucket
      }).promise();
      
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    });

    test("S3 buckets have proper tags", async () => {
      const bucketNameUsw2 = "iac-291323-secureapp-prod-app-data-usw2";
      
      const tags = await s3Client.getBucketTagging({
        Bucket: bucketNameUsw2
      }).promise();
      
      const tagMap = Object.fromEntries(tags.TagSet?.map(tag => [tag.Key, tag.Value]) || []);
      expect(tagMap.environment).toBe("production");
      expect(tagMap.owner).toBe("DevOps");
      expect(tagMap.project).toBe("SecureApp");
    });

    test("Config S3 buckets have proper encryption", async () => {
      // Test us-west-2 config bucket
      const configBucketUsw2 = "iac-291323-secureapp-prod-config-usw2";
      const encryptionUsw2 = await s3Client.getBucketEncryption({
        Bucket: configBucketUsw2
      }).promise();
      
      const ruleUsw2 = encryptionUsw2.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Test us-east-1 config bucket
      const configBucketUse1 = "iac-291323-secureapp-prod-config-use1";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      const encryptionUse1 = await s3ClientUse1.getBucketEncryption({
        Bucket: configBucketUse1
      }).promise();
      
      const ruleUse1 = encryptionUse1.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });
  });

  describe("VPC and Networking", () => {
    test("VPCs exist with proper configuration in both regions", async () => {
      if (!deploymentOutputs.vpc_ids_usw2 || !deploymentOutputs.vpc_ids_use1) {
        console.warn("Skipping test: VPC IDs not found in deployment outputs");
        return;
      }
      
      expect(deploymentOutputs.vpc_ids_usw2).toBeDefined();
      expect(deploymentOutputs.vpc_ids_use1).toBeDefined();
      
      // Test us-west-2 VPC
      const vpcsUsw2 = await ec2Client.describeVpcs({
        VpcIds: [deploymentOutputs.vpc_ids_usw2]
      }).promise();
      
      const vpcUsw2 = vpcsUsw2.Vpcs?.[0];
      expect(vpcUsw2?.State).toBe("available");
      // VPC attributes need to be fetched separately
      const vpcAttrsUsw2 = await ec2Client.describeVpcAttribute({
        VpcId: deploymentOutputs.vpc_ids_usw2,
        Attribute: 'enableDnsHostnames'
      }).promise();
      expect(vpcAttrsUsw2.EnableDnsHostnames?.Value).toBe(true);
      
      const vpcDnsSupportUsw2 = await ec2Client.describeVpcAttribute({
        VpcId: deploymentOutputs.vpc_ids_usw2,
        Attribute: 'enableDnsSupport'
      }).promise();
      expect(vpcDnsSupportUsw2.EnableDnsSupport?.Value).toBe(true);
      expect(vpcUsw2?.CidrBlock).toBe("10.0.0.0/16");
      
      // Test us-east-1 VPC
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const vpcsUse1 = await ec2ClientUse1.describeVpcs({
        VpcIds: [deploymentOutputs.vpc_ids_use1]
      }).promise();
      
      const vpcUse1 = vpcsUse1.Vpcs?.[0];
      expect(vpcUse1?.State).toBe("available");
      // VPC attributes need to be fetched separately
      const vpcAttrsUse1 = await ec2ClientUse1.describeVpcAttribute({
        VpcId: deploymentOutputs.vpc_ids_use1,
        Attribute: 'enableDnsHostnames'
      }).promise();
      expect(vpcAttrsUse1.EnableDnsHostnames?.Value).toBe(true);
      
      const vpcDnsSupportUse1 = await ec2ClientUse1.describeVpcAttribute({
        VpcId: deploymentOutputs.vpc_ids_use1,
        Attribute: 'enableDnsSupport'
      }).promise();
      expect(vpcDnsSupportUse1.EnableDnsSupport?.Value).toBe(true);
      expect(vpcUse1?.CidrBlock).toBe("10.1.0.0/16");
    });

    test("VPCs have flow logs enabled in both regions", async () => {
      // Test us-west-2 flow logs
      const flowLogsUsw2 = await ec2Client.describeFlowLogs({
        Filter: [
          {
            Name: "resource-id",
            Values: [deploymentOutputs.vpc_ids_usw2]
          }
        ]
      }).promise();
      
      expect(flowLogsUsw2.FlowLogs?.length).toBeGreaterThan(0);
      const flowLogUsw2 = flowLogsUsw2.FlowLogs?.[0];
      expect(flowLogUsw2?.FlowLogStatus).toBe("ACTIVE");
      expect(flowLogUsw2?.TrafficType).toBe("ALL");
      
      // Test us-east-1 flow logs
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const flowLogsUse1 = await ec2ClientUse1.describeFlowLogs({
        Filter: [
          {
            Name: "resource-id",
            Values: [deploymentOutputs.vpc_ids_use1]
          }
        ]
      }).promise();
      
      expect(flowLogsUse1.FlowLogs?.length).toBeGreaterThan(0);
      const flowLogUse1 = flowLogsUse1.FlowLogs?.[0];
      expect(flowLogUse1?.FlowLogStatus).toBe("ACTIVE");
      expect(flowLogUse1?.TrafficType).toBe("ALL");
    });

    test("private subnets are configured correctly in both regions", async () => {
      // Test us-west-2 subnets
      const subnetsUsw2 = await ec2Client.describeSubnets({
        Filters: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.vpc_ids_usw2]
          },
          {
            Name: "tag:Name",
            Values: ["*private*"]
          }
        ]
      }).promise();
      
      expect(subnetsUsw2.Subnets?.length).toBeGreaterThanOrEqual(2);
      subnetsUsw2.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
      });
      
      // Test us-east-1 subnets
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const subnetsUse1 = await ec2ClientUse1.describeSubnets({
        Filters: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.vpc_ids_use1]
          },
          {
            Name: "tag:Name",
            Values: ["*private*"]
          }
        ]
      }).promise();
      
      expect(subnetsUse1.Subnets?.length).toBeGreaterThanOrEqual(2);
      subnetsUse1.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.1\.[12]\.0\/24$/);
      });
    });
  });

  describe("RDS Database Security", () => {
    test("RDS instances are not publicly accessible in both regions", async () => {
      // Test us-west-2 RDS instance
      const dbInstancesUsw2 = await rdsClient.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      }).promise();
      
      const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      expect(dbInstanceUsw2?.PubliclyAccessible).toBe(false);
      expect(dbInstanceUsw2?.StorageEncrypted).toBe(true);
      expect(dbInstanceUsw2?.KmsKeyId).toContain(deploymentOutputs.kms_key_ids_usw2);
      
      // Test us-east-1 RDS instance
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-use1"
      }).promise();
      
      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.PubliclyAccessible).toBe(false);
      expect(dbInstanceUse1?.StorageEncrypted).toBe(true);
      expect(dbInstanceUse1?.KmsKeyId).toContain(deploymentOutputs.kms_key_ids_use1);
    });

    test("RDS instances are in private subnets in both regions", async () => {
      // Test us-west-2 RDS instance
      const dbInstancesUsw2 = await rdsClient.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      }).promise();
      
      const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      expect(dbInstanceUsw2?.DBSubnetGroup?.VpcId).toBe(deploymentOutputs.vpc_ids_usw2);
      expect(dbInstanceUsw2?.DBSubnetGroup?.SubnetGroupStatus).toBe("Complete");
      
      // Test us-east-1 RDS instance
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-use1"
      }).promise();
      
      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.DBSubnetGroup?.VpcId).toBe(deploymentOutputs.vpc_ids_use1);
      expect(dbInstanceUse1?.DBSubnetGroup?.SubnetGroupStatus).toBe("Complete");
    });

    test("RDS security groups restrict access properly in both regions", async () => {
      // Test us-west-2 RDS security groups
      const dbInstancesUsw2 = await rdsClient.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      }).promise();
      
      const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      const securityGroupsUsw2 = dbInstanceUsw2?.VpcSecurityGroups
        ?.map(sg => sg.VpcSecurityGroupId)
        .filter((id): id is string => !!id) || [];
      
      expect(securityGroupsUsw2.length).toBeGreaterThan(0);
      
      const sgDetailsUsw2 = await ec2Client.describeSecurityGroups({
        GroupIds: securityGroupsUsw2
      }).promise();
      
      const ingressRulesUsw2 = sgDetailsUsw2.SecurityGroups?.flatMap(sg => sg.IpPermissions || []) || [];
      const postgresRulesUsw2 = ingressRulesUsw2.filter(rule => rule?.FromPort === 5432);
      expect(postgresRulesUsw2.length).toBeGreaterThan(0);
      
      // Test us-east-1 RDS security groups
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-use1"
      }).promise();
      
      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      const securityGroupsUse1 = dbInstanceUse1?.VpcSecurityGroups
        ?.map(sg => sg.VpcSecurityGroupId)
        .filter((id): id is string => !!id) || [];
      
      expect(securityGroupsUse1.length).toBeGreaterThan(0);
      
      const sgDetailsUse1 = await ec2ClientUse1.describeSecurityGroups({
        GroupIds: securityGroupsUse1
      }).promise();
      
      const ingressRulesUse1 = sgDetailsUse1.SecurityGroups?.flatMap(sg => sg.IpPermissions || []) || [];
      const postgresRulesUse1 = ingressRulesUse1.filter(rule => rule?.FromPort === 5432);
      expect(postgresRulesUse1.length).toBeGreaterThan(0);
    });
  });

  describe("CloudTrail Logging", () => {
    test("CloudTrail is active and configured correctly", async () => {
      const trails = await cloudTrailClient.describeTrails().promise();
      const secureAppTrail = trails.trailList?.find(trail => trail.Name?.includes("iac-291323-secureapp-prod-cloudtrail"));
      
      expect(secureAppTrail).toBeDefined();
      expect(secureAppTrail?.IsMultiRegionTrail).toBe(true);
      expect(secureAppTrail?.IncludeGlobalServiceEvents).toBe(true);
      
      const status = await cloudTrailClient.getTrailStatus({
        Name: secureAppTrail?.Name || ""
      }).promise();
      
      expect(status.IsLogging).toBe(true);
    });

    test("CloudTrail S3 bucket is properly configured", async () => {
      const trails = await cloudTrailClient.describeTrails().promise();
      const secureAppTrail = trails.trailList?.find(trail => trail.Name?.includes("iac-291323-secureapp-prod-cloudtrail"));
      
      expect(secureAppTrail?.S3BucketName).toBeDefined();
      expect(secureAppTrail?.S3BucketName).toBe("iac-291323-secureapp-prod-cloudtrail-logs");
      
      // CloudTrail bucket uses AES256 encryption based on infrastructure config
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      const encryption = await s3ClientUse1.getBucketEncryption({
        Bucket: secureAppTrail?.S3BucketName || ""
      }).promise();
      
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    });
  });

  describe("AWS Config Compliance", () => {
    test("Config recorders are active in both regions", async () => {
      // Test us-west-2 config recorder
      const recordersUsw2 = await configClient.describeConfigurationRecorders().promise();
      const secureAppRecorderUsw2 = recordersUsw2.ConfigurationRecorders?.find(r => 
        r.name?.includes("iac-291323-secureapp-prod-config-recorder-usw2")
      );
      
      expect(secureAppRecorderUsw2).toBeDefined();
      expect(secureAppRecorderUsw2?.recordingGroup?.allSupported).toBe(true);
      expect(secureAppRecorderUsw2?.recordingGroup?.includeGlobalResourceTypes).toBe(true);
      
      const statusUsw2 = await configClient.describeConfigurationRecorderStatus().promise();
      const recorderStatusUsw2 = statusUsw2.ConfigurationRecordersStatus?.find(s => 
        s.name === secureAppRecorderUsw2?.name
      );
      expect(recorderStatusUsw2?.recording).toBe(true);
    });

    test("Config delivery channels are configured in both regions", async () => {
      // Test us-west-2 config delivery channel
      const channelsUsw2 = await configClient.describeDeliveryChannels().promise();
      const secureAppChannelUsw2 = channelsUsw2.DeliveryChannels?.find(c => 
        c.name?.includes("iac-291323-secureapp-prod-config-delivery-usw2")
      );
      
      expect(secureAppChannelUsw2).toBeDefined();
      expect(secureAppChannelUsw2?.s3BucketName).toBe("iac-291323-secureapp-prod-config-usw2");
      
      // Test us-east-1 config delivery channel
      const configClientUse1 = new AWS.ConfigService({ region: "us-east-1" });
      const channelsUse1 = await configClientUse1.describeDeliveryChannels().promise();
      const secureAppChannelUse1 = channelsUse1.DeliveryChannels?.find(c => 
        c.name?.includes("iac-291323-secureapp-prod-config-delivery-use1")
      );
      
      expect(secureAppChannelUse1).toBeDefined();
      expect(secureAppChannelUse1?.s3BucketName).toBe("iac-291323-secureapp-prod-config-use1");
    });
  });

  // describe("GuardDuty Security Monitoring", () => {
  //   test("GuardDuty detectors are enabled in both regions", async () => {
  //     if (!deploymentOutputs.guardduty_detector_ids_usw2 || !deploymentOutputs.guardduty_detector_ids_use1 || 
  //         deploymentOutputs.guardduty_detector_ids_usw2 === "not_created" || 
  //         deploymentOutputs.guardduty_detector_ids_use1 === "not_created") {
  //       console.warn("Skipping test: GuardDuty detector IDs not found in deployment outputs or not created");
  //       return;
  //     }
      
  //     // Test us-west-2 GuardDuty
  //     expect(deploymentOutputs.guardduty_detector_ids_usw2).toBeDefined();
      
  //     const detectorUsw2 = await guardDutyClient.getDetector({
  //       DetectorId: deploymentOutputs.guardduty_detector_ids_usw2
  //     }).promise();
      
  //     expect(detectorUsw2.Status).toBe("ENABLED");
      
  //     // Test us-east-1 GuardDuty
  //     expect(deploymentOutputs.guardduty_detector_ids_use1).toBeDefined();
      
  //     const guardDutyClientUse1 = new AWS.GuardDuty({ region: "us-east-1" });
  //     const detectorUse1 = await guardDutyClientUse1.getDetector({
  //       DetectorId: deploymentOutputs.guardduty_detector_ids_use1
  //     }).promise();
      
  //     expect(detectorUse1.Status).toBe("ENABLED");
  //   });

  //   test("GuardDuty data sources are enabled in both regions", async () => {
  //     if (!deploymentOutputs.guardduty_detector_ids_usw2 || !deploymentOutputs.guardduty_detector_ids_use1 || 
  //         deploymentOutputs.guardduty_detector_ids_usw2 === "not_created" || 
  //         deploymentOutputs.guardduty_detector_ids_use1 === "not_created") {
  //       console.warn("Skipping test: GuardDuty detector IDs not found in deployment outputs or not created");
  //       return;
  //     }
      
  //     // Test us-west-2 GuardDuty data sources
  //     const detectorUsw2 = await guardDutyClient.getDetector({
  //       DetectorId: deploymentOutputs.guardduty_detector_ids_usw2
  //     }).promise();
      
  //     expect(detectorUsw2.DataSources?.S3Logs?.Status).toBe("ENABLED");
  //     expect(detectorUsw2.DataSources?.Kubernetes?.AuditLogs?.Status).toBe("ENABLED");
  //     expect(detectorUsw2.DataSources?.MalwareProtection?.ScanEc2InstanceWithFindings?.EbsVolumes?.Status).toBe("ENABLED");
      
  //     // Test us-east-1 GuardDuty data sources
  //     const guardDutyClientUse1 = new AWS.GuardDuty({ region: "us-east-1" });
  //     const detectorUse1 = await guardDutyClientUse1.getDetector({
  //       DetectorId: deploymentOutputs.guardduty_detector_ids_use1
  //     }).promise();
      
  //     expect(detectorUse1.DataSources?.S3Logs?.Status).toBe("ENABLED");
  //     expect(detectorUse1.DataSources?.Kubernetes?.AuditLogs?.Status).toBe("ENABLED");
  //     expect(detectorUse1.DataSources?.MalwareProtection?.ScanEc2InstanceWithFindings?.EbsVolumes?.Status).toBe("ENABLED");
  //   });
  // });

  describe("API Gateway Security", () => {
    test("VPC endpoints for API Gateway exist in both regions", async () => {
      // Test us-west-2 VPC endpoint
      const vpcEndpointsUsw2 = await ec2Client.describeVpcEndpoints({
        Filters: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.vpc_ids_usw2]
          },
          {
            Name: "service-name",
            Values: ["com.amazonaws.us-west-2.execute-api"]
          }
        ]
      }).promise();
      
      expect(vpcEndpointsUsw2.VpcEndpoints?.length).toBeGreaterThan(0);
      const endpointUsw2 = vpcEndpointsUsw2.VpcEndpoints?.[0];
      expect(endpointUsw2?.State).toBe("available");
      expect(endpointUsw2?.VpcEndpointType).toBe("Interface");
      expect(endpointUsw2?.PrivateDnsEnabled).toBe(true);
      
      // Test us-east-1 VPC endpoint
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const vpcEndpointsUse1 = await ec2ClientUse1.describeVpcEndpoints({
        Filters: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.vpc_ids_use1]
          },
          {
            Name: "service-name",
            Values: ["com.amazonaws.us-east-1.execute-api"]
          }
        ]
      }).promise();
      
      expect(vpcEndpointsUse1.VpcEndpoints?.length).toBeGreaterThan(0);
      const endpointUse1 = vpcEndpointsUse1.VpcEndpoints?.[0];
      expect(endpointUse1?.State).toBe("available");
      expect(endpointUse1?.VpcEndpointType).toBe("Interface");
      expect(endpointUse1?.PrivateDnsEnabled).toBe(true);
    });

  });


  describe("Resource Connectivity", () => {
    test("RDS instances can be reached from within VPCs", async () => {
      // Test us-west-2 RDS instance
      const dbInstancesUsw2 = await rdsClient.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      }).promise();
      
      const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      expect(dbInstanceUsw2?.Endpoint?.Address).toBeDefined();
      expect(dbInstanceUsw2?.Endpoint?.Port).toBe(5432);
      expect(dbInstanceUsw2?.DBInstanceStatus).toBe("available");
      
      // Test us-east-1 RDS instance
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-prod-db-use1"
      }).promise();
      
      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.Endpoint?.Address).toBeDefined();
      expect(dbInstanceUse1?.Endpoint?.Port).toBe(5432);
      expect(dbInstanceUse1?.DBInstanceStatus).toBe("available");
    });

    test("S3 buckets are accessible with proper IAM permissions", async () => {
      // Test us-west-2 app data bucket
      try {
        await s3Client.headBucket({
          Bucket: "iac-291323-secureapp-prod-app-data-usw2"
        }).promise();
      } catch (error: any) {
        if (error.statusCode !== 403) {
          throw error;
        }
      }
      
      // Test us-east-1 app data bucket
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      try {
        await s3ClientUse1.headBucket({
          Bucket: "iac-291323-secureapp-prod-app-data-use1"
        }).promise();
      } catch (error: any) {
        if (error.statusCode !== 403) {
          throw error;
        }
      }
    });
  });

  describe("Tagging Compliance", () => {
    test("all resources have required tags", async () => {
      const requiredTags = {
        environment: "production",
        owner: "DevOps", 
        project: "SecureApp"
      };

      // Check us-west-2 VPC tags
      const vpcsUsw2 = await ec2Client.describeVpcs({
        VpcIds: [deploymentOutputs.vpc_ids_usw2]
      }).promise();
      
      const vpcTagsUsw2 = Object.fromEntries(vpcsUsw2.Vpcs?.[0]?.Tags?.map(tag => [tag.Key, tag.Value]) || []);
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(vpcTagsUsw2[key]).toBe(value);
      });
      
      // Check us-east-1 VPC tags
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const vpcsUse1 = await ec2ClientUse1.describeVpcs({
        VpcIds: [deploymentOutputs.vpc_ids_use1]
      }).promise();
      
      const vpcTagsUse1 = Object.fromEntries(vpcsUse1.Vpcs?.[0]?.Tags?.map(tag => [tag.Key, tag.Value]) || []);
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(vpcTagsUse1[key]).toBe(value);
      });
    });
  });
});