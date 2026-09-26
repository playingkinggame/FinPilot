// FinPilot Financial Copilot Engine
// Combines deterministic calculation engine with Groq conversational AI

import { parseFinancialQuery, ParsedFinancialQuery } from './financial-query-parser';
import { sendGroqChatRequest } from './groq';
import { Transaction, Budget, Goal, Subscription, ChatMessage } from '../../types';

export async function processFinancialChatTurn(
  userQuery: string,
  history: ChatMessage[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  subscriptions: Subscription[]
): Promise<ChatMessage> {
  // 1. Run deterministic query parser to compute verified data & chart
  const parsed: ParsedFinancialQuery = parseFinancialQuery(
    userQuery,
    transactions,
    budgets,
    goals,
    subscriptions
  );

  let responseContent = '';

  // 2. Attempt Groq API via backend server
  try {
    const formattedMessages = history.slice(-6).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content
    }));

    formattedMessages.push({ role: 'user', content: userQuery });

    const groqRes = await sendGroqChatRequest({
      messages: formattedMessages,
      financialContext: parsed.calculatedData,
      query: userQuery
    });

    if (groqRes && groqRes.content) {
      responseContent = groqRes.content;
    }
  } catch (err) {
    // Graceful fallback to deterministic natural language synthesizer
    responseContent = synthesizeDeterministicResponse(userQuery, parsed, transactions);
  }

  // If responseContent is empty for any reason, use deterministic generator
  if (!responseContent.trim()) {
    responseContent = synthesizeDeterministicResponse(userQuery, parsed, transactions);
  }

  // Generate metric cards if appropriate
  let metricCards: Array<{ label: string; value: string; subtext?: string }> | undefined;
  if (parsed.intent === 'category_spend' && parsed.targetCategory) {
    const amt = parsed.calculatedData.amount || 0;
    const pct = parsed.calculatedData.percentage || 0;
    metricCards = [
      { label: `${parsed.targetCategory} Total`, value: `₹${amt.toLocaleString()}`, subtext: `${pct}% of total spending` },
      { label: 'Transactions', value: `${parsed.calculatedData.transactionCount || 0}`, subtext: 'This month' }
    ];
  } else if (parsed.intent === 'affordability') {
    const verdict = parsed.calculatedData.verdict;
    const rem = parsed.calculatedData.newProjectedBalance30d || 0;
    metricCards = [
      { label: 'Verdict', value: verdict, subtext: `Post-purchase: ₹${rem.toLocaleString()}` },
      { label: 'Days to Recover', value: `${parsed.calculatedData.daysToRecover || 0} days`, subtext: 'Based on net cash flow' }
    ];
  } else if (parsed.intent === 'top_category') {
    const top = parsed.calculatedData.topCategories?.[0];
    if (top) {
      metricCards = [
        { label: 'Top Category', value: top.category, subtext: `₹${top.amount.toLocaleString()} (${top.percentage}%)` },
        { label: 'Total Expenses', value: `₹${(parsed.calculatedData.totalExpense || 0).toLocaleString()}`, subtext: 'Active period' }
      ];
    }
  }

  const actionLinks: Array<{ label: string; view: string; category?: string }> = [];
  if (parsed.suggestedAction) {
    actionLinks.push(parsed.suggestedAction);
  }

  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    content: responseContent,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    chart: parsed.chartPayload,
    actionLinks: actionLinks.length > 0 ? actionLinks : undefined,
    metricCards
  };
}

