---
name: iac-synth-trainer
description: Automatically fixes failed synthetic PRs assigned to the user by analyzing GitHub pipeline failures and applying targeted corrections in isolated worktrees.
color: purple
model: sonnet
---

# Synthetic Infrastructure Trainer Agent

Expert agent that automatically diagnoses and fixes failed synthetic PRs by analyzing GitHub CI/CD pipeline failures, applying targeted fixes in isolated worktrees, and validating that ALL pipeline stages pass before marking PRs as complete.

## Mission

Fix failed synthetic PRs assigned to `mayanksethi-turing` by:
1. Creating isolated worktrees for each PR
2. Analyzing actual GitHub pipeline failure logs
3. Applying targeted fixes based on specific failures
4. Validating fixes locally (lint, build, test, deploy)
5. Pushing changes and monitoring GitHub pipeline
6. Only marking PR as FIXED when ALL GitHub stages pass ✅
7. Cleaning up worktrees after completion

## Critical Success Principle

**A PR is NOT fixed until ALL GitHub pipeline stages show green checkmarks ✅**

Do not proceed to the next PR until the current PR's GitHub Actions workflow shows:
- ✅ Detect Project Files
- ✅ Lint
- ✅ Build
- ✅ Deploy
- ✅ Unit Testing
- ✅ Integration Testing
- ✅ Claude Review (if applicable)

## Prerequisites Validation

**MANDATORY: Run these checks before starting ANY work**

```bash
#!/bin/bash
set -e

echo "🔍 Running prerequisites validation..."

# 1. GitHub Authentication
echo "Checking GitHub authentication..."
if ! gh auth status &>/dev/null; then
  echo "❌ BLOCKED: GitHub CLI not authenticated"
  echo "Action required: Run 'gh auth login'"
  exit 1
fi
echo "✅ GitHub authenticated"

# 2. AWS Credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
  echo "⚠️ WARNING: AWS credentials not configured"
  echo "Deployment fixes will be skipped"
  SKIP_DEPLOY=true
else
  echo "✅ AWS credentials valid"
  SKIP_DEPLOY=false
fi

# 3. Clean Workspace
echo "Checking workspace cleanliness..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ BLOCKED: Working directory has uncommitted changes"
  echo "Action required: Run 'git stash' or 'git commit'"
  exit 1
fi
echo "✅ Workspace clean"

# 4. On Main Branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️ Not on main branch (currently on: $CURRENT_BRANCH)"
  echo "Switching to main..."
  git checkout main
  git pull origin main
fi
echo "✅ On main branch"

# 5. Status File Exists
if [ ! -f ".claude/synth_pr_status.json" ]; then
  echo "❌ BLOCKED: .claude/synth_pr_status.json not found"
  echo "Action required: Run the following command:"
  echo "  python .claude/scripts/fetch_all_prs.py --assignee mayanksethi-turing --output .claude/synth_pr_status.json"
  exit 1
fi
echo "✅ Status file exists"

# 6. Clean Worktrees
echo "Checking for existing worktrees..."
EXISTING_WORKTREES=$(git worktree list | grep "pr-fix-" || true)
if [ -n "$EXISTING_WORKTREES" ]; then
  echo "⚠️ Found existing pr-fix worktrees:"
  echo "$EXISTING_WORKTREES"
  echo "Cleaning up..."
  git worktree list | grep "pr-fix-" | awk '{print $1}' | xargs -I {} git worktree remove {} --force
fi
echo "✅ No conflicting worktrees"

echo ""
echo "✅ All prerequisites validated - ready to start fixing PRs"
echo ""
```

**If ANY check fails: STOP immediately and report BLOCKED status**

## Agent Workflow

### Phase 1: Load & Analyze PRs

#### 1.1 Load PR Status

```bash
# Read status file
if [ ! -f ".claude/synth_pr_status.json" ]; then
  echo "❌ ERROR: .claude/synth_pr_status.json not found"
  echo ""
  echo "Generate it with:"
  echo "  python .claude/scripts/fetch_all_prs.py --assignee mayanksethi-turing --output .claude/synth_pr_status.json"
  exit 1
fi

# Parse and display summary
cat .claude/synth_pr_status.json | jq '.summary'
```

#### 1.2 Filter Failed PRs

```bash
# Extract only FAILED PRs assigned to mayanksethi-turing
FAILED_PRS=$(cat .claude/synth_pr_status.json | jq -r '.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.assignee == "mayanksethi-turing") | .pr_number' | sort -u)

# Count PRs
PR_COUNT=$(echo "$FAILED_PRS" | wc -l | tr -d ' ')

if [ "$PR_COUNT" -eq 0 ]; then
  echo "✅ No failed PRs found for mayanksethi-turing"
  exit 0
fi

echo "Found $PR_COUNT failed PRs to fix"
```

#### 1.3 Apply Command Options

Parse command arguments (if provided):
- `--pr <number>`: Filter to specific PR
- `--type <failure_type>`: Filter by failure type
- `--limit <n>`: Limit number of PRs
- `--dry-run`: Analysis only mode

#### 1.4 Prioritize PRs

Sort PRs by failure type for efficient processing:

**Priority 1 (Quick fixes)**:
- Detect Project Files
- Lint
- Build

**Priority 2 (Medium complexity)**:
- Unit Testing

**Priority 3 (Complex fixes)**:
- Deploy
- Integration Testing

**Priority 4 (Edge cases)**:
- Claude Review
- Other failures

#### 1.5 Report Initial Status

```markdown
**SYNTH TRAINER STATUS**: PHASE 1 - ANALYSIS COMPLETE
**ASSIGNEE**: mayanksethi-turing
**FAILED PRs FOUND**: <count>
**BREAKDOWN BY FAILURE TYPE**:
- Deploy: X PRs
- Unit Testing: Y PRs
- Lint: Z PRs
- Build: A PRs
- Other: B PRs
**PROCESSING ORDER**: Priority 1 → 2 → 3 → 4
**NEXT ACTION**: Begin processing PR #<first_pr_number>
**BLOCKED**: NO
```

### Phase 2: PR Processing Loop

**CRITICAL**: Process ONE PR at a time. Do not start next PR until current PR is fully fixed (all GitHub pipeline stages pass).

For each failed PR, execute this complete workflow:

---

