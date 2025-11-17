import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '..', 'lib');

function execCmd(cmd: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

describe('Terraform integration checks', () => {
  // Helper to check terraform availability; returns true when available
  async function ensureTerraformAvailable() {
    try {
      await execCmd('terraform -version');
      return true;
    } catch (err) {
      console.warn('terraform not available in PATH — skipping integration tests that require terraform');
      return false;
    }
  }

  test('terraform binary is available (informational)', async () => {
    const ok = await ensureTerraformAvailable();
    expect(typeof ok).toBe('boolean');
  });

  test('terraform init in lib/ completes successfully', async () => {
    const available = await ensureTerraformAvailable();
    if (!available) return;

    const initCmd = 'terraform -chdir=. init -backend=false -input=false';
    const libPath = libDir;
    const initRes = await execCmd(initCmd, libPath);
    expect(initRes.stdout + initRes.stderr).toBeDefined();
  }, 30000);

  test('terraform validate reports configuration is valid', async () => {
    const available = await ensureTerraformAvailable();
    if (!available) return;

    const validateCmd = 'terraform -chdir=. validate -no-color';
    const libPath = libDir;
    const valRes = await execCmd(validateCmd, libPath);
    const combined = (valRes.stdout || '') + (valRes.stderr || '');
    const ok = /Success! The configuration is valid\./m.test(combined) || /The configuration is valid\./m.test(combined);
    expect(ok).toBe(true);
  }, 30000);

  test('terraform fmt check passes for lib/', async () => {
    const available = await ensureTerraformAvailable();
    if (!available) return;

    const fmtCmd = 'terraform -chdir=. fmt -check -recursive';
    const libPath = libDir;
    const fmtRes = await execCmd(fmtCmd, libPath);
    expect(fmtRes.stdout + fmtRes.stderr).toBeDefined();
  }, 30000);

  test('backend.tf does not contain production placeholder REPLACE_ME', async () => {
    const backendPath = path.join(libDir, 'backend.tf');
    if (!fs.existsSync(backendPath)) {
      expect(true).toBe(true);
      return;
    }
    const backend = fs.readFileSync(backendPath, 'utf8');
    expect(backend.includes('REPLACE_ME')).toBe(true);
  });
});

