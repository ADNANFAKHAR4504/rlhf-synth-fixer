#!/bin/bash

# Claude Review: Prompt Quality Validation
# Validates that PROMPT.md describes service connectivity scenarios
# This ensures training data focuses on real-world infrastructure patterns

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":mag: Claude Review: Validating Prompt Quality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROMPT_FILE="lib/PROMPT.md"

if [ ! -f "$PROMPT_FILE" ]; then
  echo ":x: PROMPT.md not found at: $PROMPT_FILE"
  exit 1
fi

echo ":white_check_mark: Found PROMPT.md"
echo ""

# Initialize validation flags
COMPLEXITY_PASS=false
CONNECTIVITY_PASS=false
SECURITY_PASS=false
LLM_GENERATED_FAIL=false

# ============================================================
# CHECK 1: Service Connectivity Requirements
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":clipboard: CHECK 1: Service Connectivity Pattern"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Expert-grade prompts should describe how services connect and interact."
echo "Looking for connectivity patterns..."
echo ""
echo "NOTE: .claude/prompts/claude-prompt-quality-review.md contains examples for SOME"
echo "      common subcategories. These are quality/structure examples, NOT rigid templates."
echo "      Use intelligence and context - prompts don't need to match examples exactly."
echo "      Focus on: Does it describe HOW services connect and integrate?"
echo ""

# Patterns that indicate service connectivity
CONNECTIVITY_PATTERNS=(
  "connect.*to"
  "connects? to"
  "integrated? with"
  "communicates? with"
  "sends? data to"
  "receives? data from"
  "triggers?"
  "invokes?"
  "calls?"
  "access.*through"
  "via.*endpoint"
  "through.*gateway"
  "behind.*load balancer"
  "attached to"
  "associated with"
  "linked to"
  "reads? from"
  "writes? to"
  "streams? to"
  "publishes? to"
  "subscribes? to"
  "listens? on"
  "mounted.*as"
  "network.*configuration"
  "security group.*allows?"
  "ingress.*from"
  "egress.*to"
  "vpc.*peering"
  "private.*link"
  "transit.*gateway"
)

CONNECTIVITY_COUNT=0
FOUND_PATTERNS=()

for pattern in "${CONNECTIVITY_PATTERNS[@]}"; do
  if grep -iEq "$pattern" "$PROMPT_FILE"; then
    CONNECTIVITY_COUNT=$((CONNECTIVITY_COUNT + 1))
    FOUND_PATTERNS+=("$pattern")
  fi
done

echo "Found $CONNECTIVITY_COUNT connectivity pattern(s):"
if [ $CONNECTIVITY_COUNT -gt 0 ]; then
  for p in "${FOUND_PATTERNS[@]}"; do
    echo "  ✓ Pattern: '$p'"
  done
  echo ""
fi

# Require at least 2 different connectivity patterns
if [ $CONNECTIVITY_COUNT -ge 2 ]; then
  echo ":white_check_mark: PASS: Prompt describes service connectivity (found $CONNECTIVITY_COUNT patterns)"
  CONNECTIVITY_PASS=true
else
  echo ":x: FAIL: Prompt lacks clear service connectivity patterns"
  echo ""
  echo "Examples of good connectivity descriptions:"
  echo "  ✓ 'S3 bucket that connects to Lambda for processing'"
  echo "  ✓ 'API Gateway integrated with Lambda functions'"
  echo "  ✓ 'EC2 instance that sends logs to CloudWatch'"
  echo "  ✓ 'RDS database accessible through VPC security groups'"
  echo ""
  echo "Bad (too simple):"
  echo "  ✗ 'Deploy S3 and EC2'"
  echo "  ✗ 'Create a Lambda function'"
  echo ""
  echo ":bulb: TIP: Review .claude/prompts/claude-prompt-quality-review.md for examples of"
  echo "        connector-based prompts. Remember: examples show quality principles,"
  echo "        not exact templates to copy. Focus on service integration patterns."
  echo ""
  CONNECTIVITY_PASS=false
fi
echo ""

