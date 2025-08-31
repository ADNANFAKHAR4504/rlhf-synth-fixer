package imports.aws.emr_instance_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet aws_emr_instance_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.199Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrInstanceFleet.EmrInstanceFleet")
public class EmrInstanceFleet extends com.hashicorp.cdktf.TerraformResource {

    protected EmrInstanceFleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrInstanceFleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.emr_instance_fleet.EmrInstanceFleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet aws_emr_instance_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EmrInstanceFleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.emr_instance_fleet.EmrInstanceFleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EmrInstanceFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrInstanceFleet to import. This parameter is required.
     * @param importFromId The id of the existing EmrInstanceFleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EmrInstanceFleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_instance_fleet.EmrInstanceFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EmrInstanceFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrInstanceFleet to import. This parameter is required.
     * @param importFromId The id of the existing EmrInstanceFleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_instance_fleet.EmrInstanceFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putInstanceTypeConfigs(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs> __cast_cd4240 = (java.util.List<imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInstanceTypeConfigs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchSpecifications(final @org.jetbrains.annotations.NotNull imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchSpecifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceTypeConfigs() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceTypeConfigs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchSpecifications() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchSpecifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetOnDemandCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetTargetOnDemandCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetSpotCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetTargetSpotCapacity", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigsList getInstanceTypeConfigs() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeConfigs", software.amazon.jsii.NativeType.forClass(imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecificationsOutputReference getLaunchSpecifications() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecificationsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedOnDemandCapacity() {
        return software.amazon.jsii.Kernel.get(this, "provisionedOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedSpotCapacity() {
        return software.amazon.jsii.Kernel.get(this, "provisionedSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInstanceTypeConfigsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeConfigsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications getLaunchSpecificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "launchSpecificationsInput", software.amazon.jsii.NativeType.forClass(imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetOnDemandCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTargetSpotCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "targetSpotCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterId() {
        return software.amazon.jsii.Kernel.get(this, "clusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterId", java.util.Objects.requireNonNull(value, "clusterId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetOnDemandCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetOnDemandCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetOnDemandCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetOnDemandCapacity", java.util.Objects.requireNonNull(value, "targetOnDemandCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTargetSpotCapacity() {
        return software.amazon.jsii.Kernel.get(this, "targetSpotCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTargetSpotCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "targetSpotCapacity", java.util.Objects.requireNonNull(value, "targetSpotCapacity is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.emr_instance_fleet.EmrInstanceFleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.emr_instance_fleet.EmrInstanceFleet> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.emr_instance_fleet.EmrInstanceFleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.emr_instance_fleet.EmrInstanceFleetConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#cluster_id EmrInstanceFleet#cluster_id}.
         * <p>
         * @return {@code this}
         * @param clusterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#cluster_id EmrInstanceFleet#cluster_id}. This parameter is required.
         */
        public Builder clusterId(final java.lang.String clusterId) {
            this.config.clusterId(clusterId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#id EmrInstanceFleet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#id EmrInstanceFleet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * instance_type_configs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#instance_type_configs EmrInstanceFleet#instance_type_configs}
         * <p>
         * @return {@code this}
         * @param instanceTypeConfigs instance_type_configs block. This parameter is required.
         */
        public Builder instanceTypeConfigs(final com.hashicorp.cdktf.IResolvable instanceTypeConfigs) {
            this.config.instanceTypeConfigs(instanceTypeConfigs);
            return this;
        }
        /**
         * instance_type_configs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#instance_type_configs EmrInstanceFleet#instance_type_configs}
         * <p>
         * @return {@code this}
         * @param instanceTypeConfigs instance_type_configs block. This parameter is required.
         */
        public Builder instanceTypeConfigs(final java.util.List<? extends imports.aws.emr_instance_fleet.EmrInstanceFleetInstanceTypeConfigs> instanceTypeConfigs) {
            this.config.instanceTypeConfigs(instanceTypeConfigs);
            return this;
        }

        /**
         * launch_specifications block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#launch_specifications EmrInstanceFleet#launch_specifications}
         * <p>
         * @return {@code this}
         * @param launchSpecifications launch_specifications block. This parameter is required.
         */
        public Builder launchSpecifications(final imports.aws.emr_instance_fleet.EmrInstanceFleetLaunchSpecifications launchSpecifications) {
            this.config.launchSpecifications(launchSpecifications);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#name EmrInstanceFleet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#name EmrInstanceFleet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_on_demand_capacity EmrInstanceFleet#target_on_demand_capacity}.
         * <p>
         * @return {@code this}
         * @param targetOnDemandCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_on_demand_capacity EmrInstanceFleet#target_on_demand_capacity}. This parameter is required.
         */
        public Builder targetOnDemandCapacity(final java.lang.Number targetOnDemandCapacity) {
            this.config.targetOnDemandCapacity(targetOnDemandCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_spot_capacity EmrInstanceFleet#target_spot_capacity}.
         * <p>
         * @return {@code this}
         * @param targetSpotCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_instance_fleet#target_spot_capacity EmrInstanceFleet#target_spot_capacity}. This parameter is required.
         */
        public Builder targetSpotCapacity(final java.lang.Number targetSpotCapacity) {
            this.config.targetSpotCapacity(targetSpotCapacity);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.emr_instance_fleet.EmrInstanceFleet}.
         */
        @Override
        public imports.aws.emr_instance_fleet.EmrInstanceFleet build() {
            return new imports.aws.emr_instance_fleet.EmrInstanceFleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
