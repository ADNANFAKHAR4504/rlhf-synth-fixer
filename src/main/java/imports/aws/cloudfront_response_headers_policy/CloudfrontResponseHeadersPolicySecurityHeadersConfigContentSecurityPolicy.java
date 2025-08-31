package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_security_policy CloudfrontResponseHeadersPolicy#content_security_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContentSecurityPolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOverride();

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy> {
        java.lang.String contentSecurityPolicy;
        java.lang.Object override;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy#getContentSecurityPolicy}
         * @param contentSecurityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#content_security_policy CloudfrontResponseHeadersPolicy#content_security_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder contentSecurityPolicy(java.lang.String contentSecurityPolicy) {
            this.contentSecurityPolicy = contentSecurityPolicy;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(java.lang.Boolean override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy {
        private final java.lang.String contentSecurityPolicy;
        private final java.lang.Object override;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentSecurityPolicy = software.amazon.jsii.Kernel.get(this, "contentSecurityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentSecurityPolicy = java.util.Objects.requireNonNull(builder.contentSecurityPolicy, "contentSecurityPolicy is required");
            this.override = java.util.Objects.requireNonNull(builder.override, "override is required");
        }

        @Override
        public final java.lang.String getContentSecurityPolicy() {
            return this.contentSecurityPolicy;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("contentSecurityPolicy", om.valueToTree(this.getContentSecurityPolicy()));
            data.set("override", om.valueToTree(this.getOverride()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.Jsii$Proxy that = (CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.Jsii$Proxy) o;

            if (!contentSecurityPolicy.equals(that.contentSecurityPolicy)) return false;
            return this.override.equals(that.override);
        }

        @Override
        public final int hashCode() {
            int result = this.contentSecurityPolicy.hashCode();
            result = 31 * result + (this.override.hashCode());
            return result;
        }
    }
}
