package imports.aws.storagegateway_nfs_file_share;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share aws_storagegateway_nfs_file_share}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayNfsFileShare.StoragegatewayNfsFileShare")
public class StoragegatewayNfsFileShare extends com.hashicorp.cdktf.TerraformResource {

    protected StoragegatewayNfsFileShare(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayNfsFileShare(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share aws_storagegateway_nfs_file_share} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public StoragegatewayNfsFileShare(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayNfsFileShare resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayNfsFileShare to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayNfsFileShare that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the StoragegatewayNfsFileShare to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayNfsFileShare resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayNfsFileShare to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayNfsFileShare that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCacheAttributes(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes value) {
        software.amazon.jsii.Kernel.call(this, "putCacheAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNfsFileShareDefaults(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults value) {
        software.amazon.jsii.Kernel.call(this, "putNfsFileShareDefaults", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuditDestinationArn() {
        software.amazon.jsii.Kernel.call(this, "resetAuditDestinationArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketRegion() {
        software.amazon.jsii.Kernel.call(this, "resetBucketRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetCacheAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultStorageClass() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultStorageClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileShareName() {
        software.amazon.jsii.Kernel.call(this, "resetFileShareName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuessMimeTypeEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetGuessMimeTypeEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetKmsEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNfsFileShareDefaults() {
        software.amazon.jsii.Kernel.call(this, "resetNfsFileShareDefaults", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetObjectAcl() {
        software.amazon.jsii.Kernel.call(this, "resetObjectAcl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadOnly() {
        software.amazon.jsii.Kernel.call(this, "resetReadOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequesterPays() {
        software.amazon.jsii.Kernel.call(this, "resetRequesterPays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSquash() {
        software.amazon.jsii.Kernel.call(this, "resetSquash", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcEndpointDnsName() {
        software.amazon.jsii.Kernel.call(this, "resetVpcEndpointDnsName", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributesOutputReference getCacheAttributes() {
        return software.amazon.jsii.Kernel.get(this, "cacheAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileshareId() {
        return software.amazon.jsii.Kernel.get(this, "fileshareId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaultsOutputReference getNfsFileShareDefaults() {
        return software.amazon.jsii.Kernel.get(this, "nfsFileShareDefaults", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaultsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuditDestinationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "auditDestinationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes getCacheAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheAttributesInput", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClientListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "clientListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultStorageClassInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultStorageClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileShareNameInput() {
        return software.amazon.jsii.Kernel.get(this, "fileShareNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayArnInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGuessMimeTypeEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "guessMimeTypeEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKmsEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "locationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults getNfsFileShareDefaultsInput() {
        return software.amazon.jsii.Kernel.get(this, "nfsFileShareDefaultsInput", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectAclInput() {
        return software.amazon.jsii.Kernel.get(this, "objectAclInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "readOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequesterPaysInput() {
        return software.amazon.jsii.Kernel.get(this, "requesterPaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSquashInput() {
        return software.amazon.jsii.Kernel.get(this, "squashInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointDnsNameInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointDnsNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuditDestinationArn() {
        return software.amazon.jsii.Kernel.get(this, "auditDestinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuditDestinationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "auditDestinationArn", java.util.Objects.requireNonNull(value, "auditDestinationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketRegion() {
        return software.amazon.jsii.Kernel.get(this, "bucketRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketRegion", java.util.Objects.requireNonNull(value, "bucketRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getClientList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "clientList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setClientList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "clientList", java.util.Objects.requireNonNull(value, "clientList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultStorageClass() {
        return software.amazon.jsii.Kernel.get(this, "defaultStorageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultStorageClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultStorageClass", java.util.Objects.requireNonNull(value, "defaultStorageClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileShareName() {
        return software.amazon.jsii.Kernel.get(this, "fileShareName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileShareName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileShareName", java.util.Objects.requireNonNull(value, "fileShareName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayArn() {
        return software.amazon.jsii.Kernel.get(this, "gatewayArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayArn", java.util.Objects.requireNonNull(value, "gatewayArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getGuessMimeTypeEnabled() {
        return software.amazon.jsii.Kernel.get(this, "guessMimeTypeEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setGuessMimeTypeEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "guessMimeTypeEnabled", java.util.Objects.requireNonNull(value, "guessMimeTypeEnabled is required"));
    }

    public void setGuessMimeTypeEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "guessMimeTypeEnabled", java.util.Objects.requireNonNull(value, "guessMimeTypeEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getKmsEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setKmsEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "kmsEncrypted", java.util.Objects.requireNonNull(value, "kmsEncrypted is required"));
    }

    public void setKmsEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "kmsEncrypted", java.util.Objects.requireNonNull(value, "kmsEncrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocationArn() {
        return software.amazon.jsii.Kernel.get(this, "locationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "locationArn", java.util.Objects.requireNonNull(value, "locationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationPolicy() {
        return software.amazon.jsii.Kernel.get(this, "notificationPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationPolicy", java.util.Objects.requireNonNull(value, "notificationPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectAcl() {
        return software.amazon.jsii.Kernel.get(this, "objectAcl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectAcl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectAcl", java.util.Objects.requireNonNull(value, "objectAcl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReadOnly() {
        return software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReadOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "readOnly", java.util.Objects.requireNonNull(value, "readOnly is required"));
    }

    public void setReadOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "readOnly", java.util.Objects.requireNonNull(value, "readOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequesterPays() {
        return software.amazon.jsii.Kernel.get(this, "requesterPays", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequesterPays(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requesterPays", java.util.Objects.requireNonNull(value, "requesterPays is required"));
    }

    public void setRequesterPays(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requesterPays", java.util.Objects.requireNonNull(value, "requesterPays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSquash() {
        return software.amazon.jsii.Kernel.get(this, "squash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSquash(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "squash", java.util.Objects.requireNonNull(value, "squash is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcEndpointDnsName() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointDnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcEndpointDnsName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcEndpointDnsName", java.util.Objects.requireNonNull(value, "vpcEndpointDnsName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare> {
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
        private final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#client_list StoragegatewayNfsFileShare#client_list}.
         * <p>
         * @return {@code this}
         * @param clientList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#client_list StoragegatewayNfsFileShare#client_list}. This parameter is required.
         */
        public Builder clientList(final java.util.List<java.lang.String> clientList) {
            this.config.clientList(clientList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#gateway_arn StoragegatewayNfsFileShare#gateway_arn}.
         * <p>
         * @return {@code this}
         * @param gatewayArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#gateway_arn StoragegatewayNfsFileShare#gateway_arn}. This parameter is required.
         */
        public Builder gatewayArn(final java.lang.String gatewayArn) {
            this.config.gatewayArn(gatewayArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#location_arn StoragegatewayNfsFileShare#location_arn}.
         * <p>
         * @return {@code this}
         * @param locationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#location_arn StoragegatewayNfsFileShare#location_arn}. This parameter is required.
         */
        public Builder locationArn(final java.lang.String locationArn) {
            this.config.locationArn(locationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#role_arn StoragegatewayNfsFileShare#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#role_arn StoragegatewayNfsFileShare#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#audit_destination_arn StoragegatewayNfsFileShare#audit_destination_arn}.
         * <p>
         * @return {@code this}
         * @param auditDestinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#audit_destination_arn StoragegatewayNfsFileShare#audit_destination_arn}. This parameter is required.
         */
        public Builder auditDestinationArn(final java.lang.String auditDestinationArn) {
            this.config.auditDestinationArn(auditDestinationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#bucket_region StoragegatewayNfsFileShare#bucket_region}.
         * <p>
         * @return {@code this}
         * @param bucketRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#bucket_region StoragegatewayNfsFileShare#bucket_region}. This parameter is required.
         */
        public Builder bucketRegion(final java.lang.String bucketRegion) {
            this.config.bucketRegion(bucketRegion);
            return this;
        }

        /**
         * cache_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#cache_attributes StoragegatewayNfsFileShare#cache_attributes}
         * <p>
         * @return {@code this}
         * @param cacheAttributes cache_attributes block. This parameter is required.
         */
        public Builder cacheAttributes(final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes cacheAttributes) {
            this.config.cacheAttributes(cacheAttributes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#default_storage_class StoragegatewayNfsFileShare#default_storage_class}.
         * <p>
         * @return {@code this}
         * @param defaultStorageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#default_storage_class StoragegatewayNfsFileShare#default_storage_class}. This parameter is required.
         */
        public Builder defaultStorageClass(final java.lang.String defaultStorageClass) {
            this.config.defaultStorageClass(defaultStorageClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_share_name StoragegatewayNfsFileShare#file_share_name}.
         * <p>
         * @return {@code this}
         * @param fileShareName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_share_name StoragegatewayNfsFileShare#file_share_name}. This parameter is required.
         */
        public Builder fileShareName(final java.lang.String fileShareName) {
            this.config.fileShareName(fileShareName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}.
         * <p>
         * @return {@code this}
         * @param guessMimeTypeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}. This parameter is required.
         */
        public Builder guessMimeTypeEnabled(final java.lang.Boolean guessMimeTypeEnabled) {
            this.config.guessMimeTypeEnabled(guessMimeTypeEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}.
         * <p>
         * @return {@code this}
         * @param guessMimeTypeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}. This parameter is required.
         */
        public Builder guessMimeTypeEnabled(final com.hashicorp.cdktf.IResolvable guessMimeTypeEnabled) {
            this.config.guessMimeTypeEnabled(guessMimeTypeEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#id StoragegatewayNfsFileShare#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#id StoragegatewayNfsFileShare#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}.
         * <p>
         * @return {@code this}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}. This parameter is required.
         */
        public Builder kmsEncrypted(final java.lang.Boolean kmsEncrypted) {
            this.config.kmsEncrypted(kmsEncrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}.
         * <p>
         * @return {@code this}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}. This parameter is required.
         */
        public Builder kmsEncrypted(final com.hashicorp.cdktf.IResolvable kmsEncrypted) {
            this.config.kmsEncrypted(kmsEncrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_key_arn StoragegatewayNfsFileShare#kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_key_arn StoragegatewayNfsFileShare#kms_key_arn}. This parameter is required.
         */
        public Builder kmsKeyArn(final java.lang.String kmsKeyArn) {
            this.config.kmsKeyArn(kmsKeyArn);
            return this;
        }

        /**
         * nfs_file_share_defaults block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#nfs_file_share_defaults StoragegatewayNfsFileShare#nfs_file_share_defaults}
         * <p>
         * @return {@code this}
         * @param nfsFileShareDefaults nfs_file_share_defaults block. This parameter is required.
         */
        public Builder nfsFileShareDefaults(final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults nfsFileShareDefaults) {
            this.config.nfsFileShareDefaults(nfsFileShareDefaults);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#notification_policy StoragegatewayNfsFileShare#notification_policy}.
         * <p>
         * @return {@code this}
         * @param notificationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#notification_policy StoragegatewayNfsFileShare#notification_policy}. This parameter is required.
         */
        public Builder notificationPolicy(final java.lang.String notificationPolicy) {
            this.config.notificationPolicy(notificationPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#object_acl StoragegatewayNfsFileShare#object_acl}.
         * <p>
         * @return {@code this}
         * @param objectAcl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#object_acl StoragegatewayNfsFileShare#object_acl}. This parameter is required.
         */
        public Builder objectAcl(final java.lang.String objectAcl) {
            this.config.objectAcl(objectAcl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}.
         * <p>
         * @return {@code this}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}. This parameter is required.
         */
        public Builder readOnly(final java.lang.Boolean readOnly) {
            this.config.readOnly(readOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}.
         * <p>
         * @return {@code this}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}. This parameter is required.
         */
        public Builder readOnly(final com.hashicorp.cdktf.IResolvable readOnly) {
            this.config.readOnly(readOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}.
         * <p>
         * @return {@code this}
         * @param requesterPays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}. This parameter is required.
         */
        public Builder requesterPays(final java.lang.Boolean requesterPays) {
            this.config.requesterPays(requesterPays);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}.
         * <p>
         * @return {@code this}
         * @param requesterPays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}. This parameter is required.
         */
        public Builder requesterPays(final com.hashicorp.cdktf.IResolvable requesterPays) {
            this.config.requesterPays(requesterPays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#squash StoragegatewayNfsFileShare#squash}.
         * <p>
         * @return {@code this}
         * @param squash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#squash StoragegatewayNfsFileShare#squash}. This parameter is required.
         */
        public Builder squash(final java.lang.String squash) {
            this.config.squash(squash);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags StoragegatewayNfsFileShare#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags StoragegatewayNfsFileShare#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags_all StoragegatewayNfsFileShare#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags_all StoragegatewayNfsFileShare#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#timeouts StoragegatewayNfsFileShare#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#vpc_endpoint_dns_name StoragegatewayNfsFileShare#vpc_endpoint_dns_name}.
         * <p>
         * @return {@code this}
         * @param vpcEndpointDnsName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#vpc_endpoint_dns_name StoragegatewayNfsFileShare#vpc_endpoint_dns_name}. This parameter is required.
         */
        public Builder vpcEndpointDnsName(final java.lang.String vpcEndpointDnsName) {
            this.config.vpcEndpointDnsName(vpcEndpointDnsName);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare}.
         */
        @Override
        public imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare build() {
            return new imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShare(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
