package imports.aws.ecs_task_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.140Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskSet.EcsTaskSetConfig")
@software.amazon.jsii.Jsii.Proxy(EcsTaskSetConfig.Jsii$Proxy.class)
public interface EcsTaskSetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#cluster EcsTaskSet#cluster}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCluster();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service EcsTaskSet#service}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getService();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#task_definition EcsTaskSet#task_definition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskDefinition();

    /**
     * capacity_provider_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#capacity_provider_strategy EcsTaskSet#capacity_provider_strategy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCapacityProviderStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#external_id EcsTaskSet#external_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExternalId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#id EcsTaskSet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#launch_type EcsTaskSet#launch_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchType() {
        return null;
    }

    /**
     * load_balancer block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer EcsTaskSet#load_balancer}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLoadBalancer() {
        return null;
    }

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#network_configuration EcsTaskSet#network_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration getNetworkConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#platform_version EcsTaskSet#platform_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformVersion() {
        return null;
    }

    /**
     * scale block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#scale EcsTaskSet#scale}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetScale getScale() {
        return null;
    }

    /**
     * service_registries block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service_registries EcsTaskSet#service_registries}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_task_set.EcsTaskSetServiceRegistries getServiceRegistries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags EcsTaskSet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags_all EcsTaskSet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitUntilStable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable_timeout EcsTaskSet#wait_until_stable_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWaitUntilStableTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskSetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskSetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskSetConfig> {
        java.lang.String cluster;
        java.lang.String service;
        java.lang.String taskDefinition;
        java.lang.Object capacityProviderStrategy;
        java.lang.String externalId;
        java.lang.Object forceDelete;
        java.lang.String id;
        java.lang.String launchType;
        java.lang.Object loadBalancer;
        imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration networkConfiguration;
        java.lang.String platformVersion;
        imports.aws.ecs_task_set.EcsTaskSetScale scale;
        imports.aws.ecs_task_set.EcsTaskSetServiceRegistries serviceRegistries;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object waitUntilStable;
        java.lang.String waitUntilStableTimeout;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EcsTaskSetConfig#getCluster}
         * @param cluster Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#cluster EcsTaskSet#cluster}. This parameter is required.
         * @return {@code this}
         */
        public Builder cluster(java.lang.String cluster) {
            this.cluster = cluster;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getService}
         * @param service Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service EcsTaskSet#service}. This parameter is required.
         * @return {@code this}
         */
        public Builder service(java.lang.String service) {
            this.service = service;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getTaskDefinition}
         * @param taskDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#task_definition EcsTaskSet#task_definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskDefinition(java.lang.String taskDefinition) {
            this.taskDefinition = taskDefinition;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#capacity_provider_strategy EcsTaskSet#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(com.hashicorp.cdktf.IResolvable capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getCapacityProviderStrategy}
         * @param capacityProviderStrategy capacity_provider_strategy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#capacity_provider_strategy EcsTaskSet#capacity_provider_strategy}
         * @return {@code this}
         */
        public Builder capacityProviderStrategy(java.util.List<? extends imports.aws.ecs_task_set.EcsTaskSetCapacityProviderStrategy> capacityProviderStrategy) {
            this.capacityProviderStrategy = capacityProviderStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getExternalId}
         * @param externalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#external_id EcsTaskSet#external_id}.
         * @return {@code this}
         */
        public Builder externalId(java.lang.String externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(java.lang.Boolean forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getForceDelete}
         * @param forceDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#force_delete EcsTaskSet#force_delete}.
         * @return {@code this}
         */
        public Builder forceDelete(com.hashicorp.cdktf.IResolvable forceDelete) {
            this.forceDelete = forceDelete;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#id EcsTaskSet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getLaunchType}
         * @param launchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#launch_type EcsTaskSet#launch_type}.
         * @return {@code this}
         */
        public Builder launchType(java.lang.String launchType) {
            this.launchType = launchType;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getLoadBalancer}
         * @param loadBalancer load_balancer block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer EcsTaskSet#load_balancer}
         * @return {@code this}
         */
        public Builder loadBalancer(com.hashicorp.cdktf.IResolvable loadBalancer) {
            this.loadBalancer = loadBalancer;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getLoadBalancer}
         * @param loadBalancer load_balancer block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer EcsTaskSet#load_balancer}
         * @return {@code this}
         */
        public Builder loadBalancer(java.util.List<? extends imports.aws.ecs_task_set.EcsTaskSetLoadBalancer> loadBalancer) {
            this.loadBalancer = loadBalancer;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#network_configuration EcsTaskSet#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getPlatformVersion}
         * @param platformVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#platform_version EcsTaskSet#platform_version}.
         * @return {@code this}
         */
        public Builder platformVersion(java.lang.String platformVersion) {
            this.platformVersion = platformVersion;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getScale}
         * @param scale scale block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#scale EcsTaskSet#scale}
         * @return {@code this}
         */
        public Builder scale(imports.aws.ecs_task_set.EcsTaskSetScale scale) {
            this.scale = scale;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getServiceRegistries}
         * @param serviceRegistries service_registries block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#service_registries EcsTaskSet#service_registries}
         * @return {@code this}
         */
        public Builder serviceRegistries(imports.aws.ecs_task_set.EcsTaskSetServiceRegistries serviceRegistries) {
            this.serviceRegistries = serviceRegistries;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags EcsTaskSet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#tags_all EcsTaskSet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getWaitUntilStable}
         * @param waitUntilStable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}.
         * @return {@code this}
         */
        public Builder waitUntilStable(java.lang.Boolean waitUntilStable) {
            this.waitUntilStable = waitUntilStable;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getWaitUntilStable}
         * @param waitUntilStable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable EcsTaskSet#wait_until_stable}.
         * @return {@code this}
         */
        public Builder waitUntilStable(com.hashicorp.cdktf.IResolvable waitUntilStable) {
            this.waitUntilStable = waitUntilStable;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getWaitUntilStableTimeout}
         * @param waitUntilStableTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#wait_until_stable_timeout EcsTaskSet#wait_until_stable_timeout}.
         * @return {@code this}
         */
        public Builder waitUntilStableTimeout(java.lang.String waitUntilStableTimeout) {
            this.waitUntilStableTimeout = waitUntilStableTimeout;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getDependsOn}
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
         * Sets the value of {@link EcsTaskSetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetConfig#getProvisioners}
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
         * @return a new instance of {@link EcsTaskSetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskSetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskSetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskSetConfig {
        private final java.lang.String cluster;
        private final java.lang.String service;
        private final java.lang.String taskDefinition;
        private final java.lang.Object capacityProviderStrategy;
        private final java.lang.String externalId;
        private final java.lang.Object forceDelete;
        private final java.lang.String id;
        private final java.lang.String launchType;
        private final java.lang.Object loadBalancer;
        private final imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration networkConfiguration;
        private final java.lang.String platformVersion;
        private final imports.aws.ecs_task_set.EcsTaskSetScale scale;
        private final imports.aws.ecs_task_set.EcsTaskSetServiceRegistries serviceRegistries;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object waitUntilStable;
        private final java.lang.String waitUntilStableTimeout;
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
            this.cluster = software.amazon.jsii.Kernel.get(this, "cluster", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.service = software.amazon.jsii.Kernel.get(this, "service", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskDefinition = software.amazon.jsii.Kernel.get(this, "taskDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityProviderStrategy = software.amazon.jsii.Kernel.get(this, "capacityProviderStrategy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDelete = software.amazon.jsii.Kernel.get(this, "forceDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchType = software.amazon.jsii.Kernel.get(this, "launchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancer = software.amazon.jsii.Kernel.get(this, "loadBalancer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration.class));
            this.platformVersion = software.amazon.jsii.Kernel.get(this, "platformVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scale = software.amazon.jsii.Kernel.get(this, "scale", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetScale.class));
            this.serviceRegistries = software.amazon.jsii.Kernel.get(this, "serviceRegistries", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_task_set.EcsTaskSetServiceRegistries.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.waitUntilStable = software.amazon.jsii.Kernel.get(this, "waitUntilStable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.waitUntilStableTimeout = software.amazon.jsii.Kernel.get(this, "waitUntilStableTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.cluster = java.util.Objects.requireNonNull(builder.cluster, "cluster is required");
            this.service = java.util.Objects.requireNonNull(builder.service, "service is required");
            this.taskDefinition = java.util.Objects.requireNonNull(builder.taskDefinition, "taskDefinition is required");
            this.capacityProviderStrategy = builder.capacityProviderStrategy;
            this.externalId = builder.externalId;
            this.forceDelete = builder.forceDelete;
            this.id = builder.id;
            this.launchType = builder.launchType;
            this.loadBalancer = builder.loadBalancer;
            this.networkConfiguration = builder.networkConfiguration;
            this.platformVersion = builder.platformVersion;
            this.scale = builder.scale;
            this.serviceRegistries = builder.serviceRegistries;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.waitUntilStable = builder.waitUntilStable;
            this.waitUntilStableTimeout = builder.waitUntilStableTimeout;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCluster() {
            return this.cluster;
        }

        @Override
        public final java.lang.String getService() {
            return this.service;
        }

        @Override
        public final java.lang.String getTaskDefinition() {
            return this.taskDefinition;
        }

        @Override
        public final java.lang.Object getCapacityProviderStrategy() {
            return this.capacityProviderStrategy;
        }

        @Override
        public final java.lang.String getExternalId() {
            return this.externalId;
        }

        @Override
        public final java.lang.Object getForceDelete() {
            return this.forceDelete;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLaunchType() {
            return this.launchType;
        }

        @Override
        public final java.lang.Object getLoadBalancer() {
            return this.loadBalancer;
        }

        @Override
        public final imports.aws.ecs_task_set.EcsTaskSetNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
        }

        @Override
        public final java.lang.String getPlatformVersion() {
            return this.platformVersion;
        }

        @Override
        public final imports.aws.ecs_task_set.EcsTaskSetScale getScale() {
            return this.scale;
        }

        @Override
        public final imports.aws.ecs_task_set.EcsTaskSetServiceRegistries getServiceRegistries() {
            return this.serviceRegistries;
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
        public final java.lang.Object getWaitUntilStable() {
            return this.waitUntilStable;
        }

        @Override
        public final java.lang.String getWaitUntilStableTimeout() {
            return this.waitUntilStableTimeout;
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

            data.set("cluster", om.valueToTree(this.getCluster()));
            data.set("service", om.valueToTree(this.getService()));
            data.set("taskDefinition", om.valueToTree(this.getTaskDefinition()));
            if (this.getCapacityProviderStrategy() != null) {
                data.set("capacityProviderStrategy", om.valueToTree(this.getCapacityProviderStrategy()));
            }
            if (this.getExternalId() != null) {
                data.set("externalId", om.valueToTree(this.getExternalId()));
            }
            if (this.getForceDelete() != null) {
                data.set("forceDelete", om.valueToTree(this.getForceDelete()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLaunchType() != null) {
                data.set("launchType", om.valueToTree(this.getLaunchType()));
            }
            if (this.getLoadBalancer() != null) {
                data.set("loadBalancer", om.valueToTree(this.getLoadBalancer()));
            }
            if (this.getNetworkConfiguration() != null) {
                data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
            }
            if (this.getPlatformVersion() != null) {
                data.set("platformVersion", om.valueToTree(this.getPlatformVersion()));
            }
            if (this.getScale() != null) {
                data.set("scale", om.valueToTree(this.getScale()));
            }
            if (this.getServiceRegistries() != null) {
                data.set("serviceRegistries", om.valueToTree(this.getServiceRegistries()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getWaitUntilStable() != null) {
                data.set("waitUntilStable", om.valueToTree(this.getWaitUntilStable()));
            }
            if (this.getWaitUntilStableTimeout() != null) {
                data.set("waitUntilStableTimeout", om.valueToTree(this.getWaitUntilStableTimeout()));
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
            struct.set("fqn", om.valueToTree("aws.ecsTaskSet.EcsTaskSetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskSetConfig.Jsii$Proxy that = (EcsTaskSetConfig.Jsii$Proxy) o;

            if (!cluster.equals(that.cluster)) return false;
            if (!service.equals(that.service)) return false;
            if (!taskDefinition.equals(that.taskDefinition)) return false;
            if (this.capacityProviderStrategy != null ? !this.capacityProviderStrategy.equals(that.capacityProviderStrategy) : that.capacityProviderStrategy != null) return false;
            if (this.externalId != null ? !this.externalId.equals(that.externalId) : that.externalId != null) return false;
            if (this.forceDelete != null ? !this.forceDelete.equals(that.forceDelete) : that.forceDelete != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.launchType != null ? !this.launchType.equals(that.launchType) : that.launchType != null) return false;
            if (this.loadBalancer != null ? !this.loadBalancer.equals(that.loadBalancer) : that.loadBalancer != null) return false;
            if (this.networkConfiguration != null ? !this.networkConfiguration.equals(that.networkConfiguration) : that.networkConfiguration != null) return false;
            if (this.platformVersion != null ? !this.platformVersion.equals(that.platformVersion) : that.platformVersion != null) return false;
            if (this.scale != null ? !this.scale.equals(that.scale) : that.scale != null) return false;
            if (this.serviceRegistries != null ? !this.serviceRegistries.equals(that.serviceRegistries) : that.serviceRegistries != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.waitUntilStable != null ? !this.waitUntilStable.equals(that.waitUntilStable) : that.waitUntilStable != null) return false;
            if (this.waitUntilStableTimeout != null ? !this.waitUntilStableTimeout.equals(that.waitUntilStableTimeout) : that.waitUntilStableTimeout != null) return false;
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
            int result = this.cluster.hashCode();
            result = 31 * result + (this.service.hashCode());
            result = 31 * result + (this.taskDefinition.hashCode());
            result = 31 * result + (this.capacityProviderStrategy != null ? this.capacityProviderStrategy.hashCode() : 0);
            result = 31 * result + (this.externalId != null ? this.externalId.hashCode() : 0);
            result = 31 * result + (this.forceDelete != null ? this.forceDelete.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.launchType != null ? this.launchType.hashCode() : 0);
            result = 31 * result + (this.loadBalancer != null ? this.loadBalancer.hashCode() : 0);
            result = 31 * result + (this.networkConfiguration != null ? this.networkConfiguration.hashCode() : 0);
            result = 31 * result + (this.platformVersion != null ? this.platformVersion.hashCode() : 0);
            result = 31 * result + (this.scale != null ? this.scale.hashCode() : 0);
            result = 31 * result + (this.serviceRegistries != null ? this.serviceRegistries.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.waitUntilStable != null ? this.waitUntilStable.hashCode() : 0);
            result = 31 * result + (this.waitUntilStableTimeout != null ? this.waitUntilStableTimeout.hashCode() : 0);
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
