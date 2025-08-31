package imports.aws.data_aws_identitystore_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group aws_identitystore_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroup")
public class DataAwsIdentitystoreGroup extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsIdentitystoreGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIdentitystoreGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group aws_identitystore_group} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsIdentitystoreGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIdentitystoreGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIdentitystoreGroup to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIdentitystoreGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsIdentitystoreGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIdentitystoreGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIdentitystoreGroup to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIdentitystoreGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAlternateIdentifier(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier value) {
        software.amazon.jsii.Kernel.call(this, "putAlternateIdentifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilter value) {
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlternateIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetAlternateIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierOutputReference getAlternateIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "alternateIdentifier", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupExternalIdsList getExternalIds() {
        return software.amazon.jsii.Kernel.get(this, "externalIds", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupExternalIdsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilterOutputReference getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier getAlternateIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "alternateIdentifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilter getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilter.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "groupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityStoreIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupId() {
        return software.amazon.jsii.Kernel.get(this, "groupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupId", java.util.Objects.requireNonNull(value, "groupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityStoreId() {
        return software.amazon.jsii.Kernel.get(this, "identityStoreId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityStoreId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityStoreId", java.util.Objects.requireNonNull(value, "identityStoreId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup> {
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
        private final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#identity_store_id DataAwsIdentitystoreGroup#identity_store_id}.
         * <p>
         * @return {@code this}
         * @param identityStoreId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#identity_store_id DataAwsIdentitystoreGroup#identity_store_id}. This parameter is required.
         */
        public Builder identityStoreId(final java.lang.String identityStoreId) {
            this.config.identityStoreId(identityStoreId);
            return this;
        }

        /**
         * alternate_identifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#alternate_identifier DataAwsIdentitystoreGroup#alternate_identifier}
         * <p>
         * @return {@code this}
         * @param alternateIdentifier alternate_identifier block. This parameter is required.
         */
        public Builder alternateIdentifier(final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifier alternateIdentifier) {
            this.config.alternateIdentifier(alternateIdentifier);
            return this;
        }

        /**
         * filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#filter DataAwsIdentitystoreGroup#filter}
         * <p>
         * @return {@code this}
         * @param filter filter block. This parameter is required.
         */
        public Builder filter(final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupFilter filter) {
            this.config.filter(filter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#group_id DataAwsIdentitystoreGroup#group_id}.
         * <p>
         * @return {@code this}
         * @param groupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#group_id DataAwsIdentitystoreGroup#group_id}. This parameter is required.
         */
        public Builder groupId(final java.lang.String groupId) {
            this.config.groupId(groupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#id DataAwsIdentitystoreGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#id DataAwsIdentitystoreGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup}.
         */
        @Override
        public imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup build() {
            return new imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
