package imports.aws.cloudwatch_log_delivery;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.282Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogDelivery.CloudwatchLogDeliveryConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchLogDeliveryConfig.Jsii$Proxy.class)
public interface CloudwatchLogDeliveryConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_destination_arn CloudwatchLogDelivery#delivery_destination_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeliveryDestinationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_source_name CloudwatchLogDelivery#delivery_source_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeliverySourceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#field_delimiter CloudwatchLogDelivery#field_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFieldDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#record_fields CloudwatchLogDelivery#record_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecordFields() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3DeliveryConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#tags CloudwatchLogDelivery#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchLogDeliveryConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchLogDeliveryConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchLogDeliveryConfig> {
        java.lang.String deliveryDestinationArn;
        java.lang.String deliverySourceName;
        java.lang.String fieldDelimiter;
        java.util.List<java.lang.String> recordFields;
        java.lang.Object s3DeliveryConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getDeliveryDestinationArn}
         * @param deliveryDestinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_destination_arn CloudwatchLogDelivery#delivery_destination_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder deliveryDestinationArn(java.lang.String deliveryDestinationArn) {
            this.deliveryDestinationArn = deliveryDestinationArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getDeliverySourceName}
         * @param deliverySourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_source_name CloudwatchLogDelivery#delivery_source_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deliverySourceName(java.lang.String deliverySourceName) {
            this.deliverySourceName = deliverySourceName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getFieldDelimiter}
         * @param fieldDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#field_delimiter CloudwatchLogDelivery#field_delimiter}.
         * @return {@code this}
         */
        public Builder fieldDelimiter(java.lang.String fieldDelimiter) {
            this.fieldDelimiter = fieldDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getRecordFields}
         * @param recordFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#record_fields CloudwatchLogDelivery#record_fields}.
         * @return {@code this}
         */
        public Builder recordFields(java.util.List<java.lang.String> recordFields) {
            this.recordFields = recordFields;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getS3DeliveryConfiguration}
         * @param s3DeliveryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}.
         * @return {@code this}
         */
        public Builder s3DeliveryConfiguration(com.hashicorp.cdktf.IResolvable s3DeliveryConfiguration) {
            this.s3DeliveryConfiguration = s3DeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getS3DeliveryConfiguration}
         * @param s3DeliveryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}.
         * @return {@code this}
         */
        public Builder s3DeliveryConfiguration(java.util.List<? extends imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration> s3DeliveryConfiguration) {
            this.s3DeliveryConfiguration = s3DeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#tags CloudwatchLogDelivery#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getDependsOn}
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
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryConfig#getProvisioners}
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
         * @return a new instance of {@link CloudwatchLogDeliveryConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchLogDeliveryConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchLogDeliveryConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchLogDeliveryConfig {
        private final java.lang.String deliveryDestinationArn;
        private final java.lang.String deliverySourceName;
        private final java.lang.String fieldDelimiter;
        private final java.util.List<java.lang.String> recordFields;
        private final java.lang.Object s3DeliveryConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.deliveryDestinationArn = software.amazon.jsii.Kernel.get(this, "deliveryDestinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliverySourceName = software.amazon.jsii.Kernel.get(this, "deliverySourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldDelimiter = software.amazon.jsii.Kernel.get(this, "fieldDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordFields = software.amazon.jsii.Kernel.get(this, "recordFields", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3DeliveryConfiguration = software.amazon.jsii.Kernel.get(this, "s3DeliveryConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.deliveryDestinationArn = java.util.Objects.requireNonNull(builder.deliveryDestinationArn, "deliveryDestinationArn is required");
            this.deliverySourceName = java.util.Objects.requireNonNull(builder.deliverySourceName, "deliverySourceName is required");
            this.fieldDelimiter = builder.fieldDelimiter;
            this.recordFields = builder.recordFields;
            this.s3DeliveryConfiguration = builder.s3DeliveryConfiguration;
            this.tags = builder.tags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDeliveryDestinationArn() {
            return this.deliveryDestinationArn;
        }

        @Override
        public final java.lang.String getDeliverySourceName() {
            return this.deliverySourceName;
        }

        @Override
        public final java.lang.String getFieldDelimiter() {
            return this.fieldDelimiter;
        }

        @Override
        public final java.util.List<java.lang.String> getRecordFields() {
            return this.recordFields;
        }

        @Override
        public final java.lang.Object getS3DeliveryConfiguration() {
            return this.s3DeliveryConfiguration;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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

            data.set("deliveryDestinationArn", om.valueToTree(this.getDeliveryDestinationArn()));
            data.set("deliverySourceName", om.valueToTree(this.getDeliverySourceName()));
            if (this.getFieldDelimiter() != null) {
                data.set("fieldDelimiter", om.valueToTree(this.getFieldDelimiter()));
            }
            if (this.getRecordFields() != null) {
                data.set("recordFields", om.valueToTree(this.getRecordFields()));
            }
            if (this.getS3DeliveryConfiguration() != null) {
                data.set("s3DeliveryConfiguration", om.valueToTree(this.getS3DeliveryConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.cloudwatchLogDelivery.CloudwatchLogDeliveryConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchLogDeliveryConfig.Jsii$Proxy that = (CloudwatchLogDeliveryConfig.Jsii$Proxy) o;

            if (!deliveryDestinationArn.equals(that.deliveryDestinationArn)) return false;
            if (!deliverySourceName.equals(that.deliverySourceName)) return false;
            if (this.fieldDelimiter != null ? !this.fieldDelimiter.equals(that.fieldDelimiter) : that.fieldDelimiter != null) return false;
            if (this.recordFields != null ? !this.recordFields.equals(that.recordFields) : that.recordFields != null) return false;
            if (this.s3DeliveryConfiguration != null ? !this.s3DeliveryConfiguration.equals(that.s3DeliveryConfiguration) : that.s3DeliveryConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.deliveryDestinationArn.hashCode();
            result = 31 * result + (this.deliverySourceName.hashCode());
            result = 31 * result + (this.fieldDelimiter != null ? this.fieldDelimiter.hashCode() : 0);
            result = 31 * result + (this.recordFields != null ? this.recordFields.hashCode() : 0);
            result = 31 * result + (this.s3DeliveryConfiguration != null ? this.s3DeliveryConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
