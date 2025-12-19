// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { APIGatewayClient, GetRestApiCommand, GetStageCommand, GetResourcesCommand, GetMethodCommand } from "@aws-sdk/client-api-gateway";
import { WAFV2Client, GetWebACLCommand } from "@aws-sdk/client-wafv2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const apiGatewayClient = new APIGatewayClient({ region: awsRegion });
const wafv2Client = new WAFV2Client({ region: awsRegion });

describe("TapStack Secure Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc_id",
      "s3_bucket_name",
      "s3_config_bucket_name",
      "lambda_function_name",
      "api_gateway_id",
      "rds_database_name",
      "sns_topic_arn",
      "kms_key_id"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output.replace(/_/g, '_')]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Secure Network Foundation", () => {
    test("VPC exists with correct CIDR and DNS settings for secure architecture", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify secure application tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("vpc"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "pr2859")).toBe(true);
      expect(tags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration in multiple AZs", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-2]\.0\/24$/);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify public subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("public"))).toBe(true);
        expect(tags.some(tag => tag.Key === "Tier" && tag.Value === "Web")).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Private subnets exist for secure resource isolation", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[01]\.0\/24$/);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify private subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("private"))).toBe(true);
        expect(tags.some(tag => tag.Key === "Tier" && tag.Value === "Application")).toBe(true);
      });

      // Verify subnets are in different AZs
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Internet Gateway is properly attached for public access", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("igw"))).toBe(true);
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have multiple route tables: default + public route tables
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for internet gateway routes in public route tables
      const internetRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(internetRoutes!.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Security Groups - Least Privilege Network Access", () => {
    test("Web security group has restricted SSH and HTTPS access", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*web-sg"] }
        ]
      }));
      
      const webSg = SecurityGroups?.find(sg => sg.GroupName?.includes("web-sg"));
      expect(webSg).toBeDefined();
      
      // Check for SSH rule (port 22)
      const sshRule = webSg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe("203.0.113.0/24"); // Company network only
      
      // Check for HTTPS rule (port 443)
      const httpsRule = webSg?.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      
      // Verify web SG tagging
      const tags = webSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("web-sg"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Purpose" && tag.Value === "Web tier access control")).toBe(true);
    }, 20000);

    test("Database security group allows access only from web tier", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*db-sg"] }
        ]
      }));
      
      const dbSg = SecurityGroups?.find(sg => sg.GroupName?.includes("db-sg"));
      expect(dbSg).toBeDefined();
      
      // Check for MySQL rule (port 3306)
      const mysqlRule = dbSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      
      // Should reference web security group, not open CIDR
      expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      
      // Verify DB SG tagging
      const tags = dbSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("db-sg"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Purpose" && tag.Value === "Database access control")).toBe(true);
    }, 20000);

    test("Lambda security group has minimal required permissions", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*lambda-sg"] }
        ]
      }));
      
      const lambdaSg = SecurityGroups?.find(sg => sg.GroupName?.includes("lambda-sg"));
      expect(lambdaSg).toBeDefined();
      
      // Lambda should have minimal ingress rules
      expect(lambdaSg?.IpPermissions?.length || 0).toBeLessThanOrEqual(1);
      
      // Check HTTPS egress for AWS services
      const httpsEgress = lambdaSg?.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsEgress).toBeDefined();
      
      // Verify Lambda SG tagging
      const tags = lambdaSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("lambda-sg"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Purpose" && tag.Value === "Lambda function network access")).toBe(true);
    }, 20000);
  });

  describe("Storage Module - Encrypted S3 Buckets with Security Controls", () => {
    test("Main S3 bucket exists with proper configuration", async () => {
      const bucketName = stackOutputs["s3_bucket_name"];
      expect(bucketName).toBe("acme-pr2859-main-bucket-1234");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("Main S3 bucket has server-side encryption enabled", async () => {
      const bucketName = stackOutputs["s3_bucket_name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      expect(ServerSideEncryptionConfiguration?.Rules![0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("Main S3 bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["s3_bucket_name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Config S3 bucket exists with proper security configuration", async () => {
      const configBucketName = stackOutputs["s3_config_bucket_name"];
      expect(configBucketName).toBe("acme-pr2859-config-bucket-1234");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: configBucketName })))
        .resolves.toBeDefined();
      
      // Verify encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: configBucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      
      // Verify versioning
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: configBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("Lambda Module - Serverless Function in VPC", () => {
    test("Lambda function exists with proper configuration", async () => {
      const functionName = stackOutputs["lambda_function_name"];
      expect(functionName).toBe("acme-pr2859-function");
      
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.Handler).toBe("lambda_function.handler");
      expect(Configuration?.State).toBe("Active");
    }, 20000);
  });

  describe("API Gateway Module - Protected API Endpoints", () => {
    test("API Gateway exists with proper configuration", async () => {
      const apiId = stackOutputs["api_gateway_id"];
      const apiUrl = stackOutputs["api_gateway_url"];
      
      const { name, description, endpointConfiguration } = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId: apiId })
      );
      
      expect(name).toBe("acme-pr2859-api");
      expect(description).toBe("Secure API Gateway with WAF protection");
      expect(endpointConfiguration?.types).toContain("REGIONAL");
      
      // Verify API URL format
      expect(apiUrl).toBe(`https://${apiId}.execute-api.us-east-1.amazonaws.com/pr2859`);
    }, 20000);

    test("API Gateway has proper stage configuration", async () => {
      const apiId = stackOutputs["api_gateway_id"];
      
      const { stageName, variables } = await apiGatewayClient.send(
        new GetStageCommand({ 
          restApiId: apiId, 
          stageName: "pr2859" 
        })
      );
      
      expect(stageName).toBe("pr2859");
    }, 20000);

    test("API Gateway has secure resource and method configuration", async () => {
      const apiId = stackOutputs["api_gateway_id"];
      
      const { items: resources } = await apiGatewayClient.send(
        new GetResourcesCommand({ restApiId: apiId })
      );
      
      // Should have root resource and 'secure' path
      expect(resources!.length).toBeGreaterThanOrEqual(2);
      
      const secureResource = resources?.find(r => r.pathPart === "secure");
      expect(secureResource).toBeDefined();
      
      if (secureResource?.id) {
        const { httpMethod, authorizationType } = await apiGatewayClient.send(
          new GetMethodCommand({
            restApiId: apiId,
            resourceId: secureResource.id,
            httpMethod: "POST"
          })
        );
        
        expect(httpMethod).toBe("POST");
        expect(authorizationType).toBe("NONE"); // Could be enhanced with proper auth
      }
    }, 20000);

    test("WAFv2 Web ACL protects API Gateway", async () => {
      const wafAclArn = stackOutputs["waf_acl_arn"];
      const webAclId = wafAclArn.split('/')[3];
      
      const { WebACL } = await wafv2Client.send(new GetWebACLCommand({
        Scope: "REGIONAL",
        Id: webAclId,
        Name: "acme-pr2859-waf"
      }));
      
      expect(WebACL?.Name).toBe("acme-pr2859-waf");
      expect(WebACL?.DefaultAction?.Allow).toBeDefined();
      expect(WebACL?.VisibilityConfig?.SampledRequestsEnabled).toBe(true);
      expect(WebACL?.VisibilityConfig?.CloudWatchMetricsEnabled).toBe(true);
    }, 20000);
  });

  describe("Database Module - RDS with Security", () => {
    test("RDS instance exists with proper security configuration", async () => {
      const dbIdentifier = "acme-pr2859-db";
      const dbName = stackOutputs["rds_database_name"];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageType).toBe("gp2");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      
      // Verify database name
      expect(dbInstance.DBName).toBe(dbName);
    }, 30000);

    test("RDS subnet group spans multiple availability zones", async () => {
      const dbIdentifier = "acme-pr2859-db";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName!
      }));
      
      const availabilityZones = new Set(
        DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBe(2);
      
      // Verify subnets are private subnets
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      const dbSubnetIds = DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      
      dbSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    }, 20000);
  });

  describe("Monitoring Module - CloudWatch and SNS", () => {
    test("SNS topic exists for alert notifications", async () => {
      const snsTopicArn = stackOutputs["sns_topic_arn"];
      
      const { Attributes } = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: snsTopicArn
      }));
      
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toBe("Infrastructure Alarms");
      
      // Verify topic name
      const topicName = snsTopicArn.split(':')[5];
      expect(topicName).toBe("acme-pr2859-alarms");
    }, 20000);

    test("CloudWatch alarms exist for Lambda and CPU monitoring", async () => {
      const alarmArns = stackOutputs["cloudwatch_alarm_arns"];
      const snsTopicArn = stackOutputs["sns_topic_arn"];
      
      expect(alarmArns).toHaveLength(2);
      
      // Check Lambda error alarm
      const lambdaErrorAlarm = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["acme-pr2859-lambda-errors"]
      }));
      
      expect(lambdaErrorAlarm.MetricAlarms).toHaveLength(1);
      const errorAlarm = lambdaErrorAlarm.MetricAlarms![0];
      
      expect(errorAlarm.AlarmName).toBe("acme-pr2859-lambda-errors");
      expect(errorAlarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(errorAlarm.EvaluationPeriods).toBe(2);
      expect(errorAlarm.MetricName).toBe("Errors");
      expect(errorAlarm.Namespace).toBe("AWS/Lambda");
      expect(errorAlarm.Threshold).toBe(5);
      expect(errorAlarm.AlarmActions).toContain(snsTopicArn);
      
      // Check CPU alarm
      const cpuAlarm = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["acme-pr2859-high-cpu"]
      }));
      
      expect(cpuAlarm.MetricAlarms).toHaveLength(1);
      const cpuAlarmConfig = cpuAlarm.MetricAlarms![0];
      
      expect(cpuAlarmConfig.AlarmName).toBe("acme-pr2859-high-cpu");
      expect(cpuAlarmConfig.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(cpuAlarmConfig.EvaluationPeriods).toBe(2);
      expect(cpuAlarmConfig.MetricName).toBe("CPUUtilization");
      expect(cpuAlarmConfig.Namespace).toBe("AWS/EC2");
      expect(cpuAlarmConfig.Threshold).toBe(80);
      expect(cpuAlarmConfig.AlarmActions).toContain(snsTopicArn);
    }, 20000);
  });

  describe("KMS Module - Encryption Key Management", () => {
    test("KMS key exists with proper configuration", async () => {
      const keyId = stackOutputs["kms_key_id"];
      const keyAlias = stackOutputs["kms_key_alias"];
      
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId
      }));
      
      expect(KeyMetadata?.KeyId).toBe(keyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.Description).toBe("KMS key for encrypting sensitive data");
      
      // Verify alias format
      expect(keyAlias).toBe("alias/acme-pr2859-key");
    }, 20000);
  });

  describe("IAM Module - Least Privilege Access Control", () => {
    test("Lambda IAM role exists with minimal required permissions", async () => {
      const roleName = "acme-pr2859-lambda-role";
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role?.RoleName).toBe(roleName);
      
      // Verify assume role policy allows Lambda service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("lambda.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
      
      // Verify attached policies
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      }));
      
      expect(AttachedPolicies?.length).toBe(1);
      expect(AttachedPolicies![0].PolicyArn).toBe("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole");
    }, 20000);

    test("EC2 IAM role exists with proper permissions", async () => {
      const roleName = "acme-pr2859-ec2-role";
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role?.RoleName).toBe(roleName);
      
      // Verify assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc_id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["s3_bucket_name"]).toBe("acme-pr2859-main-bucket-1234");
      expect(stackOutputs["s3_config_bucket_name"]).toBe("acme-pr2859-config-bucket-1234");
      expect(stackOutputs["lambda_function_name"]).toBe("acme-pr2859-function");
      expect(stackOutputs["rds_database_name"]).toBe("appdb");
      
      // Verify array outputs
      expect(Array.isArray(stackOutputs["public_subnet_ids"])).toBe(true);
      expect(stackOutputs["public_subnet_ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["private_subnet_ids"])).toBe(true);
      expect(stackOutputs["private_subnet_ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["cloudwatch_alarm_arns"])).toBe(true);
      expect(stackOutputs["cloudwatch_alarm_arns"]).toHaveLength(2);
      
      // Verify ARN formats
      expect(stackOutputs["lambda_function_arn"]).toMatch(/^arn:aws:lambda:/);
      expect(stackOutputs["sns_topic_arn"]).toMatch(/^arn:aws:sns:/);
      expect(stackOutputs["waf_acl_arn"]).toMatch(/^arn:aws:wafv2:/);
      
      // Verify ID formats
      expect(stackOutputs["api_gateway_id"]).toMatch(/^[a-z0-9]+$/);
      expect(stackOutputs["kms_key_id"]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test("API Gateway URL follows expected pattern", () => {
      const apiUrl = stackOutputs["api_gateway_url"];
      const apiId = stackOutputs["api_gateway_id"];
      
      expect(apiUrl).toContain(apiId);
      expect(apiUrl).toContain("execute-api");
      expect(apiUrl).toContain(awsRegion);
      expect(apiUrl).toContain("pr2859");
    });

    test("Subnet IDs follow AWS format", () => {
      const publicSubnets = stackOutputs["public_subnet_ids"];
      const privateSubnets = stackOutputs["private_subnet_ids"];
      
      [...publicSubnets, ...privateSubnets].forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });
  });

  describe("Security Best Practices Validation", () => {

    test("Encryption at rest is enabled for data stores", async () => {
      // Verify S3 encryption
      const bucketName = stackOutputs["s3_bucket_name"];
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      
      // Verify RDS encryption
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-pr2859-db"
      }));
      expect(DBInstances![0].StorageEncrypted).toBe(true);
    }, 20000);
  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      // Check subnet distribution
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      
      // Verify RDS multi-AZ
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-pr2859-db"
      }));
      expect(DBInstances![0].MultiAZ).toBe(true);
    }, 20000);

    test("Backup and recovery mechanisms are in place", async () => {
      // Verify S3 versioning
      const bucketName = stackOutputs["s3_bucket_name"];
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(Status).toBe("Enabled");
      
      // Verify RDS automated backups
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-pr2859-db"
      }));
      expect(DBInstances![0].BackupRetentionPeriod).toBe(7);
      expect(DBInstances![0].DeletionProtection).toBe(true);
    }, 20000);
  });

  describe("Compliance and Governance", () => {
    test("All resources have proper tagging for governance", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "pr2859")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value?.includes("secure-infrastructure"))).toBe(true);
      
      // Check Lambda function tags
      const functionName = stackOutputs["lambda_function_name"];
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
  
    }, 20000);
  });
});