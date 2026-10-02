/**
 * Dictionary: what you type in the list → a precise Open Food Facts category.
 *
 * Searching by category is far more reliable than free text ("pâtes" as text
 * also matches peanut butter and camembert). Every `category` below was checked
 * against the official OFF taxonomy on 2026-10-01.
 *
 * - `terms`: words you might type. Matching ignores case, accents and plurals,
 *   so "Pâtes", "pates" and "pâte" all work. More specific terms win
 *   ("riz complet" beats "riz").
 * - `category`: undefined = fresh/loose product with no barcode, nothing to search.
 */
export type Food = {
  label: string
  terms: string[]
  category?: string
}

export const FOODS: Food[] = [
  // Dairy and eggs
  { label: 'Yaourt nature', terms: ['yaourt', 'yaourt nature', 'yogourt', 'yoghourt'], category: 'en:plain-yogurts' },
  { label: 'Skyr nature', terms: ['skyr'], category: 'en:plain-skyrs' },
  { label: 'Fromage blanc nature', terms: ['fromage blanc'], category: 'fr:fromages-blancs-natures' },
  { label: 'Cottage cheese', terms: ['cottage', 'cottage cheese'], category: 'en:cottage-cheeses' },
  { label: 'Lait demi-écrémé', terms: ['lait', 'lait demi ecreme', 'lait demi-ecreme'], category: 'en:semi-skimmed-milks' },
  { label: 'Lait entier', terms: ['lait entier'], category: 'en:whole-milks' },
  { label: 'Beurre', terms: ['beurre', 'beurre doux'], category: 'en:butters' },
  { label: 'Crème fraîche', terms: ['creme', 'creme fraiche'], category: 'en:cremes-fraiches' },
  { label: 'Œufs', terms: ['oeuf', 'œuf', 'oeufs frais'], category: 'en:chicken-eggs' },
  { label: 'Emmental', terms: ['emmental'], category: 'en:emmentaler' },
  { label: 'Fromage râpé', terms: ['fromage rape', 'gruyere rape', 'emmental rape'], category: 'en:grated-cheese' },
  { label: 'Comté', terms: ['comte'], category: 'en:comte' },
  { label: 'Mozzarella', terms: ['mozzarella', 'mozza'], category: 'en:mozzarella' },
  { label: 'Parmesan', terms: ['parmesan', 'parmigiano'], category: 'en:parmigiano-reggiano' },
  { label: 'Feta', terms: ['feta'], category: 'en:feta' },

  // Cereals, starches and legumes
  { label: "Flocons d'avoine", terms: ['flocon avoine', "flocon d'avoine", 'avoine', 'porridge'], category: 'en:rolled-oats' },
  { label: 'Muesli', terms: ['muesli'], category: 'en:mueslis' },
  { label: 'Riz', terms: ['riz'], category: 'en:rices' },
  { label: 'Riz basmati', terms: ['riz basmati', 'basmati'], category: 'en:basmati-rices' },
  { label: 'Riz complet', terms: ['riz complet'], category: 'en:brown-rices' },
  { label: 'Pâtes', terms: ['pate', 'pates seches', 'penne', 'fusilli', 'coquillette', 'macaroni', 'tagliatelle'], category: 'en:dry-pastas' },
  { label: 'Spaghetti', terms: ['spaghetti', 'spaghettis'], category: 'en:spaghetti' },
  { label: 'Quinoa', terms: ['quinoa'], category: 'en:quinoa' },
  { label: 'Boulgour', terms: ['boulgour', 'boulghour', 'bulgur'], category: 'en:bulgur' },
  { label: 'Semoule', terms: ['semoule', 'couscous', 'graine de couscous'], category: 'en:wheat-semolinas' },
  { label: 'Sarrasin', terms: ['sarrasin', 'ble noir'], category: 'en:buckwheat' },
  { label: 'Farine', terms: ['farine', 'farine de ble'], category: 'en:wheat-flours' },
  { label: 'Pain de mie', terms: ['pain de mie'], category: 'en:sliced-breads' },
  { label: 'Pain complet', terms: ['pain complet'], category: 'en:wholemeal-breads' },
  { label: 'Lentilles', terms: ['lentille', 'lentilles corail'], category: 'en:lentils' },
  { label: 'Lentilles vertes', terms: ['lentille verte'], category: 'en:green-lentils' },
  { label: 'Pois chiches', terms: ['pois chiche'], category: 'en:chickpeas' },
  { label: 'Haricots rouges', terms: ['haricot rouge'], category: 'en:red-beans' },
  { label: 'Haricots blancs', terms: ['haricot blanc', 'lingot'], category: 'en:white-beans' },
  { label: 'Pois cassés', terms: ['pois casse'], category: 'en:dried-split-peas' },

  // Meat and fish
  { label: 'Thon en conserve', terms: ['thon', 'thon en boite', 'thon au naturel', 'boite de thon'], category: 'en:canned-tunas' },
  { label: 'Sardines en conserve', terms: ['sardine'], category: 'en:canned-sardines' },
  { label: 'Maquereaux', terms: ['maquereau'], category: 'en:mackerels' },
  { label: 'Saumon fumé', terms: ['saumon fume'], category: 'en:smoked-salmons' },
  { label: 'Filets de saumon', terms: ['saumon', 'pave de saumon', 'filet de saumon'], category: 'en:salmon-fillets' },
  { label: 'Filets de poisson surgelés', terms: ['poisson surgele', 'filet de poisson', 'cabillaud', 'colin'], category: 'en:frozen-fish-fillets' },
  { label: 'Jambon blanc', terms: ['jambon', 'jambon blanc', 'jambon cuit', 'jambon de paris'], category: 'en:white-hams' },
  { label: 'Filets de poulet', terms: ['poulet', 'blanc de poulet', 'filet de poulet', 'escalope de poulet'], category: 'en:chicken-breasts' },
  { label: 'Filets de dinde', terms: ['dinde', 'filet de dinde', 'escalope de dinde'], category: 'en:turkey-fillets' },
  { label: 'Steaks hachés', terms: ['steak hache', 'steak', 'boeuf hache', 'viande hachee'], category: 'en:ground-steaks' },

  // Canned and frozen vegetables
  { label: 'Tomates en conserve', terms: ['tomate concassee', 'tomate pelee', 'tomate en boite', 'tomates en conserve'], category: 'en:canned-tomatoes' },
  { label: 'Coulis de tomate', terms: ['coulis de tomate', 'passata', 'puree de tomate'], category: 'en:strained-tomatoes' },
  { label: 'Sauce tomate', terms: ['sauce tomate'], category: 'en:tomato-sauces' },
  { label: 'Maïs doux', terms: ['mais', 'mais doux'], category: 'en:canned-sweet-corn' },
  { label: 'Petits pois', terms: ['petit pois'], category: 'en:green-peas' },
  { label: 'Haricots verts en conserve', terms: ['haricot vert en conserve', 'haricot vert en boite'], category: 'en:canned-green-beans' },
  { label: 'Épinards surgelés', terms: ['epinard', 'epinard surgele'], category: 'en:frozen-spinachs' },
  { label: 'Légumes surgelés', terms: ['legume surgele', 'poelee de legumes'], category: 'en:frozen-vegetables' },

  // Fats, condiments and pantry
  { label: "Huile d'olive", terms: ['huile', "huile d'olive", 'huile olive'], category: 'en:extra-virgin-olive-oils' },
  { label: 'Huile de colza', terms: ['huile de colza', 'colza'], category: 'en:rapeseed-oils' },
  { label: 'Vinaigre', terms: ['vinaigre'], category: 'en:vinegars' },
  { label: 'Moutarde', terms: ['moutarde'], category: 'en:mustards' },
  { label: 'Sauce soja', terms: ['sauce soja', 'soja sauce'], category: 'en:soy-sauces' },
  { label: 'Bouillon', terms: ['bouillon', 'bouillon cube'], category: 'en:broths' },
  { label: 'Épices', terms: ['epice', 'curry', 'paprika', 'cumin'], category: 'en:spices' },
  { label: 'Herbes de Provence', terms: ['herbes de provence'], category: 'en:herbes-de-provence' },
  { label: 'Sel', terms: ['sel'], category: 'en:salts' },
  { label: 'Sucre', terms: ['sucre'], category: 'en:sugars' },
  { label: 'Miel', terms: ['miel'], category: 'en:honeys' },
  { label: 'Confiture', terms: ['confiture'], category: 'en:jams' },
  { label: 'Compote', terms: ['compote'], category: 'en:compotes' },
  { label: 'Chocolat noir', terms: ['chocolat', 'chocolat noir'], category: 'en:dark-chocolates' },
  { label: 'Cacao en poudre', terms: ['cacao', 'cacao en poudre'], category: 'en:cocoa-powders' },
  { label: 'Beurre de cacahuète', terms: ['beurre de cacahuete', 'beurre de cacahouete', 'peanut butter'], category: 'en:peanut-butters' },
  { label: "Purée d'amande", terms: ["puree d'amande", 'puree amande'], category: 'en:almond-butters' },
  { label: 'Houmous', terms: ['houmous', 'hummus'], category: 'en:hummus' },
  { label: 'Olives', terms: ['olive'], category: 'en:olives' },
  { label: 'Cornichons', terms: ['cornichon'], category: 'en:pickled-gherkins' },
  { label: 'Tofu', terms: ['tofu'], category: 'en:plain-tofu' },

  // Nuts, seeds and dried fruit
  { label: 'Amandes', terms: ['amande'], category: 'en:almonds' },
  { label: 'Noix', terms: ['noix', 'cerneaux de noix'], category: 'en:walnuts' },
  { label: 'Noisettes', terms: ['noisette'], category: 'en:hazelnuts' },
  { label: 'Fruits à coque', terms: ['fruits a coque', 'melange de noix', 'oleagineux'], category: 'en:mixed-nuts' },
  { label: 'Raisins secs', terms: ['raisin sec'], category: 'en:raisins' },
  { label: 'Graines de courge', terms: ['graine de courge'], category: 'en:pumpkin-seeds' },
  { label: 'Graines de chia', terms: ['chia', 'graine de chia'], category: 'en:chia' },

  // Drinks
  { label: "Jus d'orange", terms: ["jus d'orange", 'jus orange'], category: 'en:orange-juices' },
  { label: 'Jus de pomme', terms: ['jus de pomme'], category: 'en:apple-juices' },
  { label: "Boisson à l'avoine", terms: ["lait d'avoine", "boisson a l'avoine", 'boisson avoine'], category: 'en:oat-based-drinks' },
  { label: 'Boisson au soja', terms: ['lait de soja', 'boisson soja', 'boisson au soja'], category: 'en:soy-based-drinks' },
  { label: 'Café moulu', terms: ['cafe', 'cafe moulu'], category: 'en:ground-coffees' },
  { label: 'Thé vert', terms: ['the vert', 'the'], category: 'en:green-teas' },
  { label: 'Eau gazeuse', terms: ['eau gazeuse', 'eau petillante'], category: 'en:carbonated-waters' },

  // Fresh, loose products: no barcode, nothing to compare.
  ...[
    'Courgettes', 'Carottes', 'Tomates', 'Pommes de terre', 'Patates douces', 'Oignons', 'Ail', 'Échalotes',
    'Poivrons', 'Brocolis', 'Chou-fleur', 'Aubergines', 'Concombre', 'Salade', 'Champignons', 'Poireaux',
    'Haricots verts', 'Avocats', 'Citrons', 'Bananes', 'Pommes', 'Poires', 'Oranges', 'Kiwis', 'Fraises',
    'Persil', 'Basilic', 'Coriandre',
  ].map((label) => ({ label, terms: [label.toLowerCase()] })),
]
