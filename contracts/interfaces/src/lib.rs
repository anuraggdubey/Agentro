#![no_std]

use soroban_sdk::{contractclient, contracttype, Address, Env, String, Vec};

#[derive(Clone)]
#[contracttype]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

#[contractclient(name = "AgentTokenClient")]
pub trait AgentTokenContractTrait {
    fn initialize(env: Env, admin: Address, name: String, symbol: String, decimals: u32);
    fn mint(env: Env, to: Address, amount: i128);
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128);
    fn approve(env: Env, from: Address, spender: Address, amount: i128);
    fn allowance(env: Env, from: Address, spender: Address) -> i128;
    fn balance(env: Env, id: Address) -> i128;
    fn admin(env: Env) -> Address;
    fn metadata(env: Env) -> TokenMetadata;
}

#[derive(Clone)]
#[contracttype]
pub struct UserStats {
    pub user: Address,
    pub total_earnings: i128,
    pub bounties_completed: u32,
}

#[contractclient(name = "LeaderboardClient")]
pub trait LeaderboardContractTrait {
    fn initialize(env: Env, admin: Address);
    fn add_source(env: Env, source: Address);
    fn record_bounty_completion(env: Env, source: Address, user: Address, reward: i128);
    fn get_user_stats(env: Env, user: Address) -> UserStats;
    fn get_top_users(env: Env, limit: u32) -> Vec<UserStats>;
}

#[contractclient(name = "PaymentContractClient")]
pub trait PaymentContractTrait {
    fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        treasury: Address,
        min_subscription_amount: i128,
        subscription_period_secs: u64,
    );
    fn pay_for_analysis(env: Env, user: Address, amount: i128);
    fn has_active_subscription(env: Env, user: Address) -> bool;
    fn subscription_expiry(env: Env, user: Address) -> u64;
    fn token(env: Env) -> Address;
    fn treasury(env: Env) -> Address;
}
