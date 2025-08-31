package imports.aws.eks_node_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.161Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksNodeGroup.EksNodeGroupUpdateConfigOutputReference")
public class EksNodeGroupUpdateConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksNodeGroupUpdateConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksNodeGroupUpdateConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksNodeGroupUpdateConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxUnavailable() {
        software.amazon.jsii.Kernel.call(this, "resetMaxUnavailable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxUnavailablePercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMaxUnavailablePercentage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxUnavailableInput() {
        return software.amazon.jsii.Kernel.get(this, "maxUnavailableInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxUnavailablePercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxUnavailablePercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxUnavailable() {
        return software.amazon.jsii.Kernel.get(this, "maxUnavailable", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxUnavailable(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxUnavailable", java.util.Objects.requireNonNull(value, "maxUnavailable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxUnavailablePercentage() {
        return software.amazon.jsii.Kernel.get(this, "maxUnavailablePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxUnavailablePercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxUnavailablePercentage", java.util.Objects.requireNonNull(value, "maxUnavailablePercentage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupUpdateConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupUpdateConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupUpdateConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
