import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap-stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform single-file stack: tap-stack.tf", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("tap-stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("does NOT declare provider in tap-stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("provider.tf declares us_east_1 provider alias", () => {
    expect(providerContent).toMatch(/alias\s*=\s*"us_east_1"/);
  });

  test("provider.tf declares eu_west_1 provider alias", () => {
    expect(providerContent).toMatch(/alias\s*=\s*"eu_west_1"/);
  });

  test("provider.tf declares ap_southeast_1 provider alias", () => {
    expect(providerContent).toMatch(/alias\s*=\s*"ap_southeast_1"/);
  });

  test("provider.tf requires random provider", () => {
    expect(providerContent).toMatch(/random\s*=\s*\{/);
  });

  test("provider.tf requires archive provider", () => {
    expect(providerContent).toMatch(/archive\s*=\s*\{/);
  });

  test("declares random_string suffix resource", () => {
    expect(stackContent).toMatch(/resource\s+"random_string"\s+"suffix"\s*{/);
  });

  test("declares aws_vpc us_east_1 resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"\s*{/);
  });

  test("declares aws_vpc eu_west_1 resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"eu_west_1"\s*{/);
  });

  test("declares aws_vpc ap_southeast_1 resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"ap_southeast_1"\s*{/);
  });

  test("VPCs have non-overlapping CIDR blocks", () => {
    expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.2\.0\.0\/16"/);
  });

  test("VPCs have enable_dns_support enabled", () => {
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPCs have enable_dns_hostnames enabled", () => {
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("declares data aws_availability_zones for all regions", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"us_east_1"\s*{/);
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"eu_west_1"\s*{/);
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"ap_southeast_1"\s*{/);
  });

  test("declares dev private subnets for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_dev_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_dev_private_2"\s*{/);
  });

  test("declares prod private subnets for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_prod_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_prod_private_2"\s*{/);
  });

  test("declares dev public subnets for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_dev_public_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_dev_public_2"\s*{/);
  });

  test("declares prod public subnets for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_prod_public_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_prod_public_2"\s*{/);
  });

  test("declares TGW subnets for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_tgw_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_tgw_2"\s*{/);
  });

  test("declares dev private subnets for eu-west-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_dev_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_dev_private_2"\s*{/);
  });

  test("declares prod private subnets for eu-west-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_prod_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_prod_private_2"\s*{/);
  });

  test("declares TGW subnets for eu-west-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_tgw_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"eu_west_1_tgw_2"\s*{/);
  });

  test("declares dev private subnets for ap-southeast-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_dev_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_dev_private_2"\s*{/);
  });

  test("declares prod private subnets for ap-southeast-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_prod_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_prod_private_2"\s*{/);
  });

  test("declares TGW subnets for ap-southeast-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_tgw_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"ap_southeast_1_tgw_2"\s*{/);
  });

  test("declares internet gateway for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"us_east_1"\s*{/);
  });

  test("declares route tables for dev and prod in us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_dev_public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_prod_public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_dev_private"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"us_east_1_prod_private"\s*{/);
  });

  test("declares route table associations for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_dev_public_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_dev_public_2"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_prod_public_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_prod_public_2"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_dev_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_dev_private_2"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_prod_private_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"us_east_1_prod_private_2"\s*{/);
  });

  test("declares data aws_ami for Amazon Linux 2", () => {
    expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
  });

  test("declares security group for NAT instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"nat"\s*{/);
  });

  test("declares NAT instances for dev environment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"nat_dev_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"nat_dev_2"\s*{/);
  });

  test("declares NAT instances for prod environment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"nat_prod_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"nat_prod_2"\s*{/);
  });

  test("NAT instances have source_dest_check disabled", () => {
    expect(stackContent).toMatch(/source_dest_check\s*=\s*false/);
  });

  test("declares hub Transit Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"hub"\s*{/);
  });

  test("declares spoke Transit Gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"ap_southeast_1"\s*{/);
  });

  test("Transit Gateway has default_route_table_association disabled", () => {
    expect(stackContent).toMatch(/default_route_table_association\s*=\s*"disable"/);
  });

  test("Transit Gateway has default_route_table_propagation disabled", () => {
    expect(stackContent).toMatch(/default_route_table_propagation\s*=\s*"disable"/);
  });

  test("declares dev Transit Gateway route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"dev"\s*{/);
  });

  test("declares prod Transit Gateway route table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"prod"\s*{/);
  });

  test("declares Transit Gateway VPC attachments", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"us_east_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"ap_southeast_1"\s*{/);
  });

  test("declares Transit Gateway peering attachments", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"\s+"hub_to_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"\s+"hub_to_ap_southeast_1"\s*{/);
  });

  test("declares Transit Gateway peering attachment accepters", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"ap_southeast_1"\s*{/);
  });

  test("declares Transit Gateway route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"us_east_1_dev"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"us_east_1_prod"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"eu_west_1_peering_dev"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"eu_west_1_peering_prod"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"ap_southeast_1_peering_dev"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"ap_southeast_1_peering_prod"\s*{/);
  });

  test("declares Transit Gateway route table propagations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_propagation"\s+"us_east_1_dev"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_propagation"\s+"us_east_1_prod"\s*{/);
  });

  test("declares Transit Gateway blackhole routes", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"dev_to_prod_blackhole"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"prod_to_dev_blackhole"\s*{/);
  });

  test("blackhole routes have blackhole set to true", () => {
    expect(stackContent).toMatch(/blackhole\s*=\s*true/);
  });

  test("declares Route 53 private hosted zones", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"dev_internal"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"prod_internal"\s*{/);
  });

  test("Route 53 zones have .internal suffix", () => {
    expect(stackContent).toMatch(/name\s*=\s*"dev\.internal"/);
    expect(stackContent).toMatch(/name\s*=\s*"prod\.internal"/);
  });

  test("declares Route 53 zone associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone_association"\s+"dev_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone_association"\s+"dev_ap_southeast_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone_association"\s+"prod_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone_association"\s+"prod_ap_southeast_1"\s*{/);
  });

  test("declares SSM VPC endpoint security groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssm_endpoint_us_east_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssm_endpoint_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ssm_endpoint_ap_southeast_1"\s*{/);
  });

  test("declares SSM VPC endpoints for us-east-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_us_east_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages_us_east_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2messages_us_east_1"\s*{/);
  });

  test("declares SSM VPC endpoints for eu-west-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages_eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2messages_eu_west_1"\s*{/);
  });

  test("declares SSM VPC endpoints for ap-southeast-1", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_ap_southeast_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages_ap_southeast_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2messages_ap_southeast_1"\s*{/);
  });

  test("VPC endpoints have private_dns_enabled", () => {
    expect(stackContent).toMatch(/private_dns_enabled\s*=\s*true/);
  });

  test("declares S3 bucket for flow logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"\s*{/);
  });

  test("declares S3 bucket encryption configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"\s*{/);
  });

  test("S3 bucket uses SSE-S3 encryption", () => {
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("declares S3 bucket lifecycle configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"\s*{/);
  });

  test("declares S3 bucket policy for flow logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"flow_logs"\s*{/);
  });

  test("declares VPC Flow Logs for all VPCs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"us_east_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"eu_west_1"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"ap_southeast_1"\s*{/);
  });

  test("Flow logs use Parquet format", () => {
    expect(stackContent).toMatch(/file_format\s*=\s*"parquet"/);
  });

  test("Flow logs have aggregation interval (60 seconds, closest to 5 minutes)", () => {
    expect(stackContent).toMatch(/max_aggregation_interval\s*=\s*60/);
  });

  test("declares IAM role for flow logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"\s*{/);
  });

  test("declares IAM role policy for flow logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"\s*{/);
  });

  test("declares CloudWatch alarms for NAT instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"nat_dev_1_status"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"nat_prod_1_status"\s*{/);
  });

  test("declares SNS topic for NAT failover", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"nat_failover"\s*{/);
  });

  test("declares SNS topic subscription", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"nat_failover"\s*{/);
  });

  test("declares IAM role for NAT failover Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"nat_failover"\s*{/);
  });

  test("declares IAM role policy for NAT failover", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"nat_failover"\s*{/);
  });

  test("declares Lambda function for NAT failover", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"nat_failover"\s*{/);
  });

  test("declares Lambda permission for SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"nat_failover"\s*{/);
  });

  test("declares archive_file data source for Lambda", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"nat_failover"\s*{/);
  });

  test("declares hub_vpc_id output", () => {
    expect(stackContent).toMatch(/output\s+"hub_vpc_id"\s*{/);
  });

  test("declares eu_west_1_vpc_id output", () => {
    expect(stackContent).toMatch(/output\s+"eu_west_1_vpc_id"\s*{/);
  });

  test("declares ap_southeast_1_vpc_id output", () => {
    expect(stackContent).toMatch(/output\s+"ap_southeast_1_vpc_id"\s*{/);
  });

  test("declares hub_transit_gateway_id output", () => {
    expect(stackContent).toMatch(/output\s+"hub_transit_gateway_id"\s*{/);
  });

  test("declares dev_transit_gateway_route_table_id output", () => {
    expect(stackContent).toMatch(/output\s+"dev_transit_gateway_route_table_id"\s*{/);
  });

  test("declares prod_transit_gateway_route_table_id output", () => {
    expect(stackContent).toMatch(/output\s+"prod_transit_gateway_route_table_id"\s*{/);
  });

  test("declares dev_route53_zone_id output", () => {
    expect(stackContent).toMatch(/output\s+"dev_route53_zone_id"\s*{/);
  });

  test("declares prod_route53_zone_id output", () => {
    expect(stackContent).toMatch(/output\s+"prod_route53_zone_id"\s*{/);
  });

  test("declares flow_logs_bucket_name output", () => {
    expect(stackContent).toMatch(/output\s+"flow_logs_bucket_name"\s*{/);
  });

  test("declares nat_instance_ids output", () => {
    expect(stackContent).toMatch(/output\s+"nat_instance_ids"\s*{/);
  });

  test("all resources use consistent tagging with Environment, Region, Purpose", () => {
    const tagPattern = /tags\s*=\s*\{[\s\S]*?Environment\s*=\s*[\s\S]*?Region\s*=\s*[\s\S]*?Purpose\s*=\s*[\s\S]*?\}/;
    expect(stackContent).toMatch(tagPattern);
  });

  test("all resources follow naming convention with random suffix", () => {
    expect(stackContent).toMatch(/\$\{random_string\.suffix\.result\}/);
  });

  test("all VPC attachments have transit_gateway_default_route_table_association disabled", () => {
    expect(stackContent).toMatch(/transit_gateway_default_route_table_association\s*=\s*false/);
  });

  test("all VPC attachments have transit_gateway_default_route_table_propagation disabled", () => {
    expect(stackContent).toMatch(/transit_gateway_default_route_table_propagation\s*=\s*false/);
  });
});
