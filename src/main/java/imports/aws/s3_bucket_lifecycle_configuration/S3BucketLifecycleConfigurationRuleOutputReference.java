package imports.aws.s3_bucket_lifecycle_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.257Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfigurationRuleOutputReference")
public class S3BucketLifecycleConfigurationRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketLifecycleConfigurationRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketLifecycleConfigurationRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3BucketLifecycleConfigurationRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAbortIncompleteMultipartUpload(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUpload __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAbortIncompleteMultipartUpload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExpiration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpiration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExpiration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoncurrentVersionExpiration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpiration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTransition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAbortIncompleteMultipartUpload() {
        software.amazon.jsii.Kernel.call(this, "resetAbortIncompleteMultipartUpload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpiration() {
        software.amazon.jsii.Kernel.call(this, "resetExpiration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
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

    public void resetTransition() {
        software.amazon.jsii.Kernel.call(this, "resetTransition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadList getAbortIncompleteMultipartUpload() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUpload", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpirationList getExpiration() {
        return software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleExpirationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilterList getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpirationList getNoncurrentVersionExpiration() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpiration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionExpirationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransitionList getNoncurrentVersionTransition() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransition", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleNoncurrentVersionTransitionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransitionList getTransition() {
        return software.amazon.jsii.Kernel.get(this, "transition", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransitionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAbortIncompleteMultipartUploadInput() {
        return software.amazon.jsii.Kernel.get(this, "abortIncompleteMultipartUploadInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "expirationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionExpirationInput() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionExpirationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoncurrentVersionTransitionInput() {
        return software.amazon.jsii.Kernel.get(this, "noncurrentVersionTransitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitionInput() {
        return software.amazon.jsii.Kernel.get(this, "transitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
