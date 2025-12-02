# MODEL_FAILURES.md

## Common Failures and Anti-Patterns in CI/CD Pipeline Implementation

### 1. Authentication and Security Vulnerabilities

#### Using Long-Lived AWS Credentials
**Failure**: Storing AWS access keys in GitHub Secrets
```yaml
# WRONG
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
**Impact**: Long-lived credentials pose security risks if leaked
**Fix**: Use OIDC authentication with role-to-assume

#### Missing Role Session Names
**Failure**: Not specifying role-session-name for audit trail
```yaml
# WRONG
with:
  role-to-assume: ${{ secrets.ROLE_ARN }}
  aws-region: us-east-1
  # Missing role-session-name
```
**Impact**: Cannot trace which pipeline execution assumed the role
**Fix**: Always include role-session-name for each stage

#### Unencrypted Artifacts
**Failure**: Uploading build artifacts without encryption
```yaml
# WRONG
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-outputs
    path: ./dist  # Unencrypted!
```
**Impact**: Sensitive build outputs exposed in artifact storage
**Fix**: Encrypt artifacts with KMS before uploading

### 2. YAML Syntax Errors

#### Unquoted "on" Keyword
**Failure**: Using unquoted on: which is a YAML reserved word
```yaml
# WRONG - "on" is parsed as boolean true
on:
  push:
    branches:
      - main
```
**Impact**: Yamllint errors, potential parsing issues
**Fix**: Quote the keyword as "on":

#### Missing Document Start Marker
**Failure**: Omitting the --- document start
```yaml
# WRONG
name: My Pipeline
on:
  push:
```
**Impact**: Yamllint warning, inconsistent with YAML best practices
**Fix**: Add --- at the beginning after any comments

#### Line Length Violations
**Failure**: Lines exceeding 80 characters
```yaml
# WRONG - line too long
- name: This is a very long step name that exceeds the recommended line length limit
```
**Impact**: Yamllint errors, reduced readability
**Fix**: Keep lines under 80 characters, break long commands

### 3. Deployment Configuration Issues

#### Missing Environment Protection
**Failure**: Deploying to production without approval gates
```yaml
# WRONG
deploy-prod:
  needs: deploy-staging
  # Missing environment: prod-approval
  steps:
    - name: Deploy
```
**Impact**: Accidental production deployments without review
**Fix**: Use GitHub Environments with required reviewers

#### No Retry Mechanism
**Failure**: Single deployment attempt without retries
```yaml
# WRONG
- name: Deploy
  run: npx cdk deploy --all
```
**Impact**: Transient failures cause pipeline failures
**Fix**: Implement retry logic with configurable attempts and delays

#### Missing Rollback Strategy
**Failure**: No automatic rollback on production failures
```yaml
# WRONG - no rollback step
- name: Deploy to Production
  run: npx cdk deploy --all
  # No rollback on failure!
```
**Impact**: Failed deployments leave production in broken state
**Fix**: Capture stack versions and implement rollback on failure

### 4. Cross-Account Deployment Errors

#### Missing Role Chaining
**Failure**: Not enabling role-chaining for cross-account access
```yaml
# WRONG
- name: Assume cross-account role
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ env.ROLE }}
    aws-region: ${{ env.AWS_REGION }}
    # Missing role-chaining: true
```
**Impact**: Cross-account role assumption fails
**Fix**: Add role-chaining: true for cross-account scenarios

#### Hardcoded Account IDs
**Failure**: Embedding account IDs directly in workflow
```yaml
# WRONG
env:
  PROD_ACCOUNT_ID: "123456789012"  # Hardcoded!
```
**Impact**: Security risk, difficult to maintain across environments
**Fix**: Store account IDs in GitHub Secrets

### 5. Build Stage Issues

#### Skipping Security Scanning
**Failure**: Not running cdk-nag or security checks
```yaml
# WRONG
- name: Build
  run: |
    npm ci
    npx cdk synth
    # No security scanning!
```
**Impact**: Security vulnerabilities deployed to production
**Fix**: Integrate cdk-nag with continue-on-error: false

#### Using Outdated Node.js Version
**Failure**: Using old Node.js LTS version
```yaml
# WRONG
- uses: actions/setup-node@v4
  with:
    node-version: '16'  # Outdated
```
**Impact**: Missing language features, security vulnerabilities
**Fix**: Use current LTS version (e.g., '22')

#### Not Using npm ci
**Failure**: Using npm install instead of npm ci
```yaml
# WRONG
- name: Install dependencies
  run: npm install
```
**Impact**: Non-reproducible builds, inconsistent dependencies
**Fix**: Always use npm ci for CI/CD environments

### 6. Artifact Management Issues

#### Missing KMS Decryption
**Failure**: Downloading encrypted artifacts without decryption
```yaml
# WRONG
- name: Download artifacts
  uses: actions/download-artifact@v4
  with:
    name: cdk-outputs
