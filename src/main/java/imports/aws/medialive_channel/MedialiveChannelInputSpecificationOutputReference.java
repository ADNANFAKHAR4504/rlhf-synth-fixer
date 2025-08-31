package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputSpecificationOutputReference")
public class MedialiveChannelInputSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodecInput() {
        return software.amazon.jsii.Kernel.get(this, "codecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputResolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaximumBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodec() {
        return software.amazon.jsii.Kernel.get(this, "codec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codec", java.util.Objects.requireNonNull(value, "codec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputResolution() {
        return software.amazon.jsii.Kernel.get(this, "inputResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputResolution(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputResolution", java.util.Objects.requireNonNull(value, "inputResolution is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaximumBitrate() {
        return software.amazon.jsii.Kernel.get(this, "maximumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaximumBitrate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maximumBitrate", java.util.Objects.requireNonNull(value, "maximumBitrate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputSpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputSpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
