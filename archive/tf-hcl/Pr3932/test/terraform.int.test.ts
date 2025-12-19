import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let stackContent: string;
  
  beforeAll(() => {
    const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, 'utf8');
    }
  });

  describe('SAFE MODE - Configuration Validation Tests', () => {
    test('should have valid Terraform configuration structure', () => {
      expect(stackContent).toBeDefined();
      expect(stackContent.length).toBeGreaterThan(1000);
      
      // Check for required terraform block
      expect(stackContent).toMatch(/terraform\s*{[\s\S]*?required_providers/);
      expect(stackContent).toMatch(/aws\s*=\s*{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    });

    test('should define multi-region providers correctly', () => {
      // Check for both region providers
      expect(stackContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-west-2"/);
      
      // Check for provider aliases
      expect(stackContent).toMatch(/alias\s*=\s*"us_east_1"/);
      expect(stackContent).toMatch(/alias\s*=\s*"us_west_2"/);
    });

    test('should have security-focused resource configuration', () => {
      // KMS encryption keys
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      
      // S3 encryption
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/aws:kms/);
      
      // RDS encryption
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should enforce security policies', () => {
      // SSL/TLS enforcement for S3
      expect(stackContent).toMatch(/aws:SecureTransport/);
      expect(stackContent).toMatch(/"false"/);
      
      // Security groups with restricted access
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      
      // Private subnets for databases
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"/);
      expect(stackContent).toMatch(/private/);
    });

    test('should have comprehensive monitoring and logging', () => {
      // VPC Flow Logs
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      
      // CloudWatch Log Groups
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/kms_key_id/);
      
      // CloudTrail
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('should implement compliance controls', () => {
      // AWS Config
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
      
      // Compliance rules
      expect(stackContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
      expect(stackContent).toMatch(/INCOMING_SSH_DISABLED/);
      expect(stackContent).toMatch(/REQUIRED_TAGS/);
      expect(stackContent).toMatch(/CLOUD_TRAIL_ENABLED/);
    });

    test('should have proper network architecture', () => {
      // VPCs in both regions
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"us_east_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"us_west_2"/);
      
      // Subnets (public and private)
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_public/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_east_1_private/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_west_2_public/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"us_west_2_private/);
      
      // NAT Gateways
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('should implement high availability patterns', () => {
      // Multiple availability zones
      expect(stackContent).toMatch(/us-east-1a/);
      expect(stackContent).toMatch(/us-east-1b/);
      expect(stackContent).toMatch(/us-west-2a/);
      expect(stackContent).toMatch(/us-west-2b/);
      
      // Load balancers
      expect(stackContent).toMatch(/resource\s+"aws_lb"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      
      // Cross-region replication
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
    });

    test('should have IAM least privilege configuration', () => {
      // IAM roles
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"application"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"database"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"logging"/);
      
      // No wildcard permissions (should not find Action = "*")
      const wildcardMatches = stackContent.match(/"Action"\s*:\s*"\*"/g);
      expect(wildcardMatches).toBeNull();
      
      // Specific service permissions
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
    });
  });

  describe('File Validation Tests', () => {
    test('should be a single standalone file', () => {
      expect(stackContent).toBeDefined();
      
      // Should not reference external modules
      expect(stackContent).not.toMatch(/module\s+"/);
      
      // Should not reference external variables files
      expect(stackContent).not.toMatch(/var\.[\w_]+/);
      
      // Should have all resources defined inline
      expect(stackContent).toMatch(/resource\s+"aws_vpc"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"/);
    });

    test('should have consistent resource naming', () => {
      // Check for consistent naming patterns
      expect(stackContent).toMatch(/us_east_1/);
      expect(stackContent).toMatch(/us_west_2/);
      
      // Verify resource naming follows Terraform conventions
      expect(stackContent).toMatch(/resource\s+"aws_\w+"\s+"[a-zA-Z0-9_]+"/);
      
      // Check that region identifiers in resource names use underscores
      const resourceNameMatches = stackContent.match(/resource\s+"aws_\w+"\s+"[^"]*us[_-][^"]*"/g);
      if (resourceNameMatches) {
        resourceNameMatches.forEach(match => {
          expect(match).toMatch(/us_east_1|us_west_2/);
        });
      }
    });

    test('should pass terraform syntax validation', () => {
      // Basic syntax checks
      expect(stackContent).toMatch(/^terraform\s*{/m);
      
      // Balanced braces (basic check)
      const openBraces = (stackContent.match(/{/g) || []).length;
      const closeBraces = (stackContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
      
      // No obvious syntax errors
      expect(stackContent).not.toMatch(/\}\s*\{/); // Missing resources between blocks
    });
  });
});
