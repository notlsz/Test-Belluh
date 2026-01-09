
import { User, JournalEntry, EntryType, Mood, Insight, Circle, CircleType, CircleStatus, UserPersona } from './types';

export interface Organization {
  name: string;
  domain: string;
  logo?: string;
}

export const ORGANIZATIONS: Organization[] = [
  // Universities
  { 
    name: 'Oxford', 
    domain: 'ox.ac.uk',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/University_of_Oxford.svg/2560px-University_of_Oxford.svg.png'
  },
  { 
    name: 'Harvard', 
    domain: 'harvard.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_University_shield.png/1200px-Harvard_University_shield.png'
  },
  { 
    name: 'MIT', 
    domain: 'mit.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png'
  },
  { 
    name: 'Yale', 
    domain: 'yale.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/1200px-Yale_University_Shield_1.svg.png'
  },
  { 
    name: 'Princeton', 
    domain: 'princeton.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/1200px-Princeton_seal.svg.png'
  },
  { 
    name: 'Penn', 
    domain: 'upenn.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/1200px-UPenn_shield_with_banner.svg.png'
  },
  { 
    name: 'Cornell', 
    domain: 'cornell.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/1200px-Cornell_University_seal.svg.png'
  },
  { 
    name: 'USC', 
    domain: 'usc.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1200px-USC_Trojans_logo.svg.png'
  },
  { 
    name: 'UCLA', 
    domain: 'ucla.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_Bruins_primary_logo.svg/1200px-UCLA_Bruins_primary_logo.svg.png'
  },
  { 
    name: 'Cal', 
    domain: 'berkeley.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png'
  },
  { 
    name: 'UNC', 
    domain: 'unc.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/North_Carolina_Tar_Heels_logo.svg/1200px-North_Carolina_Tar_Heels_logo.svg.png'
  },
  { 
    name: 'UMich', 
    domain: 'umich.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_Wolverines_logo.svg/1200px-Michigan_Wolverines_logo.svg.png'
  },
  { 
    name: 'Waterloo', 
    domain: 'uwaterloo.ca',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Waterloo_seal.svg/1200px-University_of_Waterloo_seal.svg.png'
  },
  { 
    name: 'U of T', 
    domain: 'utoronto.ca',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Utoronto_coa.svg/1200px-Utoronto_coa.svg.png'
  },
  { 
    name: 'Rutgers', 
    domain: 'rutgers.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Rutgers_Scarlet_Knights_logo.svg/1200px-Rutgers_Scarlet_Knights_logo.svg.png'
  },
  // Tech & Finance
  {
    name: 'Amazon',
    domain: 'amazon.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png'
  },
  {
    name: 'Microsoft',
    domain: 'microsoft.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/2560px-Microsoft_logo_%282012%29.svg.png'
  },
  { 
    name: 'Google', 
    domain: 'google.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png'
  },
  { 
    name: 'Meta', 
    domain: 'meta.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1200px-Meta_Platforms_Inc._logo.svg.png'
  },
  { 
    name: 'OpenAI', 
    domain: 'openai.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1200px-OpenAI_Logo.svg.png'
  },
  { 
    name: 'Perplexity', 
    domain: 'perplexity.ai', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Perplexity_AI_logo.svg/1200px-Perplexity_AI_logo.svg.png'
  },
  { 
    name: 'Apple', 
    domain: 'apple.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png'
  },
  { 
    name: 'NVIDIA', 
    domain: 'nvidia.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/1200px-Nvidia_logo.svg.png'
  },
  { 
    name: 'Palantir', 
    domain: 'palantir.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Palantir_Technologies_logo.svg/1200px-Palantir_Technologies_logo.svg.png'
  },
  { 
    name: 'Jane Street', 
    domain: 'janestreet.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Jane_Street_Capital_Logo.svg/1200px-Jane_Street_Capital_Logo.svg.png'
  },
  { 
    name: 'Goldman Sachs', 
    domain: 'goldmansachs.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Goldman_Sachs.svg/1200px-Goldman_Sachs.svg.png'
  },
  { 
    name: 'Coinbase', 
    domain: 'coinbase.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Coinbase.svg/1200px-Coinbase.svg.png'
  },
  { 
    name: 'Stripe', 
    domain: 'stripe.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1200px-Stripe_Logo%2C_revised_2016.svg.png'
  },
  { 
    name: 'Airbnb', 
    domain: 'airbnb.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/1200px-Airbnb_Logo_B%C3%A9lo.svg.png'
  },
  { 
    name: 'Uber', 
    domain: 'uber.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/1200px-Uber_logo_2018.png'
  },
  { 
    name: 'Lyft', 
    domain: 'lyft.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Lyft_logo.svg/1200px-Lyft_logo.svg.png'
  },
  { 
    name: 'TikTok', 
    domain: 'tiktok.com',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1200px-TikTok_logo.svg.png'
  },
  { 
    name: 'Snapchat', 
    domain: 'snapchat.com',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Snapchat_logo.svg/1200px-Snapchat_logo.svg.png'
  },
  { 
    name: 'Discord', 
    domain: 'discord.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Discord_logo.svg/1200px-Discord_logo.svg.png'
  },
  { 
    name: 'Spotify', 
    domain: 'spotify.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/1200px-Spotify_logo_with_text.svg.png'
  },
  { 
    name: 'HP', 
    domain: 'hp.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/1200px-HP_logo_2012.svg.png'
  },
  { 
    name: 'Nike', 
    domain: 'nike.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png'
  },
  { 
    name: 'Adidas', 
    domain: 'adidas.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png'
  },
  { 
    name: 'Under Armour', 
    domain: 'underarmour.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/1200px-Under_armour_logo.svg.png'
  },
];

