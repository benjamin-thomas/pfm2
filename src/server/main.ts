import express from 'express';
import { TransactionRepoFake } from './repos/transaction/fake';
import { AccountRepoFake, CategoryRepoFake } from './repos/account/fake';
import { BalanceRepoFake } from './repos/balance/fake';
import { registerTransactionRoutes } from './routes/transactionRoutes';
import { registerBalanceRoutes } from './routes/balanceRoutes';

if (!process.env.BE_PORT) throw new Error('Missing mandatory env var: BE_PORT');
if (!process.env.BE_HOST) throw new Error('Missing mandatory env var: BE_HOST');
if (!process.env.FE_BASE_URL) throw new Error('Missing mandatory env var: FE_BASE_URL');

const BE_PORT = parseInt(process.env.BE_PORT, 10);
const BE_HOST = process.env.BE_HOST;
const FE_BASE_URL = process.env.FE_BASE_URL;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FE_BASE_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Initialize repositories
const transactionRepo = TransactionRepoFake.initWithSeed();
const accountRepo = AccountRepoFake.init();
const categoryRepo = CategoryRepoFake.init();
const balanceRepo = BalanceRepoFake.init(transactionRepo, accountRepo, categoryRepo);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/hello/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

registerTransactionRoutes(app, transactionRepo);
registerBalanceRoutes(app, balanceRepo);

// Start server
app.listen(BE_PORT, BE_HOST, () => {
  console.log(`🚀 Server running on http://${BE_HOST}:${BE_PORT}`);
  console.log(`📡 Expecting frontend at: ${FE_BASE_URL}`);
});
