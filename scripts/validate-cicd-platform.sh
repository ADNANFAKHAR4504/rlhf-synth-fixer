#!/bin/bash

# Multi-Platform CI/CD Validation Script
# Supports: GitHub Actions, GitLab CI, CircleCI, ArgoCD, Google Cloud Build, Azure DevOps
# Note: set -e is intentionally not used to allow proper error collection and reporting

CICD_FILE="lib/ci-cd.yml"
PLATFORM=""
VALIDATION_PASSED=true
ERRORS=()
WARNINGS=()

echo "🔍 Multi-Platform CI/CD Validation"
echo "======================================"
echo ""

# Step 1: Detect CI/CD Platform
detect_platform() {
  echo "📋 Step 1: Detecting CI/CD Platform..."

  if [ ! -f "$CICD_FILE" ]; then
    ERRORS+=("CI/CD configuration file not found: $CICD_FILE")
    VALIDATION_PASSED=false
    return 1
  fi

  # GitHub Actions detection
  if grep -q "^name:" "$CICD_FILE" && grep -q "^on:" "$CICD_FILE" && grep -q "^jobs:" "$CICD_FILE"; then
    if grep -qE "uses:.*actions/" "$CICD_FILE" || grep -qE "runs-on:.*ubuntu" "$CICD_FILE"; then
      PLATFORM="github-actions"
      echo "✅ Detected Platform: GitHub Actions"
      return 0
    fi
  fi

  # GitLab CI detection
  if grep -qE "^(image:|stages:|before_script:|after_script:)" "$CICD_FILE"; then
    if grep -qE "^  (stage|script|tags):" "$CICD_FILE" || grep -qE "^\..*:" "$CICD_FILE"; then
      PLATFORM="gitlab-ci"
      echo "✅ Detected Platform: GitLab CI"
      return 0
    fi
  fi

  # CircleCI detection
  if grep -q "^version:" "$CICD_FILE" && grep -qE "^(workflows|jobs|orbs):" "$CICD_FILE"; then
    if grep -qE "version.*2\\.1|version.*2" "$CICD_FILE"; then
      PLATFORM="circleci"
      echo "✅ Detected Platform: CircleCI"
      return 0
    fi
  fi

  # ArgoCD detection
  if grep -qE "^(apiVersion.*argoproj\\.io|kind:.*Application)" "$CICD_FILE"; then
    PLATFORM="argocd"
    echo "✅ Detected Platform: ArgoCD"
    return 0
  fi

  # Google Cloud Build detection
  if grep -qE "^steps:" "$CICD_FILE" && grep -qE "name:.*gcr\\.io|name:.*us-docker\\.pkg\\.dev" "$CICD_FILE"; then
    PLATFORM="google-cloud-build"
    echo "✅ Detected Platform: Google Cloud Build"
    return 0
  fi

  # Azure DevOps detection
  if grep -qE "^(trigger|pr|pool|stages|jobs):" "$CICD_FILE"; then
    if grep -qE "vmImage:.*ubuntu|vmImage:.*windows" "$CICD_FILE"; then
      PLATFORM="azure-devops"
      echo "✅ Detected Platform: Azure DevOps"
      return 0
    fi
  fi

  # If no platform detected
  WARNINGS+=("Could not definitively detect CI/CD platform - attempting generic validation")
  PLATFORM="unknown"
  echo "⚠️  Platform detection inconclusive - using generic validation"
  return 0
}

