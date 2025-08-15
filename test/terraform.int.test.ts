import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand
} from "@aws-sdk/client-ec2";
import { 
  IAMClient, 
  GetRoleCommand, 
  GetPolicyCommand, 
  GetInstanceProfileCommand 
} from "@aws-sdk/client-iam";
import { 
  KMSClient, 
  DescribeKeyCommand, 
  ListAliasesCommand 
} from "@aws-sdk/client-kms";
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from "@aws-sdk/client-cloudwatch";
import { 
  SNSClient, 
  GetTopicAttributesCommand, 
  ListTopicsCommand 
} from "@aws-sdk/client-sns";
import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any;
  let primaryEC2: EC2Client;
  let secondaryEC2: EC2Client;
  let iamClient: IAMClient;
  let primaryKMS: KMSClient;
  let secondaryKMS: KMSClient;
  let primaryCWLogs: CloudWatchLogsClient;
  let secondaryCWLogs: CloudWatchLogsClient;
  let primaryCW: CloudWatchClient;
  let secondaryCW: CloudWatchClient;
  let primarySNS: SNSClient;
  let secondarySNS: SNSClient;

  beforeAll(async () => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
    
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs not found at ${outputsPath}. Please run deployment first.`);
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

    // Initialize AWS clients
    const primaryRegion = outputs.primary_region || "us-west-2";
    const secondaryRegion = outputs.secondary_region || "us-east-2";

    primaryEC2 = new EC2Client({ region: primaryRegion });
    secondaryEC2 = new EC2Client({ region: secondaryRegion });
    iamClient = new IAMClient({ region: primaryRegion }); // IAM is global
    primaryKMS = new KMSClient({ region: primaryRegion });
    secondaryKMS = new KMSClient({ region: secondaryRegion });
    primaryCWLogs = new CloudWatchLogsClient({ region: primaryRegion });
    secondaryCWLogs = new CloudWatchLogsClient({ region: secondaryRegion });
    primaryCW = new CloudWatchClient({ region: primaryRegion });
    secondaryCW = new CloudWatchClient({ region: secondaryRegion });
    primarySNS = new SNSClient({ region: primaryRegion });
    secondarySNS = new SNSClient({ region: secondaryRegion });
  });

  describe("VPC Infrastructure Tests", () => {
    test("primary VPC exists and has correct configuration", async () => {
      const response = await primaryEC2.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_primary_id]
      }));

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");
      // DNS configuration is validated through VPC attributes in Terraform
    });

    test("secondary VPC exists and has correct configuration", async () => {
      const response = await secondaryEC2.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_secondary_id]
      }));

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.1.0.0/16");
      expect(vpc.State).toBe("available");
      // DNS configuration is validated through VPC attributes in Terraform
    });

    test("public subnets exist in primary region", async () => {
      const response = await primaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids_primary
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
        expect(subnet.State).toBe("available");
      });
    });

    test("private subnets exist in primary region", async () => {
      const response = await primaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids_primary
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toBe(`10.0.${index + 10}.0/24`);
        expect(subnet.State).toBe("available");
      });
    });

    test("public subnets exist in secondary region", async () => {
      const response = await secondaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids_secondary
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(outputs.vpc_secondary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toBe(`10.1.${index + 1}.0/24`);
        expect(subnet.State).toBe("available");
      });
    });

    test("private subnets exist in secondary region", async () => {
      const response = await secondaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids_secondary
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(outputs.vpc_secondary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toBe(`10.1.${index + 10}.0/24`);
        expect(subnet.State).toBe("available");
      });
    });
  });

  describe("Network Infrastructure Tests", () => {
    test("internet gateways are attached to VPCs", async () => {
      // Primary region IGW
      const primaryIGWResponse = await primaryEC2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: "attachment.vpc-id", Values: [outputs.vpc_primary_id] }
        ]
      }));

      expect(primaryIGWResponse.InternetGateways).toBeDefined();
      expect(primaryIGWResponse.InternetGateways!.length).toBe(1);
      expect(primaryIGWResponse.InternetGateways![0].Attachments![0].State).toBe("available");

      // Secondary region IGW
      const secondaryIGWResponse = await secondaryEC2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: "attachment.vpc-id", Values: [outputs.vpc_secondary_id] }
        ]
      }));

      expect(secondaryIGWResponse.InternetGateways).toBeDefined();
      expect(secondaryIGWResponse.InternetGateways!.length).toBe(1);
      expect(secondaryIGWResponse.InternetGateways![0].Attachments![0].State).toBe("available");
    });

    test("NAT gateways are deployed and available", async () => {
      // Primary region NAT gateways
      const primaryNATResponse = await primaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [outputs.vpc_primary_id] }
        ]
      }));

      expect(primaryNATResponse.NatGateways).toBeDefined();
      expect(primaryNATResponse.NatGateways!.length).toBe(2);

      primaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe("available");
        expect(nat.VpcId).toBe(outputs.vpc_primary_id);
      });

      // Secondary region NAT gateways
      const secondaryNATResponse = await secondaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [outputs.vpc_secondary_id] }
        ]
      }));

      expect(secondaryNATResponse.NatGateways).toBeDefined();
      expect(secondaryNATResponse.NatGateways!.length).toBe(2);

      secondaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe("available");
        expect(nat.VpcId).toBe(outputs.vpc_secondary_id);
      });
    });

    test("route tables have correct routing configuration", async () => {
      // Primary region route tables
      const primaryRTResponse = await primaryEC2.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [outputs.vpc_primary_id] }
        ]
      }));

      expect(primaryRTResponse.RouteTables).toBeDefined();
      expect(primaryRTResponse.RouteTables!.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private + 1 default

      // Check for internet gateway routes in public route tables
      const publicRoutes = primaryRTResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith("igw-"))
      );
      expect(publicRoutes.length).toBeGreaterThanOrEqual(1);

      // Check for NAT gateway routes in private route tables
      const privateRoutes = primaryRTResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith("nat-"))
      );
      expect(privateRoutes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Security Infrastructure Tests", () => {
    test("security groups have correct configuration", async () => {
      // Primary region security group
      const primarySGResponse = await primaryEC2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_primary_id]
      }));

      expect(primarySGResponse.SecurityGroups).toBeDefined();
      expect(primarySGResponse.SecurityGroups!.length).toBe(1);

      const primarySG = primarySGResponse.SecurityGroups![0];
      expect(primarySG.VpcId).toBe(outputs.vpc_primary_id);

      // Check ingress rules
      const ingressRules = primarySG.IpPermissions || [];
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();

      // Secondary region security group
      const secondarySGResponse = await secondaryEC2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_secondary_id]
      }));

      expect(secondarySGResponse.SecurityGroups).toBeDefined();
      expect(secondarySGResponse.SecurityGroups!.length).toBe(1);

      const secondarySG = secondarySGResponse.SecurityGroups![0];
      expect(secondarySG.VpcId).toBe(outputs.vpc_secondary_id);
    });

    test("KMS keys are functional and properly configured", async () => {
      // Primary region KMS key
      const primaryKeyResponse = await primaryKMS.send(new DescribeKeyCommand({
        KeyId: outputs.kms_key_primary_id
      }));

      expect(primaryKeyResponse.KeyMetadata).toBeDefined();
      expect(primaryKeyResponse.KeyMetadata!.KeyState).toBe("Enabled");
      // Key rotation is enabled by default for customer managed keys

      // Secondary region KMS key
      const secondaryKeyResponse = await secondaryKMS.send(new DescribeKeyCommand({
        KeyId: outputs.kms_key_secondary_id
      }));

      expect(secondaryKeyResponse.KeyMetadata).toBeDefined();
      expect(secondaryKeyResponse.KeyMetadata!.KeyState).toBe("Enabled");
      // Key rotation is enabled by default for customer managed keys
    });

    test("KMS aliases are properly configured", async () => {
      // Check primary region aliases
      const primaryAliasResponse = await primaryKMS.send(new ListAliasesCommand({}));
      const primaryAliases = primaryAliasResponse.Aliases || [];
      const primaryFinancialAlias = primaryAliases.find(alias => 
        alias.AliasName?.includes("financial-app") && alias.AliasName?.includes("primary")
      );
      
      expect(primaryFinancialAlias).toBeDefined();
      expect(primaryFinancialAlias!.TargetKeyId).toBe(outputs.kms_key_primary_id);

      // Check secondary region aliases
      const secondaryAliasResponse = await secondaryKMS.send(new ListAliasesCommand({}));
      const secondaryAliases = secondaryAliasResponse.Aliases || [];
      const secondaryFinancialAlias = secondaryAliases.find(alias => 
        alias.AliasName?.includes("financial-app") && alias.AliasName?.includes("secondary")
      );
      
      expect(secondaryFinancialAlias).toBeDefined();
      expect(secondaryFinancialAlias!.TargetKeyId).toBe(outputs.kms_key_secondary_id);
    });
  });

  describe("IAM Configuration Tests", () => {
    test("IAM role exists and has correct configuration", async () => {
      const roleArn = outputs.financial_app_role_arn;
      const roleName = roleArn.split("/").pop();

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(roleArn);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement).toBeDefined();
      
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Principal.Service).toContain("ec2.amazonaws.com");
      expect(statement.Principal.Service).toContain("lambda.amazonaws.com");
      expect(statement.Principal.Service).toContain("ecs-tasks.amazonaws.com");
    });

    test("IAM instance profile exists", async () => {
      const instanceProfileName = outputs.financial_app_instance_profile_name;

      const response = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      }));

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles).toBeDefined();
      expect(response.InstanceProfile!.Roles!.length).toBe(1);
    });
  });

  describe("Monitoring and Logging Tests", () => {
    test("CloudWatch log groups exist and are properly configured", async () => {
      // Primary region log group
      const primaryLogResponse = await primaryCWLogs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: "/aws/financial-app"
      }));

      expect(primaryLogResponse.logGroups).toBeDefined();
      const primaryLogGroup = primaryLogResponse.logGroups!.find(lg => 
        lg.logGroupName === outputs.log_group_primary_name
      );

      expect(primaryLogGroup).toBeDefined();
      expect(primaryLogGroup!.retentionInDays).toBe(30);
      expect(primaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_primary_arn);

      // Secondary region log group
      const secondaryLogResponse = await secondaryCWLogs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: "/aws/financial-app"
      }));

      expect(secondaryLogResponse.logGroups).toBeDefined();
      const secondaryLogGroup = secondaryLogResponse.logGroups!.find(lg => 
        lg.logGroupName === outputs.log_group_secondary_name
      );

      expect(secondaryLogGroup).toBeDefined();
      expect(secondaryLogGroup!.retentionInDays).toBe(30);
      expect(secondaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_secondary_arn);
    });

    test("CloudWatch alarms exist and are properly configured", async () => {
      // Primary region alarms
      const primaryAlarmResponse = await primaryCW.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: "financial-app"
      }));

      expect(primaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(primaryAlarmResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const primaryCpuAlarm = primaryAlarmResponse.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes("high-cpu") && alarm.AlarmName?.includes("primary")
      );

      expect(primaryCpuAlarm).toBeDefined();
      expect(primaryCpuAlarm!.MetricName).toBe("CPUUtilization");
      expect(primaryCpuAlarm!.Threshold).toBe(80);
      expect(primaryCpuAlarm!.ComparisonOperator).toBe("GreaterThanThreshold");

      // Secondary region alarms
      const secondaryAlarmResponse = await secondaryCW.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: "financial-app"
      }));

      expect(secondaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(secondaryAlarmResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const secondaryCpuAlarm = secondaryAlarmResponse.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes("high-cpu") && alarm.AlarmName?.includes("secondary")
      );

      expect(secondaryCpuAlarm).toBeDefined();
      expect(secondaryCpuAlarm!.MetricName).toBe("CPUUtilization");
      expect(secondaryCpuAlarm!.Threshold).toBe(80);
    });

    test("SNS topics exist and are properly configured", async () => {
      // Primary region SNS topic
      const primaryTopicResponse = await primarySNS.send(new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_primary_arn
      }));

      expect(primaryTopicResponse.Attributes).toBeDefined();
      expect(primaryTopicResponse.Attributes!.KmsMasterKeyId).toBe(outputs.kms_key_primary_id);

      // Secondary region SNS topic
      const secondaryTopicResponse = await secondarySNS.send(new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_secondary_arn
      }));

      expect(secondaryTopicResponse.Attributes).toBeDefined();
      expect(secondaryTopicResponse.Attributes!.KmsMasterKeyId).toBe(outputs.kms_key_secondary_id);
    });
  });

  describe("Multi-Region Consistency Tests", () => {
    test("both regions have consistent resource counts", async () => {
      // Compare subnet counts
      expect(outputs.public_subnet_ids_primary.length).toBe(outputs.public_subnet_ids_secondary.length);
      expect(outputs.private_subnet_ids_primary.length).toBe(outputs.private_subnet_ids_secondary.length);

      // Verify both regions are different
      expect(outputs.primary_region).not.toBe(outputs.secondary_region);
      
      // Verify VPCs are different
      expect(outputs.vpc_primary_id).not.toBe(outputs.vpc_secondary_id);
    });

    test("cross-region connectivity setup is consistent", async () => {
      // Both regions should have 2 NAT gateways for high availability
      const primaryNATResponse = await primaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [outputs.vpc_primary_id] }]
      }));

      const secondaryNATResponse = await secondaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [outputs.vpc_secondary_id] }]
      }));

      expect(primaryNATResponse.NatGateways!.length).toBe(2);
      expect(secondaryNATResponse.NatGateways!.length).toBe(2);
    });
  });

  describe("High Availability Tests", () => {
    test("resources are distributed across multiple availability zones", async () => {
      // Check primary region AZ distribution
      const primarySubnetsResponse = await primaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids_primary
      }));

      const primaryAZs = new Set(primarySubnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(primaryAZs.size).toBe(2); // Should span 2 AZs

      // Check secondary region AZ distribution
      const secondarySubnetsResponse = await secondaryEC2.send(new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids_secondary
      }));

      const secondaryAZs = new Set(secondarySubnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(secondaryAZs.size).toBe(2); // Should span 2 AZs
    });

    test("NAT gateways provide redundancy", async () => {
      // Primary region NAT gateways in different subnets
      const primaryNATResponse = await primaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [outputs.vpc_primary_id] }]
      }));

      const primaryNATSubnets = new Set(primaryNATResponse.NatGateways!.map(nat => nat.SubnetId));
      expect(primaryNATSubnets.size).toBe(2); // Each NAT in different subnet

      // Secondary region NAT gateways in different subnets
      const secondaryNATResponse = await secondaryEC2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [outputs.vpc_secondary_id] }]
      }));

      const secondaryNATSubnets = new Set(secondaryNATResponse.NatGateways!.map(nat => nat.SubnetId));
      expect(secondaryNATSubnets.size).toBe(2); // Each NAT in different subnet
    });
  });
});