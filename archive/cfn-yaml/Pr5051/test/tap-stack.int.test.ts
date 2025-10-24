import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

// Load outputs and template
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Extract region dynamically from outputs (from ARN)
const region = process.env.AWS_REGION ||
  outputs.DBSecretArn?.split(":")[3] ||
  outputs.EC2RoleArn?.split(":")[3] ||
  "us-east-1";

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const iamClient = new IAMClient({ region });
const stsClient = new STSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

jest.setTimeout(120_000);

// ---------------------------
// Helper functions
// ---------------------------
function extractRoleName(roleArn: string): string {
  return roleArn.split("/").pop() || "";
}

function extractInstanceProfileName(profileArn: string): string {
  return profileArn.split("/").pop() || "";
}

// ---------------------------
// VPC & NETWORK RESOURCES
// ---------------------------
describe("VPC and Network Infrastructure", () => {
  test("VPC exists with correct CIDR and DNS settings", async () => {
    const res = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
    );
    const vpc = res.Vpcs?.[0];

    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe(template.Parameters.VPCCidr.Default);
    expect(vpc?.State).toBe("available");

    // Check DNS attributes
    const dnsHostnamesAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: "enableDnsHostnames",
      })
    );
    expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

    const dnsSupportAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: "enableDnsSupport",
      })
    );
    expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);
  });

  test("Public subnets exist with correct configuration", async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );

    expect(res.Subnets?.length).toBe(2);

    for (const subnet of res.Subnets || []) {
      expect(subnet.VpcId).toBe(outputs.VPCId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
    }

    // Verify CIDR blocks
    const cidrs = res.Subnets?.map((s) => s.CidrBlock).sort();
    expect(cidrs).toContain(template.Parameters.PublicSubnet1Cidr.Default);
    expect(cidrs).toContain(template.Parameters.PublicSubnet2Cidr.Default);
  });

  test("Private subnets exist with correct configuration", async () => {
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
    );

    expect(res.Subnets?.length).toBe(2);

    for (const subnet of res.Subnets || []) {
      expect(subnet.VpcId).toBe(outputs.VPCId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
    }

    // Verify CIDR blocks
    const cidrs = res.Subnets?.map((s) => s.CidrBlock).sort();
    expect(cidrs).toContain(template.Parameters.PrivateSubnet1Cidr.Default);
    expect(cidrs).toContain(template.Parameters.PrivateSubnet2Cidr.Default);
  });

  test("Subnets are in different availability zones", async () => {
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    const azs = new Set(res.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("Internet Gateway exists and is attached to VPC", async () => {
    const res = await ec2Client.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [outputs.VPCId] }],
      })
    );

    expect(res.InternetGateways?.length).toBeGreaterThan(0);
    const igw = res.InternetGateways?.[0];
    expect(igw?.Attachments?.[0]?.State).toBe("available");
    expect(igw?.Attachments?.[0]?.VpcId).toBe(outputs.VPCId);
  });

  test("NAT Gateway exists and is available", async () => {
    const res = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGatewayId],
      })
    );

    const natGateway = res.NatGateways?.[0];
    expect(natGateway).toBeDefined();
    expect(natGateway?.State).toBe("available");
    expect(natGateway?.VpcId).toBe(outputs.VPCId);
    expect(natGateway?.SubnetId).toBe(outputs.PublicSubnet1Id);

    // Verify NAT Gateway has Elastic IP
    expect(natGateway?.NatGatewayAddresses?.length).toBeGreaterThan(0);
    expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBe(
      outputs.NATGatewayEIP
    );
  });
});

