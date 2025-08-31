package imports.aws.lb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroupTargetHealthStateOutputReference")
public class LbTargetGroupTargetHealthStateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbTargetGroupTargetHealthStateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbTargetGroupTargetHealthStateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LbTargetGroupTargetHealthStateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetUnhealthyDrainingInterval() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyDrainingInterval", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableUnhealthyConnectionTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableUnhealthyConnectionTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyDrainingIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyDrainingIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableUnhealthyConnectionTermination() {
        return software.amazon.jsii.Kernel.get(this, "enableUnhealthyConnectionTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableUnhealthyConnectionTermination(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableUnhealthyConnectionTermination", java.util.Objects.requireNonNull(value, "enableUnhealthyConnectionTermination is required"));
    }

    public void setEnableUnhealthyConnectionTermination(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableUnhealthyConnectionTermination", java.util.Objects.requireNonNull(value, "enableUnhealthyConnectionTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnhealthyDrainingInterval() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyDrainingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnhealthyDrainingInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unhealthyDrainingInterval", java.util.Objects.requireNonNull(value, "unhealthyDrainingInterval is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetHealthState value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
