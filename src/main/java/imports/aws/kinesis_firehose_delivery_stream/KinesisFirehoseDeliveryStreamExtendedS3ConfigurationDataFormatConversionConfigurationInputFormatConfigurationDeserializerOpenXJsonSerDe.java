package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#case_insensitive KinesisFirehoseDeliveryStream#case_insensitive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCaseInsensitive() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#column_to_json_key_mappings KinesisFirehoseDeliveryStream#column_to_json_key_mappings}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getColumnToJsonKeyMappings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#convert_dots_in_json_keys_to_underscores KinesisFirehoseDeliveryStream#convert_dots_in_json_keys_to_underscores}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConvertDotsInJsonKeysToUnderscores() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe> {
        java.lang.Object caseInsensitive;
        java.util.Map<java.lang.String, java.lang.String> columnToJsonKeyMappings;
        java.lang.Object convertDotsInJsonKeysToUnderscores;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe#getCaseInsensitive}
         * @param caseInsensitive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#case_insensitive KinesisFirehoseDeliveryStream#case_insensitive}.
         * @return {@code this}
         */
        public Builder caseInsensitive(java.lang.Boolean caseInsensitive) {
            this.caseInsensitive = caseInsensitive;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe#getCaseInsensitive}
         * @param caseInsensitive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#case_insensitive KinesisFirehoseDeliveryStream#case_insensitive}.
         * @return {@code this}
         */
        public Builder caseInsensitive(com.hashicorp.cdktf.IResolvable caseInsensitive) {
            this.caseInsensitive = caseInsensitive;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe#getColumnToJsonKeyMappings}
         * @param columnToJsonKeyMappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#column_to_json_key_mappings KinesisFirehoseDeliveryStream#column_to_json_key_mappings}.
         * @return {@code this}
         */
        public Builder columnToJsonKeyMappings(java.util.Map<java.lang.String, java.lang.String> columnToJsonKeyMappings) {
            this.columnToJsonKeyMappings = columnToJsonKeyMappings;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe#getConvertDotsInJsonKeysToUnderscores}
         * @param convertDotsInJsonKeysToUnderscores Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#convert_dots_in_json_keys_to_underscores KinesisFirehoseDeliveryStream#convert_dots_in_json_keys_to_underscores}.
         * @return {@code this}
         */
        public Builder convertDotsInJsonKeysToUnderscores(java.lang.Boolean convertDotsInJsonKeysToUnderscores) {
            this.convertDotsInJsonKeysToUnderscores = convertDotsInJsonKeysToUnderscores;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe#getConvertDotsInJsonKeysToUnderscores}
         * @param convertDotsInJsonKeysToUnderscores Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#convert_dots_in_json_keys_to_underscores KinesisFirehoseDeliveryStream#convert_dots_in_json_keys_to_underscores}.
         * @return {@code this}
         */
        public Builder convertDotsInJsonKeysToUnderscores(com.hashicorp.cdktf.IResolvable convertDotsInJsonKeysToUnderscores) {
            this.convertDotsInJsonKeysToUnderscores = convertDotsInJsonKeysToUnderscores;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe {
        private final java.lang.Object caseInsensitive;
        private final java.util.Map<java.lang.String, java.lang.String> columnToJsonKeyMappings;
        private final java.lang.Object convertDotsInJsonKeysToUnderscores;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.caseInsensitive = software.amazon.jsii.Kernel.get(this, "caseInsensitive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.columnToJsonKeyMappings = software.amazon.jsii.Kernel.get(this, "columnToJsonKeyMappings", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.convertDotsInJsonKeysToUnderscores = software.amazon.jsii.Kernel.get(this, "convertDotsInJsonKeysToUnderscores", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.caseInsensitive = builder.caseInsensitive;
            this.columnToJsonKeyMappings = builder.columnToJsonKeyMappings;
            this.convertDotsInJsonKeysToUnderscores = builder.convertDotsInJsonKeysToUnderscores;
        }

        @Override
        public final java.lang.Object getCaseInsensitive() {
            return this.caseInsensitive;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getColumnToJsonKeyMappings() {
            return this.columnToJsonKeyMappings;
        }

        @Override
        public final java.lang.Object getConvertDotsInJsonKeysToUnderscores() {
            return this.convertDotsInJsonKeysToUnderscores;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCaseInsensitive() != null) {
                data.set("caseInsensitive", om.valueToTree(this.getCaseInsensitive()));
            }
            if (this.getColumnToJsonKeyMappings() != null) {
                data.set("columnToJsonKeyMappings", om.valueToTree(this.getColumnToJsonKeyMappings()));
            }
            if (this.getConvertDotsInJsonKeysToUnderscores() != null) {
                data.set("convertDotsInJsonKeysToUnderscores", om.valueToTree(this.getConvertDotsInJsonKeysToUnderscores()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe.Jsii$Proxy) o;

            if (this.caseInsensitive != null ? !this.caseInsensitive.equals(that.caseInsensitive) : that.caseInsensitive != null) return false;
            if (this.columnToJsonKeyMappings != null ? !this.columnToJsonKeyMappings.equals(that.columnToJsonKeyMappings) : that.columnToJsonKeyMappings != null) return false;
            return this.convertDotsInJsonKeysToUnderscores != null ? this.convertDotsInJsonKeysToUnderscores.equals(that.convertDotsInJsonKeysToUnderscores) : that.convertDotsInJsonKeysToUnderscores == null;
        }

        @Override
        public final int hashCode() {
            int result = this.caseInsensitive != null ? this.caseInsensitive.hashCode() : 0;
            result = 31 * result + (this.columnToJsonKeyMappings != null ? this.columnToJsonKeyMappings.hashCode() : 0);
            result = 31 * result + (this.convertDotsInJsonKeysToUnderscores != null ? this.convertDotsInJsonKeysToUnderscores.hashCode() : 0);
            return result;
        }
    }
}
