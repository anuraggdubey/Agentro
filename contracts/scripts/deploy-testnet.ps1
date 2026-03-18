param(
  [string]$Network = "testnet",
  [string]$Admin = "agentro-admin",
  [string]$Treasury = "agentro-treasury",
  [string]$AssetContractId = ""
)

$ErrorActionPreference = "Stop"

stellar contract build

$paymentWasmHash = stellar contract upload --network $Network --source $Admin --wasm .\target\wasm32v1-none\release\agentro_payment.wasm
$managerWasmHash = stellar contract upload --network $Network --source $Admin --wasm .\target\wasm32v1-none\release\agentro_agent_manager.wasm
$leaderboardWasmHash = stellar contract upload --network $Network --source $Admin --wasm .\target\wasm32v1-none\release\agentro_leaderboard.wasm
$bountyWasmHash = stellar contract upload --network $Network --source $Admin --wasm .\target\wasm32v1-none\release\agentro_bounty.wasm

if (-not $AssetContractId) {
  $networkPassphrase = if ($Network -eq "mainnet") {
    "Public Global Stellar Network ; September 2015"
  } else {
    "Test SDF Network ; September 2015"
  }

  $AssetContractId = node -e "const { Asset } = require('../frontend/node_modules/@stellar/stellar-sdk'); console.log(Asset.native().contractId(process.argv[1]));" $networkPassphrase
}

$paymentId = stellar contract deploy --network $Network --source $Admin --wasm-hash $paymentWasmHash
$leaderboardId = stellar contract deploy --network $Network --source $Admin --wasm-hash $leaderboardWasmHash
$bountyId = stellar contract deploy --network $Network --source $Admin --wasm-hash $bountyWasmHash
$managerId = stellar contract deploy --network $Network --source $Admin --wasm-hash $managerWasmHash

stellar contract invoke --network $Network --source $Admin --id $paymentId -- initialize --admin "$(stellar keys address $Admin)" --token "$AssetContractId" --treasury "$(stellar keys address $Treasury)" --min_subscription_amount 10000000 --subscription_period_secs 2592000
stellar contract invoke --network $Network --source $Admin --id $leaderboardId -- initialize --admin "$(stellar keys address $Admin)"
stellar contract invoke --network $Network --source $Admin --id $bountyId -- initialize --admin "$(stellar keys address $Admin)" --token "$AssetContractId" --leaderboard "$leaderboardId"
stellar contract invoke --network $Network --source $Admin --id $leaderboardId -- add_source --source "$bountyId"
stellar contract invoke --network $Network --source $Admin --id $managerId -- initialize --admin "$(stellar keys address $Admin)" --payment_contract "$paymentId" --default_analysis_fee 10000000

Write-Host "XLM Asset SAC: $AssetContractId"
Write-Host "Payment:       $paymentId"
Write-Host "Leaderboard:   $leaderboardId"
Write-Host "Bounty:        $bountyId"
Write-Host "Agent Manager: $managerId"
