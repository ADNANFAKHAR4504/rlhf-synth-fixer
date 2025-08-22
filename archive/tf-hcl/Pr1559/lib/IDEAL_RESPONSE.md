
---

## Ideal Response: Terraform S3 & DynamoDB Stack

This solution provisions a secure, versioned S3 bucket and an on-demand DynamoDB table using Terraform. It includes:

- Strict resource naming via `projectname` variable
- Region override via `aws_region` variable
- S3 bucket with versioning and public access block
- DynamoDB table with partition key `id` and PAY_PER_REQUEST billing
- Outputs for key resources
- Unit and integration tests for validation

---

### 1. Terraform HCL: S3 & DynamoDB Stack

```hcl
variable "projectname" {
  description = "Project name for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region for provider"
  type        = string
  default     = "us-west-1"
}

provider "aws" {
  region = var.aws_region
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.projectname}-s3-${random_id.suffix.hex}"
  tags = {
    Name      = "${var.projectname}-s3"
    Project   = var.projectname
    ManagedBy = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "main" {
  name         = "${var.projectname}-dynamodb"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags = {
    Name      = "${var.projectname}-dynamodb"
    Project   = var.projectname
    ManagedBy = "terraform"
  }
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}
```

---

### 2. terraform.tfvars

```hcl
projectname = "example"
aws_region = "us-west-1"
```

---

### 3. Unit Test: tap-stack.unit.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform S3 and DynamoDB Stack', () => {
  let tfConfig: string;

  beforeAll(() => {
    // Read the Terraform file
    tfConfig = fs.readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');
  });

  test('projectname variable is defined and used in resource names', () => {
    expect(tfConfig).toMatch(/variable\s+"projectname"/);
    expect(tfConfig).toMatch(/\${var\.projectname}-s3/);
    expect(tfConfig).toMatch(/\${var\.projectname}-dynamodb/);
  });

  test('S3 bucket resource is present with versioning enabled', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
    expect(tfConfig).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);
  });

  test('S3 bucket public access block is present', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
    expect(tfConfig).toMatch(/block_public_acls\s*=\s*true/);
    expect(tfConfig).toMatch(/block_public_policy\s*=\s*true/);
    expect(tfConfig).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test('DynamoDB table resource is present with correct config', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
    expect(tfConfig).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    expect(tfConfig).toMatch(/hash_key\s*=\s*"id"/);
    expect(tfConfig).toMatch(/attribute\s*{\s*name\s*=\s*"id"/);
  });

  test('Outputs for S3 bucket and DynamoDB table are present', () => {
    expect(tfConfig).toMatch(/output\s+"s3_bucket_name"/);
    expect(tfConfig).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test('Documentation and comments are present', () => {
    expect(tfConfig).toMatch(/Documentation/);
    expect(tfConfig).toMatch(/All resource names follow 'projectname-resource' pattern/);
  });

  test('Tags are set for both resources', () => {
    expect(tfConfig).toMatch(/resource\s+"aws_s3_bucket"\s+"main"[\s\S]*?tags\s*=\s*{[\s\S]*?Name[\s\S]*?Project[\s\S]*?ManagedBy[\s\S]*?}/);
    expect(tfConfig).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"[\s\S]*?tags\s*=\s*{[\s\S]*?Name[\s\S]*?Project[\s\S]*?ManagedBy[\s\S]*?}/);
  });
});
```

---

### 4. Integration Test: tap-stack.int.test.ts

```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Helper: Read output value (supports { value } or flat)
function getOutputValue(obj: any, key: string): string | undefined {
  if (!obj) return undefined;
  if (obj[key] && typeof obj[key] === 'object' && 'value' in obj[key]) return obj[key].value;
  if (obj[key] && typeof obj[key] === 'string') return obj[key];
  return undefined;
}

// Utility: Search for all .tf files that contain a backend block
function findBackendFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.tf'))
    .filter(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      return /backend\s*"/.test(content);
    });
}

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const tfvarsPath = path.join(tfDir, 'terraform.tfvars');
  const localBackendFile = path.join(tfDir, 'zz_local_backend.tf');

  // Output artifact locations (try several common locations)
  const outputsJsonPaths = [
    path.join(__dirname, '../cfn-outputs.json'),
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    path.join(__dirname, '../lib/flat-outputs.json')
  ];

  let renamedBackendFiles: string[] = [];
  let deploymentOutputs: any = null;

  beforeAll(() => {
    // Ensure tfvars exists
    if (!fs.existsSync(tfvarsPath)) {
      fs.writeFileSync(tfvarsPath, 'projectname = "integrationtest"\n');
    }

    // Find and rename all backend config files
    renamedBackendFiles = findBackendFiles(tfDir);
    renamedBackendFiles.forEach(f => {
      const fullPath = path.join(tfDir, f);
      fs.renameSync(fullPath, fullPath + '.bak');
    });

    // Write a local backend config for the test run
    fs.writeFileSync(
      localBackendFile,
      `
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
`
    );

    // Always run terraform init before other commands
    try {
      execSync('terraform init -no-color', { cwd: tfDir, stdio: 'pipe' });
    } catch (err) {
      console.error('Terraform init failed:', err);
      throw err;
    }

    // Read outputs from first existing output file
    for (const outputsPath of outputsJsonPaths) {
      if (fs.existsSync(outputsPath)) {
        try {
          const raw = fs.readFileSync(outputsPath, 'utf8');
          if (raw.trim() !== '') {
            deploymentOutputs = JSON.parse(raw);
            break;
          }
        } catch (err) {
          continue;
        }
      }
    }
  });

  test('terraform init completes successfully', () => {
    expect(() => execSync('terraform init -no-color', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform validate passes with no errors', () => {
    expect(() => execSync('terraform validate -no-color', { cwd: tfDir, stdio: 'pipe' })).not.toThrow();
  });

  test('terraform plan produces expected resources', () => {
    const planOutput = execSync('terraform plan -no-color', { cwd: tfDir }).toString();
    expect(planOutput).toMatch(/aws_s3_bucket\.main/);
    expect(planOutput).toMatch(/aws_dynamodb_table\.main/);
    expect(planOutput).toMatch(/No changes. Infrastructure is up-to-date|Plan:/);
  });

  // --- USE DEPLOYMENT OUTPUTS FOR RESOURCE NAME CHECKS ---
  let bucketName: string | undefined = undefined;
  let tableName: string | undefined = undefined;

  test('deployment output returns resource names', () => {
    expect(deploymentOutputs).toBeTruthy();
    bucketName = getOutputValue(deploymentOutputs, 's3_bucket_name');
    tableName = getOutputValue(deploymentOutputs, 'dynamodb_table_name');
    expect(typeof bucketName).toBe('string');
    expect(typeof tableName).toBe('string');
    expect(bucketName).toMatch(/example-s3-/);
    expect(tableName).toMatch(/example-dynamodb/);
    // If you have AWS access, you can add live AWS SDK checks here.
  });

  afterAll(() => {
    // Optionally clean up state files for test isolation
    const stateFiles = ['terraform.tfstate', 'terraform.tfstate.backup'];
    stateFiles.forEach(f => {
      const filePath = path.join(tfDir, f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    // Remove local backend config
    if (fs.existsSync(localBackendFile)) {
      fs.unlinkSync(localBackendFile);
    }
    // Restore original backend config files
    renamedBackendFiles.forEach(f => {
      const orig = path.join(tfDir, f);
      const bak = orig + '.bak';
      if (fs.existsSync(bak)) {
        fs.renameSync(bak, orig);
      }
    });
    // Optionally clean up deployment output files
    outputsJsonPaths.forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });
});
```

---