// ---------------------------
// ROUTING
// ---------------------------
describe("Route Tables and Network Routing", () => {
  test("Public route table routes internet traffic through IGW", async () => {
    const res = await ec2Client.send(
      new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PublicRouteTableId],
      })
    );

    const routeTable = res.RouteTables?.[0];
    expect(routeTable).toBeDefined();
    expect(routeTable?.VpcId).toBe(outputs.VPCId);

    // Check for internet route
    const internetRoute = routeTable?.Routes?.find(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0"
    );
    expect(internetRoute).toBeDefined();
    expect(internetRoute?.GatewayId).toMatch(/^igw-/);
    expect(internetRoute?.State).toBe("active");
  });

  test("Private route table routes internet traffic through NAT Gateway", async () => {
    const res = await ec2Client.send(
      new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PrivateRouteTableId],
      })
    );

    const routeTable = res.RouteTables?.[0];
    expect(routeTable).toBeDefined();
    expect(routeTable?.VpcId).toBe(outputs.VPCId);

    // Check for NAT route
    const natRoute = routeTable?.Routes?.find(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0"
    );
    expect(natRoute).toBeDefined();
    expect(natRoute?.NatGatewayId).toBe(outputs.NATGatewayId);
    expect(natRoute?.State).toBe("active");
  });

  test("Public subnets are associated with public route table", async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];

    for (const subnetId of publicSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      expect(routeTable?.RouteTableId).toBe(outputs.PublicRouteTableId);
    }
  });

  test("Private subnets are associated with private route table", async () => {
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    for (const subnetId of privateSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      expect(routeTable?.RouteTableId).toBe(outputs.PrivateRouteTableId);
    }
  });
});

// ---------------------------
// SECURITY GROUPS
// ---------------------------
describe("Security Groups", () => {
  test("Web Security Group has correct ingress and egress rules", async () => {
    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebSecurityGroupId],
      })
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.VpcId).toBe(outputs.VPCId);

    // Check HTTP ingress
    const httpRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === 80 && r.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.IpProtocol).toBe("tcp");
    expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

    // Check HTTPS ingress
    const httpsRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === 443 && r.ToPort === 443
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule?.IpProtocol).toBe("tcp");
    expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

    // Check egress rule (allow all)
    expect(sg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    const egressRule = sg?.IpPermissionsEgress?.find(
      (r) => r.IpProtocol === "-1"
    );
    expect(egressRule).toBeDefined();
  });

  test("RDS Security Group allows traffic from Web Security Group", async () => {
    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.RDSSecurityGroupId],
      })
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.VpcId).toBe(outputs.VPCId);

    // Check database port ingress from Web SG
    const dbPort = parseInt(outputs.RDSPort);
    const dbRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === dbPort && r.ToPort === dbPort
    );
    expect(dbRule).toBeDefined();
    expect(dbRule?.IpProtocol).toBe("tcp");
    expect(dbRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
      outputs.WebSecurityGroupId
    );
  });
});

// ---------------------------
// IAM RESOURCES
// ---------------------------
describe("IAM Roles and Policies", () => {
  test("EC2 Role exists with correct trust policy", async () => {
    const roleName = extractRoleName(outputs.EC2RoleArn);
    const res = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );

    expect(res.Role).toBeDefined();
    expect(res.Role?.Arn).toBe(outputs.EC2RoleArn);

    // Check trust policy
    const trustPolicy = JSON.parse(
      decodeURIComponent(res.Role?.AssumeRolePolicyDocument || "{}")
    );
    expect(trustPolicy.Statement[0].Principal.Service).toContain(
      "ec2.amazonaws.com"
    );
    expect(trustPolicy.Statement[0].Action).toBe("sts:AssumeRole");
  });

  test("EC2 Role has S3 access policy", async () => {
    const roleName = extractRoleName(outputs.EC2RoleArn);
    const res = await iamClient.send(
      new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: "S3AccessPolicy",
      })
    );

    expect(res.PolicyDocument).toBeDefined();
    const policy = JSON.parse(decodeURIComponent(res.PolicyDocument || "{}"));

    // Check for S3 bucket permissions
    const s3Statements = policy.Statement;
    expect(s3Statements.length).toBeGreaterThan(0);

    // Check ListBucket permission
    const listBucketStatement = s3Statements.find((s: any) =>
      s.Action.includes("s3:ListBucket")
    );
    expect(listBucketStatement).toBeDefined();
    expect(listBucketStatement.Resource).toContain(outputs.S3BucketArn);

    // Check GetObject, PutObject, DeleteObject permissions
    const objectStatement = s3Statements.find((s: any) =>
      s.Action.includes("s3:GetObject")
    );
    expect(objectStatement).toBeDefined();
    expect(objectStatement.Action).toContain("s3:PutObject");
    expect(objectStatement.Action).toContain("s3:DeleteObject");
  });

  test("EC2 Instance Profile exists and is linked to role", async () => {
    const profileName = extractInstanceProfileName(
      outputs.EC2InstanceProfileArn
    );
    const res = await iamClient.send(
      new GetInstanceProfileCommand({ InstanceProfileName: profileName })
    );

    expect(res.InstanceProfile).toBeDefined();
    expect(res.InstanceProfile?.Arn).toBe(outputs.EC2InstanceProfileArn);
    expect(res.InstanceProfile?.Roles?.[0]?.Arn).toBe(outputs.EC2RoleArn);
  });
});

