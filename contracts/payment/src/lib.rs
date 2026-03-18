#![no_std]

use agentro_interfaces::PaymentContractTrait;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address,
    Env, token::TokenClient,
};

const INSTANCE_BUMP_AMOUNT: u32 = 7 * 24 * 60 * 60 / 5;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - 1000;

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Token,
    Treasury,
    MinSubscriptionAmount,
    SubscriptionPeriod,
    SubscriptionExpiry(Address),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum PaymentError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AmountTooSmall = 3,
}

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContractTrait for PaymentContract {
    fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        treasury: Address,
        min_subscription_amount: i128,
        subscription_period_secs: u64,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, PaymentError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage()
            .instance()
            .set(&DataKey::MinSubscriptionAmount, &min_subscription_amount);
        env.storage()
            .instance()
            .set(&DataKey::SubscriptionPeriod, &subscription_period_secs);
        extend_instance(&env);
    }

    fn pay_for_analysis(env: Env, user: Address, amount: i128) {
        user.require_auth();
        let min_amount = get_min_subscription_amount(&env);
        if amount < min_amount {
            panic_with_error!(&env, PaymentError::AmountTooSmall);
        }

        let token = get_token(&env);
        let treasury = get_treasury(&env);
        let current = current_subscription_expiry(&env, user.clone());
        let now = env.ledger().timestamp();
        let base = if current > now { current } else { now };
        let expires_at = base + get_subscription_period(&env);

        TokenClient::new(&env, &token).transfer_from(
            &env.current_contract_address(),
            &user,
            &treasury,
            &amount,
        );
        env.storage()
            .persistent()
            .set(&DataKey::SubscriptionExpiry(user.clone()), &expires_at);

        env.events()
            .publish((symbol_short!("payment"), user, treasury), (amount, expires_at));
        extend_instance(&env);
    }

    fn has_active_subscription(env: Env, user: Address) -> bool {
        current_subscription_expiry(&env, user) > env.ledger().timestamp()
    }

    fn subscription_expiry(env: Env, user: Address) -> u64 {
        current_subscription_expiry(&env, user)
    }

    fn token(env: Env) -> Address {
        get_token(&env)
    }

    fn treasury(env: Env) -> Address {
        get_treasury(&env)
    }
}

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn current_subscription_expiry(env: &Env, user: Address) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::SubscriptionExpiry(user))
        .unwrap_or(0)
}

fn get_token(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .unwrap_or_else(|| panic_with_error!(env, PaymentError::NotInitialized))
}

fn get_treasury(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Treasury)
        .unwrap_or_else(|| panic_with_error!(env, PaymentError::NotInitialized))
}

fn get_min_subscription_amount(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::MinSubscriptionAmount)
        .unwrap_or_else(|| panic_with_error!(env, PaymentError::NotInitialized))
}

fn get_subscription_period(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::SubscriptionPeriod)
        .unwrap_or_else(|| panic_with_error!(env, PaymentError::NotInitialized))
}

#[cfg(test)]
mod test {
    use super::*;
    use agentro_interfaces::PaymentContractClient;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::StellarAssetClient,
    };
    const TEST_ALLOWANCE_EXPIRY: u32 = 1_000_000;

    #[test]
    fn payment_flow_locks_user_allowance_and_updates_subscription() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|ledger| {
            ledger.timestamp = 1_700_000_000;
        });

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let user = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let payment_id = env.register(PaymentContract, ());
        let token = StellarAssetClient::new(&env, &token_id);
        let payment = PaymentContractClient::new(&env, &payment_id);

        payment.initialize(&admin, &token_id, &treasury, &100, &(30 * 24 * 60 * 60));
        token.mint(&user, &500);
        token.approve(&user, &payment_id, &200, &TEST_ALLOWANCE_EXPIRY);

        payment.pay_for_analysis(&user, &100);

        assert_eq!(token.balance(&user), 400);
        assert_eq!(token.balance(&treasury), 100);
        assert!(payment.has_active_subscription(&user));
    }
}
