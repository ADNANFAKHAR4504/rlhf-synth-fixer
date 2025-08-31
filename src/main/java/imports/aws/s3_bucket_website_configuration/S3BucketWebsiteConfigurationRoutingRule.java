package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketWebsiteConfigurationRoutingRule.Jsii$Proxy.class)
public interface S3BucketWebsiteConfigurationRoutingRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * redirect block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#redirect S3BucketWebsiteConfiguration#redirect}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect getRedirect();

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#condition S3BucketWebsiteConfiguration#condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition getCondition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketWebsiteConfigurationRoutingRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketWebsiteConfigurationRoutingRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketWebsiteConfigurationRoutingRule> {
        imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect redirect;
        imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition condition;

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRule#getRedirect}
         * @param redirect redirect block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#redirect S3BucketWebsiteConfiguration#redirect}
         * @return {@code this}
         */
        public Builder redirect(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect redirect) {
            this.redirect = redirect;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRule#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#condition S3BucketWebsiteConfiguration#condition}
         * @return {@code this}
         */
        public Builder condition(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketWebsiteConfigurationRoutingRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketWebsiteConfigurationRoutingRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketWebsiteConfigurationRoutingRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketWebsiteConfigurationRoutingRule {
        private final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect redirect;
        private final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition condition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.redirect = software.amazon.jsii.Kernel.get(this, "redirect", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect.class));
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.redirect = java.util.Objects.requireNonNull(builder.redirect, "redirect is required");
            this.condition = builder.condition;
        }

        @Override
        public final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect getRedirect() {
            return this.redirect;
        }

        @Override
        public final imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleCondition getCondition() {
            return this.condition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("redirect", om.valueToTree(this.getRedirect()));
            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketWebsiteConfigurationRoutingRule.Jsii$Proxy that = (S3BucketWebsiteConfigurationRoutingRule.Jsii$Proxy) o;

            if (!redirect.equals(that.redirect)) return false;
            return this.condition != null ? this.condition.equals(that.condition) : that.condition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.redirect.hashCode();
            result = 31 * result + (this.condition != null ? this.condition.hashCode() : 0);
            return result;
        }
    }
}
