package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#header CloudfrontResponseHeadersPolicy#header}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHeader();

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems> {
        java.lang.String header;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems#getHeader}
         * @param header Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#header CloudfrontResponseHeadersPolicy#header}. This parameter is required.
         * @return {@code this}
         */
        public Builder header(java.lang.String header) {
            this.header = header;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems {
        private final java.lang.String header;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.header = java.util.Objects.requireNonNull(builder.header, "header is required");
        }

        @Override
        public final java.lang.String getHeader() {
            return this.header;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("header", om.valueToTree(this.getHeader()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems.Jsii$Proxy that = (CloudfrontResponseHeadersPolicyRemoveHeadersConfigItems.Jsii$Proxy) o;

            return this.header.equals(that.header);
        }

        @Override
        public final int hashCode() {
            int result = this.header.hashCode();
            return result;
        }
    }
}
