package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.826Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehavior")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionCacheBehavior.Jsii$Proxy.class)
public interface LightsailDistributionCacheBehavior extends software.amazon.jsii.JsiiSerializable {

    /**
     * The cache behavior for the specified path.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBehavior();

    /**
     * The path to a directory or file to cached, or not cache.
     * <p>
     * Use an asterisk symbol to specify wildcard directories (path/to/assets/*), and file types (*.html, *jpg, *js). Directories and file paths are case-sensitive.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#path LightsailDistribution#path}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPath();

    /**
     * @return a {@link Builder} of {@link LightsailDistributionCacheBehavior}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionCacheBehavior}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionCacheBehavior> {
        java.lang.String behavior;
        java.lang.String path;

        /**
         * Sets the value of {@link LightsailDistributionCacheBehavior#getBehavior}
         * @param behavior The cache behavior for the specified path. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
         * @return {@code this}
         */
        public Builder behavior(java.lang.String behavior) {
            this.behavior = behavior;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehavior#getPath}
         * @param path The path to a directory or file to cached, or not cache. This parameter is required.
         *             Use an asterisk symbol to specify wildcard directories (path/to/assets/*), and file types (*.html, *jpg, *js). Directories and file paths are case-sensitive.
         *             
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#path LightsailDistribution#path}
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionCacheBehavior}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionCacheBehavior build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionCacheBehavior}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionCacheBehavior {
        private final java.lang.String behavior;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.behavior = software.amazon.jsii.Kernel.get(this, "behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.behavior = java.util.Objects.requireNonNull(builder.behavior, "behavior is required");
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
        }

        @Override
        public final java.lang.String getBehavior() {
            return this.behavior;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("behavior", om.valueToTree(this.getBehavior()));
            data.set("path", om.valueToTree(this.getPath()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionCacheBehavior"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionCacheBehavior.Jsii$Proxy that = (LightsailDistributionCacheBehavior.Jsii$Proxy) o;

            if (!behavior.equals(that.behavior)) return false;
            return this.path.equals(that.path);
        }

        @Override
        public final int hashCode() {
            int result = this.behavior.hashCode();
            result = 31 * result + (this.path.hashCode());
            return result;
        }
    }
}
