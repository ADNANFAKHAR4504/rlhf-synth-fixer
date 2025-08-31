package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference")
public class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putInstanceRequirements(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceRequirements", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplateSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplateSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInstanceRequirements() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceRequirements", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplateSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplateSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeightedCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetWeightedCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference getInstanceRequirements() {
        return software.amazon.jsii.Kernel.get(this, "instanceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference getLaunchTemplateSpecification() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements getInstanceRequirementsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceRequirementsInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification getLaunchTemplateSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWeightedCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "weightedCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWeightedCapacity() {
        return software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWeightedCapacity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "weightedCapacity", java.util.Objects.requireNonNull(value, "weightedCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