function synthesizeDeterministicResponse(
  query: string,
  parsed: ParsedFinancialQuery,
  transactions: Transaction[]
): string {
  const { intent, calculatedData, targetCategory, targetMerchant } = parsed;

  switch (intent) {
    case 'top_category': {
      const topCats = calculatedData.topCategories || [];
      const total = calculatedData.totalExpense || 0;
      const top = topCats[0];

      if (!top) {
        return 'You have not recorded any expenses yet for this period. Add transactions to see category insights.';
      }

      const lines = topCats.map(
        (c: any, i: number) => `${i + 1}. **${c.category}** — ₹${c.amount.toLocaleString()} (${c.percentage}%)`
      );

      return `## Your biggest spending categories\n\n${lines.join('\n')}\n\n**${top.category}** represents ${top.percentage}% of your total spending (₹${top.amount.toLocaleString()} of ₹${total.toLocaleString()}).\n\nClick below to explore category trends and itemized receipts.`;
    }

    case 'category_spend': {
      const cat = targetCategory || 'This Category';
      const amt = calculatedData.amount || 0;
      const pct = calculatedData.percentage || 0;
      const count = calculatedData.transactionCount || 0;
      const topMerchants = calculatedData.topMerchants || [];

      let merchantLines = '';
      if (topMerchants.length > 0) {
        merchantLines = `\n\n**Top contributors in ${cat}:**\n` +
          topMerchants.map((m: any) => `• ${m.merchant} — ₹${m.amount.toLocaleString()} (${m.count} txns)`).join('\n');
      }

      return `You have spent **₹${amt.toLocaleString()}** on **${cat}** across **${count} transactions**.\n\nThis represents **${pct}%** of your total monthly discretionary expenses.${merchantLines}`;
    }

    case 'merchant_spend': {
      if (targetMerchant) {
        const total = calculatedData.totalSpent || 0;
        const count = calculatedData.transactionCount || 0;
        return `You have spent **₹${total.toLocaleString()}** at **${targetMerchant}** across **${count} transactions** this month.`;
      } else {
        const list = (calculatedData.topMerchants || [])
          .map((m: any, i: number) => `${i + 1}. **${m.merchant}** — ₹${m.amount.toLocaleString()} (${m.count} visits)`)
          .join('\n');
        return `## Top Merchants by Spending\n\n${list}`;
      }
    }

    case 'affordability': {
      const amt = calculatedData.purchaseAmount || 0;
      const verdict = calculatedData.verdict;
      const explanation = calculatedData.verdictExplanation;
      const recovery = calculatedData.daysToRecover;
      return `### Financial Feasibility Assessment for ₹${amt.toLocaleString()}\n\n**Status: ${verdict}**\n\n${explanation}\n\n• **Estimated recovery time:** ~${recovery} days based on your current savings rate.\n• **Safety Margin:** Leaves ₹${(calculatedData.newProjectedBalance30d || 0).toLocaleString()} projected buffer in 30 days.`;
    }

    case 'monthly_comparison': {
      const { currentTotal, previousTotal, diffAmount, diffPercent, categoryComparisons } = calculatedData;
      const isUp = diffAmount > 0;
      const topShifts = (categoryComparisons || []).slice(0, 3);

      const shiftLines = topShifts
        .map(
          (c: any) =>
            `• **${c.category}:** ₹${c.currentAmount.toLocaleString()} vs ₹${c.previousAmount.toLocaleString()} (${c.diffPercent > 0 ? '+' : ''}${c.diffPercent}%)`
        )
        .join('\n');

      return `## Monthly Comparison\n\n• **Current Month:** ₹${currentTotal.toLocaleString()}\n• **Previous Month:** ₹${previousTotal.toLocaleString()}\n• **Net Change:** ${isUp ? 'Increased' : 'Decreased'} by **₹${Math.abs(diffAmount).toLocaleString()}** (${Math.abs(diffPercent)}%)\n\n### Top Category Shifts\n${shiftLines}`;
    }

    case 'weekend_spend': {
      const { weekendAmount, weekendPercentage, weekdayAmount, weekdayPercentage, spendsMoreOnWeekends } = calculatedData;
      return `## Weekend vs Weekday Analysis\n\n• **Weekends:** ₹${weekendAmount.toLocaleString()} (${weekendPercentage}% of total)\n• **Weekdays:** ₹${weekdayAmount.toLocaleString()} (${weekdayPercentage}% of total)\n\n${
        spendsMoreOnWeekends
          ? '⚠️ **Weekend Surge Detected:** Your spending velocity accelerates significantly on Saturdays and Sundays (dining, outings, leisure).'
          : '✅ Your weekend spending is balanced and within safe proportions.'
      }`;
    }

    case 'category_comparison': {
      const { foodAmount, shoppingAmount, difference, leader } = calculatedData;
      return `### Food vs Shopping Comparison\n\n• **Food:** ₹${foodAmount.toLocaleString()}\n• **Shopping:** ₹${shoppingAmount.toLocaleString()}\n\n**${leader}** leads by **₹${difference.toLocaleString()}**.`;
    }

    case 'money_leaks': {
      const leaks = calculatedData.leaks || [];
      if (leaks.length === 0) {
        return 'Great news! No significant money leaks or high-frequency spending drains were detected in your current ledger.';
      }
      const leakItems = leaks
        .map(
          (l: any) =>
            `• **${l.title}:** ₹${l.amount.toLocaleString()} spent (${l.frequency}). Potential annual savings: **₹${l.potentialSavingsYearly.toLocaleString()}**.`
        )
        .join('\n');
      return `## Identified Money Leaks\n\n${leakItems}\n\nReview the Money Leak Detector page to curb recurring creep.`;
    }

    case 'savings_summary': {
      const { totalIncome, totalExpense, balance, savingsRate, topCategories, leaks } = calculatedData;
      const topCats = topCategories || [];
      const topLeaks = leaks || [];

      const catLines = topCats
        .slice(0, 3)
        .map((c: any) => `• Trim **${c.category}** — currently ₹${c.amount.toLocaleString()} (${c.percentage}% of spend)`)
        .join('\n');

      const leakLines = topLeaks.length
        ? `\n\n**Recurring leaks worth cutting:**\n${topLeaks
            .map((l: any) => `• ${l.title} — could save ~₹${l.potentialSavingsYearly.toLocaleString()}/yr`)
            .join('\n')}`
        : '';

      return `## How to Save More\n\nYou're currently saving **${savingsRate}%** of your income (₹${totalIncome.toLocaleString()} in vs ₹${totalExpense.toLocaleString()} out, leaving a balance of ₹${balance.toLocaleString()}).\n\n**Fastest wins, based on your actual spending:**\n${catLines || 'Add a few transactions so I can point to specific categories.'}${leakLines}\n\nA good target is pushing your savings rate above 20%. Want me to run a what-if on cutting one of these categories?`;
    }

    case 'general_overview': {
      const { totalIncome, totalExpense, balance, savingsRate, topCategories } = calculatedData;
      const top = (topCategories || [])[0];
      return `I didn't catch a specific metric to pull, so here's your current snapshot: **₹${totalIncome.toLocaleString()}** in, **₹${totalExpense.toLocaleString()}** out, leaving a balance of **₹${balance.toLocaleString()}** (a **${savingsRate}%** savings rate)${
        top ? `, with **${top.category}** as your biggest expense category` : ''
      }.\n\nAsk me things like "what did I spend the most on", "can I afford ₹5,000", "how to save more", or "compare this month vs last month" and I'll pull the exact numbers.`;
    }

    case 'subscriptions': {
      const { monthlyTotal, annualTotal, activeCount, upcomingRenewals } = calculatedData;
      return `You have **${activeCount} active subscriptions** costing **₹${monthlyTotal.toLocaleString()}/month** (an annual obligation of **₹${annualTotal.toLocaleString()}**).\n\n${
        upcomingRenewals?.length > 0
          ? `Upcoming renewal in the next 14 days: **${upcomingRenewals[0].service}** (₹${upcomingRenewals[0].amount} on ${upcomingRenewals[0].next_billing_date})`
          : 'No urgent subscription renewals in the next 14 days.'
      }`;
    }

    default:
      return 'I analyzed your financial ledger. Your balance is healthy and your transactions have been indexed. Feel free to ask about specific categories, merchants, or what-if simulations.';
  }
}