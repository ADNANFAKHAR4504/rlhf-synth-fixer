package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDeOutputReference")
public class KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBlockSizeBytes() {
        software.amazon.jsii.Kernel.call(this, "resetBlockSizeBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompression() {
        software.amazon.jsii.Kernel.call(this, "resetCompression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDictionaryCompression() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDictionaryCompression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxPaddingBytes() {
        software.amazon.jsii.Kernel.call(this, "resetMaxPaddingBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPageSizeBytes() {
        software.amazon.jsii.Kernel.call(this, "resetPageSizeBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWriterVersion() {
        software.amazon.jsii.Kernel.call(this, "resetWriterVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlockSizeBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "blockSizeBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompressionInput() {
        return software.amazon.jsii.Kernel.get(this, "compressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDictionaryCompressionInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDictionaryCompressionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxPaddingBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxPaddingBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPageSizeBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "pageSizeBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWriterVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "writerVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlockSizeBytes() {
        return software.amazon.jsii.Kernel.get(this, "blockSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlockSizeBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blockSizeBytes", java.util.Objects.requireNonNull(value, "blockSizeBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompression() {
        return software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compression", java.util.Objects.requireNonNull(value, "compression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDictionaryCompression() {
        return software.amazon.jsii.Kernel.get(this, "enableDictionaryCompression", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDictionaryCompression(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDictionaryCompression", java.util.Objects.requireNonNull(value, "enableDictionaryCompression is required"));
    }

    public void setEnableDictionaryCompression(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDictionaryCompression", java.util.Objects.requireNonNull(value, "enableDictionaryCompression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxPaddingBytes() {
        return software.amazon.jsii.Kernel.get(this, "maxPaddingBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxPaddingBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxPaddingBytes", java.util.Objects.requireNonNull(value, "maxPaddingBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPageSizeBytes() {
        return software.amazon.jsii.Kernel.get(this, "pageSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPageSizeBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "pageSizeBytes", java.util.Objects.requireNonNull(value, "pageSizeBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWriterVersion() {
        return software.amazon.jsii.Kernel.get(this, "writerVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWriterVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "writerVersion", java.util.Objects.requireNonNull(value, "writerVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerParquetSerDe value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
