// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration

import fs from "fs";
import path from "path";

const MAIN_TF = path.resolve(__dirname, "../lib/main.tf");
const VARIABLES_TF = path.resolve(__dirname, "../lib/variables.tf");
const OUTPUTS_TF = path.resolve(__dirname, "../lib/outputs.tf");
const PROVIDER_TF = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Configuration - File Structure", () => {
  test("main.tf exists", () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
  });

  test("variables.tf exists", () => {
    expect(fs.existsSync(VARIABLES_TF)).toBe(true);
  });

  test("outputs.tf exists", () => {
    expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(PROVIDER_TF)).toBe(true);
  });
});

describe("Terraform Configuration - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_TF, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"/);
  });

  test("aws_region defaults to us-west-1", () => {
    const regionMatch = variablesContent.match(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"([^"]*)"/);
    expect(regionMatch).toBeTruthy();
    expect(regionMatch![1]).toBe("us-west-1");
  });

  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"/);
  });

  test("vpc_cidr defaults to 10.110.0.0/16", () => {
    const cidrMatch = variablesContent.match(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"([^"]*)"/);
    expect(cidrMatch).toBeTruthy();
    expect(cidrMatch![1]).toBe("10.110.0.0/16");
  });

  test("declares project_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"project_name"/);
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
  });

  test("declares local resource_prefix", () => {
    expect(variablesContent).toMatch(/locals\s*{[\s\S]*resource_prefix/);
  });

  test("declares instance_type variable", () => {
    expect(variablesContent).toMatch(/variable\s+"instance_type"/);
  });

  test("instance_type defaults to t3.medium", () => {
    const instanceMatch = variablesContent.match(/variable\s+"instance_type"[\s\S]*?default\s*=\s*"([^"]*)"/);
    expect(instanceMatch).toBeTruthy();
    expect(instanceMatch![1]).toBe("t3.medium");
  });

  test("declares min_size variable", () => {
    expect(variablesContent).toMatch(/variable\s+"min_size"/);
  });

  test("declares max_size variable", () => {
    expect(variablesContent).toMatch(/variable\s+"max_size"/);
  });

  test("declares desired_capacity variable", () => {
    expect(variablesContent).toMatch(/variable\s+"desired_capacity"/);
  });
});

describe("Terraform Configuration - VPC and Networking", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates VPC resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC uses variable vpc_cidr", () => {
    const vpcBlock = mainContent.match(/resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpcBlock).toBeTruthy();
  });

  test("VPC enables DNS hostnames", () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC enables DNS support", () => {
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("creates public subnets with count = 2", () => {
    const subnetMatch = mainContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*2/);
    expect(subnetMatch).toBeTruthy();
  });

  test("creates private subnets with count = 2", () => {
    const subnetMatch = mainContent.match(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*2/);
    expect(subnetMatch).toBeTruthy();
  });

  test("creates NAT Gateways", () => {
    expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("creates Elastic IPs for NAT", () => {
    expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  test("creates public route table", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
  });

  test("creates private route tables", () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });
});

describe("Terraform Configuration - Security Groups", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates ALB security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("ALB security group allows HTTP (port 80)", () => {
    const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?ingress[\s\S]*?from_port\s*=\s*80/);
    expect(sgBlock).toBeTruthy();
  });

  test("ALB security group allows HTTPS (port 443)", () => {
    const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?ingress[\s\S]*?from_port\s*=\s*443/);
    expect(sgBlock).toBeTruthy();
  });

  test("creates EC2 security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("EC2 security group references ALB security group", () => {
    const sgBlock = mainContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    expect(sgBlock).toBeTruthy();
  });
});

