package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettingsOutputReference")
public class MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMaximumBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPriority() {
        software.amazon.jsii.Kernel.call(this, "resetPriority", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "priorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumBitrate() {
        return software.amazon.jsii.Kernel.get(this, "maximumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumBitrate", java.util.Objects.requireNonNull(value, "maximumBitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumBitrate() {
        return software.amazon.jsii.Kernel.get(this, "minimumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumBitrate", java.util.Objects.requireNonNull(value, "minimumBitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "priority", java.util.Objects.requireNonNull(value, "priority is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
