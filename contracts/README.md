# Agentro Soroban Contracts

## Structure

```text
contracts/
  Cargo.toml
  agent-token/
  payment/
  agent-manager/
  bounty/
  leaderboard/
  docs/ARCHITECTURE.md
  scripts/deploy-testnet.ps1
```

## Local Commands

```powershell
cd contracts
cargo test
stellar contract build
```

## Invocation Examples

```powershell
stellar contract invoke --network testnet --source agentro-admin --id <TOKEN_ID> -- mint --to <USER_ADDRESS> --amount 500000000
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <TOKEN_ID> -- approve --from <USER_ADDRESS> --spender <PAYMENT_ID> --amount 10000000
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <PAYMENT_ID> -- pay_for_analysis --user <USER_ADDRESS> --amount 10000000
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <BOUNTY_ID> -- create_bounty --creator <USER_ADDRESS> --metadata '{"title":"Model audit","description":"Audit strategy agent"}' --reward 30000000
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <TOKEN_ID> -- approve --from <USER_ADDRESS> --spender <BOUNTY_ID> --amount 30000000
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <BOUNTY_ID> -- fund_bounty --bounty_id 1
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <BOUNTY_ID> -- complete_bounty --resolver <USER_ADDRESS> --bounty_id 1 --winner <WINNER_ADDRESS>
stellar contract invoke --network testnet --source <OWNER_IDENTITY> --id <AGENT_MANAGER_ID> -- create_agent --owner <OWNER_ADDRESS> --metadata ipfs://bafy...
stellar contract invoke --network testnet --source <USER_IDENTITY> --id <AGENT_MANAGER_ID> -- use_agent --agent_id 1 --user <USER_ADDRESS> --amount 10000000
```

## Event Payloads

- `agt_crtd(owner) -> (agent_id, created_at)`
- `agt_used(owner, user) -> (agent_id, amount, timestamp)`
- `payment(user, treasury) -> (amount, expires_at)`
- `bnt_create(creator) -> (bounty_id, reward)`
- `bnty_crt(creator) -> (bounty_id, reward)`
- `bnt_fund(creator) -> (bounty_id, reward)`
- `bnt_done(creator, winner) -> (bounty_id, reward)`
- `lb_update(user) -> (reward, total_earnings, bounties_completed)`

## Live Testnet Deployment

- `AGT Token`: `CBHWUYJV7ST3Y2FFGIZQLAVSNAAPIAX7C54LDLDEEJG2YMNSL2DW7MJK`
- `Payment`: `CCAOSNZNVNZPJRPPPOVLGRWWNCEYPFYFB6EF5NAJF4FE43KIWB5VD7VQ`
- `Leaderboard`: `CAGTBHWT2OU4OS6EDK3HHJ3A6DVLXFI3OE2WBUGUWTOATWY5AR3CDI4V`
- `Bounty`: `CALEZTBUJFWH7KQTW34LJL7JVG7X4TR7GBDPOSJZEDMOFRGIYFDRVL62`
- `Agent Manager`: `CBYZ4EGIIWXYXAK6N7QAFSA6MV5VIO6SZS6ZHM4WTCC3UEDCD3WJ54VS`

Admin and treasury used for this deployment:

- `agentro-admin`: `GAVRMNUYDJNYOIIFAQLXILURMRRH2XJHVSE2G3GCV2HZLXF4HKLZA365`
- `agentro-treasury`: `GAYBJ4YYQMC5BMKW632EVKTZAYKIZGDDAOJ6DVHCOUEHPCA5HNT2NTZA`
