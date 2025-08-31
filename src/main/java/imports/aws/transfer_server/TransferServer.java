package imports.aws.transfer_server;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server aws_transfer_server}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.563Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServer")
public class TransferServer extends com.hashicorp.cdktf.TerraformResource {

    protected TransferServer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferServer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.transfer_server.TransferServer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server aws_transfer_server} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public TransferServer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server aws_transfer_server} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public TransferServer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a TransferServer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TransferServer to import. This parameter is required.
     * @param importFromId The id of the existing TransferServer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the TransferServer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.transfer_server.TransferServer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a TransferServer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TransferServer to import. This parameter is required.
     * @param importFromId The id of the existing TransferServer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.transfer_server.TransferServer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEndpointDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerEndpointDetails value) {
        software.amazon.jsii.Kernel.call(this, "putEndpointDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProtocolDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerProtocolDetails value) {
        software.amazon.jsii.Kernel.call(this, "putProtocolDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3StorageOptions(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerS3StorageOptions value) {
        software.amazon.jsii.Kernel.call(this, "putS3StorageOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkflowDetails(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetails value) {
        software.amazon.jsii.Kernel.call(this, "putWorkflowDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectoryId() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomain() {
        software.amazon.jsii.Kernel.call(this, "resetDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointDetails() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointType() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetForceDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFunction() {
        software.amazon.jsii.Kernel.call(this, "resetFunction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostKey() {
        software.amazon.jsii.Kernel.call(this, "resetHostKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityProviderType() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityProviderType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInvocationRole() {
        software.amazon.jsii.Kernel.call(this, "resetInvocationRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingRole() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostAuthenticationLoginBanner() {
        software.amazon.jsii.Kernel.call(this, "resetPostAuthenticationLoginBanner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreAuthenticationLoginBanner() {
        software.amazon.jsii.Kernel.call(this, "resetPreAuthenticationLoginBanner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocolDetails() {
        software.amazon.jsii.Kernel.call(this, "resetProtocolDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocols() {
        software.amazon.jsii.Kernel.call(this, "resetProtocols", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3StorageOptions() {
        software.amazon.jsii.Kernel.call(this, "resetS3StorageOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityPolicyName() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityPolicyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSftpAuthenticationMethods() {
        software.amazon.jsii.Kernel.call(this, "resetSftpAuthenticationMethods", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStructuredLogDestinations() {
        software.amazon.jsii.Kernel.call(this, "resetStructuredLogDestinations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUrl() {
        software.amazon.jsii.Kernel.call(this, "resetUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkflowDetails() {
        software.amazon.jsii.Kernel.call(this, "resetWorkflowDetails", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerEndpointDetailsOutputReference getEndpointDetails() {
        return software.amazon.jsii.Kernel.get(this, "endpointDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerEndpointDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostKeyFingerprint() {
        return software.amazon.jsii.Kernel.get(this, "hostKeyFingerprint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerProtocolDetailsOutputReference getProtocolDetails() {
        return software.amazon.jsii.Kernel.get(this, "protocolDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerProtocolDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerS3StorageOptionsOutputReference getS3StorageOptions() {
        return software.amazon.jsii.Kernel.get(this, "s3StorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerS3StorageOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetailsOutputReference getWorkflowDetails() {
        return software.amazon.jsii.Kernel.get(this, "workflowDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryIdInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "domainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerEndpointDetails getEndpointDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerEndpointDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionInput() {
        return software.amazon.jsii.Kernel.get(this, "functionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "hostKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityProviderTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInvocationRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "invocationRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoggingRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostAuthenticationLoginBannerInput() {
        return software.amazon.jsii.Kernel.get(this, "postAuthenticationLoginBannerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreAuthenticationLoginBannerInput() {
        return software.amazon.jsii.Kernel.get(this, "preAuthenticationLoginBannerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerProtocolDetails getProtocolDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerProtocolDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProtocolsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "protocolsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerS3StorageOptions getS3StorageOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "s3StorageOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerS3StorageOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityPolicyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "securityPolicyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSftpAuthenticationMethodsInput() {
        return software.amazon.jsii.Kernel.get(this, "sftpAuthenticationMethodsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStructuredLogDestinationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "structuredLogDestinationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "urlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetails getWorkflowDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetails.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificate() {
        return software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificate", java.util.Objects.requireNonNull(value, "certificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId() {
        return software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryId", java.util.Objects.requireNonNull(value, "directoryId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domain", java.util.Objects.requireNonNull(value, "domain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointType", java.util.Objects.requireNonNull(value, "endpointType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDestroy() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunction() {
        return software.amazon.jsii.Kernel.get(this, "function", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "function", java.util.Objects.requireNonNull(value, "function is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostKey() {
        return software.amazon.jsii.Kernel.get(this, "hostKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostKey", java.util.Objects.requireNonNull(value, "hostKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityProviderType() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityProviderType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityProviderType", java.util.Objects.requireNonNull(value, "identityProviderType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvocationRole() {
        return software.amazon.jsii.Kernel.get(this, "invocationRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInvocationRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "invocationRole", java.util.Objects.requireNonNull(value, "invocationRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoggingRole() {
        return software.amazon.jsii.Kernel.get(this, "loggingRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoggingRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loggingRole", java.util.Objects.requireNonNull(value, "loggingRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostAuthenticationLoginBanner() {
        return software.amazon.jsii.Kernel.get(this, "postAuthenticationLoginBanner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostAuthenticationLoginBanner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postAuthenticationLoginBanner", java.util.Objects.requireNonNull(value, "postAuthenticationLoginBanner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreAuthenticationLoginBanner() {
        return software.amazon.jsii.Kernel.get(this, "preAuthenticationLoginBanner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreAuthenticationLoginBanner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preAuthenticationLoginBanner", java.util.Objects.requireNonNull(value, "preAuthenticationLoginBanner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProtocols() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setProtocols(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "protocols", java.util.Objects.requireNonNull(value, "protocols is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityPolicyName() {
        return software.amazon.jsii.Kernel.get(this, "securityPolicyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityPolicyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityPolicyName", java.util.Objects.requireNonNull(value, "securityPolicyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSftpAuthenticationMethods() {
        return software.amazon.jsii.Kernel.get(this, "sftpAuthenticationMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSftpAuthenticationMethods(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sftpAuthenticationMethods", java.util.Objects.requireNonNull(value, "sftpAuthenticationMethods is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStructuredLogDestinations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "structuredLogDestinations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStructuredLogDestinations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "structuredLogDestinations", java.util.Objects.requireNonNull(value, "structuredLogDestinations is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "url", java.util.Objects.requireNonNull(value, "url is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.transfer_server.TransferServer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.transfer_server.TransferServer> {
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
        private imports.aws.transfer_server.TransferServerConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.
         * <p>
         * @return {@code this}
         * @param certificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}. This parameter is required.
         */
        public Builder certificate(final java.lang.String certificate) {
            this.config().certificate(certificate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.
         * <p>
         * @return {@code this}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}. This parameter is required.
         */
        public Builder directoryId(final java.lang.String directoryId) {
            this.config().directoryId(directoryId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.
         * <p>
         * @return {@code this}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}. This parameter is required.
         */
        public Builder domain(final java.lang.String domain) {
            this.config().domain(domain);
            return this;
        }

        /**
         * endpoint_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
         * <p>
         * @return {@code this}
         * @param endpointDetails endpoint_details block. This parameter is required.
         */
        public Builder endpointDetails(final imports.aws.transfer_server.TransferServerEndpointDetails endpointDetails) {
            this.config().endpointDetails(endpointDetails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.
         * <p>
         * @return {@code this}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}. This parameter is required.
         */
        public Builder endpointType(final java.lang.String endpointType) {
            this.config().endpointType(endpointType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.
         * <p>
         * @return {@code this}
         * @param function Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}. This parameter is required.
         */
        public Builder function(final java.lang.String function) {
            this.config().function(function);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.
         * <p>
         * @return {@code this}
         * @param hostKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}. This parameter is required.
         */
        public Builder hostKey(final java.lang.String hostKey) {
            this.config().hostKey(hostKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.
         * <p>
         * @return {@code this}
         * @param identityProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}. This parameter is required.
         */
        public Builder identityProviderType(final java.lang.String identityProviderType) {
            this.config().identityProviderType(identityProviderType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.
         * <p>
         * @return {@code this}
         * @param invocationRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}. This parameter is required.
         */
        public Builder invocationRole(final java.lang.String invocationRole) {
            this.config().invocationRole(invocationRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.
         * <p>
         * @return {@code this}
         * @param loggingRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}. This parameter is required.
         */
        public Builder loggingRole(final java.lang.String loggingRole) {
            this.config().loggingRole(loggingRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.
         * <p>
         * @return {@code this}
         * @param postAuthenticationLoginBanner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}. This parameter is required.
         */
        public Builder postAuthenticationLoginBanner(final java.lang.String postAuthenticationLoginBanner) {
            this.config().postAuthenticationLoginBanner(postAuthenticationLoginBanner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.
         * <p>
         * @return {@code this}
         * @param preAuthenticationLoginBanner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}. This parameter is required.
         */
        public Builder preAuthenticationLoginBanner(final java.lang.String preAuthenticationLoginBanner) {
            this.config().preAuthenticationLoginBanner(preAuthenticationLoginBanner);
            return this;
        }

        /**
         * protocol_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
         * <p>
         * @return {@code this}
         * @param protocolDetails protocol_details block. This parameter is required.
         */
        public Builder protocolDetails(final imports.aws.transfer_server.TransferServerProtocolDetails protocolDetails) {
            this.config().protocolDetails(protocolDetails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.
         * <p>
         * @return {@code this}
         * @param protocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}. This parameter is required.
         */
        public Builder protocols(final java.util.List<java.lang.String> protocols) {
            this.config().protocols(protocols);
            return this;
        }

        /**
         * s3_storage_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
         * <p>
         * @return {@code this}
         * @param s3StorageOptions s3_storage_options block. This parameter is required.
         */
        public Builder s3StorageOptions(final imports.aws.transfer_server.TransferServerS3StorageOptions s3StorageOptions) {
            this.config().s3StorageOptions(s3StorageOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.
         * <p>
         * @return {@code this}
         * @param securityPolicyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}. This parameter is required.
         */
        public Builder securityPolicyName(final java.lang.String securityPolicyName) {
            this.config().securityPolicyName(securityPolicyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.
         * <p>
         * @return {@code this}
         * @param sftpAuthenticationMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}. This parameter is required.
         */
        public Builder sftpAuthenticationMethods(final java.lang.String sftpAuthenticationMethods) {
            this.config().sftpAuthenticationMethods(sftpAuthenticationMethods);
            return this;
        }

        /**
         * This is a set of arns of destinations that will receive structured logs from the transfer server.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
         * <p>
         * @return {@code this}
         * @param structuredLogDestinations This is a set of arns of destinations that will receive structured logs from the transfer server. This parameter is required.
         */
        public Builder structuredLogDestinations(final java.util.List<java.lang.String> structuredLogDestinations) {
            this.config().structuredLogDestinations(structuredLogDestinations);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.
         * <p>
         * @return {@code this}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}. This parameter is required.
         */
        public Builder url(final java.lang.String url) {
            this.config().url(url);
            return this;
        }

        /**
         * workflow_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
         * <p>
         * @return {@code this}
         * @param workflowDetails workflow_details block. This parameter is required.
         */
        public Builder workflowDetails(final imports.aws.transfer_server.TransferServerWorkflowDetails workflowDetails) {
            this.config().workflowDetails(workflowDetails);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.transfer_server.TransferServer}.
         */
        @Override
        public imports.aws.transfer_server.TransferServer build() {
            return new imports.aws.transfer_server.TransferServer(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.transfer_server.TransferServerConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.transfer_server.TransferServerConfig.Builder();
            }
            return this.config;
        }
    }
}
