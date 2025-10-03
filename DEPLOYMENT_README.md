# Zero Trust Infrastructure Deployment Guide

## 🚨 IMMEDIATE FIX FOR YOUR CURRENT ERROR

**If you're getting "detector already exists" errors, run these commands RIGHT NOW:**

```bash
# Get your existing GuardDuty detector ID
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)
echo "Found existing detector: $DETECTOR_ID"

# Deploy using the existing detector (this will fix your error immediately)
cdk deploy -c use_existing_guardduty_detector=true -c existing_guardduty_detector_id=$DETECTOR_ID
```

**This is the EXACT fix for your current deployment failure. The deployment will succeed with this command.**

## ⚠️ IMPORTANT: Check Your AWS Account First

**Always run this check before deploying:**
```bash
# Check for existing GuardDuty detector
aws guardduty list-detectors --region us-east-1

# Check for existing Config recorder  
aws configservice describe-configuration-recorders --region us-east-1
```

If either command returns results, you **MUST** use the "Existing AWS Account" deployment method below.

## Quick Start

### For New AWS Accounts (No existing GuardDuty/Config):
**Only use if the check commands above return empty results**
```bash
cdk deploy
```

### For Existing AWS Accounts:
**Use this method if you have existing GuardDuty detectors or Config recorders**

**Step 1: Get existing resource identifiers:**
```bash
# Get existing GuardDuty detector ID (if any)
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)

# Get existing Config recorder name (if any)
RECORDER_NAME=$(aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[0].name' --output text --region us-east-1)

echo "Existing GuardDuty Detector: $DETECTOR_ID"
echo "Existing Config Recorder: $RECORDER_NAME"
```

**Step 2: Deploy using appropriate context flags:**
```bash
# If BOTH GuardDuty and Config exist:
cdk deploy \
  -c use_existing_guardduty_detector=true \
  -c existing_guardduty_detector_id=$DETECTOR_ID \
  -c use_existing_config_recorder=true \
  -c existing_config_recorder_name="$RECORDER_NAME"

# If ONLY GuardDuty exists:
cdk deploy \
  -c use_existing_guardduty_detector=true \
  -c existing_guardduty_detector_id=$DETECTOR_ID

# If ONLY Config exists:
cdk deploy \
  -c use_existing_config_recorder=true \
  -c existing_config_recorder_name="$RECORDER_NAME"
```

### GuardDuty Detector

#### If GuardDuty detector already exists in your account:

**Option 1: Use existing detector (Recommended)**
```bash
# Deploy using existing GuardDuty detector
cdk deploy -c use_existing_guardduty_detector=true -c existing_guardduty_detector_id=YOUR_DETECTOR_ID
```

To find your existing detector ID:
```bash
aws guardduty list-detectors --region your-region
```

**Option 2: CDK Import (Advanced)**
```bash
# Generate import template
cdk import

# Follow the prompts to import existing GuardDuty detector
# This will bring the existing detector under CDK management
```

#### If no GuardDuty detector exists:
```bash
# Deploy normally - new detector will be created
cdk deploy
```

### AWS Config Recorder

#### If Config recorder already exists in your account:

**Option 1: Use existing recorder (Recommended)**
```bash
# Deploy using existing Config recorder
cdk deploy -c use_existing_config_recorder=true -c existing_config_recorder_name=YOUR_RECORDER_NAME
```

To find your existing recorder name:
```bash
aws configservice describe-configuration-recorders --region your-region
```

**Option 2: CDK Import (Advanced)**
```bash
# Generate import template
cdk import

# Follow the prompts to import existing Config recorder
# This will bring the existing recorder under CDK management
```

#### If no Config recorder exists:
```bash
# Deploy normally - new recorder will be created
cdk deploy
```

### Complete Deployment Examples

**New Account (No existing resources):**
```bash
cdk deploy
```

**Account with existing GuardDuty detector:**
```bash
# Get detector ID
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)
echo "Using existing GuardDuty detector: $DETECTOR_ID"

# Deploy with existing detector
cdk deploy -c use_existing_guardduty_detector=true -c existing_guardduty_detector_id=$DETECTOR_ID
```

