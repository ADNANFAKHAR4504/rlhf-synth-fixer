package imports.aws.codebuild_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet aws_codebuild_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleet")
public class CodebuildFleet extends com.hashicorp.cdktf.TerraformResource {

    protected CodebuildFleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildFleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.codebuild_fleet.CodebuildFleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet aws_codebuild_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CodebuildFleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CodebuildFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodebuildFleet to import. This parameter is required.
     * @param importFromId The id of the existing CodebuildFleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CodebuildFleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codebuild_fleet.CodebuildFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CodebuildFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodebuildFleet to import. This parameter is required.
     * @param importFromId The id of the existing CodebuildFleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codebuild_fleet.CodebuildFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putComputeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putComputeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codebuild_fleet.CodebuildFleetVpcConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codebuild_fleet.CodebuildFleetVpcConfig> __cast_cd4240 = (java.util.List<imports.aws.codebuild_fleet.CodebuildFleetVpcConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codebuild_fleet.CodebuildFleetVpcConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComputeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetComputeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetServiceRole() {
        software.amazon.jsii.Kernel.call(this, "resetFleetServiceRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageId() {
        software.amazon.jsii.Kernel.call(this, "resetImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverflowBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetOverflowBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetComputeConfigurationOutputReference getComputeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "computeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetComputeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreated() {
        return software.amazon.jsii.Kernel.get(this, "created", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModified() {
        return software.amazon.jsii.Kernel.get(this, "lastModified", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationOutputReference getScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetStatusList getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_fleet.CodebuildFleetVpcConfigList getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetVpcConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBaseCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "baseCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration getComputeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "computeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "computeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFleetServiceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetServiceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "imageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOverflowBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "overflowBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration getScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBaseCapacity() {
        return software.amazon.jsii.Kernel.get(this, "baseCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBaseCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "baseCapacity", java.util.Objects.requireNonNull(value, "baseCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeType() {
        return software.amazon.jsii.Kernel.get(this, "computeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeType", java.util.Objects.requireNonNull(value, "computeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentType() {
        return software.amazon.jsii.Kernel.get(this, "environmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnvironmentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "environmentType", java.util.Objects.requireNonNull(value, "environmentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFleetServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "fleetServiceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFleetServiceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fleetServiceRole", java.util.Objects.requireNonNull(value, "fleetServiceRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageId() {
        return software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageId", java.util.Objects.requireNonNull(value, "imageId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOverflowBehavior() {
        return software.amazon.jsii.Kernel.get(this, "overflowBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOverflowBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "overflowBehavior", java.util.Objects.requireNonNull(value, "overflowBehavior is required"));
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
     * A fluent builder for {@link imports.aws.codebuild_fleet.CodebuildFleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.codebuild_fleet.CodebuildFleet> {
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
        private final imports.aws.codebuild_fleet.CodebuildFleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.codebuild_fleet.CodebuildFleetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#base_capacity CodebuildFleet#base_capacity}.
         * <p>
         * @return {@code this}
         * @param baseCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#base_capacity CodebuildFleet#base_capacity}. This parameter is required.
         */
        public Builder baseCapacity(final java.lang.Number baseCapacity) {
            this.config.baseCapacity(baseCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_type CodebuildFleet#compute_type}.
         * <p>
         * @return {@code this}
         * @param computeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_type CodebuildFleet#compute_type}. This parameter is required.
         */
        public Builder computeType(final java.lang.String computeType) {
            this.config.computeType(computeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#environment_type CodebuildFleet#environment_type}.
         * <p>
         * @return {@code this}
         * @param environmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#environment_type CodebuildFleet#environment_type}. This parameter is required.
         */
        public Builder environmentType(final java.lang.String environmentType) {
            this.config.environmentType(environmentType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#name CodebuildFleet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#name CodebuildFleet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * compute_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#compute_configuration CodebuildFleet#compute_configuration}
         * <p>
         * @return {@code this}
         * @param computeConfiguration compute_configuration block. This parameter is required.
         */
        public Builder computeConfiguration(final imports.aws.codebuild_fleet.CodebuildFleetComputeConfiguration computeConfiguration) {
            this.config.computeConfiguration(computeConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#fleet_service_role CodebuildFleet#fleet_service_role}.
         * <p>
         * @return {@code this}
         * @param fleetServiceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#fleet_service_role CodebuildFleet#fleet_service_role}. This parameter is required.
         */
        public Builder fleetServiceRole(final java.lang.String fleetServiceRole) {
            this.config.fleetServiceRole(fleetServiceRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#image_id CodebuildFleet#image_id}.
         * <p>
         * @return {@code this}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#image_id CodebuildFleet#image_id}. This parameter is required.
         */
        public Builder imageId(final java.lang.String imageId) {
            this.config.imageId(imageId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#overflow_behavior CodebuildFleet#overflow_behavior}.
         * <p>
         * @return {@code this}
         * @param overflowBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#overflow_behavior CodebuildFleet#overflow_behavior}. This parameter is required.
         */
        public Builder overflowBehavior(final java.lang.String overflowBehavior) {
            this.config.overflowBehavior(overflowBehavior);
            return this;
        }

        /**
         * scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#scaling_configuration CodebuildFleet#scaling_configuration}
         * <p>
         * @return {@code this}
         * @param scalingConfiguration scaling_configuration block. This parameter is required.
         */
        public Builder scalingConfiguration(final imports.aws.codebuild_fleet.CodebuildFleetScalingConfiguration scalingConfiguration) {
            this.config.scalingConfiguration(scalingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags CodebuildFleet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags CodebuildFleet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags_all CodebuildFleet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#tags_all CodebuildFleet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_config CodebuildFleet#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final com.hashicorp.cdktf.IResolvable vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }
        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_config CodebuildFleet#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final java.util.List<? extends imports.aws.codebuild_fleet.CodebuildFleetVpcConfig> vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.codebuild_fleet.CodebuildFleet}.
         */
        @Override
        public imports.aws.codebuild_fleet.CodebuildFleet build() {
            return new imports.aws.codebuild_fleet.CodebuildFleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
