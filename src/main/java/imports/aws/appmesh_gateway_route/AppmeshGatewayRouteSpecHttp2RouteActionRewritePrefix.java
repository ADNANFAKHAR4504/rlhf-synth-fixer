package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.022Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix> {
        java.lang.String defaultPrefix;
        java.lang.String value;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix#getDefaultPrefix}
         * @param defaultPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#default_prefix AppmeshGatewayRoute#default_prefix}.
         * @return {@code this}
         */
        public Builder defaultPrefix(java.lang.String defaultPrefix) {
            this.defaultPrefix = defaultPrefix;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#value AppmeshGatewayRoute#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix {
        private final java.lang.String defaultPrefix;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultPrefix = software.amazon.jsii.Kernel.get(this, "defaultPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultPrefix = builder.defaultPrefix;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getDefaultPrefix() {
            return this.defaultPrefix;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultPrefix() != null) {
                data.set("defaultPrefix", om.valueToTree(this.getDefaultPrefix()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteActionRewritePrefix.Jsii$Proxy) o;

            if (this.defaultPrefix != null ? !this.defaultPrefix.equals(that.defaultPrefix) : that.defaultPrefix != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultPrefix != null ? this.defaultPrefix.hashCode() : 0;
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
