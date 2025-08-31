package imports.aws.batch_compute_environment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment aws_batch_compute_environment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironment")
public class BatchComputeEnvironment extends com.hashicorp.cdktf.TerraformResource {

    protected BatchComputeEnvironment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchComputeEnvironment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.batch_compute_environment.BatchComputeEnvironment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment aws_batch_compute_environment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BatchComputeEnvironment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BatchComputeEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BatchComputeEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing BatchComputeEnvironment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BatchComputeEnvironment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.batch_compute_environment.BatchComputeEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BatchComputeEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BatchComputeEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing BatchComputeEnvironment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.batch_compute_environment.BatchComputeEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putComputeResources(final @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources value) {
        software.amazon.jsii.Kernel.call(this, "putComputeResources", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEksConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEksConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpdatePolicy(final @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy value) {
        software.amazon.jsii.Kernel.call(this, "putUpdatePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComputeEnvironmentName() {
        software.amazon.jsii.Kernel.call(this, "resetComputeEnvironmentName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComputeEnvironmentNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetComputeEnvironmentNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComputeResources() {
        software.amazon.jsii.Kernel.call(this, "resetComputeResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEksConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEksConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceRole() {
        software.amazon.jsii.Kernel.call(this, "resetServiceRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetState() {
        software.amazon.jsii.Kernel.call(this, "resetState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdatePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetUpdatePolicy", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesOutputReference getComputeResources() {
        return software.amazon.jsii.Kernel.get(this, "computeResources", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEcsClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "ecsClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfigurationOutputReference getEksConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "eksConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusReason() {
        return software.amazon.jsii.Kernel.get(this, "statusReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicyOutputReference getUpdatePolicy() {
        return software.amazon.jsii.Kernel.get(this, "updatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeEnvironmentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironmentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeEnvironmentNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironmentNamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources getComputeResourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "computeResourcesInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration getEksConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "eksConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateInput() {
        return software.amazon.jsii.Kernel.get(this, "stateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy getUpdatePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "updatePolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeEnvironmentName() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeEnvironmentName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeEnvironmentName", java.util.Objects.requireNonNull(value, "computeEnvironmentName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeEnvironmentNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "computeEnvironmentNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeEnvironmentNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeEnvironmentNamePrefix", java.util.Objects.requireNonNull(value, "computeEnvironmentNamePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRole", java.util.Objects.requireNonNull(value, "serviceRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "state", java.util.Objects.requireNonNull(value, "state is required"));
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
     * A fluent builder for {@link imports.aws.batch_compute_environment.BatchComputeEnvironment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.batch_compute_environment.BatchComputeEnvironment> {
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
        private final imports.aws.batch_compute_environment.BatchComputeEnvironmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.batch_compute_environment.BatchComputeEnvironmentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name BatchComputeEnvironment#compute_environment_name}.
         * <p>
         * @return {@code this}
         * @param computeEnvironmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name BatchComputeEnvironment#compute_environment_name}. This parameter is required.
         */
        public Builder computeEnvironmentName(final java.lang.String computeEnvironmentName) {
            this.config.computeEnvironmentName(computeEnvironmentName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name_prefix BatchComputeEnvironment#compute_environment_name_prefix}.
         * <p>
         * @return {@code this}
         * @param computeEnvironmentNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_environment_name_prefix BatchComputeEnvironment#compute_environment_name_prefix}. This parameter is required.
         */
        public Builder computeEnvironmentNamePrefix(final java.lang.String computeEnvironmentNamePrefix) {
            this.config.computeEnvironmentNamePrefix(computeEnvironmentNamePrefix);
            return this;
        }

        /**
         * compute_resources block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#compute_resources BatchComputeEnvironment#compute_resources}
         * <p>
         * @return {@code this}
         * @param computeResources compute_resources block. This parameter is required.
         */
        public Builder computeResources(final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResources computeResources) {
            this.config.computeResources(computeResources);
            return this;
        }

        /**
         * eks_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#eks_configuration BatchComputeEnvironment#eks_configuration}
         * <p>
         * @return {@code this}
         * @param eksConfiguration eks_configuration block. This parameter is required.
         */
        public Builder eksConfiguration(final imports.aws.batch_compute_environment.BatchComputeEnvironmentEksConfiguration eksConfiguration) {
            this.config.eksConfiguration(eksConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#id BatchComputeEnvironment#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#id BatchComputeEnvironment#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#service_role BatchComputeEnvironment#service_role}.
         * <p>
         * @return {@code this}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#service_role BatchComputeEnvironment#service_role}. This parameter is required.
         */
        public Builder serviceRole(final java.lang.String serviceRole) {
            this.config.serviceRole(serviceRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#state BatchComputeEnvironment#state}.
         * <p>
         * @return {@code this}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#state BatchComputeEnvironment#state}. This parameter is required.
         */
        public Builder state(final java.lang.String state) {
            this.config.state(state);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags_all BatchComputeEnvironment#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags_all BatchComputeEnvironment#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * update_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#update_policy BatchComputeEnvironment#update_policy}
         * <p>
         * @return {@code this}
         * @param updatePolicy update_policy block. This parameter is required.
         */
        public Builder updatePolicy(final imports.aws.batch_compute_environment.BatchComputeEnvironmentUpdatePolicy updatePolicy) {
            this.config.updatePolicy(updatePolicy);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.batch_compute_environment.BatchComputeEnvironment}.
         */
        @Override
        public imports.aws.batch_compute_environment.BatchComputeEnvironment build() {
            return new imports.aws.batch_compute_environment.BatchComputeEnvironment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
