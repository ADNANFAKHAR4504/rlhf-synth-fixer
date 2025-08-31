package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterOutpostConfigOutputReference")
public class EksClusterOutpostConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterOutpostConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterOutpostConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterOutpostConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putControlPlanePlacement(final @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement value) {
        software.amazon.jsii.Kernel.call(this, "putControlPlanePlacement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetControlPlanePlacement() {
        software.amazon.jsii.Kernel.call(this, "resetControlPlanePlacement", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacementOutputReference getControlPlanePlacement() {
        return software.amazon.jsii.Kernel.get(this, "controlPlanePlacement", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacementOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getControlPlaneInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "controlPlaneInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement getControlPlanePlacementInput() {
        return software.amazon.jsii.Kernel.get(this, "controlPlanePlacementInput", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOutpostArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "outpostArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getControlPlaneInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "controlPlaneInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setControlPlaneInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "controlPlaneInstanceType", java.util.Objects.requireNonNull(value, "controlPlaneInstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOutpostArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "outpostArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOutpostArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "outpostArns", java.util.Objects.requireNonNull(value, "outpostArns is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
