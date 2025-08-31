package imports.aws.cloudfront_origin_request_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontOriginRequestPolicy.CloudfrontOriginRequestPolicyQueryStringsConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontOriginRequestPolicyQueryStringsConfig.Jsii$Proxy.class)
public interface CloudfrontOriginRequestPolicyQueryStringsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#query_string_behavior CloudfrontOriginRequestPolicy#query_string_behavior}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueryStringBehavior();

    /**
     * query_strings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#query_strings CloudfrontOriginRequestPolicy#query_strings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings getQueryStrings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontOriginRequestPolicyQueryStringsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontOriginRequestPolicyQueryStringsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontOriginRequestPolicyQueryStringsConfig> {
        java.lang.String queryStringBehavior;
        imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings queryStrings;

        /**
         * Sets the value of {@link CloudfrontOriginRequestPolicyQueryStringsConfig#getQueryStringBehavior}
         * @param queryStringBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#query_string_behavior CloudfrontOriginRequestPolicy#query_string_behavior}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryStringBehavior(java.lang.String queryStringBehavior) {
            this.queryStringBehavior = queryStringBehavior;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontOriginRequestPolicyQueryStringsConfig#getQueryStrings}
         * @param queryStrings query_strings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#query_strings CloudfrontOriginRequestPolicy#query_strings}
         * @return {@code this}
         */
        public Builder queryStrings(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings queryStrings) {
            this.queryStrings = queryStrings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontOriginRequestPolicyQueryStringsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontOriginRequestPolicyQueryStringsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontOriginRequestPolicyQueryStringsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontOriginRequestPolicyQueryStringsConfig {
        private final java.lang.String queryStringBehavior;
        private final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings queryStrings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.queryStringBehavior = software.amazon.jsii.Kernel.get(this, "queryStringBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryStrings = software.amazon.jsii.Kernel.get(this, "queryStrings", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.queryStringBehavior = java.util.Objects.requireNonNull(builder.queryStringBehavior, "queryStringBehavior is required");
            this.queryStrings = builder.queryStrings;
        }

        @Override
        public final java.lang.String getQueryStringBehavior() {
            return this.queryStringBehavior;
        }

        @Override
        public final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigQueryStrings getQueryStrings() {
            return this.queryStrings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("queryStringBehavior", om.valueToTree(this.getQueryStringBehavior()));
            if (this.getQueryStrings() != null) {
                data.set("queryStrings", om.valueToTree(this.getQueryStrings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontOriginRequestPolicy.CloudfrontOriginRequestPolicyQueryStringsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontOriginRequestPolicyQueryStringsConfig.Jsii$Proxy that = (CloudfrontOriginRequestPolicyQueryStringsConfig.Jsii$Proxy) o;

            if (!queryStringBehavior.equals(that.queryStringBehavior)) return false;
            return this.queryStrings != null ? this.queryStrings.equals(that.queryStrings) : that.queryStrings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.queryStringBehavior.hashCode();
            result = 31 * result + (this.queryStrings != null ? this.queryStrings.hashCode() : 0);
            return result;
        }
    }
}
