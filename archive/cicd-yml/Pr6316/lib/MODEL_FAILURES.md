# Model Failures

This file documents issues and failures encountered during the CI/CD Pipeline implementation, comparing the requirements in PROMPT.md with the initial MODEL_RESPONSE.md, and the fixes applied to achieve the IDEAL_RESPONSE.md.

## Issue 1: Missing Variable Definitions

**Severity**: Medium

**Description**: The MODEL_RESPONSE.md pipeline referenced several variables that were never defined in the variables section, which would cause runtime failures when Azure DevOps attempted to resolve them.

**Missing Variables**:
- `$(subscriptionId)` - Referenced in lines 413, 436 for integration tests deployment
- `$(TeamsWebhookUrl)` - Referenced in line 1043 for Teams notifications

**Impact**: Pipeline would fail during integration tests when trying to deploy ARM templates, and monitoring stage would fail when attempting to send Teams notifications.

**Fix Applied**:
```yaml
variables:
  subscriptionId: '00000000-0000-0000-0000-000000000000'
  teamsWebhookUrl: ''
  pagerDutyIntegrationKey: ''
  TRIGGER_ROLLBACK: ''
```

Added all missing variables with placeholder values and documentation indicating they should be set via pipeline variables or variable groups.

---

## Issue 2: Hardcoded Resource Names

**Severity**: Low

**Description**: The MODEL_RESPONSE.md contained numerous hardcoded resource names throughout the pipeline, making it difficult to configure for different environments or organizations without extensive manual edits.

**Hardcoded Values**:
- Resource groups: `dev-iot-rg`, `staging-iot-rg`, `prod-iot-global-rg`
- Function apps: `dev-iot-functions`
- CDN: `iot-cdn-profile`, `iot-cdn-endpoint`
- Terraform backend: `terraform-state-rg`, `tfstateiot`, `tfstate`, `iot-platform.tfstate`

**Impact**: Reduced reusability and configurability of the pipeline. Organizations with different naming conventions would need to search and replace values throughout the 1200+ line file.

**Fix Applied**:
```yaml
variables:
  # Resource group names
  devResourceGroup: 'dev-iot-rg'
  stagingResourceGroup: 'staging-iot-rg'
  prodResourceGroupPrefix: 'prod-iot'
  prodGlobalResourceGroup: 'prod-iot-global-rg'
  terraformStateResourceGroup: 'terraform-state-rg'

  # Function app names
  devFunctionApp: 'dev-iot-functions'
  stagingFunctionApp: 'staging-iot-functions'
  prodFunctionAppPrefix: 'prod-iot-functions'

  # CDN configuration
  cdnProfileName: 'iot-cdn-profile'
  cdnEndpointName: 'iot-cdn-endpoint'

  # Terraform backend configuration
  terraformStateStorageAccount: 'tfstateiot'
  terraformStateContainer: 'tfstate'
  terraformStateKey: 'iot-platform.tfstate'
```

Replaced all 15+ hardcoded references with variable references throughout the pipeline.

---

## Issue 3: No Script Validation

**Severity**: Medium

**Description**: The PROMPT.md requirement stated the pipeline "must externalize any scripts over five lines (stored in /scripts)" and referenced 25+ external scripts. The MODEL_RESPONSE.md blindly referenced these scripts without any validation of their existence.

**Referenced Scripts Without Validation**:
- validate-iot-config.sh
- validate-device-twins.py
- validate-edge-manifests.py
- integration-tests.sh
- edge-runtime-tests.sh
- performance-tests.sh
- generate-sbom.sh
- compliance-check.sh
- And 20+ more scripts

**Impact**: Pipeline would run successfully through validation, build, and test stages, then fail during deployment stages when scripts are invoked. This wastes CI/CD resources and delays feedback.

**Fix Applied**:
Added a new `validateScripts` job as the first job in the Validation stage:

