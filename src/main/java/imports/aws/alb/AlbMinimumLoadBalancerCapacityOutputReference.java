package imports.aws.alb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.904Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.alb.AlbMinimumLoadBalancerCapacityOutputReference")
public class AlbMinimumLoadBalancerCapacityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbMinimumLoadBalancerCapacityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbMinimumLoadBalancerCapacityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AlbMinimumLoadBalancerCapacityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "capacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "capacityUnits", java.util.Objects.requireNonNull(value, "capacityUnits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb.AlbMinimumLoadBalancerCapacity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.alb.AlbMinimumLoadBalancerCapacity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb.AlbMinimumLoadBalancerCapacity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
