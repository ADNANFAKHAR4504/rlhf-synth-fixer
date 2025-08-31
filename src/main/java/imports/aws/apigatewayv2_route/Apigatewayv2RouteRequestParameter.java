package imports.aws.apigatewayv2_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.972Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Route.Apigatewayv2RouteRequestParameter")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2RouteRequestParameter.Jsii$Proxy.class)
public interface Apigatewayv2RouteRequestParameter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter_key Apigatewayv2Route#request_parameter_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRequestParameterKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#required Apigatewayv2Route#required}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRequired();

    /**
     * @return a {@link Builder} of {@link Apigatewayv2RouteRequestParameter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2RouteRequestParameter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2RouteRequestParameter> {
        java.lang.String requestParameterKey;
        java.lang.Object required;

        /**
         * Sets the value of {@link Apigatewayv2RouteRequestParameter#getRequestParameterKey}
         * @param requestParameterKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#request_parameter_key Apigatewayv2Route#request_parameter_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder requestParameterKey(java.lang.String requestParameterKey) {
            this.requestParameterKey = requestParameterKey;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteRequestParameter#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#required Apigatewayv2Route#required}. This parameter is required.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2RouteRequestParameter#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_route#required Apigatewayv2Route#required}. This parameter is required.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2RouteRequestParameter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2RouteRequestParameter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2RouteRequestParameter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2RouteRequestParameter {
        private final java.lang.String requestParameterKey;
        private final java.lang.Object required;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.requestParameterKey = software.amazon.jsii.Kernel.get(this, "requestParameterKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.requestParameterKey = java.util.Objects.requireNonNull(builder.requestParameterKey, "requestParameterKey is required");
            this.required = java.util.Objects.requireNonNull(builder.required, "required is required");
        }

        @Override
        public final java.lang.String getRequestParameterKey() {
            return this.requestParameterKey;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("requestParameterKey", om.valueToTree(this.getRequestParameterKey()));
            data.set("required", om.valueToTree(this.getRequired()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Route.Apigatewayv2RouteRequestParameter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2RouteRequestParameter.Jsii$Proxy that = (Apigatewayv2RouteRequestParameter.Jsii$Proxy) o;

            if (!requestParameterKey.equals(that.requestParameterKey)) return false;
            return this.required.equals(that.required);
        }

        @Override
        public final int hashCode() {
            int result = this.requestParameterKey.hashCode();
            result = 31 * result + (this.required.hashCode());
            return result;
        }
    }
}
