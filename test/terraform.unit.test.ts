import { readFileSync } from "fs";
import { join } from "path";
import * as hclParser from "hcl-to-json";

const tfFilePath = join(__dirname, "../tap_stack.tf");
const tfFileContent = readFileSync(tfFilePath, "utf-8");
const tfJson = hclParser(tfFileContent);

// Helper function to find resource by type
function findResource(type: string) {
  return tfJson.resource?.[type] || {};
}

// Helper function to find variable by name
function findVariable(name: string) {
  return tfJson.variable?.[name] || null;
}

// Helper function to find output by name
function findOutput(name: string) {
  return tfJson.output?.[name] || null;
}

describe("tap_stack.tf static verification", () => {
  it("declares all required variables", () => {
    expect(findVariable("region")).toBeDefined();
    expect(findVariable("environment")).toBeDefined();
    expect(findVariable("project_name")).toBeDefined();
    expect(findVariable("domain_name")).toBeDefined();
    expect(findVariable("alert_email")).toBeDefined();
    expect(findVariable("ssh_allowed_cidr")).toBeDefined();
    expect(findVariable("db_instance_class")).toBeDefined();
    expect(findVariable("eb_instance_type")).toBeDefined();
  });

  it("defines locals for naming and tagging", () => {
    expect(tfJson.locals).toBeDefined();
    expect(tfJson.locals.common_tags).toBeDefined();
    expect(tfJson.locals.name_prefix).toBeDefined();
    expect(tfJson.locals.vpc_cidr).toBeDefined();
    expect(tfJson.locals.azs).toBeDefined();
  });

  it("creates VPC, subnets, and networking resources", () => {
    expect(findResource("aws_vpc").main).toBeDefined();
    expect(findResource("aws_internet_gateway").main).toBeDefined();
    expect(findResource("aws_subnet").public).toBeDefined();
    expect(findResource("aws_subnet").private).toBeDefined();
    expect(findResource("aws_subnet").private_db).toBeDefined();
    expect(findResource("aws_nat_gateway").main).toBeDefined();
    expect(findResource("aws_route_table").public).toBeDefined();
    expect(findResource("aws_route_table").private).toBeDefined();
  });

  it("creates RDS instance with subnet group and security group", () => {
    expect(findResource("aws_security_group").rds).toBeDefined();
    expect(findResource("aws_db_subnet_group").main).toBeDefined();
    expect(findResource("aws_db_instance").main).toBeDefined();
    const rds = findResource("aws_db_instance").main;
    expect(rds.engine).toBe("mysql");
    expect(rds.multi_az).toBe(true);
    expect(rds.db_subnet_group_name).toBeDefined();
    expect(rds.vpc_security_group_ids).toBeDefined();
  });

  it("creates IAM roles and instance profiles", () => {
    expect(findResource("aws_iam_role").eb_service).toBeDefined();
    expect(findResource("aws_iam_role").eb_ec2).toBeDefined();
    expect(findResource("aws_iam_instance_profile").eb_ec2).toBeDefined();
    expect(findResource("aws_iam_role_policy_attachment").eb_service_enhanced_health).toBeDefined();
    expect(findResource("aws_iam_role_policy_attachment").eb_ec2_web_tier).toBeDefined();
  });

  it("creates S3 buckets with encryption and versioning", () => {
    expect(findResource("aws_s3_bucket").app_storage).toBeDefined();
    expect(findResource("aws_s3_bucket_versioning").app_storage).toBeDefined();
    expect(findResource("aws_s3_bucket_server_side_encryption_configuration").app_storage).toBeDefined();
    expect(findResource("aws_s3_bucket_public_access_block").app_storage).toBeDefined();
    expect(findResource("aws_s3_bucket").eb_versions).toBeDefined();
  });

  it("creates Elastic Beanstalk application and environments", () => {
    expect(findResource("aws_elastic_beanstalk_application").main).toBeDefined();
    expect(findResource("aws_elastic_beanstalk_environment").blue).toBeDefined();
    expect(findResource("aws_elastic_beanstalk_environment").green).toBeDefined();
  });

  it("creates Route53 hosted zone and ACM certificate", () => {
    expect(findResource("aws_route53_zone").main).toBeDefined();
    expect(findResource("aws_acm_certificate").main).toBeDefined();
    expect(findResource("aws_acm_certificate_validation").main).toBeDefined();
  });

  it("creates CloudFront distribution and OAI", () => {
    expect(findResource("aws_cloudfront_origin_access_identity").main).toBeDefined();
    expect(findResource("aws_cloudfront_distribution").main).toBeDefined();
  });

  it("creates WAF ACL and CloudWatch monitoring resources", () => {
    expect(findResource("aws_wafv2_web_acl").main).toBeDefined();
    expect(findResource("aws_sns_topic").alerts).toBeDefined();
    expect(findResource("aws_cloudwatch_dashboard").main).toBeDefined();
    expect(findResource("aws_cloudwatch_metric_alarm").rds_cpu).toBeDefined();
    expect(findResource("aws_cloudwatch_metric_alarm").ec2_cpu_high).toBeDefined();
    expect(findResource("aws_cloudwatch_log_group").app_logs).toBeDefined();
  });

  it("declares all critical outputs", () => {
    expect(findOutput("vpc_id")).toBeDefined();
    expect(findOutput("rds_endpoint")).toBeDefined();
    expect(findOutput("rds_secret_arn")).toBeDefined();
    expect(findOutput("s3_app_bucket")).toBeDefined();
    expect(findOutput("eb_application_name")).toBeDefined();
    expect(findOutput("cloudfront_domain_name")).toBeDefined();
    expect(findOutput("waf_web_acl_id")).toBeDefined();
  });
});
