package imports.aws.memorydb_multi_region_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.899Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.memorydbMultiRegionCluster.MemorydbMultiRegionClusterConfig")
@software.amazon.jsii.Jsii.Proxy(MemorydbMultiRegionClusterConfig.Jsii$Proxy.class)
public interface MemorydbMultiRegionClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#multi_region_cluster_name_suffix MemorydbMultiRegionCluster#multi_region_cluster_name_suffix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMultiRegionClusterNameSuffix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#node_type MemorydbMultiRegionCluster#node_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNodeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#description MemorydbMultiRegionCluster#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#engine MemorydbMultiRegionCluster#engine}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#engine_version MemorydbMultiRegionCluster#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#multi_region_parameter_group_name MemorydbMultiRegionCluster#multi_region_parameter_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMultiRegionParameterGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#num_shards MemorydbMultiRegionCluster#num_shards}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumShards() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#tags MemorydbMultiRegionCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#timeouts MemorydbMultiRegionCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#tls_enabled MemorydbMultiRegionCluster#tls_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTlsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#update_strategy MemorydbMultiRegionCluster#update_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdateStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MemorydbMultiRegionClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MemorydbMultiRegionClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MemorydbMultiRegionClusterConfig> {
        java.lang.String multiRegionClusterNameSuffix;
        java.lang.String nodeType;
        java.lang.String description;
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String multiRegionParameterGroupName;
        java.lang.Number numShards;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts timeouts;
        java.lang.Object tlsEnabled;
        java.lang.String updateStrategy;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getMultiRegionClusterNameSuffix}
         * @param multiRegionClusterNameSuffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#multi_region_cluster_name_suffix MemorydbMultiRegionCluster#multi_region_cluster_name_suffix}. This parameter is required.
         * @return {@code this}
         */
        public Builder multiRegionClusterNameSuffix(java.lang.String multiRegionClusterNameSuffix) {
            this.multiRegionClusterNameSuffix = multiRegionClusterNameSuffix;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#node_type MemorydbMultiRegionCluster#node_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#description MemorydbMultiRegionCluster#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#engine MemorydbMultiRegionCluster#engine}.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#engine_version MemorydbMultiRegionCluster#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getMultiRegionParameterGroupName}
         * @param multiRegionParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#multi_region_parameter_group_name MemorydbMultiRegionCluster#multi_region_parameter_group_name}.
         * @return {@code this}
         */
        public Builder multiRegionParameterGroupName(java.lang.String multiRegionParameterGroupName) {
            this.multiRegionParameterGroupName = multiRegionParameterGroupName;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getNumShards}
         * @param numShards Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#num_shards MemorydbMultiRegionCluster#num_shards}.
         * @return {@code this}
         */
        public Builder numShards(java.lang.Number numShards) {
            this.numShards = numShards;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#tags MemorydbMultiRegionCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#timeouts MemorydbMultiRegionCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getTlsEnabled}
         * @param tlsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#tls_enabled MemorydbMultiRegionCluster#tls_enabled}.
         * @return {@code this}
         */
        public Builder tlsEnabled(java.lang.Boolean tlsEnabled) {
            this.tlsEnabled = tlsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getTlsEnabled}
         * @param tlsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#tls_enabled MemorydbMultiRegionCluster#tls_enabled}.
         * @return {@code this}
         */
        public Builder tlsEnabled(com.hashicorp.cdktf.IResolvable tlsEnabled) {
            this.tlsEnabled = tlsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getUpdateStrategy}
         * @param updateStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/memorydb_multi_region_cluster#update_strategy MemorydbMultiRegionCluster#update_strategy}.
         * @return {@code this}
         */
        public Builder updateStrategy(java.lang.String updateStrategy) {
            this.updateStrategy = updateStrategy;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getDependsOn}
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
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MemorydbMultiRegionClusterConfig#getProvisioners}
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
         * @return a new instance of {@link MemorydbMultiRegionClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MemorydbMultiRegionClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MemorydbMultiRegionClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MemorydbMultiRegionClusterConfig {
        private final java.lang.String multiRegionClusterNameSuffix;
        private final java.lang.String nodeType;
        private final java.lang.String description;
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String multiRegionParameterGroupName;
        private final java.lang.Number numShards;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts timeouts;
        private final java.lang.Object tlsEnabled;
        private final java.lang.String updateStrategy;
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
            this.multiRegionClusterNameSuffix = software.amazon.jsii.Kernel.get(this, "multiRegionClusterNameSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiRegionParameterGroupName = software.amazon.jsii.Kernel.get(this, "multiRegionParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numShards = software.amazon.jsii.Kernel.get(this, "numShards", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts.class));
            this.tlsEnabled = software.amazon.jsii.Kernel.get(this, "tlsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.updateStrategy = software.amazon.jsii.Kernel.get(this, "updateStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.multiRegionClusterNameSuffix = java.util.Objects.requireNonNull(builder.multiRegionClusterNameSuffix, "multiRegionClusterNameSuffix is required");
            this.nodeType = java.util.Objects.requireNonNull(builder.nodeType, "nodeType is required");
            this.description = builder.description;
            this.engine = builder.engine;
            this.engineVersion = builder.engineVersion;
            this.multiRegionParameterGroupName = builder.multiRegionParameterGroupName;
            this.numShards = builder.numShards;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.tlsEnabled = builder.tlsEnabled;
            this.updateStrategy = builder.updateStrategy;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getMultiRegionClusterNameSuffix() {
            return this.multiRegionClusterNameSuffix;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getMultiRegionParameterGroupName() {
            return this.multiRegionParameterGroupName;
        }

        @Override
        public final java.lang.Number getNumShards() {
            return this.numShards;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.memorydb_multi_region_cluster.MemorydbMultiRegionClusterTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTlsEnabled() {
            return this.tlsEnabled;
        }

        @Override
        public final java.lang.String getUpdateStrategy() {
            return this.updateStrategy;
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

            data.set("multiRegionClusterNameSuffix", om.valueToTree(this.getMultiRegionClusterNameSuffix()));
            data.set("nodeType", om.valueToTree(this.getNodeType()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEngine() != null) {
                data.set("engine", om.valueToTree(this.getEngine()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getMultiRegionParameterGroupName() != null) {
                data.set("multiRegionParameterGroupName", om.valueToTree(this.getMultiRegionParameterGroupName()));
            }
            if (this.getNumShards() != null) {
                data.set("numShards", om.valueToTree(this.getNumShards()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTlsEnabled() != null) {
                data.set("tlsEnabled", om.valueToTree(this.getTlsEnabled()));
            }
            if (this.getUpdateStrategy() != null) {
                data.set("updateStrategy", om.valueToTree(this.getUpdateStrategy()));
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
            struct.set("fqn", om.valueToTree("aws.memorydbMultiRegionCluster.MemorydbMultiRegionClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MemorydbMultiRegionClusterConfig.Jsii$Proxy that = (MemorydbMultiRegionClusterConfig.Jsii$Proxy) o;

            if (!multiRegionClusterNameSuffix.equals(that.multiRegionClusterNameSuffix)) return false;
            if (!nodeType.equals(that.nodeType)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.engine != null ? !this.engine.equals(that.engine) : that.engine != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.multiRegionParameterGroupName != null ? !this.multiRegionParameterGroupName.equals(that.multiRegionParameterGroupName) : that.multiRegionParameterGroupName != null) return false;
            if (this.numShards != null ? !this.numShards.equals(that.numShards) : that.numShards != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.tlsEnabled != null ? !this.tlsEnabled.equals(that.tlsEnabled) : that.tlsEnabled != null) return false;
            if (this.updateStrategy != null ? !this.updateStrategy.equals(that.updateStrategy) : that.updateStrategy != null) return false;
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
            int result = this.multiRegionClusterNameSuffix.hashCode();
            result = 31 * result + (this.nodeType.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.engine != null ? this.engine.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.multiRegionParameterGroupName != null ? this.multiRegionParameterGroupName.hashCode() : 0);
            result = 31 * result + (this.numShards != null ? this.numShards.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.tlsEnabled != null ? this.tlsEnabled.hashCode() : 0);
            result = 31 * result + (this.updateStrategy != null ? this.updateStrategy.hashCode() : 0);
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
