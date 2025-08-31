package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceDynamodbConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceDynamodbConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceDynamodbConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#table_name AppsyncDatasource#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * delta_sync_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_config AppsyncDatasource#delta_sync_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig getDeltaSyncConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#use_caller_credentials AppsyncDatasource#use_caller_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseCallerCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#versioned AppsyncDatasource#versioned}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVersioned() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceDynamodbConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceDynamodbConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceDynamodbConfig> {
        java.lang.String tableName;
        imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig deltaSyncConfig;
        java.lang.String region;
        java.lang.Object useCallerCredentials;
        java.lang.Object versioned;

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#table_name AppsyncDatasource#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getDeltaSyncConfig}
         * @param deltaSyncConfig delta_sync_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_config AppsyncDatasource#delta_sync_config}
         * @return {@code this}
         */
        public Builder deltaSyncConfig(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig deltaSyncConfig) {
            this.deltaSyncConfig = deltaSyncConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#region AppsyncDatasource#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getUseCallerCredentials}
         * @param useCallerCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#use_caller_credentials AppsyncDatasource#use_caller_credentials}.
         * @return {@code this}
         */
        public Builder useCallerCredentials(java.lang.Boolean useCallerCredentials) {
            this.useCallerCredentials = useCallerCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getUseCallerCredentials}
         * @param useCallerCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#use_caller_credentials AppsyncDatasource#use_caller_credentials}.
         * @return {@code this}
         */
        public Builder useCallerCredentials(com.hashicorp.cdktf.IResolvable useCallerCredentials) {
            this.useCallerCredentials = useCallerCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getVersioned}
         * @param versioned Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#versioned AppsyncDatasource#versioned}.
         * @return {@code this}
         */
        public Builder versioned(java.lang.Boolean versioned) {
            this.versioned = versioned;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfig#getVersioned}
         * @param versioned Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#versioned AppsyncDatasource#versioned}.
         * @return {@code this}
         */
        public Builder versioned(com.hashicorp.cdktf.IResolvable versioned) {
            this.versioned = versioned;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceDynamodbConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceDynamodbConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceDynamodbConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceDynamodbConfig {
        private final java.lang.String tableName;
        private final imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig deltaSyncConfig;
        private final java.lang.String region;
        private final java.lang.Object useCallerCredentials;
        private final java.lang.Object versioned;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deltaSyncConfig = software.amazon.jsii.Kernel.get(this, "deltaSyncConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useCallerCredentials = software.amazon.jsii.Kernel.get(this, "useCallerCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.versioned = software.amazon.jsii.Kernel.get(this, "versioned", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.deltaSyncConfig = builder.deltaSyncConfig;
            this.region = builder.region;
            this.useCallerCredentials = builder.useCallerCredentials;
            this.versioned = builder.versioned;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig getDeltaSyncConfig() {
            return this.deltaSyncConfig;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.Object getUseCallerCredentials() {
            return this.useCallerCredentials;
        }

        @Override
        public final java.lang.Object getVersioned() {
            return this.versioned;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getDeltaSyncConfig() != null) {
                data.set("deltaSyncConfig", om.valueToTree(this.getDeltaSyncConfig()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getUseCallerCredentials() != null) {
                data.set("useCallerCredentials", om.valueToTree(this.getUseCallerCredentials()));
            }
            if (this.getVersioned() != null) {
                data.set("versioned", om.valueToTree(this.getVersioned()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceDynamodbConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceDynamodbConfig.Jsii$Proxy that = (AppsyncDatasourceDynamodbConfig.Jsii$Proxy) o;

            if (!tableName.equals(that.tableName)) return false;
            if (this.deltaSyncConfig != null ? !this.deltaSyncConfig.equals(that.deltaSyncConfig) : that.deltaSyncConfig != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.useCallerCredentials != null ? !this.useCallerCredentials.equals(that.useCallerCredentials) : that.useCallerCredentials != null) return false;
            return this.versioned != null ? this.versioned.equals(that.versioned) : that.versioned == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tableName.hashCode();
            result = 31 * result + (this.deltaSyncConfig != null ? this.deltaSyncConfig.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.useCallerCredentials != null ? this.useCallerCredentials.hashCode() : 0);
            result = 31 * result + (this.versioned != null ? this.versioned.hashCode() : 0);
            return result;
        }
    }
}
