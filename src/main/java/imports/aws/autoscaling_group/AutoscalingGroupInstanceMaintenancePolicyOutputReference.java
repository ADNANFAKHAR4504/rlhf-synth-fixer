package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceMaintenancePolicyOutputReference")
public class AutoscalingGroupInstanceMaintenancePolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupInstanceMaintenancePolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupInstanceMaintenancePolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupInstanceMaintenancePolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxHealthyPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxHealthyPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinHealthyPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "minHealthyPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceMaintenancePolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
