---
name: synth-fixer
description: 🤖 SYNTH-AGENT - Fix PR until CI passes
---

# PR Fixer

This command fixes PRs until CI/CD passes.

## How to Use

```
/synth-fixer 8543
/synth-fixer <pr-number>
```

## Output Format - SYNTH-AGENT Branding

**ALWAYS use SYNTH-AGENT branding in all output messages:**

### Required Format

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🤖 SYNTH-AGENT [PR #<number>] is <action>...                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Log Format

```bash
echo "[SYNTH-AGENT] [PR #8539] <message>"
echo "[SYNTH-AGENT] [PR #8539] ✓ <success message>"
echo "[SYNTH-AGENT] [PR #8539] ✗ <error message>"
```

### Action Messages

| Action | Output |
|--------|--------|
| Setup | `🤖 SYNTH-AGENT [PR #8539] is setting up worktree...` |
| Check | `🤖 SYNTH-AGENT [PR #8539] is checking CI/CD status...` |
| Analyze | `🤖 SYNTH-AGENT [PR #8539] is analyzing error logs...` |
| Fix | `🤖 SYNTH-AGENT [PR #8539] is applying fixes...` |
| Commit | `🤖 SYNTH-AGENT [PR #8539] is committing changes...` |
| Push | `🤖 SYNTH-AGENT [PR #8539] is pushing to remote...` |
| Wait | `🤖 SYNTH-AGENT [PR #8539] is waiting for CI/CD...` |

## Restricted Files - DO NOT MODIFY

```
# ═══════════════════════════════════════════════════════════════
# DIRECTORIES - Completely forbidden
# ═══════════════════════════════════════════════════════════════
scripts/            ← CI/CD scripts - forbidden
.github/            ← workflow definitions
.claude/            ← agent configuration
config/             ← schema definitions
archive/            ← archived PRs
archive-localstack/ ← archived LocalStack PRs
cdktf.out/          ← CDKTF output
cfn-outputs/        ← CloudFormation outputs
cli/                ← CLI tools
coverage/           ← test coverage
.gen/               ← generated files
gradle/             ← Gradle wrapper
.husky/             ← Git hooks
node_modules/       ← dependencies
.pytest_cache/      ← Pytest cache
dist/               ← compiled output
.git/               ← version control

# ═══════════════════════════════════════════════════════════════
# ROOT FILES - NEVER modify these
# ═══════════════════════════════════════════════════════════════
# Docker
docker-compose.yml  ← Docker config
docker-compose.yaml ← Docker config
Dockerfile          ← Docker image
dockerEntryPoint.sh ← Docker entry
.dockerignore       ← Docker ignore

# Build & Package
build.gradle        ← Gradle build
gradle.properties   ← Gradle props
gradlew             ← Gradle wrapper
gradlew.bat         ← Gradle wrapper (Windows)
package.json        ← NO PERMISSION!
package-lock.json   ← NO PERMISSION!
Pipfile             ← Python deps
Pipfile.lock        ← Python lock

# Linting & Formatting
babel.config.js     ← Babel config
.babelrc            ← Babel config
commitlint.config.js← Commit lint
eslint.config.js    ← ESLint config
.eslintrc.js        ← ESLint config
.markdownlint.json  ← MD lint
.prettierrc         ← Prettier config
.pylintrc           ← Python lint
pytest.ini          ← Pytest config

# Environment & Version
.editorconfig       ← Editor config
.gitattributes      ← Git attributes
.gitignore          ← Git ignore
.node-version       ← Node version
.npmignore          ← NPM ignore
.npmrc              ← NPM config
.nvmrc              ← NVM config
.python-version     ← Python version
README.md           ← Main repo README
```

## Auto-Revert Protected Files

**IMPORTANT**: If protected file appears in PR "Files changed" → restore from main!

```bash
# Check for unwanted changes
changed=$(gh pr view $PR --json files -q '.files[].path')

# If protected file found, restore it
for file in docker-compose.yml Dockerfile .github/* scripts/*; do
  if echo "$changed" | grep -q "^$file$"; then
    echo "[SYNTH-AGENT] [PR #$PR] ⚠️ Protected file: $file"
    git checkout main -- "$file"
    echo "[SYNTH-AGENT] [PR #$PR] ✓ Restored: $file"
  fi
done

# Commit and push restoration
git add -A
git commit -m "Restore protected files from main"
git push
```

**Example:**
```
[SYNTH-AGENT] [PR #8543] ⚠️ Protected file: docker-compose.yml
[SYNTH-AGENT] [PR #8543] 🔄 Restoring from main...
[SYNTH-AGENT] [PR #8543] ✓ Restored: docker-compose.yml
[SYNTH-AGENT] [PR #8543] ✅ Pushed restoration
```

## Allowed Changes

```
lib/          ← source code here
test/         ← tests here
metadata.json ← task info
cdk.json      ← CDK settings
Pulumi.yaml   ← Pulumi settings
# ⚠️ PROTECTED - NO PERMISSION:
# - package.json, package-lock.json
# - tsconfig.json
# - requirements.txt, pyproject.toml
```

## Metadata Rules

**CRITICAL**: These values are MANDATORY in `metadata.json`:

```json
{
  "team": "synth",          // ⚠️ ONLY "synth" - nothing else!
  "provider": "localstack", // ALWAYS "localstack"
  "wave": "P0"              // ⚠️ NEW! Required - P0 or P1
}
```

**Team Rule:**
| ✅ Valid | ❌ Invalid (change to "synth") |
|----------|-------------------------------|
| `"synth"` | `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"` |
| | `"synth-1"`, `"synth-2"`, `"synth-3"` |
| | Any number or synth-X format |

**Wave Rule (NEW!):**
| ✅ Valid | ❌ Invalid (add "P0" default) |
|----------|------------------------------|
| `"P0"` | Missing field |
| `"P1"` | Any other value |

## Process

**1. Setup**
```bash
PR="$1"
REPO="/home/adnan/turing/iac-test-automations"
WORK="${REPO}/worktree/synth-fixer-${PR}"

# ⚠️ ALWAYS cd to repo first!
cd "$REPO" || exit 1
```

**2. FIRST: Pull main (BEFORE anything else!)**
```bash
echo "[SYNTH-AGENT] [PR #$PR] 🔄 Pulling latest main..."
cd "$REPO"
git checkout main
git pull origin main
echo "[SYNTH-AGENT] [PR #$PR] ✓ Main branch updated"
```

**3. Get branch info**
```bash
cd "$REPO"
BRANCH=$(gh pr view "$PR" --repo TuringGpt/iac-test-automations --json headRefName -q '.headRefName')
echo "[SYNTH-AGENT] [PR #$PR] Branch: $BRANCH"
```

**4. Create worktree**
```bash
[ -d "$WORK" ] && git worktree remove "$WORK" --force
git fetch origin "$BRANCH"
git worktree add "$WORK" "origin/$BRANCH"
cd "$WORK"
```

**5. Rebase on main (required)**
```bash
echo "[SYNTH-AGENT] [PR #$PR] 🔄 Rebasing on main..."
git fetch origin main
git rebase origin/main
git push origin HEAD:"$BRANCH" --force-with-lease
echo "[SYNTH-AGENT] [PR #$PR] ✓ Rebased and pushed"
```

**4.5. IMMEDIATE Protected Files Check (FIRST THING!)**

**CRITICAL**: As SOON as PR starts, BEFORE anything else:

```bash
echo "[SYNTH-AGENT] [PR #$PR] 🛡️ Checking for protected files..."

# Get PR changed files
PR_FILES=$(gh pr view $PR --json files -q '.files[].path')

# Protected patterns (ALL config files!)
PROTECTED="docker-compose|Dockerfile|build.gradle|gradlew|package.json|package-lock|tsconfig.json|requirements.txt|pyproject.toml|scripts/|.github/|config/|.claude/"

RESTORE=()
for file in $PR_FILES; do
  if echo "$file" | grep -qE "$PROTECTED"; then
    echo "[SYNTH-AGENT] [PR #$PR] ⚠️ PROTECTED: $file"
    RESTORE+=("$file")
  fi
done

# IMMEDIATELY restore from main
if [[ ${#RESTORE[@]} -gt 0 ]]; then
  echo "[SYNTH-AGENT] [PR #$PR] 🚨 Restoring ${#RESTORE[@]} files NOW!"
  for f in "${RESTORE[@]}"; do
    git checkout origin/main -- "$f" && echo "✓ $f"
  done
  git add -A
  git commit -m "Restore protected files from main"
  git push origin HEAD:"$BRANCH"
  echo "[SYNTH-AGENT] [PR #$PR] ✅ Restored and pushed!"
fi
```

**5. Check CI status**
```bash
RUN=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId')

# Jobs to MONITOR (must pass)
MONITORED="Detect Project Files|Validate Commit Message|Validate Jest Config|Claude Review: Prompt Quality|Build|Synth|Lint|Deploy|Unit Testing|Integration Tests|Claude Review|Claude Review: IDEAL_RESPONSE|Cleanup.*Destroy|Archive"

# Jobs to IGNORE (optional/skipped)
IGNORED="Upload Task to S3|Cleanup.*PR Closed|Semantic Release|CICD Pipeline|Infracost|IaC Optimization|Analysis|Debug Claude|submit-pypi"

# Get jobs and filter
JOBS=$(gh run view "$RUN" --json jobs -q '.jobs[]')
ERRORS=$(gh run view "$RUN" --log-failed 2>&1 | head -200)
```

**Job Filtering Rules:**

| ✅ Monitor (MUST pass) | ❌ Ignore (skip) |
|------------------------|------------------|
| Detect Project Files | Upload Task to S3 |
| Validate Commit Message | Cleanup (PR Closed) |
| Validate Jest Config | Semantic Release |
| **Claude Review: Prompt Quality** (NEW!) | CICD Pipeline Optimization |
| Build | Infracost |
| Synth | IaC Optimization |
| Lint | Analysis |
| Deploy | Debug Claude outputs |
| Unit Testing | submit-pypi |
| Integration Tests (Live) | |
| **Claude Review** | |
| Cleanup (Destroy Resources) | |
| **Claude Review: IDEAL_RESPONSE** (NEW!) | |
| Archive Folders and Reset Repo | |

**6. Apply fixes**

Based on error, apply appropriate fix:
- metadata invalid → fix metadata.json
- **Prompt Quality FAILED** → fix lib/PROMPT.md (see below)
- build fail → fix code in lib/
- lint error → fix formatting
- test fail → fix in test/
- **coverage low** → ADD tests (don't touch jest.config.js!)
- **IDEAL_RESPONSE mismatch** → regenerate lib/IDEAL_RESPONSE.md

**Prompt Quality Fix (Claude Review: Prompt Quality job fail):**
```
❌ NOT ALLOWED in PROMPT.md:
   - Emojis (🚀, ✅, ❌, etc.)
   - En dashes (–) → use regular hyphen (-)
   - Em dashes (—) → use regular hyphen (-)
   - Square brackets [optional] patterns
   - Formal abbreviations (e.g., i.e., etc.)
   - Excessive brackets (max 1 allowed)

✅ Fix:
   sed -i 's/–/-/g; s/—/-/g' lib/PROMPT.md
   sed -i 's/e\.g\./for example/gi' lib/PROMPT.md
   sed -i 's/i\.e\./that is/gi' lib/PROMPT.md
   # Remove emojis manually
```

**IDEAL_RESPONSE Fix (Claude Review: IDEAL_RESPONSE job fail):**
```
All lib/ code should be in IDEAL_RESPONSE.md:
   - Each file with proper markdown code block
   - Include test/ code as well
   - Character-for-character match required!
```

**Coverage Fix Rule:**
```
Coverage below threshold?
  ❌ DONT: Modify jest.config.js
  ✅ DO: Add tests in test/ directory
  
  1. Read lib/ source code
  2. Find uncovered functions
  3. Add test cases in test/
  4. Increase actual coverage
```

**7. Show changes and ask user confirmation**

Before committing, show all changes to user:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    📋 CHANGES TO BE COMMITTED                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Branch: feature/fix-pr-8543                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Files changed: 5

─────────────────────────────────────────────────────────────────────────────
  ✎ Modified:  lib/tap-stack.ts
  ✎ Modified:  metadata.json
  ✚ Added:     lib/MODEL_RESPONSE.md
  ✎ Modified:  test/tap-stack.unit.test.ts
  ✖ Deleted:   lib/old-file.ts
─────────────────────────────────────────────────────────────────────────────

╔══════════════════════════════════════════════════════════════════════════════╗
║                         🤔 CONFIRM COMMIT & PUSH                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  [y/yes]  - Commit and push these changes                                    ║
║  [n/no]   - Cancel and discard changes                                       ║
║  [d/diff] - Show full diff                                                   ║
║  [s/skip] - Skip this commit but continue monitoring                         ║
║  [a/abort]- Abort the entire operation                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Your choice [y/n/d/s/a]: _
```

**8. Commit (after user confirmation)**
```bash
git add -A
git commit -m "fix: update files"  # auto-generated based on changes
git push origin HEAD:"$BRANCH" --force-with-lease
```

Commit message examples (auto-generated):
- `fix: update metadata` (if metadata.json changed)
- `fix: update tests` (if test/ changed)
- `fix: update source` (if lib/ changed)
- ~~`fix: update dependencies`~~ (package.json NOT allowed!)

**8.5. Post-Commit Check (MANDATORY after every commit)**

After EVERY commit, check for protected files in PR:

```bash
# Get files changed in PR
PR_FILES=$(gh pr view $PR --json files -q '.files[].path')

# Check for protected files
PROTECTED="docker-compose.yml|Dockerfile|build.gradle|scripts/|.github/|config/"

for file in $PR_FILES; do
  if echo "$file" | grep -qE "$PROTECTED"; then
    echo "[SYNTH-AGENT] [PR #$PR] ⚠️ Protected: $file"
    git checkout origin/main -- "$file"
    echo "[SYNTH-AGENT] [PR #$PR] ✓ Restored: $file"
  fi
done

# Push restoration if any
git add -A && git diff --cached --quiet || {
  git commit -m "Restore protected files from main"
  git push origin HEAD:"$BRANCH"
}
```

**Protected Files List:**
| Type | Files |
|------|-------|
| Docker | docker-compose.yml, Dockerfile, .dockerignore |
| Node | **package.json**, package-lock.json, **tsconfig.json** |
| Python | **requirements.txt**, **pyproject.toml**, Pipfile |
| Build | build.gradle, gradlew |
| Config | .eslintrc.js, .prettierrc, pytest.ini |
| Dirs | scripts/, .github/, config/, .claude/ |

**9. Monitor CI**
```bash
sleep 30
while true; do
  STATUS=$(gh run view "$RUN" --json status -q '.status')
  [ "$STATUS" = "completed" ] && break
  sleep 30
done
```

**10. Archive Pending = PR OKAY**

When Archive job is pending/waiting, PR has passed:
```bash
ARCHIVE=$(gh run view "$RUN" --json jobs | jq -r '.jobs[] | select(.name | test("Archive"; "i")) | .status')
if [[ "$ARCHIVE" == "pending" ]] || [[ "$ARCHIVE" == "waiting" ]]; then
  echo "✅ Archive pending - PR is ready!"
  # No fixing needed
fi
```

**11. Repeat**

If still failing, repeat steps 5-9 (max 3 times).

## Success Conditions

| Status | Result |
|--------|--------|
| Archive: pending/waiting | ✅ PR OKAY - all passed |
| All jobs: success | ✅ PR OKAY |
| Archive: success | ✅ PR OKAY |
| Any failure | ❌ Needs fix |

## Error Types

| Error | What to Do |
|-------|------------|
| metadata validation | fix metadata.json |
| **Prompt Quality FAILED** | remove emojis, dashes, brackets from PROMPT.md |
| typescript error | fix code |
| lint error | fix formatting |
| unit test failed | fix unit test in test/ |
| integration test failed | fix integration test |
| deploy error | fix localstack config |
| **IDEAL_RESPONSE mismatch** | add lib/ code to IDEAL_RESPONSE.md |
| **lib/ missing** | restore from archive |
| **test/ or tests/ missing** | restore from archive |
| **source files missing** | restore by matching poid in archive |

## Restore Missing Files from Archive

If lib/, test/, or any file is missing:

```bash
# 1. Check poid from metadata
POID=$(jq -r '.poid' metadata.json)

# 2. Find in archive
ARCHIVE_FOLDER=$(find /path/to/archive -name "metadata.json" -exec grep -l "$POID" {} \; | head -1 | xargs dirname)

# 3. Copy missing files
[ ! -d "lib" ] && cp -r "$ARCHIVE_FOLDER/lib" .
[ ! -d "test" ] && [ ! -d "tests" ] && cp -r "$ARCHIVE_FOLDER/test" .
[ ! -f "package.json" ] && cp "$ARCHIVE_FOLDER/package.json" .
```

## Pull and Revert (Unwanted Changes)

When PR passes but has unwanted changes:

**1. Pull and check**
```bash
cd "$WORK"
BEFORE=$(git rev-parse HEAD)
git pull origin "$BRANCH"
AFTER=$(git rev-parse HEAD)

# Were there changes?
if [[ "$BEFORE" != "$AFTER" ]]; then
  echo "New changes detected:"
  git diff --name-only "$BEFORE" "$AFTER"
  echo "$BEFORE" > .last_good_head
fi
```

**2. Revert specific files**
```bash
LAST_GOOD=$(cat .last_good_head)
git checkout "$LAST_GOOD" -- path/to/file.ts
git add -A
git commit -m "revert: undo unwanted changes"
git push origin "$BRANCH"
```

**3. Full revert**
```bash
LAST_GOOD=$(cat .last_good_head)
git reset --hard "$LAST_GOOD"
git push --force origin "$BRANCH"
```

## Training Quality Update (10/10)

When deploy passes and integration test starts:

```bash
# Check status
if [[ "$DEPLOY" == "success" ]] && [[ "$INTEGRATION" == "in_progress" ]]; then
  # Get working code
  STACK=$(cat lib/tap-stack.* 2>/dev/null | head -1)
  
  # Update MODEL_RESPONSE.md
  echo "# Model Response" > lib/MODEL_RESPONSE.md
  echo '```typescript' >> lib/MODEL_RESPONSE.md
  cat lib/tap-stack.ts >> lib/MODEL_RESPONSE.md
  echo '```' >> lib/MODEL_RESPONSE.md
  
  # Update IDEAL_RESPONSE.md
  cp lib/MODEL_RESPONSE.md lib/IDEAL_RESPONSE.md
  
  # Clear MODEL_FAILURES.md
  echo "# Status: PASSED" > lib/MODEL_FAILURES.md
fi
```

## Parallel PR Monitoring

Monitor multiple PRs simultaneously:

```bash
./synth-agent.sh 8543 8544 8545   # Monitor 3 PRs in parallel
```

**Flow:**
1. Setup worktree for all PRs
2. Monitor all PRs simultaneously  
3. When any PR fails → collect fixes (don't commit yet)
4. Wait for all running PRs to complete
5. When all statuses known → show batch commit prompt
6. User selects which PRs to commit

**Batch Commit Options:**
```
╔══════════════════════════════════════════════════════════════╗
║        📦 BATCH COMMIT FOR 2 PRs                             ║
╠══════════════════════════════════════════════════════════════╣
║  PR #8543: 5 file(s) changed                                 ║
║  PR #8544: 3 file(s) changed                                 ║
╠══════════════════════════════════════════════════════════════╣
║  [y/yes]  - Commit and push ALL PRs                          ║
║  [n/no]   - Skip all commits                                 ║
║  [8543]   - Only commit PR #8543                             ║
║  [8543,8544] - Commit selected PRs (comma separated)         ║
╚══════════════════════════════════════════════════════════════╝
```

**Strategy:**
- If PR #8543 fails and PR #8544 is still running → wait for #8544
- When both fail → apply fixes to both, then batch commit
- When one passes and one fails → only fix the failed one

## Cleanup

```bash
cd "$REPO"
git worktree remove "$WORK" --force
```