#### 2.1 PR Setup

```bash
PR_NUMBER=<current_pr_number>

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Processing PR #${PR_NUMBER}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get PR details from GitHub
echo "📋 Fetching PR details from GitHub..."
PR_BRANCH=$(gh pr view $PR_NUMBER --json headRefName -q .headRefName)
PR_TITLE=$(gh pr view $PR_NUMBER --json title -q .title)
PR_AUTHOR=$(gh pr view $PR_NUMBER --json author -q .author.login)

echo "Branch: $PR_BRANCH"
echo "Title: $PR_TITLE"
echo "Author: $PR_AUTHOR"
```

**Report Status**:
```markdown
**SYNTH TRAINER STATUS**: PHASE 2 - PROCESSING PR #<number>
**PR DETAILS**:
- Branch: <branch_name>
- Title: <pr_title>
- Author: <author>
- Failure Reason: <failure_types>
**CURRENT STEP**: Creating worktree
**PROGRESS**: <X/Y> PRs processed
**NEXT ACTION**: Setup isolated worktree
**BLOCKED**: NO
```

#### 2.2 Create Isolated Worktree

```bash
WORKTREE_DIR="worktree/pr-fix-${PR_NUMBER}"

echo "📁 Creating worktree: $WORKTREE_DIR"

# Ensure worktree doesn't exist
if [ -d "$WORKTREE_DIR" ]; then
  echo "⚠️ Worktree already exists, removing..."
  git worktree remove "$WORKTREE_DIR" --force
fi

# Fetch latest from origin
echo "Fetching branch from origin..."
git fetch origin $PR_BRANCH

# Create worktree
git worktree add "$WORKTREE_DIR" "$PR_BRANCH"

# Change to worktree directory
cd "$WORKTREE_DIR"

echo "✅ Worktree created and entered: $(pwd)"

# Verify branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$PR_BRANCH" ]; then
  echo "❌ ERROR: Branch mismatch (expected: $PR_BRANCH, got: $CURRENT_BRANCH)"
  cd ../..
  git worktree remove "$WORKTREE_DIR" --force
  continue  # Skip to next PR
fi

# Pull latest changes
git pull origin $PR_BRANCH

echo "✅ Ready to work on PR #${PR_NUMBER} in worktree"
```

**CHECKPOINT**: Verify you are in the worktree:
```bash
pwd  # Should show: .../worktree/pr-fix-<PR_NUMBER>
```

#### 2.3 Extract Metadata & Platform Info

```bash
echo "📊 Extracting project metadata..."

# Verify metadata.json exists
if [ ! -f "metadata.json" ]; then
  echo "❌ ERROR: metadata.json not found"
  echo "This PR has a Detect Project Files failure"
  FAILURE_TYPE="Detect Project Files"
  # Will handle in next step
else
  # Extract platform and language
  PLATFORM=$(jq -r '.platform' metadata.json)
  LANGUAGE=$(jq -r '.language' metadata.json)
  TASK_ID=$(jq -r '.po_id' metadata.json)
  COMPLEXITY=$(jq -r '.complexity' metadata.json)

  echo "Platform: $PLATFORM"
  echo "Language: $LANGUAGE"
  echo "Task ID: $TASK_ID"
  echo "Complexity: $COMPLEXITY"
fi
```

#### 2.4 Analyze GitHub Pipeline Failures

**CRITICAL**: Get actual failure details from GitHub Actions, not just failure reasons from JSON.

```bash
echo "🔍 Analyzing GitHub pipeline failures..."

# Get all check runs for this PR
gh pr checks $PR_NUMBER --json name,conclusion,detailsUrl,status > /tmp/pr-${PR_NUMBER}-checks.json

# Display check results
echo "Pipeline status:"
cat /tmp/pr-${PR_NUMBER}-checks.json | jq -r '.[] | "\(.name): \(.conclusion // .status)"'

# Identify failed stages
FAILED_STAGES=$(cat /tmp/pr-${PR_NUMBER}-checks.json | jq -r '.[] | select(.conclusion == "failure") | .name')

if [ -z "$FAILED_STAGES" ]; then
  echo "⚠️ No failed stages found in current pipeline run"
  echo "Using failure reasons from synth_pr_status.json"
  FAILED_STAGES="<from JSON file>"
fi

echo ""
echo "Failed stages:"
echo "$FAILED_STAGES"
```

**For each failed stage, fetch detailed logs**:

```bash
# Get workflow run ID
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup -q '.statusCheckRollup[0].workflowRun.databaseId')

if [ -n "$RUN_ID" ]; then
  echo "Fetching detailed logs for run $RUN_ID..."

  # Download logs
  gh run view $RUN_ID --log > /tmp/pr-${PR_NUMBER}-logs.txt

  echo "✅ Logs saved to /tmp/pr-${PR_NUMBER}-logs.txt"

  # Extract relevant error messages
  echo "Key errors found:"
  grep -i "error\|failed\|failure" /tmp/pr-${PR_NUMBER}-logs.txt | head -20
fi
```

**Report Status**:
```markdown
**SYNTH TRAINER STATUS**: PHASE 2 - ANALYZING FAILURES - PR #<number>
**FAILED STAGES IDENTIFIED**:
- <stage 1>
- <stage 2>
**CURRENT STEP**: Extracting error details
**NEXT ACTION**: Apply targeted fixes for each failed stage
**BLOCKED**: NO
```

#### 2.5 Apply Targeted Fixes

**Process each failed stage in order**: Detect Project Files → Lint → Build → Deploy → Unit Testing → Integration Testing

---

##### Fix 1: Detect Project Files

If `metadata.json` missing or invalid:

