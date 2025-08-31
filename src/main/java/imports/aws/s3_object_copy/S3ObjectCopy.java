package imports.aws.s3_object_copy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy aws_s3_object_copy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ObjectCopy.S3ObjectCopy")
public class S3ObjectCopy extends com.hashicorp.cdktf.TerraformResource {

    protected S3ObjectCopy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ObjectCopy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.s3_object_copy.S3ObjectCopy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy aws_s3_object_copy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public S3ObjectCopy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a S3ObjectCopy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3ObjectCopy to import. This parameter is required.
     * @param importFromId The id of the existing S3ObjectCopy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the S3ObjectCopy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_object_copy.S3ObjectCopy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a S3ObjectCopy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3ObjectCopy to import. This parameter is required.
     * @param importFromId The id of the existing S3ObjectCopy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_object_copy.S3ObjectCopy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_object_copy.S3ObjectCopyGrant>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_object_copy.S3ObjectCopyGrant> __cast_cd4240 = (java.util.List<imports.aws.s3_object_copy.S3ObjectCopyGrant>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_object_copy.S3ObjectCopyGrant __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGrant", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOverrideProvider(final @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider value) {
        software.amazon.jsii.Kernel.call(this, "putOverrideProvider", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcl() {
        software.amazon.jsii.Kernel.call(this, "resetAcl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketKeyEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetBucketKeyEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheControl() {
        software.amazon.jsii.Kernel.call(this, "resetCacheControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChecksumAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetChecksumAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentDisposition() {
        software.amazon.jsii.Kernel.call(this, "resetContentDisposition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentEncoding() {
        software.amazon.jsii.Kernel.call(this, "resetContentEncoding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentLanguage() {
        software.amazon.jsii.Kernel.call(this, "resetContentLanguage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentType() {
        software.amazon.jsii.Kernel.call(this, "resetContentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyIfMatch() {
        software.amazon.jsii.Kernel.call(this, "resetCopyIfMatch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyIfModifiedSince() {
        software.amazon.jsii.Kernel.call(this, "resetCopyIfModifiedSince", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyIfNoneMatch() {
        software.amazon.jsii.Kernel.call(this, "resetCopyIfNoneMatch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyIfUnmodifiedSince() {
        software.amazon.jsii.Kernel.call(this, "resetCopyIfUnmodifiedSince", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerKey() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerKeyMd5() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerKeyMd5", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpectedBucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetExpectedBucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpectedSourceBucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetExpectedSourceBucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpires() {
        software.amazon.jsii.Kernel.call(this, "resetExpires", software.amazon.jsii.NativeType.VOID);
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

    public void resetKmsEncryptionContext() {
        software.amazon.jsii.Kernel.call(this, "resetKmsEncryptionContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataDirective() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataDirective", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectLockLegalHoldStatus() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockLegalHoldStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectLockMode() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectLockRetainUntilDate() {
        software.amazon.jsii.Kernel.call(this, "resetObjectLockRetainUntilDate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrideProvider() {
        software.amazon.jsii.Kernel.call(this, "resetOverrideProvider", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestPayer() {
        software.amazon.jsii.Kernel.call(this, "resetRequestPayer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceCustomerAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetSourceCustomerAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceCustomerKey() {
        software.amazon.jsii.Kernel.call(this, "resetSourceCustomerKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceCustomerKeyMd5() {
        software.amazon.jsii.Kernel.call(this, "resetSourceCustomerKeyMd5", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageClass() {
        software.amazon.jsii.Kernel.call(this, "resetStorageClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaggingDirective() {
        software.amazon.jsii.Kernel.call(this, "resetTaggingDirective", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebsiteRedirect() {
        software.amazon.jsii.Kernel.call(this, "resetWebsiteRedirect", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumCrc32() {
        return software.amazon.jsii.Kernel.get(this, "checksumCrc32", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumCrc32C() {
        return software.amazon.jsii.Kernel.get(this, "checksumCrc32C", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumCrc64Nvme() {
        return software.amazon.jsii.Kernel.get(this, "checksumCrc64Nvme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumSha1() {
        return software.amazon.jsii.Kernel.get(this, "checksumSha1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumSha256() {
        return software.amazon.jsii.Kernel.get(this, "checksumSha256", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEtag() {
        return software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpiration() {
        return software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyGrantList getGrant() {
        return software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyGrantList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModified() {
        return software.amazon.jsii.Kernel.get(this, "lastModified", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderOutputReference getOverrideProvider() {
        return software.amazon.jsii.Kernel.get(this, "overrideProvider", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getRequestCharged() {
        return software.amazon.jsii.Kernel.get(this, "requestCharged", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceVersionId() {
        return software.amazon.jsii.Kernel.get(this, "sourceVersionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionId() {
        return software.amazon.jsii.Kernel.get(this, "versionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAclInput() {
        return software.amazon.jsii.Kernel.get(this, "aclInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBucketKeyEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketKeyEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheControlInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getChecksumAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "checksumAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentDispositionInput() {
        return software.amazon.jsii.Kernel.get(this, "contentDispositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentEncodingInput() {
        return software.amazon.jsii.Kernel.get(this, "contentEncodingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentLanguageInput() {
        return software.amazon.jsii.Kernel.get(this, "contentLanguageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyIfMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "copyIfMatchInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyIfModifiedSinceInput() {
        return software.amazon.jsii.Kernel.get(this, "copyIfModifiedSinceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyIfNoneMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "copyIfNoneMatchInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopyIfUnmodifiedSinceInput() {
        return software.amazon.jsii.Kernel.get(this, "copyIfUnmodifiedSinceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "customerAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "customerKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerKeyMd5Input() {
        return software.amazon.jsii.Kernel.get(this, "customerKeyMd5Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpectedSourceBucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "expectedSourceBucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpiresInput() {
        return software.amazon.jsii.Kernel.get(this, "expiresInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "keyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsEncryptionContextInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncryptionContextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetadataDirectiveInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataDirectiveInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getMetadataInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "metadataInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectLockLegalHoldStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockLegalHoldStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectLockModeInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectLockRetainUntilDateInput() {
        return software.amazon.jsii.Kernel.get(this, "objectLockRetainUntilDateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider getOverrideProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideProviderInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequestPayerInput() {
        return software.amazon.jsii.Kernel.get(this, "requestPayerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerKeyMd5Input() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerKeyMd5Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageClassInput() {
        return software.amazon.jsii.Kernel.get(this, "storageClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaggingDirectiveInput() {
        return software.amazon.jsii.Kernel.get(this, "taggingDirectiveInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWebsiteRedirectInput() {
        return software.amazon.jsii.Kernel.get(this, "websiteRedirectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getBucketKeyEnabled() {
        return software.amazon.jsii.Kernel.get(this, "bucketKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBucketKeyEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bucketKeyEnabled", java.util.Objects.requireNonNull(value, "bucketKeyEnabled is required"));
    }

    public void setBucketKeyEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bucketKeyEnabled", java.util.Objects.requireNonNull(value, "bucketKeyEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheControl() {
        return software.amazon.jsii.Kernel.get(this, "cacheControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheControl", java.util.Objects.requireNonNull(value, "cacheControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChecksumAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "checksumAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setChecksumAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "checksumAlgorithm", java.util.Objects.requireNonNull(value, "checksumAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentDisposition() {
        return software.amazon.jsii.Kernel.get(this, "contentDisposition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentDisposition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentDisposition", java.util.Objects.requireNonNull(value, "contentDisposition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentEncoding() {
        return software.amazon.jsii.Kernel.get(this, "contentEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentEncoding(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentEncoding", java.util.Objects.requireNonNull(value, "contentEncoding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentLanguage() {
        return software.amazon.jsii.Kernel.get(this, "contentLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentLanguage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentLanguage", java.util.Objects.requireNonNull(value, "contentLanguage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentType() {
        return software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentType", java.util.Objects.requireNonNull(value, "contentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyIfMatch() {
        return software.amazon.jsii.Kernel.get(this, "copyIfMatch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyIfMatch(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyIfMatch", java.util.Objects.requireNonNull(value, "copyIfMatch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyIfModifiedSince() {
        return software.amazon.jsii.Kernel.get(this, "copyIfModifiedSince", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyIfModifiedSince(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyIfModifiedSince", java.util.Objects.requireNonNull(value, "copyIfModifiedSince is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyIfNoneMatch() {
        return software.amazon.jsii.Kernel.get(this, "copyIfNoneMatch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyIfNoneMatch(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyIfNoneMatch", java.util.Objects.requireNonNull(value, "copyIfNoneMatch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopyIfUnmodifiedSince() {
        return software.amazon.jsii.Kernel.get(this, "copyIfUnmodifiedSince", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopyIfUnmodifiedSince(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copyIfUnmodifiedSince", java.util.Objects.requireNonNull(value, "copyIfUnmodifiedSince is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "customerAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerAlgorithm", java.util.Objects.requireNonNull(value, "customerAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerKey() {
        return software.amazon.jsii.Kernel.get(this, "customerKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerKey", java.util.Objects.requireNonNull(value, "customerKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerKeyMd5() {
        return software.amazon.jsii.Kernel.get(this, "customerKeyMd5", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerKeyMd5(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerKeyMd5", java.util.Objects.requireNonNull(value, "customerKeyMd5 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpectedBucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpectedBucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expectedBucketOwner", java.util.Objects.requireNonNull(value, "expectedBucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpectedSourceBucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "expectedSourceBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpectedSourceBucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expectedSourceBucketOwner", java.util.Objects.requireNonNull(value, "expectedSourceBucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpires() {
        return software.amazon.jsii.Kernel.get(this, "expires", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpires(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expires", java.util.Objects.requireNonNull(value, "expires is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getKey() {
        return software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "key", java.util.Objects.requireNonNull(value, "key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsEncryptionContext() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncryptionContext", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsEncryptionContext(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsEncryptionContext", java.util.Objects.requireNonNull(value, "kmsEncryptionContext is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getMetadata() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setMetadata(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "metadata", java.util.Objects.requireNonNull(value, "metadata is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetadataDirective() {
        return software.amazon.jsii.Kernel.get(this, "metadataDirective", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetadataDirective(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metadataDirective", java.util.Objects.requireNonNull(value, "metadataDirective is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectLockLegalHoldStatus() {
        return software.amazon.jsii.Kernel.get(this, "objectLockLegalHoldStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectLockLegalHoldStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectLockLegalHoldStatus", java.util.Objects.requireNonNull(value, "objectLockLegalHoldStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectLockMode() {
        return software.amazon.jsii.Kernel.get(this, "objectLockMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectLockMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectLockMode", java.util.Objects.requireNonNull(value, "objectLockMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectLockRetainUntilDate() {
        return software.amazon.jsii.Kernel.get(this, "objectLockRetainUntilDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectLockRetainUntilDate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectLockRetainUntilDate", java.util.Objects.requireNonNull(value, "objectLockRetainUntilDate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequestPayer() {
        return software.amazon.jsii.Kernel.get(this, "requestPayer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequestPayer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requestPayer", java.util.Objects.requireNonNull(value, "requestPayer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerSideEncryption() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerSideEncryption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverSideEncryption", java.util.Objects.requireNonNull(value, "serverSideEncryption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSource() {
        return software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "source", java.util.Objects.requireNonNull(value, "source is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCustomerAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceCustomerAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceCustomerAlgorithm", java.util.Objects.requireNonNull(value, "sourceCustomerAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCustomerKey() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceCustomerKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceCustomerKey", java.util.Objects.requireNonNull(value, "sourceCustomerKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCustomerKeyMd5() {
        return software.amazon.jsii.Kernel.get(this, "sourceCustomerKeyMd5", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceCustomerKeyMd5(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceCustomerKeyMd5", java.util.Objects.requireNonNull(value, "sourceCustomerKeyMd5 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageClass() {
        return software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageClass", java.util.Objects.requireNonNull(value, "storageClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaggingDirective() {
        return software.amazon.jsii.Kernel.get(this, "taggingDirective", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaggingDirective(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taggingDirective", java.util.Objects.requireNonNull(value, "taggingDirective is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getWebsiteRedirect() {
        return software.amazon.jsii.Kernel.get(this, "websiteRedirect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWebsiteRedirect(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "websiteRedirect", java.util.Objects.requireNonNull(value, "websiteRedirect is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.s3_object_copy.S3ObjectCopy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.s3_object_copy.S3ObjectCopy> {
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
        private final imports.aws.s3_object_copy.S3ObjectCopyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.s3_object_copy.S3ObjectCopyConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket S3ObjectCopy#bucket}.
         * <p>
         * @return {@code this}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket S3ObjectCopy#bucket}. This parameter is required.
         */
        public Builder bucket(final java.lang.String bucket) {
            this.config.bucket(bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#key S3ObjectCopy#key}.
         * <p>
         * @return {@code this}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#key S3ObjectCopy#key}. This parameter is required.
         */
        public Builder key(final java.lang.String key) {
            this.config.key(key);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source S3ObjectCopy#source}.
         * <p>
         * @return {@code this}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source S3ObjectCopy#source}. This parameter is required.
         */
        public Builder source(final java.lang.String source) {
            this.config.source(source);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#acl S3ObjectCopy#acl}.
         * <p>
         * @return {@code this}
         * @param acl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#acl S3ObjectCopy#acl}. This parameter is required.
         */
        public Builder acl(final java.lang.String acl) {
            this.config.acl(acl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}.
         * <p>
         * @return {@code this}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}. This parameter is required.
         */
        public Builder bucketKeyEnabled(final java.lang.Boolean bucketKeyEnabled) {
            this.config.bucketKeyEnabled(bucketKeyEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}.
         * <p>
         * @return {@code this}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}. This parameter is required.
         */
        public Builder bucketKeyEnabled(final com.hashicorp.cdktf.IResolvable bucketKeyEnabled) {
            this.config.bucketKeyEnabled(bucketKeyEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#cache_control S3ObjectCopy#cache_control}.
         * <p>
         * @return {@code this}
         * @param cacheControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#cache_control S3ObjectCopy#cache_control}. This parameter is required.
         */
        public Builder cacheControl(final java.lang.String cacheControl) {
            this.config.cacheControl(cacheControl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#checksum_algorithm S3ObjectCopy#checksum_algorithm}.
         * <p>
         * @return {@code this}
         * @param checksumAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#checksum_algorithm S3ObjectCopy#checksum_algorithm}. This parameter is required.
         */
        public Builder checksumAlgorithm(final java.lang.String checksumAlgorithm) {
            this.config.checksumAlgorithm(checksumAlgorithm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_disposition S3ObjectCopy#content_disposition}.
         * <p>
         * @return {@code this}
         * @param contentDisposition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_disposition S3ObjectCopy#content_disposition}. This parameter is required.
         */
        public Builder contentDisposition(final java.lang.String contentDisposition) {
            this.config.contentDisposition(contentDisposition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_encoding S3ObjectCopy#content_encoding}.
         * <p>
         * @return {@code this}
         * @param contentEncoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_encoding S3ObjectCopy#content_encoding}. This parameter is required.
         */
        public Builder contentEncoding(final java.lang.String contentEncoding) {
            this.config.contentEncoding(contentEncoding);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_language S3ObjectCopy#content_language}.
         * <p>
         * @return {@code this}
         * @param contentLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_language S3ObjectCopy#content_language}. This parameter is required.
         */
        public Builder contentLanguage(final java.lang.String contentLanguage) {
            this.config.contentLanguage(contentLanguage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_type S3ObjectCopy#content_type}.
         * <p>
         * @return {@code this}
         * @param contentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_type S3ObjectCopy#content_type}. This parameter is required.
         */
        public Builder contentType(final java.lang.String contentType) {
            this.config.contentType(contentType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_match S3ObjectCopy#copy_if_match}.
         * <p>
         * @return {@code this}
         * @param copyIfMatch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_match S3ObjectCopy#copy_if_match}. This parameter is required.
         */
        public Builder copyIfMatch(final java.lang.String copyIfMatch) {
            this.config.copyIfMatch(copyIfMatch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_modified_since S3ObjectCopy#copy_if_modified_since}.
         * <p>
         * @return {@code this}
         * @param copyIfModifiedSince Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_modified_since S3ObjectCopy#copy_if_modified_since}. This parameter is required.
         */
        public Builder copyIfModifiedSince(final java.lang.String copyIfModifiedSince) {
            this.config.copyIfModifiedSince(copyIfModifiedSince);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_none_match S3ObjectCopy#copy_if_none_match}.
         * <p>
         * @return {@code this}
         * @param copyIfNoneMatch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_none_match S3ObjectCopy#copy_if_none_match}. This parameter is required.
         */
        public Builder copyIfNoneMatch(final java.lang.String copyIfNoneMatch) {
            this.config.copyIfNoneMatch(copyIfNoneMatch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_unmodified_since S3ObjectCopy#copy_if_unmodified_since}.
         * <p>
         * @return {@code this}
         * @param copyIfUnmodifiedSince Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_unmodified_since S3ObjectCopy#copy_if_unmodified_since}. This parameter is required.
         */
        public Builder copyIfUnmodifiedSince(final java.lang.String copyIfUnmodifiedSince) {
            this.config.copyIfUnmodifiedSince(copyIfUnmodifiedSince);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_algorithm S3ObjectCopy#customer_algorithm}.
         * <p>
         * @return {@code this}
         * @param customerAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_algorithm S3ObjectCopy#customer_algorithm}. This parameter is required.
         */
        public Builder customerAlgorithm(final java.lang.String customerAlgorithm) {
            this.config.customerAlgorithm(customerAlgorithm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key S3ObjectCopy#customer_key}.
         * <p>
         * @return {@code this}
         * @param customerKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key S3ObjectCopy#customer_key}. This parameter is required.
         */
        public Builder customerKey(final java.lang.String customerKey) {
            this.config.customerKey(customerKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key_md5 S3ObjectCopy#customer_key_md5}.
         * <p>
         * @return {@code this}
         * @param customerKeyMd5 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key_md5 S3ObjectCopy#customer_key_md5}. This parameter is required.
         */
        public Builder customerKeyMd5(final java.lang.String customerKeyMd5) {
            this.config.customerKeyMd5(customerKeyMd5);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_bucket_owner S3ObjectCopy#expected_bucket_owner}.
         * <p>
         * @return {@code this}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_bucket_owner S3ObjectCopy#expected_bucket_owner}. This parameter is required.
         */
        public Builder expectedBucketOwner(final java.lang.String expectedBucketOwner) {
            this.config.expectedBucketOwner(expectedBucketOwner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_source_bucket_owner S3ObjectCopy#expected_source_bucket_owner}.
         * <p>
         * @return {@code this}
         * @param expectedSourceBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_source_bucket_owner S3ObjectCopy#expected_source_bucket_owner}. This parameter is required.
         */
        public Builder expectedSourceBucketOwner(final java.lang.String expectedSourceBucketOwner) {
            this.config.expectedSourceBucketOwner(expectedSourceBucketOwner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expires S3ObjectCopy#expires}.
         * <p>
         * @return {@code this}
         * @param expires Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expires S3ObjectCopy#expires}. This parameter is required.
         */
        public Builder expires(final java.lang.String expires) {
            this.config.expires(expires);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }

        /**
         * grant block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#grant S3ObjectCopy#grant}
         * <p>
         * @return {@code this}
         * @param grant grant block. This parameter is required.
         */
        public Builder grant(final com.hashicorp.cdktf.IResolvable grant) {
            this.config.grant(grant);
            return this;
        }
        /**
         * grant block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#grant S3ObjectCopy#grant}
         * <p>
         * @return {@code this}
         * @param grant grant block. This parameter is required.
         */
        public Builder grant(final java.util.List<? extends imports.aws.s3_object_copy.S3ObjectCopyGrant> grant) {
            this.config.grant(grant);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_encryption_context S3ObjectCopy#kms_encryption_context}.
         * <p>
         * @return {@code this}
         * @param kmsEncryptionContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_encryption_context S3ObjectCopy#kms_encryption_context}. This parameter is required.
         */
        public Builder kmsEncryptionContext(final java.lang.String kmsEncryptionContext) {
            this.config.kmsEncryptionContext(kmsEncryptionContext);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_key_id S3ObjectCopy#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_key_id S3ObjectCopy#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata S3ObjectCopy#metadata}.
         * <p>
         * @return {@code this}
         * @param metadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata S3ObjectCopy#metadata}. This parameter is required.
         */
        public Builder metadata(final java.util.Map<java.lang.String, java.lang.String> metadata) {
            this.config.metadata(metadata);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata_directive S3ObjectCopy#metadata_directive}.
         * <p>
         * @return {@code this}
         * @param metadataDirective Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata_directive S3ObjectCopy#metadata_directive}. This parameter is required.
         */
        public Builder metadataDirective(final java.lang.String metadataDirective) {
            this.config.metadataDirective(metadataDirective);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_legal_hold_status S3ObjectCopy#object_lock_legal_hold_status}.
         * <p>
         * @return {@code this}
         * @param objectLockLegalHoldStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_legal_hold_status S3ObjectCopy#object_lock_legal_hold_status}. This parameter is required.
         */
        public Builder objectLockLegalHoldStatus(final java.lang.String objectLockLegalHoldStatus) {
            this.config.objectLockLegalHoldStatus(objectLockLegalHoldStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_mode S3ObjectCopy#object_lock_mode}.
         * <p>
         * @return {@code this}
         * @param objectLockMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_mode S3ObjectCopy#object_lock_mode}. This parameter is required.
         */
        public Builder objectLockMode(final java.lang.String objectLockMode) {
            this.config.objectLockMode(objectLockMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_retain_until_date S3ObjectCopy#object_lock_retain_until_date}.
         * <p>
         * @return {@code this}
         * @param objectLockRetainUntilDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_retain_until_date S3ObjectCopy#object_lock_retain_until_date}. This parameter is required.
         */
        public Builder objectLockRetainUntilDate(final java.lang.String objectLockRetainUntilDate) {
            this.config.objectLockRetainUntilDate(objectLockRetainUntilDate);
            return this;
        }

        /**
         * override_provider block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#override_provider S3ObjectCopy#override_provider}
         * <p>
         * @return {@code this}
         * @param overrideProvider override_provider block. This parameter is required.
         */
        public Builder overrideProvider(final imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider overrideProvider) {
            this.config.overrideProvider(overrideProvider);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#request_payer S3ObjectCopy#request_payer}.
         * <p>
         * @return {@code this}
         * @param requestPayer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#request_payer S3ObjectCopy#request_payer}. This parameter is required.
         */
        public Builder requestPayer(final java.lang.String requestPayer) {
            this.config.requestPayer(requestPayer);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#server_side_encryption S3ObjectCopy#server_side_encryption}.
         * <p>
         * @return {@code this}
         * @param serverSideEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#server_side_encryption S3ObjectCopy#server_side_encryption}. This parameter is required.
         */
        public Builder serverSideEncryption(final java.lang.String serverSideEncryption) {
            this.config.serverSideEncryption(serverSideEncryption);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_algorithm S3ObjectCopy#source_customer_algorithm}.
         * <p>
         * @return {@code this}
         * @param sourceCustomerAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_algorithm S3ObjectCopy#source_customer_algorithm}. This parameter is required.
         */
        public Builder sourceCustomerAlgorithm(final java.lang.String sourceCustomerAlgorithm) {
            this.config.sourceCustomerAlgorithm(sourceCustomerAlgorithm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key S3ObjectCopy#source_customer_key}.
         * <p>
         * @return {@code this}
         * @param sourceCustomerKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key S3ObjectCopy#source_customer_key}. This parameter is required.
         */
        public Builder sourceCustomerKey(final java.lang.String sourceCustomerKey) {
            this.config.sourceCustomerKey(sourceCustomerKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key_md5 S3ObjectCopy#source_customer_key_md5}.
         * <p>
         * @return {@code this}
         * @param sourceCustomerKeyMd5 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key_md5 S3ObjectCopy#source_customer_key_md5}. This parameter is required.
         */
        public Builder sourceCustomerKeyMd5(final java.lang.String sourceCustomerKeyMd5) {
            this.config.sourceCustomerKeyMd5(sourceCustomerKeyMd5);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#storage_class S3ObjectCopy#storage_class}.
         * <p>
         * @return {@code this}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#storage_class S3ObjectCopy#storage_class}. This parameter is required.
         */
        public Builder storageClass(final java.lang.String storageClass) {
            this.config.storageClass(storageClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tagging_directive S3ObjectCopy#tagging_directive}.
         * <p>
         * @return {@code this}
         * @param taggingDirective Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tagging_directive S3ObjectCopy#tagging_directive}. This parameter is required.
         */
        public Builder taggingDirective(final java.lang.String taggingDirective) {
            this.config.taggingDirective(taggingDirective);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags S3ObjectCopy#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags S3ObjectCopy#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags_all S3ObjectCopy#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags_all S3ObjectCopy#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#website_redirect S3ObjectCopy#website_redirect}.
         * <p>
         * @return {@code this}
         * @param websiteRedirect Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#website_redirect S3ObjectCopy#website_redirect}. This parameter is required.
         */
        public Builder websiteRedirect(final java.lang.String websiteRedirect) {
            this.config.websiteRedirect(websiteRedirect);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.s3_object_copy.S3ObjectCopy}.
         */
        @Override
        public imports.aws.s3_object_copy.S3ObjectCopy build() {
            return new imports.aws.s3_object_copy.S3ObjectCopy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
