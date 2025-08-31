package imports.aws.cloudfront_vpc_origin;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontVpcOrigin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols")
@software.amazon.jsii.Jsii.Proxy(CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols.Jsii$Proxy.class)
public interface CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#items CloudfrontVpcOrigin#items}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getItems();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#quantity CloudfrontVpcOrigin#quantity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getQuantity();

    /**
     * @return a {@link Builder} of {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols> {
        java.util.List<java.lang.String> items;
        java.lang.Number quantity;

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols#getItems}
         * @param items Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#items CloudfrontVpcOrigin#items}. This parameter is required.
         * @return {@code this}
         */
        public Builder items(java.util.List<java.lang.String> items) {
            this.items = items;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols#getQuantity}
         * @param quantity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_vpc_origin#quantity CloudfrontVpcOrigin#quantity}. This parameter is required.
         * @return {@code this}
         */
        public Builder quantity(java.lang.Number quantity) {
            this.quantity = quantity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols {
        private final java.util.List<java.lang.String> items;
        private final java.lang.Number quantity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.items = software.amazon.jsii.Kernel.get(this, "items", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.quantity = software.amazon.jsii.Kernel.get(this, "quantity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.items = java.util.Objects.requireNonNull(builder.items, "items is required");
            this.quantity = java.util.Objects.requireNonNull(builder.quantity, "quantity is required");
        }

        @Override
        public final java.util.List<java.lang.String> getItems() {
            return this.items;
        }

        @Override
        public final java.lang.Number getQuantity() {
            return this.quantity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("items", om.valueToTree(this.getItems()));
            data.set("quantity", om.valueToTree(this.getQuantity()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontVpcOrigin.CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols.Jsii$Proxy that = (CloudfrontVpcOriginVpcOriginEndpointConfigOriginSslProtocols.Jsii$Proxy) o;

            if (!items.equals(that.items)) return false;
            return this.quantity.equals(that.quantity);
        }

        @Override
        public final int hashCode() {
            int result = this.items.hashCode();
            result = 31 * result + (this.quantity.hashCode());
            return result;
        }
    }
}
