import * as fs from "fs";
import * as path from "path";

describe('Terraform Configuration Tests', () => {
  describe('File-based Configuration Validation', () => {
    test('terraform configuration files exist and are valid', async () => {
      const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
      const providerPath = path.resolve(__dirname, "../lib/provider.tf");
      
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(fs.existsSync(providerPath)).toBe(true);
      
      const stackContent = fs.readFileSync(stackPath, "utf8");
      const providerContent = fs.readFileSync(providerPath, "utf8");
      
      expect(stackContent.length).toBeGreaterThan(1000);
      expect(providerContent.length).toBeGreaterThan(100);
      
      // Basic syntax validation
      expect(stackContent).toMatch(/resource\s+"/);
      expect(providerContent).toMatch(/provider\s+"aws"/);
      console.log('PASS Terraform configuration files validated');
    });

    test('required outputs are defined in terraform files', async () => {
      const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Validate essential outputs for integration testing
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"bastion_public_ip"/);
      expect(content).toMatch(/output\s+"private_instance_ips"/);
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"kms_key_id"/);
      
      console.log('PASS Required terraform outputs validated');
    });

    test('infrastructure is configured to generate proper outputs', async () => {
      const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Verify infrastructure components exist to generate outputs
      expect(content).toMatch(/resource\s+"aws_vpc"/);
      expect(content).toMatch(/resource\s+"aws_instance".*bastion/);
      expect(content).toMatch(/resource\s+"aws_instance".*private/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
      expect(content).toMatch(/resource\s+"aws_kms_key"/);
      
      console.log('PASS Infrastructure output configuration validated');
    });
  });
});