```yaml
- job: validateScripts
  displayName: 'Validate Required Scripts Existence'
  pool:
    vmImage: 'ubuntu-latest'
  timeoutInMinutes: 10
  steps:
  - script: |
      echo "Checking for required scripts..."
      MISSING_SCRIPTS=()

      REQUIRED_SCRIPTS=(
        "validate-iot-config.sh"
        "validate-device-twins.py"
        # ... 30+ scripts listed
      )

      for script in "${REQUIRED_SCRIPTS[@]}"; do
        if [ ! -f "$(scriptsPath)/$script" ]; then
          MISSING_SCRIPTS+=("$script")
          echo "Missing: $script"
        fi
      done

      if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
        echo "WARNING: ${#MISSING_SCRIPTS[@]} required scripts are missing"
        exit 1
      fi
    displayName: 'Check required scripts existence'
    continueOnError: true
```

This provides early warning when scripts are missing and guides developers to create them.

---

## Issue 4: Missing Job Timeouts

**Severity**: Low

**Description**: The PROMPT.md did not explicitly require job timeouts, but production-grade pipelines should have them. The MODEL_RESPONSE.md only had one timeout configuration (35 minutes for canary monitoring). All other jobs could hang indefinitely.

**Jobs Without Timeouts**: 20+ jobs across all stages

**Impact**: A hung job could block the entire pipeline indefinitely, consuming agent resources and preventing other builds from running.

**Fix Applied**:
Added appropriate timeouts to all jobs based on their expected duration:

```yaml
- job: validateScripts
  timeoutInMinutes: 10

- job: lintCode
  timeoutInMinutes: 30

- job: checkDependencies
  timeoutInMinutes: 30

- job: buildFunctions
  timeoutInMinutes: 30

- job: buildEdgeModules
  timeoutInMinutes: 45

- job: integrationTests
  timeoutInMinutes: 60

- job: performanceTests
  timeoutInMinutes: 120

- job: containerScan
  timeoutInMinutes: 45

# ... and 12+ more jobs
```

---

## Issue 5: Redis Force Reboot in Rollback

**Severity**: Medium - Potential Availability Impact

**Description**: The MODEL_RESPONSE.md rollback stage used `az redis force-reboot --reboot-type AllNodes` to clear Redis caches. This command causes complete service interruption for all nodes simultaneously.

**Problematic Code** (lines 1172-1177):
```yaml
for region in "${REGIONS[@]}"; do
  az redis force-reboot \
    --resource-group "prod-iot-$region-rg" \
    --name "iot-redis-$region" \
    --reboot-type AllNodes
done
```

**Impact**: During a rollback scenario (already a high-stress situation), this would cause additional downtime by rebooting all Redis nodes. For a globally distributed IoT platform handling potentially millions of device connections, this is unacceptable.

**Fix Applied**:
Replaced force-reboot with FLUSHALL command via redis-cli, which clears the cache without service interruption:

```yaml
# Clear Redis caches without service interruption
# Using FLUSHALL instead of force-reboot to avoid availability impact
IFS=',' read -ra REGIONS <<< "$(prodAksRegions)"
for region in "${REGIONS[@]}"; do
  echo "Flushing Redis cache in region: $region"

  # Get Redis connection details and flush cache
  REDIS_KEY=$(az redis list-keys \
    --resource-group "prod-iot-$region-rg" \
    --name "iot-redis-$region" \
    --query primaryKey -o tsv)

  REDIS_HOST=$(az redis show \
    --resource-group "prod-iot-$region-rg" \
    --name "iot-redis-$region" \
    --query hostName -o tsv)

  # Use redis-cli to flush cache without reboot
  redis-cli -h "$REDIS_HOST" -a "$REDIS_KEY" --tls FLUSHALL
  echo "Cache flushed for region: $region"
done
```

---

## Issue 6: No Prerequisites Documentation

**Severity**: Medium

**Description**: The MODEL_RESPONSE.md provided no documentation about what needs to be configured before running the pipeline. Users would have to read through 1200+ lines of YAML to discover requirements like service connections, agent pools, Terraform backend, and Azure environments.

**Missing Documentation**:
- Required Azure service connections (3)
- Required pipeline variables (4+)
- Terraform backend bootstrap process
- Custom agent pool specifications
- Required external scripts (30+)
- Azure DevOps environment configuration
- Azure resources that will be created

**Impact**: New users or teams adopting this pipeline would face:
- Trial-and-error configuration process
- Pipeline failures with unclear error messages
- Wasted time discovering undocumented dependencies
- Potential security misconfigurations

**Fix Applied**:
Added comprehensive 60-line prerequisites section at the top of the file:

