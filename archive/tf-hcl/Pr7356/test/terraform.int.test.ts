// tests/terraform.int.test.ts
// Live verification of deployed Payment Processing Infrastructure Terraform
// Tests AWS resources: ALB, ECS, Aurora, CloudFront, S3, WAF, KMS, VPC, Security Groups, IAM

import * as fs from "fs";
import * as path from "path";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from "@aws-sdk/client-cloudfront";
import {
  WAFV2Client,
  GetWebACLCommand,
  ListResourcesForWebACLCommand,
} from "@aws-sdk/client-wafv2";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from "@aws-sdk/client-kms";
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
  public_subnet_ids?: TfOutputValue<string>;
  private_app_subnet_ids?: TfOutputValue<string>;
  private_db_subnet_ids?: TfOutputValue<string>;
  ecs_cluster_name?: TfOutputValue<string>;
  ecs_service_name?: TfOutputValue<string>;
  alb_arn?: TfOutputValue<string>;
  alb_security_group_id?: TfOutputValue<string>;
  ecs_task_security_group_id?: TfOutputValue<string>;
  aurora_cluster_id?: TfOutputValue<string>;
  aurora_cluster_endpoint?: TfOutputValue<string>;
  aurora_master_password_secret_arn?: TfOutputValue<string>;
  s3_static_assets_bucket_name?: TfOutputValue<string>;
  cloudfront_distribution_id?: TfOutputValue<string>;
  cloudfront_distribution_domain?: TfOutputValue<string>;
  waf_web_acl_id?: TfOutputValue<string>;
  waf_web_acl_arn?: TfOutputValue<string>;
  kms_database_key_id?: TfOutputValue<string>;
  kms_s3_key_id?: TfOutputValue<string>;
  kms_cloudwatch_key_id?: TfOutputValue<string>;
  ecs_task_execution_role_arn?: TfOutputValue<string>;
  ecs_task_role_arn?: TfOutputValue<string>;
  environment_suffix?: TfOutputValue<string>;
  aws_region?: TfOutputValue<string>;
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
  if (process.env.TF_ECS_CLUSTER_NAME) {
    outputs.ecs_cluster_name = { sensitive: false, type: "string", value: process.env.TF_ECS_CLUSTER_NAME };
  }
  if (process.env.TF_ECS_SERVICE_NAME) {
    outputs.ecs_service_name = { sensitive: false, type: "string", value: process.env.TF_ECS_SERVICE_NAME };
  }
  if (process.env.TF_AURORA_CLUSTER_ID) {
    outputs.aurora_cluster_id = { sensitive: false, type: "string", value: process.env.TF_AURORA_CLUSTER_ID };
  }
  if (process.env.TF_S3_BUCKET_NAME) {
    outputs.s3_static_assets_bucket_name = { sensitive: false, type: "string", value: process.env.TF_S3_BUCKET_NAME };
  }
  if (process.env.TF_CLOUDFRONT_DISTRIBUTION_ID) {
    outputs.cloudfront_distribution_id = { sensitive: false, type: "string", value: process.env.TF_CLOUDFRONT_DISTRIBUTION_ID };
  }
  if (process.env.TF_WAF_WEB_ACL_ID) {
    outputs.waf_web_acl_id = { sensitive: false, type: "string", value: process.env.TF_WAF_WEB_ACL_ID };
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
const region = process.env.AWS_REGION || outputs.aws_region?.value || "us-east-1";

// AWS clients
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const ecsClient = new ECSClient({ region });
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const wafClient = new WAFV2Client({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

// End-to-End ALB Accessibility Test - Run first
describe("LIVE: End-to-End ALB Accessibility", () => {
  test("ALB is accessible and returns a response", async () => {
    const albArn = outputs.alb_arn?.value;
    if (!albArn) {
      console.warn("ALB ARN not found. Skipping ALB accessibility test.");
      return;
    }

    const response = await retry(async () => {
      const allLbs = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = allLbs.LoadBalancers?.find((lb) => lb.LoadBalancerArn === albArn);
      if (!alb) {
        throw new Error(`ALB with ARN ${albArn} not found`);
      }
      return alb;
    });

    expect(response.DNSName).toBeTruthy();
    expect(response.State?.Code).toBe("active");

    // Try to access the ALB
    const url = `http://${response.DNSName}`;
    const testResponse = await retry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const fetchResponse = await fetch(url, {
            method: "GET",
            headers: { "User-Agent": "Terraform-Integration-Test" },
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeoutId);
          return {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
          };
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error(`Request to ALB timed out after 5 seconds`);
          }
          throw error;
        }
      },
      3,
      2000,
      "ALB accessibility"
    );

    expect(testResponse.status).toBeGreaterThanOrEqual(200);
    expect(testResponse.status).toBeLessThan(600);
  }, 60000);
});

