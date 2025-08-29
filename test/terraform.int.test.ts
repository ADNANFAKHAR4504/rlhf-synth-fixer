import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

/** ---------- Validators ---------- */
const isNonEmptyString = (val: any): boolean =>
  typeof val === "string" && val.trim().length > 0;

const isValidArn = (val: any): boolean => {
  if (typeof val !== "string") return false;
  const generic = /^arn:aws:[\w-]+:[\w-]*:\d{12}:[\w\-/.:]+$/;
  const s3Bucket = /^arn:aws:s3:::[A-Za-z0-9.\-_]{3,63}$/; // S3 bucket ARNs
  return generic.test(val) || s3Bucket.test(val);
};

const isValidVpcId = (v: any) => /^vpc-[a-z0-9]+$/.test(v);
const isValidSubnetId = (v: any) => /^subnet-[a-z0-9]+$/.test(v);
const isValidSgId = (v: any) => /^sg-[a-z0-9]+$/.test(v);
const isValidIgwId = (v: any) => /^igw-[a-z0-9]+$/.test(v);
const isValidNatId = (v: any) => /^nat-[a-z0-9]+$/.test(v);
const isValidRtId = (v: any) => /^rtb-[a-z0-9]+$/.test(v);
const isValidAmiId = (v: any) => /^ami-[a-z0-9]+$/.test(v);
const isValidLtId = (v: any) => /^lt-[a-z0-9]+$/.test(v);
const isValidInstanceId = (v: any) => /^i-[a-z0-9]+$/.test(v);
const isValidIp = (v: any) => typeof v === "string" && /^(\d{1,3}\.){3}\d{1,3}$/.test(v);
const isValidCidr = (v: any) => typeof v === "string" && /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(v);

const parseArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};

