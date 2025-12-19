# CI/CD Pipeline Review Criteria

This document defines the review criteria and scoring system specifically for the "CI/CD Pipeline" subject label.

## Context

When reviewing CI/CD Pipeline implementations (subject_label: "CI/CD Pipeline"):
- `lib/ci-cd.yml` contains the pipeline configuration being reviewed
- `lib/PROMPT.md` contains the requirements
- `lib/IDEAL_RESPONSE.md` describes the expected implementation
- **Multi-Platform Support**: Pipelines can be for GitHub Actions, GitLab CI, CircleCI, Google Cloud Build, ArgoCD, Azure DevOps, or Jenkins
- Automated validation runs via `scripts/validate-cicd-platform.sh` before this review

## Review Criteria (Quality Assessment)

### 1. Documentation Quality (4 points - CRITICAL)

**All 4 documentation files MUST be present, correct, and well-formatted. Missing or incorrect files = lose all 4 points.**

#### 1.1 PROMPT.md (1 point)
**Requirements:**
- ✅ File exists and is NOT empty
- ✅ **HUMAN-WRITTEN** (not AI-generated)
- ✅ No emojis, no tables, no LLM-flavored text
- ✅ Natural, human tone describing the task requirements

**AI-Generated Signs (AUTO-FAIL if detected):**
- ❌ Emojis or special symbols (🎯, ✨, etc.)
- ❌ Perfect table formatting
- ❌ Phrases like "Here is a comprehensive prompt..." or "Let's build..."
- ❌ Overly formal/template-like structure

**Scoring:**
- ✅ 1 point: Human-written, clear requirements
- ❌ 0 points: Empty, AI-generated, or missing

