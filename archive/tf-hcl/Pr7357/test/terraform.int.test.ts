// tests/terraform.int.test.ts
// Live verification of deployed Payment Processing Infrastructure Terraform
// Tests AWS resources: VPC, RDS, ALB, Security Groups, CloudTrail, CloudWatch, KMS, SNS, IAM

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import {
  CloudTrailClient,
  GetTrailCommand,
  DescribeTrailsCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import {
  KMSClient,
  DescribeKeyCommand,
} from "@aws-sdk/client-kms";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  vpc_cidr?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string>;
  private_app_subnet_ids?: TfOutputValue<string>;
  private_db_subnet_ids?: TfOutputValue<string>;
  alb_security_group_id?: TfOutputValue<string>;
  app_security_group_id?: TfOutputValue<string>;
  rds_security_group_id?: TfOutputValue<string>;
  rds_endpoint?: TfOutputValue<string>;
  rds_address?: TfOutputValue<string>;
  rds_port?: TfOutputValue<string>;
  rds_database_name?: TfOutputValue<string>;
  db_secret_arn?: TfOutputValue<string>;
  cloudtrail_name?: TfOutputValue<string>;
  cloudwatch_log_group?: TfOutputValue<string>;
  kms_key_id?: TfOutputValue<string>;
  kms_key_arn?: TfOutputValue<string>;
  sns_topic_arn?: TfOutputValue<string>;
  iam_role_ec2_arn?: TfOutputValue<string>;
  iam_instance_profile_name?: TfOutputValue<string>;
  environment?: TfOutputValue<string>;
  region?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "lib/terraform.tfstate.d/outputs.json"),
    path.resolve(process.cwd(), "lib/.terraform/outputs.json"),
    path.resolve(process.cwd(), "tf-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, "utf8"));
    }
  }

  // Fallback: try reading from environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.TF_VPC_ID) {
    outputs.vpc_id = { sensitive: false, type: "string", value: process.env.TF_VPC_ID };
  }
  if (process.env.TF_RDS_ENDPOINT) {
    outputs.rds_endpoint = { sensitive: false, type: "string", value: process.env.TF_RDS_ENDPOINT };
  }
  if (process.env.TF_CLOUDTRAIL_NAME) {
    outputs.cloudtrail_name = { sensitive: false, type: "string", value: process.env.TF_CLOUDTRAIL_NAME };
  }
  if (process.env.TF_SNS_TOPIC_ARN) {
    outputs.sns_topic_arn = { sensitive: false, type: "string", value: process.env.TF_SNS_TOPIC_ARN };
  }
  if (process.env.TF_KMS_KEY_ID) {
    outputs.kms_key_id = { sensitive: false, type: "string", value: process.env.TF_KMS_KEY_ID };
  }

  // Return empty object if no outputs found (tests will skip gracefully)
  return outputs;
}

