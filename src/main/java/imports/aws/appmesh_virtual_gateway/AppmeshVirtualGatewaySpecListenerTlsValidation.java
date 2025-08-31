package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidation")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListenerTlsValidation.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListenerTlsValidation extends software.amazon.jsii.JsiiSerializable {

    /**
     * trust block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#trust AppmeshVirtualGateway#trust}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust getTrust();

    /**
     * subject_alternative_names block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#subject_alternative_names AppmeshVirtualGateway#subject_alternative_names}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames getSubjectAlternativeNames() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListenerTlsValidation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListenerTlsValidation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListenerTlsValidation> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust trust;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames subjectAlternativeNames;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerTlsValidation#getTrust}
         * @param trust trust block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#trust AppmeshVirtualGateway#trust}
         * @return {@code this}
         */
        public Builder trust(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust trust) {
            this.trust = trust;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerTlsValidation#getSubjectAlternativeNames}
         * @param subjectAlternativeNames subject_alternative_names block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#subject_alternative_names AppmeshVirtualGateway#subject_alternative_names}
         * @return {@code this}
         */
        public Builder subjectAlternativeNames(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames subjectAlternativeNames) {
            this.subjectAlternativeNames = subjectAlternativeNames;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListenerTlsValidation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListenerTlsValidation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListenerTlsValidation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListenerTlsValidation {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust trust;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames subjectAlternativeNames;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.trust = software.amazon.jsii.Kernel.get(this, "trust", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust.class));
            this.subjectAlternativeNames = software.amazon.jsii.Kernel.get(this, "subjectAlternativeNames", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.trust = java.util.Objects.requireNonNull(builder.trust, "trust is required");
            this.subjectAlternativeNames = builder.subjectAlternativeNames;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust getTrust() {
            return this.trust;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationSubjectAlternativeNames getSubjectAlternativeNames() {
            return this.subjectAlternativeNames;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("trust", om.valueToTree(this.getTrust()));
            if (this.getSubjectAlternativeNames() != null) {
                data.set("subjectAlternativeNames", om.valueToTree(this.getSubjectAlternativeNames()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListenerTlsValidation.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListenerTlsValidation.Jsii$Proxy) o;

            if (!trust.equals(that.trust)) return false;
            return this.subjectAlternativeNames != null ? this.subjectAlternativeNames.equals(that.subjectAlternativeNames) : that.subjectAlternativeNames == null;
        }

        @Override
        public final int hashCode() {
            int result = this.trust.hashCode();
            result = 31 * result + (this.subjectAlternativeNames != null ? this.subjectAlternativeNames.hashCode() : 0);
            return result;
        }
    }
}
