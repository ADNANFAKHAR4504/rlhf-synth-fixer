package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsOutputReference")
public class MedialiveChannelEncoderSettingsVideoDescriptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsVideoDescriptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsVideoDescriptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsVideoDescriptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCodecSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCodecSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCodecSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCodecSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeight() {
        software.amazon.jsii.Kernel.call(this, "resetHeight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRespondToAfd() {
        software.amazon.jsii.Kernel.call(this, "resetRespondToAfd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetScalingBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSharpness() {
        software.amazon.jsii.Kernel.call(this, "resetSharpness", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWidth() {
        software.amazon.jsii.Kernel.call(this, "resetWidth", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsOutputReference getCodecSettings() {
        return software.amazon.jsii.Kernel.get(this, "codecSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings getCodecSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "codecSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeightInput() {
        return software.amazon.jsii.Kernel.get(this, "heightInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRespondToAfdInput() {
        return software.amazon.jsii.Kernel.get(this, "respondToAfdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScalingBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSharpnessInput() {
        return software.amazon.jsii.Kernel.get(this, "sharpnessInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWidthInput() {
        return software.amazon.jsii.Kernel.get(this, "widthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeight() {
        return software.amazon.jsii.Kernel.get(this, "height", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHeight(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "height", java.util.Objects.requireNonNull(value, "height is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRespondToAfd() {
        return software.amazon.jsii.Kernel.get(this, "respondToAfd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRespondToAfd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "respondToAfd", java.util.Objects.requireNonNull(value, "respondToAfd is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScalingBehavior() {
        return software.amazon.jsii.Kernel.get(this, "scalingBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScalingBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scalingBehavior", java.util.Objects.requireNonNull(value, "scalingBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSharpness() {
        return software.amazon.jsii.Kernel.get(this, "sharpness", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSharpness(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sharpness", java.util.Objects.requireNonNull(value, "sharpness is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWidth() {
        return software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWidth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "width", java.util.Objects.requireNonNull(value, "width is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
