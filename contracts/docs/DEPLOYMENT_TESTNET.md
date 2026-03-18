# Agentro Testnet Deployment

Deployed on March 18, 2026 to Stellar Soroban Testnet.

## Contract Addresses

- XLM Asset SAC: derive from `Asset.native().contractId("Test SDF Network ; September 2015")`
- Payment: `CCAOSNZNVNZPJRPPPOVLGRWWNCEYPFYFB6EF5NAJF4FE43KIWB5VD7VQ`
- Leaderboard: `CAGTBHWT2OU4OS6EDK3HHJ3A6DVLXFI3OE2WBUGUWTOATWY5AR3CDI4V`
- Bounty: `CALEZTBUJFWH7KQTW34LJL7JVG7X4TR7GBDPOSJZEDMOFRGIYFDRVL62`
- Agent Manager: `CBYZ4EGIIWXYXAK6N7QAFSA6MV5VIO6SZS6ZHM4WTCC3UEDCD3WJ54VS`

## Identities

- Admin: `GAVRMNUYDJNYOIIFAQLXILURMRRH2XJHVSE2G3GCV2HZLXF4HKLZA365`
- Treasury: `GAYBJ4YYQMC5BMKW632EVKTZAYKIZGDDAOJ6DVHCOUEHPCA5HNT2NTZA`
- Example user: `GAL6XNM7VZMP5H2E7EY2TIT63ZHF52NUA3D7EPYFBZXXRMHORL3564QT`

## Initialization Parameters

- XLM decimals: `7`
- XLM symbol: `XLM`
- Minimum subscription amount: `10000000`
- Subscription period: `2592000` seconds
- Default analysis fee: `10000000`

## Verified Live Flow

Executed successfully:

1. Funded the admin and example user with testnet XLM and approved the XLM SAC for contract spending.
2. Created agent `1`.
3. Approved and paid for analysis from the example user.
4. Created bounty `1`.
5. Funded bounty `1`.
6. Completed bounty `1` to the example user.
7. Queried leaderboard and confirmed:
   - `bounties_completed = 1`
   - `total_earnings = 30000000`

## Example Live Commands

```powershell
stellar contract invoke --network testnet --source agentro-admin --id CBHWUYJV7ST3Y2FFGIZQLAVSNAAPIAX7C54LDLDEEJG2YMNSL2DW7MJK -- mint --to GAL6XNM7VZMP5H2E7EY2TIT63ZHF52NUA3D7EPYFBZXXRMHORL3564QT --amount 500000000

stellar contract invoke --network testnet --source testnet_user --id CBHWUYJV7ST3Y2FFGIZQLAVSNAAPIAX7C54LDLDEEJG2YMNSL2DW7MJK -- approve --from GAL6XNM7VZMP5H2E7EY2TIT63ZHF52NUA3D7EPYFBZXXRMHORL3564QT --spender CCAOSNZNVNZPJRPPPOVLGRWWNCEYPFYFB6EF5NAJF4FE43KIWB5VD7VQ --amount 10000000

stellar contract invoke --network testnet --source testnet_user --id CCAOSNZNVNZPJRPPPOVLGRWWNCEYPFYFB6EF5NAJF4FE43KIWB5VD7VQ -- pay_for_analysis --user GAL6XNM7VZMP5H2E7EY2TIT63ZHF52NUA3D7EPYFBZXXRMHORL3564QT --amount 10000000

stellar contract invoke --network testnet --source agentro-admin --id CALEZTBUJFWH7KQTW34LJL7JVG7X4TR7GBDPOSJZEDMOFRGIYFDRVL62 -- create_bounty --creator GAVRMNUYDJNYOIIFAQLXILURMRRH2XJHVSE2G3GCV2HZLXF4HKLZA365 --metadata '{"title":"Alpha signal review","description":"Verify weekly trend signal pack"}' --reward 30000000

stellar contract invoke --network testnet --source agentro-admin --id CALEZTBUJFWH7KQTW34LJL7JVG7X4TR7GBDPOSJZEDMOFRGIYFDRVL62 -- complete_bounty --resolver GAVRMNUYDJNYOIIFAQLXILURMRRH2XJHVSE2G3GCV2HZLXF4HKLZA365 --bounty_id 1 --winner GAL6XNM7VZMP5H2E7EY2TIT63ZHF52NUA3D7EPYFBZXXRMHORL3564QT

stellar contract invoke --network testnet --source agentro-admin --id CAGTBHWT2OU4OS6EDK3HHJ3A6DVLXFI3OE2WBUGUWTOATWY5AR3CDI4V -- get_top_users --limit 5
```
