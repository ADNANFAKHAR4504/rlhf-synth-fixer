// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketAclCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let ec2InstanceIds: string[];
  let ec2PrivateIps: string[];
  let ec2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let iamRoleArn: string;
  let s3BucketNames: string[];
  let cloudtrailBucketName: string;
  let snsTopicArn: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    ec2InstanceIds = stackOutputs["ec2-instance-ids"];
    ec2PrivateIps = stackOutputs["ec2-private-ips"];
    ec2SecurityGroupId = stackOutputs["security-group-ec2"];
    rdsSecurityGroupId = stackOutputs["security-group-rds"];
    iamRoleArn = stackOutputs["iam-role-ec2"];
    s3BucketNames = stackOutputs["s3-bucket-names"];
    cloudtrailBucketName = stackOutputs["cloudtrail-bucket"];
    snsTopicArn = stackOutputs["sns-topic-arn"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !ec2InstanceIds || !iamRoleArn || !s3BucketNames || !cloudtrailBucketName || !snsTopicArn) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  test("VPC exists and has correct configuration", async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.length).toBe(1);
    expect(Vpcs?.[0].VpcId).toBe(vpcId);
    expect(Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
    expect(Vpcs?.[0].State).toBe("available");
  }, 20000);

  test("Public subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    expect(Subnets?.length).toBe(2);
    
    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
    });
  }, 20000);

  test("Private subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
    expect(Subnets?.length).toBe(2);
    
    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
    });
  }, 20000);

  test("EC2 instances exist and are running in private subnets", async () => {
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: ec2InstanceIds }));
    expect(Reservations?.length).toBeGreaterThan(0);
    
    const instances = Reservations?.flatMap(r => r.Instances || []);
    expect(instances?.length).toBe(2);
    
    // Check that all expected instance IDs are present (order doesn't matter)
    const actualInstanceIds = instances?.map(i => i.InstanceId) || [];
    expect(actualInstanceIds.sort()).toEqual(ec2InstanceIds.sort());
    
    // Check that all expected private IPs are present (order doesn't matter)
    const actualPrivateIps = instances?.map(i => i.PrivateIpAddress) || [];
    expect(actualPrivateIps.sort()).toEqual(ec2PrivateIps.sort());
    
    // Check other properties for each instance
    instances?.forEach(instance => {
      expect(instance.State?.Name).toBe("running");
      expect(privateSubnetIds).toContain(instance.SubnetId);
      expect(ec2PrivateIps).toContain(instance.PrivateIpAddress);
    });
  }, 30000);

  test("EC2 security group has correct SSH access rules", async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
    
    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.GroupId).toBe(ec2SecurityGroupId);
    expect(securityGroup?.VpcId).toBe(vpcId);
    
    // Check for SSH rule (port 22)
    const sshRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
  }, 20000);

  test("RDS security group has correct MySQL access rules", async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
    
    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.GroupId).toBe(rdsSecurityGroupId);
    expect(securityGroup?.VpcId).toBe(vpcId);
    
    // Check for MySQL rule (port 3306) from EC2 security group
    const mysqlRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
    );
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)).toBe(true);
  }, 20000);

  test("IAM EC2 role exists and is assumable by EC2 service", async () => {
    const roleName = iamRoleArn.split('/')[1];
    const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role?.RoleName).toBe(roleName);
    expect(Role?.Arn).toBe(iamRoleArn);

    const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
    expect(
      assumeRolePolicy.Statement.some(
        (statement: any) =>
          statement.Effect === "Allow" &&
          statement.Principal.Service === "ec2.amazonaws.com"
      )
    ).toBe(true);
  }, 20000);

  test("S3 application buckets exist and have public access blocked", async () => {
    expect(s3BucketNames.length).toBe(3);
    
    for (const bucketName of s3BucketNames) {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      
      // Check bucket ACL for public access
      const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: bucketName }));
      const hasPublicRead = Grants?.some(
        grant => grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" && grant.Permission === "READ"
      );
      expect(hasPublicRead).toBe(false);
    }
  }, 30000);

  test("CloudTrail S3 bucket exists and has public access blocked", async () => {
    // Check bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: cloudtrailBucketName }));
    
    // Check bucket ACL for public access
    const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: cloudtrailBucketName }));
    const hasPublicRead = Grants?.some(
      grant => grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" && grant.Permission === "READ"
    );
    expect(hasPublicRead).toBe(false);
  }, 20000);

  test("SNS topic exists and is accessible", async () => {
    const topicAttributes = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
    expect(topicAttributes.Attributes?.TopicArn).toBe(snsTopicArn);
    
    // Check if DisplayName exists and contains "corp", or check the topic name from ARN
    const displayName = topicAttributes.Attributes?.DisplayName;
    const topicName = snsTopicArn.split(':').pop(); // Extract topic name from ARN
    
    if (displayName && displayName.trim() !== "") {
      expect(displayName).toContain("corp");
    } else {
      // Fallback to checking the topic name from ARN if DisplayName is not set
      expect(topicName).toContain("corp");
    }
  }, 20000);

  test("CloudTrail exists and is logging to S3 bucket", async () => {
    const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
    const cloudTrail = trailList?.find(trail => trail.S3BucketName === cloudtrailBucketName);
    
    expect(cloudTrail).toBeDefined();
    expect(cloudTrail?.S3BucketName).toBe(cloudtrailBucketName);
    expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
    expect(cloudTrail?.LogFileValidationEnabled).toBe(true);
  }, 20000);

  test("RDS database instance exists and is configured correctly", async () => {
    // Note: This test assumes RDS instance identifier follows the pattern from your modules
    // You might need to add RDS endpoint to outputs for more precise testing
    const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
    
    const corpDbInstances = DBInstances?.filter(db => 
      db.DBInstanceIdentifier?.includes("corp") && 
      db.VpcSecurityGroups?.some(sg => sg.VpcSecurityGroupId === rdsSecurityGroupId)
    );
    
    expect(corpDbInstances?.length).toBeGreaterThan(0);
    
    const dbInstance = corpDbInstances?.[0];
    expect(dbInstance?.Engine).toBe("mysql");
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.DBInstanceStatus).toBe("available");
  }, 30000);
});