// ---------------------------
// S3 BUCKET
// ---------------------------
describe("S3 Bucket", () => {
  test("S3 bucket exists and is accessible", async () => {
    const res = await s3Client.send(
      new HeadBucketCommand({ Bucket: outputs.S3BucketName })
    );
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test("S3 bucket has versioning enabled", async () => {
    const res = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: outputs.S3BucketName })
    );
    expect(res.Status).toBe("Enabled");
  });

  test("S3 bucket has encryption enabled", async () => {
    const res = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName })
    );
    expect(
      res.ServerSideEncryptionConfiguration?.Rules?.length
    ).toBeGreaterThan(0);
    expect(
      res.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe("AES256");
  });

  test("S3 bucket blocks public access", async () => {
    const res = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: outputs.S3BucketName })
    );
    expect(res.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
      true
    );
  });

  test("Can write and read objects from S3 bucket", async () => {
    const testKey = `integration-test-${Date.now()}.txt`;
    const testContent = "Integration test content";

    try {
      // Write object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.S3BucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Read object
      const getRes = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.S3BucketName,
          Key: testKey,
        })
      );

      const body = await getRes.Body?.transformToString();
      expect(body).toBe(testContent);
    } finally {
      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.S3BucketName,
          Key: testKey,
        })
      );
    }
  });
});

// ---------------------------
// RDS DATABASE
// ---------------------------
describe("RDS Database", () => {
  test("RDS instance exists and is available", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.DBInstanceStatus).toBe("available");
    expect(dbInstance?.Endpoint?.Address).toBe(outputs.RDSEndpoint);
    expect(dbInstance?.Endpoint?.Port).toBe(parseInt(outputs.RDSPort));
  });

  test("RDS instance has correct configuration", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance?.DBInstanceClass).toBe(
      template.Parameters.DBInstanceClass.Default
    );
    expect(dbInstance?.Engine).toBe(
      template.Mappings.DatabaseEngineMap[
        template.Parameters.DatabaseEngine.Default
      ].Engine
    );
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.StorageEncrypted).toBe(true);
  });

  test("RDS instance has correct backup configuration", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance?.BackupRetentionPeriod).toBe(
      template.Parameters.DBBackupRetentionPeriod.Default
    );
    expect(dbInstance?.PreferredBackupWindow).toBe("03:00-04:00");
  });

  test("RDS instance is in private subnets", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const subnetGroup = dbInstance?.DBSubnetGroup;
    expect(subnetGroup).toBeDefined();

    const subnetIds = subnetGroup?.Subnets?.map((s) => s.SubnetIdentifier);
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test("RDS subnet group exists with correct configuration", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const instanceRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const subnetGroupName =
      instanceRes.DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
    expect(subnetGroupName).toBeDefined();

    const res = await rdsClient.send(
      new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      })
    );

    const subnetGroup = res.DBSubnetGroups?.[0];
    expect(subnetGroup).toBeDefined();
    expect(subnetGroup?.VpcId).toBe(outputs.VPCId);
    expect(subnetGroup?.Subnets?.length).toBe(2);
  });

  test("RDS security group is attached", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const securityGroups = dbInstance?.VpcSecurityGroups?.map(
      (sg) => sg.VpcSecurityGroupId
    );
    expect(securityGroups).toContain(outputs.RDSSecurityGroupId);
  });

  test("RDS has CloudWatch logs enabled", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
    expect(enabledLogs).toContain("error");
    expect(enabledLogs).toContain("general");
    expect(enabledLogs).toContain("slowquery");
  });
});

