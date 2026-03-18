#![no_std]

use agentro_interfaces::LeaderboardClient;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, MuxedAddress, String, Vec, token::TokenClient,
};

const INSTANCE_BUMP_AMOUNT: u32 = 7 * 24 * 60 * 60 / 5;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - 1000;

#[derive(Clone)]
#[contracttype]
pub struct Bounty {
    pub id: u64,
    pub creator: Address,
    pub metadata: String,
    pub reward: i128,
    pub funded: bool,
    pub completed: bool,
    pub winner: Option<Address>,
    pub created_at: u64,
    pub funded_at: Option<u64>,
    pub completed_at: Option<u64>,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Token,
    Leaderboard,
    NextBountyId,
    Bounty(u64),
    BountyIds,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum BountyError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidReward = 3,
    BountyMissing = 4,
    AlreadyFunded = 5,
    NotCreator = 6,
    NotFunded = 7,
    AlreadyCompleted = 8,
}

#[contract]
pub struct BountyContract;

#[contractimpl]
impl BountyContract {
    pub fn initialize(env: Env, admin: Address, token: Address, leaderboard: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, BountyError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Leaderboard, &leaderboard);
        env.storage().instance().set(&DataKey::NextBountyId, &1_u64);
        env.storage().instance().set(&DataKey::BountyIds, &Vec::<u64>::new(&env));
        extend_instance(&env);
    }

    pub fn create_bounty(env: Env, creator: Address, metadata: String, reward: i128) -> u64 {
        if reward <= 0 {
            panic_with_error!(&env, BountyError::InvalidReward);
        }
        creator.require_auth();

        let id = next_bounty_id(&env);
        let bounty = Bounty {
            id,
            creator: creator.clone(),
            metadata,
            reward,
            funded: false,
            completed: false,
            winner: None,
            created_at: env.ledger().timestamp(),
            funded_at: None,
            completed_at: None,
        };

        env.storage().persistent().set(&DataKey::Bounty(id), &bounty);
        let mut ids: Vec<u64> = env.storage().instance().get(&DataKey::BountyIds).unwrap();
        ids.push_back(id);
        env.storage().instance().set(&DataKey::BountyIds, &ids);
        env.storage().instance().set(&DataKey::NextBountyId, &(id + 1));

        env.events()
            .publish((symbol_short!("bnty_crt"), creator), (id, reward));
        extend_instance(&env);
        id
    }

    pub fn fund_bounty(env: Env, bounty_id: u64) {
        let mut bounty = load_bounty(&env, bounty_id);
        if bounty.funded {
            panic_with_error!(&env, BountyError::AlreadyFunded);
        }
        let creator = bounty.creator.clone();
        creator.require_auth();

        TokenClient::new(&env, &get_token(&env)).transfer_from(
            &env.current_contract_address(),
            &creator,
            &env.current_contract_address(),
            &bounty.reward,
        );

        bounty.funded = true;
        bounty.funded_at = Some(env.ledger().timestamp());
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);
        env.events()
            .publish((symbol_short!("bnt_fund"), creator), (bounty_id, bounty.reward));
        extend_instance(&env);
    }

    pub fn complete_bounty(env: Env, resolver: Address, bounty_id: u64, winner: Address) {
        let mut bounty = load_bounty(&env, bounty_id);
        if bounty.completed {
            panic_with_error!(&env, BountyError::AlreadyCompleted);
        }
        if !bounty.funded {
            panic_with_error!(&env, BountyError::NotFunded);
        }

        let admin = get_admin(&env);
        let creator = bounty.creator.clone();
        if resolver != creator && resolver != admin {
            panic_with_error!(&env, BountyError::NotCreator);
        }
        if resolver == admin {
            admin.require_auth();
        } else {
            creator.require_auth();
        }

        TokenClient::new(&env, &get_token(&env)).transfer(
            &env.current_contract_address(),
            &MuxedAddress::from(winner.clone()),
            &bounty.reward,
        );
        LeaderboardClient::new(&env, &get_leaderboard(&env))
            .record_bounty_completion(&env.current_contract_address(), &winner, &bounty.reward);

        bounty.completed = true;
        bounty.completed_at = Some(env.ledger().timestamp());
        bounty.winner = Some(winner.clone());
        env.storage().persistent().set(&DataKey::Bounty(bounty_id), &bounty);
        env.events().publish(
            (symbol_short!("bnt_done"), creator, winner),
            (bounty_id, bounty.reward),
        );
        extend_instance(&env);
    }

    pub fn get_bounty(env: Env, bounty_id: u64) -> Bounty {
        load_bounty(&env, bounty_id)
    }

    pub fn list_bounties(env: Env) -> Vec<Bounty> {
        let ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::BountyIds)
            .unwrap_or(Vec::new(&env));
        let mut bounties = Vec::<Bounty>::new(&env);
        for id in ids.iter() {
            bounties.push_back(load_bounty(&env, id));
        }
        bounties
    }
}

fn next_bounty_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextBountyId)
        .unwrap_or_else(|| panic_with_error!(env, BountyError::NotInitialized))
}

fn load_bounty(env: &Env, bounty_id: u64) -> Bounty {
    env.storage()
        .persistent()
        .get(&DataKey::Bounty(bounty_id))
        .unwrap_or_else(|| panic_with_error!(env, BountyError::BountyMissing))
}

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, BountyError::NotInitialized))
}

fn get_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .unwrap_or_else(|| panic_with_error!(env, BountyError::NotInitialized))
}

fn get_leaderboard(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Leaderboard)
        .unwrap_or_else(|| panic_with_error!(env, BountyError::NotInitialized))
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

#[cfg(test)]
mod test {
    use super::*;
    use agentro_leaderboard::LeaderboardContract;
    use soroban_sdk::{testutils::Address as _, token::{StellarAssetClient, TokenClient}};
    const TEST_ALLOWANCE_EXPIRY: u32 = 1_000_000;

    #[test]
    fn full_bounty_lifecycle_releases_reward_and_updates_leaderboard() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let winner = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let leaderboard_id = env.register(LeaderboardContract, ());
        let bounty_id = env.register(BountyContract, ());

        let token_admin = StellarAssetClient::new(&env, &token_id);
        let token = TokenClient::new(&env, &token_id);
        let leaderboard = LeaderboardClient::new(&env, &leaderboard_id);
        let bounty = BountyContractClient::new(&env, &bounty_id);

        leaderboard.initialize(&admin);
        leaderboard.add_source(&bounty_id);
        bounty.initialize(&admin, &token_id, &leaderboard_id);
        token_admin.mint(&creator, &1_000);
        token.approve(&creator, &bounty_id, &300, &TEST_ALLOWANCE_EXPIRY);

        let created_id = bounty.create_bounty(
            &creator,
            &String::from_str(
                &env,
                "{\"title\":\"Signal model\",\"description\":\"Ship alpha report\"}",
            ),
            &300,
        );
        bounty.fund_bounty(&created_id);
        bounty.complete_bounty(&creator, &created_id, &winner);

        assert!(bounty.get_bounty(&created_id).completed);
        assert_eq!(token.balance(&winner), 300);
        assert_eq!(token.balance(&bounty_id), 0);
        assert_eq!(leaderboard.get_user_stats(&winner).bounties_completed, 1);
    }
}
