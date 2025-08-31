package imports.aws.transfer_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.563Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferConnector.TransferConnectorSftpConfig")
@software.amazon.jsii.Jsii.Proxy(TransferConnectorSftpConfig.Jsii$Proxy.class)
public interface TransferConnectorSftpConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#trusted_host_keys TransferConnector#trusted_host_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedHostKeys() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#user_secret_id TransferConnector#user_secret_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserSecretId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferConnectorSftpConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferConnectorSftpConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferConnectorSftpConfig> {
        java.util.List<java.lang.String> trustedHostKeys;
        java.lang.String userSecretId;

        /**
         * Sets the value of {@link TransferConnectorSftpConfig#getTrustedHostKeys}
         * @param trustedHostKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#trusted_host_keys TransferConnector#trusted_host_keys}.
         * @return {@code this}
         */
        public Builder trustedHostKeys(java.util.List<java.lang.String> trustedHostKeys) {
            this.trustedHostKeys = trustedHostKeys;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorSftpConfig#getUserSecretId}
         * @param userSecretId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#user_secret_id TransferConnector#user_secret_id}.
         * @return {@code this}
         */
        public Builder userSecretId(java.lang.String userSecretId) {
            this.userSecretId = userSecretId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferConnectorSftpConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferConnectorSftpConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferConnectorSftpConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferConnectorSftpConfig {
        private final java.util.List<java.lang.String> trustedHostKeys;
        private final java.lang.String userSecretId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.trustedHostKeys = software.amazon.jsii.Kernel.get(this, "trustedHostKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userSecretId = software.amazon.jsii.Kernel.get(this, "userSecretId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.trustedHostKeys = builder.trustedHostKeys;
            this.userSecretId = builder.userSecretId;
        }

        @Override
        public final java.util.List<java.lang.String> getTrustedHostKeys() {
            return this.trustedHostKeys;
        }

        @Override
        public final java.lang.String getUserSecretId() {
            return this.userSecretId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTrustedHostKeys() != null) {
                data.set("trustedHostKeys", om.valueToTree(this.getTrustedHostKeys()));
            }
            if (this.getUserSecretId() != null) {
                data.set("userSecretId", om.valueToTree(this.getUserSecretId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferConnector.TransferConnectorSftpConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferConnectorSftpConfig.Jsii$Proxy that = (TransferConnectorSftpConfig.Jsii$Proxy) o;

            if (this.trustedHostKeys != null ? !this.trustedHostKeys.equals(that.trustedHostKeys) : that.trustedHostKeys != null) return false;
            return this.userSecretId != null ? this.userSecretId.equals(that.userSecretId) : that.userSecretId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.trustedHostKeys != null ? this.trustedHostKeys.hashCode() : 0;
            result = 31 * result + (this.userSecretId != null ? this.userSecretId.hashCode() : 0);
            return result;
        }
    }
}
