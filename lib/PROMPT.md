Hey team,

We need a solid foundation for our infrastructure as code using Pulumi with TypeScript. The goal is to create a reusable, modular component-based architecture that can serve as the base for all our AWS infrastructure deployments.

I've been asked to implement a TapStack component that follows best practices and can be easily extended with nested resource components. We want a clean separation of concerns and a maintainable codebase that can scale as we add more AWS services.

## What we need to build

Create a foundational Pulumi ComponentResource using **Pulumi with TypeScript** for infrastructure orchestration.

### Core Requirements

1. **Component-Based Architecture**
   - Implement TapStack as a Pulumi ComponentResource
   - Support nested component pattern for AWS resources
   - Enable clear parent-child relationships between components

2. **Environment Configuration**
   - Support environment suffix for multi-environment deployments
   - Enable flexible configuration through Pulumi.Config
   - Allow environment-specific resource naming

3. **Resource Tagging**
   - Implement standardized tagging strategy
   - Support Environment, Repository, and Author tags
   - Enable tag propagation to all child resources

4. **Type Safety**
   - Use TypeScript with strict mode enabled
   - Define clear interfaces for component arguments
   - Properly type all Pulumi outputs

5. **Modularity**
   - Separate orchestration from resource creation
   - Enable easy addition of new resource components
   - Maintain clear component boundaries

6. **Configuration Management**
   - Support environment variables for configuration
   - Enable Pulumi config for stack-specific settings
   - Provide sensible defaults

7. **Extensibility**
   - Template structure for adding nested components
   - Clear documentation of extension patterns
   - Example code for common patterns

8. **Code Quality**
   - Comprehensive JSDoc comments
   - Clean, readable code structure
   - Well-organized project layout

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Pulumi ComponentResource pattern
- Implement proper resource organization
- Support multi-environment deployment
- Enable flexible configuration
- Follow TypeScript best practices
- Use consistent naming conventions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`

### Constraints

1. TypeScript must use strict mode with proper type definitions
2. Must not create resources directly in TapStack (use nested components)
3. Must support environment-specific configurations
4. Must implement proper resource tagging
5. All components must use parent-child relationships
6. Configuration must be centralized through Pulumi.Config
7. Must provide clear extension examples
8. Code must be well-documented
9. Must follow Pulumi best practices
10. Project structure must be clean and maintainable

## Success Criteria

- **Modularity**: Clear separation between orchestration and resource creation
- **Extensibility**: Easy to add new resource components
- **Type Safety**: TypeScript strict mode with proper types
- **Configuration**: Flexible environment-specific configuration
- **Documentation**: Comprehensive JSDoc and usage examples
- **Code Quality**: Clean, maintainable, well-structured codebase
- **Best Practices**: Follows Pulumi and TypeScript best practices
- **Resource Naming**: All resources include environmentSuffix for multi-environment support

## What to deliver

- Complete Pulumi TypeScript TapStack component implementation
- TapStackArgs interface with proper type definitions
- Pulumi entry point (bin/tap.ts)
- Pulumi project configuration (Pulumi.yaml)
- TypeScript configuration (tsconfig.json)
- Package.json with required dependencies
- JSDoc comments for all public interfaces
- Extension examples and patterns
- Clean project structure
- Documentation on how to add nested components
