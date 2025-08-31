package imports.aws.alb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albTargetGroup.AlbTargetGroupTargetGroupHealthOutputReference")
public class AlbTargetGroupTargetGroupHealthOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbTargetGroupTargetGroupHealthOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbTargetGroupTargetGroupHealthOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AlbTargetGroupTargetGroupHealthOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDnsFailover(final @org.jetbrains.annotations.NotNull imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover value) {
        software.amazon.jsii.Kernel.call(this, "putDnsFailover", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUnhealthyStateRouting(final @org.jetbrains.annotations.NotNull imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting value) {
        software.amazon.jsii.Kernel.call(this, "putUnhealthyStateRouting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDnsFailover() {
        software.amazon.jsii.Kernel.call(this, "resetDnsFailover", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnhealthyStateRouting() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyStateRouting", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference getDnsFailover() {
        return software.amazon.jsii.Kernel.get(this, "dnsFailover", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailoverOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference getUnhealthyStateRouting() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyStateRouting", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRoutingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover getDnsFailoverInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsFailoverInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting getUnhealthyStateRoutingInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyStateRoutingInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealth getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealth.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealth value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
