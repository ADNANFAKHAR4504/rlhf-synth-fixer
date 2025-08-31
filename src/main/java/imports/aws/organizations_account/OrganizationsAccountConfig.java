package imports.aws.organizations_account;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.042Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.organizationsAccount.OrganizationsAccountConfig")
@software.amazon.jsii.Jsii.Proxy(OrganizationsAccountConfig.Jsii$Proxy.class)
public interface OrganizationsAccountConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#email OrganizationsAccount#email}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEmail();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#name OrganizationsAccount#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#close_on_deletion OrganizationsAccount#close_on_deletion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloseOnDeletion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#create_govcloud OrganizationsAccount#create_govcloud}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateGovcloud() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#iam_user_access_to_billing OrganizationsAccount#iam_user_access_to_billing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamUserAccessToBilling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#id OrganizationsAccount#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#parent_id OrganizationsAccount#parent_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParentId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#role_name OrganizationsAccount#role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#tags OrganizationsAccount#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#tags_all OrganizationsAccount#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#timeouts OrganizationsAccount#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.organizations_account.OrganizationsAccountTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OrganizationsAccountConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OrganizationsAccountConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OrganizationsAccountConfig> {
        java.lang.String email;
        java.lang.String name;
        java.lang.Object closeOnDeletion;
        java.lang.Object createGovcloud;
        java.lang.String iamUserAccessToBilling;
        java.lang.String id;
        java.lang.String parentId;
        java.lang.String roleName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.organizations_account.OrganizationsAccountTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getEmail}
         * @param email Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#email OrganizationsAccount#email}. This parameter is required.
         * @return {@code this}
         */
        public Builder email(java.lang.String email) {
            this.email = email;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#name OrganizationsAccount#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCloseOnDeletion}
         * @param closeOnDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#close_on_deletion OrganizationsAccount#close_on_deletion}.
         * @return {@code this}
         */
        public Builder closeOnDeletion(java.lang.Boolean closeOnDeletion) {
            this.closeOnDeletion = closeOnDeletion;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCloseOnDeletion}
         * @param closeOnDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#close_on_deletion OrganizationsAccount#close_on_deletion}.
         * @return {@code this}
         */
        public Builder closeOnDeletion(com.hashicorp.cdktf.IResolvable closeOnDeletion) {
            this.closeOnDeletion = closeOnDeletion;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCreateGovcloud}
         * @param createGovcloud Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#create_govcloud OrganizationsAccount#create_govcloud}.
         * @return {@code this}
         */
        public Builder createGovcloud(java.lang.Boolean createGovcloud) {
            this.createGovcloud = createGovcloud;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCreateGovcloud}
         * @param createGovcloud Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#create_govcloud OrganizationsAccount#create_govcloud}.
         * @return {@code this}
         */
        public Builder createGovcloud(com.hashicorp.cdktf.IResolvable createGovcloud) {
            this.createGovcloud = createGovcloud;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getIamUserAccessToBilling}
         * @param iamUserAccessToBilling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#iam_user_access_to_billing OrganizationsAccount#iam_user_access_to_billing}.
         * @return {@code this}
         */
        public Builder iamUserAccessToBilling(java.lang.String iamUserAccessToBilling) {
            this.iamUserAccessToBilling = iamUserAccessToBilling;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#id OrganizationsAccount#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getParentId}
         * @param parentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#parent_id OrganizationsAccount#parent_id}.
         * @return {@code this}
         */
        public Builder parentId(java.lang.String parentId) {
            this.parentId = parentId;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getRoleName}
         * @param roleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#role_name OrganizationsAccount#role_name}.
         * @return {@code this}
         */
        public Builder roleName(java.lang.String roleName) {
            this.roleName = roleName;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#tags OrganizationsAccount#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#tags_all OrganizationsAccount#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/organizations_account#timeouts OrganizationsAccount#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.organizations_account.OrganizationsAccountTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getDependsOn}
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
         * Sets the value of {@link OrganizationsAccountConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OrganizationsAccountConfig#getProvisioners}
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
         * @return a new instance of {@link OrganizationsAccountConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OrganizationsAccountConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OrganizationsAccountConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OrganizationsAccountConfig {
        private final java.lang.String email;
        private final java.lang.String name;
        private final java.lang.Object closeOnDeletion;
        private final java.lang.Object createGovcloud;
        private final java.lang.String iamUserAccessToBilling;
        private final java.lang.String id;
        private final java.lang.String parentId;
        private final java.lang.String roleName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.organizations_account.OrganizationsAccountTimeouts timeouts;
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
            this.email = software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.closeOnDeletion = software.amazon.jsii.Kernel.get(this, "closeOnDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.createGovcloud = software.amazon.jsii.Kernel.get(this, "createGovcloud", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamUserAccessToBilling = software.amazon.jsii.Kernel.get(this, "iamUserAccessToBilling", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parentId = software.amazon.jsii.Kernel.get(this, "parentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleName = software.amazon.jsii.Kernel.get(this, "roleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.organizations_account.OrganizationsAccountTimeouts.class));
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
            this.email = java.util.Objects.requireNonNull(builder.email, "email is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.closeOnDeletion = builder.closeOnDeletion;
            this.createGovcloud = builder.createGovcloud;
            this.iamUserAccessToBilling = builder.iamUserAccessToBilling;
            this.id = builder.id;
            this.parentId = builder.parentId;
            this.roleName = builder.roleName;
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
        public final java.lang.String getEmail() {
            return this.email;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getCloseOnDeletion() {
            return this.closeOnDeletion;
        }

        @Override
        public final java.lang.Object getCreateGovcloud() {
            return this.createGovcloud;
        }

        @Override
        public final java.lang.String getIamUserAccessToBilling() {
            return this.iamUserAccessToBilling;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getParentId() {
            return this.parentId;
        }

        @Override
        public final java.lang.String getRoleName() {
            return this.roleName;
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
        public final imports.aws.organizations_account.OrganizationsAccountTimeouts getTimeouts() {
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

            data.set("email", om.valueToTree(this.getEmail()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCloseOnDeletion() != null) {
                data.set("closeOnDeletion", om.valueToTree(this.getCloseOnDeletion()));
            }
            if (this.getCreateGovcloud() != null) {
                data.set("createGovcloud", om.valueToTree(this.getCreateGovcloud()));
            }
            if (this.getIamUserAccessToBilling() != null) {
                data.set("iamUserAccessToBilling", om.valueToTree(this.getIamUserAccessToBilling()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParentId() != null) {
                data.set("parentId", om.valueToTree(this.getParentId()));
            }
            if (this.getRoleName() != null) {
                data.set("roleName", om.valueToTree(this.getRoleName()));
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
            struct.set("fqn", om.valueToTree("aws.organizationsAccount.OrganizationsAccountConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OrganizationsAccountConfig.Jsii$Proxy that = (OrganizationsAccountConfig.Jsii$Proxy) o;

            if (!email.equals(that.email)) return false;
            if (!name.equals(that.name)) return false;
            if (this.closeOnDeletion != null ? !this.closeOnDeletion.equals(that.closeOnDeletion) : that.closeOnDeletion != null) return false;
            if (this.createGovcloud != null ? !this.createGovcloud.equals(that.createGovcloud) : that.createGovcloud != null) return false;
            if (this.iamUserAccessToBilling != null ? !this.iamUserAccessToBilling.equals(that.iamUserAccessToBilling) : that.iamUserAccessToBilling != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parentId != null ? !this.parentId.equals(that.parentId) : that.parentId != null) return false;
            if (this.roleName != null ? !this.roleName.equals(that.roleName) : that.roleName != null) return false;
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
            int result = this.email.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.closeOnDeletion != null ? this.closeOnDeletion.hashCode() : 0);
            result = 31 * result + (this.createGovcloud != null ? this.createGovcloud.hashCode() : 0);
            result = 31 * result + (this.iamUserAccessToBilling != null ? this.iamUserAccessToBilling.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parentId != null ? this.parentId.hashCode() : 0);
            result = 31 * result + (this.roleName != null ? this.roleName.hashCode() : 0);
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