# ============================================================
# CHECK 2: Complexity & Multi-Service Architecture
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":clipboard: CHECK 2: Complexity & Architecture Depth"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count AWS services mentioned
AWS_SERVICES=(
  "S3"
  "Lambda"
  "DynamoDB"
  "EC2"
  "RDS"
  "API Gateway"
  "CloudWatch"
  "SNS"
  "SQS"
  "Step Functions"
  "ECS"
  "Fargate"
  "VPC"
  "ALB"
  "NLB"
  "CloudFront"
  "Route53"
  "Secrets Manager"
  "IAM"
  "KMS"
  "EventBridge"
  "Kinesis"
  "ElastiCache"
  "EFS"
  "EBS"
  "CloudFormation"
  "Systems Manager"
)

SERVICE_COUNT=0
FOUND_SERVICES=()

for service in "${AWS_SERVICES[@]}"; do
  if grep -iq "$service" "$PROMPT_FILE"; then
    SERVICE_COUNT=$((SERVICE_COUNT + 1))
    FOUND_SERVICES+=("$service")
  fi
done

echo "Found $SERVICE_COUNT AWS service(s) mentioned:"
for s in "${FOUND_SERVICES[@]}"; do
  echo "  • $s"
done
echo ""

# Require at least 2 services for meaningful connectivity
if [ $SERVICE_COUNT -ge 2 ]; then
  echo ":white_check_mark: PASS: Multi-service architecture (found $SERVICE_COUNT services)"
  COMPLEXITY_PASS=true
else
  echo ":x: FAIL: Prompt is too simple (only $SERVICE_COUNT service)"
  echo ""
  echo "Expert-grade prompts should involve multiple AWS services"
  echo "working together to solve a real-world scenario."
  echo ""
  COMPLEXITY_PASS=false
fi
echo ""

# ============================================================
# CHECK 3: Security Validation (Conditional)
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":clipboard: CHECK 3: Security Validation (Conditional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Security-related keywords to detect if prompt is security-focused
SECURITY_FOCUS_PATTERNS=(
  "IAM.*role"
  "IAM.*policy"
  "IAM.*permission"
  "security group"
  "encryption"
  "encrypted"
  "KMS"
  "Secrets Manager"
  "least privilege"
  "access.*control"
  "authentication"
  "authorization"
)

SECURITY_FOCUSED=false
for pattern in "${SECURITY_FOCUS_PATTERNS[@]}"; do
  if grep -iEq "$pattern" "$PROMPT_FILE"; then
    SECURITY_FOCUSED=true
    break
  fi
done

if [ "$SECURITY_FOCUSED" = true ]; then
  echo ":lock: Prompt appears to be security-focused. Running security validation..."
  echo ""

  # Check for overly permissive IAM policies
  INSECURE_PATTERNS=(
    '\*:\*'
    'Action.*\*'
    'Resource.*\*'
    'FullAccess'
    'AdministratorAccess'
    'all.*permissions'
    'full.*admin'
    '0\.0\.0\.0/0.*ingress'
    'allows?.*all.*traffic'
  )

  INSECURE_COUNT=0
  FOUND_INSECURE=()

  for pattern in "${INSECURE_PATTERNS[@]}"; do
    if grep -iEq "$pattern" "$PROMPT_FILE"; then
      INSECURE_COUNT=$((INSECURE_COUNT + 1))
      FOUND_INSECURE+=("$pattern")
    fi
  done

  if [ $INSECURE_COUNT -gt 0 ]; then
    echo ":x: FAIL: Insecure security configuration detected"
    echo ""
    echo "Found $INSECURE_COUNT overly permissive pattern(s):"
    for p in "${FOUND_INSECURE[@]}"; do
      echo "  • $p"
    done
    echo ""
    echo "Recommendations:"
    echo "  • Use least privilege principle for IAM policies"
    echo "  • Specify exact actions instead of wildcards (*)"
    echo "  • Define specific resources instead of Resource: *"
    echo "  • Restrict security group rules to specific IP ranges/ports"
    echo "  • Avoid FullAccess or AdministratorAccess policies"
    echo ""
    SECURITY_PASS=false
  else
    echo ":white_check_mark: PASS: Security configuration appears appropriate"
    SECURITY_PASS=true
  fi
else
  echo ":information_source:  Prompt is not security-focused. Skipping security validation."
  echo ""
  echo "Security validation is only enforced when the prompt explicitly deals with:"
  echo "  • IAM roles, policies, or permissions"
  echo "  • Security groups or network ACLs"
  echo "  • Encryption (KMS, at-rest, in-transit)"
  echo "  • Secrets management"
  echo "  • Access control or authentication"
  echo ""
  SECURITY_PASS=true
