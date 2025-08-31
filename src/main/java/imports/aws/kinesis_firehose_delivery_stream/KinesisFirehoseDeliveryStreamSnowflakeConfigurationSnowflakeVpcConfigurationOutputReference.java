package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateLinkVpceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "privateLinkVpceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateLinkVpceId() {
        return software.amazon.jsii.Kernel.get(this, "privateLinkVpceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateLinkVpceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateLinkVpceId", java.util.Objects.requireNonNull(value, "privateLinkVpceId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationSnowflakeVpcConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