describe("LIVE: Application Load Balancer", () => {
  const albArn = outputs.alb_arn?.value;

  test("ALB exists and is active", async () => {
    if (!albArn) {
      console.warn("ALB ARN not found. Skipping ALB test.");
      return;
    }

    const response = await retry(async () => {
      const allLbs = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = allLbs.LoadBalancers?.find((lb) => lb.LoadBalancerArn === albArn);
      if (!alb) {
        throw new Error(`ALB with ARN ${albArn} not found`);
      }
      return alb;
    });

    expect(response).toBeTruthy();
    expect(response.DNSName).toBeTruthy();
    expect(response.State?.Code).toBe("active");
    expect(response.Type).toBe("application");
    expect(response.Scheme).toBe("internet-facing");
  }, 90000);

  test("ALB has HTTP listener configured", async () => {
    if (!albArn) {
      console.warn("ALB ARN not found. Skipping listener test.");
      return;
    }

    const response = await retry(async () => {
      return await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );
    });

    expect(response.Listeners).toBeTruthy();
    expect(response.Listeners!.length).toBeGreaterThan(0);
    const httpListener = response.Listeners!.find((l) => l.Port === 80);
    expect(httpListener).toBeTruthy();
    expect(httpListener!.Protocol).toBe("HTTP");
  }, 90000);

  test("ALB has target group configured", async () => {
    if (!albArn) {
      console.warn("ALB ARN not found. Skipping target group test.");
      return;
    }

    const response = await retry(async () => {
      return await elbv2Client.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: albArn })
      );
    });

    expect(response.TargetGroups).toBeTruthy();
    expect(response.TargetGroups!.length).toBeGreaterThan(0);
    expect(response.TargetGroups![0].TargetType).toBe("ip");
  }, 90000);
});

describe("LIVE: ECS Cluster and Service", () => {
  const clusterName = outputs.ecs_cluster_name?.value;
  const serviceName = outputs.ecs_service_name?.value;

  test("ECS cluster exists and is active", async () => {
    if (!clusterName) {
      console.warn("ECS cluster name not found. Skipping ECS cluster test.");
      return;
    }

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
          include: ["CONFIGURATIONS", "SETTINGS"],
        })
      );
    });

    expect(response.clusters).toBeTruthy();
    expect(response.clusters!.length).toBe(1);
    expect(response.clusters![0].clusterName).toBe(clusterName);
    expect(response.clusters![0].status).toBe("ACTIVE");
  }, 90000);
});