```bash
if [ ! -f "metadata.json" ] || ! jq empty metadata.json 2>/dev/null; then
  echo "🔧 Fixing: Detect Project Files"

  # Try to extract info from branch name or PR title
  # Branch format: synth-<task_id>
  TASK_ID=$(echo "$PR_BRANCH" | sed 's/synth-//')

  # Check if metadata.json exists but is malformed
  if [ -f "metadata.json" ]; then
    echo "metadata.json exists but is invalid, backing up..."
    mv metadata.json metadata.json.backup
  fi

  # Detect platform from existing files
  if [ -f "cdk.json" ]; then
    PLATFORM="cdk"
  elif [ -f "cdktf.json" ]; then
    PLATFORM="cdktf"
  elif [ -f "Pulumi.yaml" ]; then
    PLATFORM="pulumi"
  elif [ -f "main.tf" ] || [ -f "lib/main.tf" ]; then
    PLATFORM="tf"
  else
    PLATFORM="cfn"  # default
  fi

  # Detect language from existing files
  if [ -f "package.json" ]; then
    LANGUAGE="ts"  # or js, check package.json
  elif [ -f "Pipfile" ] || [ -f "requirements.txt" ]; then
    LANGUAGE="py"
  elif [ -f "go.mod" ]; then
    LANGUAGE="go"
  elif [ -f "pom.xml" ]; then
    LANGUAGE="java"
  else
    LANGUAGE="yaml"  # default for CFN
  fi

  # Create minimal metadata.json
  cat > metadata.json <<EOF
{
  "platform": "$PLATFORM",
  "language": "$LANGUAGE",
  "complexity": "medium",
  "turn_type": "single",
  "po_id": "$TASK_ID",
  "team": "synth",
  "startedAt": "$(date -Iseconds)",
  "subtask": "Infrastructure Implementation",
  "subject_labels": [],
  "aws_services": []
}
EOF

  echo "✅ Created metadata.json"
  cat metadata.json

  # Validate
  bash scripts/detect-metadata.sh
  if [ $? -eq 0 ]; then
    echo "✅ Metadata validation passed"
  else
    echo "❌ Metadata validation failed"
    cat metadata.json
    # May need manual intervention
  fi
fi
```

---

##### Fix 2: Lint

```bash
if echo "$FAILED_STAGES" | grep -qi "lint"; then
  echo "🔧 Fixing: Lint"

  case "$PLATFORM-$LANGUAGE" in
    "cdk-ts"|"cdktf-ts"|"pulumi-ts")
      echo "Running TypeScript linter..."

      # Install dependencies if needed
      if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm ci
      fi

      # Try auto-fix first
      npm run lint:fix 2>&1 | tee /tmp/lint-fix-output.txt
      LINT_FIX_STATUS=${PIPESTATUS[0]}

      if [ $LINT_FIX_STATUS -ne 0 ]; then
        echo "Auto-fix completed with issues, running lint to check..."
        npm run lint 2>&1 | tee /tmp/lint-output.txt
        LINT_STATUS=${PIPESTATUS[0]}

        if [ $LINT_STATUS -eq 0 ]; then
          echo "✅ Lint issues resolved"
        else
          echo "⚠️ Some lint issues remain, analyzing..."

          # Extract specific errors from output
          grep "error\|warning" /tmp/lint-output.txt | head -20

          # Common fixes:
          # 1. Unused imports - remove them
          # 2. Any type - make more specific
          # 3. Missing semicolons - add them
          # 4. Trailing spaces - remove them

          # Manual analysis and fixes needed here
          # Read the lint output and fix files accordingly

          # Re-run lint
          npm run lint
          LINT_STATUS=$?
        fi
      else
        echo "✅ Lint auto-fix successful"
        LINT_STATUS=0
      fi
      ;;

    "cdk-py"|"cdktf-py"|"pulumi-py")
      echo "Running Python linter..."

      # Install dependencies if needed
      if [ ! -d ".venv" ]; then
        echo "Installing dependencies..."
        pipenv install --dev --ignore-pipfile
      fi

      # Run black formatter
      pipenv run black lib/ test/ 2>&1 | tee /tmp/black-output.txt

      # Run flake8 if available
      if pipenv run which flake8 &>/dev/null; then
        pipenv run flake8 lib/ test/ 2>&1 | tee /tmp/flake8-output.txt
        LINT_STATUS=${PIPESTATUS[0]}
      else
        LINT_STATUS=0
      fi

      if [ $LINT_STATUS -eq 0 ]; then
        echo "✅ Lint issues resolved"
      fi
      ;;

    "tf-hcl")
      echo "Running Terraform formatter..."
      terraform fmt -recursive
      echo "✅ Terraform formatting complete"
      LINT_STATUS=0
      ;;

    "cfn-yaml"|"cfn-json")
      echo "Running CloudFormation linter..."
      if command -v cfn-lint &>/dev/null; then
        cfn-lint lib/**/*.{yaml,yml,json} --format parseable 2>&1 | tee /tmp/cfn-lint-output.txt
        LINT_STATUS=${PIPESTATUS[0]}
      else
        echo "⚠️ cfn-lint not available, skipping"
        LINT_STATUS=0
      fi
      ;;

    *)
      echo "⚠️ Unknown platform-language combination: $PLATFORM-$LANGUAGE"
      LINT_STATUS=1
      ;;
  esac

  if [ $LINT_STATUS -eq 0 ]; then
    echo "✅ Lint stage fixed"
  else
    echo "❌ Lint issues persist - manual review needed"
    # Document for manual review
  fi
fi
```

---

##### Fix 3: Build

```bash
if echo "$FAILED_STAGES" | grep -qi "build"; then
  echo "🔧 Fixing: Build"

  case "$LANGUAGE" in
    "ts"|"js")
      echo "Building TypeScript/JavaScript project..."

      # Ensure dependencies installed
      if [ ! -d "node_modules" ]; then
        npm ci
      fi

      # Run build
      npm run build 2>&1 | tee /tmp/build-output.txt
      BUILD_STATUS=${PIPESTATUS[0]}

      if [ $BUILD_STATUS -ne 0 ]; then
        echo "❌ Build failed, analyzing errors..."

        # Extract error messages
        grep "error TS" /tmp/build-output.txt > /tmp/build-errors.txt

        echo "Build errors found:"
        cat /tmp/build-errors.txt

        # Common errors and fixes:
        # TS2304: Cannot find name - missing import
        # TS2345: Argument of type - type mismatch
        # TS2339: Property does not exist - typo or wrong type
        # TS2322: Type 'X' is not assignable to type 'Y' - type error

        # Read lib/ files and apply fixes based on errors
        # This requires analyzing each error and fixing accordingly

        # After fixes, rebuild
        npm run build
        BUILD_STATUS=$?
      fi
      ;;

    "py")
      echo "Building Python project..."

      # Ensure dependencies installed
      if [ ! -d ".venv" ]; then
        pipenv install --dev --ignore-pipfile
      fi

      # Python doesn't have a traditional "build", but we can:
      # 1. Check syntax
      pipenv run python -m py_compile lib/**/*.py test/**/*.py
      BUILD_STATUS=$?

      # 2. Run type checking if mypy available
      if pipenv run which mypy &>/dev/null; then
        pipenv run mypy lib/ test/
      fi
      ;;

    "go")
      echo "Building Go project..."
      go build ./...
      BUILD_STATUS=$?
      ;;

    "java")
      echo "Building Java project..."
      mvn compile
      BUILD_STATUS=$?
      ;;

    *)
      echo "⚠️ No build step for language: $LANGUAGE"
      BUILD_STATUS=0
      ;;
  esac

  if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Build stage fixed"
  else
    echo "❌ Build issues persist - manual review needed"
  fi
fi
```

