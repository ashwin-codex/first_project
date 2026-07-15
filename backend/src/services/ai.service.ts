import { GoogleGenerativeAI } from '@google/generative-ai';
import { ITransaction, IBudget, IChatMessage } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (apiKey) {
  try {
    // Initialise GenAI client using @google/generative-ai
    aiClient = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini GenAI Client:', error);
  }
}

export class AIService {
  /**
   * Generates a brief financial recommendation ticker message based on latest figures.
   */
  static async getDashboardSuggestion(
    transactions: ITransaction[],
    budgets: IBudget[],
    currency: string = 'USD'
  ): Promise<string> {
    const summary = this.computeFinancialSummary(transactions, budgets);

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are PocketPilot, a luxury AI finance coach. Here is the user's brief financial summary:
          - Total Income this month: ${summary.totalIncome} ${currency}
          - Total Expense this month: ${summary.totalExpense} ${currency}
          - Category breakdown: ${JSON.stringify(summary.expensesByCategory)}
          - Active category budgets: ${JSON.stringify(summary.budgetsMap)}
          
          Provide a single, powerful financial recommendation sentence (under 120 characters) for their dashboard.
          Focus on optimizing their top spending categories or congratulating savings progress. Be highly professional and direct. No greeting, no markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text.trim();
      } catch (error) {
        console.error('Gemini API Error in Dashboard Suggestion, falling back to mock.', error);
      }
    }

    // Dynamic mock fallback
    return this.generateMockDashboardSuggestion(summary, currency);
  }

  /**
   * Chat interaction with memory capability
   */
  static async chatWithCoach(
    query: string,
    history: IChatMessage[],
    transactions: ITransaction[],
    budgets: IBudget[],
    currency: string = 'USD'
  ): Promise<string> {
    const summary = this.computeFinancialSummary(transactions, budgets);
    const systemPrompt = `
      You are PocketPilot, a premium AI financial advisor and personal wealth coach.
      Use the following context about the user's finances if they ask about their budget, status, or spending:
      - Total Monthly Income: ${summary.totalIncome} ${currency}
      - Total Monthly Expense: ${summary.totalExpense} ${currency}
      - Monthly Savings: ${summary.totalIncome - summary.totalExpense} ${currency}
      - Spending by Category: ${JSON.stringify(summary.expensesByCategory)}
      - Budgets: ${JSON.stringify(summary.budgetsMap)}
      - Financial Health Score: ${summary.healthScore}/100

      Guidelines:
      1. Provide crisp, professional advice. Keep formatting clean with Markdown.
      2. If asked about category limits, list them.
      3. For investment basics, advise diversified mutual funds, ETFs, index trackers, or custom bonds.
      4. Always be encouraging and realistic. Suggest cutting discretionary expenses if they are over budget.
      5. Reference their real spending numbers directly to build trust.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Map internal history message format to Gemini's format:
        // Role mapping: 'user' -> 'user', 'model' -> 'model'
        const contents = history.map((msg) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        // Append current message
        contents.push({
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }]
        });

        const result = await model.generateContent({ contents });
        return result.response.text().trim();
      } catch (error) {
        console.error('Gemini API Chat Error, falling back to rule-based mock.', error);
      }
    }

    return this.generateMockChatResponse(query, summary, currency);
  }

  /**
   * Generates budget planning suggestions
   */
  static async getBudgetSuggestions(
    transactions: ITransaction[],
    budgets: IBudget[],
    currency: string = 'USD'
  ): Promise<string[]> {
    const summary = this.computeFinancialSummary(transactions, budgets);

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are PocketPilot AI. Analyze this user's budgets and spending breakdown:
          - Spending by Category: ${JSON.stringify(summary.expensesByCategory)}
          - Active Limits: ${JSON.stringify(summary.budgetsMap)}
          - Savings: ${summary.totalIncome - summary.totalExpense} ${currency} (Savings Rate: ${((1 - summary.totalExpense / (summary.totalIncome || 1)) * 100).toFixed(1)}%)

          Suggest 3 distinct, specific monthly budget adjustment recommendations as short bullet points. Each point should be under 80 characters.
          Be precise, e.g., "Reduce Dining Out limit by 50 ${currency} to matches your average spending."
          Return ONLY the 3 recommendations separated by newlines, do not add numbered lists or general text.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text
          .split('\n')
          .map((line: string) => line.replace(/^-\s*/, '').trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 3);
      } catch (error) {
        console.error('Gemini Budget Suggestion Error, falling back to mock.', error);
      }
    }

    return this.generateMockBudgetSuggestions(summary, currency);
  }

  // HELPER CALCULATION MODULE
  public static computeFinancialSummary(transactions: ITransaction[], budgets: IBudget[]) {
    let totalIncome = 0;
    let totalExpense = 0;
    const expensesByCategory: Record<string, number> = {};
    const budgetsMap: Record<string, number> = {};

    // Group transactions
    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
      }
    });

    // Map budgets
    budgets.forEach((b) => {
      budgetsMap[b.category] = b.limit;
    });

    // Compute Health Score
    // Base 50 points
    let healthScore = 60;

    // Savings rate scoring (up to 20 points)
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? savings / totalIncome : 0;
    if (savingsRate > 0.3) healthScore += 20;
    else if (savingsRate > 0.1) healthScore += 10;
    else if (savingsRate < 0) healthScore -= 15; // spending more than making

    // Budget compliance scoring (up to 20 points)
    let limitsExceeded = 0;
    let limitCategories = 0;
    Object.keys(budgetsMap).forEach((cat) => {
      limitCategories++;
      const spent = expensesByCategory[cat] || 0;
      if (spent > budgetsMap[cat]) {
        limitsExceeded++;
      }
    });

    if (limitCategories > 0) {
      const complianceRate = (limitCategories - limitsExceeded) / limitCategories;
      healthScore += Math.round(complianceRate * 20);
    } else {
      healthScore += 10; // default points for setting up budgets
    }

    // Constraint health score boundaries
    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      totalIncome,
      totalExpense,
      expensesByCategory,
      budgetsMap,
      healthScore
    };
  }

  // DYNAMIC MOCK GENERATORS
  private static generateMockDashboardSuggestion(summary: any, currency: string): string {
    const savings = summary.totalIncome - summary.totalExpense;
    if (summary.totalIncome === 0 && summary.totalExpense === 0) {
      return 'Welcome! Let\'s begin by registering your first transaction to unlock customized AI savings metrics.';
    }

    // Find if any budget exceeded
    const overBudgetCategories: string[] = [];
    Object.keys(summary.budgetsMap).forEach((cat) => {
      if ((summary.expensesByCategory[cat] || 0) > summary.budgetsMap[cat]) {
        overBudgetCategories.push(cat);
      }
    });

    if (overBudgetCategories.length > 0) {
      return `Alert: You've exceeded your monthly budget in ${overBudgetCategories.join(', ')}. Optimize discretionary spending immediately.`;
    }

    if (savings < 0) {
      return 'Warning: Your expenses exceed your income this month. We recommend analyzing entertainment and dining tabs.';
    }

    const savingsRate = summary.totalIncome > 0 ? (savings / summary.totalIncome) * 100 : 0;
    if (savingsRate >= 30) {
      return `Outstanding! Your monthly savings rate is at ${savingsRate.toFixed(0)}%. You are in prime position to invest surplus cash.`;
    }

    // Default top spending recommendation
    let topCategory = '';
    let topCategoryAmt = 0;
    Object.keys(summary.expensesByCategory).forEach((cat) => {
      if (summary.expensesByCategory[cat] > topCategoryAmt) {
        topCategoryAmt = summary.expensesByCategory[cat];
        topCategory = cat;
      }
    });

    if (topCategory) {
      return `Your top spending category is ${topCategory} (${topCategoryAmt} ${currency}). Consider budgeting this next month.`;
    }

    return 'Your finances look stable. Keep logging transactions daily to compile comprehensive monthly health analytics.';
  }

  private static generateMockBudgetSuggestions(summary: any, currency: string): string[] {
    const suggestions: string[] = [];

    // 1. Analyze Food / Discretionary average spending
    const foodSpent = summary.expensesByCategory['Food'] || summary.expensesByCategory['Dining Out'] || 0;
    const foodLimit = summary.budgetsMap['Food'] || summary.budgetsMap['Dining Out'] || 0;

    if (foodLimit > 0 && foodSpent > foodLimit) {
      suggestions.push(`Adjust Food: Reduce limit by ${(foodSpent - foodLimit + 50).toFixed(0)} ${currency} next month and restrict dining out.`);
    } else if (foodSpent > 200 && !foodLimit) {
      suggestions.push(`Create a 'Food' budget category capped at ${(foodSpent * 0.9).toFixed(0)} ${currency} to trim impulse eating.`);
    } else {
      suggestions.push('Create a discretionary budget limit at 15% lower than current spending ratios.');
    }

    // 2. Savings optimization
    const savings = summary.totalIncome - summary.totalExpense;
    if (savings > 500) {
      suggestions.push(`Automated transfer: Move ${(savings * 0.5).toFixed(0)} ${currency} of current surplus directly into a High-Yield Savings Account.`);
    } else {
      suggestions.push('Review streaming services and subscription bills to free up extra investment funds.');
    }

    // 3. Category adjustments based on actuals
    let adjustmentDone = false;
    Object.keys(summary.budgetsMap).forEach((cat) => {
      if (!adjustmentDone) {
        const limit = summary.budgetsMap[cat];
        const spent = summary.expensesByCategory[cat] || 0;
        if (spent < limit * 0.6 && limit > 100) {
          suggestions.push(`Optimize ${cat} limit: Reduce from ${limit} to ${(spent + 30).toFixed(0)} ${currency} to align with actual usage.`);
          adjustmentDone = true;
        }
      }
    });

    if (!adjustmentDone) {
      suggestions.push(`Goal tracker: Lock down a ${currency} 100 weekly emergency reserve before allocating leisure budgets.`);
    }

    return suggestions;
  }

  private static generateMockChatResponse(query: string, summary: any, currency: string): string {
    const q = query.toLowerCase();
    const savings = summary.totalIncome - summary.totalExpense;

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `### Hello! I am PocketPilot, your AI Financial Assistant. 

How can I assist you today? Here is a high-level summary of your account to get started:
* **Monthly Balance:** \`${savings} ${currency}\`
* **Health Score:** \`${summary.healthScore}/100\`

Ask me about **budget optimization**, **investment basics**, **saving goals**, or a **financial health summary**!`;
    }

    if (q.includes('health') || q.includes('score') || q.includes('summary')) {
      return `### Financial Health Summary 📊

Your current PocketPilot Financial Health Score is **${summary.healthScore}/100**. Here is the breakdown:

* **Income vs Expenses:** You earned \`${summary.totalIncome} ${currency}\` and spent \`${summary.totalExpense} ${currency}\` this period.
* **Savings Margin:** Your net surplus is \`${savings} ${currency}\` (${summary.totalIncome > 0 ? ((savings/summary.totalIncome)*100).toFixed(0) : 0}% savings rate).
* **Budget Allocations:** You have set up budgets for \`${Object.keys(summary.budgetsMap).length}\` categories.

**Actionable Advice:**
${savings < 0 ? '⚠️ You are currently spending more than you earn. Prioritize freezing entertainment subscriptions.' : '✅ You have positive savings. I recommend locking 20% of your earnings straight into investments.'}`;
    }

    if (q.includes('invest') || q.includes('portfolio') || q.includes('stock')) {
      return `### Wealth Building & Investment Basics 📈

Based on your current savings pool (\`${savings} ${currency}\`), here is a premium strategy for long-term growth:

1. **Emergency Reserve:** Keep at least 3-6 months of expenses (\`${(summary.totalExpense * 3).toFixed(0)} ${currency}\`) in a high-yield savings account (HYSA) before investing in volatile assets.
2. **Index Funds & ETFs:** Allocate capital toward low-cost index tracking funds (e.g. S&P 500 trackers). They provide diversification and historically compound at 7-10% annually.
3. **Automate Contributions:** Treat investing like a bill. Setup automated monthly transfers of 10-15% of your income into your brokerage account.

*Disclaimer: I am your AI assistant, not a licensed broker. Always review risk profiles before funding accounts.*`;
    }

    if (q.includes('budget') || q.includes('optimize') || q.includes('spending') || q.includes('category')) {
      // Find over category
      let worstCat = '';
      let worstAmt = 0;
      Object.keys(summary.budgetsMap).forEach((cat) => {
        const spent = summary.expensesByCategory[cat] || 0;
        const limit = summary.budgetsMap[cat];
        if (spent > limit && spent - limit > worstAmt) {
          worstAmt = spent - limit;
          worstCat = cat;
        }
      });

      return `### Category Budget Optimization 🎯

Here is an analysis of your spending versus monthly budget targets:

${worstCat ? `* **Critical Warning:** Your category **${worstCat}** is over its budget by **${worstAmt.toFixed(0)} ${currency}**. We recommend suspending unnecessary purchases in this area.` : '* **Excellent Progress:** None of your registered budgets are currently exceeded! Keep maintaining your spending limits.'}

**AI Spending Recommendations:**
- Review your top spending categories: \`${JSON.stringify(summary.expensesByCategory)}\`.
- If you have categories with no budgets set up, consider enforcing caps.
- Try the 50/30/20 Rule: Allocate 50% for Needs, 30% for Wants, and 20% for Savings/Investments.`;
    }

    return `### PocketPilot AI Coach 🚀

I received your question: "${query}".

As your financial assistant, I can help you:
- Track and optimize your **monthly budgets**.
- Give advice on **saving strategies** and **investment plans**.
- Review your **spending history** and categories.
- Improve your overall financial **health score**.

Could you clarify if you'd like an analysis of your recent transactions, budget tips, or investment tutorials?`;
  }
}
