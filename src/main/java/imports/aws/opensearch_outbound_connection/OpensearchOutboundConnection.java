package imports.aws.opensearch_outbound_connection;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection aws_opensearch_outbound_connection}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnection")
public class OpensearchOutboundConnection extends com.hashicorp.cdktf.TerraformResource {

    protected OpensearchOutboundConnection(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchOutboundConnection(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection aws_opensearch_outbound_connection} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpensearchOutboundConnection(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpensearchOutboundConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpensearchOutboundConnection to import. This parameter is required.
     * @param importFromId The id of the existing OpensearchOutboundConnection that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpensearchOutboundConnection to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpensearchOutboundConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpensearchOutboundConnection to import. This parameter is required.
     * @param importFromId The id of the existing OpensearchOutboundConnection that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putConnectionProperties(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties value) {
        software.amazon.jsii.Kernel.call(this, "putConnectionProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLocalDomainInfo(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo value) {
        software.amazon.jsii.Kernel.call(this, "putLocalDomainInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRemoteDomainInfo(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo value) {
        software.amazon.jsii.Kernel.call(this, "putRemoteDomainInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcceptConnection() {
        software.amazon.jsii.Kernel.call(this, "resetAcceptConnection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionMode() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionProperties() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesOutputReference getConnectionProperties() {
        return software.amazon.jsii.Kernel.get(this, "connectionProperties", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionStatus() {
        return software.amazon.jsii.Kernel.get(this, "connectionStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfoOutputReference getLocalDomainInfo() {
        return software.amazon.jsii.Kernel.get(this, "localDomainInfo", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfoOutputReference getRemoteDomainInfo() {
        return software.amazon.jsii.Kernel.get(this, "remoteDomainInfo", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAcceptConnectionInput() {
        return software.amazon.jsii.Kernel.get(this, "acceptConnectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionAliasInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionAliasInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties getConnectionPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo getLocalDomainInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "localDomainInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo getRemoteDomainInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteDomainInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAcceptConnection() {
        return software.amazon.jsii.Kernel.get(this, "acceptConnection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAcceptConnection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "acceptConnection", java.util.Objects.requireNonNull(value, "acceptConnection is required"));
    }

    public void setAcceptConnection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "acceptConnection", java.util.Objects.requireNonNull(value, "acceptConnection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionAlias() {
        return software.amazon.jsii.Kernel.get(this, "connectionAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionAlias(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionAlias", java.util.Objects.requireNonNull(value, "connectionAlias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionMode() {
        return software.amazon.jsii.Kernel.get(this, "connectionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionMode", java.util.Objects.requireNonNull(value, "connectionMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection> {
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
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}.
         * <p>
         * @return {@code this}
         * @param connectionAlias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}. This parameter is required.
         */
        public Builder connectionAlias(final java.lang.String connectionAlias) {
            this.config.connectionAlias(connectionAlias);
            return this;
        }

        /**
         * local_domain_info block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
         * <p>
         * @return {@code this}
         * @param localDomainInfo local_domain_info block. This parameter is required.
         */
        public Builder localDomainInfo(final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo localDomainInfo) {
            this.config.localDomainInfo(localDomainInfo);
            return this;
        }

        /**
         * remote_domain_info block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
         * <p>
         * @return {@code this}
         * @param remoteDomainInfo remote_domain_info block. This parameter is required.
         */
        public Builder remoteDomainInfo(final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo remoteDomainInfo) {
            this.config.remoteDomainInfo(remoteDomainInfo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
         * <p>
         * @return {@code this}
         * @param acceptConnection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}. This parameter is required.
         */
        public Builder acceptConnection(final java.lang.Boolean acceptConnection) {
            this.config.acceptConnection(acceptConnection);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
         * <p>
         * @return {@code this}
         * @param acceptConnection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}. This parameter is required.
         */
        public Builder acceptConnection(final com.hashicorp.cdktf.IResolvable acceptConnection) {
            this.config.acceptConnection(acceptConnection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.
         * <p>
         * @return {@code this}
         * @param connectionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}. This parameter is required.
         */
        public Builder connectionMode(final java.lang.String connectionMode) {
            this.config.connectionMode(connectionMode);
            return this;
        }

        /**
         * connection_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
         * <p>
         * @return {@code this}
         * @param connectionProperties connection_properties block. This parameter is required.
         */
        public Builder connectionProperties(final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties connectionProperties) {
            this.config.connectionProperties(connectionProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection}.
         */
        @Override
        public imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection build() {
            return new imports.aws.opensearch_outbound_connection.OpensearchOutboundConnection(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
