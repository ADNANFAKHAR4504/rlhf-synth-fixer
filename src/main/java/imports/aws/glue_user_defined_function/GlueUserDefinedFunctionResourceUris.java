package imports.aws.glue_user_defined_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.307Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueUserDefinedFunction.GlueUserDefinedFunctionResourceUris")
@software.amazon.jsii.Jsii.Proxy(GlueUserDefinedFunctionResourceUris.Jsii$Proxy.class)
public interface GlueUserDefinedFunctionResourceUris extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_user_defined_function#resource_type GlueUserDefinedFunction#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_user_defined_function#uri GlueUserDefinedFunction#uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUri();

    /**
     * @return a {@link Builder} of {@link GlueUserDefinedFunctionResourceUris}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueUserDefinedFunctionResourceUris}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueUserDefinedFunctionResourceUris> {
        java.lang.String resourceType;
        java.lang.String uri;

        /**
         * Sets the value of {@link GlueUserDefinedFunctionResourceUris#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_user_defined_function#resource_type GlueUserDefinedFunction#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link GlueUserDefinedFunctionResourceUris#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_user_defined_function#uri GlueUserDefinedFunction#uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueUserDefinedFunctionResourceUris}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueUserDefinedFunctionResourceUris build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueUserDefinedFunctionResourceUris}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueUserDefinedFunctionResourceUris {
        private final java.lang.String resourceType;
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
            this.uri = java.util.Objects.requireNonNull(builder.uri, "uri is required");
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceType", om.valueToTree(this.getResourceType()));
            data.set("uri", om.valueToTree(this.getUri()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueUserDefinedFunction.GlueUserDefinedFunctionResourceUris"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueUserDefinedFunctionResourceUris.Jsii$Proxy that = (GlueUserDefinedFunctionResourceUris.Jsii$Proxy) o;

            if (!resourceType.equals(that.resourceType)) return false;
            return this.uri.equals(that.uri);
        }

        @Override
        public final int hashCode() {
            int result = this.resourceType.hashCode();
            result = 31 * result + (this.uri.hashCode());
            return result;
        }
    }
}
