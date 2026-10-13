// ===== Shared content for all three concepts =====
// The single source of facts. Each concept's script.js maps this onto its own
// metaphor (flights, index cards, tracks). After changing anything here, run
//   node tools/sync-html.js
// to write it into the pages, then open tools/check.html to confirm.
// A link set to null hides its button.
window.PORTFOLIO = {
  identity: {
    name: 'Abdulsamad Aliyu',
    headline: 'AI, data and security engineer',
    focus: 'AI, data and security',
    intro: 'I build software people rely on, and I check the numbers before anyone else has to.',
    city: 'Aberdeen, UK',
    seeking: 'Junior and graduate roles in AI, data and security.'
  },

  about: [
    "I'm an engineer who works across AI, data and security. For the past year I've built and run a finance platform that a self-employed client uses every day. That work taught me to ship in small releases, track what people actually use, and check outputs against an independent source rather than trusting the tests.",
    'Before that I finished an MSc in Artificial Intelligence at the University of Stirling, after a BSc in Cybersecurity at Robert Gordon University. I like problems where the answer has to be right, not just plausible.'
  ],

  skills: {
    groups: [
      { label: 'Languages', items: ['Python', 'SQL', 'TypeScript'] },
      { label: 'AI and ML', items: ['PyTorch', 'scikit-learn', 'LLM APIs', 'evaluation sets', 'feature engineering', 'anomaly detection', 'time-series forecasting'] },
      { label: 'Data', items: ['Postgres', 'Pandas', 'NumPy', 'Excel'] },
      { label: 'Security', items: ['authentication and access-control review', 'webhook verification', 'AES-GCM', 'Splunk', 'Scapy'] },
      { label: 'Engineering', items: ['automated testing', 'REST APIs', 'Git', 'Docker', 'Linux', 'AWS', 'Azure', 'Supabase', 'React'] }
    ],
    // A short selection for slots set in large type (Mixtape "Instruments").
    short: ['Python', 'SQL', 'TypeScript', 'PyTorch', 'scikit-learn', 'Postgres']
  },

  // Order matters: the first four are featured, the fifth fills Catalogue tab E.
  // status: 'shipped' | 'progress' | 'concept'
  projects: [
    {
      slug: 'finance-platform',
      name: 'Finance platform in daily use',
      short: 'Finance platform',
      year: '2025–present',
      status: 'shipped',
      client: 'Private client (self-employed)',
      role: 'Sole builder',
      tags: ['Product', 'Data', 'Security'],
      stack: ['Python', 'SQL', 'Postgres', 'TypeScript', 'Supabase'],
      summary: 'A platform a self-employed client uses every day for income, invoices, expenses and UK tax.',
      stat: '6 security weaknesses found and fixed',
      problem: 'My client was running her finances from spreadsheets. She needed one place for income, invoicing, expenses and tax that she could trust.',
      built: [
        'Combined three data sources into one structure: a direct bank feed, photographed receipts read with OCR, and forwarded invoice emails.',
        'Shipped four AI features in small releases: receipt OCR with categorisation, invoice filling from forwarded emails, overdue-invoice chasing and savings plans.'
      ],
      outcome: [
        'Tracked use after release. Two AI features are used constantly and one is barely touched, and that changed what I built next.',
        'Caught a tax figure that was wrong while every automated test passed, by checking the output against published HMRC guidance, then corrected the logic.',
        'Found and fixed six security weaknesses, including a login with no attempt limit, nine routes reachable without signing in, and a webhook that would accept a forged message.',
        'Traced a live incident where an email loop sent over 400 messages and fixed it the same day.'
      ],
      link: null // private client work, never linked
    },
    {
      slug: 'text-to-sql',
      name: 'Ask a database in plain English',
      short: 'Text to SQL',
      year: '2025',
      status: 'shipped',
      client: null,
      role: null,
      tags: ['AI', 'Evaluation'],
      stack: ['Python', 'SQL', 'LLM APIs'],
      summary: 'An agent that turns plain-English questions into SQL, tested against its own gold-labelled question set.',
      stat: '60-question test set across 6 databases',
      problem: 'An LLM that writes SQL can return confident answers that are quietly wrong.',
      built: [
        'The agent reads a database schema at runtime, writes SQL, and reads the error and retries when a query fails. It works across six relational databases.',
        'Before trusting it, wrote a 60-question gold-labelled test set across three difficulty tiers.'
      ],
      outcome: [
        'Scored results by category instead of one overall average, which showed which question types it was getting quietly wrong.'
      ],
      link: null // repo to be added
    },
    {
      slug: 'customer-value',
      name: 'Customer lifetime value and churn',
      short: 'Customer value',
      year: '2026',
      status: 'shipped',
      client: null,
      role: null,
      tags: ['Data', 'Machine learning'],
      stack: ['Python', 'Pandas', 'SciPy', 'scikit-learn'],
      summary: 'Lifetime-value and churn models on 1,067,371 transaction lines from a UK online retailer, a public dataset (UCI Online Retail II).',
      stat: '0.73 ROC-AUC on churn, 0.68 for a simple rule',
      problem: 'A retailer has a fixed retention budget. Work out who is about to stop ordering, what each customer is worth, and who should get the offer.',
      built: [
        'Wrote the BG/NBD and Gamma-Gamma lifetime-value models from the equations.',
        'Predicted churn with gradient boosting, using a time-based backtest with no leakage.',
        'Segmented 5,852 customers with RFM, checked the segments against k-means, and mined 512 cross-sell rules from 33,361 baskets.'
      ],
      outcome: [
        "Churn prediction reached 0.73 ROC-AUC, against 0.68 for a simple 'no order in 90 days' rule.",
        "The lifetime-value model's own 'still active' score was no better than chance at predicting churn (0.48 ROC-AUC). Scoring it beside the simple rule is what showed that.",
        'The lifetime-value models ranked 6-month customer value better than gradient boosting (Spearman 0.61 against 0.50).',
        'Turned the scores into a retention plan: 2,195 of 4,261 active customers to contact, at an expected £2.27 back per £1 under stated margin and save-rate assumptions.'
      ],
      link: null
    },
    {
      slug: 'predictive-models',
      name: 'Churn, fraud and phishing models',
      short: 'Predictive models',
      year: '2024–2025',
      status: 'shipped',
      client: null,
      role: null,
      tags: ['Machine learning'],
      stack: ['Python', 'scikit-learn', 'Pandas'],
      summary: 'Classification models on 50,000 customer records and 50,000+ emails.',
      stat: '88% precision on churn',
      problem: 'Find the customers likely to leave, and the emails likely to be phishing, without drowning people in false alarms.',
      built: [
        'Churn and fraud models on 50,000 customer records.',
        'A phishing classifier on 50,000+ emails.'
      ],
      outcome: [
        'The churn model reached 88% precision. The gain came from multivariate feature engineering, not a bigger model.',
        'The phishing classifier improved precision by 28% over a baseline, through feature engineering and decision-threshold tuning.'
      ],
      link: null
    },
    {
      slug: 'anomaly-detection',
      name: 'Anomaly detection on event data',
      short: 'Anomaly detection',
      year: '2024–2025',
      status: 'shipped',
      client: null,
      role: null,
      tags: ['Data', 'Security'],
      stack: ['Python', 'scikit-learn (Isolation Forest)', 'SARIMA'],
      summary: 'Anomaly detection and forecasting on 50,000 unlabelled events arriving in six inconsistent formats.',
      stat: '50,000 events, 6 formats',
      problem: 'Events arrived unlabelled and in six inconsistent formats, so nothing could be flagged until they were made comparable.',
      built: [
        'Flagged anomalies with Isolation Forest, then added severity scoring so events were triaged by risk.'
      ],
      outcome: [
        'Event volume forecast with SARIMA alongside the triage.'
      ],
      link: null
    }
  ],

  // Not shown yet: no concept has a spare slot. Kept here so they carry across.
  extras: [
    { name: 'Controlled model comparisons', summary: 'Showed the smaller EfficientNet-B0 beat EfficientNetV2-S at 96.67% accuracy with a quarter of the parameters, and traced why (a learning-rate mismatch and class imbalance).', stack: ['PyTorch'] },
    { name: 'Q-learning vs SARSA (MSc research)', summary: 'A full hyperparameter sweep across 2 environments. The algorithm that converged faster learned riskier policies.', stack: ['PyTorch', 'Gymnasium'] },
    { name: 'Network traffic analyser', summary: 'Stateful and stateless threat detection.', stack: ['Python', 'Scapy'] },
    { name: 'Testing AI behaviour', summary: 'Scored 30 structured prompts across six risk categories on two language models against a written rubric, then re-tested after changes.', stack: [] }
  ],

  experience: [
    { dates: 'May 2026 – Sep 2026', role: 'Service assistant', org: "Sainsbury's, Aberdeen", summary: 'Served customers and covered several store functions in a high-volume store.' },
    { dates: 'Feb 2025 – Jun 2025', role: 'Website development & analytics intern', org: 'SPÈ Candles, remote', summary: 'Owned weekly analytics reporting and turned it into clear actions; engagement rose 25% over the placement.' },
    { dates: 'Nov 2021 – Jul 2022', role: 'Sales assistant', org: 'CeX, Aberdeen', summary: 'Held 99% accuracy grading and pricing 500+ stock items, and redesigned a slow pricing workflow, cutting average service time by 15%.' }
  ],

  education: [
    { title: 'MSc Artificial Intelligence', org: 'University of Stirling', dates: 'Sep 2024 – Jun 2026' },
    { title: 'BSc (Hons) Cybersecurity', org: 'The Robert Gordon University, Aberdeen', dates: 'Sep 2018 – Jul 2022' }
  ],

  certifications: [
    { title: 'AWS Certified AI Practitioner', date: 'Feb 2026' },
    { title: 'Microsoft Azure AI Fundamentals, AI-900', date: 'May 2026' },
    { title: 'ISC2 Certified in Cybersecurity', date: 'Apr 2025' }
  ],

  contact: {
    email: 'abdulsamadsaliyu@gmail.com',
    linkedin: 'https://www.linkedin.com/in/abdulsamad-aliyu-shehu-',
    github: null,
    cv: 'assets/Abdulsamad_Aliyu_CV.pdf' // a path from the site folder. null hides the CV links
  },

  meta: {
    // The concept served at the site's home address: 'departures' | 'catalogue' | 'mixtape'.
    // After changing it, run: node tools/sync-html.js
    home: 'departures',
    title: 'Abdulsamad Aliyu, AI, data and security engineer',
    rootTitle: 'Abdulsamad Aliyu, portfolio',
    description: 'Projects in AI, data and security: a finance platform in daily use, an evaluated text-to-SQL agent, and machine learning on 50,000-record datasets.'
  }
};

// Every skill as one flat list, for slots that show them all.
window.PORTFOLIO.skills.all = window.PORTFOLIO.skills.groups.flatMap((g) => g.items);
