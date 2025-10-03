# Zero Trust Infrastructure Deployment Guide

## Handling Existing AWS Resources

This CDK stack has been updated to handle existing AWS resources gracefully using native CDK resources only.

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

### Error Handling

If you get "detector already exists" or "recorder limit exceeded" errors:

1. **Check if resources exist:**
   ```bash
   # Check GuardDuty
   aws guardduty list-detectors --region your-region
   
   # Check Config
   aws configservice describe-configuration-recorders --region your-region
   ```

2. **Redeploy with existing resource flags:**
   Use the deployment examples above with the appropriate context parameters.

3. **Alternative: Use CDK import**
   ```bash
   cdk import
   # Follow prompts to import existing resources
   ```

### Benefits of This Approach

- ✅ **Uses only native CDK resources** - no custom Lambda functions
- ✅ **Handles existing resources gracefully** - via context parameters
- ✅ **Maintains resource integrity** - with retain deletion policies
- ✅ **Clear deployment path** - for both new and existing environments
- ✅ **No service disruption** - existing resources continue to function

### Troubleshooting

**Issue**: "The request is rejected because a detector already exists"
**Solution**: Use the existing detector deployment command above

**Issue**: "MaxNumberOfConfigurationRecordersExceededException"  
**Solution**: Use the existing Config recorder deployment command above

**Issue**: Resources not found during lookup
**Solution**: Verify AWS credentials and region, then check resource existence with AWS CLI commands