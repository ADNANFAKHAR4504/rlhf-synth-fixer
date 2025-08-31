package imports.aws.gamelift_game_server_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group aws_gamelift_game_server_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameServerGroup.GameliftGameServerGroup")
public class GameliftGameServerGroup extends com.hashicorp.cdktf.TerraformResource {

    protected GameliftGameServerGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GameliftGameServerGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.gamelift_game_server_group.GameliftGameServerGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group aws_gamelift_game_server_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GameliftGameServerGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GameliftGameServerGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GameliftGameServerGroup to import. This parameter is required.
     * @param importFromId The id of the existing GameliftGameServerGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GameliftGameServerGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.gamelift_game_server_group.GameliftGameServerGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GameliftGameServerGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GameliftGameServerGroup to import. This parameter is required.
     * @param importFromId The id of the existing GameliftGameServerGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.gamelift_game_server_group.GameliftGameServerGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoScalingPolicy(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putAutoScalingPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceDefinition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition> __cast_cd4240 = (java.util.List<imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInstanceDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoScalingPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoScalingPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBalancingStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetBalancingStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGameServerProtectionPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetGameServerProtectionPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public void resetVpcSubnets() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSubnets", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoScalingGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyOutputReference getAutoScalingPolicy() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinitionList getInstanceDefinition() {
        return software.amazon.jsii.Kernel.get(this, "instanceDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinitionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy getAutoScalingPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBalancingStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "balancingStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGameServerGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "gameServerGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGameServerProtectionPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "gameServerProtectionPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInstanceDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "minSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSubnetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSubnetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBalancingStrategy() {
        return software.amazon.jsii.Kernel.get(this, "balancingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBalancingStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "balancingStrategy", java.util.Objects.requireNonNull(value, "balancingStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGameServerGroupName() {
        return software.amazon.jsii.Kernel.get(this, "gameServerGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGameServerGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gameServerGroupName", java.util.Objects.requireNonNull(value, "gameServerGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGameServerProtectionPolicy() {
        return software.amazon.jsii.Kernel.get(this, "gameServerProtectionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGameServerProtectionPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gameServerProtectionPolicy", java.util.Objects.requireNonNull(value, "gameServerProtectionPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSize() {
        return software.amazon.jsii.Kernel.get(this, "maxSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSize", java.util.Objects.requireNonNull(value, "maxSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinSize() {
        return software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minSize", java.util.Objects.requireNonNull(value, "minSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSubnets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSubnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSubnets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSubnets", java.util.Objects.requireNonNull(value, "vpcSubnets is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.gamelift_game_server_group.GameliftGameServerGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.gamelift_game_server_group.GameliftGameServerGroup> {
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
        private final imports.aws.gamelift_game_server_group.GameliftGameServerGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.gamelift_game_server_group.GameliftGameServerGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_group_name GameliftGameServerGroup#game_server_group_name}.
         * <p>
         * @return {@code this}
         * @param gameServerGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_group_name GameliftGameServerGroup#game_server_group_name}. This parameter is required.
         */
        public Builder gameServerGroupName(final java.lang.String gameServerGroupName) {
            this.config.gameServerGroupName(gameServerGroupName);
            return this;
        }

        /**
         * instance_definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_definition GameliftGameServerGroup#instance_definition}
         * <p>
         * @return {@code this}
         * @param instanceDefinition instance_definition block. This parameter is required.
         */
        public Builder instanceDefinition(final com.hashicorp.cdktf.IResolvable instanceDefinition) {
            this.config.instanceDefinition(instanceDefinition);
            return this;
        }
        /**
         * instance_definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_definition GameliftGameServerGroup#instance_definition}
         * <p>
         * @return {@code this}
         * @param instanceDefinition instance_definition block. This parameter is required.
         */
        public Builder instanceDefinition(final java.util.List<? extends imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition> instanceDefinition) {
            this.config.instanceDefinition(instanceDefinition);
            return this;
        }

        /**
         * launch_template block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#launch_template GameliftGameServerGroup#launch_template}
         * <p>
         * @return {@code this}
         * @param launchTemplate launch_template block. This parameter is required.
         */
        public Builder launchTemplate(final imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate launchTemplate) {
            this.config.launchTemplate(launchTemplate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#max_size GameliftGameServerGroup#max_size}.
         * <p>
         * @return {@code this}
         * @param maxSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#max_size GameliftGameServerGroup#max_size}. This parameter is required.
         */
        public Builder maxSize(final java.lang.Number maxSize) {
            this.config.maxSize(maxSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#min_size GameliftGameServerGroup#min_size}.
         * <p>
         * @return {@code this}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#min_size GameliftGameServerGroup#min_size}. This parameter is required.
         */
        public Builder minSize(final java.lang.Number minSize) {
            this.config.minSize(minSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#role_arn GameliftGameServerGroup#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#role_arn GameliftGameServerGroup#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * auto_scaling_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#auto_scaling_policy GameliftGameServerGroup#auto_scaling_policy}
         * <p>
         * @return {@code this}
         * @param autoScalingPolicy auto_scaling_policy block. This parameter is required.
         */
        public Builder autoScalingPolicy(final imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy autoScalingPolicy) {
            this.config.autoScalingPolicy(autoScalingPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#balancing_strategy GameliftGameServerGroup#balancing_strategy}.
         * <p>
         * @return {@code this}
         * @param balancingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#balancing_strategy GameliftGameServerGroup#balancing_strategy}. This parameter is required.
         */
        public Builder balancingStrategy(final java.lang.String balancingStrategy) {
            this.config.balancingStrategy(balancingStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_protection_policy GameliftGameServerGroup#game_server_protection_policy}.
         * <p>
         * @return {@code this}
         * @param gameServerProtectionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_protection_policy GameliftGameServerGroup#game_server_protection_policy}. This parameter is required.
         */
        public Builder gameServerProtectionPolicy(final java.lang.String gameServerProtectionPolicy) {
            this.config.gameServerProtectionPolicy(gameServerProtectionPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#id GameliftGameServerGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#id GameliftGameServerGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags GameliftGameServerGroup#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags GameliftGameServerGroup#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags_all GameliftGameServerGroup#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags_all GameliftGameServerGroup#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#timeouts GameliftGameServerGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#vpc_subnets GameliftGameServerGroup#vpc_subnets}.
         * <p>
         * @return {@code this}
         * @param vpcSubnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#vpc_subnets GameliftGameServerGroup#vpc_subnets}. This parameter is required.
         */
        public Builder vpcSubnets(final java.util.List<java.lang.String> vpcSubnets) {
            this.config.vpcSubnets(vpcSubnets);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.gamelift_game_server_group.GameliftGameServerGroup}.
         */
        @Override
        public imports.aws.gamelift_game_server_group.GameliftGameServerGroup build() {
            return new imports.aws.gamelift_game_server_group.GameliftGameServerGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