export const MOCK_CIRCLES: Circle[] = [
  {
    id: 'c1',
    name: 'Alex & Jamie',
    type: CircleType.Couple,
    status: CircleStatus.Active,
    members: ['u1', 'u2'],
    themeColor: '#f0addd',
    avatar: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2024-02-14')
  },
  {
    id: 'c2',
    name: 'The Fam',
    type: CircleType.Family,
    status: CircleStatus.Active,
    members: ['u1', 'u3', 'u4'],
    themeColor: '#93c5fd',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2023-01-01')
  },
  {
    id: 'c_ex',
    name: 'Alex & Taylor',
    type: CircleType.Couple,
    status: CircleStatus.Archived,
    members: ['u1', 'ux'],
    themeColor: '#cbd5e1',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2023-12-01')
  }
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  partnerName: 'Jamie',
  partnerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  circles: MOCK_CIRCLES,
  isPremium: true,
  joinDate: new Date('2024-02-14'),
  activeCircleId: 'c1',
  settings: {
    notifications: true,
    biometricLock: false,
    theme: 'light',
    dailyReminderTime: '20:00'
  },
  hasCompletedOnboarding: false, 
  detectedPersona: UserPersona.Undetected
};

export const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'e1',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'We found that tiny jazz bar in the West Village. The way you looked at me when the sax started playing... I never want to forget that. It felt like time stopped.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    type: EntryType.Freeform,
    mood: Mood.Romantic,
    circleId: 'c1',
    isPrivate: false,
    location: 'West Village, NYC',
    likes: 2,
    isLiked: true
  },
  {
    id: 'e2',
    userId: 'u2', // Partner
    authorName: 'Jamie',
    authorAvatar: CURRENT_USER.partnerAvatar || '',
    content: 'I felt really heard when we talked about our summer plans. Thank you for listening to my worries about taking time off. It means the world.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    type: EntryType.Prompt,
    prompt: 'When did you feel most connected today?',
    mood: Mood.Grateful,
    circleId: 'c1',
    isPrivate: false,
    likes: 1,
    isLiked: false
  },
  {
    id: 'e2b',
    userId: 'u1', // Current User answering SAME prompt
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'When we were cooking dinner and you bumped into me and just held me for a second. Simple but perfect.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5), // similar time
    type: EntryType.Prompt,
    prompt: 'When did you feel most connected today?',
    mood: Mood.Romantic,
    circleId: 'c1',
    isPrivate: false,
    likes: 4,
    isLiked: true
  },
  // ANXIOUS ENTRIES (Kafka Mode) - Trigger Spiral Detection
  {
    id: 'e3',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'I feel like Jamie is pulling away again. The texts are shorter. Did I say something wrong yesterday?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1', 
    isPrivate: true, 
    likes: 0,
    isLiked: false
  },
  {
    id: 'e3b',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'Still worried about the distance. It feels like the silence is loud.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1',
    isPrivate: true,
    likes: 0,
    isLiked: false
  },
  {
    id: 'e3c',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'Why do I always feel this fear when things are going well? I am scared of ruining it.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1',
    isPrivate: true,
    likes: 0,
    isLiked: false
  },
  {
    id: 'e4',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: '',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    type: EntryType.Photo,
    // Updated to Locust Walk image
    mediaUrl: '/locust-walk.jpg',
    prompt: 'A moment of joy',
    circleId: 'c1',
    isPrivate: false,
    likes: 12,
    isLiked: true
  },
  // PAST RELATIONSHIP ENTRIES
  {
    id: 'ex1',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'The end. It hurts, but I know it is for the best. We grew apart.',
    timestamp: new Date('2023-12-01'),
    type: EntryType.Freeform,
    mood: Mood.Stressed,
    circleId: 'c_ex',
    isPrivate: true,
    likes: 0
  }
];

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'i1',
    title: 'Growth Loop',
    content: 'This week, you both mentioned "calm" and "home" frequently. You are building a sanctuary together.',
    type: 'Growth',
    date: new Date(),
    actionLabel: 'View'
  }
];

