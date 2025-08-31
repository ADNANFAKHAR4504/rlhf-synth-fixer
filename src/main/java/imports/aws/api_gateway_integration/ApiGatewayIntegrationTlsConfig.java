package imports.aws.api_gateway_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.948Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayIntegration.ApiGatewayIntegrationTlsConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayIntegrationTlsConfig.Jsii$Proxy.class)
public interface ApiGatewayIntegrationTlsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#insecure_skip_verification ApiGatewayIntegration#insecure_skip_verification}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInsecureSkipVerification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayIntegrationTlsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayIntegrationTlsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayIntegrationTlsConfig> {
        java.lang.Object insecureSkipVerification;

        /**
         * Sets the value of {@link ApiGatewayIntegrationTlsConfig#getInsecureSkipVerification}
         * @param insecureSkipVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#insecure_skip_verification ApiGatewayIntegration#insecure_skip_verification}.
         * @return {@code this}
         */
        public Builder insecureSkipVerification(java.lang.Boolean insecureSkipVerification) {
            this.insecureSkipVerification = insecureSkipVerification;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayIntegrationTlsConfig#getInsecureSkipVerification}
         * @param insecureSkipVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_integration#insecure_skip_verification ApiGatewayIntegration#insecure_skip_verification}.
         * @return {@code this}
         */
        public Builder insecureSkipVerification(com.hashicorp.cdktf.IResolvable insecureSkipVerification) {
            this.insecureSkipVerification = insecureSkipVerification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayIntegrationTlsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayIntegrationTlsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayIntegrationTlsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayIntegrationTlsConfig {
        private final java.lang.Object insecureSkipVerification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.insecureSkipVerification = software.amazon.jsii.Kernel.get(this, "insecureSkipVerification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.insecureSkipVerification = builder.insecureSkipVerification;
        }

        @Override
        public final java.lang.Object getInsecureSkipVerification() {
            return this.insecureSkipVerification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInsecureSkipVerification() != null) {
                data.set("insecureSkipVerification", om.valueToTree(this.getInsecureSkipVerification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayIntegration.ApiGatewayIntegrationTlsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayIntegrationTlsConfig.Jsii$Proxy that = (ApiGatewayIntegrationTlsConfig.Jsii$Proxy) o;

            return this.insecureSkipVerification != null ? this.insecureSkipVerification.equals(that.insecureSkipVerification) : that.insecureSkipVerification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.insecureSkipVerification != null ? this.insecureSkipVerification.hashCode() : 0;
            return result;
        }
    }
}
