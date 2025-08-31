package imports.aws.qldb_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.095Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.qldbStream.QldbStreamConfig")
@software.amazon.jsii.Jsii.Proxy(QldbStreamConfig.Jsii$Proxy.class)
public interface QldbStreamConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#inclusive_start_time QldbStream#inclusive_start_time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInclusiveStartTime();

    /**
     * kinesis_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#kinesis_configuration QldbStream#kinesis_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.qldb_stream.QldbStreamKinesisConfiguration getKinesisConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#ledger_name QldbStream#ledger_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLedgerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#role_arn QldbStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#stream_name QldbStream#stream_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStreamName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#exclusive_end_time QldbStream#exclusive_end_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExclusiveEndTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#id QldbStream#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#tags QldbStream#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#tags_all QldbStream#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#timeouts QldbStream#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.qldb_stream.QldbStreamTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QldbStreamConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QldbStreamConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QldbStreamConfig> {
        java.lang.String inclusiveStartTime;
        imports.aws.qldb_stream.QldbStreamKinesisConfiguration kinesisConfiguration;
        java.lang.String ledgerName;
        java.lang.String roleArn;
        java.lang.String streamName;
        java.lang.String exclusiveEndTime;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.qldb_stream.QldbStreamTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QldbStreamConfig#getInclusiveStartTime}
         * @param inclusiveStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#inclusive_start_time QldbStream#inclusive_start_time}. This parameter is required.
         * @return {@code this}
         */
        public Builder inclusiveStartTime(java.lang.String inclusiveStartTime) {
            this.inclusiveStartTime = inclusiveStartTime;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getKinesisConfiguration}
         * @param kinesisConfiguration kinesis_configuration block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#kinesis_configuration QldbStream#kinesis_configuration}
         * @return {@code this}
         */
        public Builder kinesisConfiguration(imports.aws.qldb_stream.QldbStreamKinesisConfiguration kinesisConfiguration) {
            this.kinesisConfiguration = kinesisConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getLedgerName}
         * @param ledgerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#ledger_name QldbStream#ledger_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ledgerName(java.lang.String ledgerName) {
            this.ledgerName = ledgerName;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#role_arn QldbStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getStreamName}
         * @param streamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#stream_name QldbStream#stream_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder streamName(java.lang.String streamName) {
            this.streamName = streamName;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getExclusiveEndTime}
         * @param exclusiveEndTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#exclusive_end_time QldbStream#exclusive_end_time}.
         * @return {@code this}
         */
        public Builder exclusiveEndTime(java.lang.String exclusiveEndTime) {
            this.exclusiveEndTime = exclusiveEndTime;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#id QldbStream#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#tags QldbStream#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#tags_all QldbStream#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qldb_stream#timeouts QldbStream#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.qldb_stream.QldbStreamTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getDependsOn}
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
         * Sets the value of {@link QldbStreamConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QldbStreamConfig#getProvisioners}
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
         * @return a new instance of {@link QldbStreamConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QldbStreamConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QldbStreamConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QldbStreamConfig {
        private final java.lang.String inclusiveStartTime;
        private final imports.aws.qldb_stream.QldbStreamKinesisConfiguration kinesisConfiguration;
        private final java.lang.String ledgerName;
        private final java.lang.String roleArn;
        private final java.lang.String streamName;
        private final java.lang.String exclusiveEndTime;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.qldb_stream.QldbStreamTimeouts timeouts;
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
            this.inclusiveStartTime = software.amazon.jsii.Kernel.get(this, "inclusiveStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kinesisConfiguration = software.amazon.jsii.Kernel.get(this, "kinesisConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.qldb_stream.QldbStreamKinesisConfiguration.class));
            this.ledgerName = software.amazon.jsii.Kernel.get(this, "ledgerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streamName = software.amazon.jsii.Kernel.get(this, "streamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exclusiveEndTime = software.amazon.jsii.Kernel.get(this, "exclusiveEndTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.qldb_stream.QldbStreamTimeouts.class));
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
            this.inclusiveStartTime = java.util.Objects.requireNonNull(builder.inclusiveStartTime, "inclusiveStartTime is required");
            this.kinesisConfiguration = java.util.Objects.requireNonNull(builder.kinesisConfiguration, "kinesisConfiguration is required");
            this.ledgerName = java.util.Objects.requireNonNull(builder.ledgerName, "ledgerName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.streamName = java.util.Objects.requireNonNull(builder.streamName, "streamName is required");
            this.exclusiveEndTime = builder.exclusiveEndTime;
            this.id = builder.id;
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
        public final java.lang.String getInclusiveStartTime() {
            return this.inclusiveStartTime;
        }

        @Override
        public final imports.aws.qldb_stream.QldbStreamKinesisConfiguration getKinesisConfiguration() {
            return this.kinesisConfiguration;
        }

        @Override
        public final java.lang.String getLedgerName() {
            return this.ledgerName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getStreamName() {
            return this.streamName;
        }

        @Override
        public final java.lang.String getExclusiveEndTime() {
            return this.exclusiveEndTime;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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
        public final imports.aws.qldb_stream.QldbStreamTimeouts getTimeouts() {
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

            data.set("inclusiveStartTime", om.valueToTree(this.getInclusiveStartTime()));
            data.set("kinesisConfiguration", om.valueToTree(this.getKinesisConfiguration()));
            data.set("ledgerName", om.valueToTree(this.getLedgerName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("streamName", om.valueToTree(this.getStreamName()));
            if (this.getExclusiveEndTime() != null) {
                data.set("exclusiveEndTime", om.valueToTree(this.getExclusiveEndTime()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.qldbStream.QldbStreamConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QldbStreamConfig.Jsii$Proxy that = (QldbStreamConfig.Jsii$Proxy) o;

            if (!inclusiveStartTime.equals(that.inclusiveStartTime)) return false;
            if (!kinesisConfiguration.equals(that.kinesisConfiguration)) return false;
            if (!ledgerName.equals(that.ledgerName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!streamName.equals(that.streamName)) return false;
            if (this.exclusiveEndTime != null ? !this.exclusiveEndTime.equals(that.exclusiveEndTime) : that.exclusiveEndTime != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.inclusiveStartTime.hashCode();
            result = 31 * result + (this.kinesisConfiguration.hashCode());
            result = 31 * result + (this.ledgerName.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.streamName.hashCode());
            result = 31 * result + (this.exclusiveEndTime != null ? this.exclusiveEndTime.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
