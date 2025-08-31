package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicySecurityHeadersConfig.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicySecurityHeadersConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * content_security_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_security_policy CloudfrontResponseHeadersPolicy#content_security_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy getContentSecurityPolicy() {
        return null;
    }

    /**
     * content_type_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_type_options CloudfrontResponseHeadersPolicy#content_type_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions getContentTypeOptions() {
        return null;
    }

    /**
     * frame_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#frame_options CloudfrontResponseHeadersPolicy#frame_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions getFrameOptions() {
        return null;
    }

    /**
     * referrer_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#referrer_policy CloudfrontResponseHeadersPolicy#referrer_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy getReferrerPolicy() {
        return null;
    }

    /**
     * strict_transport_security block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#strict_transport_security CloudfrontResponseHeadersPolicy#strict_transport_security}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity getStrictTransportSecurity() {
        return null;
    }

    /**
     * xss_protection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#xss_protection CloudfrontResponseHeadersPolicy#xss_protection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection getXssProtection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicySecurityHeadersConfig> {
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy contentSecurityPolicy;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions contentTypeOptions;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions frameOptions;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy referrerPolicy;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity strictTransportSecurity;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection xssProtection;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getContentSecurityPolicy}
         * @param contentSecurityPolicy content_security_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_security_policy CloudfrontResponseHeadersPolicy#content_security_policy}
         * @return {@code this}
         */
        public Builder contentSecurityPolicy(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy contentSecurityPolicy) {
            this.contentSecurityPolicy = contentSecurityPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getContentTypeOptions}
         * @param contentTypeOptions content_type_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_type_options CloudfrontResponseHeadersPolicy#content_type_options}
         * @return {@code this}
         */
        public Builder contentTypeOptions(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions contentTypeOptions) {
            this.contentTypeOptions = contentTypeOptions;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getFrameOptions}
         * @param frameOptions frame_options block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#frame_options CloudfrontResponseHeadersPolicy#frame_options}
         * @return {@code this}
         */
        public Builder frameOptions(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions frameOptions) {
            this.frameOptions = frameOptions;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getReferrerPolicy}
         * @param referrerPolicy referrer_policy block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#referrer_policy CloudfrontResponseHeadersPolicy#referrer_policy}
         * @return {@code this}
         */
        public Builder referrerPolicy(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy referrerPolicy) {
            this.referrerPolicy = referrerPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getStrictTransportSecurity}
         * @param strictTransportSecurity strict_transport_security block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#strict_transport_security CloudfrontResponseHeadersPolicy#strict_transport_security}
         * @return {@code this}
         */
        public Builder strictTransportSecurity(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity strictTransportSecurity) {
            this.strictTransportSecurity = strictTransportSecurity;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig#getXssProtection}
         * @param xssProtection xss_protection block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#xss_protection CloudfrontResponseHeadersPolicy#xss_protection}
         * @return {@code this}
         */
        public Builder xssProtection(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection xssProtection) {
            this.xssProtection = xssProtection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicySecurityHeadersConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicySecurityHeadersConfig {
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy contentSecurityPolicy;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions contentTypeOptions;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions frameOptions;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy referrerPolicy;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity strictTransportSecurity;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection xssProtection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentSecurityPolicy = software.amazon.jsii.Kernel.get(this, "contentSecurityPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.class));
            this.contentTypeOptions = software.amazon.jsii.Kernel.get(this, "contentTypeOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions.class));
            this.frameOptions = software.amazon.jsii.Kernel.get(this, "frameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions.class));
            this.referrerPolicy = software.amazon.jsii.Kernel.get(this, "referrerPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy.class));
            this.strictTransportSecurity = software.amazon.jsii.Kernel.get(this, "strictTransportSecurity", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.class));
            this.xssProtection = software.amazon.jsii.Kernel.get(this, "xssProtection", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentSecurityPolicy = builder.contentSecurityPolicy;
            this.contentTypeOptions = builder.contentTypeOptions;
            this.frameOptions = builder.frameOptions;
            this.referrerPolicy = builder.referrerPolicy;
            this.strictTransportSecurity = builder.strictTransportSecurity;
            this.xssProtection = builder.xssProtection;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy getContentSecurityPolicy() {
            return this.contentSecurityPolicy;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions getContentTypeOptions() {
            return this.contentTypeOptions;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions getFrameOptions() {
            return this.frameOptions;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy getReferrerPolicy() {
            return this.referrerPolicy;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity getStrictTransportSecurity() {
            return this.strictTransportSecurity;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection getXssProtection() {
            return this.xssProtection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContentSecurityPolicy() != null) {
                data.set("contentSecurityPolicy", om.valueToTree(this.getContentSecurityPolicy()));
            }
            if (this.getContentTypeOptions() != null) {
                data.set("contentTypeOptions", om.valueToTree(this.getContentTypeOptions()));
            }
            if (this.getFrameOptions() != null) {
                data.set("frameOptions", om.valueToTree(this.getFrameOptions()));
            }
            if (this.getReferrerPolicy() != null) {
                data.set("referrerPolicy", om.valueToTree(this.getReferrerPolicy()));
            }
            if (this.getStrictTransportSecurity() != null) {
                data.set("strictTransportSecurity", om.valueToTree(this.getStrictTransportSecurity()));
            }
            if (this.getXssProtection() != null) {
                data.set("xssProtection", om.valueToTree(this.getXssProtection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicySecurityHeadersConfig.Jsii$Proxy that = (CloudfrontResponseHeadersPolicySecurityHeadersConfig.Jsii$Proxy) o;

            if (this.contentSecurityPolicy != null ? !this.contentSecurityPolicy.equals(that.contentSecurityPolicy) : that.contentSecurityPolicy != null) return false;
            if (this.contentTypeOptions != null ? !this.contentTypeOptions.equals(that.contentTypeOptions) : that.contentTypeOptions != null) return false;
            if (this.frameOptions != null ? !this.frameOptions.equals(that.frameOptions) : that.frameOptions != null) return false;
            if (this.referrerPolicy != null ? !this.referrerPolicy.equals(that.referrerPolicy) : that.referrerPolicy != null) return false;
            if (this.strictTransportSecurity != null ? !this.strictTransportSecurity.equals(that.strictTransportSecurity) : that.strictTransportSecurity != null) return false;
            return this.xssProtection != null ? this.xssProtection.equals(that.xssProtection) : that.xssProtection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.contentSecurityPolicy != null ? this.contentSecurityPolicy.hashCode() : 0;
            result = 31 * result + (this.contentTypeOptions != null ? this.contentTypeOptions.hashCode() : 0);
            result = 31 * result + (this.frameOptions != null ? this.frameOptions.hashCode() : 0);
            result = 31 * result + (this.referrerPolicy != null ? this.referrerPolicy.hashCode() : 0);
            result = 31 * result + (this.strictTransportSecurity != null ? this.strictTransportSecurity.hashCode() : 0);
            result = 31 * result + (this.xssProtection != null ? this.xssProtection.hashCode() : 0);
            return result;
        }
    }
}
