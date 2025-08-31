package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterMasterInstanceFleet")
@software.amazon.jsii.Jsii.Proxy(EmrClusterMasterInstanceFleet.Jsii$Proxy.class)
public interface EmrClusterMasterInstanceFleet extends software.amazon.jsii.JsiiSerializable {

    /**
     * instance_type_configs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type_configs EmrCluster#instance_type_configs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInstanceTypeConfigs() {
        return null;
    }

    /**
     * launch_specifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#launch_specifications EmrCluster#launch_specifications}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications getLaunchSpecifications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#target_on_demand_capacity EmrCluster#target_on_demand_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetOnDemandCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#target_spot_capacity EmrCluster#target_spot_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetSpotCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterMasterInstanceFleet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterMasterInstanceFleet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterMasterInstanceFleet> {
        java.lang.Object instanceTypeConfigs;
        imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications launchSpecifications;
        java.lang.String name;
        java.lang.Number targetOnDemandCapacity;
        java.lang.Number targetSpotCapacity;

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getInstanceTypeConfigs}
         * @param instanceTypeConfigs instance_type_configs block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type_configs EmrCluster#instance_type_configs}
         * @return {@code this}
         */
        public Builder instanceTypeConfigs(com.hashicorp.cdktf.IResolvable instanceTypeConfigs) {
            this.instanceTypeConfigs = instanceTypeConfigs;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getInstanceTypeConfigs}
         * @param instanceTypeConfigs instance_type_configs block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#instance_type_configs EmrCluster#instance_type_configs}
         * @return {@code this}
         */
        public Builder instanceTypeConfigs(java.util.List<? extends imports.aws.emr_cluster.EmrClusterMasterInstanceFleetInstanceTypeConfigs> instanceTypeConfigs) {
            this.instanceTypeConfigs = instanceTypeConfigs;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getLaunchSpecifications}
         * @param launchSpecifications launch_specifications block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#launch_specifications EmrCluster#launch_specifications}
         * @return {@code this}
         */
        public Builder launchSpecifications(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications launchSpecifications) {
            this.launchSpecifications = launchSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#name EmrCluster#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getTargetOnDemandCapacity}
         * @param targetOnDemandCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#target_on_demand_capacity EmrCluster#target_on_demand_capacity}.
         * @return {@code this}
         */
        public Builder targetOnDemandCapacity(java.lang.Number targetOnDemandCapacity) {
            this.targetOnDemandCapacity = targetOnDemandCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleet#getTargetSpotCapacity}
         * @param targetSpotCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#target_spot_capacity EmrCluster#target_spot_capacity}.
         * @return {@code this}
         */
        public Builder targetSpotCapacity(java.lang.Number targetSpotCapacity) {
            this.targetSpotCapacity = targetSpotCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterMasterInstanceFleet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterMasterInstanceFleet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterMasterInstanceFleet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterMasterInstanceFleet {
        private final java.lang.Object instanceTypeConfigs;
        private final imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications launchSpecifications;
        private final java.lang.String name;
        private final java.lang.Number targetOnDemandCapacity;
        private final java.lang.Number targetSpotCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceTypeConfigs = software.amazon.jsii.Kernel.get(this, "instanceTypeConfigs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.launchSpecifications = software.amazon.jsii.Kernel.get(this, "launchSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetOnDemandCapacity = software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.targetSpotCapacity = software.amazon.jsii.Kernel.get(this, "targetSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceTypeConfigs = builder.instanceTypeConfigs;
            this.launchSpecifications = builder.launchSpecifications;
            this.name = builder.name;
            this.targetOnDemandCapacity = builder.targetOnDemandCapacity;
            this.targetSpotCapacity = builder.targetSpotCapacity;
        }

        @Override
        public final java.lang.Object getInstanceTypeConfigs() {
            return this.instanceTypeConfigs;
        }

        @Override
        public final imports.aws.emr_cluster.EmrClusterMasterInstanceFleetLaunchSpecifications getLaunchSpecifications() {
            return this.launchSpecifications;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getTargetOnDemandCapacity() {
            return this.targetOnDemandCapacity;
        }

        @Override
        public final java.lang.Number getTargetSpotCapacity() {
            return this.targetSpotCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceTypeConfigs() != null) {
                data.set("instanceTypeConfigs", om.valueToTree(this.getInstanceTypeConfigs()));
            }
            if (this.getLaunchSpecifications() != null) {
                data.set("launchSpecifications", om.valueToTree(this.getLaunchSpecifications()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTargetOnDemandCapacity() != null) {
                data.set("targetOnDemandCapacity", om.valueToTree(this.getTargetOnDemandCapacity()));
            }
            if (this.getTargetSpotCapacity() != null) {
                data.set("targetSpotCapacity", om.valueToTree(this.getTargetSpotCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterMasterInstanceFleet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterMasterInstanceFleet.Jsii$Proxy that = (EmrClusterMasterInstanceFleet.Jsii$Proxy) o;

            if (this.instanceTypeConfigs != null ? !this.instanceTypeConfigs.equals(that.instanceTypeConfigs) : that.instanceTypeConfigs != null) return false;
            if (this.launchSpecifications != null ? !this.launchSpecifications.equals(that.launchSpecifications) : that.launchSpecifications != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.targetOnDemandCapacity != null ? !this.targetOnDemandCapacity.equals(that.targetOnDemandCapacity) : that.targetOnDemandCapacity != null) return false;
            return this.targetSpotCapacity != null ? this.targetSpotCapacity.equals(that.targetSpotCapacity) : that.targetSpotCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceTypeConfigs != null ? this.instanceTypeConfigs.hashCode() : 0;
            result = 31 * result + (this.launchSpecifications != null ? this.launchSpecifications.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.targetOnDemandCapacity != null ? this.targetOnDemandCapacity.hashCode() : 0);
            result = 31 * result + (this.targetSpotCapacity != null ? this.targetSpotCapacity.hashCode() : 0);
            return result;
        }
    }
}
