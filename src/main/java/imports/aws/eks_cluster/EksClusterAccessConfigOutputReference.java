package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.152Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterAccessConfigOutputReference")
public class EksClusterAccessConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EksClusterAccessConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EksClusterAccessConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EksClusterAccessConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAuthenticationMode() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBootstrapClusterCreatorAdminPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetBootstrapClusterCreatorAdminPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapClusterCreatorAdminPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapClusterCreatorAdminPermissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationMode() {
        return software.amazon.jsii.Kernel.get(this, "authenticationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationMode", java.util.Objects.requireNonNull(value, "authenticationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBootstrapClusterCreatorAdminPermissions() {
        return software.amazon.jsii.Kernel.get(this, "bootstrapClusterCreatorAdminPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBootstrapClusterCreatorAdminPermissions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bootstrapClusterCreatorAdminPermissions", java.util.Objects.requireNonNull(value, "bootstrapClusterCreatorAdminPermissions is required"));
    }

    public void setBootstrapClusterCreatorAdminPermissions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bootstrapClusterCreatorAdminPermissions", java.util.Objects.requireNonNull(value, "bootstrapClusterCreatorAdminPermissions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterAccessConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterAccessConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterAccessConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
