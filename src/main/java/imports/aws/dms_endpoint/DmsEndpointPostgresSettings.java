package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointPostgresSettings")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointPostgresSettings.Jsii$Proxy.class)
public interface DmsEndpointPostgresSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#after_connect_script DmsEndpoint#after_connect_script}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAfterConnectScript() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#babelfish_database_name DmsEndpoint#babelfish_database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBabelfishDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#capture_ddls DmsEndpoint#capture_ddls}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCaptureDdls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#database_mode DmsEndpoint#database_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ddl_artifacts_schema DmsEndpoint#ddl_artifacts_schema}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDdlArtifactsSchema() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#execute_timeout DmsEndpoint#execute_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getExecuteTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#fail_tasks_on_lob_truncation DmsEndpoint#fail_tasks_on_lob_truncation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailTasksOnLobTruncation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_enable DmsEndpoint#heartbeat_enable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeartbeatEnable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_frequency DmsEndpoint#heartbeat_frequency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHeartbeatFrequency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_schema DmsEndpoint#heartbeat_schema}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHeartbeatSchema() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_boolean_as_boolean DmsEndpoint#map_boolean_as_boolean}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMapBooleanAsBoolean() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_jsonb_as_clob DmsEndpoint#map_jsonb_as_clob}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMapJsonbAsClob() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_long_varchar_as DmsEndpoint#map_long_varchar_as}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMapLongVarcharAs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#max_file_size DmsEndpoint#max_file_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxFileSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#plugin_name DmsEndpoint#plugin_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPluginName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#slot_name DmsEndpoint#slot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSlotName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointPostgresSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointPostgresSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointPostgresSettings> {
        java.lang.String afterConnectScript;
        java.lang.String babelfishDatabaseName;
        java.lang.Object captureDdls;
        java.lang.String databaseMode;
        java.lang.String ddlArtifactsSchema;
        java.lang.Number executeTimeout;
        java.lang.Object failTasksOnLobTruncation;
        java.lang.Object heartbeatEnable;
        java.lang.Number heartbeatFrequency;
        java.lang.String heartbeatSchema;
        java.lang.Object mapBooleanAsBoolean;
        java.lang.Object mapJsonbAsClob;
        java.lang.String mapLongVarcharAs;
        java.lang.Number maxFileSize;
        java.lang.String pluginName;
        java.lang.String slotName;

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getAfterConnectScript}
         * @param afterConnectScript Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#after_connect_script DmsEndpoint#after_connect_script}.
         * @return {@code this}
         */
        public Builder afterConnectScript(java.lang.String afterConnectScript) {
            this.afterConnectScript = afterConnectScript;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getBabelfishDatabaseName}
         * @param babelfishDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#babelfish_database_name DmsEndpoint#babelfish_database_name}.
         * @return {@code this}
         */
        public Builder babelfishDatabaseName(java.lang.String babelfishDatabaseName) {
            this.babelfishDatabaseName = babelfishDatabaseName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getCaptureDdls}
         * @param captureDdls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#capture_ddls DmsEndpoint#capture_ddls}.
         * @return {@code this}
         */
        public Builder captureDdls(java.lang.Boolean captureDdls) {
            this.captureDdls = captureDdls;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getCaptureDdls}
         * @param captureDdls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#capture_ddls DmsEndpoint#capture_ddls}.
         * @return {@code this}
         */
        public Builder captureDdls(com.hashicorp.cdktf.IResolvable captureDdls) {
            this.captureDdls = captureDdls;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getDatabaseMode}
         * @param databaseMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#database_mode DmsEndpoint#database_mode}.
         * @return {@code this}
         */
        public Builder databaseMode(java.lang.String databaseMode) {
            this.databaseMode = databaseMode;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getDdlArtifactsSchema}
         * @param ddlArtifactsSchema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ddl_artifacts_schema DmsEndpoint#ddl_artifacts_schema}.
         * @return {@code this}
         */
        public Builder ddlArtifactsSchema(java.lang.String ddlArtifactsSchema) {
            this.ddlArtifactsSchema = ddlArtifactsSchema;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getExecuteTimeout}
         * @param executeTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#execute_timeout DmsEndpoint#execute_timeout}.
         * @return {@code this}
         */
        public Builder executeTimeout(java.lang.Number executeTimeout) {
            this.executeTimeout = executeTimeout;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getFailTasksOnLobTruncation}
         * @param failTasksOnLobTruncation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#fail_tasks_on_lob_truncation DmsEndpoint#fail_tasks_on_lob_truncation}.
         * @return {@code this}
         */
        public Builder failTasksOnLobTruncation(java.lang.Boolean failTasksOnLobTruncation) {
            this.failTasksOnLobTruncation = failTasksOnLobTruncation;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getFailTasksOnLobTruncation}
         * @param failTasksOnLobTruncation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#fail_tasks_on_lob_truncation DmsEndpoint#fail_tasks_on_lob_truncation}.
         * @return {@code this}
         */
        public Builder failTasksOnLobTruncation(com.hashicorp.cdktf.IResolvable failTasksOnLobTruncation) {
            this.failTasksOnLobTruncation = failTasksOnLobTruncation;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getHeartbeatEnable}
         * @param heartbeatEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_enable DmsEndpoint#heartbeat_enable}.
         * @return {@code this}
         */
        public Builder heartbeatEnable(java.lang.Boolean heartbeatEnable) {
            this.heartbeatEnable = heartbeatEnable;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getHeartbeatEnable}
         * @param heartbeatEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_enable DmsEndpoint#heartbeat_enable}.
         * @return {@code this}
         */
        public Builder heartbeatEnable(com.hashicorp.cdktf.IResolvable heartbeatEnable) {
            this.heartbeatEnable = heartbeatEnable;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getHeartbeatFrequency}
         * @param heartbeatFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_frequency DmsEndpoint#heartbeat_frequency}.
         * @return {@code this}
         */
        public Builder heartbeatFrequency(java.lang.Number heartbeatFrequency) {
            this.heartbeatFrequency = heartbeatFrequency;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getHeartbeatSchema}
         * @param heartbeatSchema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#heartbeat_schema DmsEndpoint#heartbeat_schema}.
         * @return {@code this}
         */
        public Builder heartbeatSchema(java.lang.String heartbeatSchema) {
            this.heartbeatSchema = heartbeatSchema;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMapBooleanAsBoolean}
         * @param mapBooleanAsBoolean Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_boolean_as_boolean DmsEndpoint#map_boolean_as_boolean}.
         * @return {@code this}
         */
        public Builder mapBooleanAsBoolean(java.lang.Boolean mapBooleanAsBoolean) {
            this.mapBooleanAsBoolean = mapBooleanAsBoolean;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMapBooleanAsBoolean}
         * @param mapBooleanAsBoolean Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_boolean_as_boolean DmsEndpoint#map_boolean_as_boolean}.
         * @return {@code this}
         */
        public Builder mapBooleanAsBoolean(com.hashicorp.cdktf.IResolvable mapBooleanAsBoolean) {
            this.mapBooleanAsBoolean = mapBooleanAsBoolean;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMapJsonbAsClob}
         * @param mapJsonbAsClob Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_jsonb_as_clob DmsEndpoint#map_jsonb_as_clob}.
         * @return {@code this}
         */
        public Builder mapJsonbAsClob(java.lang.Boolean mapJsonbAsClob) {
            this.mapJsonbAsClob = mapJsonbAsClob;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMapJsonbAsClob}
         * @param mapJsonbAsClob Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_jsonb_as_clob DmsEndpoint#map_jsonb_as_clob}.
         * @return {@code this}
         */
        public Builder mapJsonbAsClob(com.hashicorp.cdktf.IResolvable mapJsonbAsClob) {
            this.mapJsonbAsClob = mapJsonbAsClob;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMapLongVarcharAs}
         * @param mapLongVarcharAs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#map_long_varchar_as DmsEndpoint#map_long_varchar_as}.
         * @return {@code this}
         */
        public Builder mapLongVarcharAs(java.lang.String mapLongVarcharAs) {
            this.mapLongVarcharAs = mapLongVarcharAs;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getMaxFileSize}
         * @param maxFileSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#max_file_size DmsEndpoint#max_file_size}.
         * @return {@code this}
         */
        public Builder maxFileSize(java.lang.Number maxFileSize) {
            this.maxFileSize = maxFileSize;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getPluginName}
         * @param pluginName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#plugin_name DmsEndpoint#plugin_name}.
         * @return {@code this}
         */
        public Builder pluginName(java.lang.String pluginName) {
            this.pluginName = pluginName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointPostgresSettings#getSlotName}
         * @param slotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#slot_name DmsEndpoint#slot_name}.
         * @return {@code this}
         */
        public Builder slotName(java.lang.String slotName) {
            this.slotName = slotName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointPostgresSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointPostgresSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointPostgresSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointPostgresSettings {
        private final java.lang.String afterConnectScript;
        private final java.lang.String babelfishDatabaseName;
        private final java.lang.Object captureDdls;
        private final java.lang.String databaseMode;
        private final java.lang.String ddlArtifactsSchema;
        private final java.lang.Number executeTimeout;
        private final java.lang.Object failTasksOnLobTruncation;
        private final java.lang.Object heartbeatEnable;
        private final java.lang.Number heartbeatFrequency;
        private final java.lang.String heartbeatSchema;
        private final java.lang.Object mapBooleanAsBoolean;
        private final java.lang.Object mapJsonbAsClob;
        private final java.lang.String mapLongVarcharAs;
        private final java.lang.Number maxFileSize;
        private final java.lang.String pluginName;
        private final java.lang.String slotName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.afterConnectScript = software.amazon.jsii.Kernel.get(this, "afterConnectScript", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.babelfishDatabaseName = software.amazon.jsii.Kernel.get(this, "babelfishDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.captureDdls = software.amazon.jsii.Kernel.get(this, "captureDdls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.databaseMode = software.amazon.jsii.Kernel.get(this, "databaseMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ddlArtifactsSchema = software.amazon.jsii.Kernel.get(this, "ddlArtifactsSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executeTimeout = software.amazon.jsii.Kernel.get(this, "executeTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.failTasksOnLobTruncation = software.amazon.jsii.Kernel.get(this, "failTasksOnLobTruncation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.heartbeatEnable = software.amazon.jsii.Kernel.get(this, "heartbeatEnable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.heartbeatFrequency = software.amazon.jsii.Kernel.get(this, "heartbeatFrequency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.heartbeatSchema = software.amazon.jsii.Kernel.get(this, "heartbeatSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mapBooleanAsBoolean = software.amazon.jsii.Kernel.get(this, "mapBooleanAsBoolean", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mapJsonbAsClob = software.amazon.jsii.Kernel.get(this, "mapJsonbAsClob", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mapLongVarcharAs = software.amazon.jsii.Kernel.get(this, "mapLongVarcharAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxFileSize = software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pluginName = software.amazon.jsii.Kernel.get(this, "pluginName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotName = software.amazon.jsii.Kernel.get(this, "slotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.afterConnectScript = builder.afterConnectScript;
            this.babelfishDatabaseName = builder.babelfishDatabaseName;
            this.captureDdls = builder.captureDdls;
            this.databaseMode = builder.databaseMode;
            this.ddlArtifactsSchema = builder.ddlArtifactsSchema;
            this.executeTimeout = builder.executeTimeout;
            this.failTasksOnLobTruncation = builder.failTasksOnLobTruncation;
            this.heartbeatEnable = builder.heartbeatEnable;
            this.heartbeatFrequency = builder.heartbeatFrequency;
            this.heartbeatSchema = builder.heartbeatSchema;
            this.mapBooleanAsBoolean = builder.mapBooleanAsBoolean;
            this.mapJsonbAsClob = builder.mapJsonbAsClob;
            this.mapLongVarcharAs = builder.mapLongVarcharAs;
            this.maxFileSize = builder.maxFileSize;
            this.pluginName = builder.pluginName;
            this.slotName = builder.slotName;
        }

        @Override
        public final java.lang.String getAfterConnectScript() {
            return this.afterConnectScript;
        }

        @Override
        public final java.lang.String getBabelfishDatabaseName() {
            return this.babelfishDatabaseName;
        }

        @Override
        public final java.lang.Object getCaptureDdls() {
            return this.captureDdls;
        }

        @Override
        public final java.lang.String getDatabaseMode() {
            return this.databaseMode;
        }

        @Override
        public final java.lang.String getDdlArtifactsSchema() {
            return this.ddlArtifactsSchema;
        }

        @Override
        public final java.lang.Number getExecuteTimeout() {
            return this.executeTimeout;
        }

        @Override
        public final java.lang.Object getFailTasksOnLobTruncation() {
            return this.failTasksOnLobTruncation;
        }

        @Override
        public final java.lang.Object getHeartbeatEnable() {
            return this.heartbeatEnable;
        }

        @Override
        public final java.lang.Number getHeartbeatFrequency() {
            return this.heartbeatFrequency;
        }

        @Override
        public final java.lang.String getHeartbeatSchema() {
            return this.heartbeatSchema;
        }

        @Override
        public final java.lang.Object getMapBooleanAsBoolean() {
            return this.mapBooleanAsBoolean;
        }

        @Override
        public final java.lang.Object getMapJsonbAsClob() {
            return this.mapJsonbAsClob;
        }

        @Override
        public final java.lang.String getMapLongVarcharAs() {
            return this.mapLongVarcharAs;
        }

        @Override
        public final java.lang.Number getMaxFileSize() {
            return this.maxFileSize;
        }

        @Override
        public final java.lang.String getPluginName() {
            return this.pluginName;
        }

        @Override
        public final java.lang.String getSlotName() {
            return this.slotName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAfterConnectScript() != null) {
                data.set("afterConnectScript", om.valueToTree(this.getAfterConnectScript()));
            }
            if (this.getBabelfishDatabaseName() != null) {
                data.set("babelfishDatabaseName", om.valueToTree(this.getBabelfishDatabaseName()));
            }
            if (this.getCaptureDdls() != null) {
                data.set("captureDdls", om.valueToTree(this.getCaptureDdls()));
            }
            if (this.getDatabaseMode() != null) {
                data.set("databaseMode", om.valueToTree(this.getDatabaseMode()));
            }
            if (this.getDdlArtifactsSchema() != null) {
                data.set("ddlArtifactsSchema", om.valueToTree(this.getDdlArtifactsSchema()));
            }
            if (this.getExecuteTimeout() != null) {
                data.set("executeTimeout", om.valueToTree(this.getExecuteTimeout()));
            }
            if (this.getFailTasksOnLobTruncation() != null) {
                data.set("failTasksOnLobTruncation", om.valueToTree(this.getFailTasksOnLobTruncation()));
            }
            if (this.getHeartbeatEnable() != null) {
                data.set("heartbeatEnable", om.valueToTree(this.getHeartbeatEnable()));
            }
            if (this.getHeartbeatFrequency() != null) {
                data.set("heartbeatFrequency", om.valueToTree(this.getHeartbeatFrequency()));
            }
            if (this.getHeartbeatSchema() != null) {
                data.set("heartbeatSchema", om.valueToTree(this.getHeartbeatSchema()));
            }
            if (this.getMapBooleanAsBoolean() != null) {
                data.set("mapBooleanAsBoolean", om.valueToTree(this.getMapBooleanAsBoolean()));
            }
            if (this.getMapJsonbAsClob() != null) {
                data.set("mapJsonbAsClob", om.valueToTree(this.getMapJsonbAsClob()));
            }
            if (this.getMapLongVarcharAs() != null) {
                data.set("mapLongVarcharAs", om.valueToTree(this.getMapLongVarcharAs()));
            }
            if (this.getMaxFileSize() != null) {
                data.set("maxFileSize", om.valueToTree(this.getMaxFileSize()));
            }
            if (this.getPluginName() != null) {
                data.set("pluginName", om.valueToTree(this.getPluginName()));
            }
            if (this.getSlotName() != null) {
                data.set("slotName", om.valueToTree(this.getSlotName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointPostgresSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointPostgresSettings.Jsii$Proxy that = (DmsEndpointPostgresSettings.Jsii$Proxy) o;

            if (this.afterConnectScript != null ? !this.afterConnectScript.equals(that.afterConnectScript) : that.afterConnectScript != null) return false;
            if (this.babelfishDatabaseName != null ? !this.babelfishDatabaseName.equals(that.babelfishDatabaseName) : that.babelfishDatabaseName != null) return false;
            if (this.captureDdls != null ? !this.captureDdls.equals(that.captureDdls) : that.captureDdls != null) return false;
            if (this.databaseMode != null ? !this.databaseMode.equals(that.databaseMode) : that.databaseMode != null) return false;
            if (this.ddlArtifactsSchema != null ? !this.ddlArtifactsSchema.equals(that.ddlArtifactsSchema) : that.ddlArtifactsSchema != null) return false;
            if (this.executeTimeout != null ? !this.executeTimeout.equals(that.executeTimeout) : that.executeTimeout != null) return false;
            if (this.failTasksOnLobTruncation != null ? !this.failTasksOnLobTruncation.equals(that.failTasksOnLobTruncation) : that.failTasksOnLobTruncation != null) return false;
            if (this.heartbeatEnable != null ? !this.heartbeatEnable.equals(that.heartbeatEnable) : that.heartbeatEnable != null) return false;
            if (this.heartbeatFrequency != null ? !this.heartbeatFrequency.equals(that.heartbeatFrequency) : that.heartbeatFrequency != null) return false;
            if (this.heartbeatSchema != null ? !this.heartbeatSchema.equals(that.heartbeatSchema) : that.heartbeatSchema != null) return false;
            if (this.mapBooleanAsBoolean != null ? !this.mapBooleanAsBoolean.equals(that.mapBooleanAsBoolean) : that.mapBooleanAsBoolean != null) return false;
            if (this.mapJsonbAsClob != null ? !this.mapJsonbAsClob.equals(that.mapJsonbAsClob) : that.mapJsonbAsClob != null) return false;
            if (this.mapLongVarcharAs != null ? !this.mapLongVarcharAs.equals(that.mapLongVarcharAs) : that.mapLongVarcharAs != null) return false;
            if (this.maxFileSize != null ? !this.maxFileSize.equals(that.maxFileSize) : that.maxFileSize != null) return false;
            if (this.pluginName != null ? !this.pluginName.equals(that.pluginName) : that.pluginName != null) return false;
            return this.slotName != null ? this.slotName.equals(that.slotName) : that.slotName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.afterConnectScript != null ? this.afterConnectScript.hashCode() : 0;
            result = 31 * result + (this.babelfishDatabaseName != null ? this.babelfishDatabaseName.hashCode() : 0);
            result = 31 * result + (this.captureDdls != null ? this.captureDdls.hashCode() : 0);
            result = 31 * result + (this.databaseMode != null ? this.databaseMode.hashCode() : 0);
            result = 31 * result + (this.ddlArtifactsSchema != null ? this.ddlArtifactsSchema.hashCode() : 0);
            result = 31 * result + (this.executeTimeout != null ? this.executeTimeout.hashCode() : 0);
            result = 31 * result + (this.failTasksOnLobTruncation != null ? this.failTasksOnLobTruncation.hashCode() : 0);
            result = 31 * result + (this.heartbeatEnable != null ? this.heartbeatEnable.hashCode() : 0);
            result = 31 * result + (this.heartbeatFrequency != null ? this.heartbeatFrequency.hashCode() : 0);
            result = 31 * result + (this.heartbeatSchema != null ? this.heartbeatSchema.hashCode() : 0);
            result = 31 * result + (this.mapBooleanAsBoolean != null ? this.mapBooleanAsBoolean.hashCode() : 0);
            result = 31 * result + (this.mapJsonbAsClob != null ? this.mapJsonbAsClob.hashCode() : 0);
            result = 31 * result + (this.mapLongVarcharAs != null ? this.mapLongVarcharAs.hashCode() : 0);
            result = 31 * result + (this.maxFileSize != null ? this.maxFileSize.hashCode() : 0);
            result = 31 * result + (this.pluginName != null ? this.pluginName.hashCode() : 0);
            result = 31 * result + (this.slotName != null ? this.slotName.hashCode() : 0);
            return result;
        }
    }
}
