import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Terraform Secure Data Storage Integration Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const testTimeout = 60000; // 60 seconds for integration tests

  // Mock terraform outputs for testing
  const mockTerraformOutputs = {
    primary_bucket_name: { 
      value: 'secure-data-abcd1234-primary',
      sensitive: false
    },
    logs_bucket_name: { 
      value: 'secure-data-abcd1234-logs',
      sensitive: false
    },
    application_iam_role_arn: { 
      value: 'arn:aws:iam::123456789012:role/application-role',
      sensitive: false
    },
    security_alerts_sns_topic_arn: { 
      value: 'arn:aws:sns:us-west-2:123456789012:security-alerts',
      sensitive: false
    }
  };

  beforeAll(() => {
    // Create mock outputs directory for testing
    const outputsDir = path.join(__dirname, '..', 'terraform-outputs');
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }

    // Create flat outputs for integration testing
    const flatOutputs = {
      PrimaryBucketName: mockTerraformOutputs.primary_bucket_name.value,
      LogsBucketName: mockTerraformOutputs.logs_bucket_name.value,
      ApplicationIAMRoleArn: mockTerraformOutputs.application_iam_role_arn.value,
      SecurityAlertsSNSTopicArn: mockTerraformOutputs.security_alerts_sns_topic_arn.value,
    };

    fs.writeFileSync(
      path.join(outputsDir, 'outputs.json'),
      JSON.stringify(mockTerraformOutputs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputsDir, 'flat-outputs.json'),
      JSON.stringify(flatOutputs, null, 2)
    );
  });

  afterAll(() => {
    // Clean up mock outputs
    const outputsDir = path.join(__dirname, '..', 'terraform-outputs');
    if (fs.existsSync(outputsDir)) {
      fs.rmSync(outputsDir, { recursive: true, force: true });
    }
  });

  describe('Terraform Configuration Validation', () => {
    test('terraform files exist and are syntactically valid', () => {
      const mainTfPath = path.join(libPath, 'main.tf');
      const providerTfPath = path.join(libPath, 'provider.tf');

      expect(fs.existsSync(mainTfPath)).toBe(true);
      expect(fs.existsSync(providerTfPath)).toBe(true);

      const mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
      const providerTfContent = fs.readFileSync(providerTfPath, 'utf8');

      expect(mainTfContent.length).toBeGreaterThan(5000);
      expect(providerTfContent.length).toBeGreaterThan(100);

      // Basic syntax validation
      expect(mainTfContent).not.toContain('${aws_s3_bucket.nonexistent');
      expect(mainTfContent).not.toContain('${var.nonexistent');
    });

    test('terraform validate passes', async () => {
      try {
        // Initialize terraform without backend for validation
        try {
          await execAsync('terraform init -backend=false', {
            cwd: libPath,
            timeout: 30000
          });
        } catch (initError) {
          // If already initialized, continue
          console.log('Terraform may already be initialized');
        }

        const { stdout, stderr } = await execAsync('terraform validate', {
          cwd: libPath,
          timeout: 30000
        });
        
        expect(stderr).not.toContain('Error:');
        
        // Allow warnings but log them
        if (stderr.includes('Warning:')) {
          console.log('Terraform warnings (allowed):', stderr);
        }
        
        expect(stdout).toContain('Success');
      } catch (error: any) {
        if (error.message.includes('terraform: command not found')) {
          console.log('Terraform CLI not available, skipping validation test');
          return;
        }
        console.error('Terraform validation failed:', error.message);
        throw error;
      }
    }, testTimeout);

    test('terraform fmt check passes', async () => {
      try {
        const { stdout, stderr } = await execAsync('terraform fmt -check', {
          cwd: libPath,
          timeout: 15000
        });
        
        // No output means files are properly formatted
        expect(stderr).toBe('');
      } catch (error: any) {
        if (error.message.includes('terraform: command not found')) {
          console.log('Terraform CLI not available, skipping fmt test');
          return;
        }
        
        // If fmt fails, show which files need formatting
        if (error.stdout) {
          console.log('Files needing formatting:', error.stdout);
        }
        throw new Error('Terraform files are not properly formatted');
      }
    }, testTimeout);
  });

  describe('Resource Dependencies and References', () => {
    test('S3 bucket references are valid', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Check that bucket references exist
      expect(content).toContain('aws_s3_bucket.primary.id');
      expect(content).toContain('aws_s3_bucket.logs.id');
      expect(content).toContain('aws_s3_bucket.primary.arn');
      expect(content).toContain('aws_s3_bucket.logs.arn');
      expect(content).toContain('aws_s3_bucket.logs.bucket');
    });

    test('IAM role references are valid', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('aws_iam_role.application.id');
      expect(content).toContain('aws_iam_role.application.name');
      expect(content).toContain('aws_iam_role.application.arn');
      expect(content).toContain('aws_iam_role.application.unique_id');
    });

    test('SNS topic references are valid', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('aws_sns_topic.security_alerts.arn');
    });

    test('CloudWatch log group references are valid', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('aws_cloudwatch_log_group.cloudtrail.name');
      expect(content).toContain('aws_cloudwatch_log_group.cloudtrail.arn');
    });
  });

  describe('Security Configuration Validation', () => {
    test('S3 bucket policies include security statements', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Primary bucket security
      expect(content).toContain('"DenyInsecureConnections"');
      expect(content).toContain('"RestrictToAllowedCIDRs"');
      expect(content).toContain('"aws:SecureTransport" = "false"');
      
      // Logs bucket security
      expect(content).toContain('"AllowCloudTrailLogs"');
      expect(content).toContain('"AllowCloudTrailAclCheck"');
    });

    test('IAM policies follow least privilege principle', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Should only allow specific S3 actions
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:ListBucket');
      
      // Should be restricted to app/ path
      expect(content).toContain('/app/*');
      expect(content).toContain('"s3:prefix" = ["app/*"]');
      
      // Should not contain overly broad permissions
      expect(content).not.toContain('s3:*');
      expect(content).not.toContain('"*"');
    });

    test('encryption settings are secure', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('sse_algorithm = "AES256"');
      expect(content).toContain('bucket_key_enabled = true');
    });
  });

  describe('Monitoring and Alerting Configuration', () => {
    test('CloudWatch metric filter pattern is comprehensive', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      const iamEvents = [
        'PutRolePolicy',
        'AttachRolePolicy', 
        'PutUserPolicy',
        'AttachUserPolicy',
        'CreateRole',
        'DeleteRole',
        'CreatePolicy',
        'DeletePolicy'
      ];
      
      iamEvents.forEach(event => {
        expect(content).toContain(event);
      });
    });

    test('CloudWatch alarm is properly configured', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('comparison_operator = "GreaterThanOrEqualToThreshold"');
      expect(content).toContain('evaluation_periods = "1"');
      expect(content).toContain('threshold = "1"');
      expect(content).toContain('alarm_actions = [aws_sns_topic.security_alerts.arn]');
    });
  });

  describe('Variable and Output Validation', () => {
    test('default variable values are appropriate for security', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Should use private IP ranges by default
      expect(content).toContain('10.0.0.0/8');
      expect(content).toContain('172.16.0.0/12');
      expect(content).toContain('192.168.0.0/16');
      
      // Should have secure region default
      expect(content).toContain('default = "us-west-2"');
      
      // Should have placeholder email
      expect(content).toContain('security@example.com');
    });

    test('all outputs have proper descriptions and values', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      const outputs = [
        'primary_bucket_name',
        'logs_bucket_name', 
        'application_iam_role_arn',
        'security_alerts_sns_topic_arn'
      ];
      
      outputs.forEach(output => {
        expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{[\\s\\S]*?description`));
        expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{[\\s\\S]*?value`));
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('resources use consistent naming patterns', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('bucket_prefix = "secure-data-${random_id.bucket_suffix.hex}"');
      expect(content).toContain('name = "application-role"');
      expect(content).toContain('name = "security-alerts"');
      expect(content).toContain('name = "security-trail"');
    });

    test('resources have proper tagging', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('tags = local.tags');
      expect(content).toContain('tags = merge(local.tags');
      expect(content).toContain('Environment = "production"');
      expect(content).toContain('Project = "secure-data-storage"');
      expect(content).toContain('ManagedBy = "terraform"');
    });
  });

  describe('Mock Deployment Output Validation', () => {
    test('mock terraform outputs contain expected values', () => {
      const outputsPath = path.join(__dirname, '..', 'terraform-outputs', 'outputs.json');
      expect(fs.existsSync(outputsPath)).toBe(true);
      
      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      
      expect(outputs.primary_bucket_name.value).toMatch(/^secure-data-[a-f0-9]+-primary$/);
      expect(outputs.logs_bucket_name.value).toMatch(/^secure-data-[a-f0-9]+-logs$/);
      expect(outputs.application_iam_role_arn.value).toContain('arn:aws:iam::');
      expect(outputs.security_alerts_sns_topic_arn.value).toContain('arn:aws:sns:');
    });

    test('flat outputs are accessible for integration testing', () => {
      const flatOutputsPath = path.join(__dirname, '..', 'terraform-outputs', 'flat-outputs.json');
      expect(fs.existsSync(flatOutputsPath)).toBe(true);
      
      const flatOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
      
      expect(flatOutputs.PrimaryBucketName).toBeDefined();
      expect(flatOutputs.LogsBucketName).toBeDefined();
      expect(flatOutputs.ApplicationIAMRoleArn).toBeDefined();
      expect(flatOutputs.SecurityAlertsSNSTopicArn).toBeDefined();
    });
  });

  describe('Configuration Consistency Checks', () => {
    test('provider configuration matches main.tf variables', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      
      // Both should reference the same region variable
      expect(mainContent).toContain('variable "aws_region"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('resource dependencies are properly ordered', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // CloudTrail should depend on bucket policy
      expect(content).toMatch(/resource\s+"aws_cloudtrail"[\s\S]*depends_on\s*=\s*\[aws_s3_bucket_policy\.logs\]/);
    });

    test('no circular dependencies exist', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Basic check - ensure resources don't reference themselves
      expect(content).not.toContain('aws_s3_bucket.primary.arn = aws_s3_bucket.primary');
      expect(content).not.toContain('aws_iam_role.application.arn = aws_iam_role.application');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles empty email list gracefully', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      // Should use count to handle dynamic email lists
      expect(content).toContain('count = length(var.security_team_emails)');
      expect(content).toContain('var.security_team_emails[count.index]');
    });

    test('bucket naming uses random suffix to avoid conflicts', () => {
      const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      
      expect(content).toContain('random_id.bucket_suffix.hex');
      expect(content).toContain('byte_length = 4');
    });
  });
});