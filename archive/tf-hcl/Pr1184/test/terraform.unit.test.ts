/**
 * Comprehensive Unit Tests for Terraform Configuration (main.tf)
 * Testing infrastructure components without running terraform init/apply
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  let terraformContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read the main.tf and provider.tf files
    const mainTfPath = path.join(__dirname, '../lib/main.tf');
    const providerTfPath = path.join(__dirname, '../lib/provider.tf');
    
    terraformContent = fs.readFileSync(mainTfPath, 'utf8');
    providerContent = fs.readFileSync(providerTfPath, 'utf8');
  });

  describe('File Structure and Syntax Validation', () => {
    test('main.tf file should exist and be readable', () => {
      expect(terraformContent).toBeDefined();
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test('provider.tf file should exist and be readable', () => {
      expect(providerContent).toBeDefined();
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test('should contain required Terraform blocks', () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"/);
      expect(terraformContent).toMatch(/variable\s+"environment"/);
      expect(terraformContent).toMatch(/variable\s+"project_name"/);
      expect(terraformContent).toMatch(/variable\s+"allowed_ip_ranges"/);
      expect(terraformContent).toMatch(/variable\s+"vpc_id"/);
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"/);
      expect(terraformContent).toMatch(/data\s+"aws_vpc"/);
      expect(terraformContent).toMatch(/locals\s+{/);
    });
  });

  describe('Variable Definitions and Validation', () => {
    test('aws_region variable should have correct structure', () => {
      const variableMatch = terraformContent.match(/variable\s+"aws_region"\s*{[\s\S]*?}/);
      expect(variableMatch).toBeTruthy();
      
      const variableBlock = variableMatch![0];
      expect(variableBlock).toMatch(/description\s*=\s*"AWS region for resource deployment"/);
      expect(variableBlock).toMatch(/type\s*=\s*string/);
      expect(variableBlock).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('environment variable should have correct structure', () => {
      const variableMatch = terraformContent.match(/variable\s+"environment"\s*{[\s\S]*?}/);
      expect(variableMatch).toBeTruthy();
      
      const variableBlock = variableMatch![0];
      expect(variableBlock).toMatch(/description\s*=\s*"Environment name \(e\.g\., dev, staging, prod\)"/);
      expect(variableBlock).toMatch(/type\s*=\s*string/);
      expect(variableBlock).toMatch(/default\s*=\s*"dev"/);
    });

    test('project_name variable should have correct structure', () => {
      const variableMatch = terraformContent.match(/variable\s+"project_name"\s*{[\s\S]*?}/);
      expect(variableMatch).toBeTruthy();
      
      const variableBlock = variableMatch![0];
      expect(variableBlock).toMatch(/description\s*=\s*"Name of the project for resource naming"/);
      expect(variableBlock).toMatch(/type\s*=\s*string/);
      expect(variableBlock).toMatch(/default\s*=\s*"secure-web-app"/);
    });

    test('allowed_ip_ranges variable should have validation and default values', () => {
      const variableMatch = terraformContent.match(/variable\s+"allowed_ip_ranges"\s*{[\s\S]*?}\s*(?=variable|\s*#|\s*data|\s*resource|\s*locals|\s*output|\s*$)/);
      expect(variableMatch).toBeTruthy();
      
      const variableBlock = variableMatch![0];
      expect(variableBlock).toMatch(/type\s*=\s*list\(string\)/);
      expect(variableBlock).toMatch(/validation\s*{/);
      expect(variableBlock).toMatch(/condition\s*=\s*length\(var\.allowed_ip_ranges\)\s*>\s*0/);
      expect(variableBlock).toMatch(/error_message\s*=\s*"At least one IP range must be specified for security group access\."/);
      
      // Check default IP ranges
      expect(variableBlock).toMatch(/"10\.0\.0\.0\/8"/);
      expect(variableBlock).toMatch(/"172\.16\.0\.0\/12"/);
      expect(variableBlock).toMatch(/"192\.168\.0\.0\/16"/);
      expect(variableBlock).toMatch(/"203\.0\.113\.0\/24"/);
    });

    test('vpc_id variable should allow null default', () => {
      const variableMatch = terraformContent.match(/variable\s+"vpc_id"\s*{[\s\S]*?}/);
      expect(variableMatch).toBeTruthy();
      
      const variableBlock = variableMatch![0];
      expect(variableBlock).toMatch(/type\s*=\s*string/);
      expect(variableBlock).toMatch(/default\s*=\s*null/);
    });
  });

  describe('Data Sources Configuration', () => {
    test('should define aws_vpc data source for default VPC', () => {
      const dataMatch = terraformContent.match(/data\s+"aws_vpc"\s+"default"\s*{[\s\S]*?}/);
      expect(dataMatch).toBeTruthy();
      
      const dataBlock = dataMatch![0];
      expect(dataBlock).toMatch(/count\s*=\s*var\.vpc_id\s*==\s*null\s*\?\s*1\s*:\s*0/);
      expect(dataBlock).toMatch(/default\s*=\s*true/);
    });
  });

  describe('Local Values Configuration', () => {
    test('should define locals block with required values', () => {
      // Check for locals block existence
      expect(terraformContent).toMatch(/locals\s*{/);
      
      // Check individual elements within the content
      expect(terraformContent).toMatch(/vpc_id\s*=\s*var\.vpc_id\s*!=\s*null\s*\?\s*var\.vpc_id\s*:\s*data\.aws_vpc\.default\[0\]\.id/);
      expect(terraformContent).toMatch(/common_tags\s*=\s*{/);
      expect(terraformContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(terraformContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(terraformContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(terraformContent).toMatch(/Purpose\s*=\s*"web-application-security"/);
      expect(terraformContent).toMatch(/security_group_name\s*=\s*"\${var\.project_name}-\${var\.environment}-web-sg"/);
    });
  });

  describe('Security Group Resource Configuration', () => {
    test('should define aws_security_group resource with correct structure', () => {
      const resourceMatch = terraformContent.match(/resource\s+"aws_security_group"\s+"web_application_sg"\s*{[\s\S]*?^}/m);
      expect(resourceMatch).toBeTruthy();
      
      const resourceBlock = resourceMatch![0];
      expect(resourceBlock).toMatch(/name\s*=\s*local\.security_group_name/);
      expect(resourceBlock).toMatch(/description\s*=\s*"Security group for \$\{var\.project_name\} web application - allows HTTP\/HTTPS from specified IP ranges only"/);
      expect(resourceBlock).toMatch(/vpc_id\s*=\s*local\.vpc_id/);
    });

    test('should have dynamic ingress rules for HTTP (port 80)', () => {
      const httpIngressMatch = terraformContent.match(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ip_ranges[\s\S]*?content\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?}/);
      expect(httpIngressMatch).toBeTruthy();
      
      const httpIngressBlock = httpIngressMatch![0];
      expect(httpIngressBlock).toMatch(/to_port\s*=\s*80/);
      expect(httpIngressBlock).toMatch(/protocol\s*=\s*"tcp"/);
      expect(httpIngressBlock).toMatch(/cidr_blocks\s*=\s*\[ingress\.value\]/);
    });

    test('should have dynamic ingress rules for HTTPS (port 443)', () => {
      const httpsIngressMatch = terraformContent.match(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ip_ranges[\s\S]*?content\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?}/);
      expect(httpsIngressMatch).toBeTruthy();
      
      const httpsIngressBlock = httpsIngressMatch![0];
      expect(httpsIngressBlock).toMatch(/to_port\s*=\s*443/);
      expect(httpsIngressBlock).toMatch(/protocol\s*=\s*"tcp"/);
      expect(httpsIngressBlock).toMatch(/cidr_blocks\s*=\s*\[ingress\.value\]/);
    });

    test('should have egress rule for all outbound traffic', () => {
      const egressMatch = terraformContent.match(/egress\s*{[\s\S]*?}/);
      expect(egressMatch).toBeTruthy();
      
      const egressBlock = egressMatch![0];
      expect(egressBlock).toMatch(/description\s*=\s*"All outbound traffic"/);
      expect(egressBlock).toMatch(/from_port\s*=\s*0/);
      expect(egressBlock).toMatch(/to_port\s*=\s*0/);
      expect(egressBlock).toMatch(/protocol\s*=\s*"-1"/);
      expect(egressBlock).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('should have proper tagging configuration', () => {
      const tagsMatch = terraformContent.match(/tags\s*=\s*merge\(local\.common_tags,\s*{[\s\S]*?}\)/);
      expect(tagsMatch).toBeTruthy();
      
      const tagsBlock = tagsMatch![0];
      expect(tagsBlock).toMatch(/Name\s*=\s*local\.security_group_name/);
      expect(tagsBlock).toMatch(/Type\s*=\s*"web-application-security-group"/);
    });

    test('should have lifecycle management configuration', () => {
      const lifecycleMatch = terraformContent.match(/lifecycle\s*{[\s\S]*?}/);
      expect(lifecycleMatch).toBeTruthy();
      
      const lifecycleBlock = lifecycleMatch![0];
      expect(lifecycleBlock).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe('Output Definitions', () => {
    test('should define security_group_id output', () => {
      const outputMatch = terraformContent.match(/output\s+"security_group_id"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"ID of the created security group"/);
      expect(outputBlock).toMatch(/value\s*=\s*aws_security_group\.web_application_sg\.id/);
    });

    test('should define security_group_arn output', () => {
      const outputMatch = terraformContent.match(/output\s+"security_group_arn"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"ARN of the created security group"/);
      expect(outputBlock).toMatch(/value\s*=\s*aws_security_group\.web_application_sg\.arn/);
    });

    test('should define security_group_name output', () => {
      const outputMatch = terraformContent.match(/output\s+"security_group_name"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"Name of the created security group"/);
      expect(outputBlock).toMatch(/value\s*=\s*aws_security_group\.web_application_sg\.name/);
    });

    test('should define vpc_id output', () => {
      const outputMatch = terraformContent.match(/output\s+"vpc_id"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"VPC ID where the security group was created"/);
      expect(outputBlock).toMatch(/value\s*=\s*local\.vpc_id/);
    });

    test('should define allowed_ip_ranges output', () => {
      const outputMatch = terraformContent.match(/output\s+"allowed_ip_ranges"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"IP ranges configured for inbound access"/);
      expect(outputBlock).toMatch(/value\s*=\s*var\.allowed_ip_ranges/);
    });

    test('should define inbound_rules_summary output', () => {
      const outputMatch = terraformContent.match(/output\s+"inbound_rules_summary"\s*{[\s\S]*?}/);
      expect(outputMatch).toBeTruthy();
      
      const outputBlock = outputMatch![0];
      expect(outputBlock).toMatch(/description\s*=\s*"Summary of configured inbound rules"/);
      expect(outputBlock).toMatch(/http_port\s*=\s*80/);
      expect(outputBlock).toMatch(/https_port\s*=\s*443/);
      expect(outputBlock).toMatch(/allowed_sources\s*=\s*var\.allowed_ip_ranges/);
      expect(outputBlock).toMatch(/total_rules\s*=\s*length\(var\.allowed_ip_ranges\)\s*\*\s*2/);
    });
  });

  describe('Provider Configuration Tests', () => {
    test('should define terraform block with required version', () => {
      const terraformMatch = providerContent.match(/terraform\s*{[\s\S]*?}/);
      expect(terraformMatch).toBeTruthy();
      
      const terraformBlock = terraformMatch![0];
      expect(terraformBlock).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('should define required providers with AWS', () => {
      const providersMatch = providerContent.match(/required_providers\s*{[\s\S]*?}/);
      expect(providersMatch).toBeTruthy();
      
      const providersBlock = providersMatch![0];
      expect(providersBlock).toMatch(/aws\s*=\s*{/);
      expect(providersBlock).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providersBlock).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should define S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });

    test('should define AWS provider with region variable', () => {
      const providerMatch = providerContent.match(/provider\s+"aws"\s*{[\s\S]*?}/);
      expect(providerMatch).toBeTruthy();
      
      const providerBlock = providerMatch![0];
      expect(providerBlock).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Security and Best Practices Validation', () => {
    test('should not allow unrestricted inbound access (0.0.0.0/0)', () => {
      // Ensure no ingress rules allow 0.0.0.0/0 directly
      const ingressBlocks = terraformContent.match(/dynamic\s+"ingress"[\s\S]*?}/g);
      expect(ingressBlocks).toBeTruthy();
      
      ingressBlocks?.forEach(block => {
        expect(block).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      });
    });

    test('should use private IP ranges in default allowed_ip_ranges', () => {
      const allowedIpRanges = terraformContent.match(/default\s*=\s*\[[\s\S]*?\]/);
      expect(allowedIpRanges).toBeTruthy();
      
      const rangesBlock = allowedIpRanges![0];
      expect(rangesBlock).toMatch(/"10\.0\.0\.0\/8"/); // RFC 1918
      expect(rangesBlock).toMatch(/"172\.16\.0\.0\/12"/); // RFC 1918
      expect(rangesBlock).toMatch(/"192\.168\.0\.0\/16"/); // RFC 1918
    });

    test('should have proper resource naming convention', () => {
      expect(terraformContent).toMatch(/security_group_name\s*=\s*"\${var\.project_name}-\${var\.environment}-web-sg"/);
    });

    test('should include mandatory tags', () => {
      const commonTagsMatch = terraformContent.match(/common_tags\s*=\s*{[\s\S]*?}/);
      expect(commonTagsMatch).toBeTruthy();
      
      const tagsBlock = commonTagsMatch![0];
      expect(tagsBlock).toMatch(/Environment\s*=\s*var\.environment/);
      expect(tagsBlock).toMatch(/Project\s*=\s*var\.project_name/);
      expect(tagsBlock).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test('should only allow HTTP (80) and HTTPS (443) ports', () => {
      const httpPortMatch = terraformContent.match(/from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/);
      const httpsPortMatch = terraformContent.match(/from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
      
      expect(httpPortMatch).toBeTruthy();
      expect(httpsPortMatch).toBeTruthy();
      
      // Ensure no other ports are explicitly allowed
      const allPortMatches = terraformContent.match(/from_port\s*=\s*\d+/g);
      const allowedPorts = allPortMatches?.map(match => match.match(/\d+/)![0]);
      
      allowedPorts?.forEach(port => {
        if (port !== '0') { // 0 is for egress all traffic
          expect(['80', '443']).toContain(port);
        }
      });
    });
  });

  describe('Infrastructure Logic Validation', () => {
    test('should use conditional logic for VPC selection', () => {
      expect(terraformContent).toMatch(/vpc_id\s*=\s*var\.vpc_id\s*!=\s*null\s*\?\s*var\.vpc_id\s*:\s*data\.aws_vpc\.default\[0\]\.id/);
    });

    test('should use dynamic blocks for ingress rules', () => {
      const dynamicBlocks = terraformContent.match(/dynamic\s+"ingress"/g);
      expect(dynamicBlocks).toBeTruthy();
      expect(dynamicBlocks!.length).toBe(2); // One for HTTP, one for HTTPS
    });

    test('should calculate total rules correctly in output', () => {
      expect(terraformContent).toMatch(/total_rules\s*=\s*length\(var\.allowed_ip_ranges\)\s*\*\s*2/);
    });

    test('should have lifecycle management for zero-downtime updates', () => {
      expect(terraformContent).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe('Input Validation Tests', () => {
    test('should validate that allowed_ip_ranges is not empty', () => {
      const validationMatch = terraformContent.match(/validation\s*{[\s\S]*?condition\s*=\s*length\(var\.allowed_ip_ranges\)\s*>\s*0[\s\S]*?}/);
      expect(validationMatch).toBeTruthy();
      
      const validationBlock = validationMatch![0];
      expect(validationBlock).toMatch(/error_message\s*=\s*"At least one IP range must be specified for security group access\."/);
    });
  });

  describe('Resource Dependencies', () => {
    test('should properly reference data sources and variables', () => {
      // Check that security group references local values correctly
      expect(terraformContent).toMatch(/name\s*=\s*local\.security_group_name/);
      expect(terraformContent).toMatch(/vpc_id\s*=\s*local\.vpc_id/);
      
      // Check that outputs reference the security group resource correctly
      expect(terraformContent).toMatch(/aws_security_group\.web_application_sg\.id/);
      expect(terraformContent).toMatch(/aws_security_group\.web_application_sg\.arn/);
      expect(terraformContent).toMatch(/aws_security_group\.web_application_sg\.name/);
    });

    test('should handle conditional data source usage', () => {
      expect(terraformContent).toMatch(/count\s*=\s*var\.vpc_id\s*==\s*null\s*\?\s*1\s*:\s*0/);
      expect(terraformContent).toMatch(/data\.aws_vpc\.default\[0\]\.id/);
    });
  });
});
