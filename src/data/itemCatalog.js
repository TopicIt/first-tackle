const coins = 'coins';

export const ITEM_ID_ALIASES = {
  better_line: 'betterLine',
  cheap_float: 'simpleFloat',
  simpleFloat: 'simpleFloat',
  proper_float: 'properFloat',
  proper_sinker: 'properSinker',
  small_hook: 'smallHook',
  medium_hook: 'mediumHook',
  large_hook: 'largeHook',
  sharper_hook: 'sharperHook',
  proper_rod: 'properRod',
  goose_feather_float: 'gooseFeatherFloat',
  grandma_thread: 'grandma_thread',
  old_dull_hook: 'old_dull_hook',
  small_stone: 'small_stone',
  simple_stick_rod: 'simple_stick_rod',
  stickRod: 'simple_stick_rod',
  smallWorms: 'baitSmallWorms',
  worms: 'baitWorms',
  bread: 'baitBread',
  mastyrka: 'baitMastyrka',
  corn: 'baitCorn',
  dough: 'baitDough',
  nightcrawler: 'baitNightcrawler',
  larvae: 'baitLarvae',
};

const itemCatalog = [
  marketItem({
    id: 'shovel',
    name: { en: 'Shovel', uk: 'Лопата' },
    category: 'utility',
    price: 150,
    icon: '/assets/items/item_shovel.png',
    shortDescription: { en: 'Dig richer garden soil.', uk: 'Копає багатший ґрунт.' },
    fullDescription: { en: 'Lets you gather more bait from the garden soil.', uk: 'Допомагає добувати більше наживки в городі.' },
    bonuses: [bonus('baitGatherBonus', 0.15, { en: '+15% bait from digging', uk: '+15% наживки з копання' }, { en: '+15% bait', uk: '+15% наживки' })],
    tags: ['garden', 'bait'],
    sortOrder: 10,
  }),
  marketItem({
    id: 'betterLine',
    name: { en: 'Better line', uk: 'Краща жилка' },
    category: 'line',
    price: 300,
    icon: '/assets/items/better_line.png',
    shortDescription: { en: 'Farther casts and fewer breaks.', uk: 'Далі дістає і менше рветься.' },
    fullDescription: { en: 'Sharper casts, farther water, fewer line breaks, and a small trophy-size bump.', uk: 'Точніші закиди, дальша вода, менше обривів і трохи більший шанс великої риби.' },
    bonuses: [
      bonus('fishSizeMultiplier', 0.01, { en: '+1% fish size', uk: '+1% до розміру риби' }),
      bonus('escapeChanceMultiplier', -0.08, { en: '-8% line break risk', uk: '-8% до ризику обриву' }),
    ],
    usedFor: ['line'],
    tags: ['tackle', 'distance'],
    sortOrder: 20,
  }),
  marketItem({
    id: 'simpleFloat',
    name: { en: 'Simple float', uk: 'Простий поплавок' },
    category: 'float',
    price: 40,
    icon: '/assets/items/float-cheap.png',
    shortDescription: { en: 'Basic bite visibility.', uk: 'Базово видно кльов.' },
    fullDescription: { en: 'A cheap float for readable bites on early waters.', uk: 'Дешевий поплавок, щоб легше читати кльов на перших водоймах.' },
    bonuses: [bonus('biteChanceBonus', 0.01, { en: '+1% bite chance', uk: '+1% до шансу клювання' })],
    usedFor: ['float'],
    tags: ['tackle'],
    sortOrder: 30,
  }),
  marketItem({
    id: 'properFloat',
    name: { en: 'Proper float', uk: 'Кращий поплавок' },
    category: 'float',
    price: 200,
    icon: '/assets/items/float-proper.png',
    shortDescription: { en: 'Clearer bites and casting.', uk: 'Чіткіший кльов і точність.' },
    fullDescription: { en: 'A better float that tightens bite reading and casting precision.', uk: 'Кращий поплавок для читання кльову й точнішого закиду.' },
    bonuses: [bonus('biteChanceBonus', 0.02, { en: '+2% bite chance', uk: '+2% до шансу клювання' })],
    usedFor: ['float'],
    tags: ['tackle'],
    sortOrder: 40,
  }),
  marketItem({
    id: 'properSinker',
    name: { en: 'Proper sinker', uk: 'Краще грузило' },
    category: 'tackle',
    subcategory: 'sinker',
    price: 80,
    icon: '/assets/items/proper_sinker.png',
    shortDescription: { en: 'More stable presentation.', uk: 'Стабільніша подача наживки.' },
    fullDescription: { en: 'Stabilizes bait and improves casting precision.', uk: 'Стабілізує наживку й покращує точність закиду.' },
    bonuses: [bonus('escapeChanceMultiplier', -0.1, { en: '-10% escape risk', uk: '-10% до ризику зриву' })],
    usedFor: ['sinker'],
    tags: ['tackle', 'precision'],
    sortOrder: 50,
  }),
  marketItem({
    id: 'smallHook',
    name: { en: 'Small hook', uk: 'Малий гачок' },
    category: 'hook',
    price: 45,
    icon: '/assets/items/hooks_box.png',
    shortDescription: { en: 'For small careful fish.', uk: 'Для дрібної обережної риби.' },
    fullDescription: { en: 'Small sharp hook for careful small fish.', uk: 'Краще для дрібної та обережної риби. Менше насторожує, але гірше тримає велику.' },
    bonuses: [bonus('biteChanceBonus', 0.01, { en: '+1% bite chance', uk: '+1% до шансу клювання' })],
    usedFor: ['hook'],
    tags: ['tackle'],
    sortOrder: 60,
  }),
  marketItem({
    id: 'mediumHook',
    name: { en: 'Medium hook', uk: 'Середній гачок' },
    category: 'hook',
    price: 90,
    icon: '/assets/items/hooks_box.png',
    shortDescription: { en: 'Balanced everyday hook.', uk: 'Універсальний гачок.' },
    fullDescription: { en: 'Balanced hook for everyday fishing.', uk: 'Універсальний варіант для більшості риби.' },
    bonuses: [bonus('biteChanceBonus', 0.015, { en: '+1.5% bite chance', uk: '+1.5% до шансу клювання' })],
    usedFor: ['hook'],
    tags: ['tackle'],
    sortOrder: 70,
  }),
  marketItem({
    id: 'largeHook',
    name: { en: 'Large hook', uk: 'Великий гачок' },
    category: 'hook',
    price: 150,
    icon: '/assets/items/sharp-hook.png',
    shortDescription: { en: 'For live bait and big fish.', uk: 'Для живця та великої риби.' },
    fullDescription: { en: 'Stronger hook for bigger fish and live bait.', uk: 'Для живця та великої риби. Дрібна риба бере рідше.' },
    bonuses: [
      bonus('fishSizeMultiplier', 0.01, { en: '+1% fish size', uk: '+1% до розміру риби' }),
      bonus('trophyChanceBonus', 0.01, { en: '+1% trophy chance', uk: '+1% до шансу трофея' }),
    ],
    usedFor: ['hook', 'live bait'],
    tags: ['tackle', 'predator'],
    sortOrder: 80,
  }),
  marketItem({
    id: 'sharperHook',
    name: { en: 'Sharper hook', uk: 'Гостріший гачок' },
    category: 'hook',
    price: 100,
    icon: '/assets/items/sharp-hook.png',
    shortDescription: { en: 'Better hook-up rate.', uk: 'Краще засікає рибу.' },
    fullDescription: { en: 'Improves hook-up rate and reduces escape risk.', uk: 'Покращує шанс засікти рибу й зменшує ризик зриву.' },
    bonuses: [
      bonus('trophyChanceBonus', 0.01, { en: '+1% trophy chance', uk: '+1% до шансу трофея' }),
      bonus('escapeChanceMultiplier', -0.1, { en: '-10% escape risk', uk: '-10% до ризику зриву' }),
    ],
    usedFor: ['hook'],
    tags: ['tackle'],
    sortOrder: 90,
  }),
  marketItem({
    id: 'properRod',
    name: { en: 'Proper rod', uk: 'Нормальна вудка' },
    category: 'rod',
    price: 800,
    icon: '/assets/items/proper_rod.png',
    shortDescription: { en: 'Control for larger fish.', uk: 'Контроль великої риби.' },
    fullDescription: { en: 'Durable shop rod for larger fish and trophy attempts.', uk: 'Добре вудилище: кращий контроль великої риби й трофейних спроб.' },
    bonuses: [
      bonus('fishSizeMultiplier', 0.015, { en: '+1.5% fish size', uk: '+1.5% до розміру риби' }),
      bonus('trophyChanceBonus', 0.01, { en: '+1% trophy chance', uk: '+1% до шансу трофея' }),
    ],
    usedFor: ['rod'],
    tags: ['tackle', 'trophy'],
    sortOrder: 100,
  }),
  marketItem({
    id: 'salt',
    name: { en: 'Salt', uk: 'Сіль' },
    category: 'utility',
    price: 30,
    icon: '/assets/items/salt_bag.png',
    type: 'consumable',
    itemId: 'salt',
    amount: 10,
    shortDescription: { en: 'Preserve cleaned fish.', uk: 'Для таранки й консервації.' },
    fullDescription: { en: 'Ten pinches for preserving cleaned fish and making taranka.', uk: 'Сіль для 10 риб: потрібна, щоб робити таранку.' },
    usedFor: ['processing'],
    tags: ['taranka', 'market'],
    sortOrder: 110,
  }),
  marketItem({
    id: 'baitSmallWorms',
    name: { en: 'Small worms', uk: 'Дрібні черв’яки' },
    category: 'bait',
    price: 20,
    icon: '/assets/items/bait_nightcrawler.png',
    type: 'consumable',
    itemId: 'smallWorms',
    amount: 25,
    shortDescription: { en: 'Tiny bait for careful fish.', uk: 'Для дрібної обережної риби.' },
    fullDescription: { en: 'Tiny worms for careful small fish.', uk: 'Для дрібної та обережної риби. Менше шансів на велику й трофейну.' },
    tags: ['bait', 'early'],
    sortOrder: 120,
  }),
  marketItem({
    id: 'baitBread',
    name: { en: 'Bread', uk: 'Хліб' },
    category: 'bait',
    price: 30,
    icon: '/assets/items/bait_bread.png',
    type: 'consumable',
    itemId: 'bread',
    amount: 30,
    shortDescription: { en: 'Soft peaceful-fish bait.', uk: 'М’яка наживка для мирної риби.' },
    fullDescription: { en: 'Soft bread for crucian, bream, roach-like fish and tench.', uk: 'М’який хліб для карася, лящових, плотиці й лина.' },
    usedFor: ['crucian', 'bream', 'roach'],
    tags: ['bait'],
    sortOrder: 130,
  }),
  marketItem({
    id: 'baitWorms',
    name: { en: 'Worms', uk: 'Черв’яки' },
    category: 'bait',
    price: 30,
    icon: '/assets/items/bait_nightcrawler.png',
    type: 'consumable',
    itemId: 'worms',
    amount: 30,
    shortDescription: { en: 'Reliable universal bait.', uk: 'Надійна рання наживка.' },
    fullDescription: { en: 'Reliable worms for almost every early water.', uk: 'Збалансована наживка для карася, окуня, плітки й більшості ранніх водойм.' },
    usedFor: ['crucian', 'okun', 'roach'],
    tags: ['bait', 'early'],
    sortOrder: 140,
  }),
  marketItem({
    id: 'baitMastyrka',
    name: { en: 'Mastyrka', uk: 'Мастирка' },
    category: 'groundbait',
    price: 50,
    icon: '/assets/items/bait_mastyrka.png',
    type: 'consumable',
    itemId: 'mastyrka',
    amount: 10,
    shortDescription: { en: 'Pea paste for peaceful fish.', uk: 'Горохова наживка.' },
    fullDescription: { en: 'Pea paste for crucian, carp and bream.', uk: 'Горохова мастирка для карася, карпа й ляща.' },
    usedFor: ['crucian', 'carp', 'bream'],
    tags: ['bait'],
    sortOrder: 150,
  }),
  marketItem({
    id: 'baitCorn',
    name: { en: 'Corn', uk: 'Кукурудза' },
    category: 'bait',
    price: 60,
    icon: '/assets/items/bait_corn.png',
    type: 'consumable',
    itemId: 'corn',
    amount: 10,
    shortDescription: { en: 'For larger pond fish.', uk: 'Для більшої ставкової риби.' },
    fullDescription: { en: 'Sweet corn for carp, grass carp and larger pond fish.', uk: 'Солодка кукурудза для карпа, амура й більшої ставкової риби.' },
    usedFor: ['carp', 'grass_carp', 'silver_carp'],
    tags: ['bait', 'pond'],
    sortOrder: 160,
  }),
  marketItem({
    id: 'baitDough',
    name: { en: 'Dough', uk: 'Тісто' },
    category: 'bait',
    price: 40,
    icon: '/assets/items/bait_dough.png',
    type: 'consumable',
    itemId: 'dough',
    amount: 20,
    shortDescription: { en: 'Calm-water bait.', uk: 'Для тихої води.' },
    fullDescription: { en: 'Simple dough for calm-water peaceful fish.', uk: 'Просте тісто для мирної риби в тихій воді.' },
    usedFor: ['bleak', 'bream', 'crucian'],
    tags: ['bait'],
    sortOrder: 170,
  }),
  marketItem({
    id: 'baitNightcrawler',
    name: { en: 'Nightcrawler', uk: 'Виповзок' },
    category: 'bait',
    price: 50,
    icon: '/assets/items/bait_worm.png',
    type: 'consumable',
    itemId: 'nightcrawler',
    amount: 10,
    shortDescription: { en: 'Large worm for bottom fish.', uk: 'Великий донний черв’як.' },
    fullDescription: { en: 'Large worm for perch, catfish and stronger bottom fish.', uk: 'Великий черв’як для більшої донної риби, вугра, рогаля й сома.' },
    usedFor: ['okun', 'som', 'eel'],
    tags: ['bait', 'predator'],
    sortOrder: 180,
  }),
  marketItem({
    id: 'baitLarvae',
    name: { en: 'Larvae', uk: 'Личинки' },
    category: 'bait',
    price: 35,
    icon: '/assets/items/bait_larvae.png',
    type: 'consumable',
    itemId: 'larvae',
    amount: 20,
    shortDescription: { en: 'Quick bites for small fish.', uk: 'Для швидкого кльову.' },
    fullDescription: { en: 'Small larvae for perch, roach-like fish and quick bites.', uk: 'Личинки для окуня, плітки і швидких клювань.' },
    usedFor: ['okun', 'roach', 'crucian'],
    tags: ['bait', 'early'],
    sortOrder: 190,
  }),
  marketItem({
    id: 'hooksPack',
    name: { en: 'Hooks pack', uk: 'Набір гачків' },
    category: 'hook',
    price: 100,
    icon: '/assets/items/hooks_box.png',
    type: 'consumable',
    itemId: 'hooksPack',
    amount: 5,
    shortDescription: { en: 'Spare hooks for later tackle.', uk: 'Запасні гачки.' },
    fullDescription: { en: 'Spare hooks for later rods and repairs.', uk: 'Запасні гачки для майбутньої снасті.' },
    tags: ['tackle'],
    sortOrder: 200,
  }),
  marketItem({
    id: 'scooter',
    name: { en: 'Scooter', uk: 'Самокат' },
    category: 'utility',
    price: 700,
    icon: '/assets/items/scooter.jpg',
    shortDescription: { en: 'Unlocks the sluice road.', uk: 'Відкриває шлях до Шлюзу.' },
    fullDescription: { en: 'Unlocks rides to the sluice.', uk: 'Самокат відкриває дорогу до Шлюзу.' },
    usedFor: ['travel'],
    tags: ['travel'],
    sortOrder: 210,
  }),
  marketItem({
    id: 'bicycle',
    name: { en: 'Used bicycle', uk: 'Б/у велосипед' },
    category: 'utility',
    price: 2000,
    icon: '/assets/items/bicycle.png',
    shortDescription: { en: 'About 20 distant trips.', uk: 'Близько 20 дальніх поїздок.' },
    fullDescription: { en: 'Used bicycle for distant waters. About 20 trips.', uk: 'Б/у велосипед для дальших водойм. Приблизно 20 поїздок.' },
    usedFor: ['travel'],
    tags: ['travel'],
    sortOrder: 220,
  }),
  marketItem({
    id: 'betterBicycle',
    name: { en: 'Better bicycle', uk: 'Кращий велосипед' },
    category: 'utility',
    price: 10000,
    icon: '/assets/items/bicycle-better.png',
    shortDescription: { en: 'Much higher durability.', uk: 'Набагато витриваліший.' },
    fullDescription: { en: 'Sturdier bicycle with much higher durability.', uk: 'Міцніший велосипед із набагато більшою витривалістю.' },
    usedFor: ['travel'],
    tags: ['travel'],
    sortOrder: 230,
  }),
  marketItem({
    id: 'bestBicycle',
    name: { en: 'Best bicycle', uk: 'Найкращий велосипед' },
    category: 'utility',
    price: 20000,
    icon: '/assets/items/bicycle-best.png',
    shortDescription: { en: 'No-worry travel durability.', uk: 'Практично без турбот.' },
    fullDescription: { en: 'Premium bicycle with practical no-worry durability.', uk: 'Преміальний велосипед без практичних турбот про поломку.' },
    usedFor: ['travel'],
    tags: ['travel'],
    sortOrder: 240,
  }),
  componentItem({
    id: 'grandma_thread',
    name: { en: 'Grandma thread', uk: 'Бабусина нитка' },
    category: 'line',
    icon: '/assets/items/grandma_thread.png',
    shortDescription: { en: 'Starter handline.', uk: 'Початкова нитка.' },
    fullDescription: { en: 'Minimum line for fishing, with higher break risk.', uk: 'Нитка для вишивання: мінімум для риболовлі, але більший ризик обриву.' },
    bonuses: [bonus('breakPenalty', 0.12, { en: '+12% break risk', uk: '+12% ризику обриву' })],
    usedFor: ['line'],
  }),
  componentItem({
    id: 'old_dull_hook',
    name: { en: 'Old dull hook', uk: 'Старий гачок' },
    category: 'hook',
    icon: '/assets/items/hooks_box.png',
    shortDescription: { en: 'Barely enough to start.', uk: 'Ледь вистачає для старту.' },
    fullDescription: { en: 'Old hook from the drawer. It works, but poorly.', uk: 'Старий гачок із шухляди. Працює, але погано.' },
    bonuses: [bonus('hookBonus', -0.08, { en: '-8% hook control', uk: '-8% до засікання' })],
    usedFor: ['hook'],
  }),
  componentItem({
    id: 'small_stone',
    name: { en: 'Small stone', uk: 'Камінчик' },
    category: 'tackle',
    subcategory: 'sinker',
    icon: '/assets/items/tackle_components.png',
    shortDescription: { en: 'Starter sinker.', uk: 'Базове грузило.' },
    fullDescription: { en: 'Basic sinker without major bonuses.', uk: 'Камінчик: базове грузило без великих бонусів.' },
    usedFor: ['sinker'],
  }),
  componentItem({
    id: 'gooseFeatherFloat',
    aliasIds: ['goose_feather_float'],
    name: { en: 'Goose feather float', uk: 'Поплавок з пера' },
    category: 'float',
    icon: '/assets/items/fishing_float.png',
    shortDescription: { en: 'Readable starter float.', uk: 'Базово видно кльов.' },
    fullDescription: { en: 'A goose feather float with basic bite visibility.', uk: 'Поплавок з гусячого пера: базово видно покльовку.' },
    bonuses: [bonus('floatBonus', 0.05, { en: '+5% float readability', uk: '+5% читання поплавка' })],
    usedFor: ['float'],
  }),
  componentItem({
    id: 'simple_stick_rod',
    name: { en: 'Hazel rod', uk: 'Вудилище з ліщини' },
    category: 'rod',
    icon: '/assets/items/simple_stick_rod.png',
    shortDescription: { en: 'First simple rod.', uk: 'Перша проста вудка.' },
    fullDescription: { en: 'Minimal rod for first fishing.', uk: 'Вудилище з ліщини: мінімальна вудка для першої риболовлі.' },
    bonuses: [bonus('controlBonus', 0.08, { en: '+8% control', uk: '+8% контролю' })],
    usedFor: ['rod'],
  }),
];

