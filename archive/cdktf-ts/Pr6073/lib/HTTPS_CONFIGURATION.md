# HTTPS Configuration Guide

This stack supports multiple HTTPS configuration modes for different deployment scenarios.

## Configuration Options

### Option 1: HTTP Only (Testing/Development)
**Use this for quick testing without a domain or certificate.**

```typescript
const stack = new TapStack(app, 'TapStack', {
  environmentSuffix: 'dev',
  enableHttps: false, // Disable HTTPS
});
```

**Features:**
- ✅ Works immediately without any domain
- ✅ No certificate validation delays
- ✅ Access via ALB DNS name on HTTP (port 80)
- ❌ Not production-ready (no encryption)

---

### Option 2: HTTPS with Existing Certificate
**Use this when you already have a validated ACM certificate.**

```typescript
const stack = new TapStack(app, 'TapStack', {
  environmentSuffix: 'prod',
  enableHttps: true,
  existingCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/xxxxx',
  customDomain: 'myapp.yourdomain.com', // Optional - for Route53 A record
});
```

**Features:**
- ✅ Production-ready with HTTPS
- ✅ No certificate validation delays
- ✅ Uses your pre-validated certificate
- ✅ Optionally creates Route53 A record

**Steps to get existing certificate ARN:**
```bash
# List your ACM certificates
aws acm list-certificates --region us-east-1

# Get details of a specific certificate
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx
```

---

### Option 3: HTTPS with New Certificate and Custom Domain
**Use this for full production deployment with your own domain.**

```typescript
const stack = new TapStack(app, 'TapStack', {
  environmentSuffix: 'prod',
  enableHttps: true,
  customDomain: 'api.yourdomain.com', // Your actual domain
});
```

**Features:**
- ✅ Production-ready with HTTPS
- ✅ Creates new ACM certificate
- ✅ Automatic DNS validation via Route53
- ✅ Creates Route53 hosted zone
- ✅ Creates A record pointing to ALB

**Requirements:**
- You must own the domain (e.g., `yourdomain.com`)
- After deployment, update your domain's nameservers to point to the Route53 hosted zone nameservers (shown in outputs)

**Post-deployment steps:**
1. Deploy the stack
2. Get the nameservers from outputs: `terraform output hosted-zone-nameservers`
3. Update your domain registrar to use these nameservers
4. Wait for DNS propagation (usually 24-48 hours)

---

## Current Branch Configuration

For the current branch (testing), use **Option 1** or **Option 2**:

### Quick Fix for Current Branch

Edit `bin/tap.ts` or `main.ts` to disable HTTPS temporarily:

```typescript
const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  stateBucket: 'iac-rlhf-tf-states',
  stateBucketRegion: 'us-east-1',
  awsRegion: 'us-east-1',
  enableHttps: false, // ADD THIS LINE
  defaultTags: {
    tags: {
      Environment: environmentSuffix,
      Repository: process.env.GITHUB_REPOSITORY || 'unknown',
      CommitAuthor: process.env.GITHUB_ACTOR || 'unknown',
    },
  },
});
```

---

## Using with Existing Certificate

If you want HTTPS but don't want to wait for certificate validation, you can:

### 1. Create Certificate via AWS Console or CLI
```bash
# Request a certificate
aws acm request-certificate \
  --domain-name payment-app-test.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# This returns a certificate ARN - save it!
# Complete DNS validation in the AWS Console or via CLI
```

### 2. Use the Certificate ARN in your stack
```typescript
const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  enableHttps: true,
  existingCertificateArn: 'arn:aws:acm:us-east-1:xxx:certificate/xxx', // Your validated cert
});
```

---

## Troubleshooting

### Error: "example.com is reserved by AWS"
**Solution:** Don't use `example.com`, `example.net`, or `example.org`. Use your actual domain or disable HTTPS for testing.

### Certificate validation timeout
**Solution:** Either:
1. Disable HTTPS: `enableHttps: false`
2. Use existing certificate: `existingCertificateArn: 'arn:...'`
3. Use a real domain you own with proper DNS delegation

### How to check certificate status
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --region us-east-1
```

---

## Production Best Practices

1. **Always use HTTPS in production** (`enableHttps: true`)
2. **Use your own domain** (`customDomain: 'api.yourdomain.com'`)
3. **Enable deletion protection** on production ALBs
4. **Use WAF** for additional security
5. **Monitor certificate expiration** (ACM auto-renews if DNS validation is set up)

---

## Testing Best Practices

1. **Disable HTTPS for quick tests** (`enableHttps: false`)
2. **Use existing certificates** when available
3. **Use test/dev subdomains** separate from production
