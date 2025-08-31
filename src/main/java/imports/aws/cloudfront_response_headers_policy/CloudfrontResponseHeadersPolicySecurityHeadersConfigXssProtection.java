package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOverride();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#protection CloudfrontResponseHeadersPolicy#protection}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getProtection();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#mode_block CloudfrontResponseHeadersPolicy#mode_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getModeBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#report_uri CloudfrontResponseHeadersPolicy#report_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReportUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection> {
        java.lang.Object override;
        java.lang.Object protection;
        java.lang.Object modeBlock;
        java.lang.String reportUri;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(java.lang.Boolean override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getProtection}
         * @param protection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#protection CloudfrontResponseHeadersPolicy#protection}. This parameter is required.
         * @return {@code this}
         */
        public Builder protection(java.lang.Boolean protection) {
            this.protection = protection;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getProtection}
         * @param protection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#protection CloudfrontResponseHeadersPolicy#protection}. This parameter is required.
         * @return {@code this}
         */
        public Builder protection(com.hashicorp.cdktf.IResolvable protection) {
            this.protection = protection;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getModeBlock}
         * @param modeBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#mode_block CloudfrontResponseHeadersPolicy#mode_block}.
         * @return {@code this}
         */
        public Builder modeBlock(java.lang.Boolean modeBlock) {
            this.modeBlock = modeBlock;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getModeBlock}
         * @param modeBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#mode_block CloudfrontResponseHeadersPolicy#mode_block}.
         * @return {@code this}
         */
        public Builder modeBlock(com.hashicorp.cdktf.IResolvable modeBlock) {
            this.modeBlock = modeBlock;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection#getReportUri}
         * @param reportUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#report_uri CloudfrontResponseHeadersPolicy#report_uri}.
         * @return {@code this}
         */
        public Builder reportUri(java.lang.String reportUri) {
            this.reportUri = reportUri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection {
        private final java.lang.Object override;
        private final java.lang.Object protection;
        private final java.lang.Object modeBlock;
        private final java.lang.String reportUri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.protection = software.amazon.jsii.Kernel.get(this, "protection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.modeBlock = software.amazon.jsii.Kernel.get(this, "modeBlock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.reportUri = software.amazon.jsii.Kernel.get(this, "reportUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.override = java.util.Objects.requireNonNull(builder.override, "override is required");
            this.protection = java.util.Objects.requireNonNull(builder.protection, "protection is required");
            this.modeBlock = builder.modeBlock;
            this.reportUri = builder.reportUri;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        public final java.lang.Object getProtection() {
            return this.protection;
        }

        @Override
        public final java.lang.Object getModeBlock() {
            return this.modeBlock;
        }

        @Override
        public final java.lang.String getReportUri() {
            return this.reportUri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("override", om.valueToTree(this.getOverride()));
            data.set("protection", om.valueToTree(this.getProtection()));
            if (this.getModeBlock() != null) {
                data.set("modeBlock", om.valueToTree(this.getModeBlock()));
            }
            if (this.getReportUri() != null) {
                data.set("reportUri", om.valueToTree(this.getReportUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.Jsii$Proxy that = (CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.Jsii$Proxy) o;

            if (!override.equals(that.override)) return false;
            if (!protection.equals(that.protection)) return false;
            if (this.modeBlock != null ? !this.modeBlock.equals(that.modeBlock) : that.modeBlock != null) return false;
            return this.reportUri != null ? this.reportUri.equals(that.reportUri) : that.reportUri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.override.hashCode();
            result = 31 * result + (this.protection.hashCode());
            result = 31 * result + (this.modeBlock != null ? this.modeBlock.hashCode() : 0);
            result = 31 * result + (this.reportUri != null ? this.reportUri.hashCode() : 0);
            return result;
        }
    }
}
