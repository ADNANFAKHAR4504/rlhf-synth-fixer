package imports.aws.redshiftdata_statement;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.173Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftdataStatement.RedshiftdataStatementConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftdataStatementConfig.Jsii$Proxy.class)
public interface RedshiftdataStatementConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#database RedshiftdataStatement#database}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabase();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#sql RedshiftdataStatement#sql}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSql();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#cluster_identifier RedshiftdataStatement#cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#db_user RedshiftdataStatement#db_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbUser() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#id RedshiftdataStatement#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#parameters RedshiftdataStatement#parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#secret_arn RedshiftdataStatement#secret_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#statement_name RedshiftdataStatement#statement_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatementName() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#timeouts RedshiftdataStatement#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#with_event RedshiftdataStatement#with_event}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWithEvent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#workgroup_name RedshiftdataStatement#workgroup_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkgroupName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftdataStatementConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftdataStatementConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftdataStatementConfig> {
        java.lang.String database;
        java.lang.String sql;
        java.lang.String clusterIdentifier;
        java.lang.String dbUser;
        java.lang.String id;
        java.lang.Object parameters;
        java.lang.String secretArn;
        java.lang.String statementName;
        imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts timeouts;
        java.lang.Object withEvent;
        java.lang.String workgroupName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#database RedshiftdataStatement#database}. This parameter is required.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getSql}
         * @param sql Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#sql RedshiftdataStatement#sql}. This parameter is required.
         * @return {@code this}
         */
        public Builder sql(java.lang.String sql) {
            this.sql = sql;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#cluster_identifier RedshiftdataStatement#cluster_identifier}.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getDbUser}
         * @param dbUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#db_user RedshiftdataStatement#db_user}.
         * @return {@code this}
         */
        public Builder dbUser(java.lang.String dbUser) {
            this.dbUser = dbUser;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#id RedshiftdataStatement#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#parameters RedshiftdataStatement#parameters}
         * @return {@code this}
         */
        public Builder parameters(com.hashicorp.cdktf.IResolvable parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#parameters RedshiftdataStatement#parameters}
         * @return {@code this}
         */
        public Builder parameters(java.util.List<? extends imports.aws.redshiftdata_statement.RedshiftdataStatementParameters> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getSecretArn}
         * @param secretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#secret_arn RedshiftdataStatement#secret_arn}.
         * @return {@code this}
         */
        public Builder secretArn(java.lang.String secretArn) {
            this.secretArn = secretArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getStatementName}
         * @param statementName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#statement_name RedshiftdataStatement#statement_name}.
         * @return {@code this}
         */
        public Builder statementName(java.lang.String statementName) {
            this.statementName = statementName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#timeouts RedshiftdataStatement#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#with_event RedshiftdataStatement#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(java.lang.Boolean withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getWithEvent}
         * @param withEvent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#with_event RedshiftdataStatement#with_event}.
         * @return {@code this}
         */
        public Builder withEvent(com.hashicorp.cdktf.IResolvable withEvent) {
            this.withEvent = withEvent;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getWorkgroupName}
         * @param workgroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftdata_statement#workgroup_name RedshiftdataStatement#workgroup_name}.
         * @return {@code this}
         */
        public Builder workgroupName(java.lang.String workgroupName) {
            this.workgroupName = workgroupName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftdataStatementConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftdataStatementConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftdataStatementConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftdataStatementConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftdataStatementConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftdataStatementConfig {
        private final java.lang.String database;
        private final java.lang.String sql;
        private final java.lang.String clusterIdentifier;
        private final java.lang.String dbUser;
        private final java.lang.String id;
        private final java.lang.Object parameters;
        private final java.lang.String secretArn;
        private final java.lang.String statementName;
        private final imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts timeouts;
        private final java.lang.Object withEvent;
        private final java.lang.String workgroupName;
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
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sql = software.amazon.jsii.Kernel.get(this, "sql", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbUser = software.amazon.jsii.Kernel.get(this, "dbUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.secretArn = software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statementName = software.amazon.jsii.Kernel.get(this, "statementName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts.class));
            this.withEvent = software.amazon.jsii.Kernel.get(this, "withEvent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.workgroupName = software.amazon.jsii.Kernel.get(this, "workgroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.database = java.util.Objects.requireNonNull(builder.database, "database is required");
            this.sql = java.util.Objects.requireNonNull(builder.sql, "sql is required");
            this.clusterIdentifier = builder.clusterIdentifier;
            this.dbUser = builder.dbUser;
            this.id = builder.id;
            this.parameters = builder.parameters;
            this.secretArn = builder.secretArn;
            this.statementName = builder.statementName;
            this.timeouts = builder.timeouts;
            this.withEvent = builder.withEvent;
            this.workgroupName = builder.workgroupName;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.String getSql() {
            return this.sql;
        }

        @Override
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getDbUser() {
            return this.dbUser;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getSecretArn() {
            return this.secretArn;
        }

        @Override
        public final java.lang.String getStatementName() {
            return this.statementName;
        }

        @Override
        public final imports.aws.redshiftdata_statement.RedshiftdataStatementTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getWithEvent() {
            return this.withEvent;
        }

        @Override
        public final java.lang.String getWorkgroupName() {
            return this.workgroupName;
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

            data.set("database", om.valueToTree(this.getDatabase()));
            data.set("sql", om.valueToTree(this.getSql()));
            if (this.getClusterIdentifier() != null) {
                data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            }
            if (this.getDbUser() != null) {
                data.set("dbUser", om.valueToTree(this.getDbUser()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getSecretArn() != null) {
                data.set("secretArn", om.valueToTree(this.getSecretArn()));
            }
            if (this.getStatementName() != null) {
                data.set("statementName", om.valueToTree(this.getStatementName()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getWithEvent() != null) {
                data.set("withEvent", om.valueToTree(this.getWithEvent()));
            }
            if (this.getWorkgroupName() != null) {
                data.set("workgroupName", om.valueToTree(this.getWorkgroupName()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftdataStatement.RedshiftdataStatementConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftdataStatementConfig.Jsii$Proxy that = (RedshiftdataStatementConfig.Jsii$Proxy) o;

            if (!database.equals(that.database)) return false;
            if (!sql.equals(that.sql)) return false;
            if (this.clusterIdentifier != null ? !this.clusterIdentifier.equals(that.clusterIdentifier) : that.clusterIdentifier != null) return false;
            if (this.dbUser != null ? !this.dbUser.equals(that.dbUser) : that.dbUser != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.secretArn != null ? !this.secretArn.equals(that.secretArn) : that.secretArn != null) return false;
            if (this.statementName != null ? !this.statementName.equals(that.statementName) : that.statementName != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.withEvent != null ? !this.withEvent.equals(that.withEvent) : that.withEvent != null) return false;
            if (this.workgroupName != null ? !this.workgroupName.equals(that.workgroupName) : that.workgroupName != null) return false;
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
            int result = this.database.hashCode();
            result = 31 * result + (this.sql.hashCode());
            result = 31 * result + (this.clusterIdentifier != null ? this.clusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.dbUser != null ? this.dbUser.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.secretArn != null ? this.secretArn.hashCode() : 0);
            result = 31 * result + (this.statementName != null ? this.statementName.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.withEvent != null ? this.withEvent.hashCode() : 0);
            result = 31 * result + (this.workgroupName != null ? this.workgroupName.hashCode() : 0);
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
