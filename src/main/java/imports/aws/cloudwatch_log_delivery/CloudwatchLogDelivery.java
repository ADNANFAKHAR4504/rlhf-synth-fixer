package imports.aws.cloudwatch_log_delivery;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery aws_cloudwatch_log_delivery}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.282Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogDelivery.CloudwatchLogDelivery")
public class CloudwatchLogDelivery extends com.hashicorp.cdktf.TerraformResource {

    protected CloudwatchLogDelivery(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchLogDelivery(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery aws_cloudwatch_log_delivery} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudwatchLogDelivery(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchLogDelivery resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchLogDelivery to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchLogDelivery that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudwatchLogDelivery to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchLogDelivery resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchLogDelivery to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchLogDelivery that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putS3DeliveryConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putS3DeliveryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFieldDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetFieldDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordFields() {
        software.amazon.jsii.Kernel.call(this, "resetRecordFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3DeliveryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetS3DeliveryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfigurationList getS3DeliveryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "s3DeliveryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryDestinationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryDestinationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliverySourceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deliverySourceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecordFieldsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "recordFieldsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3DeliveryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3DeliveryConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryDestinationArn() {
        return software.amazon.jsii.Kernel.get(this, "deliveryDestinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryDestinationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryDestinationArn", java.util.Objects.requireNonNull(value, "deliveryDestinationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliverySourceName() {
        return software.amazon.jsii.Kernel.get(this, "deliverySourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliverySourceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliverySourceName", java.util.Objects.requireNonNull(value, "deliverySourceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFieldDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "fieldDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFieldDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fieldDelimiter", java.util.Objects.requireNonNull(value, "fieldDelimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRecordFields() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "recordFields", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRecordFields(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "recordFields", java.util.Objects.requireNonNull(value, "recordFields is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery> {
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
        private final imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_destination_arn CloudwatchLogDelivery#delivery_destination_arn}.
         * <p>
         * @return {@code this}
         * @param deliveryDestinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_destination_arn CloudwatchLogDelivery#delivery_destination_arn}. This parameter is required.
         */
        public Builder deliveryDestinationArn(final java.lang.String deliveryDestinationArn) {
            this.config.deliveryDestinationArn(deliveryDestinationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_source_name CloudwatchLogDelivery#delivery_source_name}.
         * <p>
         * @return {@code this}
         * @param deliverySourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#delivery_source_name CloudwatchLogDelivery#delivery_source_name}. This parameter is required.
         */
        public Builder deliverySourceName(final java.lang.String deliverySourceName) {
            this.config.deliverySourceName(deliverySourceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#field_delimiter CloudwatchLogDelivery#field_delimiter}.
         * <p>
         * @return {@code this}
         * @param fieldDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#field_delimiter CloudwatchLogDelivery#field_delimiter}. This parameter is required.
         */
        public Builder fieldDelimiter(final java.lang.String fieldDelimiter) {
            this.config.fieldDelimiter(fieldDelimiter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#record_fields CloudwatchLogDelivery#record_fields}.
         * <p>
         * @return {@code this}
         * @param recordFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#record_fields CloudwatchLogDelivery#record_fields}. This parameter is required.
         */
        public Builder recordFields(final java.util.List<java.lang.String> recordFields) {
            this.config.recordFields(recordFields);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}.
         * <p>
         * @return {@code this}
         * @param s3DeliveryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}. This parameter is required.
         */
        public Builder s3DeliveryConfiguration(final com.hashicorp.cdktf.IResolvable s3DeliveryConfiguration) {
            this.config.s3DeliveryConfiguration(s3DeliveryConfiguration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}.
         * <p>
         * @return {@code this}
         * @param s3DeliveryConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#s3_delivery_configuration CloudwatchLogDelivery#s3_delivery_configuration}. This parameter is required.
         */
        public Builder s3DeliveryConfiguration(final java.util.List<? extends imports.aws.cloudwatch_log_delivery.CloudwatchLogDeliveryS3DeliveryConfiguration> s3DeliveryConfiguration) {
            this.config.s3DeliveryConfiguration(s3DeliveryConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#tags CloudwatchLogDelivery#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#tags CloudwatchLogDelivery#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery}.
         */
        @Override
        public imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery build() {
            return new imports.aws.cloudwatch_log_delivery.CloudwatchLogDelivery(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