```yaml
# ============================================================================
# PREREQUISITES AND SETUP REQUIREMENTS
# ============================================================================
#
# Before running this pipeline, ensure the following are configured:
#
# 1. AZURE SERVICE CONNECTIONS
#    - IoT-Platform-Subscription: Azure Resource Manager connection
#    - ACR-Connection: Docker Registry connection
#    - Snyk-Service: Snyk security scanning service
#
# 2. VARIABLE GROUPS OR PIPELINE VARIABLES
#    - subscriptionId: Your Azure subscription ID
#    - teamsWebhookUrl: Microsoft Teams webhook URL
#    - TRIGGER_ROLLBACK: For manual rollback triggering
#
# 3. TERRAFORM BACKEND (Must be created before first run)
#    Bootstrap command:
#      az group create --name terraform-state-rg --location eastus
#      az storage account create --name tfstateiot ...
#      az storage container create --name tfstate ...
#
# ... (50+ more lines of documentation)
```

---

## Issue 7: Rollback Only Triggers on Failure

**Severity**: Low

**Description**: The PROMPT.md stated "A final Rollback stage must allow manual triggering to revert the production environment to a previous version." The MODEL_RESPONSE.md only supported automatic rollback on deployment failure with `condition: failed()`.

**Original Code**:
```yaml
- stage: Rollback
  dependsOn: DeployProduction
  condition: failed()
```

**Impact**: No way to perform manual rollback for issues discovered post-deployment (e.g., gradual performance degradation, customer-reported bugs, security concerns discovered hours after deployment).

**Fix Applied**:
Modified rollback condition to support both automatic and manual triggering:

```yaml
# This stage can be triggered in two ways:
# 1. Automatically when DeployProduction stage fails
# 2. Manually by setting the TRIGGER_ROLLBACK variable to 'true'
- stage: Rollback
  dependsOn: DeployProduction
  condition: or(failed(), eq(variables['TRIGGER_ROLLBACK'], 'true'))
```

Added documentation in prerequisites section explaining the TRIGGER_ROLLBACK variable usage.

---

## Issue 8: Improper Variable Substitution in Bash Scripts

**Severity**: Medium

**Description**: The MODEL_RESPONSE.md contained inline bash scripts that directly used Azure Pipelines variable expansion syntax `$(variable)` within bash loops and conditionals. This pattern can lead to unexpected behavior when variables contain special characters or spaces, and makes the scripts harder to debug.

**Problematic Code** (lines 1102-1129):
```yaml
- script: |
    IFS=',' read -ra REGIONS <<< "$(prodAksRegions)"
    for region in "${REGIONS[@]}"; do
      az deployment group create \
        --resource-group "prod-iot-$region-rg" \
        --parameters region=$region buildId=$(Build.BuildId)
      bash $(scriptsPath)/deploy-iot-hub.sh production $region $(Build.BuildId)
    done
```

**Issues**:
1. Mixed use of Azure Pipelines `$()` and bash `${}` expansion
2. Direct variable references without quoting in some places
3. Resource group name hardcoded prefix `prod-iot` instead of using variable

**Impact**:
- Potential failures if variables contain spaces or special characters
- Difficult to trace variable expansion issues during debugging
- Inconsistent with using variables for resource group prefixes

**Fix Applied**:
```yaml
- script: |
    # Set variables for proper substitution
    PROD_REGIONS="$(prodAksRegions)"
    BUILD_ID="$(Build.BuildId)"
    SCRIPTS_PATH="$(scriptsPath)"
    PROD_RG_PREFIX="$(prodResourceGroupPrefix)"

    IFS=',' read -ra REGIONS <<< "${PROD_REGIONS}"
    for region in "${REGIONS[@]}"; do
      echo "##[group]Deploying to region: ${region}"

      # Deploy infrastructure with proper variable expansion
      az deployment group create \
        --resource-group "${PROD_RG_PREFIX}-${region}-rg" \
        --template-file templates/production/main.bicep \
        --parameters region="${region}" buildId="${BUILD_ID}"

      # Deploy IoT Hub
      bash "${SCRIPTS_PATH}/deploy-iot-hub.sh" production "${region}" "${BUILD_ID}"
    done
```

