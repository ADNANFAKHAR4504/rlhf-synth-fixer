package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replica_kms_key_id S3BucketReplicationConfigurationA#replica_kms_key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicaKmsKeyId();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration> {
        java.lang.String replicaKmsKeyId;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration#getReplicaKmsKeyId}
         * @param replicaKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#replica_kms_key_id S3BucketReplicationConfigurationA#replica_kms_key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicaKmsKeyId(java.lang.String replicaKmsKeyId) {
            this.replicaKmsKeyId = replicaKmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration {
        private final java.lang.String replicaKmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replicaKmsKeyId = software.amazon.jsii.Kernel.get(this, "replicaKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replicaKmsKeyId = java.util.Objects.requireNonNull(builder.replicaKmsKeyId, "replicaKmsKeyId is required");
        }

        @Override
        public final java.lang.String getReplicaKmsKeyId() {
            return this.replicaKmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("replicaKmsKeyId", om.valueToTree(this.getReplicaKmsKeyId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration.Jsii$Proxy) o;

            return this.replicaKmsKeyId.equals(that.replicaKmsKeyId);
        }

        @Override
        public final int hashCode() {
            int result = this.replicaKmsKeyId.hashCode();
            return result;
        }
    }
}
