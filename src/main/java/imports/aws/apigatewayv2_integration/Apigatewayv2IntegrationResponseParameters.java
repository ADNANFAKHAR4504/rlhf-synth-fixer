package imports.aws.apigatewayv2_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Integration.Apigatewayv2IntegrationResponseParameters")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2IntegrationResponseParameters.Jsii$Proxy.class)
public interface Apigatewayv2IntegrationResponseParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#mappings Apigatewayv2Integration#mappings}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getMappings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#status_code Apigatewayv2Integration#status_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatusCode();

    /**
     * @return a {@link Builder} of {@link Apigatewayv2IntegrationResponseParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2IntegrationResponseParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2IntegrationResponseParameters> {
        java.util.Map<java.lang.String, java.lang.String> mappings;
        java.lang.String statusCode;

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseParameters#getMappings}
         * @param mappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#mappings Apigatewayv2Integration#mappings}. This parameter is required.
         * @return {@code this}
         */
        public Builder mappings(java.util.Map<java.lang.String, java.lang.String> mappings) {
            this.mappings = mappings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseParameters#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#status_code Apigatewayv2Integration#status_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2IntegrationResponseParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2IntegrationResponseParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2IntegrationResponseParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2IntegrationResponseParameters {
        private final java.util.Map<java.lang.String, java.lang.String> mappings;
        private final java.lang.String statusCode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mappings = software.amazon.jsii.Kernel.get(this, "mappings", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mappings = java.util.Objects.requireNonNull(builder.mappings, "mappings is required");
            this.statusCode = java.util.Objects.requireNonNull(builder.statusCode, "statusCode is required");
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getMappings() {
            return this.mappings;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mappings", om.valueToTree(this.getMappings()));
            data.set("statusCode", om.valueToTree(this.getStatusCode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Integration.Apigatewayv2IntegrationResponseParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2IntegrationResponseParameters.Jsii$Proxy that = (Apigatewayv2IntegrationResponseParameters.Jsii$Proxy) o;

            if (!mappings.equals(that.mappings)) return false;
            return this.statusCode.equals(that.statusCode);
        }

        @Override
        public final int hashCode() {
            int result = this.mappings.hashCode();
            result = 31 * result + (this.statusCode.hashCode());
            return result;
        }
    }
}
