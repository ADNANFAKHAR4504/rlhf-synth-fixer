package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCommonAttributes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributes> __cast_cd4240 = (java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCommonAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCommonAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetCommonAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentEncoding() {
        software.amazon.jsii.Kernel.call(this, "resetContentEncoding", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributesList getCommonAttributes() {
        return software.amazon.jsii.Kernel.get(this, "commonAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfigurationCommonAttributesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCommonAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "commonAttributesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentEncodingInput() {
        return software.amazon.jsii.Kernel.get(this, "contentEncodingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentEncoding() {
        return software.amazon.jsii.Kernel.get(this, "contentEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentEncoding(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentEncoding", java.util.Objects.requireNonNull(value, "contentEncoding is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamHttpEndpointConfigurationRequestConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
