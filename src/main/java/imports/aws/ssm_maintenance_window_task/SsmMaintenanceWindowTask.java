package imports.aws.ssm_maintenance_window_task;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task aws_ssm_maintenance_window_task}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.498Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTask")
public class SsmMaintenanceWindowTask extends com.hashicorp.cdktf.TerraformResource {

    protected SsmMaintenanceWindowTask(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmMaintenanceWindowTask(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task aws_ssm_maintenance_window_task} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SsmMaintenanceWindowTask(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SsmMaintenanceWindowTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmMaintenanceWindowTask to import. This parameter is required.
     * @param importFromId The id of the existing SsmMaintenanceWindowTask that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SsmMaintenanceWindowTask to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SsmMaintenanceWindowTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmMaintenanceWindowTask to import. This parameter is required.
     * @param importFromId The id of the existing SsmMaintenanceWindowTask that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTargets(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets> __cast_cd4240 = (java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargets", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTaskInvocationParameters(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters value) {
        software.amazon.jsii.Kernel.call(this, "putTaskInvocationParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCutoffBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetCutoffBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrency() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxErrors() {
        software.amazon.jsii.Kernel.call(this, "resetMaxErrors", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPriority() {
        software.amazon.jsii.Kernel.call(this, "resetPriority", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargets() {
        software.amazon.jsii.Kernel.call(this, "resetTargets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskInvocationParameters() {
        software.amazon.jsii.Kernel.call(this, "resetTaskInvocationParameters", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargetsList getTargets() {
        return software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargetsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference getTaskInvocationParameters() {
        return software.amazon.jsii.Kernel.get(this, "taskInvocationParameters", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWindowTaskId() {
        return software.amazon.jsii.Kernel.get(this, "windowTaskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCutoffBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "cutoffBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxConcurrencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxErrorsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxErrorsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "priorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetsInput() {
        return software.amazon.jsii.Kernel.get(this, "targetsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskArnInput() {
        return software.amazon.jsii.Kernel.get(this, "taskArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters getTaskInvocationParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "taskInvocationParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "taskTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWindowIdInput() {
        return software.amazon.jsii.Kernel.get(this, "windowIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCutoffBehavior() {
        return software.amazon.jsii.Kernel.get(this, "cutoffBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCutoffBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cutoffBehavior", java.util.Objects.requireNonNull(value, "cutoffBehavior is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxConcurrency() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxConcurrency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrency", java.util.Objects.requireNonNull(value, "maxConcurrency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxErrors() {
        return software.amazon.jsii.Kernel.get(this, "maxErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxErrors(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxErrors", java.util.Objects.requireNonNull(value, "maxErrors is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "priority", java.util.Objects.requireNonNull(value, "priority is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRoleArn", java.util.Objects.requireNonNull(value, "serviceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskArn() {
        return software.amazon.jsii.Kernel.get(this, "taskArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskArn", java.util.Objects.requireNonNull(value, "taskArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskType() {
        return software.amazon.jsii.Kernel.get(this, "taskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskType", java.util.Objects.requireNonNull(value, "taskType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWindowId() {
        return software.amazon.jsii.Kernel.get(this, "windowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWindowId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "windowId", java.util.Objects.requireNonNull(value, "windowId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask> {
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
        private final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_arn SsmMaintenanceWindowTask#task_arn}.
         * <p>
         * @return {@code this}
         * @param taskArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_arn SsmMaintenanceWindowTask#task_arn}. This parameter is required.
         */
        public Builder taskArn(final java.lang.String taskArn) {
            this.config.taskArn(taskArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_type SsmMaintenanceWindowTask#task_type}.
         * <p>
         * @return {@code this}
         * @param taskType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_type SsmMaintenanceWindowTask#task_type}. This parameter is required.
         */
        public Builder taskType(final java.lang.String taskType) {
            this.config.taskType(taskType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#window_id SsmMaintenanceWindowTask#window_id}.
         * <p>
         * @return {@code this}
         * @param windowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#window_id SsmMaintenanceWindowTask#window_id}. This parameter is required.
         */
        public Builder windowId(final java.lang.String windowId) {
            this.config.windowId(windowId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cutoff_behavior SsmMaintenanceWindowTask#cutoff_behavior}.
         * <p>
         * @return {@code this}
         * @param cutoffBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cutoff_behavior SsmMaintenanceWindowTask#cutoff_behavior}. This parameter is required.
         */
        public Builder cutoffBehavior(final java.lang.String cutoffBehavior) {
            this.config.cutoffBehavior(cutoffBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#description SsmMaintenanceWindowTask#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#description SsmMaintenanceWindowTask#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#id SsmMaintenanceWindowTask#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#id SsmMaintenanceWindowTask#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_concurrency SsmMaintenanceWindowTask#max_concurrency}.
         * <p>
         * @return {@code this}
         * @param maxConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_concurrency SsmMaintenanceWindowTask#max_concurrency}. This parameter is required.
         */
        public Builder maxConcurrency(final java.lang.String maxConcurrency) {
            this.config.maxConcurrency(maxConcurrency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_errors SsmMaintenanceWindowTask#max_errors}.
         * <p>
         * @return {@code this}
         * @param maxErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#max_errors SsmMaintenanceWindowTask#max_errors}. This parameter is required.
         */
        public Builder maxErrors(final java.lang.String maxErrors) {
            this.config.maxErrors(maxErrors);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#name SsmMaintenanceWindowTask#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#name SsmMaintenanceWindowTask#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#priority SsmMaintenanceWindowTask#priority}.
         * <p>
         * @return {@code this}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#priority SsmMaintenanceWindowTask#priority}. This parameter is required.
         */
        public Builder priority(final java.lang.Number priority) {
            this.config.priority(priority);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#service_role_arn SsmMaintenanceWindowTask#service_role_arn}. This parameter is required.
         */
        public Builder serviceRoleArn(final java.lang.String serviceRoleArn) {
            this.config.serviceRoleArn(serviceRoleArn);
            return this;
        }

        /**
         * targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#targets SsmMaintenanceWindowTask#targets}
         * <p>
         * @return {@code this}
         * @param targets targets block. This parameter is required.
         */
        public Builder targets(final com.hashicorp.cdktf.IResolvable targets) {
            this.config.targets(targets);
            return this;
        }
        /**
         * targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#targets SsmMaintenanceWindowTask#targets}
         * <p>
         * @return {@code this}
         * @param targets targets block. This parameter is required.
         */
        public Builder targets(final java.util.List<? extends imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTargets> targets) {
            this.config.targets(targets);
            return this;
        }

        /**
         * task_invocation_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#task_invocation_parameters SsmMaintenanceWindowTask#task_invocation_parameters}
         * <p>
         * @return {@code this}
         * @param taskInvocationParameters task_invocation_parameters block. This parameter is required.
         */
        public Builder taskInvocationParameters(final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParameters taskInvocationParameters) {
            this.config.taskInvocationParameters(taskInvocationParameters);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask}.
         */
        @Override
        public imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask build() {
            return new imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTask(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
