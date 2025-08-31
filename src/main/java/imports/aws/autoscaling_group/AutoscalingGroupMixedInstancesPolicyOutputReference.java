package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyOutputReference")
public class AutoscalingGroupMixedInstancesPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupMixedInstancesPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupMixedInstancesPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupMixedInstancesPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInstancesDistribution(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution value) {
        software.amazon.jsii.Kernel.call(this, "putInstancesDistribution", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInstancesDistribution() {
        software.amazon.jsii.Kernel.call(this, "resetInstancesDistribution", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference getInstancesDistribution() {
        return software.amazon.jsii.Kernel.get(this, "instancesDistribution", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistributionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution getInstancesDistributionInput() {
        return software.amazon.jsii.Kernel.get(this, "instancesDistributionInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyInstancesDistribution.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
