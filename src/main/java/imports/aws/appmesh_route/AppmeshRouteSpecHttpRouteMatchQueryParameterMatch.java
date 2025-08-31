package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecHttpRouteMatchQueryParameterMatch")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecHttpRouteMatchQueryParameterMatch.Jsii$Proxy.class)
public interface AppmeshRouteSpecHttpRouteMatchQueryParameterMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#exact AppmeshRoute#exact}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExact() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecHttpRouteMatchQueryParameterMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecHttpRouteMatchQueryParameterMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecHttpRouteMatchQueryParameterMatch> {
        java.lang.String exact;

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteMatchQueryParameterMatch#getExact}
         * @param exact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#exact AppmeshRoute#exact}.
         * @return {@code this}
         */
        public Builder exact(java.lang.String exact) {
            this.exact = exact;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecHttpRouteMatchQueryParameterMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecHttpRouteMatchQueryParameterMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecHttpRouteMatchQueryParameterMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecHttpRouteMatchQueryParameterMatch {
        private final java.lang.String exact;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exact = software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exact = builder.exact;
        }

        @Override
        public final java.lang.String getExact() {
            return this.exact;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExact() != null) {
                data.set("exact", om.valueToTree(this.getExact()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecHttpRouteMatchQueryParameterMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecHttpRouteMatchQueryParameterMatch.Jsii$Proxy that = (AppmeshRouteSpecHttpRouteMatchQueryParameterMatch.Jsii$Proxy) o;

            return this.exact != null ? this.exact.equals(that.exact) : that.exact == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exact != null ? this.exact.hashCode() : 0;
            return result;
        }
    }
}