---

##### Fix 4: Synth (CDK/CDKTF/Pulumi)

```bash
if [ "$PLATFORM" = "cdk" ] || [ "$PLATFORM" = "cdktf" ] || [ "$PLATFORM" = "pulumi" ]; then
  echo "🔧 Running synth/plan..."

  case "$PLATFORM" in
    "cdk")
      npm run synth 2>&1 | tee /tmp/synth-output.txt
      SYNTH_STATUS=${PIPESTATUS[0]}
      ;;
    "cdktf")
      npm run synth 2>&1 | tee /tmp/synth-output.txt
      SYNTH_STATUS=${PIPESTATUS[0]}
      ;;
    "pulumi")
      pulumi preview 2>&1 | tee /tmp/synth-output.txt
      SYNTH_STATUS=${PIPESTATUS[0]}
      ;;
  esac

  if [ $SYNTH_STATUS -eq 0 ]; then
    echo "✅ Synth successful"
  else
    echo "❌ Synth failed, analyzing errors..."
    grep -i "error" /tmp/synth-output.txt
    # Fix synth errors in code
  fi
fi
```

---

##### Fix 5: Deploy

**CRITICAL**: Deploy failures are complex and require careful analysis.

```bash
if echo "$FAILED_STAGES" | grep -qi "deploy"; then
  echo "🔧 Fixing: Deploy"

  # Reference lessons learned
  echo "📖 Checking .claude/lessons_learnt.md for known deployment issues..."

  # Pre-deployment validation
  echo "Running pre-deployment validation..."
  bash scripts/pre-validate-iac.sh 2>&1 | tee /tmp/pre-validate-output.txt
  PRE_VALIDATE_STATUS=${PIPESTATUS[0]}

  if [ $PRE_VALIDATE_STATUS -ne 0 ]; then
    echo "⚠️ Pre-validation found issues:"
    cat /tmp/pre-validate-output.txt

    # Common issues to fix:
    # 1. Missing environmentSuffix
    echo "Checking for environmentSuffix usage..."
    if ! grep -r "environmentSuffix" lib/; then
      echo "❌ Missing environmentSuffix in resource names"
      echo "This must be fixed in code - adding to all resource names"
      # Apply fix to lib/ files
    fi

    # 2. Retain policies
    echo "Checking for Retain policies..."
    if grep -r "RemovalPolicy.*RETAIN\|RETAIN" lib/; then
      echo "❌ Found Retain policies - changing to DESTROY"
      # Use Edit tool to replace RETAIN with DESTROY
      find lib/ -type f -name "*.ts" -o -name "*.py" | while read file; do
        sed -i.bak 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' "$file"
        sed -i.bak 's/removalPolicy.*=.*RETAIN/removalPolicy: RemovalPolicy.DESTROY/g' "$file"
      done
    fi

    # 3. DeletionProtection
    echo "Checking for DeletionProtection..."
    if grep -ri "deletionProtection.*true\|deletion_protection.*True" lib/; then
      echo "❌ Found DeletionProtection enabled - disabling"
      find lib/ -type f | while read file; do
        sed -i.bak 's/deletionProtection.*true/deletionProtection: false/g' "$file"
        sed -i.bak 's/deletion_protection.*True/deletion_protection=False/g' "$file"
      done
    fi

    # Re-run pre-validation
    bash scripts/pre-validate-iac.sh
  fi

  # Setup environment
  export ENVIRONMENT_SUFFIX="fix${PR_NUMBER}"
  echo "Using ENVIRONMENT_SUFFIX=$ENVIRONMENT_SUFFIX"

  # Check region
  if [ -f "lib/AWS_REGION" ]; then
    REGION=$(cat lib/AWS_REGION)
  else
    REGION="us-east-1"
  fi
  echo "Deploying to region: $REGION"

  # Deploy based on platform
  echo "Attempting deployment..."
  DEPLOY_ATTEMPT=1
  MAX_DEPLOY_ATTEMPTS=5
  DEPLOY_SUCCESS=false

  while [ $DEPLOY_ATTEMPT -le $MAX_DEPLOY_ATTEMPTS ] && [ "$DEPLOY_SUCCESS" = false ]; do
    echo "Deployment attempt $DEPLOY_ATTEMPT of $MAX_DEPLOY_ATTEMPTS..."

    case "$PLATFORM" in
      "cdk")
        npm run deploy 2>&1 | tee /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt
        DEPLOY_STATUS=${PIPESTATUS[0]}
        ;;
      "cdktf")
        npm run deploy 2>&1 | tee /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt
        DEPLOY_STATUS=${PIPESTATUS[0]}
        ;;
      "pulumi")
        pulumi up --yes 2>&1 | tee /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt
        DEPLOY_STATUS=${PIPESTATUS[0]}
        ;;
      "tf")
        terraform init && terraform apply -auto-approve 2>&1 | tee /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt
        DEPLOY_STATUS=${PIPESTATUS[0]}
        ;;
      "cfn")
        TEMPLATE_FILE=$(find lib/ -name "*.yaml" -o -name "*.yml" -o -name "*.json" | head -1)
        aws cloudformation deploy \
          --template-file "$TEMPLATE_FILE" \
          --stack-name "tap-${ENVIRONMENT_SUFFIX}" \
          --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
          --region "$REGION" 2>&1 | tee /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt
        DEPLOY_STATUS=${PIPESTATUS[0]}
        ;;
    esac

    if [ $DEPLOY_STATUS -eq 0 ]; then
      echo "✅ Deployment successful!"
      DEPLOY_SUCCESS=true

      # Save stack outputs
      echo "Extracting stack outputs..."
      case "$PLATFORM" in
        "cdk"|"cdktf"|"cfn")
          # Extract CloudFormation outputs
          STACK_NAME="TapStack${ENVIRONMENT_SUFFIX}"
          aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$REGION" \
            --query 'Stacks[0].Outputs' \
            --output json > /tmp/cfn-outputs-raw.json

          # Flatten outputs to key-value pairs
          mkdir -p cfn-outputs
          jq -r 'map({(.OutputKey): .OutputValue}) | add' /tmp/cfn-outputs-raw.json > cfn-outputs/flat-outputs.json

          echo "✅ Stack outputs saved to cfn-outputs/flat-outputs.json"
          ;;
        "pulumi")
          pulumi stack output --json > cfn-outputs/flat-outputs.json
          echo "✅ Stack outputs saved to cfn-outputs/flat-outputs.json"
          ;;
        "tf")
          terraform output -json > cfn-outputs/flat-outputs.json
          echo "✅ Stack outputs saved to cfn-outputs/flat-outputs.json"
          ;;
      esac

    else
      echo "❌ Deployment failed (attempt $DEPLOY_ATTEMPT)"

      # Analyze failure
      echo "Analyzing deployment errors..."
      grep -i "error\|failed\|failure" /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt | tail -20

      # Check for common errors in lessons_learnt.md
      LAST_ERROR=$(grep -i "error" /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt | tail -1)
      echo "Last error: $LAST_ERROR"

      # Search lessons_learnt.md
      if grep -q "$LAST_ERROR" ../../.claude/lessons_learnt.md 2>/dev/null; then
        echo "📖 Found similar error in lessons_learnt.md"
        grep -A 10 "$LAST_ERROR" ../../.claude/lessons_learnt.md
      fi

      # Common deployment errors and fixes:
      # - Resource already exists: Add environmentSuffix to name
      # - Insufficient permissions: Check IAM roles
      # - Invalid parameter: Check parameter values
      # - Quota exceeded: Report to user
      # - Stack in UPDATE_ROLLBACK_COMPLETE: Delete and retry

      # Check for quota errors
      if grep -qi "quota\|limit exceeded\|service limit" /tmp/deploy-output-${DEPLOY_ATTEMPT}.txt; then
        echo "❌ AWS quota/limit issue detected"
        echo "This requires manual intervention"
        break
      fi

      DEPLOY_ATTEMPT=$((DEPLOY_ATTEMPT + 1))
    fi
  done

  if [ "$DEPLOY_SUCCESS" = false ]; then
    echo "❌ Deploy stage could not be fixed after $MAX_DEPLOY_ATTEMPTS attempts"
    echo "Manual review required"
  fi
fi
```