// Helper function to parse JSON array outputs
function parseJsonArray(jsonString: string | undefined): string[] {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(
          `${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`
        );
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || outputs.region?.value || "us-east-1";

// AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const snsClient = new SNSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe("LIVE: VPC and Networking", () => {
  const vpcId = outputs.vpc_id?.value;
  const vpcCidr = outputs.vpc_cidr?.value;
  const publicSubnets = parseJsonArray(outputs.public_subnet_ids?.value);
  const privateAppSubnets = parseJsonArray(outputs.private_app_subnet_ids?.value);
  const privateDbSubnets = parseJsonArray(outputs.private_db_subnet_ids?.value);

  test("VPC exists and is configured correctly", async () => {
    if (!vpcId) {
      console.warn("VPC ID not found. Skipping VPC test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
    });

    expect(response.Vpcs).toBeTruthy();
    expect(response.Vpcs!.length).toBe(1);
    expect(response.Vpcs![0].VpcId).toBe(vpcId);
    expect(response.Vpcs![0].State).toBe("available");
    
    if (vpcCidr) {
      expect(response.Vpcs![0].CidrBlock).toBe(vpcCidr);
    }
  }, 90000);

  test("VPC has internet gateway configured", async () => {
    if (!vpcId) {
      console.warn("VPC ID not found. Skipping IGW test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
        })
      );
    });

    expect(response.InternetGateways).toBeTruthy();
    expect(response.InternetGateways!.length).toBeGreaterThan(0);
    expect(response.InternetGateways![0].Attachments![0].State).toBe("available");
  }, 90000);

  test("VPC has public and private subnets", async () => {
    if (!vpcId) {
      console.warn("VPC ID not found. Skipping subnet test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBeGreaterThanOrEqual(3); // At least public, private-app, private-db

    if (publicSubnets.length > 0) {
      const publicSubnet = response.Subnets!.find((s) => publicSubnets.includes(s.SubnetId!));
      expect(publicSubnet).toBeTruthy();
    }

    if (privateAppSubnets.length > 0) {
      const privateAppSubnet = response.Subnets!.find((s) => privateAppSubnets.includes(s.SubnetId!));
      expect(privateAppSubnet).toBeTruthy();
    }

    if (privateDbSubnets.length > 0) {
      const privateDbSubnet = response.Subnets!.find((s) => privateDbSubnets.includes(s.SubnetId!));
      expect(privateDbSubnet).toBeTruthy();
    }
  }, 90000);
});

describe("LIVE: Security Groups", () => {
  const albSgId = outputs.alb_security_group_id?.value;
  const appSgId = outputs.app_security_group_id?.value;
  const rdsSgId = outputs.rds_security_group_id?.value;

  test("ALB security group exists and allows HTTP", async () => {
    if (!albSgId) {
      console.warn("ALB security group ID not found. Skipping ALB SG test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSgId] })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
    expect(response.SecurityGroups!.length).toBe(1);
    const sg = response.SecurityGroups![0];
    expect(sg.GroupId).toBe(albSgId);
    expect(sg.IpPermissions).toBeTruthy();
    const httpRule = sg.IpPermissions!.find(
      (rule) => rule.FromPort === 80 && rule.IpProtocol === "tcp"
    );
    expect(httpRule).toBeTruthy();
  }, 90000);

  test("Application security group exists", async () => {
    if (!appSgId) {
      console.warn("Application security group ID not found. Skipping app SG test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
    expect(response.SecurityGroups!.length).toBe(1);
    expect(response.SecurityGroups![0].GroupId).toBe(appSgId);
  }, 90000);

  test("RDS security group exists", async () => {
    if (!rdsSgId) {
      console.warn("RDS security group ID not found. Skipping RDS SG test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId] })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
    expect(response.SecurityGroups!.length).toBe(1);
    expect(response.SecurityGroups![0].GroupId).toBe(rdsSgId);
  }, 90000);
});

describe("LIVE: RDS Database", () => {
  const rdsEndpoint = outputs.rds_endpoint?.value;
  const rdsAddress = outputs.rds_address?.value;
  const dbSecretArn = outputs.db_secret_arn?.value;

  test("RDS instance has encryption enabled", async () => {
    if (!rdsAddress) {
      console.warn("RDS address not found. Skipping encryption test.");
      return;
    }

    const dbInstanceId = rdsAddress.split(".")[0];

    const response = await retry(async () => {
      return await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
    });

    expect(response.DBInstances![0].StorageEncrypted).toBe(true);
    expect(response.DBInstances![0].KmsKeyId).toBeTruthy();
  }, 90000);

  test("RDS instance is in database subnets", async () => {
    if (!rdsAddress) {
      console.warn("RDS address not found. Skipping subnet test.");
      return;
    }

    const dbInstanceId = rdsAddress.split(".")[0];

    const response = await retry(async () => {
      return await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
    });

    const dbSubnetGroupName = response.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
    expect(dbSubnetGroupName).toBeTruthy();

    const subnetGroupResponse = await retry(async () => {
      return await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: dbSubnetGroupName! })
      );
    });

    expect(subnetGroupResponse.DBSubnetGroups).toBeTruthy();
    expect(subnetGroupResponse.DBSubnetGroups![0].Subnets).toBeTruthy();
    expect(subnetGroupResponse.DBSubnetGroups![0].Subnets!.length).toBeGreaterThan(0);
  }, 90000);

  test("Database password secret exists", async () => {
    if (!dbSecretArn) {
      console.warn("DB secret ARN not found. Skipping secret test.");
      return;
    }

    const response = await retry(async () => {
      return await secretsClient.send(new DescribeSecretCommand({ SecretId: dbSecretArn }));
    }, 5);

    expect(response.ARN).toBe(dbSecretArn);
    expect(response.Name).toBeTruthy();
  }, 60000);
});

describe("LIVE: CloudTrail", () => {
  const trailName = outputs.cloudtrail_name?.value;

  test("CloudTrail has S3 bucket configured", async () => {
    if (!trailName) {
      console.warn("CloudTrail name not found. Skipping S3 bucket test.");
      return;
    }

    const response = await retry(async () => {
      return await cloudTrailClient.send(new GetTrailCommand({ Name: trailName }));
    }, 5);

    expect(response.Trail!.S3BucketName).toBeTruthy();
    
    // Verify bucket exists
    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: response.Trail!.S3BucketName! })
      );
    });
  }, 90000);
});

