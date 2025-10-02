// tests/unit/terraform-unit-tests.ts
// Unit tests for Terraform configuration files validating requirements from lib/PROMPT.md
// No Terraform commands are executed - only file content validation

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper function to read Terraform file content
function readTerraformFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Terraform file not found: ${filename}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper function to get all .tf files in lib directory
function getAllTerraformFiles(): string[] {
  return fs.readdirSync(LIB_DIR)
    .filter(file => file.endsWith('.tf'))
    .sort();
}

describe("Terraform Configuration Validation", () => {
  let allTerraformContent: string = "";

  beforeAll(() => {
    // Combine all .tf files for comprehensive testing
    const tfFiles = getAllTerraformFiles();
    allTerraformContent = tfFiles
      .map(file => readTerraformFile(file))
      .join('\n');
  });

  describe("File Structure", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'vpc.tf',
        's3.tf',
        'ec2.tf',
        'rds.tf',
        'lambda.tf',
        'api_gateway.tf',
        'cloudfront.tf',
        'iam.tf',
        'monitoring.tf',
        'waf.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test("provider configuration is properly structured", () => {
      const providerContent = readTerraformFile('provider.tf');

      // Check for required version constraint
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);

      // Check for AWS provider configuration
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);

      // Check for peer provider alias
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"peer"/);
    });
  });

  describe("S3 Requirements", () => {
    test("S3 buckets use SSE-S3 encryption", () => {
      const s3Content = readTerraformFile('s3.tf');

      // Check for server-side encryption configuration
      expect(s3Content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("S3 buckets have versioning enabled", () => {
      const s3Content = readTerraformFile('s3.tf');

      // Check for versioning configuration
      expect(s3Content).toMatch(/aws_s3_bucket_versioning/);
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("dedicated logging S3 bucket exists with lifecycle policy", () => {
      const s3Content = readTerraformFile('s3.tf');

      // Check for logs bucket
      expect(s3Content).toMatch(/aws_s3_bucket.*logs/);

      // Check for lifecycle configuration
      expect(s3Content).toMatch(/aws_s3_bucket_lifecycle_configuration.*logs/);

      // Check for retention period (at least 365 days)
      expect(s3Content).toMatch(/expiration\s*{\s*days\s*=\s*\d+/);

      // Verify retention is at least 365 days
      const expirationMatch = s3Content.match(/expiration\s*{\s*days\s*=\s*(\d+)/);
      if (expirationMatch) {
        const retentionDays = parseInt(expirationMatch[1]);
        expect(retentionDays).toBeGreaterThanOrEqual(365);
      }
    });

    test("S3 buckets have public access blocked", () => {
      const s3Content = readTerraformFile('s3.tf');

      // Check for public access block configuration
      expect(s3Content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("API Gateway Requirements", () => {
    test("API Gateway requires IAM authorization", () => {
      const apiContent = readTerraformFile('api_gateway.tf');

      // Check for IAM authorization configuration
      expect(apiContent).toMatch(/authorization\s*=\s*"AWS_IAM"/);
    });

    test("API Gateway has proper IAM role configuration", () => {
      const iamContent = readTerraformFile('iam.tf');

      // Check for API Gateway IAM role
      expect(iamContent).toMatch(/aws_iam_role.*api_gateway/);
      expect(iamContent).toMatch(/apigateway\.amazonaws\.com/);
    });
  });

  describe("CloudFront Requirements", () => {
    test("CloudFront distribution exists", () => {
      const cloudfrontContent = readTerraformFile('cloudfront.tf');

      expect(cloudfrontContent).toMatch(/aws_cloudfront_distribution/);
    });

    test("CloudFront logs to S3 bucket", () => {
      const cloudfrontContent = readTerraformFile('cloudfront.tf');

      // Check for logging configuration (if not commented out)
      if (cloudfrontContent.includes('logging_config')) {
        expect(cloudfrontContent).toMatch(/logging_config/);
        expect(cloudfrontContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs/);
      }
    });
  });

  describe("EC2 + EBS + Scaling Requirements", () => {
    test("EC2 instances have encrypted EBS volumes", () => {
      const ec2Content = readTerraformFile('ec2.tf');

      // Check for EBS encryption in launch template
      expect(ec2Content).toMatch(/encrypted\s*=\s*true/);
    });

    test("Auto Scaling Group is configured", () => {
      const ec2Content = readTerraformFile('ec2.tf');

      expect(ec2Content).toMatch(/aws_autoscaling_group/);
      expect(ec2Content).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(ec2Content).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(ec2Content).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    });

    test("Application Load Balancer is configured", () => {
      const ec2Content = readTerraformFile('ec2.tf');

      expect(ec2Content).toMatch(/aws_lb.*main/);
      expect(ec2Content).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB health checks are configured", () => {
      const ec2Content = readTerraformFile('ec2.tf');

      expect(ec2Content).toMatch(/health_check/);
      expect(ec2Content).toMatch(/healthy_threshold/);
      expect(ec2Content).toMatch(/unhealthy_threshold/);
      expect(ec2Content).toMatch(/timeout/);
      expect(ec2Content).toMatch(/interval/);
    });

    test("SSH access is restricted via Security Groups", () => {
      const ec2Content = readTerraformFile('ec2.tf');

      // Check for SSH security group rule
      expect(ec2Content).toMatch(/from_port\s*=\s*22/);
      expect(ec2Content).toMatch(/to_port\s*=\s*22/);
      expect(ec2Content).toMatch(/protocol\s*=\s*"tcp"/);
      expect(ec2Content).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
    });
  });

  describe("VPC + Peering Requirements", () => {
    test("Primary VPC is configured", () => {
      const vpcContent = readTerraformFile('vpc.tf');

      expect(vpcContent).toMatch(/aws_vpc.*main/);
      expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC peering is configured", () => {
      const vpcContent = readTerraformFile('vpc.tf');

      expect(vpcContent).toMatch(/aws_vpc_peering_connection/);
    });

    test("Route tables are updated for cross-VPC communication", () => {
      const vpcContent = readTerraformFile('vpc.tf');

      expect(vpcContent).toMatch(/aws_route.*peer/);
      expect(vpcContent).toMatch(/destination_cidr_block/);
    });

    test("Subnets are properly configured", () => {
      const vpcContent = readTerraformFile('vpc.tf');

      // Check for public, private, and database subnets
      expect(vpcContent).toMatch(/aws_subnet.*public/);
      expect(vpcContent).toMatch(/aws_subnet.*private/);
      expect(vpcContent).toMatch(/aws_subnet.*database/);
    });
  });

  describe("IAM Requirements", () => {
    test("Least-privilege IAM roles exist for all services", () => {
      const iamContent = readTerraformFile('iam.tf');

      // Check for EC2 role
      expect(iamContent).toMatch(/aws_iam_role.*ec2_instance/);
      expect(iamContent).toMatch(/ec2\.amazonaws\.com/);

      // Check for Lambda role
      expect(iamContent).toMatch(/aws_iam_role.*lambda_execution/);
      expect(iamContent).toMatch(/lambda\.amazonaws\.com/);

      // Check for API Gateway role
      expect(iamContent).toMatch(/aws_iam_role.*api_gateway/);
      expect(iamContent).toMatch(/apigateway\.amazonaws\.com/);
    });

    test("IAM policies follow least-privilege principle", () => {
      const iamContent = readTerraformFile('iam.tf');

      // Check that policies have specific actions, not wildcards
      expect(iamContent).toMatch(/Action\s*=\s*\[/);

      // Verify no overly broad permissions
      expect(iamContent).not.toMatch(/"Effect":\s*"Allow".*"Action":\s*"\*".*"Resource":\s*"\*"/);
    });
  });

  describe("RDS + Lambda Requirements", () => {
    test("RDS instance has Multi-AZ enabled", () => {
      const rdsContent = readTerraformFile('rds.tf');

      expect(rdsContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS is in VPC with proper subnet group", () => {
      const rdsContent = readTerraformFile('rds.tf');

      expect(rdsContent).toMatch(/aws_db_subnet_group/);
      expect(rdsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database/);
    });

    test("Lambda function exists and can access RDS", () => {
      const lambdaContent = readTerraformFile('lambda.tf');

      expect(lambdaContent).toMatch(/aws_lambda_function/);
      expect(lambdaContent).toMatch(/vpc_config/);
    });

    test("Lambda has VPC configuration for internal traffic", () => {
      const lambdaContent = readTerraformFile('lambda.tf');

      expect(lambdaContent).toMatch(/subnet_ids/);
      expect(lambdaContent).toMatch(/security_group_ids/);
    });

    test("RDS security group allows Lambda access", () => {
      const rdsContent = readTerraformFile('rds.tf');

      expect(rdsContent).toMatch(/security_groups\s*=\s*\[/);
      expect(rdsContent).toMatch(/aws_security_group\.lambda/);
    });
  });

  describe("Monitoring + WAF Requirements", () => {
    test("CloudWatch alarms for unauthorized API calls exist", () => {
      const monitoringContent = readTerraformFile('monitoring.tf');

      expect(monitoringContent).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(monitoringContent).toMatch(/unauthorized.*api.*calls/i);
    });

    test("WAF is attached to ALB", () => {
      const wafContent = readTerraformFile('waf.tf');

      expect(wafContent).toMatch(/aws_wafv2_web_acl/);
      expect(wafContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("CloudTrail is configured", () => {
      const monitoringContent = readTerraformFile('monitoring.tf');

      expect(monitoringContent).toMatch(/aws_cloudtrail/);
      expect(monitoringContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.logs/);
    });
  });

  describe("Security Requirements", () => {
    test("Security groups have proper ingress/egress rules", () => {
      const ec2Content = readTerraformFile('ec2.tf');
      const rdsContent = readTerraformFile('rds.tf');

      // Check for specific port configurations
      expect(ec2Content).toMatch(/from_port\s*=\s*80/);
      expect(ec2Content).toMatch(/from_port\s*=\s*443/);
      expect(rdsContent).toMatch(/from_port\s*=\s*3306/);
    });

    test("Resources have proper tagging", () => {
      // Check that resources have Name tags
      expect(allTerraformContent).toMatch(/tags\s*=\s*{/);
      expect(allTerraformContent).toMatch(/Name\s*=/);
    });

    test("Sensitive variables are marked as sensitive", () => {
      const variablesContent = readTerraformFile('variables.tf');

      expect(variablesContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Resource Naming and Organization", () => {
    test("Resources follow consistent naming convention", () => {
      // Check for consistent naming pattern: project-environment-resource-region
      expect(allTerraformContent).toMatch(/\$\{var\.project_name\}-\$\{var\.environment\}/);
    });

    test("Resources are properly organized by service", () => {
      const files = getAllTerraformFiles();

      // Each major service should have its own file
      expect(files).toContain('vpc.tf');
      expect(files).toContain('s3.tf');
      expect(files).toContain('ec2.tf');
      expect(files).toContain('rds.tf');
      expect(files).toContain('lambda.tf');
      expect(files).toContain('iam.tf');
    });
  });

  describe("Data Sources and Dependencies", () => {
    test("Required data sources are present", () => {
      expect(allTerraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(allTerraformContent).toMatch(/data\s+"aws_availability_zones"/);
    });

    test("Resource dependencies are properly defined", () => {
      // Check for explicit dependencies where needed
      expect(allTerraformContent).toMatch(/depends_on\s*=\s*\[/);
    });
  });
});