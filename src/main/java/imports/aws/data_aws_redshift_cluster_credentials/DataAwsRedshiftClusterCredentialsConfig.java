package imports.aws.data_aws_redshift_cluster_credentials;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.822Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRedshiftClusterCredentials.DataAwsRedshiftClusterCredentialsConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRedshiftClusterCredentialsConfig.Jsii$Proxy.class)
public interface DataAwsRedshiftClusterCredentialsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#cluster_identifier DataAwsRedshiftClusterCredentials#cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_user DataAwsRedshiftClusterCredentials#db_user}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDbUser();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#auto_create DataAwsRedshiftClusterCredentials#auto_create}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoCreate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_groups DataAwsRedshiftClusterCredentials#db_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDbGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_name DataAwsRedshiftClusterCredentials#db_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#duration_seconds DataAwsRedshiftClusterCredentials#duration_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDurationSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#id DataAwsRedshiftClusterCredentials#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRedshiftClusterCredentialsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRedshiftClusterCredentialsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRedshiftClusterCredentialsConfig> {
        java.lang.String clusterIdentifier;
        java.lang.String dbUser;
        java.lang.Object autoCreate;
        java.util.List<java.lang.String> dbGroups;
        java.lang.String dbName;
        java.lang.Number durationSeconds;
        java.lang.String id;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#cluster_identifier DataAwsRedshiftClusterCredentials#cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getDbUser}
         * @param dbUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_user DataAwsRedshiftClusterCredentials#db_user}. This parameter is required.
         * @return {@code this}
         */
        public Builder dbUser(java.lang.String dbUser) {
            this.dbUser = dbUser;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getAutoCreate}
         * @param autoCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#auto_create DataAwsRedshiftClusterCredentials#auto_create}.
         * @return {@code this}
         */
        public Builder autoCreate(java.lang.Boolean autoCreate) {
            this.autoCreate = autoCreate;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getAutoCreate}
         * @param autoCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#auto_create DataAwsRedshiftClusterCredentials#auto_create}.
         * @return {@code this}
         */
        public Builder autoCreate(com.hashicorp.cdktf.IResolvable autoCreate) {
            this.autoCreate = autoCreate;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getDbGroups}
         * @param dbGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_groups DataAwsRedshiftClusterCredentials#db_groups}.
         * @return {@code this}
         */
        public Builder dbGroups(java.util.List<java.lang.String> dbGroups) {
            this.dbGroups = dbGroups;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getDbName}
         * @param dbName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#db_name DataAwsRedshiftClusterCredentials#db_name}.
         * @return {@code this}
         */
        public Builder dbName(java.lang.String dbName) {
            this.dbName = dbName;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getDurationSeconds}
         * @param durationSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#duration_seconds DataAwsRedshiftClusterCredentials#duration_seconds}.
         * @return {@code this}
         */
        public Builder durationSeconds(java.lang.Number durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/redshift_cluster_credentials#id DataAwsRedshiftClusterCredentials#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRedshiftClusterCredentialsConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRedshiftClusterCredentialsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRedshiftClusterCredentialsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRedshiftClusterCredentialsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRedshiftClusterCredentialsConfig {
        private final java.lang.String clusterIdentifier;
        private final java.lang.String dbUser;
        private final java.lang.Object autoCreate;
        private final java.util.List<java.lang.String> dbGroups;
        private final java.lang.String dbName;
        private final java.lang.Number durationSeconds;
        private final java.lang.String id;
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
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbUser = software.amazon.jsii.Kernel.get(this, "dbUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoCreate = software.amazon.jsii.Kernel.get(this, "autoCreate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dbGroups = software.amazon.jsii.Kernel.get(this, "dbGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.dbName = software.amazon.jsii.Kernel.get(this, "dbName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.durationSeconds = software.amazon.jsii.Kernel.get(this, "durationSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.clusterIdentifier = java.util.Objects.requireNonNull(builder.clusterIdentifier, "clusterIdentifier is required");
            this.dbUser = java.util.Objects.requireNonNull(builder.dbUser, "dbUser is required");
            this.autoCreate = builder.autoCreate;
            this.dbGroups = builder.dbGroups;
            this.dbName = builder.dbName;
            this.durationSeconds = builder.durationSeconds;
            this.id = builder.id;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
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
        public final java.lang.Object getAutoCreate() {
            return this.autoCreate;
        }

        @Override
        public final java.util.List<java.lang.String> getDbGroups() {
            return this.dbGroups;
        }

        @Override
        public final java.lang.String getDbName() {
            return this.dbName;
        }

        @Override
        public final java.lang.Number getDurationSeconds() {
            return this.durationSeconds;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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

            data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            data.set("dbUser", om.valueToTree(this.getDbUser()));
            if (this.getAutoCreate() != null) {
                data.set("autoCreate", om.valueToTree(this.getAutoCreate()));
            }
            if (this.getDbGroups() != null) {
                data.set("dbGroups", om.valueToTree(this.getDbGroups()));
            }
            if (this.getDbName() != null) {
                data.set("dbName", om.valueToTree(this.getDbName()));
            }
            if (this.getDurationSeconds() != null) {
                data.set("durationSeconds", om.valueToTree(this.getDurationSeconds()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRedshiftClusterCredentials.DataAwsRedshiftClusterCredentialsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRedshiftClusterCredentialsConfig.Jsii$Proxy that = (DataAwsRedshiftClusterCredentialsConfig.Jsii$Proxy) o;

            if (!clusterIdentifier.equals(that.clusterIdentifier)) return false;
            if (!dbUser.equals(that.dbUser)) return false;
            if (this.autoCreate != null ? !this.autoCreate.equals(that.autoCreate) : that.autoCreate != null) return false;
            if (this.dbGroups != null ? !this.dbGroups.equals(that.dbGroups) : that.dbGroups != null) return false;
            if (this.dbName != null ? !this.dbName.equals(that.dbName) : that.dbName != null) return false;
            if (this.durationSeconds != null ? !this.durationSeconds.equals(that.durationSeconds) : that.durationSeconds != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.clusterIdentifier.hashCode();
            result = 31 * result + (this.dbUser.hashCode());
            result = 31 * result + (this.autoCreate != null ? this.autoCreate.hashCode() : 0);
            result = 31 * result + (this.dbGroups != null ? this.dbGroups.hashCode() : 0);
            result = 31 * result + (this.dbName != null ? this.dbName.hashCode() : 0);
            result = 31 * result + (this.durationSeconds != null ? this.durationSeconds.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
