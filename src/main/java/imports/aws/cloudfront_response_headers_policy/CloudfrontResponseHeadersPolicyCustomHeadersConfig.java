package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCustomHeadersConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicyCustomHeadersConfig.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicyCustomHeadersConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * items block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#items CloudfrontResponseHeadersPolicy#items}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getItems() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicyCustomHeadersConfig> {
        java.lang.Object items;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig#getItems}
         * @param items items block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#items CloudfrontResponseHeadersPolicy#items}
         * @return {@code this}
         */
        public Builder items(com.hashicorp.cdktf.IResolvable items) {
            this.items = items;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig#getItems}
         * @param items items block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#items CloudfrontResponseHeadersPolicy#items}
         * @return {@code this}
         */
        public Builder items(java.util.List<? extends imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfigItems> items) {
            this.items = items;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicyCustomHeadersConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicyCustomHeadersConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicyCustomHeadersConfig {
        private final java.lang.Object items;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.items = software.amazon.jsii.Kernel.get(this, "items", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.items = builder.items;
        }

        @Override
        public final java.lang.Object getItems() {
            return this.items;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getItems() != null) {
                data.set("items", om.valueToTree(this.getItems()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCustomHeadersConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicyCustomHeadersConfig.Jsii$Proxy that = (CloudfrontResponseHeadersPolicyCustomHeadersConfig.Jsii$Proxy) o;

            return this.items != null ? this.items.equals(that.items) : that.items == null;
        }

        @Override
        public final int hashCode() {
            int result = this.items != null ? this.items.hashCode() : 0;
            return result;
        }
    }
}