#### 1.2 MODEL_RESPONSE.md (1 point)
**Requirements:**
- ✅ File exists and is NOT empty
- ✅ Contains the **raw model output** (what the model initially generated)
- ✅ May contain errors/issues (that's expected - this is BEFORE fixes)
- ✅ Should match what was actually generated, not idealized version

**Scoring:**
- ✅ 1 point: Present with actual model output
- ❌ 0 points: Empty, missing, or fabricated content

#### 1.3 IDEAL_RESPONSE.md (1 point)
**Requirements:**
- ✅ File exists and is NOT empty
- ✅ Contains the **final corrected code** from `lib/ci-cd.yml`
- ✅ Must use proper code blocks: \`\`\`yml (not \`\`\`yaml or plain text)
- ✅ All code must be in code blocks (no loose code outside blocks)
- ✅ Should represent the polished, working implementation

**Example format:**
````markdown
# Final CI/CD Pipeline Implementation

```yml
name: Production Pipeline
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: ./scripts/build.sh
```
````

**Scoring:**
- ✅ 1 point: Properly formatted with \`\`\`yml code blocks, contains final code
- ❌ 0 points: Empty, wrong format, missing code blocks, or code outside blocks

#### 1.4 MODEL_FAILURES.md (1 point)
**Requirements:**
- ✅ File exists and is NOT empty
- ✅ **Compares** MODEL_RESPONSE.md vs IDEAL_RESPONSE.md
- ✅ Documents what was **wrong** in model output
- ✅ Documents what was **corrected** in final version
- ✅ Past tense (these are fixes that WERE made, not current issues)

**Example content:**
```markdown
# Model Failures and Corrections

## Issue 1: Hardcoded AWS Account ID
- **Problem**: Model generated hardcoded account ID in MODEL_RESPONSE
- **Fixed**: Changed to use ${{ secrets.AWS_ACCOUNT_ID }}
- **Location**: Line 15 in deploy job

## Issue 2: Inline Script >5 Lines
- **Problem**: Model put 8-line script inline in run: block
- **Fixed**: Moved to ./scripts/deploy.sh
- **Location**: Deploy stage
```

**Scoring:**
- ✅ 1 point: Properly documents what was wrong and what was fixed
- ❌ 0 points: Empty, missing, or doesn't compare the two files

---

**CRITICAL**: If ANY of the 4 documentation files fail validation, **deduct all 4 points** (not partial).

---

### 2. Security Best Practices (Critical - 2 points)

#### 1.1 Hardcoded Secrets Detection (2 points - AUTO-FAIL)
**CRITICAL**: Any hardcoded secrets = **AUTOMATIC SCORE OF 0 for entire review**

Check for:
- AWS Access Keys: `AKIA[0-9A-Z]{16}`
- Hardcoded passwords: `password: "mypassword123"`
- API keys in plain text: `api_key: "sk_live_..."`
- Database credentials in connection strings
- Private SSH/TLS keys
- Tokens, bearer tokens, OAuth secrets

**Scoring**:
- ✅ 2 points: No hardcoded secrets detected
- ❌ 0 points: ANY hardcoded secret found (ENTIRE TASK FAILS)

#### 1.2 Secrets Management Syntax (1 point)
**Platform-specific secret syntax must be correct:**

**GitHub Actions:**
```yaml
env:
  AWS_KEY: ${{ secrets.AWS_ACCESS_KEY_ID }}
  DATABASE_URL: ${{ vars.DATABASE_URL }}
```

**GitLab CI:**
```yaml
variables:
  DATABASE_URL: $DATABASE_URL
script:
  - echo $CI_REGISTRY_PASSWORD | docker login
```

**CircleCI:**
```yaml
environment:
  API_KEY: ${API_KEY}
```

**Google Cloud Build:**
```yaml
secretEnv: ['DB_PASSWORD']
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/db-password/versions/latest
```

**Scoring**:
- ✅ 1 point: Correct platform-specific syntax throughout
- ⚠️ 0.5 points: Mixed/incorrect syntax
- ❌ 0 points: No secret management or wrong platform syntax

#### 1.3 Container Security (1 point)

**If container images are used:**
- Private registry REQUIRED (ECR, GCR, ACR, GitLab Registry, GHCR)
- ❌ Public DockerHub = FAIL

**If containers are built:**
- Vulnerability scanning REQUIRED (Trivy, Grype, Snyk, Anchore)

**Scoring**:
- ✅ 1 point: Private registry + scanning (if building containers)
- ⚠️ 0.5 points: Private registry but missing scanning when building
- ❌ 0 points: Public DockerHub OR building without scanning

### 3. Script Organization (1 point - ENFORCED)

#### 3.1 Script Length Rule (1 point)
**RULE**: Inline scripts MUST be ≤5 lines. Longer scripts MUST be in `scripts/` directory.

❌ **FAILS** (6+ lines inline):
```yaml
run: |
  npm install
  npm run build
  npm run test
  docker build -t app .
  docker push app
  npm run deploy
```

✅ **PASSES** (external script):
```yaml
run: ./scripts/deploy.sh
```

**Scoring**:
- ✅ 1 point: All scripts ≤5 lines OR in scripts/ directory
- ❌ 0 points: Any violations (3+ violations)

---

### 4. Pipeline Architecture (2 points)

#### 4.1 Environment Declaration (1 point)
Pipelines should use environment protection for deployments.

**GitHub Actions:**
```yaml
jobs:
  deploy-prod:
    environment: production
```

**GitLab CI:**
```yaml
deploy-production:
  environment:
    name: production
```

**Scoring**:
- ✅ 1 point: Environments declared for deployments
- ⚠️ 0.5 points: Partial environment usage
- ❌ 0 points: No environments

#### 4.2 Multi-Stage OR Job Dependencies (1 point)
Look for proper orchestration.

**Multi-stage pattern**: Dev → Staging → Prod
**OR Job dependencies**: Proper `needs:`, `depends_on:`, artifact passing

**Scoring**:
- ✅ 1 point: Multi-stage (3+ envs) OR proper dependencies + artifacts
- ⚠️ 0.5 points: 2 stages OR partial dependencies
- ❌ 0 points: Neither

### 5. Platform Compliance (1 point)

#### 5.1 Platform Detection & Syntax (1 point)
Must use correct syntax for the detected platform.

**Platform markers:**
- GitHub Actions: `name:`, `on:`, `jobs:`, `runs-on:`
- GitLab CI: `image:`, `stages:`, `script:`
- CircleCI: `version: 2.1`, `workflows:`
- Google Cloud Build: `steps:` with `gcr.io`
- ArgoCD: `apiVersion: argoproj.io`
- Azure DevOps: `vmImage:`, `pool:`
- Jenkins: `pipeline {`, `agent`

**Scoring**:
- ✅ 1 point: Correct platform syntax throughout
- ⚠️ 0.5 points: Minor syntax issues
- ❌ 0 points: Wrong platform or major errors


---

## Bonus Points (Optional - Max total score still 10)

### Infrastructure & Advanced Features (+0.5 each, max +1 total)
These are OPTIONAL but reward excellence:

- ✅ Infrastructure cost estimation (Infracost, Pulumi preview): **+0.5**
- ✅ OIDC authentication (no long-lived keys): **+0.5**
- ✅ Infrastructure security scanning (cdk-nag, checkov, tfsec): **+0.5**
- ✅ Performance optimization (caching, parallelization): **+0.5**
- ✅ Comprehensive testing/notifications: **+0.5**

**Note**: Total score cannot exceed 10 points.

---

## Unvalidated Features - IMPORTANT

### What if trainers implement features NOT in the validation checklist?

**Answer: Additional features are ALLOWED and ENCOURAGED if they don't violate core rules.**

#### ✅ ALLOWED Unvalidated Features (Should NOT penalize):
- Kubernetes RBAC configurations
- Service mesh (Istio, Linkerd)
- GitOps patterns (Flux, ArgoCD configs)
- Monitoring/observability (Prometheus, Grafana)
- Database migrations
- Blue-green/canary deployments
- Feature flags, custom tools
- Advanced caching strategies
- Compliance scanning (HIPAA, PCI-DSS, SOC2)
- Cost optimization tools
- Chaos engineering, load testing
- Documentation generation, backup automation

**Review Approach:**
1. **Don't penalize** extra features not in checklist
2. **Do reward** if well-implemented (bonus points)
3. **Still enforce** core rules (no hardcoded secrets, script length, etc.)

#### Example Scenarios:

**Scenario 1: K8s RBAC + Network Policies**
```yaml
- name: Apply RBAC
  run: kubectl apply -f k8s/rbac/
- name: Apply Network Policies
  run: kubectl apply -f k8s/network-policies/
```

**Review Decision:**
- ✅ NOT in validation checklist, but shows advanced knowledge
- ✅ No hardcoded secrets, uses external scripts (follows rules)
- ✅ Award **full base points** + consider **bonus**

**Scenario 2: Custom Compliance Tool**
```yaml
- name: HIPAA Compliance Check
  run: ./scripts/hipaa-scan.sh
```

**Review Decision:**
- ✅ Follows script organization rule
- ✅ Shows real-world understanding
- ✅ Award points + potential bonus

#### ❌ Still FAILS Even With Advanced Features:

```yaml
# Advanced K8s setup but hardcoded secret
apiVersion: v1
kind: Secret
data:
  password: bXlwYXNzd29yZDEyMw==  # ❌ FAILS - hardcoded
```

```yaml
# Great setup but 10-line inline script
- name: Deploy Everything
  run: |
    line 1
    line 2
    ...
    line 10  # ❌ FAILS - >5 lines inline
```

**Bottom line**: Validate ONLY the core requirements. Don't penalize innovation.

## Scoring System

**Total Points: 10** (Minimum passing: **8/10**)

### Score Breakdown (Updated):

1. **Documentation Quality** (4 points) - LOSE ALL 4 IF ANY FILE FAILS
   - PROMPT.md (human-written, not AI): 1 pt
   - MODEL_RESPONSE.md (raw model output): 1 pt
   - IDEAL_RESPONSE.md (final code with \`\`\`yml blocks): 1 pt
   - MODEL_FAILURES.md (what was wrong/fixed): 1 pt

2. **Security** (2 points)
   - Hardcoded Secrets: 1 pt (AUTO-FAIL if any found → score = 0)
   - Container Security: 1 pt

3. **Script Organization** (1 point)
   - Script Length Rule: 1 pt

4. **Architecture** (2 points)
   - Environment Declaration: 1 pt
   - Multi-stage OR Dependencies: 1 pt

5. **Platform Compliance** (1 point)
   - Platform Syntax: 1 pt

**Base Total: 10 points**

### Bonus (Optional, max +1):
- Cost estimation, OIDC, security scanning, etc.

### Quality Thresholds:
- **9-10**: Excellent - Production-ready
- **8**: Good - Meets all requirements, PASSES ✅
- **6-7**: Fair - Needs improvement
- **4-5**: Poor - Major rework needed
- **0-3**: Critical failures - FAILS ❌

### Critical Auto-Fail Conditions:
- ANY hardcoded secrets → **Score = 0**
- Any documentation file missing/wrong → **Lose all 4 documentation points**
- Build container without scanning → Likely fail
- Public DockerHub for deployment → Likely fail

### Documentation Validation Examples:

#### ✅ GOOD PROMPT.md:
```markdown
Create a multi-stage CI/CD pipeline that deploys to dev, staging, and production.
The pipeline should use OIDC for AWS authentication and include manual approval
gates before production deployment. Add security scanning with cdk-nag and ensure
artifacts are encrypted with KMS.
```

#### ❌ BAD PROMPT.md (AI-Generated):
```markdown
# 🎯 Comprehensive CI/CD Pipeline Implementation

Let's build an enterprise-grade pipeline! ✨

| Feature | Requirement |
|---------|-------------|
| Auth | OIDC |
| Stages | 3 |

Here is a **comprehensive and high-level prompt** for your infrastructure...
```

#### ✅ GOOD IDEAL_RESPONSE.md:
````markdown
# Final Pipeline Implementation

```yml
name: Production Pipeline
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: ./scripts/build.sh
```
````

#### ❌ BAD IDEAL_RESPONSE.md:
```markdown
# Final Implementation

name: Production Pipeline  ← No code block!
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
```

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