# Step 2: Validate Script Length (>5 lines should be in scripts/)
validate_script_length() {
  echo ""
  echo "📋 Step 2: Validating Script Length (inline scripts should be ≤5 lines)..."

  # Extract script blocks based on platform
  case "$PLATFORM" in
    github-actions)
      # Check for multi-line run: blocks
      local in_run_block=false
      local run_line_count=0
      local current_job=""
      local line_num=0
      local run_block_start_line=0
      local run_block_indent=0

      while IFS= read -r line; do
        ((line_num++))

        # Track current job name
        if echo "$line" | grep -qE "^  [a-z-][a-z0-9_-]*:"; then
          current_job=$(echo "$line" | sed -E 's/^  ([a-z-][a-z0-9_-]*):.*/\1/')
        fi

        # Detect run: blocks with pipe (multi-line)
        if echo "$line" | grep -qE "^[[:space:]]+run:[[:space:]]*\\|"; then
          in_run_block=true
          run_line_count=0
          run_block_start_line=$line_num
          # Determine the base indentation (spaces before the first script line)
          run_block_indent=$(echo "$line" | sed -E 's/^([[:space:]]+).*/\1/' | wc -c)
          ((run_block_indent += 2)) # Content should be indented 2 more spaces
          continue
        fi

        if [ "$in_run_block" = true ]; then
          # Check if still in block (properly indented content)
          # Content lines should have MORE indentation than the run: line
          local current_indent=$(echo "$line" | sed -E 's/^([[:space:]]*).*/\1/' | wc -c)

          # Empty lines or lines with content at the expected indentation
          if [ -z "$(echo "$line" | tr -d '[:space:]')" ]; then
            # Skip empty lines, don't count them
            continue
          elif [ "$current_indent" -ge "$run_block_indent" ]; then
            # This is a content line
            ((run_line_count++))
          else
            # End of block - less indentation means new YAML key or step
            if [ "$run_line_count" -gt 5 ]; then
              ERRORS+=("Job '$current_job' at line ~$run_block_start_line: Inline script has $run_line_count lines (>5). Move to scripts/ directory")
              VALIDATION_PASSED=false
            fi
            in_run_block=false
            run_line_count=0
          fi
        fi

        # Check single-line run: with semicolons or &&
        if echo "$line" | grep -qE "run:[[:space:]]*[^|]"; then
          local cmd_count=$(echo "$line" | tr ';' '\n' | grep -v '^[[:space:]]*$' | wc -l)
          local and_count=$(echo "$line" | grep -o '&&' | wc -l)

          if [ "$cmd_count" -gt 5 ] || [ "$and_count" -gt 4 ]; then
            ERRORS+=("Line $line_num: Complex inline script detected. Move to scripts/ directory")
            VALIDATION_PASSED=false
          fi
        fi
      done < "$CICD_FILE"
      ;;

    gitlab-ci)
      # Check before_script, script, and after_script sections
      # Count total lines across all three sections per job
      local in_before_script=false
      local in_script=false
      local in_after_script=false
      local total_script_lines=0
      local current_job=""
      local job_start_line=0
      local line_num=0

      while IFS= read -r line; do
        ((line_num++))

        # Detect job start (job-name: at column 0 or with anchor/hidden jobs like .anchor:)
        if echo "$line" | grep -qE "^[a-z._-]+:"; then
          # End previous job validation (skip anchors - jobs starting with .)
          # Check if current_job does NOT start with a dot
          if [ "$current_job" != "" ] && [ "${current_job#.}" = "$current_job" ] && [ "$total_script_lines" -gt 5 ]; then
            echo "ERROR: Job '$current_job' at line ~$job_start_line has $total_script_lines script lines (>5)" >&2
            ERRORS+=("Job '$current_job' at line ~$job_start_line: Total script lines ($total_script_lines) >5. Move to scripts/ directory")
            VALIDATION_PASSED=false
          fi

          current_job=$(echo "$line" | sed 's/://g' | xargs)
          job_start_line=$line_num
          total_script_lines=0
          in_before_script=false
          in_script=false
          in_after_script=false
        fi

        # Detect before_script:, script:, after_script:
        if echo "$line" | grep -qE "^[[:space:]]+before_script:"; then
          in_before_script=true
          in_script=false
          in_after_script=false
          continue
        fi

        if echo "$line" | grep -qE "^[[:space:]]+script:"; then
          in_before_script=false
          in_script=true
          in_after_script=false
          continue
        fi

        if echo "$line" | grep -qE "^[[:space:]]+after_script:"; then
          in_before_script=false
          in_script=false
          in_after_script=true
          continue
        fi

        # Count command lines (lines starting with "    - ")
        if [ "$in_before_script" = true ] || [ "$in_script" = true ] || [ "$in_after_script" = true ]; then
          if echo "$line" | grep -qE "^[[:space:]]{4,}- "; then
            ((total_script_lines++))
          elif echo "$line" | grep -qE "^[[:space:]]{2}[a-z_]+:"; then
            # End of script sections - new YAML key
            in_before_script=false
            in_script=false
            in_after_script=false
          fi
        fi
      done < "$CICD_FILE"

      # Check last job (skip anchors - jobs starting with .)
      # Check if current_job does NOT start with a dot
      if [ "$current_job" != "" ] && [ "${current_job#.}" = "$current_job" ] && [ "$total_script_lines" -gt 5 ]; then
        echo "DEBUG: Last job validation failed - Job: '$current_job', Lines: $total_script_lines" >&2
        ERRORS+=("Job '$current_job': Total script lines ($total_script_lines) >5. Move to scripts/ directory")
        VALIDATION_PASSED=false
      fi
      echo "✅ GitLab CI script validation passed (checked ${line_num} lines)"
      ;;

    circleci|google-cloud-build|azure-devops)
      # Similar validation for other platforms
      WARNINGS+=("Script length validation for $PLATFORM not fully implemented - manual review recommended")
      ;;
  esac

  # Check if scripts/ directory is referenced
  if grep -qE "\\./scripts/|/scripts/|sh scripts/" "$CICD_FILE"; then
    echo "✅ scripts/ directory referenced in pipeline"
  else
    WARNINGS+=("No scripts/ directory references found - consider externalizing complex logic")
  fi
}

