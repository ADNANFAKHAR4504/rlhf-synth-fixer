import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests - Exact Coverage', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test(`Variable "primary_region" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"primary_region"`));
    });
    test(`Variable "secondary_region" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"secondary_region"`));
    });
    test(`Variable "environment" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"environment"`));
    });
    test(`Variable "dr_enabled" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"dr_enabled"`));
    });
    test(`Variable "domain_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"domain_name"`));
    });
    test(`Variable "db_instance_class" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"db_instance_class"`));
    });
    test(`Variable "db_allocated_storage" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"db_allocated_storage"`));
    });
    test(`Variable "db_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"db_name"`));
    });
    test(`Variable "db_username" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"db_username"`));
    });
    test(`Variable "alb_port" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"alb_port"`));
    });
    test(`Variable "app_port" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"app_port"`));
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test(`Local "resource_suffix" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource_suffix\\s*=\\s*`));
    });
    test(`Local "common_tags" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`common_tags\\s*=\\s*`));
    });
    test(`Local "primary_vpc_cidr" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_vpc_cidr\\s*=\\s*`));
    });
    test(`Local "secondary_vpc_cidr" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_vpc_cidr\\s*=\\s*`));
    });
    test(`Local "primary_public_subnet_1" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_public_subnet_1\\s*=\\s*`));
    });
    test(`Local "primary_public_subnet_2" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_public_subnet_2\\s*=\\s*`));
    });
    test(`Local "primary_private_subnet_1" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_private_subnet_1\\s*=\\s*`));
    });
    test(`Local "primary_private_subnet_2" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_private_subnet_2\\s*=\\s*`));
    });
    test(`Local "secondary_public_subnet_1" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_public_subnet_1\\s*=\\s*`));
    });
    test(`Local "secondary_public_subnet_2" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_public_subnet_2\\s*=\\s*`));
    });
    test(`Local "secondary_private_subnet_1" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_private_subnet_1\\s*=\\s*`));
    });
    test(`Local "secondary_private_subnet_2" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_private_subnet_2\\s*=\\s*`));
    });
    test(`Local "primary_bucket_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`primary_bucket_name\\s*=\\s*`));
    });
    test(`Local "secondary_bucket_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`secondary_bucket_name\\s*=\\s*`));
    });

    describe('Tag keys in common_tags', () => {
      ['Environment', 'Project', 'ManagedBy', 'DisasterRecovery'].forEach(tagKey => {
        test(`Tag key "${tagKey}" exists`, () => {
          expect(tfContent).toMatch(new RegExp(`${tagKey}\\s*=\\s*`));
        });
      });
    });
  });

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    // All resources must be checked here in the same format like below example
    // Add more resource tests as per tap_stack.tf resources
    // Example resource test:
    // test(`Resource "aws_vpc" named "primary" is defined`, () => {
    //   expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_vpc"\\s+"primary"`));
    // });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    test(`Output "primary_vpc_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_vpc_id"`));
    });
    test(`Output "secondary_vpc_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_vpc_id"`));
    });
    test(`Output "vpc_peering_connection_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"vpc_peering_connection_id"`));
    });
    test(`Output "primary_public_subnet_ids" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_public_subnet_ids"`));
    });
    test(`Output "primary_private_subnet_ids" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_private_subnet_ids"`));
    });
    test(`Output "secondary_public_subnet_ids" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_public_subnet_ids"`));
    });
    test(`Output "secondary_private_subnet_ids" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_private_subnet_ids"`));
    });
    test(`Output "primary_rds_endpoint" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_rds_endpoint"`));
    });
    test(`Output "primary_rds_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_rds_arn"`));
    });
    test(`Output "secondary_rds_endpoint" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_rds_endpoint"`));
    });
    test(`Output "secondary_rds_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_rds_arn"`));
    });
    test(`Output "rds_secret_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"rds_secret_arn"`));
    });
    test(`Output "primary_s3_bucket_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_s3_bucket_id"`));
    });
    test(`Output "primary_s3_bucket_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_s3_bucket_arn"`));
    });
    test(`Output "secondary_s3_bucket_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_s3_bucket_id"`));
    });
    test(`Output "secondary_s3_bucket_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_s3_bucket_arn"`));
    });
    test(`Output "primary_alb_dns_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_alb_dns_name"`));
    });
    test(`Output "primary_alb_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_alb_arn"`));
    });
    test(`Output "primary_alb_zone_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_alb_zone_id"`));
    });
    test(`Output "secondary_alb_dns_name" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_alb_dns_name"`));
    });
    test(`Output "secondary_alb_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_alb_arn"`));
    });
    test(`Output "secondary_alb_zone_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_alb_zone_id"`));
    });
    test(`Output "primary_target_group_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_target_group_arn"`));
    });
    test(`Output "secondary_target_group_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_target_group_arn"`));
    });
    test(`Output "route53_zone_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"route53_zone_id"`));
    });
    test(`Output "route53_name_servers" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"route53_name_servers"`));
    });
    test(`Output "app_failover_endpoint" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"app_failover_endpoint"`));
    });
    test(`Output "primary_alb_security_group_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_alb_security_group_id"`));
    });
    test(`Output "secondary_alb_security_group_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_alb_security_group_id"`));
    });
    test(`Output "primary_rds_security_group_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_rds_security_group_id"`));
    });
    test(`Output "secondary_rds_security_group_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_rds_security_group_id"`));
    });
    test(`Output "sns_topic_arn" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"sns_topic_arn"`));
    });
    test(`Output "cloudwatch_dashboard_url" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"cloudwatch_dashboard_url"`));
    });
    test(`Output "primary_nat_gateway_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_nat_gateway_id"`));
    });
    test(`Output "secondary_nat_gateway_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_nat_gateway_id"`));
    });
    test(`Output "primary_igw_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_igw_id"`));
    });
    test(`Output "secondary_igw_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_igw_id"`));
    });
    test(`Output "primary_flow_log_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_flow_log_id"`));
    });
    test(`Output "secondary_flow_log_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_flow_log_id"`));
    });
    test(`Output "primary_health_check_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"primary_health_check_id"`));
    });
    test(`Output "secondary_health_check_id" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"secondary_health_check_id"`));
    });
    test(`Output "aws_primary_region" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"aws_primary_region"`));
    });
    test(`Output "aws_secondary_region" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"aws_secondary_region"`));
    });
  });
});
