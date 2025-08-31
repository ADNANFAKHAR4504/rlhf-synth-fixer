package imports.aws.s3_bucket_object;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.263Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketObject.S3BucketObjectConfig")
@software.amazon.jsii.Jsii.Proxy(S3BucketObjectConfig.Jsii$Proxy.class)
public interface S3BucketObjectConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#bucket S3BucketObject#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#key S3BucketObject#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#acl S3BucketObject#acl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#bucket_key_enabled S3BucketObject#bucket_key_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBucketKeyEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#cache_control S3BucketObject#cache_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content S3BucketObject#content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_base64 S3BucketObject#content_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_disposition S3BucketObject#content_disposition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentDisposition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_encoding S3BucketObject#content_encoding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentEncoding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_language S3BucketObject#content_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_type S3BucketObject#content_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#etag S3BucketObject#etag}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEtag() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#force_destroy S3BucketObject#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#id S3BucketObject#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#kms_key_id S3BucketObject#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#metadata S3BucketObject#metadata}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_legal_hold_status S3BucketObject#object_lock_legal_hold_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockLegalHoldStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_mode S3BucketObject#object_lock_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_retain_until_date S3BucketObject#object_lock_retain_until_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectLockRetainUntilDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#server_side_encryption S3BucketObject#server_side_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#source S3BucketObject#source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#source_hash S3BucketObject#source_hash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceHash() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#storage_class S3BucketObject#storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#tags S3BucketObject#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#tags_all S3BucketObject#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#website_redirect S3BucketObject#website_redirect}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebsiteRedirect() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketObjectConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketObjectConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketObjectConfig> {
        java.lang.String bucket;
        java.lang.String key;
        java.lang.String acl;
        java.lang.Object bucketKeyEnabled;
        java.lang.String cacheControl;
        java.lang.String content;
        java.lang.String contentBase64;
        java.lang.String contentDisposition;
        java.lang.String contentEncoding;
        java.lang.String contentLanguage;
        java.lang.String contentType;
        java.lang.String etag;
        java.lang.Object forceDestroy;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.util.Map<java.lang.String, java.lang.String> metadata;
        java.lang.String objectLockLegalHoldStatus;
        java.lang.String objectLockMode;
        java.lang.String objectLockRetainUntilDate;
        java.lang.String serverSideEncryption;
        java.lang.String source;
        java.lang.String sourceHash;
        java.lang.String storageClass;
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
         * Sets the value of {@link S3BucketObjectConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#bucket S3BucketObject#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#key S3BucketObject#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getAcl}
         * @param acl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#acl S3BucketObject#acl}.
         * @return {@code this}
         */
        public Builder acl(java.lang.String acl) {
            this.acl = acl;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#bucket_key_enabled S3BucketObject#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(java.lang.Boolean bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getBucketKeyEnabled}
         * @param bucketKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#bucket_key_enabled S3BucketObject#bucket_key_enabled}.
         * @return {@code this}
         */
        public Builder bucketKeyEnabled(com.hashicorp.cdktf.IResolvable bucketKeyEnabled) {
            this.bucketKeyEnabled = bucketKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getCacheControl}
         * @param cacheControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#cache_control S3BucketObject#cache_control}.
         * @return {@code this}
         */
        public Builder cacheControl(java.lang.String cacheControl) {
            this.cacheControl = cacheControl;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContent}
         * @param content Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content S3BucketObject#content}.
         * @return {@code this}
         */
        public Builder content(java.lang.String content) {
            this.content = content;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContentBase64}
         * @param contentBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_base64 S3BucketObject#content_base64}.
         * @return {@code this}
         */
        public Builder contentBase64(java.lang.String contentBase64) {
            this.contentBase64 = contentBase64;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContentDisposition}
         * @param contentDisposition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_disposition S3BucketObject#content_disposition}.
         * @return {@code this}
         */
        public Builder contentDisposition(java.lang.String contentDisposition) {
            this.contentDisposition = contentDisposition;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContentEncoding}
         * @param contentEncoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_encoding S3BucketObject#content_encoding}.
         * @return {@code this}
         */
        public Builder contentEncoding(java.lang.String contentEncoding) {
            this.contentEncoding = contentEncoding;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContentLanguage}
         * @param contentLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_language S3BucketObject#content_language}.
         * @return {@code this}
         */
        public Builder contentLanguage(java.lang.String contentLanguage) {
            this.contentLanguage = contentLanguage;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getContentType}
         * @param contentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#content_type S3BucketObject#content_type}.
         * @return {@code this}
         */
        public Builder contentType(java.lang.String contentType) {
            this.contentType = contentType;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getEtag}
         * @param etag Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#etag S3BucketObject#etag}.
         * @return {@code this}
         */
        public Builder etag(java.lang.String etag) {
            this.etag = etag;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#force_destroy S3BucketObject#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#force_destroy S3BucketObject#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#id S3BucketObject#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#kms_key_id S3BucketObject#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getMetadata}
         * @param metadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#metadata S3BucketObject#metadata}.
         * @return {@code this}
         */
        public Builder metadata(java.util.Map<java.lang.String, java.lang.String> metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getObjectLockLegalHoldStatus}
         * @param objectLockLegalHoldStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_legal_hold_status S3BucketObject#object_lock_legal_hold_status}.
         * @return {@code this}
         */
        public Builder objectLockLegalHoldStatus(java.lang.String objectLockLegalHoldStatus) {
            this.objectLockLegalHoldStatus = objectLockLegalHoldStatus;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getObjectLockMode}
         * @param objectLockMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_mode S3BucketObject#object_lock_mode}.
         * @return {@code this}
         */
        public Builder objectLockMode(java.lang.String objectLockMode) {
            this.objectLockMode = objectLockMode;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getObjectLockRetainUntilDate}
         * @param objectLockRetainUntilDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#object_lock_retain_until_date S3BucketObject#object_lock_retain_until_date}.
         * @return {@code this}
         */
        public Builder objectLockRetainUntilDate(java.lang.String objectLockRetainUntilDate) {
            this.objectLockRetainUntilDate = objectLockRetainUntilDate;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getServerSideEncryption}
         * @param serverSideEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#server_side_encryption S3BucketObject#server_side_encryption}.
         * @return {@code this}
         */
        public Builder serverSideEncryption(java.lang.String serverSideEncryption) {
            this.serverSideEncryption = serverSideEncryption;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#source S3BucketObject#source}.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getSourceHash}
         * @param sourceHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#source_hash S3BucketObject#source_hash}.
         * @return {@code this}
         */
        public Builder sourceHash(java.lang.String sourceHash) {
            this.sourceHash = sourceHash;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#storage_class S3BucketObject#storage_class}.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#tags S3BucketObject#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#tags_all S3BucketObject#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getWebsiteRedirect}
         * @param websiteRedirect Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_object#website_redirect S3BucketObject#website_redirect}.
         * @return {@code this}
         */
        public Builder websiteRedirect(java.lang.String websiteRedirect) {
            this.websiteRedirect = websiteRedirect;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getDependsOn}
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
         * Sets the value of {@link S3BucketObjectConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketObjectConfig#getProvisioners}
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
         * @return a new instance of {@link S3BucketObjectConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketObjectConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketObjectConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketObjectConfig {
        private final java.lang.String bucket;
        private final java.lang.String key;
        private final java.lang.String acl;
        private final java.lang.Object bucketKeyEnabled;
        private final java.lang.String cacheControl;
        private final java.lang.String content;
        private final java.lang.String contentBase64;
        private final java.lang.String contentDisposition;
        private final java.lang.String contentEncoding;
        private final java.lang.String contentLanguage;
        private final java.lang.String contentType;
        private final java.lang.String etag;
        private final java.lang.Object forceDestroy;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.util.Map<java.lang.String, java.lang.String> metadata;
        private final java.lang.String objectLockLegalHoldStatus;
        private final java.lang.String objectLockMode;
        private final java.lang.String objectLockRetainUntilDate;
        private final java.lang.String serverSideEncryption;
        private final java.lang.String source;
        private final java.lang.String sourceHash;
        private final java.lang.String storageClass;
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
            this.acl = software.amazon.jsii.Kernel.get(this, "acl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketKeyEnabled = software.amazon.jsii.Kernel.get(this, "bucketKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheControl = software.amazon.jsii.Kernel.get(this, "cacheControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.content = software.amazon.jsii.Kernel.get(this, "content", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentBase64 = software.amazon.jsii.Kernel.get(this, "contentBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentDisposition = software.amazon.jsii.Kernel.get(this, "contentDisposition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentEncoding = software.amazon.jsii.Kernel.get(this, "contentEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentLanguage = software.amazon.jsii.Kernel.get(this, "contentLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentType = software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.etag = software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.objectLockLegalHoldStatus = software.amazon.jsii.Kernel.get(this, "objectLockLegalHoldStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectLockMode = software.amazon.jsii.Kernel.get(this, "objectLockMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectLockRetainUntilDate = software.amazon.jsii.Kernel.get(this, "objectLockRetainUntilDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryption = software.amazon.jsii.Kernel.get(this, "serverSideEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceHash = software.amazon.jsii.Kernel.get(this, "sourceHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.acl = builder.acl;
            this.bucketKeyEnabled = builder.bucketKeyEnabled;
            this.cacheControl = builder.cacheControl;
            this.content = builder.content;
            this.contentBase64 = builder.contentBase64;
            this.contentDisposition = builder.contentDisposition;
            this.contentEncoding = builder.contentEncoding;
            this.contentLanguage = builder.contentLanguage;
            this.contentType = builder.contentType;
            this.etag = builder.etag;
            this.forceDestroy = builder.forceDestroy;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.metadata = builder.metadata;
            this.objectLockLegalHoldStatus = builder.objectLockLegalHoldStatus;
            this.objectLockMode = builder.objectLockMode;
            this.objectLockRetainUntilDate = builder.objectLockRetainUntilDate;
            this.serverSideEncryption = builder.serverSideEncryption;
            this.source = builder.source;
            this.sourceHash = builder.sourceHash;
            this.storageClass = builder.storageClass;
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
        public final java.lang.String getContent() {
            return this.content;
        }

        @Override
        public final java.lang.String getContentBase64() {
            return this.contentBase64;
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
        public final java.lang.String getEtag() {
            return this.etag;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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
        public final java.lang.String getServerSideEncryption() {
            return this.serverSideEncryption;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getSourceHash() {
            return this.sourceHash;
        }

        @Override
        public final java.lang.String getStorageClass() {
            return this.storageClass;
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
            if (this.getAcl() != null) {
                data.set("acl", om.valueToTree(this.getAcl()));
            }
            if (this.getBucketKeyEnabled() != null) {
                data.set("bucketKeyEnabled", om.valueToTree(this.getBucketKeyEnabled()));
            }
            if (this.getCacheControl() != null) {
                data.set("cacheControl", om.valueToTree(this.getCacheControl()));
            }
            if (this.getContent() != null) {
                data.set("content", om.valueToTree(this.getContent()));
            }
            if (this.getContentBase64() != null) {
                data.set("contentBase64", om.valueToTree(this.getContentBase64()));
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
            if (this.getEtag() != null) {
                data.set("etag", om.valueToTree(this.getEtag()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getMetadata() != null) {
                data.set("metadata", om.valueToTree(this.getMetadata()));
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
            if (this.getServerSideEncryption() != null) {
                data.set("serverSideEncryption", om.valueToTree(this.getServerSideEncryption()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }
            if (this.getSourceHash() != null) {
                data.set("sourceHash", om.valueToTree(this.getSourceHash()));
            }
            if (this.getStorageClass() != null) {
                data.set("storageClass", om.valueToTree(this.getStorageClass()));
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
            struct.set("fqn", om.valueToTree("aws.s3BucketObject.S3BucketObjectConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketObjectConfig.Jsii$Proxy that = (S3BucketObjectConfig.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (!key.equals(that.key)) return false;
            if (this.acl != null ? !this.acl.equals(that.acl) : that.acl != null) return false;
            if (this.bucketKeyEnabled != null ? !this.bucketKeyEnabled.equals(that.bucketKeyEnabled) : that.bucketKeyEnabled != null) return false;
            if (this.cacheControl != null ? !this.cacheControl.equals(that.cacheControl) : that.cacheControl != null) return false;
            if (this.content != null ? !this.content.equals(that.content) : that.content != null) return false;
            if (this.contentBase64 != null ? !this.contentBase64.equals(that.contentBase64) : that.contentBase64 != null) return false;
            if (this.contentDisposition != null ? !this.contentDisposition.equals(that.contentDisposition) : that.contentDisposition != null) return false;
            if (this.contentEncoding != null ? !this.contentEncoding.equals(that.contentEncoding) : that.contentEncoding != null) return false;
            if (this.contentLanguage != null ? !this.contentLanguage.equals(that.contentLanguage) : that.contentLanguage != null) return false;
            if (this.contentType != null ? !this.contentType.equals(that.contentType) : that.contentType != null) return false;
            if (this.etag != null ? !this.etag.equals(that.etag) : that.etag != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.metadata != null ? !this.metadata.equals(that.metadata) : that.metadata != null) return false;
            if (this.objectLockLegalHoldStatus != null ? !this.objectLockLegalHoldStatus.equals(that.objectLockLegalHoldStatus) : that.objectLockLegalHoldStatus != null) return false;
            if (this.objectLockMode != null ? !this.objectLockMode.equals(that.objectLockMode) : that.objectLockMode != null) return false;
            if (this.objectLockRetainUntilDate != null ? !this.objectLockRetainUntilDate.equals(that.objectLockRetainUntilDate) : that.objectLockRetainUntilDate != null) return false;
            if (this.serverSideEncryption != null ? !this.serverSideEncryption.equals(that.serverSideEncryption) : that.serverSideEncryption != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
            if (this.sourceHash != null ? !this.sourceHash.equals(that.sourceHash) : that.sourceHash != null) return false;
            if (this.storageClass != null ? !this.storageClass.equals(that.storageClass) : that.storageClass != null) return false;
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
            result = 31 * result + (this.acl != null ? this.acl.hashCode() : 0);
            result = 31 * result + (this.bucketKeyEnabled != null ? this.bucketKeyEnabled.hashCode() : 0);
            result = 31 * result + (this.cacheControl != null ? this.cacheControl.hashCode() : 0);
            result = 31 * result + (this.content != null ? this.content.hashCode() : 0);
            result = 31 * result + (this.contentBase64 != null ? this.contentBase64.hashCode() : 0);
            result = 31 * result + (this.contentDisposition != null ? this.contentDisposition.hashCode() : 0);
            result = 31 * result + (this.contentEncoding != null ? this.contentEncoding.hashCode() : 0);
            result = 31 * result + (this.contentLanguage != null ? this.contentLanguage.hashCode() : 0);
            result = 31 * result + (this.contentType != null ? this.contentType.hashCode() : 0);
            result = 31 * result + (this.etag != null ? this.etag.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.metadata != null ? this.metadata.hashCode() : 0);
            result = 31 * result + (this.objectLockLegalHoldStatus != null ? this.objectLockLegalHoldStatus.hashCode() : 0);
            result = 31 * result + (this.objectLockMode != null ? this.objectLockMode.hashCode() : 0);
            result = 31 * result + (this.objectLockRetainUntilDate != null ? this.objectLockRetainUntilDate.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryption != null ? this.serverSideEncryption.hashCode() : 0);
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
            result = 31 * result + (this.sourceHash != null ? this.sourceHash.hashCode() : 0);
            result = 31 * result + (this.storageClass != null ? this.storageClass.hashCode() : 0);
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
