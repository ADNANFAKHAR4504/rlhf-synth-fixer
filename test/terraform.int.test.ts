import fs from "fs";
import path from "path";

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Terraform Stack Integration', () => {
    test('tap_stack.tf and provider.tf exist and are valid', async () => {
      const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
      const providerPath = path.resolve(__dirname, "../lib/provider.tf");
      
      // Check files exist
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(fs.existsSync(providerPath)).toBe(true);
      
      // Check files have content
      const stackContent = fs.readFileSync(stackPath, "utf8");
      const providerContent = fs.readFileSync(providerPath, "utf8");
      
      expect(stackContent.length).toBeGreaterThan(100);
      expect(providerContent.length).toBeGreaterThan(10);
      
      // Check for key terraform resources
      expect(stackContent).toMatch(/resource\s+"aws_vpc"/);
      expect(stackContent).toMatch(/resource\s+"aws_instance"/);
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
      
      // Check provider configuration
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('required outputs are defined', async () => {
      const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
      const content = fs.readFileSync(stackPath, "utf8");
      
      // Check for essential outputs
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"bastion_public_ip"/);
      expect(content).toMatch(/output\s+"private_instance_ips"/);
    });
  });
});
