package imports.aws.qbusiness_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.093Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.qbusinessApplication.QbusinessApplicationConfig")
@software.amazon.jsii.Jsii.Proxy(QbusinessApplicationConfig.Jsii$Proxy.class)
public interface QbusinessApplicationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * The display name of the Amazon Q application.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#display_name QbusinessApplication#display_name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayName();

    /**
     * The Amazon Resource Name (ARN) of the IAM service role that provides permissions for the Amazon Q application.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#iam_service_role_arn QbusinessApplication#iam_service_role_arn}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamServiceRoleArn();

    /**
     * ARN of the IAM Identity Center instance you are either creating for—or connecting to—your Amazon Q Business application.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#identity_center_instance_arn QbusinessApplication#identity_center_instance_arn}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityCenterInstanceArn();

    /**
     * attachments_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#attachments_configuration QbusinessApplication#attachments_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAttachmentsConfiguration() {
        return null;
    }

    /**
     * A description of the Amazon Q application.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#description QbusinessApplication#description}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#encryption_configuration QbusinessApplication#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#tags QbusinessApplication#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#timeouts QbusinessApplication#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.qbusiness_application.QbusinessApplicationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QbusinessApplicationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QbusinessApplicationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QbusinessApplicationConfig> {
        java.lang.String displayName;
        java.lang.String iamServiceRoleArn;
        java.lang.String identityCenterInstanceArn;
        java.lang.Object attachmentsConfiguration;
        java.lang.String description;
        java.lang.Object encryptionConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.qbusiness_application.QbusinessApplicationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getDisplayName}
         * @param displayName The display name of the Amazon Q application. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#display_name QbusinessApplication#display_name}
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getIamServiceRoleArn}
         * @param iamServiceRoleArn The Amazon Resource Name (ARN) of the IAM service role that provides permissions for the Amazon Q application. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#iam_service_role_arn QbusinessApplication#iam_service_role_arn}
         * @return {@code this}
         */
        public Builder iamServiceRoleArn(java.lang.String iamServiceRoleArn) {
            this.iamServiceRoleArn = iamServiceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getIdentityCenterInstanceArn}
         * @param identityCenterInstanceArn ARN of the IAM Identity Center instance you are either creating for—or connecting to—your Amazon Q Business application. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#identity_center_instance_arn QbusinessApplication#identity_center_instance_arn}
         * @return {@code this}
         */
        public Builder identityCenterInstanceArn(java.lang.String identityCenterInstanceArn) {
            this.identityCenterInstanceArn = identityCenterInstanceArn;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getAttachmentsConfiguration}
         * @param attachmentsConfiguration attachments_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#attachments_configuration QbusinessApplication#attachments_configuration}
         * @return {@code this}
         */
        public Builder attachmentsConfiguration(com.hashicorp.cdktf.IResolvable attachmentsConfiguration) {
            this.attachmentsConfiguration = attachmentsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getAttachmentsConfiguration}
         * @param attachmentsConfiguration attachments_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#attachments_configuration QbusinessApplication#attachments_configuration}
         * @return {@code this}
         */
        public Builder attachmentsConfiguration(java.util.List<? extends imports.aws.qbusiness_application.QbusinessApplicationAttachmentsConfiguration> attachmentsConfiguration) {
            this.attachmentsConfiguration = attachmentsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getDescription}
         * @param description A description of the Amazon Q application.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#description QbusinessApplication#description}
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#encryption_configuration QbusinessApplication#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(com.hashicorp.cdktf.IResolvable encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#encryption_configuration QbusinessApplication#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(java.util.List<? extends imports.aws.qbusiness_application.QbusinessApplicationEncryptionConfiguration> encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#tags QbusinessApplication#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#timeouts QbusinessApplication#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.qbusiness_application.QbusinessApplicationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getDependsOn}
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
         * Sets the value of {@link QbusinessApplicationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QbusinessApplicationConfig#getProvisioners}
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
         * @return a new instance of {@link QbusinessApplicationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QbusinessApplicationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QbusinessApplicationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QbusinessApplicationConfig {
        private final java.lang.String displayName;
        private final java.lang.String iamServiceRoleArn;
        private final java.lang.String identityCenterInstanceArn;
        private final java.lang.Object attachmentsConfiguration;
        private final java.lang.String description;
        private final java.lang.Object encryptionConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.qbusiness_application.QbusinessApplicationTimeouts timeouts;
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
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamServiceRoleArn = software.amazon.jsii.Kernel.get(this, "iamServiceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityCenterInstanceArn = software.amazon.jsii.Kernel.get(this, "identityCenterInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attachmentsConfiguration = software.amazon.jsii.Kernel.get(this, "attachmentsConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.qbusiness_application.QbusinessApplicationTimeouts.class));
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
            this.displayName = java.util.Objects.requireNonNull(builder.displayName, "displayName is required");
            this.iamServiceRoleArn = java.util.Objects.requireNonNull(builder.iamServiceRoleArn, "iamServiceRoleArn is required");
            this.identityCenterInstanceArn = java.util.Objects.requireNonNull(builder.identityCenterInstanceArn, "identityCenterInstanceArn is required");
            this.attachmentsConfiguration = builder.attachmentsConfiguration;
            this.description = builder.description;
            this.encryptionConfiguration = builder.encryptionConfiguration;
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
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.String getIamServiceRoleArn() {
            return this.iamServiceRoleArn;
        }

        @Override
        public final java.lang.String getIdentityCenterInstanceArn() {
            return this.identityCenterInstanceArn;
        }

        @Override
        public final java.lang.Object getAttachmentsConfiguration() {
            return this.attachmentsConfiguration;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.qbusiness_application.QbusinessApplicationTimeouts getTimeouts() {
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

            data.set("displayName", om.valueToTree(this.getDisplayName()));
            data.set("iamServiceRoleArn", om.valueToTree(this.getIamServiceRoleArn()));
            data.set("identityCenterInstanceArn", om.valueToTree(this.getIdentityCenterInstanceArn()));
            if (this.getAttachmentsConfiguration() != null) {
                data.set("attachmentsConfiguration", om.valueToTree(this.getAttachmentsConfiguration()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.qbusinessApplication.QbusinessApplicationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QbusinessApplicationConfig.Jsii$Proxy that = (QbusinessApplicationConfig.Jsii$Proxy) o;

            if (!displayName.equals(that.displayName)) return false;
            if (!iamServiceRoleArn.equals(that.iamServiceRoleArn)) return false;
            if (!identityCenterInstanceArn.equals(that.identityCenterInstanceArn)) return false;
            if (this.attachmentsConfiguration != null ? !this.attachmentsConfiguration.equals(that.attachmentsConfiguration) : that.attachmentsConfiguration != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
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
            int result = this.displayName.hashCode();
            result = 31 * result + (this.iamServiceRoleArn.hashCode());
            result = 31 * result + (this.identityCenterInstanceArn.hashCode());
            result = 31 * result + (this.attachmentsConfiguration != null ? this.attachmentsConfiguration.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
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