# Missing decryption step!
```
**Impact**: Deployment fails with encrypted file errors
**Fix**: Add KMS decrypt step after download

#### Not Cleaning Up Sensitive Files
**Failure**: Leaving decrypted artifacts on runner
```yaml
# WRONG - no cleanup
- name: Decrypt artifacts
  run: |
    aws kms decrypt ...
    tar -xzf cdk-outputs.tar.gz -C cdk.out
    # No rm of sensitive files!
```
**Impact**: Potential exposure of sensitive data
**Fix**: Remove encrypted and decrypted files after extraction

### 7. Notification and Monitoring Gaps

#### Missing Failure Notifications
**Failure**: Not notifying team on deployment failures
```yaml
# WRONG - no notifications
deploy-prod:
  steps:
    - name: Deploy
      run: npx cdk deploy --all
    # No notification step!
```
**Impact**: Team unaware of production issues
**Fix**: Add Slack/webhook notifications with if: always()

#### Generic Notification Messages
**Failure**: Notifications without context
```yaml
# WRONG
run: |
  curl -X POST "$WEBHOOK" \
    -d '{"text":"Deployment complete"}'
```
**Impact**: No visibility into what was deployed
**Fix**: Include branch, status, and environment in message

### 8. Change Set Validation Issues

#### Not Verifying Change Sets
**Failure**: Deploying without validating changes
```yaml
# WRONG
- name: Deploy
  run: npx cdk deploy --all --require-approval never
  # No verification of what changed!
```
**Impact**: Unexpected changes deployed without review
**Fix**: Add change set verification step after deployment

#### Dynamic Stack Discovery Missing
**Failure**: Hardcoding stack names
```yaml
# WRONG
- name: Check stack
  run: |
    aws cloudformation describe-stacks \
      --stack-name "MyFixedStackName"
```
**Impact**: Breaks when stack names change
**Fix**: Use dynamic stack discovery with list-stacks query

### 9. Error Handling Issues

#### Missing set -euo pipefail
**Failure**: Shell scripts without strict error handling
```yaml
# WRONG
run: |
  aws kms decrypt ...
  tar -xzf file.tar.gz
  # Errors silently ignored!
```
**Impact**: Pipeline continues despite failures
**Fix**: Start all bash scripts with set -euo pipefail

#### No Exit Code Handling
**Failure**: Not checking command exit codes
```yaml
# WRONG
- name: Deploy
  run: |
    npx cdk deploy --all
    echo "Done"  # Runs even if deploy fails
```
**Impact**: False positive success status
**Fix**: Use proper conditionals and exit codes

### 10. Pipeline Structure Issues

#### Missing Job Dependencies
**Failure**: Jobs running in parallel when they should be sequential
```yaml
# WRONG
deploy-prod:
  # Missing needs: deploy-staging
  runs-on: ubuntu-latest
```
**Impact**: Production deployment before staging validation
**Fix**: Always specify needs: for dependent jobs

#### No Fetch Depth for Git History
**Failure**: Shallow clone without history
```yaml
# WRONG
- uses: actions/checkout@v4
  # Missing fetch-depth: 0
```
**Impact**: Cannot determine changes, broken version detection
**Fix**: Add fetch-depth: 0 for full history

### Summary of Common Failures

1. **Authentication**: Long-lived credentials, missing OIDC, no role session names
2. **YAML Syntax**: Unquoted "on", missing ---, line length violations
3. **Deployment**: No approval gates, missing retries, no rollback
4. **Cross-Account**: Missing role-chaining, hardcoded account IDs
5. **Build**: No security scanning, outdated Node.js, npm install vs ci
6. **Artifacts**: Unencrypted uploads, missing KMS decrypt, no cleanup
7. **Notifications**: No failure alerts, generic messages
8. **Change Sets**: No verification, hardcoded stack names
9. **Error Handling**: Missing strict mode, no exit code checks
10. **Pipeline Structure**: Missing dependencies, shallow clones

### How This Implementation Avoids These Failures

This implementation:
- Uses OIDC authentication with unique role session names
- Quotes "on:" and includes --- document start
- Keeps lines under 80 characters
- Uses GitHub Environments for approval gates
- Implements retry mechanism with configurable attempts
- Includes automatic rollback on production failures
- Enables role-chaining for cross-account access
- Stores account IDs in GitHub Secrets
- Integrates cdk-nag security scanning
- Uses Node.js 22 and npm ci
- Encrypts artifacts with KMS
- Decrypts and cleans up sensitive files
- Sends status-aware Slack notifications
- Verifies change sets after deployment
- Uses dynamic stack discovery
- Includes set -euo pipefail in all scripts
- Properly chains job dependencies with needs:
- Uses fetch-depth: 0 for full git history

**Training Quality Impact**: Understanding and avoiding these failures differentiates good implementations (training quality 5-6) from excellent ones (training quality 8-10).
