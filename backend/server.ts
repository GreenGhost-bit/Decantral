import express, { Request, Response } from 'express';
import cors from 'cors';
import algosdk from 'algosdk';
import crypto from 'crypto';
import dotenv from 'dotenv';
import * as config from '../config';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// The Oracle Account (Must match the one used during contract deployment)
// Using an ephemeral test account or load from env
const Mnemonic = process.env.ORACLE_MNEMONIC || "price size point ..."; // placeholder
let oracleAccount: algosdk.Account;

try {
  oracleAccount = algosdk.mnemonicToSecretKey(Mnemonic);
  console.log('Oracle Address:', oracleAccount.addr);
} catch (e) {
  // Generate random if env not structured yet
  oracleAccount = algosdk.generateAccount();
  console.log('Generated Temporary Oracle Address:', oracleAccount.addr);
}

// Simple Mock GST Database
const validIRNs = new Set<string>([
  "IRN-1001-GSTIN-001",
  "IRN-2002-GSTIN-002"
]);

const ANCHOR_PAYORS = ["Tata Motors", "Reliance Industries", "Infosys", "Mahindra & Mahindra", "Adani Group", "ITC Limited"];
const ANCHOR_APY = 0.08;
const OPEN_MARKET_APY = 0.14;

const mockBoxStorage: Record<string, string> = {};

