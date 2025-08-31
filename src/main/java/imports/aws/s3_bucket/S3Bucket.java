package imports.aws.s3_bucket;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket aws_s3_bucket}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3Bucket")
public class S3Bucket extends com.hashicorp.cdktf.TerraformResource {

    protected S3Bucket(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3Bucket(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.s3_bucket.S3Bucket.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket aws_s3_bucket} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public S3Bucket(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket aws_s3_bucket} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public S3Bucket(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a S3Bucket resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3Bucket to import. This parameter is required.
     * @param importFromId The id of the existing S3Bucket that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the S3Bucket to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_bucket.S3Bucket.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a S3Bucket resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3Bucket to import. This parameter is required.
     * @param importFromId The id of the existing S3Bucket that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_bucket.S3Bucket.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCorsRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket.S3BucketCorsRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket.S3BucketCorsRule> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket.S3BucketCorsRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket.S3BucketCorsRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCorsRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGrant(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket.S3BucketGrant>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket.S3BucketGrant> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket.S3BucketGrant>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket.S3BucketGrant __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGrant", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLifecycleRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRule> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket.S3BucketLifecycleRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLifecycleRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogging(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLogging value) {
        software.amazon.jsii.Kernel.call(this, "putLogging", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putObjectLockConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketObjectLockConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putObjectLockConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putReplicationConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putReplicationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putServerSideEncryptionConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putServerSideEncryptionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVersioning(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketVersioning value) {
        software.amazon.jsii.Kernel.call(this, "putVersioning", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWebsite(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketWebsite value) {
        software.amazon.jsii.Kernel.call(this, "putWebsite", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccelerationStatus() {
        software.amazon.jsii.Kernel.call(this, "resetAccelerationStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAcl() {
        software.amazon.jsii.Kernel.call(this, "resetAcl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucket() {
        software.amazon.jsii.Kernel.call(this, "resetBucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetBucketPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCorsRule() {
        software.amazon.jsii.Kernel.call(this, "resetCorsRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetForceDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrant() {
        software.amazon.jsii.Kernel.call(this, "resetGrant", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycleRule() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycleRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogging() {
        software.amazon.jsii.Kernel.call(this, "resetLogging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectLockConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectLockEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestPayer() {
        software.amazon.jsii.Kernel.call(this, "resetRequestPayer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideEncryptionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideEncryptionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersioning() {
        software.amazon.jsii.Kernel.call(this, "resetVersioning", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebsite() {
        software.amazon.jsii.Kernel.call(this, "resetWebsite", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketDomainName() {
        return software.amazon.jsii.Kernel.get(this, "bucketDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketRegionalDomainName() {
        return software.amazon.jsii.Kernel.get(this, "bucketRegionalDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketCorsRuleList getCorsRule() {
        return software.amazon.jsii.Kernel.get(this, "corsRule", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketCorsRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketGrantList getGrant() {
        return software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketGrantList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostedZoneId() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleList getLifecycleRule() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleRule", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLoggingOutputReference getLogging() {
        return software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLoggingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketObjectLockConfigurationOutputReference getObjectLockConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "objectLockConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketReplicationConfigurationOutputReference getReplicationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "replicationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationOutputReference getServerSideEncryptionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketVersioningOutputReference getVersioning() {
        return software.amazon.jsii.Kernel.get(this, "versioning", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketVersioningOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketWebsiteOutputReference getWebsite() {
        return software.amazon.jsii.Kernel.get(this, "website", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketWebsiteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebsiteDomain() {
        return software.amazon.jsii.Kernel.get(this, "websiteDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebsiteEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "websiteEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccelerationStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "accelerationStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAclInput() {
        return software.amazon.jsii.Kernel.get(this, "aclInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCorsRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "corsRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGrantInput() {
        return software.amazon.jsii.Kernel.get(this, "grantInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLifecycleRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLogging getLoggingInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLogging.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfiguration getObjectLockConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getObjectLockEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfiguration getReplicationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequestPayerInput() {
        return software.amazon.jsii.Kernel.get(this, "requestPayerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration getServerSideEncryptionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketVersioning getVersioningInput() {
        return software.amazon.jsii.Kernel.get(this, "versioningInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketVersioning.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketWebsite getWebsiteInput() {
        return software.amazon.jsii.Kernel.get(this, "websiteInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketWebsite.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccelerationStatus() {
        return software.amazon.jsii.Kernel.get(this, "accelerationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccelerationStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accelerationStatus", java.util.Objects.requireNonNull(value, "accelerationStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAcl() {
        return software.amazon.jsii.Kernel.get(this, "acl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAcl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "acl", java.util.Objects.requireNonNull(value, "acl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucket() {
        return software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucket", java.util.Objects.requireNonNull(value, "bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketPrefix", java.util.Objects.requireNonNull(value, "bucketPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDestroy() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getObjectLockEnabled() {
        return software.amazon.jsii.Kernel.get(this, "objectLockEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setObjectLockEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "objectLockEnabled", java.util.Objects.requireNonNull(value, "objectLockEnabled is required"));
    }

    public void setObjectLockEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "objectLockEnabled", java.util.Objects.requireNonNull(value, "objectLockEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequestPayer() {
        return software.amazon.jsii.Kernel.get(this, "requestPayer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequestPayer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requestPayer", java.util.Objects.requireNonNull(value, "requestPayer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.s3_bucket.S3Bucket}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.s3_bucket.S3Bucket> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.s3_bucket.S3BucketConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acceleration_status S3Bucket#acceleration_status}.
         * <p>
         * @return {@code this}
         * @param accelerationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acceleration_status S3Bucket#acceleration_status}. This parameter is required.
         */
        public Builder accelerationStatus(final java.lang.String accelerationStatus) {
            this.config().accelerationStatus(accelerationStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acl S3Bucket#acl}.
         * <p>
         * @return {@code this}
         * @param acl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acl S3Bucket#acl}. This parameter is required.
         */
        public Builder acl(final java.lang.String acl) {
            this.config().acl(acl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}.
         * <p>
         * @return {@code this}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}. This parameter is required.
         */
        public Builder bucket(final java.lang.String bucket) {
            this.config().bucket(bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_prefix S3Bucket#bucket_prefix}.
         * <p>
         * @return {@code this}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_prefix S3Bucket#bucket_prefix}. This parameter is required.
         */
        public Builder bucketPrefix(final java.lang.String bucketPrefix) {
            this.config().bucketPrefix(bucketPrefix);
            return this;
        }

        /**
         * cors_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#cors_rule S3Bucket#cors_rule}
         * <p>
         * @return {@code this}
         * @param corsRule cors_rule block. This parameter is required.
         */
        public Builder corsRule(final com.hashicorp.cdktf.IResolvable corsRule) {
            this.config().corsRule(corsRule);
            return this;
        }
        /**
         * cors_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#cors_rule S3Bucket#cors_rule}
         * <p>
         * @return {@code this}
         * @param corsRule cors_rule block. This parameter is required.
         */
        public Builder corsRule(final java.util.List<? extends imports.aws.s3_bucket.S3BucketCorsRule> corsRule) {
            this.config().corsRule(corsRule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }

        /**
         * grant block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#grant S3Bucket#grant}
         * <p>
         * @return {@code this}
         * @param grant grant block. This parameter is required.
         */
        public Builder grant(final com.hashicorp.cdktf.IResolvable grant) {
            this.config().grant(grant);
            return this;
        }
        /**
         * grant block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#grant S3Bucket#grant}
         * <p>
         * @return {@code this}
         * @param grant grant block. This parameter is required.
         */
        public Builder grant(final java.util.List<? extends imports.aws.s3_bucket.S3BucketGrant> grant) {
            this.config().grant(grant);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * lifecycle_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#lifecycle_rule S3Bucket#lifecycle_rule}
         * <p>
         * @return {@code this}
         * @param lifecycleRule lifecycle_rule block. This parameter is required.
         */
        public Builder lifecycleRule(final com.hashicorp.cdktf.IResolvable lifecycleRule) {
            this.config().lifecycleRule(lifecycleRule);
            return this;
        }
        /**
         * lifecycle_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#lifecycle_rule S3Bucket#lifecycle_rule}
         * <p>
         * @return {@code this}
         * @param lifecycleRule lifecycle_rule block. This parameter is required.
         */
        public Builder lifecycleRule(final java.util.List<? extends imports.aws.s3_bucket.S3BucketLifecycleRule> lifecycleRule) {
            this.config().lifecycleRule(lifecycleRule);
            return this;
        }

        /**
         * logging block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#logging S3Bucket#logging}
         * <p>
         * @return {@code this}
         * @param logging logging block. This parameter is required.
         */
        public Builder logging(final imports.aws.s3_bucket.S3BucketLogging logging) {
            this.config().logging(logging);
            return this;
        }

        /**
         * object_lock_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_configuration S3Bucket#object_lock_configuration}
         * <p>
         * @return {@code this}
         * @param objectLockConfiguration object_lock_configuration block. This parameter is required.
         */
        public Builder objectLockConfiguration(final imports.aws.s3_bucket.S3BucketObjectLockConfiguration objectLockConfiguration) {
            this.config().objectLockConfiguration(objectLockConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
         * <p>
         * @return {@code this}
         * @param objectLockEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}. This parameter is required.
         */
        public Builder objectLockEnabled(final java.lang.Boolean objectLockEnabled) {
            this.config().objectLockEnabled(objectLockEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
         * <p>
         * @return {@code this}
         * @param objectLockEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}. This parameter is required.
         */
        public Builder objectLockEnabled(final com.hashicorp.cdktf.IResolvable objectLockEnabled) {
            this.config().objectLockEnabled(objectLockEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#policy S3Bucket#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#policy S3Bucket#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config().policy(policy);
            return this;
        }

        /**
         * replication_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replication_configuration S3Bucket#replication_configuration}
         * <p>
         * @return {@code this}
         * @param replicationConfiguration replication_configuration block. This parameter is required.
         */
        public Builder replicationConfiguration(final imports.aws.s3_bucket.S3BucketReplicationConfiguration replicationConfiguration) {
            this.config().replicationConfiguration(replicationConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#request_payer S3Bucket#request_payer}.
         * <p>
         * @return {@code this}
         * @param requestPayer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#request_payer S3Bucket#request_payer}. This parameter is required.
         */
        public Builder requestPayer(final java.lang.String requestPayer) {
            this.config().requestPayer(requestPayer);
            return this;
        }

        /**
         * server_side_encryption_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#server_side_encryption_configuration S3Bucket#server_side_encryption_configuration}
         * <p>
         * @return {@code this}
         * @param serverSideEncryptionConfiguration server_side_encryption_configuration block. This parameter is required.
         */
        public Builder serverSideEncryptionConfiguration(final imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration serverSideEncryptionConfiguration) {
            this.config().serverSideEncryptionConfiguration(serverSideEncryptionConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags_all S3Bucket#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags_all S3Bucket#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#timeouts S3Bucket#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.s3_bucket.S3BucketTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * versioning block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#versioning S3Bucket#versioning}
         * <p>
         * @return {@code this}
         * @param versioning versioning block. This parameter is required.
         */
        public Builder versioning(final imports.aws.s3_bucket.S3BucketVersioning versioning) {
            this.config().versioning(versioning);
            return this;
        }

        /**
         * website block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#website S3Bucket#website}
         * <p>
         * @return {@code this}
         * @param website website block. This parameter is required.
         */
        public Builder website(final imports.aws.s3_bucket.S3BucketWebsite website) {
            this.config().website(website);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.s3_bucket.S3Bucket}.
         */
        @Override
        public imports.aws.s3_bucket.S3Bucket build() {
            return new imports.aws.s3_bucket.S3Bucket(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.s3_bucket.S3BucketConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.s3_bucket.S3BucketConfig.Builder();
            }
            return this.config;
        }
    }
}
