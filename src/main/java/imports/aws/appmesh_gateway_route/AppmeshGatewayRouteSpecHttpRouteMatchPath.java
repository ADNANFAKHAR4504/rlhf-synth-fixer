package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.025Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchPath")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpecHttpRouteMatchPath.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpecHttpRouteMatchPath extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegex() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpecHttpRouteMatchPath}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpecHttpRouteMatchPath}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpecHttpRouteMatchPath> {
        java.lang.String exact;
        java.lang.String regex;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttpRouteMatchPath#getExact}
         * @param exact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#exact AppmeshGatewayRoute#exact}.
         * @return {@code this}
         */
        public Builder exact(java.lang.String exact) {
            this.exact = exact;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpecHttpRouteMatchPath#getRegex}
         * @param regex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#regex AppmeshGatewayRoute#regex}.
         * @return {@code this}
         */
        public Builder regex(java.lang.String regex) {
            this.regex = regex;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpecHttpRouteMatchPath}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpecHttpRouteMatchPath build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpecHttpRouteMatchPath}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpecHttpRouteMatchPath {
        private final java.lang.String exact;
        private final java.lang.String regex;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exact = software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regex = software.amazon.jsii.Kernel.get(this, "regex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exact = builder.exact;
            this.regex = builder.regex;
        }

        @Override
        public final java.lang.String getExact() {
            return this.exact;
        }

        @Override
        public final java.lang.String getRegex() {
            return this.regex;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExact() != null) {
                data.set("exact", om.valueToTree(this.getExact()));
            }
            if (this.getRegex() != null) {
                data.set("regex", om.valueToTree(this.getRegex()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpecHttpRouteMatchPath"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpecHttpRouteMatchPath.Jsii$Proxy that = (AppmeshGatewayRouteSpecHttpRouteMatchPath.Jsii$Proxy) o;

            if (this.exact != null ? !this.exact.equals(that.exact) : that.exact != null) return false;
            return this.regex != null ? this.regex.equals(that.regex) : that.regex == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exact != null ? this.exact.hashCode() : 0;
            result = 31 * result + (this.regex != null ? this.regex.hashCode() : 0);
            return result;
        }
    }
}
