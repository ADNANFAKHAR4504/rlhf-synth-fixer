import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const providerPath = path.join(LIB_DIR, "provider.tf");
const variablesPath = path.join(LIB_DIR, "variables.tf");
const outputsPath = path.join(LIB_DIR, "outputs.tf");
// We'll use vpc.tf as our main stack file since tap_stack.tf doesn't exist
const stackPath = path.join(LIB_DIR, "vpc.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure Tests", () => {
    test("essential infrastructure files should exist", () => {
      const requiredFiles = [
        stackPath,
        providerPath,
        variablesPath,
        outputsPath
      ];

      requiredFiles.forEach(file => {
        const exists = fs.existsSync(file);
        if (!exists) {
          console.error(`[unit] Expected file at: ${file}`);
        }
        expect(exists).toBe(true);
      });
    });

    test("should have valid file permissions", () => {
      const files = [stackPath, providerPath, variablesPath, outputsPath];
      files.forEach(file => {
        const stats = fs.statSync(file);
        expect(stats.isFile()).toBe(true);
        // Check if file is readable
        expect(() => fs.accessSync(file, fs.constants.R_OK)).not.toThrow();
      });
    });
  });

  describe("Provider Configuration Tests", () => {
    const providerContent = fs.readFileSync(providerPath, "utf8");

    test("provider configuration should specify required provider versions", () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      // Updated regex to handle nested blocks
      expect(providerContent).toMatch(/aws\s*=\s*{[^}]*version\s*=/);
    });

    test("should have proper provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("should not have hardcoded credentials", () => {
      expect(providerContent).not.toMatch(/access_key\s*=\s*["'][^"']+["']/);
      expect(providerContent).not.toMatch(/secret_key\s*=\s*["'][^"']+["']/);
    });
  });

  describe("Variables Configuration Tests", () => {
    const variablesContent = fs.readFileSync(variablesPath, "utf8");

    test("should declare required variables", () => {
      // Check if the file contains at least one variable declaration
      expect(variablesContent).toMatch(/variable\s+".+"\s*{/);
    });

    test("should have proper variable type constraints", () => {
      expect(variablesContent).toMatch(/type\s*=\s*string/);
      expect(variablesContent).toMatch(/description\s*=\s*".+"/);
    });
  });

  describe("Stack Configuration Tests", () => {
    const stackContent = fs.readFileSync(stackPath, "utf8");

    test("should not declare duplicate providers", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("should reference variables correctly", () => {
      expect(stackContent).toMatch(/var\.[a-zA-Z_][a-zA-Z0-9_]*/);
    });

    test("should have proper resource naming", () => {
      const resourceMatches = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g) || [];
      resourceMatches.forEach(match => {
        expect(match).toMatch(/resource\s+"[a-z0-9_]+"\s+"[a-z0-9_-]+"\s*{/);
      });
    });
  });

  describe("Outputs Configuration Tests", () => {
    const outputsContent = fs.readFileSync(outputsPath, "utf8");

    test("should declare required outputs", () => {
      expect(outputsContent).toMatch(/output\s+".+"\s*{/);
      expect(outputsContent).toMatch(/value\s*=/);
      expect(outputsContent).toMatch(/description\s*=\s*".+"/);
    });

    test("should have properly formatted output blocks", () => {
      const outputBlocks = outputsContent.match(/output\s+".+"\s*{[^}]+}/g) || [];
      outputBlocks.forEach(block => {
        expect(block).toMatch(/value\s*=.+/);
        expect(block).toMatch(/description\s*=\s*".+"/);
      });
    });
  });
});
