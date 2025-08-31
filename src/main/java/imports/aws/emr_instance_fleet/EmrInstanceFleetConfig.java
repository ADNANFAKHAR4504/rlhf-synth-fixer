package imports.aws.emr_instance_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.200Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrInstanceFleet.EmrInstanceFleetConfig")
@software.amazon.jsii.Jsii.Proxy(EmrInstanceFleetConfig.Jsii$Proxy.class)
public interface EmrInstanceFleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#cluster_id EmrInstanceFleet#cluster_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#id EmrInstanceFleet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * instance_type_configs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#instance_type_configs EmrInstanceFleet#instance_type_configs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInstanceTypeConfigs() {
        return null;
    }

    /**
     * launch_specifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#launch_specifications EmrInstanceFleet#launch_specifications}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications getLaunchSpecifications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#name EmrInstanceFleet#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_on_demand_capacity EmrInstanceFleet#target_on_demand_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetOnDemandCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_spot_capacity EmrInstanceFleet#target_spot_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetSpotCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrInstanceFleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrInstanceFleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrInstanceFleetConfig> {
        java.lang.String clusterId;
        java.lang.String id;
        java.lang.Object instanceTypeConfigs;
        imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications launchSpecifications;
        java.lang.String name;
        java.lang.Number targetOnDemandCapacity;
        java.lang.Number targetSpotCapacity;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getClusterId}
         * @param clusterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#cluster_id EmrInstanceFleet#cluster_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterId(java.lang.String clusterId) {
            this.clusterId = clusterId;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#id EmrInstanceFleet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getInstanceTypeConfigs}
         * @param instanceTypeConfigs instance_type_configs block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#instance_type_configs EmrInstanceFleet#instance_type_configs}
         * @return {@code this}
         */
        public Builder instanceTypeConfigs(com.hashicorp.cdktf.IResolvable instanceTypeConfigs) {
            this.instanceTypeConfigs = instanceTypeConfigs;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getInstanceTypeConfigs}
         * @param instanceTypeConfigs instance_type_configs block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#instance_type_configs EmrInstanceFleet#instance_type_configs}
         * @return {@code this}
         */
        public Builder instanceTypeConfigs(java.util.List<? extends imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs> instanceTypeConfigs) {
            this.instanceTypeConfigs = instanceTypeConfigs;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getLaunchSpecifications}
         * @param launchSpecifications launch_specifications block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#launch_specifications EmrInstanceFleet#launch_specifications}
         * @return {@code this}
         */
        public Builder launchSpecifications(imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications launchSpecifications) {
            this.launchSpecifications = launchSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#name EmrInstanceFleet#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getTargetOnDemandCapacity}
         * @param targetOnDemandCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_on_demand_capacity EmrInstanceFleet#target_on_demand_capacity}.
         * @return {@code this}
         */
        public Builder targetOnDemandCapacity(java.lang.Number targetOnDemandCapacity) {
            this.targetOnDemandCapacity = targetOnDemandCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getTargetSpotCapacity}
         * @param targetSpotCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_spot_capacity EmrInstanceFleet#target_spot_capacity}.
         * @return {@code this}
         */
        public Builder targetSpotCapacity(java.lang.Number targetSpotCapacity) {
            this.targetSpotCapacity = targetSpotCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EmrInstanceFleetConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrInstanceFleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrInstanceFleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrInstanceFleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrInstanceFleetConfig {
        private final java.lang.String clusterId;
        private final java.lang.String id;
        private final java.lang.Object instanceTypeConfigs;
        private final imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications launchSpecifications;
        private final java.lang.String name;
        private final java.lang.Number targetOnDemandCapacity;
        private final java.lang.Number targetSpotCapacity;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterId = software.amazon.jsii.Kernel.get(this, "clusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceTypeConfigs = software.amazon.jsii.Kernel.get(this, "instanceTypeConfigs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.launchSpecifications = software.amazon.jsii.Kernel.get(this, "launchSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetOnDemandCapacity = software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.targetSpotCapacity = software.amazon.jsii.Kernel.get(this, "targetSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterId = java.util.Objects.requireNonNull(builder.clusterId, "clusterId is required");
            this.id = builder.id;
            this.instanceTypeConfigs = builder.instanceTypeConfigs;
            this.launchSpecifications = builder.launchSpecifications;
            this.name = builder.name;
            this.targetOnDemandCapacity = builder.targetOnDemandCapacity;
            this.targetSpotCapacity = builder.targetSpotCapacity;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClusterId() {
            return this.clusterId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getInstanceTypeConfigs() {
            return this.instanceTypeConfigs;
        }

        @Override
        public final imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications getLaunchSpecifications() {
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
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterId", om.valueToTree(this.getClusterId()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
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
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrInstanceFleet.EmrInstanceFleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrInstanceFleetConfig.Jsii$Proxy that = (EmrInstanceFleetConfig.Jsii$Proxy) o;

            if (!clusterId.equals(that.clusterId)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceTypeConfigs != null ? !this.instanceTypeConfigs.equals(that.instanceTypeConfigs) : that.instanceTypeConfigs != null) return false;
            if (this.launchSpecifications != null ? !this.launchSpecifications.equals(that.launchSpecifications) : that.launchSpecifications != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.targetOnDemandCapacity != null ? !this.targetOnDemandCapacity.equals(that.targetOnDemandCapacity) : that.targetOnDemandCapacity != null) return false;
            if (this.targetSpotCapacity != null ? !this.targetSpotCapacity.equals(that.targetSpotCapacity) : that.targetSpotCapacity != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusterId.hashCode();
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceTypeConfigs != null ? this.instanceTypeConfigs.hashCode() : 0);
            result = 31 * result + (this.launchSpecifications != null ? this.launchSpecifications.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.targetOnDemandCapacity != null ? this.targetOnDemandCapacity.hashCode() : 0);
            result = 31 * result + (this.targetSpotCapacity != null ? this.targetSpotCapacity.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