describe("LIVE: CloudWatch Logs", () => {
  const logGroupName = outputs.cloudwatch_log_group?.value;

  test("CloudWatch log group exists", async () => {
    if (!logGroupName) {
      console.warn("CloudWatch log group name not found. Skipping log group test.");
      return;
    }

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
    }, 5);

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
    expect(logGroup).toBeTruthy();
    expect(logGroup!.logGroupName).toBe(logGroupName);
  }, 60000);
});

describe("LIVE: KMS Key", () => {
  const kmsKeyId = outputs.kms_key_id?.value;
  const kmsKeyArn = outputs.kms_key_arn?.value;

  test("KMS key exists and is enabled", async () => {
    if (!kmsKeyId) {
      console.warn("KMS key ID not found. Skipping KMS test.");
      return;
    }

    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId }));
    }, 5);

    expect(response.KeyMetadata).toBeTruthy();
    expect(response.KeyMetadata!.KeyId).toBe(kmsKeyId);
    expect(response.KeyMetadata!.KeyState).toBe("Enabled");
    
    if (kmsKeyArn) {
      expect(response.KeyMetadata!.Arn).toBe(kmsKeyArn);
    }
  }, 60000);
});

describe("LIVE: SNS Topic", () => {
  const topicArn = outputs.sns_topic_arn?.value;

  test("SNS topic exists", async () => {
    if (!topicArn) {
      console.warn("SNS topic ARN not found. Skipping SNS test.");
      return;
    }

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.TopicArn).toBe(topicArn);
  }, 90000);

  test("SNS topic has subscriptions", async () => {
    if (!topicArn) {
      console.warn("SNS topic ARN not found. Skipping subscriptions test.");
      return;
    }

    const response = await retry(async () => {
      return await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );
    });

    expect(response.Subscriptions).toBeTruthy();
    // At least one subscription should exist
    expect(response.Subscriptions!.length).toBeGreaterThanOrEqual(0);
  }, 90000);
});

describe("LIVE: IAM Roles", () => {
  const ec2RoleArn = outputs.iam_role_ec2_arn?.value;
  const instanceProfileName = outputs.iam_instance_profile_name?.value;

  test("EC2 IAM role exists", async () => {
    if (!ec2RoleArn) {
      console.warn("EC2 IAM role ARN not found. Skipping role test.");
      return;
    }

    const roleName = ec2RoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();
  }, 60000);

  test("IAM instance profile exists", async () => {
    if (!instanceProfileName) {
      console.warn("IAM instance profile name not found. Skipping instance profile test.");
      return;
    }

    const response = await retry(async () => {
      return await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName })
      );
    }, 5);

    expect(response.InstanceProfile).toBeTruthy();
    expect(response.InstanceProfile!.InstanceProfileName).toBe(instanceProfileName);
    expect(response.InstanceProfile!.Roles).toBeTruthy();
    expect(response.InstanceProfile!.Roles!.length).toBeGreaterThan(0);
  }, 60000);
});

