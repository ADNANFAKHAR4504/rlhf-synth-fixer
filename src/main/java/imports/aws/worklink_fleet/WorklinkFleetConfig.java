package imports.aws.worklink_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.worklinkFleet.WorklinkFleetConfig")
@software.amazon.jsii.Jsii.Proxy(WorklinkFleetConfig.Jsii$Proxy.class)
public interface WorklinkFleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#name WorklinkFleet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#audit_stream_arn WorklinkFleet#audit_stream_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuditStreamArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#device_ca_certificate WorklinkFleet#device_ca_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceCaCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#display_name WorklinkFleet#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#id WorklinkFleet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * identity_provider block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#identity_provider WorklinkFleet#identity_provider}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.worklink_fleet.WorklinkFleetIdentityProvider getIdentityProvider() {
        return null;
    }

    /**
     * network block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#network WorklinkFleet#network}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.worklink_fleet.WorklinkFleetNetwork getNetwork() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOptimizeForEndUserLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorklinkFleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorklinkFleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorklinkFleetConfig> {
        java.lang.String name;
        java.lang.String auditStreamArn;
        java.lang.String deviceCaCertificate;
        java.lang.String displayName;
        java.lang.String id;
        imports.aws.worklink_fleet.WorklinkFleetIdentityProvider identityProvider;
        imports.aws.worklink_fleet.WorklinkFleetNetwork network;
        java.lang.Object optimizeForEndUserLocation;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link WorklinkFleetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#name WorklinkFleet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getAuditStreamArn}
         * @param auditStreamArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#audit_stream_arn WorklinkFleet#audit_stream_arn}.
         * @return {@code this}
         */
        public Builder auditStreamArn(java.lang.String auditStreamArn) {
            this.auditStreamArn = auditStreamArn;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getDeviceCaCertificate}
         * @param deviceCaCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#device_ca_certificate WorklinkFleet#device_ca_certificate}.
         * @return {@code this}
         */
        public Builder deviceCaCertificate(java.lang.String deviceCaCertificate) {
            this.deviceCaCertificate = deviceCaCertificate;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#display_name WorklinkFleet#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#id WorklinkFleet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getIdentityProvider}
         * @param identityProvider identity_provider block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#identity_provider WorklinkFleet#identity_provider}
         * @return {@code this}
         */
        public Builder identityProvider(imports.aws.worklink_fleet.WorklinkFleetIdentityProvider identityProvider) {
            this.identityProvider = identityProvider;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getNetwork}
         * @param network network block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#network WorklinkFleet#network}
         * @return {@code this}
         */
        public Builder network(imports.aws.worklink_fleet.WorklinkFleetNetwork network) {
            this.network = network;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getOptimizeForEndUserLocation}
         * @param optimizeForEndUserLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}.
         * @return {@code this}
         */
        public Builder optimizeForEndUserLocation(java.lang.Boolean optimizeForEndUserLocation) {
            this.optimizeForEndUserLocation = optimizeForEndUserLocation;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getOptimizeForEndUserLocation}
         * @param optimizeForEndUserLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}.
         * @return {@code this}
         */
        public Builder optimizeForEndUserLocation(com.hashicorp.cdktf.IResolvable optimizeForEndUserLocation) {
            this.optimizeForEndUserLocation = optimizeForEndUserLocation;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getDependsOn}
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
         * Sets the value of {@link WorklinkFleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetConfig#getProvisioners}
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
         * @return a new instance of {@link WorklinkFleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorklinkFleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorklinkFleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorklinkFleetConfig {
        private final java.lang.String name;
        private final java.lang.String auditStreamArn;
        private final java.lang.String deviceCaCertificate;
        private final java.lang.String displayName;
        private final java.lang.String id;
        private final imports.aws.worklink_fleet.WorklinkFleetIdentityProvider identityProvider;
        private final imports.aws.worklink_fleet.WorklinkFleetNetwork network;
        private final java.lang.Object optimizeForEndUserLocation;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.auditStreamArn = software.amazon.jsii.Kernel.get(this, "auditStreamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceCaCertificate = software.amazon.jsii.Kernel.get(this, "deviceCaCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityProvider = software.amazon.jsii.Kernel.get(this, "identityProvider", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetIdentityProvider.class));
            this.network = software.amazon.jsii.Kernel.get(this, "network", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetNetwork.class));
            this.optimizeForEndUserLocation = software.amazon.jsii.Kernel.get(this, "optimizeForEndUserLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.auditStreamArn = builder.auditStreamArn;
            this.deviceCaCertificate = builder.deviceCaCertificate;
            this.displayName = builder.displayName;
            this.id = builder.id;
            this.identityProvider = builder.identityProvider;
            this.network = builder.network;
            this.optimizeForEndUserLocation = builder.optimizeForEndUserLocation;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAuditStreamArn() {
            return this.auditStreamArn;
        }

        @Override
        public final java.lang.String getDeviceCaCertificate() {
            return this.deviceCaCertificate;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.worklink_fleet.WorklinkFleetIdentityProvider getIdentityProvider() {
            return this.identityProvider;
        }

        @Override
        public final imports.aws.worklink_fleet.WorklinkFleetNetwork getNetwork() {
            return this.network;
        }

        @Override
        public final java.lang.Object getOptimizeForEndUserLocation() {
            return this.optimizeForEndUserLocation;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAuditStreamArn() != null) {
                data.set("auditStreamArn", om.valueToTree(this.getAuditStreamArn()));
            }
            if (this.getDeviceCaCertificate() != null) {
                data.set("deviceCaCertificate", om.valueToTree(this.getDeviceCaCertificate()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentityProvider() != null) {
                data.set("identityProvider", om.valueToTree(this.getIdentityProvider()));
            }
            if (this.getNetwork() != null) {
                data.set("network", om.valueToTree(this.getNetwork()));
            }
            if (this.getOptimizeForEndUserLocation() != null) {
                data.set("optimizeForEndUserLocation", om.valueToTree(this.getOptimizeForEndUserLocation()));
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
            struct.set("fqn", om.valueToTree("aws.worklinkFleet.WorklinkFleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorklinkFleetConfig.Jsii$Proxy that = (WorklinkFleetConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.auditStreamArn != null ? !this.auditStreamArn.equals(that.auditStreamArn) : that.auditStreamArn != null) return false;
            if (this.deviceCaCertificate != null ? !this.deviceCaCertificate.equals(that.deviceCaCertificate) : that.deviceCaCertificate != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identityProvider != null ? !this.identityProvider.equals(that.identityProvider) : that.identityProvider != null) return false;
            if (this.network != null ? !this.network.equals(that.network) : that.network != null) return false;
            if (this.optimizeForEndUserLocation != null ? !this.optimizeForEndUserLocation.equals(that.optimizeForEndUserLocation) : that.optimizeForEndUserLocation != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.auditStreamArn != null ? this.auditStreamArn.hashCode() : 0);
            result = 31 * result + (this.deviceCaCertificate != null ? this.deviceCaCertificate.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identityProvider != null ? this.identityProvider.hashCode() : 0);
            result = 31 * result + (this.network != null ? this.network.hashCode() : 0);
            result = 31 * result + (this.optimizeForEndUserLocation != null ? this.optimizeForEndUserLocation.hashCode() : 0);
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
