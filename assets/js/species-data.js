/* =========================================================
   WASP-A survey content — copied unchanged from wasp-project.net
   (question, six attributes, 9-point labels, about & consent text).
   Scale types and animal groups follow Nguyen et al. (2023),
   WASP: the World Archives of Species Perception, Database baad003.
   ========================================================= */
window.WASP = window.WASP || {};

WASP.API_BASE = 'https://wasp.orpolyzos.com';
WASP.TOTAL_SPECIES = 1980; // "We have a total of 1,980 animals for you to discover."
WASP.QUESTION_TITLE = 'How would you rate this animal in terms of it being';

/* ---------- scale palettes: colour encodes the nature of each scale ----------
   bipolar     negative pole ↔ neutral ↔ positive pole  (diverging purple–green)
   unipolar    none → extreme                           (sequential, one hue)
   categorical IUCN Red List categories                 (official IUCN colours)  */
WASP.PALETTES = {
  bipolar: ['#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#ece8df', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837'],
  danger: ['#fff1e9', '#fdd5c0', '#fcb499', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
  intellect: ['#eef4fb', '#d6e6f4', '#bcd7ec', '#9ac8e0', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  iucn: ['#60c659', '#cce226', '#f9e814', '#f9e814', '#fc7f3f', '#fc7f3f', '#d81e05', '#d81e05', '#542344']
};

WASP.QUESTION_TYPES = [
  { id: 'CUTE', text: 'Cute', color: 'var(--a-cute)', type: 'bipolar', palette: 'bipolar' },
  { id: 'DANGEROUS', text: 'Dangerous', color: 'var(--a-dangerous)', type: 'unipolar', palette: 'danger' },
  { id: 'INTELLIGENT', text: 'Intelligent', color: 'var(--a-intelligent)', type: 'unipolar', palette: 'intellect' },
  { id: 'BEAUTIFUL', text: 'Beautiful', color: 'var(--a-beautiful)', type: 'bipolar', palette: 'bipolar' },
  { id: 'ENDANGERED', text: 'Endangered', color: 'var(--a-endangered)', type: 'categorical', palette: 'iucn' },
  { id: 'IMPORTANT_FOR_ECOSYSTEMS', text: 'Important for ecosystem', color: 'var(--a-important)', type: 'bipolar', palette: 'bipolar' }
];

// Index 0..8 corresponds to the rating value 1..9 sent to the API.
WASP.SCALE_LABELS = {
  CUTE: ['Extremely disgusting', 'Very disgusting', 'Disgusting', 'Slightly disgusting', 'Neither disgusting nor cute', 'Slightly cute', 'Cute', 'Very cute', 'Extremely cute'],
  BEAUTIFUL: ['Extremely ugly', 'Very ugly', 'Ugly', 'Slightly ugly', 'Neither ugly nor beautiful', 'Slightly beautiful', 'Beautiful', 'Very beautiful', 'Extremely beautiful'],
  DANGEROUS: ['Not dangerous', 'Slightly dangerous', 'Slightly dangerous +', 'Slightly dangerous ++', 'Dangerous', 'Very dangerous', 'Very dangerous +', 'Very dangerous ++', 'Extremely dangerous'],
  ENDANGERED: ['Not threatened', 'Near threatened', 'Vulnerable', 'Vulnerable', 'Endangered', 'Endangered', 'Critically endangered', 'Critically endangered', 'Extinct in the wild'],
  INTELLIGENT: ['Not intelligent', 'Slightly intelligent', 'Slightly intelligent +', 'Slightly intelligent ++', 'Intelligent', 'Very intelligent', 'Very intelligent +', 'Very intelligent ++', 'Extremely intelligent'],
  IMPORTANT_FOR_ECOSYSTEMS: ['Extremely harmful', 'Very harmful', 'Harmful', 'Slightly harmful', 'Neither harmful nor important', 'Slightly important', 'Important', 'Very important', 'Extremely important']
};
// IUCN guideline shown under the Endangered scale (category -> rating values)
WASP.IUCN_LEGEND = [
  ['Not threatened', [1]], ['Near threatened', [2]], ['Vulnerable', [3, 4]],
  ['Endangered', [5, 6]], ['Critically endangered', [7, 8]], ['Extinct in the wild', [9]]
];

WASP.ABOUT_SURVEY = [
  'In each image, we show the full body of an animal species and six questions',
  'You are asked to rate each question according to your impression of the species, regardless of whether or not you know the species in the image',
  'Every time you complete six questions and press Rate, a response is collected and a new species image will be loaded',
  'We have a total of 1,980 animals for you to discover. You can stop and continue at your own pace.',
  'We use cookies to help you track your progress'
];

WASP.CONSENT = [
  'I understand that this survey collects my perception for different species, the results of which may be used purely for scientific purposes and may be published.',
  'I understand that my participation in this survey is voluntary and that I have the right to discontinue my participation at any time during the collection (by closing the browser window).',
  'I understand that my general geolocation (country-level) may be collected, but I will remain anonymous at every stage of the research.',
  'If I have any questions, I know I can contact Tuan Nguyen (tuan.nguyen@uhasselt.be).',
  'I have read and understood the above information.'
];

/* ---------- the ten IUCN animal groups of WASP-A (≈200 species each) ---------- */
WASP.GROUPS = [
  { id: 'mammals', name: 'Mammals', icon: 'paw' },
  { id: 'birds', name: 'Birds', icon: 'feather' },
  { id: 'fishes', name: 'Fishes', icon: 'fish' },
  { id: 'reptiles', name: 'Reptiles', icon: 'lizard' },
  { id: 'amphibians', name: 'Amphibians', icon: 'frog' },
  { id: 'insects', name: 'Insects', icon: 'bug' },
  { id: 'molluscs', name: 'Molluscs', icon: 'shell' },
  { id: 'crustaceans', name: 'Crustaceans', icon: 'crab' },
  { id: 'corals', name: 'Corals', icon: 'coral' },
  { id: 'invertebrates', name: 'Other invertebrates', icon: 'spider' }
];
WASP.GROUP_SIZE = 200; // approximate number of species per group (1,980 in total)

/* ---------- prototype sample: real WASP-A observations ----------
   [id, scientific name, photographer, licence, group]
   The group is only revealed AFTER a species is rated. */
const CC = {
  'CC BY': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-NC': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'CC BY-NC-ND': 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  'CC BY-NC-SA': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
};
WASP.SPECIES = [
  [26, 'Atractosteus tristoechus', 'Joachim S. Müller', 'CC BY-NC-SA', 'fishes'],
  [85, 'Platyrhinoidis triseriata', 'Josh Maxwell', 'CC BY-NC', 'fishes'],
  [142, 'Megachasma pelagios', 'Glenn Moore', 'CC BY-NC', 'fishes'],
  [159, 'Ceratias holboelli', 'Gonzalo Mucientes Sandoval', 'CC BY-NC-SA', 'fishes'],
  [173, 'Gymnarchus niloticus', 'Wiki-Harfus', 'CC BY-SA', 'fishes'],
  [315, 'Ouroborus cataphractus', 'Tyrone Ping', 'CC BY-NC', 'reptiles'],
  [338, 'Geoclemys hamiltonii', 'Kabir Singh Waraich', 'CC BY-NC', 'reptiles'],
  [352, 'Dactylocnemis pacificus', 'beaumasters', 'CC BY-NC', 'reptiles'],
  [387, 'Heosemys annandalii', 'ayuwat', 'CC BY-NC', 'reptiles'],
  [399, 'Peltocephalus dumerilianus', 'Sébastien SANT', 'CC BY-NC', 'reptiles'],
  [434, 'Architeuthis dux', 'Christopher Caine', 'CC BY-NC', 'molluscs'],
  [467, 'Kororia palaensis', 'ngirabembangch', 'CC BY-NC-SA', 'molluscs'],
  [507, 'Pachnodus niger', 'Paolo Mazzei', 'CC BY-NC', 'molluscs'],
  [533, 'Pinna nobilis', 'Falk Viczian Solarboot-Projekte gGmbH', 'CC BY-NC', 'molluscs'],
  [552, 'Theodoxus fluviatilis', 'osoandino', 'CC BY-NC', 'molluscs'],
  [608, 'Cannomys badius', 'Binturong27', 'CC BY-NC', 'mammals'],
  [661, 'Macrotis lagotis', 'pfaucher', 'CC BY-NC', 'mammals'],
  [698, 'Cephalorhynchus hectori', 'christiankropf', 'CC BY-NC', 'mammals'],
  [740, 'Propithecus coronatus', 'thierrycordenos', 'CC BY-NC', 'mammals'],
  [757, 'Felis margarita', 'Valerie', 'CC BY-NC-ND', 'mammals'],
  [858, 'Allophryne ruthveni', 'Sébastien SANT', 'CC BY-NC', 'amphibians'],
  [881, 'Brachycephalus didactylus', 'Diogo Luiz', 'CC BY-SA', 'amphibians'],
  [904, 'Andrias japonicus', 'Sebastian Voitel', 'CC BY-NC-SA', 'amphibians'],
  [930, 'Phrynopus peruanus', 'rudi-von-may', 'CC BY-NC', 'amphibians'],
  [982, 'Flectonotus fitzgeraldi', 'Duncan Hull', 'CC BY-NC', 'amphibians'],
  [1024, 'Leptothorax duloticus', 'Connor C.', 'CC BY', 'insects'],
  [1034, 'Cora marina', 'Giff Beaton', 'CC BY-NC', 'insects'],
  [1115, 'Dolichopoda remyi', 'Kaloust Paragamian', 'CC BY-NC', 'insects'],
  [1132, 'Asiotmethis limbatus', 'Paul Cools', 'CC BY-NC', 'insects'],
  [1193, 'Empusa pennata', 'belem1983', 'CC BY-NC', 'insects'],
  [1197, 'Palaemonias alabamae', 'Matthew L. Niemiller', 'CC BY-NC', 'crustaceans'],
  [1238, 'Sayamia bangkokensis', 'bnstyler', 'CC BY-NC', 'crustaceans'],
  [1259, 'Eosamon smithianum', 'benjamynweil', 'CC BY-NC', 'crustaceans'],
  [1272, 'Engaeus tuberculatus', 'Nimzee', 'CC BY-NC', 'crustaceans'],
  [1323, 'Potamonautes lividus', 'Tony Rebelo', 'CC BY-SA', 'crustaceans'],
  [1439, 'Zoosphaerium arborealis', 'seasav', 'CC BY-NC-ND', 'invertebrates'],
  [1440, 'Limulus polyphemus', 'JeffreyGammon', 'CC BY-NC', 'invertebrates'],
  [1450, 'Eostichopus arnesoni', 'craigjhowe', 'CC BY-NC-ND', 'invertebrates'],
  [1480, 'Herennia multipuncta', 'Chayant Gonsalves', 'CC BY', 'invertebrates'],
  [1551, 'Holothuria zacae', 'Jonathan Williams', 'CC BY-NC', 'invertebrates'],
  [1629, 'Goniopora tenuidens', 'Rafi Amar', 'CC BY-NC', 'corals'],
  [1634, 'Cynarina lacrymalis', 'Albert Kang', 'CC BY-NC', 'corals'],
  [1649, 'Sandalolitha robusta', 'Damien Brouste', 'CC BY-NC', 'corals'],
  [1662, 'Seriatopora hystrix', 'Damien Brouste', 'CC BY-NC', 'corals'],
  [1698, 'Oculina patagonica', 'Sylvain Le Bris', 'CC BY-NC', 'corals'],
  [1788, 'Crypturellus noctivagus', 'Luciano Bernardes', 'CC BY-NC', 'birds'],
  [1848, 'Rhea pennata', 'Hugo Hulsberg', 'CC BY-NC', 'birds'],
  [1864, 'Tringa solitaria', 'John D Reynolds', 'CC BY-NC', 'birds'],
  [1877, 'Ramphastos dicolorus', 'Luciano Bernardes', 'CC BY-NC', 'birds'],
  [1927, 'Ptiliogonys cinereus', 'Diego Roldán Piña', 'CC BY-NC', 'birds'],
  [1947, 'Icterus northropi', 'Bert Harris', 'CC BY-NC', 'birds']
].map(([id, name, by, lic, group]) => ({
  id, name, group,
  src: `${WASP.API_BASE}/medium/file/${id}`,
  photographer: `(c) ${by}, some rights reserved (${lic})`,
  licenseUrl: CC[lic]
}));