app.post('/api/invoices/verify', (req: Request, res: Response): any => {
  try {
    const { invoiceRef, faceValue, payorName, dueDate } = req.body;
    
    if (!invoiceRef || !faceValue || !payorName || !dueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const invoiceData = { invoiceRef, faceValue, payorName, dueDate };
    const hashHex = crypto.createHash('sha256').update(JSON.stringify(invoiceData)).digest('hex');
    const hash = "0x" + hashHex;
    
    // IRN Uniqueness Check
    const isDuplicate = Object.values(mockBoxStorage).some(str => {
       const parsed = JSON.parse(str);
       return parsed.invoiceRef === invoiceRef;
    });
    if (isDuplicate) {
       return res.status(400).json({ error: "Invoice IRN already tokenized!" });
    }

    // store the hash in a mock box storage object in memory
    mockBoxStorage[hash] = JSON.stringify(invoiceData);

    const discountRate = ANCHOR_PAYORS.includes(payorName) ? ANCHOR_APY : OPEN_MARKET_APY; 
    const daysToMaturity = Math.max(1, Math.round((dueDate - Date.now()) / 86400000));
    const pVal = faceValue * (1 - (discountRate * (daysToMaturity / 365)));
    const presentValue = Number(pVal.toFixed(2));
    const protocolFee = Number((faceValue - presentValue).toFixed(2));

    return res.json({
      success: true,
      hash,
      presentValue,
      protocolFee
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/verify-invoice', (req: Request, res: Response): any => {
  try {
    const { irn, amount, maturityDate } = req.body;

    if (!irn || !amount || !maturityDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Mock GST Validation Verification
    // In production, this would make an HTTPS call to GSTIN APIs
    if (!validIRNs.has(irn)) {
      // We will allow all for the hackathon demo, but add a 1s delay
      console.log(`Mocking GST check for unknown IRN: ${irn}`);
    }

    // 2. Mocking the Digital Deed of Assignment
    const deedOfAssignment = {
      irn,
      legalTitle: "Transfer of Receivables",
      assignorSme: amount,
      assigneeProtocol: "Decantral Pool",
      timestamp: Date.now()
    };
    
    const deedString = JSON.stringify(deedOfAssignment);
    const irnHash = crypto.createHash('sha256').update(deedString).digest();

    // 3. Generate Cryptographic Signature over the Deed Hash using Oracle's Private Key
    // As per Puya.ts `ed25519verify(data, sig, pubkey)` -> we sign the raw data bytes
    const signature = algosdk.signBytes(irnHash, oracleAccount.sk);

    // 4. Return the payload necessary for the `mint_invoice` frontend call
    return res.json({
      success: true,
      irnHash: irnHash.toString('base64'),
      deedString, // To keep off-chain
      signature: Buffer.from(signature).toString('base64'),
      oracleAddress: oracleAccount.addr.toString(),
      amount,
      maturityDate
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Algorand Indexer Client Setup
const indexerClient = new algosdk.Indexer(
  config.INDEXER_TOKEN || '', 
  config.INDEXER_SERVER, 
  config.INDEXER_PORT
);

let cachedInvoices: any[] = [];

// Seed mock invoices matching the exact response shape
const mockInvoices = [
  {
    invoiceId: 'MOCK-INV-001',
    faceValue: 10000,
    discountRate: 0.08,
    daysToMaturity: 30,
    payorName: 'Tata Motors',
    status: 'ACTIVE',
    presentValue: Number((10000 * (1 - 0.08 * 30 / 365)).toFixed(2))
  },
  {
    invoiceId: 'MOCK-INV-002',
    faceValue: 25000,
    discountRate: 0.08,
    daysToMaturity: 15,
    payorName: 'Reliance Industries',
    status: 'FUNDED',
    presentValue: Number((25000 * (1 - 0.08 * 15 / 365)).toFixed(2))
  },
  {
    invoiceId: 'MOCK-INV-003',
    faceValue: 5000,
    discountRate: 0.08,
    daysToMaturity: 45,
    payorName: 'Adani Group',
    status: 'ACTIVE',
    presentValue: Number((5000 * (1 - 0.08 * 45 / 365)).toFixed(2))
  },
  {
    invoiceId: 'MOCK-INV-004',
    faceValue: 15000,
    discountRate: 0.14,
    daysToMaturity: 60,
    payorName: 'TechNova Solutions (SME)',
    status: 'ACTIVE',
    presentValue: Number((15000 * (1 - 0.14 * 60 / 365)).toFixed(2))
  }
];

app.get('/api/invoices', (req: Request, res: Response): any => {
  const baseInvoices = cachedInvoices.length > 0 ? cachedInvoices : mockInvoices;
  
  const formattedBase = baseInvoices.map(inv => ({
     ...inv,
     id: inv.invoiceId || inv.id,
     payor: inv.payorName,
     availableYield: Number(((inv.discountRate || 0.08) * 100).toFixed(1)),
     matureDate: new Date(Date.now() + (inv.daysToMaturity * 86400000)).toISOString().split('T')[0],
     fractionAvailable: inv.status === 'FUNDED' ? 0 : inv.faceValue,
     fractionTotal: inv.faceValue,
     creditScore: 'AAA'
  }));

  const dynamicInvoices = Object.keys(mockBoxStorage).map(hash => {
    const data = JSON.parse(mockBoxStorage[hash]);
    const discountRate = ANCHOR_PAYORS.includes(data.payorName) ? ANCHOR_APY : OPEN_MARKET_APY; 
    const daysToMaturity = Math.max(1, Math.round((data.dueDate - Date.now()) / 86400000));
    const pVal = data.faceValue * (1 - (discountRate * (daysToMaturity / 365)));
    
    return {
      invoiceId: hash.substring(0, 10),
      id: hash.substring(0, 10),
      faceValue: data.faceValue,
      discountRate,
      daysToMaturity,
      payorName: data.payorName,
      payor: data.payorName,
      status: 'ACTIVE',
      presentValue: Number(pVal.toFixed(2)),
      availableYield: discountRate * 100,
      matureDate: new Date(data.dueDate).toISOString().split('T')[0],
      fractionAvailable: data.faceValue,
      fractionTotal: data.faceValue,
      creditScore: "AA"
    };
  });

  return res.json([...formattedBase, ...dynamicInvoices]);
});

app.get('/api/pools', (req: Request, res: Response): any => {
  const currentInvoices = cachedInvoices.length > 0 ? cachedInvoices : mockInvoices;

  const pool1 = {
    name: "Anchor Grade Pool",
    apyRate: ANCHOR_APY * 100,
    allowedPayors: ANCHOR_PAYORS,
    description: "Low-risk invoices from verified anchor corporates",
    totalLiquidity: 0,
    activeInvoices: 0,
    utilizationRate: 0
  };

  const pool2 = {
    name: "Open Market Pool",
    apyRate: OPEN_MARKET_APY * 100,
    allowedPayors: [],
    description: "Higher yield, open to all verified GST invoices",
    totalLiquidity: 0,
    activeInvoices: 0,
    utilizationRate: 0
  };

  for (const inv of currentInvoices) {
    const isPool1 = pool1.allowedPayors.includes(inv.payorName);
    const targetPool = isPool1 ? pool1 : pool2;
    
    targetPool.totalLiquidity += inv.presentValue;
    if (inv.status === 'FUNDED') {
      targetPool.activeInvoices += 1;
    }
  }

  const CAPACITY = 10000000;
  pool1.utilizationRate = Math.min(100, (pool1.totalLiquidity / CAPACITY) * 100);
  pool2.utilizationRate = Math.min(100, (pool2.totalLiquidity / CAPACITY) * 100);

  pool1.totalLiquidity = Number(pool1.totalLiquidity.toFixed(2));
  pool1.utilizationRate = Number(pool1.utilizationRate.toFixed(2));
  pool2.totalLiquidity = Number(pool2.totalLiquidity.toFixed(2));
  pool2.utilizationRate = Number(pool2.utilizationRate.toFixed(2));

  return res.json([pool1, pool2]);
});

app.post('/api/invoices/:id/status', (req: Request, res: Response): any => {
  const invoiceId = req.params.id;
  const targetArray = cachedInvoices.length > 0 ? cachedInvoices : mockInvoices;
  
  const invoice = targetArray.find((inv: any) => inv.invoiceId === invoiceId || inv.id === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  invoice.status = 'FUNDED';
  return res.json({ success: true, newStatus: 'FUNDED' });
});

app.get('/api/invoices/:id/yield-amount', (req: Request, res: Response): any => {
  const invoiceId = req.params.id;
  const targetArray = cachedInvoices.length > 0 ? cachedInvoices : mockInvoices;
  
  const invoice = targetArray.find((inv: any) => inv.invoiceId === invoiceId || inv.id === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  // Simulated yield payout logic
  const discountRate = invoice.discountRate || 0.08;
  const daysToMaturity = typeof invoice.daysToMaturity === 'number' ? invoice.daysToMaturity : 30;
  
  const payout = invoice.presentValue * (1 + (discountRate * Math.max(1, daysToMaturity) / 365));
  return res.json({ yieldPayout: Number(payout.toFixed(2)) });
});

app.post('/api/simulate-default/:invoiceId', (req: Request, res: Response): any => {
  const invoiceId = req.params.invoiceId;
  const targetArray = cachedInvoices.length > 0 ? cachedInvoices : mockInvoices;
  
  const invoice = targetArray.find((inv: any) => inv.invoiceId === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  invoice.status = 'DEFAULTED';
  
  const securityStake = invoice.faceValue * 0.10;

  const penaltyDistribution = [
    { investorAddress: "WALLET_ALPHA", asaHoldings: Number((invoice.faceValue * 0.50).toFixed(2)), penaltyAlgo: Number((securityStake * 0.50).toFixed(2)), percentageOfTotal: 50 },
    { investorAddress: "WALLET_BETA", asaHoldings: Number((invoice.faceValue * 0.30).toFixed(2)), penaltyAlgo: Number((securityStake * 0.30).toFixed(2)), percentageOfTotal: 30 },
    { investorAddress: "WALLET_GAMMA", asaHoldings: Number((invoice.faceValue * 0.20).toFixed(2)), penaltyAlgo: Number((securityStake * 0.20).toFixed(2)), percentageOfTotal: 20 }
  ];

  return res.json(penaltyDistribution);
});

// Indexer Service Cron Job for Box Storage
const runIndexerCron = async () => {
    try {
      const boxResponse = await indexerClient.searchForApplicationBoxes(config.APP_ID).do();
      const newInvoices: any[] = [];
      
      if (boxResponse.boxes && boxResponse.boxes.length > 0) {
         console.log(`[Indexer] Auditing ${boxResponse.boxes.length} active Box Storage records...`);
         for (const box of boxResponse.boxes) {
            const boxData = await indexerClient.lookupApplicationBoxByIDandName(config.APP_ID, box.name).do();
            
            let faceValue = 0;
            if (boxData.value.length === 8) {
              faceValue = Number(Buffer.from(boxData.value).readBigUInt64BE(0));
            }

            const invoiceId = Buffer.from(box.name).toString('base64');
            let payorName = "Auto-" + invoiceId.substring(0, 4); 
            let discountRate = ANCHOR_PAYORS.includes(payorName) ? ANCHOR_APY : OPEN_MARKET_APY; 
            let daysToMaturity = 30; 
            let status = 'ACTIVE';

            // Preserve local changes across cron cycles
            const existing = cachedInvoices.find(i => i.invoiceId === invoiceId);
            if (existing) {
               discountRate = existing.discountRate;
               daysToMaturity = existing.daysToMaturity;
               payorName = existing.payorName;
               status = existing.status;
            }

            // Stateful chronological thresholds
            if (status === 'FUNDED' && daysToMaturity < 0) {
               status = 'OVERDUE';
            }
            if (status === 'OVERDUE' && daysToMaturity < -3) {
               status = 'DEFAULTED';
            }

            // Present Value Calculation P = F * (1 - d * t/365)
            const pVal = faceValue * (1 - (discountRate * (daysToMaturity / 365)));
            const presentValue = Number(pVal.toFixed(2));

            newInvoices.push({
              invoiceId,
              faceValue,
              discountRate,
              daysToMaturity,
              payorName,
              status,
              presentValue
            });
         }
         cachedInvoices = newInvoices;
      } else {
         console.log(`[Indexer Status] Waiting for valid Application ID Box deployments...`);
      }
    } catch (e: any) {
      if (e?.code === 'ECONNREFUSED') {
         console.log(`[Indexer Warning] Local or Remote Indexer currently offline. Retrying...`);
      } else {
         console.error(`[Indexer Error]`, e);
      }
    }
};

// Check every 30 seconds, run immediately on boot
runIndexerCron();
setInterval(runIndexerCron, 30000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Decantral Backend Oracle listening on port ${PORT}`);
});
