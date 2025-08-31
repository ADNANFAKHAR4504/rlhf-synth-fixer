package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetConfig")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetConfig.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSetName();

    /**
     * delivery_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions getDeliveryOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * reputation_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions getReputationOptions() {
        return null;
    }

    /**
     * sending_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions getSendingOptions() {
        return null;
    }

    /**
     * suppression_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions getSuppressionOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tracking_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions getTrackingOptions() {
        return null;
    }

    /**
     * vdm_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions getVdmOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetConfig> {
        java.lang.String configurationSetName;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions deliveryOptions;
        java.lang.String id;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions reputationOptions;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions sendingOptions;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions suppressionOptions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions trackingOptions;
        imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions vdmOptions;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getConfigurationSetName}
         * @param configurationSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationSetName(java.lang.String configurationSetName) {
            this.configurationSetName = configurationSetName;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getDeliveryOptions}
         * @param deliveryOptions delivery_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
         * @return {@code this}
         */
        public Builder deliveryOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions deliveryOptions) {
            this.deliveryOptions = deliveryOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getReputationOptions}
         * @param reputationOptions reputation_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
         * @return {@code this}
         */
        public Builder reputationOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions reputationOptions) {
            this.reputationOptions = reputationOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getSendingOptions}
         * @param sendingOptions sending_options block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
         * @return {@code this}
         */
        public Builder sendingOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions sendingOptions) {
            this.sendingOptions = sendingOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getSuppressionOptions}
         * @param suppressionOptions suppression_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
         * @return {@code this}
         */
        public Builder suppressionOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions suppressionOptions) {
            this.suppressionOptions = suppressionOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getTrackingOptions}
         * @param trackingOptions tracking_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
         * @return {@code this}
         */
        public Builder trackingOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions trackingOptions) {
            this.trackingOptions = trackingOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getVdmOptions}
         * @param vdmOptions vdm_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
         * @return {@code this}
         */
        public Builder vdmOptions(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions vdmOptions) {
            this.vdmOptions = vdmOptions;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getDependsOn}
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
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetConfig#getProvisioners}
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
         * @return a new instance of {@link Sesv2ConfigurationSetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetConfig {
        private final java.lang.String configurationSetName;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions deliveryOptions;
        private final java.lang.String id;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions reputationOptions;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions sendingOptions;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions suppressionOptions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions trackingOptions;
        private final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions vdmOptions;
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
            this.configurationSetName = software.amazon.jsii.Kernel.get(this, "configurationSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryOptions = software.amazon.jsii.Kernel.get(this, "deliveryOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.reputationOptions = software.amazon.jsii.Kernel.get(this, "reputationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions.class));
            this.sendingOptions = software.amazon.jsii.Kernel.get(this, "sendingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions.class));
            this.suppressionOptions = software.amazon.jsii.Kernel.get(this, "suppressionOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trackingOptions = software.amazon.jsii.Kernel.get(this, "trackingOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions.class));
            this.vdmOptions = software.amazon.jsii.Kernel.get(this, "vdmOptions", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions.class));
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
            this.configurationSetName = java.util.Objects.requireNonNull(builder.configurationSetName, "configurationSetName is required");
            this.deliveryOptions = builder.deliveryOptions;
            this.id = builder.id;
            this.reputationOptions = builder.reputationOptions;
            this.sendingOptions = builder.sendingOptions;
            this.suppressionOptions = builder.suppressionOptions;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.trackingOptions = builder.trackingOptions;
            this.vdmOptions = builder.vdmOptions;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getConfigurationSetName() {
            return this.configurationSetName;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions getDeliveryOptions() {
            return this.deliveryOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetReputationOptions getReputationOptions() {
            return this.reputationOptions;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions getSendingOptions() {
            return this.sendingOptions;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions getSuppressionOptions() {
            return this.suppressionOptions;
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
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions getTrackingOptions() {
            return this.trackingOptions;
        }

        @Override
        public final imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetVdmOptions getVdmOptions() {
            return this.vdmOptions;
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

            data.set("configurationSetName", om.valueToTree(this.getConfigurationSetName()));
            if (this.getDeliveryOptions() != null) {
                data.set("deliveryOptions", om.valueToTree(this.getDeliveryOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getReputationOptions() != null) {
                data.set("reputationOptions", om.valueToTree(this.getReputationOptions()));
            }
            if (this.getSendingOptions() != null) {
                data.set("sendingOptions", om.valueToTree(this.getSendingOptions()));
            }
            if (this.getSuppressionOptions() != null) {
                data.set("suppressionOptions", om.valueToTree(this.getSuppressionOptions()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTrackingOptions() != null) {
                data.set("trackingOptions", om.valueToTree(this.getTrackingOptions()));
            }
            if (this.getVdmOptions() != null) {
                data.set("vdmOptions", om.valueToTree(this.getVdmOptions()));
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
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetConfig.Jsii$Proxy that = (Sesv2ConfigurationSetConfig.Jsii$Proxy) o;

            if (!configurationSetName.equals(that.configurationSetName)) return false;
            if (this.deliveryOptions != null ? !this.deliveryOptions.equals(that.deliveryOptions) : that.deliveryOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.reputationOptions != null ? !this.reputationOptions.equals(that.reputationOptions) : that.reputationOptions != null) return false;
            if (this.sendingOptions != null ? !this.sendingOptions.equals(that.sendingOptions) : that.sendingOptions != null) return false;
            if (this.suppressionOptions != null ? !this.suppressionOptions.equals(that.suppressionOptions) : that.suppressionOptions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.trackingOptions != null ? !this.trackingOptions.equals(that.trackingOptions) : that.trackingOptions != null) return false;
            if (this.vdmOptions != null ? !this.vdmOptions.equals(that.vdmOptions) : that.vdmOptions != null) return false;
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
            int result = this.configurationSetName.hashCode();
            result = 31 * result + (this.deliveryOptions != null ? this.deliveryOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.reputationOptions != null ? this.reputationOptions.hashCode() : 0);
            result = 31 * result + (this.sendingOptions != null ? this.sendingOptions.hashCode() : 0);
            result = 31 * result + (this.suppressionOptions != null ? this.suppressionOptions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.trackingOptions != null ? this.trackingOptions.hashCode() : 0);
            result = 31 * result + (this.vdmOptions != null ? this.vdmOptions.hashCode() : 0);
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
