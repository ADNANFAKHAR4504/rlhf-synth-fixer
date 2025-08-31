package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_max_age_sec CloudfrontResponseHeadersPolicy#access_control_max_age_sec}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getAccessControlMaxAgeSec();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOverride();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#include_subdomains CloudfrontResponseHeadersPolicy#include_subdomains}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSubdomains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#preload CloudfrontResponseHeadersPolicy#preload}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreload() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity> {
        java.lang.Number accessControlMaxAgeSec;
        java.lang.Object override;
        java.lang.Object includeSubdomains;
        java.lang.Object preload;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getAccessControlMaxAgeSec}
         * @param accessControlMaxAgeSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_max_age_sec CloudfrontResponseHeadersPolicy#access_control_max_age_sec}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessControlMaxAgeSec(java.lang.Number accessControlMaxAgeSec) {
            this.accessControlMaxAgeSec = accessControlMaxAgeSec;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(java.lang.Boolean override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getIncludeSubdomains}
         * @param includeSubdomains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#include_subdomains CloudfrontResponseHeadersPolicy#include_subdomains}.
         * @return {@code this}
         */
        public Builder includeSubdomains(java.lang.Boolean includeSubdomains) {
            this.includeSubdomains = includeSubdomains;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getIncludeSubdomains}
         * @param includeSubdomains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#include_subdomains CloudfrontResponseHeadersPolicy#include_subdomains}.
         * @return {@code this}
         */
        public Builder includeSubdomains(com.hashicorp.cdktf.IResolvable includeSubdomains) {
            this.includeSubdomains = includeSubdomains;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getPreload}
         * @param preload Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#preload CloudfrontResponseHeadersPolicy#preload}.
         * @return {@code this}
         */
        public Builder preload(java.lang.Boolean preload) {
            this.preload = preload;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity#getPreload}
         * @param preload Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#preload CloudfrontResponseHeadersPolicy#preload}.
         * @return {@code this}
         */
        public Builder preload(com.hashicorp.cdktf.IResolvable preload) {
            this.preload = preload;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity {
        private final java.lang.Number accessControlMaxAgeSec;
        private final java.lang.Object override;
        private final java.lang.Object includeSubdomains;
        private final java.lang.Object preload;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessControlMaxAgeSec = software.amazon.jsii.Kernel.get(this, "accessControlMaxAgeSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeSubdomains = software.amazon.jsii.Kernel.get(this, "includeSubdomains", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.preload = software.amazon.jsii.Kernel.get(this, "preload", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessControlMaxAgeSec = java.util.Objects.requireNonNull(builder.accessControlMaxAgeSec, "accessControlMaxAgeSec is required");
            this.override = java.util.Objects.requireNonNull(builder.override, "override is required");
            this.includeSubdomains = builder.includeSubdomains;
            this.preload = builder.preload;
        }

        @Override
        public final java.lang.Number getAccessControlMaxAgeSec() {
            return this.accessControlMaxAgeSec;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        public final java.lang.Object getIncludeSubdomains() {
            return this.includeSubdomains;
        }

        @Override
        public final java.lang.Object getPreload() {
            return this.preload;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accessControlMaxAgeSec", om.valueToTree(this.getAccessControlMaxAgeSec()));
            data.set("override", om.valueToTree(this.getOverride()));
            if (this.getIncludeSubdomains() != null) {
                data.set("includeSubdomains", om.valueToTree(this.getIncludeSubdomains()));
            }
            if (this.getPreload() != null) {
                data.set("preload", om.valueToTree(this.getPreload()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.Jsii$Proxy that = (CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.Jsii$Proxy) o;

            if (!accessControlMaxAgeSec.equals(that.accessControlMaxAgeSec)) return false;
            if (!override.equals(that.override)) return false;
            if (this.includeSubdomains != null ? !this.includeSubdomains.equals(that.includeSubdomains) : that.includeSubdomains != null) return false;
            return this.preload != null ? this.preload.equals(that.preload) : that.preload == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessControlMaxAgeSec.hashCode();
            result = 31 * result + (this.override.hashCode());
            result = 31 * result + (this.includeSubdomains != null ? this.includeSubdomains.hashCode() : 0);
            result = 31 * result + (this.preload != null ? this.preload.hashCode() : 0);
            return result;
        }
    }
}