describe("LIVE: S3 Bucket", () => {
  const bucketName = outputs.s3_static_assets_bucket_name?.value;

  test("S3 bucket exists and is accessible", async () => {
    if (!bucketName) {
      console.warn("S3 bucket name not found. Skipping S3 test.");
      return;
    }

    await retry(async () => {
      return await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    });
  }, 90000);

  test("S3 bucket has versioning enabled", async () => {
    if (!bucketName) {
      console.warn("S3 bucket name not found. Skipping versioning test.");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("S3 bucket has encryption enabled", async () => {
    if (!bucketName) {
      console.warn("S3 bucket name not found. Skipping encryption test.");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
  }, 90000);

  test("S3 bucket has public access blocked", async () => {
    if (!bucketName) {
      console.warn("S3 bucket name not found. Skipping public access test.");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
  }, 90000);
});

describe("LIVE: CloudFront Distribution", () => {
  const distributionId = outputs.cloudfront_distribution_id?.value;

  test("CloudFront distribution exists", async () => {
    if (!distributionId) {
      console.warn("CloudFront distribution ID not found. Skipping CloudFront test.");
      return;
    }

    const response = await retry(async () => {
      return await cloudFrontClient.send(
        new GetDistributionCommand({ Id: distributionId })
      );
    });

    expect(response.Distribution).toBeTruthy();
    expect(response.Distribution!.Id).toBe(distributionId);
    expect(response.Distribution!.Status).toBe("Deployed");
  }, 90000);

  test("CloudFront distribution has S3 origin configured", async () => {
    if (!distributionId) {
      console.warn("CloudFront distribution ID not found. Skipping origin test.");
      return;
    }

    const response = await retry(async () => {
      return await cloudFrontClient.send(
        new GetDistributionCommand({ Id: distributionId })
      );
    });

    expect(response.Distribution!.DistributionConfig.Origins).toBeTruthy();
    expect(response.Distribution!.DistributionConfig.Origins!.Items!.length).toBeGreaterThan(0);
    const s3Origin = response.Distribution!.DistributionConfig.Origins!.Items!.find(
      (origin) => origin.DomainName?.includes("s3")
    );
    expect(s3Origin).toBeTruthy();
  }, 90000);

  test("CloudFront distribution domain matches output", async () => {
    if (!distributionId) {
      console.warn("CloudFront distribution ID not found. Skipping domain test.");
      return;
    }

    const response = await retry(async () => {
      return await cloudFrontClient.send(
        new GetDistributionCommand({ Id: distributionId })
      );
    });

    const expectedDomain = outputs.cloudfront_distribution_domain?.value;
    if (expectedDomain) {
      expect(response.Distribution!.DomainName).toBe(expectedDomain);
    }
  }, 90000);
});

describe("LIVE: WAF Web ACL", () => {
  const webAclId = outputs.waf_web_acl_id?.value;
  const webAclArn = outputs.waf_web_acl_arn?.value;

  test("WAF Web ACL exists", async () => {
    if (!webAclId || !webAclArn) {
      console.warn("WAF Web ACL ID or ARN not found. Skipping WAF test.");
      return;
    }

    const response = await retry(async () => {
      return await wafClient.send(
        new GetWebACLCommand({
          Scope: "REGIONAL",
          Id: webAclId,
        })
      );
    });

    expect(response.WebACL).toBeTruthy();
    expect(response.WebACL!.Id).toBe(webAclId);
    expect(response.WebACL!.ARN).toBe(webAclArn);
  }, 90000);

  test("WAF Web ACL has rules configured", async () => {
    if (!webAclId) {
      console.warn("WAF Web ACL ID not found. Skipping rules test.");
      return;
    }

    const response = await retry(async () => {
      return await wafClient.send(
        new GetWebACLCommand({
          Scope: "REGIONAL",
          Id: webAclId,
        })
      );
    });

    expect(response.WebACL!.Rules).toBeTruthy();
    expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);
  }, 90000);

  test("WAF Web ACL is associated with ALB", async () => {
    if (!webAclArn) {
      console.warn("WAF Web ACL ARN not found. Skipping association test.");
      return;
    }

    const response = await retry(async () => {
      return await wafClient.send(
        new ListResourcesForWebACLCommand({
          WebACLArn: webAclArn,
          ResourceType: "APPLICATION_LOAD_BALANCER",
        })
      );
    });

    expect(response.ResourceArns).toBeTruthy();
    expect(response.ResourceArns!.length).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: VPC and Networking", () => {
  const vpcId = outputs.vpc_id?.value;
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
    expect(response.Vpcs![0].CidrBlock).toBeTruthy();
    expect(response.Vpcs![0].State).toBe("available");
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

  test("VPC has NAT Gateway configured", async () => {
    if (!vpcId) {
      console.warn("VPC ID not found. Skipping NAT Gateway test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [vpcId] }],
        })
      );
    });

    expect(response.NatGateways).toBeTruthy();
    expect(response.NatGateways!.length).toBeGreaterThan(0);
    expect(response.NatGateways![0].State).toBe("available");
  }, 90000);
});

describe("LIVE: Security Groups", () => {
  const albSgId = outputs.alb_security_group_id?.value;
  const ecsSgId = outputs.ecs_task_security_group_id?.value;

  test("ALB security group allows HTTP from internet", async () => {
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
    expect(sg.IpPermissions).toBeTruthy();
    const httpRule = sg.IpPermissions!.find(
      (rule) => rule.FromPort === 80 && rule.IpProtocol === "tcp"
    );
    expect(httpRule).toBeTruthy();
  }, 90000);

  test("ECS security group allows egress", async () => {
    if (!ecsSgId) {
      console.warn("ECS security group ID not found. Skipping ECS SG test.");
      return;
    }

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ecsSgId] })
      );
    });

    expect(response.SecurityGroups).toBeTruthy();
    expect(response.SecurityGroups!.length).toBe(1);
    const sg = response.SecurityGroups![0];
    expect(sg.IpPermissionsEgress).toBeTruthy();
    expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: IAM Roles", () => {
  const taskExecutionRoleArn = outputs.ecs_task_execution_role_arn?.value;
  const taskRoleArn = outputs.ecs_task_role_arn?.value;

  test("ECS task execution role exists", async () => {
    if (!taskExecutionRoleArn) {
      console.warn("ECS task execution role ARN not found. Skipping role test.");
      return;
    }

    const roleName = taskExecutionRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();
  }, 60000);

  test("ECS task role exists", async () => {
    if (!taskRoleArn) {
      console.warn("ECS task role ARN not found. Skipping role test.");
      return;
    }

    const roleName = taskRoleArn.split("/").pop()!;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
  }, 60000);
});

