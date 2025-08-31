package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.455Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * common_attributes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#common_attributes KinesisFirehoseDeliveryStream#common_attributes}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCommonAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#content_encoding KinesisFirehoseDeliveryStream#content_encoding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentEncoding() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration> {
        java.lang.Object commonAttributes;
        java.lang.String contentEncoding;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration#getCommonAttributes}
         * @param commonAttributes common_attributes block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#common_attributes KinesisFirehoseDeliveryStream#common_attributes}
         * @return {@code this}
         */
        public Builder commonAttributes(com.hashicorp.cdktf.IResolvable commonAttributes) {
            this.commonAttributes = commonAttributes;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration#getCommonAttributes}
         * @param commonAttributes common_attributes block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#common_attributes KinesisFirehoseDeliveryStream#common_attributes}
         * @return {@code this}
         */
        public Builder commonAttributes(java.util.List<? extends imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributes> commonAttributes) {
            this.commonAttributes = commonAttributes;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration#getContentEncoding}
         * @param contentEncoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#content_encoding KinesisFirehoseDeliveryStream#content_encoding}.
         * @return {@code this}
         */
        public Builder contentEncoding(java.lang.String contentEncoding) {
            this.contentEncoding = contentEncoding;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration {
        private final java.lang.Object commonAttributes;
        private final java.lang.String contentEncoding;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.commonAttributes = software.amazon.jsii.Kernel.get(this, "commonAttributes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.contentEncoding = software.amazon.jsii.Kernel.get(this, "contentEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.commonAttributes = builder.commonAttributes;
            this.contentEncoding = builder.contentEncoding;
        }

        @Override
        public final java.lang.Object getCommonAttributes() {
            return this.commonAttributes;
        }

        @Override
        public final java.lang.String getContentEncoding() {
            return this.contentEncoding;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCommonAttributes() != null) {
                data.set("commonAttributes", om.valueToTree(this.getCommonAttributes()));
            }
            if (this.getContentEncoding() != null) {
                data.set("contentEncoding", om.valueToTree(this.getContentEncoding()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration.Jsii$Proxy) o;

            if (this.commonAttributes != null ? !this.commonAttributes.equals(that.commonAttributes) : that.commonAttributes != null) return false;
            return this.contentEncoding != null ? this.contentEncoding.equals(that.contentEncoding) : that.contentEncoding == null;
        }

        @Override
        public final int hashCode() {
            int result = this.commonAttributes != null ? this.commonAttributes.hashCode() : 0;
            result = 31 * result + (this.contentEncoding != null ? this.contentEncoding.hashCode() : 0);
            return result;
        }
    }
}
