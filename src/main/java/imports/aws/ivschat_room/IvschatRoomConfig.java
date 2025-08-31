package imports.aws.ivschat_room;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.426Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatRoom.IvschatRoomConfig")
@software.amazon.jsii.Jsii.Proxy(IvschatRoomConfig.Jsii$Proxy.class)
public interface IvschatRoomConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#id IvschatRoom#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#logging_configuration_identifiers IvschatRoom#logging_configuration_identifiers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLoggingConfigurationIdentifiers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#maximum_message_length IvschatRoom#maximum_message_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumMessageLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#maximum_message_rate_per_second IvschatRoom#maximum_message_rate_per_second}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumMessageRatePerSecond() {
        return null;
    }

    /**
     * message_review_handler block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#message_review_handler IvschatRoom#message_review_handler}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ivschat_room.IvschatRoomMessageReviewHandler getMessageReviewHandler() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#name IvschatRoom#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#tags IvschatRoom#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#tags_all IvschatRoom#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#timeouts IvschatRoom#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ivschat_room.IvschatRoomTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IvschatRoomConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvschatRoomConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvschatRoomConfig> {
        java.lang.String id;
        java.util.List<java.lang.String> loggingConfigurationIdentifiers;
        java.lang.Number maximumMessageLength;
        java.lang.Number maximumMessageRatePerSecond;
        imports.aws.ivschat_room.IvschatRoomMessageReviewHandler messageReviewHandler;
        java.lang.String name;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.ivschat_room.IvschatRoomTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IvschatRoomConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#id IvschatRoom#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getLoggingConfigurationIdentifiers}
         * @param loggingConfigurationIdentifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#logging_configuration_identifiers IvschatRoom#logging_configuration_identifiers}.
         * @return {@code this}
         */
        public Builder loggingConfigurationIdentifiers(java.util.List<java.lang.String> loggingConfigurationIdentifiers) {
            this.loggingConfigurationIdentifiers = loggingConfigurationIdentifiers;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getMaximumMessageLength}
         * @param maximumMessageLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#maximum_message_length IvschatRoom#maximum_message_length}.
         * @return {@code this}
         */
        public Builder maximumMessageLength(java.lang.Number maximumMessageLength) {
            this.maximumMessageLength = maximumMessageLength;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getMaximumMessageRatePerSecond}
         * @param maximumMessageRatePerSecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#maximum_message_rate_per_second IvschatRoom#maximum_message_rate_per_second}.
         * @return {@code this}
         */
        public Builder maximumMessageRatePerSecond(java.lang.Number maximumMessageRatePerSecond) {
            this.maximumMessageRatePerSecond = maximumMessageRatePerSecond;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getMessageReviewHandler}
         * @param messageReviewHandler message_review_handler block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#message_review_handler IvschatRoom#message_review_handler}
         * @return {@code this}
         */
        public Builder messageReviewHandler(imports.aws.ivschat_room.IvschatRoomMessageReviewHandler messageReviewHandler) {
            this.messageReviewHandler = messageReviewHandler;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#name IvschatRoom#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#tags IvschatRoom#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#tags_all IvschatRoom#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_room#timeouts IvschatRoom#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ivschat_room.IvschatRoomTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getDependsOn}
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
         * Sets the value of {@link IvschatRoomConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IvschatRoomConfig#getProvisioners}
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
         * @return a new instance of {@link IvschatRoomConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvschatRoomConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvschatRoomConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvschatRoomConfig {
        private final java.lang.String id;
        private final java.util.List<java.lang.String> loggingConfigurationIdentifiers;
        private final java.lang.Number maximumMessageLength;
        private final java.lang.Number maximumMessageRatePerSecond;
        private final imports.aws.ivschat_room.IvschatRoomMessageReviewHandler messageReviewHandler;
        private final java.lang.String name;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.ivschat_room.IvschatRoomTimeouts timeouts;
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
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loggingConfigurationIdentifiers = software.amazon.jsii.Kernel.get(this, "loggingConfigurationIdentifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maximumMessageLength = software.amazon.jsii.Kernel.get(this, "maximumMessageLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumMessageRatePerSecond = software.amazon.jsii.Kernel.get(this, "maximumMessageRatePerSecond", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.messageReviewHandler = software.amazon.jsii.Kernel.get(this, "messageReviewHandler", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_room.IvschatRoomMessageReviewHandler.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_room.IvschatRoomTimeouts.class));
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
            this.id = builder.id;
            this.loggingConfigurationIdentifiers = builder.loggingConfigurationIdentifiers;
            this.maximumMessageLength = builder.maximumMessageLength;
            this.maximumMessageRatePerSecond = builder.maximumMessageRatePerSecond;
            this.messageReviewHandler = builder.messageReviewHandler;
            this.name = builder.name;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
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
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getLoggingConfigurationIdentifiers() {
            return this.loggingConfigurationIdentifiers;
        }

        @Override
        public final java.lang.Number getMaximumMessageLength() {
            return this.maximumMessageLength;
        }

        @Override
        public final java.lang.Number getMaximumMessageRatePerSecond() {
            return this.maximumMessageRatePerSecond;
        }

        @Override
        public final imports.aws.ivschat_room.IvschatRoomMessageReviewHandler getMessageReviewHandler() {
            return this.messageReviewHandler;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
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
        public final imports.aws.ivschat_room.IvschatRoomTimeouts getTimeouts() {
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

            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLoggingConfigurationIdentifiers() != null) {
                data.set("loggingConfigurationIdentifiers", om.valueToTree(this.getLoggingConfigurationIdentifiers()));
            }
            if (this.getMaximumMessageLength() != null) {
                data.set("maximumMessageLength", om.valueToTree(this.getMaximumMessageLength()));
            }
            if (this.getMaximumMessageRatePerSecond() != null) {
                data.set("maximumMessageRatePerSecond", om.valueToTree(this.getMaximumMessageRatePerSecond()));
            }
            if (this.getMessageReviewHandler() != null) {
                data.set("messageReviewHandler", om.valueToTree(this.getMessageReviewHandler()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
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
            struct.set("fqn", om.valueToTree("aws.ivschatRoom.IvschatRoomConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvschatRoomConfig.Jsii$Proxy that = (IvschatRoomConfig.Jsii$Proxy) o;

            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.loggingConfigurationIdentifiers != null ? !this.loggingConfigurationIdentifiers.equals(that.loggingConfigurationIdentifiers) : that.loggingConfigurationIdentifiers != null) return false;
            if (this.maximumMessageLength != null ? !this.maximumMessageLength.equals(that.maximumMessageLength) : that.maximumMessageLength != null) return false;
            if (this.maximumMessageRatePerSecond != null ? !this.maximumMessageRatePerSecond.equals(that.maximumMessageRatePerSecond) : that.maximumMessageRatePerSecond != null) return false;
            if (this.messageReviewHandler != null ? !this.messageReviewHandler.equals(that.messageReviewHandler) : that.messageReviewHandler != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.id != null ? this.id.hashCode() : 0;
            result = 31 * result + (this.loggingConfigurationIdentifiers != null ? this.loggingConfigurationIdentifiers.hashCode() : 0);
            result = 31 * result + (this.maximumMessageLength != null ? this.maximumMessageLength.hashCode() : 0);
            result = 31 * result + (this.maximumMessageRatePerSecond != null ? this.maximumMessageRatePerSecond.hashCode() : 0);
            result = 31 * result + (this.messageReviewHandler != null ? this.messageReviewHandler.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
