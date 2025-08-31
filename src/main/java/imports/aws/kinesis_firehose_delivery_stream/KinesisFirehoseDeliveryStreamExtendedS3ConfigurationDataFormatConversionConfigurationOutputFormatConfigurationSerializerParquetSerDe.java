package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#block_size_bytes KinesisFirehoseDeliveryStream#block_size_bytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlockSizeBytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#compression KinesisFirehoseDeliveryStream#compression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCompression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enable_dictionary_compression KinesisFirehoseDeliveryStream#enable_dictionary_compression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDictionaryCompression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#max_padding_bytes KinesisFirehoseDeliveryStream#max_padding_bytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxPaddingBytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#page_size_bytes KinesisFirehoseDeliveryStream#page_size_bytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPageSizeBytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#writer_version KinesisFirehoseDeliveryStream#writer_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWriterVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe> {
        java.lang.Number blockSizeBytes;
        java.lang.String compression;
        java.lang.Object enableDictionaryCompression;
        java.lang.Number maxPaddingBytes;
        java.lang.Number pageSizeBytes;
        java.lang.String writerVersion;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getBlockSizeBytes}
         * @param blockSizeBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#block_size_bytes KinesisFirehoseDeliveryStream#block_size_bytes}.
         * @return {@code this}
         */
        public Builder blockSizeBytes(java.lang.Number blockSizeBytes) {
            this.blockSizeBytes = blockSizeBytes;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getCompression}
         * @param compression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#compression KinesisFirehoseDeliveryStream#compression}.
         * @return {@code this}
         */
        public Builder compression(java.lang.String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getEnableDictionaryCompression}
         * @param enableDictionaryCompression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enable_dictionary_compression KinesisFirehoseDeliveryStream#enable_dictionary_compression}.
         * @return {@code this}
         */
        public Builder enableDictionaryCompression(java.lang.Boolean enableDictionaryCompression) {
            this.enableDictionaryCompression = enableDictionaryCompression;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getEnableDictionaryCompression}
         * @param enableDictionaryCompression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enable_dictionary_compression KinesisFirehoseDeliveryStream#enable_dictionary_compression}.
         * @return {@code this}
         */
        public Builder enableDictionaryCompression(com.hashicorp.cdktf.IResolvable enableDictionaryCompression) {
            this.enableDictionaryCompression = enableDictionaryCompression;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getMaxPaddingBytes}
         * @param maxPaddingBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#max_padding_bytes KinesisFirehoseDeliveryStream#max_padding_bytes}.
         * @return {@code this}
         */
        public Builder maxPaddingBytes(java.lang.Number maxPaddingBytes) {
            this.maxPaddingBytes = maxPaddingBytes;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getPageSizeBytes}
         * @param pageSizeBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#page_size_bytes KinesisFirehoseDeliveryStream#page_size_bytes}.
         * @return {@code this}
         */
        public Builder pageSizeBytes(java.lang.Number pageSizeBytes) {
            this.pageSizeBytes = pageSizeBytes;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe#getWriterVersion}
         * @param writerVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#writer_version KinesisFirehoseDeliveryStream#writer_version}.
         * @return {@code this}
         */
        public Builder writerVersion(java.lang.String writerVersion) {
            this.writerVersion = writerVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe {
        private final java.lang.Number blockSizeBytes;
        private final java.lang.String compression;
        private final java.lang.Object enableDictionaryCompression;
        private final java.lang.Number maxPaddingBytes;
        private final java.lang.Number pageSizeBytes;
        private final java.lang.String writerVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blockSizeBytes = software.amazon.jsii.Kernel.get(this, "blockSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.compression = software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableDictionaryCompression = software.amazon.jsii.Kernel.get(this, "enableDictionaryCompression", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maxPaddingBytes = software.amazon.jsii.Kernel.get(this, "maxPaddingBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pageSizeBytes = software.amazon.jsii.Kernel.get(this, "pageSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.writerVersion = software.amazon.jsii.Kernel.get(this, "writerVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blockSizeBytes = builder.blockSizeBytes;
            this.compression = builder.compression;
            this.enableDictionaryCompression = builder.enableDictionaryCompression;
            this.maxPaddingBytes = builder.maxPaddingBytes;
            this.pageSizeBytes = builder.pageSizeBytes;
            this.writerVersion = builder.writerVersion;
        }

        @Override
        public final java.lang.Number getBlockSizeBytes() {
            return this.blockSizeBytes;
        }

        @Override
        public final java.lang.String getCompression() {
            return this.compression;
        }

        @Override
        public final java.lang.Object getEnableDictionaryCompression() {
            return this.enableDictionaryCompression;
        }

        @Override
        public final java.lang.Number getMaxPaddingBytes() {
            return this.maxPaddingBytes;
        }

        @Override
        public final java.lang.Number getPageSizeBytes() {
            return this.pageSizeBytes;
        }

        @Override
        public final java.lang.String getWriterVersion() {
            return this.writerVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlockSizeBytes() != null) {
                data.set("blockSizeBytes", om.valueToTree(this.getBlockSizeBytes()));
            }
            if (this.getCompression() != null) {
                data.set("compression", om.valueToTree(this.getCompression()));
            }
            if (this.getEnableDictionaryCompression() != null) {
                data.set("enableDictionaryCompression", om.valueToTree(this.getEnableDictionaryCompression()));
            }
            if (this.getMaxPaddingBytes() != null) {
                data.set("maxPaddingBytes", om.valueToTree(this.getMaxPaddingBytes()));
            }
            if (this.getPageSizeBytes() != null) {
                data.set("pageSizeBytes", om.valueToTree(this.getPageSizeBytes()));
            }
            if (this.getWriterVersion() != null) {
                data.set("writerVersion", om.valueToTree(this.getWriterVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe.Jsii$Proxy) o;

            if (this.blockSizeBytes != null ? !this.blockSizeBytes.equals(that.blockSizeBytes) : that.blockSizeBytes != null) return false;
            if (this.compression != null ? !this.compression.equals(that.compression) : that.compression != null) return false;
            if (this.enableDictionaryCompression != null ? !this.enableDictionaryCompression.equals(that.enableDictionaryCompression) : that.enableDictionaryCompression != null) return false;
            if (this.maxPaddingBytes != null ? !this.maxPaddingBytes.equals(that.maxPaddingBytes) : that.maxPaddingBytes != null) return false;
            if (this.pageSizeBytes != null ? !this.pageSizeBytes.equals(that.pageSizeBytes) : that.pageSizeBytes != null) return false;
            return this.writerVersion != null ? this.writerVersion.equals(that.writerVersion) : that.writerVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blockSizeBytes != null ? this.blockSizeBytes.hashCode() : 0;
            result = 31 * result + (this.compression != null ? this.compression.hashCode() : 0);
            result = 31 * result + (this.enableDictionaryCompression != null ? this.enableDictionaryCompression.hashCode() : 0);
            result = 31 * result + (this.maxPaddingBytes != null ? this.maxPaddingBytes.hashCode() : 0);
            result = 31 * result + (this.pageSizeBytes != null ? this.pageSizeBytes.hashCode() : 0);
            result = 31 * result + (this.writerVersion != null ? this.writerVersion.hashCode() : 0);
            return result;
        }
    }
}