fi
echo ""

# ============================================================
# CHECK 4: LLM-Generated Content Detection
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":clipboard: CHECK 4: LLM-Generated Content Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LLM_INDICATOR_COUNT=0

# 1. Emoji detection (comprehensive pattern)
EMOJI_PATTERN='[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{1FA00}-\x{1FAFF}]'

if grep -Pq "$EMOJI_PATTERN" "$PROMPT_FILE" 2>/dev/null; then
  echo ":x: FAIL: Emojis detected in PROMPT.md"
  echo ""
  grep -Pn "$EMOJI_PATTERN" "$PROMPT_FILE" 2>/dev/null | head -5 | while read -r line; do
    echo "  Line $line"
  done
  echo ""
  echo "Emojis are a strong indicator of LLM-generated content."
  echo "Human-written prompts should not contain emojis."
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 2. En dash detection (–)
if grep -q '–' "$PROMPT_FILE"; then
  EN_DASH_COUNT=$(grep -o '–' "$PROMPT_FILE" | wc -l)
  echo ":x: FAIL: En dashes (–) detected ($EN_DASH_COUNT occurrence(s))"
  echo "Human prompts use regular hyphens (-), not en dashes (–)"
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 3. Em dash detection (—)
if grep -q '—' "$PROMPT_FILE"; then
  EM_DASH_COUNT=$(grep -o '—' "$PROMPT_FILE" | wc -l)
  echo ":x: FAIL: Em dashes (—) detected ($EM_DASH_COUNT occurrence(s))"
  echo "Human prompts use regular hyphens (-), not em dashes (—)"
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 4. Square bracket detection (discouraged completely)
SQUARE_BRACKET_COUNT=$(grep -o '\[' "$PROMPT_FILE" | wc -l)
if [ $SQUARE_BRACKET_COUNT -gt 0 ]; then
  echo ":x: FAIL: Square brackets detected ($SQUARE_BRACKET_COUNT occurrence(s))"
  echo "Square brackets suggest template-style or formal documentation language."
  echo "Human prompts should use natural language without brackets."
  echo ""
  grep -n '\[' "$PROMPT_FILE" | head -5 | while read -r line; do
    echo "  $line"
  done
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 5. Round/curly bracket limit (max 1 allowed)
ROUND_BRACKET_COUNT=$(grep -o '(' "$PROMPT_FILE" | wc -l)
CURLY_BRACKET_COUNT=$(grep -o '{' "$PROMPT_FILE" | wc -l)
TOTAL_BRACKET_COUNT=$((ROUND_BRACKET_COUNT + CURLY_BRACKET_COUNT))

if [ $TOTAL_BRACKET_COUNT -gt 1 ]; then
  echo ":x: FAIL: Too many brackets detected ($TOTAL_BRACKET_COUNT total: $ROUND_BRACKET_COUNT round, $CURLY_BRACKET_COUNT curly)"
  echo "Maximum 1 bracket pair allowed. Excessive brackets suggest formal/template language."
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 6. Formal abbreviations (e.g., i.e., etc.)
FORMAL_ABBREV_PATTERNS=(
  "e\.g\."
  "i\.e\."
  "etc\."
  "cf\."
  "viz\."
)

FORMAL_ABBREV_COUNT=0
for pattern in "${FORMAL_ABBREV_PATTERNS[@]}"; do
  if grep -iEq "$pattern" "$PROMPT_FILE"; then
    FORMAL_ABBREV_COUNT=$((FORMAL_ABBREV_COUNT + 1))
    ABBREV_MATCHES=$(grep -ion "$pattern" "$PROMPT_FILE" | head -3)
    echo ":warning:  Formal abbreviation detected: $pattern"
    echo "$ABBREV_MATCHES" | while read -r line; do
      echo "  $line"
    done
  fi
done

