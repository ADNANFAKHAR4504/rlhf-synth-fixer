package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.023Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHostname")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttp2RouteMatchHostname.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttp2RouteMatchHostname extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuffix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttp2RouteMatchHostname> {
        java.lang.String exact;
        java.lang.String suffix;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname#getExact}
         * @param exact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
         * @return {@code this}
         */
        public Builder exact(java.lang.String exact) {
            this.exact = exact;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname#getSuffix}
         * @param suffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#suffix AppmeshGatewayRoute#suffix}.
         * @return {@code this}
         */
        public Builder suffix(java.lang.String suffix) {
            this.suffix = suffix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttp2RouteMatchHostname build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttp2RouteMatchHostname}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttp2RouteMatchHostname {
        private final java.lang.String exact;
        private final java.lang.String suffix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exact = software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.suffix = software.amazon.jsii.Kernel.get(this, "suffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exact = builder.exact;
            this.suffix = builder.suffix;
        }

        @Override
        public final java.lang.String getExact() {
            return this.exact;
        }

        @Override
        public final java.lang.String getSuffix() {
            return this.suffix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExact() != null) {
                data.set("exact", om.valueToTree(this.getExact()));
            }
            if (this.getSuffix() != null) {
                data.set("suffix", om.valueToTree(this.getSuffix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttp2RouteMatchHostname"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttp2RouteMatchHostname.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttp2RouteMatchHostname.Jsii$Proxy) o;

            if (this.exact != null ? !this.exact.equals(that.exact) : that.exact != null) return false;
            return this.suffix != null ? this.suffix.equals(that.suffix) : that.suffix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exact != null ? this.exact.hashCode() : 0;
            result = 31 * result + (this.suffix != null ? this.suffix.hashCode() : 0);
            return result;
        }
    }
}
