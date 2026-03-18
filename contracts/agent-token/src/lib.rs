#![no_std]

use agentro_interfaces::{AgentTokenContractTrait, TokenMetadata};
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, String,
};

const INSTANCE_BUMP_AMOUNT: u32 = 7 * 24 * 60 * 60 / 5;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - 1000;

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Metadata,
    Balance(Address),
    Allowance(Address, Address),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AmountMustBePositive = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
}

#[contract]
pub struct AgentTokenContract;

#[contractimpl]
impl AgentTokenContractTrait for AgentTokenContract {
    fn initialize(env: Env, admin: Address, name: String, symbol: String, decimals: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, TokenError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::Metadata,
            &TokenMetadata {
                name,
                symbol,
                decimals,
            },
        );
        extend_instance(&env);
    }

    fn mint(env: Env, to: Address, amount: i128) {
        require_positive_amount(&env, amount);
        let admin = Self::admin(env.clone());
        admin.require_auth();
        let next = Self::balance(env.clone(), to.clone()) + amount;
        env.storage().persistent().set(&DataKey::Balance(to.clone()), &next);
        env.events().publish((symbol_short!("mint"), to), amount);
        extend_instance(&env);
    }

    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        require_positive_amount(&env, amount);
        from.require_auth();
        move_balance(&env, &from, &to, amount);
        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
        extend_instance(&env);
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        require_positive_amount(&env, amount);
        spender.require_auth();
        spend_allowance(&env, &from, &spender, amount);
        move_balance(&env, &from, &to, amount);
        env.events()
            .publish((symbol_short!("xferfrom"), spender, from, to), amount);
        extend_instance(&env);
    }

    fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        if amount < 0 {
            panic_with_error!(&env, TokenError::AmountMustBePositive);
        }
        from.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &amount);
        env.events()
            .publish((symbol_short!("approve"), from, spender), amount);
        extend_instance(&env);
    }

    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }

    fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::NotInitialized))
    }

    fn metadata(env: Env) -> TokenMetadata {
        env.storage()
            .instance()
            .get(&DataKey::Metadata)
            .unwrap_or_else(|| panic_with_error!(&env, TokenError::NotInitialized))
    }
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn require_positive_amount(env: &Env, amount: i128) {
    if amount <= 0 {
        panic_with_error!(env, TokenError::AmountMustBePositive);
    }
}

fn spend_allowance(env: &Env, from: &Address, spender: &Address, amount: i128) {
    let current = AgentTokenContract::allowance(env.clone(), from.clone(), spender.clone());
    if current < amount {
        panic_with_error!(env, TokenError::InsufficientAllowance);
    }
    env.storage()
        .persistent()
        .set(&DataKey::Allowance(from.clone(), spender.clone()), &(current - amount));
}

fn move_balance(env: &Env, from: &Address, to: &Address, amount: i128) {
    let from_balance = AgentTokenContract::balance(env.clone(), from.clone());
    if from_balance < amount {
        panic_with_error!(env, TokenError::InsufficientBalance);
    }
    let to_balance = AgentTokenContract::balance(env.clone(), to.clone());
    env.storage()
        .persistent()
        .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
    env.storage()
        .persistent()
        .set(&DataKey::Balance(to.clone()), &(to_balance + amount));
}

#[cfg(test)]
mod test {
    use super::*;
    use agentro_interfaces::AgentTokenClient;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn mint_transfer_and_allowance_flow() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(AgentTokenContract, ());
        let client = AgentTokenClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let spender = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(
            &admin,
            &String::from_str(&env, "Agentro Token"),
            &String::from_str(&env, "AGT"),
            &7,
        );
        client.mint(&user, &1_000);
        client.transfer(&user, &recipient, &250);
        client.approve(&user, &spender, &300);
        client.transfer_from(&spender, &user, &recipient, &200);

        assert_eq!(client.allowance(&user, &spender), 100);
        assert_eq!(client.balance(&user), 550);
        assert_eq!(client.balance(&recipient), 450);
    }
}
