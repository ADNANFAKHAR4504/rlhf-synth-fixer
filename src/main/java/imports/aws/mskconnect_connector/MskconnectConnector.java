package imports.aws.mskconnect_connector;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector aws_mskconnect_connector}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.918Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnector")
public class MskconnectConnector extends com.hashicorp.cdktf.TerraformResource {

    protected MskconnectConnector(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnector(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.mskconnect_connector.MskconnectConnector.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector aws_mskconnect_connector} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public MskconnectConnector(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a MskconnectConnector resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MskconnectConnector to import. This parameter is required.
     * @param importFromId The id of the existing MskconnectConnector that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the MskconnectConnector to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mskconnect_connector.MskconnectConnector.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a MskconnectConnector resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MskconnectConnector to import. This parameter is required.
     * @param importFromId The id of the existing MskconnectConnector that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mskconnect_connector.MskconnectConnector.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCapacity(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacity value) {
        software.amazon.jsii.Kernel.call(this, "putCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKafkaCluster(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster value) {
        software.amazon.jsii.Kernel.call(this, "putKafkaCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKafkaClusterClientAuthentication(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication value) {
        software.amazon.jsii.Kernel.call(this, "putKafkaClusterClientAuthentication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKafkaClusterEncryptionInTransit(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit value) {
        software.amazon.jsii.Kernel.call(this, "putKafkaClusterEncryptionInTransit", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogDelivery(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery value) {
        software.amazon.jsii.Kernel.call(this, "putLogDelivery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlugin(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.mskconnect_connector.MskconnectConnectorPlugin>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.mskconnect_connector.MskconnectConnectorPlugin> __cast_cd4240 = (java.util.List<imports.aws.mskconnect_connector.MskconnectConnectorPlugin>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.mskconnect_connector.MskconnectConnectorPlugin __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlugin", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkerConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putWorkerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDelivery() {
        software.amazon.jsii.Kernel.call(this, "resetLogDelivery", software.amazon.jsii.NativeType.VOID);
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

    public void resetWorkerConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetWorkerConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorCapacityOutputReference getCapacity() {
        return software.amazon.jsii.Kernel.get(this, "capacity", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterOutputReference getKafkaCluster() {
        return software.amazon.jsii.Kernel.get(this, "kafkaCluster", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthenticationOutputReference getKafkaClusterClientAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "kafkaClusterClientAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthenticationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference getKafkaClusterEncryptionInTransit() {
        return software.amazon.jsii.Kernel.get(this, "kafkaClusterEncryptionInTransit", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransitOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryOutputReference getLogDelivery() {
        return software.amazon.jsii.Kernel.get(this, "logDelivery", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorPluginList getPlugin() {
        return software.amazon.jsii.Kernel.get(this, "plugin", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorPluginList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfigurationOutputReference getWorkerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "workerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorCapacity getCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorCapacity.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getConnectorConfigurationInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "connectorConfigurationInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication getKafkaClusterClientAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaClusterClientAuthenticationInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit getKafkaClusterEncryptionInTransitInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaClusterEncryptionInTransitInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster getKafkaClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKafkaconnectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaconnectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery getLogDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPluginInput() {
        return software.amazon.jsii.Kernel.get(this, "pluginInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceExecutionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration getWorkerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "workerConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getConnectorConfiguration() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "connectorConfiguration", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setConnectorConfiguration(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "connectorConfiguration", java.util.Objects.requireNonNull(value, "connectorConfiguration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKafkaconnectVersion() {
        return software.amazon.jsii.Kernel.get(this, "kafkaconnectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKafkaconnectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kafkaconnectVersion", java.util.Objects.requireNonNull(value, "kafkaconnectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceExecutionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceExecutionRoleArn", java.util.Objects.requireNonNull(value, "serviceExecutionRoleArn is required"));
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
     * A fluent builder for {@link imports.aws.mskconnect_connector.MskconnectConnector}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.mskconnect_connector.MskconnectConnector> {
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
        private final imports.aws.mskconnect_connector.MskconnectConnectorConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.mskconnect_connector.MskconnectConnectorConfig.Builder();
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
         * capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#capacity MskconnectConnector#capacity}
         * <p>
         * @return {@code this}
         * @param capacity capacity block. This parameter is required.
         */
        public Builder capacity(final imports.aws.mskconnect_connector.MskconnectConnectorCapacity capacity) {
            this.config.capacity(capacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#connector_configuration MskconnectConnector#connector_configuration}.
         * <p>
         * @return {@code this}
         * @param connectorConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#connector_configuration MskconnectConnector#connector_configuration}. This parameter is required.
         */
        public Builder connectorConfiguration(final java.util.Map<java.lang.String, java.lang.String> connectorConfiguration) {
            this.config.connectorConfiguration(connectorConfiguration);
            return this;
        }

        /**
         * kafka_cluster block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster MskconnectConnector#kafka_cluster}
         * <p>
         * @return {@code this}
         * @param kafkaCluster kafka_cluster block. This parameter is required.
         */
        public Builder kafkaCluster(final imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster kafkaCluster) {
            this.config.kafkaCluster(kafkaCluster);
            return this;
        }

        /**
         * kafka_cluster_client_authentication block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_client_authentication MskconnectConnector#kafka_cluster_client_authentication}
         * <p>
         * @return {@code this}
         * @param kafkaClusterClientAuthentication kafka_cluster_client_authentication block. This parameter is required.
         */
        public Builder kafkaClusterClientAuthentication(final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterClientAuthentication kafkaClusterClientAuthentication) {
            this.config.kafkaClusterClientAuthentication(kafkaClusterClientAuthentication);
            return this;
        }

        /**
         * kafka_cluster_encryption_in_transit block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafka_cluster_encryption_in_transit MskconnectConnector#kafka_cluster_encryption_in_transit}
         * <p>
         * @return {@code this}
         * @param kafkaClusterEncryptionInTransit kafka_cluster_encryption_in_transit block. This parameter is required.
         */
        public Builder kafkaClusterEncryptionInTransit(final imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterEncryptionInTransit kafkaClusterEncryptionInTransit) {
            this.config.kafkaClusterEncryptionInTransit(kafkaClusterEncryptionInTransit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafkaconnect_version MskconnectConnector#kafkaconnect_version}.
         * <p>
         * @return {@code this}
         * @param kafkaconnectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#kafkaconnect_version MskconnectConnector#kafkaconnect_version}. This parameter is required.
         */
        public Builder kafkaconnectVersion(final java.lang.String kafkaconnectVersion) {
            this.config.kafkaconnectVersion(kafkaconnectVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#name MskconnectConnector#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#name MskconnectConnector#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * plugin block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#plugin MskconnectConnector#plugin}
         * <p>
         * @return {@code this}
         * @param plugin plugin block. This parameter is required.
         */
        public Builder plugin(final com.hashicorp.cdktf.IResolvable plugin) {
            this.config.plugin(plugin);
            return this;
        }
        /**
         * plugin block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#plugin MskconnectConnector#plugin}
         * <p>
         * @return {@code this}
         * @param plugin plugin block. This parameter is required.
         */
        public Builder plugin(final java.util.List<? extends imports.aws.mskconnect_connector.MskconnectConnectorPlugin> plugin) {
            this.config.plugin(plugin);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#service_execution_role_arn MskconnectConnector#service_execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceExecutionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#service_execution_role_arn MskconnectConnector#service_execution_role_arn}. This parameter is required.
         */
        public Builder serviceExecutionRoleArn(final java.lang.String serviceExecutionRoleArn) {
            this.config.serviceExecutionRoleArn(serviceExecutionRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#description MskconnectConnector#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#description MskconnectConnector#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#id MskconnectConnector#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#id MskconnectConnector#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * log_delivery block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#log_delivery MskconnectConnector#log_delivery}
         * <p>
         * @return {@code this}
         * @param logDelivery log_delivery block. This parameter is required.
         */
        public Builder logDelivery(final imports.aws.mskconnect_connector.MskconnectConnectorLogDelivery logDelivery) {
            this.config.logDelivery(logDelivery);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags MskconnectConnector#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags MskconnectConnector#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags_all MskconnectConnector#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#tags_all MskconnectConnector#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#timeouts MskconnectConnector#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.mskconnect_connector.MskconnectConnectorTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * worker_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#worker_configuration MskconnectConnector#worker_configuration}
         * <p>
         * @return {@code this}
         * @param workerConfiguration worker_configuration block. This parameter is required.
         */
        public Builder workerConfiguration(final imports.aws.mskconnect_connector.MskconnectConnectorWorkerConfiguration workerConfiguration) {
            this.config.workerConfiguration(workerConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.mskconnect_connector.MskconnectConnector}.
         */
        @Override
        public imports.aws.mskconnect_connector.MskconnectConnector build() {
            return new imports.aws.mskconnect_connector.MskconnectConnector(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
