# CI/CD Pipeline Review Criteria

This document defines the review criteria and scoring system specifically for the "CI/CD Pipeline" subject label.

## Context

When reviewing CI/CD Pipeline implementations (subject_label: "CI/CD Pipeline"):
- The task involves optimizing/creating GitHub Actions workflows
- `lib/ci-cd.yml` contains the pipeline configuration being reviewed
- `lib/PROMPT.md` contains the requirements
- `lib/IDEAL_RESPONSE.md` describes the expected implementation

## Review Criteria (Quality Assessment)

### 1. Security Best Practices (Critical - 3 points)

#### 1.1 Secrets Management (2 points)
- **NO hardcoded secrets** in workflow files
  - ✅ Pass: All secrets use `${{ secrets.SECRET_NAME }}`
  - ❌ Fail: Any hardcoded API keys, tokens, passwords, or credentials

- **NO hardcoded sensitive values**
  - ✅ Pass: AWS account IDs, regions use `${{ vars.VAR_NAME }}` or `${{ secrets.SECRET_NAME }}`
  - ❌ Fail: Hardcoded account IDs, regions, bucket names with sensitive info

- **Environment variables properly defined**
  - ✅ Pass: Common values defined in `env:` block at workflow or job level
  - ❌ Fail: Repeated hardcoded values across multiple steps

**Scoring**:
- 2 points: No hardcoded secrets, all sensitive data properly referenced
- 1 point: Minor issues (1-2 hardcoded non-critical values)
- 0 points: Hardcoded secrets or credentials found (CRITICAL FAIL)

#### 1.2 IAM and Authentication (1 point)
- **Proper AWS authentication**
  - ✅ Pass: Uses OIDC (aws-actions/configure-aws-credentials with role-to-assume) OR GitHub Secrets
  - ❌ Fail: Hardcoded credentials, long-lived keys without secrets manager

- **Cross-account role assumptions**
  - ✅ Pass: Uses proper role assumption with role ARNs when required
  - ❌ Fail: Missing cross-account deployment patterns when required

**Scoring**:
- 1 point: Proper authentication methods (OIDC or secrets-based)
- 0.5 point: Uses secrets but not following all best practices
- 0 points: Insecure authentication or missing

### 2. Pipeline Architecture (3 points)

#### 2.1 Multi-Stage Deployment (2 points)
- **Proper stage progression**
  - ✅ Pass: Dev → Staging → Production flow with dependencies
  - ❌ Fail: Missing stages or improper sequencing

- **Manual approval gates**
  - ✅ Pass: GitHub environments with protection rules for staging/prod
  - ❌ Fail: No approval gates or missing for critical environments

**Scoring**:
- 2 points: Complete multi-stage with proper approvals
- 1 point: Multi-stage but missing some approval gates
- 0.5 points: Basic staging without proper gates
- 0 points: No proper staging

#### 2.2 Job Dependencies & Artifacts (1 point)
- **Correct needs: relationships**
  - ✅ Pass: Jobs have proper dependencies, no race conditions
  - ❌ Fail: Missing dependencies, potential parallel execution issues

- **Artifact management**
  - ✅ Pass: Build artifacts uploaded and downloaded between jobs
  - ❌ Fail: Missing artifact management, rebuilding unnecessarily

**Scoring**:
- 1 point: Perfect job dependencies and artifact management
- 0.5 points: Minor issues in job sequencing or artifacts
- 0 points: Broken or missing dependencies

### 3. Configuration Management (2 points)

#### 3.1 Environment Variables & Parameterization (2 points)
- **Environment variables**
  - ✅ Pass: Reusable env vars at workflow/job level
  - ❌ Fail: Repeated values, inconsistent configuration

- **Parameterization**
  - ✅ Pass: Uses workflow_dispatch inputs, variables
  - ❌ Fail: Everything hardcoded, no flexibility

**Scoring**:
- 2 points: Excellent use of env vars and parameters
- 1 point: Good but some repetition
- 0.5 points: Minimal configuration management
- 0 points: Everything hardcoded

### 4. Requirements Compliance (2 points)

#### 4.1 Compliance with lib/ci-cd.yml Patterns (1.5 points)
- **Matches specification**
  - ✅ Pass: Implementation follows the patterns and requirements in lib/ci-cd.yml
  - ❌ Fail: Deviates significantly from specification

**Validation**:
```bash
# Compare key aspects:
# - Source integration method (OIDC, webhooks)
# - Build commands and tools
# - Deploy strategy (change sets, approval gates)
# - Security scanning (cdk-nag, checkov, etc.)
```

**Scoring**:
- 1.5 points: Fully compliant with lib/ci-cd.yml patterns
- 1 point: Mostly compliant, minor deviations
- 0.5 points: Some compliance issues
- 0 points: Does not follow specification

#### 4.2 PROMPT Requirements Met (0.5 points)
- **Requirements coverage**
  - ✅ Pass: All requirements from lib/PROMPT.md implemented
  - ❌ Fail: Missing required features

