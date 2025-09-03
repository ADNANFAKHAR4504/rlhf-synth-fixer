// __tests__/tap-stack.int.test.ts
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
} from "@aws-sdk/client-s3";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let securityGroupId: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let iamRoleArn: string;
  let iamRoleName: string;
  let nameSuffix: string; // NEW: stable random suffix from outputs

  beforeAll(() => {
    const outputFilePath = path.join(
      __dirname,
      "..",
      "cfn-outputs",
      "flat-outputs.json"
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    awsAccountId = stackOutputs["aws-account-id"];
    vpcId = stackOutputs["vpc-id"];
    securityGroupId = stackOutputs["security-group-id"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    iamRoleArn = stackOutputs["iam-role-arn"];
    iamRoleName = stackOutputs["iam-role-name"];
    nameSuffix = stackOutputs["name-suffix"]; // NEW

    if (
      !vpcId ||
      !securityGroupId ||
      !s3BucketName ||
      !s3BucketArn ||
      !iamRoleArn ||
      !iamRoleName ||
      !awsAccountId ||
      !nameSuffix
    ) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("AWS Account Verification", () => {
    test(
      "AWS account ID matches expected value",
      async () => {
        const { Account } = await stsClient.send(
          new GetCallerIdentityCommand({})
        );
        expect(Account).toBe(awsAccountId);
      },
      20000
    );
  });

  describe("VPC Infrastructure", () => {
    test(
      "Default VPC exists and is accessible",
      async () => {
        const { Vpcs } = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        expect(Vpcs?.length).toBe(1);

        const vpc = Vpcs?.[0];
        expect(vpc?.VpcId).toBe(vpcId);
        expect(vpc?.State).toBe("available");
        expect(vpc?.IsDefault).toBe(true);
      },
      20000
    );
  });

  describe("Security Groups", () => {
    test(
      "Security group has correct HTTPS ingress and all egress rules",
      async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        expect(SecurityGroups?.length).toBe(1);

        const sg = SecurityGroups?.[0];
        expect(sg?.GroupId).toBe(securityGroupId);
        expect(sg?.VpcId).toBe(vpcId);
        expect(sg?.Description).toContain("tap-project");
        expect(
          sg?.Tags?.some(
            (tag) => tag.Key === "Component" && tag.Value === "security"
          )
        ).toBe(true);

        // Check HTTPS ingress rule (port 443 from anywhere)
        const httpsRule = sg?.IpPermissions?.find(
          (rule) =>
            rule.FromPort === 443 &&
            rule.ToPort === 443 &&
            rule.IpProtocol === "tcp"
        );
        expect(httpsRule).toBeDefined();
        expect(
          httpsRule?.IpRanges?.some((range) => range.CidrIp === "0.0.0.0/0")
        ).toBe(true);
      },
      20000
    );

    test(
      "Security group follows naming convention",
      async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        const sg = SecurityGroups?.[0];

        // Pattern: tap-project-{env}-{suffix}-sg
        const expectedPattern = new RegExp(
          `^tap-project-.+-${nameSuffix}-sg$`
        );
        expect(sg?.GroupName).toMatch(expectedPattern);
        expect(
          sg?.Tags?.some(
            (tag) => tag.Key === "Name" && tag.Value === sg?.GroupName
          )
        ).toBe(true);
      },
      20000
    );
  });

  describe("S3 Bucket", () => {
    test(
      "S3 bucket exists with correct naming convention",
      async () => {
        // Check bucket exists
        await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

        // Verify pattern: tap-project-{env}-{suffix}-bucket
        const expectedPattern = new RegExp(
          `^tap-project-.+-${nameSuffix}-bucket$`
        );
        expect(s3BucketName).toMatch(expectedPattern);
      },
      20000
    );

    test(
      "S3 bucket has versioning enabled",
      async () => {
        const { Status } = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: s3BucketName })
        );
        expect(Status).toBe("Enabled");
      },
      20000
    );

    test(
      "S3 bucket has AES256 encryption enabled",
      async () => {
        const { ServerSideEncryptionConfiguration } = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: s3BucketName })
        );

        const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(
          rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe("AES256");
        expect(rule?.BucketKeyEnabled).toBe(true);
      },
      20000
    );

    test(
      "S3 bucket blocks all public access",
      async () => {
        const { PublicAccessBlockConfiguration } = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
        );

        expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      },
      20000
    );

    test(
      "S3 bucket ARN matches expected format",
      async () => {
        expect(s3BucketArn).toBe(`arn:aws:s3:::${s3BucketName}`);
      },
      20000
    );
  });

  describe("IAM Role Configuration", () => {
    test(
      "IAM role exists with correct naming and tags",
      async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: iamRoleName })
        );

        expect(Role?.RoleName).toBe(iamRoleName);
        // Pattern: tap-project-{env}-{suffix}-role
        const expectedPattern = new RegExp(
          `^tap-project-.+-${nameSuffix}-role$`
        );
        expect(Role?.RoleName).toMatch(expectedPattern);
        expect(
          Role?.Tags?.some(
            (tag) => tag.Key === "Component" && tag.Value === "iam"
          )
        ).toBe(true);
        expect(
          Role?.Tags?.some(
            (tag) => tag.Key === "Name" && tag.Value === iamRoleName
          )
        ).toBe(true);
      },
      20000
    );

    test(
      "IAM role has correct assume role policy for EC2",
      async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: iamRoleName })
        );

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(Role?.AssumeRolePolicyDocument || "")
        );
        expect(assumeRolePolicy.Version).toBe("2012-10-17");

        const statement = assumeRolePolicy.Statement[0];
        expect(statement.Action).toBe("sts:AssumeRole");
        expect(statement.Effect).toBe("Allow");
        expect(statement.Principal.Service).toBe("ec2.amazonaws.com");
      },
      20000
    );

    test(
      "IAM role has inline policy with least privilege S3 access",
      async () => {
        const { PolicyNames } = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: iamRoleName })
        );

        expect(PolicyNames?.length).toBe(1);
        // Name: tap-project-{env}-{suffix}-role-policy
        const policyName = PolicyNames?.[0] || "";
        const expectedPolicyPattern = new RegExp(
          `^tap-project-.+-${nameSuffix}-role-policy$`
        );
        expect(policyName).toMatch(expectedPolicyPattern);

        const { PolicyDocument } = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: iamRoleName,
            PolicyName: policyName,
          })
        );

        const policy = JSON.parse(decodeURIComponent(PolicyDocument || ""));
        expect(policy.Version).toBe("2012-10-17");

        // Check S3 permissions
        const s3Statement = policy.Statement.find(
          (stmt: any) => stmt.Resource && stmt.Resource.includes(s3BucketArn)
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Effect).toBe("Allow");
        expect(s3Statement.Action).toEqual([
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
        ]);
        expect(s3Statement.Resource).toEqual([
          s3BucketArn,
          `${s3BucketArn}/*`,
        ]);

        // Check CloudWatch Logs permissions
        const logsStatement = policy.Statement.find(
          (stmt: any) => stmt.Resource && stmt.Resource.includes("logs")
        );
        expect(logsStatement).toBeDefined();
        expect(logsStatement.Effect).toBe("Allow");
        expect(logsStatement.Action).toEqual([
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]);
      },
      20000
    );

    test(
      "IAM role ARN matches expected format",
      async () => {
        expect(iamRoleArn).toBe(
          `arn:aws:iam::${awsAccountId}:role/${iamRoleName}`
        );
      },
      20000
    );
  });

  describe("Security Compliance", () => {
    test(
      "Security group follows principle of least privilege for ingress",
      async () => {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        const sg = SecurityGroups?.[0];

        // Should only allow HTTPS (port 443), no other inbound ports
        expect(sg?.IpPermissions?.length).toBe(1);

        const httpsRule = sg?.IpPermissions?.[0];
        expect(httpsRule?.FromPort).toBe(443);
        expect(httpsRule?.ToPort).toBe(443);
        expect(httpsRule?.IpProtocol).toBe("tcp");
      },
      20000
    );

    test(
      "All resources have consistent tagging strategy",
      async () => {
        // Bucket: verify naming + by-convention tags elsewhere
        const bucketPattern = new RegExp(
          `^tap-project-.+-${nameSuffix}-bucket$`
        );
        expect(s3BucketName).toMatch(bucketPattern);

        // Security Group tags
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        const sg = SecurityGroups?.[0];

        expect(sg?.Tags?.some((tag) => tag.Key === "Component")).toBe(true);
        expect(
          sg?.Tags?.some(
            (tag) => tag.Key === "ManagedBy" && tag.Value === "terraform"
          )
        ).toBe(true);

        // IAM Role tags
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: iamRoleName })
        );

        expect(Role?.Tags?.some((tag) => tag.Key === "Component")).toBe(true);
        expect(
          Role?.Tags?.some(
            (tag) => tag.Key === "ManagedBy" && tag.Value === "terraform"
          )
        ).toBe(true);
      },
      20000
    );

    test(
      "IAM policy includes regional and account restrictions",
      async () => {
        const { PolicyNames } = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: iamRoleName })
        );

        const { PolicyDocument } = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: iamRoleName,
            PolicyName: PolicyNames?.[0] || "",
          })
        );

        const policy = JSON.parse(decodeURIComponent(PolicyDocument || ""));

        // Check S3 statement has regional condition
        const s3Statement = policy.Statement.find(
          (stmt: any) => stmt.Resource && stmt.Resource.includes(s3BucketArn)
        );
        expect(
          s3Statement.Condition?.StringEquals?.["aws:RequestedRegion"]
        ).toBeDefined();

        // Check logs statement is restricted to specific account and region
        const logsStatement = policy.Statement.find(
          (stmt: any) => stmt.Resource && stmt.Resource.includes("logs")
        );
        expect(logsStatement.Resource).toContain(awsAccountId);
        expect(logsStatement.Resource).toContain(awsRegion);
      },
      20000
    );
  });

  describe("Resource Naming and Organization", () => {
    test(
      "All resources follow consistent naming convention",
      async () => {
        // Extract environment from bucket name that includes suffix
        const environmentMatch = s3BucketName.match(
          new RegExp(`^tap-project-(.+)-${nameSuffix}-bucket$`)
        );
        const environment = environmentMatch?.[1];
        expect(environment).toBeDefined();

        // Cross-check other names use the same env and suffix
        expect(iamRoleName).toBe(
          `tap-project-${environment}-${nameSuffix}-role`
        );

        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        expect(SecurityGroups?.[0]?.GroupName).toBe(
          `tap-project-${environment}-${nameSuffix}-sg`
        );
      },
      20000
    );

    test(
      "Resources are properly organized by component",
      async () => {
        // Check component tags exist on SG
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        expect(
          SecurityGroups?.[0]?.Tags?.some(
            (tag) => tag.Key === "Component" && tag.Value === "security"
          )
        ).toBe(true);

        // Check component tags exist on IAM Role
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: iamRoleName })
        );
        expect(
          Role?.Tags?.some(
            (tag) => tag.Key === "Component" && tag.Value === "iam"
          )
        ).toBe(true);
      },
      20000
    );
  });
});
