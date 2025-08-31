package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterKerberosAttributesOutputReference")
public class EmrClusterKerberosAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EmrClusterKerberosAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrClusterKerberosAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EmrClusterKerberosAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAdDomainJoinPassword() {
        software.amazon.jsii.Kernel.call(this, "resetAdDomainJoinPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdDomainJoinUser() {
        software.amazon.jsii.Kernel.call(this, "resetAdDomainJoinUser", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrossRealmTrustPrincipalPassword() {
        software.amazon.jsii.Kernel.call(this, "resetCrossRealmTrustPrincipalPassword", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdDomainJoinPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "adDomainJoinPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdDomainJoinUserInput() {
        return software.amazon.jsii.Kernel.get(this, "adDomainJoinUserInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCrossRealmTrustPrincipalPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "crossRealmTrustPrincipalPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKdcAdminPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "kdcAdminPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRealmInput() {
        return software.amazon.jsii.Kernel.get(this, "realmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdDomainJoinPassword() {
        return software.amazon.jsii.Kernel.get(this, "adDomainJoinPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdDomainJoinPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adDomainJoinPassword", java.util.Objects.requireNonNull(value, "adDomainJoinPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdDomainJoinUser() {
        return software.amazon.jsii.Kernel.get(this, "adDomainJoinUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdDomainJoinUser(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adDomainJoinUser", java.util.Objects.requireNonNull(value, "adDomainJoinUser is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCrossRealmTrustPrincipalPassword() {
        return software.amazon.jsii.Kernel.get(this, "crossRealmTrustPrincipalPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCrossRealmTrustPrincipalPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "crossRealmTrustPrincipalPassword", java.util.Objects.requireNonNull(value, "crossRealmTrustPrincipalPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKdcAdminPassword() {
        return software.amazon.jsii.Kernel.get(this, "kdcAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKdcAdminPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kdcAdminPassword", java.util.Objects.requireNonNull(value, "kdcAdminPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRealm() {
        return software.amazon.jsii.Kernel.get(this, "realm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRealm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "realm", java.util.Objects.requireNonNull(value, "realm is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterKerberosAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterKerberosAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterKerberosAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
