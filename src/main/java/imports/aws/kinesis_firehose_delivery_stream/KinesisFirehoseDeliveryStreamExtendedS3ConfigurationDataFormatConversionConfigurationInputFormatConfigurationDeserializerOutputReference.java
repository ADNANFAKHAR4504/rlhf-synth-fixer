package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.451Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOutputReference")
public class KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHiveJsonSerDe(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerHiveJsonSerDe value) {
        software.amazon.jsii.Kernel.call(this, "putHiveJsonSerDe", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpenXJsonSerDe(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe value) {
        software.amazon.jsii.Kernel.call(this, "putOpenXJsonSerDe", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHiveJsonSerDe() {
        software.amazon.jsii.Kernel.call(this, "resetHiveJsonSerDe", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpenXJsonSerDe() {
        software.amazon.jsii.Kernel.call(this, "resetOpenXJsonSerDe", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerHiveJsonSerDeOutputReference getHiveJsonSerDe() {
        return software.amazon.jsii.Kernel.get(this, "hiveJsonSerDe", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerHiveJsonSerDeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference getOpenXJsonSerDe() {
        return software.amazon.jsii.Kernel.get(this, "openXJsonSerDe", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerHiveJsonSerDe getHiveJsonSerDeInput() {
        return software.amazon.jsii.Kernel.get(this, "hiveJsonSerDeInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerHiveJsonSerDe.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe getOpenXJsonSerDeInput() {
        return software.amazon.jsii.Kernel.get(this, "openXJsonSerDeInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializerOpenXJsonSerDe.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializer getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializer.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamExtendedS3ConfigurationDataFormatConversionConfigurationInputFormatConfigurationDeserializer value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
