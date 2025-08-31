package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies.Jsii$Proxy.class)
public interface CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#forward CloudfrontDistribution#forward}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getForward();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#whitelisted_names CloudfrontDistribution#whitelisted_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getWhitelistedNames() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies> {
        java.lang.String forward;
        java.util.List<java.lang.String> whitelistedNames;

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies#getForward}
         * @param forward Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#forward CloudfrontDistribution#forward}. This parameter is required.
         * @return {@code this}
         */
        public Builder forward(java.lang.String forward) {
            this.forward = forward;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies#getWhitelistedNames}
         * @param whitelistedNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#whitelisted_names CloudfrontDistribution#whitelisted_names}.
         * @return {@code this}
         */
        public Builder whitelistedNames(java.util.List<java.lang.String> whitelistedNames) {
            this.whitelistedNames = whitelistedNames;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies {
        private final java.lang.String forward;
        private final java.util.List<java.lang.String> whitelistedNames;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.forward = software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.whitelistedNames = software.amazon.jsii.Kernel.get(this, "whitelistedNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.forward = java.util.Objects.requireNonNull(builder.forward, "forward is required");
            this.whitelistedNames = builder.whitelistedNames;
        }

        @Override
        public final java.lang.String getForward() {
            return this.forward;
        }

        @Override
        public final java.util.List<java.lang.String> getWhitelistedNames() {
            return this.whitelistedNames;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("forward", om.valueToTree(this.getForward()));
            if (this.getWhitelistedNames() != null) {
                data.set("whitelistedNames", om.valueToTree(this.getWhitelistedNames()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies.Jsii$Proxy that = (CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies.Jsii$Proxy) o;

            if (!forward.equals(that.forward)) return false;
            return this.whitelistedNames != null ? this.whitelistedNames.equals(that.whitelistedNames) : that.whitelistedNames == null;
        }

        @Override
        public final int hashCode() {
            int result = this.forward.hashCode();
            result = 31 * result + (this.whitelistedNames != null ? this.whitelistedNames.hashCode() : 0);
            return result;
        }
    }
}
