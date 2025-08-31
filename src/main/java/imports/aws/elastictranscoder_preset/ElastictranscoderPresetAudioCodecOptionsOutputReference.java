package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetAudioCodecOptionsOutputReference")
public class ElastictranscoderPresetAudioCodecOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElastictranscoderPresetAudioCodecOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPresetAudioCodecOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElastictranscoderPresetAudioCodecOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBitDepth() {
        software.amazon.jsii.Kernel.call(this, "resetBitDepth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBitOrder() {
        software.amazon.jsii.Kernel.call(this, "resetBitOrder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProfile() {
        software.amazon.jsii.Kernel.call(this, "resetProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSigned() {
        software.amazon.jsii.Kernel.call(this, "resetSigned", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBitDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "bitDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBitOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "bitOrderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "profileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSignedInput() {
        return software.amazon.jsii.Kernel.get(this, "signedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBitDepth() {
        return software.amazon.jsii.Kernel.get(this, "bitDepth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBitDepth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bitDepth", java.util.Objects.requireNonNull(value, "bitDepth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBitOrder() {
        return software.amazon.jsii.Kernel.get(this, "bitOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBitOrder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bitOrder", java.util.Objects.requireNonNull(value, "bitOrder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProfile() {
        return software.amazon.jsii.Kernel.get(this, "profile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "profile", java.util.Objects.requireNonNull(value, "profile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigned() {
        return software.amazon.jsii.Kernel.get(this, "signed", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSigned(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "signed", java.util.Objects.requireNonNull(value, "signed is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
