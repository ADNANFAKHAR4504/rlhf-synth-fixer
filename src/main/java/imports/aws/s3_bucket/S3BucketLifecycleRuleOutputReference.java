package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketLifecycleRuleOutputReference")
public class S3BucketLifecycleRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketLifecycleRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketLifecycleRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3BucketLifecycleRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putExpiration(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration value) {
        software.amazon.jsii.Kernel.call(this, "putExpiration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoncurrentVersionExpiration(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration value) {
        software.amazon.jsii.Kernel.call(this, "putNoncurrentVersionExpiration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoncurrentVersionTransition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransition> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNoncurrentVersionTransition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTransition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleTransition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleTransition> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket.S3BucketLifecycleRuleTransition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket.S3BucketLifecycleRuleTransition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTransition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAbortIncompleteMultipartUploadDays() {
        software.amazon.jsii.Kernel.call(this, "resetAbortIncompleteMultipartUploadDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoncurrentVersionExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetNoncurrentVersionExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoncurrentVersionTransition() {
        software.amazon.jsii.Kernel.call(this, "resetNoncurrentVersionTransition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransition() {
        software.amazon.jsii.Kernel.call(this, "resetTransition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleExpirationOutputReference getExpiration() {
        return software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleExpirationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpirationOutputReference getNoncurrentVersionExpiration() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpirationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransitionList getNoncurrentVersionTransition() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransition", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionTransitionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket.S3BucketLifecycleRuleTransitionList getTransition() {
        return software.amazon.jsii.Kernel.get(this, "transition", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleTransitionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAbortIncompleteMultipartUploadDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUploadDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration getExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "expirationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleExpiration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration getNoncurrentVersionExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpirationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLifecycleRuleNoncurrentVersionExpiration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionTransitionInput() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitionInput() {
        return software.amazon.jsii.Kernel.get(this, "transitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAbortIncompleteMultipartUploadDays() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUploadDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAbortIncompleteMultipartUploadDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "abortIncompleteMultipartUploadDays", java.util.Objects.requireNonNull(value, "abortIncompleteMultipartUploadDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLifecycleRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
