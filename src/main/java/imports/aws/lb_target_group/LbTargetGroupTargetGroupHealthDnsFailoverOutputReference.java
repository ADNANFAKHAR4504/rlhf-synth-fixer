package imports.aws.lb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.535Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroupTargetGroupHealthDnsFailoverOutputReference")
public class LbTargetGroupTargetGroupHealthDnsFailoverOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbTargetGroupTargetGroupHealthDnsFailoverOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbTargetGroupTargetGroupHealthDnsFailoverOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LbTargetGroupTargetGroupHealthDnsFailoverOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMinimumHealthyTargetsCount() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumHealthyTargetsCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumHealthyTargetsPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumHealthyTargetsPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinimumHealthyTargetsCountInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsCountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMinimumHealthyTargetsPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinimumHealthyTargetsCount() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsCount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinimumHealthyTargetsCount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minimumHealthyTargetsCount", java.util.Objects.requireNonNull(value, "minimumHealthyTargetsCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinimumHealthyTargetsPercentage() {
        return software.amazon.jsii.Kernel.get(this, "minimumHealthyTargetsPercentage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMinimumHealthyTargetsPercentage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "minimumHealthyTargetsPercentage", java.util.Objects.requireNonNull(value, "minimumHealthyTargetsPercentage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
