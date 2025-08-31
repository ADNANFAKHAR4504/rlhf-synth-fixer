package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference")
public class KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisFirehoseDeliveryStreamMskSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuthenticationConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAuthenticationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetReadFromTimestamp() {
        software.amazon.jsii.Kernel.call(this, "resetReadFromTimestamp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfigurationOutputReference getAuthenticationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration getAuthenticationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMskClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "mskClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReadFromTimestampInput() {
        return software.amazon.jsii.Kernel.get(this, "readFromTimestampInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTopicNameInput() {
        return software.amazon.jsii.Kernel.get(this, "topicNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMskClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "mskClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMskClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mskClusterArn", java.util.Objects.requireNonNull(value, "mskClusterArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReadFromTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "readFromTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReadFromTimestamp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "readFromTimestamp", java.util.Objects.requireNonNull(value, "readFromTimestamp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopicName() {
        return software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTopicName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "topicName", java.util.Objects.requireNonNull(value, "topicName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
