import {
  Contract,
  Bytes,
  Txn,
  Global,
  BoxMap,
  Account,
  AssetTransferTxn,
  PayTxn,
  uint64,
  bytes,
  arc4,
  assert,
  ed25519verify,
  itxn,
  extract
} from '@algorandfoundation/algorand-typescript';

// Stake Storage
const stakeStorage = new BoxMap<Account, uint64>();

// Invoice Storage: maps IRN Hash -> Settled (0 or 1)
const invoiceStorage = new BoxMap<bytes, uint64>();

export class Decantral extends Contract {
  
  // Oracle address approved to sign GST verification
  oracleAddress = Global.creatorAddress; 
  // Map of Anchor Payors allowed to issue secondary risk signatures
  anchorPayors = new BoxMap<Account, uint64>();

  @arc4.abimethod()
  public setupAdmin(oracleAddress: Account): void {
    assert(Txn.sender === Global.creatorAddress);
    this.oracleAddress = oracleAddress;
  }

  @arc4.abimethod()
  public register_anchor(anchor: Account): void {
    assert(Txn.sender === Global.creatorAddress); // Protocol admin registers corporates
    this.anchorPayors.set(anchor, 1);
  }

  // Lock Security Stake from SME
  @arc4.abimethod()
  public lock_stake(payment: PayTxn): void {
    assert(payment.receiver === Global.currentApplicationAddress);
    
    let currentStake: uint64 = stakeStorage.get(Txn.sender, { default: 0 } as any) as uint64;
    stakeStorage.set(Txn.sender, currentStake + payment.amount);
  }

  // Mint a fractionalized invoice ASA with Dual-Signature (Oracle + Anchor)
  @arc4.abimethod()
  public mint_invoice(
    irnHash: bytes,         // Hash of Legal Deed of Assignment + IRN
    faceValue: uint64,
    maturity: uint64,
    verifierSig: bytes,     // GST Oracle Signature
    anchorSig: bytes,       // Anchor Payor Signature (Corporate acceptance of debt)
    anchorPubkey: Account   // Anchor Payor Address
  ): uint64 {
    // 1. Double Discounting Protection: Check Box Storage
    assert(!invoiceStorage.has(irnHash), "Invoice already tokenized");

    // 2. Validate Dual Signatures
    // 2A. GST Oracle verify
    assert(
      ed25519verify(irnHash, verifierSig, this.oracleAddress.bytes),
      "Invalid Oracle signature for GST verification"
    );
    // 2B. Legal Verification: Anchor Payor verifies the specific invoice is legitimate
    assert(this.anchorPayors.has(anchorPubkey), "Unregistered Anchor Payor");
    assert(
      ed25519verify(irnHash, anchorSig, anchorPubkey.bytes),
      "Invalid Anchor Payor signature"
    );

    // 3. Mark as tokenized
    invoiceStorage.set(irnHash, faceValue);

    // 4. Create ASA
    const assetName = Bytes("INV-").concat(extract(irnHash, 0, 4));

    const createdAsset = itxn.assetConfig({
      total: faceValue,
      decimals: 0,
      defaultFrozen: false,
      assetName: assetName,
      unitName: Bytes("DEC"),
      url: Bytes("https://decantral.factoring/irn"),
    }).submit();

    return createdAsset.createdAsset().id;
  }

  // Settle invoice and delete Box to reclaim MBR
  @arc4.abimethod()
  public settle_invoice(irnHash: bytes): void {
    assert(invoiceStorage.has(irnHash), "Invoice not found");
    // Delete the box storage (reclaims MBR)
    invoiceStorage.delete(irnHash);
  }

  // Admin slash
  @arc4.abimethod()
  public slash_stake(sme: Account): void {
    assert(Txn.sender === Global.creatorAddress, "Unauthorized");
    stakeStorage.delete(sme); // Confiscates logic
  }

  // Discount Swap: using an Atomic Transfer Group
  // Txn 0: Investor pays Stablecoin to SME (99%)
  // Txn 1: SME sends Invoice-ASA units to Investor
  // Txn 2: SME sends Origination Fee (1%) to Treasury
  @arc4.abimethod()
  public discount_swap(
    investorPayment: AssetTransferTxn, // Using Asset for Stablecoin
    asaTransfer: AssetTransferTxn,
    feePayment: PayTxn
  ): void {
    // Enforce Atomicity and Routing
    assert(investorPayment.sender === Txn.sender);
    assert(asaTransfer.receiver === Txn.sender);
    
    // Explicit 1% Routing to Decantral Treasury
    assert(feePayment.receiver === Global.creatorAddress, "Fee must route to Protocol Treasury");
    // Calculate the expected fee relative to the total value passed
    // Assume investorPayment.assetAmount represents 99% of total transaction value. So fee = Payment / 99.
    const expectedFeeAmount = investorPayment.assetAmount / 99; 
    assert(feePayment.amount >= expectedFeeAmount, "Origination fee 1% insufficient");
  }
}
