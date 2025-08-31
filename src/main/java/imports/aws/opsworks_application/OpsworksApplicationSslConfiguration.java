package imports.aws.opsworks_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksApplication.OpsworksApplicationSslConfiguration")
@software.amazon.jsii.Jsii.Proxy(OpsworksApplicationSslConfiguration.Jsii$Proxy.class)
public interface OpsworksApplicationSslConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#certificate OpsworksApplication#certificate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCertificate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#private_key OpsworksApplication#private_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrivateKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#chain OpsworksApplication#chain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getChain() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksApplicationSslConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksApplicationSslConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksApplicationSslConfiguration> {
        java.lang.String certificate;
        java.lang.String privateKey;
        java.lang.String chain;

        /**
         * Sets the value of {@link OpsworksApplicationSslConfiguration#getCertificate}
         * @param certificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#certificate OpsworksApplication#certificate}. This parameter is required.
         * @return {@code this}
         */
        public Builder certificate(java.lang.String certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationSslConfiguration#getPrivateKey}
         * @param privateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#private_key OpsworksApplication#private_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder privateKey(java.lang.String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationSslConfiguration#getChain}
         * @param chain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#chain OpsworksApplication#chain}.
         * @return {@code this}
         */
        public Builder chain(java.lang.String chain) {
            this.chain = chain;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksApplicationSslConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksApplicationSslConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksApplicationSslConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksApplicationSslConfiguration {
        private final java.lang.String certificate;
        private final java.lang.String privateKey;
        private final java.lang.String chain;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateKey = software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.chain = software.amazon.jsii.Kernel.get(this, "chain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificate = java.util.Objects.requireNonNull(builder.certificate, "certificate is required");
            this.privateKey = java.util.Objects.requireNonNull(builder.privateKey, "privateKey is required");
            this.chain = builder.chain;
        }

        @Override
        public final java.lang.String getCertificate() {
            return this.certificate;
        }

        @Override
        public final java.lang.String getPrivateKey() {
            return this.privateKey;
        }

        @Override
        public final java.lang.String getChain() {
            return this.chain;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificate", om.valueToTree(this.getCertificate()));
            data.set("privateKey", om.valueToTree(this.getPrivateKey()));
            if (this.getChain() != null) {
                data.set("chain", om.valueToTree(this.getChain()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksApplication.OpsworksApplicationSslConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksApplicationSslConfiguration.Jsii$Proxy that = (OpsworksApplicationSslConfiguration.Jsii$Proxy) o;

            if (!certificate.equals(that.certificate)) return false;
            if (!privateKey.equals(that.privateKey)) return false;
            return this.chain != null ? this.chain.equals(that.chain) : that.chain == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificate.hashCode();
            result = 31 * result + (this.privateKey.hashCode());
            result = 31 * result + (this.chain != null ? this.chain.hashCode() : 0);
            return result;
        }
    }
}
