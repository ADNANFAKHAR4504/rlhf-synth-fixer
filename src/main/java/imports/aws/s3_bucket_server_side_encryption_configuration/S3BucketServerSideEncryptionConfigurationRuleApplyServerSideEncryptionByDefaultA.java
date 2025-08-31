package imports.aws.s3_bucket_server_side_encryption_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA")
@software.amazon.jsii.Jsii.Proxy(S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.Jsii$Proxy.class)
public interface S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_server_side_encryption_configuration#sse_algorithm S3BucketServerSideEncryptionConfigurationA#sse_algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSseAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_server_side_encryption_configuration#kms_master_key_id S3BucketServerSideEncryptionConfigurationA#kms_master_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA> {
        java.lang.String sseAlgorithm;
        java.lang.String kmsMasterKeyId;

        /**
         * Sets the value of {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA#getSseAlgorithm}
         * @param sseAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_server_side_encryption_configuration#sse_algorithm S3BucketServerSideEncryptionConfigurationA#sse_algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder sseAlgorithm(java.lang.String sseAlgorithm) {
            this.sseAlgorithm = sseAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA#getKmsMasterKeyId}
         * @param kmsMasterKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_server_side_encryption_configuration#kms_master_key_id S3BucketServerSideEncryptionConfigurationA#kms_master_key_id}.
         * @return {@code this}
         */
        public Builder kmsMasterKeyId(java.lang.String kmsMasterKeyId) {
            this.kmsMasterKeyId = kmsMasterKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA {
        private final java.lang.String sseAlgorithm;
        private final java.lang.String kmsMasterKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sseAlgorithm = software.amazon.jsii.Kernel.get(this, "sseAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsMasterKeyId = software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sseAlgorithm = java.util.Objects.requireNonNull(builder.sseAlgorithm, "sseAlgorithm is required");
            this.kmsMasterKeyId = builder.kmsMasterKeyId;
        }

        @Override
        public final java.lang.String getSseAlgorithm() {
            return this.sseAlgorithm;
        }

        @Override
        public final java.lang.String getKmsMasterKeyId() {
            return this.kmsMasterKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sseAlgorithm", om.valueToTree(this.getSseAlgorithm()));
            if (this.getKmsMasterKeyId() != null) {
                data.set("kmsMasterKeyId", om.valueToTree(this.getKmsMasterKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.Jsii$Proxy that = (S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.Jsii$Proxy) o;

            if (!sseAlgorithm.equals(that.sseAlgorithm)) return false;
            return this.kmsMasterKeyId != null ? this.kmsMasterKeyId.equals(that.kmsMasterKeyId) : that.kmsMasterKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sseAlgorithm.hashCode();
            result = 31 * result + (this.kmsMasterKeyId != null ? this.kmsMasterKeyId.hashCode() : 0);
            return result;
        }
    }
}
