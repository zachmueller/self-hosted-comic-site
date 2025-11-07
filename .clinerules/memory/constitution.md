# Project Constitution

**Version:** 1.0.0  
**Ratified:** 2025-11-07  
**Last Amended:** 2025-11-07  

## Project Identity

**Project Name:** self-hosted-comic-site

**Vision:** Enable any individual comic artist to easily deploy their own self-hosted website (via AWS) to share their comics publicly on the internet.

## Core Principles

### Artist-First User Experience
All user interface and workflow decisions shall prioritize the comic artist's ease of use over reader convenience. When design conflicts arise between artist workflow and reader experience, the artist's needs take precedence.

**Rationale:** The primary user of this system is the comic artist who must regularly interact with upload and management features. A streamlined artist experience ensures sustainable content creation.

### Serverless-First Architecture  
Infrastructure components shall prefer managed, serverless AWS services over dedicated servers or EC2 instances. Architecture decisions must minimize operational overhead and infrastructure management requirements.

**Rationale:** Individual comic artists should focus on creating content, not managing servers. Serverless architectures reduce maintenance burden and provide automatic scaling.

### Cost-Conscious Design
All architectural decisions and feature implementations must consider cost impact, with a target of keeping total hosting costs under $10 per month for typical usage patterns.

**Rationale:** Individual artists often operate on limited budgets. Keeping hosting costs predictably low ensures the platform remains accessible to independent creators.

### Deployment Simplicity
Deployment processes shall be executable through simple command-line operations (e.g., CDK commands). While full automation is preferred, limited manual steps are acceptable if they remain straightforward and well-documented.

**Rationale:** Artists should be able to deploy and maintain their sites without extensive DevOps knowledge. Simple deployment processes reduce barriers to adoption and ongoing maintenance.

## Governance

### Amendment Process
Constitutional changes require:
1. Formal proposal with rationale
2. Impact analysis on existing architecture and costs
3. Version bump following semantic versioning
4. Update propagation to dependent templates and documentation

### Compliance Review
All new features, architectural changes, and third-party integrations must demonstrate alignment with constitutional principles before implementation.

### Decision Framework
When evaluating changes, prioritize principles in this order:
1. Cost impact (must stay within $10/month target)
2. Maintenance burden (prefer lower maintenance)
3. Artist workflow simplicity
4. Deployment complexity

### Versioning Policy
- Constitution versions follow semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Changes to core principles or governance structure
- MINOR: New principles or substantial clarifications
- PATCH: Minor wording improvements or corrections
