package imports.aws.data_aws_devopsguru_notification_channel;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel aws_devopsguru_notification_channel}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.548Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDevopsguruNotificationChannel.DataAwsDevopsguruNotificationChannel")
public class DataAwsDevopsguruNotificationChannel extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsDevopsguruNotificationChannel(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsDevopsguruNotificationChannel(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel aws_devopsguru_notification_channel} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsDevopsguruNotificationChannel(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsDevopsguruNotificationChannel resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsDevopsguruNotificationChannel to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsDevopsguruNotificationChannel that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsDevopsguruNotificationChannel to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsDevopsguruNotificationChannel resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsDevopsguruNotificationChannel to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsDevopsguruNotificationChannel that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putFilters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFilters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFilters> __cast_cd4240 = (java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFilters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFilters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSns> __cast_cd4240 = (java.util.List<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFilters() {
        software.amazon.jsii.Kernel.call(this, "resetFilters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSns() {
        software.amazon.jsii.Kernel.call(this, "resetSns", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFiltersList getFilters() {
        return software.amazon.jsii.Kernel.get(this, "filters", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFiltersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSnsList getSns() {
        return software.amazon.jsii.Kernel.get(this, "sns", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSnsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFiltersInput() {
        return software.amazon.jsii.Kernel.get(this, "filtersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSnsInput() {
        return software.amazon.jsii.Kernel.get(this, "snsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel> {
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
        private final imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#id DataAwsDevopsguruNotificationChannel#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#id DataAwsDevopsguruNotificationChannel#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * filters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#filters DataAwsDevopsguruNotificationChannel#filters}
         * <p>
         * @return {@code this}
         * @param filters filters block. This parameter is required.
         */
        public Builder filters(final com.hashicorp.cdktf.IResolvable filters) {
            this.config.filters(filters);
            return this;
        }
        /**
         * filters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#filters DataAwsDevopsguruNotificationChannel#filters}
         * <p>
         * @return {@code this}
         * @param filters filters block. This parameter is required.
         */
        public Builder filters(final java.util.List<? extends imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelFilters> filters) {
            this.config.filters(filters);
            return this;
        }

        /**
         * sns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#sns DataAwsDevopsguruNotificationChannel#sns}
         * <p>
         * @return {@code this}
         * @param sns sns block. This parameter is required.
         */
        public Builder sns(final com.hashicorp.cdktf.IResolvable sns) {
            this.config.sns(sns);
            return this;
        }
        /**
         * sns block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/devopsguru_notification_channel#sns DataAwsDevopsguruNotificationChannel#sns}
         * <p>
         * @return {@code this}
         * @param sns sns block. This parameter is required.
         */
        public Builder sns(final java.util.List<? extends imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannelSns> sns) {
            this.config.sns(sns);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel}.
         */
        @Override
        public imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel build() {
            return new imports.aws.data_aws_devopsguru_notification_channel.DataAwsDevopsguruNotificationChannel(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
