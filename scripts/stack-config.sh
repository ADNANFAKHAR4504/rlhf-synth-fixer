#!/bin/bash

# ============================================================================
# Stack Naming Configuration
# ============================================================================
# This file defines the standard stack naming conventions used across all
# IaC platforms (CDK, CloudFormation, Pulumi, Terraform, CDKTF).
#
# DO NOT modify these values without updating all deployment scripts.
# ============================================================================

# Standard stack name prefix (PascalCase, no hyphens)
export STACK_NAME_PREFIX="TapStack"

# Stack naming patterns by platform:
# - CDK/CloudFormation: TapStack${ENVIRONMENT_SUFFIX}
#   Example: TapStackpr123, TapStackdev, TapStackprod
#
# - Pulumi: ${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}
#   Example: organization/TapStack/TapStackpr123
#
# - Terraform/CDKTF: Use resource naming with suffix only
#   Example: my-resource-pr123 (TapStack is not used in resource names)

# Validation function to ensure ENVIRONMENT_SUFFIX is set
validate_environment_suffix() {
  if [ -z "$ENVIRONMENT_SUFFIX" ]; then
    echo "❌ ERROR: ENVIRONMENT_SUFFIX environment variable is not set"
    echo "   This should be set by the CI/CD pipeline (e.g., pr123, dev, prod)"
    return 1
  fi
  
  # Validate format (alphanumeric, lowercase, may include 'pr' prefix)
  if [[ ! "$ENVIRONMENT_SUFFIX" =~ ^[a-z0-9]+$ ]]; then
    echo "⚠️ WARNING: ENVIRONMENT_SUFFIX should be lowercase alphanumeric"
    echo "   Current value: $ENVIRONMENT_SUFFIX"
  fi
  
  return 0
}

# Function to construct CloudFormation/CDK stack name
get_cfn_stack_name() {
  validate_environment_suffix || return 1
  echo "${STACK_NAME_PREFIX}${ENVIRONMENT_SUFFIX}"
}

# Function to construct Pulumi stack name (full path)
get_pulumi_stack_name() {
  validate_environment_suffix || return 1
  local org=${PULUMI_ORG:-organization}
  echo "${org}/${STACK_NAME_PREFIX}/${STACK_NAME_PREFIX}${ENVIRONMENT_SUFFIX}"
}

# Function to construct Pulumi stack name (short form for some commands)
get_pulumi_stack_name_short() {
  validate_environment_suffix || return 1
  echo "${STACK_NAME_PREFIX}${ENVIRONMENT_SUFFIX}"
}

# Function to validate stack name format
validate_stack_name_format() {
  local stack_name=$1
  local platform=${2:-"unknown"}
  
  case $platform in
    cdk|cfn)
      # Should be TapStack followed by environment suffix
      if [[ ! "$stack_name" =~ ^TapStack[a-z0-9]+$ ]]; then
        echo "❌ Invalid CDK/CloudFormation stack name: $stack_name"
        echo "   Expected format: TapStack{environmentSuffix}"
        echo "   Example: TapStackpr123"
        return 1
      fi
      ;;
    pulumi)
      # Should be org/TapStack/TapStack{suffix} or TapStack{suffix}
      if [[ ! "$stack_name" =~ (TapStack[a-z0-9]+|.*/TapStack/TapStack[a-z0-9]+)$ ]]; then
        echo "❌ Invalid Pulumi stack name: $stack_name"
        echo "   Expected format: {org}/TapStack/TapStack{environmentSuffix}"
        echo "   Example: organization/TapStack/TapStackpr123"
        return 1
      fi
      ;;
  esac
  
  # Check for common incorrect patterns
  if [[ "$stack_name" =~ (tap-stack|Tap-stack|TAP-STACK|tapStack) ]]; then
    echo "❌ Invalid stack name format: $stack_name"
    echo "   Found incorrect naming pattern (hyphen or wrong casing)"
    echo "   Use: TapStack (capital T, capital S, no hyphen)"
    return 1
  fi
  
  return 0
}

# Export functions for use in other scripts
export -f validate_environment_suffix
export -f get_cfn_stack_name
export -f get_pulumi_stack_name
export -f get_pulumi_stack_name_short
export -f validate_stack_name_format

# If sourced with --validate flag, run validation
if [ "$1" = "--validate" ]; then
  validate_environment_suffix
  exit $?
fi

# If sourced with --print flag, print configuration
if [ "$1" = "--print" ]; then
  echo "Stack Naming Configuration"
  echo "=========================="
  echo "STACK_NAME_PREFIX: $STACK_NAME_PREFIX"
  echo "ENVIRONMENT_SUFFIX: ${ENVIRONMENT_SUFFIX:-<not set>}"
  if [ -n "$ENVIRONMENT_SUFFIX" ]; then
    echo ""
    echo "Generated Stack Names:"
    echo "  CDK/CloudFormation: $(get_cfn_stack_name)"
    echo "  Pulumi (full):      $(get_pulumi_stack_name)"
    echo "  Pulumi (short):     $(get_pulumi_stack_name_short)"
  fi
  exit 0
fi

