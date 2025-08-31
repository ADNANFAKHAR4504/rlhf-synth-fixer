package imports.aws.cloudformation_stack_set;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set aws_cloudformation_stack_set}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.220Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSet")
public class CloudformationStackSet extends com.hashicorp.cdktf.TerraformResource {

    protected CloudformationStackSet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackSet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudformation_stack_set.CloudformationStackSet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set aws_cloudformation_stack_set} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudformationStackSet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackSet to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackSet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudformationStackSet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_set.CloudformationStackSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudformationStackSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudformationStackSet to import. This parameter is required.
     * @param importFromId The id of the existing CloudformationStackSet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudformation_stack_set.CloudformationStackSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoDeployment(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment value) {
        software.amazon.jsii.Kernel.call(this, "putAutoDeployment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putManagedExecution(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution value) {
        software.amazon.jsii.Kernel.call(this, "putManagedExecution", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOperationPreferences(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences value) {
        software.amazon.jsii.Kernel.call(this, "putOperationPreferences", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdministrationRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetAdministrationRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoDeployment() {
        software.amazon.jsii.Kernel.call(this, "resetAutoDeployment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCallAs() {
        software.amazon.jsii.Kernel.call(this, "resetCallAs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapabilities() {
        software.amazon.jsii.Kernel.call(this, "resetCapabilities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRoleName() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRoleName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedExecution() {
        software.amazon.jsii.Kernel.call(this, "resetManagedExecution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperationPreferences() {
        software.amazon.jsii.Kernel.call(this, "resetOperationPreferences", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermissionModel() {
        software.amazon.jsii.Kernel.call(this, "resetPermissionModel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateBody() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateUrl() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateUrl", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeploymentOutputReference getAutoDeployment() {
        return software.amazon.jsii.Kernel.get(this, "autoDeployment", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeploymentOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecutionOutputReference getManagedExecution() {
        return software.amazon.jsii.Kernel.get(this, "managedExecution", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecutionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferencesOutputReference getOperationPreferences() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferencesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackSetId() {
        return software.amazon.jsii.Kernel.get(this, "stackSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudformation_stack_set.CloudformationStackSetTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdministrationRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "administrationRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment getAutoDeploymentInput() {
        return software.amazon.jsii.Kernel.get(this, "autoDeploymentInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCallAsInput() {
        return software.amazon.jsii.Kernel.get(this, "callAsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapabilitiesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "capabilitiesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution getManagedExecutionInput() {
        return software.amazon.jsii.Kernel.get(this, "managedExecutionInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences getOperationPreferencesInput() {
        return software.amazon.jsii.Kernel.get(this, "operationPreferencesInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionModelInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "templateBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "templateUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdministrationRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "administrationRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdministrationRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "administrationRoleArn", java.util.Objects.requireNonNull(value, "administrationRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCallAs() {
        return software.amazon.jsii.Kernel.get(this, "callAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCallAs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "callAs", java.util.Objects.requireNonNull(value, "callAs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCapabilities() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "capabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCapabilities(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "capabilities", java.util.Objects.requireNonNull(value, "capabilities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleName() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleName", java.util.Objects.requireNonNull(value, "executionRoleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermissionModel() {
        return software.amazon.jsii.Kernel.get(this, "permissionModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermissionModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permissionModel", java.util.Objects.requireNonNull(value, "permissionModel is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateBody() {
        return software.amazon.jsii.Kernel.get(this, "templateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateBody", java.util.Objects.requireNonNull(value, "templateBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateUrl() {
        return software.amazon.jsii.Kernel.get(this, "templateUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateUrl", java.util.Objects.requireNonNull(value, "templateUrl is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudformation_stack_set.CloudformationStackSet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudformation_stack_set.CloudformationStackSet> {
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
        private final imports.aws.cloudformation_stack_set.CloudformationStackSetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudformation_stack_set.CloudformationStackSetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#name CloudformationStackSet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#name CloudformationStackSet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#administration_role_arn CloudformationStackSet#administration_role_arn}.
         * <p>
         * @return {@code this}
         * @param administrationRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#administration_role_arn CloudformationStackSet#administration_role_arn}. This parameter is required.
         */
        public Builder administrationRoleArn(final java.lang.String administrationRoleArn) {
            this.config.administrationRoleArn(administrationRoleArn);
            return this;
        }

        /**
         * auto_deployment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#auto_deployment CloudformationStackSet#auto_deployment}
         * <p>
         * @return {@code this}
         * @param autoDeployment auto_deployment block. This parameter is required.
         */
        public Builder autoDeployment(final imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment autoDeployment) {
            this.config.autoDeployment(autoDeployment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#call_as CloudformationStackSet#call_as}.
         * <p>
         * @return {@code this}
         * @param callAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#call_as CloudformationStackSet#call_as}. This parameter is required.
         */
        public Builder callAs(final java.lang.String callAs) {
            this.config.callAs(callAs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#capabilities CloudformationStackSet#capabilities}.
         * <p>
         * @return {@code this}
         * @param capabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#capabilities CloudformationStackSet#capabilities}. This parameter is required.
         */
        public Builder capabilities(final java.util.List<java.lang.String> capabilities) {
            this.config.capabilities(capabilities);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#description CloudformationStackSet#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#description CloudformationStackSet#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#execution_role_name CloudformationStackSet#execution_role_name}.
         * <p>
         * @return {@code this}
         * @param executionRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#execution_role_name CloudformationStackSet#execution_role_name}. This parameter is required.
         */
        public Builder executionRoleName(final java.lang.String executionRoleName) {
            this.config.executionRoleName(executionRoleName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#id CloudformationStackSet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#id CloudformationStackSet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * managed_execution block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#managed_execution CloudformationStackSet#managed_execution}
         * <p>
         * @return {@code this}
         * @param managedExecution managed_execution block. This parameter is required.
         */
        public Builder managedExecution(final imports.aws.cloudformation_stack_set.CloudformationStackSetManagedExecution managedExecution) {
            this.config.managedExecution(managedExecution);
            return this;
        }

        /**
         * operation_preferences block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#operation_preferences CloudformationStackSet#operation_preferences}
         * <p>
         * @return {@code this}
         * @param operationPreferences operation_preferences block. This parameter is required.
         */
        public Builder operationPreferences(final imports.aws.cloudformation_stack_set.CloudformationStackSetOperationPreferences operationPreferences) {
            this.config.operationPreferences(operationPreferences);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#parameters CloudformationStackSet#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#parameters CloudformationStackSet#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#permission_model CloudformationStackSet#permission_model}.
         * <p>
         * @return {@code this}
         * @param permissionModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#permission_model CloudformationStackSet#permission_model}. This parameter is required.
         */
        public Builder permissionModel(final java.lang.String permissionModel) {
            this.config.permissionModel(permissionModel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags CloudformationStackSet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags CloudformationStackSet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags_all CloudformationStackSet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#tags_all CloudformationStackSet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_body CloudformationStackSet#template_body}.
         * <p>
         * @return {@code this}
         * @param templateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_body CloudformationStackSet#template_body}. This parameter is required.
         */
        public Builder templateBody(final java.lang.String templateBody) {
            this.config.templateBody(templateBody);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_url CloudformationStackSet#template_url}.
         * <p>
         * @return {@code this}
         * @param templateUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#template_url CloudformationStackSet#template_url}. This parameter is required.
         */
        public Builder templateUrl(final java.lang.String templateUrl) {
            this.config.templateUrl(templateUrl);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#timeouts CloudformationStackSet#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.cloudformation_stack_set.CloudformationStackSetTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudformation_stack_set.CloudformationStackSet}.
         */
        @Override
        public imports.aws.cloudformation_stack_set.CloudformationStackSet build() {
            return new imports.aws.cloudformation_stack_set.CloudformationStackSet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