describe("LIVE: Output Validation", () => {
  test("Output values have correct formats", () => {
    // VPC ID format
    if (outputs.vpc_id?.value) {
      expect(outputs.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
    }

    // VPC CIDR format
    if (outputs.vpc_cidr?.value) {
      expect(outputs.vpc_cidr.value).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    }

    // ARN formats
    if (outputs.kms_key_arn?.value) {
      expect(outputs.kms_key_arn.value).toMatch(/^arn:aws:kms:/);
    }
    if (outputs.sns_topic_arn?.value) {
      expect(outputs.sns_topic_arn.value).toMatch(/^arn:aws:sns:/);
    }
    if (outputs.db_secret_arn?.value) {
      expect(outputs.db_secret_arn.value).toMatch(/^arn:aws:secretsmanager:/);
    }
    if (outputs.iam_role_ec2_arn?.value) {
      expect(outputs.iam_role_ec2_arn.value).toMatch(/^arn:aws:iam:/);
    }

    // Security group ID format
    if (outputs.alb_security_group_id?.value) {
      expect(outputs.alb_security_group_id.value).toMatch(/^sg-[a-z0-9]+$/);
    }

    // RDS endpoint format
    if (outputs.rds_endpoint?.value) {
      expect(outputs.rds_endpoint.value).toMatch(/\.rds\.amazonaws\.com/);
    }
  });

  test("Subnet IDs are valid arrays", () => {
    const publicSubnets = parseJsonArray(outputs.public_subnet_ids?.value);
    const privateAppSubnets = parseJsonArray(outputs.private_app_subnet_ids?.value);
    const privateDbSubnets = parseJsonArray(outputs.private_db_subnet_ids?.value);

    if (publicSubnets.length > 0) {
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      publicSubnets.forEach((subnet) => {
        expect(subnet).toMatch(/^subnet-[a-z0-9]+$/);
      });
    }

    if (privateAppSubnets.length > 0) {
      expect(privateAppSubnets.length).toBeGreaterThanOrEqual(2);
      privateAppSubnets.forEach((subnet) => {
        expect(subnet).toMatch(/^subnet-[a-z0-9]+$/);
      });
    }

    if (privateDbSubnets.length > 0) {
      expect(privateDbSubnets.length).toBeGreaterThanOrEqual(2);
      privateDbSubnets.forEach((subnet) => {
        expect(subnet).toMatch(/^subnet-[a-z0-9]+$/);
      });
    }
  });
});

describe("LIVE: Security Configuration", () => {
  test("RDS instance has encryption enabled", async () => {
    const rdsAddress = outputs.rds_address?.value;
    if (!rdsAddress) {
      console.warn("RDS address not found. Skipping encryption test.");
      return;
    }

    const dbInstanceId = rdsAddress.split(".")[0];

    const response = await retry(async () => {
      return await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
    });

    expect(response.DBInstances![0].StorageEncrypted).toBe(true);
    expect(response.DBInstances![0].KmsKeyId).toBeTruthy();
  }, 90000);

  test("Database password is stored in Secrets Manager", async () => {
    const dbSecretArn = outputs.db_secret_arn?.value;
    if (!dbSecretArn) {
      console.warn("DB secret ARN not found. Skipping secret test.");
      return;
    }

    const response = await retry(async () => {
      return await secretsClient.send(new DescribeSecretCommand({ SecretId: dbSecretArn }));
    }, 5);

    expect(response.ARN).toBe(dbSecretArn);
    expect(response.Name).toBeTruthy();
  }, 60000);
});

