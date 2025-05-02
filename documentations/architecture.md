# Architecture

## 1. Overview

CommitVault adds a behavioral gating layer to DeFi by requiring users to write a
clear investment plan before accessing locked funds. Users can assign mentors to
review and approve their plan—with comments—ensuring a layer of social and
psychological friction between capital and action. Investment plans are stored
off-chain for flexibility and cost efficiency, while maintaining the security of
on-chain funds.

```mermaid
graph TD
   A[User Wallet] -.-> Z[Optionally Setup Mentor Wallet] -.-> B
   A -->|Deposit USDC/SOL| B[Vault Smart Contract]
   A --> C[UI: Set Behavioral Gates]

   C --> D[Gate 1: Mindset Check - Checkbox or Form]
   C --> E[Gate 2: Investment Plan - Off-chain DB]
   C --> F[Gate 3: Optional Mentor Approval]

   E --> DB[(Off-chain Database)]
   F --> G[Mentor Wallet Signs Approval]
   DB --> H{All Gates Complete?}

   D --> H
   G --> H

   H -- Yes --> I[Unlock Button Enabled]
   I --> J[User Withdraws via Frontend]
   J --> B
   B -->|Release Funds| A

   H -- No --> K[Vault Remains Locked]
```

## 2. Account Structure

### PDAs & Token Accounts

```mermaid
flowchart TD
   user[User Wallet]
   vault[VaultAccount PDA]
   offchain[Off-chain Plan DB]
   mentor[Optional Mentor Pubkey]
   usdc[Token Vault ATA/PDA]

   user --> vault
   user --> offchain
   user --> usdc
   vault -->|references| mentor
   vault --> usdc
   offchain -.->|plan reference| vault
```

### Account Breakdown

#### VaultAccount (PDA)

- Owner: User
- Status: Locked / Unlocked
- Unlock strategy: Cooldown | MentorApproval
- Token vault reference
- Plan reference hash (for verification)
- Cooldown configuration:
  - Period length (in hours)
  - Start timestamp
  - Completion timestamp
- Mode settings:
  - Current mode: Solo | Mentor
  - Can switch modes: boolean
- Mentor configuration:
  - Current mentor address
  - Submission timestamp
  - Timeout period (default 72 hours)
  - Review status: Pending | Approved | Rejected | Timeout

#### Off-chain Plan Storage

- Plan ID: Unique identifier
- Owner: User wallet address
- Plan sections:
  - Objective:
    - Investment goals
    - Target outcomes
    - Success metrics
  - Risk Model:
    - Risk tolerance level
    - Maximum drawdown
    - Position sizing rules
  - Entry/Exit Strategy:
    - Entry criteria
    - Exit conditions
    - Stop-loss levels
  - Time Horizon:
    - Expected duration
    - Milestone dates
    - Review periods
- Metadata:
  - Creation timestamp
  - Last modified
  - Version number
- Status: Draft/Submitted/Approved/Rejected/Timeout
- Validation status:
  - Required fields completion
  - Section validations
  - Overall completeness
- Mentor feedback:
  - Section-specific comments
  - General feedback
  - Improvement suggestions
- Associated vault address
- Review history:
  - Previous mentor addresses
  - Submission timestamps
  - Review status
  - Mode changes

#### Mentor Account

- Mentor pubkey
- Stored inside VaultAccount if needed
- Used to validate approve_plan

#### Token Vault

- Associated Token Account (ATA) or a PDA holding locked assets
- USDC / SOL (configurable)

### State Transitions

```mermaid
stateDiagram-v2
    [*] --> Locked
    Locked --> PlanSubmitted: Submit Plan
    PlanSubmitted --> CooldownStarted: Solo Mode
    PlanSubmitted --> AwaitingMentor: Mentor Mode
    CooldownStarted --> UnlockReady: Wait 24h
    AwaitingMentor --> UnlockReady: Mentor Approves
    AwaitingMentor --> Timeout: Wait 72h
    Timeout --> PlanSubmitted: Resubmit/New Mentor
    Timeout --> CooldownStarted: Switch to Solo
    UnlockReady --> Unlocked: User Confirms
    Unlocked --> [*]
```

