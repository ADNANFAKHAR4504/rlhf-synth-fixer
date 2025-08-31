package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#aws_secret_store_arn AppsyncDatasource#aws_secret_store_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAwsSecretStoreArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#db_cluster_identifier AppsyncDatasource#db_cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDbClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#database_name AppsyncDatasource#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#schema AppsyncDatasource#schema}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchema() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig> {
        java.lang.String awsSecretStoreArn;
        java.lang.String dbClusterIdentifier;
        java.lang.String databaseName;
        java.lang.String region;
        java.lang.String schema;

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig#getAwsSecretStoreArn}
         * @param awsSecretStoreArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#aws_secret_store_arn AppsyncDatasource#aws_secret_store_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder awsSecretStoreArn(java.lang.String awsSecretStoreArn) {
            this.awsSecretStoreArn = awsSecretStoreArn;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig#getDbClusterIdentifier}
         * @param dbClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#db_cluster_identifier AppsyncDatasource#db_cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder dbClusterIdentifier(java.lang.String dbClusterIdentifier) {
            this.dbClusterIdentifier = dbClusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#database_name AppsyncDatasource#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig#getSchema}
         * @param schema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#schema AppsyncDatasource#schema}.
         * @return {@code this}
         */
        public Builder schema(java.lang.String schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig {
        private final java.lang.String awsSecretStoreArn;
        private final java.lang.String dbClusterIdentifier;
        private final java.lang.String databaseName;
        private final java.lang.String region;
        private final java.lang.String schema;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsSecretStoreArn = software.amazon.jsii.Kernel.get(this, "awsSecretStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbClusterIdentifier = software.amazon.jsii.Kernel.get(this, "dbClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsSecretStoreArn = java.util.Objects.requireNonNull(builder.awsSecretStoreArn, "awsSecretStoreArn is required");
            this.dbClusterIdentifier = java.util.Objects.requireNonNull(builder.dbClusterIdentifier, "dbClusterIdentifier is required");
            this.databaseName = builder.databaseName;
            this.region = builder.region;
            this.schema = builder.schema;
        }

        @Override
        public final java.lang.String getAwsSecretStoreArn() {
            return this.awsSecretStoreArn;
        }

        @Override
        public final java.lang.String getDbClusterIdentifier() {
            return this.dbClusterIdentifier;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getSchema() {
            return this.schema;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("awsSecretStoreArn", om.valueToTree(this.getAwsSecretStoreArn()));
            data.set("dbClusterIdentifier", om.valueToTree(this.getDbClusterIdentifier()));
            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getSchema() != null) {
                data.set("schema", om.valueToTree(this.getSchema()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig.Jsii$Proxy that = (AppsyncDatasourceRelationalDatabaseConfigHttpEndpointConfig.Jsii$Proxy) o;

            if (!awsSecretStoreArn.equals(that.awsSecretStoreArn)) return false;
            if (!dbClusterIdentifier.equals(that.dbClusterIdentifier)) return false;
            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            return this.schema != null ? this.schema.equals(that.schema) : that.schema == null;
        }

        @Override
        public final int hashCode() {
            int result = this.awsSecretStoreArn.hashCode();
            result = 31 * result + (this.dbClusterIdentifier.hashCode());
            result = 31 * result + (this.databaseName != null ? this.databaseName.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.schema != null ? this.schema.hashCode() : 0);
            return result;
        }
    }
}
