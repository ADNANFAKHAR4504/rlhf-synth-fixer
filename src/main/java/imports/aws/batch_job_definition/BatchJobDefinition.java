package imports.aws.batch_job_definition;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition aws_batch_job_definition}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinition")
public class BatchJobDefinition extends com.hashicorp.cdktf.TerraformResource {

    protected BatchJobDefinition(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinition(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.batch_job_definition.BatchJobDefinition.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition aws_batch_job_definition} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BatchJobDefinition(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BatchJobDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BatchJobDefinition to import. This parameter is required.
     * @param importFromId The id of the existing BatchJobDefinition that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BatchJobDefinition to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.batch_job_definition.BatchJobDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BatchJobDefinition resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BatchJobDefinition to import. This parameter is required.
     * @param importFromId The id of the existing BatchJobDefinition that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.batch_job_definition.BatchJobDefinition.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEksProperties(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksProperties value) {
        software.amazon.jsii.Kernel.call(this, "putEksProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetryStrategy(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy value) {
        software.amazon.jsii.Kernel.call(this, "putRetryStrategy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeout(final @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionTimeout value) {
        software.amazon.jsii.Kernel.call(this, "putTimeout", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContainerProperties() {
        software.amazon.jsii.Kernel.call(this, "resetContainerProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeregisterOnNewRevision() {
        software.amazon.jsii.Kernel.call(this, "resetDeregisterOnNewRevision", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcsProperties() {
        software.amazon.jsii.Kernel.call(this, "resetEcsProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEksProperties() {
        software.amazon.jsii.Kernel.call(this, "resetEksProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeProperties() {
        software.amazon.jsii.Kernel.call(this, "resetNodeProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatformCapabilities() {
        software.amazon.jsii.Kernel.call(this, "resetPlatformCapabilities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPropagateTags() {
        software.amazon.jsii.Kernel.call(this, "resetPropagateTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetRetryStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedulingPriority() {
        software.amazon.jsii.Kernel.call(this, "resetSchedulingPriority", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTimeout", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArnPrefix() {
        return software.amazon.jsii.Kernel.get(this, "arnPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesOutputReference getEksProperties() {
        return software.amazon.jsii.Kernel.get(this, "eksProperties", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyOutputReference getRetryStrategy() {
        return software.amazon.jsii.Kernel.get(this, "retryStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRevision() {
        return software.amazon.jsii.Kernel.get(this, "revision", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionTimeoutOutputReference getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionTimeoutOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "containerPropertiesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeregisterOnNewRevisionInput() {
        return software.amazon.jsii.Kernel.get(this, "deregisterOnNewRevisionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEcsPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "ecsPropertiesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksProperties getEksPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "eksPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodePropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "nodePropertiesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPlatformCapabilitiesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "platformCapabilitiesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPropagateTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "propagateTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy getRetryStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "retryStrategyInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSchedulingPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "schedulingPriorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionTimeout getTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionTimeout.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerProperties() {
        return software.amazon.jsii.Kernel.get(this, "containerProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerProperties(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerProperties", java.util.Objects.requireNonNull(value, "containerProperties is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeregisterOnNewRevision() {
        return software.amazon.jsii.Kernel.get(this, "deregisterOnNewRevision", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeregisterOnNewRevision(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deregisterOnNewRevision", java.util.Objects.requireNonNull(value, "deregisterOnNewRevision is required"));
    }

    public void setDeregisterOnNewRevision(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deregisterOnNewRevision", java.util.Objects.requireNonNull(value, "deregisterOnNewRevision is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEcsProperties() {
        return software.amazon.jsii.Kernel.get(this, "ecsProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEcsProperties(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ecsProperties", java.util.Objects.requireNonNull(value, "ecsProperties is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeProperties() {
        return software.amazon.jsii.Kernel.get(this, "nodeProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeProperties(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeProperties", java.util.Objects.requireNonNull(value, "nodeProperties is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPlatformCapabilities() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "platformCapabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPlatformCapabilities(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "platformCapabilities", java.util.Objects.requireNonNull(value, "platformCapabilities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPropagateTags() {
        return software.amazon.jsii.Kernel.get(this, "propagateTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPropagateTags(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "propagateTags", java.util.Objects.requireNonNull(value, "propagateTags is required"));
    }

    public void setPropagateTags(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "propagateTags", java.util.Objects.requireNonNull(value, "propagateTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSchedulingPriority() {
        return software.amazon.jsii.Kernel.get(this, "schedulingPriority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSchedulingPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "schedulingPriority", java.util.Objects.requireNonNull(value, "schedulingPriority is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.batch_job_definition.BatchJobDefinition}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.batch_job_definition.BatchJobDefinition> {
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
        private final imports.aws.batch_job_definition.BatchJobDefinitionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.batch_job_definition.BatchJobDefinitionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.
         * <p>
         * @return {@code this}
         * @param containerProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}. This parameter is required.
         */
        public Builder containerProperties(final java.lang.String containerProperties) {
            this.config.containerProperties(containerProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
         * <p>
         * @return {@code this}
         * @param deregisterOnNewRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}. This parameter is required.
         */
        public Builder deregisterOnNewRevision(final java.lang.Boolean deregisterOnNewRevision) {
            this.config.deregisterOnNewRevision(deregisterOnNewRevision);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
         * <p>
         * @return {@code this}
         * @param deregisterOnNewRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}. This parameter is required.
         */
        public Builder deregisterOnNewRevision(final com.hashicorp.cdktf.IResolvable deregisterOnNewRevision) {
            this.config.deregisterOnNewRevision(deregisterOnNewRevision);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.
         * <p>
         * @return {@code this}
         * @param ecsProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}. This parameter is required.
         */
        public Builder ecsProperties(final java.lang.String ecsProperties) {
            this.config.ecsProperties(ecsProperties);
            return this;
        }

        /**
         * eks_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
         * <p>
         * @return {@code this}
         * @param eksProperties eks_properties block. This parameter is required.
         */
        public Builder eksProperties(final imports.aws.batch_job_definition.BatchJobDefinitionEksProperties eksProperties) {
            this.config.eksProperties(eksProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.
         * <p>
         * @return {@code this}
         * @param nodeProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}. This parameter is required.
         */
        public Builder nodeProperties(final java.lang.String nodeProperties) {
            this.config.nodeProperties(nodeProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.
         * <p>
         * @return {@code this}
         * @param platformCapabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}. This parameter is required.
         */
        public Builder platformCapabilities(final java.util.List<java.lang.String> platformCapabilities) {
            this.config.platformCapabilities(platformCapabilities);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
         * <p>
         * @return {@code this}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}. This parameter is required.
         */
        public Builder propagateTags(final java.lang.Boolean propagateTags) {
            this.config.propagateTags(propagateTags);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
         * <p>
         * @return {@code this}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}. This parameter is required.
         */
        public Builder propagateTags(final com.hashicorp.cdktf.IResolvable propagateTags) {
            this.config.propagateTags(propagateTags);
            return this;
        }

        /**
         * retry_strategy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
         * <p>
         * @return {@code this}
         * @param retryStrategy retry_strategy block. This parameter is required.
         */
        public Builder retryStrategy(final imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy retryStrategy) {
            this.config.retryStrategy(retryStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.
         * <p>
         * @return {@code this}
         * @param schedulingPriority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}. This parameter is required.
         */
        public Builder schedulingPriority(final java.lang.Number schedulingPriority) {
            this.config.schedulingPriority(schedulingPriority);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeout block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
         * <p>
         * @return {@code this}
         * @param timeout timeout block. This parameter is required.
         */
        public Builder timeout(final imports.aws.batch_job_definition.BatchJobDefinitionTimeout timeout) {
            this.config.timeout(timeout);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.batch_job_definition.BatchJobDefinition}.
         */
        @Override
        public imports.aws.batch_job_definition.BatchJobDefinition build() {
            return new imports.aws.batch_job_definition.BatchJobDefinition(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
