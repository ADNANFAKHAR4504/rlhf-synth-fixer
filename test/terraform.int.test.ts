import { describe, it } from '@jest/globals';
import { execSync } from 'child_process';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.resolve(__dirname, '../lib');

  it('should successfully deploy, test, and destroy the infrastructure', () => {
    try {
      // Deploy the infrastructure
      execSync('terraform apply -auto-approve', { cwd: libDir, stdio: 'pipe' });

      // Run infrastructure tests
      execSync('awspec exec -f tests/awspec/spec', {
        cwd: libDir,
        stdio: 'pipe',
      });
    } finally {
      // Destroy the infrastructure
      execSync('terraform destroy -auto-approve', {
        cwd: libDir,
        stdio: 'pipe',
      });
    }
  });
});
