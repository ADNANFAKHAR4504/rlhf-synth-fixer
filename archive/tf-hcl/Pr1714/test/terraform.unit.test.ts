// terraform-main-unit.ts
// Jest-based static unit tests for modular Terraform HCL (no provider downloads; no AWS calls)

import * as fs from "fs";
import * as path from "path";

// Prefer env var; else resolve ../lib/tap_stack.tf relative to this test file
const TF_PATH = process.env.TF_MAIN_PATH
  ? path.resolve(process.env.TF_MAIN_PATH)
  : path.resolve(__dirname, "../lib/tap_stack.tf");

// Also check locals.tf for local variable definitions
const LOCALS_PATH = process.env.TF_LOCALS_PATH
  ? path.resolve(process.env.TF_LOCALS_PATH)
  : path.resolve(__dirname, "../lib/locals.tf");

describe("Terraform Modular Infrastructure (static checks)", () => {
  let hcl: string;
  let localsHcl: string;

  beforeAll(() => {
    const exists = fs.existsSync(TF_PATH);
    if (!exists) {
      throw new Error(`Terraform file not found at ${TF_PATH}`);
    }
    hcl = fs.readFileSync(TF_PATH, "utf8");

    // Read locals.tf if it exists
    if (fs.existsSync(LOCALS_PATH)) {
      localsHcl = fs.readFileSync(LOCALS_PATH, "utf8");
    } else {
      localsHcl = "";
    }
  });

  test("defines kms_module with correct source and inputs", () => {
    const kmsModule = hcl.match(
      new RegExp(
        String.raw`module\s+"kms_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(kmsModule).toBeTruthy();
    
    // Check source path
    expect(kmsModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/kms_module"`, "m")
    );

    // Check required inputs using local lookups
    expect(kmsModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
    );
    expect(kmsModule!).toMatch(
      new RegExp(String.raw`service\s*=\s*lookup\(local\.service,\s*local\.env\)`, "m")
    );
    expect(kmsModule!).toMatch(
      new RegExp(String.raw`resource\s*=\s*lookup\(local\.resource,\s*local\.env\)`, "m")
    );
    expect(kmsModule!).toMatch(
      new RegExp(String.raw`tags\s*=\s*local\.common_tags`, "m")
    );
  });

  test("defines s3_module with correct source and inputs including KMS dependency", () => {
    const s3Module = hcl.match(
      new RegExp(
        String.raw`module\s+"s3_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(s3Module).toBeTruthy();
    
    // Check source path
    expect(s3Module!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/s3_module"`, "m")
    );

    // Check required inputs using local lookups
    expect(s3Module!).toMatch(
      new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
    );
    expect(s3Module!).toMatch(
      new RegExp(String.raw`service\s*=\s*lookup\(local\.service,\s*local\.env\)`, "m")
    );
    expect(s3Module!).toMatch(
      new RegExp(String.raw`resource\s*=\s*lookup\(local\.resource,\s*local\.env\)`, "m")
    );
    expect(s3Module!).toMatch(
      new RegExp(String.raw`tags\s*=\s*local\.common_tags`, "m")
    );

    // Check KMS module dependency
    expect(s3Module!).toMatch(
      new RegExp(String.raw`kms_key_id\s*=\s*module\.kms_module\.key_id`, "m")
    );
  });

  test("defines iam_module with correct source and inputs including S3 dependency", () => {
    const iamModule = hcl.match(
      new RegExp(
        String.raw`module\s+"iam_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(iamModule).toBeTruthy();
    
    // Check source path
    expect(iamModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/iam_module"`, "m")
    );

    // Check required inputs using local lookups
    expect(iamModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
    );
    expect(iamModule!).toMatch(
      new RegExp(String.raw`service\s*=\s*lookup\(local\.service,\s*local\.env\)`, "m")
    );
    expect(iamModule!).toMatch(
      new RegExp(String.raw`tags\s*=\s*local\.common_tags`, "m")
    );

    // Check S3 module dependency
    expect(iamModule!).toMatch(
      new RegExp(String.raw`s3_bucket_arn\s*=\s*module\.s3_module\.bucket_arn`, "m")
    );
  });

  test("defines cloudfront_module with correct source and inputs including S3 dependencies", () => {
    const cloudfrontModule = hcl.match(
      new RegExp(
        String.raw`module\s+"cloudfront_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(cloudfrontModule).toBeTruthy();
    
    // Check source path
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/cloudfront_module"`, "m")
    );

    // Check required inputs using local lookups
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
    );
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`tags\s*=\s*local\.common_tags`, "m")
    );

    // Check S3 module dependencies
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`s3_bucket_name\s*=\s*module\.s3_module\.bucket_name`, "m")
    );
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`logging_bucket_domain_name\s*=\s*module\.s3_module\.log_bucket_domain`, "m")
    );
    expect(cloudfrontModule!).toMatch(
      new RegExp(String.raw`cloudfront_access_identity_path\s*=\s*module\.s3_module\.cloudfront_access_identity_path`, "m")
    );
  });

  test("defines monitoring_module with correct source and inputs including KMS dependencies", () => {
    const monitoringModule = hcl.match(
      new RegExp(
        String.raw`module\s+"monitoring_module"\s*{([\s\S]*?)}`,
        "m"
      )
    )?.[0];

    expect(monitoringModule).toBeTruthy();
    
    // Check source path
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`source\s*=\s*"\.\/modules\/monitoring_module"`, "m")
    );

    // Check required inputs using local lookups
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
    );
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`service\s*=\s*lookup\(local\.service,\s*local\.env\)`, "m")
    );
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`resource\s*=\s*lookup\(local\.resource,\s*local\.env\)`, "m")
    );

    // Check KMS module dependencies
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`kms_key_id\s*=\s*module\.kms_module\.key_id`, "m")
    );
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`kms_key_arn\s*=\s*module\.kms_module\.key_arn`, "m")
    );

    // Check alert email addresses
    expect(monitoringModule!).toMatch(
      new RegExp(String.raw`alert_email_addresses\s*=\s*\["ogunfowokan\.e@turing\.com"\]`, "m")
    );
  });

  // test("defines logging_module with correct source and inputs including dependencies", () => {
  //   const loggingModule = hcl.match(
  //     new RegExp(
  //       String.raw`module\s+"logging_module"\s*{([\s\S]*?)}`,
  //       "m"
  //     )
  //   )?.[0];

  //   expect(loggingModule).toBeTruthy();
    
  //   // Check source path
  //   expect(loggingModule!).toMatch(
  //     new RegExp(String.raw`source\s*=\s*"\.\/modules\/logging_module"`, "m")
  //   );

  //   // Check required inputs using local lookups
  //   expect(loggingModule!).toMatch(
  //     new RegExp(String.raw`environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)`, "m")
  //   );
  //   expect(loggingModule!).toMatch(
  //     new RegExp(String.raw`service\s*=\s*lookup\(local\.service,\s*local\.env\)`, "m")
  //   );

  //   // Check S3 module dependency
  //   expect(loggingModule!).toMatch(
  //     new RegExp(String.raw`s3_bucket_arn\s*=\s*module\.s3_module\.log_bucket_arn`, "m")
  //   );

  //   // Check monitoring module dependency
  //   expect(loggingModule!).toMatch(
  //     new RegExp(String.raw`cloudwatch_log_group_arn\s*=\s*module\.monitoring_module\.log_group_arn`, "m")
  //   );
  // });

  test("validates proper dependency chain order", () => {
    // Find positions of each module in the file
    const kmsModulePos = hcl.search(/module\s+"kms_module"/);
    const s3ModulePos = hcl.search(/module\s+"s3_module"/);
    const iamModulePos = hcl.search(/module\s+"iam_module"/);
    const cloudfrontModulePos = hcl.search(/module\s+"cloudfront_module"/);
    const monitoringModulePos = hcl.search(/module\s+"monitoring_module"/);
    // const loggingModulePos = hcl.search(/module\s+"logging_module"/);

    // Verify modules are defined in logical dependency order
    // KMS should come before S3 (S3 depends on KMS)
    expect(kmsModulePos).toBeLessThan(s3ModulePos);
    
    // S3 should come before modules that depend on it
    expect(s3ModulePos).toBeLessThan(iamModulePos);
    expect(s3ModulePos).toBeLessThan(cloudfrontModulePos);
    // expect(s3ModulePos).toBeLessThan(loggingModulePos);
    
    // Monitoring should come before logging (logging depends on monitoring)
    // expect(monitoringModulePos).toBeLessThan(loggingModulePos);
  });

  test("validates all modules use relative path sources", () => {
    // Match module blocks that are not commented out
    const moduleBlocks = hcl.match(/(?<!#.*?)module\s+"[^"]+"\s*{[^}]+}/g) || [];
    
    // Filter out any module blocks that start with # or contain only commented lines
    const activeModuleBlocks = moduleBlocks.filter(block => {
      const lines = block.split('\n');
      return lines.some(line => line.trim() && !line.trim().startsWith('#'));
    });
    
    expect(activeModuleBlocks).toHaveLength(5); // kms, s3, iam, cloudfront, monitoring
    
    activeModuleBlocks.forEach(moduleBlock => {
      expect(moduleBlock).toMatch(/source\s*=\s*"\.\/modules\/[^"]+"/);
      // Ensure no absolute paths or external sources
      expect(moduleBlock).not.toMatch(/source\s*=\s*"(?!\.\/)/);
    });
  });

  test("validates module naming consistency", () => {
    const expectedModules = [
      "kms_module",
      "s3_module",
      "iam_module",
      "cloudfront_module",
      "monitoring_module",
      // "logging_module"
    ];

    expectedModules.forEach(moduleName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`module\s+"${moduleName}"\s*{`, "m")
      );
    });
  });

  test("validates consistent use of local variables", () => {
    // Check that all modules consistently use local variable lookups
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]*}/g) || [];
    
    moduleBlocks.forEach(moduleBlock => {
      // If module has environment parameter, it should use lookup
      if (moduleBlock.includes("environment")) {
        expect(moduleBlock).toMatch(/environment\s*=\s*lookup\(local\.env_type,\s*local\.env\)/);
      }
      
      // If module has service parameter, it should use lookup
      if (moduleBlock.includes("service")) {
        expect(moduleBlock).toMatch(/service\s*=\s*lookup\(local\.service,\s*local\.env\)/);
      }
      
      // If module has resource parameter, it should use lookup
      if (moduleBlock.includes("resource")) {
        expect(moduleBlock).toMatch(/resource\s*=\s*lookup\(local\.resource,\s*local\.env\)/);
      }
      
      // If module has tags parameter, it should use local.common_tags
      if (moduleBlock.includes("tags")) {
        expect(moduleBlock).toMatch(/tags\s*=\s*local\.common_tags/);
      }
    });
  });

  test("ensures proper module output references", () => {
    // Check that modules reference expected outputs from other modules
    const expectedOutputRefs = [
      "module.kms_module.key_id",
      "module.kms_module.key_arn",
      "module.s3_module.bucket_arn",
      "module.s3_module.bucket_name",
      "module.s3_module.log_bucket_domain",
      // "module.s3_module.log_bucket_arn",
      "module.s3_module.cloudfront_access_identity_path",
      // "module.monitoring_module.log_group_arn"
    ];

    expectedOutputRefs.forEach(outputRef => {
      expect(hcl).toMatch(new RegExp(outputRef.replace(/\./g, "\\.")));
    });
  });

  test("validates root level outputs are defined", () => {
    const expectedOutputs = [
      "kms_key_id",
      "s3_bucket_name", 
      "cloudfront_distribution_id",
      "cloudfront_domain_name"
    ];

    expectedOutputs.forEach(outputName => {
      expect(hcl).toMatch(
        new RegExp(String.raw`output\s+"${outputName}"\s*{`, "m")
      );
    });
  });

  test("validates root outputs have descriptions and values", () => {
    const outputBlocks = hcl.match(/output\s+"[^"]+"\s*{[^}]*}/g) || [];
    
    expect(outputBlocks).toHaveLength(4);
    
    outputBlocks.forEach(outputBlock => {
      // Each output should have a description
      expect(outputBlock).toMatch(/description\s*=\s*"[^"]+"/);
      // Each output should have a value referencing a module
      expect(outputBlock).toMatch(/value\s*=\s*module\.[^.]+\.[^}]+/);
    });
  });

  test("ensures no hardcoded values except email addresses", () => {
    // Extract only module blocks (not variable blocks or outputs)
    const moduleBlocks = hcl.match(/module\s+"[^"]+"\s*{[^}]*}/g) || [];
    const moduleContent = moduleBlocks.join('\n');
    
    // Look for hardcoded string assignments in module blocks only
    const moduleInputPattern = /(\w+)\s*=\s*"([^"]*)"/g;
    const matches = [...moduleContent.matchAll(moduleInputPattern)];
    
    // Filter out 'source' assignments and 'alert_email_addresses' which should be hardcoded
    const nonSourceMatches = matches.filter(match => 
      match[1] !== 'source' && 
      !match[2].includes('modules/') &&
      !match[2].includes('@turing.com')
    );
    
    // Should have no other hardcoded string values in module inputs
    expect(nonSourceMatches).toHaveLength(0);
  });

  test("validates email address format in monitoring module", () => {
    const monitoringModule = hcl.match(/module\s+"monitoring_module"\s*{[^}]*}/)?.[0];
    expect(monitoringModule).toBeTruthy();
    
    // Should contain a valid email address
    expect(monitoringModule!).toMatch(/alert_email_addresses\s*=\s*\["[^@]+@[^@]+\.[^"]+"\]/);
  });

  test("ensures local variable consistency requirements", () => {
    // Verify that local variables are being used consistently
    const localReferences = [
      "local.env_type",
      "local.env", 
      "local.service",
      "local.resource",
      "local.common_tags"
    ];

    localReferences.forEach(localRef => {
      expect(hcl).toMatch(new RegExp(localRef.replace(/\./g, "\\.")));
    });
  });
});