# Step 3: Validate Container Registry (Private Registry Enforcement)
validate_container_registry() {
  echo ""
  echo "📋 Step 3: Validating Container Registry Configuration..."

  local has_container_build=false
  local has_private_registry=false
  local public_dockerhub_detected=false

  # Detect container image references
  case "$PLATFORM" in
    github-actions)
      if grep -qE "(docker build|docker push|docker/build-push-action)" "$CICD_FILE"; then
        has_container_build=true
      fi
      ;;
    gitlab-ci)
      if grep -qE "^image:" "$CICD_FILE"; then
        has_container_build=true

        # Check for private registries
        if grep -E "^image:" "$CICD_FILE" | grep -qE "(\$CI_REGISTRY|registry\\.gitlab\\.com|.*\\.azurecr\\.io|.*\\.ecr\\.|gcr\\.io|.*\\.pkg\\.dev)"; then
          has_private_registry=true
          echo "✅ Private container registry detected (GitLab Registry/ECR/ACR/GCR)"
        fi

        # Check for public DockerHub
        if grep -E "^image:" "$CICD_FILE" | grep -vE "(\$CI_REGISTRY|registry\\.gitlab\\.com|azurecr|ecr|gcr|pkg\\.dev)" | grep -qE "^image:[[:space:]]*(docker\\.io/)?[a-z0-9]+/[a-z0-9]"; then
          public_dockerhub_detected=true
        fi
      fi
      ;;
    google-cloud-build)
      if grep -qE "gcr\\.io|.*\\.pkg\\.dev" "$CICD_FILE"; then
        has_container_build=true
        has_private_registry=true
        echo "✅ Private container registry detected (GCR/Artifact Registry)"
      fi
      ;;
  esac

  # Validation logic
  if [ "$has_container_build" = true ]; then
    if [ "$public_dockerhub_detected" = true ]; then
      ERRORS+=("Public DockerHub registry detected. Use private registry (ECR, GitLab Registry, ACR, GCR) for security")
      VALIDATION_PASSED=false
    fi

    if [ "$PLATFORM" = "gitlab-ci" ] && [ "$has_private_registry" = false ]; then
      WARNINGS+=("No private registry detected. Consider using \$CI_REGISTRY or private ECR/ACR/GCR")
    fi

    # Check for registry authentication
    if grep -qE "(docker login|AWS_ACCOUNT_ID|CI_REGISTRY_PASSWORD|AZURE_REGISTRY)" "$CICD_FILE"; then
      echo "✅ Registry authentication configured"
    else
      WARNINGS+=("No explicit registry authentication found - ensure credentials are configured")
    fi
  else
    echo "ℹ️  No container build detected - skipping registry validation"
  fi
}

# Step 4: Validate Secrets/Variables per Platform
validate_secrets_and_variables() {
  echo ""
  echo "📋 Step 4: Validating Secrets and Variables..."

  local secrets_syntax_valid=true

  case "$PLATFORM" in
    github-actions)
      # Check for proper GitHub Actions secret syntax
      if grep -qE "\\$\\{\\{[[:space:]]*secrets\\." "$CICD_FILE"; then
        echo "✅ GitHub Actions secrets syntax: \${{ secrets.* }}"
      fi

      if grep -qE "\\$\\{\\{[[:space:]]*vars\\." "$CICD_FILE"; then
        echo "✅ GitHub Actions variables syntax: \${{ vars.* }}"
      fi

      # Detect improper secret usage
      if grep -E "secrets\\." "$CICD_FILE" | grep -vE "\\$\\{\\{[[:space:]]*secrets\\." | grep -q "secrets\\."; then
        ERRORS+=("Invalid secret syntax detected. Use: \${{ secrets.SECRET_NAME }}")
        VALIDATION_PASSED=false
        secrets_syntax_valid=false
      fi
      ;;

    gitlab-ci)
      # Check for GitLab CI variable syntax
      if grep -qE "\\$CI_|\\$\\{CI_" "$CICD_FILE"; then
        echo "✅ GitLab CI predefined variables detected"
      fi

      if grep -qE "\\$[A-Z_]+|\\$\\{[A-Z_]+\\}" "$CICD_FILE"; then
        echo "✅ GitLab CI custom variables syntax"
      fi

      # Environment declaration
      if grep -qE "^[[:space:]]+environment:" "$CICD_FILE"; then
        echo "✅ Environment declarations found"
      else
        WARNINGS+=("No environment: declarations found in GitLab CI")
      fi
      ;;

    circleci)
      # CircleCI uses environment variables
      if grep -qE "\\$\\{[A-Z_]+\\}|\\$[A-Z_]+" "$CICD_FILE"; then
        echo "✅ CircleCI environment variable syntax detected"
      fi

      if grep -qE "CIRCLE_|environment:" "$CICD_FILE"; then
        echo "✅ CircleCI context/environment configuration"
      fi
      ;;

    google-cloud-build)
      # Cloud Build substitution variables
      if grep -qE "\\$_[A-Z_]+|\\$\\{_[A-Z_]+\\}" "$CICD_FILE"; then
        echo "✅ Cloud Build substitution variables syntax"
      fi

      if grep -qE "secretEnv:|availableSecrets:" "$CICD_FILE"; then
        echo "✅ Cloud Build secrets configuration detected"
      fi
      ;;

    azure-devops)
      # Azure DevOps variable syntax
      if grep -qE "\\$\\(.*\\)" "$CICD_FILE"; then
        echo "✅ Azure DevOps variable syntax: \$(VARIABLE_NAME)"
      fi
      ;;
  esac

  # Check for hardcoded secrets (covered in next step)
  if [ "$secrets_syntax_valid" = true ]; then
    echo "✅ Secrets/variables syntax validation passed"
  fi
}

