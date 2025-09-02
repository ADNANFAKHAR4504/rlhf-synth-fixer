// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "vpc-cidr",
      "public-subnet-ids",
      "private-subnet-ids",
      "web-security-group-id",
      "db-security-group-id",
      "s3-bucket-name",
      "s3-bucket-arn",
      "load-balancer-dns",
      "autoscaling-group-name",
      "cpu-alarm-arn",
      "rds-endpoint",
      "kms-key-id",
      "ec2-role-arn"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
    }, 20000);

    test("Public subnets exist and are properly configured", async () => {
      const subnetIds = stackOutputs["public-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
        expect(subnet.State).toBe("available");
        
        // Check tags
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "dev")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "IaC - AWS Nova Model Breaking")).toBe(true);
      });
    }, 20000);

    test("Private subnets exist and are properly configured", async () => {
      const subnetIds = stackOutputs["private-subnet-ids"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      
      expect(Subnets).toHaveLength(2);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
        expect(subnet.State).toBe("available");
        
        // Check tags
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "dev")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "IaC - AWS Nova Model Breaking")).toBe(true);
      });
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    }, 20000);

    test("Route tables are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 2 route tables: default + public
      expect(RouteTables!.length).toBeGreaterThanOrEqual(2);
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt =>
        rt.Associations?.some(assoc => publicSubnetIds.includes(assoc.SubnetId))
      );
      expect(publicRouteTable).toBeDefined();
      
      const publicInternetRoute = publicRouteTable?.Routes?.find(route =>
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
      );
      expect(publicInternetRoute).toBeDefined();
    }, 20000);

    test("Subnets are distributed across different availability zones", async () => {
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have at least 2 different AZs
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Web security group allows HTTP and HTTPS", async () => {
      const sgId = stackOutputs["web-security-group-id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const webSg = SecurityGroups![0];
      
      expect(webSg.GroupName).toContain("web-sg");
      expect(webSg.Description).toBe("Security group for web servers - HTTP/HTTPS only");
      
      // Check HTTP ingress rule
      const httpRule = webSg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check HTTPS ingress rule
      const httpsRule = webSg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check egress allows all outbound
      const egressRule = webSg.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 0 && rule.ToPort === 65535 && rule.IpProtocol === "tcp"
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test("Database security group allows traffic only from web security group", async () => {
      const dbSgId = stackOutputs["db-security-group-id"];
      const webSgId = stackOutputs["web-security-group-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const dbSg = SecurityGroups![0];
      
      expect(dbSg.GroupName).toContain("db-sg");
      expect(dbSg.Description).toBe("Security group for RDS - Allow access only from web servers");
      
      // Check MySQL ingress rule (port 3306) from web security group
      const mysqlRule = dbSg.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
      expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(webSgId);
    }, 20000);
  });

  describe("Load Balancer", () => {
    describe("Auto Scaling Group", () => {
      test("Auto Scaling Group is properly configured", async () => {
        const asgName = stackOutputs["autoscaling-group-name"];
        const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        }));
      
        expect(AutoScalingGroups).toHaveLength(1);
        const asg = AutoScalingGroups![0];
      
        expect(asg.AutoScalingGroupName).toBe("iac-aws-nova-model-breaking-dev-asg");
        expect(asg.DesiredCapacity).toBe(2);
        expect(asg.MinSize).toBe(1);
        expect(asg.MaxSize).toBe(3);
        expect(asg.HealthCheckType).toBe("ELB");
        expect(asg.HealthCheckGracePeriod).toBe(300);
        expect(asg.LaunchTemplate).toBeDefined();
      
        // Verify ASG is in public subnets
        const asgSubnetIds = asg.VPCZoneIdentifier?.split(',');
        const publicSubnetIds = stackOutputs["public-subnet-ids"];
        asgSubnetIds?.forEach(subnetId => {
          expect(publicSubnetIds).toContain(subnetId);
        });
      
        // Check tags
        const tags = asg.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "dev")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "IaC - AWS Nova Model Breaking")).toBe(true);
      }, 20000);

    });

    describe("RDS Database", () => {
      test("RDS instance is properly configured", async () => {
        const rdsEndpoint = stackOutputs["rds-endpoint"];
        const dbIdentifier = rdsEndpoint.split('.')[0]; // Extract identifier from endpoint
      
        const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
      
        expect(DBInstances).toHaveLength(1);
        const db = DBInstances![0];
      
        expect(db.DBInstanceIdentifier).toBe("iac-aws-nova-model-breaking-dev-db");
        expect(db.Engine).toBe("mysql");
        expect(db.DBInstanceClass).toBe("db.t3.micro");
        expect(db.AllocatedStorage).toBe(20);
        expect(db.StorageEncrypted).toBe(true);
        expect(db.PubliclyAccessible).toBe(false);
        expect(db.VpcSecurityGroups).toHaveLength(1);
        expect(db.VpcSecurityGroups![0].VpcSecurityGroupId).toBe(stackOutputs["db-security-group-id"]);
        expect(db.DBName).toBe("appdb");
        expect(db.MasterUsername).toBe("admin");
      }, 20000);

      test("DB Subnet Group is properly configured", async () => {
        const rdsEndpoint = stackOutputs["rds-endpoint"];
        const dbIdentifier = rdsEndpoint.split('.')[0];
      
        const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
      
        const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
        expect(dbSubnetGroupName).toBeDefined();
      
        const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbSubnetGroupName
        }));
      
        expect(DBSubnetGroups).toHaveLength(1);
        const subnetGroup = DBSubnetGroups![0];
      
        expect(subnetGroup.VpcId).toBe(stackOutputs["vpc-id"]);
        expect(subnetGroup.Subnets).toHaveLength(2);
      
        // Verify subnets are private subnets
        const privateSubnetIds = stackOutputs["private-subnet-ids"];
        subnetGroup.Subnets?.forEach(subnet => {
          expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
        });
      }, 20000);
    });

    describe("S3 Storage Security", () => {
      test("S3 bucket exists and is accessible", async () => {
        const bucketName = stackOutputs["s3-bucket-name"];
      
        const headBucketResponse = await s3Client.send(new HeadBucketCommand({
          Bucket: bucketName
        }));
      
        expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
      }, 20000);

      test("S3 bucket has KMS encryption enabled", async () => {
        const bucketName = stackOutputs["s3-bucket-name"];
      
        const { ServerSideEncryptionConfiguration } = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
      
        const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
        expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
        expect(rule?.BucketKeyEnabled).toBe(true);
      }, 20000);

      test("S3 bucket name follows naming convention", () => {
        const bucketName = stackOutputs["s3-bucket-name"];
      
        expect(bucketName).toMatch(/^iac-aws-nova-model-breaking-dev-\d+$/);
        expect(bucketName).toContain("iac-aws-nova-model-breaking");
        expect(bucketName).toContain("dev");
      });
    });

    describe("KMS Encryption", () => {
      test("KMS key exists and is properly configured", async () => {
        const keyId = stackOutputs["kms-key-id"];
      
        const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
          KeyId: keyId
        }));
      
        expect(KeyMetadata?.KeyId).toBe(keyId);
        expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
        expect(KeyMetadata?.KeyState).toBe("Enabled");
        expect(KeyMetadata?.Description).toBe("KMS key for S3 bucket encryption");
      }, 20000);
    });

    describe("IAM Roles and Policies", () => {
      test("EC2 IAM role exists and has proper assume role policy", async () => {
        const roleArn = stackOutputs["ec2-role-arn"];
        const roleName = roleArn.split('/').pop();
      
        const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));
      
        expect(Role?.RoleName).toBe("iac-aws-nova-model-breaking-dev-ec2-role");
      
        // Verify assume role policy allows EC2
        const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
        expect(
          assumeRolePolicy.Statement.some(
            (statement: any) =>
              statement.Effect === "Allow" &&
              statement.Principal.Service === "ec2.amazonaws.com" &&
              statement.Action === "sts:AssumeRole"
          )
        ).toBe(true);
      }, 20000);

      test("EC2 role has S3 and KMS access policies", async () => {
        const roleArn = stackOutputs["ec2-role-arn"];
        const roleName = roleArn.split('/').pop();
      
        const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({
          RoleName: roleName!
        }));
      
        expect(PolicyNames?.some(name => name.includes("s3-policy"))).toBe(true);
      
        // Get the S3 policy and verify permissions
        const s3PolicyName = PolicyNames?.find(name => name.includes("s3-policy"));
        const { PolicyDocument } = await iamClient.send(new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: s3PolicyName!
        }));
      
        const policy = JSON.parse(decodeURIComponent(PolicyDocument || ""));
      
        // Verify S3 permissions
        const s3Statement = policy.Statement.find((stmt: any) =>
          stmt.Resource && Array.isArray(stmt.Resource) &&
          stmt.Resource.some((res: string) => res.includes("s3"))
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Action).toContain("s3:GetObject");
        expect(s3Statement.Action).toContain("s3:PutObject");
        expect(s3Statement.Action).toContain("s3:ListBucket");
      
        // Verify KMS permissions
        const kmsStatement = policy.Statement.find((stmt: any) =>
          stmt.Action && stmt.Action.includes("kms:Decrypt")
        );
        expect(kmsStatement).toBeDefined();
        expect(kmsStatement.Action).toContain("kms:GenerateDataKey");
      }, 20000);
    });

    describe("CloudWatch Monitoring", () => {
      test("CPU alarm exists and is properly configured", async () => {
        const alarmArn = stackOutputs["cpu-alarm-arn"];
        const alarmName = alarmArn.split(':').pop();
      
        const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: [alarmName!]
        }));
      
        expect(MetricAlarms).toHaveLength(1);
        const alarm = MetricAlarms![0];
      
        expect(alarm.AlarmName).toBe("iac-aws-nova-model-breaking-dev-cpu-high");
        expect(alarm.MetricName).toBe("CPUUtilization");
        expect(alarm.Namespace).toBe("AWS/EC2");
        expect(alarm.Statistic).toBe("Average");
        expect(alarm.Period).toBe(120);
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
        expect(alarm.Dimensions).toHaveLength(1);
        expect(alarm.Dimensions![0].Name).toBe("AutoScalingGroupName");
        expect(alarm.Dimensions![0].Value).toBe(stackOutputs["autoscaling-group-name"]);
      }, 20000);
    });

    describe("Resource Tagging and Compliance", () => {
      test("VPC resources have proper tagging", async () => {
        const vpcId = stackOutputs["vpc-id"];
      
        const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        const vpcTags = Vpcs![0].Tags || [];
      
        expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "IaC - AWS Nova Model Breaking")).toBe(true);
        expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "dev")).toBe(true);
        expect(vpcTags.some(tag => tag.Key === "Name" && tag.Value === "iac-aws-nova-model-breaking-dev-vpc")).toBe(true);
      }, 20000);

      test("Security groups have proper tagging", async () => {
        const webSgId = stackOutputs["web-security-group-id"];
        const dbSgId = stackOutputs["db-security-group-id"];
      
        const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
          GroupIds: [webSgId, dbSgId]
        }));
      
        SecurityGroups?.forEach(sg => {
          const sgTags = sg.Tags || [];
          expect(sgTags.some(tag => tag.Key === "Project" && tag.Value === "IaC - AWS Nova Model Breaking")).toBe(true);
          expect(sgTags.some(tag => tag.Key === "Environment" && tag.Value === "dev")).toBe(true);
          expect(sgTags.some(tag => tag.Key === "Name")).toBe(true);
        });
      }, 20000);
    });

    describe("Network Security Validation", () => {
      test("Private subnets do not have direct internet access", async () => {
        const privateSubnetIds = stackOutputs["private-subnet-ids"];
        const vpcId = stackOutputs["vpc-id"];
      
        const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        }));
      
        privateSubnetIds.forEach((subnetId: string) => {
          const privateRouteTable = RouteTables?.find(rt =>
            rt.Associations?.some(assoc => assoc.SubnetId === subnetId)
          );
        
          if (privateRouteTable) {
            // Private route table should not have direct internet gateway routes
            const hasDirectInternetRoute = privateRouteTable.Routes?.some(route =>
              route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
            );
            expect(hasDirectInternetRoute).toBe(false);
          }
        });
      }, 20000);

      test("RDS is only accessible from web security group", async () => {
        const dbSgId = stackOutputs["db-security-group-id"];
        const webSgId = stackOutputs["web-security-group-id"];
      
        const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
          GroupIds: [dbSgId]
        }));
      
        const dbSg = SecurityGroups![0];
      
        // Verify only MySQL port is open and only to web security group
        const mysqlRules = dbSg.IpPermissions?.filter(rule =>
          rule.FromPort === 3306 && rule.ToPort === 3306
        );
      
        expect(mysqlRules).toHaveLength(1);
        expect(mysqlRules![0].UserIdGroupPairs).toHaveLength(1);
        expect(mysqlRules![0].UserIdGroupPairs![0].GroupId).toBe(webSgId);
      
        // Ensure no CIDR blocks are allowed (no direct IP access)
        expect(mysqlRules![0].IpRanges).toHaveLength(0);
      }, 20000);
    });

    describe("Output Validation", () => {
      test("All required outputs are present and valid", () => {
        expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
        expect(stackOutputs["public-subnet-ids"]).toHaveLength(2);
        expect(stackOutputs["private-subnet-ids"]).toHaveLength(2);
      
        stackOutputs["public-subnet-ids"].forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });
      
        stackOutputs["private-subnet-ids"].forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });
      
        expect(stackOutputs["s3-bucket-name"]).toMatch(/^[a-z0-9-]+$/);
        expect(stackOutputs["cpu-alarm-arn"]).toMatch(/^arn:aws:cloudwatch:/);
        expect(stackOutputs["autoscaling-group-name"]).toBe("iac-aws-nova-model-breaking-dev-asg");
        expect(stackOutputs["vpc-cidr"]).toBe("10.0.0.0/16");
        expect(stackOutputs["web-security-group-id"]).toMatch(/^sg-[a-f0-9]{17}$/);
        expect(stackOutputs["db-security-group-id"]).toMatch(/^sg-[a-f0-9]{17}$/);
      });

      test("Load balancer DNS name follows expected pattern", () => {
        const albDns = stackOutputs["load-balancer-dns"];
        expect(albDns).toMatch(/^iac-aws-no-dev-alb-\d+\.us-east-1\.elb\.amazonaws\.com$/);
        expect(albDns).toContain("us-east-1.elb.amazonaws.com");
      });

      test("S3 bucket ARN is properly formatted", () => {
        const bucketArn = stackOutputs["s3-bucket-arn"];
        const bucketName = stackOutputs["s3-bucket-name"];
      
        expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
        expect(bucketArn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      });

      test("RDS endpoint is properly formatted", () => {
        const rdsEndpoint = stackOutputs["rds-endpoint"];
        expect(rdsEndpoint).toMatch(/^iac-aws-nova-model-breaking-dev-db\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com:3306$/);
        expect(rdsEndpoint).toContain("us-east-1.rds.amazonaws.com");
        expect(stackOutputs["rds-port"]).toBe(3306);
      });

      test("Auto Scaling Group ARN is properly formatted", () => {
        const asgArn = stackOutputs["autoscaling-group-arn"];
        const asgName = stackOutputs["autoscaling-group-name"];
      
        expect(asgArn).toMatch(/^arn:aws:autoscaling:us-east-1:\d+:autoScalingGroup:[a-f0-9-]+:autoScalingGroupName\/iac-aws-nova-model-breaking-dev-asg$/);
        expect(asgArn).toContain(asgName);
      });

      test("KMS key ID is valid UUID format", () => {
        const kmsKeyId = stackOutputs["kms-key-id"];
        expect(kmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      });

      test("IAM role ARN is properly formatted", () => {
        const roleArn = stackOutputs["ec2-role-arn"];
        expect(roleArn).toMatch(/^arn:aws:iam::\d+:role\/iac-aws-nova-model-breaking-dev-ec2-role$/);
        expect(roleArn).toContain("iac-aws-nova-model-breaking-dev-ec2-role");
      });
    });

    describe("High Availability and Resilience", () => {
      test("Resources are distributed across multiple availability zones", async () => {
        const publicSubnetIds = stackOutputs["public-subnet-ids"];
        const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
        const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        }));
      
        const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
        // Should have exactly 2 different AZs for this configuration
        expect(availabilityZones.size).toBe(2);
      
        // Verify AZs are in the correct region
        availabilityZones.forEach(az => {
          expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
        });
      }, 20000);

      test("Auto Scaling Group can scale across multiple subnets", async () => {
        const asgName = stackOutputs["autoscaling-group-name"];
        const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        }));
      
        const asg = AutoScalingGroups![0];
        const asgSubnetIds = asg.VPCZoneIdentifier?.split(',');
      
        expect(asgSubnetIds).toHaveLength(2);
      
        // Verify subnets are in different AZs
        const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: asgSubnetIds
        }));
      
        const azs = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
        expect(azs.size).toBe(2);
      }, 20000);
    });

    describe("Security Best Practices", () => {
      test("RDS instance follows security best practices", async () => {
        const rdsEndpoint = stackOutputs["rds-endpoint"];
        const dbIdentifier = rdsEndpoint.split('.')[0];
      
        const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
      
        const db = DBInstances![0];
      
        // Verify security configurations
        expect(db.PubliclyAccessible).toBe(false);
        expect(db.StorageEncrypted).toBe(true);
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
        expect(db.DeletionProtection).toBe(false); // Should be true in production
        expect(db.VpcSecurityGroups).toHaveLength(1);
      }, 20000);

      test("Security groups follow least privilege principle", async () => {
        const webSgId = stackOutputs["web-security-group-id"];
        const dbSgId = stackOutputs["db-security-group-id"];
      
        const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
          GroupIds: [webSgId, dbSgId]
        }));
      
        const webSg = SecurityGroups?.find(sg => sg.GroupId === webSgId);
        const dbSg = SecurityGroups?.find(sg => sg.GroupId === dbSgId);
      
        // Web SG should only allow HTTP/HTTPS inbound
        const webInboundRules = webSg?.IpPermissions || [];
        expect(webInboundRules).toHaveLength(2); // HTTP and HTTPS
      
        webInboundRules.forEach(rule => {
          expect([80, 443]).toContain(rule.FromPort);
          expect(rule.IpProtocol).toBe("tcp");
        });
      
        // DB SG should only allow MySQL from web SG
        const dbInboundRules = dbSg?.IpPermissions || [];
        expect(dbInboundRules).toHaveLength(1); // Only MySQL
        expect(dbInboundRules[0].FromPort).toBe(3306);
        expect(dbInboundRules[0].UserIdGroupPairs).toHaveLength(1);
        expect(dbInboundRules[0].UserIdGroupPairs![0].GroupId).toBe(webSgId);
      }, 20000);
    });

    describe("Performance and Monitoring", () => {
      test("Auto Scaling policies are properly configured", async () => {
        const asgName = stackOutputs["autoscaling-group-name"];
        const alarmArn = stackOutputs["cpu-alarm-arn"];
      
        // Verify alarm has scaling action
        const alarmName = alarmArn.split(':').pop();
        const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: [alarmName!]
        }));
      
        const alarm = MetricAlarms![0];
        expect(alarm.AlarmActions).toHaveLength(1);
      
        // The alarm action should be an Auto Scaling policy ARN
        const scalingPolicyArn = alarm.AlarmActions![0];
        expect(scalingPolicyArn).toMatch(/^arn:aws:autoscaling:us-east-1:\d+:scalingPolicy:/);
        expect(scalingPolicyArn).toContain(asgName);
      }, 20000);
    });

    describe("Cost Optimization", () => {
      test("RDS instance uses appropriate size for environment", async () => {
        const rdsEndpoint = stackOutputs["rds-endpoint"];
        const dbIdentifier = rdsEndpoint.split('.')[0];
      
        const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
      
        const db = DBInstances![0];
      
        // For dev environment, should use cost-effective instance class
        expect(db.DBInstanceClass).toBe("db.t3.micro");
        expect(db.AllocatedStorage).toBe(20); // Minimal storage for dev
        expect(db.MultiAZ).toBe(false); // Single AZ for cost savings in dev
      }, 20000);
    });
  });
});
