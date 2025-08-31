package imports.aws.qbusiness_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.094Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.qbusinessApplication.QbusinessApplicationEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(QbusinessApplicationEncryptionConfiguration.Jsii$Proxy.class)
public interface QbusinessApplicationEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * The identifier of the AWS KMS key that is used to encrypt your data.
     * <p>
     * Amazon Q doesn't support asymmetric keys.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#kms_key_id QbusinessApplication#kms_key_id}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId();

    /**
     * @return a {@link Builder} of {@link QbusinessApplicationEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QbusinessApplicationEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QbusinessApplicationEncryptionConfiguration> {
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link QbusinessApplicationEncryptionConfiguration#getKmsKeyId}
         * @param kmsKeyId The identifier of the AWS KMS key that is used to encrypt your data. This parameter is required.
         *                 Amazon Q doesn't support asymmetric keys.
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#kms_key_id QbusinessApplication#kms_key_id}
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QbusinessApplicationEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QbusinessApplicationEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QbusinessApplicationEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QbusinessApplicationEncryptionConfiguration {
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyId = java.util.Objects.requireNonNull(builder.kmsKeyId, "kmsKeyId is required");
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.qbusinessApplication.QbusinessApplicationEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QbusinessApplicationEncryptionConfiguration.Jsii$Proxy that = (QbusinessApplicationEncryptionConfiguration.Jsii$Proxy) o;

            return this.kmsKeyId.equals(that.kmsKeyId);
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyId.hashCode();
            return result;
        }
    }
}