// ---------------------------
// SECRETS MANAGER
// ---------------------------
describe("Secrets Manager", () => {
  test("Database secret exists and is accessible", async () => {
    const res = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: outputs.DBSecretArn })
    );

    expect(res.SecretString).toBeDefined();
    const secret = JSON.parse(res.SecretString || "{}");
    expect(secret.username).toBe(template.Parameters.DBMasterUsername.Default);
    expect(secret.password).toBeDefined();
    expect(secret.password.length).toBeGreaterThanOrEqual(16);
  });
});

// ---------------------------
// DYNAMODB
// ---------------------------
describe("DynamoDB Table", () => {
  test("DynamoDB table exists with correct configuration", async () => {
    const res = await dynamoClient.send(
      new DescribeTableCommand({ TableName: outputs.DynamoDBTableName })
    );

    const table = res.Table;
    expect(table).toBeDefined();
    expect(table?.TableName).toBe(outputs.DynamoDBTableName);
    expect(table?.TableStatus).toBe("ACTIVE");
  });

  test("DynamoDB table has correct key schema", async () => {
    const res = await dynamoClient.send(
      new DescribeTableCommand({ TableName: outputs.DynamoDBTableName })
    );

    const table = res.Table;
    expect(table?.KeySchema?.length).toBe(1);
    expect(table?.KeySchema?.[0]?.AttributeName).toBe("id");
    expect(table?.KeySchema?.[0]?.KeyType).toBe("HASH");

    expect(table?.AttributeDefinitions?.[0]?.AttributeName).toBe("id");
    expect(table?.AttributeDefinitions?.[0]?.AttributeType).toBe("S");
  });

  test("DynamoDB table has encryption enabled", async () => {
    const res = await dynamoClient.send(
      new DescribeTableCommand({ TableName: outputs.DynamoDBTableName })
    );

    const table = res.Table;
    expect(table?.SSEDescription?.Status).toBe("ENABLED");
  });

  test("DynamoDB table has correct throughput", async () => {
    const res = await dynamoClient.send(
      new DescribeTableCommand({ TableName: outputs.DynamoDBTableName })
    );

    const table = res.Table;
    expect(table?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
    expect(table?.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
  });

  test("Can write and read items from DynamoDB table", async () => {
    const testId = `test-${Date.now()}`;
    const testData = { id: { S: testId }, data: { S: "Integration test" } };

    try {
      // Write item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.DynamoDBTableName,
          Item: testData,
        })
      );

      // Read item
      const getRes = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: { id: { S: testId } },
        })
      );

      expect(getRes.Item).toBeDefined();
      expect(getRes.Item?.id.S).toBe(testId);
      expect(getRes.Item?.data.S).toBe("Integration test");
    } finally {
      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: { id: { S: testId } },
        })
      );
    }
  });
});

