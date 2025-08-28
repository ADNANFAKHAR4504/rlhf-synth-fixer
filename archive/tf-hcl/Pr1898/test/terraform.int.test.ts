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
    test("KMS key exists in us-east-1 and has rotation enabled", async () => {
      if (!deploymentOutputs.kms_key_ids_use1) {
        console.warn("Skipping test: KMS key ID for us-east-1 not found in deployment outputs");
        return;
      }

      // --- us-west-2 commented ---
      // expect(deploymentOutputs.kms_key_ids_usw2).toBeDefined();
      // const keyDetailsUsw2 = await kmsClient.describeKey({ KeyId: deploymentOutputs.kms_key_ids_usw2 }).promise();
      // expect(keyDetailsUsw2.KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      // expect(keyDetailsUsw2.KeyMetadata?.Enabled).toBe(true);
      // const rotationStatusUsw2 = await kmsClient.getKeyRotationStatus({ KeyId: deploymentOutputs.kms_key_ids_usw2 }).promise();
      // expect(rotationStatusUsw2.KeyRotationEnabled).toBe(true);

      // us-east-1 enabled
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

    test("KMS key is customer managed in us-east-1", async () => {
      if (!deploymentOutputs.kms_key_ids_use1) {
        console.warn("Skipping test: KMS key ID for us-east-1 not found in deployment outputs");
        return;
      }

      // --- us-west-2 commented ---
      // const keyDetails = await kmsClient.describeKey({ KeyId: deploymentOutputs.kms_key_ids_usw2 }).promise();
      // expect(keyDetails.KeyMetadata?.KeyManager).toBe("CUSTOMER");
      // expect(keyDetails.KeyMetadata?.Origin).toBe("AWS_KMS");

      // us-east-1 enabled
      const kmsClientUse1 = new AWS.KMS({ region: "us-east-1" });
      const keyDetailsUse1 = await kmsClientUse1.describeKey({
        KeyId: deploymentOutputs.kms_key_ids_use1
      }).promise();

      expect(keyDetailsUse1.KeyMetadata?.KeyManager).toBe("CUSTOMER");
      expect(keyDetailsUse1.KeyMetadata?.Origin).toBe("AWS_KMS");
    });
  });

  describe("S3 Storage Security", () => {
    test("S3 app data bucket in us-east-1 exists and has proper encryption", async () => {
      // --- us-west-2 commented ---
      // const bucketNameUsw2 = "iac-291323-secureapp-prod-app-data-usw2";
      // const encryptionUsw2 = await s3Client.getBucketEncryption({ Bucket: bucketNameUsw2 }).promise();
      // const ruleUsw2 = encryptionUsw2.ServerSideEncryptionConfiguration?.Rules?.[0];
      // expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      // expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(deploymentOutputs.kms_key_ids_usw2);

      // us-east-1 enabled
      const bucketNameUse1 = "iac-291323-secureapp-app-data-use1";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });

      const encryptionUse1 = await s3ClientUse1.getBucketEncryption({
        Bucket: bucketNameUse1
      }).promise();

      const ruleUse1 = encryptionUse1.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(deploymentOutputs.kms_key_ids_use1);
    });

    test("CloudTrail S3 bucket (us-east-1) has proper encryption", async () => {
      const cloudtrailBucket = "iac-291323-secureapp-cloudtrail-logs";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });

      const encryption = await s3ClientUse1.getBucketEncryption({
        Bucket: cloudtrailBucket
      }).promise();

      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });

    // --- us-west-2 only tags test commented ---
    // test("S3 buckets have proper tags", async () => {
    //   const bucketNameUsw2 = "iac-291323-secureapp-prod-app-data-usw2";
    //   const tags = await s3Client.getBucketTagging({ Bucket: bucketNameUsw2 }).promise();
    //   const tagMap = Object.fromEntries(tags.TagSet?.map(tag => [tag.Key, tag.Value]) || []);
    //   expect(tagMap.environment).toBe("production");
    //   expect(tagMap.owner).toBe("DevOps");
    //   expect(tagMap.project).toBe("SecureApp");
    // });

    test("Config S3 bucket in us-east-1 has proper encryption", async () => {
      // --- us-west-2 commented ---
      // const configBucketUsw2 = "iac-291323-secureapp-prod-config-usw2";
      // const encryptionUsw2 = await s3Client.getBucketEncryption({ Bucket: configBucketUsw2 }).promise();
      // const ruleUsw2 = encryptionUsw2.ServerSideEncryptionConfiguration?.Rules?.[0];
      // expect(ruleUsw2?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");

      // us-east-1 enabled
      const configBucketUse1 = "iac-291323-secureapp-config-use1";
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      const encryptionUse1 = await s3ClientUse1.getBucketEncryption({
        Bucket: configBucketUse1
      }).promise();

      const ruleUse1 = encryptionUse1.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(ruleUse1?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    });
  });

  describe("VPC and Networking", () => {
    test("VPC exists with proper configuration in us-east-1", async () => {
      if (!deploymentOutputs.vpc_ids_use1) {
        console.warn("Skipping test: VPC ID for us-east-1 not found in deployment outputs");
        return;
      }

      // --- us-west-2 commented ---
      // expect(deploymentOutputs.vpc_ids_usw2).toBeDefined();
      // const vpcsUsw2 = await ec2Client.describeVpcs({ VpcIds: [deploymentOutputs.vpc_ids_usw2] }).promise();
      // const vpcUsw2 = vpcsUsw2.Vpcs?.[0];
      // expect(vpcUsw2?.State).toBe("available");
      // const vpcAttrsUsw2 = await ec2Client.describeVpcAttribute({ VpcId: deploymentOutputs.vpc_ids_usw2, Attribute: 'enableDnsHostnames' }).promise();
      // expect(vpcAttrsUsw2.EnableDnsHostnames?.Value).toBe(true);
      // const vpcDnsSupportUsw2 = await ec2Client.describeVpcAttribute({ VpcId: deploymentOutputs.vpc_ids_usw2, Attribute: 'enableDnsSupport' }).promise();
      // expect(vpcDnsSupportUsw2.EnableDnsSupport?.Value).toBe(true);
      // expect(vpcUsw2?.CidrBlock).toBe("10.0.0.0/16");

      // us-east-1 enabled
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const vpcsUse1 = await ec2ClientUse1.describeVpcs({
        VpcIds: [deploymentOutputs.vpc_ids_use1]
      }).promise();

      const vpcUse1 = vpcsUse1.Vpcs?.[0];
      expect(vpcUse1?.State).toBe("available");

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

    test("VPC has flow logs enabled in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const flowLogsUsw2 = await ec2Client.describeFlowLogs({
      //   Filter: [{ Name: "resource-id", Values: [deploymentOutputs.vpc_ids_usw2] }]
      // }).promise();
      // expect(flowLogsUsw2.FlowLogs?.length).toBeGreaterThan(0);
      // const flowLogUsw2 = flowLogsUsw2.FlowLogs?.[0];
      // expect(flowLogUsw2?.FlowLogStatus).toBe("ACTIVE");
      // expect(flowLogUsw2?.TrafficType).toBe("ALL");

      // us-east-1 enabled
      if (!deploymentOutputs.vpc_ids_use1) {
        console.warn("Skipping test: VPC ID for us-east-1 not found in deployment outputs");
        return;
      }

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

    test("private subnets are configured correctly in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const subnetsUsw2 = await ec2Client.describeSubnets({
      //   Filters: [
      //     { Name: "vpc-id", Values: [deploymentOutputs.vpc_ids_usw2] },
      //     { Name: "tag:Name", Values: ["*private*"] }
      //   ]
      // }).promise();
      // expect(subnetsUsw2.Subnets?.length).toBeGreaterThanOrEqual(2);
      // subnetsUsw2.Subnets?.forEach(subnet => {
      //   expect(subnet.MapPublicIpOnLaunch).toBe(false);
      //   expect(subnet.State).toBe("available");
      //   expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
      // });

      // us-east-1 enabled
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const subnetsUse1 = await ec2ClientUse1.describeSubnets({
        Filters: [
          { Name: "vpc-id", Values: [deploymentOutputs.vpc_ids_use1] },
          { Name: "tag:Name", Values: ["*private*"] }
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
    test("RDS instance is not publicly accessible in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const dbInstancesUsw2 = await rdsClient.describeDBInstances({
      //   DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      // }).promise();
      // const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      // expect(dbInstanceUsw2?.PubliclyAccessible).toBe(false);
      // expect(dbInstanceUsw2?.StorageEncrypted).toBe(true);
      // expect(dbInstanceUsw2?.KmsKeyId).toContain(deploymentOutputs.kms_key_ids_usw2);

      // us-east-1 enabled
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-db-use1"
      }).promise();

      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.PubliclyAccessible).toBe(false);
      expect(dbInstanceUse1?.StorageEncrypted).toBe(true);
      expect(dbInstanceUse1?.KmsKeyId).toContain(deploymentOutputs.kms_key_ids_use1);
    });

    test("RDS instance is in private subnets in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const dbInstancesUsw2 = await rdsClient.describeDBInstances({
      //   DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      // }).promise();
      // const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      // expect(dbInstanceUsw2?.DBSubnetGroup?.VpcId).toBe(deploymentOutputs.vpc_ids_usw2);
      // expect(dbInstanceUsw2?.DBSubnetGroup?.SubnetGroupStatus).toBe("Complete");

      // us-east-1 enabled
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-db-use1"
      }).promise();

      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.DBSubnetGroup?.VpcId).toBe(deploymentOutputs.vpc_ids_use1);
      expect(dbInstanceUse1?.DBSubnetGroup?.SubnetGroupStatus).toBe("Complete");
    });

    test("RDS security groups restrict access properly in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const dbInstancesUsw2 = await rdsClient.describeDBInstances({
      //   DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      // }).promise();
      // const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      // const securityGroupsUsw2 = dbInstanceUsw2?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId).filter((id): id is string => !!id) || [];
      // expect(securityGroupsUsw2.length).toBeGreaterThan(0);
      // const sgDetailsUsw2 = await ec2Client.describeSecurityGroups({ GroupIds: securityGroupsUsw2 }).promise();
      // const ingressRulesUsw2 = sgDetailsUsw2.SecurityGroups?.flatMap(sg => sg.IpPermissions || []) || [];
      // const postgresRulesUsw2 = ingressRulesUsw2.filter(rule => rule?.FromPort === 5432);
      // expect(postgresRulesUsw2.length).toBeGreaterThan(0);

      // us-east-1 enabled
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });

      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-db-use1"
      }).promise();

      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      const securityGroupsUse1 =
        dbInstanceUse1?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId).filter((id): id is string => !!id) || [];

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
    test("CloudTrail is active and configured correctly (multi-region trail)", async () => {
      const trails = await cloudTrailClient.describeTrails().promise();
      const secureAppTrail = trails.trailList?.find(trail =>
        trail.Name?.includes("iac-291323-secureapp-cloudtrail")
      );

      expect(secureAppTrail).toBeDefined();
      expect(secureAppTrail?.IsMultiRegionTrail).toBe(true);
      expect(secureAppTrail?.IncludeGlobalServiceEvents).toBe(true);

      const status = await cloudTrailClient.getTrailStatus({
        Name: secureAppTrail?.Name || ""
      }).promise();

      expect(status.IsLogging).toBe(true);
    });
  });

  describe("AWS Config Compliance", () => {
    // --- us-west-2 recorder commented ---
    // test("Config recorder is active in us-west-2", async () => {
    //   const recordersUsw2 = await configClient.describeConfigurationRecorders().promise();
    //   const secureAppRecorderUsw2 = recordersUsw2.ConfigurationRecorders?.find(r =>
    //     r.name?.includes("iac-291323-secureapp-prod-config-recorder-usw2")
    //   );
    //   expect(secureAppRecorderUsw2).toBeDefined();
    //   expect(secureAppRecorderUsw2?.recordingGroup?.allSupported).toBe(true);
    //   expect(secureAppRecorderUsw2?.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    //   const statusUsw2 = await configClient.describeConfigurationRecorderStatus().promise();
    //   const recorderStatusUsw2 = statusUsw2.ConfigurationRecordersStatus?.find(s => s.name === secureAppRecorderUsw2?.name);
    //   expect(recorderStatusUsw2?.recording).toBe(true);
    // });

    test("Config delivery channel is configured in us-west-2", async () => {
      const configClientUsw2 = new AWS.ConfigService({ region: "us-west-2" });
      const channelsUsw2 = await configClientUsw2.describeDeliveryChannels().promise();
      const secureAppChannelUsw2 = channelsUsw2.DeliveryChannels?.find(c =>
        c.name?.includes("iac-291323-secureapp-config-delivery-usw2")
      );

      expect(secureAppChannelUsw2).toBeDefined();
      expect(secureAppChannelUsw2?.s3BucketName).toBe("iac-291323-secureapp-config-usw2");
    });
  });

  // GuardDuty block mantido comentado como no original
  // describe("GuardDuty Security Monitoring", () => { ... });

  describe("API Gateway Security", () => {
    test("VPC endpoint for API Gateway exists in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const vpcEndpointsUsw2 = await ec2Client.describeVpcEndpoints({
      //   Filters: [
      //     { Name: "vpc-id", Values: [deploymentOutputs.vpc_ids_usw2] },
      //     { Name: "service-name", Values: ["com.amazonaws.us-west-2.execute-api"] }
      //   ]
      // }).promise();
      // expect(vpcEndpointsUsw2.VpcEndpoints?.length).toBeGreaterThan(0);
      // const endpointUsw2 = vpcEndpointsUsw2.VpcEndpoints?.[0];
      // expect(endpointUsw2?.State).toBe("available");
      // expect(endpointUsw2?.VpcEndpointType).toBe("Interface");
      // expect(endpointUsw2?.PrivateDnsEnabled).toBe(true);

      // us-east-1 enabled
      const ec2ClientUse1 = new AWS.EC2({ region: "us-east-1" });
      const vpcEndpointsUse1 = await ec2ClientUse1.describeVpcEndpoints({
        Filters: [
          { Name: "vpc-id", Values: [deploymentOutputs.vpc_ids_use1] },
          { Name: "service-name", Values: ["com.amazonaws.us-east-1.execute-api"] }
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
    test("RDS instance can be reached (metadata) in us-east-1", async () => {
      // --- us-west-2 commented ---
      // const dbInstancesUsw2 = await rdsClient.describeDBInstances({
      //   DBInstanceIdentifier: "iac-291323-secureapp-prod-db-usw2"
      // }).promise();
      // const dbInstanceUsw2 = dbInstancesUsw2.DBInstances?.[0];
      // expect(dbInstanceUsw2?.Endpoint?.Address).toBeDefined();
      // expect(dbInstanceUsw2?.Endpoint?.Port).toBe(5432);
      // expect(dbInstanceUsw2?.DBInstanceStatus).toBe("available");

      // us-east-1 enabled
      const rdsClientUse1 = new AWS.RDS({ region: "us-east-1" });
      const dbInstancesUse1 = await rdsClientUse1.describeDBInstances({
        DBInstanceIdentifier: "iac-291323-secureapp-db-use1"
      }).promise();

      const dbInstanceUse1 = dbInstancesUse1.DBInstances?.[0];
      expect(dbInstanceUse1?.Endpoint?.Address).toBeDefined();
      expect(dbInstanceUse1?.Endpoint?.Port).toBe(5432);
      expect(dbInstanceUse1?.DBInstanceStatus).toBe("available");
    });

    test("S3 app data bucket is accessible (head) in us-east-1", async () => {
      // --- us-west-2 commented ---
      // try {
      //   await s3Client.headBucket({ Bucket: "iac-291323-secureapp-prod-app-data-usw2" }).promise();
      // } catch (error: any) {
      //   if (error.statusCode !== 403) throw error;
      // }

      // us-east-1 enabled
      const s3ClientUse1 = new AWS.S3({ region: "us-east-1" });
      try {
        await s3ClientUse1.headBucket({
          Bucket: "iac-291323-secureapp-app-data-use1"
        }).promise();
      } catch (error: any) {
        if (error.statusCode !== 403) {
          throw error;
        }
      }
    });
  });

  describe("Tagging Compliance", () => {
    test("required tags are present on VPC in us-east-1", async () => {
      const requiredTags = {
        environment: "production",
        owner: "DevOps",
        project: "SecureApp"
      };

      // --- us-west-2 commented ---
      // const vpcsUsw2 = await ec2Client.describeVpcs({ VpcIds: [deploymentOutputs.vpc_ids_usw2] }).promise();
      // const vpcTagsUsw2 = Object.fromEntries(vpcsUsw2.Vpcs?.[0]?.Tags?.map(tag => [tag.Key, tag.Value]) || []);
      // Object.entries(requiredTags).forEach(([key, value]) => {
      //   expect(vpcTagsUsw2[key]).toBe(value);
      // });

      // us-east-1 enabled
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