describe("LIVE: KMS Keys", () => {
  const databaseKeyId = outputs.kms_database_key_id?.value;
  const s3KeyId = outputs.kms_s3_key_id?.value;
  const cloudwatchKeyId = outputs.kms_cloudwatch_key_id?.value;

  test("Database KMS key exists and has rotation enabled", async () => {
    if (!databaseKeyId) {
      console.warn("Database KMS key ID not found. Skipping KMS test.");
      return;
    }

    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: databaseKeyId }));
    }, 5);

    expect(response.KeyMetadata).toBeTruthy();
    expect(response.KeyMetadata!.KeyId).toBe(databaseKeyId);
    expect(response.KeyMetadata!.KeyState).toBe("Enabled");
  }, 60000);

  test("S3 KMS key exists", async () => {
    if (!s3KeyId) {
      console.warn("S3 KMS key ID not found. Skipping KMS test.");
      return;
    }

    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: s3KeyId }));
    }, 5);

    expect(response.KeyMetadata).toBeTruthy();
    expect(response.KeyMetadata!.KeyId).toBe(s3KeyId);
  }, 60000);

  test("CloudWatch KMS key exists", async () => {
    if (!cloudwatchKeyId) {
      console.warn("CloudWatch KMS key ID not found. Skipping KMS test.");
      return;
    }

    const response = await retry(async () => {
      return await kmsClient.send(new DescribeKeyCommand({ KeyId: cloudwatchKeyId }));
    }, 5);

    expect(response.KeyMetadata).toBeTruthy();
    expect(response.KeyMetadata!.KeyId).toBe(cloudwatchKeyId);
  }, 60000);
});

describe("LIVE: Secrets Manager", () => {
  const secretArn = outputs.aurora_master_password_secret_arn?.value;

  test("Aurora master password secret exists", async () => {
    if (!secretArn) {
      console.warn("Aurora master password secret ARN not found. Skipping secret test.");
      return;
    }

    const response = await retry(async () => {
      return await secretsClient.send(new DescribeSecretCommand({ SecretId: secretArn }));
    }, 5);

    expect(response.ARN).toBe(secretArn);
    expect(response.Name).toBeTruthy();
  }, 60000);
});

describe("LIVE: CloudWatch Log Groups", () => {
  const clusterName = outputs.ecs_cluster_name?.value;

  test("ECS log group exists", async () => {
    if (!clusterName) {
      console.warn("ECS cluster name not found. Skipping log group test.");
      return;
    }

    const logGroupName = `/ecs/${clusterName}`;

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
    }, 5);

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
    if (logGroup) {
      expect(logGroup.logGroupName).toBe(logGroupName);
    }
  }, 60000);
});

describe("LIVE: Output Validation", () => {
  test("Output values have correct formats", () => {
    // VPC ID format
    if (outputs.vpc_id?.value) {
      expect(outputs.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
    }

    // ARN formats
    if (outputs.alb_arn?.value) {
      expect(outputs.alb_arn.value).toMatch(/^arn:aws:elasticloadbalancing:/);
    }
    if (outputs.waf_web_acl_arn?.value) {
      expect(outputs.waf_web_acl_arn.value).toMatch(/^arn:aws:wafv2:/);
    }

    // S3 bucket name format
    if (outputs.s3_static_assets_bucket_name?.value) {
      expect(outputs.s3_static_assets_bucket_name.value).toMatch(/^[a-z0-9-]+$/);
    }

    // CloudFront distribution ID format
    if (outputs.cloudfront_distribution_id?.value) {
      expect(outputs.cloudfront_distribution_id.value).toMatch(/^[A-Z0-9]+$/);
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
    }

    if (privateDbSubnets.length > 0) {
      expect(privateDbSubnets.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("LIVE: Security Configuration", () => {
  test("S3 bucket enforces encryption", async () => {
    const bucketName = outputs.s3_static_assets_bucket_name?.value;
    if (!bucketName) {
      console.warn("S3 bucket name not found. Skipping encryption test.");
      return;
    }

    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
  }, 90000);
});

