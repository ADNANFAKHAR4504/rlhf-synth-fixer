package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake")
@software.amazon.jsii.Jsii.Proxy(AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake.Jsii$Proxy.class)
public interface AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_name AppflowConnectorProfile#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#stage AppflowConnectorProfile#stage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#warehouse AppflowConnectorProfile#warehouse}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWarehouse();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#account_name AppflowConnectorProfile#account_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_prefix AppflowConnectorProfile#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#private_link_service_name AppflowConnectorProfile#private_link_service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateLinkServiceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#region AppflowConnectorProfile#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake> {
        java.lang.String bucketName;
        java.lang.String stage;
        java.lang.String warehouse;
        java.lang.String accountName;
        java.lang.String bucketPrefix;
        java.lang.String privateLinkServiceName;
        java.lang.String region;

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_name AppflowConnectorProfile#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getStage}
         * @param stage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#stage AppflowConnectorProfile#stage}. This parameter is required.
         * @return {@code this}
         */
        public Builder stage(java.lang.String stage) {
            this.stage = stage;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getWarehouse}
         * @param warehouse Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#warehouse AppflowConnectorProfile#warehouse}. This parameter is required.
         * @return {@code this}
         */
        public Builder warehouse(java.lang.String warehouse) {
            this.warehouse = warehouse;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getAccountName}
         * @param accountName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#account_name AppflowConnectorProfile#account_name}.
         * @return {@code this}
         */
        public Builder accountName(java.lang.String accountName) {
            this.accountName = accountName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#bucket_prefix AppflowConnectorProfile#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getPrivateLinkServiceName}
         * @param privateLinkServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#private_link_service_name AppflowConnectorProfile#private_link_service_name}.
         * @return {@code this}
         */
        public Builder privateLinkServiceName(java.lang.String privateLinkServiceName) {
            this.privateLinkServiceName = privateLinkServiceName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_connector_profile#region AppflowConnectorProfile#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake {
        private final java.lang.String bucketName;
        private final java.lang.String stage;
        private final java.lang.String warehouse;
        private final java.lang.String accountName;
        private final java.lang.String bucketPrefix;
        private final java.lang.String privateLinkServiceName;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stage = software.amazon.jsii.Kernel.get(this, "stage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.warehouse = software.amazon.jsii.Kernel.get(this, "warehouse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountName = software.amazon.jsii.Kernel.get(this, "accountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateLinkServiceName = software.amazon.jsii.Kernel.get(this, "privateLinkServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.stage = java.util.Objects.requireNonNull(builder.stage, "stage is required");
            this.warehouse = java.util.Objects.requireNonNull(builder.warehouse, "warehouse is required");
            this.accountName = builder.accountName;
            this.bucketPrefix = builder.bucketPrefix;
            this.privateLinkServiceName = builder.privateLinkServiceName;
            this.region = builder.region;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getStage() {
            return this.stage;
        }

        @Override
        public final java.lang.String getWarehouse() {
            return this.warehouse;
        }

        @Override
        public final java.lang.String getAccountName() {
            return this.accountName;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final java.lang.String getPrivateLinkServiceName() {
            return this.privateLinkServiceName;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("stage", om.valueToTree(this.getStage()));
            data.set("warehouse", om.valueToTree(this.getWarehouse()));
            if (this.getAccountName() != null) {
                data.set("accountName", om.valueToTree(this.getAccountName()));
            }
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getPrivateLinkServiceName() != null) {
                data.set("privateLinkServiceName", om.valueToTree(this.getPrivateLinkServiceName()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake.Jsii$Proxy that = (AppflowConnectorProfileConnectorProfileConfigConnectorProfilePropertiesSnowflake.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!stage.equals(that.stage)) return false;
            if (!warehouse.equals(that.warehouse)) return false;
            if (this.accountName != null ? !this.accountName.equals(that.accountName) : that.accountName != null) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            if (this.privateLinkServiceName != null ? !this.privateLinkServiceName.equals(that.privateLinkServiceName) : that.privateLinkServiceName != null) return false;
            return this.region != null ? this.region.equals(that.region) : that.region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.stage.hashCode());
            result = 31 * result + (this.warehouse.hashCode());
            result = 31 * result + (this.accountName != null ? this.accountName.hashCode() : 0);
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.privateLinkServiceName != null ? this.privateLinkServiceName.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            return result;
        }
    }
}