describe("Terraform Configuration - Load Balancer", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates Application Load Balancer", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("ALB type is application", () => {
    const albBlock = mainContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]*?load_balancer_type\s*=\s*"application"/);
    expect(albBlock).toBeTruthy();
  });

  test("ALB is not internal (internet-facing)", () => {
    const albBlock = mainContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]*?internal\s*=\s*false/);
    expect(albBlock).toBeTruthy();
  });

  test("ALB enables HTTP2", () => {
    const albBlock = mainContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]*?enable_http2\s*=\s*true/);
    expect(albBlock).toBeTruthy();
  });

  test("creates target group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
  });

  test("target group uses HTTP protocol", () => {
    const tgBlock = mainContent.match(/resource\s+"aws_lb_target_group"\s+"main"[\s\S]*?protocol\s*=\s*"HTTP"/);
    expect(tgBlock).toBeTruthy();
  });

  test("target group has health check configured", () => {
    const tgBlock = mainContent.match(/resource\s+"aws_lb_target_group"\s+"main"[\s\S]*?health_check\s*{/);
    expect(tgBlock).toBeTruthy();
  });

  test("health check path is /health", () => {
    const healthCheck = mainContent.match(/health_check[\s\S]*?path\s*=\s*"\/health"/);
    expect(healthCheck).toBeTruthy();
  });

  test("creates ALB listener", () => {
    expect(mainContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
  });

  test("listener forwards to target group", () => {
    const listenerBlock = mainContent.match(/resource\s+"aws_lb_listener"[\s\S]*?target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
    expect(listenerBlock).toBeTruthy();
  });
});

describe("Terraform Configuration - Auto Scaling", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates Launch Template", () => {
    expect(mainContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
  });

  test("Launch Template uses instance_type variable", () => {
    const ltBlock = mainContent.match(/resource\s+"aws_launch_template"[\s\S]*?instance_type\s*=\s*var\.instance_type/);
    expect(ltBlock).toBeTruthy();
  });

  test("Launch Template has user data", () => {
    const ltBlock = mainContent.match(/resource\s+"aws_launch_template"[\s\S]*?user_data\s*=/);
    expect(ltBlock).toBeTruthy();
  });

  test("creates Auto Scaling Group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
  });

  test("ASG cooldown is 180 seconds", () => {
    const asgBlock = mainContent.match(/resource\s+"aws_autoscaling_group"[\s\S]*?default_cooldown\s*=\s*180/);
    expect(asgBlock).toBeTruthy();
  });

  test("ASG health check type is ELB", () => {
    const asgBlock = mainContent.match(/resource\s+"aws_autoscaling_group"[\s\S]*?health_check_type\s*=\s*"ELB"/);
    expect(asgBlock).toBeTruthy();
  });

  test("creates scale up policy", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
  });

  test("scale up policy cooldown is 180 seconds", () => {
    const policyBlock = mainContent.match(/resource\s+"aws_autoscaling_policy"\s+"scale_up"[\s\S]*?cooldown\s*=\s*180/);
    expect(policyBlock).toBeTruthy();
  });

  test("creates scale down policy", () => {
    expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
  });

  test("scale down policy cooldown is 180 seconds", () => {
    const policyBlock = mainContent.match(/resource\s+"aws_autoscaling_policy"\s+"scale_down"[\s\S]*?cooldown\s*=\s*180/);
    expect(policyBlock).toBeTruthy();
  });
});

describe("Terraform Configuration - IAM", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates IAM role for EC2", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
  });

  test("IAM role has AssumeRole policy for ec2.amazonaws.com", () => {
    const roleBlock = mainContent.match(/resource\s+"aws_iam_role"\s+"ec2"[\s\S]*?Service.*ec2\.amazonaws\.com/);
    expect(roleBlock).toBeTruthy();
  });

  test("creates IAM role policy for EC2", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
  });

  test("IAM policy allows DynamoDB access", () => {
    const policyBlock = mainContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?dynamodb:GetItem/);
    expect(policyBlock).toBeTruthy();
  });

  test("IAM policy allows S3 access", () => {
    const policyBlock = mainContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?s3:GetObject/);
    expect(policyBlock).toBeTruthy();
  });

  test("IAM policy allows CloudWatch metrics", () => {
    const policyBlock = mainContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?cloudwatch:PutMetricData/);
    expect(policyBlock).toBeTruthy();
  });

  test("creates IAM instance profile", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
  });
});

describe("Terraform Configuration - DynamoDB", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates DynamoDB table", () => {
    expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"registrations"/);
  });

  test("DynamoDB uses PAY_PER_REQUEST billing mode", () => {
    const tableBlock = mainContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    expect(tableBlock).toBeTruthy();
  });

  test("DynamoDB has hash_key registration_id", () => {
    const tableBlock = mainContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?hash_key\s*=\s*"registration_id"/);
    expect(tableBlock).toBeTruthy();
  });

  test("DynamoDB has range_key event_id", () => {
    const tableBlock = mainContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?range_key\s*=\s*"event_id"/);
    expect(tableBlock).toBeTruthy();
  });

  test("DynamoDB has EmailIndex GSI", () => {
    const gsiBlock = mainContent.match(/global_secondary_index[\s\S]*?name\s*=\s*"EmailIndex"/);
    expect(gsiBlock).toBeTruthy();
  });

  test("DynamoDB has CheckInStatusIndex GSI", () => {
    const gsiBlock = mainContent.match(/global_secondary_index[\s\S]*?name\s*=\s*"CheckInStatusIndex"/);
    expect(gsiBlock).toBeTruthy();
  });

  test("DynamoDB has RegistrationDateIndex GSI", () => {
    const gsiBlock = mainContent.match(/global_secondary_index[\s\S]*?name\s*=\s*"RegistrationDateIndex"/);
    expect(gsiBlock).toBeTruthy();
  });

  test("DynamoDB has TTL enabled", () => {
    const ttlBlock = mainContent.match(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(ttlBlock).toBeTruthy();
  });

  test("DynamoDB has point_in_time_recovery enabled", () => {
    const pitrBlock = mainContent.match(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(pitrBlock).toBeTruthy();
  });
});

