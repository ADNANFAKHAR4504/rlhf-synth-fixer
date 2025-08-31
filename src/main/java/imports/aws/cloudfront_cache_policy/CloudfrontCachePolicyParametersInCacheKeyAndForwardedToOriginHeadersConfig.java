package imports.aws.cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig.Jsii$Proxy.class)
public interface CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#header_behavior CloudfrontCachePolicy#header_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHeaderBehavior() {
        return null;
    }

    /**
     * headers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#headers CloudfrontCachePolicy#headers}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders getHeaders() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig> {
        java.lang.String headerBehavior;
        imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders headers;

        /**
         * Sets the value of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig#getHeaderBehavior}
         * @param headerBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#header_behavior CloudfrontCachePolicy#header_behavior}.
         * @return {@code this}
         */
        public Builder headerBehavior(java.lang.String headerBehavior) {
            this.headerBehavior = headerBehavior;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig#getHeaders}
         * @param headers headers block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#headers CloudfrontCachePolicy#headers}
         * @return {@code this}
         */
        public Builder headers(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders headers) {
            this.headers = headers;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig {
        private final java.lang.String headerBehavior;
        private final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders headers;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.headerBehavior = software.amazon.jsii.Kernel.get(this, "headerBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.headers = software.amazon.jsii.Kernel.get(this, "headers", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.headerBehavior = builder.headerBehavior;
            this.headers = builder.headers;
        }

        @Override
        public final java.lang.String getHeaderBehavior() {
            return this.headerBehavior;
        }

        @Override
        public final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigHeaders getHeaders() {
            return this.headers;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeaderBehavior() != null) {
                data.set("headerBehavior", om.valueToTree(this.getHeaderBehavior()));
            }
            if (this.getHeaders() != null) {
                data.set("headers", om.valueToTree(this.getHeaders()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig.Jsii$Proxy that = (CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig.Jsii$Proxy) o;

            if (this.headerBehavior != null ? !this.headerBehavior.equals(that.headerBehavior) : that.headerBehavior != null) return false;
            return this.headers != null ? this.headers.equals(that.headers) : that.headers == null;
        }

        @Override
        public final int hashCode() {
            int result = this.headerBehavior != null ? this.headerBehavior.hashCode() : 0;
            result = 31 * result + (this.headers != null ? this.headers.hashCode() : 0);
            return result;
        }
    }
}
