package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceVolumeConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsServiceVolumeConfiguration.Jsii$Proxy.class)
public interface EcsServiceVolumeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * managed_ebs_volume block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#managed_ebs_volume EcsService#managed_ebs_volume}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume getManagedEbsVolume();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#name EcsService#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link EcsServiceVolumeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceVolumeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceVolumeConfiguration> {
        imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume managedEbsVolume;
        java.lang.String name;

        /**
         * Sets the value of {@link EcsServiceVolumeConfiguration#getManagedEbsVolume}
         * @param managedEbsVolume managed_ebs_volume block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#managed_ebs_volume EcsService#managed_ebs_volume}
         * @return {@code this}
         */
        public Builder managedEbsVolume(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume managedEbsVolume) {
            this.managedEbsVolume = managedEbsVolume;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVolumeConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#name EcsService#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceVolumeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceVolumeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceVolumeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceVolumeConfiguration {
        private final imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume managedEbsVolume;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.managedEbsVolume = software.amazon.jsii.Kernel.get(this, "managedEbsVolume", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.managedEbsVolume = java.util.Objects.requireNonNull(builder.managedEbsVolume, "managedEbsVolume is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume getManagedEbsVolume() {
            return this.managedEbsVolume;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("managedEbsVolume", om.valueToTree(this.getManagedEbsVolume()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceVolumeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceVolumeConfiguration.Jsii$Proxy that = (EcsServiceVolumeConfiguration.Jsii$Proxy) o;

            if (!managedEbsVolume.equals(that.managedEbsVolume)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.managedEbsVolume.hashCode();
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}