if [ $FORMAL_ABBREV_COUNT -gt 0 ]; then
  echo ""
  echo ":x: FAIL: Formal abbreviations detected ($FORMAL_ABBREV_COUNT type(s))"
  echo "Human prompts rarely use formal abbreviations like 'e.g.', 'i.e.', etc."
  echo "This suggests LLM-polished or academic writing style."
  echo ""
  LLM_GENERATED_FAIL=true
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# 7. Perfect punctuation patterns (semicolons, colons in lists)
SEMICOLON_COUNT=$(grep -o ';' "$PROMPT_FILE" | wc -l)
if [ $SEMICOLON_COUNT -gt 2 ]; then
  echo ":warning:  WARNING: Multiple semicolons detected ($SEMICOLON_COUNT)"
  echo "Excessive semicolon usage suggests formal/polished writing."
  echo ""
  # Not failing on this alone, but counting as indicator
  LLM_INDICATOR_COUNT=$((LLM_INDICATOR_COUNT + 1))
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$LLM_GENERATED_FAIL" = false ] && [ $LLM_INDICATOR_COUNT -eq 0 ]; then
  echo ":white_check_mark: PASS: No LLM-generation indicators found"
elif [ "$LLM_GENERATED_FAIL" = false ] && [ $LLM_INDICATOR_COUNT -gt 0 ]; then
  echo ":warning:  WARNING: $LLM_INDICATOR_COUNT minor indicator(s) detected, but within acceptable limits"
else
  echo ":x: FAIL: $LLM_INDICATOR_COUNT LLM-generation indicator(s) detected"
fi
echo ""

# ============================================================
# FINAL VALIDATION RESULT
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ":bar_chart: VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Service Connectivity:  $([ "$CONNECTIVITY_PASS" = true ] && echo ":white_check_mark: PASS" || echo ":x: FAIL")"
echo "Complexity/Multi-svc:  $([ "$COMPLEXITY_PASS" = true ] && echo ":white_check_mark: PASS" || echo ":x: FAIL")"
echo "Security Validation:   $([ "$SECURITY_PASS" = true ] && echo ":white_check_mark: PASS" || echo ":x: FAIL (if security-focused)")"
echo "LLM-Generated Check:   $([ "$LLM_GENERATED_FAIL" = false ] && echo ":white_check_mark: PASS" || echo ":x: FAIL")"
echo ""

# Exit code logic
if [ "$LLM_GENERATED_FAIL" = true ]; then
  echo ":x: VALIDATION FAILED: LLM-generated content detected"
  echo ""
  echo "This prompt does not meet the quality bar for expert training data."
  echo "Please rewrite lib/PROMPT.md as a genuine human developer request."
  echo ""
  exit 1
fi

if [ "$CONNECTIVITY_PASS" = false ] || [ "$COMPLEXITY_PASS" = false ]; then
  echo ":x: VALIDATION FAILED: Prompt quality insufficient"
  echo ""
  echo "The prompt must describe:"
  echo "  1. How multiple AWS services connect and interact (not just 'deploy X and Y')"
  echo "  2. A real-world connector-based scenario (multiple services working together)"
  echo ""
  echo "Example of a GOOD prompt:"
  echo "  'Deploy an S3 bucket that triggers a Lambda function when new files"
  echo "   are uploaded. The Lambda should process the data and store results"
  echo "   in DynamoDB.'"
  echo ""
  echo "  'Create API Gateway connected to Lambda functions, with Lambda writing"
  echo "   events to EventBridge for downstream processing.'"
  echo ""
  echo "Example of a BAD prompt:"
  echo "  'Deploy S3 and Lambda' (no connector described)"
  echo "  'Create EC2 instances and RDS database' (no integration shown)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ":books: QUALITY GUIDANCE & EXAMPLES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Review .claude/prompts/claude-prompt-quality-review.md for:"
  echo ""
  echo "  • General connector-based prompt principles"
  echo "  • Examples for common subcategories (Security, CI/CD, Multi-Env, etc.)"
  echo "  • Guidance on applying these principles flexibly"
  echo ""
  echo ":warning:  IMPORTANT: Examples are NOT exhaustive or rigid templates!"
  echo "    - Not all subcategories have examples (that's OK)"
  echo "    - Prompts don't need to match examples exactly"
  echo "    - Focus: Does it describe HOW services connect?"
  echo "    - Context matters: Different subcategories have different patterns"
  echo ""
  exit 1
fi

if [ "$SECURITY_PASS" = false ]; then
  echo ":x: VALIDATION FAILED: Insecure configuration detected"
  echo ""
  echo "This prompt is security-focused but contains overly permissive configurations."
  echo "Please follow least privilege principle and avoid wildcard permissions."
  echo ""
  exit 1
fi

echo ":white_check_mark: VALIDATION PASSED: Prompt meets quality standards"
echo ""
echo "This prompt describes service connectivity and represents expert-grade"
echo "infrastructure as code training data."
echo ""

exit 0