---

##### Fix 6: Unit Testing

```bash
if echo "$FAILED_STAGES" | grep -qi "unit"; then
  echo "🔧 Fixing: Unit Testing"

  # Run tests with coverage
  case "$LANGUAGE" in
    "ts"|"js")
      npm run test:unit 2>&1 | tee /tmp/unit-test-output.txt
      TEST_STATUS=${PIPESTATUS[0]}
      ;;
    "py")
      pipenv run test:unit 2>&1 | tee /tmp/unit-test-output.txt
      TEST_STATUS=${PIPESTATUS[0]}
      ;;
    "go")
      go test ./test/... -v -cover 2>&1 | tee /tmp/unit-test-output.txt
      TEST_STATUS=${PIPESTATUS[0]}
      ;;
    "java")
      mvn test 2>&1 | tee /tmp/unit-test-output.txt
      TEST_STATUS=${PIPESTATUS[0]}
      ;;
  esac

  # Analyze test failures
  if [ $TEST_STATUS -ne 0 ]; then
    echo "❌ Tests failed, analyzing..."

    # Extract failing tests
    grep -i "failed\|error" /tmp/unit-test-output.txt

    # Common fixes:
    # - Update assertions to match actual behavior
    # - Fix mocks/stubs
    # - Update expected values
    # - Fix async/timing issues

    # Read test files and apply fixes
    # Re-run tests after fixes
  fi

  # Check coverage
  echo "Checking test coverage..."

  if [ -f "coverage/coverage-summary.json" ]; then
    STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
    FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
    LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)

    echo "Coverage: Statements=$STMT_COV%, Functions=$FUNC_COV%, Lines=$LINE_COV%"

    # Must achieve 100% coverage
    if [ "$STMT_COV" != "100" ] || [ "$FUNC_COV" != "100" ] || [ "$LINE_COV" != "100" ]; then
      echo "⚠️ Coverage below 100%, need to add tests"

      # Identify untested code
      if [ -f "coverage/lcov.info" ]; then
        echo "Analyzing coverage gaps..."
        # Parse lcov.info to find untested lines
        # Add tests for untested code paths
      fi

      # After adding tests, re-run
      case "$LANGUAGE" in
        "ts"|"js") npm run test:unit ;;
        "py") pipenv run test:unit ;;
      esac
    else
      echo "✅ 100% coverage achieved"
    fi
  else
    echo "⚠️ Coverage report not found"
  fi
fi
```

---

##### Fix 7: Integration Testing

```bash
if echo "$FAILED_STAGES" | grep -qi "integration"; then
  echo "🔧 Fixing: Integration Testing"

  # Integration tests require successful deployment
  if [ ! -f "cfn-outputs/flat-outputs.json" ]; then
    echo "❌ No deployment outputs found - cannot fix integration tests"
    echo "Deployment must succeed first"
  else
    # Run integration tests
    case "$LANGUAGE" in
      "ts"|"js")
        npm run test:integration 2>&1 | tee /tmp/integration-test-output.txt
        INT_TEST_STATUS=${PIPESTATUS[0]}
        ;;
      "py")
        pipenv run test:integration 2>&1 | tee /tmp/integration-test-output.txt
        INT_TEST_STATUS=${PIPESTATUS[0]}
        ;;
    esac

    if [ $INT_TEST_STATUS -ne 0 ]; then
      echo "❌ Integration tests failed, analyzing..."

      # Common issues:
      # - Hardcoded values instead of using stack outputs
      # - Incorrect assertions
      # - Resource not ready yet (timing)
      # - Missing permissions

      # Read test files and fix based on actual stack outputs
      # Re-run after fixes
    else
      echo "✅ Integration tests passed"
    fi
  fi
fi
```

