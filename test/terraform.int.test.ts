import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Use Jest globals
describe('tap_stack.tf Integration Tests', () => {
  let tf: Record<string, any> = {};
  const tfOutputPathEnv = process.env.TF_OUTPUT_PATH;
  let tfOutputPath =
    tfOutputPathEnv && tfOutputPathEnv.length
      ? tfOutputPathEnv
      : 'tf-output.json';

  beforeAll(() => {
    // Resolve path relative to repository root / working dir
    tfOutputPath = path.resolve(process.cwd(), tfOutputPath);

    // If file exists, read it
    if (fs.existsSync(tfOutputPath)) {
      const raw = fs.readFileSync(tfOutputPath, 'utf8');
      tf = JSON.parse(raw);
      return;
    }

    // If file missing, try to run `terraform output -json` if terraform exists in PATH
    try {
      const terraformVersion = execSync('terraform -version', {
        stdio: 'pipe',
      }).toString();
      // Run terraform output -json and parse
      const rawOut = execSync('terraform output -json', {
        stdio: 'pipe',
      }).toString();
      tf = JSON.parse(rawOut);

      // Save a local copy to make debugging easier
      try {
        fs.writeFileSync(tfOutputPath, rawOut, 'utf8');
        // eslint-disable-next-line no-console
        console.log(`Wrote terraform outputs to ${tfOutputPath}`);
      } catch (e) {
        // ignore write failures
      }
      return;
    } catch (err) {
      // terraform not available or failed; throw clear error
      const errorMsg = [
        `Could not find ${tfOutputPath} and failed to run 'terraform output -json'.`,
        `Make sure you run 'terraform output -json > ${path.basename(tfOutputPath)}' before running tests,`,
        'or ensure terraform is installed in PATH in your test environment.',
      ].join(' ');
      throw new Error(errorMsg);
    }
  });

  function findFirstOutputValueByRegex(regex: RegExp): any | null {
    for (const k of Object.keys(tf)) {
      if (regex.test(k)) {
        const entry = tf[k];
        // Terraform output JSON format: { "<name>": { "value": ... } }
        if (entry && typeof entry === 'object' && 'value' in entry) {
          return entry.value;
        }
        return entry;
      }
    }
    return null;
  }

  test('should output a valid VPC ID', () => {
    // look for common vpc output names
    const vpcValue =
      findFirstOutputValueByRegex(/vpc(_id)?$/i) ||
      findFirstOutputValueByRegex(/^aws_vpc/i) ||
      findFirstOutputValueByRegex(/vpc/i);

    expect(vpcValue).toBeTruthy();
    if (typeof vpcValue === 'string') {
      expect(vpcValue.length).toBeGreaterThan(0);
    }
  });

  test('should output a valid S3 data bucket name', () => {
    // look for output names referencing data bucket or s3
    const bucketValue =
      findFirstOutputValueByRegex(/data.*bucket/i) ||
      findFirstOutputValueByRegex(/s3.*data/i) ||
      findFirstOutputValueByRegex(/aws_s3_bucket.*data/i) ||
      findFirstOutputValueByRegex(/bucket.*data/i);

    expect(bucketValue).toBeTruthy();
    if (typeof bucketValue === 'string') {
      expect(bucketValue.length).toBeGreaterThan(0);
      expect(bucketValue).toMatch(/[a-z0-9.-]{3,}/i);
    }
  });

  // Keep placeholders (todo) as skipped/annotated tests if you want to implement deeper checks later
  test.todo('should verify that the VPC exists');
  test.todo('should verify that the S3 data bucket exists');
});
