package imports.aws.config_configuration_recorder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.371Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupOutputReference")
public class ConfigConfigurationRecorderRecordingGroupOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigurationRecorderRecordingGroupOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigurationRecorderRecordingGroupOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigurationRecorderRecordingGroupOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putExclusionByResourceTypes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes> __cast_cd4240 = (java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExclusionByResourceTypes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRecordingStrategy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy> __cast_cd4240 = (java.util.List<imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecordingStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllSupported() {
        software.amazon.jsii.Kernel.call(this, "resetAllSupported", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExclusionByResourceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetExclusionByResourceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeGlobalResourceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeGlobalResourceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordingStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetRecordingStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList getExclusionByResourceTypes() {
        return software.amazon.jsii.Kernel.get(this, "exclusionByResourceTypes", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategyList getRecordingStrategy() {
        return software.amazon.jsii.Kernel.get(this, "recordingStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategyList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllSupportedInput() {
        return software.amazon.jsii.Kernel.get(this, "allSupportedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExclusionByResourceTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "exclusionByResourceTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeGlobalResourceTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "includeGlobalResourceTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecordingStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "recordingStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllSupported() {
        return software.amazon.jsii.Kernel.get(this, "allSupported", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllSupported(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allSupported", java.util.Objects.requireNonNull(value, "allSupported is required"));
    }

    public void setAllSupported(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allSupported", java.util.Objects.requireNonNull(value, "allSupported is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeGlobalResourceTypes() {
        return software.amazon.jsii.Kernel.get(this, "includeGlobalResourceTypes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeGlobalResourceTypes(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeGlobalResourceTypes", java.util.Objects.requireNonNull(value, "includeGlobalResourceTypes is required"));
    }

    public void setIncludeGlobalResourceTypes(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeGlobalResourceTypes", java.util.Objects.requireNonNull(value, "includeGlobalResourceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resourceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTypes", java.util.Objects.requireNonNull(value, "resourceTypes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroup getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroup.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_configuration_recorder.ConfigConfigurationRecorderRecordingGroup value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
