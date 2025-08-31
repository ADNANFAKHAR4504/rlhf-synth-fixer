package imports.aws.backup_restore_testing_selection;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection aws_backup_restore_testing_selection}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingSelection.BackupRestoreTestingSelection")
public class BackupRestoreTestingSelection extends com.hashicorp.cdktf.TerraformResource {

    protected BackupRestoreTestingSelection(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupRestoreTestingSelection(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection aws_backup_restore_testing_selection} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BackupRestoreTestingSelection(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BackupRestoreTestingSelection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BackupRestoreTestingSelection to import. This parameter is required.
     * @param importFromId The id of the existing BackupRestoreTestingSelection that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BackupRestoreTestingSelection to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BackupRestoreTestingSelection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BackupRestoreTestingSelection to import. This parameter is required.
     * @param importFromId The id of the existing BackupRestoreTestingSelection that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putProtectedResourceConditions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions> __cast_cd4240 = (java.util.List<imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProtectedResourceConditions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetProtectedResourceArns() {
        software.amazon.jsii.Kernel.call(this, "resetProtectedResourceArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtectedResourceConditions() {
        software.amazon.jsii.Kernel.call(this, "resetProtectedResourceConditions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestoreMetadataOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetRestoreMetadataOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidationWindowHours() {
        software.amazon.jsii.Kernel.call(this, "resetValidationWindowHours", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditionsList getProtectedResourceConditions() {
        return software.amazon.jsii.Kernel.get(this, "protectedResourceConditions", software.amazon.jsii.NativeType.forClass(imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditionsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProtectedResourceArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "protectedResourceArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProtectedResourceConditionsInput() {
        return software.amazon.jsii.Kernel.get(this, "protectedResourceConditionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtectedResourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "protectedResourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRestoreMetadataOverridesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "restoreMetadataOverridesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestoreTestingPlanNameInput() {
        return software.amazon.jsii.Kernel.get(this, "restoreTestingPlanNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getValidationWindowHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "validationWindowHoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamRoleArn", java.util.Objects.requireNonNull(value, "iamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProtectedResourceArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "protectedResourceArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setProtectedResourceArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "protectedResourceArns", java.util.Objects.requireNonNull(value, "protectedResourceArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtectedResourceType() {
        return software.amazon.jsii.Kernel.get(this, "protectedResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtectedResourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protectedResourceType", java.util.Objects.requireNonNull(value, "protectedResourceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRestoreMetadataOverrides() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "restoreMetadataOverrides", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRestoreMetadataOverrides(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "restoreMetadataOverrides", java.util.Objects.requireNonNull(value, "restoreMetadataOverrides is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestoreTestingPlanName() {
        return software.amazon.jsii.Kernel.get(this, "restoreTestingPlanName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestoreTestingPlanName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restoreTestingPlanName", java.util.Objects.requireNonNull(value, "restoreTestingPlanName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getValidationWindowHours() {
        return software.amazon.jsii.Kernel.get(this, "validationWindowHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setValidationWindowHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "validationWindowHours", java.util.Objects.requireNonNull(value, "validationWindowHours is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection> {
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
        private final imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#iam_role_arn BackupRestoreTestingSelection#iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#iam_role_arn BackupRestoreTestingSelection#iam_role_arn}. This parameter is required.
         */
        public Builder iamRoleArn(final java.lang.String iamRoleArn) {
            this.config.iamRoleArn(iamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#name BackupRestoreTestingSelection#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#name BackupRestoreTestingSelection#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_type BackupRestoreTestingSelection#protected_resource_type}.
         * <p>
         * @return {@code this}
         * @param protectedResourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_type BackupRestoreTestingSelection#protected_resource_type}. This parameter is required.
         */
        public Builder protectedResourceType(final java.lang.String protectedResourceType) {
            this.config.protectedResourceType(protectedResourceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_testing_plan_name BackupRestoreTestingSelection#restore_testing_plan_name}.
         * <p>
         * @return {@code this}
         * @param restoreTestingPlanName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_testing_plan_name BackupRestoreTestingSelection#restore_testing_plan_name}. This parameter is required.
         */
        public Builder restoreTestingPlanName(final java.lang.String restoreTestingPlanName) {
            this.config.restoreTestingPlanName(restoreTestingPlanName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_arns BackupRestoreTestingSelection#protected_resource_arns}.
         * <p>
         * @return {@code this}
         * @param protectedResourceArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_arns BackupRestoreTestingSelection#protected_resource_arns}. This parameter is required.
         */
        public Builder protectedResourceArns(final java.util.List<java.lang.String> protectedResourceArns) {
            this.config.protectedResourceArns(protectedResourceArns);
            return this;
        }

        /**
         * protected_resource_conditions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_conditions BackupRestoreTestingSelection#protected_resource_conditions}
         * <p>
         * @return {@code this}
         * @param protectedResourceConditions protected_resource_conditions block. This parameter is required.
         */
        public Builder protectedResourceConditions(final com.hashicorp.cdktf.IResolvable protectedResourceConditions) {
            this.config.protectedResourceConditions(protectedResourceConditions);
            return this;
        }
        /**
         * protected_resource_conditions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#protected_resource_conditions BackupRestoreTestingSelection#protected_resource_conditions}
         * <p>
         * @return {@code this}
         * @param protectedResourceConditions protected_resource_conditions block. This parameter is required.
         */
        public Builder protectedResourceConditions(final java.util.List<? extends imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelectionProtectedResourceConditions> protectedResourceConditions) {
            this.config.protectedResourceConditions(protectedResourceConditions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_metadata_overrides BackupRestoreTestingSelection#restore_metadata_overrides}.
         * <p>
         * @return {@code this}
         * @param restoreMetadataOverrides Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#restore_metadata_overrides BackupRestoreTestingSelection#restore_metadata_overrides}. This parameter is required.
         */
        public Builder restoreMetadataOverrides(final java.util.Map<java.lang.String, java.lang.String> restoreMetadataOverrides) {
            this.config.restoreMetadataOverrides(restoreMetadataOverrides);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#validation_window_hours BackupRestoreTestingSelection#validation_window_hours}.
         * <p>
         * @return {@code this}
         * @param validationWindowHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_selection#validation_window_hours BackupRestoreTestingSelection#validation_window_hours}. This parameter is required.
         */
        public Builder validationWindowHours(final java.lang.Number validationWindowHours) {
            this.config.validationWindowHours(validationWindowHours);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection}.
         */
        @Override
        public imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection build() {
            return new imports.aws.backup_restore_testing_selection.BackupRestoreTestingSelection(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
