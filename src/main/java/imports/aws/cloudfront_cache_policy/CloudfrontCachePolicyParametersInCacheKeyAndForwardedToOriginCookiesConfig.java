package imports.aws.cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig.Jsii$Proxy.class)
public interface CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#cookie_behavior CloudfrontCachePolicy#cookie_behavior}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCookieBehavior();

    /**
     * cookies block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#cookies CloudfrontCachePolicy#cookies}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies getCookies() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig> {
        java.lang.String cookieBehavior;
        imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies cookies;

        /**
         * Sets the value of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig#getCookieBehavior}
         * @param cookieBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#cookie_behavior CloudfrontCachePolicy#cookie_behavior}. This parameter is required.
         * @return {@code this}
         */
        public Builder cookieBehavior(java.lang.String cookieBehavior) {
            this.cookieBehavior = cookieBehavior;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig#getCookies}
         * @param cookies cookies block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#cookies CloudfrontCachePolicy#cookies}
         * @return {@code this}
         */
        public Builder cookies(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies cookies) {
            this.cookies = cookies;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig {
        private final java.lang.String cookieBehavior;
        private final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies cookies;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cookieBehavior = software.amazon.jsii.Kernel.get(this, "cookieBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cookies = software.amazon.jsii.Kernel.get(this, "cookies", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cookieBehavior = java.util.Objects.requireNonNull(builder.cookieBehavior, "cookieBehavior is required");
            this.cookies = builder.cookies;
        }

        @Override
        public final java.lang.String getCookieBehavior() {
            return this.cookieBehavior;
        }

        @Override
        public final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies getCookies() {
            return this.cookies;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cookieBehavior", om.valueToTree(this.getCookieBehavior()));
            if (this.getCookies() != null) {
                data.set("cookies", om.valueToTree(this.getCookies()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig.Jsii$Proxy that = (CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig.Jsii$Proxy) o;

            if (!cookieBehavior.equals(that.cookieBehavior)) return false;
            return this.cookies != null ? this.cookies.equals(that.cookies) : that.cookies == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cookieBehavior.hashCode();
            result = 31 * result + (this.cookies != null ? this.cookies.hashCode() : 0);
            return result;
        }
    }
}