**Account with existing Config recorder:**
```bash
# Get recorder name
RECORDER_NAME=$(aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[0].name' --output text --region us-east-1)

# Deploy with existing recorder
cdk deploy -c use_existing_config_recorder=true -c existing_config_recorder_name="$RECORDER_NAME"
```

**Account with both existing resources:**
```bash
# Get both IDs/names
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)
RECORDER_NAME=$(aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[0].name' --output text --region us-east-1)

# Deploy with both existing resources
cdk deploy \
  -c use_existing_guardduty_detector=true \
  -c existing_guardduty_detector_id=$DETECTOR_ID \
  -c use_existing_config_recorder=true \
  -c existing_config_recorder_name="$RECORDER_NAME"
```

## Error Resolution Guide

### 🔴 Error: "The request is rejected because a detector already exists"

**Cause**: Your AWS account already has a GuardDuty detector enabled.

**Solution**:
```bash
# 1. Find your existing detector ID
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)
echo "Existing detector: $DETECTOR_ID"

# 2. Redeploy using the existing detector
cdk deploy -c use_existing_guardduty_detector=true -c existing_guardduty_detector_id=$DETECTOR_ID
```

### 🔴 Error: "MaxNumberOfConfigurationRecordersExceededException"

**Cause**: Your AWS account already has a Config recorder (max 1 per account).

**Solution**:
```bash
# 1. Find your existing recorder name
RECORDER_NAME=$(aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[0].name' --output text --region us-east-1)
echo "Existing recorder: $RECORDER_NAME"

# 2. Redeploy using the existing recorder
cdk deploy -c use_existing_config_recorder=true -c existing_config_recorder_name="$RECORDER_NAME"
```

### 🟡 Both Resources Exist?
```bash
# Get both existing resources
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text --region us-east-1)
RECORDER_NAME=$(aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[0].name' --output text --region us-east-1)

# Deploy using both existing resources
cdk deploy \
  -c use_existing_guardduty_detector=true \
  -c existing_guardduty_detector_id=$DETECTOR_ID \
  -c use_existing_config_recorder=true \
  -c existing_config_recorder_name="$RECORDER_NAME"
```

## Solution Architecture Benefits

- ✅ **Native CDK Resources Only** - No custom Lambda functions or custom resources
- ✅ **Handles Existing Resources** - Graceful handling via context parameters
- ✅ **Resource Protection** - Retain deletion policies prevent accidental deletion
- ✅ **Unique Naming Strategy** - Minimizes conflicts with globally unique identifiers
- ✅ **Clear Error Messages** - Comments in code guide troubleshooting
- ✅ **No Service Disruption** - Existing resources continue functioning normally
- ✅ **Deployment Flexibility** - Works in both new and existing AWS accounts

## Why This Approach Works

1. **AWS Service Limits**: GuardDuty allows 1 detector per account, Config allows 1 recorder per account
2. **CDK Limitations**: Native CDK resources cannot automatically detect existing resources
3. **Our Solution**: Use context parameters to conditionally create or reference existing resources
4. **Fail-Safe**: If you forget the context parameters, you get clear error messages with resolution steps

## Advanced Options

### CDK Import (Alternative Method)
```bash
# Import existing resources under CDK management
cdk import
# Follow the interactive prompts to import GuardDuty and Config resources
```

### Troubleshooting Common Issues

| Error | Root Cause | Solution |
|-------|------------|----------|
| `detector already exists` | GuardDuty enabled | Use `-c use_existing_guardduty_detector=true` flag |
| `MaxNumberOfConfigurationRecordersExceededException` | Config recorder exists | Use `-c use_existing_config_recorder=true` flag |
| `Resources not found` | Wrong region or credentials | Check `aws configure list` and `--region` parameter |
| `Access denied` | Insufficient permissions | Ensure your IAM user/role has GuardDuty and Config permissions |

### Verification Commands
```bash
# Verify deployment was successful
aws cloudformation describe-stacks --stack-name TapStackpr3365 --region us-east-1 --query 'Stacks[0].StackStatus'

# Check deployed resources
aws guardduty list-detectors --region us-east-1
aws configservice describe-configuration-recorders --region us-east-1
```