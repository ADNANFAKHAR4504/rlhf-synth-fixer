package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetConfig")
@software.amazon.jsii.Jsii.Proxy(GameliftFleetConfig.Jsii$Proxy.class)
public interface GameliftFleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_instance_type GameliftFleet#ec2_instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEc2InstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#name GameliftFleet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#build_id GameliftFleet#build_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBuildId() {
        return null;
    }

    /**
     * certificate_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#certificate_configuration GameliftFleet#certificate_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration getCertificateConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#description GameliftFleet#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * ec2_inbound_permission block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_inbound_permission GameliftFleet#ec2_inbound_permission}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEc2InboundPermission() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#fleet_type GameliftFleet#fleet_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#id GameliftFleet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#instance_role_arn GameliftFleet#instance_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#metric_groups GameliftFleet#metric_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMetricGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_session_protection_policy GameliftFleet#new_game_session_protection_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNewGameSessionProtectionPolicy() {
        return null;
    }

    /**
     * resource_creation_limit_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#resource_creation_limit_policy GameliftFleet#resource_creation_limit_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy getResourceCreationLimitPolicy() {
        return null;
    }

    /**
     * runtime_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#runtime_configuration GameliftFleet#runtime_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration getRuntimeConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#script_id GameliftFleet#script_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScriptId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags GameliftFleet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags_all GameliftFleet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#timeouts GameliftFleet#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftFleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftFleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftFleetConfig> {
        java.lang.String ec2InstanceType;
        java.lang.String name;
        java.lang.String buildId;
        imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration certificateConfiguration;
        java.lang.String description;
        java.lang.Object ec2InboundPermission;
        java.lang.String fleetType;
        java.lang.String id;
        java.lang.String instanceRoleArn;
        java.util.List<java.lang.String> metricGroups;
        java.lang.String newGameSessionProtectionPolicy;
        imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy resourceCreationLimitPolicy;
        imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration runtimeConfiguration;
        java.lang.String scriptId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.gamelift_fleet.GameliftFleetTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GameliftFleetConfig#getEc2InstanceType}
         * @param ec2InstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_instance_type GameliftFleet#ec2_instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder ec2InstanceType(java.lang.String ec2InstanceType) {
            this.ec2InstanceType = ec2InstanceType;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#name GameliftFleet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getBuildId}
         * @param buildId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#build_id GameliftFleet#build_id}.
         * @return {@code this}
         */
        public Builder buildId(java.lang.String buildId) {
            this.buildId = buildId;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getCertificateConfiguration}
         * @param certificateConfiguration certificate_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#certificate_configuration GameliftFleet#certificate_configuration}
         * @return {@code this}
         */
        public Builder certificateConfiguration(imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration certificateConfiguration) {
            this.certificateConfiguration = certificateConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#description GameliftFleet#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getEc2InboundPermission}
         * @param ec2InboundPermission ec2_inbound_permission block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_inbound_permission GameliftFleet#ec2_inbound_permission}
         * @return {@code this}
         */
        public Builder ec2InboundPermission(com.hashicorp.cdktf.IResolvable ec2InboundPermission) {
            this.ec2InboundPermission = ec2InboundPermission;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getEc2InboundPermission}
         * @param ec2InboundPermission ec2_inbound_permission block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#ec2_inbound_permission GameliftFleet#ec2_inbound_permission}
         * @return {@code this}
         */
        public Builder ec2InboundPermission(java.util.List<? extends imports.aws.gamelift_fleet.GameliftFleetEc2InboundPermission> ec2InboundPermission) {
            this.ec2InboundPermission = ec2InboundPermission;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getFleetType}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#fleet_type GameliftFleet#fleet_type}.
         * @return {@code this}
         */
        public Builder fleetType(java.lang.String fleetType) {
            this.fleetType = fleetType;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#id GameliftFleet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getInstanceRoleArn}
         * @param instanceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#instance_role_arn GameliftFleet#instance_role_arn}.
         * @return {@code this}
         */
        public Builder instanceRoleArn(java.lang.String instanceRoleArn) {
            this.instanceRoleArn = instanceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getMetricGroups}
         * @param metricGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#metric_groups GameliftFleet#metric_groups}.
         * @return {@code this}
         */
        public Builder metricGroups(java.util.List<java.lang.String> metricGroups) {
            this.metricGroups = metricGroups;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getNewGameSessionProtectionPolicy}
         * @param newGameSessionProtectionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_session_protection_policy GameliftFleet#new_game_session_protection_policy}.
         * @return {@code this}
         */
        public Builder newGameSessionProtectionPolicy(java.lang.String newGameSessionProtectionPolicy) {
            this.newGameSessionProtectionPolicy = newGameSessionProtectionPolicy;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getResourceCreationLimitPolicy}
         * @param resourceCreationLimitPolicy resource_creation_limit_policy block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#resource_creation_limit_policy GameliftFleet#resource_creation_limit_policy}
         * @return {@code this}
         */
        public Builder resourceCreationLimitPolicy(imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy resourceCreationLimitPolicy) {
            this.resourceCreationLimitPolicy = resourceCreationLimitPolicy;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getRuntimeConfiguration}
         * @param runtimeConfiguration runtime_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#runtime_configuration GameliftFleet#runtime_configuration}
         * @return {@code this}
         */
        public Builder runtimeConfiguration(imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration runtimeConfiguration) {
            this.runtimeConfiguration = runtimeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getScriptId}
         * @param scriptId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#script_id GameliftFleet#script_id}.
         * @return {@code this}
         */
        public Builder scriptId(java.lang.String scriptId) {
            this.scriptId = scriptId;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags GameliftFleet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#tags_all GameliftFleet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#timeouts GameliftFleet#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.gamelift_fleet.GameliftFleetTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getDependsOn}
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
         * Sets the value of {@link GameliftFleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetConfig#getProvisioners}
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
         * @return a new instance of {@link GameliftFleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftFleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftFleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftFleetConfig {
        private final java.lang.String ec2InstanceType;
        private final java.lang.String name;
        private final java.lang.String buildId;
        private final imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration certificateConfiguration;
        private final java.lang.String description;
        private final java.lang.Object ec2InboundPermission;
        private final java.lang.String fleetType;
        private final java.lang.String id;
        private final java.lang.String instanceRoleArn;
        private final java.util.List<java.lang.String> metricGroups;
        private final java.lang.String newGameSessionProtectionPolicy;
        private final imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy resourceCreationLimitPolicy;
        private final imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration runtimeConfiguration;
        private final java.lang.String scriptId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.gamelift_fleet.GameliftFleetTimeouts timeouts;
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
            this.ec2InstanceType = software.amazon.jsii.Kernel.get(this, "ec2InstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.buildId = software.amazon.jsii.Kernel.get(this, "buildId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateConfiguration = software.amazon.jsii.Kernel.get(this, "certificateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ec2InboundPermission = software.amazon.jsii.Kernel.get(this, "ec2InboundPermission", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fleetType = software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceRoleArn = software.amazon.jsii.Kernel.get(this, "instanceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricGroups = software.amazon.jsii.Kernel.get(this, "metricGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.newGameSessionProtectionPolicy = software.amazon.jsii.Kernel.get(this, "newGameSessionProtectionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceCreationLimitPolicy = software.amazon.jsii.Kernel.get(this, "resourceCreationLimitPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy.class));
            this.runtimeConfiguration = software.amazon.jsii.Kernel.get(this, "runtimeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration.class));
            this.scriptId = software.amazon.jsii.Kernel.get(this, "scriptId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetTimeouts.class));
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
            this.ec2InstanceType = java.util.Objects.requireNonNull(builder.ec2InstanceType, "ec2InstanceType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.buildId = builder.buildId;
            this.certificateConfiguration = builder.certificateConfiguration;
            this.description = builder.description;
            this.ec2InboundPermission = builder.ec2InboundPermission;
            this.fleetType = builder.fleetType;
            this.id = builder.id;
            this.instanceRoleArn = builder.instanceRoleArn;
            this.metricGroups = builder.metricGroups;
            this.newGameSessionProtectionPolicy = builder.newGameSessionProtectionPolicy;
            this.resourceCreationLimitPolicy = builder.resourceCreationLimitPolicy;
            this.runtimeConfiguration = builder.runtimeConfiguration;
            this.scriptId = builder.scriptId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEc2InstanceType() {
            return this.ec2InstanceType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getBuildId() {
            return this.buildId;
        }

        @Override
        public final imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration getCertificateConfiguration() {
            return this.certificateConfiguration;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEc2InboundPermission() {
            return this.ec2InboundPermission;
        }

        @Override
        public final java.lang.String getFleetType() {
            return this.fleetType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceRoleArn() {
            return this.instanceRoleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getMetricGroups() {
            return this.metricGroups;
        }

        @Override
        public final java.lang.String getNewGameSessionProtectionPolicy() {
            return this.newGameSessionProtectionPolicy;
        }

        @Override
        public final imports.aws.gamelift_fleet.GameliftFleetResourceCreationLimitPolicy getResourceCreationLimitPolicy() {
            return this.resourceCreationLimitPolicy;
        }

        @Override
        public final imports.aws.gamelift_fleet.GameliftFleetRuntimeConfiguration getRuntimeConfiguration() {
            return this.runtimeConfiguration;
        }

        @Override
        public final java.lang.String getScriptId() {
            return this.scriptId;
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
        public final imports.aws.gamelift_fleet.GameliftFleetTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("ec2InstanceType", om.valueToTree(this.getEc2InstanceType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getBuildId() != null) {
                data.set("buildId", om.valueToTree(this.getBuildId()));
            }
            if (this.getCertificateConfiguration() != null) {
                data.set("certificateConfiguration", om.valueToTree(this.getCertificateConfiguration()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEc2InboundPermission() != null) {
                data.set("ec2InboundPermission", om.valueToTree(this.getEc2InboundPermission()));
            }
            if (this.getFleetType() != null) {
                data.set("fleetType", om.valueToTree(this.getFleetType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceRoleArn() != null) {
                data.set("instanceRoleArn", om.valueToTree(this.getInstanceRoleArn()));
            }
            if (this.getMetricGroups() != null) {
                data.set("metricGroups", om.valueToTree(this.getMetricGroups()));
            }
            if (this.getNewGameSessionProtectionPolicy() != null) {
                data.set("newGameSessionProtectionPolicy", om.valueToTree(this.getNewGameSessionProtectionPolicy()));
            }
            if (this.getResourceCreationLimitPolicy() != null) {
                data.set("resourceCreationLimitPolicy", om.valueToTree(this.getResourceCreationLimitPolicy()));
            }
            if (this.getRuntimeConfiguration() != null) {
                data.set("runtimeConfiguration", om.valueToTree(this.getRuntimeConfiguration()));
            }
            if (this.getScriptId() != null) {
                data.set("scriptId", om.valueToTree(this.getScriptId()));
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
            struct.set("fqn", om.valueToTree("aws.gameliftFleet.GameliftFleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftFleetConfig.Jsii$Proxy that = (GameliftFleetConfig.Jsii$Proxy) o;

            if (!ec2InstanceType.equals(that.ec2InstanceType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.buildId != null ? !this.buildId.equals(that.buildId) : that.buildId != null) return false;
            if (this.certificateConfiguration != null ? !this.certificateConfiguration.equals(that.certificateConfiguration) : that.certificateConfiguration != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.ec2InboundPermission != null ? !this.ec2InboundPermission.equals(that.ec2InboundPermission) : that.ec2InboundPermission != null) return false;
            if (this.fleetType != null ? !this.fleetType.equals(that.fleetType) : that.fleetType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceRoleArn != null ? !this.instanceRoleArn.equals(that.instanceRoleArn) : that.instanceRoleArn != null) return false;
            if (this.metricGroups != null ? !this.metricGroups.equals(that.metricGroups) : that.metricGroups != null) return false;
            if (this.newGameSessionProtectionPolicy != null ? !this.newGameSessionProtectionPolicy.equals(that.newGameSessionProtectionPolicy) : that.newGameSessionProtectionPolicy != null) return false;
            if (this.resourceCreationLimitPolicy != null ? !this.resourceCreationLimitPolicy.equals(that.resourceCreationLimitPolicy) : that.resourceCreationLimitPolicy != null) return false;
            if (this.runtimeConfiguration != null ? !this.runtimeConfiguration.equals(that.runtimeConfiguration) : that.runtimeConfiguration != null) return false;
            if (this.scriptId != null ? !this.scriptId.equals(that.scriptId) : that.scriptId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.ec2InstanceType.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.buildId != null ? this.buildId.hashCode() : 0);
            result = 31 * result + (this.certificateConfiguration != null ? this.certificateConfiguration.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.ec2InboundPermission != null ? this.ec2InboundPermission.hashCode() : 0);
            result = 31 * result + (this.fleetType != null ? this.fleetType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceRoleArn != null ? this.instanceRoleArn.hashCode() : 0);
            result = 31 * result + (this.metricGroups != null ? this.metricGroups.hashCode() : 0);
            result = 31 * result + (this.newGameSessionProtectionPolicy != null ? this.newGameSessionProtectionPolicy.hashCode() : 0);
            result = 31 * result + (this.resourceCreationLimitPolicy != null ? this.resourceCreationLimitPolicy.hashCode() : 0);
            result = 31 * result + (this.runtimeConfiguration != null ? this.runtimeConfiguration.hashCode() : 0);
            result = 31 * result + (this.scriptId != null ? this.scriptId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
