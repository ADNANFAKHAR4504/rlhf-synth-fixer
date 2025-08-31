package imports.aws.elasticache_global_replication_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.168Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheGlobalReplicationGroup.ElasticacheGlobalReplicationGroupConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticacheGlobalReplicationGroupConfig.Jsii$Proxy.class)
public interface ElasticacheGlobalReplicationGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_id_suffix ElasticacheGlobalReplicationGroup#global_replication_group_id_suffix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGlobalReplicationGroupIdSuffix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#primary_replication_group_id ElasticacheGlobalReplicationGroup#primary_replication_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrimaryReplicationGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutomaticFailoverEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#cache_node_type ElasticacheGlobalReplicationGroup#cache_node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheNodeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#engine_version ElasticacheGlobalReplicationGroup#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_description ElasticacheGlobalReplicationGroup#global_replication_group_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlobalReplicationGroupDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#id ElasticacheGlobalReplicationGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#num_node_groups ElasticacheGlobalReplicationGroup#num_node_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumNodeGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#parameter_group_name ElasticacheGlobalReplicationGroup#parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupName() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#timeouts ElasticacheGlobalReplicationGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheGlobalReplicationGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheGlobalReplicationGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheGlobalReplicationGroupConfig> {
        java.lang.String globalReplicationGroupIdSuffix;
        java.lang.String primaryReplicationGroupId;
        java.lang.Object automaticFailoverEnabled;
        java.lang.String cacheNodeType;
        java.lang.String engineVersion;
        java.lang.String globalReplicationGroupDescription;
        java.lang.String id;
        java.lang.Number numNodeGroups;
        java.lang.String parameterGroupName;
        imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getGlobalReplicationGroupIdSuffix}
         * @param globalReplicationGroupIdSuffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_id_suffix ElasticacheGlobalReplicationGroup#global_replication_group_id_suffix}. This parameter is required.
         * @return {@code this}
         */
        public Builder globalReplicationGroupIdSuffix(java.lang.String globalReplicationGroupIdSuffix) {
            this.globalReplicationGroupIdSuffix = globalReplicationGroupIdSuffix;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getPrimaryReplicationGroupId}
         * @param primaryReplicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#primary_replication_group_id ElasticacheGlobalReplicationGroup#primary_replication_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder primaryReplicationGroupId(java.lang.String primaryReplicationGroupId) {
            this.primaryReplicationGroupId = primaryReplicationGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getAutomaticFailoverEnabled}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}.
         * @return {@code this}
         */
        public Builder automaticFailoverEnabled(java.lang.Boolean automaticFailoverEnabled) {
            this.automaticFailoverEnabled = automaticFailoverEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getAutomaticFailoverEnabled}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#automatic_failover_enabled ElasticacheGlobalReplicationGroup#automatic_failover_enabled}.
         * @return {@code this}
         */
        public Builder automaticFailoverEnabled(com.hashicorp.cdktf.IResolvable automaticFailoverEnabled) {
            this.automaticFailoverEnabled = automaticFailoverEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getCacheNodeType}
         * @param cacheNodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#cache_node_type ElasticacheGlobalReplicationGroup#cache_node_type}.
         * @return {@code this}
         */
        public Builder cacheNodeType(java.lang.String cacheNodeType) {
            this.cacheNodeType = cacheNodeType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#engine_version ElasticacheGlobalReplicationGroup#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getGlobalReplicationGroupDescription}
         * @param globalReplicationGroupDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#global_replication_group_description ElasticacheGlobalReplicationGroup#global_replication_group_description}.
         * @return {@code this}
         */
        public Builder globalReplicationGroupDescription(java.lang.String globalReplicationGroupDescription) {
            this.globalReplicationGroupDescription = globalReplicationGroupDescription;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#id ElasticacheGlobalReplicationGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getNumNodeGroups}
         * @param numNodeGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#num_node_groups ElasticacheGlobalReplicationGroup#num_node_groups}.
         * @return {@code this}
         */
        public Builder numNodeGroups(java.lang.Number numNodeGroups) {
            this.numNodeGroups = numNodeGroups;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getParameterGroupName}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#parameter_group_name ElasticacheGlobalReplicationGroup#parameter_group_name}.
         * @return {@code this}
         */
        public Builder parameterGroupName(java.lang.String parameterGroupName) {
            this.parameterGroupName = parameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_global_replication_group#timeouts ElasticacheGlobalReplicationGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getDependsOn}
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
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheGlobalReplicationGroupConfig#getProvisioners}
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
         * @return a new instance of {@link ElasticacheGlobalReplicationGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheGlobalReplicationGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheGlobalReplicationGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheGlobalReplicationGroupConfig {
        private final java.lang.String globalReplicationGroupIdSuffix;
        private final java.lang.String primaryReplicationGroupId;
        private final java.lang.Object automaticFailoverEnabled;
        private final java.lang.String cacheNodeType;
        private final java.lang.String engineVersion;
        private final java.lang.String globalReplicationGroupDescription;
        private final java.lang.String id;
        private final java.lang.Number numNodeGroups;
        private final java.lang.String parameterGroupName;
        private final imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts timeouts;
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
            this.globalReplicationGroupIdSuffix = software.amazon.jsii.Kernel.get(this, "globalReplicationGroupIdSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.primaryReplicationGroupId = software.amazon.jsii.Kernel.get(this, "primaryReplicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automaticFailoverEnabled = software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheNodeType = software.amazon.jsii.Kernel.get(this, "cacheNodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.globalReplicationGroupDescription = software.amazon.jsii.Kernel.get(this, "globalReplicationGroupDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numNodeGroups = software.amazon.jsii.Kernel.get(this, "numNodeGroups", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parameterGroupName = software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts.class));
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
            this.globalReplicationGroupIdSuffix = java.util.Objects.requireNonNull(builder.globalReplicationGroupIdSuffix, "globalReplicationGroupIdSuffix is required");
            this.primaryReplicationGroupId = java.util.Objects.requireNonNull(builder.primaryReplicationGroupId, "primaryReplicationGroupId is required");
            this.automaticFailoverEnabled = builder.automaticFailoverEnabled;
            this.cacheNodeType = builder.cacheNodeType;
            this.engineVersion = builder.engineVersion;
            this.globalReplicationGroupDescription = builder.globalReplicationGroupDescription;
            this.id = builder.id;
            this.numNodeGroups = builder.numNodeGroups;
            this.parameterGroupName = builder.parameterGroupName;
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
        public final java.lang.String getGlobalReplicationGroupIdSuffix() {
            return this.globalReplicationGroupIdSuffix;
        }

        @Override
        public final java.lang.String getPrimaryReplicationGroupId() {
            return this.primaryReplicationGroupId;
        }

        @Override
        public final java.lang.Object getAutomaticFailoverEnabled() {
            return this.automaticFailoverEnabled;
        }

        @Override
        public final java.lang.String getCacheNodeType() {
            return this.cacheNodeType;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getGlobalReplicationGroupDescription() {
            return this.globalReplicationGroupDescription;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getNumNodeGroups() {
            return this.numNodeGroups;
        }

        @Override
        public final java.lang.String getParameterGroupName() {
            return this.parameterGroupName;
        }

        @Override
        public final imports.aws.elasticache_global_replication_group.ElasticacheGlobalReplicationGroupTimeouts getTimeouts() {
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

            data.set("globalReplicationGroupIdSuffix", om.valueToTree(this.getGlobalReplicationGroupIdSuffix()));
            data.set("primaryReplicationGroupId", om.valueToTree(this.getPrimaryReplicationGroupId()));
            if (this.getAutomaticFailoverEnabled() != null) {
                data.set("automaticFailoverEnabled", om.valueToTree(this.getAutomaticFailoverEnabled()));
            }
            if (this.getCacheNodeType() != null) {
                data.set("cacheNodeType", om.valueToTree(this.getCacheNodeType()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getGlobalReplicationGroupDescription() != null) {
                data.set("globalReplicationGroupDescription", om.valueToTree(this.getGlobalReplicationGroupDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNumNodeGroups() != null) {
                data.set("numNodeGroups", om.valueToTree(this.getNumNodeGroups()));
            }
            if (this.getParameterGroupName() != null) {
                data.set("parameterGroupName", om.valueToTree(this.getParameterGroupName()));
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
            struct.set("fqn", om.valueToTree("aws.elasticacheGlobalReplicationGroup.ElasticacheGlobalReplicationGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheGlobalReplicationGroupConfig.Jsii$Proxy that = (ElasticacheGlobalReplicationGroupConfig.Jsii$Proxy) o;

            if (!globalReplicationGroupIdSuffix.equals(that.globalReplicationGroupIdSuffix)) return false;
            if (!primaryReplicationGroupId.equals(that.primaryReplicationGroupId)) return false;
            if (this.automaticFailoverEnabled != null ? !this.automaticFailoverEnabled.equals(that.automaticFailoverEnabled) : that.automaticFailoverEnabled != null) return false;
            if (this.cacheNodeType != null ? !this.cacheNodeType.equals(that.cacheNodeType) : that.cacheNodeType != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.globalReplicationGroupDescription != null ? !this.globalReplicationGroupDescription.equals(that.globalReplicationGroupDescription) : that.globalReplicationGroupDescription != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.numNodeGroups != null ? !this.numNodeGroups.equals(that.numNodeGroups) : that.numNodeGroups != null) return false;
            if (this.parameterGroupName != null ? !this.parameterGroupName.equals(that.parameterGroupName) : that.parameterGroupName != null) return false;
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
            int result = this.globalReplicationGroupIdSuffix.hashCode();
            result = 31 * result + (this.primaryReplicationGroupId.hashCode());
            result = 31 * result + (this.automaticFailoverEnabled != null ? this.automaticFailoverEnabled.hashCode() : 0);
            result = 31 * result + (this.cacheNodeType != null ? this.cacheNodeType.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.globalReplicationGroupDescription != null ? this.globalReplicationGroupDescription.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.numNodeGroups != null ? this.numNodeGroups.hashCode() : 0);
            result = 31 * result + (this.parameterGroupName != null ? this.parameterGroupName.hashCode() : 0);
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