// ---------------------------
// CROSS-ACCOUNT & REGION INDEPENDENCE
// ---------------------------
describe("Cross-account & Region Independence", () => {
  test("Template has no hardcoded account IDs", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    const templateStr = JSON.stringify(template);

    // Check template doesn't contain actual account ID
    expect(templateStr).not.toContain(identity.Account || "");

    // Check template uses AWS pseudo parameters
    expect(templateStr).toContain("${AWS::AccountId}");
  });

  test("Template is region-independent", () => {
    const templateStr = JSON.stringify(template);
    const regionPattern = /us-[a-z]+-\d/;

    // Check template doesn't hardcode regions
    expect(templateStr).not.toMatch(regionPattern);

    // Check template uses AWS pseudo parameters
    expect(templateStr).toContain("${AWS::Region}");
  });

  test("All resources use dynamic region and account references", () => {
    const templateStr = JSON.stringify(template);

    // S3 bucket name should use AccountId and Region
    expect(templateStr).toMatch(/\$\{AWS::AccountId\}/);
    expect(templateStr).toMatch(/\$\{AWS::Region\}/);

    // Role ARNs and other references should be dynamic
    expect(templateStr).toMatch(/\$\{AWS::StackName\}/);
  });
});

// ---------------------------
// END-TO-END INTEGRATION
// ---------------------------
describe("End-to-End Stack Validation", () => {
  test("All stack outputs are non-empty and valid", () => {
    for (const [key, value] of Object.entries(outputs)) {
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      expect(value).not.toBe("");
    }
  });

  test("Network connectivity: Public subnets → IGW → Internet", async () => {
    // Public subnets should route to IGW
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];

    for (const subnetId of publicSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      const internetRoute = routeTable?.Routes?.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(internetRoute?.GatewayId).toMatch(/^igw-/);
      expect(internetRoute?.State).toBe("active");
    }
  });

  test("Network connectivity: Private subnets → NAT Gateway → Internet", async () => {
    // Private subnets should route through NAT
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    for (const subnetId of privateSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      const natRoute = routeTable?.Routes?.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(natRoute?.NatGatewayId).toBe(outputs.NATGatewayId);
      expect(natRoute?.State).toBe("active");
    }
  });

  test("Security: RDS is isolated in private subnets", async () => {
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];

    // Verify RDS is not publicly accessible
    expect(dbInstance?.PubliclyAccessible).toBe(false);

    // Verify RDS is in private subnets
    const subnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(
      (s) => s.SubnetIdentifier
    );
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test("Multi-AZ deployment for high availability", async () => {
    // Check RDS is Multi-AZ
    const dbIdentifier = outputs.RDSEndpoint.split(".")[0];
    const rdsRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );
    expect(rdsRes.DBInstances?.[0]?.MultiAZ).toBe(true);

    // Check subnets span multiple AZs
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    const azs = new Set(subnetRes.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("Resource tagging compliance", async () => {
    // Check VPC tags
    const vpcRes = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
    );
    const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];
    expect(vpcTags.some((t) => t.Key === "Name")).toBe(true);

    // Check Subnet tags
    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet1Id] })
    );
    const subnetTags = subnetRes.Subnets?.[0]?.Tags || [];
    expect(subnetTags.some((t) => t.Key === "Name")).toBe(true);

    // Check Security Group tags
    const sgRes = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebSecurityGroupId],
      })
    );
    const sgTags = sgRes.SecurityGroups?.[0]?.Tags || [];
    expect(sgTags.some((t) => t.Key === "Name")).toBe(true);
  });

  test("All critical resources are successfully deployed", async () => {
    const criticalResources = {
      VPC: outputs.VPCId,
      "Public Subnet 1": outputs.PublicSubnet1Id,
      "Public Subnet 2": outputs.PublicSubnet2Id,
      "Private Subnet 1": outputs.PrivateSubnet1Id,
      "Private Subnet 2": outputs.PrivateSubnet2Id,
      "Web Security Group": outputs.WebSecurityGroupId,
      "RDS Security Group": outputs.RDSSecurityGroupId,
      "S3 Bucket": outputs.S3BucketName,
      "RDS Endpoint": outputs.RDSEndpoint,
      "DynamoDB Table": outputs.DynamoDBTableName,
      "NAT Gateway": outputs.NATGatewayId,
      "EC2 Role": outputs.EC2RoleArn,
      "DB Secret": outputs.DBSecretArn,
    };

    for (const [name, value] of Object.entries(criticalResources)) {
      expect(value).toBeDefined();
      expect(value).not.toBe("");
    }
  });
});