# Step 5: Detect Hardcoded Secrets
detect_hardcoded_secrets() {
  echo ""
  echo "📋 Step 5: Detecting Hardcoded Secrets..."

  local secrets_detected=false

  # AWS Access Keys
  if grep -qE "AKIA[0-9A-Z]{16}" "$CICD_FILE"; then
    ERRORS+=("CRITICAL: Hardcoded AWS Access Key detected (AKIA...)")
    VALIDATION_PASSED=false
    secrets_detected=true
  fi

  # AWS Secret Keys (pattern)
  if grep -qE "['\"][0-9a-zA-Z/+=]{40}['\"]" "$CICD_FILE"; then
    WARNINGS+=("Possible hardcoded AWS Secret Key or credential detected (40-char base64)")
  fi

  # Generic passwords
  if grep -iE "(password|passwd|pwd)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]" "$CICD_FILE"; then
    ERRORS+=("Hardcoded password detected in pipeline file")
    VALIDATION_PASSED=false
    secrets_detected=true
  fi

  # API Keys / Tokens
  if grep -iE "(api[_-]?key|api[_-]?secret|token)[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9]{20,}['\"]" "$CICD_FILE"; then
    ERRORS+=("Hardcoded API key/token detected")
    VALIDATION_PASSED=false
    secrets_detected=true
  fi

  # Database connection strings
  if grep -iE "(postgres|mysql|mongodb)://[^@]+:[^@]+@" "$CICD_FILE"; then
    ERRORS+=("Database credentials in connection string detected")
    VALIDATION_PASSED=false
    secrets_detected=true
  fi

  # Private SSH keys (use -- to prevent grep from interpreting ----- as options)
  if grep -qE -- "-----BEGIN.*PRIVATE KEY-----" "$CICD_FILE"; then
    ERRORS+=("CRITICAL: Private SSH/TLS key detected in pipeline file")
    VALIDATION_PASSED=false
    secrets_detected=true
  fi

  if [ "$secrets_detected" = false ]; then
    echo "✅ No hardcoded secrets detected"
  else
    echo "❌ Hardcoded secrets found - THIS IS A CRITICAL SECURITY ISSUE"
  fi
}

# Step 6: Validate Container Scanning
validate_container_scanning() {
  echo ""
  echo "📋 Step 6: Validating Container Scanning..."

  local has_docker_build=false
  local has_scanning=false

  # Check if container is being built
  if grep -qE "(docker build|docker/build-push-action|kaniko|buildah)" "$CICD_FILE"; then
    has_docker_build=true
  fi

  if [ "$has_docker_build" = true ]; then
    echo "ℹ️  Container build detected - checking for security scanning..."

    # Detect scanning tools
    if grep -qiE "(trivy|grype|snyk|anchore|clair|aqua|prisma)" "$CICD_FILE"; then
      has_scanning=true

      # Identify specific tools
      grep -qiE "trivy" "$CICD_FILE" && echo "✅ Trivy container scanning detected"
      grep -qiE "grype" "$CICD_FILE" && echo "✅ Grype container scanning detected"
      grep -qiE "snyk" "$CICD_FILE" && echo "✅ Snyk container scanning detected"
      grep -qiE "anchore" "$CICD_FILE" && echo "✅ Anchore container scanning detected"
    fi

    if [ "$has_scanning" = false ]; then
      ERRORS+=("Container build detected but NO container scanning tool found (Trivy, Grype, Snyk, etc.)")
      VALIDATION_PASSED=false
    fi
  else
    echo "ℹ️  No container build detected - skipping scanning validation"
  fi
}

# Step 7: Validate Kubernetes Deployment
validate_kubernetes_deployment() {
  echo ""
  echo "📋 Step 7: Validating Kubernetes Deployment..."

  local has_k8s_deployment=false

  # Detect Kubernetes deployment patterns
  if grep -qiE "(kubectl|helm|kustomize|k8s|kubernetes)" "$CICD_FILE"; then
    has_k8s_deployment=true
    echo "ℹ️  Kubernetes deployment detected"

    # Check for kubectl commands
    if grep -qE "kubectl apply|kubectl create|kubectl set" "$CICD_FILE"; then
      echo "✅ kubectl deployment commands found"

      # Check for namespace
      if grep -qE "kubectl.*(-n |--namespace)" "$CICD_FILE"; then
        echo "✅ Namespace specified in kubectl commands"
      else
        WARNINGS+=("kubectl commands without explicit namespace - ensure namespace is configured")
      fi
    fi

    # Check for Helm
    if grep -qiE "helm (install|upgrade)" "$CICD_FILE"; then
      echo "✅ Helm deployment detected"
    fi

    # Check for manifest files
    if grep -qE "k8s/|manifests/|kubernetes/" "$CICD_FILE"; then
      echo "✅ Kubernetes manifest directory referenced"
    else
      WARNINGS+=("No explicit k8s manifest directory found - ensure manifests are properly organized")
    fi

    # Security best practices
    if ! grep -qiE "(securityContext|runAsNonRoot|readOnlyRootFilesystem)" "$CICD_FILE"; then
      WARNINGS+=("Consider adding Kubernetes security context configurations")
    fi
  else
    echo "ℹ️  No Kubernetes deployment detected - skipping K8s validation"
  fi
}

# Step 8: Enforce Environment Declaration
validate_environment_declaration() {
  echo ""
  echo "📋 Step 8: Validating Environment Declarations..."

  local has_environments=false

  case "$PLATFORM" in
    github-actions)
      if grep -qE "^[[:space:]]+environment:" "$CICD_FILE"; then
        has_environments=true
        local env_count=$(grep -cE "^[[:space:]]+environment:" "$CICD_FILE")
        echo "✅ GitHub environments declared ($env_count environment(s))"

        # Check for common environments
        grep -qE "environment:[[:space:]]*(dev|development)" "$CICD_FILE" && echo "  - dev environment"
        grep -qE "environment:[[:space:]]*(staging|stage)" "$CICD_FILE" && echo "  - staging environment"
        grep -qE "environment:[[:space:]]*(prod|production)" "$CICD_FILE" && echo "  - prod environment"
      fi
      ;;

    gitlab-ci)
      if grep -qE "^[[:space:]]+environment:" "$CICD_FILE"; then
        has_environments=true
        echo "✅ GitLab environments declared"
      fi
      ;;

    azure-devops)
      if grep -qE "^[[:space:]]+environment:" "$CICD_FILE"; then
        has_environments=true
        echo "✅ Azure DevOps environments declared"
      fi
      ;;
  esac

  if [ "$has_environments" = false ]; then
    WARNINGS+=("No environment declarations found - consider using environments for deployment protection")
  fi

  # Check for multi-environment pattern
  if grep -qiE "(dev|staging|prod)" "$CICD_FILE"; then
    echo "✅ Multi-environment pattern detected"
  else
    WARNINGS+=("Consider implementing multi-environment deployment (dev/staging/prod)")
  fi
}

