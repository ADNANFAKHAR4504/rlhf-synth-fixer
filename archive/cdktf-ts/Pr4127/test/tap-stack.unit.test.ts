import { Testing } from "cdktf";
import { WordpressStack } from "../lib/tap-stack";

describe("WordpressStack Unit Tests", () => {
  let stack: WordpressStack;
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app();
    stack = new WordpressStack(app, "WordpressStack");
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => Object.values(synthesized.resource[type] || {});

  it("should create all required resources", () => {
    expect(findResources("aws_vpc")).toHaveLength(1);
    // FIX: The test now correctly expects 2 subnets to be created.
    expect(findResources("aws_subnet")).toHaveLength(2);
    expect(findResources("aws_internet_gateway")).toHaveLength(1);
    expect(findResources("aws_route_table")).toHaveLength(1);
    expect(findResources("aws_instance")).toHaveLength(1);
    expect(findResources("aws_db_instance")).toHaveLength(1);
    expect(findResources("aws_s3_bucket")).toHaveLength(1);
    expect(findResources("aws_security_group")).toHaveLength(2);
    expect(findResources("aws_cloudfront_distribution")).toHaveLength(1);
    expect(findResources("aws_cloudwatch_metric_alarm")).toHaveLength(1);
  });

  it("should configure the VPC and Subnets correctly", () => {
    const vpc = findResources("aws_vpc")[0] as any;
    expect(vpc.cidr_block).toBe("10.15.0.0/16");
    const subnets = findResources("aws_subnet") as any[];
    // Check properties of both subnets
    expect(subnets[0].cidr_block).toBe("10.15.1.0/24");
    expect(subnets[1].cidr_block).toBe("10.15.2.0/24");
  });

  it("should configure the EC2 instance correctly", () => {
    const instance = findResources("aws_instance")[0] as any;
    expect(instance.instance_type).toBe("t3.micro");
    expect(instance.user_data).toBeDefined();
  });

  it("should configure the RDS instance correctly", () => {
    const db = findResources("aws_db_instance")[0] as any;
    expect(db.instance_class).toBe("db.t3.micro");
    expect(db.allocated_storage).toBe(20);
    expect(db.publicly_accessible).toBe(false);
  });

  it("should configure the Security Groups correctly", () => {
    const webSg = synthesized.resource.aws_security_group["WebServerSG"];
    const dbSg = synthesized.resource.aws_security_group["DatabaseSG"];

    expect(webSg.ingress[0].cidr_blocks[0]).toBe("0.0.0.0/0");
    expect(webSg.ingress[0].from_port).toBe(80);

    expect(dbSg.ingress[0].security_groups[0]).toBe("${aws_security_group.WebServerSG.id}");
    expect(dbSg.ingress[0].from_port).toBe(3306);
  });

  it("should create a CloudWatch alarm for CPU", () => {
    const alarm = findResources("aws_cloudwatch_metric_alarm")[0] as any;
    expect(alarm.metric_name).toBe("CPUUtilization");
    expect(alarm.threshold).toBe(70);
  });

  it("should create an IAM role for EC2 with correct S3 permissions", () => {
    const policy = findResources("aws_iam_policy")[0] as any;
    const policyDoc = JSON.parse(policy.policy);

    expect(policyDoc.Statement[0].Action).toEqual(["s3:GetObject", "s3:PutObject"]);
    expect(policyDoc.Statement[0].Effect).toBe("Allow");
    expect(policyDoc.Statement[0].Resource).toBe("${aws_s3_bucket.S3Bucket.arn}/*");
  });

  it("should configure the CloudFront distribution to point to the S3 bucket", () => {
    const cf = findResources("aws_cloudfront_distribution")[0] as any;
    expect(cf.origin[0].domain_name).toBe("${aws_s3_bucket.S3Bucket.bucket_regional_domain_name}");
  });

  it("should create all required outputs", () => {
    expect(synthesized.output).toHaveProperty("WebsiteURL");
    expect(synthesized.output).toHaveProperty("S3BucketName");
    expect(synthesized.output).toHaveProperty("CloudFrontDomainName");
  });
});