/** ---------- Tests ---------- */
describe("Terraform Integration Tests (extended for all outputs)", () => {
  let outputs: Record<string, any>;
  beforeAll(() => {
    outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
  });

  /** VPC */
  it("VPC outputs should be valid", () => {
    expect(isValidVpcId(outputs.vpc_id)).toBe(true);
    expect(isValidCidr(outputs.vpc_cidr_block)).toBe(true);
    expect(isValidArn(outputs.vpc_arn)).toBe(true);
  });

  /** Subnets */
  it("Subnets should be valid", () => {
    parseArray(outputs.public_subnet_ids).forEach(id => expect(isValidSubnetId(id)).toBe(true));
    parseArray(outputs.private_subnet_ids).forEach(id => expect(isValidSubnetId(id)).toBe(true));
    parseArray(outputs.public_subnet_cidrs).forEach(c => expect(isValidCidr(c)).toBe(true));
    parseArray(outputs.private_subnet_cidrs).forEach(c => expect(isValidCidr(c)).toBe(true));
  });

  /** Gateways and routes */
  it("IGW, NAT, and route tables should be valid", () => {
    expect(isValidIgwId(outputs.internet_gateway_id)).toBe(true);
    parseArray(outputs.nat_gateway_ids).forEach(id => expect(isValidNatId(id)).toBe(true));
    expect(isValidRtId(outputs.public_route_table_id)).toBe(true);
    parseArray(outputs.private_route_table_ids).forEach(id => expect(isValidRtId(id)).toBe(true));
  });

  /** Security Groups */
  it("Security Groups should be valid", () => {
    expect(isValidSgId(outputs.alb_security_group_id)).toBe(true);
    expect(isValidSgId(outputs.ec2_security_group_id)).toBe(true);
  });

  /** AMI / EC2 */
  it("AMI outputs should be valid", () => {
    expect(isValidAmiId(outputs.ami_id)).toBe(true);
    expect(outputs.ami_name).toMatch(/^amzn2-ami-hvm-/);
  });
  it("Standalone EC2 instance outputs should be valid", () => {
    expect(isValidInstanceId(outputs.standalone_instance_id)).toBe(true);
    expect(isValidIp(outputs.standalone_instance_private_ip)).toBe(true);
    expect(isValidArn(outputs.standalone_instance_arn)).toBe(true);
  });

  /** Launch template & ASG */
  it("Launch template & ASG outputs should be valid", () => {
    expect(isValidLtId(outputs.launch_template_id)).toBe(true);
    expect(isNonEmptyString(outputs.launch_template_latest_version)).toBe(true);
    expect(isNonEmptyString(outputs.autoscaling_group_id)).toBe(true);
    expect(isValidArn(outputs.autoscaling_group_arn)).toBe(true);
    expect(isNonEmptyString(outputs.autoscaling_group_name)).toBe(true);
  });

  /** Load Balancer + Target Group */
  it("ALB and target group outputs should be valid", () => {
    expect(isNonEmptyString(outputs.load_balancer_id)).toBe(true);
    expect(isValidArn(outputs.load_balancer_arn)).toBe(true);
    expect(outputs.load_balancer_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    expect(isNonEmptyString(outputs.load_balancer_zone_id)).toBe(true);
    expect(isNonEmptyString(outputs.target_group_id)).toBe(true);
    expect(isValidArn(outputs.target_group_arn)).toBe(true);
  });

  /** IAM roles */
  it("IAM roles and profiles should be valid", () => {
    expect(isValidArn(outputs.ec2_iam_role_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_iam_role_name)).toBe(true);
    expect(isValidArn(outputs.ec2_instance_profile_arn)).toBe(true);
    expect(isNonEmptyString(outputs.ec2_instance_profile_name)).toBe(true);
    expect(isValidArn(outputs.cloudtrail_iam_role_arn)).toBe(true);
    expect(isValidArn(outputs.backup_iam_role_arn)).toBe(true);
    expect(isValidArn(outputs.dlm_lifecycle_role_arn)).toBe(true);
  });

  /** S3 Buckets */
  it("S3 bucket outputs should be valid", () => {
    expect(isValidArn(outputs.logs_bucket_arn)).toBe(true);
    expect(isNonEmptyString(outputs.logs_bucket_id)).toBe(true);
    expect(isNonEmptyString(outputs.logs_bucket_domain_name)).toMatch(/s3\.amazonaws\.com$/);

    expect(isValidArn(outputs.guardduty_findings_bucket_arn)).toBe(true);
    expect(isNonEmptyString(outputs.guardduty_findings_bucket_id)).toBe(true);
  });

  /** KMS */
  it("KMS outputs should be valid", () => {
    expect(isNonEmptyString(outputs.kms_key_id)).toBe(true);
    expect(isValidArn(outputs.kms_key_arn)).toBe(true);
    expect(outputs.kms_alias_name).toMatch(/^alias\//);
    expect(isValidArn(outputs.kms_alias_arn)).toBe(true);
  });

  /** CloudFront */
  it("CloudFront outputs should be valid", () => {
    expect(isNonEmptyString(outputs.cloudfront_distribution_id)).toBe(true);
    expect(isValidArn(outputs.cloudfront_distribution_arn)).toBe(true);
    expect(outputs.cloudfront_distribution_domain_name).toMatch(/cloudfront\.net$/);
    expect(isNonEmptyString(outputs.cloudfront_distribution_hosted_zone_id)).toBe(true);
  });

  /** CloudWatch Logs & Dashboard */
  it("CloudWatch logs and dashboard outputs should be valid", () => {
    expect(outputs.cloudwatch_log_group_httpd_access_name).toMatch(/^\/aws\/ec2\/httpd\/access/);
    expect(outputs.cloudwatch_log_group_httpd_error_name).toMatch(/^\/aws\/ec2\/httpd\/error/);
    expect(outputs.cloudwatch_log_group_cloudtrail_name).toMatch(/^\/aws\/cloudtrail/);
    expect(outputs.cloudwatch_dashboard_url).toMatch(/^https:\/\/.+console\.aws\.amazon\.com\/cloudwatch/);
  });

  /** CloudTrail */
  it("CloudTrail outputs should be valid", () => {
    expect(isNonEmptyString(outputs.cloudtrail_id)).toBe(true);
    expect(isValidArn(outputs.cloudtrail_arn)).toBe(true);
    expect(isNonEmptyString(outputs.cloudtrail_home_region)).toBe(true);
  });

  /** GuardDuty */
  it("GuardDuty outputs should be valid", () => {
    expect(isNonEmptyString(outputs.guardduty_detector_id)).toBe(true);
    expect(isValidArn(outputs.guardduty_detector_arn)).toBe(true);
  });

  /** Backup & DLM */
  it("Backup outputs should be valid", () => {
    expect(isNonEmptyString(outputs.backup_vault_id)).toBe(true);
    expect(isValidArn(outputs.backup_vault_arn)).toBe(true);
    expect(isNonEmptyString(outputs.backup_plan_id)).toBe(true);
    expect(isValidArn(outputs.backup_plan_arn)).toBe(true);
    expect(isNonEmptyString(outputs.backup_selection_id)).toBe(true);
  });
  it("DLM lifecycle policy outputs should be valid", () => {
    expect(isNonEmptyString(outputs.dlm_lifecycle_policy_id)).toBe(true);
    expect(isValidArn(outputs.dlm_lifecycle_policy_arn)).toBe(true);
  });

  /** Auto Scaling Policies + Alarms */
  it("Scaling policies & alarms should be valid", () => {
    expect(isValidArn(outputs.autoscaling_policy_scale_up_arn)).toBe(true);
    expect(isValidArn(outputs.autoscaling_policy_scale_down_arn)).toBe(true);
    expect(isValidArn(outputs.cloudwatch_alarm_cpu_high_arn)).toBe(true);
    expect(isValidArn(outputs.cloudwatch_alarm_cpu_low_arn)).toBe(true);
    expect(isValidArn(outputs.cloudwatch_alarm_alb_response_time_arn)).toBe(true);
    expect(isValidArn(outputs.cloudwatch_alarm_alb_healthy_hosts_arn)).toBe(true);
  });

  /** URLs */
  it("Application URLs should be valid", () => {
    expect(outputs.application_url).toMatch(/^http:\/\/.+\.elb\.amazonaws\.com$/);
    expect(outputs.cloudfront_url).toMatch(/^https:\/\/.+cloudfront\.net$/);
  });
});
