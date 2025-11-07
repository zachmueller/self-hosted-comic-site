# Git Workflow Standards

## Automated Commit Requirements

**MANDATORY:** After completing ANY task that modifies files, Cline must immediately commit the changes before responding to the user.

### Commit Process
1. **Add AI-modified files using appropriate method:**
   - **For modifications/additions only:** `git add <specific-files>`
   - **For deletions:** `git rm <deleted-files>` or `git rm -r <deleted-directories>`
   - **For mixed operations:** Use both approaches - `git add` for modifications/additions, `git rm` for deletions
   - **Always verify with `git status --porcelain` first** to identify what changed and ensure only intended changes are staged
2. **Commit with descriptive message:** `git commit -m "Summary of work completed"`
3. **Include in commit message:**
   - Brief summary of what was accomplished
   - Key changes made to each file (explicitly listing deletions, modifications, and additions)
   - Context for why changes were needed

### Commit Message Format
```
<Action>: <Brief summary>

- <Specific change 1>
- <Specific change 2>
- <Context or rationale if helpful>
```

### When to Commit
- ✅ After creating/updating any files
- ✅ After completing spec documents (requirements, design, tasks)
- ✅ After implementing code changes
- ✅ After updating configuration files
- ✅ Before asking user for feedback on completed work

### What NOT to Include
- ❌ Files modified by user or other processes
- ❌ Unrelated changes from previous work
- ❌ Files that were only read (not modified)

### Special File Types

#### Scratchpad.md Commits
- **When to commit**: After completing work sessions or major updates
- **What to include**: Current project progress, meta-learning insights, scratch notes
- **Commit message format**: `Update scratchpad: [brief summary of progress/insights]`
- **Frequency**: Don't commit every small change - consolidate meaningful updates

#### CPN/ Evergreen Notes
- **When to commit**: Immediately after creating or significantly enhancing a concept note
- **What to include**: Only the specific cpn/ files that were created or modified
- **Commit message format**: `Add concept: [concept-title]` or `Enhance concept: [concept-title] - [specific improvement]`
- **Linking updates**: If adding links to existing notes, include those changes in the same commit

#### Combined Commits
When work spans multiple file types, structure commits as:
```
Complete [project/work description]

- Updated scratchpad.md with progress and insights
- Created concept: [[new-concept-name]]
- Enhanced existing concept: [[existing-concept-name]]
- [Other specific changes]
```

## Branch Management
- Work should be committed to the current branch unless otherwise specified
- Ensure commits are atomic and represent logical units of work
- Use meaningful commit messages that explain the "what" and "why"

## Quality Standards
- Commits should only include files that were intentionally modified as part of the task
- Review changes before committing to ensure no unintended modifications are included
- Maintain clean commit history with focused, purposeful commits