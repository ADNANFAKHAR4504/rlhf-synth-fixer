package imports.aws.data_aws_ami_ids;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.414Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAmiIds.DataAwsAmiIdsConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsAmiIdsConfig.Jsii$Proxy.class)
public interface DataAwsAmiIdsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#owners DataAwsAmiIds#owners}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOwners();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#executable_users DataAwsAmiIds#executable_users}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExecutableUsers() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#filter DataAwsAmiIds#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#id DataAwsAmiIds#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#include_deprecated DataAwsAmiIds#include_deprecated}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeDeprecated() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#name_regex DataAwsAmiIds#name_regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNameRegex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#sort_ascending DataAwsAmiIds#sort_ascending}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSortAscending() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#timeouts DataAwsAmiIds#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsAmiIdsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsAmiIdsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsAmiIdsConfig> {
        java.util.List<java.lang.String> owners;
        java.util.List<java.lang.String> executableUsers;
        java.lang.Object filter;
        java.lang.String id;
        java.lang.Object includeDeprecated;
        java.lang.String nameRegex;
        java.lang.Object sortAscending;
        imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getOwners}
         * @param owners Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#owners DataAwsAmiIds#owners}. This parameter is required.
         * @return {@code this}
         */
        public Builder owners(java.util.List<java.lang.String> owners) {
            this.owners = owners;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getExecutableUsers}
         * @param executableUsers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#executable_users DataAwsAmiIds#executable_users}.
         * @return {@code this}
         */
        public Builder executableUsers(java.util.List<java.lang.String> executableUsers) {
            this.executableUsers = executableUsers;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#filter DataAwsAmiIds#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#filter DataAwsAmiIds#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.data_aws_ami_ids.DataAwsAmiIdsFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#id DataAwsAmiIds#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getIncludeDeprecated}
         * @param includeDeprecated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#include_deprecated DataAwsAmiIds#include_deprecated}.
         * @return {@code this}
         */
        public Builder includeDeprecated(java.lang.Boolean includeDeprecated) {
            this.includeDeprecated = includeDeprecated;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getIncludeDeprecated}
         * @param includeDeprecated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#include_deprecated DataAwsAmiIds#include_deprecated}.
         * @return {@code this}
         */
        public Builder includeDeprecated(com.hashicorp.cdktf.IResolvable includeDeprecated) {
            this.includeDeprecated = includeDeprecated;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getNameRegex}
         * @param nameRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#name_regex DataAwsAmiIds#name_regex}.
         * @return {@code this}
         */
        public Builder nameRegex(java.lang.String nameRegex) {
            this.nameRegex = nameRegex;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getSortAscending}
         * @param sortAscending Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#sort_ascending DataAwsAmiIds#sort_ascending}.
         * @return {@code this}
         */
        public Builder sortAscending(java.lang.Boolean sortAscending) {
            this.sortAscending = sortAscending;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getSortAscending}
         * @param sortAscending Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#sort_ascending DataAwsAmiIds#sort_ascending}.
         * @return {@code this}
         */
        public Builder sortAscending(com.hashicorp.cdktf.IResolvable sortAscending) {
            this.sortAscending = sortAscending;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ami_ids#timeouts DataAwsAmiIds#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsAmiIdsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAmiIdsConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsAmiIdsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsAmiIdsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsAmiIdsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsAmiIdsConfig {
        private final java.util.List<java.lang.String> owners;
        private final java.util.List<java.lang.String> executableUsers;
        private final java.lang.Object filter;
        private final java.lang.String id;
        private final java.lang.Object includeDeprecated;
        private final java.lang.String nameRegex;
        private final java.lang.Object sortAscending;
        private final imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts timeouts;
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
            this.owners = software.amazon.jsii.Kernel.get(this, "owners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.executableUsers = software.amazon.jsii.Kernel.get(this, "executableUsers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeDeprecated = software.amazon.jsii.Kernel.get(this, "includeDeprecated", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.nameRegex = software.amazon.jsii.Kernel.get(this, "nameRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sortAscending = software.amazon.jsii.Kernel.get(this, "sortAscending", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts.class));
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
            this.owners = java.util.Objects.requireNonNull(builder.owners, "owners is required");
            this.executableUsers = builder.executableUsers;
            this.filter = builder.filter;
            this.id = builder.id;
            this.includeDeprecated = builder.includeDeprecated;
            this.nameRegex = builder.nameRegex;
            this.sortAscending = builder.sortAscending;
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
        public final java.util.List<java.lang.String> getOwners() {
            return this.owners;
        }

        @Override
        public final java.util.List<java.lang.String> getExecutableUsers() {
            return this.executableUsers;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeDeprecated() {
            return this.includeDeprecated;
        }

        @Override
        public final java.lang.String getNameRegex() {
            return this.nameRegex;
        }

        @Override
        public final java.lang.Object getSortAscending() {
            return this.sortAscending;
        }

        @Override
        public final imports.aws.data_aws_ami_ids.DataAwsAmiIdsTimeouts getTimeouts() {
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

            data.set("owners", om.valueToTree(this.getOwners()));
            if (this.getExecutableUsers() != null) {
                data.set("executableUsers", om.valueToTree(this.getExecutableUsers()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeDeprecated() != null) {
                data.set("includeDeprecated", om.valueToTree(this.getIncludeDeprecated()));
            }
            if (this.getNameRegex() != null) {
                data.set("nameRegex", om.valueToTree(this.getNameRegex()));
            }
            if (this.getSortAscending() != null) {
                data.set("sortAscending", om.valueToTree(this.getSortAscending()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsAmiIds.DataAwsAmiIdsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsAmiIdsConfig.Jsii$Proxy that = (DataAwsAmiIdsConfig.Jsii$Proxy) o;

            if (!owners.equals(that.owners)) return false;
            if (this.executableUsers != null ? !this.executableUsers.equals(that.executableUsers) : that.executableUsers != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeDeprecated != null ? !this.includeDeprecated.equals(that.includeDeprecated) : that.includeDeprecated != null) return false;
            if (this.nameRegex != null ? !this.nameRegex.equals(that.nameRegex) : that.nameRegex != null) return false;
            if (this.sortAscending != null ? !this.sortAscending.equals(that.sortAscending) : that.sortAscending != null) return false;
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
            int result = this.owners.hashCode();
            result = 31 * result + (this.executableUsers != null ? this.executableUsers.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeDeprecated != null ? this.includeDeprecated.hashCode() : 0);
            result = 31 * result + (this.nameRegex != null ? this.nameRegex.hashCode() : 0);
            result = 31 * result + (this.sortAscending != null ? this.sortAscending.hashCode() : 0);
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
