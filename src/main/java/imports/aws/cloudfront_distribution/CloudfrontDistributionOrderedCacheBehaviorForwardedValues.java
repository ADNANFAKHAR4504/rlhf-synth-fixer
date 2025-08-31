package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValues")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionOrderedCacheBehaviorForwardedValues.Jsii$Proxy.class)
public interface CloudfrontDistributionOrderedCacheBehaviorForwardedValues extends software.amazon.jsii.JsiiSerializable {

    /**
     * cookies block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cookies CloudfrontDistribution#cookies}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies getCookies();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#query_string CloudfrontDistribution#query_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getQueryString();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#headers CloudfrontDistribution#headers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#query_string_cache_keys CloudfrontDistribution#query_string_cache_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getQueryStringCacheKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionOrderedCacheBehaviorForwardedValues> {
        imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies cookies;
        java.lang.Object queryString;
        java.util.List<java.lang.String> headers;
        java.util.List<java.lang.String> queryStringCacheKeys;

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues#getCookies}
         * @param cookies cookies block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#cookies CloudfrontDistribution#cookies}
         * @return {@code this}
         */
        public Builder cookies(imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies cookies) {
            this.cookies = cookies;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues#getQueryString}
         * @param queryString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#query_string CloudfrontDistribution#query_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryString(java.lang.Boolean queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues#getQueryString}
         * @param queryString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#query_string CloudfrontDistribution#query_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryString(com.hashicorp.cdktf.IResolvable queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues#getHeaders}
         * @param headers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#headers CloudfrontDistribution#headers}.
         * @return {@code this}
         */
        public Builder headers(java.util.List<java.lang.String> headers) {
            this.headers = headers;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues#getQueryStringCacheKeys}
         * @param queryStringCacheKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#query_string_cache_keys CloudfrontDistribution#query_string_cache_keys}.
         * @return {@code this}
         */
        public Builder queryStringCacheKeys(java.util.List<java.lang.String> queryStringCacheKeys) {
            this.queryStringCacheKeys = queryStringCacheKeys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionOrderedCacheBehaviorForwardedValues build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionOrderedCacheBehaviorForwardedValues}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionOrderedCacheBehaviorForwardedValues {
        private final imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies cookies;
        private final java.lang.Object queryString;
        private final java.util.List<java.lang.String> headers;
        private final java.util.List<java.lang.String> queryStringCacheKeys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cookies = software.amazon.jsii.Kernel.get(this, "cookies", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies.class));
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.headers = software.amazon.jsii.Kernel.get(this, "headers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.queryStringCacheKeys = software.amazon.jsii.Kernel.get(this, "queryStringCacheKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cookies = java.util.Objects.requireNonNull(builder.cookies, "cookies is required");
            this.queryString = java.util.Objects.requireNonNull(builder.queryString, "queryString is required");
            this.headers = builder.headers;
            this.queryStringCacheKeys = builder.queryStringCacheKeys;
        }

        @Override
        public final imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValuesCookies getCookies() {
            return this.cookies;
        }

        @Override
        public final java.lang.Object getQueryString() {
            return this.queryString;
        }

        @Override
        public final java.util.List<java.lang.String> getHeaders() {
            return this.headers;
        }

        @Override
        public final java.util.List<java.lang.String> getQueryStringCacheKeys() {
            return this.queryStringCacheKeys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cookies", om.valueToTree(this.getCookies()));
            data.set("queryString", om.valueToTree(this.getQueryString()));
            if (this.getHeaders() != null) {
                data.set("headers", om.valueToTree(this.getHeaders()));
            }
            if (this.getQueryStringCacheKeys() != null) {
                data.set("queryStringCacheKeys", om.valueToTree(this.getQueryStringCacheKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionOrderedCacheBehaviorForwardedValues"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionOrderedCacheBehaviorForwardedValues.Jsii$Proxy that = (CloudfrontDistributionOrderedCacheBehaviorForwardedValues.Jsii$Proxy) o;

            if (!cookies.equals(that.cookies)) return false;
            if (!queryString.equals(that.queryString)) return false;
            if (this.headers != null ? !this.headers.equals(that.headers) : that.headers != null) return false;
            return this.queryStringCacheKeys != null ? this.queryStringCacheKeys.equals(that.queryStringCacheKeys) : that.queryStringCacheKeys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cookies.hashCode();
            result = 31 * result + (this.queryString.hashCode());
            result = 31 * result + (this.headers != null ? this.headers.hashCode() : 0);
            result = 31 * result + (this.queryStringCacheKeys != null ? this.queryStringCacheKeys.hashCode() : 0);
            return result;
        }
    }
}
