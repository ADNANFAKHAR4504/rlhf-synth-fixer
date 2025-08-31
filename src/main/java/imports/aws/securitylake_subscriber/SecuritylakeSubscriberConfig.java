package imports.aws.securitylake_subscriber;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.421Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriber.SecuritylakeSubscriberConfig")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberConfig.Jsii$Proxy.class)
public interface SecuritylakeSubscriberConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#access_type SecuritylakeSubscriber#access_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessType() {
        return null;
    }

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source SecuritylakeSubscriber#source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_description SecuritylakeSubscriber#subscriber_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubscriberDescription() {
        return null;
    }

    /**
     * subscriber_identity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_identity SecuritylakeSubscriber#subscriber_identity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubscriberIdentity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_name SecuritylakeSubscriber#subscriber_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubscriberName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#tags SecuritylakeSubscriber#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#timeouts SecuritylakeSubscriber#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberConfig> {
        java.lang.String accessType;
        java.lang.Object source;
        java.lang.String subscriberDescription;
        java.lang.Object subscriberIdentity;
        java.lang.String subscriberName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getAccessType}
         * @param accessType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#access_type SecuritylakeSubscriber#access_type}.
         * @return {@code this}
         */
        public Builder accessType(java.lang.String accessType) {
            this.accessType = accessType;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source SecuritylakeSubscriber#source}
         * @return {@code this}
         */
        public Builder source(com.hashicorp.cdktf.IResolvable source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source SecuritylakeSubscriber#source}
         * @return {@code this}
         */
        public Builder source(java.util.List<? extends imports.aws.securitylake_subscriber.SecuritylakeSubscriberSource> source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSubscriberDescription}
         * @param subscriberDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_description SecuritylakeSubscriber#subscriber_description}.
         * @return {@code this}
         */
        public Builder subscriberDescription(java.lang.String subscriberDescription) {
            this.subscriberDescription = subscriberDescription;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSubscriberIdentity}
         * @param subscriberIdentity subscriber_identity block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_identity SecuritylakeSubscriber#subscriber_identity}
         * @return {@code this}
         */
        public Builder subscriberIdentity(com.hashicorp.cdktf.IResolvable subscriberIdentity) {
            this.subscriberIdentity = subscriberIdentity;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSubscriberIdentity}
         * @param subscriberIdentity subscriber_identity block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_identity SecuritylakeSubscriber#subscriber_identity}
         * @return {@code this}
         */
        public Builder subscriberIdentity(java.util.List<? extends imports.aws.securitylake_subscriber.SecuritylakeSubscriberSubscriberIdentity> subscriberIdentity) {
            this.subscriberIdentity = subscriberIdentity;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getSubscriberName}
         * @param subscriberName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#subscriber_name SecuritylakeSubscriber#subscriber_name}.
         * @return {@code this}
         */
        public Builder subscriberName(java.lang.String subscriberName) {
            this.subscriberName = subscriberName;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#tags SecuritylakeSubscriber#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#timeouts SecuritylakeSubscriber#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getDependsOn}
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
         * Sets the value of {@link SecuritylakeSubscriberConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberConfig#getProvisioners}
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
         * @return a new instance of {@link SecuritylakeSubscriberConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberConfig {
        private final java.lang.String accessType;
        private final java.lang.Object source;
        private final java.lang.String subscriberDescription;
        private final java.lang.Object subscriberIdentity;
        private final java.lang.String subscriberName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts timeouts;
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
            this.accessType = software.amazon.jsii.Kernel.get(this, "accessType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.subscriberDescription = software.amazon.jsii.Kernel.get(this, "subscriberDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subscriberIdentity = software.amazon.jsii.Kernel.get(this, "subscriberIdentity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.subscriberName = software.amazon.jsii.Kernel.get(this, "subscriberName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts.class));
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
            this.accessType = builder.accessType;
            this.source = builder.source;
            this.subscriberDescription = builder.subscriberDescription;
            this.subscriberIdentity = builder.subscriberIdentity;
            this.subscriberName = builder.subscriberName;
            this.tags = builder.tags;
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
        public final java.lang.String getAccessType() {
            return this.accessType;
        }

        @Override
        public final java.lang.Object getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getSubscriberDescription() {
            return this.subscriberDescription;
        }

        @Override
        public final java.lang.Object getSubscriberIdentity() {
            return this.subscriberIdentity;
        }

        @Override
        public final java.lang.String getSubscriberName() {
            return this.subscriberName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.securitylake_subscriber.SecuritylakeSubscriberTimeouts getTimeouts() {
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

            if (this.getAccessType() != null) {
                data.set("accessType", om.valueToTree(this.getAccessType()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }
            if (this.getSubscriberDescription() != null) {
                data.set("subscriberDescription", om.valueToTree(this.getSubscriberDescription()));
            }
            if (this.getSubscriberIdentity() != null) {
                data.set("subscriberIdentity", om.valueToTree(this.getSubscriberIdentity()));
            }
            if (this.getSubscriberName() != null) {
                data.set("subscriberName", om.valueToTree(this.getSubscriberName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriber.SecuritylakeSubscriberConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberConfig.Jsii$Proxy that = (SecuritylakeSubscriberConfig.Jsii$Proxy) o;

            if (this.accessType != null ? !this.accessType.equals(that.accessType) : that.accessType != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
            if (this.subscriberDescription != null ? !this.subscriberDescription.equals(that.subscriberDescription) : that.subscriberDescription != null) return false;
            if (this.subscriberIdentity != null ? !this.subscriberIdentity.equals(that.subscriberIdentity) : that.subscriberIdentity != null) return false;
            if (this.subscriberName != null ? !this.subscriberName.equals(that.subscriberName) : that.subscriberName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.accessType != null ? this.accessType.hashCode() : 0;
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
            result = 31 * result + (this.subscriberDescription != null ? this.subscriberDescription.hashCode() : 0);
            result = 31 * result + (this.subscriberIdentity != null ? this.subscriberIdentity.hashCode() : 0);
            result = 31 * result + (this.subscriberName != null ? this.subscriberName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