export const DAILY_PROMPTS = [
  "What's one tiny moment from today you want to remember?",
  "How did your partner make you smile today?",
  "What is one thing you are grateful for right now?",
  "Reflect on a challenge you overcame together recently.",
  "What is your favorite memory of us from last year?",
  "Describe your partner in three words today.",
  "What's a new adventure you want to take together?"
];

export const MOOD_EMOJIS: Record<string, string> = {
  [Mood.Amazing]: '🤩',
  [Mood.Good]: '😊',
  [Mood.Neutral]: '😐',
  [Mood.Tired]: '😴',
  [Mood.Stressed]: '😰',
  [Mood.Romantic]: '🥰',
  [Mood.Grateful]: '🙏',
  [Mood.Playful]: '😜',
  [Mood.Anxious]: '🌪️',
};

export const TOS_TEXT = `BELLUH AI - TERMS OF SERVICE
Effective Date: December 9, 2025

1. ACCEPTANCE OF TERMS
By accessing or using Belluh AI ("Service," "Platform," "we," "us," or "our"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

2. DESCRIPTION OF SERVICE
Belluh AI is an AI-powered relationship journaling platform that helps users capture, reflect on, and understand their relationships through intelligent insights, pattern recognition, and emotional analysis.

3. ELIGIBILITY
You must be at least 18 years old to use this Service;
You must have the legal capacity to enter into binding contracts; and
You may not use the Service if prohibited by law or if your account has been previously terminated.

4. USER ACCOUNTS AND SECURITY
4.1 Account Creation
You must provide accurate, complete, and current information;
You are responsible for maintaining the confidentiality of your account credentials;
You are responsible for all activities under your account; and
You must notify us immediately of any unauthorized access.

4.2 Account Termination
We reserve the right to suspend or terminate accounts that:
Violate these Terms;
Engage in fraudulent or illegal activity;
Abuse or harm the Service or other users; or
Remain inactive for extended periods.

5. USER CONTENT AND DATA
5.1 Your Content
You retain ownership of all content you submit ("User Content"), including journal entries, photos, messages, and relationship data.

5.2 License Grant to Belluh AI
By submitting User Content, you grant Belluh AI a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to:
Use, reproduce, process, and store your User Content to provide the Service;
Analyze, aggregate, and anonymize your User Content to train, improve, and develop our proprietary emotional intelligence algorithms and AI models;
Generate insights, patterns, and recommendations based on your User Content; and
Create derivative works for research and development purposes.

5.3 AI Model Training Opt-Out
You may opt out of AI model training at any time through your Privacy Settings (Settings → Privacy → "Do not train on my content").
Opting out applies to NEW content only; previously collected data may remain in existing training datasets and models.
Opting out does not affect your ability to use the Service.

5.4 Anonymization and Aggregation
We may use anonymized and aggregated data from User Content for machine learning, model training, product improvement, research, and commercial purposes.
Anonymized data cannot reasonably identify you or your specific relationship.
We may share or sell anonymized, aggregated data with third parties.
Anonymized data may be retained indefinitely, even after account deletion.

5.5 Content Restrictions
You agree NOT to submit content that:
Violates any law or regulation;
Infringes intellectual property rights;
Contains malware, viruses, or harmful code;
Harasses, threatens, or harms others;
Impersonates any person or entity; or
Contains child sexual abuse material or exploitation content.

6. SHARED CIRCLES AND PARTNER FEATURES
6.1 Partner Sharing
When you invite a partner to join your Circle, both parties consent to shared access to mutual journal entries and insights.
Each partner can view, edit, and delete content within the shared Circle;
Your partner may retain copies of shared content even after Circle termination or account deletion; and
Terminating a shared Circle does not delete historical data unless both parties request deletion.

6.2 Data Responsibility
You are responsible for obtaining consent from others before sharing their information.
We are not responsible for disputes between Circle members regarding shared content.

7. AI-GENERATED INSIGHTS AND DISCLAIMERS
7.1 No Professional Advice
Belluh AI provides AI-generated insights for reflection and entertainment purposes only.
Our Service is NOT a substitute for professional mental health counseling, therapy, or medical advice;
Do not rely on AI insights for critical relationship, mental health, or medical decisions; and
Always consult qualified professionals for serious concerns.

7.2 Accuracy Disclaimer
AI-generated content may contain errors, biases, or inaccuracies.
We do not guarantee the accuracy, completeness, or reliability of AI insights.
Use AI-generated content at your own risk.

7.3 Emergency Situations
If you or someone you know is experiencing a mental health crisis, contact:
National Suicide Prevention Lifeline: 988
Crisis Text Line: Text HOME to 741741
Emergency Services: 911

8. PROPRIETARY RIGHTS
8.1 Belluh AI Property
The Service, including all software, algorithms, design, text, graphics, logos, and AI models, is owned by Belluh AI and protected by intellectual property laws.

8.2 Restrictions
You may NOT:
Reverse engineer, decompile, or extract source code from the Service;
Copy, modify, or create derivative works of our AI models or algorithms;
Use automated tools to scrape or collect data from the Service;
Remove or alter any proprietary notices or labels; or
Access the Service to build a competitive product.

9. PAYMENT AND SUBSCRIPTIONS
9.1 Pricing
Certain features require paid subscriptions.
Prices are subject to change with 30 days' notice.
All fees are non-refundable unless required by law.

9.2 Auto-Renewal
Subscriptions automatically renew unless canceled before the renewal date.
You may cancel anytime through your account settings.
Cancellation takes effect at the end of the current billing period.

9.3 Free Trial
Free trials are available for new users only.
We may charge your payment method if you don't cancel before trial expiration.
One free trial per user.

10. PROHIBITED CONDUCT
You agree NOT to:
Use the Service for any illegal purpose;
Attempt to gain unauthorized access to our systems;
Interfere with or disrupt the Service;
Impersonate Belluh AI staff or representatives;
Sell, rent, or transfer your account;
Use the Service to stalk, harass, or harm others;
Upload viruses or malicious code; or
Violate any person's privacy or publicity rights.

11. DATA RETENTION AND DELETION
11.1 Active Accounts
We retain your data as long as your account is active or as needed to provide the Service.

11.2 Account Deletion
Upon account deletion:
Your personal identifiable information will be deleted within 90 days;
Anonymized and aggregated data derived from your User Content may be retained indefinitely for AI model training and improvement;
Backup copies may persist for up to 180 days; and
Shared Circle data: Your partner may retain their own copies of shared content.

11.3 Legal Obligations
We may retain data longer when required by law or for legitimate business purposes (e.g., fraud prevention, legal disputes, regulatory compliance).

12. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW:
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, RELATIONSHIP HARM, OR EMOTIONAL DISTRESS.
OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM, OR $100 USD, WHICHEVER IS GREATER.
SOME JURISDICTIONS DO NOT ALLOW EXCLUSION OF IMPLIED WARRANTIES OR LIMITATION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THESE LIMITATIONS MAY NOT APPLY TO YOU.

13. INDEMNIFICATION
You agree to indemnify, defend, and hold harmless Belluh AI, its officers, directors, employees, contractors, agents, and affiliates from any and all claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising from:
Your use or misuse of the Service;
Your violation of these Terms;
Your User Content;
Your violation of any third-party rights; or
Your violation of any applicable laws or regulations.

14. DISPUTE RESOLUTION
14.1 Governing Law
These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.

14.2 Binding Arbitration
Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules.
YOU AND BELLUH AI AGREE TO WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE ACTION.
Arbitration will be conducted in Wilmington, Delaware or remotely via videoconference at your option.

14.3 Exceptions to Arbitration
Either party may seek injunctive or equitable relief in court for:
Intellectual property disputes;
Violations of proprietary rights; or
Emergency or irreparable harm.

14.4 Informal Resolution Requirement
Before filing arbitration, you agree to contact us at legal@belluh.com to attempt informal resolution for 60 days. Include your name, contact information, description of the dispute, and desired resolution.

14.5 Small Claims Court
You may bring claims in small claims court if they qualify and remain in small claims court.

15. MODIFICATIONS TO TERMS
We may modify these Terms at any time by posting updated Terms with a new "Effective Date".
Material changes will be notified via email or in-app notification at least 30 days before taking effect.
Continued use after modifications constitutes acceptance.
If you do not agree to modified Terms, you must stop using the Service and may delete your account.

16. TERMINATION
16.1 By You
You may terminate your account anytime through account settings or by emailing support@belluh.com.

16.2 By Us
We may suspend or terminate your account immediately without notice if:
You violate these Terms
You engage in fraudulent, illegal, or harmful conduct
Required by law or legal process
The Service is discontinued (with 30 days' notice when possible)

16.3 Effect of Termination
Upon termination:
Your access to the Service will cease immediately
You remain liable for any outstanding fees
Provisions that should survive termination remain in effect (Sections 5.2, 5.4, 8, 11, 12, 13, 14, 17)
We are not liable for any termination consequences

17. GENERAL PROVISIONS
17.1 Entire Agreement
These Terms, together with our Privacy Policy, constitute the entire agreement between you and Belluh AI regarding the Service.

17.2 Severability
If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect, and the unenforceable provision will be modified to the minimum extent necessary.

17.3 No Waiver
Our failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision.

17.4 Assignment
You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms to any successor or affiliate without restriction.

17.5 Force Majeure
We are not liable for delays or failures due to circumstances beyond our reasonable control (natural disasters, war, cyberattacks, government actions, pandemics, etc.).

17.6 Electronic Communications
You consent to receive communications from us electronically, and agree that electronic communications satisfy any legal requirements for written communications.

18. CONTACT INFORMATION
For questions about these Terms:
Email: legal@belluh.com
Support: support@belluh.com
Response Time: We aim to respond within 5-7 business days
`;

