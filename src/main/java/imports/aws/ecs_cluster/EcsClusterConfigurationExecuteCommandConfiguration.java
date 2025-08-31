package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfigurationExecuteCommandConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsClusterConfigurationExecuteCommandConfiguration.Jsii$Proxy.class)
public interface EcsClusterConfigurationExecuteCommandConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#kms_key_id EcsCluster#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#log_configuration EcsCluster#log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration getLogConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#logging EcsCluster#logging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogging() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsClusterConfigurationExecuteCommandConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsClusterConfigurationExecuteCommandConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsClusterConfigurationExecuteCommandConfiguration> {
        java.lang.String kmsKeyId;
        imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration logConfiguration;
        java.lang.String logging;

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfiguration#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#kms_key_id EcsCluster#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfiguration#getLogConfiguration}
         * @param logConfiguration log_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#log_configuration EcsCluster#log_configuration}
         * @return {@code this}
         */
        public Builder logConfiguration(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration logConfiguration) {
            this.logConfiguration = logConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfigurationExecuteCommandConfiguration#getLogging}
         * @param logging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#logging EcsCluster#logging}.
         * @return {@code this}
         */
        public Builder logging(java.lang.String logging) {
            this.logging = logging;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsClusterConfigurationExecuteCommandConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsClusterConfigurationExecuteCommandConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsClusterConfigurationExecuteCommandConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsClusterConfigurationExecuteCommandConfiguration {
        private final java.lang.String kmsKeyId;
        private final imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration logConfiguration;
        private final java.lang.String logging;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logConfiguration = software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration.class));
            this.logging = software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyId = builder.kmsKeyId;
            this.logConfiguration = builder.logConfiguration;
            this.logging = builder.logging;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfigurationLogConfiguration getLogConfiguration() {
            return this.logConfiguration;
        }

        @Override
        public final java.lang.String getLogging() {
            return this.logging;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLogConfiguration() != null) {
                data.set("logConfiguration", om.valueToTree(this.getLogConfiguration()));
            }
            if (this.getLogging() != null) {
                data.set("logging", om.valueToTree(this.getLogging()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsCluster.EcsClusterConfigurationExecuteCommandConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsClusterConfigurationExecuteCommandConfiguration.Jsii$Proxy that = (EcsClusterConfigurationExecuteCommandConfiguration.Jsii$Proxy) o;

            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.logConfiguration != null ? !this.logConfiguration.equals(that.logConfiguration) : that.logConfiguration != null) return false;
            return this.logging != null ? this.logging.equals(that.logging) : that.logging == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0;
            result = 31 * result + (this.logConfiguration != null ? this.logConfiguration.hashCode() : 0);
            result = 31 * result + (this.logging != null ? this.logging.hashCode() : 0);
            return result;
        }
    }
}
