package imports.aws.paymentcryptography_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKeyConfig")
@software.amazon.jsii.Jsii.Proxy(PaymentcryptographyKeyConfig.Jsii$Proxy.class)
public interface PaymentcryptographyKeyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getExportable();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#deletion_window_in_days PaymentcryptographyKey#deletion_window_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeletionWindowInDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * key_attributes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_attributes PaymentcryptographyKey#key_attributes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes getKeyAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_check_value_algorithm PaymentcryptographyKey#key_check_value_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyCheckValueAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#tags PaymentcryptographyKey#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#timeouts PaymentcryptographyKey#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PaymentcryptographyKeyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PaymentcryptographyKeyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PaymentcryptographyKeyConfig> {
        java.lang.Object exportable;
        java.lang.Number deletionWindowInDays;
        java.lang.Object enabled;
        imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes keyAttributes;
        java.lang.String keyCheckValueAlgorithm;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getExportable}
         * @param exportable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}. This parameter is required.
         * @return {@code this}
         */
        public Builder exportable(java.lang.Boolean exportable) {
            this.exportable = exportable;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getExportable}
         * @param exportable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}. This parameter is required.
         * @return {@code this}
         */
        public Builder exportable(com.hashicorp.cdktf.IResolvable exportable) {
            this.exportable = exportable;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getDeletionWindowInDays}
         * @param deletionWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#deletion_window_in_days PaymentcryptographyKey#deletion_window_in_days}.
         * @return {@code this}
         */
        public Builder deletionWindowInDays(java.lang.Number deletionWindowInDays) {
            this.deletionWindowInDays = deletionWindowInDays;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getKeyAttributes}
         * @param keyAttributes key_attributes block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_attributes PaymentcryptographyKey#key_attributes}
         * @return {@code this}
         */
        public Builder keyAttributes(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes keyAttributes) {
            this.keyAttributes = keyAttributes;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getKeyCheckValueAlgorithm}
         * @param keyCheckValueAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_check_value_algorithm PaymentcryptographyKey#key_check_value_algorithm}.
         * @return {@code this}
         */
        public Builder keyCheckValueAlgorithm(java.lang.String keyCheckValueAlgorithm) {
            this.keyCheckValueAlgorithm = keyCheckValueAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#tags PaymentcryptographyKey#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#timeouts PaymentcryptographyKey#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getDependsOn}
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
         * Sets the value of {@link PaymentcryptographyKeyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyConfig#getProvisioners}
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
         * @return a new instance of {@link PaymentcryptographyKeyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PaymentcryptographyKeyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PaymentcryptographyKeyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PaymentcryptographyKeyConfig {
        private final java.lang.Object exportable;
        private final java.lang.Number deletionWindowInDays;
        private final java.lang.Object enabled;
        private final imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes keyAttributes;
        private final java.lang.String keyCheckValueAlgorithm;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts timeouts;
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
            this.exportable = software.amazon.jsii.Kernel.get(this, "exportable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deletionWindowInDays = software.amazon.jsii.Kernel.get(this, "deletionWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.keyAttributes = software.amazon.jsii.Kernel.get(this, "keyAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes.class));
            this.keyCheckValueAlgorithm = software.amazon.jsii.Kernel.get(this, "keyCheckValueAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts.class));
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
            this.exportable = java.util.Objects.requireNonNull(builder.exportable, "exportable is required");
            this.deletionWindowInDays = builder.deletionWindowInDays;
            this.enabled = builder.enabled;
            this.keyAttributes = builder.keyAttributes;
            this.keyCheckValueAlgorithm = builder.keyCheckValueAlgorithm;
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
        public final java.lang.Object getExportable() {
            return this.exportable;
        }

        @Override
        public final java.lang.Number getDeletionWindowInDays() {
            return this.deletionWindowInDays;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes getKeyAttributes() {
            return this.keyAttributes;
        }

        @Override
        public final java.lang.String getKeyCheckValueAlgorithm() {
            return this.keyCheckValueAlgorithm;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts getTimeouts() {
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

            data.set("exportable", om.valueToTree(this.getExportable()));
            if (this.getDeletionWindowInDays() != null) {
                data.set("deletionWindowInDays", om.valueToTree(this.getDeletionWindowInDays()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getKeyAttributes() != null) {
                data.set("keyAttributes", om.valueToTree(this.getKeyAttributes()));
            }
            if (this.getKeyCheckValueAlgorithm() != null) {
                data.set("keyCheckValueAlgorithm", om.valueToTree(this.getKeyCheckValueAlgorithm()));
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
            struct.set("fqn", om.valueToTree("aws.paymentcryptographyKey.PaymentcryptographyKeyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PaymentcryptographyKeyConfig.Jsii$Proxy that = (PaymentcryptographyKeyConfig.Jsii$Proxy) o;

            if (!exportable.equals(that.exportable)) return false;
            if (this.deletionWindowInDays != null ? !this.deletionWindowInDays.equals(that.deletionWindowInDays) : that.deletionWindowInDays != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.keyAttributes != null ? !this.keyAttributes.equals(that.keyAttributes) : that.keyAttributes != null) return false;
            if (this.keyCheckValueAlgorithm != null ? !this.keyCheckValueAlgorithm.equals(that.keyCheckValueAlgorithm) : that.keyCheckValueAlgorithm != null) return false;
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
            int result = this.exportable.hashCode();
            result = 31 * result + (this.deletionWindowInDays != null ? this.deletionWindowInDays.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.keyAttributes != null ? this.keyAttributes.hashCode() : 0);
            result = 31 * result + (this.keyCheckValueAlgorithm != null ? this.keyCheckValueAlgorithm.hashCode() : 0);
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
