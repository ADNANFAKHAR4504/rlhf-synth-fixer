package imports.aws.elb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.190Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elb.ElbConfig")
@software.amazon.jsii.Jsii.Proxy(ElbConfig.Jsii$Proxy.class)
public interface ElbConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * listener block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#listener Elb#listener}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getListener();

    /**
     * access_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#access_logs Elb#access_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elb.ElbAccessLogs getAccessLogs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#availability_zones Elb#availability_zones}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAvailabilityZones() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConnectionDraining() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining_timeout Elb#connection_draining_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConnectionDrainingTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCrossZoneLoadBalancing() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#desync_mitigation_mode Elb#desync_mitigation_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDesyncMitigationMode() {
        return null;
    }

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#health_check Elb#health_check}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elb.ElbHealthCheck getHealthCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#id Elb#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#idle_timeout Elb#idle_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instances Elb#instances}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstances() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInternal() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name Elb#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name_prefix Elb#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#security_groups Elb#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#source_security_group Elb#source_security_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceSecurityGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#subnets Elb#subnets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags Elb#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags_all Elb#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#timeouts Elb#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elb.ElbTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElbConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElbConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElbConfig> {
        java.lang.Object listener;
        imports.aws.elb.ElbAccessLogs accessLogs;
        java.util.List<java.lang.String> availabilityZones;
        java.lang.Object connectionDraining;
        java.lang.Number connectionDrainingTimeout;
        java.lang.Object crossZoneLoadBalancing;
        java.lang.String desyncMitigationMode;
        imports.aws.elb.ElbHealthCheck healthCheck;
        java.lang.String id;
        java.lang.Number idleTimeout;
        java.util.List<java.lang.String> instances;
        java.lang.Object internal;
        java.lang.String name;
        java.lang.String namePrefix;
        java.util.List<java.lang.String> securityGroups;
        java.lang.String sourceSecurityGroup;
        java.util.List<java.lang.String> subnets;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.elb.ElbTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElbConfig#getListener}
         * @param listener listener block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#listener Elb#listener}
         * @return {@code this}
         */
        public Builder listener(com.hashicorp.cdktf.IResolvable listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getListener}
         * @param listener listener block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#listener Elb#listener}
         * @return {@code this}
         */
        public Builder listener(java.util.List<? extends imports.aws.elb.ElbListener> listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getAccessLogs}
         * @param accessLogs access_logs block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#access_logs Elb#access_logs}
         * @return {@code this}
         */
        public Builder accessLogs(imports.aws.elb.ElbAccessLogs accessLogs) {
            this.accessLogs = accessLogs;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getAvailabilityZones}
         * @param availabilityZones Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#availability_zones Elb#availability_zones}.
         * @return {@code this}
         */
        public Builder availabilityZones(java.util.List<java.lang.String> availabilityZones) {
            this.availabilityZones = availabilityZones;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getConnectionDraining}
         * @param connectionDraining Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}.
         * @return {@code this}
         */
        public Builder connectionDraining(java.lang.Boolean connectionDraining) {
            this.connectionDraining = connectionDraining;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getConnectionDraining}
         * @param connectionDraining Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining Elb#connection_draining}.
         * @return {@code this}
         */
        public Builder connectionDraining(com.hashicorp.cdktf.IResolvable connectionDraining) {
            this.connectionDraining = connectionDraining;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getConnectionDrainingTimeout}
         * @param connectionDrainingTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#connection_draining_timeout Elb#connection_draining_timeout}.
         * @return {@code this}
         */
        public Builder connectionDrainingTimeout(java.lang.Number connectionDrainingTimeout) {
            this.connectionDrainingTimeout = connectionDrainingTimeout;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getCrossZoneLoadBalancing}
         * @param crossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}.
         * @return {@code this}
         */
        public Builder crossZoneLoadBalancing(java.lang.Boolean crossZoneLoadBalancing) {
            this.crossZoneLoadBalancing = crossZoneLoadBalancing;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getCrossZoneLoadBalancing}
         * @param crossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#cross_zone_load_balancing Elb#cross_zone_load_balancing}.
         * @return {@code this}
         */
        public Builder crossZoneLoadBalancing(com.hashicorp.cdktf.IResolvable crossZoneLoadBalancing) {
            this.crossZoneLoadBalancing = crossZoneLoadBalancing;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getDesyncMitigationMode}
         * @param desyncMitigationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#desync_mitigation_mode Elb#desync_mitigation_mode}.
         * @return {@code this}
         */
        public Builder desyncMitigationMode(java.lang.String desyncMitigationMode) {
            this.desyncMitigationMode = desyncMitigationMode;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getHealthCheck}
         * @param healthCheck health_check block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#health_check Elb#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.elb.ElbHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#id Elb#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getIdleTimeout}
         * @param idleTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#idle_timeout Elb#idle_timeout}.
         * @return {@code this}
         */
        public Builder idleTimeout(java.lang.Number idleTimeout) {
            this.idleTimeout = idleTimeout;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getInstances}
         * @param instances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#instances Elb#instances}.
         * @return {@code this}
         */
        public Builder instances(java.util.List<java.lang.String> instances) {
            this.instances = instances;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getInternal}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}.
         * @return {@code this}
         */
        public Builder internal(java.lang.Boolean internal) {
            this.internal = internal;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getInternal}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#internal Elb#internal}.
         * @return {@code this}
         */
        public Builder internal(com.hashicorp.cdktf.IResolvable internal) {
            this.internal = internal;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name Elb#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#name_prefix Elb#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#security_groups Elb#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getSourceSecurityGroup}
         * @param sourceSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#source_security_group Elb#source_security_group}.
         * @return {@code this}
         */
        public Builder sourceSecurityGroup(java.lang.String sourceSecurityGroup) {
            this.sourceSecurityGroup = sourceSecurityGroup;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#subnets Elb#subnets}.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags Elb#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#tags_all Elb#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elb#timeouts Elb#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elb.ElbTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getDependsOn}
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
         * Sets the value of {@link ElbConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElbConfig#getProvisioners}
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
         * @return a new instance of {@link ElbConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElbConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElbConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElbConfig {
        private final java.lang.Object listener;
        private final imports.aws.elb.ElbAccessLogs accessLogs;
        private final java.util.List<java.lang.String> availabilityZones;
        private final java.lang.Object connectionDraining;
        private final java.lang.Number connectionDrainingTimeout;
        private final java.lang.Object crossZoneLoadBalancing;
        private final java.lang.String desyncMitigationMode;
        private final imports.aws.elb.ElbHealthCheck healthCheck;
        private final java.lang.String id;
        private final java.lang.Number idleTimeout;
        private final java.util.List<java.lang.String> instances;
        private final java.lang.Object internal;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.String sourceSecurityGroup;
        private final java.util.List<java.lang.String> subnets;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.elb.ElbTimeouts timeouts;
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
            this.listener = software.amazon.jsii.Kernel.get(this, "listener", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.accessLogs = software.amazon.jsii.Kernel.get(this, "accessLogs", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbAccessLogs.class));
            this.availabilityZones = software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connectionDraining = software.amazon.jsii.Kernel.get(this, "connectionDraining", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connectionDrainingTimeout = software.amazon.jsii.Kernel.get(this, "connectionDrainingTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.crossZoneLoadBalancing = software.amazon.jsii.Kernel.get(this, "crossZoneLoadBalancing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.desyncMitigationMode = software.amazon.jsii.Kernel.get(this, "desyncMitigationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbHealthCheck.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idleTimeout = software.amazon.jsii.Kernel.get(this, "idleTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instances = software.amazon.jsii.Kernel.get(this, "instances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.internal = software.amazon.jsii.Kernel.get(this, "internal", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceSecurityGroup = software.amazon.jsii.Kernel.get(this, "sourceSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elb.ElbTimeouts.class));
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
            this.listener = java.util.Objects.requireNonNull(builder.listener, "listener is required");
            this.accessLogs = builder.accessLogs;
            this.availabilityZones = builder.availabilityZones;
            this.connectionDraining = builder.connectionDraining;
            this.connectionDrainingTimeout = builder.connectionDrainingTimeout;
            this.crossZoneLoadBalancing = builder.crossZoneLoadBalancing;
            this.desyncMitigationMode = builder.desyncMitigationMode;
            this.healthCheck = builder.healthCheck;
            this.id = builder.id;
            this.idleTimeout = builder.idleTimeout;
            this.instances = builder.instances;
            this.internal = builder.internal;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.securityGroups = builder.securityGroups;
            this.sourceSecurityGroup = builder.sourceSecurityGroup;
            this.subnets = builder.subnets;
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
        public final java.lang.Object getListener() {
            return this.listener;
        }

        @Override
        public final imports.aws.elb.ElbAccessLogs getAccessLogs() {
            return this.accessLogs;
        }

        @Override
        public final java.util.List<java.lang.String> getAvailabilityZones() {
            return this.availabilityZones;
        }

        @Override
        public final java.lang.Object getConnectionDraining() {
            return this.connectionDraining;
        }

        @Override
        public final java.lang.Number getConnectionDrainingTimeout() {
            return this.connectionDrainingTimeout;
        }

        @Override
        public final java.lang.Object getCrossZoneLoadBalancing() {
            return this.crossZoneLoadBalancing;
        }

        @Override
        public final java.lang.String getDesyncMitigationMode() {
            return this.desyncMitigationMode;
        }

        @Override
        public final imports.aws.elb.ElbHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getIdleTimeout() {
            return this.idleTimeout;
        }

        @Override
        public final java.util.List<java.lang.String> getInstances() {
            return this.instances;
        }

        @Override
        public final java.lang.Object getInternal() {
            return this.internal;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.String getSourceSecurityGroup() {
            return this.sourceSecurityGroup;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
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
        public final imports.aws.elb.ElbTimeouts getTimeouts() {
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

            data.set("listener", om.valueToTree(this.getListener()));
            if (this.getAccessLogs() != null) {
                data.set("accessLogs", om.valueToTree(this.getAccessLogs()));
            }
            if (this.getAvailabilityZones() != null) {
                data.set("availabilityZones", om.valueToTree(this.getAvailabilityZones()));
            }
            if (this.getConnectionDraining() != null) {
                data.set("connectionDraining", om.valueToTree(this.getConnectionDraining()));
            }
            if (this.getConnectionDrainingTimeout() != null) {
                data.set("connectionDrainingTimeout", om.valueToTree(this.getConnectionDrainingTimeout()));
            }
            if (this.getCrossZoneLoadBalancing() != null) {
                data.set("crossZoneLoadBalancing", om.valueToTree(this.getCrossZoneLoadBalancing()));
            }
            if (this.getDesyncMitigationMode() != null) {
                data.set("desyncMitigationMode", om.valueToTree(this.getDesyncMitigationMode()));
            }
            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdleTimeout() != null) {
                data.set("idleTimeout", om.valueToTree(this.getIdleTimeout()));
            }
            if (this.getInstances() != null) {
                data.set("instances", om.valueToTree(this.getInstances()));
            }
            if (this.getInternal() != null) {
                data.set("internal", om.valueToTree(this.getInternal()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSourceSecurityGroup() != null) {
                data.set("sourceSecurityGroup", om.valueToTree(this.getSourceSecurityGroup()));
            }
            if (this.getSubnets() != null) {
                data.set("subnets", om.valueToTree(this.getSubnets()));
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
            struct.set("fqn", om.valueToTree("aws.elb.ElbConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElbConfig.Jsii$Proxy that = (ElbConfig.Jsii$Proxy) o;

            if (!listener.equals(that.listener)) return false;
            if (this.accessLogs != null ? !this.accessLogs.equals(that.accessLogs) : that.accessLogs != null) return false;
            if (this.availabilityZones != null ? !this.availabilityZones.equals(that.availabilityZones) : that.availabilityZones != null) return false;
            if (this.connectionDraining != null ? !this.connectionDraining.equals(that.connectionDraining) : that.connectionDraining != null) return false;
            if (this.connectionDrainingTimeout != null ? !this.connectionDrainingTimeout.equals(that.connectionDrainingTimeout) : that.connectionDrainingTimeout != null) return false;
            if (this.crossZoneLoadBalancing != null ? !this.crossZoneLoadBalancing.equals(that.crossZoneLoadBalancing) : that.crossZoneLoadBalancing != null) return false;
            if (this.desyncMitigationMode != null ? !this.desyncMitigationMode.equals(that.desyncMitigationMode) : that.desyncMitigationMode != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idleTimeout != null ? !this.idleTimeout.equals(that.idleTimeout) : that.idleTimeout != null) return false;
            if (this.instances != null ? !this.instances.equals(that.instances) : that.instances != null) return false;
            if (this.internal != null ? !this.internal.equals(that.internal) : that.internal != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.sourceSecurityGroup != null ? !this.sourceSecurityGroup.equals(that.sourceSecurityGroup) : that.sourceSecurityGroup != null) return false;
            if (this.subnets != null ? !this.subnets.equals(that.subnets) : that.subnets != null) return false;
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
            int result = this.listener.hashCode();
            result = 31 * result + (this.accessLogs != null ? this.accessLogs.hashCode() : 0);
            result = 31 * result + (this.availabilityZones != null ? this.availabilityZones.hashCode() : 0);
            result = 31 * result + (this.connectionDraining != null ? this.connectionDraining.hashCode() : 0);
            result = 31 * result + (this.connectionDrainingTimeout != null ? this.connectionDrainingTimeout.hashCode() : 0);
            result = 31 * result + (this.crossZoneLoadBalancing != null ? this.crossZoneLoadBalancing.hashCode() : 0);
            result = 31 * result + (this.desyncMitigationMode != null ? this.desyncMitigationMode.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idleTimeout != null ? this.idleTimeout.hashCode() : 0);
            result = 31 * result + (this.instances != null ? this.instances.hashCode() : 0);
            result = 31 * result + (this.internal != null ? this.internal.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.sourceSecurityGroup != null ? this.sourceSecurityGroup.hashCode() : 0);
            result = 31 * result + (this.subnets != null ? this.subnets.hashCode() : 0);
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