const catalogById = new Map();
for (const item of itemCatalog) {
  catalogById.set(item.id, item);
  for (const alias of item.aliasIds ?? []) {
    catalogById.set(alias, item);
  }
}

export { itemCatalog };

export function getItemById(id) {
  if (!id) {
    return null;
  }
  return catalogById.get(id) ?? catalogById.get(ITEM_ID_ALIASES[id]) ?? null;
}

export function getItemsByCategory(category) {
  return itemCatalog
    .filter((item) => item.category === category)
    .sort(bySortOrder);
}

export function getMarketItems() {
  return itemCatalog
    .filter((item) => item.market !== false)
    .sort(bySortOrder)
    .map(toLegacyShopItem);
}

export function getCatalogMarketItems() {
  return itemCatalog
    .filter((item) => item.market !== false)
    .sort(bySortOrder);
}

export function getItemDisplayName(itemOrId, locale = 'en') {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  return localize(item?.name, locale) ?? item?.id ?? String(itemOrId ?? '');
}

export function getItemShortDescription(itemOrId, locale = 'en') {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  return localize(item?.shortDescription, locale) ?? '';
}

export function getItemFullDescription(itemOrId, locale = 'en') {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  return localize(item?.fullDescription, locale) ?? getItemShortDescription(item, locale);
}

