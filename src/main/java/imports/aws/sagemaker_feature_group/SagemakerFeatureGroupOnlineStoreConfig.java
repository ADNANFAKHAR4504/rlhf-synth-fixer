package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOnlineStoreConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupOnlineStoreConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupOnlineStoreConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#enable_online_store SagemakerFeatureGroup#enable_online_store}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableOnlineStore() {
        return null;
    }

    /**
     * security_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#security_config SagemakerFeatureGroup#security_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig getSecurityConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#storage_type SagemakerFeatureGroup#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * ttl_duration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#ttl_duration SagemakerFeatureGroup#ttl_duration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration getTtlDuration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupOnlineStoreConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupOnlineStoreConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupOnlineStoreConfig> {
        java.lang.Object enableOnlineStore;
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig securityConfig;
        java.lang.String storageType;
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration ttlDuration;

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfig#getEnableOnlineStore}
         * @param enableOnlineStore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#enable_online_store SagemakerFeatureGroup#enable_online_store}.
         * @return {@code this}
         */
        public Builder enableOnlineStore(java.lang.Boolean enableOnlineStore) {
            this.enableOnlineStore = enableOnlineStore;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfig#getEnableOnlineStore}
         * @param enableOnlineStore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#enable_online_store SagemakerFeatureGroup#enable_online_store}.
         * @return {@code this}
         */
        public Builder enableOnlineStore(com.hashicorp.cdktf.IResolvable enableOnlineStore) {
            this.enableOnlineStore = enableOnlineStore;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfig#getSecurityConfig}
         * @param securityConfig security_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#security_config SagemakerFeatureGroup#security_config}
         * @return {@code this}
         */
        public Builder securityConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig securityConfig) {
            this.securityConfig = securityConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#storage_type SagemakerFeatureGroup#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfig#getTtlDuration}
         * @param ttlDuration ttl_duration block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#ttl_duration SagemakerFeatureGroup#ttl_duration}
         * @return {@code this}
         */
        public Builder ttlDuration(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration ttlDuration) {
            this.ttlDuration = ttlDuration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupOnlineStoreConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupOnlineStoreConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupOnlineStoreConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupOnlineStoreConfig {
        private final java.lang.Object enableOnlineStore;
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig securityConfig;
        private final java.lang.String storageType;
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration ttlDuration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableOnlineStore = software.amazon.jsii.Kernel.get(this, "enableOnlineStore", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityConfig = software.amazon.jsii.Kernel.get(this, "securityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ttlDuration = software.amazon.jsii.Kernel.get(this, "ttlDuration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableOnlineStore = builder.enableOnlineStore;
            this.securityConfig = builder.securityConfig;
            this.storageType = builder.storageType;
            this.ttlDuration = builder.ttlDuration;
        }

        @Override
        public final java.lang.Object getEnableOnlineStore() {
            return this.enableOnlineStore;
        }

        @Override
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigSecurityConfig getSecurityConfig() {
            return this.securityConfig;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
        }

        @Override
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupOnlineStoreConfigTtlDuration getTtlDuration() {
            return this.ttlDuration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableOnlineStore() != null) {
                data.set("enableOnlineStore", om.valueToTree(this.getEnableOnlineStore()));
            }
            if (this.getSecurityConfig() != null) {
                data.set("securityConfig", om.valueToTree(this.getSecurityConfig()));
            }
            if (this.getStorageType() != null) {
                data.set("storageType", om.valueToTree(this.getStorageType()));
            }
            if (this.getTtlDuration() != null) {
                data.set("ttlDuration", om.valueToTree(this.getTtlDuration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupOnlineStoreConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupOnlineStoreConfig.Jsii$Proxy that = (SagemakerFeatureGroupOnlineStoreConfig.Jsii$Proxy) o;

            if (this.enableOnlineStore != null ? !this.enableOnlineStore.equals(that.enableOnlineStore) : that.enableOnlineStore != null) return false;
            if (this.securityConfig != null ? !this.securityConfig.equals(that.securityConfig) : that.securityConfig != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            return this.ttlDuration != null ? this.ttlDuration.equals(that.ttlDuration) : that.ttlDuration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableOnlineStore != null ? this.enableOnlineStore.hashCode() : 0;
            result = 31 * result + (this.securityConfig != null ? this.securityConfig.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.ttlDuration != null ? this.ttlDuration.hashCode() : 0);
            return result;
        }
    }
}
