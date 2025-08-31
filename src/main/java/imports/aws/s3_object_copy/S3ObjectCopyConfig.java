package imports.aws.s3_object_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.292Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ObjectCopy.S3ObjectCopyConfig")
@software.amazon.jsii.Jsii.Proxy(S3ObjectCopyConfig.Jsii$Proxy.class)
public interface S3ObjectCopyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket S3ObjectCopy#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#key S3ObjectCopy#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source S3ObjectCopy#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#acl S3ObjectCopy#acl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBucketKeyEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#cache_control S3ObjectCopy#cache_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#checksum_algorithm S3ObjectCopy#checksum_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getChecksumAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_disposition S3ObjectCopy#content_disposition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentDisposition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_encoding S3ObjectCopy#content_encoding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentEncoding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_language S3ObjectCopy#content_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_type S3ObjectCopy#content_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_match S3ObjectCopy#copy_if_match}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyIfMatch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_modified_since S3ObjectCopy#copy_if_modified_since}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyIfModifiedSince() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_none_match S3ObjectCopy#copy_if_none_match}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyIfNoneMatch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_unmodified_since S3ObjectCopy#copy_if_unmodified_since}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyIfUnmodifiedSince() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_algorithm S3ObjectCopy#customer_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key S3ObjectCopy#customer_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key_md5 S3ObjectCopy#customer_key_md5}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerKeyMd5() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_bucket_owner S3ObjectCopy#expected_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_source_bucket_owner S3ObjectCopy#expected_source_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpectedSourceBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expires S3ObjectCopy#expires}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpires() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * grant block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#grant S3ObjectCopy#grant}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGrant() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_encryption_context S3ObjectCopy#kms_encryption_context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsEncryptionContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_key_id S3ObjectCopy#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata S3ObjectCopy#metadata}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata_directive S3ObjectCopy#metadata_directive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetadataDirective() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_legal_hold_status S3ObjectCopy#object_lock_legal_hold_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockLegalHoldStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_mode S3ObjectCopy#object_lock_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_retain_until_date S3ObjectCopy#object_lock_retain_until_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockRetainUntilDate() {
        return null;
    }

    /**
     * override_provider block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#override_provider S3ObjectCopy#override_provider}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider getOverrideProvider() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#request_payer S3ObjectCopy#request_payer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestPayer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#server_side_encryption S3ObjectCopy#server_side_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_algorithm S3ObjectCopy#source_customer_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key S3ObjectCopy#source_customer_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key_md5 S3ObjectCopy#source_customer_key_md5}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceCustomerKeyMd5() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#storage_class S3ObjectCopy#storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tagging_directive S3ObjectCopy#tagging_directive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaggingDirective() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags S3ObjectCopy#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags_all S3ObjectCopy#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#website_redirect S3ObjectCopy#website_redirect}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebsiteRedirect() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ObjectCopyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ObjectCopyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ObjectCopyConfig> {
        java.lang.String bucket;
        java.lang.String key;
        java.lang.String source;
        java.lang.String acl;
        java.lang.Object bucketKeyEnabled;
        java.lang.String cacheControl;
        java.lang.String checksumAlgorithm;
        java.lang.String contentDisposition;
        java.lang.String contentEncoding;
        java.lang.String contentLanguage;
        java.lang.String contentType;
        java.lang.String copyIfMatch;
        java.lang.String copyIfModifiedSince;
        java.lang.String copyIfNoneMatch;
        java.lang.String copyIfUnmodifiedSince;
        java.lang.String customerAlgorithm;
        java.lang.String customerKey;
        java.lang.String customerKeyMd5;
        java.lang.String expectedBucketOwner;
        java.lang.String expectedSourceBucketOwner;
        java.lang.String expires;
        java.lang.Object forceDestroy;
        java.lang.Object grant;
        java.lang.String id;
        java.lang.String kmsEncryptionContext;
        java.lang.String kmsKeyId;
        java.util.Map<java.lang.String, java.lang.String> metadata;
        java.lang.String metadataDirective;
        java.lang.String objectLockLegalHoldStatus;
        java.lang.String objectLockMode;
        java.lang.String objectLockRetainUntilDate;
        imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider overrideProvider;
        java.lang.String requestPayer;
        java.lang.String serverSideEncryption;
        java.lang.String sourceCustomerAlgorithm;
        java.lang.String sourceCustomerKey;
        java.lang.String sourceCustomerKeyMd5;
        java.lang.String storageClass;
        java.lang.String taggingDirective;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String websiteRedirect;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket S3ObjectCopy#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#key S3ObjectCopy#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source S3ObjectCopy#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getAcl}
         * @param acl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#acl S3ObjectCopy#acl}.
         * @return {@code this}
         */
        public Builder acl(java.lang.String acl) {
            this.acl = acl;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(java.lang.Boolean bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#bucket_key_enabled S3ObjectCopy#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(com.hashicorp.cdktf.IResolvable bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCacheControl}
         * @param cacheControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#cache_control S3ObjectCopy#cache_control}.
         * @return {@code this}
         */
        public Builder cacheControl(java.lang.String cacheControl) {
            this.cacheControl = cacheControl;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getChecksumAlgorithm}
         * @param checksumAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#checksum_algorithm S3ObjectCopy#checksum_algorithm}.
         * @return {@code this}
         */
        public Builder checksumAlgorithm(java.lang.String checksumAlgorithm) {
            this.checksumAlgorithm = checksumAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getContentDisposition}
         * @param contentDisposition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_disposition S3ObjectCopy#content_disposition}.
         * @return {@code this}
         */
        public Builder contentDisposition(java.lang.String contentDisposition) {
            this.contentDisposition = contentDisposition;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getContentEncoding}
         * @param contentEncoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_encoding S3ObjectCopy#content_encoding}.
         * @return {@code this}
         */
        public Builder contentEncoding(java.lang.String contentEncoding) {
            this.contentEncoding = contentEncoding;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getContentLanguage}
         * @param contentLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_language S3ObjectCopy#content_language}.
         * @return {@code this}
         */
        public Builder contentLanguage(java.lang.String contentLanguage) {
            this.contentLanguage = contentLanguage;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getContentType}
         * @param contentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#content_type S3ObjectCopy#content_type}.
         * @return {@code this}
         */
        public Builder contentType(java.lang.String contentType) {
            this.contentType = contentType;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCopyIfMatch}
         * @param copyIfMatch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_match S3ObjectCopy#copy_if_match}.
         * @return {@code this}
         */
        public Builder copyIfMatch(java.lang.String copyIfMatch) {
            this.copyIfMatch = copyIfMatch;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCopyIfModifiedSince}
         * @param copyIfModifiedSince Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_modified_since S3ObjectCopy#copy_if_modified_since}.
         * @return {@code this}
         */
        public Builder copyIfModifiedSince(java.lang.String copyIfModifiedSince) {
            this.copyIfModifiedSince = copyIfModifiedSince;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCopyIfNoneMatch}
         * @param copyIfNoneMatch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_none_match S3ObjectCopy#copy_if_none_match}.
         * @return {@code this}
         */
        public Builder copyIfNoneMatch(java.lang.String copyIfNoneMatch) {
            this.copyIfNoneMatch = copyIfNoneMatch;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCopyIfUnmodifiedSince}
         * @param copyIfUnmodifiedSince Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#copy_if_unmodified_since S3ObjectCopy#copy_if_unmodified_since}.
         * @return {@code this}
         */
        public Builder copyIfUnmodifiedSince(java.lang.String copyIfUnmodifiedSince) {
            this.copyIfUnmodifiedSince = copyIfUnmodifiedSince;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCustomerAlgorithm}
         * @param customerAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_algorithm S3ObjectCopy#customer_algorithm}.
         * @return {@code this}
         */
        public Builder customerAlgorithm(java.lang.String customerAlgorithm) {
            this.customerAlgorithm = customerAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCustomerKey}
         * @param customerKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key S3ObjectCopy#customer_key}.
         * @return {@code this}
         */
        public Builder customerKey(java.lang.String customerKey) {
            this.customerKey = customerKey;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCustomerKeyMd5}
         * @param customerKeyMd5 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#customer_key_md5 S3ObjectCopy#customer_key_md5}.
         * @return {@code this}
         */
        public Builder customerKeyMd5(java.lang.String customerKeyMd5) {
            this.customerKeyMd5 = customerKeyMd5;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getExpectedBucketOwner}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_bucket_owner S3ObjectCopy#expected_bucket_owner}.
         * @return {@code this}
         */
        public Builder expectedBucketOwner(java.lang.String expectedBucketOwner) {
            this.expectedBucketOwner = expectedBucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getExpectedSourceBucketOwner}
         * @param expectedSourceBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expected_source_bucket_owner S3ObjectCopy#expected_source_bucket_owner}.
         * @return {@code this}
         */
        public Builder expectedSourceBucketOwner(java.lang.String expectedSourceBucketOwner) {
            this.expectedSourceBucketOwner = expectedSourceBucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getExpires}
         * @param expires Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#expires S3ObjectCopy#expires}.
         * @return {@code this}
         */
        public Builder expires(java.lang.String expires) {
            this.expires = expires;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#force_destroy S3ObjectCopy#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#grant S3ObjectCopy#grant}
         * @return {@code this}
         */
        public Builder grant(com.hashicorp.cdktf.IResolvable grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#grant S3ObjectCopy#grant}
         * @return {@code this}
         */
        public Builder grant(java.util.List<? extends imports.aws.s3_object_copy.S3ObjectCopyGrant> grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#id S3ObjectCopy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getKmsEncryptionContext}
         * @param kmsEncryptionContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_encryption_context S3ObjectCopy#kms_encryption_context}.
         * @return {@code this}
         */
        public Builder kmsEncryptionContext(java.lang.String kmsEncryptionContext) {
            this.kmsEncryptionContext = kmsEncryptionContext;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#kms_key_id S3ObjectCopy#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getMetadata}
         * @param metadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata S3ObjectCopy#metadata}.
         * @return {@code this}
         */
        public Builder metadata(java.util.Map<java.lang.String, java.lang.String> metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getMetadataDirective}
         * @param metadataDirective Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#metadata_directive S3ObjectCopy#metadata_directive}.
         * @return {@code this}
         */
        public Builder metadataDirective(java.lang.String metadataDirective) {
            this.metadataDirective = metadataDirective;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getObjectLockLegalHoldStatus}
         * @param objectLockLegalHoldStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_legal_hold_status S3ObjectCopy#object_lock_legal_hold_status}.
         * @return {@code this}
         */
        public Builder objectLockLegalHoldStatus(java.lang.String objectLockLegalHoldStatus) {
            this.objectLockLegalHoldStatus = objectLockLegalHoldStatus;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getObjectLockMode}
         * @param objectLockMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_mode S3ObjectCopy#object_lock_mode}.
         * @return {@code this}
         */
        public Builder objectLockMode(java.lang.String objectLockMode) {
            this.objectLockMode = objectLockMode;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getObjectLockRetainUntilDate}
         * @param objectLockRetainUntilDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#object_lock_retain_until_date S3ObjectCopy#object_lock_retain_until_date}.
         * @return {@code this}
         */
        public Builder objectLockRetainUntilDate(java.lang.String objectLockRetainUntilDate) {
            this.objectLockRetainUntilDate = objectLockRetainUntilDate;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getOverrideProvider}
         * @param overrideProvider override_provider block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#override_provider S3ObjectCopy#override_provider}
         * @return {@code this}
         */
        public Builder overrideProvider(imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider overrideProvider) {
            this.overrideProvider = overrideProvider;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getRequestPayer}
         * @param requestPayer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#request_payer S3ObjectCopy#request_payer}.
         * @return {@code this}
         */
        public Builder requestPayer(java.lang.String requestPayer) {
            this.requestPayer = requestPayer;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getServerSideEncryption}
         * @param serverSideEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#server_side_encryption S3ObjectCopy#server_side_encryption}.
         * @return {@code this}
         */
        public Builder serverSideEncryption(java.lang.String serverSideEncryption) {
            this.serverSideEncryption = serverSideEncryption;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getSourceCustomerAlgorithm}
         * @param sourceCustomerAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_algorithm S3ObjectCopy#source_customer_algorithm}.
         * @return {@code this}
         */
        public Builder sourceCustomerAlgorithm(java.lang.String sourceCustomerAlgorithm) {
            this.sourceCustomerAlgorithm = sourceCustomerAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getSourceCustomerKey}
         * @param sourceCustomerKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key S3ObjectCopy#source_customer_key}.
         * @return {@code this}
         */
        public Builder sourceCustomerKey(java.lang.String sourceCustomerKey) {
            this.sourceCustomerKey = sourceCustomerKey;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getSourceCustomerKeyMd5}
         * @param sourceCustomerKeyMd5 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#source_customer_key_md5 S3ObjectCopy#source_customer_key_md5}.
         * @return {@code this}
         */
        public Builder sourceCustomerKeyMd5(java.lang.String sourceCustomerKeyMd5) {
            this.sourceCustomerKeyMd5 = sourceCustomerKeyMd5;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#storage_class S3ObjectCopy#storage_class}.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getTaggingDirective}
         * @param taggingDirective Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tagging_directive S3ObjectCopy#tagging_directive}.
         * @return {@code this}
         */
        public Builder taggingDirective(java.lang.String taggingDirective) {
            this.taggingDirective = taggingDirective;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags S3ObjectCopy#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#tags_all S3ObjectCopy#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getWebsiteRedirect}
         * @param websiteRedirect Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object_copy#website_redirect S3ObjectCopy#website_redirect}.
         * @return {@code this}
         */
        public Builder websiteRedirect(java.lang.String websiteRedirect) {
            this.websiteRedirect = websiteRedirect;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3ObjectCopyConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ObjectCopyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ObjectCopyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ObjectCopyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ObjectCopyConfig {
        private final java.lang.String bucket;
        private final java.lang.String key;
        private final java.lang.String source;
        private final java.lang.String acl;
        private final java.lang.Object bucketKeyEnabled;
        private final java.lang.String cacheControl;
        private final java.lang.String checksumAlgorithm;
        private final java.lang.String contentDisposition;
        private final java.lang.String contentEncoding;
        private final java.lang.String contentLanguage;
        private final java.lang.String contentType;
        private final java.lang.String copyIfMatch;
        private final java.lang.String copyIfModifiedSince;
        private final java.lang.String copyIfNoneMatch;
        private final java.lang.String copyIfUnmodifiedSince;
        private final java.lang.String customerAlgorithm;
        private final java.lang.String customerKey;
        private final java.lang.String customerKeyMd5;
        private final java.lang.String expectedBucketOwner;
        private final java.lang.String expectedSourceBucketOwner;
        private final java.lang.String expires;
        private final java.lang.Object forceDestroy;
        private final java.lang.Object grant;
        private final java.lang.String id;
        private final java.lang.String kmsEncryptionContext;
        private final java.lang.String kmsKeyId;
        private final java.util.Map<java.lang.String, java.lang.String> metadata;
        private final java.lang.String metadataDirective;
        private final java.lang.String objectLockLegalHoldStatus;
        private final java.lang.String objectLockMode;
        private final java.lang.String objectLockRetainUntilDate;
        private final imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider overrideProvider;
        private final java.lang.String requestPayer;
        private final java.lang.String serverSideEncryption;
        private final java.lang.String sourceCustomerAlgorithm;
        private final java.lang.String sourceCustomerKey;
        private final java.lang.String sourceCustomerKeyMd5;
        private final java.lang.String storageClass;
        private final java.lang.String taggingDirective;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String websiteRedirect;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acl = software.amazon.jsii.Kernel.get(this, "acl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketKeyEnabled = software.amazon.jsii.Kernel.get(this, "bucketKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheControl = software.amazon.jsii.Kernel.get(this, "cacheControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.checksumAlgorithm = software.amazon.jsii.Kernel.get(this, "checksumAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentDisposition = software.amazon.jsii.Kernel.get(this, "contentDisposition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentEncoding = software.amazon.jsii.Kernel.get(this, "contentEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentLanguage = software.amazon.jsii.Kernel.get(this, "contentLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentType = software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyIfMatch = software.amazon.jsii.Kernel.get(this, "copyIfMatch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyIfModifiedSince = software.amazon.jsii.Kernel.get(this, "copyIfModifiedSince", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyIfNoneMatch = software.amazon.jsii.Kernel.get(this, "copyIfNoneMatch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyIfUnmodifiedSince = software.amazon.jsii.Kernel.get(this, "copyIfUnmodifiedSince", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerAlgorithm = software.amazon.jsii.Kernel.get(this, "customerAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerKey = software.amazon.jsii.Kernel.get(this, "customerKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerKeyMd5 = software.amazon.jsii.Kernel.get(this, "customerKeyMd5", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expectedBucketOwner = software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expectedSourceBucketOwner = software.amazon.jsii.Kernel.get(this, "expectedSourceBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expires = software.amazon.jsii.Kernel.get(this, "expires", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.grant = software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsEncryptionContext = software.amazon.jsii.Kernel.get(this, "kmsEncryptionContext", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.metadataDirective = software.amazon.jsii.Kernel.get(this, "metadataDirective", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectLockLegalHoldStatus = software.amazon.jsii.Kernel.get(this, "objectLockLegalHoldStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectLockMode = software.amazon.jsii.Kernel.get(this, "objectLockMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectLockRetainUntilDate = software.amazon.jsii.Kernel.get(this, "objectLockRetainUntilDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overrideProvider = software.amazon.jsii.Kernel.get(this, "overrideProvider", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider.class));
            this.requestPayer = software.amazon.jsii.Kernel.get(this, "requestPayer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryption = software.amazon.jsii.Kernel.get(this, "serverSideEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceCustomerAlgorithm = software.amazon.jsii.Kernel.get(this, "sourceCustomerAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceCustomerKey = software.amazon.jsii.Kernel.get(this, "sourceCustomerKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceCustomerKeyMd5 = software.amazon.jsii.Kernel.get(this, "sourceCustomerKeyMd5", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taggingDirective = software.amazon.jsii.Kernel.get(this, "taggingDirective", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.websiteRedirect = software.amazon.jsii.Kernel.get(this, "websiteRedirect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.acl = builder.acl;
            this.bucketKeyEnabled = builder.bucketKeyEnabled;
            this.cacheControl = builder.cacheControl;
            this.checksumAlgorithm = builder.checksumAlgorithm;
            this.contentDisposition = builder.contentDisposition;
            this.contentEncoding = builder.contentEncoding;
            this.contentLanguage = builder.contentLanguage;
            this.contentType = builder.contentType;
            this.copyIfMatch = builder.copyIfMatch;
            this.copyIfModifiedSince = builder.copyIfModifiedSince;
            this.copyIfNoneMatch = builder.copyIfNoneMatch;
            this.copyIfUnmodifiedSince = builder.copyIfUnmodifiedSince;
            this.customerAlgorithm = builder.customerAlgorithm;
            this.customerKey = builder.customerKey;
            this.customerKeyMd5 = builder.customerKeyMd5;
            this.expectedBucketOwner = builder.expectedBucketOwner;
            this.expectedSourceBucketOwner = builder.expectedSourceBucketOwner;
            this.expires = builder.expires;
            this.forceDestroy = builder.forceDestroy;
            this.grant = builder.grant;
            this.id = builder.id;
            this.kmsEncryptionContext = builder.kmsEncryptionContext;
            this.kmsKeyId = builder.kmsKeyId;
            this.metadata = builder.metadata;
            this.metadataDirective = builder.metadataDirective;
            this.objectLockLegalHoldStatus = builder.objectLockLegalHoldStatus;
            this.objectLockMode = builder.objectLockMode;
            this.objectLockRetainUntilDate = builder.objectLockRetainUntilDate;
            this.overrideProvider = builder.overrideProvider;
            this.requestPayer = builder.requestPayer;
            this.serverSideEncryption = builder.serverSideEncryption;
            this.sourceCustomerAlgorithm = builder.sourceCustomerAlgorithm;
            this.sourceCustomerKey = builder.sourceCustomerKey;
            this.sourceCustomerKeyMd5 = builder.sourceCustomerKeyMd5;
            this.storageClass = builder.storageClass;
            this.taggingDirective = builder.taggingDirective;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.websiteRedirect = builder.websiteRedirect;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getAcl() {
            return this.acl;
        }

        @Override
        public final java.lang.Object getBucketKeyEnabled() {
            return this.bucketKeyEnabled;
        }

        @Override
        public final java.lang.String getCacheControl() {
            return this.cacheControl;
        }

        @Override
        public final java.lang.String getChecksumAlgorithm() {
            return this.checksumAlgorithm;
        }

        @Override
        public final java.lang.String getContentDisposition() {
            return this.contentDisposition;
        }

        @Override
        public final java.lang.String getContentEncoding() {
            return this.contentEncoding;
        }

        @Override
        public final java.lang.String getContentLanguage() {
            return this.contentLanguage;
        }

        @Override
        public final java.lang.String getContentType() {
            return this.contentType;
        }

        @Override
        public final java.lang.String getCopyIfMatch() {
            return this.copyIfMatch;
        }

        @Override
        public final java.lang.String getCopyIfModifiedSince() {
            return this.copyIfModifiedSince;
        }

        @Override
        public final java.lang.String getCopyIfNoneMatch() {
            return this.copyIfNoneMatch;
        }

        @Override
        public final java.lang.String getCopyIfUnmodifiedSince() {
            return this.copyIfUnmodifiedSince;
        }

        @Override
        public final java.lang.String getCustomerAlgorithm() {
            return this.customerAlgorithm;
        }

        @Override
        public final java.lang.String getCustomerKey() {
            return this.customerKey;
        }

        @Override
        public final java.lang.String getCustomerKeyMd5() {
            return this.customerKeyMd5;
        }

        @Override
        public final java.lang.String getExpectedBucketOwner() {
            return this.expectedBucketOwner;
        }

        @Override
        public final java.lang.String getExpectedSourceBucketOwner() {
            return this.expectedSourceBucketOwner;
        }

        @Override
        public final java.lang.String getExpires() {
            return this.expires;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final java.lang.Object getGrant() {
            return this.grant;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsEncryptionContext() {
            return this.kmsEncryptionContext;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getMetadata() {
            return this.metadata;
        }

        @Override
        public final java.lang.String getMetadataDirective() {
            return this.metadataDirective;
        }

        @Override
        public final java.lang.String getObjectLockLegalHoldStatus() {
            return this.objectLockLegalHoldStatus;
        }

        @Override
        public final java.lang.String getObjectLockMode() {
            return this.objectLockMode;
        }

        @Override
        public final java.lang.String getObjectLockRetainUntilDate() {
            return this.objectLockRetainUntilDate;
        }

        @Override
        public final imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider getOverrideProvider() {
            return this.overrideProvider;
        }

        @Override
        public final java.lang.String getRequestPayer() {
            return this.requestPayer;
        }

        @Override
        public final java.lang.String getServerSideEncryption() {
            return this.serverSideEncryption;
        }

        @Override
        public final java.lang.String getSourceCustomerAlgorithm() {
            return this.sourceCustomerAlgorithm;
        }

        @Override
        public final java.lang.String getSourceCustomerKey() {
            return this.sourceCustomerKey;
        }

        @Override
        public final java.lang.String getSourceCustomerKeyMd5() {
            return this.sourceCustomerKeyMd5;
        }

        @Override
        public final java.lang.String getStorageClass() {
            return this.storageClass;
        }

        @Override
        public final java.lang.String getTaggingDirective() {
            return this.taggingDirective;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.String getWebsiteRedirect() {
            return this.websiteRedirect;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            data.set("key", om.valueToTree(this.getKey()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getAcl() != null) {
                data.set("acl", om.valueToTree(this.getAcl()));
            }
            if (this.getBucketKeyEnabled() != null) {
                data.set("bucketKeyEnabled", om.valueToTree(this.getBucketKeyEnabled()));
            }
            if (this.getCacheControl() != null) {
                data.set("cacheControl", om.valueToTree(this.getCacheControl()));
            }
            if (this.getChecksumAlgorithm() != null) {
                data.set("checksumAlgorithm", om.valueToTree(this.getChecksumAlgorithm()));
            }
            if (this.getContentDisposition() != null) {
                data.set("contentDisposition", om.valueToTree(this.getContentDisposition()));
            }
            if (this.getContentEncoding() != null) {
                data.set("contentEncoding", om.valueToTree(this.getContentEncoding()));
            }
            if (this.getContentLanguage() != null) {
                data.set("contentLanguage", om.valueToTree(this.getContentLanguage()));
            }
            if (this.getContentType() != null) {
                data.set("contentType", om.valueToTree(this.getContentType()));
            }
            if (this.getCopyIfMatch() != null) {
                data.set("copyIfMatch", om.valueToTree(this.getCopyIfMatch()));
            }
            if (this.getCopyIfModifiedSince() != null) {
                data.set("copyIfModifiedSince", om.valueToTree(this.getCopyIfModifiedSince()));
            }
            if (this.getCopyIfNoneMatch() != null) {
                data.set("copyIfNoneMatch", om.valueToTree(this.getCopyIfNoneMatch()));
            }
            if (this.getCopyIfUnmodifiedSince() != null) {
                data.set("copyIfUnmodifiedSince", om.valueToTree(this.getCopyIfUnmodifiedSince()));
            }
            if (this.getCustomerAlgorithm() != null) {
                data.set("customerAlgorithm", om.valueToTree(this.getCustomerAlgorithm()));
            }
            if (this.getCustomerKey() != null) {
                data.set("customerKey", om.valueToTree(this.getCustomerKey()));
            }
            if (this.getCustomerKeyMd5() != null) {
                data.set("customerKeyMd5", om.valueToTree(this.getCustomerKeyMd5()));
            }
            if (this.getExpectedBucketOwner() != null) {
                data.set("expectedBucketOwner", om.valueToTree(this.getExpectedBucketOwner()));
            }
            if (this.getExpectedSourceBucketOwner() != null) {
                data.set("expectedSourceBucketOwner", om.valueToTree(this.getExpectedSourceBucketOwner()));
            }
            if (this.getExpires() != null) {
                data.set("expires", om.valueToTree(this.getExpires()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getGrant() != null) {
                data.set("grant", om.valueToTree(this.getGrant()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsEncryptionContext() != null) {
                data.set("kmsEncryptionContext", om.valueToTree(this.getKmsEncryptionContext()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getMetadata() != null) {
                data.set("metadata", om.valueToTree(this.getMetadata()));
            }
            if (this.getMetadataDirective() != null) {
                data.set("metadataDirective", om.valueToTree(this.getMetadataDirective()));
            }
            if (this.getObjectLockLegalHoldStatus() != null) {
                data.set("objectLockLegalHoldStatus", om.valueToTree(this.getObjectLockLegalHoldStatus()));
            }
            if (this.getObjectLockMode() != null) {
                data.set("objectLockMode", om.valueToTree(this.getObjectLockMode()));
            }
            if (this.getObjectLockRetainUntilDate() != null) {
                data.set("objectLockRetainUntilDate", om.valueToTree(this.getObjectLockRetainUntilDate()));
            }
            if (this.getOverrideProvider() != null) {
                data.set("overrideProvider", om.valueToTree(this.getOverrideProvider()));
            }
            if (this.getRequestPayer() != null) {
                data.set("requestPayer", om.valueToTree(this.getRequestPayer()));
            }
            if (this.getServerSideEncryption() != null) {
                data.set("serverSideEncryption", om.valueToTree(this.getServerSideEncryption()));
            }
            if (this.getSourceCustomerAlgorithm() != null) {
                data.set("sourceCustomerAlgorithm", om.valueToTree(this.getSourceCustomerAlgorithm()));
            }
            if (this.getSourceCustomerKey() != null) {
                data.set("sourceCustomerKey", om.valueToTree(this.getSourceCustomerKey()));
            }
            if (this.getSourceCustomerKeyMd5() != null) {
                data.set("sourceCustomerKeyMd5", om.valueToTree(this.getSourceCustomerKeyMd5()));
            }
            if (this.getStorageClass() != null) {
                data.set("storageClass", om.valueToTree(this.getStorageClass()));
            }
            if (this.getTaggingDirective() != null) {
                data.set("taggingDirective", om.valueToTree(this.getTaggingDirective()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getWebsiteRedirect() != null) {
                data.set("websiteRedirect", om.valueToTree(this.getWebsiteRedirect()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ObjectCopy.S3ObjectCopyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ObjectCopyConfig.Jsii$Proxy that = (S3ObjectCopyConfig.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (!key.equals(that.key)) return false;
            if (!source.equals(that.source)) return false;
            if (this.acl != null ? !this.acl.equals(that.acl) : that.acl != null) return false;
            if (this.bucketKeyEnabled != null ? !this.bucketKeyEnabled.equals(that.bucketKeyEnabled) : that.bucketKeyEnabled != null) return false;
            if (this.cacheControl != null ? !this.cacheControl.equals(that.cacheControl) : that.cacheControl != null) return false;
            if (this.checksumAlgorithm != null ? !this.checksumAlgorithm.equals(that.checksumAlgorithm) : that.checksumAlgorithm != null) return false;
            if (this.contentDisposition != null ? !this.contentDisposition.equals(that.contentDisposition) : that.contentDisposition != null) return false;
            if (this.contentEncoding != null ? !this.contentEncoding.equals(that.contentEncoding) : that.contentEncoding != null) return false;
            if (this.contentLanguage != null ? !this.contentLanguage.equals(that.contentLanguage) : that.contentLanguage != null) return false;
            if (this.contentType != null ? !this.contentType.equals(that.contentType) : that.contentType != null) return false;
            if (this.copyIfMatch != null ? !this.copyIfMatch.equals(that.copyIfMatch) : that.copyIfMatch != null) return false;
            if (this.copyIfModifiedSince != null ? !this.copyIfModifiedSince.equals(that.copyIfModifiedSince) : that.copyIfModifiedSince != null) return false;
            if (this.copyIfNoneMatch != null ? !this.copyIfNoneMatch.equals(that.copyIfNoneMatch) : that.copyIfNoneMatch != null) return false;
            if (this.copyIfUnmodifiedSince != null ? !this.copyIfUnmodifiedSince.equals(that.copyIfUnmodifiedSince) : that.copyIfUnmodifiedSince != null) return false;
            if (this.customerAlgorithm != null ? !this.customerAlgorithm.equals(that.customerAlgorithm) : that.customerAlgorithm != null) return false;
            if (this.customerKey != null ? !this.customerKey.equals(that.customerKey) : that.customerKey != null) return false;
            if (this.customerKeyMd5 != null ? !this.customerKeyMd5.equals(that.customerKeyMd5) : that.customerKeyMd5 != null) return false;
            if (this.expectedBucketOwner != null ? !this.expectedBucketOwner.equals(that.expectedBucketOwner) : that.expectedBucketOwner != null) return false;
            if (this.expectedSourceBucketOwner != null ? !this.expectedSourceBucketOwner.equals(that.expectedSourceBucketOwner) : that.expectedSourceBucketOwner != null) return false;
            if (this.expires != null ? !this.expires.equals(that.expires) : that.expires != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.grant != null ? !this.grant.equals(that.grant) : that.grant != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsEncryptionContext != null ? !this.kmsEncryptionContext.equals(that.kmsEncryptionContext) : that.kmsEncryptionContext != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.metadata != null ? !this.metadata.equals(that.metadata) : that.metadata != null) return false;
            if (this.metadataDirective != null ? !this.metadataDirective.equals(that.metadataDirective) : that.metadataDirective != null) return false;
            if (this.objectLockLegalHoldStatus != null ? !this.objectLockLegalHoldStatus.equals(that.objectLockLegalHoldStatus) : that.objectLockLegalHoldStatus != null) return false;
            if (this.objectLockMode != null ? !this.objectLockMode.equals(that.objectLockMode) : that.objectLockMode != null) return false;
            if (this.objectLockRetainUntilDate != null ? !this.objectLockRetainUntilDate.equals(that.objectLockRetainUntilDate) : that.objectLockRetainUntilDate != null) return false;
            if (this.overrideProvider != null ? !this.overrideProvider.equals(that.overrideProvider) : that.overrideProvider != null) return false;
            if (this.requestPayer != null ? !this.requestPayer.equals(that.requestPayer) : that.requestPayer != null) return false;
            if (this.serverSideEncryption != null ? !this.serverSideEncryption.equals(that.serverSideEncryption) : that.serverSideEncryption != null) return false;
            if (this.sourceCustomerAlgorithm != null ? !this.sourceCustomerAlgorithm.equals(that.sourceCustomerAlgorithm) : that.sourceCustomerAlgorithm != null) return false;
            if (this.sourceCustomerKey != null ? !this.sourceCustomerKey.equals(that.sourceCustomerKey) : that.sourceCustomerKey != null) return false;
            if (this.sourceCustomerKeyMd5 != null ? !this.sourceCustomerKeyMd5.equals(that.sourceCustomerKeyMd5) : that.sourceCustomerKeyMd5 != null) return false;
            if (this.storageClass != null ? !this.storageClass.equals(that.storageClass) : that.storageClass != null) return false;
            if (this.taggingDirective != null ? !this.taggingDirective.equals(that.taggingDirective) : that.taggingDirective != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.websiteRedirect != null ? !this.websiteRedirect.equals(that.websiteRedirect) : that.websiteRedirect != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.key.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.acl != null ? this.acl.hashCode() : 0);
            result = 31 * result + (this.bucketKeyEnabled != null ? this.bucketKeyEnabled.hashCode() : 0);
            result = 31 * result + (this.cacheControl != null ? this.cacheControl.hashCode() : 0);
            result = 31 * result + (this.checksumAlgorithm != null ? this.checksumAlgorithm.hashCode() : 0);
            result = 31 * result + (this.contentDisposition != null ? this.contentDisposition.hashCode() : 0);
            result = 31 * result + (this.contentEncoding != null ? this.contentEncoding.hashCode() : 0);
            result = 31 * result + (this.contentLanguage != null ? this.contentLanguage.hashCode() : 0);
            result = 31 * result + (this.contentType != null ? this.contentType.hashCode() : 0);
            result = 31 * result + (this.copyIfMatch != null ? this.copyIfMatch.hashCode() : 0);
            result = 31 * result + (this.copyIfModifiedSince != null ? this.copyIfModifiedSince.hashCode() : 0);
            result = 31 * result + (this.copyIfNoneMatch != null ? this.copyIfNoneMatch.hashCode() : 0);
            result = 31 * result + (this.copyIfUnmodifiedSince != null ? this.copyIfUnmodifiedSince.hashCode() : 0);
            result = 31 * result + (this.customerAlgorithm != null ? this.customerAlgorithm.hashCode() : 0);
            result = 31 * result + (this.customerKey != null ? this.customerKey.hashCode() : 0);
            result = 31 * result + (this.customerKeyMd5 != null ? this.customerKeyMd5.hashCode() : 0);
            result = 31 * result + (this.expectedBucketOwner != null ? this.expectedBucketOwner.hashCode() : 0);
            result = 31 * result + (this.expectedSourceBucketOwner != null ? this.expectedSourceBucketOwner.hashCode() : 0);
            result = 31 * result + (this.expires != null ? this.expires.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.grant != null ? this.grant.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsEncryptionContext != null ? this.kmsEncryptionContext.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.metadata != null ? this.metadata.hashCode() : 0);
            result = 31 * result + (this.metadataDirective != null ? this.metadataDirective.hashCode() : 0);
            result = 31 * result + (this.objectLockLegalHoldStatus != null ? this.objectLockLegalHoldStatus.hashCode() : 0);
            result = 31 * result + (this.objectLockMode != null ? this.objectLockMode.hashCode() : 0);
            result = 31 * result + (this.objectLockRetainUntilDate != null ? this.objectLockRetainUntilDate.hashCode() : 0);
            result = 31 * result + (this.overrideProvider != null ? this.overrideProvider.hashCode() : 0);
            result = 31 * result + (this.requestPayer != null ? this.requestPayer.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryption != null ? this.serverSideEncryption.hashCode() : 0);
            result = 31 * result + (this.sourceCustomerAlgorithm != null ? this.sourceCustomerAlgorithm.hashCode() : 0);
            result = 31 * result + (this.sourceCustomerKey != null ? this.sourceCustomerKey.hashCode() : 0);
            result = 31 * result + (this.sourceCustomerKeyMd5 != null ? this.sourceCustomerKeyMd5.hashCode() : 0);
            result = 31 * result + (this.storageClass != null ? this.storageClass.hashCode() : 0);
            result = 31 * result + (this.taggingDirective != null ? this.taggingDirective.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.websiteRedirect != null ? this.websiteRedirect.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
