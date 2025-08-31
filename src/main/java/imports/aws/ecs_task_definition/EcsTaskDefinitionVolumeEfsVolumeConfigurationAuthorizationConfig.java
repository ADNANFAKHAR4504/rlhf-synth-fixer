package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig.Jsii$Proxy.class)
public interface EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#access_point_id EcsTaskDefinition#access_point_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessPointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#iam EcsTaskDefinition#iam}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIam() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig> {
        java.lang.String accessPointId;
        java.lang.String iam;

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig#getAccessPointId}
         * @param accessPointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#access_point_id EcsTaskDefinition#access_point_id}.
         * @return {@code this}
         */
        public Builder accessPointId(java.lang.String accessPointId) {
            this.accessPointId = accessPointId;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig#getIam}
         * @param iam Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#iam EcsTaskDefinition#iam}.
         * @return {@code this}
         */
        public Builder iam(java.lang.String iam) {
            this.iam = iam;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig {
        private final java.lang.String accessPointId;
        private final java.lang.String iam;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessPointId = software.amazon.jsii.Kernel.get(this, "accessPointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iam = software.amazon.jsii.Kernel.get(this, "iam", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessPointId = builder.accessPointId;
            this.iam = builder.iam;
        }

        @Override
        public final java.lang.String getAccessPointId() {
            return this.accessPointId;
        }

        @Override
        public final java.lang.String getIam() {
            return this.iam;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccessPointId() != null) {
                data.set("accessPointId", om.valueToTree(this.getAccessPointId()));
            }
            if (this.getIam() != null) {
                data.set("iam", om.valueToTree(this.getIam()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig.Jsii$Proxy that = (EcsTaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfig.Jsii$Proxy) o;

            if (this.accessPointId != null ? !this.accessPointId.equals(that.accessPointId) : that.accessPointId != null) return false;
            return this.iam != null ? this.iam.equals(that.iam) : that.iam == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessPointId != null ? this.accessPointId.hashCode() : 0;
            result = 31 * result + (this.iam != null ? this.iam.hashCode() : 0);
            return result;
        }
    }
}
