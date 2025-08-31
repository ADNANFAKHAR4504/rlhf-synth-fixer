package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferencesOutputReference")
public class AutoscalingGroupInstanceRefreshPreferencesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupInstanceRefreshPreferencesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupInstanceRefreshPreferencesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupInstanceRefreshPreferencesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAlarmSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putAlarmSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlarmSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoRollback() {
        software.amazon.jsii.Kernel.call(this, "resetAutoRollback", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCheckpointDelay() {
        software.amazon.jsii.Kernel.call(this, "resetCheckpointDelay", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCheckpointPercentages() {
        software.amazon.jsii.Kernel.call(this, "resetCheckpointPercentages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceWarmup() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceWarmup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxHealthyPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMaxHealthyPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinHealthyPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMinHealthyPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScaleInProtectedInstances() {
        software.amazon.jsii.Kernel.call(this, "resetScaleInProtectedInstances", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipMatching() {
        software.amazon.jsii.Kernel.call(this, "resetSkipMatching", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStandbyInstances() {
        software.amazon.jsii.Kernel.call(this, "resetStandbyInstances", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference getAlarmSpecification() {
        return software.amazon.jsii.Kernel.get(this, "alarmSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification getAlarmSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoRollbackInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRollbackInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCheckpointDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "checkpointDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getCheckpointPercentagesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "checkpointPercentagesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceWarmupInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceWarmupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxHealthyPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxHealthyPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinHealthyPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "minHealthyPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScaleInProtectedInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "scaleInProtectedInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipMatchingInput() {
        return software.amazon.jsii.Kernel.get(this, "skipMatchingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStandbyInstancesInput() {
        return software.amazon.jsii.Kernel.get(this, "standbyInstancesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoRollback() {
        return software.amazon.jsii.Kernel.get(this, "autoRollback", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoRollback(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoRollback", java.util.Objects.requireNonNull(value, "autoRollback is required"));
    }

    public void setAutoRollback(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoRollback", java.util.Objects.requireNonNull(value, "autoRollback is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCheckpointDelay() {
        return software.amazon.jsii.Kernel.get(this, "checkpointDelay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCheckpointDelay(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "checkpointDelay", java.util.Objects.requireNonNull(value, "checkpointDelay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getCheckpointPercentages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "checkpointPercentages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setCheckpointPercentages(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "checkpointPercentages", java.util.Objects.requireNonNull(value, "checkpointPercentages is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceWarmup() {
        return software.amazon.jsii.Kernel.get(this, "instanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceWarmup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceWarmup", java.util.Objects.requireNonNull(value, "instanceWarmup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxHealthyPercentage() {
        return software.amazon.jsii.Kernel.get(this, "maxHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxHealthyPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxHealthyPercentage", java.util.Objects.requireNonNull(value, "maxHealthyPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinHealthyPercentage() {
        return software.amazon.jsii.Kernel.get(this, "minHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinHealthyPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minHealthyPercentage", java.util.Objects.requireNonNull(value, "minHealthyPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScaleInProtectedInstances() {
        return software.amazon.jsii.Kernel.get(this, "scaleInProtectedInstances", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScaleInProtectedInstances(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scaleInProtectedInstances", java.util.Objects.requireNonNull(value, "scaleInProtectedInstances is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipMatching() {
        return software.amazon.jsii.Kernel.get(this, "skipMatching", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipMatching(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipMatching", java.util.Objects.requireNonNull(value, "skipMatching is required"));
    }

    public void setSkipMatching(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipMatching", java.util.Objects.requireNonNull(value, "skipMatching is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStandbyInstances() {
        return software.amazon.jsii.Kernel.get(this, "standbyInstances", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStandbyInstances(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "standbyInstances", java.util.Objects.requireNonNull(value, "standbyInstances is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
