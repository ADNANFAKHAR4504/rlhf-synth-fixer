package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterConfig")
@software.amazon.jsii.Jsii.Proxy(MskClusterConfig.Jsii$Proxy.class)
public interface MskClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * broker_node_group_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#broker_node_group_info MskCluster#broker_node_group_info}
     */
    @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo getBrokerNodeGroupInfo();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#cluster_name MskCluster#cluster_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#kafka_version MskCluster#kafka_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKafkaVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#number_of_broker_nodes MskCluster#number_of_broker_nodes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfBrokerNodes();

    /**
     * client_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#client_authentication MskCluster#client_authentication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterClientAuthentication getClientAuthentication() {
        return null;
    }

    /**
     * configuration_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#configuration_info MskCluster#configuration_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterConfigurationInfo getConfigurationInfo() {
        return null;
    }

    /**
     * encryption_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_info MskCluster#encryption_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterEncryptionInfo getEncryptionInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#enhanced_monitoring MskCluster#enhanced_monitoring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnhancedMonitoring() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#id MskCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * logging_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#logging_info MskCluster#logging_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfo getLoggingInfo() {
        return null;
    }

    /**
     * open_monitoring block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#open_monitoring MskCluster#open_monitoring}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterOpenMonitoring getOpenMonitoring() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#storage_mode MskCluster#storage_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tags MskCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tags_all MskCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#timeouts MskCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterConfig> {
        imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo brokerNodeGroupInfo;
        java.lang.String clusterName;
        java.lang.String kafkaVersion;
        java.lang.Number numberOfBrokerNodes;
        imports.aws.msk_cluster.MskClusterClientAuthentication clientAuthentication;
        imports.aws.msk_cluster.MskClusterConfigurationInfo configurationInfo;
        imports.aws.msk_cluster.MskClusterEncryptionInfo encryptionInfo;
        java.lang.String enhancedMonitoring;
        java.lang.String id;
        imports.aws.msk_cluster.MskClusterLoggingInfo loggingInfo;
        imports.aws.msk_cluster.MskClusterOpenMonitoring openMonitoring;
        java.lang.String storageMode;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.msk_cluster.MskClusterTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MskClusterConfig#getBrokerNodeGroupInfo}
         * @param brokerNodeGroupInfo broker_node_group_info block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#broker_node_group_info MskCluster#broker_node_group_info}
         * @return {@code this}
         */
        public Builder brokerNodeGroupInfo(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo brokerNodeGroupInfo) {
            this.brokerNodeGroupInfo = brokerNodeGroupInfo;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getClusterName}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#cluster_name MskCluster#cluster_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterName(java.lang.String clusterName) {
            this.clusterName = clusterName;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getKafkaVersion}
         * @param kafkaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#kafka_version MskCluster#kafka_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder kafkaVersion(java.lang.String kafkaVersion) {
            this.kafkaVersion = kafkaVersion;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getNumberOfBrokerNodes}
         * @param numberOfBrokerNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#number_of_broker_nodes MskCluster#number_of_broker_nodes}. This parameter is required.
         * @return {@code this}
         */
        public Builder numberOfBrokerNodes(java.lang.Number numberOfBrokerNodes) {
            this.numberOfBrokerNodes = numberOfBrokerNodes;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getClientAuthentication}
         * @param clientAuthentication client_authentication block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#client_authentication MskCluster#client_authentication}
         * @return {@code this}
         */
        public Builder clientAuthentication(imports.aws.msk_cluster.MskClusterClientAuthentication clientAuthentication) {
            this.clientAuthentication = clientAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getConfigurationInfo}
         * @param configurationInfo configuration_info block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#configuration_info MskCluster#configuration_info}
         * @return {@code this}
         */
        public Builder configurationInfo(imports.aws.msk_cluster.MskClusterConfigurationInfo configurationInfo) {
            this.configurationInfo = configurationInfo;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getEncryptionInfo}
         * @param encryptionInfo encryption_info block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#encryption_info MskCluster#encryption_info}
         * @return {@code this}
         */
        public Builder encryptionInfo(imports.aws.msk_cluster.MskClusterEncryptionInfo encryptionInfo) {
            this.encryptionInfo = encryptionInfo;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getEnhancedMonitoring}
         * @param enhancedMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#enhanced_monitoring MskCluster#enhanced_monitoring}.
         * @return {@code this}
         */
        public Builder enhancedMonitoring(java.lang.String enhancedMonitoring) {
            this.enhancedMonitoring = enhancedMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#id MskCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getLoggingInfo}
         * @param loggingInfo logging_info block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#logging_info MskCluster#logging_info}
         * @return {@code this}
         */
        public Builder loggingInfo(imports.aws.msk_cluster.MskClusterLoggingInfo loggingInfo) {
            this.loggingInfo = loggingInfo;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getOpenMonitoring}
         * @param openMonitoring open_monitoring block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#open_monitoring MskCluster#open_monitoring}
         * @return {@code this}
         */
        public Builder openMonitoring(imports.aws.msk_cluster.MskClusterOpenMonitoring openMonitoring) {
            this.openMonitoring = openMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getStorageMode}
         * @param storageMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#storage_mode MskCluster#storage_mode}.
         * @return {@code this}
         */
        public Builder storageMode(java.lang.String storageMode) {
            this.storageMode = storageMode;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tags MskCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tags_all MskCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#timeouts MskCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.msk_cluster.MskClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getDependsOn}
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
         * Sets the value of {@link MskClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfig#getProvisioners}
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
         * @return a new instance of {@link MskClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterConfig {
        private final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo brokerNodeGroupInfo;
        private final java.lang.String clusterName;
        private final java.lang.String kafkaVersion;
        private final java.lang.Number numberOfBrokerNodes;
        private final imports.aws.msk_cluster.MskClusterClientAuthentication clientAuthentication;
        private final imports.aws.msk_cluster.MskClusterConfigurationInfo configurationInfo;
        private final imports.aws.msk_cluster.MskClusterEncryptionInfo encryptionInfo;
        private final java.lang.String enhancedMonitoring;
        private final java.lang.String id;
        private final imports.aws.msk_cluster.MskClusterLoggingInfo loggingInfo;
        private final imports.aws.msk_cluster.MskClusterOpenMonitoring openMonitoring;
        private final java.lang.String storageMode;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.msk_cluster.MskClusterTimeouts timeouts;
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
            this.brokerNodeGroupInfo = software.amazon.jsii.Kernel.get(this, "brokerNodeGroupInfo", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo.class));
            this.clusterName = software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kafkaVersion = software.amazon.jsii.Kernel.get(this, "kafkaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numberOfBrokerNodes = software.amazon.jsii.Kernel.get(this, "numberOfBrokerNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.clientAuthentication = software.amazon.jsii.Kernel.get(this, "clientAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterClientAuthentication.class));
            this.configurationInfo = software.amazon.jsii.Kernel.get(this, "configurationInfo", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterConfigurationInfo.class));
            this.encryptionInfo = software.amazon.jsii.Kernel.get(this, "encryptionInfo", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterEncryptionInfo.class));
            this.enhancedMonitoring = software.amazon.jsii.Kernel.get(this, "enhancedMonitoring", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loggingInfo = software.amazon.jsii.Kernel.get(this, "loggingInfo", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfo.class));
            this.openMonitoring = software.amazon.jsii.Kernel.get(this, "openMonitoring", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterOpenMonitoring.class));
            this.storageMode = software.amazon.jsii.Kernel.get(this, "storageMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterTimeouts.class));
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
            this.brokerNodeGroupInfo = java.util.Objects.requireNonNull(builder.brokerNodeGroupInfo, "brokerNodeGroupInfo is required");
            this.clusterName = java.util.Objects.requireNonNull(builder.clusterName, "clusterName is required");
            this.kafkaVersion = java.util.Objects.requireNonNull(builder.kafkaVersion, "kafkaVersion is required");
            this.numberOfBrokerNodes = java.util.Objects.requireNonNull(builder.numberOfBrokerNodes, "numberOfBrokerNodes is required");
            this.clientAuthentication = builder.clientAuthentication;
            this.configurationInfo = builder.configurationInfo;
            this.encryptionInfo = builder.encryptionInfo;
            this.enhancedMonitoring = builder.enhancedMonitoring;
            this.id = builder.id;
            this.loggingInfo = builder.loggingInfo;
            this.openMonitoring = builder.openMonitoring;
            this.storageMode = builder.storageMode;
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
        public final imports.aws.msk_cluster.MskClusterBrokerNodeGroupInfo getBrokerNodeGroupInfo() {
            return this.brokerNodeGroupInfo;
        }

        @Override
        public final java.lang.String getClusterName() {
            return this.clusterName;
        }

        @Override
        public final java.lang.String getKafkaVersion() {
            return this.kafkaVersion;
        }

        @Override
        public final java.lang.Number getNumberOfBrokerNodes() {
            return this.numberOfBrokerNodes;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterClientAuthentication getClientAuthentication() {
            return this.clientAuthentication;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterConfigurationInfo getConfigurationInfo() {
            return this.configurationInfo;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterEncryptionInfo getEncryptionInfo() {
            return this.encryptionInfo;
        }

        @Override
        public final java.lang.String getEnhancedMonitoring() {
            return this.enhancedMonitoring;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterLoggingInfo getLoggingInfo() {
            return this.loggingInfo;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterOpenMonitoring getOpenMonitoring() {
            return this.openMonitoring;
        }

        @Override
        public final java.lang.String getStorageMode() {
            return this.storageMode;
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
        public final imports.aws.msk_cluster.MskClusterTimeouts getTimeouts() {
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

            data.set("brokerNodeGroupInfo", om.valueToTree(this.getBrokerNodeGroupInfo()));
            data.set("clusterName", om.valueToTree(this.getClusterName()));
            data.set("kafkaVersion", om.valueToTree(this.getKafkaVersion()));
            data.set("numberOfBrokerNodes", om.valueToTree(this.getNumberOfBrokerNodes()));
            if (this.getClientAuthentication() != null) {
                data.set("clientAuthentication", om.valueToTree(this.getClientAuthentication()));
            }
            if (this.getConfigurationInfo() != null) {
                data.set("configurationInfo", om.valueToTree(this.getConfigurationInfo()));
            }
            if (this.getEncryptionInfo() != null) {
                data.set("encryptionInfo", om.valueToTree(this.getEncryptionInfo()));
            }
            if (this.getEnhancedMonitoring() != null) {
                data.set("enhancedMonitoring", om.valueToTree(this.getEnhancedMonitoring()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLoggingInfo() != null) {
                data.set("loggingInfo", om.valueToTree(this.getLoggingInfo()));
            }
            if (this.getOpenMonitoring() != null) {
                data.set("openMonitoring", om.valueToTree(this.getOpenMonitoring()));
            }
            if (this.getStorageMode() != null) {
                data.set("storageMode", om.valueToTree(this.getStorageMode()));
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
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterConfig.Jsii$Proxy that = (MskClusterConfig.Jsii$Proxy) o;

            if (!brokerNodeGroupInfo.equals(that.brokerNodeGroupInfo)) return false;
            if (!clusterName.equals(that.clusterName)) return false;
            if (!kafkaVersion.equals(that.kafkaVersion)) return false;
            if (!numberOfBrokerNodes.equals(that.numberOfBrokerNodes)) return false;
            if (this.clientAuthentication != null ? !this.clientAuthentication.equals(that.clientAuthentication) : that.clientAuthentication != null) return false;
            if (this.configurationInfo != null ? !this.configurationInfo.equals(that.configurationInfo) : that.configurationInfo != null) return false;
            if (this.encryptionInfo != null ? !this.encryptionInfo.equals(that.encryptionInfo) : that.encryptionInfo != null) return false;
            if (this.enhancedMonitoring != null ? !this.enhancedMonitoring.equals(that.enhancedMonitoring) : that.enhancedMonitoring != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.loggingInfo != null ? !this.loggingInfo.equals(that.loggingInfo) : that.loggingInfo != null) return false;
            if (this.openMonitoring != null ? !this.openMonitoring.equals(that.openMonitoring) : that.openMonitoring != null) return false;
            if (this.storageMode != null ? !this.storageMode.equals(that.storageMode) : that.storageMode != null) return false;
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
            int result = this.brokerNodeGroupInfo.hashCode();
            result = 31 * result + (this.clusterName.hashCode());
            result = 31 * result + (this.kafkaVersion.hashCode());
            result = 31 * result + (this.numberOfBrokerNodes.hashCode());
            result = 31 * result + (this.clientAuthentication != null ? this.clientAuthentication.hashCode() : 0);
            result = 31 * result + (this.configurationInfo != null ? this.configurationInfo.hashCode() : 0);
            result = 31 * result + (this.encryptionInfo != null ? this.encryptionInfo.hashCode() : 0);
            result = 31 * result + (this.enhancedMonitoring != null ? this.enhancedMonitoring.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.loggingInfo != null ? this.loggingInfo.hashCode() : 0);
            result = 31 * result + (this.openMonitoring != null ? this.openMonitoring.hashCode() : 0);
            result = 31 * result + (this.storageMode != null ? this.storageMode.hashCode() : 0);
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
