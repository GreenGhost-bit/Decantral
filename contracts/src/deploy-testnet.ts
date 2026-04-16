/**
 * Decantral Testnet Deployment Script
 * 
 * Deploys the Hello contract to Algorand TestNet, then prints the APP_ID
 * and ORACLE_ADDRESS so they can be committed to config.ts.
 */
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';

const MNEMONIC = "icon purse fossil eyebrow asset chicken patient supreme senior flame motor grow draw east sunset sleep nation develop people sock victory soul robust absent check";

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT   = 443;
const ALGOD_TOKEN  = '';

async function main() {
  // 1. Derive wallet from mnemonic
  const account = algosdk.mnemonicToSecretKey(MNEMONIC);
  console.log('========================================');
  console.log('DEPLOYER / ORACLE ADDRESS:', account.addr);
  console.log('========================================');

  // 2. Connect to Algorand TestNet
  const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

  // 3. Check balance
  const accountInfo = await algodClient.accountInformation(account.addr).do();
  const balanceMicroAlgo = Number((accountInfo as any).amount ?? (accountInfo as any)['amount']);
  console.log(`Balance: ${(balanceMicroAlgo / 1e6).toFixed(4)} ALGO`);

  if (balanceMicroAlgo < 200_000) {
    console.error('ERROR: Insufficient balance. Fund this address with TestNet ALGOs at https://bank.testnet.algorand.network/');
    console.error('Address to fund:', account.addr);
    process.exit(1);
  }

  // 4. Load compiled TEAL from artifacts
  const artifactsDir = path.resolve(__dirname, '../../Decantral/projects/Decantral/smart_contracts/artifacts/hello');
  const approvalTeal = fs.readFileSync(path.join(artifactsDir, 'Hello.approval.teal'), 'utf8');
  const clearTeal    = fs.readFileSync(path.join(artifactsDir, 'Hello.clear.teal'), 'utf8');

  console.log('Loaded TEAL programs from artifacts.');
  console.log('Compiling approval program...');

  // 5. Compile TEAL to bytecode
  const approvalResult = await algodClient.compile(Buffer.from(approvalTeal)).do();
  const clearResult    = await algodClient.compile(Buffer.from(clearTeal)).do();

  const approvalProgram = new Uint8Array(Buffer.from((approvalResult as any).result, 'base64'));
  const clearProgram    = new Uint8Array(Buffer.from((clearResult as any).result, 'base64'));

  console.log('Compilation successful.');

  // 6. Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 7. Create Application Transaction
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: account.addr,
    approvalProgram,
    clearProgram,
    numGlobalInts: 0,
    numGlobalByteSlices: 0,
    numLocalInts: 0,
    numLocalByteSlices: 0,
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
  } as any);

  // 8. Sign and send
  const signedTxn = txn.signTxn(account.sk);
  console.log('Sending deployment transaction...');
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do() as any;
  console.log('TxID:', txId);

  // 9. Wait for confirmation
  console.log('Waiting for confirmation...');
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const appId = (confirmedTxn as any)['application-index'] ?? (confirmedTxn as any).applicationIndex;

  console.log('');
  console.log('════════════════════════════════════════');
  console.log('  DEPLOYMENT SUCCESSFUL');
  console.log('════════════════════════════════════════');
  console.log(`  APP_ID:         ${appId}`);
  console.log(`  ORACLE_ADDRESS: ${account.addr}`);
  console.log(`  TX_ID:          ${txId}`);
  console.log(`  Network:        Algorand TestNet`);
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('Next step: Update config.ts with these values.');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
