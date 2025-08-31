package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelDestinationsMultiplexSettingsOutputReference")
public class MedialiveChannelDestinationsMultiplexSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelDestinationsMultiplexSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelDestinationsMultiplexSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelDestinationsMultiplexSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMultiplexIdInput() {
        return software.amazon.jsii.Kernel.get(this, "multiplexIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgramNameInput() {
        return software.amazon.jsii.Kernel.get(this, "programNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMultiplexId() {
        return software.amazon.jsii.Kernel.get(this, "multiplexId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMultiplexId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "multiplexId", java.util.Objects.requireNonNull(value, "multiplexId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgramName() {
        return software.amazon.jsii.Kernel.get(this, "programName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgramName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "programName", java.util.Objects.requireNonNull(value, "programName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
