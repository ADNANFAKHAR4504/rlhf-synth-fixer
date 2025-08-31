package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsOutputReference")
public class EvidentlyLaunchScheduledSplitsConfigStepsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EvidentlyLaunchScheduledSplitsConfigStepsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EvidentlyLaunchScheduledSplitsConfigStepsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public EvidentlyLaunchScheduledSplitsConfigStepsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putSegmentOverrides(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides> __cast_cd4240 = (java.util.List<imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSegmentOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSegmentOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList getSegmentOverrides() {
        return software.amazon.jsii.Kernel.get(this, "segmentOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverridesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Number> getGroupWeightsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "groupWeightsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSegmentOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentOverridesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "startTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> getGroupWeights() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "groupWeights", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setGroupWeights(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "groupWeights", java.util.Objects.requireNonNull(value, "groupWeights is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartTime() {
        return software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startTime", java.util.Objects.requireNonNull(value, "startTime is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigSteps value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
