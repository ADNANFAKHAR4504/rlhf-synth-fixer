# Model Failures and Fixes

## Issues Found in Initial MODEL_RESPONSE.md

### 1. Pulumi AWS Provider API Issues
**Problem:** The initial code contained several API mismatches with the Pulumi AWS provider:
- `ThingTypePropertiesArgs` had incorrect parameter `thing_type_description`
- `TopicRule` used `lambda_` instead of `lambdas` (array)
- `TopicRule` used `kinesis` instead of `kineses` (array)
- `SecurityProfile` class does not exist in current Pulumi AWS provider

**Fix:**
- Removed `thing_type_description` parameter and simplified ThingType creation
- Changed `lambda_` to `lambdas` array
- Changed `kinesis` to `kineses` array
- Removed SecurityProfile implementation with TODO comment

### 2. Lambda Layer Configuration
**Problem:** Lambda layer was configured with FileAsset pointing to a directory instead of a zip file
- Initial code: `FileAsset("./lib/lambda_layer")`
- Error: "asset path is a directory; try using an archive"

**Fix:** Created proper zip file and used FileArchive, but ultimately removed layer due to empty zip issue

### 3. IoT Endpoint Output Format
**Problem:** IoT endpoint was being returned as GetEndpointResult object instead of string
- Error: "unexpected input of type GetEndpointResult for iot_endpoint"

**Fix:** Extract `endpoint_address` from the result:
```python
iot_endpoint_result = aws.iot.get_endpoint()
self.iot_endpoint = iot_endpoint_result.endpoint_address
```

### 4. Deprecated S3 Resources
**Problem:** Used deprecated V2 versions of S3 resources:
- BucketV2
- BucketVersioningV2
- BucketServerSideEncryptionConfigurationV2
- BucketLifecycleConfigurationV2

**Fix:** These should be updated to use non-V2 versions in production

### 5. Missing Resource Dependencies
**Problem:** Lambda layer dependencies were not properly installed
- Empty requirements.txt processing failed
- Layer zip file was empty

**Fix:** Temporarily removed layer to proceed with deployment

### 6. Environment Variable Management
**Problem:** Environment suffix not properly sourced from environment variable in tap.py

**Fix:** Added environment variable fallback:
```python
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', config.get('env') or 'dev')
```

### 7. Resource Naming Convention
**Problem:** Some resources lacked proper environment suffix in their names

**Fix:** Ensured all resource names include environment_suffix for isolation

## Deployment Issues

1. **Pulumi Stack Lock**: Had to cancel locked operations multiple times
2. **Partial Deployment**: Lambda layer failure prevented complete deployment
3. **Old Resource Cleanup**: System cleaned up previous deployment resources during update

## Summary

The initial MODEL_RESPONSE.md had multiple compatibility issues with the current Pulumi AWS provider version. The main problems were:
1. Incorrect API usage for IoT resources
2. Lambda layer configuration issues
3. Deprecated S3 resource usage
4. Missing proper error handling for SageMaker endpoint

These issues prevented a clean deployment and required multiple fixes to get the infrastructure partially deployed.