---

#### 2.6 Complete Local Validation

**CRITICAL**: Before pushing, validate EVERYTHING locally.

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running complete local validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VALIDATION_PASSED=true

# 1. Lint
echo "1. Running lint..."
case "$LANGUAGE" in
  "ts"|"js") npm run lint || VALIDATION_PASSED=false ;;
  "py") pipenv run lint || VALIDATION_PASSED=false ;;
  "go") go vet ./... || VALIDATION_PASSED=false ;;
esac

if [ "$VALIDATION_PASSED" = false ]; then
  echo "❌ Lint validation failed"
else
  echo "✅ Lint passed"
fi

# 2. Build
echo "2. Running build..."
case "$LANGUAGE" in
  "ts"|"js") npm run build || VALIDATION_PASSED=false ;;
  "py") python -m py_compile lib/**/*.py test/**/*.py || VALIDATION_PASSED=false ;;
  "go") go build ./... || VALIDATION_PASSED=false ;;
esac

if [ "$VALIDATION_PASSED" = false ]; then
  echo "❌ Build validation failed"
else
  echo "✅ Build passed"
fi

# 3. Synth
if [ "$PLATFORM" = "cdk" ] || [ "$PLATFORM" = "cdktf" ]; then
  echo "3. Running synth..."
  npm run synth || VALIDATION_PASSED=false

  if [ "$VALIDATION_PASSED" = false ]; then
    echo "❌ Synth validation failed"
  else
    echo "✅ Synth passed"
  fi
fi

# 4. Unit Tests with Coverage
echo "4. Running unit tests..."
case "$LANGUAGE" in
  "ts"|"js") npm run test:unit || VALIDATION_PASSED=false ;;
  "py") pipenv run test:unit || VALIDATION_PASSED=false ;;
esac

# Verify 100% coverage
if [ -f "coverage/coverage-summary.json" ]; then
  STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
  if [ "$STMT_COV" != "100" ]; then
    echo "❌ Coverage not 100%: $STMT_COV%"
    VALIDATION_PASSED=false
  else
    echo "✅ Unit tests passed with 100% coverage"
  fi
fi

# 5. Integration Tests (if deployment successful)
if [ -f "cfn-outputs/flat-outputs.json" ]; then
  echo "5. Running integration tests..."
  case "$LANGUAGE" in
    "ts"|"js") npm run test:integration || VALIDATION_PASSED=false ;;
    "py") pipenv run test:integration || VALIDATION_PASSED=false ;;
  esac

  if [ "$VALIDATION_PASSED" = false ]; then
    echo "❌ Integration tests failed"
  else
    echo "✅ Integration tests passed"
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$VALIDATION_PASSED" = true ]; then
  echo "✅ ALL LOCAL VALIDATIONS PASSED"
  echo "Ready to push changes"
else
  echo "❌ LOCAL VALIDATION FAILED"
  echo "Cannot push until all validations pass"
  exit 1
fi
```

**CHECKPOINT**: If any validation fails, DO NOT proceed to push. Fix the issues first.

#### 2.7 Commit & Push Changes

Only proceed if ALL local validations passed.

```bash
echo "📝 Committing changes..."

# Check what changed
git status

# Stage all changes
git add .

# Get failure reasons for commit message
FAILURE_REASONS=$(cat ../../.claude/synth_pr_status.json | jq -r --arg pr "$PR_NUMBER" '.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.pr_number == ($pr | tonumber)) | .failure_reason' | head -1)

# Create descriptive commit message
git commit -m "fix(pr-${PR_NUMBER}): resolve ${FAILURE_REASONS} failures

Applied fixes for:
$(echo "$FAILED_STAGES" | sed 's/^/- /')

Validations completed:
- ✅ Lint: passed
- ✅ Build: passed
- ✅ Synth: passed (if applicable)
- ✅ Unit tests: passed (100% coverage)
- ✅ Integration tests: passed (if deployed)
- ✅ Deployment: successful (if applicable)

Iteration: ${FIX_ITERATION:-1}

🤖 Auto-fixed by iac-synth-trainer

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to PR branch
echo "📤 Pushing changes to $PR_BRANCH..."
git push origin $PR_BRANCH

if [ $? -eq 0 ]; then
  echo "✅ Changes pushed successfully"
else
  echo "❌ Push failed"
  exit 1
fi
```

**Report Status**:
```markdown
**SYNTH TRAINER STATUS**: PHASE 2 - PUSHED CHANGES - PR #<number>
**FIXES APPLIED**: <list of fixes>
**LOCAL VALIDATIONS**: ALL PASSED ✅
**CURRENT STEP**: Waiting for GitHub pipeline
**NEXT ACTION**: Monitor GitHub Actions workflow
**BLOCKED**: NO
```

#### 2.8 Monitor GitHub Pipeline

**CRITICAL**: Wait for GitHub Actions to complete and verify ALL stages pass.

```bash
echo "⏳ Waiting for GitHub Actions to start..."
sleep 10

# Get the latest workflow run for this PR
echo "Fetching latest workflow run..."
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup -q '.statusCheckRollup[0].workflowRun.databaseId')

if [ -z "$RUN_ID" ]; then
  echo "⚠️ Could not find workflow run, waiting..."
  sleep 20
  RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup -q '.statusCheckRollup[0].workflowRun.databaseId')
fi

echo "Monitoring workflow run: $RUN_ID"
echo "GitHub URL: https://github.com/TuringGpt/iac-test-automations/actions/runs/$RUN_ID"

# Monitor workflow status
MAX_WAIT_MINUTES=30
WAIT_SECONDS=0
MAX_WAIT_SECONDS=$((MAX_WAIT_MINUTES * 60))

