package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.919Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorConfig")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorConfig.Jsii$Proxy.class)
public interface MskconnectConnectorConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#capacity MskconnectConnector#capacity}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacity getCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#connector_configuration MskconnectConnector#connector_configuration}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getConnectorConfiguration();

    /**
     * kafka_cluster block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster MskconnectConnector#kafka_cluster}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster getKafkaCluster();

    /**
     * kafka_cluster_client_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_client_authentication MskconnectConnector#kafka_cluster_client_authentication}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication getKafkaClusterClientAuthentication();

    /**
     * kafka_cluster_encryption_in_transit block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_encryption_in_transit MskconnectConnector#kafka_cluster_encryption_in_transit}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit getKafkaClusterEncryptionInTransit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafkaconnect_version MskconnectConnector#kafkaconnect_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKafkaconnectVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#name MskconnectConnector#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * plugin block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#plugin MskconnectConnector#plugin}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPlugin();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#service_execution_role_arn MskconnectConnector#service_execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceExecutionRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#description MskconnectConnector#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#id MskconnectConnector#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * log_delivery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#log_delivery MskconnectConnector#log_delivery}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery getLogDelivery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags MskconnectConnector#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags_all MskconnectConnector#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#timeouts MskconnectConnector#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorTimeouts getTimeouts() {
        return null;
    }

    /**
     * worker_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_configuration MskconnectConnector#worker_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration getWorkerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorConfig> {
        imports.aws.mskconnect_connector.MskconnectConnectorCapacity capacity;
        java.util.Map<java.lang.String, java.lang.String> connectorConfiguration;
        imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster kafkaCluster;
        imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication kafkaClusterClientAuthentication;
        imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit kafkaClusterEncryptionInTransit;
        java.lang.String kafkaconnectVersion;
        java.lang.String name;
        java.lang.Object plugin;
        java.lang.String serviceExecutionRoleArn;
        java.lang.String description;
        java.lang.String id;
        imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery logDelivery;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.mskconnect_connector.MskconnectConnectorTimeouts timeouts;
        imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration workerConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getCapacity}
         * @param capacity capacity block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#capacity MskconnectConnector#capacity}
         * @return {@code this}
         */
        public Builder capacity(imports.aws.mskconnect_connector.MskconnectConnectorCapacity capacity) {
            this.capacity = capacity;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getConnectorConfiguration}
         * @param connectorConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#connector_configuration MskconnectConnector#connector_configuration}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectorConfiguration(java.util.Map<java.lang.String, java.lang.String> connectorConfiguration) {
            this.connectorConfiguration = connectorConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getKafkaCluster}
         * @param kafkaCluster kafka_cluster block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster MskconnectConnector#kafka_cluster}
         * @return {@code this}
         */
        public Builder kafkaCluster(imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster kafkaCluster) {
            this.kafkaCluster = kafkaCluster;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getKafkaClusterClientAuthentication}
         * @param kafkaClusterClientAuthentication kafka_cluster_client_authentication block. This parameter is required.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_client_authentication MskconnectConnector#kafka_cluster_client_authentication}
         * @return {@code this}
         */
        public Builder kafkaClusterClientAuthentication(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication kafkaClusterClientAuthentication) {
            this.kafkaClusterClientAuthentication = kafkaClusterClientAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getKafkaClusterEncryptionInTransit}
         * @param kafkaClusterEncryptionInTransit kafka_cluster_encryption_in_transit block. This parameter is required.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_encryption_in_transit MskconnectConnector#kafka_cluster_encryption_in_transit}
         * @return {@code this}
         */
        public Builder kafkaClusterEncryptionInTransit(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit kafkaClusterEncryptionInTransit) {
            this.kafkaClusterEncryptionInTransit = kafkaClusterEncryptionInTransit;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getKafkaconnectVersion}
         * @param kafkaconnectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafkaconnect_version MskconnectConnector#kafkaconnect_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder kafkaconnectVersion(java.lang.String kafkaconnectVersion) {
            this.kafkaconnectVersion = kafkaconnectVersion;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#name MskconnectConnector#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getPlugin}
         * @param plugin plugin block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#plugin MskconnectConnector#plugin}
         * @return {@code this}
         */
        public Builder plugin(com.hashicorp.cdktf.IResolvable plugin) {
            this.plugin = plugin;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getPlugin}
         * @param plugin plugin block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#plugin MskconnectConnector#plugin}
         * @return {@code this}
         */
        public Builder plugin(java.util.List<? extends imports.aws.mskconnect_connector.MskconnectConnectorPlugin> plugin) {
            this.plugin = plugin;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getServiceExecutionRoleArn}
         * @param serviceExecutionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#service_execution_role_arn MskconnectConnector#service_execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceExecutionRoleArn(java.lang.String serviceExecutionRoleArn) {
            this.serviceExecutionRoleArn = serviceExecutionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#description MskconnectConnector#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#id MskconnectConnector#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getLogDelivery}
         * @param logDelivery log_delivery block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#log_delivery MskconnectConnector#log_delivery}
         * @return {@code this}
         */
        public Builder logDelivery(imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery logDelivery) {
            this.logDelivery = logDelivery;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags MskconnectConnector#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags_all MskconnectConnector#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#timeouts MskconnectConnector#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.mskconnect_connector.MskconnectConnectorTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getWorkerConfiguration}
         * @param workerConfiguration worker_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_configuration MskconnectConnector#worker_configuration}
         * @return {@code this}
         */
        public Builder workerConfiguration(imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration workerConfiguration) {
            this.workerConfiguration = workerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getDependsOn}
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
         * Sets the value of {@link MskconnectConnectorConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorConfig#getProvisioners}
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
         * @return a new instance of {@link MskconnectConnectorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorConfig {
        private final imports.aws.mskconnect_connector.MskconnectConnectorCapacity capacity;
        private final java.util.Map<java.lang.String, java.lang.String> connectorConfiguration;
        private final imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster kafkaCluster;
        private final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication kafkaClusterClientAuthentication;
        private final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit kafkaClusterEncryptionInTransit;
        private final java.lang.String kafkaconnectVersion;
        private final java.lang.String name;
        private final java.lang.Object plugin;
        private final java.lang.String serviceExecutionRoleArn;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery logDelivery;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.mskconnect_connector.MskconnectConnectorTimeouts timeouts;
        private final imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration workerConfiguration;
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
            this.capacity = software.amazon.jsii.Kernel.get(this, "capacity", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacity.class));
            this.connectorConfiguration = software.amazon.jsii.Kernel.get(this, "connectorConfiguration", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.kafkaCluster = software.amazon.jsii.Kernel.get(this, "kafkaCluster", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster.class));
            this.kafkaClusterClientAuthentication = software.amazon.jsii.Kernel.get(this, "kafkaClusterClientAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication.class));
            this.kafkaClusterEncryptionInTransit = software.amazon.jsii.Kernel.get(this, "kafkaClusterEncryptionInTransit", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit.class));
            this.kafkaconnectVersion = software.amazon.jsii.Kernel.get(this, "kafkaconnectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.plugin = software.amazon.jsii.Kernel.get(this, "plugin", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serviceExecutionRoleArn = software.amazon.jsii.Kernel.get(this, "serviceExecutionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDelivery = software.amazon.jsii.Kernel.get(this, "logDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorTimeouts.class));
            this.workerConfiguration = software.amazon.jsii.Kernel.get(this, "workerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration.class));
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
            this.capacity = java.util.Objects.requireNonNull(builder.capacity, "capacity is required");
            this.connectorConfiguration = java.util.Objects.requireNonNull(builder.connectorConfiguration, "connectorConfiguration is required");
            this.kafkaCluster = java.util.Objects.requireNonNull(builder.kafkaCluster, "kafkaCluster is required");
            this.kafkaClusterClientAuthentication = java.util.Objects.requireNonNull(builder.kafkaClusterClientAuthentication, "kafkaClusterClientAuthentication is required");
            this.kafkaClusterEncryptionInTransit = java.util.Objects.requireNonNull(builder.kafkaClusterEncryptionInTransit, "kafkaClusterEncryptionInTransit is required");
            this.kafkaconnectVersion = java.util.Objects.requireNonNull(builder.kafkaconnectVersion, "kafkaconnectVersion is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.plugin = java.util.Objects.requireNonNull(builder.plugin, "plugin is required");
            this.serviceExecutionRoleArn = java.util.Objects.requireNonNull(builder.serviceExecutionRoleArn, "serviceExecutionRoleArn is required");
            this.description = builder.description;
            this.id = builder.id;
            this.logDelivery = builder.logDelivery;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.workerConfiguration = builder.workerConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorCapacity getCapacity() {
            return this.capacity;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getConnectorConfiguration() {
            return this.connectorConfiguration;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster getKafkaCluster() {
            return this.kafkaCluster;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication getKafkaClusterClientAuthentication() {
            return this.kafkaClusterClientAuthentication;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit getKafkaClusterEncryptionInTransit() {
            return this.kafkaClusterEncryptionInTransit;
        }

        @Override
        public final java.lang.String getKafkaconnectVersion() {
            return this.kafkaconnectVersion;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getPlugin() {
            return this.plugin;
        }

        @Override
        public final java.lang.String getServiceExecutionRoleArn() {
            return this.serviceExecutionRoleArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery getLogDelivery() {
            return this.logDelivery;
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
        public final imports.aws.mskconnect_connector.MskconnectConnectorTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration getWorkerConfiguration() {
            return this.workerConfiguration;
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

            data.set("capacity", om.valueToTree(this.getCapacity()));
            data.set("connectorConfiguration", om.valueToTree(this.getConnectorConfiguration()));
            data.set("kafkaCluster", om.valueToTree(this.getKafkaCluster()));
            data.set("kafkaClusterClientAuthentication", om.valueToTree(this.getKafkaClusterClientAuthentication()));
            data.set("kafkaClusterEncryptionInTransit", om.valueToTree(this.getKafkaClusterEncryptionInTransit()));
            data.set("kafkaconnectVersion", om.valueToTree(this.getKafkaconnectVersion()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("plugin", om.valueToTree(this.getPlugin()));
            data.set("serviceExecutionRoleArn", om.valueToTree(this.getServiceExecutionRoleArn()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogDelivery() != null) {
                data.set("logDelivery", om.valueToTree(this.getLogDelivery()));
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
            if (this.getWorkerConfiguration() != null) {
                data.set("workerConfiguration", om.valueToTree(this.getWorkerConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorConfig.Jsii$Proxy that = (MskconnectConnectorConfig.Jsii$Proxy) o;

            if (!capacity.equals(that.capacity)) return false;
            if (!connectorConfiguration.equals(that.connectorConfiguration)) return false;
            if (!kafkaCluster.equals(that.kafkaCluster)) return false;
            if (!kafkaClusterClientAuthentication.equals(that.kafkaClusterClientAuthentication)) return false;
            if (!kafkaClusterEncryptionInTransit.equals(that.kafkaClusterEncryptionInTransit)) return false;
            if (!kafkaconnectVersion.equals(that.kafkaconnectVersion)) return false;
            if (!name.equals(that.name)) return false;
            if (!plugin.equals(that.plugin)) return false;
            if (!serviceExecutionRoleArn.equals(that.serviceExecutionRoleArn)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logDelivery != null ? !this.logDelivery.equals(that.logDelivery) : that.logDelivery != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.workerConfiguration != null ? !this.workerConfiguration.equals(that.workerConfiguration) : that.workerConfiguration != null) return false;
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
            int result = this.capacity.hashCode();
            result = 31 * result + (this.connectorConfiguration.hashCode());
            result = 31 * result + (this.kafkaCluster.hashCode());
            result = 31 * result + (this.kafkaClusterClientAuthentication.hashCode());
            result = 31 * result + (this.kafkaClusterEncryptionInTransit.hashCode());
            result = 31 * result + (this.kafkaconnectVersion.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.plugin.hashCode());
            result = 31 * result + (this.serviceExecutionRoleArn.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logDelivery != null ? this.logDelivery.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.workerConfiguration != null ? this.workerConfiguration.hashCode() : 0);
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
