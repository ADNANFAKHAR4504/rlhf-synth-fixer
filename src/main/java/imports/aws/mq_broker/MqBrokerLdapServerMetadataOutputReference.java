package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerLdapServerMetadataOutputReference")
public class MqBrokerLdapServerMetadataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MqBrokerLdapServerMetadataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MqBrokerLdapServerMetadataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MqBrokerLdapServerMetadataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHosts() {
        software.amazon.jsii.Kernel.call(this, "resetHosts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleBase() {
        software.amazon.jsii.Kernel.call(this, "resetRoleBase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleSearchMatching() {
        software.amazon.jsii.Kernel.call(this, "resetRoleSearchMatching", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleSearchSubtree() {
        software.amazon.jsii.Kernel.call(this, "resetRoleSearchSubtree", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccountPassword() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccountPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccountUsername() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccountUsername", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserBase() {
        software.amazon.jsii.Kernel.call(this, "resetUserBase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetUserRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserSearchMatching() {
        software.amazon.jsii.Kernel.call(this, "resetUserSearchMatching", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserSearchSubtree() {
        software.amazon.jsii.Kernel.call(this, "resetUserSearchSubtree", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHostsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "hostsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleBaseInput() {
        return software.amazon.jsii.Kernel.get(this, "roleBaseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "roleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleSearchMatchingInput() {
        return software.amazon.jsii.Kernel.get(this, "roleSearchMatchingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRoleSearchSubtreeInput() {
        return software.amazon.jsii.Kernel.get(this, "roleSearchSubtreeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserBaseInput() {
        return software.amazon.jsii.Kernel.get(this, "userBaseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "userRoleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserSearchMatchingInput() {
        return software.amazon.jsii.Kernel.get(this, "userSearchMatchingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserSearchSubtreeInput() {
        return software.amazon.jsii.Kernel.get(this, "userSearchSubtreeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHosts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "hosts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHosts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "hosts", java.util.Objects.requireNonNull(value, "hosts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleBase() {
        return software.amazon.jsii.Kernel.get(this, "roleBase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleBase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleBase", java.util.Objects.requireNonNull(value, "roleBase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleName() {
        return software.amazon.jsii.Kernel.get(this, "roleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleName", java.util.Objects.requireNonNull(value, "roleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleSearchMatching() {
        return software.amazon.jsii.Kernel.get(this, "roleSearchMatching", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleSearchMatching(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleSearchMatching", java.util.Objects.requireNonNull(value, "roleSearchMatching is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRoleSearchSubtree() {
        return software.amazon.jsii.Kernel.get(this, "roleSearchSubtree", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRoleSearchSubtree(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "roleSearchSubtree", java.util.Objects.requireNonNull(value, "roleSearchSubtree is required"));
    }

    public void setRoleSearchSubtree(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "roleSearchSubtree", java.util.Objects.requireNonNull(value, "roleSearchSubtree is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccountPassword() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccountPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccountPassword", java.util.Objects.requireNonNull(value, "serviceAccountPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccountUsername() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccountUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccountUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccountUsername", java.util.Objects.requireNonNull(value, "serviceAccountUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserBase() {
        return software.amazon.jsii.Kernel.get(this, "userBase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserBase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userBase", java.util.Objects.requireNonNull(value, "userBase is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserRoleName() {
        return software.amazon.jsii.Kernel.get(this, "userRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userRoleName", java.util.Objects.requireNonNull(value, "userRoleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserSearchMatching() {
        return software.amazon.jsii.Kernel.get(this, "userSearchMatching", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserSearchMatching(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userSearchMatching", java.util.Objects.requireNonNull(value, "userSearchMatching is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUserSearchSubtree() {
        return software.amazon.jsii.Kernel.get(this, "userSearchSubtree", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUserSearchSubtree(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "userSearchSubtree", java.util.Objects.requireNonNull(value, "userSearchSubtree is required"));
    }

    public void setUserSearchSubtree(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "userSearchSubtree", java.util.Objects.requireNonNull(value, "userSearchSubtree is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLdapServerMetadata getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLdapServerMetadata.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLdapServerMetadata value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