export function getItemBonuses(itemOrId, locale = 'en') {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  return (item?.bonuses ?? []).map((bonusEntry) => ({
    ...bonusEntry,
    labelText: localize(bonusEntry.label, locale) ?? '',
    shortLabelText: localize(bonusEntry.shortLabel, locale) ?? localize(bonusEntry.label, locale) ?? '',
  }));
}

export function normalizeItemId(id) {
  return getItemById(id)?.id ?? ITEM_ID_ALIASES[id] ?? id;
}

export function localize(value, locale = 'en') {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return value[locale] ?? value.en ?? value.uk ?? '';
}

function marketItem(item) {
  return {
    currency: coins,
    type: 'tool',
    market: true,
    bonuses: [],
    tags: [],
    ...item,
  };
}

function componentItem(item) {
  return {
    currency: coins,
    price: 0,
    type: 'component',
    market: false,
    bonuses: [],
    tags: ['tackle'],
    ...item,
  };
}

function bonus(type, value, label, shortLabel = label) {
  return { type, value, label, shortLabel };
}

function bySortOrder(a, b) {
  return (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.id.localeCompare(b.id);
}

function toLegacyShopItem(item) {
  return {
    id: item.id,
    label: item.name.en ?? item.name.uk ?? item.id,
    price: item.price,
    description: item.shortDescription.en ?? item.fullDescription.en ?? item.id,
    type: item.type ?? 'tool',
    itemId: item.itemId,
    amount: item.amount,
    category: ['bait', 'groundbait'].includes(item.category) ? 'bait' : ['rod', 'line', 'hook', 'float', 'tackle'].includes(item.category) ? 'tackle' : 'other',
    effects: item.bonuses.map((entry) => ({
      type: entry.type,
      value: entry.value,
      label: entry.label.uk ?? entry.label.en ?? '',
    })),
  };
}
