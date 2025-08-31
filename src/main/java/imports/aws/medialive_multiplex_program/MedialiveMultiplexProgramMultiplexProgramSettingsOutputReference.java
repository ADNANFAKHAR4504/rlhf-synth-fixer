package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsOutputReference")
public class MedialiveMultiplexProgramMultiplexProgramSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveMultiplexProgramMultiplexProgramSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveMultiplexProgramMultiplexProgramSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveMultiplexProgramMultiplexProgramSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putServiceDescriptor(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor> __cast_cd4240 = (java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putServiceDescriptor", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVideoSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings> __cast_cd4240 = (java.util.List<imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVideoSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetServiceDescriptor() {
        software.amazon.jsii.Kernel.call(this, "resetServiceDescriptor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoSettings() {
        software.amazon.jsii.Kernel.call(this, "resetVideoSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptorList getServiceDescriptor() {
        return software.amazon.jsii.Kernel.get(this, "serviceDescriptor", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptorList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsList getVideoSettings() {
        return software.amazon.jsii.Kernel.get(this, "videoSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredChannelPipelineInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredChannelPipelineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProgramNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "programNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getServiceDescriptorInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceDescriptorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVideoSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "videoSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredChannelPipeline() {
        return software.amazon.jsii.Kernel.get(this, "preferredChannelPipeline", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredChannelPipeline(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredChannelPipeline", java.util.Objects.requireNonNull(value, "preferredChannelPipeline is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProgramNumber() {
        return software.amazon.jsii.Kernel.get(this, "programNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProgramNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "programNumber", java.util.Objects.requireNonNull(value, "programNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
