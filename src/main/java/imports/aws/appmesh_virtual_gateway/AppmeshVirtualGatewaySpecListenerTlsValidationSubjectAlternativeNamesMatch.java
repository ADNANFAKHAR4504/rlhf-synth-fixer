package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#exact AppmeshVirtualGateway#exact}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExact();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch> {
        java.util.List<java.lang.String> exact;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch#getExact}
         * @param exact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#exact AppmeshVirtualGateway#exact}. This parameter is required.
         * @return {@code this}
         */
        public Builder exact(java.util.List<java.lang.String> exact) {
            this.exact = exact;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch {
        private final java.util.List<java.lang.String> exact;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exact = software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exact = java.util.Objects.requireNonNull(builder.exact, "exact is required");
        }

        @Override
        public final java.util.List<java.lang.String> getExact() {
            return this.exact;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("exact", om.valueToTree(this.getExact()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNamesMatch.Jsii$Proxy) o;

            return this.exact.equals(that.exact);
        }

        @Override
        public final int hashCode() {
            int result = this.exact.hashCode();
            return result;
        }
    }
}
