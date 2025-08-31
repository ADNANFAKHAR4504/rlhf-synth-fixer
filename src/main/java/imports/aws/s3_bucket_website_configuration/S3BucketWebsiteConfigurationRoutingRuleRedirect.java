package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRuleRedirect")
@software.amazon.jsii.Jsii.Proxy(S3BucketWebsiteConfigurationRoutingRuleRedirect.Jsii$Proxy.class)
public interface S3BucketWebsiteConfigurationRoutingRuleRedirect extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#host_name S3BucketWebsiteConfiguration#host_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#http_redirect_code S3BucketWebsiteConfiguration#http_redirect_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpRedirectCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#protocol S3BucketWebsiteConfiguration#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#replace_key_prefix_with S3BucketWebsiteConfiguration#replace_key_prefix_with}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplaceKeyPrefixWith() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#replace_key_with S3BucketWebsiteConfiguration#replace_key_with}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplaceKeyWith() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketWebsiteConfigurationRoutingRuleRedirect}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketWebsiteConfigurationRoutingRuleRedirect> {
        java.lang.String hostName;
        java.lang.String httpRedirectCode;
        java.lang.String protocol;
        java.lang.String replaceKeyPrefixWith;
        java.lang.String replaceKeyWith;

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect#getHostName}
         * @param hostName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#host_name S3BucketWebsiteConfiguration#host_name}.
         * @return {@code this}
         */
        public Builder hostName(java.lang.String hostName) {
            this.hostName = hostName;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect#getHttpRedirectCode}
         * @param httpRedirectCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#http_redirect_code S3BucketWebsiteConfiguration#http_redirect_code}.
         * @return {@code this}
         */
        public Builder httpRedirectCode(java.lang.String httpRedirectCode) {
            this.httpRedirectCode = httpRedirectCode;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#protocol S3BucketWebsiteConfiguration#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect#getReplaceKeyPrefixWith}
         * @param replaceKeyPrefixWith Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#replace_key_prefix_with S3BucketWebsiteConfiguration#replace_key_prefix_with}.
         * @return {@code this}
         */
        public Builder replaceKeyPrefixWith(java.lang.String replaceKeyPrefixWith) {
            this.replaceKeyPrefixWith = replaceKeyPrefixWith;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect#getReplaceKeyWith}
         * @param replaceKeyWith Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_website_configuration#replace_key_with S3BucketWebsiteConfiguration#replace_key_with}.
         * @return {@code this}
         */
        public Builder replaceKeyWith(java.lang.String replaceKeyWith) {
            this.replaceKeyWith = replaceKeyWith;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketWebsiteConfigurationRoutingRuleRedirect}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketWebsiteConfigurationRoutingRuleRedirect build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketWebsiteConfigurationRoutingRuleRedirect}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketWebsiteConfigurationRoutingRuleRedirect {
        private final java.lang.String hostName;
        private final java.lang.String httpRedirectCode;
        private final java.lang.String protocol;
        private final java.lang.String replaceKeyPrefixWith;
        private final java.lang.String replaceKeyWith;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hostName = software.amazon.jsii.Kernel.get(this, "hostName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpRedirectCode = software.amazon.jsii.Kernel.get(this, "httpRedirectCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replaceKeyPrefixWith = software.amazon.jsii.Kernel.get(this, "replaceKeyPrefixWith", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replaceKeyWith = software.amazon.jsii.Kernel.get(this, "replaceKeyWith", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hostName = builder.hostName;
            this.httpRedirectCode = builder.httpRedirectCode;
            this.protocol = builder.protocol;
            this.replaceKeyPrefixWith = builder.replaceKeyPrefixWith;
            this.replaceKeyWith = builder.replaceKeyWith;
        }

        @Override
        public final java.lang.String getHostName() {
            return this.hostName;
        }

        @Override
        public final java.lang.String getHttpRedirectCode() {
            return this.httpRedirectCode;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getReplaceKeyPrefixWith() {
            return this.replaceKeyPrefixWith;
        }

        @Override
        public final java.lang.String getReplaceKeyWith() {
            return this.replaceKeyWith;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHostName() != null) {
                data.set("hostName", om.valueToTree(this.getHostName()));
            }
            if (this.getHttpRedirectCode() != null) {
                data.set("httpRedirectCode", om.valueToTree(this.getHttpRedirectCode()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getReplaceKeyPrefixWith() != null) {
                data.set("replaceKeyPrefixWith", om.valueToTree(this.getReplaceKeyPrefixWith()));
            }
            if (this.getReplaceKeyWith() != null) {
                data.set("replaceKeyWith", om.valueToTree(this.getReplaceKeyWith()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRuleRedirect"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketWebsiteConfigurationRoutingRuleRedirect.Jsii$Proxy that = (S3BucketWebsiteConfigurationRoutingRuleRedirect.Jsii$Proxy) o;

            if (this.hostName != null ? !this.hostName.equals(that.hostName) : that.hostName != null) return false;
            if (this.httpRedirectCode != null ? !this.httpRedirectCode.equals(that.httpRedirectCode) : that.httpRedirectCode != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.replaceKeyPrefixWith != null ? !this.replaceKeyPrefixWith.equals(that.replaceKeyPrefixWith) : that.replaceKeyPrefixWith != null) return false;
            return this.replaceKeyWith != null ? this.replaceKeyWith.equals(that.replaceKeyWith) : that.replaceKeyWith == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hostName != null ? this.hostName.hashCode() : 0;
            result = 31 * result + (this.httpRedirectCode != null ? this.httpRedirectCode.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.replaceKeyPrefixWith != null ? this.replaceKeyPrefixWith.hashCode() : 0);
            result = 31 * result + (this.replaceKeyWith != null ? this.replaceKeyWith.hashCode() : 0);
            return result;
        }
    }
}
