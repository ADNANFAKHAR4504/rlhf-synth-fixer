package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverPipelineConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncResolverPipelineConfig.Jsii$Proxy.class)
public interface AppsyncResolverPipelineConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#functions AppsyncResolver#functions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFunctions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncResolverPipelineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncResolverPipelineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncResolverPipelineConfig> {
        java.util.List<java.lang.String> functions;

        /**
         * Sets the value of {@link AppsyncResolverPipelineConfig#getFunctions}
         * @param functions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#functions AppsyncResolver#functions}.
         * @return {@code this}
         */
        public Builder functions(java.util.List<java.lang.String> functions) {
            this.functions = functions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncResolverPipelineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncResolverPipelineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncResolverPipelineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncResolverPipelineConfig {
        private final java.util.List<java.lang.String> functions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.functions = software.amazon.jsii.Kernel.get(this, "functions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.functions = builder.functions;
        }

        @Override
        public final java.util.List<java.lang.String> getFunctions() {
            return this.functions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFunctions() != null) {
                data.set("functions", om.valueToTree(this.getFunctions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncResolver.AppsyncResolverPipelineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncResolverPipelineConfig.Jsii$Proxy that = (AppsyncResolverPipelineConfig.Jsii$Proxy) o;

            return this.functions != null ? this.functions.equals(that.functions) : that.functions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.functions != null ? this.functions.hashCode() : 0;
            return result;
        }
    }
}
