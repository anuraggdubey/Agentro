#![no_std]

use agentro_interfaces::PaymentContractClient;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, String, Vec,
};

const INSTANCE_BUMP_AMOUNT: u32 = 7 * 24 * 60 * 60 / 5;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - 1000;

#[derive(Clone)]
#[contracttype]
pub struct Agent {
    pub id: u64,
    pub owner: Address,
    pub metadata: String,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    PaymentContract,
    DefaultAnalysisFee,
    NextAgentId,
    Agent(u64),
    UserAgents(Address),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum AgentManagerError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AgentMissing = 3,
}

#[contract]
pub struct AgentManagerContract;

#[contractimpl]
impl AgentManagerContract {
    pub fn initialize(env: Env, admin: Address, payment_contract: Address, default_analysis_fee: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, AgentManagerError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PaymentContract, &payment_contract);
        env.storage()
            .instance()
            .set(&DataKey::DefaultAnalysisFee, &default_analysis_fee);
        env.storage().instance().set(&DataKey::NextAgentId, &1_u64);
        extend_instance(&env);
    }

    pub fn create_agent(env: Env, owner: Address, metadata: String) -> u64 {
        owner.require_auth();

        let id = next_agent_id(&env);
        let agent = Agent {
            id,
            owner: owner.clone(),
            metadata,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Agent(id), &agent);
        let mut owned = Self::list_user_agents(env.clone(), owner.clone());
        owned.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::UserAgents(owner.clone()), &owned);
        env.storage().instance().set(&DataKey::NextAgentId, &(id + 1));

        env.events()
            .publish((symbol_short!("agt_crtd"), owner), (id, agent.created_at));
        extend_instance(&env);
        id
    }

    pub fn use_agent(env: Env, agent_id: u64, user: Address, amount: Option<i128>) {
        let agent = Self::get_agent(env.clone(), agent_id);
        user.require_auth();
        let charge = amount.unwrap_or(get_default_analysis_fee(&env));
        PaymentContractClient::new(&env, &get_payment_contract(&env)).pay_for_analysis(&user, &charge);

        env.events().publish(
            (symbol_short!("agt_used"), agent.owner, user),
            (agent_id, charge, env.ledger().timestamp()),
        );
        extend_instance(&env);
    }

    pub fn get_agent(env: Env, agent_id: u64) -> Agent {
        env.storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| panic_with_error!(&env, AgentManagerError::AgentMissing))
    }

    pub fn list_user_agents(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserAgents(user))
            .unwrap_or(Vec::new(&env))
    }
}

fn next_agent_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextAgentId)
        .unwrap_or_else(|| panic_with_error!(env, AgentManagerError::NotInitialized))
}

fn get_payment_contract(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::PaymentContract)
        .unwrap_or_else(|| panic_with_error!(env, AgentManagerError::NotInitialized))
}

fn get_default_analysis_fee(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::DefaultAnalysisFee)
        .unwrap_or_else(|| panic_with_error!(env, AgentManagerError::NotInitialized))
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

#[cfg(test)]
mod test {
    use super::*;
    use agentro_payment::PaymentContract;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{StellarAssetClient, TokenClient},
    };
    const TEST_ALLOWANCE_EXPIRY: u32 = 1_000_000;

    #[test]
    fn agent_creation_and_usage_payment_flow() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|ledger| {
            ledger.timestamp = 1_800_000_000;
        });

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let owner = Address::generate(&env);
        let user = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let payment_id = env.register(PaymentContract, ());
        let manager_id = env.register(AgentManagerContract, ());

        let token_admin = StellarAssetClient::new(&env, &token_id);
        let token = TokenClient::new(&env, &token_id);
        let payment = PaymentContractClient::new(&env, &payment_id);
        let manager = AgentManagerContractClient::new(&env, &manager_id);

        payment.initialize(&admin, &token_id, &treasury, &75, &(30 * 24 * 60 * 60));
        manager.initialize(&admin, &payment_id, &75);

        let agent_id = manager.create_agent(&owner, &String::from_str(&env, "ipfs://agent-metadata"));
        assert_eq!(manager.get_agent(&agent_id).owner, owner);
        assert_eq!(manager.list_user_agents(&owner).len(), 1);

        token_admin.mint(&user, &500);
        token.approve(&user, &payment_id, &100, &TEST_ALLOWANCE_EXPIRY);
        manager.use_agent(&1, &user, &None);

        assert_eq!(token.balance(&treasury), 75);
        assert!(payment.has_active_subscription(&user));
    }
}
