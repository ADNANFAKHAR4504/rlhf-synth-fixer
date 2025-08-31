package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.458Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putProcessors(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessors>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessors> __cast_cd4240 = (java.util.List<imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessors>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessors __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessors", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessors() {
        software.amazon.jsii.Kernel.call(this, "resetProcessors", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessorsList getProcessors() {
        return software.amazon.jsii.Kernel.get(this, "processors", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfigurationProcessorsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessorsInput() {
        return software.amazon.jsii.Kernel.get(this, "processorsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamOpensearchConfigurationProcessingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
