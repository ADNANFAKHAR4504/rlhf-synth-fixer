package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.042Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#certificate_chain AppmeshVirtualNode#certificate_chain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCertificateChain();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#private_key AppmeshVirtualNode#private_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrivateKey();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile> {
        java.lang.String certificateChain;
        java.lang.String privateKey;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile#getCertificateChain}
         * @param certificateChain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#certificate_chain AppmeshVirtualNode#certificate_chain}. This parameter is required.
         * @return {@code this}
         */
        public Builder certificateChain(java.lang.String certificateChain) {
            this.certificateChain = certificateChain;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile#getPrivateKey}
         * @param privateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#private_key AppmeshVirtualNode#private_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder privateKey(java.lang.String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile {
        private final java.lang.String certificateChain;
        private final java.lang.String privateKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateChain = software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateKey = software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateChain = java.util.Objects.requireNonNull(builder.certificateChain, "certificateChain is required");
            this.privateKey = java.util.Objects.requireNonNull(builder.privateKey, "privateKey is required");
        }

        @Override
        public final java.lang.String getCertificateChain() {
            return this.certificateChain;
        }

        @Override
        public final java.lang.String getPrivateKey() {
            return this.privateKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificateChain", om.valueToTree(this.getCertificateChain()));
            data.set("privateKey", om.valueToTree(this.getPrivateKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile.Jsii$Proxy that = (AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificateFile.Jsii$Proxy) o;

            if (!certificateChain.equals(that.certificateChain)) return false;
            return this.privateKey.equals(that.privateKey);
        }

        @Override
        public final int hashCode() {
            int result = this.certificateChain.hashCode();
            result = 31 * result + (this.privateKey.hashCode());
            return result;
        }
    }
}
