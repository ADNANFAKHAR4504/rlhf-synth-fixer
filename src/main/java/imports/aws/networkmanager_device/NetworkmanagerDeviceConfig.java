package imports.aws.networkmanager_device;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerDevice.NetworkmanagerDeviceConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerDeviceConfig.Jsii$Proxy.class)
public interface NetworkmanagerDeviceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#global_network_id NetworkmanagerDevice#global_network_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGlobalNetworkId();

    /**
     * aws_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#aws_location NetworkmanagerDevice#aws_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation getAwsLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#description NetworkmanagerDevice#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#id NetworkmanagerDevice#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#location NetworkmanagerDevice#location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_device.NetworkmanagerDeviceLocation getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#model NetworkmanagerDevice#model}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#serial_number NetworkmanagerDevice#serial_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSerialNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#site_id NetworkmanagerDevice#site_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSiteId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#tags NetworkmanagerDevice#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#tags_all NetworkmanagerDevice#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#timeouts NetworkmanagerDevice#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#type NetworkmanagerDevice#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#vendor NetworkmanagerDevice#vendor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVendor() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerDeviceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerDeviceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerDeviceConfig> {
        java.lang.String globalNetworkId;
        imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation awsLocation;
        java.lang.String description;
        java.lang.String id;
        imports.aws.networkmanager_device.NetworkmanagerDeviceLocation location;
        java.lang.String model;
        java.lang.String serialNumber;
        java.lang.String siteId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts timeouts;
        java.lang.String type;
        java.lang.String vendor;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getGlobalNetworkId}
         * @param globalNetworkId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#global_network_id NetworkmanagerDevice#global_network_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder globalNetworkId(java.lang.String globalNetworkId) {
            this.globalNetworkId = globalNetworkId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getAwsLocation}
         * @param awsLocation aws_location block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#aws_location NetworkmanagerDevice#aws_location}
         * @return {@code this}
         */
        public Builder awsLocation(imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation awsLocation) {
            this.awsLocation = awsLocation;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#description NetworkmanagerDevice#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#id NetworkmanagerDevice#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getLocation}
         * @param location location block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#location NetworkmanagerDevice#location}
         * @return {@code this}
         */
        public Builder location(imports.aws.networkmanager_device.NetworkmanagerDeviceLocation location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getModel}
         * @param model Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#model NetworkmanagerDevice#model}.
         * @return {@code this}
         */
        public Builder model(java.lang.String model) {
            this.model = model;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getSerialNumber}
         * @param serialNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#serial_number NetworkmanagerDevice#serial_number}.
         * @return {@code this}
         */
        public Builder serialNumber(java.lang.String serialNumber) {
            this.serialNumber = serialNumber;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getSiteId}
         * @param siteId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#site_id NetworkmanagerDevice#site_id}.
         * @return {@code this}
         */
        public Builder siteId(java.lang.String siteId) {
            this.siteId = siteId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#tags NetworkmanagerDevice#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#tags_all NetworkmanagerDevice#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#timeouts NetworkmanagerDevice#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#type NetworkmanagerDevice#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getVendor}
         * @param vendor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#vendor NetworkmanagerDevice#vendor}.
         * @return {@code this}
         */
        public Builder vendor(java.lang.String vendor) {
            this.vendor = vendor;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getDependsOn}
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
         * Sets the value of {@link NetworkmanagerDeviceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkmanagerDeviceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerDeviceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerDeviceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerDeviceConfig {
        private final java.lang.String globalNetworkId;
        private final imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation awsLocation;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.networkmanager_device.NetworkmanagerDeviceLocation location;
        private final java.lang.String model;
        private final java.lang.String serialNumber;
        private final java.lang.String siteId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts timeouts;
        private final java.lang.String type;
        private final java.lang.String vendor;
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
            this.globalNetworkId = software.amazon.jsii.Kernel.get(this, "globalNetworkId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsLocation = software.amazon.jsii.Kernel.get(this, "awsLocation", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_device.NetworkmanagerDeviceLocation.class));
            this.model = software.amazon.jsii.Kernel.get(this, "model", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serialNumber = software.amazon.jsii.Kernel.get(this, "serialNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.siteId = software.amazon.jsii.Kernel.get(this, "siteId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vendor = software.amazon.jsii.Kernel.get(this, "vendor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.globalNetworkId = java.util.Objects.requireNonNull(builder.globalNetworkId, "globalNetworkId is required");
            this.awsLocation = builder.awsLocation;
            this.description = builder.description;
            this.id = builder.id;
            this.location = builder.location;
            this.model = builder.model;
            this.serialNumber = builder.serialNumber;
            this.siteId = builder.siteId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.vendor = builder.vendor;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getGlobalNetworkId() {
            return this.globalNetworkId;
        }

        @Override
        public final imports.aws.networkmanager_device.NetworkmanagerDeviceAwsLocation getAwsLocation() {
            return this.awsLocation;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.networkmanager_device.NetworkmanagerDeviceLocation getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.String getModel() {
            return this.model;
        }

        @Override
        public final java.lang.String getSerialNumber() {
            return this.serialNumber;
        }

        @Override
        public final java.lang.String getSiteId() {
            return this.siteId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.networkmanager_device.NetworkmanagerDeviceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getVendor() {
            return this.vendor;
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

            data.set("globalNetworkId", om.valueToTree(this.getGlobalNetworkId()));
            if (this.getAwsLocation() != null) {
                data.set("awsLocation", om.valueToTree(this.getAwsLocation()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getModel() != null) {
                data.set("model", om.valueToTree(this.getModel()));
            }
            if (this.getSerialNumber() != null) {
                data.set("serialNumber", om.valueToTree(this.getSerialNumber()));
            }
            if (this.getSiteId() != null) {
                data.set("siteId", om.valueToTree(this.getSiteId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getVendor() != null) {
                data.set("vendor", om.valueToTree(this.getVendor()));
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
            struct.set("fqn", om.valueToTree("aws.networkmanagerDevice.NetworkmanagerDeviceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerDeviceConfig.Jsii$Proxy that = (NetworkmanagerDeviceConfig.Jsii$Proxy) o;

            if (!globalNetworkId.equals(that.globalNetworkId)) return false;
            if (this.awsLocation != null ? !this.awsLocation.equals(that.awsLocation) : that.awsLocation != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            if (this.model != null ? !this.model.equals(that.model) : that.model != null) return false;
            if (this.serialNumber != null ? !this.serialNumber.equals(that.serialNumber) : that.serialNumber != null) return false;
            if (this.siteId != null ? !this.siteId.equals(that.siteId) : that.siteId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.vendor != null ? !this.vendor.equals(that.vendor) : that.vendor != null) return false;
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
            int result = this.globalNetworkId.hashCode();
            result = 31 * result + (this.awsLocation != null ? this.awsLocation.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.model != null ? this.model.hashCode() : 0);
            result = 31 * result + (this.serialNumber != null ? this.serialNumber.hashCode() : 0);
            result = 31 * result + (this.siteId != null ? this.siteId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.vendor != null ? this.vendor.hashCode() : 0);
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
