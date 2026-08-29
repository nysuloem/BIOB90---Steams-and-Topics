'use strict';

const fs = require('node:fs');
const path = require('node:path');

const contentPath = path.join(__dirname, '..', 'data', 'content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

content.streams = [
  {
    id: 'two-eyed-seeing',
    title: 'Two-Eyed Seeing (Etuaptmumk)',
    shortTitle: 'Two-Eyed Seeing',
    description: 'Bring the strengths of Indigenous ways of knowing and Western biological science into respectful dialogue, using both together to develop a fuller understanding of the topic.',
    details: 'Consider what each knowledge system reveals, where their insights meet or differ, and how learning from both could inform action. Use Indigenous-authored or community-grounded sources wherever possible, keep knowledge connected to its people and place, and respect community protocols and restrictions.',
    videos: [
      { label: 'Short introduction: Two-Eyed Seeing in ecological research (5 min)', url: 'https://www.youtube.com/watch?v=3LI9roIYyhE' },
      { label: 'Deeper exploration with Elder Dr. Albert Marshall', url: 'https://www.youtube.com/watch?v=pJcjf1nUckc' }
    ]
  },
  {
    id: 'toronto-zoo',
    title: 'Toronto Zoo: comparative biology',
    shortTitle: 'Toronto Zoo',
    description: 'Compare at least three distinct plant and/or animal groups to investigate how different species meet common biological needs and respond to their environments. Similarities can reveal shared principles; differences can reveal constraints, trade-offs, and remarkable solutions.',
    details: 'Comparative biology uses the diversity of life to uncover general principles and understand how different species have evolved distinct solutions. The Krogh principle begins with a biological question and seeks an organism especially well suited to reveal the answer. The inverse Krogh principle begins with an organism and asks what questions its distinctive biology inspires. These approaches are complementary. Ask what becomes visible only when species are placed side by side. Toronto Zoo species and conservation programs may provide useful cases.',
    videos: [
      { type: 'Read', label: 'The inverse Krogh principle: All organisms are worthy of study', url: 'https://www.journals.uchicago.edu/doi/full/10.1086/721620' },
      { type: 'Watch', label: 'Comparative thinking in biology — Adrian Currie', url: 'https://www.youtube.com/watch?v=AfiyJ_kCLR8' }
    ]
  },
  {
    id: 'subdisciplines',
    title: 'Biological subdisciplines',
    shortTitle: 'Biological subdisciplines',
    description: 'Examine the topic at the interfaces of at least three biological subdisciplines. Although areas such as physiology, cell biology, genetics, development, evolution, ecology, and biochemistry are often taught separately, their boundaries are largely historical and biological questions routinely cross them.',
    details: 'Bring evidence and ideas from the disciplines together to develop an explanation, hypothesis, or insight that no single discipline would produce alone. Fields such as evolutionary ecology, neurophysiology, and developmental biochemistry show how working between established areas can open new questions and push the boundaries of knowledge.',
    videos: [
      { label: 'Why researchers work across disciplines', url: 'https://www.youtube.com/watch?v=yyf0uTz0fFk' },
      { label: 'Case study: fossils and genetics explain the evolution of limbs (26:06)', url: 'https://www.ibiology.org/evolution/hox-genes/' }
    ]
  }
];

function topic(number, changes) {
  Object.assign(content.topics[number - 1], changes);
}

topic(2, {
  sources: [
    { label: 'Methods in Ecology and Evolution', url: 'https://besjournals.onlinelibrary.wiley.com/doi/10.1111/2041-210X.14476' },
    { label: 'University of Copenhagen', url: 'https://researchprofiles.ku.dk/en/publications/microclimate-an-important-part-of-ecology-and-biogeography/' },
    { label: 'Frontiers of Biogeography', url: 'https://biogeography.pensoft.net/article/164843/' }
  ]
});

topic(6, {
  title: 'Mosquitoes as vectors for disease',
  description: 'Mosquitoes can transmit viruses, parasites, and other pathogens, but only some species and populations are effective vectors. How do mosquito genetics, immunity, microbiomes, behaviour, host choice, climate, and habitat shape transmission, and how can that biology inform control?',
  sources: [
    { label: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases' },
    { label: 'PubMed Central', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10771300/' },
    { label: 'PLOS Neglected Tropical Diseases', url: 'https://journals.plos.org/plosntds/article?id=10.1371%2Fjournal.pntd.0010768' }
  ]
});

topic(7, {
  title: 'Seasonal indicators and ecological forecasting',
  description: 'Flowering, leaf-out, insect emergence, migration, breeding, and other recurring events can signal seasonal change. How do organisms respond to environmental cues, how can observations be combined across places and scales, and what happens when interacting species respond at different rates?',
  sources: [
    { label: 'Philosophical Transactions B', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2981948/' },
    { label: 'USA National Phenology Network', url: 'https://www.usanpn.org/data/publications' },
    { label: 'Journal of Ecology', url: 'https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2745.13897' }
  ]
});

topic(12, {
  description: 'Mercury moves through water, soil, food webs, and bodies. What determines its uptake, chemical transformation, biomagnification, and biological effects, and what approaches can improve monitoring, remediation, and ecosystem recovery?'
});

topic(19, { title: 'Astrobiology: life beyond Earth' });
topic(30, { title: 'Pathogen virulence: “Live fast and die young, or go slow and steady?”' });
topic(32, {
  title: 'The landscape of fear',
  description: 'Animals often trade access to food, mates, or shelter against the risk of encountering predators. How do these perceived risks shape movement, physiology, behaviour, species interactions, and ecosystem processes, and how can ecologists map or test a landscape of fear?'
});
topic(37, { title: 'The theory of autumn colours' });

topic(38, {
  description: 'Rare cancers can pass between individuals as living cell lineages. What makes transmission and immune escape possible, how do hosts and tumours coevolve, and what are the consequences for populations? Compare cases in dogs, Tasmanian devils, bivalves, and the recently documented transmissible melanoma of brown bullhead catfish.',
  sources: [
    { label: 'PubMed Central review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7345153/' },
    { label: 'University of Cambridge', url: 'https://www.tcg.vet.cam.ac.uk/publications' },
    { label: 'Nature — brown bullhead melanoma', url: 'https://www.nature.com/articles/s41586-026-10828-6' }
  ]
});

topic(39, {
  title: 'Climate change and the shifting geography of disease',
  description: 'Changing temperature, rainfall, seasonality, and extreme weather can alter the ranges and timing of hosts, vectors, and pathogens. How might these changes reshape diseases such as malaria, dengue, Lyme disease, or wildlife infections, and why do land use, behaviour, surveillance, and health systems also matter?',
  sources: [
    { label: 'Annals of the New York Academy of Sciences', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6378404/' },
    { label: 'Parasites & Vectors', url: 'https://parasitesandvectors.biomedcentral.com/articles/10.1186/1756-3305-6-1' },
    { label: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases' }
  ]
});

topic(43, {
  title: 'Tracking animal movement',
  description: 'GPS tags, radio telemetry, accelerometers, camera traps, acoustic arrays, stable isotopes, and community observations can reveal where and how animals move. What can different methods measure across species and scales, what biases or welfare costs do they introduce, and how should movement data guide conservation?',
  sources: [
    { label: 'Methods in Ecology and Evolution', url: 'https://besjournals.onlinelibrary.wiley.com/doi/10.1111/2041-210X.13767' },
    { label: 'Movebank', url: 'https://www.movebank.org/cms/movebank-content/about-movebank' },
    { label: 'Global Biodiversity Information Facility', url: 'https://www.gbif.org/news/2djCgxEiwLOLUF4E4KViPP/animals-in-motion-enabling-data-sharing-from-movebank' }
  ]
});

topic(45, {
  title: 'Camouflage, mimicry, and biological deception',
  description: 'Organisms can avoid detection, imitate other species, or manipulate how receivers interpret signals. How do genetics, development, sensory systems, behaviour, ecology, and evolution produce camouflage and mimicry, and how do predators, prey, pollinators, or hosts respond?',
  sources: [
    { label: 'Animal camouflage: current issues and new perspectives', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2674078/' },
    { label: 'Signals, cues and the nature of mimicry', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5326520/' },
    { label: 'Journal of Zoology review', url: 'https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/jzo.12682' }
  ]
});

topic(47, {
  title: 'Medicinal plants and biological activity',
  description: 'Plants produce diverse compounds that can affect cells, microbes, parasites, and whole organisms. How do plant chemistry, physiology, ecology, cultivation, dose, and preparation shape biological activity, and how can promising effects be tested safely and responsibly?',
  sources: [
    { label: 'PubMed Central', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3316145/' },
    { label: 'NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK92773/' },
    { label: 'Royal Botanic Gardens, Kew', url: 'https://www.kew.org/science/our-science/science-services/medicinal-plant-names-services' }
  ]
});

topic(55, { title: 'The role of artificial intelligence (AI) in biology' });

topic(9, {
  sources: [
    { label: 'ScienceDaily', url: 'https://www.sciencedaily.com/releases/2020/11/201130113534.htm' },
    { label: 'National Institute of General Medical Sciences', url: 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx' },
    { label: 'PubMed Central review', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3104765/' }
  ]
});

topic(33, {
  sources: [
    { label: 'Frontiers for Young Minds', url: 'https://kids.frontiersin.org/articles/10.3389/frym.2022.734864' },
    { label: 'Nature', url: 'https://www.nature.com/articles/d41586-020-00043-2' },
    { label: 'US Forest Service Research', url: 'https://research.fs.usda.gov/rmrs/fire/prescribed' }
  ]
});

topic(40, {
  sources: [
    { label: 'The Guardian', url: 'https://www.theguardian.com/environment/2016/feb/02/ships-noise-is-serious-problem-for-killer-whales-and-dolphins-report-finds' },
    { label: 'Science', url: 'https://www.science.org/doi/10.1126/science.aba4658' },
    { label: 'NOAA', url: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-noise' }
  ]
});

topic(46, {
  sources: [
    { label: 'ScienceDaily', url: 'https://www.sciencedaily.com/releases/2017/05/170516091141.htm' },
    { label: 'PubMed Central review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7521350/' },
    { label: 'Frontiers in Mammal Science', url: 'https://www.frontiersin.org/journals/mammal-science/articles/10.3389/fmamm.2023.1281030/full' }
  ]
});

topic(56, {
  sources: [
    { label: 'Journal of Zoo and Aquarium Research', url: 'https://jzar.org/jzar/article/view/786' },
    { label: 'Smithsonian’s National Zoo', url: 'https://nationalzoo.si.edu/animals/animal-nutrition-science' },
    { label: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-exotic-and-zoo-animals/overview-of-nutrition-exotic-and-zoo-animals' }
  ]
});

const descriptionRevisions = {
  1: 'Why have some species entered long-term relationships of domestication with people while others have not? What makes domestication possible, where are its limits, and how does it differ from taming or captive breeding?',
  5: 'Seeds use diverse cues to remain dormant or begin germination. What determines when a seed waits or grows, why do these strategies vary, and how can that knowledge support cultivation, restoration, or seed banking?',
  6: 'Mosquitoes can transmit viruses, parasites, and other pathogens, but only some species and populations are effective vectors. What determines whether transmission succeeds, how might changing conditions alter risk, and which vulnerabilities could disease-control efforts exploit?',
  13: 'Living systems vary greatly in their capacity to repair or replace damaged structures. Why can some rebuild functional tissues while others heal with scars, and how could those natural solutions improve tissue engineering, transplantation, or drug testing?',
  14: 'High altitude exposes organisms to low oxygen, cold, intense radiation, and short growing seasons. How do organisms—including high-altitude human populations—survive and reproduce under these conditions, and what costs or limits accompany their solutions?',
  15: 'Speed, endurance, strength, and recovery cannot all be maximized at once. What limits biological performance, what trade-offs arise among different kinds of performance, and why have organisms arrived at such different solutions?',
  16: 'Lifespans vary from days to centuries. Why do organisms age at such different rates, what allows some to preserve function or resist damage for unusually long periods, and what can these extremes teach us about the limits of lifespan?',
  22: 'Animals occupy a continuum of strategies for producing, retaining, and exchanging heat. How can evidence from living organisms and the fossil record be combined to infer how extinct animals such as dinosaurs regulated body temperature?',
  23: 'Extreme heat can disrupt biological function, reproduction, and survival. Why can some organisms tolerate conditions that are lethal to others, what happens as their limits are approached, and how might this knowledge guide responses to a warming climate?',
  25: 'Freezing threatens living structures, yet some plants, animals, fungi, and microorganisms survive below 0°C. How do they prevent or tolerate damage, what trade-offs accompany these solutions, and what determines whether recovery is possible?',
  32: 'Animals often trade access to food, mates, or shelter against the risk of encountering predators. How does perceived danger change where and when animals carry out these activities, what wider consequences follow, and how can a landscape of fear be detected or tested?',
  35: 'Environmental change can disrupt when, where, and how organisms obtain and spend energy. How do organisms balance their energy budgets, what makes some especially vulnerable to disruption, and what can cases such as polar bears and declining sea ice reveal?',
  40: 'Many organisms use sound to navigate, find food or mates, avoid danger, and communicate. How does human-made noise interfere with these tasks, which organisms or settings are most vulnerable, and what consequences can spread beyond the individuals directly exposed?',
  45: 'Organisms can avoid detection, imitate other species, or manipulate how receivers interpret signals. How are camouflage and mimicry produced, why do they succeed in some settings but fail in others, and how do other organisms respond to being deceived?',
  47: 'Plants produce diverse compounds that can affect cells, microbes, parasites, and whole organisms. What determines whether a plant preparation has a biological effect, why might results vary, and how can promising claims be tested safely and responsibly?',
  49: 'Parental care ranges from none to prolonged and cooperative investment, and occurs in many animal groups. Why do such different forms of care arise, what costs and benefits do they create for parents and offspring, and when is care likely to be favoured?',
  51: 'Renewable-energy infrastructure can cause collisions, alter habitats and movement, create noise, or offer new opportunities for wildlife. Which effects matter most in different settings, and how can wind-energy systems be designed and placed to reduce harm?',
  52: 'Animals in human care may lack opportunities, choices, or challenges available in other environments. What makes enrichment genuinely beneficial, how should welfare be assessed across different animals and settings, and why might the same intervention help one individual but not another?',
  56: 'Animals differ greatly in what, when, and how they eat. How can diets for animals in human care meet nutritional needs while allowing natural feeding patterns, accounting for individual and seasonal variation, and avoiding unintended harm?',
  57: 'Animals encounter fermented foods, plant toxins, and other substances that can alter their actions or internal state. Which claims about deliberate use are supported by evidence, why do responses differ among organisms, and what can these encounters reveal about motivation and dependence?'
};

for (const [number, description] of Object.entries(descriptionRevisions)) {
  content.topics[Number(number) - 1].description = description;
}

const additions = {
  9: { label: 'National Institute of General Medical Sciences', url: 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx' },
  21: { label: 'PubMed Central', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4923318/' },
  25: { label: 'PubMed Central', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3033474/' },
  28: { label: 'National Center for Complementary and Integrative Health', url: 'https://www.nccih.nih.gov/health/antioxidants-in-depth' },
  29: { label: 'PubMed Central', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7595829/' },
  36: { label: 'Nature Education', url: 'https://www.nature.com/scitable/knowledge/library/allee-effects-19699394/' },
  40: { label: 'NOAA', url: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-noise' },
  42: { label: 'World Health Organization', url: 'https://www.who.int/publications/i/item/9789241516198' },
  46: { label: 'Animal Cognition', url: 'https://link.springer.com/article/10.1007/s10071-021-01557-0' },
  53: { label: 'UNSCEAR', url: 'https://www.unscear.org/unscear/en/areas-of-work/chernobyl.html' },
  54: { label: 'NOAA Office of Response and Restoration', url: 'https://response.restoration.noaa.gov/oil-and-chemical-spills/oil-spills' }
};

for (const [number, source] of Object.entries(additions)) {
  const sources = content.topics[Number(number) - 1].sources;
  if (sources.length < 3) sources.push(source);
}

for (const item of content.topics) item.sources = item.sources.slice(0, 3);

content.quiz.title = 'Discover your Avengers teamwork style';
content.quiz.intro = 'We’re going on a trip this weekend. Choose the option that feels most like you—even if none is perfect—and we’ll match you with an Avenger whose teamwork style resembles yours. There are no better or worse results.';
content.quiz.questions = [
  {
    id: 'companions',
    prompt: 'First, who are you going with?',
    options: [
      { id: 'closest-friends', label: 'A few close friends who already know one another well', scores: { connector: 3, coordinator: 1 } },
      { id: 'family', label: 'Members of my family', scores: { connector: 2, coordinator: 2 } },
      { id: 'new-people', label: 'People I do not know well yet—it could be a good way to connect', scores: { connector: 2, adapter: 2 } },
      { id: 'open-invite', label: 'Whoever is excited and available at the last minute', scores: { adapter: 2, innovator: 2 } }
    ]
  },
  ...content.quiz.questions.filter((question) => question.id !== 'companions' && question.id !== 'travel-snag')
];
content.quiz.outcomes = [
  { id: 'captain-america', name: 'Captain America', jungType: 'ISFJ', tagline: 'The dependable coordinator', description: 'You bring reliability, clear standards, and concern for the people affected by a decision.', watchOut: 'Leave room for the plan to change when a teammate finds a better route.', profile: { coordinator: 4, analyst: 1, innovator: 1, connector: 3, adapter: 1 } },
  { id: 'spider-man', name: 'Spider-Man', jungType: 'ENFP', tagline: 'The curious connector', description: 'You learn quickly, make energetic connections, and want your work to help other people.', watchOut: 'Choose priorities deliberately so enthusiasm does not become overcommitment.', profile: { coordinator: 1, analyst: 1, innovator: 3, connector: 3, adapter: 2 } },
  { id: 'iron-man', name: 'Iron Man', jungType: 'ENTP', tagline: 'The inventive problem-solver', description: 'You bring ambitious ideas, technical curiosity, and a willingness to test unconventional solutions.', watchOut: 'Make sure the whole team understands and owns an idea before racing ahead.', profile: { coordinator: 1, analyst: 3, innovator: 4, connector: 1, adapter: 1 } },
  { id: 'scarlet-witch', name: 'Scarlet Witch', jungType: 'INFP', tagline: 'The values-led creator', description: 'You bring imagination, emotional insight, and a strong sense of what matters beneath the surface.', watchOut: 'Make your reasoning visible so teammates can act on insights that may feel intuitive to you.', profile: { coordinator: 1, analyst: 1, innovator: 4, connector: 2, adapter: 2 } },
  { id: 'hulk', name: 'Hulk / Bruce Banner', jungType: 'INTP', tagline: 'The deep analyst', description: 'You dig beneath the surface, interrogate evidence, and help the group avoid conclusions the data cannot support.', watchOut: 'Do not wait for perfect certainty before sharing a useful provisional conclusion.', profile: { coordinator: 1, analyst: 4, innovator: 2, connector: 1, adapter: 2 } },
  { id: 'hawkeye', name: 'Hawkeye', jungType: 'ISTJ', tagline: 'The steady specialist', description: 'You bring preparation, practical judgment, and loyalty when a group needs dependable follow-through.', watchOut: 'Invite unfamiliar possibilities before defaulting to the safest proven route.', profile: { coordinator: 3, analyst: 3, innovator: 1, connector: 2, adapter: 1 } },
  { id: 'ant-man', name: 'Ant-Man', jungType: 'ESFJ', tagline: 'The adaptable energizer', description: 'You bring spontaneity, humour, and a willingness to act when a group needs momentum.', watchOut: 'Protect enough structure and focus to carry an exciting start through to completion.', profile: { coordinator: 1, analyst: 1, innovator: 2, connector: 3, adapter: 4 } },
  { id: 'captain-marvel', name: 'Captain Marvel', jungType: 'ISFP', tagline: 'The decisive stabilizer', description: 'You are comfortable taking responsibility and moving the group forward when the path is uncertain.', watchOut: 'Invite quieter teammates into the decision before taking the lead.', profile: { coordinator: 4, analyst: 2, innovator: 1, connector: 1, adapter: 2 } },
  { id: 'vision', name: 'Vision', jungType: 'ISTJ', tagline: 'The calm strategist', description: 'You bring systems thinking, independence, and a calm focus on the long-term objective.', watchOut: 'Check that an elegant strategy also reflects the team’s practical and interpersonal needs.', profile: { coordinator: 2, analyst: 4, innovator: 2, connector: 1, adapter: 1 } },
  { id: 'black-panther', name: 'Black Panther', jungType: 'INTJ', tagline: 'The strategic collaborator', description: 'You combine long-range thinking, careful judgment, and respect for the perspectives around the table.', watchOut: 'Translate strategy into early concrete actions so the group can build momentum.', profile: { coordinator: 3, analyst: 3, innovator: 1, connector: 2, adapter: 1 } }
];

fs.writeFileSync(contentPath, `${JSON.stringify(content, null, 2)}\n`);
