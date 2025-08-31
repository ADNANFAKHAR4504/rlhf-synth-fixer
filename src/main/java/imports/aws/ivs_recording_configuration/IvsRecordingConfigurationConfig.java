package imports.aws.ivs_recording_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.424Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivsRecordingConfiguration.IvsRecordingConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(IvsRecordingConfigurationConfig.Jsii$Proxy.class)
public interface IvsRecordingConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * destination_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#destination_configuration IvsRecordingConfiguration#destination_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration getDestinationConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#id IvsRecordingConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#name IvsRecordingConfiguration#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#recording_reconnect_window_seconds IvsRecordingConfiguration#recording_reconnect_window_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRecordingReconnectWindowSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#tags IvsRecordingConfiguration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#tags_all IvsRecordingConfiguration#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * thumbnail_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#thumbnail_configuration IvsRecordingConfiguration#thumbnail_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration getThumbnailConfiguration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#timeouts IvsRecordingConfiguration#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IvsRecordingConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvsRecordingConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvsRecordingConfigurationConfig> {
        imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration destinationConfiguration;
        java.lang.String id;
        java.lang.String name;
        java.lang.Number recordingReconnectWindowSeconds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration thumbnailConfiguration;
        imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getDestinationConfiguration}
         * @param destinationConfiguration destination_configuration block. This parameter is required.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#destination_configuration IvsRecordingConfiguration#destination_configuration}
         * @return {@code this}
         */
        public Builder destinationConfiguration(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration destinationConfiguration) {
            this.destinationConfiguration = destinationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#id IvsRecordingConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#name IvsRecordingConfiguration#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getRecordingReconnectWindowSeconds}
         * @param recordingReconnectWindowSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#recording_reconnect_window_seconds IvsRecordingConfiguration#recording_reconnect_window_seconds}.
         * @return {@code this}
         */
        public Builder recordingReconnectWindowSeconds(java.lang.Number recordingReconnectWindowSeconds) {
            this.recordingReconnectWindowSeconds = recordingReconnectWindowSeconds;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#tags IvsRecordingConfiguration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#tags_all IvsRecordingConfiguration#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getThumbnailConfiguration}
         * @param thumbnailConfiguration thumbnail_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#thumbnail_configuration IvsRecordingConfiguration#thumbnail_configuration}
         * @return {@code this}
         */
        public Builder thumbnailConfiguration(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration thumbnailConfiguration) {
            this.thumbnailConfiguration = thumbnailConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#timeouts IvsRecordingConfiguration#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link IvsRecordingConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IvsRecordingConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link IvsRecordingConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvsRecordingConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvsRecordingConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvsRecordingConfigurationConfig {
        private final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration destinationConfiguration;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.Number recordingReconnectWindowSeconds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration thumbnailConfiguration;
        private final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts timeouts;
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
            this.destinationConfiguration = software.amazon.jsii.Kernel.get(this, "destinationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordingReconnectWindowSeconds = software.amazon.jsii.Kernel.get(this, "recordingReconnectWindowSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.thumbnailConfiguration = software.amazon.jsii.Kernel.get(this, "thumbnailConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts.class));
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
            this.destinationConfiguration = java.util.Objects.requireNonNull(builder.destinationConfiguration, "destinationConfiguration is required");
            this.id = builder.id;
            this.name = builder.name;
            this.recordingReconnectWindowSeconds = builder.recordingReconnectWindowSeconds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.thumbnailConfiguration = builder.thumbnailConfiguration;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationDestinationConfiguration getDestinationConfiguration() {
            return this.destinationConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getRecordingReconnectWindowSeconds() {
            return this.recordingReconnectWindowSeconds;
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
        public final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationThumbnailConfiguration getThumbnailConfiguration() {
            return this.thumbnailConfiguration;
        }

        @Override
        public final imports.aws.ivs_recording_configuration.IvsRecordingConfigurationTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("destinationConfiguration", om.valueToTree(this.getDestinationConfiguration()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getRecordingReconnectWindowSeconds() != null) {
                data.set("recordingReconnectWindowSeconds", om.valueToTree(this.getRecordingReconnectWindowSeconds()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThumbnailConfiguration() != null) {
                data.set("thumbnailConfiguration", om.valueToTree(this.getThumbnailConfiguration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.ivsRecordingConfiguration.IvsRecordingConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvsRecordingConfigurationConfig.Jsii$Proxy that = (IvsRecordingConfigurationConfig.Jsii$Proxy) o;

            if (!destinationConfiguration.equals(that.destinationConfiguration)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.recordingReconnectWindowSeconds != null ? !this.recordingReconnectWindowSeconds.equals(that.recordingReconnectWindowSeconds) : that.recordingReconnectWindowSeconds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.thumbnailConfiguration != null ? !this.thumbnailConfiguration.equals(that.thumbnailConfiguration) : that.thumbnailConfiguration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.destinationConfiguration.hashCode();
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.recordingReconnectWindowSeconds != null ? this.recordingReconnectWindowSeconds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.thumbnailConfiguration != null ? this.thumbnailConfiguration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
