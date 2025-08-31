package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.245Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketConfig")
@software.amazon.jsii.Jsii.Proxy(S3BucketConfig.Jsii$Proxy.class)
public interface S3BucketConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acceleration_status S3Bucket#acceleration_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccelerationStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acl S3Bucket#acl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_prefix S3Bucket#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * cors_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#cors_rule S3Bucket#cors_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCorsRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * grant block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#grant S3Bucket#grant}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGrant() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lifecycle_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#lifecycle_rule S3Bucket#lifecycle_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLifecycleRule() {
        return null;
    }

    /**
     * logging block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#logging S3Bucket#logging}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketLogging getLogging() {
        return null;
    }

    /**
     * object_lock_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_configuration S3Bucket#object_lock_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketObjectLockConfiguration getObjectLockConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getObjectLockEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#policy S3Bucket#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * replication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replication_configuration S3Bucket#replication_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfiguration getReplicationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#request_payer S3Bucket#request_payer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequestPayer() {
        return null;
    }

    /**
     * server_side_encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#server_side_encryption_configuration S3Bucket#server_side_encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration getServerSideEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags_all S3Bucket#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#timeouts S3Bucket#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketTimeouts getTimeouts() {
        return null;
    }

    /**
     * versioning block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#versioning S3Bucket#versioning}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketVersioning getVersioning() {
        return null;
    }

    /**
     * website block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#website S3Bucket#website}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketWebsite getWebsite() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketConfig> {
        java.lang.String accelerationStatus;
        java.lang.String acl;
        java.lang.String bucket;
        java.lang.String bucketPrefix;
        java.lang.Object corsRule;
        java.lang.Object forceDestroy;
        java.lang.Object grant;
        java.lang.String id;
        java.lang.Object lifecycleRule;
        imports.aws.s3_bucket.S3BucketLogging logging;
        imports.aws.s3_bucket.S3BucketObjectLockConfiguration objectLockConfiguration;
        java.lang.Object objectLockEnabled;
        java.lang.String policy;
        imports.aws.s3_bucket.S3BucketReplicationConfiguration replicationConfiguration;
        java.lang.String requestPayer;
        imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration serverSideEncryptionConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.s3_bucket.S3BucketTimeouts timeouts;
        imports.aws.s3_bucket.S3BucketVersioning versioning;
        imports.aws.s3_bucket.S3BucketWebsite website;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3BucketConfig#getAccelerationStatus}
         * @param accelerationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acceleration_status S3Bucket#acceleration_status}.
         * @return {@code this}
         */
        public Builder accelerationStatus(java.lang.String accelerationStatus) {
            this.accelerationStatus = accelerationStatus;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getAcl}
         * @param acl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#acl S3Bucket#acl}.
         * @return {@code this}
         */
        public Builder acl(java.lang.String acl) {
            this.acl = acl;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket_prefix S3Bucket#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getCorsRule}
         * @param corsRule cors_rule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#cors_rule S3Bucket#cors_rule}
         * @return {@code this}
         */
        public Builder corsRule(com.hashicorp.cdktf.IResolvable corsRule) {
            this.corsRule = corsRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getCorsRule}
         * @param corsRule cors_rule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#cors_rule S3Bucket#cors_rule}
         * @return {@code this}
         */
        public Builder corsRule(java.util.List<? extends imports.aws.s3_bucket.S3BucketCorsRule> corsRule) {
            this.corsRule = corsRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#force_destroy S3Bucket#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#grant S3Bucket#grant}
         * @return {@code this}
         */
        public Builder grant(com.hashicorp.cdktf.IResolvable grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getGrant}
         * @param grant grant block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#grant S3Bucket#grant}
         * @return {@code this}
         */
        public Builder grant(java.util.List<? extends imports.aws.s3_bucket.S3BucketGrant> grant) {
            this.grant = grant;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#id S3Bucket#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getLifecycleRule}
         * @param lifecycleRule lifecycle_rule block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#lifecycle_rule S3Bucket#lifecycle_rule}
         * @return {@code this}
         */
        public Builder lifecycleRule(com.hashicorp.cdktf.IResolvable lifecycleRule) {
            this.lifecycleRule = lifecycleRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getLifecycleRule}
         * @param lifecycleRule lifecycle_rule block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#lifecycle_rule S3Bucket#lifecycle_rule}
         * @return {@code this}
         */
        public Builder lifecycleRule(java.util.List<? extends imports.aws.s3_bucket.S3BucketLifecycleRule> lifecycleRule) {
            this.lifecycleRule = lifecycleRule;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getLogging}
         * @param logging logging block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#logging S3Bucket#logging}
         * @return {@code this}
         */
        public Builder logging(imports.aws.s3_bucket.S3BucketLogging logging) {
            this.logging = logging;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getObjectLockConfiguration}
         * @param objectLockConfiguration object_lock_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_configuration S3Bucket#object_lock_configuration}
         * @return {@code this}
         */
        public Builder objectLockConfiguration(imports.aws.s3_bucket.S3BucketObjectLockConfiguration objectLockConfiguration) {
            this.objectLockConfiguration = objectLockConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getObjectLockEnabled}
         * @param objectLockEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
         * @return {@code this}
         */
        public Builder objectLockEnabled(java.lang.Boolean objectLockEnabled) {
            this.objectLockEnabled = objectLockEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getObjectLockEnabled}
         * @param objectLockEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#object_lock_enabled S3Bucket#object_lock_enabled}.
         * @return {@code this}
         */
        public Builder objectLockEnabled(com.hashicorp.cdktf.IResolvable objectLockEnabled) {
            this.objectLockEnabled = objectLockEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#policy S3Bucket#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getReplicationConfiguration}
         * @param replicationConfiguration replication_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replication_configuration S3Bucket#replication_configuration}
         * @return {@code this}
         */
        public Builder replicationConfiguration(imports.aws.s3_bucket.S3BucketReplicationConfiguration replicationConfiguration) {
            this.replicationConfiguration = replicationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getRequestPayer}
         * @param requestPayer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#request_payer S3Bucket#request_payer}.
         * @return {@code this}
         */
        public Builder requestPayer(java.lang.String requestPayer) {
            this.requestPayer = requestPayer;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getServerSideEncryptionConfiguration}
         * @param serverSideEncryptionConfiguration server_side_encryption_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#server_side_encryption_configuration S3Bucket#server_side_encryption_configuration}
         * @return {@code this}
         */
        public Builder serverSideEncryptionConfiguration(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration serverSideEncryptionConfiguration) {
            this.serverSideEncryptionConfiguration = serverSideEncryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags S3Bucket#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#tags_all S3Bucket#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#timeouts S3Bucket#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.s3_bucket.S3BucketTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getVersioning}
         * @param versioning versioning block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#versioning S3Bucket#versioning}
         * @return {@code this}
         */
        public Builder versioning(imports.aws.s3_bucket.S3BucketVersioning versioning) {
            this.versioning = versioning;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getWebsite}
         * @param website website block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#website S3Bucket#website}
         * @return {@code this}
         */
        public Builder website(imports.aws.s3_bucket.S3BucketWebsite website) {
            this.website = website;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getDependsOn}
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
         * Sets the value of {@link S3BucketConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketConfig#getProvisioners}
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
         * @return a new instance of {@link S3BucketConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketConfig {
        private final java.lang.String accelerationStatus;
        private final java.lang.String acl;
        private final java.lang.String bucket;
        private final java.lang.String bucketPrefix;
        private final java.lang.Object corsRule;
        private final java.lang.Object forceDestroy;
        private final java.lang.Object grant;
        private final java.lang.String id;
        private final java.lang.Object lifecycleRule;
        private final imports.aws.s3_bucket.S3BucketLogging logging;
        private final imports.aws.s3_bucket.S3BucketObjectLockConfiguration objectLockConfiguration;
        private final java.lang.Object objectLockEnabled;
        private final java.lang.String policy;
        private final imports.aws.s3_bucket.S3BucketReplicationConfiguration replicationConfiguration;
        private final java.lang.String requestPayer;
        private final imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration serverSideEncryptionConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.s3_bucket.S3BucketTimeouts timeouts;
        private final imports.aws.s3_bucket.S3BucketVersioning versioning;
        private final imports.aws.s3_bucket.S3BucketWebsite website;
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
            this.accelerationStatus = software.amazon.jsii.Kernel.get(this, "accelerationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acl = software.amazon.jsii.Kernel.get(this, "acl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.corsRule = software.amazon.jsii.Kernel.get(this, "corsRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.grant = software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecycleRule = software.amazon.jsii.Kernel.get(this, "lifecycleRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logging = software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketLogging.class));
            this.objectLockConfiguration = software.amazon.jsii.Kernel.get(this, "objectLockConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketObjectLockConfiguration.class));
            this.objectLockEnabled = software.amazon.jsii.Kernel.get(this, "objectLockEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationConfiguration = software.amazon.jsii.Kernel.get(this, "replicationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfiguration.class));
            this.requestPayer = software.amazon.jsii.Kernel.get(this, "requestPayer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryptionConfiguration = software.amazon.jsii.Kernel.get(this, "serverSideEncryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketTimeouts.class));
            this.versioning = software.amazon.jsii.Kernel.get(this, "versioning", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketVersioning.class));
            this.website = software.amazon.jsii.Kernel.get(this, "website", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketWebsite.class));
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
            this.accelerationStatus = builder.accelerationStatus;
            this.acl = builder.acl;
            this.bucket = builder.bucket;
            this.bucketPrefix = builder.bucketPrefix;
            this.corsRule = builder.corsRule;
            this.forceDestroy = builder.forceDestroy;
            this.grant = builder.grant;
            this.id = builder.id;
            this.lifecycleRule = builder.lifecycleRule;
            this.logging = builder.logging;
            this.objectLockConfiguration = builder.objectLockConfiguration;
            this.objectLockEnabled = builder.objectLockEnabled;
            this.policy = builder.policy;
            this.replicationConfiguration = builder.replicationConfiguration;
            this.requestPayer = builder.requestPayer;
            this.serverSideEncryptionConfiguration = builder.serverSideEncryptionConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.versioning = builder.versioning;
            this.website = builder.website;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAccelerationStatus() {
            return this.accelerationStatus;
        }

        @Override
        public final java.lang.String getAcl() {
            return this.acl;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final java.lang.Object getCorsRule() {
            return this.corsRule;
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
        public final java.lang.Object getLifecycleRule() {
            return this.lifecycleRule;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketLogging getLogging() {
            return this.logging;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketObjectLockConfiguration getObjectLockConfiguration() {
            return this.objectLockConfiguration;
        }

        @Override
        public final java.lang.Object getObjectLockEnabled() {
            return this.objectLockEnabled;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfiguration getReplicationConfiguration() {
            return this.replicationConfiguration;
        }

        @Override
        public final java.lang.String getRequestPayer() {
            return this.requestPayer;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketServerSideEncryptionConfiguration getServerSideEncryptionConfiguration() {
            return this.serverSideEncryptionConfiguration;
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
        public final imports.aws.s3_bucket.S3BucketTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketVersioning getVersioning() {
            return this.versioning;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketWebsite getWebsite() {
            return this.website;
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

            if (this.getAccelerationStatus() != null) {
                data.set("accelerationStatus", om.valueToTree(this.getAccelerationStatus()));
            }
            if (this.getAcl() != null) {
                data.set("acl", om.valueToTree(this.getAcl()));
            }
            if (this.getBucket() != null) {
                data.set("bucket", om.valueToTree(this.getBucket()));
            }
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getCorsRule() != null) {
                data.set("corsRule", om.valueToTree(this.getCorsRule()));
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
            if (this.getLifecycleRule() != null) {
                data.set("lifecycleRule", om.valueToTree(this.getLifecycleRule()));
            }
            if (this.getLogging() != null) {
                data.set("logging", om.valueToTree(this.getLogging()));
            }
            if (this.getObjectLockConfiguration() != null) {
                data.set("objectLockConfiguration", om.valueToTree(this.getObjectLockConfiguration()));
            }
            if (this.getObjectLockEnabled() != null) {
                data.set("objectLockEnabled", om.valueToTree(this.getObjectLockEnabled()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getReplicationConfiguration() != null) {
                data.set("replicationConfiguration", om.valueToTree(this.getReplicationConfiguration()));
            }
            if (this.getRequestPayer() != null) {
                data.set("requestPayer", om.valueToTree(this.getRequestPayer()));
            }
            if (this.getServerSideEncryptionConfiguration() != null) {
                data.set("serverSideEncryptionConfiguration", om.valueToTree(this.getServerSideEncryptionConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVersioning() != null) {
                data.set("versioning", om.valueToTree(this.getVersioning()));
            }
            if (this.getWebsite() != null) {
                data.set("website", om.valueToTree(this.getWebsite()));
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
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketConfig.Jsii$Proxy that = (S3BucketConfig.Jsii$Proxy) o;

            if (this.accelerationStatus != null ? !this.accelerationStatus.equals(that.accelerationStatus) : that.accelerationStatus != null) return false;
            if (this.acl != null ? !this.acl.equals(that.acl) : that.acl != null) return false;
            if (this.bucket != null ? !this.bucket.equals(that.bucket) : that.bucket != null) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            if (this.corsRule != null ? !this.corsRule.equals(that.corsRule) : that.corsRule != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.grant != null ? !this.grant.equals(that.grant) : that.grant != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lifecycleRule != null ? !this.lifecycleRule.equals(that.lifecycleRule) : that.lifecycleRule != null) return false;
            if (this.logging != null ? !this.logging.equals(that.logging) : that.logging != null) return false;
            if (this.objectLockConfiguration != null ? !this.objectLockConfiguration.equals(that.objectLockConfiguration) : that.objectLockConfiguration != null) return false;
            if (this.objectLockEnabled != null ? !this.objectLockEnabled.equals(that.objectLockEnabled) : that.objectLockEnabled != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.replicationConfiguration != null ? !this.replicationConfiguration.equals(that.replicationConfiguration) : that.replicationConfiguration != null) return false;
            if (this.requestPayer != null ? !this.requestPayer.equals(that.requestPayer) : that.requestPayer != null) return false;
            if (this.serverSideEncryptionConfiguration != null ? !this.serverSideEncryptionConfiguration.equals(that.serverSideEncryptionConfiguration) : that.serverSideEncryptionConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.versioning != null ? !this.versioning.equals(that.versioning) : that.versioning != null) return false;
            if (this.website != null ? !this.website.equals(that.website) : that.website != null) return false;
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
            int result = this.accelerationStatus != null ? this.accelerationStatus.hashCode() : 0;
            result = 31 * result + (this.acl != null ? this.acl.hashCode() : 0);
            result = 31 * result + (this.bucket != null ? this.bucket.hashCode() : 0);
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.corsRule != null ? this.corsRule.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.grant != null ? this.grant.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lifecycleRule != null ? this.lifecycleRule.hashCode() : 0);
            result = 31 * result + (this.logging != null ? this.logging.hashCode() : 0);
            result = 31 * result + (this.objectLockConfiguration != null ? this.objectLockConfiguration.hashCode() : 0);
            result = 31 * result + (this.objectLockEnabled != null ? this.objectLockEnabled.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.replicationConfiguration != null ? this.replicationConfiguration.hashCode() : 0);
            result = 31 * result + (this.requestPayer != null ? this.requestPayer.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryptionConfiguration != null ? this.serverSideEncryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.versioning != null ? this.versioning.hashCode() : 0);
            result = 31 * result + (this.website != null ? this.website.hashCode() : 0);
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
