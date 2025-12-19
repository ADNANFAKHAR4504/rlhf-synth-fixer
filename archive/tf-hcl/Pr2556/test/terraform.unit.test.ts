// Unit tests for Terraform HCL in `lib/`
// These are lightweight, fast, and do not require AWS credentials.
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

function readAllTf(): { file: string; content: string }[] {
  const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
  return files.map(f => ({
    file: f,
    content: fs.readFileSync(path.join(LIB_DIR, f), 'utf8'),
  }));
}

describe('Terraform unit checks (static)', () => {
  test('variables.tf exists and declares aws_region and trusted_cidrs', () => {
    const varsPath = path.join(LIB_DIR, 'variables.tf');
    const exists = fs.existsSync(varsPath);
    expect(exists).toBe(true);
    if (exists) {
      const content = fs.readFileSync(varsPath, 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/variable\s+"trusted_cidrs"\s*{/);
    }
  });

  test('provider is NOT declared in variables.tf (provider.tf should own providers)', () => {
    const varsPath = path.join(LIB_DIR, 'variables.tf');
    if (fs.existsSync(varsPath)) {
      const content = fs.readFileSync(varsPath, 'utf8');
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    } else {
      // if variables.tf is missing the earlier test will fail; keep this non-flaky
      expect(fs.existsSync(varsPath)).toBe(true);
    }
  });

  test('there is at least one KMS CMK defined (aws_kms_key)', () => {
    const files = readAllTf();
    const found = files.some(f =>
      /resource\s+"aws_kms_key"\s+"[^"]+"/.test(f.content)
    );
    expect(found).toBe(true);
  });

  test('S3 buckets configured with versioning and server-side encryption', () => {
    const files = readAllTf();
    const s3Files = files.filter(f =>
      /resource\s+"aws_s3_bucket"/.test(f.content)
    );
    expect(s3Files.length).toBeGreaterThan(0);
    // Accept either an explicit aws_s3_bucket_versioning resource or versioning_configuration status = "Enabled"
    const hasVersioning = files.some(
      f =>
        /resource\s+"aws_s3_bucket_versioning"/.test(f.content) ||
        /versioning_configuration\s*\{[\s\S]*status\s*=\s*"Enabled"/.test(
          f.content
        )
    );
    // Accept aws_s3_bucket_server_side_encryption_configuration or presence of kms_master_key_id / sse_algorithm aws:kms
    const hasSSE = files.some(
      f =>
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/.test(
          f.content
        ) ||
        /kms_master_key_id/.test(f.content) ||
        /sse_algorithm\s*=\s*"aws:kms"/.test(f.content)
    );
    expect(hasVersioning).toBe(true);
    expect(hasSSE).toBe(true);
  });

  test('no security group ingress uses 0.0.0.0/0 (egress or NACLs may allow broader egress)', () => {
    const files = readAllTf();
    // Look for 0.0.0.0/0 that appears within an ingress block in security group files
    const sgFiles = files.filter(
      f =>
        f.file.includes('security_group') ||
        f.file.includes('security_groups') ||
        /resource\s+"aws_security_group"/.test(f.content)
    );
    // More robust approach: scan file and extract each 'ingress { ... }' block by brace matching,
    // then check whether that block contains 0.0.0.0/0. This avoids matching an earlier 'ingress'
    // and a later egress that contains 0.0.0.0/0 in the same file.
    function findIngressBlocks(content: string): string[] {
      const blocks: string[] = [];
      const ingressRegex = /ingress\s*\{/g;
      let match: RegExpExecArray | null;
      while ((match = ingressRegex.exec(content)) !== null) {
        let i = match.index + match[0].length;
        let depth = 1;
        let block = '';
        while (i < content.length && depth > 0) {
          const ch = content[i];
          block += ch;
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
          i++;
        }
        blocks.push(block);
        // move regex lastIndex forward to avoid re-matching inside this block
        ingressRegex.lastIndex = match.index + match[0].length + block.length;
      }
      return blocks;
    }

    const bad = sgFiles.filter(f => {
      const ingressBlocks = findIngressBlocks(f.content);
      return ingressBlocks.some(b => /0\.0\.0\.0\/0/.test(b));
    });
    if (bad.length > 0) {
      const names = bad.map(b => b.file).join(', ');
      throw new Error(
        `Found 0.0.0.0/0 in security group ingress in files: ${names}`
      );
    }
    expect(bad.length).toBe(0);
  });

  test('tags include Environment=Production and Owner=TeamX somewhere in lib/', () => {
    const files = readAllTf();
    const joined = files.map(f => f.content).join('\n');
    const hasEnv =
      /Environment\s*=\s*"?Production"?/.test(joined) ||
      /tag\s*:\s*Environment\s*=/.test(joined);
    const hasOwner =
      /Owner\s*=\s*"?TeamX"?/.test(joined) ||
      /tag\s*:\s*Owner\s*=/.test(joined);
    expect(hasEnv).toBe(true);
    expect(hasOwner).toBe(true);
  });

  test('network ACLs and security groups reference var.trusted_cidrs and avoid wildcard ingress', () => {
    const files = readAllTf();
    const joined = files.map(f => f.content).join('\n');
    expect(joined).toMatch(/var\.trusted_cidrs|trusted_cidrs/);
    // ensure security group ingress rules don't include 0.0.0.0/0 (already checked above), and that egress is restricted to 443 where specified
    const hasEgress443 = /egress[\s\S]*443|to_port\s*=\s*443/.test(joined);
    expect(hasEgress443).toBe(true);
  });

  test('provider.tf sets region to us-west-2 (or uses var.aws_region) and declares an S3 backend', () => {
    const providerPath = path.join(LIB_DIR, 'provider.tf');
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
    if (exists) {
      const content = fs.readFileSync(providerPath, 'utf8');
      // Accept either a hard-coded us-west-2 or a reference to var.aws_region
      const regionOk = /region\s*=\s*["']?us-west-2["']?/.test(content) || /region\s*=\s*var\.aws_region/.test(content);
      expect(regionOk).toBe(true);
      // Ensure an S3 backend is declared somewhere in terraform backend configuration
      const hasS3Backend = /backend\s*"s3"/.test(content) || /terraform[\s\S]*backend\s*"s3"/.test(content);
      expect(hasS3Backend).toBe(true);
    }
  });

  test('provider.default_tags (Environment/Owner) present in provider.tf', () => {
    const providerPath = path.join(LIB_DIR, 'provider.tf');
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
    if (exists) {
      const content = fs.readFileSync(providerPath, 'utf8');
      // Look for default_tags block and evidence of the two required tags
      const hasDefaultTags = /default_tags\s*\{[\s\S]*tags\s*=\s*\{/.test(content);
      const hasEnv = /Environment\s*=\s*\"?Production\"?/.test(content);
      const hasOwner = /Owner\s*=\s*\"?TeamX\"?/.test(content);
      expect(hasDefaultTags || (hasEnv && hasOwner)).toBe(true);
    }
  });

  test('IAM policies should not contain wildcard Action or Resource', () => {
    const files = readAllTf();
    const matches: { file: string; excerpt: string }[] = [];
    const actionResourceHcl = /\baction\s*=\s*(?:\[\s*"\*"|"\*")|\bresource\s*=\s*"\*"/i;
    const actionResourceJson = /"Action"\s*:\s*"\*"|"Action"\s*:\s*\[\s*"\*"\s*\]|"Resource"\s*:\s*"\*"/i;

    for (const f of files) {
      if (/iam|role|policy/i.test(f.file) || /aws_iam_/.test(f.content)) {
        const hclMatchIndex = f.content.search(actionResourceHcl);
        const jsonMatchIndex = f.content.search(actionResourceJson);
        const matchIndex = hclMatchIndex !== -1 ? hclMatchIndex : jsonMatchIndex;
        if (matchIndex !== -1) {
          // extract a surrounding context block to judge intent
          const start = Math.max(0, matchIndex - 400);
          const end = Math.min(f.content.length, matchIndex + 800);
          const context = f.content.slice(start, end);

          // Allow wildcard Resource when used with SSM or ssmmessages actions (SSM requires Resource = "*" for some APIs)
          if (/ssm:|ssmmessages:/i.test(context)) {
            continue;
          }

          // Otherwise, flag it
          const excerpt = context.replace(/\n/g, ' ').slice(0, 400);
          matches.push({ file: f.file, excerpt });
        }
      }
    }
    if (matches.length > 0) {
      const lines = matches.map(m => `${m.file}: ${m.excerpt}`).join('\n');
      throw new Error(`Found wildcard Actions/Resources in IAM/policy files:\n${lines}`);
    }
    expect(matches.length).toBe(0);
  }, 20_000);

  test('KMS key policies should not allow wildcard principals or resources', () => {
    const files = readAllTf();
    const bad: { file: string; excerpt: string }[] = [];
    // Common JSON policy patterns granting principal AWS = "*" or Resource = "*"
    const wildcardPrincipal = /"Principal"\s*:\s*\{[\s\S]*?"AWS"\s*:\s*"\*"/i;
    const wildcardPrincipalSimple = /"Principal"\s*:\s*"\*"/i;
    const wildcardResource = /"Resource"\s*:\s*"\*"/i;

    for (const f of files) {
      if (/aws_kms_key/.test(f.content) || f.file.toLowerCase().includes('kms')) {
        if (wildcardPrincipal.test(f.content) || wildcardPrincipalSimple.test(f.content) || wildcardResource.test(f.content)) {
          const idx = Math.max(0, f.content.search(wildcardPrincipal) || f.content.search(wildcardPrincipalSimple) || f.content.search(wildcardResource) || 0);
          const excerpt = f.content.slice(idx, idx + 300).replace(/\n/g, ' ');
          bad.push({ file: f.file, excerpt });
        }
      }
    }

    if (bad.length > 0) {
      const details = bad.map(b => `${b.file}: ${b.excerpt}`).join('\n');
      throw new Error(`Found wildcard principal/resource in KMS key policy blocks:\n${details}`);
    }
    expect(bad.length).toBe(0);
  });

  test('no overly-broad AWS managed policies are attached (AdministratorAccess, PowerUserAccess, AmazonS3FullAccess, IAMFullAccess)', () => {
    const files = readAllTf();
    const joined = files.map(f => f.content).join('\n');
    const banned = [
      'arn:aws:iam::aws:policy/AdministratorAccess',
      'arn:aws:iam::aws:policy/PowerUserAccess',
      'arn:aws:iam::aws:policy/AmazonS3FullAccess',
      'arn:aws:iam::aws:policy/IAMFullAccess'
    ];
    const matches = banned.filter(b => new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(joined));
    // Also catch attachments by short name e.g., "AdministratorAccess"
    const shortNames = banned.map(b => b.split('/').pop()).filter(Boolean) as string[];
    const shortMatches = shortNames.filter(name => {
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${esc}\\b`, 'i').test(joined);
    });
    const shortMatchesFiltered = shortMatches as string[];
    if (matches.length > 0 || shortMatchesFiltered.length > 0) {
      throw new Error(`Found attachments of overly-broad managed policies: ${matches.concat(shortMatchesFiltered).join(', ')}`);
    }
    expect(matches.length + shortMatchesFiltered.length).toBe(0);
  });

  test('S3 buckets and CloudTrail reference the KMS CMK (aws_kms_key)', () => {
    const files = readAllTf();
    const joined = files.map(f => f.content).join('\n');
    // Ensure s3 server-side encryption refers to aws_kms_key or kms_master_key_id points to a kms resource
    const s3RefsKms = /kms_master_key_id\s*=\s*aws_kms_key\.[a-zA-Z0-9_]+\.arn/.test(joined) || /s3_bucket_server_side_encryption_configuration[\s\S]*kms_master_key_id/.test(joined);
    // Ensure cloudtrail uses kms_key_id = aws_kms_key.<name>.arn
    const ctRefsKms = /resource\s+"aws_cloudtrail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.[a-zA-Z0-9_]+\.arn/.test(joined) || /kms_key_id\s*=\s*aws_kms_key\.[a-zA-Z0-9_]+\.arn/.test(joined);
    if (!s3RefsKms || !ctRefsKms) {
      const details = [];
      if (!s3RefsKms) details.push('S3 buckets do not reference aws_kms_key via kms_master_key_id');
      if (!ctRefsKms) details.push('CloudTrail does not reference aws_kms_key via kms_key_id');
      throw new Error(details.join('; '));
    }
    expect(s3RefsKms).toBe(true);
    expect(ctRefsKms).toBe(true);
  });
});