### Mentor Timeout Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant Vault
    participant DB
    actor Mentor

    User->>UI: Submit Plan
    UI->>DB: Store Plan
    UI->>Vault: Submit Plan Hash + Mentor Address
    Note over Vault: Start 72h Timer

    par Mentor Review Path
        Mentor->>UI: Review Plan
        Mentor->>Vault: Sign Approval/Rejection
    and Timeout Path
        loop Check Timeout
            UI->>Vault: Check Status
            Vault->>Vault: Verify 72h Status
            alt 72h Passed
                Vault->>UI: Enable Timeout Options
                User->>UI: Choose Action
                alt Resubmit to New Mentor
                    UI->>Vault: Update Mentor
                    UI->>DB: Update Plan Status
                else Switch to Solo Mode
                    UI->>Vault: Change Mode
                    Vault->>Vault: Start Cooldown
                end
            end
        end
    end
```

## 3. User Interaction Flow

```mermaid
flowchart TD
   U[User] --> C[Create Vault]
   C --> S[Submit Plan]
   S --> DB[(Off-chain Database)]
   DB --> D{Cooldown or Mentor Required?}

   D -- Cooldown --> T[Wait N hours]
   D -- Mentor --> M[Mentor Reviews Plan]
   M --> MC[Add Comments]
   MC --> MA[Mentor Signs Approval]

   T --> U2[Unlock Allowed]
   MA --> U2

   U2 --> W[Withdraw Funds]
```

### Flow Details

1. **Create Vault**:

   - Initializes VaultAccount + Token Vault
   - Creates off-chain plan entry
   - Sets mode (Solo/Mentor) and cooldown period
   - If Mentor mode:
     - Sets mentor address
     - Configures timeout period (72 hours)
   - Initializes state as Locked

2. **Submit Plan**:

   - Plan stored in off-chain database
   - Hash of plan stored on-chain for verification
   - Plan status updated to Submitted
   - If Solo mode:
     - Starts cooldown period (24 hours)
     - Records start timestamp
   - If Mentor mode:
     - Records submission timestamp for timeout
     - Transitions to awaiting approval

3. **Mentor Timeout Handling**:

   - System monitors 72-hour timeout window
   - If timeout occurs:
     - Plan status updated to Timeout
     - User can: a. Resubmit to new mentor (resets timeout) b. Switch to Solo
       mode (starts cooldown)
   - All timeout actions recorded in review history
   - Mode changes persist in vault configuration

4. **Withdraw**:
   - Only possible after gate conditions pass
   - Requires valid plan hash verification

## 4. External Dependencies

```mermaid
flowchart TD
   frontend[Frontend App] --> SIWS[Sign-In With Solana]
   frontend --> wallet[Phantom Wallet / Signer]
   frontend --> submit[Submit Plan]
   frontend --> mentorView[Mentor Dashboard]

   backend[Off-chain Plan Database] --> mentorView
   backend --> submit
   backend --> planHistory[Plan History]
```

### Component Details

#### Frontend (React + Anchor client)

- Renders vault state and plan form
- Provides structured plan template:
  - Section-by-section input guidance
  - Field validation and completion status
  - Progress tracking
  - Template suggestions and examples
- Manages plan submission to off-chain database
- Displays cooldown timers and mentor status
- Shows plan history and mentor comments
- Handles timeout scenarios:
  - Displays time remaining for mentor review
  - Shows timeout options when applicable
  - Manages mentor reassignment
  - Facilitates mode switching

#### Backend Service

- Stores investment plans and metadata
- Manages plan versions and history
- Handles mentor comments and feedback
- Provides plan verification endpoints
- Template management:
  - Section validation rules
  - Required field definitions
  - Suggestion database
  - Example repository

#### Wallet Integration

- Used to sign transactions and mentor approvals
- Signs plan submissions for authenticity

#### Mentor UI

- Displays pending plans with section breakdown
- Section-specific comment capabilities
- Structured feedback templates
- Plan comparison with historical versions
- Validation override options
- Views plan history and changes

## 5. Plan Submission

### Plan Template Structure

```mermaid
classDiagram
    class InvestmentPlan {
        +String planId
        +String owner
        +Objective objective
        +RiskModel riskModel
        +Strategy strategy
        +TimeHorizon timeHorizon
        +Metadata metadata
        +validate()
        +submit()
    }

    class Objective {
        +String goals
        +String targetOutcomes
        +String[] successMetrics
    }

    class RiskModel {
        +String riskLevel
        +Number maxDrawdown
        +String[] positionRules
    }

    class Strategy {
        +String[] entryCriteria
        +String[] exitConditions
        +Number stopLoss
    }

    class TimeHorizon {
        +Date duration
        +Date[] milestones
        +Number reviewFrequency
    }

    InvestmentPlan *-- Objective
    InvestmentPlan *-- RiskModel
    InvestmentPlan *-- Strategy
    InvestmentPlan *-- TimeHorizon
