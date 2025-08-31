package imports.aws.apigatewayv2_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Integration.Apigatewayv2IntegrationTlsConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2IntegrationTlsConfig.Jsii$Proxy.class)
public interface Apigatewayv2IntegrationTlsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#server_name_to_verify Apigatewayv2Integration#server_name_to_verify}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerNameToVerify() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2IntegrationTlsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2IntegrationTlsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2IntegrationTlsConfig> {
        java.lang.String serverNameToVerify;

        /**
         * Sets the value of {@link Apigatewayv2IntegrationTlsConfig#getServerNameToVerify}
         * @param serverNameToVerify Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#server_name_to_verify Apigatewayv2Integration#server_name_to_verify}.
         * @return {@code this}
         */
        public Builder serverNameToVerify(java.lang.String serverNameToVerify) {
            this.serverNameToVerify = serverNameToVerify;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2IntegrationTlsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2IntegrationTlsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2IntegrationTlsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2IntegrationTlsConfig {
        private final java.lang.String serverNameToVerify;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.serverNameToVerify = software.amazon.jsii.Kernel.get(this, "serverNameToVerify", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.serverNameToVerify = builder.serverNameToVerify;
        }

        @Override
        public final java.lang.String getServerNameToVerify() {
            return this.serverNameToVerify;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getServerNameToVerify() != null) {
                data.set("serverNameToVerify", om.valueToTree(this.getServerNameToVerify()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Integration.Apigatewayv2IntegrationTlsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2IntegrationTlsConfig.Jsii$Proxy that = (Apigatewayv2IntegrationTlsConfig.Jsii$Proxy) o;

            return this.serverNameToVerify != null ? this.serverNameToVerify.equals(that.serverNameToVerify) : that.serverNameToVerify == null;
        }

        @Override
        public final int hashCode() {
            int result = this.serverNameToVerify != null ? this.serverNameToVerify.hashCode() : 0;
            return result;
        }
    }
}