# Step 9: Additional Best Practices
validate_best_practices() {
  echo ""
  echo "📋 Step 9: Validating CI/CD Best Practices..."

  # Check for stages/job dependencies
  if grep -qE "(needs:|depends_on:|requires:|dependsOn:)" "$CICD_FILE"; then
    echo "✅ Job dependencies configured"
  else
    WARNINGS+=("No job dependencies found - ensure proper pipeline execution order")
  fi

  # Check for caching
  if grep -qiE "(cache:|restore-cache|save-cache)" "$CICD_FILE"; then
    echo "✅ Dependency caching configured"
  else
    WARNINGS+=("No caching detected - consider caching dependencies for faster builds")
  fi

  # Check for artifact management
  if grep -qE "(upload-artifact|download-artifact|artifacts:)" "$CICD_FILE"; then
    echo "✅ Artifact management configured"
  fi

  # Check for notifications
  if grep -qiE "(slack|email|teams|sns|notification)" "$CICD_FILE"; then
    echo "✅ Notification mechanism configured"
  fi
}

# Step 10: Infrastructure Cost Estimation
detect_infrastructure_cost() {
  echo ""
  echo "📋 Step 10: Infrastructure Cost Estimation..."

  local has_infra_deployment=false
  local has_cost_estimation=false

  # Detect infrastructure deployment
  if grep -qiE "(terraform|cdk|cloudformation|pulumi)" "$CICD_FILE"; then
    has_infra_deployment=true
    echo "ℹ️  Infrastructure deployment detected"

    # Check for Terraform
    if grep -qiE "terraform (plan|apply)" "$CICD_FILE"; then
      echo "  - Terraform deployment found"

      # Check for Infracost integration
      if grep -qiE "infracost" "$CICD_FILE"; then
        has_cost_estimation=true
        echo "✅ Infracost cost estimation configured"
      else
        WARNINGS+=("Terraform deployment without cost estimation - consider adding Infracost")
        echo "⚠️  No cost estimation tool detected"
        echo "   💡 Tip: Add Infracost to estimate infrastructure costs before deployment"
        echo "   Example: infracost breakdown --path=. --format=json"
      fi
    fi

    # Check for AWS CDK
    if grep -qiE "cdk (deploy|synth)" "$CICD_FILE"; then
      echo "  - AWS CDK deployment found"

      if ! grep -qiE "(infracost|cost)" "$CICD_FILE"; then
        WARNINGS+=("CDK deployment without cost visibility - consider cost tracking")
        echo "⚠️  No cost tracking detected for CDK"
      fi
    fi

    # Check for CloudFormation
    if grep -qiE "cloudformation|aws cloudformation" "$CICD_FILE"; then
      echo "  - CloudFormation deployment found"
    fi

    # Check for Pulumi
    if grep -qiE "pulumi (up|preview)" "$CICD_FILE"; then
      echo "  - Pulumi deployment found"

      if grep -qiE "pulumi preview" "$CICD_FILE"; then
        echo "✅ Pulumi preview (with cost estimates) configured"
      fi
    fi

    # General cost recommendation
    if [ "$has_cost_estimation" = false ]; then
      echo ""
      echo "💰 Cost Estimation Recommendation:"
      echo "   Consider adding infrastructure cost estimation to your pipeline:"
      echo "   - Terraform: Use Infracost (https://www.infracost.io/)"
      echo "   - Pulumi: Built-in cost estimates with 'pulumi preview'"
      echo "   - CDK: Use cdk-nag with cost awareness rules"
      echo "   - Benefits: Prevent unexpected cloud costs, budget tracking"
    fi
  else
    echo "ℹ️  No infrastructure deployment detected - skipping cost analysis"
  fi
}

