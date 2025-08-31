package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfigurationManagedStorageConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsClusterConfigurationManagedStorageConfiguration.Jsii$Proxy.class)
public interface EcsClusterConfigurationManagedStorageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#fargate_ephemeral_storage_kms_key_id EcsCluster#fargate_ephemeral_storage_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFargateEphemeralStorageKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#kms_key_id EcsCluster#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsClusterConfigurationManagedStorageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsClusterConfigurationManagedStorageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsClusterConfigurationManagedStorageConfiguration> {
        java.lang.String fargateEphemeralStorageKmsKeyId;
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link EcsClusterConfigurationManagedStorageConfiguration#getFargateEphemeralStorageKmsKeyId}
         * @param fargateEphemeralStorageKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#fargate_ephemeral_storage_kms_key_id EcsCluster#fargate_ephemeral_storage_kms_key_id}.
         * @return {@code this}
         */
        public Builder fargateEphemeralStorageKmsKeyId(java.lang.String fargateEphemeralStorageKmsKeyId) {
            this.fargateEphemeralStorageKmsKeyId = fargateEphemeralStorageKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationManagedStorageConfiguration#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#kms_key_id EcsCluster#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsClusterConfigurationManagedStorageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsClusterConfigurationManagedStorageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsClusterConfigurationManagedStorageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsClusterConfigurationManagedStorageConfiguration {
        private final java.lang.String fargateEphemeralStorageKmsKeyId;
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fargateEphemeralStorageKmsKeyId = software.amazon.jsii.Kernel.get(this, "fargateEphemeralStorageKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fargateEphemeralStorageKmsKeyId = builder.fargateEphemeralStorageKmsKeyId;
            this.kmsKeyId = builder.kmsKeyId;
        }

        @Override
        public final java.lang.String getFargateEphemeralStorageKmsKeyId() {
            return this.fargateEphemeralStorageKmsKeyId;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFargateEphemeralStorageKmsKeyId() != null) {
                data.set("fargateEphemeralStorageKmsKeyId", om.valueToTree(this.getFargateEphemeralStorageKmsKeyId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsCluster.EcsClusterConfigurationManagedStorageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsClusterConfigurationManagedStorageConfiguration.Jsii$Proxy that = (EcsClusterConfigurationManagedStorageConfiguration.Jsii$Proxy) o;

            if (this.fargateEphemeralStorageKmsKeyId != null ? !this.fargateEphemeralStorageKmsKeyId.equals(that.fargateEphemeralStorageKmsKeyId) : that.fargateEphemeralStorageKmsKeyId != null) return false;
            return this.kmsKeyId != null ? this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fargateEphemeralStorageKmsKeyId != null ? this.fargateEphemeralStorageKmsKeyId.hashCode() : 0;
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
