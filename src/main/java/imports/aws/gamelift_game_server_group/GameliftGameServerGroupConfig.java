package imports.aws.gamelift_game_server_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameServerGroup.GameliftGameServerGroupConfig")
@software.amazon.jsii.Jsii.Proxy(GameliftGameServerGroupConfig.Jsii$Proxy.class)
public interface GameliftGameServerGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_group_name GameliftGameServerGroup#game_server_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGameServerGroupName();

    /**
     * instance_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_definition GameliftGameServerGroup#instance_definition}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInstanceDefinition();

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#launch_template GameliftGameServerGroup#launch_template}
     */
    @org.jetbrains.annotations.NotNull imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate getLaunchTemplate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#max_size GameliftGameServerGroup#max_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#min_size GameliftGameServerGroup#min_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#role_arn GameliftGameServerGroup#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * auto_scaling_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#auto_scaling_policy GameliftGameServerGroup#auto_scaling_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy getAutoScalingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#balancing_strategy GameliftGameServerGroup#balancing_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBalancingStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_protection_policy GameliftGameServerGroup#game_server_protection_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGameServerProtectionPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#id GameliftGameServerGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags GameliftGameServerGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags_all GameliftGameServerGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#timeouts GameliftGameServerGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#vpc_subnets GameliftGameServerGroup#vpc_subnets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSubnets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftGameServerGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftGameServerGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftGameServerGroupConfig> {
        java.lang.String gameServerGroupName;
        java.lang.Object instanceDefinition;
        imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate launchTemplate;
        java.lang.Number maxSize;
        java.lang.Number minSize;
        java.lang.String roleArn;
        imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy autoScalingPolicy;
        java.lang.String balancingStrategy;
        java.lang.String gameServerProtectionPolicy;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts timeouts;
        java.util.List<java.lang.String> vpcSubnets;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getGameServerGroupName}
         * @param gameServerGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_group_name GameliftGameServerGroup#game_server_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder gameServerGroupName(java.lang.String gameServerGroupName) {
            this.gameServerGroupName = gameServerGroupName;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getInstanceDefinition}
         * @param instanceDefinition instance_definition block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_definition GameliftGameServerGroup#instance_definition}
         * @return {@code this}
         */
        public Builder instanceDefinition(com.hashicorp.cdktf.IResolvable instanceDefinition) {
            this.instanceDefinition = instanceDefinition;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getInstanceDefinition}
         * @param instanceDefinition instance_definition block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_definition GameliftGameServerGroup#instance_definition}
         * @return {@code this}
         */
        public Builder instanceDefinition(java.util.List<? extends imports.aws.gamelift_game_server_group.GameliftGameServerGroupInstanceDefinition> instanceDefinition) {
            this.instanceDefinition = instanceDefinition;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getLaunchTemplate}
         * @param launchTemplate launch_template block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#launch_template GameliftGameServerGroup#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getMaxSize}
         * @param maxSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#max_size GameliftGameServerGroup#max_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxSize(java.lang.Number maxSize) {
            this.maxSize = maxSize;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getMinSize}
         * @param minSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#min_size GameliftGameServerGroup#min_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder minSize(java.lang.Number minSize) {
            this.minSize = minSize;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#role_arn GameliftGameServerGroup#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getAutoScalingPolicy}
         * @param autoScalingPolicy auto_scaling_policy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#auto_scaling_policy GameliftGameServerGroup#auto_scaling_policy}
         * @return {@code this}
         */
        public Builder autoScalingPolicy(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy autoScalingPolicy) {
            this.autoScalingPolicy = autoScalingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getBalancingStrategy}
         * @param balancingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#balancing_strategy GameliftGameServerGroup#balancing_strategy}.
         * @return {@code this}
         */
        public Builder balancingStrategy(java.lang.String balancingStrategy) {
            this.balancingStrategy = balancingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getGameServerProtectionPolicy}
         * @param gameServerProtectionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#game_server_protection_policy GameliftGameServerGroup#game_server_protection_policy}.
         * @return {@code this}
         */
        public Builder gameServerProtectionPolicy(java.lang.String gameServerProtectionPolicy) {
            this.gameServerProtectionPolicy = gameServerProtectionPolicy;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#id GameliftGameServerGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags GameliftGameServerGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#tags_all GameliftGameServerGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#timeouts GameliftGameServerGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getVpcSubnets}
         * @param vpcSubnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#vpc_subnets GameliftGameServerGroup#vpc_subnets}.
         * @return {@code this}
         */
        public Builder vpcSubnets(java.util.List<java.lang.String> vpcSubnets) {
            this.vpcSubnets = vpcSubnets;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftGameServerGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftGameServerGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftGameServerGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftGameServerGroupConfig {
        private final java.lang.String gameServerGroupName;
        private final java.lang.Object instanceDefinition;
        private final imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate launchTemplate;
        private final java.lang.Number maxSize;
        private final java.lang.Number minSize;
        private final java.lang.String roleArn;
        private final imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy autoScalingPolicy;
        private final java.lang.String balancingStrategy;
        private final java.lang.String gameServerProtectionPolicy;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts timeouts;
        private final java.util.List<java.lang.String> vpcSubnets;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gameServerGroupName = software.amazon.jsii.Kernel.get(this, "gameServerGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceDefinition = software.amazon.jsii.Kernel.get(this, "instanceDefinition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate.class));
            this.maxSize = software.amazon.jsii.Kernel.get(this, "maxSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minSize = software.amazon.jsii.Kernel.get(this, "minSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoScalingPolicy = software.amazon.jsii.Kernel.get(this, "autoScalingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy.class));
            this.balancingStrategy = software.amazon.jsii.Kernel.get(this, "balancingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gameServerProtectionPolicy = software.amazon.jsii.Kernel.get(this, "gameServerProtectionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts.class));
            this.vpcSubnets = software.amazon.jsii.Kernel.get(this, "vpcSubnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gameServerGroupName = java.util.Objects.requireNonNull(builder.gameServerGroupName, "gameServerGroupName is required");
            this.instanceDefinition = java.util.Objects.requireNonNull(builder.instanceDefinition, "instanceDefinition is required");
            this.launchTemplate = java.util.Objects.requireNonNull(builder.launchTemplate, "launchTemplate is required");
            this.maxSize = java.util.Objects.requireNonNull(builder.maxSize, "maxSize is required");
            this.minSize = java.util.Objects.requireNonNull(builder.minSize, "minSize is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.autoScalingPolicy = builder.autoScalingPolicy;
            this.balancingStrategy = builder.balancingStrategy;
            this.gameServerProtectionPolicy = builder.gameServerProtectionPolicy;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcSubnets = builder.vpcSubnets;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getGameServerGroupName() {
            return this.gameServerGroupName;
        }

        @Override
        public final java.lang.Object getInstanceDefinition() {
            return this.instanceDefinition;
        }

        @Override
        public final imports.aws.gamelift_game_server_group.GameliftGameServerGroupLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final java.lang.Number getMaxSize() {
            return this.maxSize;
        }

        @Override
        public final java.lang.Number getMinSize() {
            return this.minSize;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.gamelift_game_server_group.GameliftGameServerGroupAutoScalingPolicy getAutoScalingPolicy() {
            return this.autoScalingPolicy;
        }

        @Override
        public final java.lang.String getBalancingStrategy() {
            return this.balancingStrategy;
        }

        @Override
        public final java.lang.String getGameServerProtectionPolicy() {
            return this.gameServerProtectionPolicy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.gamelift_game_server_group.GameliftGameServerGroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSubnets() {
            return this.vpcSubnets;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("gameServerGroupName", om.valueToTree(this.getGameServerGroupName()));
            data.set("instanceDefinition", om.valueToTree(this.getInstanceDefinition()));
            data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            data.set("maxSize", om.valueToTree(this.getMaxSize()));
            data.set("minSize", om.valueToTree(this.getMinSize()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getAutoScalingPolicy() != null) {
                data.set("autoScalingPolicy", om.valueToTree(this.getAutoScalingPolicy()));
            }
            if (this.getBalancingStrategy() != null) {
                data.set("balancingStrategy", om.valueToTree(this.getBalancingStrategy()));
            }
            if (this.getGameServerProtectionPolicy() != null) {
                data.set("gameServerProtectionPolicy", om.valueToTree(this.getGameServerProtectionPolicy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpcSubnets() != null) {
                data.set("vpcSubnets", om.valueToTree(this.getVpcSubnets()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftGameServerGroup.GameliftGameServerGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftGameServerGroupConfig.Jsii$Proxy that = (GameliftGameServerGroupConfig.Jsii$Proxy) o;

            if (!gameServerGroupName.equals(that.gameServerGroupName)) return false;
            if (!instanceDefinition.equals(that.instanceDefinition)) return false;
            if (!launchTemplate.equals(that.launchTemplate)) return false;
            if (!maxSize.equals(that.maxSize)) return false;
            if (!minSize.equals(that.minSize)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.autoScalingPolicy != null ? !this.autoScalingPolicy.equals(that.autoScalingPolicy) : that.autoScalingPolicy != null) return false;
            if (this.balancingStrategy != null ? !this.balancingStrategy.equals(that.balancingStrategy) : that.balancingStrategy != null) return false;
            if (this.gameServerProtectionPolicy != null ? !this.gameServerProtectionPolicy.equals(that.gameServerProtectionPolicy) : that.gameServerProtectionPolicy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcSubnets != null ? !this.vpcSubnets.equals(that.vpcSubnets) : that.vpcSubnets != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.gameServerGroupName.hashCode();
            result = 31 * result + (this.instanceDefinition.hashCode());
            result = 31 * result + (this.launchTemplate.hashCode());
            result = 31 * result + (this.maxSize.hashCode());
            result = 31 * result + (this.minSize.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.autoScalingPolicy != null ? this.autoScalingPolicy.hashCode() : 0);
            result = 31 * result + (this.balancingStrategy != null ? this.balancingStrategy.hashCode() : 0);
            result = 31 * result + (this.gameServerProtectionPolicy != null ? this.gameServerProtectionPolicy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcSubnets != null ? this.vpcSubnets.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