# Step 11: Performance Analysis
analyze_pipeline_performance() {
  echo ""
  echo "📋 Step 11: Pipeline Performance Analysis..."

  local parallel_jobs=0
  local sequential_jobs=0
  local has_caching=false
  local has_parallelization=false

  # Count parallel jobs (jobs without dependencies)
  case "$PLATFORM" in
    github-actions)
      # Jobs without 'needs:' can run in parallel
      local total_jobs=$(grep -cE "^  [a-z-]+:" "$CICD_FILE" || echo 0)
      local jobs_with_deps=$(grep -cE "^[[:space:]]+needs:" "$CICD_FILE" || echo 0)
      parallel_jobs=$((total_jobs - jobs_with_deps))
      sequential_jobs=$jobs_with_deps

      if [ "$parallel_jobs" -gt 1 ]; then
        has_parallelization=true
        echo "✅ Pipeline parallelization: $parallel_jobs jobs can run in parallel"
      fi
      ;;

    gitlab-ci)
      # Check for parallel keyword
      if grep -qE "^[[:space:]]+parallel:" "$CICD_FILE"; then
        has_parallelization=true
        echo "✅ GitLab CI parallel execution configured"
      fi
      ;;

    circleci)
      # CircleCI workflows allow parallelism
      if grep -qE "parallelism:" "$CICD_FILE"; then
        has_parallelization=true
        echo "✅ CircleCI parallelism configured"
      fi
      ;;
  esac

  # Check for caching strategies
  if grep -qiE "(cache:|restore-cache|save-cache|setup-node.*cache)" "$CICD_FILE"; then
    has_caching=true
    echo "✅ Dependency caching enabled (improves build time)"
  else
    WARNINGS+=("No caching configured - builds may be slower than necessary")
    echo "⚠️  No caching detected"
  fi

  # Performance score
  local perf_score=0
  [ "$has_parallelization" = true ] && ((perf_score += 40))
  [ "$has_caching" = true ] && ((perf_score += 30))
  [ "$parallel_jobs" -gt 3 ] && ((perf_score += 20))
  grep -qE "(artifacts:.*expire_in|retention-days)" "$CICD_FILE" && ((perf_score += 10))

  echo ""
  echo "⚡ Performance Score: $perf_score/100"

  if [ "$perf_score" -lt 50 ]; then
    echo "   💡 Suggestions to improve pipeline performance:"
    [ "$has_parallelization" = false ] && echo "   - Enable job parallelization where possible"
    [ "$has_caching" = false ] && echo "   - Add dependency caching (npm, pip, maven, etc.)"
    echo "   - Set artifact retention policies to save storage"
  fi
}

