package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDeOutputReference")
public class KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBlockSizeBytes() {
        software.amazon.jsii.Kernel.call(this, "resetBlockSizeBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBloomFilterColumns() {
        software.amazon.jsii.Kernel.call(this, "resetBloomFilterColumns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBloomFilterFalsePositiveProbability() {
        software.amazon.jsii.Kernel.call(this, "resetBloomFilterFalsePositiveProbability", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompression() {
        software.amazon.jsii.Kernel.call(this, "resetCompression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDictionaryKeyThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetDictionaryKeyThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePadding() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePadding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFormatVersion() {
        software.amazon.jsii.Kernel.call(this, "resetFormatVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPaddingTolerance() {
        software.amazon.jsii.Kernel.call(this, "resetPaddingTolerance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowIndexStride() {
        software.amazon.jsii.Kernel.call(this, "resetRowIndexStride", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStripeSizeBytes() {
        software.amazon.jsii.Kernel.call(this, "resetStripeSizeBytes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlockSizeBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "blockSizeBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBloomFilterColumnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "bloomFilterColumnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBloomFilterFalsePositiveProbabilityInput() {
        return software.amazon.jsii.Kernel.get(this, "bloomFilterFalsePositiveProbabilityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompressionInput() {
        return software.amazon.jsii.Kernel.get(this, "compressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDictionaryKeyThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "dictionaryKeyThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePaddingInput() {
        return software.amazon.jsii.Kernel.get(this, "enablePaddingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "formatVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPaddingToleranceInput() {
        return software.amazon.jsii.Kernel.get(this, "paddingToleranceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRowIndexStrideInput() {
        return software.amazon.jsii.Kernel.get(this, "rowIndexStrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStripeSizeBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "stripeSizeBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlockSizeBytes() {
        return software.amazon.jsii.Kernel.get(this, "blockSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlockSizeBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blockSizeBytes", java.util.Objects.requireNonNull(value, "blockSizeBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBloomFilterColumns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "bloomFilterColumns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setBloomFilterColumns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "bloomFilterColumns", java.util.Objects.requireNonNull(value, "bloomFilterColumns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBloomFilterFalsePositiveProbability() {
        return software.amazon.jsii.Kernel.get(this, "bloomFilterFalsePositiveProbability", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBloomFilterFalsePositiveProbability(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bloomFilterFalsePositiveProbability", java.util.Objects.requireNonNull(value, "bloomFilterFalsePositiveProbability is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompression() {
        return software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compression", java.util.Objects.requireNonNull(value, "compression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDictionaryKeyThreshold() {
        return software.amazon.jsii.Kernel.get(this, "dictionaryKeyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDictionaryKeyThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dictionaryKeyThreshold", java.util.Objects.requireNonNull(value, "dictionaryKeyThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePadding() {
        return software.amazon.jsii.Kernel.get(this, "enablePadding", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePadding(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePadding", java.util.Objects.requireNonNull(value, "enablePadding is required"));
    }

    public void setEnablePadding(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePadding", java.util.Objects.requireNonNull(value, "enablePadding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormatVersion() {
        return software.amazon.jsii.Kernel.get(this, "formatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormatVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "formatVersion", java.util.Objects.requireNonNull(value, "formatVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPaddingTolerance() {
        return software.amazon.jsii.Kernel.get(this, "paddingTolerance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPaddingTolerance(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "paddingTolerance", java.util.Objects.requireNonNull(value, "paddingTolerance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRowIndexStride() {
        return software.amazon.jsii.Kernel.get(this, "rowIndexStride", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRowIndexStride(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rowIndexStride", java.util.Objects.requireNonNull(value, "rowIndexStride is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStripeSizeBytes() {
        return software.amazon.jsii.Kernel.get(this, "stripeSizeBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStripeSizeBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "stripeSizeBytes", java.util.Objects.requireNonNull(value, "stripeSizeBytes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDe getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDe.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationOutputFormatConfigurationSerializerOrcSerDe value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
