package imports.aws.workspaces_directory;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory aws_workspaces_directory}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.682Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectory")
public class WorkspacesDirectory extends com.hashicorp.cdktf.TerraformResource {

    protected WorkspacesDirectory(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorkspacesDirectory(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.workspaces_directory.WorkspacesDirectory.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory aws_workspaces_directory} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public WorkspacesDirectory(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory aws_workspaces_directory} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public WorkspacesDirectory(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a WorkspacesDirectory resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorkspacesDirectory to import. This parameter is required.
     * @param importFromId The id of the existing WorkspacesDirectory that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the WorkspacesDirectory to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.workspaces_directory.WorkspacesDirectory.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a WorkspacesDirectory resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorkspacesDirectory to import. This parameter is required.
     * @param importFromId The id of the existing WorkspacesDirectory that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.workspaces_directory.WorkspacesDirectory.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putActiveDirectoryConfig(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig value) {
        software.amazon.jsii.Kernel.call(this, "putActiveDirectoryConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCertificateBasedAuthProperties(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties value) {
        software.amazon.jsii.Kernel.call(this, "putCertificateBasedAuthProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSamlProperties(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties value) {
        software.amazon.jsii.Kernel.call(this, "putSamlProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSelfServicePermissions(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions value) {
        software.amazon.jsii.Kernel.call(this, "putSelfServicePermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkspaceAccessProperties(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties value) {
        software.amazon.jsii.Kernel.call(this, "putWorkspaceAccessProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkspaceCreationProperties(final @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties value) {
        software.amazon.jsii.Kernel.call(this, "putWorkspaceCreationProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActiveDirectoryConfig() {
        software.amazon.jsii.Kernel.call(this, "resetActiveDirectoryConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateBasedAuthProperties() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateBasedAuthProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetIpGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSamlProperties() {
        software.amazon.jsii.Kernel.call(this, "resetSamlProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfServicePermissions() {
        software.amazon.jsii.Kernel.call(this, "resetSelfServicePermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetIds() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserIdentityType() {
        software.amazon.jsii.Kernel.call(this, "resetUserIdentityType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceAccessProperties() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceAccessProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceCreationProperties() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceCreationProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceDirectoryDescription() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceDirectoryDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceDirectoryName() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceDirectoryName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkspaceType() {
        software.amazon.jsii.Kernel.call(this, "resetWorkspaceType", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfigOutputReference getActiveDirectoryConfig() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryConfig", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlias() {
        return software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference getCertificateBasedAuthProperties() {
        return software.amazon.jsii.Kernel.get(this, "certificateBasedAuthProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerUserName() {
        return software.amazon.jsii.Kernel.get(this, "customerUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryName() {
        return software.amazon.jsii.Kernel.get(this, "directoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryType() {
        return software.amazon.jsii.Kernel.get(this, "directoryType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDnsIpAddresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dnsIpAddresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleId() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrationCode() {
        return software.amazon.jsii.Kernel.get(this, "registrationCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectorySamlPropertiesOutputReference getSamlProperties() {
        return software.amazon.jsii.Kernel.get(this, "samlProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySamlPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissionsOutputReference getSelfServicePermissions() {
        return software.amazon.jsii.Kernel.get(this, "selfServicePermissions", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference getWorkspaceAccessProperties() {
        return software.amazon.jsii.Kernel.get(this, "workspaceAccessProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference getWorkspaceCreationProperties() {
        return software.amazon.jsii.Kernel.get(this, "workspaceCreationProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "workspaceSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig getActiveDirectoryConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties getCertificateBasedAuthPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateBasedAuthPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties getSamlPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "samlPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions getSelfServicePermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "selfServicePermissionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserIdentityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "userIdentityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties getWorkspaceAccessPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceAccessPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties getWorkspaceCreationPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceCreationPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceDirectoryDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceDirectoryDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceDirectoryNameInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceDirectoryNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipGroupIds", java.util.Objects.requireNonNull(value, "ipGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserIdentityType() {
        return software.amazon.jsii.Kernel.get(this, "userIdentityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserIdentityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userIdentityType", java.util.Objects.requireNonNull(value, "userIdentityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceDirectoryDescription() {
        return software.amazon.jsii.Kernel.get(this, "workspaceDirectoryDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkspaceDirectoryDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workspaceDirectoryDescription", java.util.Objects.requireNonNull(value, "workspaceDirectoryDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceDirectoryName() {
        return software.amazon.jsii.Kernel.get(this, "workspaceDirectoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkspaceDirectoryName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workspaceDirectoryName", java.util.Objects.requireNonNull(value, "workspaceDirectoryName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceType() {
        return software.amazon.jsii.Kernel.get(this, "workspaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkspaceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workspaceType", java.util.Objects.requireNonNull(value, "workspaceType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.workspaces_directory.WorkspacesDirectory}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.workspaces_directory.WorkspacesDirectory> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.workspaces_directory.WorkspacesDirectoryConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * active_directory_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
         * <p>
         * @return {@code this}
         * @param activeDirectoryConfig active_directory_config block. This parameter is required.
         */
        public Builder activeDirectoryConfig(final imports.aws.workspaces_directory.WorkspacesDirectoryActiveDirectoryConfig activeDirectoryConfig) {
            this.config().activeDirectoryConfig(activeDirectoryConfig);
            return this;
        }

        /**
         * certificate_based_auth_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
         * <p>
         * @return {@code this}
         * @param certificateBasedAuthProperties certificate_based_auth_properties block. This parameter is required.
         */
        public Builder certificateBasedAuthProperties(final imports.aws.workspaces_directory.WorkspacesDirectoryCertificateBasedAuthProperties certificateBasedAuthProperties) {
            this.config().certificateBasedAuthProperties(certificateBasedAuthProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config().directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.
         * <p>
         * @return {@code this}
         * @param ipGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}. This parameter is required.
         */
        public Builder ipGroupIds(final java.util.List<java.lang.String> ipGroupIds) {
            this.config().ipGroupIds(ipGroupIds);
            return this;
        }

        /**
         * saml_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
         * <p>
         * @return {@code this}
         * @param samlProperties saml_properties block. This parameter is required.
         */
        public Builder samlProperties(final imports.aws.workspaces_directory.WorkspacesDirectorySamlProperties samlProperties) {
            this.config().samlProperties(samlProperties);
            return this;
        }

        /**
         * self_service_permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
         * <p>
         * @return {@code this}
         * @param selfServicePermissions self_service_permissions block. This parameter is required.
         */
        public Builder selfServicePermissions(final imports.aws.workspaces_directory.WorkspacesDirectorySelfServicePermissions selfServicePermissions) {
            this.config().selfServicePermissions(selfServicePermissions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config().subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.
         * <p>
         * @return {@code this}
         * @param userIdentityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}. This parameter is required.
         */
        public Builder userIdentityType(final java.lang.String userIdentityType) {
            this.config().userIdentityType(userIdentityType);
            return this;
        }

        /**
         * workspace_access_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
         * <p>
         * @return {@code this}
         * @param workspaceAccessProperties workspace_access_properties block. This parameter is required.
         */
        public Builder workspaceAccessProperties(final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceAccessProperties workspaceAccessProperties) {
            this.config().workspaceAccessProperties(workspaceAccessProperties);
            return this;
        }

        /**
         * workspace_creation_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
         * <p>
         * @return {@code this}
         * @param workspaceCreationProperties workspace_creation_properties block. This parameter is required.
         */
        public Builder workspaceCreationProperties(final imports.aws.workspaces_directory.WorkspacesDirectoryWorkspaceCreationProperties workspaceCreationProperties) {
            this.config().workspaceCreationProperties(workspaceCreationProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.
         * <p>
         * @return {@code this}
         * @param workspaceDirectoryDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}. This parameter is required.
         */
        public Builder workspaceDirectoryDescription(final java.lang.String workspaceDirectoryDescription) {
            this.config().workspaceDirectoryDescription(workspaceDirectoryDescription);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.
         * <p>
         * @return {@code this}
         * @param workspaceDirectoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}. This parameter is required.
         */
        public Builder workspaceDirectoryName(final java.lang.String workspaceDirectoryName) {
            this.config().workspaceDirectoryName(workspaceDirectoryName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.
         * <p>
         * @return {@code this}
         * @param workspaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}. This parameter is required.
         */
        public Builder workspaceType(final java.lang.String workspaceType) {
            this.config().workspaceType(workspaceType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.workspaces_directory.WorkspacesDirectory}.
         */
        @Override
        public imports.aws.workspaces_directory.WorkspacesDirectory build() {
            return new imports.aws.workspaces_directory.WorkspacesDirectory(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.workspaces_directory.WorkspacesDirectoryConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.workspaces_directory.WorkspacesDirectoryConfig.Builder();
            }
            return this.config;
        }
    }
}