# Step 12: Security Scoring
calculate_security_score() {
  echo ""
  echo "📋 Step 12: Security Score Calculation..."

  local security_score=100
  local security_issues=()

  # Critical issues (-30 each)
  if grep -qE "AKIA[0-9A-Z]{16}" "$CICD_FILE"; then
    ((security_score -= 30))
    security_issues+=("Hardcoded AWS credentials (-30)")
  fi

  if grep -qiE "(password|passwd|pwd)[[:space:]]*[:=][[:space:]]*['\"]" "$CICD_FILE" | grep -vE "(secrets\.|vars\.|CI_|CIRCLE_|\\\$)"; then
    ((security_score -= 30))
    security_issues+=("Hardcoded passwords (-30)")
  fi

  # High issues (-20 each)
  local has_container_build=$(grep -qE "(docker build|kaniko)" "$CICD_FILE" && echo "true" || echo "false")
  local has_container_scan=$(grep -qiE "(trivy|grype|snyk|anchore)" "$CICD_FILE" && echo "true" || echo "false")

  if [ "$has_container_build" = "true" ] && [ "$has_container_scan" = "false" ]; then
    ((security_score -= 20))
    security_issues+=("Container build without vulnerability scanning (-20)")
  fi

  if grep -qE "image:[[:space:]]*(docker\\.io/)?[a-z0-9]+/[a-z0-9]" "$CICD_FILE" && ! grep -qE "(\$CI_REGISTRY|ecr|gcr|azurecr)" "$CICD_FILE"; then
    ((security_score -= 15))
    security_issues+=("Using public container registries (-15)")
  fi

  # Medium issues (-10 each)
  if ! grep -qE "environment:" "$CICD_FILE"; then
    ((security_score -= 10))
    security_issues+=("No environment protection configured (-10)")
  fi

  if ! grep -qiE "(manual|approval)" "$CICD_FILE" && grep -qiE "(prod|production)" "$CICD_FILE"; then
    ((security_score -= 10))
    security_issues+=("Production deployment without manual approval (-10)")
  fi

  # Bonus points
  if grep -qiE "(cdk-nag|checkov|tfsec|terrascan)" "$CICD_FILE"; then
    ((security_score += 5))
    echo "✅ Infrastructure security scanning detected (+5 bonus)"
  fi

  if grep -qiE "OIDC|OpenID" "$CICD_FILE"; then
    ((security_score += 5))
    echo "✅ OIDC authentication detected (+5 bonus)"
  fi

  # Cap score at 0-100
  [ "$security_score" -lt 0 ] && security_score=0
  [ "$security_score" -gt 100 ] && security_score=100

  echo ""
  echo "🔒 Security Score: $security_score/100"

  if [ ${#security_issues[@]} -gt 0 ]; then
    echo ""
    echo "Security issues found:"
    for issue in "${security_issues[@]}"; do
      echo "  ⚠️  $issue"
    done
  fi

  if [ "$security_score" -ge 90 ]; then
    echo "   🌟 Excellent! Your pipeline follows security best practices"
  elif [ "$security_score" -ge 70 ]; then
    echo "   ✅ Good security posture, minor improvements possible"
  elif [ "$security_score" -ge 50 ]; then
    echo "   ⚠️  Fair security, several improvements recommended"
  else
    echo "   ❌ Poor security score - immediate action required"
  fi
}

# Step 13: Validate Deployment Strategies (Canary, Blue-Green, Rolling)
validate_deployment_strategies() {
  echo ""
  echo "📋 Step 13: Validating Deployment Strategies..."

  local has_deployment_strategy=false
  local has_canary=false
  local has_blue_green=false
  local has_rolling=false
  local has_progressive_delivery=false
  local deployment_maturity_score=0
  local strategies_found=()

  # Check for deployment-related jobs/stages
  local has_deploy_jobs=false
  if grep -qiE "(deploy|deployment|release)" "$CICD_FILE"; then
    has_deploy_jobs=true
  fi

  # Only check for strategies if there are deployment jobs
  if [ "$has_deploy_jobs" = false ]; then
    echo "ℹ️  No deployment jobs detected - skipping deployment strategy validation"
    return
  fi

  # Detect Canary Deployments
  # Generic patterns + ArgoCD Rollouts + Azure DevOps strategy
  if grep -qiE "(canary|traffic.*split|weight.*[0-9]+%?|gradual.*rollout|setWeight|steps:.*pause|strategy:.*canary)" "$CICD_FILE"; then
    has_canary=true
    has_deployment_strategy=true
    has_progressive_delivery=true
    strategies_found+=("Canary")
    ((deployment_maturity_score += 40))

    # Check for canary-specific patterns
    if grep -qiE "(canary.*deploy|deploy.*canary|canary.*release|strategy:.*canary)" "$CICD_FILE"; then
      echo "✅ Canary deployment strategy detected"

      # Check for traffic weight configuration (generic + ArgoCD Rollouts)
      if grep -qiE "(weight:|traffic.*[0-9]+%|CANARY.*WEIGHT|setWeight:|trafficRouting)" "$CICD_FILE"; then
        echo "   ✓ Traffic weight/percentage configuration found"
        ((deployment_maturity_score += 10))
      fi

      # Check for canary monitoring/validation
      if grep -qiE "(canary.*monitor|canary.*metric|canary.*test|validate.*canary|analysis|AnalysisTemplate)" "$CICD_FILE"; then
        echo "   ✓ Canary monitoring/validation detected"
        ((deployment_maturity_score += 10))
      fi

      # Check for canary promotion
      if grep -qiE "(promote.*canary|canary.*promote|pause.*duration|pause:)" "$CICD_FILE"; then
        echo "   ✓ Canary promotion workflow found"
        ((deployment_maturity_score += 5))
      fi

      # ArgoCD-specific bonus checks
      if grep -qiE "(kind:.*Rollout|argoproj\\.io.*rollout)" "$CICD_FILE"; then
        echo "   ✓ Argo Rollouts detected"
        ((deployment_maturity_score += 5))
      fi
    fi
  fi

  # Detect Blue-Green Deployments
  if grep -qiE "(blue.*green|blue-green|bluegreen|green.*blue)" "$CICD_FILE"; then
    has_blue_green=true
    has_deployment_strategy=true
    has_progressive_delivery=true
    strategies_found+=("Blue-Green")
    ((deployment_maturity_score += 35))

    echo "✅ Blue-Green deployment strategy detected"

    # Check for environment switching
    if grep -qiE "(switch.*environment|swap.*environment|cutover|DEPLOYMENT_STRATEGY.*blue)" "$CICD_FILE"; then
      echo "   ✓ Environment switching configuration found"
      ((deployment_maturity_score += 10))
    fi
  fi

  # Detect Rolling Deployments
  # Generic + Kubernetes + Azure DevOps patterns
  if grep -qiE "(rolling.*deploy|rolling.*update|maxSurge|maxUnavailable|RollingUpdate|strategy:.*rolling|runOnce)" "$CICD_FILE"; then
    has_rolling=true
    has_deployment_strategy=true
    has_progressive_delivery=true
    strategies_found+=("Rolling Update")
    ((deployment_maturity_score += 25))

    echo "✅ Rolling deployment strategy detected"

    # Check for surge/unavailable configuration
    if grep -qiE "(maxSurge|maxUnavailable|max.*surge|max.*unavailable|preDeploy|deploy|postDeploy)" "$CICD_FILE"; then
      echo "   ✓ Rolling update parameters configured"
      ((deployment_maturity_score += 5))
    fi

    # Azure DevOps-specific bonus
    if grep -qiE "(strategy:.*runOnce|strategy:.*rolling)" "$CICD_FILE"; then
      echo "   ✓ Azure DevOps deployment strategy detected"
      ((deployment_maturity_score += 5))
    fi
  fi

  # Detect Feature Flags / Feature Toggles
  if grep -qiE "(feature.*flag|feature.*toggle|launchdarkly|split\\.io|flagsmith)" "$CICD_FILE"; then
    has_progressive_delivery=true
    strategies_found+=("Feature Flags")
    ((deployment_maturity_score += 15))
    echo "✅ Feature flag integration detected"
  fi

  # Detect A/B Testing
  if grep -qiE "(a/b.*test|ab.*test|split.*test|experiment)" "$CICD_FILE"; then
    strategies_found+=("A/B Testing")
    ((deployment_maturity_score += 10))
    echo "✅ A/B testing capability detected"
  fi

  # Detect Smoke Tests (important for deployment validation)
  if grep -qiE "(smoke.*test|health.*check|readiness.*probe|liveness.*probe)" "$CICD_FILE"; then
    strategies_found+=("Smoke Testing")
    ((deployment_maturity_score += 10))
    echo "✅ Smoke testing / health checks configured"
  fi

  # Detect Rollback Capability
  local has_rollback=false
  if grep -qiE "(rollback|revert|undo.*deploy)" "$CICD_FILE"; then
    has_rollback=true
    ((deployment_maturity_score += 15))
    echo "✅ Rollback capability detected"
  fi

  # Detect Manual Approval Gates
  if grep -qiE "(manual.*approval|when:.*manual|approval.*required|approval:|human.*gate)" "$CICD_FILE"; then
    ((deployment_maturity_score += 10))
    echo "✅ Manual approval gates configured"
  fi

  # Detect Multi-Environment Strategy
  local env_count=0
  if grep -qiE "(environment.*dev|deploy.*dev)" "$CICD_FILE"; then ((env_count++)); fi
  if grep -qiE "(environment.*stag|deploy.*stag)" "$CICD_FILE"; then ((env_count++)); fi
  if grep -qiE "(environment.*prod|deploy.*prod)" "$CICD_FILE"; then ((env_count++)); fi

  if [ "$env_count" -ge 3 ]; then
    ((deployment_maturity_score += 10))
    echo "✅ Multi-environment deployment pipeline (dev → staging → prod)"
  fi

  # Generate report
  echo ""
  echo "🚀 Deployment Strategy Analysis:"
  echo "   Maturity Score: $deployment_maturity_score/100"

  if [ "$has_deployment_strategy" = true ]; then
    echo "   Strategies Detected: ${strategies_found[*]}"

    if [ "$deployment_maturity_score" -ge 80 ]; then
      echo "   🌟 Excellent! Advanced progressive delivery practices"
    elif [ "$deployment_maturity_score" -ge 60 ]; then
      echo "   ✅ Good deployment strategy - production-ready"
    elif [ "$deployment_maturity_score" -ge 40 ]; then
      echo "   ⚠️  Basic deployment strategy - consider enhancements"
    else
      echo "   ℹ️  Simple deployment detected"
    fi
  else
    # Deployment jobs exist but no progressive delivery strategy
    WARNINGS+=("No advanced deployment strategy detected (canary, blue-green, rolling, etc.)")
    WARNINGS+=("Consider implementing progressive delivery for safer production deployments")
    echo "   ⚠️  WARNING: No progressive delivery strategy detected"
    echo ""
    echo "   💡 Recommendations:"
    echo "      • Implement canary deployments for gradual traffic shifting"
    echo "      • Use blue-green deployments for zero-downtime releases"
    echo "      • Add rollback capability for quick recovery"
    echo "      • Configure smoke tests to validate deployments"
    echo "      • Add manual approval gates before production"
    echo ""
    echo "   Benefits of progressive delivery:"
    echo "      ✓ Reduced blast radius of failures"
    echo "      ✓ Faster mean time to recovery (MTTR)"
    echo "      ✓ Increased deployment confidence"
    echo "      ✓ Better user experience during releases"
  fi

  # Platform-specific recommendations
  if [ "$has_deployment_strategy" = false ]; then
    echo ""
    echo "   📚 Platform-specific guidance:"
    case "$PLATFORM" in
      github-actions)
        echo "      GitHub Actions: Use deployment environments with protection rules"
        echo "      Example: environment: production with required reviewers"
        ;;
      gitlab-ci)
        echo "      GitLab CI: Leverage environments with deployment_tier and manual gates"
        echo "      Example: environment: { name: canary, deployment_tier: staging }"
        ;;
      circleci)
        echo "      CircleCI: Use workflows with approval jobs and context switching"
        echo "      Example: workflows with hold jobs before production"
        ;;
      argocd)
        echo "      ArgoCD: Use Argo Rollouts for progressive delivery"
        echo "      Example: strategy: { canary: { steps: [{setWeight: 20}, {pause: {duration: 1h}}] } }"
        echo "      Consider: Flagger for automated canary analysis with metrics"
        ;;
      azure-devops)
        echo "      Azure DevOps: Use deployment strategies with approval gates"
        echo "      Example: strategy: { runOnce/canary/rolling } with environment approvals"
        echo "      Consider: deployment jobs with strategy: canary or rolling"
        ;;
      kubernetes)
        echo "      Kubernetes: Use Argo Rollouts, Flagger, or native rolling updates"
        echo "      Example: strategy: { type: RollingUpdate, rollingUpdate: { maxSurge: 1 } }"
        ;;
    esac
  fi

  # Check for anti-patterns
  if [ "$has_deploy_jobs" = true ] && ! grep -qiE "(environment:|approval|manual|gate)" "$CICD_FILE"; then
    WARNINGS+=("Deployment jobs detected without approval gates - consider adding safety controls")
    echo ""
    echo "   ⚠️  No approval gates detected - deployments may be fully automated"
  fi
}

# Main execution
main() {
  detect_platform || exit 1
  validate_script_length
  validate_container_registry
  validate_secrets_and_variables
  detect_hardcoded_secrets
  validate_container_scanning
  validate_kubernetes_deployment
  validate_environment_declaration
  validate_best_practices

  # Enhancement features (non-blocking)
  detect_infrastructure_cost
  analyze_pipeline_performance
  calculate_security_score
  validate_deployment_strategies

  # Generate final report
  echo ""
  echo "======================================"
  echo "Pipeline Validation Report"
  echo "======================================"
  echo "Platform: $PLATFORM"
  echo ""

  if [ "$VALIDATION_PASSED" = true ]; then
    echo "✅ VALIDATION PASSED"
  else
    echo "❌ VALIDATION FAILED"
  fi

  if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "Errors (${#ERRORS[@]}):"
    for error in "${ERRORS[@]}"; do
      echo "  ❌ $error"
    done
  fi

  if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "Warnings (${#WARNINGS[@]}):"
    for warning in "${WARNINGS[@]}"; do
      echo "  ⚠️  $warning"
    done
  fi

  echo ""
  echo "======================================"

  if [ "$VALIDATION_PASSED" = false ]; then
    exit 1
  fi

  exit 0
}

main
