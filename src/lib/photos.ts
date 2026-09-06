// Realistic photos for the customer-facing item cards (produce, meats, animals
// for slaughter, activities). Lots of seed rows carry a stock `image_url`, but
// many of those hotlinks have rotted and vendor-added items often have no photo
// at all — so instead of a grey box (or a random "meat" photo on a bag of
// salad) we match the item *by name* to a picture that actually looks like it.
//
// - A vendor's own uploaded photo (Supabase storage) always wins.
// - Otherwise the name runs through an ordered keyword table (French + English —
//   the Québec seed is francophone) and picks a hand-verified Unsplash photo.
// - Anything unmatched falls back to a fitting photo for its kind.
//
// Every URL below was checked (HTTP 200) and eyeballed on 2026-09-06.

import type { Product } from '@/lib/types';

export type ItemKind = 'produce' | 'meat' | 'animal' | 'activity';

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PHOTO = {
  // meat — cuts & packages
  groundBeef: unsplash('1612078894671-f11ba41d713e'), // raw patties on a tray
  steak: unsplash('1448907503123-67254d59ca4f'), // raw steak with rosemary
  chops: unsplash('1628543108325-1c27cd7246b3'), // bone-in chops on wood
  sausage: unsplash('1624772398061-bbfa87ec6b5a'), // sausages on a tray
  meatBoard: unsplash('1607623814075-e51df1bdc82f'), // mixed butcher board
  poultryRaw: unsplash('1604503468506-a8da13d82791'), // raw bird on a board
  // live animals
  cattle: unsplash('1500595046743-cd271d694d30'), // cows in a field
  lamb: unsplash('1484557985045-edf25e08da73'), // sheep in a field
  goat: unsplash('1524024973431-2ad916746881'), // goat
  // vegetables
  tomato: unsplash('1561136594-7f68413baa99'), // basket of tomatoes
  corn: unsplash('1551754655-cd27e38d2076'), // sweetcorn cobs
  carrot: unsplash('1447175008436-054170c2e979'), // bunch of carrots
  potato: unsplash('1518977676601-b53f82aba655'), // pile of potatoes
  greens: unsplash('1540420773420-3366772f4999'), // leafy salad bowl
  vegBaskets: unsplash('1464226184884-fa280b87c399'), // mixed veg at market
  // fruit
  apple: unsplash('1567306226416-28f0efdc88ce'), // red apples
  strawberry: unsplash('1569613562636-7492d9f77aed'), // colander of strawberries
  // pantry
  eggs: unsplash('1506976785307-8732e854ad03'), // tray of brown eggs
  cider: unsplash('1534336810865-0beae4c81278'), // jug of apple cider
  // activities
  applePicking: unsplash('1597170558584-498bc3a3fe80'), // hands picking apples
  orchardWalk: unsplash('1508116916455-2857e44c161e'), // apple in hand, orchard rows
  market: unsplash('1464226184884-fa280b87c399'), // farm stand
  pettingZoo: unsplash('1516467508483-a7212febe31a'), // piglet in straw
  orchardField: unsplash('1560493676-04071c5f467b'), // long farm rows
} as const;

const FALLBACK: Record<ItemKind, string> = {
  produce: PHOTO.vegBaskets,
  meat: PHOTO.meatBoard,
  animal: PHOTO.cattle,
  activity: PHOTO.orchardField,
};

/** lower-case, strip accents (haché → hache) and punctuation for matching. */
function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop combining accents: haché → hache
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasImage(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.trim().length > 0;
}

/** A photo the vendor uploaded to our storage bucket — trust it as-is. */
function isUploadedPhoto(url: string): boolean {
  return url.includes('/storage/v1/object/') && url.includes('item-photos');
}

