package imports.aws.backup_restore_testing_plan;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan aws_backup_restore_testing_plan}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingPlan.BackupRestoreTestingPlan")
public class BackupRestoreTestingPlan extends com.hashicorp.cdktf.TerraformResource {

    protected BackupRestoreTestingPlan(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupRestoreTestingPlan(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan aws_backup_restore_testing_plan} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BackupRestoreTestingPlan(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BackupRestoreTestingPlan resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BackupRestoreTestingPlan to import. This parameter is required.
     * @param importFromId The id of the existing BackupRestoreTestingPlan that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BackupRestoreTestingPlan to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BackupRestoreTestingPlan resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BackupRestoreTestingPlan to import. This parameter is required.
     * @param importFromId The id of the existing BackupRestoreTestingPlan that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putRecoveryPointSelection(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection> __cast_cd4240 = (java.util.List<imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecoveryPointSelection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRecoveryPointSelection() {
        software.amazon.jsii.Kernel.call(this, "resetRecoveryPointSelection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleExpressionTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleExpressionTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartWindowHours() {
        software.amazon.jsii.Kernel.call(this, "resetStartWindowHours", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelectionList getRecoveryPointSelection() {
        return software.amazon.jsii.Kernel.get(this, "recoveryPointSelection", software.amazon.jsii.NativeType.forClass(imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelectionList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecoveryPointSelectionInput() {
        return software.amazon.jsii.Kernel.get(this, "recoveryPointSelectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStartWindowHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "startWindowHoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpression", java.util.Objects.requireNonNull(value, "scheduleExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpressionTimezone() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpressionTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpressionTimezone", java.util.Objects.requireNonNull(value, "scheduleExpressionTimezone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStartWindowHours() {
        return software.amazon.jsii.Kernel.get(this, "startWindowHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStartWindowHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "startWindowHours", java.util.Objects.requireNonNull(value, "startWindowHours is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan> {
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
        private final imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#name BackupRestoreTestingPlan#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#name BackupRestoreTestingPlan#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#schedule_expression BackupRestoreTestingPlan#schedule_expression}.
         * <p>
         * @return {@code this}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#schedule_expression BackupRestoreTestingPlan#schedule_expression}. This parameter is required.
         */
        public Builder scheduleExpression(final java.lang.String scheduleExpression) {
            this.config.scheduleExpression(scheduleExpression);
            return this;
        }

        /**
         * recovery_point_selection block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#recovery_point_selection BackupRestoreTestingPlan#recovery_point_selection}
         * <p>
         * @return {@code this}
         * @param recoveryPointSelection recovery_point_selection block. This parameter is required.
         */
        public Builder recoveryPointSelection(final com.hashicorp.cdktf.IResolvable recoveryPointSelection) {
            this.config.recoveryPointSelection(recoveryPointSelection);
            return this;
        }
        /**
         * recovery_point_selection block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#recovery_point_selection BackupRestoreTestingPlan#recovery_point_selection}
         * <p>
         * @return {@code this}
         * @param recoveryPointSelection recovery_point_selection block. This parameter is required.
         */
        public Builder recoveryPointSelection(final java.util.List<? extends imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection> recoveryPointSelection) {
            this.config.recoveryPointSelection(recoveryPointSelection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#schedule_expression_timezone BackupRestoreTestingPlan#schedule_expression_timezone}.
         * <p>
         * @return {@code this}
         * @param scheduleExpressionTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#schedule_expression_timezone BackupRestoreTestingPlan#schedule_expression_timezone}. This parameter is required.
         */
        public Builder scheduleExpressionTimezone(final java.lang.String scheduleExpressionTimezone) {
            this.config.scheduleExpressionTimezone(scheduleExpressionTimezone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#start_window_hours BackupRestoreTestingPlan#start_window_hours}.
         * <p>
         * @return {@code this}
         * @param startWindowHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#start_window_hours BackupRestoreTestingPlan#start_window_hours}. This parameter is required.
         */
        public Builder startWindowHours(final java.lang.Number startWindowHours) {
            this.config.startWindowHours(startWindowHours);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#tags BackupRestoreTestingPlan#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_restore_testing_plan#tags BackupRestoreTestingPlan#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan}.
         */
        @Override
        public imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan build() {
            return new imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlan(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
