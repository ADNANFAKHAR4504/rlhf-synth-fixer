package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#parameter_name KinesisFirehoseDeliveryStream#parameter_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParameterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#parameter_value KinesisFirehoseDeliveryStream#parameter_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParameterValue();

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters> {
        java.lang.String parameterName;
        java.lang.String parameterValue;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters#getParameterName}
         * @param parameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#parameter_name KinesisFirehoseDeliveryStream#parameter_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder parameterName(java.lang.String parameterName) {
            this.parameterName = parameterName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters#getParameterValue}
         * @param parameterValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#parameter_value KinesisFirehoseDeliveryStream#parameter_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder parameterValue(java.lang.String parameterValue) {
            this.parameterValue = parameterValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters {
        private final java.lang.String parameterName;
        private final java.lang.String parameterValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.parameterName = software.amazon.jsii.Kernel.get(this, "parameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameterValue = software.amazon.jsii.Kernel.get(this, "parameterValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.parameterName = java.util.Objects.requireNonNull(builder.parameterName, "parameterName is required");
            this.parameterValue = java.util.Objects.requireNonNull(builder.parameterValue, "parameterValue is required");
        }

        @Override
        public final java.lang.String getParameterName() {
            return this.parameterName;
        }

        @Override
        public final java.lang.String getParameterValue() {
            return this.parameterValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("parameterName", om.valueToTree(this.getParameterName()));
            data.set("parameterValue", om.valueToTree(this.getParameterValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamIcebergConfigurationProcessingConfigurationProcessorsParameters.Jsii$Proxy) o;

            if (!parameterName.equals(that.parameterName)) return false;
            return this.parameterValue.equals(that.parameterValue);
        }

        @Override
        public final int hashCode() {
            int result = this.parameterName.hashCode();
            result = 31 * result + (this.parameterValue.hashCode());
            return result;
        }
    }
}