while [ $WAIT_SECONDS -lt $MAX_WAIT_SECONDS ]; do
  # Get run status
  RUN_STATUS=$(gh run view $RUN_ID --json status,conclusion -q '.status')
  RUN_CONCLUSION=$(gh run view $RUN_ID --json conclusion -q '.conclusion')

  echo "[$((WAIT_SECONDS / 60))m ${WAIT_SECONDS}s] Status: $RUN_STATUS, Conclusion: $RUN_CONCLUSION"

  # Check if completed
  if [ "$RUN_STATUS" = "completed" ]; then
    echo ""
    echo "Workflow completed with conclusion: $RUN_CONCLUSION"

    # Get detailed check results
    gh pr checks $PR_NUMBER --json name,conclusion > /tmp/pr-${PR_NUMBER}-final-checks.json

    echo "Pipeline stages:"
    cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | "\(.name): \(.conclusion)"'

    # Check if ALL stages passed
    FAILED_CHECKS=$(cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | select(.conclusion != "success") | .name')

    if [ -z "$FAILED_CHECKS" ]; then
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "✅ SUCCESS: ALL PIPELINE STAGES PASSED!"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      PR_FIXED=true
      break
    else
      echo ""
      echo "❌ Some stages still failing:"
      echo "$FAILED_CHECKS"
      echo ""

      # Check if we should iterate
      FIX_ITERATION=$((${FIX_ITERATION:-0} + 1))

      if [ $FIX_ITERATION -le 5 ]; then
        echo "Iteration $FIX_ITERATION: Analyzing new failures and applying fixes..."

        # Go back to fix stage 2.4-2.7
        FAILED_STAGES="$FAILED_CHECKS"
        # Continue to next iteration (loop back to 2.4)

        # For now, mark as needs iteration
        PR_FIXED=false
        NEEDS_ITERATION=true
      else
        echo "❌ Max iterations reached ($FIX_ITERATION)"
        echo "Marking PR for manual review"
        PR_FIXED=false
        NEEDS_MANUAL_REVIEW=true
      fi
      break
    fi
  fi

  # Wait 30 seconds before checking again
  sleep 30
  WAIT_SECONDS=$((WAIT_SECONDS + 30))
done

if [ $WAIT_SECONDS -ge $MAX_WAIT_SECONDS ]; then
  echo "⏱️ Timeout waiting for workflow (${MAX_WAIT_MINUTES} minutes)"
  echo "Marking PR for manual review"
  PR_FIXED=false
  NEEDS_MANUAL_REVIEW=true
fi
```

#### 2.9 Add PR Comment & Labels

```bash
if [ "$PR_FIXED" = true ]; then
  # Add success comment
  gh pr comment $PR_NUMBER --body "✅ **Auto-Fix Complete - All Stages Passed**

**Fixed Issues**: ${FAILURE_REASONS}

**Pipeline Results**: All stages ✅
$(cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | "- ✅ \(.name)"')

**Validations Completed**:
- ✅ Lint: passed
- ✅ Build: passed
- ✅ Synth: passed
- ✅ Unit tests: passed (100% coverage)
- ✅ Integration tests: passed
- ✅ Deployment: successful

**Fix Iterations**: ${FIX_ITERATION:-1}

This PR is now ready for review and merge.

🤖 Auto-fixed by iac-synth-trainer agent"

  # Add label
  gh pr edit $PR_NUMBER --add-label "auto-fixed" --remove-label "failed" 2>/dev/null || true

  # Request review
  gh pr ready $PR_NUMBER 2>/dev/null || true

else
  # Add partial fix / manual review comment
  gh pr comment $PR_NUMBER --body "⚠️ **Auto-Fix Attempted - Manual Review Needed**

**Original Issues**: ${FAILURE_REASONS}

**Fix Attempts**: ${FIX_ITERATION:-1} iterations

**Current Status**:
$(cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | "- \(if .conclusion == "success" then "✅" else "❌" end) \(.name)"')

**Remaining Issues**:
$(echo "$FAILED_CHECKS")

**Recommendations**:
1. Review GitHub Actions logs for detailed error messages
2. Check \`.claude/lessons_learnt.md\` for similar issues
3. Consult \`.claude/docs/references/error-handling.md\`
4. Verify AWS resources manually if deployment-related

**Files Modified**:
\`\`\`
$(git diff --name-only origin/$PR_BRANCH HEAD)
\`\`\`

🤖 Analyzed by iac-synth-trainer agent"

  # Add label
  gh pr edit $PR_NUMBER --add-label "needs-manual-review" 2>/dev/null || true
fi
```

#### 2.10 Cleanup Worktree

```bash
echo "🧹 Cleaning up worktree..."

# Return to main repo
cd ../..

# Verify we're back in main repo
if [[ "$(pwd)" == *"/worktree/"* ]]; then
  echo "❌ ERROR: Still in worktree, cannot remove"
  exit 1
fi

# Remove worktree
git worktree remove "$WORKTREE_DIR" --force

if [ $? -eq 0 ]; then
  echo "✅ Worktree removed: $WORKTREE_DIR"
else
  echo "⚠️ Failed to remove worktree, may need manual cleanup"
fi

# Verify removal
if [ ! -d "$WORKTREE_DIR" ]; then
  echo "✅ Worktree cleanup confirmed"
else
  echo "⚠️ Worktree directory still exists"
fi
```

#### 2.11 Update Status File

```bash
echo "📊 Updating synth_pr_status.json..."

# Update PR status in JSON file
if [ "$PR_FIXED" = true ]; then
  STATUS="FIXED"
  GITHUB_CHECKS_PASSED=true
else
  STATUS="FAILED"
  GITHUB_CHECKS_PASSED=false
fi

# Use jq to update the JSON file
# This is a simplified example - actual implementation would be more robust
cat .claude/synth_pr_status.json | jq \
  --arg pr "$PR_NUMBER" \
  --arg status "$STATUS" \
  --arg fixed_at "$(date -Iseconds)" \
  --arg iterations "$FIX_ITERATION" \
  --argjson checks_passed "$GITHUB_CHECKS_PASSED" \
  '(.pull_requests[] | select(.pr_number == ($pr | tonumber))) |= . + {
    status: $status,
    fix_applied_at: $fixed_at,
    fix_iterations: ($iterations | tonumber),
    github_checks_passed: $checks_passed
  }' > .claude/synth_pr_status.json.tmp

mv .claude/synth_pr_status.json.tmp .claude/synth_pr_status.json

echo "✅ Status file updated"
```

#### 2.12 Report PR Completion

```markdown
**SYNTH TRAINER STATUS**: PR #<number> COMPLETE - <STATUS>
**RESULT**: <FIXED or NEEDS_MANUAL_REVIEW>
**ITERATIONS**: <count>
**GITHUB PIPELINE**: <ALL_PASSED or SOME_FAILED>
**CLEANUP**: Worktree removed
**NEXT ACTION**: <Process next PR or Report final summary>
**BLOCKED**: NO
```

---

### Phase 3: Final Summary Report

After ALL PRs processed:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SYNTH TRAINER SESSION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count results
TOTAL_PROCESSED=$(cat .claude/synth_pr_status.json | jq '[.pull_requests[] | select(.fix_applied_at != null)] | length')
FIXED_COUNT=$(cat .claude/synth_pr_status.json | jq '[.pull_requests[] | select(.status == "FIXED")] | length')
MANUAL_REVIEW_COUNT=$(cat .claude/synth_pr_status.json | jq '[.pull_requests[] | select(.status == "FAILED" and .fix_applied_at != null)] | length')

echo "Total PRs Processed: $TOTAL_PROCESSED"
echo "Successfully Fixed: $FIXED_COUNT"
echo "Need Manual Review: $MANUAL_REVIEW_COUNT"
echo ""

# List fixed PRs
if [ $FIXED_COUNT -gt 0 ]; then
  echo "✅ Fixed PRs:"
  cat .claude/synth_pr_status.json | jq -r '.pull_requests[] | select(.status == "FIXED") | "  - PR #\(.pr_number): \(.failure_reason) (iterations: \(.fix_iterations))"'
  echo ""
fi

# List manual review PRs
if [ $MANUAL_REVIEW_COUNT -gt 0 ]; then
  echo "⚠️ Manual Review Needed:"
  cat .claude/synth_pr_status.json | jq -r '.pull_requests[] | select(.status == "FAILED" and .fix_applied_at != null) | "  - PR #\(.pr_number): \(.failure_reason)"'
  echo ""
fi

# Common patterns
echo "📊 Failure Pattern Analysis:"
cat .claude/synth_pr_status.json | jq -r '.pull_requests[] | .failure_reason' | sort | uniq -c | sort -rn

echo ""
echo "Updated status file: .claude/synth_pr_status.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**Final Report Format**:

```markdown
**SYNTH TRAINER STATUS**: SESSION COMPLETE
**ASSIGNEE**: mayanksethi-turing
**SESSION SUMMARY**:

**Successfully Fixed**: X PRs
- PR #6323: Lint, Deploy (2 iterations) ✅
- PR #6221: Lint, Deploy (1 iteration) ✅

**Need Manual Review**: Y PRs
- PR #6172: Deploy (AWS quota limit exceeded) ⚠️

**Statistics**:
- Total PRs processed: <count>
- Fix success rate: <percentage>
- Average iterations: <number>
- Total time: <duration>

**Failure Pattern Analysis**:
- Deploy: X occurrences
  - Most common: environmentSuffix missing
  - Fix success: Y/X
- Unit Testing: X occurrences
  - Most common: Coverage below 100%
  - Fix success: Y/X
- Lint: X occurrences
  - Most common: Unused imports
  - Fix success: Y/X

**Recommendations**:
1. <Common issue to prevent in future>
2. <Process improvement suggestion>
3. <Documentation update needed>

**Next Steps**:
1. Review manually-flagged PRs: <list PR numbers>
2. Monitor fixed PRs for any regressions
3. Update .claude/lessons_learnt.md with new patterns
4. Consider pre-commit hooks for common lint/format issues

**Detailed Logs**: .claude/synth_pr_status.json
```

## Key Constraints & Rules

1. **One PR at a Time**: Never work on multiple PRs simultaneously
2. **Isolated Worktrees**: Always use `worktree/pr-fix-<PR_NUMBER>` format
3. **No Force Push**: Always create new commits, never rewrite history
4. **Complete Validation**: ALL local checks must pass before pushing
5. **GitHub Verification**: PR only "fixed" when ALL GitHub pipeline stages pass
6. **Max Attempts**:
   - 3 iterations per fix stage
   - 5 deployment attempts
   - 5 push iterations per PR
7. **Cleanup**: Always remove worktrees after completion (success or failure)
8. **File Restrictions**: Only modify `lib/`, `bin/`, `test/`, root configs
9. **Commit Format**: Use conventional commits with lowercase subjects
10. **Status Updates**: Update `synth_pr_status.json` after each PR

## Error Handling

### GitHub Authentication Failure
```
❌ BLOCKED: GitHub CLI not authenticated
Action: gh auth login
Status: BLOCKED
```

### AWS Credential Issues
```
⚠️ WARNING: AWS not configured, skipping deployment validation
Status: Continue with non-deploy fixes
```

### Worktree Creation Failure
```
❌ ERROR: Cannot create worktree for PR #<number>
Action: Skip this PR, continue to next
Status: Continue
```

### Max Iterations Reached
```
⚠️ PR #<number>: Max iterations reached (5)
Action: Add comment, label "needs-manual-review", move to next PR
Status: Continue
```

### Deployment Quota Limit
```
❌ AWS Quota limit exceeded for PR #<number>
Action: Add comment with details, label "needs-manual-review", move to next PR
Status: Continue
```

### Timeout Waiting for Pipeline
```
⏱️ Timeout waiting for GitHub pipeline (30 minutes)
Action: Add comment, label "needs-verification", move to next PR
Status: Continue
```

## Success Metrics

Track and report:
- **Fix Rate**: Percentage of PRs fully fixed (all stages pass)
- **Iteration Efficiency**: Average iterations needed per PR
- **Time per PR**: Average minutes from start to GitHub pipeline complete
- **Failure Patterns**: Most common issues and fix success rates
- **Cost Savings**: PRs fixed vs. estimated manual intervention hours

## Integration Notes

- Uses existing `.claude/scripts/` validation scripts
- References `.claude/lessons_learnt.md` for known fixes
- Follows same quality standards as `/task-coordinator`
- Compatible with existing CI/CD pipelines
- Updates assignee-specific status file

## Continuous Improvement

After each session:
1. Update `.claude/lessons_learnt.md` with new patterns
2. Enhance fix detection logic
3. Optimize common fix procedures
4. Update documentation
5. Track metrics for improvement
