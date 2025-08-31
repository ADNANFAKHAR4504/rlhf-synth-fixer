package imports.aws.appsync_source_api_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncSourceApiAssociation.AppsyncSourceApiAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncSourceApiAssociationConfig.Jsii$Proxy.class)
public interface AppsyncSourceApiAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#description AppsyncSourceApiAssociation#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_arn AppsyncSourceApiAssociation#merged_api_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMergedApiArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_id AppsyncSourceApiAssociation#merged_api_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMergedApiId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_arn AppsyncSourceApiAssociation#source_api_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceApiArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceApiAssociationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_id AppsyncSourceApiAssociation#source_api_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceApiId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#timeouts AppsyncSourceApiAssociation#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncSourceApiAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncSourceApiAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncSourceApiAssociationConfig> {
        java.lang.String description;
        java.lang.String mergedApiArn;
        java.lang.String mergedApiId;
        java.lang.String sourceApiArn;
        java.lang.Object sourceApiAssociationConfig;
        java.lang.String sourceApiId;
        imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#description AppsyncSourceApiAssociation#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getMergedApiArn}
         * @param mergedApiArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_arn AppsyncSourceApiAssociation#merged_api_arn}.
         * @return {@code this}
         */
        public Builder mergedApiArn(java.lang.String mergedApiArn) {
            this.mergedApiArn = mergedApiArn;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getMergedApiId}
         * @param mergedApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_id AppsyncSourceApiAssociation#merged_api_id}.
         * @return {@code this}
         */
        public Builder mergedApiId(java.lang.String mergedApiId) {
            this.mergedApiId = mergedApiId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getSourceApiArn}
         * @param sourceApiArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_arn AppsyncSourceApiAssociation#source_api_arn}.
         * @return {@code this}
         */
        public Builder sourceApiArn(java.lang.String sourceApiArn) {
            this.sourceApiArn = sourceApiArn;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getSourceApiAssociationConfig}
         * @param sourceApiAssociationConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}.
         * @return {@code this}
         */
        public Builder sourceApiAssociationConfig(com.hashicorp.cdktf.IResolvable sourceApiAssociationConfig) {
            this.sourceApiAssociationConfig = sourceApiAssociationConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getSourceApiAssociationConfig}
         * @param sourceApiAssociationConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}.
         * @return {@code this}
         */
        public Builder sourceApiAssociationConfig(java.util.List<? extends imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig> sourceApiAssociationConfig) {
            this.sourceApiAssociationConfig = sourceApiAssociationConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getSourceApiId}
         * @param sourceApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_id AppsyncSourceApiAssociation#source_api_id}.
         * @return {@code this}
         */
        public Builder sourceApiId(java.lang.String sourceApiId) {
            this.sourceApiId = sourceApiId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#timeouts AppsyncSourceApiAssociation#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getDependsOn}
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
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncSourceApiAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link AppsyncSourceApiAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncSourceApiAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncSourceApiAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncSourceApiAssociationConfig {
        private final java.lang.String description;
        private final java.lang.String mergedApiArn;
        private final java.lang.String mergedApiId;
        private final java.lang.String sourceApiArn;
        private final java.lang.Object sourceApiAssociationConfig;
        private final java.lang.String sourceApiId;
        private final imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts timeouts;
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
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mergedApiArn = software.amazon.jsii.Kernel.get(this, "mergedApiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mergedApiId = software.amazon.jsii.Kernel.get(this, "mergedApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceApiArn = software.amazon.jsii.Kernel.get(this, "sourceApiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceApiAssociationConfig = software.amazon.jsii.Kernel.get(this, "sourceApiAssociationConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceApiId = software.amazon.jsii.Kernel.get(this, "sourceApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts.class));
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
            this.description = builder.description;
            this.mergedApiArn = builder.mergedApiArn;
            this.mergedApiId = builder.mergedApiId;
            this.sourceApiArn = builder.sourceApiArn;
            this.sourceApiAssociationConfig = builder.sourceApiAssociationConfig;
            this.sourceApiId = builder.sourceApiId;
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
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getMergedApiArn() {
            return this.mergedApiArn;
        }

        @Override
        public final java.lang.String getMergedApiId() {
            return this.mergedApiId;
        }

        @Override
        public final java.lang.String getSourceApiArn() {
            return this.sourceApiArn;
        }

        @Override
        public final java.lang.Object getSourceApiAssociationConfig() {
            return this.sourceApiAssociationConfig;
        }

        @Override
        public final java.lang.String getSourceApiId() {
            return this.sourceApiId;
        }

        @Override
        public final imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts getTimeouts() {
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

            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getMergedApiArn() != null) {
                data.set("mergedApiArn", om.valueToTree(this.getMergedApiArn()));
            }
            if (this.getMergedApiId() != null) {
                data.set("mergedApiId", om.valueToTree(this.getMergedApiId()));
            }
            if (this.getSourceApiArn() != null) {
                data.set("sourceApiArn", om.valueToTree(this.getSourceApiArn()));
            }
            if (this.getSourceApiAssociationConfig() != null) {
                data.set("sourceApiAssociationConfig", om.valueToTree(this.getSourceApiAssociationConfig()));
            }
            if (this.getSourceApiId() != null) {
                data.set("sourceApiId", om.valueToTree(this.getSourceApiId()));
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
            struct.set("fqn", om.valueToTree("aws.appsyncSourceApiAssociation.AppsyncSourceApiAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncSourceApiAssociationConfig.Jsii$Proxy that = (AppsyncSourceApiAssociationConfig.Jsii$Proxy) o;

            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.mergedApiArn != null ? !this.mergedApiArn.equals(that.mergedApiArn) : that.mergedApiArn != null) return false;
            if (this.mergedApiId != null ? !this.mergedApiId.equals(that.mergedApiId) : that.mergedApiId != null) return false;
            if (this.sourceApiArn != null ? !this.sourceApiArn.equals(that.sourceApiArn) : that.sourceApiArn != null) return false;
            if (this.sourceApiAssociationConfig != null ? !this.sourceApiAssociationConfig.equals(that.sourceApiAssociationConfig) : that.sourceApiAssociationConfig != null) return false;
            if (this.sourceApiId != null ? !this.sourceApiId.equals(that.sourceApiId) : that.sourceApiId != null) return false;
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
            int result = this.description != null ? this.description.hashCode() : 0;
            result = 31 * result + (this.mergedApiArn != null ? this.mergedApiArn.hashCode() : 0);
            result = 31 * result + (this.mergedApiId != null ? this.mergedApiId.hashCode() : 0);
            result = 31 * result + (this.sourceApiArn != null ? this.sourceApiArn.hashCode() : 0);
            result = 31 * result + (this.sourceApiAssociationConfig != null ? this.sourceApiAssociationConfig.hashCode() : 0);
            result = 31 * result + (this.sourceApiId != null ? this.sourceApiId.hashCode() : 0);
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
