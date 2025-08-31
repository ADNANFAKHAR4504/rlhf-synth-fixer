package imports.aws.vpc_ipam_pool;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool aws_vpc_ipam_pool}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.601Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamPool.VpcIpamPool")
public class VpcIpamPool extends com.hashicorp.cdktf.TerraformResource {

    protected VpcIpamPool(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcIpamPool(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpc_ipam_pool.VpcIpamPool.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool aws_vpc_ipam_pool} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpcIpamPool(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpc_ipam_pool.VpcIpamPoolConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpcIpamPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcIpamPool to import. This parameter is required.
     * @param importFromId The id of the existing VpcIpamPool that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpcIpamPool to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_ipam_pool.VpcIpamPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpcIpamPool resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcIpamPool to import. This parameter is required.
     * @param importFromId The id of the existing VpcIpamPool that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_ipam_pool.VpcIpamPool.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllocationDefaultNetmaskLength() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationDefaultNetmaskLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllocationMaxNetmaskLength() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationMaxNetmaskLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllocationMinNetmaskLength() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationMinNetmaskLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllocationResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetAllocationResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoImport() {
        software.amazon.jsii.Kernel.call(this, "resetAutoImport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsService() {
        software.amazon.jsii.Kernel.call(this, "resetAwsService", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCascade() {
        software.amazon.jsii.Kernel.call(this, "resetCascade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocale() {
        software.amazon.jsii.Kernel.call(this, "resetLocale", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPublicIpSource() {
        software.amazon.jsii.Kernel.call(this, "resetPublicIpSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPubliclyAdvertisable() {
        software.amazon.jsii.Kernel.call(this, "resetPubliclyAdvertisable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceIpamPoolId() {
        software.amazon.jsii.Kernel.call(this, "resetSourceIpamPoolId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIpamScopeType() {
        return software.amazon.jsii.Kernel.get(this, "ipamScopeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPoolDepth() {
        return software.amazon.jsii.Kernel.get(this, "poolDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpc_ipam_pool.VpcIpamPoolTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipam_pool.VpcIpamPoolTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "addressFamilyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAllocationDefaultNetmaskLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationDefaultNetmaskLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAllocationMaxNetmaskLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationMaxNetmaskLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAllocationMinNetmaskLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "allocationMinNetmaskLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAllocationResourceTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allocationResourceTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoImportInput() {
        return software.amazon.jsii.Kernel.get(this, "autoImportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsServiceInput() {
        return software.amazon.jsii.Kernel.get(this, "awsServiceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCascadeInput() {
        return software.amazon.jsii.Kernel.get(this, "cascadeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpamScopeIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ipamScopeIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocaleInput() {
        return software.amazon.jsii.Kernel.get(this, "localeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPublicIpSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "publicIpSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAdvertisableInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAdvertisableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceIpamPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIpamPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAddressFamily() {
        return software.amazon.jsii.Kernel.get(this, "addressFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddressFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "addressFamily", java.util.Objects.requireNonNull(value, "addressFamily is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAllocationDefaultNetmaskLength() {
        return software.amazon.jsii.Kernel.get(this, "allocationDefaultNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAllocationDefaultNetmaskLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "allocationDefaultNetmaskLength", java.util.Objects.requireNonNull(value, "allocationDefaultNetmaskLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAllocationMaxNetmaskLength() {
        return software.amazon.jsii.Kernel.get(this, "allocationMaxNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAllocationMaxNetmaskLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "allocationMaxNetmaskLength", java.util.Objects.requireNonNull(value, "allocationMaxNetmaskLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAllocationMinNetmaskLength() {
        return software.amazon.jsii.Kernel.get(this, "allocationMinNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAllocationMinNetmaskLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "allocationMinNetmaskLength", java.util.Objects.requireNonNull(value, "allocationMinNetmaskLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAllocationResourceTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "allocationResourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllocationResourceTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allocationResourceTags", java.util.Objects.requireNonNull(value, "allocationResourceTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoImport() {
        return software.amazon.jsii.Kernel.get(this, "autoImport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoImport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoImport", java.util.Objects.requireNonNull(value, "autoImport is required"));
    }

    public void setAutoImport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoImport", java.util.Objects.requireNonNull(value, "autoImport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsService() {
        return software.amazon.jsii.Kernel.get(this, "awsService", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsService(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsService", java.util.Objects.requireNonNull(value, "awsService is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCascade() {
        return software.amazon.jsii.Kernel.get(this, "cascade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCascade(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cascade", java.util.Objects.requireNonNull(value, "cascade is required"));
    }

    public void setCascade(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cascade", java.util.Objects.requireNonNull(value, "cascade is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpamScopeId() {
        return software.amazon.jsii.Kernel.get(this, "ipamScopeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpamScopeId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipamScopeId", java.util.Objects.requireNonNull(value, "ipamScopeId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocale() {
        return software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocale(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "locale", java.util.Objects.requireNonNull(value, "locale is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIpSource() {
        return software.amazon.jsii.Kernel.get(this, "publicIpSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPublicIpSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "publicIpSource", java.util.Objects.requireNonNull(value, "publicIpSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPubliclyAdvertisable() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAdvertisable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPubliclyAdvertisable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAdvertisable", java.util.Objects.requireNonNull(value, "publiclyAdvertisable is required"));
    }

    public void setPubliclyAdvertisable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAdvertisable", java.util.Objects.requireNonNull(value, "publiclyAdvertisable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceIpamPoolId() {
        return software.amazon.jsii.Kernel.get(this, "sourceIpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceIpamPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceIpamPoolId", java.util.Objects.requireNonNull(value, "sourceIpamPoolId is required"));
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

    /**
     * A fluent builder for {@link imports.aws.vpc_ipam_pool.VpcIpamPool}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpc_ipam_pool.VpcIpamPool> {
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
        private final imports.aws.vpc_ipam_pool.VpcIpamPoolConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpc_ipam_pool.VpcIpamPoolConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#address_family VpcIpamPool#address_family}.
         * <p>
         * @return {@code this}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#address_family VpcIpamPool#address_family}. This parameter is required.
         */
        public Builder addressFamily(final java.lang.String addressFamily) {
            this.config.addressFamily(addressFamily);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#ipam_scope_id VpcIpamPool#ipam_scope_id}.
         * <p>
         * @return {@code this}
         * @param ipamScopeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#ipam_scope_id VpcIpamPool#ipam_scope_id}. This parameter is required.
         */
        public Builder ipamScopeId(final java.lang.String ipamScopeId) {
            this.config.ipamScopeId(ipamScopeId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_default_netmask_length VpcIpamPool#allocation_default_netmask_length}.
         * <p>
         * @return {@code this}
         * @param allocationDefaultNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_default_netmask_length VpcIpamPool#allocation_default_netmask_length}. This parameter is required.
         */
        public Builder allocationDefaultNetmaskLength(final java.lang.Number allocationDefaultNetmaskLength) {
            this.config.allocationDefaultNetmaskLength(allocationDefaultNetmaskLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_max_netmask_length VpcIpamPool#allocation_max_netmask_length}.
         * <p>
         * @return {@code this}
         * @param allocationMaxNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_max_netmask_length VpcIpamPool#allocation_max_netmask_length}. This parameter is required.
         */
        public Builder allocationMaxNetmaskLength(final java.lang.Number allocationMaxNetmaskLength) {
            this.config.allocationMaxNetmaskLength(allocationMaxNetmaskLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_min_netmask_length VpcIpamPool#allocation_min_netmask_length}.
         * <p>
         * @return {@code this}
         * @param allocationMinNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_min_netmask_length VpcIpamPool#allocation_min_netmask_length}. This parameter is required.
         */
        public Builder allocationMinNetmaskLength(final java.lang.Number allocationMinNetmaskLength) {
            this.config.allocationMinNetmaskLength(allocationMinNetmaskLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_resource_tags VpcIpamPool#allocation_resource_tags}.
         * <p>
         * @return {@code this}
         * @param allocationResourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_resource_tags VpcIpamPool#allocation_resource_tags}. This parameter is required.
         */
        public Builder allocationResourceTags(final java.util.Map<java.lang.String, java.lang.String> allocationResourceTags) {
            this.config.allocationResourceTags(allocationResourceTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}.
         * <p>
         * @return {@code this}
         * @param autoImport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}. This parameter is required.
         */
        public Builder autoImport(final java.lang.Boolean autoImport) {
            this.config.autoImport(autoImport);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}.
         * <p>
         * @return {@code this}
         * @param autoImport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}. This parameter is required.
         */
        public Builder autoImport(final com.hashicorp.cdktf.IResolvable autoImport) {
            this.config.autoImport(autoImport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#aws_service VpcIpamPool#aws_service}.
         * <p>
         * @return {@code this}
         * @param awsService Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#aws_service VpcIpamPool#aws_service}. This parameter is required.
         */
        public Builder awsService(final java.lang.String awsService) {
            this.config.awsService(awsService);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}.
         * <p>
         * @return {@code this}
         * @param cascade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}. This parameter is required.
         */
        public Builder cascade(final java.lang.Boolean cascade) {
            this.config.cascade(cascade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}.
         * <p>
         * @return {@code this}
         * @param cascade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}. This parameter is required.
         */
        public Builder cascade(final com.hashicorp.cdktf.IResolvable cascade) {
            this.config.cascade(cascade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#description VpcIpamPool#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#description VpcIpamPool#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#id VpcIpamPool#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#id VpcIpamPool#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#locale VpcIpamPool#locale}.
         * <p>
         * @return {@code this}
         * @param locale Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#locale VpcIpamPool#locale}. This parameter is required.
         */
        public Builder locale(final java.lang.String locale) {
            this.config.locale(locale);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#public_ip_source VpcIpamPool#public_ip_source}.
         * <p>
         * @return {@code this}
         * @param publicIpSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#public_ip_source VpcIpamPool#public_ip_source}. This parameter is required.
         */
        public Builder publicIpSource(final java.lang.String publicIpSource) {
            this.config.publicIpSource(publicIpSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}.
         * <p>
         * @return {@code this}
         * @param publiclyAdvertisable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}. This parameter is required.
         */
        public Builder publiclyAdvertisable(final java.lang.Boolean publiclyAdvertisable) {
            this.config.publiclyAdvertisable(publiclyAdvertisable);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}.
         * <p>
         * @return {@code this}
         * @param publiclyAdvertisable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}. This parameter is required.
         */
        public Builder publiclyAdvertisable(final com.hashicorp.cdktf.IResolvable publiclyAdvertisable) {
            this.config.publiclyAdvertisable(publiclyAdvertisable);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#source_ipam_pool_id VpcIpamPool#source_ipam_pool_id}.
         * <p>
         * @return {@code this}
         * @param sourceIpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#source_ipam_pool_id VpcIpamPool#source_ipam_pool_id}. This parameter is required.
         */
        public Builder sourceIpamPoolId(final java.lang.String sourceIpamPoolId) {
            this.config.sourceIpamPoolId(sourceIpamPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags VpcIpamPool#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags VpcIpamPool#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags_all VpcIpamPool#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags_all VpcIpamPool#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#timeouts VpcIpamPool#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpc_ipam_pool.VpcIpamPool}.
         */
        @Override
        public imports.aws.vpc_ipam_pool.VpcIpamPool build() {
            return new imports.aws.vpc_ipam_pool.VpcIpamPool(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
