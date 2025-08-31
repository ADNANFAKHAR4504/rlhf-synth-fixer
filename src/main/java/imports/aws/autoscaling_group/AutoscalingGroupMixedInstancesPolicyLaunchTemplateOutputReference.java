package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference")
public class AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AutoscalingGroupMixedInstancesPolicyLaunchTemplateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLaunchTemplateSpecification(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplateSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOverride(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOverride", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOverride() {
        software.amazon.jsii.Kernel.call(this, "resetOverride", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference getLaunchTemplateSpecification() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList getOverride() {
        return software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification getLaunchTemplateSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
