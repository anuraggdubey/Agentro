#![no_std]

use agentro_interfaces::{LeaderboardContractTrait, UserStats};
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, Vec,
};

const INSTANCE_BUMP_AMOUNT: u32 = 7 * 24 * 60 * 60 / 5;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - 1000;

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    AuthorizedSource(Address),
    UserStats(Address),
    KnownUser(Address),
    Users,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum LeaderboardError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    UnauthorizedSource = 3,
}

#[contract]
pub struct LeaderboardContract;

#[contractimpl]
impl LeaderboardContractTrait for LeaderboardContract {
    fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, LeaderboardError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Users, &Vec::<Address>::new(&env));
        extend_instance(&env);
    }

    fn add_source(env: Env, source: Address) {
        get_admin(&env).require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::AuthorizedSource(source), &true);
        extend_instance(&env);
    }

    fn record_bounty_completion(env: Env, source: Address, user: Address, reward: i128) {
        source.require_auth();
        let authorized = env
            .storage()
            .persistent()
            .get(&DataKey::AuthorizedSource(source.clone()))
            .unwrap_or(false);
        if !authorized {
            panic_with_error!(&env, LeaderboardError::UnauthorizedSource);
        }

        let mut stats = Self::get_user_stats(env.clone(), user.clone());
        stats.total_earnings += reward;
        stats.bounties_completed += 1;
        env.storage()
            .persistent()
            .set(&DataKey::UserStats(user.clone()), &stats);

        if !env
            .storage()
            .persistent()
            .get(&DataKey::KnownUser(user.clone()))
            .unwrap_or(false)
        {
            let mut users: Vec<Address> = env.storage().instance().get(&DataKey::Users).unwrap();
            users.push_back(user.clone());
            env.storage().instance().set(&DataKey::Users, &users);
            env.storage()
                .persistent()
                .set(&DataKey::KnownUser(user.clone()), &true);
        }

        env.events().publish(
            (symbol_short!("lb_update"), user),
            (reward, stats.total_earnings, stats.bounties_completed),
        );
        extend_instance(&env);
    }

    fn get_user_stats(env: Env, user: Address) -> UserStats {
        env.storage()
            .persistent()
            .get(&DataKey::UserStats(user.clone()))
            .unwrap_or(UserStats {
                user,
                total_earnings: 0,
                bounties_completed: 0,
            })
    }

    fn get_top_users(env: Env, limit: u32) -> Vec<UserStats> {
        let users: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Users)
            .unwrap_or(Vec::new(&env));
        let mut stats = Vec::<UserStats>::new(&env);
        for user in users.iter() {
            stats.push_back(Self::get_user_stats(env.clone(), user));
        }

        let len = stats.len();
        let mut i = 0;
        while i < len {
            let mut j = i + 1;
            while j < len {
                let a = stats.get(i).unwrap();
                let b = stats.get(j).unwrap();
                if should_swap(&a, &b) {
                    stats.set(i, b.clone());
                    stats.set(j, a);
                }
                j += 1;
            }
            i += 1;
        }

        let mut top = Vec::<UserStats>::new(&env);
        let max = if limit < stats.len() {
            limit
        } else {
            stats.len()
        };
        let mut idx = 0;
        while idx < max {
            top.push_back(stats.get(idx).unwrap());
            idx += 1;
        }
        top
    }
}

fn should_swap(left: &UserStats, right: &UserStats) -> bool {
    right.total_earnings > left.total_earnings
        || (right.total_earnings == left.total_earnings
            && right.bounties_completed > left.bounties_completed)
}

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, LeaderboardError::NotInitialized))
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

#[cfg(test)]
mod test {
    use super::*;
    use agentro_interfaces::LeaderboardClient;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn records_and_ranks_users() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(LeaderboardContract, ());
        let client = LeaderboardClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let source = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.initialize(&admin);
        client.add_source(&source);

        client.record_bounty_completion(&source, &alice, &100);
        client.record_bounty_completion(&source, &bob, &250);
        client.record_bounty_completion(&source, &alice, &150);

        let top = client.get_top_users(&2);
        assert_eq!(client.get_user_stats(&alice).total_earnings, 250);
        assert_eq!(top.get(0).unwrap().user, alice);
        assert_eq!(top.get(1).unwrap().user, bob);
    }
}