**Scoring**:
- 0.5 points: All requirements met
- 0.25 points: Most requirements met
- 0 points: Major requirements missing

## Scoring System

**Total Points: 10**

### Direct 10-point scale - sum all category scores

### Quality Thresholds:
- **9-10**: Excellent - Production-ready with best practices
- **8**: Good - Meets all critical requirements, ready for PR
- **6-7**: Fair - Missing some best practices, needs improvement
- **4-5**: Poor - Significant issues, major rework needed
- **0-3**: Critical failures - Hardcoded secrets or security issues

### Minimum Passing Score: 8/10

**If score < 8, the review MUST fail with specific improvements needed.**

### Score Breakdown:
- Security Best Practices: 3 points
- Pipeline Architecture: 3 points
- Configuration Management: 2 points
- Requirements Compliance: 2 points
**Total: 10 points**

## Review Process

### Step 1: Security Validation (CRITICAL)
```bash
# Scan for hardcoded secrets
grep -rE '(aws_access_key_id|aws_secret_access_key|api[_-]?key|password|token)\s*[:=]\s*["\047][A-Za-z0-9+/=]{20,}' lib/ci-cd.yml

# Check for secrets usage
grep -E '\$\{\{\s*secrets\.' lib/ci-cd.yml

# Check for env variables
grep -E '^env:' lib/ci-cd.yml
```

**If hardcoded secrets found: Automatic FAIL (score = 0)**

### Step 2: Architecture Review
- Validate multi-stage deployment flow
- Check job dependencies and conditions
- Verify approval gates exist

### Step 3: Best Practices Assessment
- Review configuration management
- Assess error handling
- Check notification strategy

### Step 4: Requirements Compliance
- Compare with lib/ci-cd.yml patterns
- Verify all PROMPT requirements met
- Check lib/IDEAL_RESPONSE.md alignment

### Step 5: Calculate Score
- Sum points from all categories (already on 10-point scale)
- Apply threshold check (≥8 required)

## Output Format

```markdown
## CI/CD Pipeline Review Summary

### 1. Security Best Practices: [Score]/3
- **Secrets Management**: [Score]/2
  - [✅/❌] No hardcoded secrets
  - [✅/❌] Proper secrets/vars usage
  - [✅/❌] Environment variables defined

- **IAM & Authentication**: [Score]/1
  - [✅/❌] Proper AWS authentication
  - [✅/❌] Cross-account roles when required

### 2. Pipeline Architecture: [Score]/3
- **Multi-Stage Deployment**: [Score]/2
  - [✅/❌] Proper stage progression (Dev → Staging → Prod)
  - [✅/❌] Manual approval gates

- **Job Dependencies & Artifacts**: [Score]/1
  - [✅/❌] Correct needs: relationships
  - [✅/❌] Proper artifact management

### 3. Configuration Management: [Score]/2
- **Environment Variables & Parameterization**: [Score]/2
  - [✅/❌] Reusable env vars
  - [✅/❌] Proper parameterization (workflow_dispatch inputs)

### 4. Requirements Compliance: [Score]/2
- **lib/ci-cd.yml Patterns**: [Score]/1.5
  - [✅/❌] Follows specification and best practices
  - [✅/❌] Implements required patterns

- **PROMPT Requirements**: [Score]/0.5
  - [✅/❌] All requirements from lib/PROMPT.md implemented

---

### Final Score Calculation
- **Security Best Practices**: [X]/3
- **Pipeline Architecture**: [Y]/3
- **Configuration Management**: [Z]/2
- **Requirements Compliance**: [W]/2
- **Total Score**: [Total]/10
- **Threshold**: 8/10 required
- **Status**: [✅ PASS / ❌ FAIL]

### Training Quality: [Score]/10

{If < 8:}
### Required Improvements
1. [Specific improvement needed with category]
2. [Specific improvement needed with category]
3. [Specific improvement needed with category]

{End if}

SCORE:[Total]
```

## Special Considerations

### For CI/CD Pipeline tasks:
1. **No infrastructure deployment required** - Skip infrastructure-specific validations
2. **No unit test coverage required** - CI/CD config files don't need unit tests
3. **Focus on workflow security and patterns** - Primary concern is secure, reliable pipeline
4. **Integration tests validate pipeline execution** - Tests should exercise actual pipeline runs

### Common Issues to Flag:
- Hardcoded AWS account IDs → Should use `${{ vars.ACCOUNT_ID }}` or `${{ secrets.ACCOUNT_ID }}`
- Hardcoded regions → Should use `${{ vars.AWS_REGION }}` or env vars
- Repeated values → Should use env: blocks
- Missing approval gates for production
- No security scanning integrated
- Artifacts not encrypted or properly managed
- Over-permissive GitHub Actions permissions

### Automatic Failures (Score = 0-3):
- Any hardcoded secrets or credentials
- No authentication mechanism
- Missing critical security features
- Does not follow lib/ci-cd.yml requirements at all
