package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference")
public class KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCaseInsensitive() {
        software.amazon.jsii.Kernel.call(this, "resetCaseInsensitive", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumnToJsonKeyMappings() {
        software.amazon.jsii.Kernel.call(this, "resetColumnToJsonKeyMappings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConvertDotsInJsonKeysToUnderscores() {
        software.amazon.jsii.Kernel.call(this, "resetConvertDotsInJsonKeysToUnderscores", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaseInsensitiveInput() {
        return software.amazon.jsii.Kernel.get(this, "caseInsensitiveInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getColumnToJsonKeyMappingsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "columnToJsonKeyMappingsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConvertDotsInJsonKeysToUnderscoresInput() {
        return software.amazon.jsii.Kernel.get(this, "convertDotsInJsonKeysToUnderscoresInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCaseInsensitive() {
        return software.amazon.jsii.Kernel.get(this, "caseInsensitive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCaseInsensitive(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "caseInsensitive", java.util.Objects.requireNonNull(value, "caseInsensitive is required"));
    }

    public void setCaseInsensitive(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "caseInsensitive", java.util.Objects.requireNonNull(value, "caseInsensitive is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getColumnToJsonKeyMappings() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "columnToJsonKeyMappings", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setColumnToJsonKeyMappings(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "columnToJsonKeyMappings", java.util.Objects.requireNonNull(value, "columnToJsonKeyMappings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getConvertDotsInJsonKeysToUnderscores() {
        return software.amazon.jsii.Kernel.get(this, "convertDotsInJsonKeysToUnderscores", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setConvertDotsInJsonKeysToUnderscores(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "convertDotsInJsonKeysToUnderscores", java.util.Objects.requireNonNull(value, "convertDotsInJsonKeysToUnderscores is required"));
    }

    public void setConvertDotsInJsonKeysToUnderscores(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "convertDotsInJsonKeysToUnderscores", java.util.Objects.requireNonNull(value, "convertDotsInJsonKeysToUnderscores is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
