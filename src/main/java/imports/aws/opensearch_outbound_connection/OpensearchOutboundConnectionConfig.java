package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionConfig")
@software.amazon.jsii.Jsii.Proxy(OpensearchOutboundConnectionConfig.Jsii$Proxy.class)
public interface OpensearchOutboundConnectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionAlias();

    /**
     * local_domain_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
     */
    @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo getLocalDomainInfo();

    /**
     * remote_domain_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
     */
    @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo getRemoteDomainInfo();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAcceptConnection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionMode() {
        return null;
    }

    /**
     * connection_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties getConnectionProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchOutboundConnectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchOutboundConnectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchOutboundConnectionConfig> {
        java.lang.String connectionAlias;
        imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo localDomainInfo;
        imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo remoteDomainInfo;
        java.lang.Object acceptConnection;
        java.lang.String connectionMode;
        imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties connectionProperties;
        java.lang.String id;
        imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getConnectionAlias}
         * @param connectionAlias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionAlias(java.lang.String connectionAlias) {
            this.connectionAlias = connectionAlias;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getLocalDomainInfo}
         * @param localDomainInfo local_domain_info block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
         * @return {@code this}
         */
        public Builder localDomainInfo(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo localDomainInfo) {
            this.localDomainInfo = localDomainInfo;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getRemoteDomainInfo}
         * @param remoteDomainInfo remote_domain_info block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
         * @return {@code this}
         */
        public Builder remoteDomainInfo(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo remoteDomainInfo) {
            this.remoteDomainInfo = remoteDomainInfo;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getAcceptConnection}
         * @param acceptConnection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
         * @return {@code this}
         */
        public Builder acceptConnection(java.lang.Boolean acceptConnection) {
            this.acceptConnection = acceptConnection;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getAcceptConnection}
         * @param acceptConnection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
         * @return {@code this}
         */
        public Builder acceptConnection(com.hashicorp.cdktf.IResolvable acceptConnection) {
            this.acceptConnection = acceptConnection;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getConnectionMode}
         * @param connectionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.
         * @return {@code this}
         */
        public Builder connectionMode(java.lang.String connectionMode) {
            this.connectionMode = connectionMode;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getConnectionProperties}
         * @param connectionProperties connection_properties block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
         * @return {@code this}
         */
        public Builder connectionProperties(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties connectionProperties) {
            this.connectionProperties = connectionProperties;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getDependsOn}
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
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchOutboundConnectionConfig#getProvisioners}
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
         * @return a new instance of {@link OpensearchOutboundConnectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchOutboundConnectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchOutboundConnectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchOutboundConnectionConfig {
        private final java.lang.String connectionAlias;
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo localDomainInfo;
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo remoteDomainInfo;
        private final java.lang.Object acceptConnection;
        private final java.lang.String connectionMode;
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties connectionProperties;
        private final java.lang.String id;
        private final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts timeouts;
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
            this.connectionAlias = software.amazon.jsii.Kernel.get(this, "connectionAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localDomainInfo = software.amazon.jsii.Kernel.get(this, "localDomainInfo", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo.class));
            this.remoteDomainInfo = software.amazon.jsii.Kernel.get(this, "remoteDomainInfo", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo.class));
            this.acceptConnection = software.amazon.jsii.Kernel.get(this, "acceptConnection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connectionMode = software.amazon.jsii.Kernel.get(this, "connectionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionProperties = software.amazon.jsii.Kernel.get(this, "connectionProperties", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts.class));
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
            this.connectionAlias = java.util.Objects.requireNonNull(builder.connectionAlias, "connectionAlias is required");
            this.localDomainInfo = java.util.Objects.requireNonNull(builder.localDomainInfo, "localDomainInfo is required");
            this.remoteDomainInfo = java.util.Objects.requireNonNull(builder.remoteDomainInfo, "remoteDomainInfo is required");
            this.acceptConnection = builder.acceptConnection;
            this.connectionMode = builder.connectionMode;
            this.connectionProperties = builder.connectionProperties;
            this.id = builder.id;
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
        public final java.lang.String getConnectionAlias() {
            return this.connectionAlias;
        }

        @Override
        public final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionLocalDomainInfo getLocalDomainInfo() {
            return this.localDomainInfo;
        }

        @Override
        public final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionRemoteDomainInfo getRemoteDomainInfo() {
            return this.remoteDomainInfo;
        }

        @Override
        public final java.lang.Object getAcceptConnection() {
            return this.acceptConnection;
        }

        @Override
        public final java.lang.String getConnectionMode() {
            return this.connectionMode;
        }

        @Override
        public final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties getConnectionProperties() {
            return this.connectionProperties;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionTimeouts getTimeouts() {
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

            data.set("connectionAlias", om.valueToTree(this.getConnectionAlias()));
            data.set("localDomainInfo", om.valueToTree(this.getLocalDomainInfo()));
            data.set("remoteDomainInfo", om.valueToTree(this.getRemoteDomainInfo()));
            if (this.getAcceptConnection() != null) {
                data.set("acceptConnection", om.valueToTree(this.getAcceptConnection()));
            }
            if (this.getConnectionMode() != null) {
                data.set("connectionMode", om.valueToTree(this.getConnectionMode()));
            }
            if (this.getConnectionProperties() != null) {
                data.set("connectionProperties", om.valueToTree(this.getConnectionProperties()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.opensearchOutboundConnection.OpensearchOutboundConnectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchOutboundConnectionConfig.Jsii$Proxy that = (OpensearchOutboundConnectionConfig.Jsii$Proxy) o;

            if (!connectionAlias.equals(that.connectionAlias)) return false;
            if (!localDomainInfo.equals(that.localDomainInfo)) return false;
            if (!remoteDomainInfo.equals(that.remoteDomainInfo)) return false;
            if (this.acceptConnection != null ? !this.acceptConnection.equals(that.acceptConnection) : that.acceptConnection != null) return false;
            if (this.connectionMode != null ? !this.connectionMode.equals(that.connectionMode) : that.connectionMode != null) return false;
            if (this.connectionProperties != null ? !this.connectionProperties.equals(that.connectionProperties) : that.connectionProperties != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.connectionAlias.hashCode();
            result = 31 * result + (this.localDomainInfo.hashCode());
            result = 31 * result + (this.remoteDomainInfo.hashCode());
            result = 31 * result + (this.acceptConnection != null ? this.acceptConnection.hashCode() : 0);
            result = 31 * result + (this.connectionMode != null ? this.connectionMode.hashCode() : 0);
            result = 31 * result + (this.connectionProperties != null ? this.connectionProperties.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
