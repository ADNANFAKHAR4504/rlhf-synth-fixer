package imports.aws.lb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.535Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroupTargetGroupHealthOutputReference")
public class LbTargetGroupTargetGroupHealthOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbTargetGroupTargetGroupHealthOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbTargetGroupTargetGroupHealthOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LbTargetGroupTargetGroupHealthOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDnsFailover(final @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover value) {
        software.amazon.jsii.Kernel.call(this, "putDnsFailover", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUnhealthyStateRouting(final @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthUnhealthyStateRouting value) {
        software.amazon.jsii.Kernel.call(this, "putUnhealthyStateRouting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDnsFailover() {
        software.amazon.jsii.Kernel.call(this, "resetDnsFailover", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnhealthyStateRouting() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyStateRouting", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailoverOutputReference getDnsFailover() {
        return software.amazon.jsii.Kernel.get(this, "dnsFailover", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailoverOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference getUnhealthyStateRouting() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyStateRouting", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover getDnsFailoverInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsFailoverInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthDnsFailover.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthUnhealthyStateRouting getUnhealthyStateRoutingInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyStateRoutingInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealthUnhealthyStateRouting.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
