-- Import 8 archived ideas from Google AI Studio to Supabase
-- Run this in the Supabase SQL Editor

INSERT INTO daily_ideas (date, issue_number, title, pitch, fatal_flaw, verdict) VALUES

-- Idea #1: Dec 13, 2025
('2025-12-13', 1, 'NeuroMesh',
'We disrupt the cloud oligopoly by aggregating the idle NPU (Neural Processing Unit) power of global smartphones into a decentralized, consumer-sourced supercomputer. While you sleep, we train LLMs and render complex 3D visualizations, paying out crypto micropayments for your contribution and offering developers compute power at 80% below market rates.',
'The "Latency-Thermal" Death Spiral: High-end applications require low-latency, all-or-nothing blocks of compute power that home devices cannot provide, negating the network''s appeal. Training jobs could crash mid-session, consumer phones will melt trying to process jobs—processing a $1,000 lithium battery via heat stress nearly exceeds the function of a coal-fire power plant, and unstable latency for the "buyer."',
'A distributed way to destroy lithium-ion batteries while pretending to be a data center.'),

-- Idea #2: Dec 14, 2025
('2025-12-14', 2, 'LoopLogic',
'The "Uber Pool" for e-commerce returns. Instead of shipping unwanted items back to warehouses over days & time-consuming routes, our AI intercepts returns and automatically delivers them directly from the returning customer''s doorstep to a nearby recipient who just ordered the same SKU. We cut reverse logistics costs by 70%, empty delivery times to same-day, create an entirely new cash-back, warehouse-free returns economy.',
'The "Trusted Node" paradox: The economic model relies entirely on removing the central authority—brands and warehouses. By skipping directly from Customer A (the returner) to Customer B (the new buyer), the platform bypasses quality control, tampering verifications, and user error (poor repackaging). By shipping directly from one end-user to another, consumers create a used item marketplace instead of actual product returns. The used marketplaces (eBay, Poshmark) exist because customers don''t trust this model. Scaling this into a new supply chain paradigm—discounts and refunding fraud will vastly exceed the shipping savings, while ultimately disrupting the reputation of the partner brands.',
'Optimizing the supply chain by removing the only part that actually ensures the product exists.'),

-- Idea #3: Dec 15, 2025
('2025-12-15', 3, 'SurgeShelf',
'SurgeShelf brings the high-margin psychology of surge pricing to grocery and mom-and-pop retail. By integrating computer vision cameras into checkout lanes and Electronic Shelf Labels (ESLs or AI adjusts product prices based on immediate in-store foot traffic and inventory velocity. We give small stores tools to capture ''surge revenue'' and discount perishables to zero waste, finally balancing supply and demand with the power of Amazon or Uber.',
'The "Selection-vs-Checkout Latency Gap." Unlike Uber or Amazon where the price is locked at transaction time, grocery checkout can occur between picking an item off the shelf and scanning at the register (5-60 minutes later). The store gets crowded, the customer will perceive this as fraud at the register. This creates an adversarial relationship with the customer, leading to aggressive disputes at checkout. The algorithm works, but it''s ultimately doomed to class-action lawsuits regarding deceptive trade practices, ultimately dooming the merchant''s brand even if the algorithm could ever operate in arbitrage.',
'A perfect way to automate the destruction of your customer loyalty.'),

-- Idea #4: Dec 16, 2025
('2025-12-16', 4, 'NeuroGrid',
'The world''s first biological distributed computing network. By wearing our ultra-wearable EEG headband while existing, users lease their subconscious neural surplus to our AI decentralized network for simple pattern recognition tasks—all while the 8 hours of ''downtime'' humans have goes to waste. We crowdsource a massively organic neural network that can solve Bitcoin mining problems, creating a massive, organic neural network—all while the user simply dreams.',
'The "neural trust node bias": Sleep cycles include random thermodynamics and biology. First, the ''unused neural surplus'' is scientifically nonsense. Brains do not have ''mathematically active and available for computation'' periods during sleep. The sleep cycles include random thermodynamics and biology with high noise compared to traditional silicon. Second, even assuming sufficient signals, economics are inverted. The human brain runs on ~20 watts, equivalent idle power to a standard laptop, while the cloud vastly outperforms idle brains in throughput. Third, to monetize this power as an electricity service requires massive human clusters and complex labor economics are inverted. The core value proposition is technically impossible, and even if possible, economics are inverted.',
'A literal headache that attempts to reinvent The Matrix but forgets that batteries are cheaper than beef.'),

