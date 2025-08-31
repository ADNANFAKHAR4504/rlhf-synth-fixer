package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionDefaultCacheBehavior")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionDefaultCacheBehavior.Jsii$Proxy.class)
public interface LightsailDistributionDefaultCacheBehavior extends software.amazon.jsii.JsiiSerializable {

    /**
     * The cache behavior of the distribution.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBehavior();

    /**
     * @return a {@link Builder} of {@link LightsailDistributionDefaultCacheBehavior}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionDefaultCacheBehavior}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionDefaultCacheBehavior> {
        java.lang.String behavior;

        /**
         * Sets the value of {@link LightsailDistributionDefaultCacheBehavior#getBehavior}
         * @param behavior The cache behavior of the distribution. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#behavior LightsailDistribution#behavior}
         * @return {@code this}
         */
        public Builder behavior(java.lang.String behavior) {
            this.behavior = behavior;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionDefaultCacheBehavior}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionDefaultCacheBehavior build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionDefaultCacheBehavior}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionDefaultCacheBehavior {
        private final java.lang.String behavior;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.behavior = software.amazon.jsii.Kernel.get(this, "behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.behavior = java.util.Objects.requireNonNull(builder.behavior, "behavior is required");
        }

        @Override
        public final java.lang.String getBehavior() {
            return this.behavior;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("behavior", om.valueToTree(this.getBehavior()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionDefaultCacheBehavior"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionDefaultCacheBehavior.Jsii$Proxy that = (LightsailDistributionDefaultCacheBehavior.Jsii$Proxy) o;

            return this.behavior.equals(that.behavior);
        }

        @Override
        public final int hashCode() {
            int result = this.behavior.hashCode();
            return result;
        }
    }
}
