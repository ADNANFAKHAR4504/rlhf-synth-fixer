package imports.aws.ecs_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsCluster.EcsClusterConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsClusterConfiguration.Jsii$Proxy.class)
public interface EcsClusterConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * execute_command_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#execute_command_configuration EcsCluster#execute_command_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration getExecuteCommandConfiguration() {
        return null;
    }

    /**
     * managed_storage_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#managed_storage_configuration EcsCluster#managed_storage_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration getManagedStorageConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsClusterConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsClusterConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsClusterConfiguration> {
        imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration executeCommandConfiguration;
        imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration managedStorageConfiguration;

        /**
         * Sets the value of {@link EcsClusterConfiguration#getExecuteCommandConfiguration}
         * @param executeCommandConfiguration execute_command_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#execute_command_configuration EcsCluster#execute_command_configuration}
         * @return {@code this}
         */
        public Builder executeCommandConfiguration(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration executeCommandConfiguration) {
            this.executeCommandConfiguration = executeCommandConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcsClusterConfiguration#getManagedStorageConfiguration}
         * @param managedStorageConfiguration managed_storage_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_cluster#managed_storage_configuration EcsCluster#managed_storage_configuration}
         * @return {@code this}
         */
        public Builder managedStorageConfiguration(imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration managedStorageConfiguration) {
            this.managedStorageConfiguration = managedStorageConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsClusterConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsClusterConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsClusterConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsClusterConfiguration {
        private final imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration executeCommandConfiguration;
        private final imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration managedStorageConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executeCommandConfiguration = software.amazon.jsii.Kernel.get(this, "executeCommandConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration.class));
            this.managedStorageConfiguration = software.amazon.jsii.Kernel.get(this, "managedStorageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executeCommandConfiguration = builder.executeCommandConfiguration;
            this.managedStorageConfiguration = builder.managedStorageConfiguration;
        }

        @Override
        public final imports.aws.ecs_cluster.EcsClusterConfigurationExecuteCommandConfiguration getExecuteCommandConfiguration() {
            return this.executeCommandConfiguration;
        }

        @Override
        public final imports.aws.ecs_cluster.EcsClusterConfigurationManagedStorageConfiguration getManagedStorageConfiguration() {
            return this.managedStorageConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExecuteCommandConfiguration() != null) {
                data.set("executeCommandConfiguration", om.valueToTree(this.getExecuteCommandConfiguration()));
            }
            if (this.getManagedStorageConfiguration() != null) {
                data.set("managedStorageConfiguration", om.valueToTree(this.getManagedStorageConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsCluster.EcsClusterConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsClusterConfiguration.Jsii$Proxy that = (EcsClusterConfiguration.Jsii$Proxy) o;

            if (this.executeCommandConfiguration != null ? !this.executeCommandConfiguration.equals(that.executeCommandConfiguration) : that.executeCommandConfiguration != null) return false;
            return this.managedStorageConfiguration != null ? this.managedStorageConfiguration.equals(that.managedStorageConfiguration) : that.managedStorageConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.executeCommandConfiguration != null ? this.executeCommandConfiguration.hashCode() : 0;
            result = 31 * result + (this.managedStorageConfiguration != null ? this.managedStorageConfiguration.hashCode() : 0);
            return result;
        }
    }
}
