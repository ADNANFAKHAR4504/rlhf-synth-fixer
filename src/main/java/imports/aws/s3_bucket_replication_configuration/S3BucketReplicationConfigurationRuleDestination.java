package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestination")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleDestination.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#bucket S3BucketReplicationConfigurationA#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * access_control_translation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#access_control_translation S3BucketReplicationConfigurationA#access_control_translation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation getAccessControlTranslation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#account S3BucketReplicationConfigurationA#account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccount() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#encryption_configuration S3BucketReplicationConfigurationA#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration getEncryptionConfiguration() {
        return null;
    }

    /**
     * metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#metrics S3BucketReplicationConfigurationA#metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics getMetrics() {
        return null;
    }

    /**
     * replication_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replication_time S3BucketReplicationConfigurationA#replication_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime getReplicationTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#storage_class S3BucketReplicationConfigurationA#storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageClass() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleDestination> {
        java.lang.String bucket;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation accessControlTranslation;
        java.lang.String account;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration encryptionConfiguration;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics metrics;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime replicationTime;
        java.lang.String storageClass;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#bucket S3BucketReplicationConfigurationA#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getAccessControlTranslation}
         * @param accessControlTranslation access_control_translation block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#access_control_translation S3BucketReplicationConfigurationA#access_control_translation}
         * @return {@code this}
         */
        public Builder accessControlTranslation(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation accessControlTranslation) {
            this.accessControlTranslation = accessControlTranslation;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getAccount}
         * @param account Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#account S3BucketReplicationConfigurationA#account}.
         * @return {@code this}
         */
        public Builder account(java.lang.String account) {
            this.account = account;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#encryption_configuration S3BucketReplicationConfigurationA#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getMetrics}
         * @param metrics metrics block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#metrics S3BucketReplicationConfigurationA#metrics}
         * @return {@code this}
         */
        public Builder metrics(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics metrics) {
            this.metrics = metrics;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getReplicationTime}
         * @param replicationTime replication_time block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replication_time S3BucketReplicationConfigurationA#replication_time}
         * @return {@code this}
         */
        public Builder replicationTime(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime replicationTime) {
            this.replicationTime = replicationTime;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestination#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#storage_class S3BucketReplicationConfigurationA#storage_class}.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleDestination {
        private final java.lang.String bucket;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation accessControlTranslation;
        private final java.lang.String account;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration encryptionConfiguration;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics metrics;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime replicationTime;
        private final java.lang.String storageClass;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessControlTranslation = software.amazon.jsii.Kernel.get(this, "accessControlTranslation", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation.class));
            this.account = software.amazon.jsii.Kernel.get(this, "account", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration.class));
            this.metrics = software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics.class));
            this.replicationTime = software.amazon.jsii.Kernel.get(this, "replicationTime", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime.class));
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.accessControlTranslation = builder.accessControlTranslation;
            this.account = builder.account;
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.metrics = builder.metrics;
            this.replicationTime = builder.replicationTime;
            this.storageClass = builder.storageClass;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationAccessControlTranslation getAccessControlTranslation() {
            return this.accessControlTranslation;
        }

        @Override
        public final java.lang.String getAccount() {
            return this.account;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetrics getMetrics() {
            return this.metrics;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTime getReplicationTime() {
            return this.replicationTime;
        }

        @Override
        public final java.lang.String getStorageClass() {
            return this.storageClass;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getAccessControlTranslation() != null) {
                data.set("accessControlTranslation", om.valueToTree(this.getAccessControlTranslation()));
            }
            if (this.getAccount() != null) {
                data.set("account", om.valueToTree(this.getAccount()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getMetrics() != null) {
                data.set("metrics", om.valueToTree(this.getMetrics()));
            }
            if (this.getReplicationTime() != null) {
                data.set("replicationTime", om.valueToTree(this.getReplicationTime()));
            }
            if (this.getStorageClass() != null) {
                data.set("storageClass", om.valueToTree(this.getStorageClass()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleDestination.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleDestination.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.accessControlTranslation != null ? !this.accessControlTranslation.equals(that.accessControlTranslation) : that.accessControlTranslation != null) return false;
            if (this.account != null ? !this.account.equals(that.account) : that.account != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.metrics != null ? !this.metrics.equals(that.metrics) : that.metrics != null) return false;
            if (this.replicationTime != null ? !this.replicationTime.equals(that.replicationTime) : that.replicationTime != null) return false;
            return this.storageClass != null ? this.storageClass.equals(that.storageClass) : that.storageClass == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.accessControlTranslation != null ? this.accessControlTranslation.hashCode() : 0);
            result = 31 * result + (this.account != null ? this.account.hashCode() : 0);
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.metrics != null ? this.metrics.hashCode() : 0);
            result = 31 * result + (this.replicationTime != null ? this.replicationTime.hashCode() : 0);
            result = 31 * result + (this.storageClass != null ? this.storageClass.hashCode() : 0);
            return result;
        }
    }
}
