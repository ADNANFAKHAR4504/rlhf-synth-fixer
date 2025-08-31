package imports.aws.lakeformation_resource_lf_tag;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag aws_lakeformation_resource_lf_tag}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.494Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationResourceLfTag.LakeformationResourceLfTag")
public class LakeformationResourceLfTag extends com.hashicorp.cdktf.TerraformResource {

    protected LakeformationResourceLfTag(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationResourceLfTag(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag aws_lakeformation_resource_lf_tag} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public LakeformationResourceLfTag(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag aws_lakeformation_resource_lf_tag} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public LakeformationResourceLfTag(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a LakeformationResourceLfTag resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationResourceLfTag to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationResourceLfTag that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LakeformationResourceLfTag to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LakeformationResourceLfTag resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationResourceLfTag to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationResourceLfTag that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDatabase(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabase>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabase> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabase>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabase __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDatabase", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLfTag(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTag>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTag> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTag>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTag __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLfTag", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTable(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTable>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTable> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTable>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTable __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTableWithColumns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumns> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTableWithColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCatalogId() {
        software.amazon.jsii.Kernel.call(this, "resetCatalogId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabase() {
        software.amazon.jsii.Kernel.call(this, "resetDatabase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLfTag() {
        software.amazon.jsii.Kernel.call(this, "resetLfTag", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTable() {
        software.amazon.jsii.Kernel.call(this, "resetTable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTableWithColumns() {
        software.amazon.jsii.Kernel.call(this, "resetTableWithColumns", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabaseList getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabaseList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTagList getLfTag() {
        return software.amazon.jsii.Kernel.get(this, "lfTag", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTagList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableList getTable() {
        return software.amazon.jsii.Kernel.get(this, "table", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumnsList getTableWithColumns() {
        return software.amazon.jsii.Kernel.get(this, "tableWithColumns", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCatalogIdInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLfTagInput() {
        return software.amazon.jsii.Kernel.get(this, "lfTagInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTableInput() {
        return software.amazon.jsii.Kernel.get(this, "tableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTableWithColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "tableWithColumnsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCatalogId() {
        return software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCatalogId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "catalogId", java.util.Objects.requireNonNull(value, "catalogId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag> {
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
        private imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#catalog_id LakeformationResourceLfTag#catalog_id}.
         * <p>
         * @return {@code this}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#catalog_id LakeformationResourceLfTag#catalog_id}. This parameter is required.
         */
        public Builder catalogId(final java.lang.String catalogId) {
            this.config().catalogId(catalogId);
            return this;
        }

        /**
         * database block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#database LakeformationResourceLfTag#database}
         * <p>
         * @return {@code this}
         * @param database database block. This parameter is required.
         */
        public Builder database(final com.hashicorp.cdktf.IResolvable database) {
            this.config().database(database);
            return this;
        }
        /**
         * database block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#database LakeformationResourceLfTag#database}
         * <p>
         * @return {@code this}
         * @param database database block. This parameter is required.
         */
        public Builder database(final java.util.List<? extends imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagDatabase> database) {
            this.config().database(database);
            return this;
        }

        /**
         * lf_tag block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#lf_tag LakeformationResourceLfTag#lf_tag}
         * <p>
         * @return {@code this}
         * @param lfTag lf_tag block. This parameter is required.
         */
        public Builder lfTag(final com.hashicorp.cdktf.IResolvable lfTag) {
            this.config().lfTag(lfTag);
            return this;
        }
        /**
         * lf_tag block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#lf_tag LakeformationResourceLfTag#lf_tag}
         * <p>
         * @return {@code this}
         * @param lfTag lf_tag block. This parameter is required.
         */
        public Builder lfTag(final java.util.List<? extends imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagLfTag> lfTag) {
            this.config().lfTag(lfTag);
            return this;
        }

        /**
         * table block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#table LakeformationResourceLfTag#table}
         * <p>
         * @return {@code this}
         * @param table table block. This parameter is required.
         */
        public Builder table(final com.hashicorp.cdktf.IResolvable table) {
            this.config().table(table);
            return this;
        }
        /**
         * table block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#table LakeformationResourceLfTag#table}
         * <p>
         * @return {@code this}
         * @param table table block. This parameter is required.
         */
        public Builder table(final java.util.List<? extends imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTable> table) {
            this.config().table(table);
            return this;
        }

        /**
         * table_with_columns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#table_with_columns LakeformationResourceLfTag#table_with_columns}
         * <p>
         * @return {@code this}
         * @param tableWithColumns table_with_columns block. This parameter is required.
         */
        public Builder tableWithColumns(final com.hashicorp.cdktf.IResolvable tableWithColumns) {
            this.config().tableWithColumns(tableWithColumns);
            return this;
        }
        /**
         * table_with_columns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#table_with_columns LakeformationResourceLfTag#table_with_columns}
         * <p>
         * @return {@code this}
         * @param tableWithColumns table_with_columns block. This parameter is required.
         */
        public Builder tableWithColumns(final java.util.List<? extends imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumns> tableWithColumns) {
            this.config().tableWithColumns(tableWithColumns);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#timeouts LakeformationResourceLfTag#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag}.
         */
        @Override
        public imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag build() {
            return new imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTag(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagConfig.Builder();
            }
            return this.config;
        }
    }
}
