// Type definitions
export type TokenInfo = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type Vault = {
  _id: string;
  ownerAddress: string;
  balance: number;
  token: TokenInfo;
  status: string;
  planHash?: string;
  mentorAddress?: string;
  cooldownPeriod: number;
  createdAt: number;
  mode: "solo" | "mentor";
};

export type Plan = {
  _id: string;
  vaultId: string;
  ownerAddress: string;
  hash: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: number;
};

// Example SPL tokens
export const TOKENS: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  },
  {
    symbol: "ORCA",
    name: "Orca",
    decimals: 6,
    address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  },
  {
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  },
];

// Local storage keys
const VAULTS_KEY = "commitvault_vaults";
const PLANS_KEY = "commitvault_plans";

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial dummy data
const DUMMY_VAULTS: Omit<Vault, "_id" | "createdAt">[] = [
  {
    ownerAddress: "demo-address",
    balance: 1000,
    token: TOKENS[0], // USDC
    status: "active",
    mode: "solo",
    cooldownPeriod: 24 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 50000,
    token: TOKENS[1], // BONK
    status: "active",
    mode: "mentor",
    mentorAddress: "mentor1.sol",
    cooldownPeriod: 48 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 100,
    token: TOKENS[2], // ORCA
    status: "active",
    mode: "solo",
    cooldownPeriod: 12 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 250,
    token: TOKENS[3], // RAY
    status: "active",
    mode: "mentor",
    mentorAddress: "mentor2.sol",
    cooldownPeriod: 72 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 2500,
    token: TOKENS[0], // USDC
    status: "active",
    mode: "solo",
    cooldownPeriod: 36 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 75000,
    token: TOKENS[1], // BONK
    status: "active",
    mode: "mentor",
    mentorAddress: "mentor3.sol",
    cooldownPeriod: 24 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 150,
    token: TOKENS[2], // ORCA
    status: "active",
    mode: "solo",
    cooldownPeriod: 48 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 500,
    token: TOKENS[3], // RAY
    status: "active",
    mode: "mentor",
    mentorAddress: "mentor4.sol",
    cooldownPeriod: 36 * 3600000,
  },
  {
    ownerAddress: "demo-address",
    balance: 5000,
    token: TOKENS[0], // USDC
    status: "active",
    mode: "solo",
    cooldownPeriod: 24 * 3600000,
  },
];

// Initialize dummy data if no vaults exist
const initializeDummyData = () => {
  const existingVaults = localStorage.getItem(VAULTS_KEY);
  if (!existingVaults) {
    const dummyVaults = DUMMY_VAULTS.map(vault => ({
      ...vault,
      _id: generateId(),
      createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 3600000), // Random creation time within last week
    }));
    localStorage.setItem(VAULTS_KEY, JSON.stringify(dummyVaults));
  }
};

// Call initialization
initializeDummyData();

// Vault operations
export const createVault = (vault: Omit<Vault, "_id" | "createdAt">) => {
  const vaults = getVaults();
  const newVault: Vault = {
    _id: generateId(),
    createdAt: Date.now(),
    ...vault,
  };
  vaults.push(newVault);
  localStorage.setItem(VAULTS_KEY, JSON.stringify(vaults));
  return newVault;
};

export const getVaults = (): Vault[] => {
  const vaults = localStorage.getItem(VAULTS_KEY);
  return vaults ? JSON.parse(vaults) : [];
};

export const getVaultsByOwner = (ownerAddress: string): Vault[] => {
  return getVaults().filter(vault => vault.ownerAddress === ownerAddress);
};

// Plan operations
export const createPlan = (plan: Omit<Plan, "_id">) => {
  const plans = getPlans();
  const newPlan: Plan = {
    _id: generateId(),
    ...plan,
  };
  plans.push(newPlan);
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  return newPlan;
};

export const getPlans = (): Plan[] => {
  const plans = localStorage.getItem(PLANS_KEY);
  return plans ? JSON.parse(plans) : [];
};

export const getPendingPlans = (): Plan[] => {
  return getPlans().filter(plan => plan.status === "pending");
};

export const updatePlan = (planId: string, updates: Partial<Plan>) => {
  const plans = getPlans();
  const index = plans.findIndex(p => p._id === planId);
  if (index !== -1) {
    plans[index] = { ...plans[index], ...updates };
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return plans[index];
  }
  throw new Error("Plan not found");
};