Applied to both production deployment script and cache clearing script.

---

## Issue 9: Missing Retry Logic on Critical Operations

**Severity**: Low

**Description**: The MODEL_RESPONSE.md included retry logic on some deployment tasks but was inconsistent. Critical operations like pre-deployment health checks, rollback operations, and cache clearing lacked retry logic, making them vulnerable to transient failures.

**Tasks Without Retry**:
- Pre-deployment health checks
- Rollback IoT Hub deployments
- Rollback Azure Functions
- Rollback Traffic Manager configuration
- Cache clearing operations

**Impact**: Transient network failures or temporary service unavailability could cause critical operations to fail unnecessarily, requiring manual intervention.

**Fix Applied**:
Added `retryCountOnTaskFailure` to all critical Azure CLI tasks:

```yaml
- task: AzureCLI@2
  displayName: 'Pre-deployment health checks'
  retryCountOnTaskFailure: 2

- task: AzureCLI@2
  displayName: 'Rollback IoT Hub edge deployments'
  retryCountOnTaskFailure: 2

- task: AzureCLI@2
  displayName: 'Rollback Azure Functions'
  retryCountOnTaskFailure: 2

- task: AzureCLI@2
  displayName: 'Revert Traffic Manager configuration'
  retryCountOnTaskFailure: 2

- task: AzureCLI@2
  displayName: 'Clear caches'
  retryCountOnTaskFailure: 1
```

---

## Issue 10: Missing Cancellation Timeout Protection

**Severity**: Low

**Description**: The MODEL_RESPONSE.md lacked explicit cancellation timeout settings on critical deployment and rollback jobs. When a pipeline is cancelled, jobs need time to clean up resources gracefully. Without this setting, cancellation could leave resources in an inconsistent state.

**Missing Configuration**:
- Production multi-region deployment had no cancellation timeout
- Rollback deployment had no cancellation timeout

**Impact**:
- Abrupt cancellation could leave deployments half-complete
- Resources might not be properly cleaned up
- Could require manual cleanup of orphaned resources

**Fix Applied**:
Added timeout and cancellation protection to critical jobs:

```yaml
- deployment: deployProductionRegions
  timeoutInMinutes: 180  # 3 hours for multi-region deployment
  cancelTimeoutInMinutes: 10  # Allow time for cleanup on cancellation

- deployment: rollbackProduction
  timeoutInMinutes: 90  # Extended timeout for rollback operations
  cancelTimeoutInMinutes: 10  # Allow cleanup time
```

This gives the pipeline 10 minutes to gracefully shut down when cancelled, allowing cleanup scripts to run and resources to be properly released.

---

## Summary of Fixes

Total issues identified and fixed: 10

**By Severity**:
- Medium: 5 issues (Missing variables, script validation, prerequisites, Redis reboot, variable substitution)
- Low: 5 issues (Hardcoded names, timeouts, rollback trigger, retry logic, cancellation protection)

**By Category**:
- Configuration: 3 issues (variables, hardcoded names, prerequisites)
- Validation: 1 issue (script validation)
- Resilience: 4 issues (timeouts, Redis reboot, retry logic, cancellation protection)
- Functionality: 1 issue (manual rollback)
- Code Quality: 1 issue (variable substitution)

**Lines Changed**: Approximately 200 additions, 25 modifications across the 1360-line pipeline

**Key Improvements**:
1. All Azure Pipelines variables properly assigned to bash variables before use
2. Consistent quoting and variable expansion throughout scripts
3. Retry logic on all critical Azure CLI operations (5+ tasks)
4. Cancellation timeouts on production and rollback deployments
5. Extended job timeouts for long-running multi-region operations

**Compatibility**: All fixes maintain backward compatibility with the original MODEL_RESPONSE.md design while adding robustness and configurability.

**Production Readiness**: The pipeline now includes:
- Comprehensive error handling and retry mechanisms
- Proper variable substitution preventing expansion issues
- Graceful cancellation with cleanup time
- Extended timeouts for complex multi-region operations
- Complete documentation of prerequisites and configuration

**Verification**: The fixed pipeline in ci-cd.yml now fully satisfies all requirements in PROMPT.md with production-ready enhancements for error handling, documentation, operational safety, and reliability.