-- Idea #5: Dec 17, 2025
('2025-12-17', 5, 'FluxStream',
'The world''s first ''Just-in-Time'' subscription manager. Using on-device activity monitoring and open banking APIs, FluxStream automatically subscribes you to services (Netflix, Adobe Cloud, Gym memberships) the moment you engage with them, and cancels the subscription the second you stop using them. We convert monthly fixed costs into micro-duration variable costs, saving the average consumer $400/month in wasted ''zombie'' subscriptions.',
'This idea suffers from the ''Parasitic Efficiency'' paradox. Subscription businesses (SaaS, gyms, media) rely mathematically on the ''breakage'' model—where a massive chunk of revenue comes from users who pay but don''t utilize the service constantly. By enforcing 100% efficiency, FluxStream destroys the Unit Economics (LTV/CAC ratios) of every vendor it integrates with. Consequently, these vendors will not view FluxStream as an integration partner but a hostile actor. They will immediately update Terms of Service to enforce minimum billing periods (e.g., minimum 1 month charge) or block the automation, rendering the startup''s core value proposition legally void and technically useless overnight.',
'You built a machine that saves users money by strangling the companies providing the service, ensuring there is no service left to subscribe to.'),

-- Idea #6: Dec 18, 2025
('2025-12-18', 6, 'TaskSlice',
'The first hyper-granular labor marketplace that uses AI to deconstruct high-skill knowledge work into discrete, repeatable micro-tasks. Corporations bid on execution timelines, our AI fragments work into minute-specific tasks (emails, meetings, doc reviews) and geo time, while workers enjoy ''radical flexibility'' by completing 2-minute contracts or meetings.',
'The ''Context Penalty'' invokes the model economically inverted. Unlike physical micro-tasks (say Amazon Turk), high-skill knowledge work relies heavily on accumulated understanding. By routing tasks to maximize utilization, the platform destroys the context flows—employees need to spend time understanding. The friction to reload that context and errors vastly exceeds the gain on idle time, while the lack of end-to-end ownership erodes the accountability necessary to ship quality work. All while producing the client''s product.',
'Uber for white-collar work that successfully optimizes the production of technical debt.'),

-- Idea #7: Dec 19, 2025
('2025-12-19', 7, 'Cognifai Bridge',
'The world''s first ''Zero-Hallucination'' API for enterprise. We seamlessly route low-confidence LLM queries to a global workforce of humans in real-time, who verify or correct outputs in real-time. Our hybrid intelligence prevents Fortune 500 companies from fully relying on AI in critical workflows.',
'The core failure of Labor. The business model attempts to sell human judgment as a cheap, on-demand resource, but real-time human input, unlike silicon models, cannot scale instantaneously. High-quality labor does not scale elastically, high-quality costs more, and each human review introduces latency. Unlike silicon models which respond in milliseconds, human review breaks synchronous association of seconds (response time). Customers want sub-second response times, not labor markets. The latency, even at 15 seconds, creates a poison pill that makes the service promised to worthless.',
'Mechanical Turk in a trench coat trying to pass as a SaaS unicorn.'),

-- Idea #8: Dec 20, 2025
('2025-12-20', 8, 'FameFutures',
'The first decentralized discounts exchange for the Creator Economy. Fans buy personal ''FameShares'' (ERC-721 tokens) in up-and-coming influencers. Like a stock market, these shares appreciate as creators gain followers. Fans profit from early access to viral trajectories while creators get upfront capital without equity dilution. Everyone wins.',
'You have successfully built a venture-backed engine for weaponized cyberbullying.',
'You have successfully built a venture-backed engine for weaponized cyberbullying.')

ON CONFLICT (date) DO NOTHING;