describe("Terraform Configuration - S3", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates S3 bucket", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"event_materials"/);
  });

  test("S3 bucket name includes account ID", () => {
    const bucketBlock = mainContent.match(/resource\s+"aws_s3_bucket"[\s\S]*?bucket\s*=.*account_id/);
    expect(bucketBlock).toBeTruthy();
  });

  test("S3 versioning is enabled", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"event_materials"/);
    const versionBlock = mainContent.match(/versioning_configuration[\s\S]*?status\s*=\s*"Enabled"/);
    expect(versionBlock).toBeTruthy();
  });

  test("S3 has public access block", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"event_materials"/);
  });

  test("S3 has server-side encryption", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"event_materials"/);
  });

  test("S3 encryption uses AES256", () => {
    const encBlock = mainContent.match(/sse_algorithm\s*=\s*"AES256"/);
    expect(encBlock).toBeTruthy();
  });

  test("S3 bucket policy exists", () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"event_materials"/);
  });
});

describe("Terraform Configuration - CloudFront", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates CloudFront Origin Access Control", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudfront_origin_access_control"\s+"main"/);
  });

  test("creates CloudFront distribution", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
  });

  test("CloudFront is enabled", () => {
    const cfBlock = mainContent.match(/resource\s+"aws_cloudfront_distribution"[\s\S]*?enabled\s*=\s*true/);
    expect(cfBlock).toBeTruthy();
  });

  test("CloudFront has S3 origin", () => {
    const originBlock = mainContent.match(/origin\s*{[\s\S]*?bucket_regional_domain_name/);
    expect(originBlock).toBeTruthy();
  });

  test("CloudFront has ALB origin", () => {
    const originBlock = mainContent.match(/origin\s*{[\s\S]*?aws_lb\.main\.dns_name/);
    expect(originBlock).toBeTruthy();
  });
});

describe("Terraform Configuration - CloudWatch", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("creates log group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"/);
  });

  test("creates high CPU alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
  });

  test("creates low CPU alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
  });

  test("creates unhealthy hosts alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unhealthy_hosts"/);
  });

  test("creates high response time alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_response_time"/);
  });

  test("creates DynamoDB read throttles alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_read_throttles"/);
  });

  test("creates DynamoDB write throttles alarm", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_write_throttles"/);
  });
});

describe("Terraform Configuration - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(OUTPUTS_TF, "utf8");
  });

  test("outputs VPC ID", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"/);
  });

  test("outputs ALB DNS name", () => {
    expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
  });

  test("outputs CloudFront domain name", () => {
    expect(outputsContent).toMatch(/output\s+"cloudfront_domain_name"/);
  });

  test("outputs DynamoDB table name", () => {
    expect(outputsContent).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test("outputs S3 bucket name", () => {
    expect(outputsContent).toMatch(/output\s+"s3_bucket_name"/);
  });

  test("outputs Auto Scaling Group name", () => {
    expect(outputsContent).toMatch(/output\s+"autoscaling_group_name"/);
  });
});

describe("Terraform Configuration - Provider", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(PROVIDER_TF, "utf8");
  });

  test("declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("requires Terraform version >= 1.4.0", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test("requires AWS provider version >= 5.0", () => {
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });
});

describe("Terraform Configuration - Environment Suffix Support", () => {
  let mainContent: string;
  let variablesContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_TF, "utf8");
  });

  test("uses local.resource_prefix for resource naming", () => {
    expect(mainContent).toMatch(/local\.resource_prefix/);
  });

  test("ALB name uses resource_prefix", () => {
    const albBlock = mainContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]*?name\s*=\s*"\$\{local\.resource_prefix\}-alb"/);
    expect(albBlock).toBeTruthy();
  });

  test("DynamoDB table name uses resource_prefix", () => {
    const tableBlock = mainContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?name\s*=\s*"\$\{local\.resource_prefix\}-registrations"/);
    expect(tableBlock).toBeTruthy();
  });

  test("S3 bucket name uses resource_prefix", () => {
    const bucketBlock = mainContent.match(/resource\s+"aws_s3_bucket"[\s\S]*?bucket\s*=\s*"\$\{local\.resource_prefix\}-event-materials/);
    expect(bucketBlock).toBeTruthy();
  });
});
