package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceRefreshOutputReference")
public class AutoscalingGroupInstanceRefreshOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupInstanceRefreshOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupInstanceRefreshOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupInstanceRefreshOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPreferences(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences value) {
        software.amazon.jsii.Kernel.call(this, "putPreferences", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPreferences() {
        software.amazon.jsii.Kernel.call(this, "resetPreferences", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTriggers() {
        software.amazon.jsii.Kernel.call(this, "resetTriggers", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesOutputReference getPreferences() {
        return software.amazon.jsii.Kernel.get(this, "preferences", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences getPreferencesInput() {
        return software.amazon.jsii.Kernel.get(this, "preferencesInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferences.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "strategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTriggersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "triggersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStrategy() {
        return software.amazon.jsii.Kernel.get(this, "strategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "strategy", java.util.Objects.requireNonNull(value, "strategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTriggers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTriggers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "triggers", java.util.Objects.requireNonNull(value, "triggers is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefresh value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
