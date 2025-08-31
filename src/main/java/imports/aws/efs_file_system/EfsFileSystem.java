package imports.aws.efs_file_system;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system aws_efs_file_system}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsFileSystem.EfsFileSystem")
public class EfsFileSystem extends com.hashicorp.cdktf.TerraformResource {

    protected EfsFileSystem(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EfsFileSystem(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.efs_file_system.EfsFileSystem.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system aws_efs_file_system} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public EfsFileSystem(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.efs_file_system.EfsFileSystemConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system aws_efs_file_system} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public EfsFileSystem(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a EfsFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EfsFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing EfsFileSystem that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EfsFileSystem to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.efs_file_system.EfsFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EfsFileSystem resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EfsFileSystem to import. This parameter is required.
     * @param importFromId The id of the existing EfsFileSystem that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.efs_file_system.EfsFileSystem.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLifecyclePolicy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy> __cast_cd4240 = (java.util.List<imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLifecyclePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProtection(final @org.jetbrains.annotations.NotNull imports.aws.efs_file_system.EfsFileSystemProtection value) {
        software.amazon.jsii.Kernel.call(this, "putProtection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAvailabilityZoneName() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreationToken() {
        software.amazon.jsii.Kernel.call(this, "resetCreationToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecyclePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetLifecyclePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerformanceMode() {
        software.amazon.jsii.Kernel.call(this, "resetPerformanceMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtection() {
        software.amazon.jsii.Kernel.call(this, "resetProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProvisionedThroughputInMibps() {
        software.amazon.jsii.Kernel.call(this, "resetProvisionedThroughputInMibps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThroughputMode() {
        software.amazon.jsii.Kernel.call(this, "resetThroughputMode", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneId() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.efs_file_system.EfsFileSystemLifecyclePolicyList getLifecyclePolicy() {
        return software.amazon.jsii.Kernel.get(this, "lifecyclePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemLifecyclePolicyList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfMountTargets() {
        return software.amazon.jsii.Kernel.get(this, "numberOfMountTargets", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.efs_file_system.EfsFileSystemProtectionOutputReference getProtection() {
        return software.amazon.jsii.Kernel.get(this, "protection", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemProtectionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.efs_file_system.EfsFileSystemSizeInBytesList getSizeInBytes() {
        return software.amazon.jsii.Kernel.get(this, "sizeInBytes", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemSizeInBytesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneNameInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCreationTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "creationTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLifecyclePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecyclePolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPerformanceModeInput() {
        return software.amazon.jsii.Kernel.get(this, "performanceModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.efs_file_system.EfsFileSystemProtection getProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "protectionInput", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemProtection.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedThroughputInMibpsInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedThroughputInMibpsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThroughputModeInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneName() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZoneName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneName", java.util.Objects.requireNonNull(value, "availabilityZoneName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationToken() {
        return software.amazon.jsii.Kernel.get(this, "creationToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCreationToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "creationToken", java.util.Objects.requireNonNull(value, "creationToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPerformanceMode() {
        return software.amazon.jsii.Kernel.get(this, "performanceMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPerformanceMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "performanceMode", java.util.Objects.requireNonNull(value, "performanceMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedThroughputInMibps() {
        return software.amazon.jsii.Kernel.get(this, "provisionedThroughputInMibps", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProvisionedThroughputInMibps(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "provisionedThroughputInMibps", java.util.Objects.requireNonNull(value, "provisionedThroughputInMibps is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getThroughputMode() {
        return software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThroughputMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "throughputMode", java.util.Objects.requireNonNull(value, "throughputMode is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.efs_file_system.EfsFileSystem}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.efs_file_system.EfsFileSystem> {
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
        private imports.aws.efs_file_system.EfsFileSystemConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#availability_zone_name EfsFileSystem#availability_zone_name}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#availability_zone_name EfsFileSystem#availability_zone_name}. This parameter is required.
         */
        public Builder availabilityZoneName(final java.lang.String availabilityZoneName) {
            this.config().availabilityZoneName(availabilityZoneName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#creation_token EfsFileSystem#creation_token}.
         * <p>
         * @return {@code this}
         * @param creationToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#creation_token EfsFileSystem#creation_token}. This parameter is required.
         */
        public Builder creationToken(final java.lang.String creationToken) {
            this.config().creationToken(creationToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}.
         * <p>
         * @return {@code this}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}. This parameter is required.
         */
        public Builder encrypted(final java.lang.Boolean encrypted) {
            this.config().encrypted(encrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}.
         * <p>
         * @return {@code this}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}. This parameter is required.
         */
        public Builder encrypted(final com.hashicorp.cdktf.IResolvable encrypted) {
            this.config().encrypted(encrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#id EfsFileSystem#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#id EfsFileSystem#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#kms_key_id EfsFileSystem#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#kms_key_id EfsFileSystem#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config().kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * lifecycle_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#lifecycle_policy EfsFileSystem#lifecycle_policy}
         * <p>
         * @return {@code this}
         * @param lifecyclePolicy lifecycle_policy block. This parameter is required.
         */
        public Builder lifecyclePolicy(final com.hashicorp.cdktf.IResolvable lifecyclePolicy) {
            this.config().lifecyclePolicy(lifecyclePolicy);
            return this;
        }
        /**
         * lifecycle_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#lifecycle_policy EfsFileSystem#lifecycle_policy}
         * <p>
         * @return {@code this}
         * @param lifecyclePolicy lifecycle_policy block. This parameter is required.
         */
        public Builder lifecyclePolicy(final java.util.List<? extends imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy> lifecyclePolicy) {
            this.config().lifecyclePolicy(lifecyclePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#performance_mode EfsFileSystem#performance_mode}.
         * <p>
         * @return {@code this}
         * @param performanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#performance_mode EfsFileSystem#performance_mode}. This parameter is required.
         */
        public Builder performanceMode(final java.lang.String performanceMode) {
            this.config().performanceMode(performanceMode);
            return this;
        }

        /**
         * protection block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#protection EfsFileSystem#protection}
         * <p>
         * @return {@code this}
         * @param protection protection block. This parameter is required.
         */
        public Builder protection(final imports.aws.efs_file_system.EfsFileSystemProtection protection) {
            this.config().protection(protection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#provisioned_throughput_in_mibps EfsFileSystem#provisioned_throughput_in_mibps}.
         * <p>
         * @return {@code this}
         * @param provisionedThroughputInMibps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#provisioned_throughput_in_mibps EfsFileSystem#provisioned_throughput_in_mibps}. This parameter is required.
         */
        public Builder provisionedThroughputInMibps(final java.lang.Number provisionedThroughputInMibps) {
            this.config().provisionedThroughputInMibps(provisionedThroughputInMibps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags EfsFileSystem#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags EfsFileSystem#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags_all EfsFileSystem#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags_all EfsFileSystem#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#throughput_mode EfsFileSystem#throughput_mode}.
         * <p>
         * @return {@code this}
         * @param throughputMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#throughput_mode EfsFileSystem#throughput_mode}. This parameter is required.
         */
        public Builder throughputMode(final java.lang.String throughputMode) {
            this.config().throughputMode(throughputMode);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.efs_file_system.EfsFileSystem}.
         */
        @Override
        public imports.aws.efs_file_system.EfsFileSystem build() {
            return new imports.aws.efs_file_system.EfsFileSystem(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.efs_file_system.EfsFileSystemConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.efs_file_system.EfsFileSystemConfig.Builder();
            }
            return this.config;
        }
    }
}
