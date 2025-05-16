# CommitVault User Stories

## Project Name

**CommitVault - Behavioral Gate for Onchain Capital Deployment**

## Value Proposition

CommitVault adds a behavioral gating layer to DeFi by requiring users to write a
clear investment plan before accessing locked funds. Users can assign mentors to
review and approve their plan—with comments—ensuring a layer of social and
psychological friction between capital and action. In solo mode, a cooldown
period enforces emotional distance.

## Product-Market Fit

Most DeFi tools focus on execution speed and yield, not user psychology.
CommitVault fills this gap by using self-imposed rules and peer review to reduce
impulsive trades, reinforce planning, and bring intention into capital flow.
This is a novel behavioral primitive in onchain UX.

## Target User Profiles

### The Self-Aware Trader

- **Demographics:** 25-40, active DeFi users
- **Interests:** Long-term investing, personal improvement, financial strategy
- **Motivations:** Avoid emotional or irrational trades; build a repeatable
  process
- **Pain Points:** Trading based on FOMO or emotions, no structured planning
  system

### The Accountability Coach / Trading Mentor

- **Demographics:** 30-50, experienced traders or financial coaches
- **Interests:** Mentoring, structured systems, risk coaching
- **Motivations:** Help others improve, build credibility as a guide
- **Pain Points:** Lack of enforcement or visibility into mentee actions

## User Stories

### User Story ID: COMMIT-001a

- **Priority:** High
- **User Persona:** Self-Aware Trader
- **Goal:** Enforce intentional planning before using funds
- **User Story:** As a trader, I want to be required to write a clear plan for
  how I'll use the funds before unlocking the vault, so I can reduce impulsive
  or emotional decisions.
- **Functionality:**
  - Create a vault and deposit USDC/SOL
  - Define required behavioral gates: written plan, optional cooldown, optional
    mentor approval
  - Vault UI shows gate status and unlock eligibility
- **Attributes:**
  - Plan must be written in freeform text before withdrawal
  - After submission, plan is locked from edits to enforce commitment
  - If in **solo mode**, unlock becomes available only after a predefined
    cooldown (e.g., 24 hours)
  - If **mentor mode**, unlock depends on mentor approval
- **User Interaction:**
  - Write plan using a basic input form
  - Plan structure is suggested: _Objective, Risk Model, Entry/Exit, Time
    Horizon_
  - See real-time gate status: "Plan Submitted," "Waiting Cooldown," "Awaiting
    Mentor Approval," etc.

### User Story ID: COMMIT-001b

- **Priority:** High
- **User Persona:** Self-Aware Trader
- **Goal:** Add mentor review for added accountability
- **User Story:** As a trader, I want my plan to require approval from a mentor
  before I can withdraw funds, so I stay accountable to someone with more
  experience.
- **Functionality:**
  - Assign a mentor wallet address at vault creation
  - Mentor must read and sign off on the submitted plan
  - Mentor can leave comments/feedback on the plan
- **Attributes:**
  - Mentor approval is recorded on-chain (via signature)
  - Mentor cannot access funds—only approve or reject plans
  - If no response within a timeout window (e.g., 72 hours), the user can
    resubmit the plan to another mentor or reconfigure the vault to self-verify
    mode
- **User Interaction:**
  - Submit plan
  - Monitor approval status
  - Reassign mentor or switch modes if timeout triggers

### User Story ID: COMMIT-002a

- **Priority:** Medium
- **User Persona:** Coach / Mentor
- **Goal:** Help others apply discipline before trading
- **User Story:** As a mentor, I want to review my mentee's plan, leave
  comments, and approve only when I believe the plan is solid, so I can support
  smarter trading decisions.
- **Functionality:**
  - View submitted plans awaiting review
  - Add optional comments or suggestions
  - Approve or reject with wallet signature
- **Attributes:**
  - Plan is shown read-only with a timestamp
  - Feedback on the mentee plan (optional)
  - Approval is final; rejection reopens submission
- **User Interaction:**
  - See dashboard of pending plans
  - Click into plan detail
  - Leave comment → sign approval or rejection
