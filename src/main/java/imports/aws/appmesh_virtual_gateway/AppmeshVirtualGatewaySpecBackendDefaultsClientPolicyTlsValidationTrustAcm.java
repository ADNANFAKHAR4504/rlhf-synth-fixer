package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.035Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#certificate_authority_arns AppmeshVirtualGateway#certificate_authority_arns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCertificateAuthorityArns();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm> {
        java.util.List<java.lang.String> certificateAuthorityArns;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm#getCertificateAuthorityArns}
         * @param certificateAuthorityArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#certificate_authority_arns AppmeshVirtualGateway#certificate_authority_arns}. This parameter is required.
         * @return {@code this}
         */
        public Builder certificateAuthorityArns(java.util.List<java.lang.String> certificateAuthorityArns) {
            this.certificateAuthorityArns = certificateAuthorityArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm {
        private final java.util.List<java.lang.String> certificateAuthorityArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateAuthorityArns = software.amazon.jsii.Kernel.get(this, "certificateAuthorityArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateAuthorityArns = java.util.Objects.requireNonNull(builder.certificateAuthorityArns, "certificateAuthorityArns is required");
        }

        @Override
        public final java.util.List<java.lang.String> getCertificateAuthorityArns() {
            return this.certificateAuthorityArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificateAuthorityArns", om.valueToTree(this.getCertificateAuthorityArns()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm.Jsii$Proxy that = (AppmeshVirtualGatewaySpecBackendDefaultsClientPolicyTlsValidationTrustAcm.Jsii$Proxy) o;

            return this.certificateAuthorityArns.equals(that.certificateAuthorityArns);
        }

        @Override
        public final int hashCode() {
            int result = this.certificateAuthorityArns.hashCode();
            return result;
        }
    }
}
