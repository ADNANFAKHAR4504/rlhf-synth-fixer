package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfigurationRulesDestination")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRulesDestination.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRulesDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * access_control_translation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#access_control_translation S3Bucket#access_control_translation}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation getAccessControlTranslation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#account_id S3Bucket#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#metrics S3Bucket#metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics getMetrics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replica_kms_key_id S3Bucket#replica_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicaKmsKeyId() {
        return null;
    }

    /**
     * replication_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replication_time S3Bucket#replication_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime getReplicationTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#storage_class S3Bucket#storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageClass() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRulesDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRulesDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRulesDestination> {
        java.lang.String bucket;
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation accessControlTranslation;
        java.lang.String accountId;
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics metrics;
        java.lang.String replicaKmsKeyId;
        imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime replicationTime;
        java.lang.String storageClass;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#bucket S3Bucket#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getAccessControlTranslation}
         * @param accessControlTranslation access_control_translation block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#access_control_translation S3Bucket#access_control_translation}
         * @return {@code this}
         */
        public Builder accessControlTranslation(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation accessControlTranslation) {
            this.accessControlTranslation = accessControlTranslation;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#account_id S3Bucket#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getMetrics}
         * @param metrics metrics block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#metrics S3Bucket#metrics}
         * @return {@code this}
         */
        public Builder metrics(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics metrics) {
            this.metrics = metrics;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getReplicaKmsKeyId}
         * @param replicaKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replica_kms_key_id S3Bucket#replica_kms_key_id}.
         * @return {@code this}
         */
        public Builder replicaKmsKeyId(java.lang.String replicaKmsKeyId) {
            this.replicaKmsKeyId = replicaKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getReplicationTime}
         * @param replicationTime replication_time block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#replication_time S3Bucket#replication_time}
         * @return {@code this}
         */
        public Builder replicationTime(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime replicationTime) {
            this.replicationTime = replicationTime;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRulesDestination#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#storage_class S3Bucket#storage_class}.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRulesDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRulesDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRulesDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRulesDestination {
        private final java.lang.String bucket;
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation accessControlTranslation;
        private final java.lang.String accountId;
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics metrics;
        private final java.lang.String replicaKmsKeyId;
        private final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime replicationTime;
        private final java.lang.String storageClass;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessControlTranslation = software.amazon.jsii.Kernel.get(this, "accessControlTranslation", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metrics = software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics.class));
            this.replicaKmsKeyId = software.amazon.jsii.Kernel.get(this, "replicaKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationTime = software.amazon.jsii.Kernel.get(this, "replicationTime", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime.class));
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.accessControlTranslation = builder.accessControlTranslation;
            this.accountId = builder.accountId;
            this.metrics = builder.metrics;
            this.replicaKmsKeyId = builder.replicaKmsKeyId;
            this.replicationTime = builder.replicationTime;
            this.storageClass = builder.storageClass;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationAccessControlTranslation getAccessControlTranslation() {
            return this.accessControlTranslation;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationMetrics getMetrics() {
            return this.metrics;
        }

        @Override
        public final java.lang.String getReplicaKmsKeyId() {
            return this.replicaKmsKeyId;
        }

        @Override
        public final imports.aws.s3_bucket.S3BucketReplicationConfigurationRulesDestinationReplicationTime getReplicationTime() {
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
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getMetrics() != null) {
                data.set("metrics", om.valueToTree(this.getMetrics()));
            }
            if (this.getReplicaKmsKeyId() != null) {
                data.set("replicaKmsKeyId", om.valueToTree(this.getReplicaKmsKeyId()));
            }
            if (this.getReplicationTime() != null) {
                data.set("replicationTime", om.valueToTree(this.getReplicationTime()));
            }
            if (this.getStorageClass() != null) {
                data.set("storageClass", om.valueToTree(this.getStorageClass()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketReplicationConfigurationRulesDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRulesDestination.Jsii$Proxy that = (S3BucketReplicationConfigurationRulesDestination.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.accessControlTranslation != null ? !this.accessControlTranslation.equals(that.accessControlTranslation) : that.accessControlTranslation != null) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.metrics != null ? !this.metrics.equals(that.metrics) : that.metrics != null) return false;
            if (this.replicaKmsKeyId != null ? !this.replicaKmsKeyId.equals(that.replicaKmsKeyId) : that.replicaKmsKeyId != null) return false;
            if (this.replicationTime != null ? !this.replicationTime.equals(that.replicationTime) : that.replicationTime != null) return false;
            return this.storageClass != null ? this.storageClass.equals(that.storageClass) : that.storageClass == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.accessControlTranslation != null ? this.accessControlTranslation.hashCode() : 0);
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.metrics != null ? this.metrics.hashCode() : 0);
            result = 31 * result + (this.replicaKmsKeyId != null ? this.replicaKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.replicationTime != null ? this.replicationTime.hashCode() : 0);
            result = 31 * result + (this.storageClass != null ? this.storageClass.hashCode() : 0);
            return result;
        }
    }
}
