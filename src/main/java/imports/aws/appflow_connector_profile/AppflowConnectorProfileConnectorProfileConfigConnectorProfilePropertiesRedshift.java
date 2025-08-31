package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_name AppflowConnectorProfile#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#role_arn AppflowConnectorProfile#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_prefix AppflowConnectorProfile#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#cluster_identifier AppflowConnectorProfile#cluster_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#data_api_role_arn AppflowConnectorProfile#data_api_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataApiRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#database_name AppflowConnectorProfile#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#database_url AppflowConnectorProfile#database_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift> {
        java.lang.String bucketName;
        java.lang.String roleArn;
        java.lang.String bucketPrefix;
        java.lang.String clusterIdentifier;
        java.lang.String dataApiRoleArn;
        java.lang.String databaseName;
        java.lang.String databaseUrl;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_name AppflowConnectorProfile#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#role_arn AppflowConnectorProfile#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_prefix AppflowConnectorProfile#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#cluster_identifier AppflowConnectorProfile#cluster_identifier}.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getDataApiRoleArn}
         * @param dataApiRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#data_api_role_arn AppflowConnectorProfile#data_api_role_arn}.
         * @return {@code this}
         */
        public Builder dataApiRoleArn(java.lang.String dataApiRoleArn) {
            this.dataApiRoleArn = dataApiRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#database_name AppflowConnectorProfile#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift#getDatabaseUrl}
         * @param databaseUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#database_url AppflowConnectorProfile#database_url}.
         * @return {@code this}
         */
        public Builder databaseUrl(java.lang.String databaseUrl) {
            this.databaseUrl = databaseUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift {
        private final java.lang.String bucketName;
        private final java.lang.String roleArn;
        private final java.lang.String bucketPrefix;
        private final java.lang.String clusterIdentifier;
        private final java.lang.String dataApiRoleArn;
        private final java.lang.String databaseName;
        private final java.lang.String databaseUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataApiRoleArn = software.amazon.jsii.Kernel.get(this, "dataApiRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseUrl = software.amazon.jsii.Kernel.get(this, "databaseUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.bucketPrefix = builder.bucketPrefix;
            this.clusterIdentifier = builder.clusterIdentifier;
            this.dataApiRoleArn = builder.dataApiRoleArn;
            this.databaseName = builder.databaseName;
            this.databaseUrl = builder.databaseUrl;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.String getDataApiRoleArn() {
            return this.dataApiRoleArn;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getDatabaseUrl() {
            return this.databaseUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getClusterIdentifier() != null) {
                data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            }
            if (this.getDataApiRoleArn() != null) {
                data.set("dataApiRoleArn", om.valueToTree(this.getDataApiRoleArn()));
            }
            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getDatabaseUrl() != null) {
                data.set("databaseUrl", om.valueToTree(this.getDatabaseUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesRedshift.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            if (this.clusterIdentifier != null ? !this.clusterIdentifier.equals(that.clusterIdentifier) : that.clusterIdentifier != null) return false;
            if (this.dataApiRoleArn != null ? !this.dataApiRoleArn.equals(that.dataApiRoleArn) : that.dataApiRoleArn != null) return false;
            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            return this.databaseUrl != null ? this.databaseUrl.equals(that.databaseUrl) : that.databaseUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.clusterIdentifier != null ? this.clusterIdentifier.hashCode() : 0);
            result = 31 * result + (this.dataApiRoleArn != null ? this.dataApiRoleArn.hashCode() : 0);
            result = 31 * result + (this.databaseName != null ? this.databaseName.hashCode() : 0);
            result = 31 * result + (this.databaseUrl != null ? this.databaseUrl.hashCode() : 0);
            return result;
        }
    }
}