```

### Plan Submission Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant PlanChecker
    participant DB
    participant Vault

    User->>UI: Open Plan Form
    UI->>UI: Load Template

    loop For Each Section
        User->>UI: Fill Section
        UI->>PlanChecker: Check Section Completeness
        PlanChecker-->>UI: Section Status
        UI->>UI: Update Progress
    end

    User->>UI: Submit Plan
    UI->>PlanChecker: Verify Plan Requirements

    alt Plan Incomplete
        PlanChecker-->>UI: Missing Requirements
        UI->>User: Show Incomplete Fields
    else Plan Complete
        UI->>DB: Store Structured Plan
        UI->>Vault: Submit Plan Hash
        Vault-->>UI: Confirmation
        UI->>User: Show Success
    end
```

## 6. Mentor Interface

### Mentor Dashboard Structure

```mermaid
classDiagram
    class DashboardView {
        +PendingPlans pendingReviews
        +ReviewHistory completedReviews
        +Statistics mentorStats
        +loadDashboard()
        +filterPlans()
        +sortByPriority()
    }

    class PendingPlans {
        +Plan[] plans
        +Number timeRemaining
        +showPlanDetails()
        +startReview()
        +filterByStatus()
    }

    class ReviewHistory {
        +Review[] reviews
        +filterByDate()
        +exportHistory()
        +searchReviews()
    }

    class Statistics {
        +Number plansReviewed
        +Number avgResponseTime
        +Number activeVaults
        +generateReport()
    }

    DashboardView *-- PendingPlans
    DashboardView *-- ReviewHistory
    DashboardView *-- Statistics
```

### Mentor Review Workflow

```mermaid
sequenceDiagram
    actor Mentor
    participant Dashboard
    participant PlanViewer
    participant FeedbackForm
    participant DB
    participant Vault

    Mentor->>Dashboard: Open Dashboard
    Dashboard->>DB: Fetch Pending Plans
    DB-->>Dashboard: Plans List

    Mentor->>Dashboard: Select Plan
    Dashboard->>PlanViewer: Load Plan Details

    loop Each Plan Section
        PlanViewer->>Mentor: Display Section
        Mentor->>FeedbackForm: Add Section Comments
        FeedbackForm->>FeedbackForm: Save Draft
    end

    alt Needs Revision
        Mentor->>FeedbackForm: Request Changes
        FeedbackForm->>DB: Store Feedback
        DB->>Vault: Update Status
    else Ready to Approve
        Mentor->>FeedbackForm: Submit Approval
        FeedbackForm->>DB: Store Feedback
        FeedbackForm->>Vault: Sign Approval
    end

    Dashboard->>Mentor: Show Updated Status
```

### Dashboard Components

#### Plan Review Queue

- Priority sorting:
  - Time remaining before timeout
  - Plan submission date
  - Vault size
- Status filters:
  - Pending initial review
  - Awaiting revision
  - Ready for approval
- Quick actions:
  - Start review
  - Request changes
  - Approve plan

#### Plan Review Interface

- Side-by-side view:
  - Plan sections
  - Comment/feedback panel
- Section navigation
- Inline commenting
- Template-based feedback
- Historical context:
  - Previous versions
  - Past feedback
  - Revision history

#### Mentor Analytics

- Review statistics:
  - Average response time
  - Plans reviewed
  - Approval rate
- Active vaults overview
- Mentee performance tracking
- Time management tools

#### Communication Tools

- Feedback templates
- Common suggestions library
- Educational resources
- Revision requests
- Approval notifications

### Mentor Review States

```mermaid
stateDiagram-v2
    [*] --> PendingReview: Plan Submitted
    PendingReview --> InProgress: Start Review
    InProgress --> RequestChanges: Need Revisions
    InProgress --> ReadyApproval: Meets Requirements
    RequestChanges --> PendingReview: Plan Updated
    ReadyApproval --> [*]: Sign Approval
```

#### Mentor UI

- Comprehensive dashboard view:
  - Plan review queue
  - Active reviews
  - Review history
- Review tools:
  - Section-by-section review interface
  - Structured feedback forms
  - Comment templates
  - Approval workflow
- Analytics and reporting:
  - Review statistics
  - Performance metrics
  - Time tracking
- Communication features:
  - Feedback management
  - Revision requests
  - Approval notifications