export const PRIVACY_POLICY_TEXT = `BELLUH AI - PRIVACY POLICY
Effective Date: December 9, 2025

1. INTRODUCTION
Belluh AI ("we," "us," "our," or "Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our relationship journaling platform and services ("Service").
By using Belluh AI, you consent to the data practices described in this Privacy Policy.

2. INFORMATION WE COLLECT
2.1 Information You Provide Directly
Account Information:
Name, email address, phone number (optional);
Username and password (encrypted);
Profile photo;
Date of birth; and
Payment information (processed securely by third-party payment processors; we do not store full credit card numbers).

Relationship Content:
Journal entries (text, voice recordings, photos, videos);
Relationship milestones and dates;
Partner information (names, photos, shared memories);
Questions you ask our AI assistant; and
Feedback and communications with support.

Partner/Circle Data:
When you invite partners to shared Circles, we collect their email addresses and any information they provide; and
Shared journal entries and mutual relationship data.

2.2 Information We Collect Automatically
Usage Data:
Device information (device type, operating system, browser type, device identifiers);
IP address and general location (city/state level, not precise GPS);
Log data (access times, pages viewed, clicks, features used);
App interactions and session duration; and
Cookies and similar tracking technologies.

Analytics Data:
Feature usage patterns;
Engagement metrics (streaks, entries per week, time spent);
AI interaction history (questions asked, insights viewed); and
Performance and error logs.

2.3 Information from Third Parties
Authentication providers (Google, Apple Sign-In) - basic profile information;
Payment processors (Stripe, PayPal) - transaction data;
Analytics services (Google Analytics, Mixpanel) - aggregated usage data; and
Social media platforms (if you connect accounts) - profile information.

3. HOW WE USE YOUR INFORMATION
3.1 To Provide and Improve the Service
Deliver core features: Process journal entries, generate AI insights, create relationship summaries;
Personalize your experience: Tailor recommendations and insights based on your relationship patterns;
Facilitate partner sharing: Enable shared Circles and mutual journaling with partners;
Process payments: Handle subscriptions and billing;
Provide customer support: Respond to inquiries and troubleshoot issues; and
Send service communications: Account updates, security alerts, feature announcements.

3.2 To Train and Improve Our Proprietary AI Models
CRITICAL DISCLOSURE:
We use your journal entries, relationship data, and interaction patterns to train, develop, and improve our proprietary emotional intelligence algorithms and AI models.
AI Training is ENABLED by default for all consumer accounts (Free and Premium plans).
Specifically, we:
Analyze your User Content to identify emotional patterns, relationship dynamics, and behavioral insights;
Train machine learning models on anonymized and aggregated relationship data to improve AI response quality, accuracy, and empathy;
Develop new features based on common relationship challenges and user needs identified in the data;
Refine our emotional intelligence algorithms to provide more accurate, empathetic, and helpful insights;
Create benchmark datasets for research and development of relationship AI technology; and
Improve safety systems to detect and prevent abuse, harassment, and harmful content.

How to Opt Out:
Go to Settings → Privacy → "Do not train on my content" and toggle OFF.
Opting out applies to new content only; previously collected data may remain in existing training datasets and models.
Opting out does not affect your ability to use the Service.

Data Processing for AI Training:
Your data is anonymized and aggregated before being used for model training;
Individual identifiers (names, specific locations, unique identifying details) are removed or generalized using industry-standard techniques;
We use automated filtering and obfuscation to remove sensitive information;
Perfect anonymization cannot be guaranteed; there is a theoretical risk of re-identification; and
Anonymized data may be retained indefinitely, even after account deletion.

3.3 For Research and Development
Conduct research on relationship patterns, emotional well-being, and intimacy dynamics;
Publish research findings using anonymized, aggregated data (no individual identification); and
Share anonymized datasets with academic or commercial research partners.

3.4 For Business Operations
Detect and prevent fraud, abuse, and security threats;
Enforce our Terms of Service;
Comply with legal obligations and respond to lawful requests;
Protect our rights, property, and safety; and
Facilitate business transactions (mergers, acquisitions, asset sales).

3.5 For Marketing (With Your Consent)
Send promotional emails about new features and offers (you can opt out);
Display personalized ads (if applicable); and
Conduct surveys and gather feedback.

4. HOW WE SHARE YOUR INFORMATION
4.1 With Your Partner (Shared Circles)
When you create a shared Circle with a partner, both parties have access to:
All journal entries within that Circle;
Relationship insights and summaries;
Timeline events and milestones; and
AI-generated analysis of the relationship.
Important: Your partner can view, download, and potentially retain this data even if you later terminate the Circle or delete your account. We cannot control what your partner does with shared data.

4.2 With Service Providers
We share data with trusted third-party vendors who help us operate the Service:
Cloud hosting providers (AWS, Google Cloud) - data storage and processing;
AI/ML infrastructure (OpenAI, Anthropic, Google AI) - AI processing;
Payment processors (Stripe) - payment processing (PCI-DSS compliant);
Analytics services (Google Analytics, Mixpanel) - usage analytics;
Email services (SendGrid, Mailchimp) - transactional and marketing emails; and
Customer support tools (Zendesk, Intercom) - support ticket management.
These providers are contractually obligated to protect your data and use it only for providing services to us. They cannot use your data for their own purposes.

4.3 Third-Party AI Services
Important Disclosure:
Your journal content may be sent to third-party AI providers (OpenAI, Anthropic, Google AI) for processing and generating insights;
These providers have their own privacy policies and data practices;
We use enterprise agreements with enhanced privacy protections where available; and
Third-party AI providers are contractually prohibited from using your data to train their public models, but you should verify their privacy policies independently.
We do not share your personal identifiers with third-party AI services when possible.

4.4 For Legal Reasons
We may disclose your information if required by law or in response to:
Court orders, subpoenas, or legal processes;
Investigations by law enforcement or regulatory authorities;
Protection of our rights, property, or safety, or that of our users;
Prevention of fraud, security threats, or illegal activity;
Enforcement of our Terms of Service; or
Compliance with national security or law enforcement requirements.
We will notify you of legal requests unless prohibited by law.

4.5 Business Transfers
If Belluh AI is acquired, merged, or sells assets, your information may be transferred to the new owner. You will be notified via email and/or prominent notice on our Service of any change in ownership or use of your personal information.

4.6 Aggregated and Anonymized Data
We may share or sell anonymized, aggregated data that cannot reasonably identify you with:
Research institutions and universities;
Commercial partners and third-party companies;
Investors and business partners; or
The public (e.g., in research publications, whitepapers, or blog posts).
Example: "75% of couples using Belluh AI report improved communication after 30 days."
This aggregated data may include insights derived from your content but does not contain information that identifies you personally.

4.7 With Your Consent
We may share your information with third parties if you explicitly consent (e.g., integrations with other apps, third-party features).

5. DATA RETENTION
5.1 Active Accounts
We retain your personal information as long as:
Your account is active;
Needed to provide the Service; or
Required for legitimate business purposes (analytics, fraud prevention, legal compliance).

5.2 Account Deletion
When you delete your account:
Personal identifiers (name, email, profile photos, identifiable content) are deleted within 90 days;
Anonymized and aggregated data derived from your content may be retained indefinitely for AI training, research, and model improvement;
Backup systems may retain copies for up to 180 days for disaster recovery;
Legal or regulatory requirements may mandate longer retention; and
Shared Circle data: We cannot delete content your partner has separately saved, exported, or retained.

5.3 Opt-Out of AI Training Before Deletion
If you opt out of AI training before deleting your account, your content will not be used in new training runs.
Your data may remain in already-trained models and datasets created before opt-out.
We will stop using your content for future model training runs.

5.4 Legal Holds
Data subject to legal holds, investigations, or disputes will be retained until the matter is resolved, regardless of account deletion.

6. DATA SECURITY
We implement industry-standard security measures to protect your data:
Technical Safeguards:
Encryption in transit: TLS 1.3/SSL for all data transmission;
Encryption at rest: AES-256 encryption for stored data;
Secure authentication: Bcrypt password hashing, OAuth 2.0; and
Database security: Role-based access controls, row-level security.

Organizational Safeguards:
Access controls: Principle of least privilege, multi-factor authentication for staff;
Regular audits: Security assessments, penetration testing, vulnerability scanning;
Secure infrastructure: SOC 2 Type II compliant cloud providers;
Employee training: Security awareness and data handling training; and
Incident response: Documented procedures for security breaches.

However, no system is 100% secure. We cannot guarantee absolute security. You are responsible for:
Maintaining the confidentiality of your password;
Enabling two-factor authentication (if available);
Using a secure device and network; and
Logging out of shared devices.

Data Breach Notification:
In the event of a data breach that affects your personal information, we will notify you within 72 hours via email and in-app notification, as required by applicable law.

7. YOUR PRIVACY RIGHTS
7.1 Access and Portability
You can:
Access your personal information through account settings;
Request a copy of your data in a portable format (JSON/CSV); or
Export your journal entries, photos, and relationship data.
How to request: Email privacy@belluh.com with "Data Access Request" in the subject line. Include your name and email address for verification.
Response time: Within 30 days of verified request.

7.2 Correction and Update
You can update your account information, profile, and preferences anytime through the app settings.
For corrections not available in settings, email privacy@belluh.com.

7.3 Deletion
You can delete your account through:
Account settings → Delete Account; or
Email support@belluh.com with "Account Deletion Request".
Important: Deletion does not remove anonymized or aggregated data used for AI training (see Section 5.2).

7.4 Opt-Out of AI Training
Go to Settings → Privacy → "Do not train on my content" and toggle OFF.
This prevents new content from being used for training, but does not remove data already in existing models.

7.5 Opt-Out of Marketing
You can unsubscribe from promotional emails by:
Clicking "Unsubscribe" in any marketing email; or
Adjusting preferences in Settings → Notifications.
You will still receive transactional emails (account notifications, security alerts, billing).

7.6 Additional Rights (Location-Specific)
California Residents (CCPA/CPRA):
Right to know what personal information is collected;
Right to deletion (with exceptions for anonymized data);
Right to opt-out of "sales" or "sharing" of personal information;
Right to correct inaccurate personal information;
Right to limit use of sensitive personal information; and
Right to non-discrimination for exercising privacy rights.

European Residents (GDPR):
Right to access, rectification, erasure ("right to be forgotten");
Right to data portability;
Right to restrict or object to processing;
Right to withdraw consent; and
Right to lodge a complaint with a supervisory authority.

Other Jurisdictions:
We comply with applicable data protection laws in Virginia, Colorado, Connecticut, Utah, and other jurisdictions with privacy laws.
To exercise your rights: Email privacy@belluh.com with your request and proof of identity. Response time: 30 days (may be extended to 60 days for complex requests).

8. CHILDREN'S PRIVACY
Belluh AI is not intended for users under 18 years old.
We do not knowingly collect personal information from children under 18. If we discover that a child under 18 has provided personal information, we will delete it immediately.
Parents/Guardians: If you believe your child has provided information to us, contact privacy@belluh.com immediately.

9. INTERNATIONAL DATA TRANSFERS
Belluh AI is based in the United States. If you are located outside the U.S., your information will be transferred to, stored, and processed in the U.S., which may have different data protection laws than your jurisdiction.
By using the Service, you consent to the transfer of your information to the U.S. and other countries where we operate.
We use the following safeguards for international transfers:
Standard Contractual Clauses (SCCs) approved by the European Commission;
Adequacy decisions where applicable; and
Data Processing Agreements with vendors.

10. COOKIES AND TRACKING TECHNOLOGIES
We use cookies, pixels, local storage, and similar technologies to:
Authenticate users and maintain sessions;
Remember preferences and settings;
Analyze usage and improve the Service;
Deliver personalized content; and
Measure ad performance (if applicable).

Types of Cookies:
Essential: Required for service functionality (login, security) (Session/1 year, No opt-out);
Analytics: Track usage patterns (Google Analytics, Mixpanel) (1-2 years, Yes);
Functional: Remember preferences (theme, language) (1 year, Yes); and
Marketing: Personalize ads and track conversions (1-2 years, Yes).

Your Choices:
Most browsers allow you to block or delete cookies through settings;
Opt out of Google Analytics: tools.google.com/dlpage/gaoptout;
Do Not Track: We honor DNT signals where technically feasible.
Note: Disabling essential cookies may limit functionality.

11. CHANGES TO THIS PRIVACY POLICY
We may update this Privacy Policy from time to time. Changes will be posted with a new "Effective Date".
Material changes will be communicated via:
Email notification to your registered email address;
In-app alert or banner; or
Prominent notice on our website.
Continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.
We will provide 30 days' notice before material changes take effect.

12. CONTACT US
For privacy questions, concerns, or requests:
Email: privacy@belluh.com
Data Protection Officer: dpo@belluh.com
Support: support@belluh.com
Response Time: We aim to respond to privacy requests within 30 days (may extend to 60 days for complex requests).

13. STATE-SPECIFIC DISCLOSURES
13.1 California Residents (CCPA/CPRA)
Categories of Personal Information Collected (Last 12 Months):
Identifiers (Name, email, IP, device ID): Collected (Yes), Sold/Shared (No*)
Personal records (Phone, payment info): Collected (Yes), Sold/Shared (No)
Protected classifications (Age, gender): Collected (Yes), Sold/Shared (No)
Commercial information (Purchases): Collected (Yes), Sold/Shared (No)
Biometric information (Voice recordings): Collected (Yes), Sold/Shared (No)
Internet activity (Usage patterns): Collected (Yes), Sold/Shared (No)
Geolocation (City/state): Collected (Yes), Sold/Shared (No)
Sensory data (Photos, audio): Collected (Yes), Sold/Shared (No)
Inferences (Relationship patterns): Collected (Yes), Sold/Shared (No*)

*Anonymized, aggregated data may be shared with third parties for research or commercial purposes, which may constitute a "sale" or "share" under CCPA.

Your California Privacy Rights:
Right to Know: Request details about personal information collected, used, disclosed, or sold in the last 12 months;
Right to Delete: Request deletion of personal information (with exceptions for anonymized data, legal compliance, fraud prevention);
Right to Opt-Out: Opt-out of the "sale" or "sharing" of personal information;
Right to Correct: Request correction of inaccurate personal information;
Right to Limit: Limit use of sensitive personal information (journal content, biometric data); and
Right to Non-Discrimination: We will not discriminate against you for exercising your rights.

How to Exercise Your Rights:
Email: privacy@belluh.com with "California Privacy Request";
Include: Your name, email, and specific request.
We will verify your identity before processing requests (may require account login or email verification).
Response time: 45 days (may extend to 90 days for complex requests).

Authorized Agent:
You may designate an authorized agent to submit requests on your behalf. The agent must provide:
Signed written authorization from you;
Proof of their identity; and
Your contact information for verification.

Do Not Sell or Share My Personal Information:
To opt out of the "sale" or "sharing" of anonymized data for research or commercial purposes:
Email privacy@belluh.com with "Do Not Sell My Information".

Shine the Light Law (California Civil Code § 1798.83):
California residents may request information about disclosures of personal information to third parties for direct marketing purposes. Contact privacy@belluh.com with "Shine the Light Request."

13.2 Virginia, Colorado, Connecticut, Utah Residents
Residents of these states have similar rights under their respective privacy laws (VCDPA, CPA, CTDPA, UCPA):
Right to access, correction, deletion, and portability;
Right to opt out of targeted advertising, sales, and profiling; and
Right to appeal our decisions regarding your requests.
To exercise your rights:
Email privacy@belluh.com with "[State] Privacy Request" (e.g., "Virginia Privacy Request").
Appeal Process:
If we deny your request, you may appeal by emailing privacy@belluh.com with "Privacy Rights Appeal" within 30 days of our decision.

13.3 Nevada Residents
Nevada law (NRS 603A) allows residents to opt out of the "sale" of personal information. We do not currently sell personal information as defined by Nevada law.
To exercise this right: Email privacy@belluh.com with "Nevada Opt-Out Request."
`;
