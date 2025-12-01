import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

async function seedUser() {
  const email = 'hire-me@anshumat.org';
  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    await prisma.user.create({
      data: {
        email,
        password: 'HireMe@2025!'
      }
    });
    console.log("✅ Seed user created: hire-me@anshumat.org");
  }
}

seedUser().catch((err) => {
  console.warn('Seed skipped or failed:', err && err.message ? err.message : err);
});


app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'BudgetBox backend', timestamp: new Date() });
});

app.post('/budget/sync', async (req: Request, res: Response) => {
  const { email, budget } = req.body;
  
  if (!email || !budget) {
     return res.status(400).json({ error: "Missing data" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.budget.create({
      data: {
        userId: user.id,
        income: Number(budget.income),
        monthlyBills: Number(budget.monthlyBills),
        food: Number(budget.food),
        transport: Number(budget.transport),
        subscriptions: Number(budget.subscriptions),
        miscellaneous: Number(budget.miscellaneous)
      }
    });

    res.json({ success: true, timestamp: new Date() });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

app.get('/budget/latest', async (req: Request, res: Response) => {
  const { email } = req.query;
  
  try {
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const latestBudget = await prisma.budget.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(latestBudget || {}); 
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});


app.get('/budget/history', async (req: Request, res: Response) => {
  const { email } = req.query;

  try {
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const history = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 10 
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "History fetch failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));