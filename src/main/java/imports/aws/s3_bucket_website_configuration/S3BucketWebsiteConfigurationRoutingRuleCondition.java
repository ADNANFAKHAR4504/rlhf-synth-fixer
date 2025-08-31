package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRuleCondition")
@software.amazon.jsii.Jsii.Proxy(S3BucketWebsiteConfigurationRoutingRuleCondition.Jsii$Proxy.class)
public interface S3BucketWebsiteConfigurationRoutingRuleCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#http_error_code_returned_equals S3BucketWebsiteConfiguration#http_error_code_returned_equals}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpErrorCodeReturnedEquals() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#key_prefix_equals S3BucketWebsiteConfiguration#key_prefix_equals}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefixEquals() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketWebsiteConfigurationRoutingRuleCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketWebsiteConfigurationRoutingRuleCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketWebsiteConfigurationRoutingRuleCondition> {
        java.lang.String httpErrorCodeReturnedEquals;
        java.lang.String keyPrefixEquals;

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleCondition#getHttpErrorCodeReturnedEquals}
         * @param httpErrorCodeReturnedEquals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#http_error_code_returned_equals S3BucketWebsiteConfiguration#http_error_code_returned_equals}.
         * @return {@code this}
         */
        public Builder httpErrorCodeReturnedEquals(java.lang.String httpErrorCodeReturnedEquals) {
            this.httpErrorCodeReturnedEquals = httpErrorCodeReturnedEquals;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleCondition#getKeyPrefixEquals}
         * @param keyPrefixEquals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#key_prefix_equals S3BucketWebsiteConfiguration#key_prefix_equals}.
         * @return {@code this}
         */
        public Builder keyPrefixEquals(java.lang.String keyPrefixEquals) {
            this.keyPrefixEquals = keyPrefixEquals;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketWebsiteConfigurationRoutingRuleCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketWebsiteConfigurationRoutingRuleCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketWebsiteConfigurationRoutingRuleCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketWebsiteConfigurationRoutingRuleCondition {
        private final java.lang.String httpErrorCodeReturnedEquals;
        private final java.lang.String keyPrefixEquals;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpErrorCodeReturnedEquals = software.amazon.jsii.Kernel.get(this, "httpErrorCodeReturnedEquals", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefixEquals = software.amazon.jsii.Kernel.get(this, "keyPrefixEquals", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpErrorCodeReturnedEquals = builder.httpErrorCodeReturnedEquals;
            this.keyPrefixEquals = builder.keyPrefixEquals;
        }

        @Override
        public final java.lang.String getHttpErrorCodeReturnedEquals() {
            return this.httpErrorCodeReturnedEquals;
        }

        @Override
        public final java.lang.String getKeyPrefixEquals() {
            return this.keyPrefixEquals;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHttpErrorCodeReturnedEquals() != null) {
                data.set("httpErrorCodeReturnedEquals", om.valueToTree(this.getHttpErrorCodeReturnedEquals()));
            }
            if (this.getKeyPrefixEquals() != null) {
                data.set("keyPrefixEquals", om.valueToTree(this.getKeyPrefixEquals()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRuleCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketWebsiteConfigurationRoutingRuleCondition.Jsii$Proxy that = (S3BucketWebsiteConfigurationRoutingRuleCondition.Jsii$Proxy) o;

            if (this.httpErrorCodeReturnedEquals != null ? !this.httpErrorCodeReturnedEquals.equals(that.httpErrorCodeReturnedEquals) : that.httpErrorCodeReturnedEquals != null) return false;
            return this.keyPrefixEquals != null ? this.keyPrefixEquals.equals(that.keyPrefixEquals) : that.keyPrefixEquals == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpErrorCodeReturnedEquals != null ? this.httpErrorCodeReturnedEquals.hashCode() : 0;
            result = 31 * result + (this.keyPrefixEquals != null ? this.keyPrefixEquals.hashCode() : 0);
            return result;
        }
    }
}
