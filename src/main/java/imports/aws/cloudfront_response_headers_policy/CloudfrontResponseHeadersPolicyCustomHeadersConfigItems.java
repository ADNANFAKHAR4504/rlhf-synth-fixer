package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCustomHeadersConfigItems")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicyCustomHeadersConfigItems.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicyCustomHeadersConfigItems extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#header CloudfrontResponseHeadersPolicy#header}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHeader();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOverride();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#value CloudfrontResponseHeadersPolicy#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicyCustomHeadersConfigItems> {
        java.lang.String header;
        java.lang.Object override;
        java.lang.String value;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems#getHeader}
         * @param header Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#header CloudfrontResponseHeadersPolicy#header}. This parameter is required.
         * @return {@code this}
         */
        public Builder header(java.lang.String header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(java.lang.Boolean override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems#getOverride}
         * @param override Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#override CloudfrontResponseHeadersPolicy#override}. This parameter is required.
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#value CloudfrontResponseHeadersPolicy#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicyCustomHeadersConfigItems build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicyCustomHeadersConfigItems}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicyCustomHeadersConfigItems {
        private final java.lang.String header;
        private final java.lang.Object override;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.header = java.util.Objects.requireNonNull(builder.header, "header is required");
            this.override = java.util.Objects.requireNonNull(builder.override, "override is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("header", om.valueToTree(this.getHeader()));
            data.set("override", om.valueToTree(this.getOverride()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCustomHeadersConfigItems"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicyCustomHeadersConfigItems.Jsii$Proxy that = (CloudfrontResponseHeadersPolicyCustomHeadersConfigItems.Jsii$Proxy) o;

            if (!header.equals(that.header)) return false;
            if (!override.equals(that.override)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.header.hashCode();
            result = 31 * result + (this.override.hashCode());
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