// First match wins. Activities go first (their names — "Autocueillette de
// pommes", "Souper à la ferme" — contain food words), then specific meat cuts,
// then generic categories.
const RULES: [RegExp, string][] = [
  // ---- activities -------------------------------------------------
  [/autocueillette|u[- ]?pick|pick your own|cueillette|apple pick|berry pick|fruit pick|\bpicking\b/, PHOTO.applePicking],
  [/cidrerie|cider (mill|press|tasting|house)|pressoir|degustation|vignoble|vineyard|wine tasting/, PHOTO.orchardWalk],
  [/mini[- ]?ferme|petting|\bzoo\b|animaux de la ferme|farm animals|basse[- ]cour|\benclos\b/, PHOTO.pettingZoo],
  [/tracteur|tractor|\bwagon\b|hay[- ]?ride|charrette|\bbalade\b|attelage|foin/, PHOTO.orchardField],
  [/souper|\bdiner\b|\bdinner\b|\brepas\b|table champetre|farm to table|farm dinner|\bbrunch\b|pique[- ]nique|picnic/, PHOTO.market],
  [/marche (a la |fermier|public)|farmers? market|farm stand|kiosque|\bmarket day\b/, PHOTO.market],
  [/\bvisite\b|\btour\b|guided|guidee|\batelier\b|workshop|\bclass\b|\bcours\b|excursion|experience|degust/, PHOTO.orchardField],

  // ---- sausage / skewers ---------------------------------------
  [/merguez|saucisse|sausage|bratwurst|chipolata|saucisson|kefta|kofta|kebab|brochette|skewer|chich taouk|shish|hot ?dog/, PHOTO.sausage],

  // ---- offal / bones -----------------------------------------
  [/\bfoie\b|liver|rognon|kidney|langue|tongue|\babats\b|offal|\bos a |soup bone|\bbones\b|bouillon|\bbroth\b|moelle|marrow|tripe/, PHOTO.meatBoard],

  // ---- beef -----------------------------------------------------------
  [
    /steak hache|boeuf hache|viande hachee|\bhache\b|hashed steak|ground beef|minced beef|beef mince|ground meat|hamburger meat|\bburger\b|\bpatty\b|patties|galette de viande|agneau hache|ground lamb|lamb mince/,
    PHOTO.groundBeef,
  ],
  [/cotelette|cote de boeuf|\bchop\b|chops|\brack\b|carre d|t[- ]?bone|ribeye|rib eye|entrecote|faux[- ]?filet|gigot|leg of lamb|epaule d.?agneau|lamb shoulder/, PHOTO.chops],
  [/rosbif|roast beef|\broti\b|pot[- ]au[- ]feu|brisket|poitrine de boeuf|\bstew\b|ragout|a mijoter|braising|cubes? de boeuf/, PHOTO.steak],
  [/\bsteak\b|bifteck|filet mignon|tenderloin|filet de boeuf|bavette|flank|onglet/, PHOTO.steak],
  [/quart de boeuf|quarter beef|quarter cow|half cow|demi[- ]?boeuf|beef share|cheptel|\bboeuf\b|\bbeef\b|\bveau\b|\bveal\b|\bcow\b|\bcattle\b|\bbovin/, PHOTO.cattle],

  // ---- lamb / goat / mutton ---------------------------------------
  [/agneau|\blamb\b|mouton|mutton|brebis/, PHOTO.lamb],
  [/chevre|chevreau|cabri|\bgoat\b|caprin|chevrette/, PHOTO.goat],

  // ---- poultry -------------------------------------------------
  [/poulet|chicken|volaille|dinde|turkey|canard|\bduck\b|caille|quail|pintade|guinea fowl|\boie\b|\bgoose\b/, PHOTO.poultryRaw],

  // ---- cured + generic meat --------------------------------------
  [/charcuterie|deli meat|cured meat|prosciutto|jambon|pastrami|smoked meat|viande fumee/, PHOTO.meatBoard],
  [/\bmeat\b|\bviande\b|butcher|boucherie|proteine|halal box|family pack|freezer pack|assortiment de viande/, PHOTO.meatBoard],

  // ---- vegetables --------------------------------------------
  [/tomate|tomato/, PHOTO.tomato],
  [/ble d.?inde|mais sucre|sweet ?corn|\bcorn\b|\bmais\b|epi de/, PHOTO.corn],
  [/carotte|carrot/, PHOTO.carrot],
  [/patate|pomme de terre|potato|grelot|russet|yukon/, PHOTO.potato],
  [
    /mesclun|salade|laitue|lettuce|mixed greens|spring mix|roquette|arugula|jeunes pousses|kale|chou frise|epinard|spinach|bette|blette|swiss chard|\bchard\b|cresson|endive|mache/,
    PHOTO.greens,
  ],
  [
    /oignon|onion|echalote|shallot|\bail\b|garlic|poireau|leek|concombre|cucumber|poivron|bell pepper|\bpiment\b|chili|courgette|zucchini|aubergine|eggplant|citrouille|potiron|pumpkin|courge|squash|butternut|brocoli|broccoli|chou[- ]?fleur|cauliflower|\bchou\b|cabbage|betterave|\bbeet\b|radis|radish|navet|turnip|rutabaga|haricot|green bean|string bean|\bpois\b|pea pod|snap pea|petits pois|snow pea|champignon|mushroom|pleurote|shiitake|cremini|portobello|asperge|asparagus|rhubarbe|rhubarb|fenouil|fennel|celeri|celery|\bherbe|\bherbs\b|basilic|basil|persil|parsley|coriandre|cilantro|menthe|\bmint\b|thym|thyme|panier de legumes|legumes|veggie box|vegetable/,
    PHOTO.vegBaskets,
  ],

  // ---- fruit -----------------------------------------------------
  [/fraise|strawberr|framboise|raspberr|bleuet|myrtille|blueberr|\bmure|blackberr|\bbaie|\bberry\b|berries/, PHOTO.strawberry],
  [
    /pomme|apple|cortland|honeycrisp|mcintosh|\bgala\b|lobo|spartan|empire|liberty|raisin|\bgrape|\bpoire\b|\bpear\b|\bprune\b|\bplum\b|peche|peach|nectarine|cerise|cherry|cherries|abricot|apricot|cantaloup|\bmelon\b|pasteque|watermelon|figue|\bfig\b|kiwi|\bfruit\b/,
    PHOTO.apple,
  ],

  // ---- pantry / dairy ---------------------------------------
  [/oeuf|\begg\b|eggs/, PHOTO.eggs],
  [/cidre|cider|\bjus\b|\bjuice\b|smoothie|limonade|lemonade|\bmiel\b|honey|confiture|\bjam\b|jelly|preserve|marmelade|compote|sirop d.?erable|maple syrup|\berable\b|\bmaple\b/, PHOTO.cider],
  [/\blait\b|\bmilk\b|creme|\bcream\b|fromage|cheese|cheddar|\bbrie\b|\bfeta\b|beurre|butter|yogourt|yaourt|yogurt|kefir|\bpain\b|\bbread\b|miche|baguette|sourdough|boulangerie|farine|flour/, PHOTO.market],
  [/fleur|flower|bouquet|tournesol|sunflower|tulipe|tulip/, PHOTO.market],
];

export type PhotoInput = {
  id: number;
  name: string;
  image_url?: string | null;
  kind: ItemKind;
};

/** A picture that looks like this item: the vendor's upload, or a name match. */
export function itemPhoto(item: PhotoInput): string {
  if (hasImage(item.image_url) && isUploadedPhoto(item.image_url)) return item.image_url;

  const name = norm(item.name);
  for (const [re, photo] of RULES) {
    if (re.test(name)) return photo;
  }
  return FALLBACK[item.kind];
}

/** The product's own uploaded photo, or a fitting one matched from its name. */
export function productPhoto(
  product: Pick<Product, 'id' | 'category' | 'name' | 'image_url'>,
): string {
  return itemPhoto({
    id: product.id,
    name: product.name,
    image_url: product.image_url,
    kind: product.category === 'meat' ? 'meat' : 'produce',
  });
}
