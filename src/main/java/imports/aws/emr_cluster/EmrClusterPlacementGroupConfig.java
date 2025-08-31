package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.199Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterPlacementGroupConfig")
@software.amazon.jsii.Jsii.Proxy(EmrClusterPlacementGroupConfig.Jsii$Proxy.class)
public interface EmrClusterPlacementGroupConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_role EmrCluster#instance_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_strategy EmrCluster#placement_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterPlacementGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterPlacementGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterPlacementGroupConfig> {
        java.lang.String instanceRole;
        java.lang.String placementStrategy;

        /**
         * Sets the value of {@link EmrClusterPlacementGroupConfig#getInstanceRole}
         * @param instanceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_role EmrCluster#instance_role}.
         * @return {@code this}
         */
        public Builder instanceRole(java.lang.String instanceRole) {
            this.instanceRole = instanceRole;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterPlacementGroupConfig#getPlacementStrategy}
         * @param placementStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#placement_strategy EmrCluster#placement_strategy}.
         * @return {@code this}
         */
        public Builder placementStrategy(java.lang.String placementStrategy) {
            this.placementStrategy = placementStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterPlacementGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterPlacementGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterPlacementGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterPlacementGroupConfig {
        private final java.lang.String instanceRole;
        private final java.lang.String placementStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceRole = software.amazon.jsii.Kernel.get(this, "instanceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementStrategy = software.amazon.jsii.Kernel.get(this, "placementStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceRole = builder.instanceRole;
            this.placementStrategy = builder.placementStrategy;
        }

        @Override
        public final java.lang.String getInstanceRole() {
            return this.instanceRole;
        }

        @Override
        public final java.lang.String getPlacementStrategy() {
            return this.placementStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceRole() != null) {
                data.set("instanceRole", om.valueToTree(this.getInstanceRole()));
            }
            if (this.getPlacementStrategy() != null) {
                data.set("placementStrategy", om.valueToTree(this.getPlacementStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterPlacementGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterPlacementGroupConfig.Jsii$Proxy that = (EmrClusterPlacementGroupConfig.Jsii$Proxy) o;

            if (this.instanceRole != null ? !this.instanceRole.equals(that.instanceRole) : that.instanceRole != null) return false;
            return this.placementStrategy != null ? this.placementStrategy.equals(that.placementStrategy) : that.placementStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceRole != null ? this.instanceRole.hashCode() : 0;
            result = 31 * result + (this.placementStrategy != null ? this.placementStrategy.hashCode() : 0);
            return result;
        }
    }
}
