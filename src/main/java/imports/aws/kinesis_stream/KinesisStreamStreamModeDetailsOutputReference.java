package imports.aws.kinesis_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.467Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisStream.KinesisStreamStreamModeDetailsOutputReference")
public class KinesisStreamStreamModeDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisStreamStreamModeDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisStreamStreamModeDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisStreamStreamModeDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamModeInput() {
        return software.amazon.jsii.Kernel.get(this, "streamModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamMode() {
        return software.amazon.jsii.Kernel.get(this, "streamMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamMode", java.util.Objects.requireNonNull(value, "streamMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_stream.KinesisStreamStreamModeDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_stream.KinesisStreamStreamModeDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_stream.KinesisStreamStreamModeDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
